# IR and transpiler design (@gltfi/ir, @gltfi/emit-ts, @gltfi/parse-ts)

The IR is the pivot between KHR_interactivity graph JSON and every target language
(TypeScript now; Luau and typed Python later). Design principles: **structured**
(no goto/break/continue/mid-return), **explicit** (no reliance on closures, native
ints, or exceptions), **total** (every valid graph is representable — `Intrinsic`
is the escape hatch).

## Why structuring always works

Value edges are backward-only in practice (0 backward/self value-edge violations
across the 145-graph corpus), so the value DAG types in one forward pass.

**Corpus correction (2026-08-02):** the "flow edges must point to higher node
indices" premise is empirically FALSE — real Khronos test assets contain thousands
of backward flow edges, including plain non-looping chains. The importer therefore
uses a general cycle-safe algorithm: flow targets with ≥2 predecessors (counted on
primary input ports) become `IRProc`s, and on-stack cycle detection during inlining
turns repeated targets into `callProc` (procs are pre-registered before their bodies
build, so self-cycles resolve). `flow/waitAll` needs a special case: it has no
primary "in" port (all triggers lower at the sending site), so its out/completed
targets are forced multi-predecessor when waitAll has ≥2 incoming triggers.
The *synchronous* proc call graph must be acyclic; cycles through `async.done`
continuations are legal (a self-rescheduling delay). For EXPORT this changes
nothing: emitting forward-only flow edges is always safe.

**Cross-handler event-output reads (GI012):** a value edge may read an event
node's output sockets (e.g. `onTick.timeSinceStart`) from a *different* handler —
event-node outputs are graph-global registers, not lexically scoped params
(47 corpus occurrences). `param` covers same-handler reads; cross-handler reads
currently import as `intrinsic` with warning GI012. The compiled engine (M3) must
give event nodes module-level last-output registers to lower these properly.

## Model (packages/ir/src/model.ts)

```ts
type IRType = "bool"|"int"|"float"|"float2"|"float3"|"float4"|"float2x2"|"float3x3"|"float4x4"|"ref";

interface IRModule {
  variables: { name; type: IRType; initial: Const; extras? }[];   // order == graph variable index
  events:    { name; id?: string; values: { name; type; default }[] }[]; // order == graph event index
  stateSlots:{ name; kind: "doN"|"multiGate"|"waitAll"|"throttle"|"for"|"delay"; config }[];
  handlers:  IRHandler[];  // order == original event-node array order (dispatch order!)
  procs:     IRProc[];     // acyclic call DAG, callee after caller
  meta:      { nameMaps; sourceNodeIds?; extras? };
}

interface IRHandler {
  kind: "onStart"|"onTick"|"receive"|"onSelect"|"onHoverIn"|"onHoverOut";
  eventRef?: number; config?: Record<string, unknown>;
  params: { name; type: IRType }[];   // event payload sockets
  body: IRStmt;
}

type IRStmt =
  | { k:"seq"; stmts: IRStmt[] }
  | { k:"let"; temp: TempId; type: IRType; expr: IRExpr }        // materialization point
  | { k:"if"; cond: IRExpr; then: IRStmt; else?: IRStmt }
  | { k:"while"; cond: IRExpr; body: IRStmt; completed?: IRStmt }   // cond re-evaluated perCheck
  | { k:"for"; slot?: StateRef; start: IRExpr /*once*/; end: IRExpr /*perIteration*/;
      body: IRStmt; completed?: IRStmt }
  | { k:"switch"; selector: IRExpr; cases: [number, IRStmt][]; default?: IRStmt }
  | { k:"setVar"; varId: number; expr: IRExpr }
  | { k:"setPointer"; template: PtrTemplate; args: IRExpr[]; value: IRExpr;
      out?: IRStmt; err?: IRStmt }
  | { k:"emitEvent"; eventId: number; args: IRExpr[] }
  | { k:"stopPropagation"; config }
  | { k:"log"; template: string; args: IRExpr[] }
  | { k:"callProc"; procId: number }
  | { k:"async"; kind: "setDelay"|"varInterp"|"ptrInterp"|"animStart"|"animStop"|"animStopAt";
      slot?: StateRef; args: IRExpr[]; done?: Cont; out?: IRStmt; err?: IRStmt }
  | { k:"stateful"; kind: "doN"|"multiGate"|"waitAll"|"throttle"; slot: StateRef;
      port: "in"|"reset"|number; args: IRExpr[]; outs: Record<string, IRStmt> }
  | { k:"intrinsic"; op: string; config; args: IRExpr[]; outs: Record<string, IRStmt> };

type Cont = { kind:"inline"; body: IRStmt } | { kind:"proc"; procId: number };

type IRExpr =
  | { k:"const"; type: IRType; data }
  | { k:"varGet"; varId: number }
  | { k:"ptrGet"; template: PtrTemplate; args: IRExpr[]; type: IRType; wantIsValid?: boolean }
  | { k:"param"; name: string }               // event payload read (handler-local)
  | { k:"op"; op: string; overload: ResolvedOverload; args: IRExpr[] }  // pure ops incl. math/random
  | { k:"temp"; id: TempId }
  | { k:"stateRead"; slot: StateRef; field: string };  // for.index, setDelay.lastDelay, waitAll.remainingInputs…
```

