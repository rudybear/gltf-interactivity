// IR -> Lua emitter. Mirrors packages/emit-ts/src/emit.ts's traversal and
// statement order exactly (same class shape, same method-by-method
// breakdown, read that file first) but produces conservative Lua
// 5.1-compatible SYNTAX (locals, functions, if/while, no goto, no integer-
// division operator, no bitwise operators — every int op goes through a
// `m.*` kernel call) so a later luaparse-based tool can read it; it is
// executed on Lua 5.4 via wasmoon (see packages/conformance/src/
// run-compiled-lua.ts). The generated module's shape is:
//
//   return function(rt)
//     local V = rt.vars({ { name = "counter1", decl = rt.int(0.0) }, ... })
//     local E = rt.events({ { name = "Explode", decl = { ... } }, ... })
//     local doN1 = rt.doNState()         -- state slots
//     local proc5                         -- procs, forward-declared then
//     proc5 = function() ... end             defined before handlers
//     rt.onStart(function() ... end)
//   end
//
// Value representation: float=Lua number, int=Lua number (int32 semantics
// via `m.*` calls; every numeric literal is forced to Lua's float subtype —
// see floatLiteral below), bool=Lua boolean, vectors/matrices=1-based Lua
// tables, ref=Lua string. Where a math/type op is PROVABLY spec-identical to
// a native Lua operator over a plain FLOAT-subtype scalar (float add/sub/
// mul/neg/eq/lt/le/gt/ge, and bool eq/and/or/not/xor — see nativeOpInfo
// below), this emitter uses the native operator directly; everything else
// (every int-typed arithmetic/comparison op, vector/matrix math, division,
// and every other op family) still goes through `m.*` calls — see
// nativeOpInfo's own doc comment for exactly why int stays m.* here (Lua
// 5.4's `+`/`-`/`*` on its own INTEGER subtype wraps mod 2^64, not the
// spec's int32; `i32()`/`m.addInt` etc. do the correct wrapping explicitly).
//
// Readability pass (mirrors @gltfi/emit-ts's — see that file's own header
// note and the task report for the full before/after): named vars/events
// (via IR's own display-name computation — @gltfi/ir/display-names.ts,
// shared verbatim with emit-ts/emit-py, NOT copy-pasted), short sequential
// state-slot/temp/continuation/ok names instead of graph-node-id-derived
// ones, native operators in place of `m.*` soup where safe (see above),
// inlined constant pointer-template args (and the whole args table omitted
// when every param inlines), dropped redundant intermediate result
// variables for every stateful/async op read at most once (only throttle's
// two-field read still needs one), `if not x then` for empty-then branches,
// and omitted default-payload `rt.send`/arg-less `rt.log` calls.
//
// KHR_node_selectability/hoverability (onSelect/onHoverIn/onHoverOut) IS
// emitted here (R4 #20-4 — authoring parity with emit-ts's onSelect/
// onHoverIn/onHoverOut cases, which this mirrors), even though the official
// conformance corpus this backend targets never exercises it and
// runtime-lua's rt.onSelect/onHoverIn/onHoverOut are no-op-tolerant
// registration stubs that never fire (see engine.lua's header note) —
// EXECUTION of select/hover stays out of scope, only round-tripping
// authored code that registers these handlers. `params` is destructured to
// plain locals via Lua's multiple-assignment idiom (`local a, b = t.a,
// t.b` — Lua has no object-destructuring syntax) right at the callback's
// top, same shape/intent as emit-ts's `const {...} = params;`.
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
// m.* function-name selection — identical logic to emit-ts's (base name
// derived from the op string, "Int"/"Bool" suffix from the resolved
// overload's input type); the Lua m.lua namespace mirrors runtime-lib's
// math.ts exported surface name-for-name.
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

// `and`/`or`/`not` are Lua keywords — `m.and(...)` is a syntax error (a
// keyword can't follow "." in dot-field syntax), so those three need
// bracket-string field access instead. Every other op base name is a plain
// identifier.
const LUA_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in",
  "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while"
]);

function mCall(fn: string, argsCode: string): string {
  const access = LUA_KEYWORDS.has(fn) ? `m["${fn}"]` : `m.${fn}`;
  return `${access}(${argsCode})`;
}

