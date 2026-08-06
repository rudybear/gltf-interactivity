// IR -> C# emitter. Mirrors packages/emit-py/src/emit.ts's traversal
// (itself mirroring packages/emit-ts/src/emit.ts's/packages/emit-lua/src/
// emit.ts's — read any of the three first) method-by-method, but produces
// typed C# 12/.NET 8 source compiled ONCE per test by @gltfi/runtime-cs's
// Harness.cs (Roslyn in-memory compilation) rather than interpreted or
// dynamically imported. The generated module's shape is:
//
//   using System.Collections.Generic;
//   using GltfiRuntime;
//
//   namespace GltfiCompiled;
//
//   public static class Module
//   {
//       public sealed class Vars
//       {
//           private readonly Engine E;
//           public Vars(Engine e) { E = e; }
//           public int counter1 { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
//           ...
//       }
//
//       public static class Events
//       {
//           public const int Explode = 0;
//           ...
//       }
//
//       public static void Build(Engine rt)
//       {
//           rt.DeclareVar("int", 0);                    -- declaration order IS variable index order
//           rt.DeclareEvent(null, false, 0, 0.0, null);  -- declaration order IS event index order
//           var V = new Vars(rt);
//           var doN1 = new DoNState();                   -- state slots: Build()-level locals,
//           ...                                              closed over by every nested local
//                                                             function below (C# local functions
//                                                             capture enclosing locals by
//                                                             reference, exactly like Python's
//                                                             nested defs closing over `S`/`V` —
//                                                             no forward-declare dance needed,
//                                                             unlike the Lua backend's).
//           void Proc5() { ... }
//           void OnStart0() { ... }
//           rt.OnStart(OnStart0);
//       }
//   }
//
// Value representation: float=C# `double`, int=C# `int` (int32 semantics —
// see nativeOpInfo below for how much of this is a NATIVE C# operator, not a
// M.* call, unlike the Python backend), bool=C# `bool`, vectors/matrices=
// 0-based C# `double[]`, ref=C# `string`. Multi-output ops return C# named
// ValueTuples (`(double[] Value, bool IsValid)` etc — see @gltfi/runtime-cs's
// M.cs/KMath.cs) accessed via `.PascalCase(socket)`.
//
// Native-operator substitution is BROADER here than the Python/Lua
// backends' (see each one's own nativeOpInfo doc comment for why THEY had
// to stay narrow): C#'s `double` arithmetic (+ - * /) and comparisons are
// already fully IEEE-754-compliant (div-by-zero -> +-Inf/NaN, no
// exceptions), and C# `int` arithmetic (+ - * unary-) silently wraps on
// overflow in the default UNCHECKED compilation context (see
// GltfiRuntime.csproj's own header note — this project deliberately never
// sets `<CheckForOverflowUnderflow>true</...>`), which is bit-for-bit
// identical to the spec's int32 wraparound with no `unchecked(...)` wrapper
// needed at any call site. Two things do NOT get natively substituted even
// though they'd read fine: int division/remainder (`/`/`%` on C# `int`
// THROWS DivideByZeroException for a zero divisor, unlike `double`'s safe
// IEEE behavior — routed through M.DivInt/M.RemInt, which go through
// `double` arithmetic internally) and float remainder (kept `M.Rem`
// uniformly, matching the Python/Lua backends' identical choice — no
// correctness reason, just consistency). See the task report's full
// per-language native-operator table.
//
// KHR_node_selectability/hoverability (onSelect/onHoverIn/onHoverOut) IS
// emitted here (R4 #20-4 — authoring parity with emit-ts's onSelect/
// onHoverIn/onHoverOut cases, which this mirrors, same as emit-lua/emit-py),
// even though the official conformance corpus this backend targets never
// exercises it and runtime-cs's rt.OnSelect/OnHoverIn/OnHoverOut are no-op-
// tolerant registration stubs that never fire (see Engine.cs's header note)
// — EXECUTION of select/hover stays out of scope, only round-tripping
// authored code that registers these handlers. Unlike the receive handler's
// `EventPayload payload` parameter (whose fields are read directly, no
// destructure), onSelect/onHoverIn/onHoverOut's own `SelectParams
// selectParams`/`HoverParams hoverParams` parameters are likewise read
// directly via paramAccess (`selectParams.SelectedNode`, etc.) — no
// destructuring step needed at all in C#, so parse-cs has nothing to strip.
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
// m.* function-name selection — identical base logic/table to emit-ts's/
// emit-lua's/emit-py's own local copies (see any of their header comments):
// base name derived from the op string, "Int" suffix from the resolved
// overload's primary input type. The only C#-specific step is the FINAL
// PascalCase conversion (@gltfi/runtime-cs's M.cs exposes PascalCase method
// names, e.g. `AddInt`, `quatFromAxisAngle` -> `QuatFromAxisAngle`) — unlike
// the Python backend's PY_RENAME table, no renaming-for-keyword-collision
// step is needed at all: capitalizing the first letter can never collide
// with a C# reserved keyword (keywords are all-lowercase and case-
// sensitive), so `and`/`or`/`not`/`abs`/`min`/`max`/`pow`/`round` need no
// special-casing the way Python's did.
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

function pascalCase(name: string): string {
  return name.length === 0 ? name : name[0]!.toUpperCase() + name.slice(1);
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
  return pascalCase(fn);
}

function mCall(fn: string, argsCode: string): string {
  return `M.${fn}(${argsCode})`;
}

// ---------------------------------------------------------------------------
// Native-operator substitution table — see this file's header note for the
// full rationale on why this is broader than the Python/Lua backends' own
// tables.
// ---------------------------------------------------------------------------

// `intWrap`: true for the int-typed add/sub/mul/neg native ops. C# runtime
// `int` arithmetic already wraps silently by default (see
// GltfiRuntime.csproj's own header note) — but the C# LANGUAGE SPEC
// evaluates a CONSTANT expression (both operands compile-time constants,
// e.g. two IR `const` int literals) in a CHECKED context UNCONDITIONALLY,
// regardless of the project's runtime overflow-checking setting (this is
// completely separate from `checked`/`unchecked` BLOCKS, which only affect
// non-constant runtime evaluation). Left unguarded, a native `2147483647 +
// 1` in generated code — a real, reachable case (int32-wraparound
// conformance tests construct exactly this) — is a COMPILE ERROR (CS0220),
// not a silent-wrap the way the exact same expression would behave at
// runtime over two non-constant `int` locals. Wrapping the whole
// expression in `unchecked(...)` sidesteps this unconditionally, whether or
// not the operands actually are compile-time constants.
type NativeOp = { kind: "binary"; csOp: string; prec: number; intWrap?: boolean } | { kind: "unary"; csOp: string; prec: number; intWrap?: boolean };

