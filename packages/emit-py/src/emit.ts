// IR -> Python emitter. Mirrors packages/emit-ts/src/emit.ts's traversal and
// statement order exactly (same class shape, same method-by-method
// breakdown — see that file, and packages/emit-lua/src/emit.ts, which
// documents itself as following the identical traversal; read either first)
// but produces typed, PEP-8-ish Python 3.10+ source executed by a real
// python3 subprocess (see packages/conformance/src/run-compiled-py.ts and
// @gltfi/runtime-py's harness.py) rather than a VM or dynamic import. The
// generated module's shape is:
//
//   import gltfi_runtime.m as m
//   from types import SimpleNamespace          (only if there are state slots)
//
//   def build(rt: "Engine") -> None:
//       V = rt.vars({"counter1": rt.int_(0), ...})  -- dict key order == variable index
//       E = rt.events({"Explode": {...}, ...})      -- dict key order == event index
//       S = SimpleNamespace()                       -- one attribute per state slot
//       S.doN1 = rt.do_n_state()
//       def proc5() -> None: ...                -- procs (Python nested defs resolve
//       def proc2() -> None: ...                   forward references at CALL time,
//                                                    not def time, so — unlike Lua's
//                                                    forward-declare-then-assign
//                                                    dance — no ordering trick is
//                                                    needed even when proc5 calls
//                                                    proc2 despite being defined first)
//       def on_start_0() -> None: ...
//       rt.on_start(on_start_0)
//
// Value representation: float=Python float, int=Python int (int32 semantics
// via m.* calls — Python ints are arbitrary-precision, so every int-typed
// arithmetic op wraps explicitly), bool=Python bool, vectors/matrices=0-based
// Python lists, ref=Python str. Where a math/type op is PROVABLY spec-
// identical to a native Python operator over a plain FLOAT/bool value
// (float add/sub/mul/neg/eq/lt/le/gt/ge, and bool eq/and/or/not/xor — see
// nativeOpInfo below), this emitter uses the native operator directly;
// everything else (every int-typed arithmetic/comparison op, division —
// CPython's `/` raises ZeroDivisionError on a zero divisor, unlike the
// spec's "divide by zero -> 0" rule, so it always stays `m.div` — vector/
// matrix math, and every other op family) still goes through `m.*` calls.
// All math/type/ref ops go through `m.*` calls, exactly like the other two
// backends' design decision — see @gltfi/runtime-py's gltfi_runtime/m.py,
// which mirrors @gltfi/runtime-lib/src/math.ts's surface and (critically)
// its exact function NAMES (camelCase, e.g. `quatFromAxisAngle`, not
// snake_case) so @gltfi/kernel's fn-naming.ts reverse table — already shared
// by @gltfi/parse-ts and @gltfi/parse-lua — works unmodified for
// @gltfi/parse-py too. Only the ENGINE's rt.* surface is snake_case
// (Python-idiomatic hand-written runtime code, not a reversal target).
//
// Readability pass (mirrors @gltfi/emit-ts's/@gltfi/emit-lua's — see either
// file's own header note and the task report for the full before/after):
// named vars/events (via IR's own display-name computation — @gltfi/ir/
// display-names.ts, shared verbatim, NOT copy-pasted), short sequential
// state-slot/temp/continuation/ok names instead of graph-node-id-derived
// ones, native operators in place of `m.*` soup where safe (see above),
// inlined constant pointer-template args (and the whole args dict omitted
// when every param inlines), dropped redundant intermediate result
// variables for every stateful/async op read at most once (only throttle's
// two-field read, and a 2+-output multiGate's index re-check, still need
// one — see emitStateful's own doc comment for why the LATTER is a Python-
// specific necessity with no TS analog), `if not x:` for empty-then
// branches, and omitted default-payload `rt.send`/arg-less `rt.log` calls.
//
// Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
// onHoverOut) is intentionally NOT emitted here — see
// @gltfi/runtime-py/src/py/gltfi_runtime/engine.py's header note for why
// (viewer-only, never exercised by the conformance corpus this backend
// targets), same scope decision as the Lua backend.
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
// m.* function-name selection — identical logic/table to emit-ts's and
// emit-lua's (base name derived from the op string, "Int"/"Bool" suffix from
// the resolved overload's input type); @gltfi/runtime-py's gltfi_runtime/m.py
// mirrors runtime-lib's math.ts exported surface name-for-name EXCEPT for a
// handful of identifiers that collide with Python keywords ("and"/"or"/
// "not") or shadow-but-legal builtins we chose to rename anyway for clarity
// ("abs"/"min"/"max"/"pow"/"round") — PY_RENAME below is the only difference
// from the other two backends' naming tables, applied as a final rewrite
// after the shared base-name/Int-suffix logic (so it can't drift from
// fn-naming.ts's own copy of that shared logic).
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
  let fn: string;
  if (op === "math/eq") {
    const t = primaryInputSig(overload);
    fn = t === "bool" ? "eqBool" : t === "int" ? "eqInt" : "eq";
  } else if ((ARITH_INT_OPS.has(base) || BOOL_INT_OPS.has(base)) && primaryInputSig(overload) === "int") {
    fn = `${base}Int`;
  } else {
    fn = base;
  }
  return PY_RENAME[fn] ?? fn;
}

// Only the bare (no Int-suffix) forms collide: "andInt"/"orInt"/"notInt"/
// "absInt"/"minInt"/"maxInt" are all perfectly legal Python identifiers as-is.
const PY_RENAME: Record<string, string> = {
  and: "and_",
  or: "or_",
  not: "not_",
  abs: "abs_",
  min: "min_",
  max: "max_",
  pow: "pow_",
  round: "round_"
};

function mCall(fn: string, argsCode: string): string {
  return `m.${fn}(${argsCode})`;
}

