// IR -> TypeScript emitter. See docs/design/ir-and-transpiler.md's "IR ->
// TypeScript" section for the generated module shape this follows:
//
//   import { createEngine, m } from "@gltfi/runtime-lib";
//   export default createEngine((rt) => {
//     const V = rt.vars({ counter: rt.int(0), ... });  // declaration order
//                                                       // == variable index
//                                                       // (object property
//                                                       // order IS insertion
//                                                       // order — the load-
//                                                       // bearing contract)
//     const E = rt.events({ ... });                    // same contract,
//                                                       // event index
//     const doN1 = rt.doNState();                       // state slots
//     function proc5() { ... }                          // procs, defined
//                                                        // before handlers
//     rt.onStart(() => { ... });
//   });
//
// Value representation in generated code is raw JS (see design decision 1):
// float=number, int=number (int32 semantics), bool=boolean, vectors/matrices
// =number[] tuples, ref=string. Where a math/type op is PROVABLY spec-
// identical to a native JS operator (scalar float/int/bool add/sub/mul/div/
// neg/eq/lt/le/gt/ge/and/or/not/xor — see nativeOpInfo below), this emitter
// uses the native operator directly; everything else (vector/matrix math,
// and every other op family) still goes through `m.*` calls.
//
// Readability pass (see the task report for the full before/after): named
// vars/events (via IR's own meta.nameMaps — sanitized graph ids, deduped,
// falling back to var<N>/event<N>), short sequential state-slot/temp/result
// names instead of graph-node-id-derived ones, native operators in place of
// `m.*` soup where safe, inlined constant pointer-template args, dropped
// redundant `{ }` wrappers and no-arg `rt.log(msg, [])` arrays, and a small
// within-one-call-site CSE pass for structurally identical sibling
// arguments (distinct graph nodes that happen to compute the same thing —
// see emitList/dedupeSiblings).
//
// Scope for the M3 conformance corpus (math/, type/, ref/, and everything
// else in test-index.json/mathtests-index.json — 145/145 via `pnpm
// conf:compiled`): onStart/onTick/receive handlers, every stateful/async op,
// and the full math/type/ref op set. UserInteractions (event/onSelect,
// event/onHoverIn, event/onHoverOut) is the one op family the official
// corpus never exercises (it isn't in either index file at all — those
// tests require live user input, not an automated oracle), but the viewer
// (apps/viewer) needs it for click-select/hover parity with the interpreter,
// so those three handler kinds are implemented too — see engine.ts's
// onSelect/onHoverIn/onHoverOut + fireSelect/fireHoverIn/fireHoverOut and
// this file's emitHandler/paramAccess "onSelect"/"onHoverIn"/"onHoverOut"
// branches, plus packages/runtime-lib/test/engine.test.ts and
// packages/runtime/test/host.test.ts for the DOM-less bubbling/
// stopPropagation parity coverage between the two engines.
import {
  computeStateSlotDisplayNames,
  computeVariableDisplayNames,
  formatPointerTemplate,
  pointerTemplateParams,
  type IRExpr,
  type IRHandler,
  type IRModule,
  type IRStmt,
  type IRType,
  type PtrSegment,
  type PtrTemplate
} from "@gltfi/ir";
import type { ResolvedOverload, TypeSig } from "@gltfi/kernel";

export class EmitError extends Error {
  readonly op?: string;
  readonly nodeId?: number;

  constructor(message: string, op?: string, nodeId?: number) {
    super(nodeId !== undefined ? `${message} (op "${op}", node ${nodeId})` : op !== undefined ? `${message} (op "${op}")` : message);
    this.op = op;
    this.nodeId = nodeId;
  }
}

export type EmitFlavor = "ts" | "js";

export type EmitOptions = {
  // "js" drops the handful of explicit type annotations emitStateSlots emits
  // on doN/multiGate/waitAll/throttle/delay state-slot object literals (see
  // that method's own doc comment for why "ts" needs them) — those are the
  // only non-erasable-by-syntax TS constructs this emitter ever produces
  // (every value expression elsewhere is plain inferred JS — see the header
  // note), so stripping just that one spot's colon-type text is enough to
  // make "js" output valid, directly-executable ECMAScript with no
  // transpile step, for the viewer's in-browser Blob-URL module import path
  // (apps/viewer's compiled-engine loader — see docs/design and
  // apps/viewer/src/compiled-engine.ts). "ts" keeps the annotations, which
  // @gltfi/parse-ts's own type checker requires (see that annotation's doc
  // comment) and which run-compiled.ts's esbuild bundle (loader: "ts")
  // strips anyway.
  flavor?: EmitFlavor;
};

export type EmitNames = {
  variables: string[];
  events: string[];
  stateSlots: string[];
  procs: string[];
};

export type EmitResult = {
  code: string;
  names: EmitNames;
};

// ---------------------------------------------------------------------------
// m.* function-name selection: base name derived from the op string, with
// "Int"/"Bool" suffixes chosen from the resolved overload's input type
// (mirrors @gltfi/runtime-lib/math.ts's exported surface exactly). Only
// reached for ops nativeOpInfo (below) doesn't cover natively.
// ---------------------------------------------------------------------------

const ARITH_INT_OPS = new Set(["abs", "sign", "neg", "add", "sub", "mul", "div", "rem", "min", "max", "clamp"]);
const BOOL_INT_OPS = new Set(["and", "or", "not", "xor"]);

function baseMName(op: string): string {
  if (op === "ref/eq") {
    return "refEq";
  }
  const short = op.split("/")[1];
  if (!short) {
    throw new EmitError(`malformed op string`, op);
  }
  return short;
}

function primaryInputSig(overload: ResolvedOverload): TypeSig {
  return overload.inputs.a ?? Object.values(overload.inputs)[0] ?? "float";
}