// C# operator precedence (low to high, relevant levels only): ||(1) < &&(2)
// < ==/!=(3) < </<=/>/>=(4) < +/-(5) < */÷(6) < unary -/!(7).
const PREC_OR = 1;
const PREC_AND = 2;
const PREC_EQ = 3;
const PREC_REL = 4;
const PREC_ADD = 5;
const PREC_MUL = 6;
const PREC_UNARY = 7;
const ATOM_PREC = 100;

function nativeOpInfo(op: string, overload: ResolvedOverload): NativeOp | null {
  const t = primaryInputSig(overload);
  const isNum = t === "float" || t === "int";
  const intWrap = t === "int";
  switch (op) {
    case "math/add":
      return isNum ? { kind: "binary", csOp: "+", prec: PREC_ADD, intWrap } : null;
    case "math/sub":
      return isNum ? { kind: "binary", csOp: "-", prec: PREC_ADD, intWrap } : null;
    case "math/mul":
      return isNum ? { kind: "binary", csOp: "*", prec: PREC_MUL, intWrap } : null;
    // Only FLOAT division is native: C# `int / int` throws
    // DivideByZeroException for a zero divisor (unlike `double`'s safe
    // IEEE-754 behavior), so int division always stays M.DivInt — see this
    // file's header note.
    case "math/div":
      return t === "float" ? { kind: "binary", csOp: "/", prec: PREC_MUL } : null;
    case "math/neg":
      return isNum ? { kind: "unary", csOp: "-", prec: PREC_UNARY, intWrap } : null;
    case "math/eq":
      return t === "float" || t === "bool" || t === "int" ? { kind: "binary", csOp: "==", prec: PREC_EQ } : null;
    case "math/lt":
      return isNum ? { kind: "binary", csOp: "<", prec: PREC_REL } : null;
    case "math/le":
      return isNum ? { kind: "binary", csOp: "<=", prec: PREC_REL } : null;
    case "math/gt":
      return isNum ? { kind: "binary", csOp: ">", prec: PREC_REL } : null;
    case "math/ge":
      return isNum ? { kind: "binary", csOp: ">=", prec: PREC_REL } : null;
    case "math/and":
      return t === "bool" ? { kind: "binary", csOp: "&&", prec: PREC_AND } : null;
    case "math/or":
      return t === "bool" ? { kind: "binary", csOp: "||", prec: PREC_OR } : null;
    case "math/not":
      return t === "bool" ? { kind: "unary", csOp: "!", prec: PREC_UNARY } : null;
    case "math/xor":
      return t === "bool" ? { kind: "binary", csOp: "!=", prec: PREC_EQ } : null;
    default:
      return null;
  }
}

function exprPrec(expr: IRExpr): number {
  if (expr.k === "op" && expr.socket === undefined) {
    const native = nativeOpInfo(expr.op, expr.overload);
    if (native) {
      // An `unchecked(...)`-wrapped int-arith expression is syntactically a
      // primary expression (like a parenthesized one) from its PARENT's
      // point of view — never needs further wrapping — so it reports as an
      // atom here, not its underlying operator's precedence.
      return native.intWrap ? ATOM_PREC : native.prec;
    }
  }
  return ATOM_PREC;
}

// ---------------------------------------------------------------------------
// Identifier escaping. @gltfi/ir's own naming pass already sanitizes every
// display name (variables/state slots/procs) into `[A-Za-z_][A-Za-z0-9_]*`
// shape (see names.ts's sanitizeIdentifier) and event names come from the
// same allocator — but a graph author's chosen name could still happen to
// BE a bare C# reserved keyword ("for", "class", "public", "int", ...),
// which would otherwise produce an uncompilable property/const/local-
// function name. C#'s `@` verbatim-identifier prefix (valid in EVERY
// identifier position: property/const/local-function/local-variable names
// alike) sidesteps this uniformly — simpler than the Python backend's
// PY_RENAME table (which had to hand-pick a suffix per colliding name)
// since `@` covers all ~80 reserved words in a single mechanical rule.
// ---------------------------------------------------------------------------

const CS_KEYWORDS = new Set([
  "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char", "checked", "class", "const", "continue",
  "decimal", "default", "delegate", "do", "double", "else", "enum", "event", "explicit", "extern", "false", "finally",
  "fixed", "float", "for", "foreach", "goto", "if", "implicit", "in", "int", "interface", "internal", "is", "lock",
  "long", "namespace", "new", "null", "object", "operator", "out", "override", "params", "private", "protected",
  "public", "readonly", "ref", "return", "sbyte", "sealed", "short", "sizeof", "stackalloc", "static", "string",
  "struct", "switch", "this", "throw", "true", "try", "typeof", "uint", "ulong", "unchecked", "unsafe", "ushort",
  "using", "virtual", "void", "volatile", "while"
]);

function csIdent(name: string): string {
  return CS_KEYWORDS.has(name) ? `@${name}` : name;
}

// ---------------------------------------------------------------------------
// Literal formatting.
// ---------------------------------------------------------------------------

function csFloatLiteral(x: number): string {
  if (Number.isNaN(x)) {
    return "double.NaN";
  }
  if (x === Infinity) {
    return "double.PositiveInfinity";
  }
  if (x === -Infinity) {
    return "double.NegativeInfinity";
  }
  const s = String(x);
  return /[.eE]/.test(s) ? s : `${s}.0`;
}

// C#'s integer-literal grammar tokenizes a bare `2147483648` (int.MinValue's
// unsigned magnitude) as `uint` (it doesn't fit `int`), and negating a
// `uint` is illegal — so `-2147483648` written literally is a COMPILE
// ERROR, unlike every other int32 value. `int.MinValue` sidesteps it.
function csIntLiteral(x: number): string {
  const n = Math.trunc(x);
  return n === -2147483648 ? "int.MinValue" : String(n);
}

