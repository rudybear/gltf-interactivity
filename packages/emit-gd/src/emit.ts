// IR -> GDScript emitter. Mirrors packages/emit-py/src/emit.ts's traversal
// and statement order exactly (itself mirroring packages/emit-ts/src/emit.ts
// — see either file's own header for the shared design this whole emitter
// family follows), producing typed GDScript 2.0 source executed by a real
// `godot --headless` subprocess (see packages/conformance/src/
// run-compiled-gd.ts and @gltfi/runtime-gd's harness.gd) rather than a VM or
// dynamic import.
//
// ONE STRUCTURAL DIFFERENCE from every other backend, load-bearing enough to
// justify its own note up top: procs, event handlers, and inline async
// continuations are NEVER nested closures/lambdas here — they are separate
// TOP-LEVEL METHODS on the compiled module class. This was forced by an
// empirical finding (see the task report's lambda-capture probe): GDScript
// lambdas capture enclosing locals BY VALUE at the moment the lambda
// expression is evaluated, not by live reference to the variable slot, so a
// lambda cannot forward-reference a not-yet-assigned local, NOR can it
// recurse through a `var g; g = func(): ... g.call() ...` self-reference
// (both confirmed to fail with a null-Callable runtime error). Real GDScript
// *methods*, by contrast, resolve each other by name at CALL time regardless
// of declaration order (confirmed working, including direct recursion) —
// the safe harbor the task anticipated. Consequently the generated module's
// shape is:
//
//   extends RefCounted
//   var m                                -- injected by harness.gd before build()
//   var rt
//   var V
//   var E
//   var doN1                             -- one `var` per state slot
//   func build(_rt) -> void:
//       rt = _rt
//       V = rt.vars([["counter1", rt.int_var(0)], ...])
//       E = rt.events([["Explode", {...}], ...])
//       doN1 = rt.don_state()
//       rt.on_start(__on_start_0)        -- REGISTRATION only; body is a
//                                            separate top-level func below
//   func proc5() -> void: ...            -- procs (plain top-level methods;
//   func proc2() -> void: ...               proc5 can call proc2 regardless
//                                            of textual order, and either can
//                                            recurse — ordinary GDScript
//                                            method dispatch, no forward-
//                                            declare dance needed)
//   func __on_start_0() -> void: ...      -- handler BODIES, top-level too
//
// Value representation: float=GDScript float (double), int=GDScript int
// (int32 semantics via `m.*` calls — GDScript's own `int` is 64-bit, not
// int32, so every int-typed arithmetic result still needs explicit
// wrapping), bool=GDScript bool, vectors/matrices=0-based GDScript Arrays,
// ref=GDScript String. Where a math/type op is PROVABLY spec-identical to a
// plain GDScript operator over a scalar FLOAT/bool value (float add/sub/mul/
// neg/eq/lt/le/gt/ge, and bool eq/and/or/not/xor — see nativeOpInfo below,
// identical operator SET and precedence table to emit-py's own, since
// GDScript's expression grammar for these follows the same Python-like
// design, `and`/`or`/`not` keywords included), this emitter uses the native
// operator directly; everything else (every int-typed arithmetic/comparison
// op, DIVISION included — see runtime-gd's m.gd header for why GDScript's
// native float `/` was verified safe but is still routed through `m.div` for
// uniformity with every other backend's identical choice — vector/matrix
// math, and every other op family) still goes through `m.*` calls, exactly
// like the other three backends' shared design decision — see
// @gltfi/runtime-gd's gltfi runtime `m.gd`, which mirrors runtime-lib's
// math.ts's exported surface name-for-name EXCEPT a rename table larger than
// Python's (GD_RENAME below — GDScript reserves `and`/`or`/`not` as keywords
// like Python does, AND ALSO ships `floor`/`ceil`/`round`/`sin`/`cos`/`tan`/
// `asin`/`acos`/`atan`/`atan2`/`sinh`/`cosh`/`tanh`/`exp`/`log`/`sqrt`/`pow`/
// `min`/`max`/`abs` as @GlobalScope built-in FUNCTIONS that m.gd's own
// same-named methods would otherwise self-recursively shadow — see m.gd's
// own header for the full empirical rationale) so @gltfi/kernel's
// fn-naming.ts reverse table still works unmodified (base-name/Int-suffix
// logic is identical; only the final rename step differs, same as Python's).
//
// Readability pass (mirrors @gltfi/emit-ts's/@gltfi/emit-lua's/
// @gltfi/emit-py's — see any of those files' own header note): named vars/
// events (via IR's own display-name computation — @gltfi/ir/
// display-names.ts, shared verbatim), short sequential state-slot/temp/
// continuation/ok names instead of graph-node-id-derived ones, native
// operators in place of `m.*` soup where safe, inlined constant
// pointer-template args (whole args Dictionary omitted when every param
// inlines), dropped redundant intermediate result variables for every
// stateful/async op read at most once (multiGate's 2+-output re-check and
// throttle's two-field read still need one — GDScript's `if`/`elif` chain
// re-evaluates its own condition on every clause it reaches, exactly like
// Python's, so the same named-result rule applies), `if not x:` for
// empty-then branches, and omitted default-payload `rt.send`/arg-less
// `rt.log_msg` calls.
//
// Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
// onHoverOut) is intentionally NOT emitted here — see @gltfi/runtime-gd's
// engine.gd header note for why (viewer-only, never exercised by the
// conformance corpus this backend targets), same scope decision as every
// other backend.
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
// m.* function-name selection — identical base-name/Int-suffix logic to
// emit-ts's/emit-lua's/emit-py's; GD_RENAME is the only difference from
// those (a strict superset of emit-py's PY_RENAME — see this file's own
// header note for exactly why GDScript needs more renames than Python does).
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
  return GD_RENAME[fn] ?? fn;
}