function mFunctionName(op: string, overload: ResolvedOverload): string {
  const base = baseMName(op);
  if (op === "math/eq") {
    const t = primaryInputSig(overload);
    return t === "bool" ? "eqBool" : t === "int" ? "eqInt" : "eq";
  }
  if ((ARITH_INT_OPS.has(base) || BOOL_INT_OPS.has(base)) && primaryInputSig(overload) === "int") {
    return `${base}Int`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Native-operator substitution: ops provably identical to a plain JS
// operator over scalar values (see runtime-lib/math.ts's add/sub/mul/div/
// neg/eqInt/eqBool/lt/le/gt/ge/and/or/not/xor — every one of these is
// *defined* as exactly the corresponding JS operator on plain numbers/
// booleans). Vector/matrix rows of the same ops (F resolving to float2.. or
// a matrix type) are NOT covered — JS has no operator overloading, so those
// stay `m.*` calls over arrays. int div/rem and int/bitwise and/or/not/xor
// also stay `m.*` (their semantics — truncating division/remainder,
// genuine bitwise ops — do not match a native JS operator over ints).
//
// `prec` is this operator's own binding precedence (used to decide whether
// ITS OWN operands need parens); `wrap` says how the raw `a <op> b` (or
// `<op>a`) text needs to be finished:
//   - "none": used as-is.
//   - "i32": wrap as `(<body>) | 0` — int add/sub/neg (spec ints are two's-
//     complement int32; `| 0` truncates/wraps exactly like runtime-lib's
//     `i32()` helper). The RESULT's effective precedence (see resultPrecOf)
//     is then the (very low) bitwise-or level, not `prec` — see
//     exprPrec/resultPrecOf's doc comment for why that distinction matters.
//   - "imulCall": int mul renders as `Math.imul(a, b)` instead of an infix
//     operator at all — `(a * b) | 0` loses precision for products outside
//     the float64-safe-integer range (int32 * int32 can reach ~2^62), which
//     `Math.imul` doesn't (see the task report's discussion of this call).
type NativeOp = { kind: "binary"; jsOp: string; prec: number; wrap: "none" | "i32" | "imulCall" } | { kind: "unary"; jsOp: string; prec: number; wrap: "none" | "i32" };

const PREC_OR = 3;
const PREC_AND = 4;
const PREC_BOR = 6; // effective precedence of a `(...) | 0`-wrapped int result
const PREC_EQ = 8;
const PREC_REL = 9;
const PREC_ADD = 11;
const PREC_MUL = 12;
const PREC_UNARY = 14;
const ATOM_PREC = 100;

const COMPARISON_FAMILY_OPS = new Set(["math/eq", "math/lt", "math/le", "math/gt", "math/ge", "math/xor"]);

function nativeOpInfo(op: string, overload: ResolvedOverload): NativeOp | null {
  const t = primaryInputSig(overload);
  switch (op) {
    case "math/add":
      if (t === "float") return { kind: "binary", jsOp: "+", prec: PREC_ADD, wrap: "none" };
      if (t === "int") return { kind: "binary", jsOp: "+", prec: PREC_ADD, wrap: "i32" };
      return null;
    case "math/sub":
      if (t === "float") return { kind: "binary", jsOp: "-", prec: PREC_ADD, wrap: "none" };
      if (t === "int") return { kind: "binary", jsOp: "-", prec: PREC_ADD, wrap: "i32" };
      return null;
    case "math/mul":
      if (t === "float") return { kind: "binary", jsOp: "*", prec: PREC_MUL, wrap: "none" };
      if (t === "int") return { kind: "binary", jsOp: "Math.imul", prec: ATOM_PREC, wrap: "imulCall" };
      return null;
    case "math/div":
      return t === "float" ? { kind: "binary", jsOp: "/", prec: PREC_MUL, wrap: "none" } : null;
    case "math/neg":
      if (t === "float") return { kind: "unary", jsOp: "-", prec: PREC_UNARY, wrap: "none" };
      if (t === "int") return { kind: "unary", jsOp: "-", prec: PREC_UNARY, wrap: "i32" };
      return null;
    case "math/eq":
      return t === "float" || t === "int" || t === "bool" ? { kind: "binary", jsOp: "===", prec: PREC_EQ, wrap: "none" } : null;
    case "math/lt":
      return t === "float" || t === "int" ? { kind: "binary", jsOp: "<", prec: PREC_REL, wrap: "none" } : null;
    case "math/le":
      return t === "float" || t === "int" ? { kind: "binary", jsOp: "<=", prec: PREC_REL, wrap: "none" } : null;
    case "math/gt":
      return t === "float" || t === "int" ? { kind: "binary", jsOp: ">", prec: PREC_REL, wrap: "none" } : null;
    case "math/ge":
      return t === "float" || t === "int" ? { kind: "binary", jsOp: ">=", prec: PREC_REL, wrap: "none" } : null;
    case "math/and":
      return t === "bool" ? { kind: "binary", jsOp: "&&", prec: PREC_AND, wrap: "none" } : null;
    case "math/or":
      return t === "bool" ? { kind: "binary", jsOp: "||", prec: PREC_OR, wrap: "none" } : null;
    case "math/not":
      return t === "bool" ? { kind: "unary", jsOp: "!", prec: PREC_UNARY, wrap: "none" } : null;
    case "math/xor":
      return t === "bool" ? { kind: "binary", jsOp: "!==", prec: PREC_EQ, wrap: "none" } : null;
    default:
      return null;
  }
}

function resultPrecOf(native: NativeOp): number {
  if (native.wrap === "imulCall") return ATOM_PREC;
  if (native.wrap === "i32") return PREC_BOR;
  return native.prec;
}

// The effective precedence of `expr`'s OWN rendered code, as seen by a
// parent expression deciding whether to parenthesize it — ATOM_PREC (never
// needs parens) for everything except a natively-substituted op (see
// nativeOpInfo above).
function exprPrec(expr: IRExpr): number {
  if (expr.k === "op" && expr.socket === undefined) {
    const native = nativeOpInfo(expr.op, expr.overload);
    if (native) {
      return resultPrecOf(native);
    }
  }
  return ATOM_PREC;
}

// ---------------------------------------------------------------------------
// Literal formatting.
// ---------------------------------------------------------------------------

function floatLiteral(x: number): string {
  if (Number.isNaN(x)) {
    return "NaN";
  }
  if (x === Infinity) {
    return "Infinity";
  }
  if (x === -Infinity) {
    return "-Infinity";
  }
  return String(x);
}

function constLiteral(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return data[0] ? "true" : "false";
  }
  if (type === "ref") {
    return JSON.stringify(String(data[0] ?? ""));
  }
  if (type === "int") {
    return String(Math.trunc(Number(data[0] ?? 0)));
  }
  if (type === "float") {
    return floatLiteral(Number(data[0] ?? 0));
  }
  // vector/matrix
  return `[${(data as number[]).map((x) => floatLiteral(Number(x))).join(", ")}]`;
}

// `rt.<type>(...)` variable-declaration-shorthand call matching runtime-
// lib's own int/bool/float/float2../ref helpers exactly (see engine.ts) —
// IRType's own names already coincide with those helper names one-for-one.
function varDeclCall(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return `rt.bool(${data[0] ? "true" : "false"})`;
  }
  if (type === "ref") {
    return `rt.ref(${JSON.stringify(String(data[0] ?? ""))})`;
  }
  if (type === "int") {
    return `rt.int(${String(Math.trunc(Number(data[0] ?? 0)))})`;
  }
  if (type === "float") {
    return `rt.float(${floatLiteral(Number(data[0] ?? 0))})`;
  }
  const nums = (data as number[]).map((x) => floatLiteral(Number(x)));
  return `rt.${type}(${nums.join(", ")})`;
}

// ---------------------------------------------------------------------------
// Emitter. State-slot/variable display-name computation
// (computeStateSlotDisplayNames/computeVariableDisplayNames, plus their
// isUuidLikeId/detectCounterVarIds helpers) lives in @gltfi/ir/display-
// names.ts, shared verbatim with @gltfi/emit-lua and @gltfi/emit-py — see
// that file's own doc comment.
// ---------------------------------------------------------------------------

type HandlerEventCtx =
  | { kind: "onStart" }
  | { kind: "onTick" }
  | { kind: "receive"; eventRef: number }
  | { kind: "onSelect" }
  | { kind: "onHoverIn" }
  | { kind: "onHoverOut" };

class Emitter {
  private readonly module: IRModule;
  private readonly flavor: EmitFlavor;
  private readonly lines: string[] = [];
  private indent = 0;
  // Current handler's event context, for `param` lowering (see emitExpr's
  // "param" case) and for the current origin node id used in EmitError
  // messages.
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  // Cross-handler GI012 reads found anywhere in the module, keyed by
  // "<sourceNode>:<socket>" — every handler whose own source node matches
  // one of these must write rt.eventOut(sourceNode, socket, value) so the
  // read has something to observe. Not exercised by this milestone's
  // corpus (math/type/ref never read cross-handler) but implemented since
  // @gltfi/ir already carries the data (see import.ts's GI012 branch).
  private readonly crossHandlerReads = new Set<string>();
  // `module.stateSlots[i]` -> its short display identifier (see
  // computeStateSlotDisplayNames above) — computed once, used everywhere
  // this emitter used to print `slot.name` directly.
  private readonly stateSlotDisplayNames: string[];
  // `module.variables[i]` -> its display identifier: the IR's own name,
  // unless it's UUID-like, in which case a short synthetic `counter<N>`/
  // `var<N>` (see computeVariableDisplayNames above).
  private readonly variableDisplayNames: string[];
  // Per-handler/proc-body-scoped naming state, reset by resetBodyCounters()
  // at the top of every handler/proc body (see emitProcs/emitHandler):
  // small sequential `t<n>` temp names (renaming @gltfi/ir's own graph-
  // node-id-derived `let` temp ids), `cont<n>` names for lifted inline
  // async-done continuation functions, and `ok<n>` names for the one
  // remaining stateful op whose result is read more than once (flow/
  // throttle's `.invalid`/`.fire` — see emitStateful). Every other
  // previously-named intermediate (doN/ptrSet/multiGate/waitAll/async
  // results, all read exactly once) is inlined directly with no temp at all
  // — see this file's header note and the task report.
  private nextTempNum = 0;
  private nextContNum = 0;
  private nextOkNum = 0;
  private tempRenames = new Map<string, string>();