// ---------------------------------------------------------------------------
// Native-operator substitution: ops provably identical to a plain Python
// operator over a scalar float/bool value (see runtime-py's m.py's own
// add/sub/mul/neg/eq/lt/le/gt/ge/and_/or_/not_/xor — every one of these bare
// Python operator forms is exactly what those `m.*` functions themselves do
// over Python floats/bools). Deliberately narrower than emit-ts's
// nativeOpInfo in two ways, both load-bearing (see this file's header note
// and the task report's per-language native-operator table):
//
//   - INT arithmetic is NEVER natively substituted here (only FLOAT is):
//     Python ints are arbitrary-precision, so a native `+`/`-`/`*` over two
//     int-typed values would silently compute the exact bignum result
//     instead of the spec's wrapping int32 — every int arithmetic op stays
//     `m.*Int` unconditionally. Int COMPARISONS (eq/lt/le/gt/ge) have no
//     such correctness concern (Python int comparison is always exact
//     regardless of magnitude), but are kept `m.*` anyway, deliberately, so
//     a native `==`/`<`/etc. in generated Python is UNAMBIGUOUSLY
//     float-or-bool-typed — same design choice as emit-lua's identical
//     restriction (see that file's nativeOpInfo doc comment for the full
//     rationale: it sidesteps the int-vs-float parse-side ambiguity
//     @gltfi/emit-ts's own broader native-op substitution lives with).
//   - DIVISION is never natively substituted (unlike emit-ts's `/` case):
//     CPython's `/` raises `ZeroDivisionError` on a zero divisor, whereas
//     the spec (and `m.div`) defines float division by zero as returning
//     +-inf/NaN, matching JS's/Lua's own native `/` — so `/` always stays
//     `m.div` here, a genuine correctness requirement, not a style choice.
// ---------------------------------------------------------------------------

type NativeOp = { kind: "binary"; pyOp: string; prec: number } | { kind: "unary"; pyOp: string; prec: number };

// Python operator precedence (low to high, relevant levels only): or(1) <
// and(2) < not x(3) < comparisons(4) < +/-(6) < */ (7) < unary +/-(8).
const PREC_OR = 1;
const PREC_AND = 2;
const PREC_NOT = 3;
const PREC_CMP = 4;
const PREC_ADD = 6;
const PREC_MUL = 7;
const PREC_UNARY_MINUS = 8;
const ATOM_PREC = 100;

function nativeOpInfo(op: string, overload: ResolvedOverload): NativeOp | null {
  const t = primaryInputSig(overload);
  switch (op) {
    case "math/add":
      return t === "float" ? { kind: "binary", pyOp: "+", prec: PREC_ADD } : null;
    case "math/sub":
      return t === "float" ? { kind: "binary", pyOp: "-", prec: PREC_ADD } : null;
    case "math/mul":
      return t === "float" ? { kind: "binary", pyOp: "*", prec: PREC_MUL } : null;
    case "math/neg":
      return t === "float" ? { kind: "unary", pyOp: "-", prec: PREC_UNARY_MINUS } : null;
    case "math/eq":
      return t === "float" || t === "bool" ? { kind: "binary", pyOp: "==", prec: PREC_CMP } : null;
    case "math/lt":
      return t === "float" ? { kind: "binary", pyOp: "<", prec: PREC_CMP } : null;
    case "math/le":
      return t === "float" ? { kind: "binary", pyOp: "<=", prec: PREC_CMP } : null;
    case "math/gt":
      return t === "float" ? { kind: "binary", pyOp: ">", prec: PREC_CMP } : null;
    case "math/ge":
      return t === "float" ? { kind: "binary", pyOp: ">=", prec: PREC_CMP } : null;
    case "math/and":
      return t === "bool" ? { kind: "binary", pyOp: "and", prec: PREC_AND } : null;
    case "math/or":
      return t === "bool" ? { kind: "binary", pyOp: "or", prec: PREC_OR } : null;
    case "math/not":
      return t === "bool" ? { kind: "unary", pyOp: "not", prec: PREC_NOT } : null;
    case "math/xor":
      return t === "bool" ? { kind: "binary", pyOp: "!=", prec: PREC_CMP } : null;
    default:
      return null;
  }
}

function exprPrec(expr: IRExpr): number {
  if (expr.k === "op" && expr.socket === undefined) {
    const native = nativeOpInfo(expr.op, expr.overload);
    if (native) {
      return native.prec;
    }
  }
  return ATOM_PREC;
}

// ---------------------------------------------------------------------------
// Literal formatting.
// ---------------------------------------------------------------------------

function pyFloatLiteral(x: number): string {
  if (Number.isNaN(x)) {
    return 'float("nan")';
  }
  if (x === Infinity) {
    return 'float("inf")';
  }
  if (x === -Infinity) {
    return 'float("-inf")';
  }
  const s = String(x);
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

function pyIntLiteral(x: number): string {
  return String(Math.trunc(x));
}

function pyStringLiteral(s: string): string {
  let out = '"';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20 || code === 0x7f) out += `\\x${code.toString(16).padStart(2, "0")}`;
    else out += ch;
  }
  return `${out}"`;
}

function constLiteral(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return data[0] ? "True" : "False";
  }
  if (type === "ref") {
    return pyStringLiteral(String(data[0] ?? ""));
  }
  if (type === "int") {
    return pyIntLiteral(Math.trunc(Number(data[0] ?? 0)));
  }
  if (type === "float") {
    return pyFloatLiteral(Number(data[0] ?? 0));
  }
  // vector/matrix
  return `[${(data as number[]).map((x) => pyFloatLiteral(Number(x))).join(", ")}]`;
}