// ---------------------------------------------------------------------------
// Native-operator substitution: ops provably identical to a plain Lua
// operator over a FLOAT-SUBTYPE scalar (see runtime-lua/src/lua/m.lua's
// add/sub/mul/neg/eq/lt/le/gt/ge/and_/or_/not_/xor — every one of these
// bare Lua operator forms is exactly what those `m.*` functions themselves
// do over Lua numbers/booleans). Deliberately narrower than emit-ts's
// nativeOpInfo in two ways, both load-bearing (see this file's header note
// and the task report's per-language native-operator table):
//
//   - INT arithmetic/comparisons are NEVER natively substituted here, only
//     FLOAT ones. @gltfi/emit-lua's floatLiteral forces every numeric
//     LITERAL into Lua's float subtype, but an int-typed VALUE flowing
//     through this program (any variable, `m.*Int` result, doN/waitAll
//     count, etc.) is routed through `m.toInt32`'s `math.floor`/`%`
//     arithmetic, which Lua 5.4 can legitimately narrow back to its
//     INTEGER subtype (see m.lua's toInt32 doc comment) — a native `+`/`-`/
//     `*` over two Lua INTEGER-subtype operands wraps mod 2^64, not the
//     spec's int32, so every int arithmetic op stays `m.*Int` unconditionally.
//     (int comparisons (eq/lt/le/gt/ge) don't have this int32-wrap concern —
//     Lua int-vs-int comparison is always exact — but are kept `m.*`
//     anyway, deliberately, so a native `==`/`<`/etc. in generated Lua is
//     UNAMBIGUOUSLY float-or-bool-typed: unlike @gltfi/emit-ts (which
//     natively substitutes int comparisons too, and lives with the
//     resulting int-vs-float parse-side ambiguity — see @gltfi/parse-ts's
//     own tryLowerNativeOp comment), this backend's parser never needs an
//     equivalent disambiguation pass.)
//   - DIVISION is never natively substituted (see emit-ts's own `/` case,
//     which DOES substitute it) purely for symmetry with @gltfi/emit-py
//     (whose `/` raises on a zero divisor and so must always stay `m.*`) —
//     Lua's own `/` is safe here (always float division, 0/0 -> nan, x/0 ->
//     +-inf, matching m.div's own semantics exactly), so this restriction is
//     a consistency choice, not a correctness requirement.
// ---------------------------------------------------------------------------

type NativeOp = { kind: "binary"; luaOp: string; prec: number } | { kind: "unary"; luaOp: string; prec: number };

// Lua operator precedence (low to high, see the Lua 5.4 manual's operator
// table): or(1) < and(2) < comparisons(3) < ... < +/-(9) < */ (10) <
// unary(11). Only the levels this emitter's native ops actually touch are
// named here.
const PREC_OR = 1;
const PREC_AND = 2;
const PREC_CMP = 3;
const PREC_ADD = 9;
const PREC_MUL = 10;
const PREC_UNARY = 11;
const ATOM_PREC = 100;

function nativeOpInfo(op: string, overload: ResolvedOverload): NativeOp | null {
  const t = primaryInputSig(overload);
  switch (op) {
    case "math/add":
      return t === "float" ? { kind: "binary", luaOp: "+", prec: PREC_ADD } : null;
    case "math/sub":
      return t === "float" ? { kind: "binary", luaOp: "-", prec: PREC_ADD } : null;
    case "math/mul":
      return t === "float" ? { kind: "binary", luaOp: "*", prec: PREC_MUL } : null;
    case "math/neg":
      return t === "float" ? { kind: "unary", luaOp: "-", prec: PREC_UNARY } : null;
    case "math/eq":
      return t === "float" || t === "bool" ? { kind: "binary", luaOp: "==", prec: PREC_CMP } : null;
    case "math/lt":
      return t === "float" ? { kind: "binary", luaOp: "<", prec: PREC_CMP } : null;
    case "math/le":
      return t === "float" ? { kind: "binary", luaOp: "<=", prec: PREC_CMP } : null;
    case "math/gt":
      return t === "float" ? { kind: "binary", luaOp: ">", prec: PREC_CMP } : null;
    case "math/ge":
      return t === "float" ? { kind: "binary", luaOp: ">=", prec: PREC_CMP } : null;
    case "math/and":
      return t === "bool" ? { kind: "binary", luaOp: "and", prec: PREC_AND } : null;
    case "math/or":
      return t === "bool" ? { kind: "binary", luaOp: "or", prec: PREC_OR } : null;
    case "math/not":
      return t === "bool" ? { kind: "unary", luaOp: "not", prec: PREC_UNARY } : null;
    case "math/xor":
      return t === "bool" ? { kind: "binary", luaOp: "~=", prec: PREC_CMP } : null;
    default:
      return null;
  }
}

// The effective precedence of `expr`'s OWN rendered code, as seen by a
// parent expression deciding whether to parenthesize it — ATOM_PREC (never
// needs parens) for everything except a natively-substituted op.
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