function csStringLiteral(s: string): string {
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
    return csStringLiteral(String(data[0] ?? ""));
  }
  if (type === "int") {
    return csIntLiteral(Math.trunc(Number(data[0] ?? 0)));
  }
  if (type === "float") {
    return csFloatLiteral(Number(data[0] ?? 0));
  }
  // vector/matrix
  return `new double[] { ${(data as number[]).map((x) => csFloatLiteral(Number(x))).join(", ")} }`;
}

// (typeString, initialLiteral) pair for an `rt.DeclareVar(...)` call —
// mirrors constLiteral but produces the `"<type>"` string tag DeclareVar's
// first parameter needs alongside the initial-value literal.
function declareVarArgs(type: IRType, data: Array<number | boolean | string>): [string, string] {
  return [csStringLiteral(type), constLiteral(type, data)];
}

// `Vars` property type + Engine accessor-method suffix per IRType — see
// @gltfi/runtime-cs's Engine.cs's GetVar*/SetVar* methods.
const VAR_ACCESSOR: Record<IRType, { csType: string; suffix: string }> = {
  bool: { csType: "bool", suffix: "Bool" },
  int: { csType: "int", suffix: "Int" },
  float: { csType: "double", suffix: "Float" },
  ref: { csType: "string", suffix: "Ref" },
  float2: { csType: "double[]", suffix: "Vec" },
  float3: { csType: "double[]", suffix: "Vec" },
  float4: { csType: "double[]", suffix: "Vec" },
  float2x2: { csType: "double[]", suffix: "Vec" },
  float3x3: { csType: "double[]", suffix: "Vec" },
  float4x4: { csType: "double[]", suffix: "Vec" }
};

// Explicit cast prefix for a value read back OUT of a boxed-`object` channel
// into its statically-typed IRType — two distinct conventions exist (see
// each call site's own comment for which applies):
//  - csCastForType: Pointer.PtrGet's OWN convention (Pointer.cs/PtrResult.
//    Value boxes every int-KIND pointer value as `double`, never `int` —
//    matching Pointer.cs's internal ValueMatchesType check).
//  - csDirectCastForType: Engine.EventOutRead's convention (boxes whatever
//    CLR type was ORIGINALLY written at the matching EventOut call site,
//    e.g. a genuine boxed `int` for an int-typed cross-handler value — no
//    double-boxing detour).
function csCastForType(type: IRType): string {
  if (type === "int") return "(int)(double)";
  if (type === "bool") return "(bool)";
  if (type === "ref") return "(string)";
  if (type === "float") return "(double)";
  return "(double[])";
}

function csDirectCastForType(type: IRType): string {
  if (type === "int") return "(int)";
  if (type === "bool") return "(bool)";
  if (type === "ref") return "(string)";
  if (type === "float") return "(double)";
  return "(double[])";
}