// Bare (no Int-suffix) forms only — "andInt"/"orInt"/"notInt"/"absInt"/
// "minInt"/"maxInt"/"roundInt" etc. are all perfectly legal GDScript
// identifiers as-is, same carve-out as Python's PY_RENAME.
const GD_RENAME: Record<string, string> = {
  and: "and_",
  or: "or_",
  not: "not_",
  abs: "abs_",
  min: "min_",
  max: "max_",
  pow: "pow_",
  round: "round_",
  floor: "floor_",
  ceil: "ceil_",
  sin: "sin_",
  cos: "cos_",
  tan: "tan_",
  asin: "asin_",
  acos: "acos_",
  atan: "atan_",
  atan2: "atan2_",
  sinh: "sinh_",
  cosh: "cosh_",
  tanh: "tanh_",
  exp: "exp_",
  log: "log_",
  log2: "log2_",
  log10: "log10_",
  sqrt: "sqrt_"
};

function mCall(fn: string, argsCode: string): string {
  return `m.${fn}(${argsCode})`;
}

// ---------------------------------------------------------------------------
// Native-operator substitution — identical operator SET, precedence table,
// and int/division exclusions to emit-py's own (see that file's header for
// the full rationale, repeated only where GDScript itself differs):
//   - INT arithmetic is NEVER natively substituted (only FLOAT is): GDScript
//     `int` is 64-bit, not the spec's int32, so a native `+`/`-`/`*` over two
//     int-typed values would silently compute the wrong (64-bit-wrapping,
//     not 32-bit-wrapping) result — every int arithmetic op stays `m.*Int`
//     unconditionally, same reasoning as every other backend.
//   - DIVISION is never natively substituted, even though GDScript's native
//     float `/` was verified (via probe) to already match IEEE-754/JS
//     exactly (no ZeroDivisionError the way Python's does) — kept as `m.div`
//     anyway purely for uniformity with the other three backends' identical
//     "every division is `m.*`" rule, not a correctness requirement here.
// ---------------------------------------------------------------------------

type NativeOp = { kind: "binary"; gdOp: string; prec: number } | { kind: "unary"; gdOp: string; prec: number };