// Every numeric literal is forced into Lua's float (double) subtype — a
// bare integer-looking numeral (e.g. `5`) parses as Lua 5.4's 64-bit
// INTEGER subtype, whose arithmetic (`+`,`-`,`*`) wraps mod 2^64 instead of
// producing a double, unlike JS (where every number is a double). Since
// this runtime's `m.*` kernel functions assume double arithmetic throughout
// (int32 wrapping is applied explicitly via `m.toInt32`, not relied on from
// operand subtype), every literal needs a decimal point/exponent so Lua's
// lexer picks the float subtype — see runtime-lua's m.lua header note.
function floatLiteral(x: number): string {
  if (Number.isNaN(x)) {
    return "(0/0)";
  }
  if (x === Infinity) {
    return "math.huge";
  }
  if (x === -Infinity) {
    return "-math.huge";
  }
  const s = String(x);
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

function luaStringLiteral(s: string): string {
  let out = '"';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20 || code === 0x7f) out += `\\${code}`;
    else out += ch;
  }
  return `${out}"`;
}

function constLiteral(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return data[0] ? "true" : "false";
  }
  if (type === "ref") {
    return luaStringLiteral(String(data[0] ?? ""));
  }
  if (type === "int") {
    return floatLiteral(Math.trunc(Number(data[0] ?? 0)));
  }
  if (type === "float") {
    return floatLiteral(Number(data[0] ?? 0));
  }
  // vector/matrix
  return `{ ${(data as number[]).map((x) => floatLiteral(Number(x))).join(", ")} }`;
}

// `rt.<type>(...)` variable-declaration-shorthand call matching
// runtime-lua's own int/bool/float/float2../ref factory functions exactly
// (see engine.lua) — IRType's own names already coincide with those factory
// names one-for-one, same convention as emit-ts's varDeclCall.
function varDeclCall(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return `rt.bool(${data[0] ? "true" : "false"})`;
  }
  if (type === "ref") {
    return `rt.ref(${luaStringLiteral(String(data[0] ?? ""))})`;
  }
  if (type === "int") {
    return `rt.int(${floatLiteral(Math.trunc(Number(data[0] ?? 0)))})`;
  }
  if (type === "float") {
    return `rt.float(${floatLiteral(Number(data[0] ?? 0))})`;
  }
  const nums = (data as number[]).map((x) => floatLiteral(Number(x)));
  return `rt.${type}(${nums.join(", ")})`;
}