  private resetBodyCounters() {
    this.nextTempNum = 0;
    this.nextContNum = 0;
    this.nextOkNum = 0;
    this.tempRenames = new Map();
  }

  private allocTemp(): string {
    this.nextTempNum += 1;
    return `t${this.nextTempNum}`;
  }

  private allocCont(): string {
    this.nextContNum += 1;
    return `cont${this.nextContNum}`;
  }

  private allocOk(): string {
    this.nextOkNum += 1;
    return `ok${this.nextOkNum}`;
  }

  constructor(module: IRModule, flavor: EmitFlavor) {
    this.module = module;
    this.flavor = flavor;
    this.stateSlotDisplayNames = computeStateSlotDisplayNames(module.stateSlots);
    this.variableDisplayNames = computeVariableDisplayNames(module);
    this.collectCrossHandlerReads(module);
  }

  private collectCrossHandlerReads(module: IRModule) {
    const visitExpr = (expr: IRExpr) => {
      if (expr.k === "intrinsic" && expr.config?.crossContext === true) {
        this.crossHandlerReads.add(`${expr.config.sourceNode}:${expr.config.socket}`);
      }
      for (const key of ["args"] as const) {
        const list = (expr as { args?: IRExpr[] })[key];
        if (list) {
          list.forEach(visitExpr);
        }
      }
    };
    const visitStmt = (stmt: IRStmt) => {
      switch (stmt.k) {
        case "seq":
          stmt.stmts.forEach(visitStmt);
          return;
        case "let":
          visitExpr(stmt.expr);
          return;
        case "if":
          visitExpr(stmt.cond);
          visitStmt(stmt.then);
          if (stmt.else) visitStmt(stmt.else);
          return;
        case "while":
          visitExpr(stmt.cond);
          visitStmt(stmt.body);
          if (stmt.completed) visitStmt(stmt.completed);
          return;
        case "for":
          visitExpr(stmt.start);
          visitExpr(stmt.end);
          visitStmt(stmt.body);
          if (stmt.completed) visitStmt(stmt.completed);
          return;
        case "switch":
          visitExpr(stmt.selector);
          stmt.cases.forEach(([, body]) => visitStmt(body));
          if (stmt.default) visitStmt(stmt.default);
          return;
        case "setVar":
          visitExpr(stmt.expr);
          return;
        case "setPointer":
          stmt.args.forEach(visitExpr);
          visitExpr(stmt.value);
          if (stmt.out) visitStmt(stmt.out);
          if (stmt.err) visitStmt(stmt.err);
          return;
        case "emitEvent":
          stmt.args.forEach(visitExpr);
          return;
        case "stopPropagation":
          visitExpr(stmt.stopImmediate);
          return;
        case "log":
          stmt.args.forEach(visitExpr);
          return;
        case "callProc":
          return;
        case "async":
          stmt.args.forEach(visitExpr);
          if (stmt.out) visitStmt(stmt.out);
          if (stmt.err) visitStmt(stmt.err);
          if (stmt.done?.kind === "inline") visitStmt(stmt.done.body);
          return;
        case "stateful":
          stmt.args.forEach(visitExpr);
          Object.values(stmt.outs).forEach(visitStmt);
          return;
        case "intrinsic":
          stmt.args.forEach(visitExpr);
          Object.values(stmt.outs).forEach(visitStmt);
          return;
      }
    };
    for (const h of module.handlers) visitStmt(h.body);
    for (const p of module.procs) visitStmt(p.body);
  }

  run(): EmitResult {
    this.push('import { createEngine, m } from "@gltfi/runtime-lib";');
    this.push("");
    this.push("export default createEngine((rt) => {");
    this.indent += 1;
    this.emitVars();
    this.emitEvents();
    this.emitStateSlots();
    this.emitProcs();
    this.emitHandlers();
    this.indent -= 1;
    this.push("});");
    this.push("");
    return {
      code: `${this.lines.join("\n")}\n`,
      names: {
        variables: this.variableDisplayNames,
        events: this.module.meta.nameMaps.events,
        stateSlots: this.stateSlotDisplayNames,
        procs: this.module.meta.nameMaps.procs
      }
    };
  }

  private push(text: string) {
    this.lines.push(text.length === 0 ? "" : `${"  ".repeat(this.indent)}${text}`);
  }

  private varName(varId: number): string {
    return this.variableDisplayNames[varId] ?? `var${varId}`;
  }

  private eventName(eventId: number): string {
    return this.module.events[eventId]?.name ?? `event${eventId}`;
  }

  private emitVars() {
    const entries = this.module.variables.map((v, i) => `${this.variableDisplayNames[i]}: ${varDeclCall(v.type, v.initial.data)}`);
    this.push(`const V = rt.vars({ ${entries.join(", ")} });`);
  }

  private emitEvents() {
    const entries = this.module.events.map((e) => {
      const fields: string[] = [];
      if (e.id) {
        fields.push(`externalId: ${JSON.stringify(e.id)}`);
      }
      // All four standard payload fields' declared defaults — not just
      // expectedDuration — so rt.eventPayload() (see engine.ts) can answer
      // "what would this event's payload be if it were never sent" for
      // cross-handler event/receive payload reads (GI012; see
      // emitIntrinsicExpr's "event/receive#payload" case) exactly like
      // interpreter.ts's getEventPayload does from the graph's own event
      // declarations.
      const boolDefault = e.values.find((v) => v.name === "boolParameter");
      const intDefault = e.values.find((v) => v.name === "intParameter");
      const floatDefault = e.values.find((v) => v.name === "floatParameter");
      const duration = e.values.find((v) => v.name === "expectedDuration");
      if (boolDefault) {
        fields.push(`defaultBool: ${Boolean(boolDefault.default.data[0]) ? "true" : "false"}`);
      }
      if (intDefault) {
        fields.push(`defaultInt: ${Math.trunc(Number(intDefault.default.data[0] ?? 0))}`);
      }
      if (floatDefault) {
        fields.push(`defaultFloat: ${floatLiteral(Number(floatDefault.default.data[0] ?? 0))}`);
      }
      if (duration) {
        fields.push(`expectedDuration: ${floatLiteral(Number(duration.default.data[0] ?? 0))}`);
      }
      return `${e.name}: { ${fields.join(", ")} }`;
    });
    this.push(`const E = rt.events({ ${entries.join(", ")} });`);
  }

  // The event's own declared (bool,int,float,duration) defaults — same
  // extraction as emitEvents' own field-by-field lookup above, reused by
  // emitEvent's "does this send's payload match the declared defaults"
  // check (see that method's doc comment) and by rt.send/rt.eventPayload's
  // own runtime fallback (see engine.ts).
  private eventDefaultQuad(eventId: number): [boolean, number, number, number] {
    const e = this.module.events[eventId];
    const boolDefault = e?.values.find((v) => v.name === "boolParameter");
    const intDefault = e?.values.find((v) => v.name === "intParameter");
    const floatDefault = e?.values.find((v) => v.name === "floatParameter");
    const duration = e?.values.find((v) => v.name === "expectedDuration");
    return [
      Boolean(boolDefault?.default.data[0] ?? false),
      Math.trunc(Number(intDefault?.default.data[0] ?? 0)),
      Number(floatDefault?.default.data[0] ?? 0),
      Number(duration?.default.data[0] ?? 0)
    ];
  }

  // True when every one of `args` (the 4 fixed event/send payload exprs,
  // in bool/int/float/duration order) is a compile-time constant equal to
  // this event's own declared default — the case emitEvent's "emitEvent"
  // case omits the payload array entirely for (rt.send falls back to the
  // exact same defaults internally — see engine.ts's send).
  private matchesEventDefaults(eventId: number, args: IRExpr[]): boolean {
    const defaults = this.eventDefaultQuad(eventId);
    return args.every((a, i) => {
      if (a.k !== "const") {
        return false;
      }
      const value = a.type === "bool" ? Boolean(a.data[0]) : Number(a.data[0]);
      return value === defaults[i];
    });
  }