// GDScript operator precedence (low to high, relevant levels only) mirrors
// Python's: or(1) < and(2) < not x(3) < comparisons(4) < +/-(6) < */ (7) <
// unary +/-(8).
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
      return t === "float" ? { kind: "binary", gdOp: "+", prec: PREC_ADD } : null;
    case "math/sub":
      return t === "float" ? { kind: "binary", gdOp: "-", prec: PREC_ADD } : null;
    case "math/mul":
      return t === "float" ? { kind: "binary", gdOp: "*", prec: PREC_MUL } : null;
    case "math/neg":
      return t === "float" ? { kind: "unary", gdOp: "-", prec: PREC_UNARY_MINUS } : null;
    case "math/eq":
      return t === "float" || t === "bool" ? { kind: "binary", gdOp: "==", prec: PREC_CMP } : null;
    case "math/lt":
      return t === "float" ? { kind: "binary", gdOp: "<", prec: PREC_CMP } : null;
    case "math/le":
      return t === "float" ? { kind: "binary", gdOp: "<=", prec: PREC_CMP } : null;
    case "math/gt":
      return t === "float" ? { kind: "binary", gdOp: ">", prec: PREC_CMP } : null;
    case "math/ge":
      return t === "float" ? { kind: "binary", gdOp: ">=", prec: PREC_CMP } : null;
    case "math/and":
      return t === "bool" ? { kind: "binary", gdOp: "and", prec: PREC_AND } : null;
    case "math/or":
      return t === "bool" ? { kind: "binary", gdOp: "or", prec: PREC_OR } : null;
    case "math/not":
      return t === "bool" ? { kind: "unary", gdOp: "not", prec: PREC_NOT } : null;
    case "math/xor":
      return t === "bool" ? { kind: "binary", gdOp: "!=", prec: PREC_CMP } : null;
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

function gdFloatLiteral(x: number): string {
  if (Number.isNaN(x)) {
    return "NAN";
  }
  if (x === Infinity) {
    return "INF";
  }
  if (x === -Infinity) {
    return "-INF";
  }
  const s = String(x);
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

function gdIntLiteral(x: number): string {
  return String(Math.trunc(x));
}

// Control characters below 0x20/0x7f use `\uXXXX` (confirmed via probe to
// parse correctly in GDScript 2.0 string literals) — GDScript has no `\xXX`
// 2-digit hex escape the way Python does.
function gdStringLiteral(s: string): string {
  let out = '"';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20 || code === 0x7f) out += `\\u${code.toString(16).padStart(4, "0")}`;
    else out += ch;
  }
  return `${out}"`;
}

function constLiteral(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return data[0] ? "true" : "false";
  }
  if (type === "ref") {
    return gdStringLiteral(String(data[0] ?? ""));
  }
  if (type === "int") {
    return gdIntLiteral(Math.trunc(Number(data[0] ?? 0)));
  }
  if (type === "float") {
    return gdFloatLiteral(Number(data[0] ?? 0));
  }
  // vector/matrix
  return `[${(data as number[]).map((x) => gdFloatLiteral(Number(x))).join(", ")}]`;
}

// `rt.<type>_var(...)`/`rt.floatN(...)` variable-declaration-shorthand call
// matching runtime-gd's own engine.gd factory methods exactly — `*_var`
// suffix on the scalar names only (`int`/`bool`/`float` are reserved
// GDScript TYPE KEYWORDS, illegal as method names outright, unlike Python's
// merely-a-builtin `int`/`bool`/`float`/`round`/`abs`/`min`/`max`/`pow` —
// same GD_RENAME-style convention as this file's own m.* naming, applied
// here for a stricter reason). Matrix forms always pass every component as
// a separate positional arg (GDScript has no `*values: float` variadic
// parameter the way Python's `rt.float4x4(*values)` uses — see engine.gd's
// own header note on its float2x2/float3x3/float4x4 signatures).
function varDeclCall(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return `rt.bool_var(${data[0] ? "true" : "false"})`;
  }
  if (type === "ref") {
    return `rt.ref_var(${gdStringLiteral(String(data[0] ?? ""))})`;
  }
  if (type === "int") {
    return `rt.int_var(${gdIntLiteral(Math.trunc(Number(data[0] ?? 0)))})`;
  }
  if (type === "float") {
    return `rt.float_var(${gdFloatLiteral(Number(data[0] ?? 0))})`;
  }
  const nums = (data as number[]).map((x) => gdFloatLiteral(Number(x)));
  return `rt.${type}(${nums.join(", ")})`;
}

// ---------------------------------------------------------------------------
// Emitter. State-slot/variable display-name computation lives in
// @gltfi/ir/display-names.ts, shared verbatim with the other backends.
// ---------------------------------------------------------------------------

type HandlerEventCtx = { kind: "onStart" } | { kind: "onTick" } | { kind: "receive"; eventRef: number };

// One handler, fully planned before any code is emitted for it — `regCode`
// is the ONE line appended inside `build()`'s body (a bare registration
// call: `rt.on_start(__on_start_0)`); `funcName`/`paramsCode`/`body` describe
// the separate TOP-LEVEL method emitted after every proc (see this file's
// own header note for why handler bodies can never be nested inside
// `build()` the way Python's nested `def`s are).
type PlannedHandler = {
  handler: IRHandler;
  index: number;
  regCode: string;
  funcName: string;
  paramsCode: string;
};

