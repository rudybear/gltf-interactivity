// parseModule round-trip fidelity: importGraph(GLB) -> emitModule -> TS ->
// parseModule -> IR', compared structurally against the original IR
// "modulo meta" (see below for exactly what that excludes). This is a
// tighter check than run-roundtrip.ts's end-to-end judge-protocol pass —
// it pins the PARSER's own faithfulness independent of whether a structural
// slip happens to still execute correctly.
//
// What's excluded from the comparison and why:
//   - IRModule.meta entirely: sourceNodeIds has no representation left in
//     emitted TypeScript at all (see @gltfi/ir/import.ts's doc comment on
//     that field), and nameMaps is derived from names, covered below.
//   - IRVariable/IREvent `.name`: emit.ts's rt.vars()/rt.events() arrays
//     carry no name field at all (see emit.ts's emitVars/emitEvents) — only
//     type/initial (variables) and id/values (events) survive. `.extras`
//     is dropped for the same reason (nothing to parse it back from).
//   - Everything else — types, initial/default values, control flow
//     structure, temp ids, proc/state-slot NAMES (these DO round-trip,
//     since they become real emitted identifiers the parser reads back
//     verbatim), op overloads/config, pointer templates — must match
//     exactly.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { importGraph, type Graph, type IRExpr, type IRModule, type IRStmt } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { parseModule } from "../src/index.js";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

function loadModule(relPath: string): IRModule {
  const runtime = createRuntimeFromGlbFile(path.join(ROOT, relPath));
  const { module, diagnostics } = importGraph(runtime.graph as unknown as Graph);
  expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return module;
}

// The core normalization: turns a statement into a FLAT LIST, splicing out
// while/for's `completed` and flow/cancelDelay's `outs.out` as trailing
// list items rather than keeping them nested. This is the inverse of
// @gltfi/ir/export.ts's chaining logic, chosen deliberately: emit.ts's
// emitStmt recurses through both `seq` AND those two fields with zero
// textual delimiter between "the field's own content" and "whatever
// follows in the enclosing seq" (see e.g. the "while" case: `if
// (stmt.completed) this.emitStmt(stmt.completed)`, then the caller's loop
// continues emitting the next sibling immediately after) — so an
// importGraph module's explicit 3-item `completed` followed by 5 more
// enclosing-seq siblings and a from-scratch parseModule reconstruction
// that instead sees 8 flat siblings with no `completed` at all are
// PROVABLY INDISTINGUISHABLE from the emitted text alone (verified during
// development: this is not a @gltfi/parse-ts bug, since no information
// exists in the text to recover the boundary — see
// docs/design/ir-and-transpiler.md's "Equivalence" section on structural
// vs execution equivalence; @gltfi/ir/export.ts's own choice to always
// chain is separately justified there as execution-safe). Splicing BOTH
// representations down to the same flat form is therefore the correct
// normalization, not a weakened one: it equates exactly the two shapes
// that produce identical emitted text.
function normalizeToList(stmt: IRStmt): IRStmt[] {
  switch (stmt.k) {
    case "seq":
      return stmt.stmts.flatMap(normalizeToList);
    case "if":
      return [{ ...stmt, then: seqOf(normalizeToList(stmt.then)), else: stmt.else ? seqOf(normalizeToList(stmt.else)) : undefined }];
    case "while": {
      const head: IRStmt = { k: "while", cond: stmt.cond, body: seqOf(normalizeToList(stmt.body)) };
      return [head, ...(stmt.completed ? normalizeToList(stmt.completed) : [])];
    }
    case "for": {
      const head: IRStmt = { k: "for", slot: stmt.slot, start: stmt.start, end: stmt.end, body: seqOf(normalizeToList(stmt.body)) };
      return [head, ...(stmt.completed ? normalizeToList(stmt.completed) : [])];
    }
    case "switch":
      return [
        {
          ...stmt,
          cases: stmt.cases.map(([c, body]) => [c, seqOf(normalizeToList(body))] as [number, IRStmt]),
          default: stmt.default ? seqOf(normalizeToList(stmt.default)) : undefined
        }
      ];
    case "setPointer":
      return [{ ...stmt, out: stmt.out ? seqOf(normalizeToList(stmt.out)) : undefined, err: stmt.err ? seqOf(normalizeToList(stmt.err)) : undefined }];
    case "async":
      return [
        {
          ...stmt,
          out: stmt.out ? seqOf(normalizeToList(stmt.out)) : undefined,
          err: stmt.err ? seqOf(normalizeToList(stmt.err)) : undefined,
          done: stmt.done ? (stmt.done.kind === "inline" ? { kind: "inline", body: seqOf(normalizeToList(stmt.done.body)) } : stmt.done) : undefined
        }
      ];
    case "stateful": {
      // multiGate's own numbered-output socket key TEXT is not preserved by
      // emit.ts by design (see emitStateful's multiGate case): it always
      // renumbers to sequential "0".."N-1" positions matching the
      // UTF-16-sorted original keys' RELATIVE ORDER, not their literal text
      // (e.g. original keys "001"/"004"/"008" — arbitrary graph-authored
      // socket ids — become plain "0"/"1"/"2"). Only the order survives, so
      // normalize both sides to sequential keys before comparing.
      const entries = Object.entries(stmt.outs).sort(([a], [b]) => a.localeCompare(b));
      const outs =
        stmt.kind === "multiGate"
          ? Object.fromEntries(entries.map(([, v], i) => [String(i), seqOf(normalizeToList(v))]))
          : Object.fromEntries(entries.map(([k, v]) => [k, seqOf(normalizeToList(v))]));
      return [{ ...stmt, outs }];
    }
    case "intrinsic": {
      if (stmt.op === "flow/cancelDelay") {
        const head: IRStmt = { ...stmt, outs: {} };
        return [head, ...(stmt.outs.out ? normalizeToList(stmt.outs.out) : [])];
      }
      return [{ ...stmt, outs: Object.fromEntries(Object.entries(stmt.outs).map(([k, v]) => [k, seqOf(normalizeToList(v))])) }];
    }
    case "log":
      // debug/log's arguments carry no type signal in emitted code at all
      // (`rt.log(template, [rawJsValues])` — see emit.ts's "log" case: bare
      // numbers/nested op calls with no annotation) and the op is an inert
      // no-op at runtime (see runtime-lib/engine.ts's `log()` and
      // interpreter.ts's debug/log case, both pure pass-throughs) — with no
      // `expected` type to propagate and (for a literal-only argument, e.g.
      // a math/switch over int literals) no non-literal sibling to pin a
      // type from either, an originally-int argument tree can round-trip
      // typed as float arbitrarily deep inside it (verified: not just bare
      // literals but e.g. `m.switchCase(...)`'s own int-vs-float case
      // values). This is a real, unrecoverable ambiguity in the emitted
      // subset with zero runtime consequence, not a parser bug — argument
      // COUNT is still compared (a real dropped/extra arg is still caught),
      // just not their exact value/type.
      return [{ ...stmt, args: stmt.args.map(() => PLACEHOLDER_LOG_ARG) }];
    default:
      return [stmt];
  }
}