// `rt.<type>_(...)` variable-declaration-shorthand call matching runtime-
// py's own int_/bool_/float_/float2../ref_ factory methods exactly (see
// engine.py) — trailing underscore on the scalar names only (int_/bool_/
// float_/ref_ — the vector/matrix names never collide with a builtin, so
// they're bare), same PY_RENAME-style convention as this file's own m.*
// function-naming rule.
function varDeclCall(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return `rt.bool_(${data[0] ? "True" : "False"})`;
  }
  if (type === "ref") {
    return `rt.ref_(${pyStringLiteral(String(data[0] ?? ""))})`;
  }
  if (type === "int") {
    return `rt.int_(${pyIntLiteral(Math.trunc(Number(data[0] ?? 0)))})`;
  }
  if (type === "float") {
    return `rt.float_(${pyFloatLiteral(Number(data[0] ?? 0))})`;
  }
  const nums = (data as number[]).map((x) => pyFloatLiteral(Number(x)));
  return `rt.${type}(${nums.join(", ")})`;
}

// ---------------------------------------------------------------------------
// Emitter. State-slot/variable display-name computation lives in
// @gltfi/ir/display-names.ts, shared verbatim with @gltfi/emit-ts and
// @gltfi/emit-lua — see that file's own doc comment.
// ---------------------------------------------------------------------------

type HandlerEventCtx = { kind: "onStart" } | { kind: "onTick" } | { kind: "receive"; eventRef: number };

class Emitter {
  private readonly module: IRModule;
  private readonly lines: string[] = [];
  private indent = 1; // inside `def build(rt): ...`
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  private readonly crossHandlerReads = new Set<string>();
  private readonly stateSlotDisplayNames: string[];
  private readonly variableDisplayNames: string[];

  // Per-handler/proc-body-scoped naming state, reset by resetBodyCounters()
  // at the top of every handler/proc body — mirrors emit-ts's/emit-lua's
  // identical nextTempNum/nextContNum/nextOkNum/tempRenames exactly.
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

  constructor(module: IRModule) {
    this.module = module;
    this.stateSlotDisplayNames = computeStateSlotDisplayNames(module.stateSlots);
    this.variableDisplayNames = computeVariableDisplayNames(module);
    this.collectCrossHandlerReads(module);
  }