class Emitter {
  private readonly module: IRModule;
  private readonly lines: string[] = [];
  private indent = 0;
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  private readonly crossHandlerReads = new Set<string>();
  private readonly stateSlotDisplayNames: string[];
  private readonly variableDisplayNames: string[];

  // Per-handler/proc-body-scoped naming state, reset by resetBodyCounters()
  // at the top of every handler/proc body — mirrors emit-ts's/emit-lua's/
  // emit-py's identical nextTempNum/nextOkNum/tempRenames exactly.
  //
  // `nextContNum` is the ONE deliberate exception, and does NOT reset per
  // body: Python's/Lua's/TS's `contN` are nested closures local to their
  // OWN enclosing proc/handler, so two different handlers can each safely
  // define their own "cont1" with no collision. GDScript's `contN` are
  // TOP-LEVEL sibling methods on the same class (see this file's own header
  // note on why), so reusing "cont1" across two different handlers would
  // emit a duplicate `func cont1():` — a genuine GDScript parse error
  // (confirmed empirically: this was exactly the reload() error-43 bug the
  // first real conformance run surfaced) — so this counter is allocated
  // from ONE whole-module sequence instead, guaranteeing every synthesized
  // continuation method name is globally unique across the entire file.
  private nextTempNum = 0;
  private nextContNum = 0;
  private nextOkNum = 0;
  private tempRenames = new Map<string, string>();