function seqOf(items: IRStmt[]): IRStmt {
  return items.length === 1 ? items[0] : { k: "seq", stmts: items };
}

function normalizeStmt(stmt: IRStmt): IRStmt {
  return seqOf(normalizeToList(stmt));
}

const PLACEHOLDER_LOG_ARG: IRExpr = { k: "const", type: "ref", data: ["<log-arg>"] };

// Strips exactly the fields documented above as not round-tripping through
// emitted TypeScript, so the remainder can be compared with a plain
// `toEqual`.
function stripForComparison(module: IRModule): unknown {
  return {
    variables: module.variables.map((v) => ({ type: v.type, initial: v.initial })),
    events: module.events.map((e) => ({ id: e.id, values: e.values })),
    stateSlots: module.stateSlots,
    handlers: module.handlers.map((h) => ({ ...h, body: normalizeStmt(h.body) })),
    procs: module.procs.map((p) => ({ ...p, body: normalizeStmt(p.body) }))
  };
}

const CURATED: Array<[string, string]> = [
  ["flow/branch", "flow/branch/glTF-Binary/branch.glb"],
  ["flow/for", "flow/for/glTF-Binary/for.glb"],
  ["flow/while", "flow/while/glTF-Binary/while.glb"],
  ["flow/switch", "flow/switch/glTF-Binary/switch.glb"],
  ["flow/doN", "flow/doN/glTF-Binary/doN.glb"],
  ["flow/multiGate", "flow/multiGate/glTF-Binary/multiGate.glb"],
  ["flow/waitAll", "flow/waitAll/glTF-Binary/waitAll.glb"],
  ["flow/throttle", "flow/throttle/glTF-Binary/throttle.glb"],
  ["flow/setDelay_and_cancelDelay", "flow/setDelay_and_cancelDelay/glTF-Binary/setDelay_and_cancelDelay.glb"],
  ["variable/set_and_get", "variable/set_and_get/glTF-Binary/set_and_get.glb"],
  ["variable/interpolate", "variable/interpolate/glTF-Binary/interpolate.glb"],
  ["pointer/set_and_get", "pointer/set_and_get/glTF-Binary/set_and_get.glb"],
  ["pointer/interpolate", "pointer/interpolate/glTF-Binary/interpolate.glb"],
  ["animation/start", "animation/start/glTF-Binary/start.glb"],
  ["math/add", "math/add/glTF-Binary/add.glb"],
  ["math/random", "math/random/glTF-Binary/random.glb"],
  ["math/matDecompose", "math/matDecompose/glTF-Binary/matDecompose.glb"],
  ["math/switch", "math/switch/glTF-Binary/switch.glb"],
  ["math/quatFromAngles", "math/quatFromAngles/glTF-Binary/quatFromAngles.glb"],
  ["event/send_and_receive", "event/send_and_receive/glTF-Binary/send_and_receive.glb"],
  ["event/stopPropagation", "event/stopPropagation/glTF-Binary/stopPropagation.glb"]
];

describe("parseModule - round-trips emitted modules to deep-equal IR (modulo meta)", () => {
  for (const [name, relPath] of CURATED) {
    it(`round-trips "${name}"`, () => {
      const original = loadModule(relPath);
      const { code } = emitModule(original);
      const { module: parsed, diagnostics } = parseModule(code);
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
      expect(stripForComparison(parsed)).toEqual(stripForComparison(original));
    });
  }
});