  // Identical traversal to emit-ts's/emit-lua's collectCrossHandlerReads —
  // see either file's own doc comment.
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
    const hasSlots = this.module.stateSlots.length > 0;
    const header = ["import gltfi_runtime.m as m"];
    if (hasSlots) {
      header.push("from types import SimpleNamespace");
    }
    header.push("", 'def build(rt: "gltfi_runtime.Engine") -> None:');
    this.lines.push(...header);
    this.emitVars();
    this.emitEvents();
    this.emitStateSlots();
    this.emitProcs();
    this.emitHandlers();
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
    this.lines.push(text.length === 0 ? "" : `${"    ".repeat(this.indent)}${text}`);
  }

  // Emits `stmt` as the sole body of a just-opened Python indented block,
  // inserting a `pass` if it produced no lines — Python (unlike Lua's
  // `do...end`/TS's `{}`) has no way to write a syntactically empty block,
  // so every block-opening call site (proc/handler bodies, if/else
  // branches, while/for bodies, async continuations) must route through
  // this instead of calling emitStmt directly.
  private emitBlock(stmt: IRStmt) {
    const before = this.lines.length;
    this.emitStmt(stmt);
    if (this.lines.length === before) {
      this.push("pass");
    }
  }

  private varName(varId: number): string {
    return this.variableDisplayNames[varId] ?? `var${varId}`;
  }

  // `V = rt.vars({"counter1": rt.int_(0.0), ...})` — dict key order IS the
  // variable index order (Python 3.7+ dicts preserve insertion order, the
  // same load-bearing contract the other two backends rely on via array/
  // table element order — see engine.py's vars doc comment).
  private emitVars() {
    const entries = this.module.variables.map((v, i) => `${pyStringLiteral(this.variableDisplayNames[i])}: ${varDeclCall(v.type, v.initial.data)}`);
    this.push(`V = rt.vars({${entries.join(", ")}})`);
  }

  private emitEvents() {
    const entries = this.module.events.map((e) => {
      const fields: string[] = [];
      if (e.id) {
        fields.push(`"externalId": ${pyStringLiteral(e.id)}`);
      }
      const boolDefault = e.values.find((v) => v.name === "boolParameter");
      const intDefault = e.values.find((v) => v.name === "intParameter");
      const floatDefault = e.values.find((v) => v.name === "floatParameter");
      const duration = e.values.find((v) => v.name === "expectedDuration");
      if (boolDefault) {
        fields.push(`"defaultBool": ${Boolean(boolDefault.default.data[0]) ? "True" : "False"}`);
      }
      if (intDefault) {
        fields.push(`"defaultInt": ${pyIntLiteral(Math.trunc(Number(intDefault.default.data[0] ?? 0)))}`);
      }
      if (floatDefault) {
        fields.push(`"defaultFloat": ${pyFloatLiteral(Number(floatDefault.default.data[0] ?? 0))}`);
      }
      if (duration) {
        fields.push(`"expectedDuration": ${pyFloatLiteral(Number(duration.default.data[0] ?? 0))}`);
      }
      return `${pyStringLiteral(e.name)}: {${fields.join(", ")}}`;
    });
    this.push(`E = rt.events({${entries.join(", ")}})`);
  }

  // The event's own declared (bool,int,float,duration) defaults — same
  // extraction as emitEvents' own field-by-field lookup above, reused by
  // emitEvent's "does this send's payload match the declared defaults"
  // check.
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

  // True when every one of `args` (the 4 fixed event/send payload exprs, in
  // bool/int/float/duration order) is a compile-time constant equal to this
  // event's own declared default — see emitEvent's "emitEvent" case, which
  // omits the payload list entirely for it (rt.send falls back to the exact
  // same defaults internally — see engine.py's send).
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

  // See emit-ts's/emit-lua's emitStateSlots doc comments for the full
  // rationale (per-node persisted state registers, mirroring
  // interpreter.ts's NodeState fields one-for-one). Every "kind" except
  // "for" is a state-slot factory call (rt.do_n_state()/etc — see
  // engine.py) instead of a hand-written dict literal; "for" is a bare
  // scalar attribute (compared/incremented directly by emitFor).
  private emitStateSlots() {
    if (this.module.stateSlots.length === 0) {
      return;
    }
    this.push("S = SimpleNamespace()");
    this.module.stateSlots.forEach((slot, i) => {
      const name = this.stateSlotDisplayNames[i];
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`S.${name} = ${pyIntLiteral(Math.trunc(initial))}`);
          return;
        }
        case "delay":
          this.push(`S.${name} = rt.delay_state()`);
          return;
        case "doN":
          this.push(`S.${name} = rt.do_n_state()`);
          return;
        case "multiGate":
          this.push(`S.${name} = rt.multi_gate_state()`);
          return;
        case "waitAll":
          this.push(`S.${name} = rt.wait_all_state()`);
          return;
        case "throttle":
          this.push(`S.${name} = rt.throttle_state()`);
          return;
      }
    });
  }

  // Nested Python function defs need no forward-declare trick, unlike the
  // Lua backend's `local a, b, c` + `a = function() ... end` dance: a name
  // referenced in a nested def's BODY is resolved by ordinary scope lookup
  // at CALL time, not def time, so proc5 (defined first) can freely call
  // proc2 (defined after it in this same list) as long as proc5 itself
  // isn't actually invoked until later — true here, since every actual call
  // happens from a handler body registered only after all procs are defined.
  private emitProcs() {
    this.module.procs.forEach((proc) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`proc:${proc.id}`];
      this.handlerEventCtx = null;
      this.resetBodyCounters();
      this.push(`def ${proc.name}() -> None:`);
      this.indent += 1;
      this.emitBlock(proc.body);
      this.indent -= 1;
    });
  }

  private emitHandlers() {
    this.module.handlers.forEach((handler, index) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`handler:${index}`];
      this.emitHandler(handler, index);
    });
  }

  private emitHandler(handler: IRHandler, index: number) {
    if (handler.kind === "onStart") {
      this.handlerEventCtx = { kind: "onStart" };
      this.resetBodyCounters();
      const name = `__on_start_${index}`;
      this.push(`def ${name}() -> None:`);
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push(`rt.on_start(${name})`);
      return;
    }
    if (handler.kind === "onTick") {
      this.handlerEventCtx = { kind: "onTick" };
      this.resetBodyCounters();
      const name = `__on_tick_${index}`;
      this.push(`def ${name}(time_since_start: float, time_since_last_tick: float) -> None:`);
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push(`rt.on_tick(${name})`);
      return;
    }
    if (handler.kind === "receive") {
      if (handler.eventRef === undefined) {
        throw new EmitError("event/receive handler missing eventRef", "event/receive", this.originNodeId);
      }
      this.handlerEventCtx = { kind: "receive", eventRef: handler.eventRef };
      this.resetBodyCounters();
      const name = `__on_receive_${index}`;
      this.push(`def ${name}(payload: list) -> None:`);
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push(`rt.on_receive(${this.eventArgCode(handler.eventRef)}, ${name})`);
      return;
    }
    // KHR_node_selectability/hoverability — viewer-only, never emitted by
    // the official conformance corpus this backend targets, same scope
    // decision as the Lua backend (see runtime-py's engine.py header note).
    throw new EmitError(
      `handler kind "${handler.kind}" is not supported by the Python backend (KHR_node_selectability/hoverability is viewer-only)`,
      handler.kind,
      this.originNodeId
    );
  }

  private emitHandlerBody(body: IRStmt) {
    const before = this.lines.length;
    this.emitEventOutWrites();
    this.emitStmt(body);
    if (this.lines.length === before) {
      this.push("pass");
    }
  }

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
      this.push(`rt.event_out(${sourceNode}, ${pyStringLiteral(socket)}, ${value})`);
    }
  }

  // `E["<name>"]` when the event index is in range (the common case), else
  // a bare numeric literal fallback — same convention as emit-ts's/emit-
  // lua's eventArgCode.
  private eventArgCode(eventId: number): string {
    const name = this.module.events[eventId]?.name;
    return name ? `E[${pyStringLiteral(name)}]` : String(eventId);
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
        this.push(`${name} = ${code}`);
        return;
      }
      case "if": {
        // An empty "then" with a non-empty "else" reads better negated into
        // a single branch — see emit-ts's/emit-lua's identical "if" case
        // doc comment (same idiom, `if not cond:` instead of Python's own
        // empty-then/else form).
        if (stmt.then.k === "seq" && stmt.then.stmts.length === 0 && stmt.else) {
          const negCode = this.negateCond(stmt.cond);
          this.push(`if ${negCode}:`);
          this.indent += 1;
          this.emitBlock(stmt.else);
          this.indent -= 1;
          return;
        }
        this.push(`if ${this.emitExpr(stmt.cond)}:`);
        this.indent += 1;
        this.emitBlock(stmt.then);
        this.indent -= 1;
        if (stmt.else) {
          this.push("else:");
          this.indent += 1;
          this.emitBlock(stmt.else);
          this.indent -= 1;
        }
        return;
      }
      case "while": {
        this.push(`while ${this.emitExpr(stmt.cond)}:`);
        this.indent += 1;
        this.emitBlock(stmt.body);
        this.indent -= 1;
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
        this.emitSwitch(stmt);
        return;
      }
      case "setVar": {
        const code = this.emitExpr(stmt.expr);
        this.push(`V[${pyStringLiteral(this.varName(stmt.varId))}].set(${code})`);
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
        const eventArg = this.eventArgCode(stmt.eventId);
        if (this.matchesEventDefaults(stmt.eventId, stmt.args)) {
          this.push(`rt.send(${eventArg})`);
          return;
        }
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.send(${eventArg}, [${argsCode}])`);
        return;
      }
      case "stopPropagation":
        this.push(`rt.stop_propagation(${this.paramAccess("event")}, ${this.emitExpr(stmt.stopImmediate)})`);
        return;
      case "log": {
        const argsCode = stmt.args.map((a) => this.emitExpr(a));
        if (argsCode.length === 0) {
          this.push(`rt.log(${pyStringLiteral(stmt.template)})`);
        } else {
          this.push(`rt.log(${pyStringLiteral(stmt.template)}, [${argsCode.join(", ")}])`);
        }
        return;
      }
      case "callProc": {
        const proc = this.module.procs[stmt.procId];
        if (!proc) {
          throw new EmitError(`unknown proc id ${stmt.procId}`, "callProc", this.originNodeId);
        }
        this.push(`${proc.name}()`);
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
  // Async ops — identical logic to emit-ts's/emit-lua's emitAsync: each
  // rt.* call returns `{"ok": ...}`. Since "ok" is read at most once (the
  // out/err branch check), the call is inlined directly into that check
  // with no intermediate result variable at all — when neither branch
  // exists, the call is emitted as a bare statement (its return value
  // discarded, matching the original always-called semantics exactly).
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
        callCode = `rt.set_delay(S.${slotName}, ${this.emitExpr(stmt.args[0])}, ${doneCode})`;
        break;
      }
      case "varInterp": {
        const { varId, useSlerp } = (stmt.config ?? {}) as { varId: number; useSlerp: boolean };
        const [value, duration, p1, p2] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.var_interp(${varId}, ${value}, ${duration}, ${p1}, ${p2}, ${useSlerp ? "True" : "False"}, ${doneCode})`;
        break;
      }
      case "ptrInterp": {
        const template = stmt.template;
        if (!template) {
          throw new EmitError("pointer/interpolate missing its pointer template", "async/ptrInterp", this.originNodeId);
        }
        const params = pointerTemplateParams(template);
        const [value, duration, p1, p2, ...paramArgs] = stmt.args;
        void params;
        const { pointer, argsObj } = this.pointerCall(template, paramArgs);
        const [valueCode, durationCode, p1Code, p2Code] = [value, duration, p1, p2].map((a) => this.emitExpr(a));
        callCode =
          argsObj === null
            ? `rt.ptr_interp(${pointer}, "${stmt.type}", ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode})`
            : `rt.ptr_interp(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode})`;
        break;
      }
      case "animStart": {
        const [animation, startTime, endTime, speed] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.anim_start(${animation}, ${startTime}, ${endTime}, ${speed}, ${doneCode})`;
        break;
      }
      case "animStop": {
        callCode = `rt.anim_stop(${this.emitExpr(stmt.args[0])})`;
        break;
      }
      case "animStopAt": {
        const [animation, stopTime] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.anim_stop_at(${animation}, ${stopTime}, ${doneCode})`;
        break;
      }
    }
    if (!stmt.out && !stmt.err) {
      this.push(`${callCode}`);
      return;
    }
    // Empty "out" with a present "err" negates the same way the plain "if"
    // case does — `not x["ok"]` reads unambiguously (subscript binds
    // tighter than `not`), so no parens are ever needed here either.
    if (!stmt.out && stmt.err) {
      this.push(`if not ${callCode}["ok"]:`);
      this.indent += 1;
      this.emitBlock(stmt.err);
      this.indent -= 1;
      return;
    }
    this.push(`if ${callCode}["ok"]:`);
    this.indent += 1;
    this.emitBlock(stmt.out ?? { k: "seq", stmts: [] });
    this.indent -= 1;
    if (stmt.err) {
      this.push("else:");
      this.indent += 1;
      this.emitBlock(stmt.err);
      this.indent -= 1;
    }
  }

  // A `Cont` is either a plain proc reference (its bare name, passed as a
  // callable — NOT called here) or an inline body, lifted to a synthetic
  // nested `def <cont<n>>` declared immediately before the call site that
  // references it — safe for the same reason emit-ts's/emit-lua's version
  // is: a Cont body only ever touches module state, never a caller's temps
  // (see @gltfi/ir's GI105 invariant).
  private emitCont(cont: Extract<IRStmt, { k: "async" }>["done"]): string {
    if (!cont) {
      return "None";
    }
    if (cont.kind === "proc") {
      const proc = this.module.procs[cont.procId];
      if (!proc) {
        throw new EmitError(`unknown proc id ${cont.procId}`, "async.done", this.originNodeId);
      }
      return proc.name;
    }
    const name = this.allocCont();
    this.push(`def ${name}() -> None:`);
    this.indent += 1;
    this.emitBlock(cont.body);
    this.indent -= 1;
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops — identical logic to emit-ts's/emit-lua's emitStateful:
  // every result field except throttle's is read at most once, so doN/
  // waitAll inline the call directly into the `if` and never need a temp.
  // multiGate is a Python-specific exception to that pattern (see its own
  // case below): unlike TS's native `switch` (which evaluates its
  // discriminant exactly once, no matter how many `case`s follow), Python's
  // `if`/`elif` chain re-evaluates ITS OWN condition expression on every
  // clause it reaches — so a 2+-output multiGate needs a named result the
  // same way throttle does (a 0- or 1-output multiGate has only one `if`,
  // never re-evaluated, and stays inlined).
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = this.stateSlotDisplayNames[slotIndex] ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`S.${slotName}["count"] = 0.0`);
          return;
        }
        const call = `rt.do_n(S.${slotName}, ${this.emitExpr(stmt.args[0])})`;
        if (stmt.outs.out) {
          this.push(`if ${call}:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.out);
          this.indent -= 1;
        } else {
          this.push(`${call}`);
        }
        return;
      }
      case "throttle": {
        if (stmt.port === "reset") {
          this.push(`S.${slotName}.pop("lastTime", None)`);
          this.push(`S.${slotName}["remaining"] = ${pyFloatLiteral(NaN)}`);
          return;
        }
        const durationCode = this.emitExpr(stmt.args[0]);
        if (stmt.outs.out || stmt.outs.err) {
          const resName = this.allocOk();
          this.push(`${resName} = rt.throttle(S.${slotName}, ${durationCode})`);
          this.push(`if ${resName}["invalid"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.err ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push(`elif ${resName}["fire"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.out ?? { k: "seq", stmts: [] });
          this.indent -= 1;
        } else {
          this.push(`rt.throttle(S.${slotName}, ${durationCode})`);
        }
        return;
      }
      case "multiGate": {
        if (stmt.port === "reset") {
          this.push(`S.${slotName}["used"] = []`);
          this.push(`S.${slotName}["lastIndex"] = -1.0`);
          return;
        }
        // UTF-16/lexical sort — matches interpreter.ts's/emit-ts's own
        // `Object.keys(flows).sort()` exactly.
        const keys = Object.keys(stmt.outs).sort();
        const isRandom = Boolean((slot?.config as { isRandom?: boolean } | undefined)?.isRandom);
        const isLoop = Boolean((slot?.config as { isLoop?: boolean } | undefined)?.isLoop);
        const call = `rt.multi_gate(S.${slotName}, ${keys.length}, ${isRandom ? "True" : "False"}, ${isLoop ? "True" : "False"})`;
        if (keys.length > 1) {
          // See this method's own header note: a 2+-clause `if`/`elif`
          // chain re-evaluates (and re-mutates: `["used"]`/`["lastIndex"]`)
          // a literal call embedded in 2+ of its own conditions, so this
          // needs a named result (`ok<n>`, same counter as throttle's).
          const resName = this.allocOk();
          this.push(`${resName} = ${call}`);
          keys.forEach((key, i) => {
            this.push(`${i === 0 ? "if" : "elif"} ${resName}["index"] == ${i}:`);
            this.indent += 1;
            this.emitBlock(stmt.outs[key]);
            this.indent -= 1;
          });
          return;
        }
        if (keys.length === 1) {
          this.push(`if ${call}["index"] == 0:`);
          this.indent += 1;
          this.emitBlock(stmt.outs[keys[0]]);
          this.indent -= 1;
          return;
        }
        this.push(`${call}`);
        return;
      }
      case "waitAll": {
        const inputFlows = Number((slot?.config as { inputFlows?: number } | undefined)?.inputFlows ?? 0);
        if (stmt.port === "reset") {
          this.push(`S.${slotName}["activated"] = []`);
          this.push(`S.${slotName}["remaining"] = ${pyFloatLiteral(inputFlows)}`);
          return;
        }
        const index = typeof stmt.port === "number" ? stmt.port : 0;
        const call = `rt.wait_all(S.${slotName}, ${inputFlows}, ${index})`;
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if ${call}["completed"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.completed ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push("else:");
          this.indent += 1;
          this.emitBlock(stmt.outs.out ?? { k: "seq", stmts: [] });
          this.indent -= 1;
        } else {
          this.push(`${call}`);
        }
        return;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Intrinsic statements — identical logic to emit-ts's/emit-lua's
  // emitIntrinsicStmt.
  // ---------------------------------------------------------------------

  private emitIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>) {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIndex = (stmt.config as { slot?: number }).slot;
      if (slotIndex === undefined) {
        throw new EmitError("flow/setDelay#cancel missing its state slot", stmt.op, this.originNodeId);
      }
      const slotName = this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`;
      this.push(`rt.cancel_delay_slot(S.${slotName})`);
      return;
    }
    if (stmt.op === "flow/cancelDelay") {
      this.push(`rt.cancel_delay(${this.emitExpr(stmt.args[0])})`);
      if (stmt.outs.out) {
        this.emitStmt(stmt.outs.out);
      }
      return;
    }
    throw new EmitError(`intrinsic op "${stmt.op}" has no dedicated lowering`, stmt.op, this.originNodeId);
  }

  private emitFor(stmt: Extract<IRStmt, { k: "for" }>) {
    const slotIndex = stmt.slot?.slot;
    if (slotIndex === undefined) {
      throw new EmitError("for statement missing its state slot", "flow/for", this.originNodeId);
    }
    const varName = this.stateSlotDisplayNames[slotIndex] ?? `for_${slotIndex}`;
    this.push(`S.${varName} = ${this.emitExpr(stmt.start)}`);
    this.push(`while S.${varName} < (${this.emitExpr(stmt.end)}):`);
    this.indent += 1;
    this.emitStmt(stmt.body);
    this.push(`S.${varName} = S.${varName} + 1`);
    this.indent -= 1;
    if (stmt.completed) {
      this.emitStmt(stmt.completed);
    }
  }

  // Python has no switch statement — lowered to an if/elif chain on the
  // selector's value, with `default` as the final `else`.
  private emitSwitch(stmt: Extract<IRStmt, { k: "switch" }>) {
    const selVar = this.allocTemp();
    this.push(`${selVar} = ${this.emitExpr(stmt.selector)}`);
    let first = true;
    for (const [c, body] of stmt.cases) {
      this.push(`${first ? "if" : "elif"} ${selVar} == ${c}:`);
      first = false;
      this.indent += 1;
      this.emitBlock(body);
      this.indent -= 1;
    }
    if (stmt.default) {
      this.push(first ? "if True:" : "else:");
      this.indent += 1;
      this.emitBlock(stmt.default);
      this.indent -= 1;
    }
  }

  private emitSetPointer(stmt: Extract<IRStmt, { k: "setPointer" }>) {
    const { pointer, argsObj } = this.pointerCall(stmt.template, stmt.args);
    const valueCode = this.emitExpr(stmt.value);
    const call = argsObj === null ? `rt.ptr_set(${pointer}, "${stmt.type}", ${valueCode})` : `rt.ptr_set(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode})`;
    if (!stmt.out && !stmt.err) {
      this.push(`${call}`);
      return;
    }
    // Empty "out" with a present "err" negates the same way the plain "if"
    // case does — a bare function-call result is always atomic, so the
    // negation never needs parens.
    if (!stmt.out && stmt.err) {
      this.push(`if not ${call}:`);
      this.indent += 1;
      this.emitBlock(stmt.err);
      this.indent -= 1;
      return;
    }
    this.push(`if ${call}:`);
    this.indent += 1;
    this.emitBlock(stmt.out ?? { k: "seq", stmts: [] });
    this.indent -= 1;
    if (stmt.err) {
      this.push("else:");
      this.indent += 1;
      this.emitBlock(stmt.err);
      this.indent -= 1;
    }
  }

  // Builds the pointer literal + (possibly omitted) args dict for a
  // pointer/get|set|interpolate call: any template parameter whose fed
  // value is a compile-time CONSTANT is inlined directly into the path
  // string, and dropped from the args dict entirely; only params still fed
  // a dynamic expression remain as `[name]`/`{name}` placeholders with a
  // matching args-dict entry. When EVERY param inlines this way, the whole
  // args dict is omitted (the runtime accepts both — see engine.py's
  // ptr_get/ptr_set/ptr_interp). Identical logic/rationale to emit-ts's/
  // emit-lua's pointerCall — see either method's own doc comment (same
  // `ref`-params-never-inline caveat).
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
      if (seg.k === "int" && arg && arg.k === "const") {
        return { k: "lit", text: String(Math.trunc(Number(arg.data[0] ?? 0))) };
      }
      remainingParams.push({ name: seg.name, kind: seg.k });
      remainingArgs.push(arg);
      return seg;
    });
    const pointer = pyStringLiteral(formatPointerTemplate({ segments: resolvedSegments }));
    if (remainingParams.length === 0) {
      return { pointer, argsObj: null };
    }
    const codes = remainingArgs.map((a) => this.emitExpr(a));
    const entries = remainingParams.map((p, i) => `${pyStringLiteral(p.name)}: ${codes[i]}`);
    return { pointer, argsObj: `{${entries.join(", ")}}` };
  }

  // ---------------------------------------------------------------------
  // Expressions.
  // ---------------------------------------------------------------------

  private emitExpr(expr: IRExpr): string {
    switch (expr.k) {
      case "const":
        return constLiteral(expr.type, expr.data);
      case "varGet":
        return `V[${pyStringLiteral(this.varName(expr.varId))}].get()`;
      case "ptrGet": {
        const { pointer, argsObj } = this.pointerCall(expr.template, expr.args);
        const call = argsObj === null ? `rt.ptr_get(${pointer}, "${expr.valueType}")` : `rt.ptr_get(${pointer}, ${argsObj}, "${expr.valueType}")`;
        return expr.wantIsValid ? `${call}["isValid"]` : `${call}["value"]`;
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

  private paramAccess(name: string): string {
    const ctx = this.handlerEventCtx;
    if (!ctx) {
      throw new EmitError(`param("${name}") read outside a handler body`, "param", this.originNodeId);
    }
    if (name === "event") {
      if (ctx.kind === "onStart") return '"event:onStart"';
      if (ctx.kind === "onTick") return '"event:onTick"';
      return `"event:custom:${ctx.eventRef}"`;
    }
    if (ctx.kind === "onTick") {
      if (name === "timeSinceStart") return "time_since_start";
      if (name === "timeSinceLastTick") return "time_since_last_tick";
    }
    if (ctx.kind === "receive") {
      // payload is a 0-based Python list here, matching the TS backend's
      // 0-based JS array (unlike the Lua backend's 1-based table).
      if (name === "boolParameter") return "payload[0]";
      if (name === "intParameter") return "payload[1]";
      if (name === "floatParameter") return "payload[2]";
      if (name === "expectedDuration") return "payload[3]";
    }
    throw new EmitError(`param("${name}") not supported for handler kind "${ctx.kind}"`, "param", this.originNodeId);
  }

  private emitStateRead(slotIndex: number, field: string): string {
    const slot = this.module.stateSlots[slotIndex];
    if (!slot) {
      throw new EmitError(`stateRead on unknown state slot ${slotIndex}`, "stateRead", this.originNodeId);
    }
    const name = this.stateSlotDisplayNames[slotIndex];
    if (slot.kind === "for" && field === "index") {
      return `S.${name}`;
    }
    if (slot.kind === "doN" && field === "currentCount") {
      return `S.${name}["count"]`;
    }
    if (slot.kind === "multiGate" && field === "lastIndex") {
      return `S.${name}["lastIndex"]`;
    }
    if (slot.kind === "delay" && field === "lastDelay") {
      return `S.${name}["lastRef"]`;
    }
    if (slot.kind === "throttle" && field === "lastRemainingTime") {
      return `S.${name}["remaining"]`;
    }
    if (slot.kind === "waitAll" && field === "remainingInputs") {
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      // Python idiom for TS's `?? inputFlows` — NOT `S.x.get("remaining") or
      // inputFlows` (Python's `or`, unlike Lua's, treats 0 as falsy too, so
      // that would wrongly substitute inputFlows once remaining genuinely
      // reaches 0). An explicit dict-membership check is the safe
      // nullish-coalesce equivalent here.
      return `(S.${name}["remaining"] if "remaining" in S.${name} else ${pyFloatLiteral(inputFlows)})`;
    }
    throw new EmitError(`stateRead on "${slot.kind}".${field} not supported this milestone`, "stateRead", this.originNodeId);
  }

  private emitIntrinsicExpr(expr: Extract<IRExpr, { k: "intrinsic" }>): string {
    if (expr.op === "math/switch") {
      const cases = (expr.config.cases as number[] | undefined) ?? [];
      const [selection, dflt, ...caseArgs] = expr.args;
      const selCode = this.emitExpr(selection);
      const dfltCode = this.emitExpr(dflt);
      const valuesCode = caseArgs.map((a) => this.emitExpr(a)).join(", ");
      return `m.switchCase(${selCode}, [${cases.join(", ")}], [${valuesCode}], ${dfltCode})`;
    }
    if (expr.op === "event/receive#payload") {
      const eventIndex = expr.config.eventIndex as number;
      const field = expr.config.field as string;
      // 0-based: this backend's payload list, matching the TS backend's
      // 0-based tuple (unlike the Lua backend's 1-based one).
      const fieldIndex = { boolParameter: 0, intParameter: 1, floatParameter: 2, expectedDuration: 3 }[field];
      return `rt.event_payload(${this.eventArgCode(eventIndex)})[${fieldIndex}]`;
    }
    if (expr.op === "event/onTick#time") {
      return (expr.config.field as string) === "timeSinceStart" ? "rt.tick_time()" : "rt.tick_delta()";
    }
    if (expr.config?.crossContext === true) {
      const sourceNode = expr.config.sourceNode as number;
      const socket = expr.config.socket as string;
      return `rt.event_out_read(${sourceNode}, ${pyStringLiteral(socket)})`;
    }
    throw new EmitError(`intrinsic expr "${expr.op}" has no dedicated lowering`, expr.op, this.originNodeId);
  }

  private emitOp(expr: Extract<IRExpr, { k: "op" }>): string {
    if (expr.op === "math/random") {
      return "rt.random()";
    }
    const native = nativeOpInfo(expr.op, expr.overload);
    if (native) {
      return this.emitNativeOp(expr, native);
    }
    const argsCode = expr.args.map((a) => this.emitExpr(a));
    if (expr.op === "math/quatFromAngles") {
      argsCode.push(pyStringLiteral((expr.config?.order as string | undefined) ?? "yxz"));
    }
    const fn = mFunctionName(expr.op, expr.overload);
    const call = mCall(fn, argsCode.join(", "));
    const multiOutput = Object.keys(expr.overload.outputs).length > 1;
    if (expr.socket === undefined) {
      return multiOutput ? `${call}["value"]` : call;
    }
    if (/^\d+$/.test(expr.socket)) {
      return `${call}[${Number(expr.socket)}]`;
    }
    return `${call}["${expr.socket}"]`;
  }

  private emitNativeOp(expr: Extract<IRExpr, { k: "op" }>, native: NativeOp): string {
    if (native.kind === "unary") {
      const [a] = expr.args;
      const aCode = this.emitExpr(a);
      const operand = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
      if (native.pyOp === "not") {
        return `not ${operand}`;
      }
      // Avoid a `- -x` token-merge ambiguity reading as `--x` (Python has no
      // decrement operator, so this is purely a readability nicety, not a
      // correctness fix like Lua's identical guard) — a single space is
      // already enough, but an explicit check keeps this symmetric with the
      // other two backends' own unary-neg guards.
      return operand.startsWith("-") ? `- ${operand}` : `${native.pyOp}${operand}`;
    }
    const [a, b] = expr.args;
    const aCode = this.emitExpr(a);
    const bCode = this.emitExpr(b);
    // Python's comparison operators are famously NON-associative in the
    // nested-application sense: `a == b == c` does NOT parse as `(a == b)
    // == c` (which would be a bool compared against `c`) — it's syntactic
    // sugar for the chained `a == b and b == c`, entirely different
    // semantics. So a comparison-family result (eq/lt/le/gt/ge/xor, all
    // PREC_CMP — see nativeOpInfo) used as either operand of ANOTHER
    // comparison must ALWAYS be parenthesized, even though its precedence
    // is otherwise equal to its parent's (which would normally render bare
    // for a genuinely left-associative operator like `+`) — this is the one
    // precedence level where "equal precedence" must still force parens.
    const leftNeedsParens = native.prec === PREC_CMP ? exprPrec(a) <= native.prec : exprPrec(a) < native.prec;
    const leftStr = leftNeedsParens ? `(${aCode})` : aCode;
    const rightStr = exprPrec(b) <= native.prec ? `(${bCode})` : bCode;
    return `${leftStr} ${native.pyOp} ${rightStr}`;
  }

  // Blanket `not (...)` negation of a whole condition expression (used for
  // the empty-then `if`/setPointer/async rewrites) — deliberately NEVER
  // algebraically flips a comparison operator, which would be unsound in
  // the presence of NaN (same reasoning as emit-ts's/emit-lua's negateCond
  // — see either method's own doc comment).
  private negateCond(cond: IRExpr): string {
    const code = this.emitExpr(cond);
    const operand = exprPrec(cond) < PREC_NOT ? `(${code})` : code;
    return `not ${operand}`;
  }
}

export function emitModulePy(module: IRModule): EmitResult {
  return new Emitter(module).run();
}