// ---------------------------------------------------------------------------
// Emitter. State-slot/variable display-name computation lives in
// @gltfi/ir/display-names.ts, shared verbatim with @gltfi/emit-ts/@gltfi/
// emit-lua/@gltfi/emit-py — see that file's own doc comment.
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
  private indent = 0;
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  private readonly crossHandlerReads = new Set<string>();
  private readonly stateSlotDisplayNames: string[];
  private readonly variableDisplayNames: string[];

  // Per-handler/proc-body-scoped naming state, reset by resetBodyCounters()
  // at the top of every handler/proc body — mirrors emit-ts's/emit-lua's/
  // emit-py's identical nextTempNum/nextContNum/nextOkNum/tempRenames.
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
    return `Cont${this.nextContNum}`;
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

  // Identical traversal to emit-ts's/emit-lua's/emit-py's collectCrossHandlerReads.
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
    this.lines.push("using System.Collections.Generic;", "using GltfiRuntime;", "", "namespace GltfiCompiled;", "", "public static class Module", "{");
    this.indent = 1;
    this.emitVarsClass();
    this.push("");
    this.emitEventsClass();
    this.push("");
    this.push("public static void Build(Engine rt)");
    this.push("{");
    this.indent += 1;
    this.emitVarDecls();
    this.emitEventDecls();
    this.push("var V = new Vars(rt);");
    this.emitStateSlots();
    this.emitProcs();
    this.emitHandlers();
    this.indent -= 1;
    this.push("}");
    this.indent -= 1;
    this.push("}");
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

  private varName(varId: number): string {
    return csIdent(this.variableDisplayNames[varId] ?? `var${varId}`);
  }

  private emitVarsClass() {
    this.push("public sealed class Vars");
    this.push("{");
    this.indent += 1;
    this.push("private readonly Engine E;");
    this.push("public Vars(Engine e) { E = e; }");
    this.module.variables.forEach((v, i) => {
      const name = this.varName(i);
      const { csType, suffix } = VAR_ACCESSOR[v.type];
      this.push(`public ${csType} ${name} { get => E.GetVar${suffix}(${i}); set => E.SetVar${suffix}(${i}, value); }`);
    });
    this.indent -= 1;
    this.push("}");
  }

  // `rt.DeclareVar("int", 0, "the-id")` — the third argument is OMITTED
  // (rather than passed as an explicit `null`, unlike DeclareEvent's own
  // always-5-args convention below) unless the source graph variable had an
  // explicit id (module.variables[i].extras.id — see @gltfi/ir's import.ts/
  // export.ts). Engine.cs's DeclareVar ignores it entirely (no execution
  // semantics); @gltfi/parse-cs reads it back into extras.id.
  private emitVarDecls() {
    this.module.variables.forEach((v) => {
      const [typeCode, initialCode] = declareVarArgs(v.type, v.initial.data);
      const id = (v.extras as { id?: string } | undefined)?.id;
      const idArg = id ? `, ${csStringLiteral(id)}` : "";
      this.push(`rt.DeclareVar(${typeCode}, ${initialCode}${idArg});`);
    });
  }

  private emitEventsClass() {
    this.push("public static class Events");
    this.push("{");
    this.indent += 1;
    this.module.events.forEach((e, i) => {
      this.push(`public const int ${csIdent(e.name)} = ${i};`);
    });
    this.indent -= 1;
    this.push("}");
  }

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

  // `rt.DeclareEvent(externalId, defaultBool, defaultInt, defaultFloat,
  // expectedDuration)` — every one of the last four is passed as an
  // explicitly nullable literal (`(bool?)`/`(int?)`/`(double?)`), `null`
  // when the source event didn't declare that value at all. Runtime
  // behavior is unaffected either way — Engine.EventPayloadOf/DefaultPayload
  // already fall back to false/0/0.0 via `??` regardless of presence (see
  // Engine.cs's own `EventDecl`/`DefaultPayload`) — but PARSE-SOUNDNESS
  // needs it: @gltfi/parse-cs reconstructs `module.events[i].values`
  // (which fields were actually DECLARED, not merely their default) from
  // this call's own arguments, and a `null` is the only way that
  // information survives the round trip through Roslyn-parsed C# source —
  // exactly mirroring `expectedDuration`'s existing null-when-undeclared
  // convention (previously the ONLY nullable one here) one level further,
  // and matching @gltfi/emit-py's/@gltfi/emit-lua's own conditional-field
  // emission for the identical reason (see either's own emitEvent(s) doc
  // comment). A prior revision of this method passed the first three as
  // always-concrete non-nullable literals purely because Engine.
  // DeclareEvent's OWN parameter types used to be non-nullable `bool`/
  // `int`/`double` — see this task's own report for the accompanying
  // Engine.cs signature change (EventDecl.DefaultBool/DefaultInt/
  // DefaultFloat all became nullable) that made this possible.
  private emitEventDecls() {
    this.module.events.forEach((e) => {
      const boolDefault = e.values.find((v) => v.name === "boolParameter");
      const intDefault = e.values.find((v) => v.name === "intParameter");
      const floatDefault = e.values.find((v) => v.name === "floatParameter");
      const duration = e.values.find((v) => v.name === "expectedDuration");
      const externalIdCode = e.id ? csStringLiteral(e.id) : "null";
      const boolCode = boolDefault ? `(bool?)${Boolean(boolDefault.default.data[0] ?? false) ? "true" : "false"}` : "(bool?)null";
      const intCode = intDefault ? `(int?)${csIntLiteral(Math.trunc(Number(intDefault.default.data[0] ?? 0)))}` : "(int?)null";
      const floatCode = floatDefault ? `(double?)${csFloatLiteral(Number(floatDefault.default.data[0] ?? 0))}` : "(double?)null";
      const durationCode = duration ? `(double?)${csFloatLiteral(Number(duration.default.data[0] ?? 0))}` : "(double?)null";
      this.push(`rt.DeclareEvent(${externalIdCode}, ${boolCode}, ${intCode}, ${floatCode}, ${durationCode});`);
    });
  }

  // State slots become Build()-level LOCAL VARIABLES ("for" kind: a bare
  // mutable `int`; every other kind: a `new <Kind>State()` reference-typed
  // instance) — every proc/handler local function declared further down in
  // the SAME Build() body closes over these by reference automatically (C#
  // local-function capture semantics), exactly mirroring Python's `S.<name>`
  // attribute access via closure over `S`, with no forward-declare trick
  // needed (see this file's header note).
  private emitStateSlots() {
    this.module.stateSlots.forEach((slot, i) => {
      const name = csIdent(this.stateSlotDisplayNames[i] ?? `slot${i}`);
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`int ${name} = ${csIntLiteral(Math.trunc(initial))};`);
          return;
        }
        case "delay":
          this.push(`var ${name} = new DelayState();`);
          return;
        case "doN":
          this.push(`var ${name} = new DoNState();`);
          return;
        case "multiGate":
          this.push(`var ${name} = new MultiGateState();`);
          return;
        case "waitAll":
          this.push(`var ${name} = new WaitAllState();`);
          return;
        case "throttle":
          this.push(`var ${name} = new ThrottleState();`);
          return;
      }
    });
  }

  private emitProcs() {
    this.module.procs.forEach((proc) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`proc:${proc.id}`];
      this.handlerEventCtx = null;
      this.resetBodyCounters();
      this.push(`void ${csIdent(proc.name)}()`);
      this.push("{");
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
    if (handler.kind === "onStart") {
      this.handlerEventCtx = { kind: "onStart" };
      this.resetBodyCounters();
      const name = `OnStart${index}`;
      this.push(`void ${name}()`);
      this.push("{");
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push("}");
      this.push(`rt.OnStart(${name});`);
      return;
    }
    if (handler.kind === "onTick") {
      this.handlerEventCtx = { kind: "onTick" };
      this.resetBodyCounters();
      const name = `OnTick${index}`;
      this.push(`void ${name}(double timeSinceStart, double timeSinceLastTick)`);
      this.push("{");
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push("}");
      this.push(`rt.OnTick(${name});`);
      return;
    }
    if (handler.kind === "receive") {
      if (handler.eventRef === undefined) {
        throw new EmitError("event/receive handler missing eventRef", "event/receive", this.originNodeId);
      }
      this.handlerEventCtx = { kind: "receive", eventRef: handler.eventRef };
      this.resetBodyCounters();
      const name = `OnReceive${index}`;
      this.push(`void ${name}(EventPayload payload)`);
      this.push("{");
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push("}");
      this.push(`rt.OnReceive(${this.eventArgCode(handler.eventRef)}, ${name});`);
      return;
    }
    // KHR_node_selectability/hoverability — not exercised by the official
    // conformance corpus this backend targets, but emitted for authoring
    // parity with emit-ts (see this file's header note); runtime-cs's
    // rt.OnSelect/OnHoverIn/OnHoverOut are no-op-tolerant registration stubs
    // (see Engine.cs) — the registration round-trips, it just never fires.
    if (handler.kind === "onSelect") {
      const nodeIndex = Math.trunc(Number((handler.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
      const stopPropagation = Boolean((handler.config as { stopPropagation?: boolean } | undefined)?.stopPropagation);
      this.handlerEventCtx = { kind: "onSelect" };
      this.resetBodyCounters();
      const name = `OnSelect${index}`;
      this.push(`void ${name}(SelectParams selectParams)`);
      this.push("{");
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push("}");
      this.push(`rt.OnSelect(${nodeIndex}, ${stopPropagation ? "true" : "false"}, ${name});`);
      return;
    }
    if (handler.kind === "onHoverIn" || handler.kind === "onHoverOut") {
      const nodeIndex = Math.trunc(Number((handler.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
      this.handlerEventCtx = { kind: handler.kind };
      this.resetBodyCounters();
      const name = `${handler.kind === "onHoverIn" ? "OnHoverIn" : "OnHoverOut"}${index}`;
      this.push(`void ${name}(HoverParams hoverParams)`);
      this.push("{");
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push("}");
      this.push(`rt.${handler.kind === "onHoverIn" ? "OnHoverIn" : "OnHoverOut"}(${nodeIndex}, ${name});`);
      return;
    }
  }

  private emitHandlerBody(body: IRStmt) {
    this.emitEventOutWrites();
    this.emitStmt(body);
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
      this.push(`rt.EventOut(${sourceNode}, ${csStringLiteral(socket)}, ${value});`);
    }
  }

  private eventArgCode(eventId: number): string {
    const name = this.module.events[eventId]?.name;
    return name ? `Events.${csIdent(name)}` : String(eventId);
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
        this.push(`var ${name} = ${code};`);
        return;
      }
      case "if": {
        // An empty "then" with a non-empty "else" reads better negated into
        // a single branch — see emit-ts's/emit-lua's/emit-py's identical
        // "if" case doc comment.
        if (stmt.then.k === "seq" && stmt.then.stmts.length === 0 && stmt.else) {
          const negCode = this.negateCond(stmt.cond);
          this.push(`if (${negCode})`);
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
          this.push("}");
          return;
        }
        this.push(`if (${this.emitExpr(stmt.cond)})`);
        this.push("{");
        this.indent += 1;
        this.emitStmt(stmt.then);
        this.indent -= 1;
        this.push("}");
        if (stmt.else) {
          this.push("else");
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
          this.push("}");
        }
        return;
      }
      case "while": {
        this.push(`while (${this.emitExpr(stmt.cond)})`);
        this.push("{");
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
        this.emitSwitch(stmt);
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
        const eventArg = this.eventArgCode(stmt.eventId);
        if (this.matchesEventDefaults(stmt.eventId, stmt.args)) {
          this.push(`rt.Send(${eventArg});`);
          return;
        }
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.Send(${eventArg}, new EventPayload(${argsCode}));`);
        return;
      }
      case "stopPropagation":
        this.push(`rt.StopPropagation(${this.paramAccess("event")}, ${this.emitExpr(stmt.stopImmediate)});`);
        return;
      case "log": {
        const argsCode = stmt.args.map((a) => this.emitExpr(a));
        if (argsCode.length === 0) {
          this.push(`rt.Log(${csStringLiteral(stmt.template)});`);
        } else {
          this.push(`rt.Log(${csStringLiteral(stmt.template)}, new object[] { ${argsCode.join(", ")} });`);
        }
        return;
      }
      case "callProc": {
        const proc = this.module.procs[stmt.procId];
        if (!proc) {
          throw new EmitError(`unknown proc id ${stmt.procId}`, "callProc", this.originNodeId);
        }
        this.push(`${csIdent(proc.name)}();`);
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
  // Async ops — same call-inlined-into-if-condition shape as the other
  // backends (a C# `if (rt.Foo(...))` evaluates its call exactly once, same
  // as Python/TS/Lua's own if-conditions, so no intermediate result
  // variable is ever needed here).
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
        const slotName = csIdent(this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`);
        callCode = `rt.SetDelay(${slotName}, ${this.emitExpr(stmt.args[0])}, ${doneCode})`;
        break;
      }
      case "varInterp": {
        const { varId, useSlerp } = (stmt.config ?? {}) as { varId: number; useSlerp: boolean };
        const [value, duration, p1, p2] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.VarInterp(${varId}, ${value}, ${duration}, ${p1}, ${p2}, ${useSlerp ? "true" : "false"}, ${doneCode})`;
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
        const { pointer, argsCode } = this.pointerCall(template, paramArgs);
        const [valueCode, durationCode, p1Code, p2Code] = [value, duration, p1, p2].map((a) => this.emitExpr(a));
        const argsSuffix = argsCode ? `, ${argsCode}` : "";
        callCode = `rt.PtrInterp(${pointer}, ${csStringLiteral(stmt.type!)}, ${valueCode}, ${durationCode}, ${p1Code}, ${p2Code}, ${doneCode}${argsSuffix})`;
        break;
      }
      case "animStart": {
        const [animation, startTime, endTime, speed] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.AnimStart(${animation}, ${startTime}, ${endTime}, ${speed}, ${doneCode})`;
        break;
      }
      case "animStop": {
        callCode = `rt.AnimStop(${this.emitExpr(stmt.args[0])})`;
        break;
      }
      case "animStopAt": {
        const [animation, stopTime] = stmt.args.map((a) => this.emitExpr(a));
        callCode = `rt.AnimStopAt(${animation}, ${stopTime}, ${doneCode})`;
        break;
      }
    }
    if (!stmt.out && !stmt.err) {
      this.push(`${callCode};`);
      return;
    }
    if (!stmt.out && stmt.err) {
      this.push(`if (!${callCode})`);
      this.push("{");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("}");
      return;
    }
    this.push(`if (${callCode})`);
    this.push("{");
    this.indent += 1;
    this.emitStmt(stmt.out ?? { k: "seq", stmts: [] });
    this.indent -= 1;
    this.push("}");
    if (stmt.err) {
      this.push("else");
      this.push("{");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("}");
    }
  }

  // A `Cont` is either a plain proc reference (its bare local-function NAME,
  // passed as a value — method-group-to-`Action` conversion, NOT called
  // here) or an inline body, lifted to a synthetic local function declared
  // immediately before the call site that references it — safe for the same
  // reason the other backends' identical Cont-lifting is: a Cont body only
  // ever touches module state, never a caller's temps (see @gltfi/ir's
  // GI105 invariant).
  private emitCont(cont: Extract<IRStmt, { k: "async" }>["done"]): string {
    if (!cont) {
      return "null";
    }
    if (cont.kind === "proc") {
      const proc = this.module.procs[cont.procId];
      if (!proc) {
        throw new EmitError(`unknown proc id ${cont.procId}`, "async.done", this.originNodeId);
      }
      return csIdent(proc.name);
    }
    const name = this.allocCont();
    this.push(`void ${name}()`);
    this.push("{");
    this.indent += 1;
    this.emitStmt(cont.body);
    this.indent -= 1;
    this.push("}");
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops. doN/waitAll inline their call directly into the `if`
  // (single evaluation, same reasoning as the async ops above). multiGate's
  // 2+-output case uses a native C# `switch` (evaluates its governing
  // expression EXACTLY ONCE, same as TS's own native switch) instead of an
  // if/else-if chain — sidestepping the double-evaluation bug an if/else-if
  // chain repeating the same mutating call in each branch's condition would
  // have (the Python backend's identical concern, fixed there with a named
  // temp since Python's if/elif has no such single-evaluation construct;
  // C# does, via switch, so no temp is needed here for multiGate). throttle
  // still needs a named temp (`ok<n>`) since its two branches check TWO
  // DIFFERENT fields of one call's result, which switch can't express.
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = csIdent(this.stateSlotDisplayNames[slotIndex] ?? `slot${slotIndex}`);
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.Count = 0.0;`);
          return;
        }
        const call = `rt.DoN(${slotName}, ${this.emitExpr(stmt.args[0])})`;
        if (stmt.outs.out) {
          this.push(`if (${call})`);
          this.push("{");
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
          this.push(`${slotName}.LastTime = null;`);
          this.push(`${slotName}.Remaining = double.NaN;`);
          return;
        }
        const durationCode = this.emitExpr(stmt.args[0]);
        if (stmt.outs.out || stmt.outs.err) {
          const resName = this.allocOk();
          this.push(`var ${resName} = rt.Throttle(${slotName}, ${durationCode});`);
          this.push(`if (${resName}.Invalid)`);
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.outs.err ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push("}");
          this.push(`else if (${resName}.Fire)`);
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.outs.out ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push("}");
        } else {
          this.push(`rt.Throttle(${slotName}, ${durationCode});`);
        }
        return;
      }
      case "multiGate": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.Used = System.Array.Empty<bool>();`);
          this.push(`${slotName}.LastIndex = -1.0;`);
          return;
        }
        // UTF-16/lexical sort — matches interpreter.ts's/emit-ts's own
        // `Object.keys(flows).sort()` exactly.
        const keys = Object.keys(stmt.outs).sort();
        const isRandom = Boolean((slot?.config as { isRandom?: boolean } | undefined)?.isRandom);
        const isLoop = Boolean((slot?.config as { isLoop?: boolean } | undefined)?.isLoop);
        const call = `rt.MultiGate(${slotName}, ${keys.length}, ${isRandom ? "true" : "false"}, ${isLoop ? "true" : "false"})`;
        if (keys.length > 1) {
          this.push(`switch (${call})`);
          this.push("{");
          this.indent += 1;
          keys.forEach((key, i) => {
            this.push(`case ${i}:`);
            this.push("{");
            this.indent += 1;
            this.emitStmt(stmt.outs[key]);
            this.push("break;");
            this.indent -= 1;
            this.push("}");
          });
          this.indent -= 1;
          this.push("}");
          return;
        }
        if (keys.length === 1) {
          this.push(`if (${call} == 0)`);
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.outs[keys[0]]);
          this.indent -= 1;
          this.push("}");
          return;
        }
        this.push(`${call};`);
        return;
      }
      case "waitAll": {
        const inputFlows = Number((slot?.config as { inputFlows?: number } | undefined)?.inputFlows ?? 0);
        if (stmt.port === "reset") {
          this.push(`${slotName}.Activated = System.Array.Empty<bool>();`);
          this.push(`${slotName}.Remaining = ${csFloatLiteral(inputFlows)};`);
          return;
        }
        const index = typeof stmt.port === "number" ? stmt.port : 0;
        const call = `rt.WaitAll(${slotName}, ${inputFlows}, ${index})`;
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if (${call})`);
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.outs.completed ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push("}");
          this.push("else");
          this.push("{");
          this.indent += 1;
          this.emitStmt(stmt.outs.out ?? { k: "seq", stmts: [] });
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
  // Intrinsic statements.
  // ---------------------------------------------------------------------

  private emitIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>) {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIndex = (stmt.config as { slot?: number }).slot;
      if (slotIndex === undefined) {
        throw new EmitError("flow/setDelay#cancel missing its state slot", stmt.op, this.originNodeId);
      }
      const slotName = csIdent(this.stateSlotDisplayNames[slotIndex] ?? `delay${slotIndex}`);
      this.push(`rt.CancelDelaySlot(${slotName});`);
      return;
    }
    if (stmt.op === "flow/cancelDelay") {
      this.push(`rt.CancelDelay(${this.emitExpr(stmt.args[0])});`);
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
    const varName = csIdent(this.stateSlotDisplayNames[slotIndex] ?? `for_${slotIndex}`);
    this.push(`${varName} = ${this.emitExpr(stmt.start)};`);
    this.push(`while (${varName} < (${this.emitExpr(stmt.end)}))`);
    this.push("{");
    this.indent += 1;
    this.emitStmt(stmt.body);
    this.push(`${varName} = ${varName} + 1;`);
    this.indent -= 1;
    this.push("}");
    if (stmt.completed) {
      this.emitStmt(stmt.completed);
    }
  }

  // C# has a native switch statement (unlike Python) — the selector
  // expression is evaluated exactly once by the switch itself, so no
  // temp is needed the way emit-py's if/elif chain required.
  private emitSwitch(stmt: Extract<IRStmt, { k: "switch" }>) {
    this.push(`switch (${this.emitExpr(stmt.selector)})`);
    this.push("{");
    this.indent += 1;
    for (const [c, body] of stmt.cases) {
      this.push(`case ${c}:`);
      this.push("{");
      this.indent += 1;
      this.emitStmt(body);
      this.push("break;");
      this.indent -= 1;
      this.push("}");
    }
    if (stmt.default) {
      this.push("default:");
      this.push("{");
      this.indent += 1;
      this.emitStmt(stmt.default);
      this.push("break;");
      this.indent -= 1;
      this.push("}");
    }
    this.indent -= 1;
    this.push("}");
  }

  private emitSetPointer(stmt: Extract<IRStmt, { k: "setPointer" }>) {
    const { pointer, argsCode } = this.pointerCall(stmt.template, stmt.args);
    const valueCode = this.emitExpr(stmt.value);
    const argsSuffix = argsCode ? `, ${argsCode}` : "";
    const call = `rt.PtrSet(${pointer}, ${csStringLiteral(stmt.type)}, ${valueCode}${argsSuffix})`;
    if (!stmt.out && !stmt.err) {
      this.push(`${call};`);
      return;
    }
    if (!stmt.out && stmt.err) {
      this.push(`if (!${call})`);
      this.push("{");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("}");
      return;
    }
    this.push(`if (${call})`);
    this.push("{");
    this.indent += 1;
    this.emitStmt(stmt.out ?? { k: "seq", stmts: [] });
    this.indent -= 1;
    this.push("}");
    if (stmt.err) {
      this.push("else");
      this.push("{");
      this.indent += 1;
      this.emitStmt(stmt.err);
      this.indent -= 1;
      this.push("}");
    }
  }

  // Builds the pointer literal + (possibly omitted) args-dictionary
  // expression for a pointer/get|set|interpolate call: any template
  // parameter whose fed value is a compile-time CONSTANT is inlined
  // directly into the path string and dropped from the dictionary entirely;
  // only params still fed a dynamic expression remain as `[name]`/`{name}`
  // placeholders with a matching dictionary entry. When EVERY param
  // inlines, the whole dictionary argument is omitted (Engine.PtrGet/PtrSet/
  // PtrInterp's `args` parameter defaults to null/empty — a cleaner win
  // than the Python backend's positional-shape-sniffing dance, since C#
  // has real optional parameters). Identical logic/rationale to the other
  // backends' pointerCall — see any of their own doc comments (same
  // `ref`-params-never-inline caveat). Int-kind dynamic params are boxed as
  // `(double)(...)` — Pointer.cs's ValueMatchesType/PtrGet validate every
  // int-kind arg as a boxed `double`, never a boxed `int` (see this file's
  // csCastForType/csDirectCastForType doc comment for the two distinct
  // boxing conventions in play across this backend).
  private pointerCall(template: PtrTemplate, args: IRExpr[]): { pointer: string; argsCode: string | null } {
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
    const pointer = csStringLiteral(formatPointerTemplate({ segments: resolvedSegments }));
    if (remainingParams.length === 0) {
      return { pointer, argsCode: null };
    }
    const codes = remainingArgs.map((a) => this.emitExpr(a));
    const entries = remainingParams.map((p, i) => {
      const valueCode = p.kind === "int" ? `(double)(${codes[i]})` : codes[i];
      return `[${csStringLiteral(p.name)}] = ${valueCode}`;
    });
    const argsCode = `new Dictionary<string, object> { ${entries.join(", ")} }`;
    return { pointer, argsCode };
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
        const { pointer, argsCode } = this.pointerCall(expr.template, expr.args);
        const argsSuffix = argsCode ? `, ${argsCode}` : "";
        const call = `rt.PtrGet(${pointer}, ${csStringLiteral(expr.valueType)}${argsSuffix})`;
        return expr.wantIsValid ? `${call}.IsValid` : `${csCastForType(expr.valueType)}${call}.Value`;
      }
      case "param":
        return this.paramAccess(expr.name);
      case "op":
        return this.emitOp(expr);
      case "temp":
        return this.tempRenames.get(expr.id) ?? expr.id;
      case "stateRead":
        return this.emitStateRead(expr.slot.slot, expr.field, expr.type);
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
      if (ctx.kind === "onStart") return csStringLiteral("event:onStart");
      if (ctx.kind === "onTick") return csStringLiteral("event:onTick");
      if (ctx.kind === "onSelect") return csStringLiteral("event:onSelect");
      if (ctx.kind === "onHoverIn") return csStringLiteral("event:onHoverIn");
      if (ctx.kind === "onHoverOut") return csStringLiteral("event:onHoverOut");
      return csStringLiteral(`event:custom:${ctx.eventRef}`);
    }
    if (ctx.kind === "onTick") {
      if (name === "timeSinceStart") return "timeSinceStart";
      if (name === "timeSinceLastTick") return "timeSinceLastTick";
    }
    // No destructuring step — the handler's own `SelectParams
    // selectParams`/`HoverParams hoverParams` parameter's fields are read
    // directly, exactly like `receive`'s `payload.<Field>` above.
    if (ctx.kind === "onSelect") {
      if (name === "selectedNode") return "selectParams.SelectedNode";
      if (name === "selectedNodeIndex") return "selectParams.SelectedNodeIndex";
      if (name === "controllerIndex") return "selectParams.ControllerIndex";
      if (name === "selectionPoint") return "selectParams.SelectionPoint";
      if (name === "selectionRayOrigin") return "selectParams.SelectionRayOrigin";
    }
    if (ctx.kind === "onHoverIn" || ctx.kind === "onHoverOut") {
      if (name === "hoveredNode") return "hoverParams.HoveredNode";
      if (name === "controllerIndex") return "hoverParams.ControllerIndex";
    }
    if (ctx.kind === "receive") {
      if (name === "boolParameter") return "payload.BoolParameter";
      if (name === "intParameter") return "payload.IntParameter";
      if (name === "floatParameter") return "payload.FloatParameter";
      if (name === "expectedDuration") return "payload.ExpectedDuration";
    }
    throw new EmitError(`param("${name}") not supported for handler kind "${ctx.kind}"`, "param", this.originNodeId);
  }

  // The underlying state-slot storage is always `double`/`double?` (mirrors
  // every other backend's own float-typed representation — e.g. Python's
  // dict `{"count": 0.0}`) even for fields whose OWN declared IRType is
  // "int" (currentCount/lastIndex/remainingInputs) — harmless there since
  // Python/Lua/TS have no static int-vs-float distinction at assignment
  // time, but C#'s `Vars` property setters DO (an `int`-typed property
  // rejects an implicit `double` argument). Every return path here is
  // wrapped in `csDirectCastForType(exprType)` to bridge that: a no-op
  // (redundant but harmless) cast when exprType is already "float"/"ref"/
  // the already-`int` "for" index, and the fix itself — a truncating
  // `(int)` cast, safe since these fields only ever hold whole-number
  // values — when exprType is "int".
  private emitStateRead(slotIndex: number, field: string, exprType: IRType): string {
    const slot = this.module.stateSlots[slotIndex];
    if (!slot) {
      throw new EmitError(`stateRead on unknown state slot ${slotIndex}`, "stateRead", this.originNodeId);
    }
    const name = csIdent(this.stateSlotDisplayNames[slotIndex] ?? `slot${slotIndex}`);
    const cast = csDirectCastForType(exprType);
    if (slot.kind === "for" && field === "index") {
      return `${cast}${name}`;
    }
    if (slot.kind === "doN" && field === "currentCount") {
      return `${cast}${name}.Count`;
    }
    if (slot.kind === "multiGate" && field === "lastIndex") {
      return `${cast}${name}.LastIndex`;
    }
    if (slot.kind === "delay" && field === "lastDelay") {
      return `${cast}${name}.LastRef`;
    }
    if (slot.kind === "throttle" && field === "lastRemainingTime") {
      return `${cast}${name}.Remaining`;
    }
    if (slot.kind === "waitAll" && field === "remainingInputs") {
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      return `${cast}(${name}.Remaining ?? ${csFloatLiteral(inputFlows)})`;
    }
    throw new EmitError(`stateRead on "${slot.kind}".${field} not supported this milestone`, "stateRead", this.originNodeId);
  }

  private emitIntrinsicExpr(expr: Extract<IRExpr, { k: "intrinsic" }>): string {
    if (expr.op === "math/switch") {
      const cases = (expr.config.cases as number[] | undefined) ?? [];
      const [selection, dflt, ...caseArgs] = expr.args;
      const selCode = this.emitExpr(selection);
      const dfltCode = this.emitExpr(dflt);
      const valuesCode = caseArgs.map((a) => this.emitExpr(a));
      return `M.SwitchCase(${selCode}, new int[] { ${cases.join(", ")} }, new[] { ${valuesCode.join(", ")} }, ${dfltCode})`;
    }
    if (expr.op === "event/receive#payload") {
      const eventIndex = expr.config.eventIndex as number;
      const field = expr.config.field as string;
      const propName = { boolParameter: "BoolParameter", intParameter: "IntParameter", floatParameter: "FloatParameter", expectedDuration: "ExpectedDuration" }[
        field
      ];
      return `rt.EventPayloadOf(${this.eventArgCode(eventIndex)}).${propName}`;
    }
    if (expr.op === "event/onTick#time") {
      return (expr.config.field as string) === "timeSinceStart" ? "rt.TickTime()" : "rt.TickDelta()";
    }
    if (expr.config?.crossContext === true) {
      const sourceNode = expr.config.sourceNode as number;
      const socket = expr.config.socket as string;
      return `${csDirectCastForType(expr.type)}rt.EventOutRead(${sourceNode}, ${csStringLiteral(socket)})`;
    }
    throw new EmitError(`intrinsic expr "${expr.op}" has no dedicated lowering`, expr.op, this.originNodeId);
  }

  private emitOp(expr: Extract<IRExpr, { k: "op" }>): string {
    if (expr.op === "math/random") {
      return "rt.Random()";
    }
    const native = nativeOpInfo(expr.op, expr.overload);
    if (native) {
      return this.emitNativeOp(expr, native);
    }
    const argsCode = expr.args.map((a) => this.emitExpr(a));
    if (expr.op === "math/quatFromAngles") {
      argsCode.push(csStringLiteral((expr.config?.order as string | undefined) ?? "yxz"));
    }
    const fn = mFunctionName(expr.op, expr.overload);
    const call = mCall(fn, argsCode.join(", "));
    const multiOutput = Object.keys(expr.overload.outputs).length > 1;
    if (expr.socket === undefined) {
      return multiOutput ? `${call}.Value` : call;
    }
    if (/^\d+$/.test(expr.socket)) {
      return `${call}[${Number(expr.socket)}]`;
    }
    return `${call}.${pascalCase(expr.socket)}`;
  }

  private emitNativeOp(expr: Extract<IRExpr, { k: "op" }>, native: NativeOp): string {
    let result: string;
    if (native.kind === "unary") {
      const [a] = expr.args;
      const aCode = this.emitExpr(a);
      const operand = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
      if (native.csOp === "!") {
        result = `!${operand}`;
      } else {
        // A bare "- -x" risks C#'s lexer maximal-munching the two dashes
        // into a single `--` (decrement) TOKEN if they ever end up
        // adjacent with no separator emitted between them — unlike
        // Python's identical-looking guard (a pure readability nicety
        // there, since Python has no `--` token at all), this is a genuine
        // C#-syntax correctness requirement. Parenthesizing the inner
        // operand sidesteps it unconditionally, regardless of whitespace.
        result = operand.startsWith("-") ? `-(${operand})` : `${native.csOp}${operand}`;
      }
    } else {
      const [a, b] = expr.args;
      const aCode = this.emitExpr(a);
      const bCode = this.emitExpr(b);
      const leftStr = exprPrec(a) < native.prec ? `(${aCode})` : aCode;
      const rightStr = exprPrec(b) <= native.prec ? `(${bCode})` : bCode;
      result = `${leftStr} ${native.csOp} ${rightStr}`;
    }
    // See NativeOp's own `intWrap` doc comment: unconditional, not just for
    // operands that happen to be constants — sidesteps C#'s checked-by-
    // default CONSTANT-expression evaluation rule entirely.
    return native.intWrap ? `unchecked(${result})` : result;
  }

  // Blanket `!(...)` negation of a whole condition expression (used for the
  // empty-then `if`/setPointer/async rewrites) — deliberately NEVER
  // algebraically flips a comparison operator (unsound under NaN) — same
  // reasoning as the other backends' negateCond.
  private negateCond(cond: IRExpr): string {
    const code = this.emitExpr(cond);
    const operand = exprPrec(cond) < PREC_UNARY ? `(${code})` : code;
    return `!${operand}`;
  }
}

export function emitModuleCs(module: IRModule): EmitResult {
  return new Emitter(module).run();
}