  // State slots are real persisted cross-invocation registers — module-level
  // `let`/`const` bindings assigned (never re-declared) by whichever
  // statement drives that slot's state machine, exactly mirroring
  // interpreter.ts's per-node NodeState fields (see engine.ts's DelaySlot/
  // DoNSlot/MultiGateSlot/WaitAllSlot/ThrottleSlot doc comments for the
  // field-by-field correspondence). stateRead just references the slot (or
  // one of its fields) unconditionally — no lexical scoping needed, since a
  // graph value edge can read a state slot's output from anywhere (same
  // reasoning as "for"'s own note below).
  //
  // "for" specifically stays a bare number register (interpreter.ts's
  // `nodeStates.get(nodeId).forIndex`): before the loop has ever run it
  // reads config.initialIndex, and after it reads whatever the last run
  // left it at, until the loop runs again.
  private emitStateSlots() {
    this.module.stateSlots.forEach((slot, i) => {
      const name = this.stateSlotDisplayNames[i];
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`let ${name} = ${floatLiteral(Math.trunc(initial))};`);
          return;
        }
        case "delay":
          this.push(`const ${name} = rt.delayState();`);
          return;
        case "doN":
          this.push(`const ${name} = rt.doNState();`);
          return;
        case "multiGate":
          this.push(`const ${name} = rt.multiGateState();`);
          return;
        case "waitAll":
          this.push(`const ${name} = rt.waitAllState();`);
          return;
        case "throttle":
          this.push(`const ${name} = rt.throttleState();`);
          return;
      }
    });
  }

  private emitProcs() {
    this.module.procs.forEach((proc) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`proc:${proc.id}`];
      this.handlerEventCtx = null;
      this.resetBodyCounters();
      this.push(`function ${proc.name}() {`);
      this.indent += 1;
      this.emitStmt(proc.body);
      this.indent -= 1;
      this.push("}");
    });
  }

  private emitHandlers() {
    this.module.handlers.forEach((handler, index) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`handler:${index}`];
      this.emitHandler(handler, index);
    });
  }

  private emitHandler(handler: IRHandler, index: number) {
    switch (handler.kind) {
      case "onStart": {
        this.handlerEventCtx = { kind: "onStart" };
        this.resetBodyCounters();
        this.push("rt.onStart(() => {");
        this.indent += 1;
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      case "onTick": {
        this.handlerEventCtx = { kind: "onTick" };
        this.resetBodyCounters();
        this.push("rt.onTick((timeSinceStart, timeSinceLastTick) => {");
        this.indent += 1;
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      case "receive": {
        if (handler.eventRef === undefined) {
          throw new EmitError("event/receive handler missing eventRef", "event/receive", this.originNodeId);
        }
        this.handlerEventCtx = { kind: "receive", eventRef: handler.eventRef };
        this.resetBodyCounters();
        this.push(`rt.onReceive(${this.eventArgCode(handler.eventRef)}, (payload) => {`);
        this.indent += 1;
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      // KHR_node_selectability/hoverability handlers — not covered by the
      // official corpus (UserInteractions isn't in test-index.json/
      // mathtests-index.json, so the M3 conformance gate never exercised
      // this), but needed for the viewer's compiled-engine path to support
      // click-select/hover parity with the interpreter (see
      // packages/runtime-lib/src/engine.ts's onSelect/onHoverIn/onHoverOut +
      // fireSelect/fireHoverIn/fireHoverOut, and host.ts's sibling
      // triggerNodeEvent bubbling). `params` is destructured to plain locals
      // so paramAccess's onSelect/onHoverIn/onHoverOut branches (below) can
      // emit bare identifiers exactly like every other handler kind's params.
      case "onSelect": {
        const nodeIndex = Math.trunc(Number((handler.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
        const stopPropagation = Boolean((handler.config as { stopPropagation?: boolean } | undefined)?.stopPropagation);
        this.handlerEventCtx = { kind: "onSelect" };
        this.resetBodyCounters();
        this.push(`rt.onSelect(${nodeIndex}, ${stopPropagation ? "true" : "false"}, (params) => {`);
        this.indent += 1;
        this.push("const { selectedNode, selectedNodeIndex, controllerIndex, selectionPoint, selectionRayOrigin } = params;");
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      case "onHoverIn":
      case "onHoverOut": {
        const nodeIndex = Math.trunc(Number((handler.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
        this.handlerEventCtx = { kind: handler.kind };
        this.resetBodyCounters();
        this.push(`rt.${handler.kind === "onHoverIn" ? "onHoverIn" : "onHoverOut"}(${nodeIndex}, (params) => {`);
        this.indent += 1;
        this.push("const { hoveredNode, controllerIndex } = params;");
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
    }
    void index;
  }

  // Writes rt.eventOut(sourceNode, socket, value) for every output socket
  // of *this* handler's own event node that some other handler reads
  // cross-handler (GI012) — see the crossHandlerReads note above.
  private emitEventOutWrites() {
    if (this.originNodeId === undefined) {
      return;
    }
    for (const key of this.crossHandlerReads) {
      const [sourceNode, socket] = key.split(":");
      if (Number(sourceNode) !== this.originNodeId) {
        continue;
      }
      const value = this.paramAccess(socket);
      this.push(`rt.eventOut(${sourceNode}, ${JSON.stringify(socket)}, ${value});`);
    }
  }

  // `E.<name>` when the event index is in range (the common case — every
  // real eventRef/eventId this emitter ever sees comes from `module.events`
  // itself), else a bare numeric literal fallback.
  private eventArgCode(eventId: number): string {
    const name = this.module.events[eventId]?.name;
    return name ? `E.${name}` : String(eventId);
  }

  // ---------------------------------------------------------------------
  // Statements.
  // ---------------------------------------------------------------------

  private emitStmt(stmt: IRStmt) {
    switch (stmt.k) {
      case "seq":
        stmt.stmts.forEach((s) => this.emitStmt(s));
        return;
      case "let": {
        const code = this.emitExpr(stmt.expr);
        const name = this.allocTemp();
        this.tempRenames.set(stmt.temp, name);
        this.push(`const ${name} = ${code};`);
        return;
      }
      case "if": {
        // An empty "then" with a non-empty "else" (the common `if (passed)
        // {} else { <log an error> }` idiom — see this file's task report)
        // reads better negated into a single branch: `if (!passed) { <log
        // an error> }`. Parseable back to the exact same IR shape (empty
        // "then", the printed body as "else") — see @gltfi/parse-ts's
        // mirroring check in its own "if" dispatch.
        if (stmt.then.k === "seq" && stmt.then.stmts.length === 0 && stmt.else) {
          const negCode = this.negateCond(stmt.cond);
          this.push(`if (${negCode}) {`);
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
          this.push("}");
          return;
        }
        const condCode = this.emitExpr(stmt.cond);
        this.push(`if (${condCode}) {`);
        this.indent += 1;
        this.emitStmt(stmt.then);
        this.indent -= 1;
        if (stmt.else) {
          this.push("} else {");
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
        }
        this.push("}");
        return;
      }
      case "while": {
        // See emitFor's identical note: while.cond is RE-EVALUATED every
        // iteration, so CSE must never hoist any of its sub-expressions to
        // a temp declared once, before the loop (see cseDisabled/
        // dedupeSiblings).
        this.cseDisabled = true;
        const condCode = this.emitExpr(stmt.cond);
        this.cseDisabled = false;
        this.push(`while (${condCode}) {`);
        this.indent += 1;
        this.emitStmt(stmt.body);
        this.indent -= 1;
        this.push("}");
        if (stmt.completed) {
          this.emitStmt(stmt.completed);
        }
        return;
      }
      case "for": {
        this.emitFor(stmt);
        return;
      }
      case "switch": {
        // `| 0` is a semantic no-op for an already-int value (spec ints are
        // int32) but forces TS to widen a compile-time-constant selector
        // (e.g. a literal-condition graph like flow/switch's own conformance
        // asset) from a numeric-literal type to plain `number` — a bare
        // `switch (4) { case 1: ... }` is a strict-mode TS error ("Type '1'
        // is not comparable to type '4'") otherwise, since TS narrows the
        // switch discriminant to the literal type of a literal expression.
        const selectorCode = this.emitExpr(stmt.selector);
        this.push(`switch (${selectorCode} | 0) {`);
        this.indent += 1;
        for (const [c, body] of stmt.cases) {
          this.push(`case ${c}: {`);
          this.indent += 1;
          this.emitStmt(body);
          this.push("break;");
          this.indent -= 1;
          this.push("}");
        }
        if (stmt.default) {
          this.push("default: {");
          this.indent += 1;
          this.emitStmt(stmt.default);
          this.push("break;");
          this.indent -= 1;
          this.push("}");
        }
        this.indent -= 1;
        this.push("}");
        return;
      }
      case "setVar": {
        const code = this.emitExpr(stmt.expr);
        this.push(`V.${this.varName(stmt.varId)} = ${code};`);
        return;
      }
      case "setPointer": {
        this.emitSetPointer(stmt);
        return;
      }
      case "emitEvent": {
        if (stmt.args.length !== 4) {
          throw new EmitError("emitEvent expects exactly 4 payload args (bool,int,float,duration)", "event/send", this.originNodeId);
        }
        // externalId is never passed at the call site — it's fully
        // redundant with the event index/`E.<name>` ref, which the runtime
        // already has its own eventDecls table to resolve it from (see
        // engine.ts's EngineBuilder.send doc comment). The payload array
        // itself is omitted too when every value is exactly the event's own
        // declared default (matchesEventDefaults) — rt.send falls back to
        // those same defaults internally, identical to how
        // rt.eventPayload's "never sent" fallback already works.
        const eventArg = this.eventArgCode(stmt.eventId);
        if (this.matchesEventDefaults(stmt.eventId, stmt.args)) {
          this.push(`rt.send(${eventArg});`);
          return;
        }
        const argsCode = this.emitList(stmt.args);
        this.push(`rt.send(${eventArg}, [${argsCode.join(", ")}]);`);
        return;
      }
      case "stopPropagation": {
        // eventRef is the CURRENT handler's own event ref — always known at
        // compile time (paramAccess("event") resolves it the same way a
        // param("event") read would; see import.ts's note that IR always
        // targets the enclosing handler's own event regardless of what the
        // graph node's "event" input was actually wired to).
        const stopImmediateCode = this.emitExpr(stmt.stopImmediate);
        this.push(`rt.stopPropagation(${this.paramAccess("event")}, ${stopImmediateCode});`);
        return;
      }
      case "log": {
        const argsCode = this.emitList(stmt.args);
        if (argsCode.length === 0) {
          this.push(`rt.log(${JSON.stringify(stmt.template)});`);
        } else {
          this.push(`rt.log(${JSON.stringify(stmt.template)}, [${argsCode.join(", ")}]);`);
        }
        return;
      }
      case "callProc": {
        const proc = this.module.procs[stmt.procId];
        if (!proc) {
          throw new EmitError(`unknown proc id ${stmt.procId}`, "callProc", this.originNodeId);
        }
        this.push(`${proc.name}();`);
        return;
      }
      case "async":
        this.emitAsync(stmt);
        return;
      case "stateful":
        this.emitStateful(stmt);
        return;
      case "intrinsic":
        this.emitIntrinsicStmt(stmt);
        return;
    }
  }

  // ---------------------------------------------------------------------
  // Async ops (flow/setDelay, variable/interpolate, pointer/interpolate,
  // animation/start|stop|stopAt). Each rt.* call below returns {ok:boolean}
  // — see engine.ts's EngineBuilder doc comments for exactly which
  // interpreter.ts executeNodeFlow case each one mirrors. Since `.ok` is
  // read at most once (the out/err branch check), the call is inlined
  // directly into that check with no intermediate result variable at all —
  // when neither branch exists, the call is emitted as a bare statement
  // (its return value discarded, matching the original always-called
  // semantics exactly).
  // ---------------------------------------------------------------------

  private emitAsync(stmt: Extract<IRStmt, { k: "async" }>) {
    const doneCode = this.emitCont(stmt.done);
    let callCode: string;
    switch (stmt.kind) {
      case "setDelay": {
        const slotIndex = stmt.slot?.slot;
        if (slotIndex === undefined) {
          throw new EmitError("flow/setDelay missing its state slot", "flow/setDelay", this.originNodeId);
        }
        const slotName = this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`;
        const durationCode = this.emitExpr(stmt.args[0]);
        callCode = `rt.setDelay(${slotName}, ${durationCode}, ${doneCode})`;
        break;
      }
      case "varInterp": {
        const { varId, useSlerp } = (stmt.config ?? {}) as { varId: number; useSlerp: boolean };
        const [value, duration, p1, p2] = this.emitList(stmt.args);
        callCode = `rt.varInterp(${varId}, ${value}, ${duration}, ${p1}, ${p2}, ${useSlerp ? "true" : "false"}, ${doneCode})`;
        break;
      }
      case "ptrInterp": {
        const template = stmt.template;
        if (!template) {
          throw new EmitError("pointer/interpolate missing its pointer template", "async/ptrInterp", this.originNodeId);
        }
        const params = pointerTemplateParams(template);
        const [value, duration, p1, p2, ...paramArgs] = stmt.args;
        const { pointer, argsObj } = this.pointerCall(template, paramArgs);
        void params;
        const [valueCode, durationCode, p1Code, p2Code] = this.emitList([value, duration, p1, p2]);
        callCode =
          argsObj === null
            ? `rt.ptrInterp(${pointer}, "${stmt.type}", ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode})`
            : `rt.ptrInterp(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode})`;
        break;
      }
      case "animStart": {
        const [animation, startTime, endTime, speed] = this.emitList(stmt.args);
        callCode = `rt.animStart(${animation}, ${startTime}, ${endTime}, ${speed}, ${doneCode})`;
        break;
      }
      case "animStop": {
        const [animation] = this.emitList(stmt.args);
        callCode = `rt.animStop(${animation})`;
        break;
      }
      case "animStopAt": {
        const [animation, stopTime] = this.emitList(stmt.args);
        callCode = `rt.animStopAt(${animation}, ${stopTime}, ${doneCode})`;
        break;
      }
    }
    if (!stmt.out && !stmt.err) {
      this.push(`${callCode};`);
      return;
    }
    // Empty "out" with a present "err" negates the same way the plain "if"
    // case does — `!x.ok` already parses as `!(x.ok)` (member access binds
    // tighter than unary `!`), so no parens are ever needed here either.
    if (!stmt.out && stmt.err) {
      this.push(`if (!${callCode}.ok) {`);
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("}");
      return;
    }
    this.push(`if (${callCode}.ok) {`);
    this.indent += 1;
    if (stmt.out) this.emitStmt(stmt.out);
    this.indent -= 1;
    if (stmt.err) {
      this.push("} else {");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
    }
    this.push("}");
  }

  // A `Cont` is either a plain proc reference (`{kind:"proc"}` — just its
  // name, callable with no args, exactly the shape rt.* async calls expect
  // for `done`) or an inline body (`{kind:"inline"}`). Inline bodies are
  // lifted to a synthetic top-level-in-their-enclosing-block function
  // declaration emitted right before the call that references it — safe
  // because a Cont body can only touch module state, never a caller's
  // temps (see docs/design/ir-and-transpiler.md's GI105 / the IR invariant
  // checker), and it sidesteps needing to embed a multi-statement block as
  // a single call-argument expression.
  private emitCont(cont: Extract<IRStmt, { k: "async" }>["done"]): string {
    if (!cont) {
      return "undefined";
    }
    if (cont.kind === "proc") {
      const proc = this.module.procs[cont.procId];
      if (!proc) {
        throw new EmitError(`unknown proc id ${cont.procId}`, "async.done", this.originNodeId);
      }
      return proc.name;
    }
    const name = this.allocCont();
    this.push(`function ${name}() {`);
    this.indent += 1;
    this.emitStmt(cont.body);
    this.indent -= 1;
    this.push("}");
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle).
  // Reset ports are plain field assignments on the slot object (mirroring
  // interpreter.ts's own reset cases exactly — no rt.* call needed); "in"
  // ports call the matching rt.* decision function. Every result field
  // except throttle's is read at most once, so — same reasoning as
  // emitAsync above — doN/multiGate/waitAll inline the call directly into
  // the `if`/`switch` and never need a temp; only throttle (whose "invalid"
  // AND "fire" fields are both read, so the call must not run twice) keeps
  // a named result (`ok<n>` — see allocOk). See engine.ts's EngineBuilder
  // doc comments for exactly which interpreter.ts executeNodeFlow case each
  // one mirrors.
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = this.stateSlotDisplayNames[slotIndex] ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.count = 0;`);
          return;
        }
        const nCode = this.emitExpr(stmt.args[0]);
        const call = `rt.doN(${slotName}, ${nCode})`;
        if (stmt.outs.out) {
          this.push(`if (${call}) {`);
          this.indent += 1;
          this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("}");
        } else {
          this.push(`${call};`);
        }
        return;
      }
      case "throttle": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.lastTime = undefined;`);
          this.push(`${slotName}.remaining = NaN;`);
          return;
        }
        const durationCode = this.emitExpr(stmt.args[0]);
        if (stmt.outs.out || stmt.outs.err) {
          const resName = this.allocOk();
          this.push(`const ${resName} = rt.throttle(${slotName}, ${durationCode});`);
          this.push(`if (${resName}.invalid) {`);
          this.indent += 1;
          if (stmt.outs.err) this.emitStmt(stmt.outs.err);
          this.indent -= 1;
          this.push(`} else if (${resName}.fire) {`);
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("}");
        } else {
          this.push(`rt.throttle(${slotName}, ${durationCode});`);
        }
        return;
      }
      case "multiGate": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.used = [];`);
          this.push(`${slotName}.lastIndex = -1;`);
          return;
        }
        // UTF-16/lexical sort — matches interpreter.ts's own
        // `Object.keys(flows).sort()` exactly (see flow/multiGate's
        // executeNodeFlow case), not JS's automatic ascending-numeric
        // reordering of integer-like object keys, which would only
        // coincide with this for < 10 outputs.
        const keys = Object.keys(stmt.outs).sort();
        const isRandom = Boolean((slot?.config as { isRandom?: boolean } | undefined)?.isRandom);
        const isLoop = Boolean((slot?.config as { isLoop?: boolean } | undefined)?.isLoop);
        const call = `rt.multiGate(${slotName}, ${keys.length}, ${isRandom ? "true" : "false"}, ${isLoop ? "true" : "false"})`;
        if (keys.length > 0) {
          this.push(`switch (${call}.index) {`);
          this.indent += 1;
          keys.forEach((key, i) => {
            this.push(`case ${i}: {`);
            this.indent += 1;
            this.emitStmt(stmt.outs[key]);
            this.push("break;");
            this.indent -= 1;
            this.push("}");
          });
          this.indent -= 1;
          this.push("}");
        } else {
          this.push(`${call};`);
        }
        return;
      }
      case "waitAll": {
        const inputFlows = Number((slot?.config as { inputFlows?: number } | undefined)?.inputFlows ?? 0);
        if (stmt.port === "reset") {
          this.push(`${slotName}.activated = [];`);
          this.push(`${slotName}.remaining = ${inputFlows};`);
          return;
        }
        const index = typeof stmt.port === "number" ? stmt.port : 0;
        const call = `rt.waitAll(${slotName}, ${inputFlows}, ${index})`;
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if (${call}.completed) {`);
          this.indent += 1;
          if (stmt.outs.completed) this.emitStmt(stmt.outs.completed);
          this.indent -= 1;
          this.push("} else {");
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("}");
        } else {
          this.push(`${call};`);
        }
        return;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Intrinsic statements: the escape hatch for ops with no dedicated IRStmt
  // shape. Only two synthetic ops reach here in practice (see
  // import.ts's lowerSecondaryPort and its ASYNC_OPS/STATEFUL_OPS-miss
  // fallback to raiseIntrinsic): a delay node's own "cancel" input port,
  // and the standalone flow/cancelDelay op (cancels an arbitrary delay by
  // ref, looked up at the scheduler level — see engine.ts's cancelDelay).
  // ---------------------------------------------------------------------

  private emitIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>) {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIndex = (stmt.config as { slot?: number }).slot;
      if (slotIndex === undefined) {
        throw new EmitError("flow/setDelay#cancel missing its state slot", stmt.op, this.originNodeId);
      }
      const slotName = this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`;
      this.push(`rt.cancelDelaySlot(${slotName});`);
      return;
    }
    if (stmt.op === "flow/cancelDelay") {
      const refCode = this.emitExpr(stmt.args[0]);
      this.push(`rt.cancelDelay(${refCode});`);
      if (stmt.outs.out) {
        this.emitStmt(stmt.outs.out);
      }
      return;
    }
    throw new EmitError(`intrinsic op "${stmt.op}" has no dedicated lowering`, stmt.op, this.originNodeId);
  }

  // The for-loop's index lives in the module-level register emitted by
  // emitStateSlots — this just *assigns* it (matching the interpreter's
  // unconditional `state.forIndex = startIndex` on every "in" trigger), it
  // never re-declares a local. stateRead{field:"index"} reads the same
  // register from anywhere (see emitStateRead), so no scoping bookkeeping
  // is needed here at all.
  private emitFor(stmt: Extract<IRStmt, { k: "for" }>) {
    const slotIndex = stmt.slot?.slot;
    if (slotIndex === undefined) {
      throw new EmitError("for statement missing its state slot", "flow/for", this.originNodeId);
    }
    const varName = this.stateSlotDisplayNames[slotIndex] ?? `for_${slotIndex}`;
    const startCode = this.emitExpr(stmt.start);
    this.push(`${varName} = ${startCode};`);
    // `end` is RE-EVALUATED on every iteration's condition check (matching
    // @gltfi/ir/import.ts's own "no sharing, ever" rule for this exact
    // expression — see raiseFor's buildNoTempExpr(ctx=null) call): CSE must
    // never hoist any of its sub-expressions into a temp declared once,
    // before the loop, since that would freeze a value across iterations
    // that's supposed to be re-read fresh each time.
    this.cseDisabled = true;
    const endCode = this.emitExpr(stmt.end);
    this.cseDisabled = false;
    this.push(`while (${varName} < (${endCode})) {`);
    this.indent += 1;
    this.emitStmt(stmt.body);
    this.push(`${varName} = ${varName} + 1;`);
    this.indent -= 1;
    this.push("}");
    if (stmt.completed) {
      this.emitStmt(stmt.completed);
    }
  }

  private emitSetPointer(stmt: Extract<IRStmt, { k: "setPointer" }>) {
    const { pointer, argsObj } = this.pointerCall(stmt.template, stmt.args);
    const valueCode = this.emitExpr(stmt.value);
    const call = argsObj === null ? `rt.ptrSet(${pointer}, "${stmt.type}", ${valueCode})` : `rt.ptrSet(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode})`;
    if (!stmt.out && !stmt.err) {
      this.push(`${call};`);
      return;
    }
    // Empty "out" with a present "err" negates the same way the plain "if"
    // case does (see that case's doc comment) — a bare function-call
    // result is always atomic, so the negation never needs parens.
    if (!stmt.out && stmt.err) {
      this.push(`if (!${call}) {`);
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("}");
      return;
    }
    this.push(`if (${call}) {`);
    this.indent += 1;
    if (stmt.out) this.emitStmt(stmt.out);
    this.indent -= 1;
    if (stmt.err) {
      this.push("} else {");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
    }
    this.push("}");
  }

  // Builds the pointer literal + (possibly omitted) args object for a
  // pointer/get|set|interpolate call: any template parameter whose fed
  // value is a compile-time CONSTANT is inlined directly into the path
  // string (as a resolved `lit` segment — formatPointerTemplate re-escapes
  // any literal bracket characters for us, so this is exactly as safe as a
  // genuinely-authored literal pointer), and dropped from the args object
  // entirely; only params still fed a dynamic expression remain as `[name]`/
  // `{name}` placeholders with a matching args-object entry. When EVERY
  // param inlines this way, the whole args object is omitted (the runtime
  // accepts both — see engine.ts's ptrGet/ptrSet/ptrInterp). Re-parsing
  // never needs to recover which segments were originally parameterized —
  // an all-literal reconstructed pointer is a fully valid (if perhaps more
  // specific) template on its own; see @gltfi/parse-ts's lowerPointerArgs
  // and the task report's "round-trip caveat".
  private pointerCall(template: PtrTemplate, args: IRExpr[]): { pointer: string; argsObj: string | null } {
    let argIdx = 0;
    const remainingParams: Array<{ name: string; kind: "int" | "ref" }> = [];
    const remainingArgs: IRExpr[] = [];
    const resolvedSegments: PtrSegment[] = template.segments.map((seg) => {
      if (seg.k === "lit") {
        return seg;
      }
      const arg = args[argIdx];
      argIdx += 1;
      // Only INT params inline safely: their text is always plain digits.
      // A `ref` param's value is itself a full JSON-pointer-shaped string
      // (e.g. "/nodes/3", not just "3") — splicing that raw into a single
      // literal segment, which formatPointerTemplate then joins with "/"
      // alongside the template's OWN surrounding literal segments (which
      // typically already spell out "nodes" etc.), produces a doubled,
      // broken path (verified against the real conformance corpus:
      // Extras/Matrix_Updates's globalMatrix pointer resolved to nothing
      // and silently returned zeros once inlined this way — a real
      // execution bug, not just a readability nit). `ref` params always
      // stay dynamic args regardless of constness.
      if (seg.k === "int" && arg && arg.k === "const") {
        return { k: "lit", text: String(Math.trunc(Number(arg.data[0] ?? 0))) };
      }
      remainingParams.push({ name: seg.name, kind: seg.k });
      remainingArgs.push(arg);
      return seg;
    });
    const pointer = JSON.stringify(formatPointerTemplate({ segments: resolvedSegments }));
    if (remainingParams.length === 0) {
      return { pointer, argsObj: null };
    }
    const codes = this.emitList(remainingArgs);
    const entries = remainingParams.map((p, i) => `${JSON.stringify(p.name)}: ${codes[i]}`);
    return { pointer, argsObj: `{ ${entries.join(", ")} }` };
  }

  // ---------------------------------------------------------------------
  // Expressions.
  // ---------------------------------------------------------------------

  private emitExpr(expr: IRExpr): string {
    switch (expr.k) {
      case "const":
        return constLiteral(expr.type, expr.data);
      case "varGet":
        return `V.${this.varName(expr.varId)}`;
      case "ptrGet": {
        const { pointer, argsObj } = this.pointerCall(expr.template, expr.args);
        // Always validate against the pointer's own configured signature
        // (valueType), even when reading the "isValid" socket — see
        // model.ts's ptrGet doc comment: `type` is this expression's own
        // result type (bool for isValid reads), not what the resolver
        // should check the raw value against.
        const call = argsObj === null ? `rt.ptrGet(${pointer}, "${expr.valueType}")` : `rt.ptrGet(${pointer}, ${argsObj}, "${expr.valueType}")`;
        return expr.wantIsValid ? `${call}.isValid` : `${call}.value`;
      }
      case "param":
        return this.paramAccess(expr.name);
      case "op":
        return this.emitOp(expr);
      case "temp":
        return this.tempRenames.get(expr.id) ?? expr.id;
      case "stateRead":
        return this.emitStateRead(expr.slot.slot, expr.field);
      case "intrinsic":
        return this.emitIntrinsicExpr(expr);
    }
  }

  // ---------------------------------------------------------------------
  // Within-one-call-site CSE: identical (same rendered code, and not
  // involving math/random) sibling arguments of ONE call/args-list are
  // materialized as a single shared `t<n>` temp instead of duplicating the
  // computation — this extends @gltfi/ir/import.ts's own fan-out>=2 rule
  // (which only catches the SAME graph node/socket referenced twice) to
  // structural duplicates that happen to come from two DISTINCT graph nodes
  // (e.g. two separate literal-valued nodes, or two separately-authored
  // `math/add` nodes with the same operands, both wired as sibling
  // arguments of the same downstream node). Deliberately scoped to exactly
  // one sibling-argument list — see the task report for why a fully general
  // cross-statement CSE pass was intentionally NOT attempted (the
  // architecture here builds expression strings bottom-up and consumes them
  // immediately, so there's no clean way to retroactively rewrite an
  // already-embedded first occurrence once a later duplicate is found,
  // outside of a single in-memory list of not-yet-consumed sibling values).
  // `cseDisabled` guards the two spots (while.cond, for.end) that are
  // RE-EVALUATED every iteration, where hoisting anything into a
  // once-before-the-loop temp would be a real correctness bug, not just a
  // style choice — see emitFor/the "while" case's own note.
  // ---------------------------------------------------------------------

  private cseDisabled = false;

  private emitList(exprs: IRExpr[]): string[] {
    const codes = exprs.map((e) => this.emitExpr(e));
    if (this.cseDisabled) {
      return codes;
    }
    const groups = new Map<string, number[]>();
    exprs.forEach((e, i) => {
      if (e.k !== "op" && e.k !== "ptrGet" && e.k !== "intrinsic") {
        return; // never promote bare atoms (const/varGet/param/temp/stateRead) — no benefit, only noise.
      }
      if (this.containsRandom(e)) {
        return; // math/random draws must never be merged into one shared call.
      }
      const list = groups.get(codes[i]) ?? [];
      list.push(i);
      groups.set(codes[i], list);
    });
    const out = codes.slice();
    for (const [code, idxs] of groups) {
      if (idxs.length < 2) {
        continue;
      }
      const name = this.allocTemp();
      this.push(`const ${name} = ${code};`);
      for (const i of idxs) {
        out[i] = name;
      }
    }
    return out;
  }

  private containsRandom(expr: IRExpr): boolean {
    switch (expr.k) {
      case "op":
        return expr.op === "math/random" || expr.args.some((a) => this.containsRandom(a));
      case "ptrGet":
        return expr.args.some((a) => this.containsRandom(a));
      case "intrinsic":
        return expr.args.some((a) => this.containsRandom(a));
      default:
        return false;
    }
  }

  private paramAccess(name: string): string {
    const ctx = this.handlerEventCtx;
    if (!ctx) {
      throw new EmitError(`param("${name}") read outside a handler body`, "param", this.originNodeId);
    }
    if (name === "event") {
      if (ctx.kind === "onStart") return '"event:onStart"';
      if (ctx.kind === "onTick") return '"event:onTick"';
      if (ctx.kind === "onSelect") return '"event:onSelect"';
      if (ctx.kind === "onHoverIn") return '"event:onHoverIn"';
      if (ctx.kind === "onHoverOut") return '"event:onHoverOut"';
      return `"event:custom:${ctx.eventRef}"`;
    }
    if (ctx.kind === "onTick") {
      if (name === "timeSinceStart") return "timeSinceStart";
      if (name === "timeSinceLastTick") return "timeSinceLastTick";
    }
    if (ctx.kind === "receive") {
      if (name === "boolParameter") return "payload[0]";
      if (name === "intParameter") return "payload[1]";
      if (name === "floatParameter") return "payload[2]";
      if (name === "expectedDuration") return "payload[3]";
    }
    // Destructured to bare locals right at the rt.onSelect/onHoverIn/
    // onHoverOut callback's top (see emitHandler) — same shape as every
    // other handler kind's params, one identifier per named socket.
    if (ctx.kind === "onSelect") {
      if (name === "selectedNode") return "selectedNode";
      if (name === "selectedNodeIndex") return "selectedNodeIndex";
      if (name === "controllerIndex") return "controllerIndex";
      if (name === "selectionPoint") return "selectionPoint";
      if (name === "selectionRayOrigin") return "selectionRayOrigin";
    }
    if (ctx.kind === "onHoverIn" || ctx.kind === "onHoverOut") {
      if (name === "hoveredNode") return "hoveredNode";
      if (name === "controllerIndex") return "controllerIndex";
    }
    throw new EmitError(`param("${name}") not supported for handler kind "${ctx.kind}"`, "param", this.originNodeId);
  }

  // Every case here is a module-level register/slot field (see
  // emitStateSlots) — readable from anywhere, not just lexically inside the
  // owning statement, matching interpreter.ts's own per-op "value" cases
  // (flow/for, flow/doN, flow/multiGate, flow/setDelay, flow/throttle,
  // flow/waitAll — see evaluateValue's switch), each keyed by the same
  // output socket name the field mirrors.
  private emitStateRead(slotIndex: number, field: string): string {
    const slot = this.module.stateSlots[slotIndex];
    if (!slot) {
      throw new EmitError(`stateRead on unknown state slot ${slotIndex}`, "stateRead", this.originNodeId);
    }
    const name = this.stateSlotDisplayNames[slotIndex];
    if (slot.kind === "for" && field === "index") {
      return name;
    }
    if (slot.kind === "doN" && field === "currentCount") {
      return `${name}.count`;
    }
    if (slot.kind === "multiGate" && field === "lastIndex") {
      return `${name}.lastIndex`;
    }
    if (slot.kind === "delay" && field === "lastDelay") {
      return `${name}.lastRef`;
    }
    if (slot.kind === "throttle" && field === "lastRemainingTime") {
      return `${name}.remaining`;
    }
    if (slot.kind === "waitAll" && field === "remainingInputs") {
      // Unset (never-advanced) reads as the slot's own configured
      // inputFlows — mirrors interpreter.ts's `state?.remainingInputs ??
      // inputFlows` fallback (see flow/waitAll's evaluateValue case).
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      return `(${name}.remaining ?? ${inputFlows})`;
    }
    throw new EmitError(`stateRead on "${slot.kind}".${field} not supported this milestone`, "stateRead", this.originNodeId);
  }

  private emitIntrinsicExpr(expr: Extract<IRExpr, { k: "intrinsic" }>): string {
    if (expr.op === "math/switch") {
      const cases = (expr.config.cases as number[] | undefined) ?? [];
      const [selection, dflt, ...caseArgs] = expr.args;
      const [selCode, dfltCode, ...valuesCode] = this.emitList([selection, dflt, ...caseArgs]);
      return `m.switchCase(${selCode}, [${cases.join(", ")}], [${valuesCode.join(", ")}], ${dfltCode})`;
    }
    if (expr.op === "event/receive#payload") {
      // Direct read of the (persistent, event-index-keyed) last-sent
      // payload — order-independent by construction, see engine.ts's
      // eventPayload doc comment and import.ts's GI012 branch.
      const eventIndex = expr.config.eventIndex as number;
      const field = expr.config.field as string;
      const fieldIndex = { boolParameter: 0, intParameter: 1, floatParameter: 2, expectedDuration: 3 }[field];
      return `rt.eventPayload(${this.eventArgCode(eventIndex)})[${fieldIndex}]`;
    }
    if (expr.op === "event/onTick#time") {
      return (expr.config.field as string) === "timeSinceStart" ? "rt.tickTime()" : "rt.tickDelta()";
    }
    if (expr.config?.crossContext === true) {
      const sourceNode = expr.config.sourceNode as number;
      const socket = expr.config.socket as string;
      return `rt.eventOutRead(${sourceNode}, ${JSON.stringify(socket)})`;
    }
    throw new EmitError(`intrinsic expr "${expr.op}" has no dedicated lowering`, expr.op, this.originNodeId);
  }

  private emitOp(expr: Extract<IRExpr, { k: "op" }>): string {
    // math/random needs per-engine-instance LCG state (see runtime-lib's
    // math.ts header note), so it's `rt.random()`, not a static `m.*` call
    // — and, being impure, is never CSE'd (see emitList/containsRandom).
    if (expr.op === "math/random") {
      return "rt.random()";
    }
    const native = nativeOpInfo(expr.op, expr.overload);
    // Comparison/equality natives specifically (not add/sub/mul/div/neg/
    // and/or/not, which never hit this) fall back to `m.*` when BOTH
    // operands are literal constants: TS narrows a bare `true`/`false` (and
    // similarly-narrow) literal's type, and considers two disjoint literal
    // types compared via `===`/`!==`/`<`/etc. an error ("this comparison
    // appears to be unintentional because the types '...' and '...' have no
    // overlap" — verified against the real conformance corpus, e.g.
    // math/xor's literal `true`/`false` test cases) — parenthesizing or any
    // other syntax doesn't change this, only NOT using a bare literal-typed
    // operand does. A literal-vs-literal comparison isn't a case native
    // substitution's readability win matters much for anyway.
    const isComparisonFamily = COMPARISON_FAMILY_OPS.has(expr.op);
    const bothConst = expr.args.length === 2 && expr.args[0].k === "const" && expr.args[1].k === "const";
    if (native && !(isComparisonFamily && bothConst)) {
      return this.emitNativeOp(expr, native);
    }
    const argsCode = this.emitList(expr.args);
    if (expr.op === "math/quatFromAngles") {
      argsCode.push(JSON.stringify((expr.config?.order as string | undefined) ?? "yxz"));
    }
    const fn = mFunctionName(expr.op, expr.overload);
    const call = `m.${fn}(${argsCode.join(", ")})`;
    const multiOutput = Object.keys(expr.overload.outputs).length > 1;
    if (expr.socket === undefined) {
      return multiOutput ? `${call}.value` : call;
    }
    return /^\d+$/.test(expr.socket) ? `${call}[${expr.socket}]` : `${call}.${expr.socket}`;
  }

  private emitNativeOp(expr: Extract<IRExpr, { k: "op" }>, native: NativeOp): string {
    if (native.kind === "unary") {
      const [a] = expr.args;
      const aCode = this.emitExpr(a);
      const operand = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
      // Avoid `--x` (decrement-token) / stray `+ +` merges when the operand
      // itself already starts with the same sign character.
      const body = native.jsOp === "-" && operand.startsWith("-") ? `- ${operand}` : `${native.jsOp}${operand}`;
      return native.wrap === "i32" ? `(${body}) | 0` : body;
    }
    const [a, b] = expr.args;
    if (native.wrap === "imulCall") {
      const [aCode, bCode] = this.emitList([a, b]);
      return `Math.imul(${aCode}, ${bCode})`;
    }
    const [aCode, bCode] = this.emitList([a, b]);
    const leftStr = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
    const rightStr = exprPrec(b) <= native.prec ? `(${bCode})` : bCode;
    const body = `${leftStr} ${native.jsOp} ${rightStr}`;
    return native.wrap === "i32" ? `(${body}) | 0` : body;
  }

  // Blanket `!(...)` negation of a whole condition expression (used for the
  // empty-then `if`/setPointer/async rewrites — see those call sites'
  // comments) — deliberately NEVER algebraically flips a comparison
  // operator (`<` to `>=` etc.), which would be unsound in the presence of
  // NaN (`!(a < b)` is NOT the same as `a >= b` when `a` or `b` is NaN,
  // since every NaN comparison is false either way) — only the boolean
  // RESULT is negated, which is always exactly correct. Reuses the same
  // exprPrec/PREC_UNARY parenthesization rule as native `math/not` so
  // atoms (`!V.flag`) read bare while anything looser-binding
  // (`!(a === b)`) gets parens.
  private negateCond(cond: IRExpr): string {
    const code = this.emitExpr(cond);
    const operand = exprPrec(cond) < PREC_UNARY ? `(${code})` : code;
    return `!${operand}`;
  }
}

export function emitModule(module: IRModule, opts: EmitOptions = {}): EmitResult {
  return new Emitter(module, opts.flavor ?? "ts").run();
}