// ---------------------------------------------------------------------------
// Emitter. State-slot/variable display-name computation lives in
// @gltfi/ir/display-names.ts, shared verbatim with @gltfi/emit-ts and
// @gltfi/emit-py — see that file's own doc comment.
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
  private readonly lines: string[] = [];
  private indent = 1; // inside `return function(rt) ... end`
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  private readonly crossHandlerReads = new Set<string>();
  private readonly stateSlotDisplayNames: string[];
  private readonly variableDisplayNames: string[];

  // Per-handler/proc-body-scoped naming state, reset by resetBodyCounters()
  // at the top of every handler/proc body — mirrors emit-ts's identical
  // nextTempNum/nextContNum/nextOkNum/tempRenames exactly.
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

  // Identical traversal to emit-ts's collectCrossHandlerReads — see that
  // file's own doc comment.
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
    this.push("return function(rt)");
    this.emitVars();
    this.emitEvents();
    this.emitStateSlots();
    this.emitProcs();
    this.emitHandlers();
    this.indent -= 1;
    this.push("end");
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

  // `local V = rt.vars({ { name = "counter1", decl = rt.int(0.0) }, ... })`
  // — an ARRAY of named entries (element order == variable index order),
  // not an object keyed by name: a Lua table literal's key/value pairs have
  // no guaranteed iteration order, so the name has to travel alongside each
  // array element instead of being decls' own key (see engine.lua's rt.vars
  // doc comment).
  // Named-entry gains `id = "the-id"` when the source graph variable had an
  // explicit id (module.variables[i].extras.id — see @gltfi/ir's import.ts/
  // export.ts) — engine.lua's rt.vars only ever reads `entry.name`/
  // `entry.decl`, so the extra key is inert at runtime; @gltfi/parse-lua
  // reads it back into extras.id (see parseVarsNamedArray).
  private emitVars() {
    const entries = this.module.variables.map((v, i) => {
      const id = (v.extras as { id?: string } | undefined)?.id;
      const idField = id ? `, id = ${luaStringLiteral(id)}` : "";
      return `{ name = "${this.variableDisplayNames[i]}", decl = ${varDeclCall(v.type, v.initial.data)}${idField} }`;
    });
    this.push(`local V = rt.vars({ ${entries.join(", ")} })`);
  }

  private emitEvents() {
    const entries = this.module.events.map((e) => {
      const fields: string[] = [];
      if (e.id) {
        fields.push(`externalId = ${luaStringLiteral(e.id)}`);
      }
      const boolDefault = e.values.find((v) => v.name === "boolParameter");
      const intDefault = e.values.find((v) => v.name === "intParameter");
      const floatDefault = e.values.find((v) => v.name === "floatParameter");
      const duration = e.values.find((v) => v.name === "expectedDuration");
      if (boolDefault) {
        fields.push(`defaultBool = ${Boolean(boolDefault.default.data[0]) ? "true" : "false"}`);
      }
      if (intDefault) {
        fields.push(`defaultInt = ${floatLiteral(Math.trunc(Number(intDefault.default.data[0] ?? 0)))}`);
      }
      if (floatDefault) {
        fields.push(`defaultFloat = ${floatLiteral(Number(floatDefault.default.data[0] ?? 0))}`);
      }
      if (duration) {
        fields.push(`expectedDuration = ${floatLiteral(Number(duration.default.data[0] ?? 0))}`);
      }
      return `{ name = "${e.name}", decl = { ${fields.join(", ")} } }`;
    });
    this.push(`local E = rt.events({ ${entries.join(", ")} })`);
  }

  // The event's own declared (bool,int,float,duration) defaults — same
  // extraction as emitEvents' own field-by-field lookup above, reused by
  // emitEvent's "does this send's payload match the declared defaults"
  // check (see that method's doc comment).
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
  // omits the payload table entirely for (rt.send falls back to the exact
  // same defaults internally — see engine.lua's rt.send).
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

  // See emit-ts's emitStateSlots doc comment for the full rationale (per-
  // node persisted state registers, mirroring interpreter.ts's NodeState
  // fields one-for-one) — `for` is a bare `local` number register (no
  // factory needed, see engine.lua's header note); every other kind is a
  // state-slot factory call (rt.doNState()/etc — see engine.lua) instead of
  // a hand-written table literal.
  private emitStateSlots() {
    this.module.stateSlots.forEach((slot, i) => {
      const name = this.stateSlotDisplayNames[i];
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`local ${name} = ${floatLiteral(Math.trunc(initial))}`);
          return;
        }
        case "delay":
          this.push(`local ${name} = rt.delayState()`);
          return;
        case "doN":
          this.push(`local ${name} = rt.doNState()`);
          return;
        case "multiGate":
          this.push(`local ${name} = rt.multiGateState()`);
          return;
        case "waitAll":
          this.push(`local ${name} = rt.waitAllState()`);
          return;
        case "throttle":
          this.push(`local ${name} = rt.throttleState()`);
          return;
      }
    });
  }

  // Procs are forward-declared as locals (one `local a, b, c` statement),
  // then each body is assigned via `name = function() ... end` (NOT `local
  // function name() ... end`, which would create a fresh local shadowing
  // the forward declaration) — needed because a proc can call another proc
  // declared later in this same list (module.procs order is not
  // necessarily call order).
  private emitProcs() {
    if (this.module.procs.length > 0) {
      this.push(`local ${this.module.procs.map((p) => p.name).join(", ")}`);
    }
    this.module.procs.forEach((proc) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`proc:${proc.id}`];
      this.handlerEventCtx = null;
      this.resetBodyCounters();
      this.push(`${proc.name} = function()`);
      this.indent += 1;
      this.emitStmt(proc.body);
      this.indent -= 1;
      this.push("end");
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
      this.push("rt.onStart(function()");
      this.indent += 1;
      this.emitEventOutWrites();
      this.emitStmt(handler.body);
      this.indent -= 1;
      this.push("end)");
      return;
    }
    if (handler.kind === "onTick") {
      this.handlerEventCtx = { kind: "onTick" };
      this.resetBodyCounters();
      this.push("rt.onTick(function(timeSinceStart, timeSinceLastTick)");
      this.indent += 1;
      this.emitEventOutWrites();
      this.emitStmt(handler.body);
      this.indent -= 1;
      this.push("end)");
      return;
    }
    if (handler.kind === "receive") {
      if (handler.eventRef === undefined) {
        throw new EmitError("event/receive handler missing eventRef", "event/receive", this.originNodeId);
      }
      this.handlerEventCtx = { kind: "receive", eventRef: handler.eventRef };
      this.resetBodyCounters();
      this.push(`rt.onReceive(${this.eventArgCode(handler.eventRef)}, function(payload)`);
      this.indent += 1;
      this.emitEventOutWrites();
      this.emitStmt(handler.body);
      this.indent -= 1;
      this.push("end)");
      return;
    }
    // KHR_node_selectability/hoverability — not exercised by the official
    // conformance corpus this backend targets, but emitted for authoring
    // parity with emit-ts (see this file's header note); runtime-lua's
    // rt.onSelect/onHoverIn/onHoverOut are no-op-tolerant registration
    // stubs (see engine.lua) — the registration round-trips, it just
    // never fires.
    if (handler.kind === "onSelect") {
      const nodeIndex = Math.trunc(Number((handler.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
      const stopPropagation = Boolean((handler.config as { stopPropagation?: boolean } | undefined)?.stopPropagation);
      this.handlerEventCtx = { kind: "onSelect" };
      this.resetBodyCounters();
      this.push(`rt.onSelect(${floatLiteral(nodeIndex)}, ${stopPropagation ? "true" : "false"}, function(params)`);
      this.indent += 1;
      this.push(
        "local selectedNode, selectedNodeIndex, controllerIndex, selectionPoint, selectionRayOrigin = " +
          "params.selectedNode, params.selectedNodeIndex, params.controllerIndex, params.selectionPoint, params.selectionRayOrigin"
      );
      this.emitEventOutWrites();
      this.emitStmt(handler.body);
      this.indent -= 1;
      this.push("end)");
      return;
    }
    if (handler.kind === "onHoverIn" || handler.kind === "onHoverOut") {
      const nodeIndex = Math.trunc(Number((handler.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
      this.handlerEventCtx = { kind: handler.kind };
      this.resetBodyCounters();
      this.push(`rt.${handler.kind}(${floatLiteral(nodeIndex)}, function(params)`);
      this.indent += 1;
      this.push("local hoveredNode, controllerIndex = params.hoveredNode, params.controllerIndex");
      this.emitEventOutWrites();
      this.emitStmt(handler.body);
      this.indent -= 1;
      this.push("end)");
      return;
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
      this.push(`rt.eventOut(${sourceNode}, ${luaStringLiteral(socket)}, ${value})`);
    }
  }

  // `E.<name>` when the event index is in range (the common case), else a
  // bare numeric literal fallback — same convention as emit-ts's
  // eventArgCode.
  private eventArgCode(eventId: number): string {
    const name = this.module.events[eventId]?.name;
    return name ? `E.${name}` : floatLiteral(eventId);
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
        this.push(`local ${name} = ${code}`);
        return;
      }
      case "if": {
        // An empty "then" with a non-empty "else" reads better negated into
        // a single branch — see emit-ts's identical "if" case doc comment
        // (same idiom, `if not cond then ... end` instead of Lua's own
        // empty-then/else form).
        if (stmt.then.k === "seq" && stmt.then.stmts.length === 0 && stmt.else) {
          const negCode = this.negateCond(stmt.cond);
          this.push(`if ${negCode} then`);
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
          this.push("end");
          return;
        }
        this.push(`if ${this.emitExpr(stmt.cond)} then`);
        this.indent += 1;
        this.emitStmt(stmt.then);
        this.indent -= 1;
        if (stmt.else) {
          this.push("else");
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
        }
        this.push("end");
        return;
      }
      case "while": {
        this.push(`while ${this.emitExpr(stmt.cond)} do`);
        this.indent += 1;
        this.emitStmt(stmt.body);
        this.indent -= 1;
        this.push("end");
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
        // externalId is never passed at the call site — see engine.lua's
        // rt.send doc comment. The payload table itself is omitted too when
        // every value is exactly the event's own declared default.
        const eventArg = this.eventArgCode(stmt.eventId);
        if (this.matchesEventDefaults(stmt.eventId, stmt.args)) {
          this.push(`rt.send(${eventArg})`);
          return;
        }
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.send(${eventArg}, { ${argsCode} })`);
        return;
      }
      case "stopPropagation":
        this.push(`rt.stopPropagation(${this.paramAccess("event")}, ${this.emitExpr(stmt.stopImmediate)})`);
        return;
      case "log": {
        const argsCode = stmt.args.map((a) => this.emitExpr(a));
        if (argsCode.length === 0) {
          this.push(`rt.log(${luaStringLiteral(stmt.template)})`);
        } else {
          this.push(`rt.log(${luaStringLiteral(stmt.template)}, { ${argsCode.join(", ")} })`);
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
  // Async ops — identical logic to emit-ts's emitAsync: each rt.* call
  // returns `{ok=...}`. Since `.ok` is read at most once (the out/err
  // branch check), the call is inlined directly into that check with no
  // intermediate result variable at all — when neither branch exists, the
  // call is emitted as a bare statement (its return value discarded,
  // matching the original always-called semantics exactly).
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
        callCode = `rt.setDelay(${slotName}, ${this.emitExpr(stmt.args[0])}, ${doneCode})`;
        break;
      }
      case "varInterp": {
        const { varId, useSlerp } = (stmt.config ?? {}) as { varId: number; useSlerp: boolean };
        const [value, duration, p1, p2] = stmt.args.map((a) => this.emitExpr(a));
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
        void params;
        const { pointer, argsObj } = this.pointerCall(template, paramArgs);
        const [valueCode, durationCode, p1Code, p2Code] = [value, duration, p1, p2].map((a) => this.emitExpr(a));
        callCode =
          argsObj === null
            ? `rt.ptrInterp(${pointer}, "${stmt.type}", ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode})`
            : `rt.ptrInterp(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode})`;
        break;
      }
      case "animStart": {
        const [animation, startTime, endTime, speed] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.animStart(${animation}, ${startTime}, ${endTime}, ${speed}, ${doneCode})`;
        break;
      }
      case "animStop": {
        callCode = `rt.animStop(${this.emitExpr(stmt.args[0])})`;
        break;
      }
      case "animStopAt": {
        const [animation, stopTime] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.animStopAt(${animation}, ${stopTime}, ${doneCode})`;
        break;
      }
    }
    if (!stmt.out && !stmt.err) {
      this.push(`${callCode}`);
      return;
    }
    // Empty "out" with a present "err" negates the same way the plain "if"
    // case does — `not x.ok` reads as `not (x.ok)` (member access binds
    // tighter than `not`), so no parens are ever needed here either.
    if (!stmt.out && stmt.err) {
      this.push(`if not ${callCode}.ok then`);
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("end");
      return;
    }
    this.push(`if ${callCode}.ok then`);
    this.indent += 1;
    if (stmt.out) this.emitStmt(stmt.out);
    this.indent -= 1;
    if (stmt.err) {
      this.push("else");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
    }
    this.push("end");
  }

  // A `Cont` is either a plain proc reference (just its name) or an inline
  // body, lifted to a synthetic `local function <cont<n>>` declared
  // immediately before the call site that references it — safe for the
  // same reason emit-ts's version is: a Cont body only ever touches module
  // state, never a caller's temps (see @gltfi/ir's GI105 invariant).
  private emitCont(cont: Extract<IRStmt, { k: "async" }>["done"]): string {
    if (!cont) {
      return "nil";
    }
    if (cont.kind === "proc") {
      const proc = this.module.procs[cont.procId];
      if (!proc) {
        throw new EmitError(`unknown proc id ${cont.procId}`, "async.done", this.originNodeId);
      }
      return proc.name;
    }
    const name = this.allocCont();
    this.push(`local function ${name}()`);
    this.indent += 1;
    this.emitStmt(cont.body);
    this.indent -= 1;
    this.push("end");
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops — identical logic to emit-ts's emitStateful: every result
  // field except throttle's is read at most once, so doN/multiGate/waitAll
  // inline the call directly into the `if`/chain and never need a temp;
  // only throttle (whose "invalid" AND "fire" fields are both read) keeps a
  // named result (`ok<n>` — see allocOk).
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = this.stateSlotDisplayNames[slotIndex] ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.count = 0.0`);
          return;
        }
        const call = `rt.doN(${slotName}, ${this.emitExpr(stmt.args[0])})`;
        if (stmt.outs.out) {
          this.push(`if ${call} then`);
          this.indent += 1;
          this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("end");
        } else {
          this.push(`${call}`);
        }
        return;
      }
      case "throttle": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.lastTime = nil`);
          this.push(`${slotName}.remaining = ${floatLiteral(NaN)}`);
          return;
        }
        const durationCode = this.emitExpr(stmt.args[0]);
        if (stmt.outs.out || stmt.outs.err) {
          const resName = this.allocOk();
          this.push(`local ${resName} = rt.throttle(${slotName}, ${durationCode})`);
          this.push(`if ${resName}.invalid then`);
          this.indent += 1;
          if (stmt.outs.err) this.emitStmt(stmt.outs.err);
          this.indent -= 1;
          this.push(`elseif ${resName}.fire then`);
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("end");
        } else {
          this.push(`rt.throttle(${slotName}, ${durationCode})`);
        }
        return;
      }
      case "multiGate": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.used = {}`);
          this.push(`${slotName}.lastIndex = -1.0`);
          return;
        }
        // UTF-16/lexical sort — matches interpreter.ts's/emit-ts's own
        // `Object.keys(flows).sort()` exactly.
        const keys = Object.keys(stmt.outs).sort();
        const isRandom = Boolean((slot?.config as { isRandom?: boolean } | undefined)?.isRandom);
        const isLoop = Boolean((slot?.config as { isLoop?: boolean } | undefined)?.isLoop);
        const call = `rt.multiGate(${slotName}, ${floatLiteral(keys.length)}, ${isRandom ? "true" : "false"}, ${isLoop ? "true" : "false"})`;
        if (keys.length > 1) {
          // Unlike emit-ts's native `switch`, Lua has no construct that
          // evaluates a discriminant exactly once and then compares it
          // against several case labels — an if/elseif chain re-evaluates
          // its OWN condition expression on every clause it reaches, so
          // embedding `call` as literal text in 2+ clause conditions would
          // re-invoke (and re-mutate: `.used`/`.lastIndex`) this stateful op
          // once per failed check. A named result (`ok<n>`, same counter as
          // throttle's — see allocOk) sidesteps that by calling it exactly
          // once up front, same reasoning as throttle's own two-field read.
          const resName = this.allocOk();
          this.push(`local ${resName} = ${call}`);
          keys.forEach((key, i) => {
            this.push(`${i === 0 ? `if ${resName}.index == ${floatLiteral(i)}` : `elseif ${resName}.index == ${floatLiteral(i)}`} then`);
            this.indent += 1;
            this.emitStmt(stmt.outs[key]);
            this.indent -= 1;
          });
          this.push("end");
        } else if (keys.length === 1) {
          // A single wired output is one bare `if`, referencing `call`
          // exactly once — safe to inline directly, same as doN.
          this.push(`if ${call}.index == ${floatLiteral(0)} then`);
          this.indent += 1;
          this.emitStmt(stmt.outs[keys[0]]);
          this.indent -= 1;
          this.push("end");
        } else {
          this.push(`${call}`);
        }
        return;
      }
      case "waitAll": {
        const inputFlows = Number((slot?.config as { inputFlows?: number } | undefined)?.inputFlows ?? 0);
        if (stmt.port === "reset") {
          this.push(`${slotName}.activated = {}`);
          this.push(`${slotName}.remaining = ${floatLiteral(inputFlows)}`);
          return;
        }
        const index = typeof stmt.port === "number" ? stmt.port : 0;
        const call = `rt.waitAll(${slotName}, ${floatLiteral(inputFlows)}, ${floatLiteral(index)})`;
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if ${call}.completed then`);
          this.indent += 1;
          if (stmt.outs.completed) this.emitStmt(stmt.outs.completed);
          this.indent -= 1;
          this.push("else");
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("end");
        } else {
          this.push(`${call}`);
        }
        return;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Intrinsic statements — identical logic to emit-ts's emitIntrinsicStmt.
  // ---------------------------------------------------------------------

  private emitIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>) {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIndex = (stmt.config as { slot?: number }).slot;
      if (slotIndex === undefined) {
        throw new EmitError("flow/setDelay#cancel missing its state slot", stmt.op, this.originNodeId);
      }
      const slotName = this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`;
      this.push(`rt.cancelDelaySlot(${slotName})`);
      return;
    }
    if (stmt.op === "flow/cancelDelay") {
      this.push(`rt.cancelDelay(${this.emitExpr(stmt.args[0])})`);
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
    this.push(`while ${varName} < (${this.emitExpr(stmt.end)}) do`);
    this.indent += 1;
    this.emitStmt(stmt.body);
    this.push(`${varName} = ${varName} + 1.0`);
    this.indent -= 1;
    this.push("end");
    if (stmt.completed) {
      this.emitStmt(stmt.completed);
    }
  }

  // Lua has no switch statement — lowered to an if/elseif chain on the
  // selector's value, with `default` as the final `else`.
  private emitSwitch(stmt: Extract<IRStmt, { k: "switch" }>) {
    const selVar = this.allocTemp();
    this.push(`local ${selVar} = ${this.emitExpr(stmt.selector)}`);
    let first = true;
    for (const [c, body] of stmt.cases) {
      this.push(`${first ? "if" : "elseif"} ${selVar} == ${floatLiteral(c)} then`);
      first = false;
      this.indent += 1;
      this.emitStmt(body);
      this.indent -= 1;
    }
    if (stmt.default) {
      this.push(first ? "if true then" : "else");
      this.indent += 1;
      this.emitStmt(stmt.default);
      this.indent -= 1;
    }
    if (!first || stmt.default) {
      this.push("end");
    }
  }

  private emitSetPointer(stmt: Extract<IRStmt, { k: "setPointer" }>) {
    const { pointer, argsObj } = this.pointerCall(stmt.template, stmt.args);
    const valueCode = this.emitExpr(stmt.value);
    const call = argsObj === null ? `rt.ptrSet(${pointer}, "${stmt.type}", ${valueCode})` : `rt.ptrSet(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode})`;
    if (!stmt.out && !stmt.err) {
      this.push(`${call}`);
      return;
    }
    // Empty "out" with a present "err" negates the same way the plain "if"
    // case does — a bare function-call result is always atomic, so the
    // negation never needs parens.
    if (!stmt.out && stmt.err) {
      this.push(`if not ${call} then`);
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("end");
      return;
    }
    this.push(`if ${call} then`);
    this.indent += 1;
    if (stmt.out) this.emitStmt(stmt.out);
    this.indent -= 1;
    if (stmt.err) {
      this.push("else");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
    }
    this.push("end");
  }

  // Builds the pointer literal + (possibly omitted) args table for a
  // pointer/get|set|interpolate call: any template parameter whose fed
  // value is a compile-time CONSTANT is inlined directly into the path
  // string, and dropped from the args table entirely; only params still fed
  // a dynamic expression remain as `[name]`/`{name}` placeholders with a
  // matching args-table entry. When EVERY param inlines this way, the whole
  // args table is omitted (the runtime accepts both — see engine.lua's
  // ptrGet/ptrSet/ptrInterp). Identical logic/rationale to emit-ts's
  // pointerCall — see that method's own doc comment (same `ref`-params-
  // never-inline caveat: a `ref` param's value is itself a full pointer-
  // shaped string, so inlining it would double up with the template's own
  // surrounding literal segments).
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
    const pointer = luaStringLiteral(formatPointerTemplate({ segments: resolvedSegments }));
    if (remainingParams.length === 0) {
      return { pointer, argsObj: null };
    }
    const codes = remainingArgs.map((a) => this.emitExpr(a));
    const entries = remainingParams.map((p, i) => `${p.name} = ${codes[i]}`);
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
    if (ctx.kind === "receive") {
      // payload is a Lua 1-based table here (vs. TS's 0-based JS array).
      if (name === "boolParameter") return "payload[1]";
      if (name === "intParameter") return "payload[2]";
      if (name === "floatParameter") return "payload[3]";
      if (name === "expectedDuration") return "payload[4]";
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
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      // Lua idiom for TS's `?? inputFlows` — safe here because the LHS
      // (this slot's own numeric field) is never `false`, only a number or
      // `nil`.
      return `(${name}.remaining or ${floatLiteral(inputFlows)})`;
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
      return `m.switchCase(${selCode}, { ${cases.map((c) => floatLiteral(c)).join(", ")} }, { ${valuesCode} }, ${dfltCode})`;
    }
    if (expr.op === "event/receive#payload") {
      const eventIndex = expr.config.eventIndex as number;
      const field = expr.config.field as string;
      // 1-based: Lua's eventPayload tuple, unlike TS's 0-based array.
      const fieldIndex = { boolParameter: 1, intParameter: 2, floatParameter: 3, expectedDuration: 4 }[field];
      return `rt.eventPayload(${this.eventArgCode(eventIndex)})[${fieldIndex}]`;
    }
    if (expr.op === "event/onTick#time") {
      return (expr.config.field as string) === "timeSinceStart" ? "rt.tickTime()" : "rt.tickDelta()";
    }
    if (expr.config?.crossContext === true) {
      const sourceNode = expr.config.sourceNode as number;
      const socket = expr.config.socket as string;
      return `rt.eventOutRead(${sourceNode}, ${luaStringLiteral(socket)})`;
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
      argsCode.push(luaStringLiteral((expr.config?.order as string | undefined) ?? "yxz"));
    }
    const fn = mFunctionName(expr.op, expr.overload);
    const call = mCall(fn, argsCode.join(", "));
    const multiOutput = Object.keys(expr.overload.outputs).length > 1;
    if (expr.socket === undefined) {
      return multiOutput ? `${call}.value` : call;
    }
    if (/^\d+$/.test(expr.socket)) {
      return `${call}[${Number(expr.socket) + 1}]`;
    }
    return `${call}.${expr.socket}`;
  }

  private emitNativeOp(expr: Extract<IRExpr, { k: "op" }>, native: NativeOp): string {
    if (native.kind === "unary") {
      const [a] = expr.args;
      const aCode = this.emitExpr(a);
      const operand = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
      if (native.luaOp === "not") {
        return `not ${operand}`;
      }
      // Avoid `--x` (Lua LINE-COMMENT token) when the operand itself
      // already starts with `-` — a bare `- -x` (space-separated) is the
      // unambiguous fix, mirroring emit-ts's identical `--`-merge guard.
      return operand.startsWith("-") ? `- ${operand}` : `${native.luaOp}${operand}`;
    }
    const [a, b] = expr.args;
    const aCode = this.emitExpr(a);
    const bCode = this.emitExpr(b);
    const leftStr = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
    const rightStr = exprPrec(b) <= native.prec ? `(${bCode})` : bCode;
    return `${leftStr} ${native.luaOp} ${rightStr}`;
  }

  // Blanket `not (...)` negation of a whole condition expression (used for
  // the empty-then `if`/setPointer/async rewrites) — deliberately NEVER
  // algebraically flips a comparison operator, which would be unsound in
  // the presence of NaN (same reasoning as emit-ts's negateCond — see that
  // method's own doc comment).
  private negateCond(cond: IRExpr): string {
    const code = this.emitExpr(cond);
    const operand = exprPrec(cond) < PREC_UNARY ? `(${code})` : code;
    return `not ${operand}`;
  }
}

export function emitModuleLua(module: IRModule): EmitResult {
  return new Emitter(module).run();
}