  private resetBodyCounters() {
    this.nextTempNum = 0;
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

  // Identical traversal to emit-ts's/emit-lua's/emit-py's
  // collectCrossHandlerReads — see any of those files' own doc comment.
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
    this.lines.push("extends RefCounted", "");
    this.lines.push("var m");
    this.lines.push("var rt");
    this.lines.push("var V");
    this.lines.push("var E");
    this.module.stateSlots.forEach((_slot, i) => {
      this.lines.push(`var ${this.stateSlotDisplayNames[i]}`);
    });
    this.lines.push("");

    // Plan every handler BEFORE emitting build() — its registration line
    // needs the handler's own synthesized name/eventArgCode, and the actual
    // body is emitted afterward as a separate top-level func (see this
    // file's own header note).
    const planned = this.planHandlers();

    this.lines.push("func build(_rt) -> void:");
    this.indent = 1;
    this.push("rt = _rt");
    this.emitVars();
    this.emitEvents();
    this.emitStateSlots();
    for (const p of planned) {
      this.push(p.regCode);
    }
    this.indent = 0;
    this.lines.push("");

    this.emitProcs();
    this.emitHandlerBodies(planned);

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

  // Emits `stmt` as the sole body of a just-opened GDScript indented block,
  // inserting a `pass` if it produced no lines — GDScript (like Python, and
  // unlike Lua's `do...end`/TS's `{}`) has no way to write a syntactically
  // empty block, so every block-opening call site must route through this
  // instead of calling emitStmt directly.
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

  // `V = rt.vars([["counter1", rt.int_var(0)], ...])` — Array-of-pairs form
  // (NOT a Dictionary — see engine.gd's `vars()` doc comment for why: it
  // sidesteps ever needing to rely on GDScript Dictionary insertion-order
  // preservation). Array element order IS the variable index order.
  private emitVars() {
    const entries = this.module.variables.map(
      (v, i) => `[${gdStringLiteral(this.variableDisplayNames[i])}, ${varDeclCall(v.type, v.initial.data)}]`
    );
    this.push(`V = rt.vars([${entries.join(", ")}])`);
  }

  private emitEvents() {
    const entries = this.module.events.map((e) => {
      const fields: string[] = [];
      if (e.id) {
        fields.push(`"externalId": ${gdStringLiteral(e.id)}`);
      }
      const boolDefault = e.values.find((v) => v.name === "boolParameter");
      const intDefault = e.values.find((v) => v.name === "intParameter");
      const floatDefault = e.values.find((v) => v.name === "floatParameter");
      const duration = e.values.find((v) => v.name === "expectedDuration");
      if (boolDefault) {
        fields.push(`"defaultBool": ${Boolean(boolDefault.default.data[0]) ? "true" : "false"}`);
      }
      if (intDefault) {
        fields.push(`"defaultInt": ${gdIntLiteral(Math.trunc(Number(intDefault.default.data[0] ?? 0)))}`);
      }
      if (floatDefault) {
        fields.push(`"defaultFloat": ${gdFloatLiteral(Number(floatDefault.default.data[0] ?? 0))}`);
      }
      if (duration) {
        fields.push(`"expectedDuration": ${gdFloatLiteral(Number(duration.default.data[0] ?? 0))}`);
      }
      return `[${gdStringLiteral(e.name)}, {${fields.join(", ")}}]`;
    });
    this.push(`E = rt.events([${entries.join(", ")}])`);
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

  // Every declared `var <name>` at class scope (see run()) is assigned here
  // — no re-declaration, since GDScript would reject a second `var` for the
  // same name inside build().
  private emitStateSlots() {
    this.module.stateSlots.forEach((slot, i) => {
      const name = this.stateSlotDisplayNames[i];
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`${name} = ${gdIntLiteral(Math.trunc(initial))}`);
          return;
        }
        case "delay":
          this.push(`${name} = rt.delay_state()`);
          return;
        case "doN":
          this.push(`${name} = rt.don_state()`);
          return;
        case "multiGate":
          this.push(`${name} = rt.multi_gate_state()`);
          return;
        case "waitAll":
          this.push(`${name} = rt.wait_all_state()`);
          return;
        case "throttle":
          this.push(`${name} = rt.throttle_state()`);
          return;
      }
    });
  }

  // Procs are plain top-level methods — GDScript resolves a method
  // reference by name at CALL time (confirmed via probe: forward references
  // and direct recursion both work), so unlike the Lua backend's forward-
  // declare-then-assign dance, proc5 can freely call proc2 regardless of
  // which is defined first in this file.
  private emitProcs() {
    this.module.procs.forEach((proc) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`proc:${proc.id}`];
      this.handlerEventCtx = null;
      this.resetBodyCounters();
      this.push(`func ${proc.name}() -> void:`);
      this.indent = 1;
      this.emitBlock(proc.body);
      this.indent = 0;
      this.lines.push("");
      this.flushPendingConts();
    });
  }

  // First pass: decide every handler's synthesized name + registration call
  // (needs to run BEFORE build() closes) without emitting any body code yet.
  private planHandlers(): PlannedHandler[] {
    return this.module.handlers.map((handler, index) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`handler:${index}`];
      if (handler.kind === "onStart") {
        const funcName = `__on_start_${index}`;
        return { handler, index, funcName, paramsCode: "", regCode: `rt.on_start(${funcName})` };
      }
      if (handler.kind === "onTick") {
        const funcName = `__on_tick_${index}`;
        return {
          handler,
          index,
          funcName,
          paramsCode: "time_since_start: float, time_since_last_tick: float",
          regCode: `rt.on_tick(${funcName})`
        };
      }
      if (handler.kind === "receive") {
        if (handler.eventRef === undefined) {
          throw new EmitError("event/receive handler missing eventRef", "event/receive", this.originNodeId);
        }
        const funcName = `__on_receive_${index}`;
        return {
          handler,
          index,
          funcName,
          paramsCode: "payload: Array",
          regCode: `rt.on_receive(${this.eventArgCode(handler.eventRef)}, ${funcName})`
        };
      }
      // KHR_node_selectability/hoverability — viewer-only, never emitted by
      // the official conformance corpus this backend targets, same scope
      // decision as every other backend.
      throw new EmitError(
        `handler kind "${handler.kind}" is not supported by the GDScript backend (KHR_node_selectability/hoverability is viewer-only)`,
        handler.kind,
        this.originNodeId
      );
    });
  }

  // Second pass: the actual top-level `func __on_start_0(...) -> void:`
  // bodies, emitted after every proc.
  private emitHandlerBodies(planned: PlannedHandler[]) {
    planned.forEach(({ handler, index, funcName, paramsCode }) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`handler:${index}`];
      this.handlerEventCtx =
        handler.kind === "onStart"
          ? { kind: "onStart" }
          : handler.kind === "onTick"
            ? { kind: "onTick" }
            : { kind: "receive", eventRef: handler.eventRef as number };
      this.resetBodyCounters();
      this.push(`func ${funcName}(${paramsCode}) -> void:`);
      this.indent = 1;
      this.emitHandlerBody(handler.body);
      this.indent = 0;
      this.lines.push("");
      this.flushPendingConts();
    });
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
      this.push(`rt.event_out(${sourceNode}, ${gdStringLiteral(socket)}, ${value})`);
    }
  }

  // `E["<name>"]` when the event index is in range (the common case), else
  // a bare numeric literal fallback — GDScript Dictionaries support bracket
  // subscript access natively, same convention as every other backend's
  // eventArgCode.
  private eventArgCode(eventId: number): string {
    const name = this.module.events[eventId]?.name;
    return name ? `E[${gdStringLiteral(name)}]` : String(eventId);
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
        this.push(`var ${name} = ${code}`);
        return;
      }
      case "if": {
        // An empty "then" with a non-empty "else" reads better negated into
        // a single branch — same idiom as every other backend's identical
        // "if" case.
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
        this.push(`V.${this.varName(stmt.varId)} = ${code}`);
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
          this.push(`rt.log_msg(${gdStringLiteral(stmt.template)})`);
        } else {
          this.push(`rt.log_msg(${gdStringLiteral(stmt.template)}, [${argsCode.join(", ")}])`);
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
  // Async ops — identical logic to every other backend's emitAsync: each
  // rt.* call returns `{"ok": ...}`. Since "ok" is read at most once (the
  // out/err branch check), the call is inlined directly into that check
  // with no intermediate result variable at all.
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
        callCode = `rt.set_delay(${slotName}, ${this.emitExpr(stmt.args[0])}, ${doneCode})`;
        break;
      }
      case "varInterp": {
        const { varId, useSlerp } = (stmt.config ?? {}) as { varId: number; useSlerp: boolean };
        const [value, duration, p1, p2] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.var_interp(${varId}, ${value}, ${duration}, ${p1}, ${p2}, ${useSlerp ? "true" : "false"}, ${doneCode})`;
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
  // Callable value — NOT called here; a bare top-level method name used as
  // an expression IS a bound Callable in GDScript, confirmed via probe) or
  // an inline body, lifted to a synthetic TOP-LEVEL `func <cont<n>>()`
  // declared as its own method (NOT nested — see this file's own header
  // note) immediately alongside the proc/handler that references it. Safe
  // for the same reason every other backend's version is: a Cont body only
  // ever touches module state, never a caller's temps (see @gltfi/ir's
  // GI105 invariant) — but unlike Python's nested-def version, this
  // synthetic method is appended to a side buffer and spliced in as its own
  // top-level func rather than emitted inline, since GDScript has no nested
  // function/closure form safe to use here at all (see the lambda-capture
  // note up top).
  private emitCont(cont: Extract<IRStmt, { k: "async" }>["done"]): string {
    if (!cont) {
      return "Callable()";
    }
    if (cont.kind === "proc") {
      const proc = this.module.procs[cont.procId];
      if (!proc) {
        throw new EmitError(`unknown proc id ${cont.procId}`, "async.done", this.originNodeId);
      }
      return proc.name;
    }
    const name = this.allocCont();
    this.pendingConts.push({ name, body: cont.body });
    return name;
  }

  // Side buffer for emitCont's synthetic continuation methods — flushed
  // (as top-level funcs, right after the proc/handler body that referenced
  // them) by flushPendingConts, called at the end of emitProcs'/
  // emitHandlerBodies' per-item loop body.
  private pendingConts: Array<{ name: string; body: IRStmt }> = [];

  private flushPendingConts() {
    const conts = this.pendingConts;
    this.pendingConts = [];
    for (const { name, body } of conts) {
      this.push(`func ${name}() -> void:`);
      this.indent += 1;
      this.emitBlock(body);
      this.indent -= 1;
      this.lines.push("");
    }
  }

  // ---------------------------------------------------------------------
  // Stateful ops — identical logic to every other backend's emitStateful:
  // every result field except throttle's/multiGate's is read at most once,
  // so doN/waitAll inline the call directly into the `if` and never need a
  // temp. multiGate is the same GDScript-specific exception Python/Lua both
  // document: unlike TS's native `switch` (evaluates its discriminant
  // exactly once), GDScript's `if`/`elif` chain re-evaluates ITS OWN
  // condition expression on every clause it reaches, so a 2+-output
  // multiGate needs a named result the same way throttle does.
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = this.stateSlotDisplayNames[slotIndex] ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`${slotName}["count"] = 0.0`);
          return;
        }
        const call = `rt.don(${slotName}, ${this.emitExpr(stmt.args[0])})`;
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
          this.push(`${slotName}.erase("lastTime")`);
          this.push(`${slotName}["remaining"] = ${gdFloatLiteral(NaN)}`);
          return;
        }
        const durationCode = this.emitExpr(stmt.args[0]);
        if (stmt.outs.out || stmt.outs.err) {
          const resName = this.allocOk();
          this.push(`var ${resName} = rt.throttle(${slotName}, ${durationCode})`);
          this.push(`if ${resName}["invalid"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.err ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push(`elif ${resName}["fire"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.out ?? { k: "seq", stmts: [] });
          this.indent -= 1;
        } else {
          this.push(`rt.throttle(${slotName}, ${durationCode})`);
        }
        return;
      }
      case "multiGate": {
        if (stmt.port === "reset") {
          this.push(`${slotName}["used"] = []`);
          this.push(`${slotName}["lastIndex"] = -1.0`);
          return;
        }
        // UTF-16/lexical sort — matches interpreter.ts's/every backend's own
        // `Object.keys(flows).sort()` exactly.
        const keys = Object.keys(stmt.outs).sort();
        const isRandom = Boolean((slot?.config as { isRandom?: boolean } | undefined)?.isRandom);
        const isLoop = Boolean((slot?.config as { isLoop?: boolean } | undefined)?.isLoop);
        const call = `rt.multi_gate(${slotName}, ${keys.length}, ${isRandom ? "true" : "false"}, ${isLoop ? "true" : "false"})`;
        if (keys.length > 1) {
          const resName = this.allocOk();
          this.push(`var ${resName} = ${call}`);
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
          this.push(`${slotName}["activated"] = []`);
          this.push(`${slotName}["remaining"] = ${gdFloatLiteral(inputFlows)}`);
          return;
        }
        const index = typeof stmt.port === "number" ? stmt.port : 0;
        const call = `rt.wait_all(${slotName}, ${inputFlows}, ${index})`;
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
  // Intrinsic statements — identical logic to every other backend's
  // emitIntrinsicStmt.
  // ---------------------------------------------------------------------

  private emitIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>) {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIndex = (stmt.config as { slot?: number }).slot;
      if (slotIndex === undefined) {
        throw new EmitError("flow/setDelay#cancel missing its state slot", stmt.op, this.originNodeId);
      }
      const slotName = this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`;
      this.push(`rt.cancel_delay_slot(${slotName})`);
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
    this.push(`${varName} = ${this.emitExpr(stmt.start)}`);
    this.push(`while ${varName} < (${this.emitExpr(stmt.end)}):`);
    this.indent += 1;
    this.emitStmt(stmt.body);
    this.push(`${varName} = ${varName} + 1`);
    this.indent -= 1;
    if (stmt.completed) {
      this.emitStmt(stmt.completed);
    }
  }

  // GDScript's `match` exists but (like Python's lack of a switch statement)
  // isn't used here — an if/elif chain on the selector's value keeps this
  // backend's multiGate/switch lowering uniform with every sibling backend,
  // `default` as the final `else`.
  private emitSwitch(stmt: Extract<IRStmt, { k: "switch" }>) {
    const selVar = this.allocTemp();
    this.push(`var ${selVar} = ${this.emitExpr(stmt.selector)}`);
    let first = true;
    for (const [c, body] of stmt.cases) {
      this.push(`${first ? "if" : "elif"} ${selVar} == ${c}:`);
      first = false;
      this.indent += 1;
      this.emitBlock(body);
      this.indent -= 1;
    }
    if (stmt.default) {
      this.push(first ? "if true:" : "else:");
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

  // Builds the pointer literal + (possibly omitted) args Dictionary for a
  // pointer/get|set|interpolate call: any template parameter whose fed
  // value is a compile-time CONSTANT is inlined directly into the path
  // string, and dropped from the args Dictionary entirely; only params
  // still fed a dynamic expression remain as `[name]`/`{name}` placeholders
  // with a matching args-Dictionary entry. When EVERY param inlines this
  // way, the whole args Dictionary is omitted (the runtime accepts both —
  // see engine.gd's ptr_get/ptr_set/ptr_interp). Identical logic/rationale
  // to every other backend's pointerCall.
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
    const pointer = gdStringLiteral(formatPointerTemplate({ segments: resolvedSegments }));
    if (remainingParams.length === 0) {
      return { pointer, argsObj: null };
    }
    const codes = remainingArgs.map((a) => this.emitExpr(a));
    const entries = remainingParams.map((p, i) => `${gdStringLiteral(p.name)}: ${codes[i]}`);
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
        return `V.${this.varName(expr.varId)}`;
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
      // payload is a 0-based GDScript Array here, matching the TS/Python
      // backends' 0-based convention (unlike the Lua backend's 1-based one).
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
      return name;
    }
    if (slot.kind === "doN" && field === "currentCount") {
      return `${name}["count"]`;
    }
    if (slot.kind === "multiGate" && field === "lastIndex") {
      return `${name}["lastIndex"]`;
    }
    if (slot.kind === "delay" && field === "lastDelay") {
      return `${name}["lastRef"]`;
    }
    if (slot.kind === "throttle" && field === "lastRemainingTime") {
      return `${name}["remaining"]`;
    }
    if (slot.kind === "waitAll" && field === "remainingInputs") {
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      // GDScript idiom for TS's `?? inputFlows` — NOT `x.get("remaining", inputFlows) or inputFlows`-style
      // (GDScript `or` treats 0 as falsy too, wrongly substituting inputFlows once remaining genuinely
      // reaches 0). An explicit key-membership check is the safe nullish-coalesce equivalent here.
      return `(${name}["remaining"] if ${name}.has("remaining") else ${gdFloatLiteral(inputFlows)})`;
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
      const fieldIndex = { boolParameter: 0, intParameter: 1, floatParameter: 2, expectedDuration: 3 }[field];
      return `rt.event_payload(${this.eventArgCode(eventIndex)})[${fieldIndex}]`;
    }
    if (expr.op === "event/onTick#time") {
      return (expr.config.field as string) === "timeSinceStart" ? "rt.tick_time()" : "rt.tick_delta()";
    }
    if (expr.config?.crossContext === true) {
      const sourceNode = expr.config.sourceNode as number;
      const socket = expr.config.socket as string;
      return `rt.event_out_read(${sourceNode}, ${gdStringLiteral(socket)})`;
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
      argsCode.push(gdStringLiteral((expr.config?.order as string | undefined) ?? "yxz"));
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
      if (native.gdOp === "not") {
        return `not ${operand}`;
      }
      // Avoid a `- -x` token-merge ambiguity — purely a readability nicety
      // here (GDScript has no decrement operator either), same guard as
      // every other backend's identical unary-neg check.
      return operand.startsWith("-") ? `- ${operand}` : `${native.gdOp}${operand}`;
    }
    const [a, b] = expr.args;
    const aCode = this.emitExpr(a);
    const bCode = this.emitExpr(b);
    // GDScript, like Python, has no chained-comparison sugar (`a < b < c`)
    // built in, but its comparison operators are still ordinary same-
    // precedence LEFT-ASSOCIATIVE binary operators — a comparison-family
    // result (eq/lt/le/gt/ge/xor, all PREC_CMP) used as either operand of
    // ANOTHER comparison must still always be parenthesized (this is the
    // one precedence level where "equal precedence" must still force
    // parens), same defensive rule as every other backend's identical
    // nativeOpInfo-consuming code, kept here even though GDScript can't
    // silently reinterpret it as Python's chaining sugar would — the
    // alternative (a bool compared against a number) is exactly as wrong.
    const leftNeedsParens = native.prec === PREC_CMP ? exprPrec(a) <= native.prec : exprPrec(a) < native.prec;
    const leftStr = leftNeedsParens ? `(${aCode})` : aCode;
    const rightStr = exprPrec(b) <= native.prec ? `(${bCode})` : bCode;
    return `${leftStr} ${native.gdOp} ${rightStr}`;
  }

  // Blanket `not (...)` negation of a whole condition expression (used for
  // the empty-then `if`/setPointer/async rewrites) — deliberately NEVER
  // algebraically flips a comparison operator, which would be unsound in
  // the presence of NaN (same reasoning as every other backend's
  // negateCond).
  private negateCond(cond: IRExpr): string {
    const code = this.emitExpr(cond);
    const operand = exprPrec(cond) < PREC_NOT ? `(${code})` : code;
    return `not ${operand}`;
  }
}

export function emitModuleGd(module: IRModule): EmitResult {
  return new Emitter(module).run();
}