Invariant checker (packages/ir/src/check.ts): every expr type-checks via
`resolveOverload` from @gltfi/kernel registry; no implicit conversions; proc call
graph acyclic; a `Cont` body references no temps defined outside itself; state
slots used consistently with their kind; handler/variable/event orders preserved.

## Graph → IR (packages/ir/src/import.ts)

1. **Resolve** — single forward pass over nodes (value edges point backward, so
   types resolve immediately): declaration table, per-node resolved overload
   (via kernel `resolveOverload`), value-consumer map, flow-predecessor counts.
2. **Structure** — proc-extract multi-predecessor flow targets; raise per op
   (branch→if, while→while, for→for, sequence→seq with **UTF-16-sorted** socket
   ids, switch→switch, async ops→async, stateful ops→stateful, else intrinsic).
   Edges arriving at a stateful node's `reset`/numbered socket lower to a
   `stateful` stmt with that `port` at the *sending* site.
3. **Materialize (caching-correct inlining)** — the spec caches output values
   until any flow-socketed node executes; observable only via `math/random`.
   A "site" = one flow statement's evaluated inputs (an if-condition check, one
   while-cond check, a setVar RHS, one async arg set…). Rules:
   - each site recomputes its value sub-DAG fresh (flow execution invalidates cache);
   - within a site, a graph value node with fan-out ≥2 (or containing math/random
     with fan-out ≥2) becomes a `let` temp placed before the statement; fan-out-1
     pure nodes inline;
   - **never share temps across sites**, even for identical pure expressions;
   - loop conditions re-emit their trees per check (fresh random draw per check).
4. **Names** — deterministic: extras name → op-derived → indexed fallback,
   collision-suffixed; stored in meta.nameMaps.

## IR → TypeScript (packages/emit-ts)

Generated module shape (factory — conformance protocol needs a fresh engine per test):

```ts
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ counter: rt.int(0), hasPassed: rt.bool(false) });   // decl order == index
  const E = rt.events({ testStart: { expectedDuration: rt.float(0) } });
  const delay3 = rt.delayState();
  const gate9 = rt.multiGateState();
  rt.onStart(() => { ... });
  rt.onReceive(E.testStart, (p) => { ... });
  rt.onSelect(4, { stopPropagation: false }, (p) => { ... });
});
```

- Handlers registered in original node-index order (dispatch + stopPropagation).
- Ints: branded `Int` type + `m.*_i` kernel calls (brand makes native `+` on ints
  a type error). Floats: native operators (JS number IS spec float — IEEE double).
- Pointer access in the parseable form `rt.ptrGet("/nodes/[n]/translation", { n: expr })`.
- Async: `rt.setDelay(delay3, dur, () => { /* done */ })` returns ok:boolean →
  `if (ok) { out } else { err }`; same shape for interpolate/animation ops.
- `--js` flavor: identical emission minus type annotations (for in-browser Blob import).
- Sidecar `out.names.json`: node/var/event ↔ name maps.

## GIscript subset (packages/parse-ts) — what code→graph accepts

- Exactly one `export default createEngine((rt) => { ... })`; inside, in order:
  optional `rt.vars({...})`, optional `rt.events({...})`, then zero or more
  `const <name> = rt.<kind>State();` state-slot declarations (one `const` per
  slot — never a grouped object literal), then only handler registrations and
  `function procN() {}` decls.
- Statements: `const x = <pure expr>`, `V.x.set(e)`, `rt.ptrSet(...)`,
  `rt.send(E.x, {...})`, `rt.log(...)`, `rt.stopPropagation()`, `if/else`, `while`,
  `for (let i = e0; i < e1; i++)`, `switch` on int with literal cases + `break`,
  runtime-lib async/stateful calls in emitted shapes, `procN()` calls.
- Forbidden (diagnostic GI###, with span + spec rationale): other imports, classes,
  throw/try, closures capturing caller temps inside continuations (GI105 — a graph
  continuation cannot see caller temporaries), recursion among procs (GI106),
  break/continue outside switch, return with value, any call not in the whitelist.
- The TS type checker runs first (any diagnostic = fail); branded types catch most
  violations before the subset validator.

## IR → graph (packages/ir/src/export.ts)

- **CSE**: hash-cons expr trees. Merge two occurrences into one graph node iff
  (a) same site, or (b) expr is *pure-closed* (no varGet/ptrGet/stateRead/param/
  math-random transitively) — those are cache-stable forever. math/random never
  merges across sites. When unsure, don't merge (duplicate nodes are always safe).
- **Index assignment**: both constraints ("value producer < consumer",
  "flow source < target") orient the same way → build the union constraint graph
  and topo-sort: pure-closed shared nodes first, then handlers in registration
  order (pre-order flow walk; each site's value nodes immediately before their
  flow node), procs after all callers. A cycle = code reads a later flow node's
  state → diagnostic GI210.
- Declarations deduped (spec forbids duplicates); types array deduped by signature;
  sequence/multiGate socket ids zero-padded; config serialized verbatim.
- Output validated by @gltfi/verify, then written standalone or `--merge-into`.

## Equivalence (packages/verify)

Normalizer: canonical declaration order, zero-padded socket ids, collapse
sequence-vs-chained-out equivalence, renumber nodes by canonical topo order with
stable structural keys. Equivalence checker: match handlers by (op, config),
parallel flow-tree walk + value-DAG hash compare; report first divergence path.
Structural mismatch is a triage signal — execution equivalence (V3) is the gate.
