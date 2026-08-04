// C# -> IR parser (packages/parse-cs). Mirrors @gltfi/parse-py's index.ts
// (read that file first — this header only calls out where C# differs) — a
// mechanical INVERSE of @gltfi/emit-cs's emit.ts, targeting exactly the
// subset that emitter produces (see its own header comment for the
// generated module's shape: `namespace GltfiCompiled; public static class
// Module { public sealed class Vars {...} public static class Events {...}
// public static void Build(Engine rt) { <DeclareVar> <DeclareEvent> var V =
// new Vars(rt); <state slots> <procs> <handlers> } }`).
//
// Why a real Roslyn parse instead of a JS-side C# grammar: identical
// rationale to parse-lua's luaparse dependency / parse-py's CPython
// subprocess (see either's own header) — rather than adding a hand-rolled
// or third-party C# parser, this reuses Microsoft.CodeAnalysis.CSharp
// itself, already a dependency of @gltfi/runtime-cs's Harness.cs (which
// compiles every module it loads via Roslyn already). Harness.cs gained a
// `{"cmd":"ast", source}` command that runs the source through
// `CSharpSyntaxTree.ParseText` and dumps the resulting tree as JSON (see
// that file's own doc comments); this package (via ./session.ts) spawns
// that harness ONCE, lazily, and reuses it for every `parseModuleCs` call.
// `parseModuleCs`'s second, optional `astProvider` parameter exists so
// tests can inject a stub AST directly (no subprocess at all), same as
// parse-py's identical parameter. `closeParser()` shuts the shared session
// down so a caller (run-roundtrip-cs.ts's `main()`, a vitest `afterAll`)
// exits promptly instead of leaving the child process/fds dangling.
//
// Overload resolution (@gltfi/kernel's resolveOverload) is driven the same
// way parse-py/parse-lua/parse-ts drive it: from the `M.*` call name via
// @gltfi/kernel's shared fn-naming reverse table, plus literal shapes plus
// variable/event/pointer declared types propagated through the value DAG
// bottom-up. The ONE C#-specific wrinkle: @gltfi/emit-cs PascalCases every
// `M.*` function name (`AddInt`, `quatFromAxisAngle` -> `QuatFromAxisAngle`
// — see that file's own `mFunctionName`/`pascalCase`), so `CS_UNPASCAL`
// below lower-cases a call's leading letter BEFORE consulting the shared
// reverse table (which, like every other backend's own naming table, indexes
// by the ORIGINAL camelCase base name) — simpler than Python's PY_UNRENAME
// table since PascalCasing is a single mechanical rule with no keyword-
// collision exceptions to special-case (see emit.ts's own header note on
// why: capitalizing a first letter can never collide with a C# keyword).
//
// Native-operator lowering is the BROADEST of any backend's own tryLower
// NativeOp (see emit.ts's header table) — C# native `+`/`-`/`*` int
// arithmetic is wrapped in `unchecked(...)` (see ast-helpers.ts's `unwrap`,
// which peels that transparently) and every comparison (`==`/`!=`/`<`/...)
// is native for BOTH float and int (unlike Python/Lua, which only ever
// natively substitute float/bool comparisons) — so, unlike parse-py's
// narrower `tryLowerNativeOp` (whose own header explains it never needs
// int-vs-float disambiguation for comparisons), this parser's equivalent
// must infer int-vs-float from operand shape the same way `disambiguate
// Overload` does for `M.*` calls.
//
// Deliberate simplifications shared with parse-py/parse-lua (identical
// rationale, see either file's header): while/for's `completed` and
// flow/cancelDelay's `outs.out` are reconstructed as flat seq siblings
// rather than round-tripping the exact original nesting.
import {
  defaultValue,
  getOpSpec,
  isGenericSig,
  lookupMFunctions,
  resolveOverload,
  type FnCandidate,
  type OpSpec,
  type ResolvedOverload,
  type TypeSig
} from "@gltfi/kernel";
import {
  formatPointerTemplate,
  parsePointerTemplate,
  pointerTemplateParams,
  typeSigToIRType,
  type Cont,
  type Diagnostic,
  type HandlerKind,
  type IREvent,
  type IREventValue,
  type IRExpr,
  type IRHandler,
  type IRHandlerParam,
  type IRModule,
  type IRProc,
  type IRStateSlot,
  type IRStmt,
  type IRType,
  type IRVariable,
  type PtrTemplate,
  type StateKind
} from "@gltfi/ir";
import {
  asAttrCall,
  attrCallOf,
  bareCallOf,
  callArgs,
  dictionaryEntries,
  identifierNameOf,
  isLiteralish,
  isType,
  listElements,
  literalPType,
  memberAccessOf,
  nodeList,
  objectCreationOf,
  readBoolLiteral,
  readNumberLiteral,
  stringLiteralValue,
  unwrap,
  unwrapCast,
  type CsNode
} from "./ast-helpers.js";
import { closeSession, fetchAst } from "./session.js";

export type ParseResult = { module: IRModule; diagnostics: Diagnostic[] };
export type AstProvider = (source: string) => CsNode;

class ParseError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function fail(code: string, node: CsNode | undefined, message: string): never {
  const where = node?.lineno !== undefined ? ` at line ${node.lineno}${node.col_offset !== undefined ? `, column ${node.col_offset}` : ""}` : "";
  throw new ParseError(code, `${message}${where}`);
}

function emptyModule(): IRModule {
  return {
    variables: [],
    events: [],
    stateSlots: [],
    handlers: [],
    procs: [],
    meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
  };
}

export function parseModuleCs(code: string, astProvider?: AstProvider): ParseResult {
  let root: CsNode;
  try {
    root = (astProvider ?? fetchAst)(code) as CsNode;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { module: emptyModule(), diagnostics: [{ severity: "error", code: "GC001", message: `C# syntax error: ${message}` }] };
  }

  try {
    const parser = new ModuleParser();
    const module = parser.run(root);
    return { module, diagnostics: parser.diagnostics };
  } catch (err) {
    if (err instanceof ParseError) {
      return { module: emptyModule(), diagnostics: [{ severity: "error", code: err.code, message: err.message }] };
    }
    throw err;
  }
}

// Shuts down the shared, lazily-spawned harness process (if one was ever
// spawned) so callers exit promptly — see session.ts's own doc comment.
export function closeParser(): void {
  closeSession();
}

// ---------------------------------------------------------------------------
// Small free-function helpers.
// ---------------------------------------------------------------------------

const F_FAMILY: readonly IRType[] = ["float", "float2", "float3", "float4", "float2x2", "float3x3", "float4x4"];
const V_FAMILY: readonly IRType[] = ["float2", "float3", "float4"];
const M_FAMILY: readonly IRType[] = ["float2x2", "float3x3", "float4x4"];

function familyOf(generic: "F" | "V" | "M" | "T"): readonly IRType[] | null {
  if (generic === "F") return F_FAMILY;
  if (generic === "V") return V_FAMILY;
  if (generic === "M") return M_FAMILY;
  return null;
}

// See parse-lua's/parse-py's own `lengthToType` doc comment (identical
// rationale).
function lengthToType(len: number, family: readonly IRType[]): IRType | undefined {
  const table: Record<number, IRType[]> = {
    1: ["float"],
    2: ["float2"],
    3: ["float3"],
    4: ["float4", "float2x2"],
    9: ["float3x3"],
    16: ["float4x4"]
  };
  const candidates = (table[len] ?? []).filter((t) => family.includes(t));
  return candidates[0];
}

const HANDLER_PARAMS: Record<HandlerKind, IRHandlerParam[]> = {
  onStart: [{ name: "event", type: "ref" }],
  onTick: [
    { name: "timeSinceStart", type: "float" },
    { name: "timeSinceLastTick", type: "float" },
    { name: "event", type: "ref" }
  ],
  receive: [
    { name: "boolParameter", type: "bool" },
    { name: "intParameter", type: "int" },
    { name: "floatParameter", type: "float" },
    { name: "expectedDuration", type: "float" },
    { name: "event", type: "ref" }
  ],
  onSelect: [],
  onHoverIn: [],
  onHoverOut: []
};

const PAYLOAD_FIELDS = ["boolParameter", "intParameter", "floatParameter", "expectedDuration"] as const;
const PAYLOAD_PROP: Record<string, (typeof PAYLOAD_FIELDS)[number]> = {
  BoolParameter: "boolParameter",
  IntParameter: "intParameter",
  FloatParameter: "floatParameter",
  ExpectedDuration: "expectedDuration"
};

// Reverse of emit-cs's `mFunctionName`'s/`pascalCase(...)`'s final
// capitalize-first-letter step — see this file's header note. Used AS-IS for
// SOCKET names (`M.Foo(...).IsValid` -> "isValid", `.Axis` -> "axis" — the
// registry's own socket names are uniformly lowercase-first, no exceptions).
// NOT sufficient on its own for `M.*` FUNCTION base names, though: 5 ops
// (`math/Pi`/`Tau`/`Inf`/`NaN`/`E` — see registry.ts's own `mathConst(...)`
// calls) are deliberately registered with an ALREADY-capitalized op segment
// (so @gltfi/emit-ts's/@gltfi/emit-lua's un-pascal-cased `m.Pi()`/`m.NaN()`/
// etc. read as JS `Math.PI`-style constants), which makes `pascalCase`
// non-injective on THOSE five names (`pascalCase("Pi") === pascalCase("pi")
// === "Pi"`) — `lowerMCall` below resolves that ambiguity by trying the
// call's OWN spelling against the shared reverse table FIRST, only falling
// back to this lower-cased guess when the as-spelled name isn't registered.
function lowerFirst(name: string): string {
  return name.length === 0 ? name : name[0]!.toLowerCase() + name.slice(1);
}

// Reverse of emit-cs's async-call dispatch (`rt.SetDelay`/`rt.VarInterp`/
// `rt.PtrInterp`/`rt.AnimStart`/`rt.AnimStop`/`rt.AnimStopAt`).
type AsyncKind = "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt";
const ASYNC_ATTR_TO_KIND: Record<string, AsyncKind> = {
  SetDelay: "setDelay",
  VarInterp: "varInterp",
  PtrInterp: "ptrInterp",
  AnimStart: "animStart",
  AnimStop: "animStop",
  AnimStopAt: "animStopAt"
};

function matchAsyncCall(expr: CsNode | undefined): { kind: AsyncKind; call: CsNode } | undefined {
  const c = attrCallOf(expr);
  if (!c || c.base !== "rt") {
    return undefined;
  }
  const kind = ASYNC_ATTR_TO_KIND[c.attr];
  return kind ? { kind, call: c.call } : undefined;
}

const CS_TYPE_TO_IR: Record<string, IRType> = {
  bool: "bool",
  int: "int",
  float: "float",
  ref: "ref",
  float2: "float2",
  float3: "float3",
  float4: "float4",
  float2x2: "float2x2",
  float3x3: "float3x3",
  float4x4: "float4x4"
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

type Ctx = { kind: "proc" } | { kind: "handler"; handlerKind: HandlerKind };

class ModuleParser {
  diagnostics: Diagnostic[] = [];

  variables: IRVariable[] = [];
  events: IREvent[] = [];
  stateSlots: IRStateSlot[] = [];
  procs: IRProc[] = [];
  handlers: IRHandler[] = [];

  private stateSlotIndexByName = new Map<string, number>();
  private procIndexByName = new Map<string, number>();
  private tempTypeByName = new Map<string, IRType>();
  // "V.<name>"/"Events.<name>" -> index — mirrors parse-py's identically
  // purposed varIndexByProp/eventIndexByProp (this backend has only the ONE
  // property-class/const-class shape, unlike Python's old-list/new-dict
  // dual convention, so there is no separate "old shape" table to maintain).
  private varIndexByProp = new Map<string, number>();
  private eventIndexByProp = new Map<string, number>();

  run(root: CsNode): IRModule {
    const moduleClass = this.findModuleClass(root);
    const members = nodeList(moduleClass.Members);
    const varsClass = members.find((m) => isType(m, "ClassDeclaration") && m.Identifier === "Vars");
    const eventsClass = members.find((m) => isType(m, "ClassDeclaration") && m.Identifier === "Events");
    const buildMethod = members.find((m) => isType(m, "MethodDeclaration") && m.Identifier === "Build");
    if (!varsClass) fail("GC101", moduleClass, "expected a nested `public sealed class Vars { ... }`");
    if (!eventsClass) fail("GC102", moduleClass, "expected a nested `public static class Events { ... }`");
    if (!buildMethod) fail("GC100", moduleClass, "expected a `public static void Build(Engine rt) { ... }` method");
    this.checkBuildSignature(buildMethod);

    const varNames = this.parseVarsClass(varsClass);
    const eventNames = this.parseEventsClass(eventsClass);

    const stmts = nodeList((buildMethod.Body as CsNode).Statements);
    let i = 0;
    i = this.parseVarDecls(stmts, i, varNames);
    i = this.parseEventDecls(stmts, i, eventNames);

    if (!this.isVarsCtorStmt(stmts[i])) {
      fail("GC105", stmts[i], "expected `var V = new Vars(rt);`");
    }
    i += 1;

    while (i < stmts.length && this.tryRegisterStateSlot(stmts[i])) {
      i += 1;
    }

    // Procs and handlers: a run of Build-body-level local functions, each
    // either a plain proc (referenced later by a bare call) or a handler
    // whose very next statement is its registration call (`rt.OnStart`/
    // `rt.OnTick`/`rt.OnReceive`) referencing it — see
    // matchHandlerRegistration.
    const procBodies: CsNode[][] = [];
    type HandlerDesc = { kind: HandlerKind; eventRef?: number; bodyStmts: CsNode[] };
    const handlerDescs: HandlerDesc[] = [];
    while (i < stmts.length) {
      const s = stmts[i];
      if (!isType(s, "LocalFunctionStatement")) {
        fail("GC104", s, "expected a proc definition or a handler registration (local function + rt.OnStart/rt.OnTick/rt.OnReceive)");
      }
      const defName = s.Identifier as string;
      const bodyStmts = nodeList((s.Body as CsNode).Statements);
      const handlerMatch = this.matchHandlerRegistration(stmts[i + 1], defName);
      if (handlerMatch) {
        handlerDescs.push({ kind: handlerMatch.kind, eventRef: handlerMatch.eventRef, bodyStmts });
        i += 2;
        continue;
      }
      const id = this.procs.length;
      this.procIndexByName.set(defName, id);
      this.procs.push({ id, name: defName, body: { k: "seq", stmts: [] } });
      procBodies.push(bodyStmts);
      i += 1;
    }

    procBodies.forEach((body, idx) => {
      this.procs[idx] = { ...this.procs[idx], body: this.lowerBlock(body, { kind: "proc" }) };
    });
    handlerDescs.forEach((desc) => {
      const params = HANDLER_PARAMS[desc.kind];
      const body = this.lowerBlock(desc.bodyStmts, { kind: "handler", handlerKind: desc.kind });
      this.handlers.push({ kind: desc.kind, eventRef: desc.eventRef, params, body });
    });

    return {
      variables: this.variables,
      events: this.events,
      stateSlots: this.stateSlots,
      handlers: this.handlers,
      procs: this.procs,
      meta: {
        nameMaps: {
          variables: this.variables.map((v) => v.name),
          events: this.events.map((e) => e.name),
          stateSlots: this.stateSlots.map((s) => s.name),
          procs: this.procs.map((p) => p.name)
        },
        sourceNodeIds: {}
      }
    };
  }

  // -------------------------------------------------------------------
  // Top-level module shape.
  // -------------------------------------------------------------------

  private findModuleClass(root: CsNode): CsNode {
    const members = nodeList(root.Members);
    const ns = members.find((m) => isType(m, "FileScopedNamespaceDeclaration") || isType(m, "NamespaceDeclaration"));
    if (!ns || (ns.Name as CsNode)?.Identifier !== "GltfiCompiled") {
      fail("GC100", root, "expected `namespace GltfiCompiled;` at the top level");
    }
    const nsMembers = nodeList(ns!.Members);
    const moduleClass = nsMembers.find((m) => isType(m, "ClassDeclaration") && m.Identifier === "Module");
    if (!moduleClass) {
      fail("GC100", ns, "expected a top-level `public static class Module { ... }`");
    }
    return moduleClass!;
  }

  private checkBuildSignature(buildMethod: CsNode) {
    const params = nodeList((buildMethod.ParameterList as CsNode)?.Parameters);
    if (params.length !== 1 || params[0].Identifier !== "rt" || identifierNameOf(params[0].Type as CsNode) !== "Engine") {
      fail("GC100", buildMethod, "expected `Build` to take a single parameter `Engine rt`");
    }
  }

  // -------------------------------------------------------------------
  // Vars / Events classes, DeclareVar/DeclareEvent, state slots.
  // -------------------------------------------------------------------

  // `public sealed class Vars { private readonly Engine E; public Vars(Engine
  // e) {...} public <T> <name> { get => ...; set => ...; } ... }` — property
  // declaration order IS variable index order (see emit.ts's own header
  // comment: "declaration order IS variable index order"), matched
  // positionally against the SAME-order `rt.DeclareVar(...)` run in `Build`
  // for each name's type+initial value.
  private parseVarsClass(varsClass: CsNode): string[] {
    return nodeList(varsClass.Members)
      .filter((m) => isType(m, "PropertyDeclaration"))
      .map((m) => m.Identifier as string);
  }

  // `public static class Events { public const int <Name> = <i>; ... }`.
  private parseEventsClass(eventsClass: CsNode): string[] {
    const names: string[] = [];
    for (const m of nodeList(eventsClass.Members)) {
      if (!isType(m, "FieldDeclaration")) {
        continue;
      }
      for (const v of nodeList((m.Declaration as CsNode).Variables)) {
        names.push(v.Identifier as string);
      }
    }
    return names;
  }

  private exprCallOf(stmt: CsNode | undefined): CsNode | undefined {
    if (!isType(stmt, "ExpressionStatement")) {
      return undefined;
    }
    const expr = unwrap(stmt!.Expression as CsNode);
    return isType(expr, "InvocationExpression") ? expr : undefined;
  }

  private parseVarDecls(stmts: CsNode[], i: number, varNames: string[]): number {
    varNames.forEach((name, idx) => {
      const stmt = stmts[i + idx];
      const call = this.exprCallOf(stmt);
      const declCall = call ? asAttrCall(call, "rt", "DeclareVar") : undefined;
      if (!declCall) {
        fail("GC103", stmt, "expected an `rt.DeclareVar(...)` matching the `Vars` class's property declarations, in the same order");
      }
      const [typeExpr, initExpr, idExpr] = callArgs(declCall);
      const typeStr = stringLiteralValue(typeExpr);
      const type = typeStr ? CS_TYPE_TO_IR[typeStr] : undefined;
      if (!type) {
        fail("GC103", typeExpr, "rt.DeclareVar's type argument must be a known type-name string literal");
      }
      const initial = this.lowerExpr(initExpr, type, { kind: "proc" });
      if (initial.k !== "const") {
        fail("GC103", initExpr, "rt.DeclareVar's initial-value argument must be a literal");
      }
      // Optional third argument — the source graph variable's original id
      // (see emit-cs's emitVarDecls doc comment); omitted entirely (not a
      // `null` literal, unlike DeclareEvent's args) when the variable never
      // had one.
      const id = stringLiteralValue(idExpr);
      const varIdx = this.variables.length;
      this.variables.push({ name, type, initial: { type, data: initial.data as never }, extras: id ? { id } : undefined });
      this.varIndexByProp.set(`V.${name}`, varIdx);
    });
    return i + varNames.length;
  }

  private parseEventDecls(stmts: CsNode[], i: number, eventNames: string[]): number {
    eventNames.forEach((name, idx) => {
      const stmt = stmts[i + idx];
      const call = this.exprCallOf(stmt);
      const declCall = call ? asAttrCall(call, "rt", "DeclareEvent") : undefined;
      if (!declCall) {
        fail("GC103", stmt, "expected an `rt.DeclareEvent(...)` matching the `Events` class's const declarations, in the same order");
      }
      const [externalIdExpr, boolExpr, intExpr, floatExpr, durationExpr] = callArgs(declCall);
      const externalId = stringLiteralValue(externalIdExpr);
      const values: IREventValue[] = [];
      const boolLit = this.optionalNullableLiteral(boolExpr);
      if (boolLit !== undefined) {
        values.push({ name: "boolParameter", type: "bool", default: { type: "bool", data: [readBoolLiteral(boolLit) ?? false] } });
      }
      const intLit = this.optionalNullableLiteral(intExpr);
      if (intLit !== undefined) {
        values.push({ name: "intParameter", type: "int", default: { type: "int", data: [Math.trunc(readNumberLiteral(intLit) ?? 0)] } });
      }
      const floatLit = this.optionalNullableLiteral(floatExpr);
      if (floatLit !== undefined) {
        values.push({ name: "floatParameter", type: "float", default: { type: "float", data: [readNumberLiteral(floatLit) ?? 0] } });
      }
      const durationLit = this.optionalNullableLiteral(durationExpr);
      if (durationLit !== undefined) {
        values.push({ name: "expectedDuration", type: "float", default: { type: "float", data: [readNumberLiteral(durationLit) ?? 0] } });
      }
      const eventIdx = this.events.length;
      this.events.push({ name, id: externalId, values });
      this.eventIndexByProp.set(`Events.${name}`, eventIdx);
    });
    return i + eventNames.length;
  }

  // `(bool?)<lit>`/`(int?)<lit>`/`(double?)<lit>` -> `<lit>`; `(bool?)null`/
  // `(int?)null`/`(double?)null` -> `undefined` — see @gltfi/emit-cs's
  // `emitEventDecls` doc comment for the full round-trip-fidelity rationale
  // (this cast is the ONE place a `null` literal genuinely means "this value
  // was never declared", not just "peel and ignore" like `unwrapCast`'s
  // usual contract — so this reads the cast directly rather than going
  // through that shared helper).
  private optionalNullableLiteral(node: CsNode | undefined): CsNode | undefined {
    const n = node ? unwrap(node) : undefined;
    return n && literalPType(n) === "null" ? undefined : n;
  }

  private isVarsCtorStmt(stmt: CsNode | undefined): boolean {
    if (!isType(stmt, "LocalDeclarationStatement")) {
      return false;
    }
    const decl = stmt!.Declaration as CsNode;
    const vars = nodeList(decl.Variables);
    if (vars.length !== 1 || vars[0].Identifier !== "V") {
      return false;
    }
    const init = (vars[0].Initializer as CsNode | undefined)?.Value as CsNode | undefined;
    return objectCreationOf(init)?.typeName === "Vars";
  }

  // `int <name> = <init>;` (for-slot) or `var <name> = new <Kind>State();`
  // (every other slot kind) — Build()-level LOCAL declarations, one per
  // state slot, in slot-index order (see emit.ts's own `emitStateSlots`
  // doc comment on why these are plain locals rather than a nested
  // namespace object the way Python's `S.<name>` shape is).
  private tryRegisterStateSlot(stmt: CsNode): boolean {
    if (!isType(stmt, "LocalDeclarationStatement")) {
      return false;
    }
    const decl = stmt.Declaration as CsNode;
    const vars = nodeList(decl.Variables);
    if (vars.length !== 1) {
      return false;
    }
    const name = vars[0].Identifier as string;
    const init = (vars[0].Initializer as CsNode | undefined)?.Value as CsNode | undefined;
    if (!init) {
      return false;
    }
    const num = readNumberLiteral(init);
    if (num !== undefined) {
      const idx = this.stateSlots.length;
      this.stateSlots.push({ name, kind: "for", config: { initialIndex: Math.trunc(num) } });
      this.stateSlotIndexByName.set(name, idx);
      return true;
    }
    const creation = objectCreationOf(init);
    if (!creation) {
      return false;
    }
    const KIND_BY_TYPE: Record<string, StateKind> = {
      DoNState: "doN",
      MultiGateState: "multiGate",
      WaitAllState: "waitAll",
      ThrottleState: "throttle",
      DelayState: "delay"
    };
    const kind = KIND_BY_TYPE[creation.typeName];
    if (!kind) {
      return false;
    }
    const idx = this.stateSlots.length;
    this.stateSlots.push({ name, kind, config: {} });
    this.stateSlotIndexByName.set(name, idx);
    return true;
  }

  // Matches a Build-body-level handler registration (`rt.OnStart(<name>)`/
  // `rt.OnTick(<name>)`/`rt.OnReceive(<idx>, <name>)`) immediately following
  // the local function it registers — see parse-py's identically-purposed
  // `matchHandlerRegistration` doc comment (same "superficial match on the
  // attribute name commits to failing loudly, not falling through" policy).
  private matchHandlerRegistration(next: CsNode | undefined, defName: string): { kind: HandlerKind; eventRef?: number } | undefined {
    const call = this.exprCallOf(next);
    if (!call) {
      return undefined;
    }
    const onStart = asAttrCall(call, "rt", "OnStart");
    if (onStart) {
      const args = callArgs(onStart);
      if (identifierNameOf(unwrap(args[0])) === defName) {
        return { kind: "onStart" };
      }
      fail("GC103", next, "rt.OnStart's argument must reference the immediately preceding local function");
    }
    const onTick = asAttrCall(call, "rt", "OnTick");
    if (onTick) {
      const args = callArgs(onTick);
      if (identifierNameOf(unwrap(args[0])) === defName) {
        return { kind: "onTick" };
      }
      fail("GC103", next, "rt.OnTick's argument must reference the immediately preceding local function");
    }
    const onReceive = asAttrCall(call, "rt", "OnReceive");
    if (onReceive) {
      const args = callArgs(onReceive);
      const idx = this.readEventIndex(args[0]);
      if (idx === undefined) {
        fail("GC103", next, "rt.OnReceive's first argument must be a numeric event-index literal or `Events.<name>`");
      }
      if (identifierNameOf(unwrap(args[1])) !== defName) {
        fail("GC103", next, "rt.OnReceive's second argument must reference the immediately preceding local function");
      }
      return { kind: "receive", eventRef: idx };
    }
    return undefined;
  }

  // Numeric-literal event index, or `Events.<name>` resolved through
  // eventIndexByProp.
  private readEventIndex(node: CsNode | undefined): number | undefined {
    const n = readNumberLiteral(node);
    if (n !== undefined) {
      return n;
    }
    const access = memberAccessOf(node ? unwrap(node) : undefined);
    if (access?.base === "Events") {
      return this.eventIndexByProp.get(`Events.${access.name}`);
    }
    return undefined;
  }

  // -------------------------------------------------------------------
  // Statement lowering.
  // -------------------------------------------------------------------

  private lowerBlock(stmts: CsNode[], ctx: Ctx): IRStmt {
    const out: IRStmt[] = [];
    let i = 0;
    while (i < stmts.length) {
      const { stmt, consumed } = this.parseOne(stmts, i, ctx);
      if (stmt) {
        out.push(stmt);
      }
      i += consumed;
    }
    return { k: "seq", stmts: out };
  }

  private lowerOptionalBlock(stmts: CsNode[], ctx: Ctx): IRStmt | undefined {
    const result = this.lowerBlock(stmts, ctx);
    return result.k === "seq" && result.stmts.length === 0 ? undefined : result;
  }

  // A `{ ... }` Block's own Statements list — every `if`/`while`/local-
  // function/switch-section body this emitter produces is always an
  // explicit Block (see emit.ts's uniform `push("{")`/`push("}")`
  // convention), so the single-statement fallback here is purely defensive.
  private blockStmts(node: CsNode | undefined): CsNode[] {
    if (!node) {
      return [];
    }
    return isType(node, "Block") ? nodeList(node.Statements) : [node];
  }

  private isFieldTruthyCond(cond: CsNode, name: string, field: string): boolean {
    const access = memberAccessOf(unwrap(cond));
    return access?.base === name && access.name === field;
  }

  private parseOne(stmts: CsNode[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const stmt = stmts[i];

    const resetResult = this.tryParseReset(stmts, i);
    if (resetResult) {
      return resetResult;
    }

    // Async ops: optional preceding `void ContN() {...}` continuation, then
    // either a bare call statement, an `if`, or a negated `if` — see
    // tryParseAsync's own doc comment for the shape matrix.
    const asyncResult = this.tryParseAsync(stmts, i, ctx);
    if (asyncResult) {
      return asyncResult;
    }

    if (isType(stmt, "LocalDeclarationStatement")) {
      return this.parseLocalDecl(stmts, i, ctx);
    }

    if (isType(stmt, "ExpressionStatement")) {
      return this.parseExprStmt(stmts, i, ctx);
    }

    if (isType(stmt, "IfStatement")) {
      return this.parseIf(stmts, i, ctx);
    }

    if (isType(stmt, "WhileStatement")) {
      const cond = this.lowerExpr(stmt.Condition as CsNode, "bool", ctx);
      const body = this.lowerBlock(this.blockStmts(stmt.Statement as CsNode), ctx);
      return { stmt: { k: "while", cond, body }, consumed: 1 };
    }

    if (isType(stmt, "SwitchStatement")) {
      return { stmt: this.buildSwitchStmt(stmt, ctx), consumed: 1 };
    }

    fail("GC110", stmt, `unrecognized statement shape (kind ${stmt._type})`);
  }

  private parseLocalDecl(stmts: CsNode[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const stmt = stmts[i];
    const declarator = nodeList((stmt.Declaration as CsNode).Variables)[0];
    const name = declarator.Identifier as string;
    const initRaw = (declarator.Initializer as CsNode).Value as CsNode;
    const init = unwrap(initRaw);

    // `var <res> = rt.Throttle(slot, duration);` — the ONE stateful op that
    // still needs a named local (two DIFFERENT result fields checked in
    // separate branches — see emitStateful's own doc comment).
    const throttleCall = asAttrCall(init, "rt", "Throttle");
    if (throttleCall) {
      return this.parseThrottleWithResult(stmts, i, name, throttleCall, ctx);
    }

    // Plain temp: `var t<n> = <expr>;`.
    const expr = this.lowerExpr(initRaw, undefined, ctx);
    const type = this.typeOfExpr(expr);
    this.tempTypeByName.set(name, type);
    return { stmt: { k: "let", temp: name, type, expr }, consumed: 1 };
  }

  private parseThrottleWithResult(stmts: CsNode[], i: number, resName: string, call: CsNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, durationExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const args = [this.lowerExpr(durationExpr, "float", ctx)];
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (isType(next, "IfStatement") && this.isFieldTruthyCond(next.Condition as CsNode, resName, "Invalid")) {
      const elseClause = next.Else as CsNode | undefined;
      const innerIf = elseClause ? (elseClause.Statement as CsNode) : undefined;
      if (innerIf && isType(innerIf, "IfStatement") && this.isFieldTruthyCond(innerIf.Condition as CsNode, resName, "Fire")) {
        const errBlock = this.lowerOptionalBlock(this.blockStmts(next.Statement as CsNode), ctx);
        const outBlock = this.lowerOptionalBlock(this.blockStmts(innerIf.Statement as CsNode), ctx);
        if (errBlock) outs.err = errBlock;
        if (outBlock) outs.out = outBlock;
        consumed = 2;
      }
    }
    return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs }, consumed };
  }

  private parseExprStmt(stmts: CsNode[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const stmt = stmts[i];
    const inner = unwrap(stmt.Expression as CsNode);

    if (isType(inner, "SimpleAssignmentExpression")) {
      const left = inner.Left as CsNode;
      const right = inner.Right as CsNode;
      const access = memberAccessOf(left);
      if (access?.base === "V") {
        const varId = this.varIndexByProp.get(`V.${access.name}`);
        if (varId === undefined) {
          fail("GC123", left, `unknown variable "${access.name}"`);
        }
        const varType = this.variables[varId].type;
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(right, varType, ctx) }, consumed: 1 };
      }
      const forName = identifierNameOf(unwrap(left));
      if (forName !== undefined) {
        const slotIdx = this.stateSlotIndexByName.get(forName);
        if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "for") {
          return this.parseFor(stmts, i, forName, right, ctx);
        }
      }
      fail("GC110", stmt, "unrecognized assignment-statement shape");
    }

    const cancelSlot = asAttrCall(inner, "rt", "CancelDelaySlot");
    if (cancelSlot) {
      const slot = this.slotRefOf(callArgs(cancelSlot)[0]);
      return { stmt: { k: "intrinsic", op: "flow/setDelay#cancel", config: { slot: slot.slot }, args: [], outs: {} }, consumed: 1 };
    }
    const cancelDelay = asAttrCall(inner, "rt", "CancelDelay");
    if (cancelDelay) {
      const refExpr = this.lowerExpr(callArgs(cancelDelay)[0], "ref", ctx);
      return { stmt: { k: "intrinsic", op: "flow/cancelDelay", config: {}, args: [refExpr], outs: {} }, consumed: 1 };
    }
    const eventOut = asAttrCall(inner, "rt", "EventOut");
    if (eventOut) {
      // Pure emit-time bookkeeping (crossHandlerReads), not part of the IR
      // model — see emit.ts's emitEventOutWrites doc comment.
      return { stmt: null, consumed: 1 };
    }
    const ptrSetBare = asAttrCall(inner, "rt", "PtrSet");
    if (ptrSetBare) {
      return { stmt: this.buildSetPointerStmt(ptrSetBare, undefined, undefined, ctx), consumed: 1 };
    }
    const doNBare = asAttrCall(inner, "rt", "DoN");
    if (doNBare) {
      const [slotExpr, nExpr] = callArgs(doNBare);
      const slot = this.slotRefOf(slotExpr);
      const args = [this.lowerExpr(nExpr, "int", ctx)];
      return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs: {} }, consumed: 1 };
    }
    const multiGateBare = asAttrCall(inner, "rt", "MultiGate");
    if (multiGateBare) {
      return { stmt: this.buildMultiGateStmt(multiGateBare), consumed: 1 };
    }
    const throttleBare = asAttrCall(inner, "rt", "Throttle");
    if (throttleBare) {
      const [slotExpr, durationExpr] = callArgs(throttleBare);
      const slot = this.slotRefOf(slotExpr);
      const args = [this.lowerExpr(durationExpr, "float", ctx)];
      return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs: {} }, consumed: 1 };
    }
    const waitAllBare = asAttrCall(inner, "rt", "WaitAll");
    if (waitAllBare) {
      return { stmt: this.buildWaitAllStmt(waitAllBare, undefined, undefined, ctx), consumed: 1 };
    }
    const send = asAttrCall(inner, "rt", "Send");
    if (send) {
      const sendArgs = callArgs(send);
      const eventId = this.readEventIndex(sendArgs[0]);
      if (eventId === undefined) {
        fail("GC124", sendArgs[0], "rt.Send's first argument must be a numeric literal or `Events.<name>`");
      }
      const args = sendArgs.length >= 2 ? this.lowerEventPayload(sendArgs[1], ctx) : this.eventDefaultArgs(eventId);
      return { stmt: { k: "emitEvent", eventId, args }, consumed: 1 };
    }
    const stopProp = asAttrCall(inner, "rt", "StopPropagation");
    if (stopProp) {
      const [, stopImmediateExpr] = callArgs(stopProp);
      return { stmt: { k: "stopPropagation", stopImmediate: this.lowerExpr(stopImmediateExpr, "bool", ctx), config: {} }, consumed: 1 };
    }
    const log = asAttrCall(inner, "rt", "Log");
    if (log) {
      const [templateExpr, argsExpr] = callArgs(log);
      const template = stringLiteralValue(templateExpr) ?? "";
      const argList = argsExpr ? (listElements(argsExpr) ?? []) : [];
      const args = argList.map((a) => this.lowerExpr(a, undefined, ctx));
      return { stmt: { k: "log", template, args }, consumed: 1 };
    }
    const bare = bareCallOf(inner);
    if (bare && callArgs(bare.call).length === 0) {
      const procId = this.procIndexByName.get(bare.name);
      if (procId !== undefined) {
        return { stmt: { k: "callProc", procId }, consumed: 1 };
      }
    }
    fail("GC110", stmt, "unrecognized call statement (unknown callee)");
  }

  private lowerEventPayload(node: CsNode, ctx: Ctx): IRExpr[] {
    const creation = objectCreationOf(node);
    if (!creation || creation.typeName !== "EventPayload" || creation.args.length !== 4) {
      fail("GC124", node, "rt.Send's payload argument must be `new EventPayload(bool, int, float, float)`");
    }
    const types: IRType[] = ["bool", "int", "float", "float"];
    return creation.args.map((a, k) => this.lowerExpr(a, types[k], ctx));
  }

  private parseIf(stmts: CsNode[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const stmt = stmts[i];
    const test = unwrap(stmt.Condition as CsNode);
    const elseClause = stmt.Else as CsNode | undefined;
    const thenStmts = this.blockStmts(stmt.Statement as CsNode);
    const elseStmts = elseClause ? this.blockStmts(elseClause.Statement as CsNode) : undefined;

    // doN: `if (rt.DoN(slot, n)) { out }` — never has an `else` (no
    // "didn't fire" flow branch exists for this shape).
    if (!elseClause) {
      const doNCall = asAttrCall(test, "rt", "DoN");
      if (doNCall) {
        const [slotExpr, nExpr] = callArgs(doNCall);
        const slot = this.slotRefOf(slotExpr);
        const args = [this.lowerExpr(nExpr, "int", ctx)];
        const outs: Record<string, IRStmt> = {};
        const block = this.lowerOptionalBlock(thenStmts, ctx);
        if (block) outs.out = block;
        return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs }, consumed: 1 };
      }
    }

    const ptrSetCall = asAttrCall(test, "rt", "PtrSet");
    if (ptrSetCall) {
      return { stmt: this.buildSetPointerStmt(ptrSetCall, thenStmts, elseStmts, ctx), consumed: 1 };
    }

    // waitAll always emits BOTH branches (see emit.ts's emitStateful) —
    // `else` is never absent for this shape.
    const waitAllCall = asAttrCall(test, "rt", "WaitAll");
    if (waitAllCall) {
      return { stmt: this.buildWaitAllStmt(waitAllCall, thenStmts, elseStmts, ctx), consumed: 1 };
    }

    // multiGate, single-wired-output shape: `if (rt.MultiGate(...) == 0) {
    // out }` — no `else` (the 2+-output shape uses a native `switch`
    // instead — see buildSwitchStmt).
    if (!elseClause && isType(test, "EqualsExpression")) {
      const left = unwrap(test.Left as CsNode);
      const multiGateCall = asAttrCall(left, "rt", "MultiGate");
      const caseNum = readNumberLiteral(unwrap(test.Right as CsNode));
      if (multiGateCall && caseNum === 0) {
        const stmtNode = this.buildMultiGateStmt(multiGateCall);
        stmtNode.outs["0"] = this.lowerBlock(thenStmts, ctx);
        return { stmt: stmtNode, consumed: 1 };
      }
    }

    // Negated empty-"out" setPointer shape: `if (!rt.PtrSet(...)) { err }`
    // (no else — `!cond` always parses as `!(cond)`, so the operand here
    // is exactly the same Call as the non-negated case).
    if (!elseClause && isType(test, "LogicalNotExpression")) {
      const negInner = unwrap(test.Operand as CsNode);
      const negPtrSet = asAttrCall(negInner, "rt", "PtrSet");
      if (negPtrSet) {
        return { stmt: this.buildSetPointerStmt(negPtrSet, undefined, thenStmts, ctx), consumed: 1 };
      }
      // Generic empty-"then" negated-condition shape (see emit.ts's own
      // "if" case: an empty "then" with a non-empty "else" reads better
      // negated into a single branch).
      const cond = this.lowerExpr(negInner, "bool", ctx);
      const elseBody = this.lowerBlock(thenStmts, ctx);
      return { stmt: { k: "if", cond, then: { k: "seq", stmts: [] }, else: elseBody }, consumed: 1 };
    }

    const cond = this.lowerExpr(test, "bool", ctx);
    const thenS = this.lowerBlock(thenStmts, ctx);
    const elseS = elseStmts ? this.lowerOptionalBlock(elseStmts, ctx) : undefined;
    return { stmt: { k: "if", cond, then: thenS, else: elseS }, consumed: 1 };
  }

  // -------------------------------------------------------------------
  // setPointer
  // -------------------------------------------------------------------

  // `rt.PtrSet(pointer, type, value[, argsDict])` — a FIXED argument order
  // (unlike Python's positional-shape-sniffing dance — see parse-py's own
  // buildSetPointerStmt doc comment — C# has real optional trailing
  // arguments, so `argsDict` is simply absent, not repositioned).
  private buildSetPointerStmt(call: CsNode, outStmts: CsNode[] | undefined, errStmts: CsNode[] | undefined, ctx: Ctx): IRStmt {
    const [pointerExpr, typeExpr, valueExpr, argsObjExpr] = callArgs(call);
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GC125", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GC125", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, ctx);
    const value = this.lowerExpr(valueExpr, type, ctx);
    const out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    const err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return { k: "setPointer", template, args, value, type, out, err };
  }

  // `new Dictionary<string, object> { [name] = value, ... }` — see
  // ast-helpers.ts's `dictionaryEntries` doc comment. Int-kind dynamic
  // params are wrapped `(double)(...)` on the emit side (Pointer.cs boxes
  // every int-kind arg as `double`, never `int`); `lowerExpr` peels that
  // cast transparently (see this file's own header note), so the caller
  // just asks for `"int"` as `expected` directly, same as every other
  // backend's pointer-args reader.
  private lowerPointerArgs(objExpr: CsNode | undefined, template: PtrTemplate, ctx: Ctx): IRExpr[] {
    const params = pointerTemplateParams(template);
    if (params.length === 0) {
      return [];
    }
    const entries = objExpr ? dictionaryEntries(objExpr) : undefined;
    if (!entries) {
      fail("GC125", objExpr, "pointer args must be a `new Dictionary<string, object> { [name] = value, ... }` initializer");
    }
    return params.map((p) => {
      const init = entries.get(p.name);
      if (!init) {
        fail("GC125", objExpr, `pointer args dictionary missing param "${p.name}"`);
      }
      return this.lowerExpr(init, p.kind === "int" ? "int" : "ref", ctx);
    });
  }

  // -------------------------------------------------------------------
  // async ops
  // -------------------------------------------------------------------

  private tryParseAsync(stmts: CsNode[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const stmt = stmts[i];
    const contFn = isType(stmt, "LocalFunctionStatement") ? stmt : undefined;
    const offset = contFn ? 1 : 0;
    const site = stmts[i + offset];
    if (!site) {
      if (contFn) fail("GC122", stmt, "unrecognized local function (expected an async done-continuation)");
      return undefined;
    }

    if (isType(site, "ExpressionStatement")) {
      const matched = matchAsyncCall(unwrap(site.Expression as CsNode));
      if (matched) {
        return { stmt: this.buildAsyncStmt(matched, contFn, undefined, undefined, ctx), consumed: offset + 1 };
      }
    }

    if (isType(site, "IfStatement")) {
      const test = unwrap(site.Condition as CsNode);
      const matched = matchAsyncCall(test);
      if (matched) {
        const elseClause = site.Else as CsNode | undefined;
        const outStmts = this.blockStmts(site.Statement as CsNode);
        const errStmts = elseClause ? this.blockStmts(elseClause.Statement as CsNode) : undefined;
        return { stmt: this.buildAsyncStmt(matched, contFn, outStmts, errStmts, ctx), consumed: offset + 1 };
      }
      // Negated empty-"out" shape: `if (!rt.<Fn>(...)) { err }` (no else).
      if (!site.Else && isType(test, "LogicalNotExpression")) {
        const negMatched = matchAsyncCall(unwrap(test.Operand as CsNode));
        if (negMatched) {
          return { stmt: this.buildAsyncStmt(negMatched, contFn, undefined, this.blockStmts(site.Statement as CsNode), ctx), consumed: offset + 1 };
        }
      }
    }

    if (contFn) {
      fail("GC122", stmt, "unrecognized local function (expected an async done-continuation)");
    }
    return undefined;
  }

  private buildAsyncStmt(
    matched: { kind: AsyncKind; call: CsNode },
    contFn: CsNode | undefined,
    outStmts: CsNode[] | undefined,
    errStmts: CsNode[] | undefined,
    ctx: Ctx
  ): IRStmt {
    const args = callArgs(matched.call);
    const kind = matched.kind;
    let doneArg: CsNode | undefined;
    const baseStmt: Partial<Extract<IRStmt, { k: "async" }>> = { k: "async", kind };

    if (kind === "setDelay") {
      const [slotExpr, durationExpr, doneExpr] = args;
      baseStmt.slot = this.slotRefOf(slotExpr);
      baseStmt.args = [this.lowerExpr(durationExpr, "float", ctx)];
      doneArg = doneExpr;
    } else if (kind === "varInterp") {
      const [varIdExpr, valueExpr, durationExpr, p1Expr, p2Expr, useSlerpExpr, doneExpr] = args;
      const varId = readNumberLiteral(varIdExpr) ?? fail("GC126", varIdExpr, "VarInterp's first argument must be a numeric literal");
      const varType = this.variables[varId]?.type ?? "float";
      baseStmt.config = { varId, useSlerp: readBoolLiteral(unwrap(useSlerpExpr)) ?? false };
      baseStmt.args = [
        this.lowerExpr(valueExpr, varType, ctx),
        this.lowerExpr(durationExpr, "float", ctx),
        this.lowerExpr(p1Expr, "float2", ctx),
        this.lowerExpr(p2Expr, "float2", ctx)
      ];
      doneArg = doneExpr;
    } else if (kind === "ptrInterp") {
      const [pointerExpr, typeExpr, valueExpr, durationExpr, p1Expr, p2Expr, doneExpr, argsObjExpr] = args;
      const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GC126", pointerExpr, "PtrInterp pointer must be a string literal");
      const template = parsePointerTemplate(pointerLit);
      const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GC126", typeExpr, "PtrInterp type must be a string literal");
      const ptrArgs = this.lowerPointerArgs(argsObjExpr, template, ctx);
      baseStmt.template = template;
      baseStmt.type = type;
      baseStmt.args = [
        this.lowerExpr(valueExpr, type, ctx),
        this.lowerExpr(durationExpr, "float", ctx),
        this.lowerExpr(p1Expr, "float2", ctx),
        this.lowerExpr(p2Expr, "float2", ctx),
        ...ptrArgs
      ];
      doneArg = doneExpr;
    } else if (kind === "animStart") {
      const [animExpr, startExpr, endExpr, speedExpr, doneExpr] = args;
      baseStmt.args = [this.lowerExpr(animExpr, "ref", ctx), this.lowerExpr(startExpr, "float", ctx), this.lowerExpr(endExpr, "float", ctx), this.lowerExpr(speedExpr, "float", ctx)];
      doneArg = doneExpr;
    } else if (kind === "animStop") {
      const [animExpr] = args;
      baseStmt.args = [this.lowerExpr(animExpr, "ref", ctx)];
    } else {
      const [animExpr, stopTimeExpr, doneExpr] = args;
      baseStmt.args = [this.lowerExpr(animExpr, "ref", ctx), this.lowerExpr(stopTimeExpr, "float", ctx)];
      doneArg = doneExpr;
    }

    if (doneArg) {
      const unwrapped = unwrap(doneArg);
      if (literalPType(unwrapped) !== "null") {
        if (contFn) {
          baseStmt.done = { kind: "inline", body: this.lowerBlock(nodeList((contFn.Body as CsNode).Statements), ctx) } as Cont;
        } else {
          const procName = identifierNameOf(unwrapped);
          const procId = procName !== undefined ? this.procIndexByName.get(procName) : undefined;
          if (procId === undefined) {
            fail("GC126", doneArg, "async done continuation must be a proc reference, inline local function, or null");
          }
          baseStmt.done = { kind: "proc", procId } as Cont;
        }
      }
    }

    baseStmt.out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    baseStmt.err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return baseStmt as IRStmt;
  }

  // -------------------------------------------------------------------
  // stateful ops
  // -------------------------------------------------------------------

  private slotRefOf(expr: CsNode): { slot: number } {
    const name = identifierNameOf(unwrap(expr));
    if (name === undefined) {
      fail("GC127", expr, "expected a state-slot identifier");
    }
    const idx = this.stateSlotIndexByName.get(name);
    if (idx === undefined) {
      fail("GC127", expr, `unknown state slot "${name}"`);
    }
    return { slot: idx };
  }

  private buildWaitAllStmt(call: CsNode, completedStmts: CsNode[] | undefined, outStmts: CsNode[] | undefined, ctx: Ctx): IRStmt {
    const [slotExpr, inputFlowsExpr, indexExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const inputFlows = readNumberLiteral(inputFlowsExpr);
    if (inputFlows !== undefined) {
      this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { ...this.stateSlots[slot.slot].config, inputFlows: Math.trunc(inputFlows) } };
    }
    const index = readNumberLiteral(indexExpr) ?? 0;
    const outs: Record<string, IRStmt> = {};
    if (completedStmts) {
      const block = this.lowerOptionalBlock(completedStmts, ctx);
      if (block) outs.completed = block;
    }
    if (outStmts) {
      const block = this.lowerOptionalBlock(outStmts, ctx);
      if (block) outs.out = block;
    }
    return { k: "stateful", kind: "waitAll", slot, port: Math.trunc(index), args: [], outs };
  }

  // `rt.MultiGate(slotName, count, isRandom, isLoop)` — `count` (the
  // number of wired outputs) is re-derivable from `outs`'s own key count at
  // emit time, so it's read here for shape-matching only, never stored.
  private buildMultiGateStmt(call: CsNode): Extract<IRStmt, { k: "stateful" }> {
    const [slotExpr, , isRandomExpr, isLoopExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const isRandom = readBoolLiteral(unwrap(isRandomExpr)) ?? false;
    const isLoop = readBoolLiteral(unwrap(isLoopExpr)) ?? false;
    this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { isRandom, isLoop } };
    return { k: "stateful", kind: "multiGate", slot, port: "in", args: [], outs: {} };
  }

  // -------------------------------------------------------------------
  // Native C# `switch` — flow/switch AND multiGate's 2+-output dispatch
  // both compile to this ONE Roslyn shape (unlike Python/Lua's if/elif
  // chains, which need separate readers for each — see this file's header
  // note: C#'s native switch evaluates its own governing expression exactly
  // once, so neither shape needs a hoisted temp the way Python's did).
  // -------------------------------------------------------------------

  private lowerSwitchSectionBody(section: CsNode, ctx: Ctx): IRStmt {
    const outer = nodeList(section.Statements);
    const block = outer[0];
    const inner = isType(block, "Block") ? nodeList(block.Statements) : outer;
    const withoutBreak = inner.length > 0 && isType(inner[inner.length - 1], "BreakStatement") ? inner.slice(0, -1) : inner;
    return this.lowerBlock(withoutBreak, ctx);
  }

  private buildSwitchStmt(stmt: CsNode, ctx: Ctx): IRStmt {
    const selectorNode = unwrap(stmt.Expression as CsNode);
    const multiGateCall = asAttrCall(selectorNode, "rt", "MultiGate");
    if (multiGateCall) {
      const base = this.buildMultiGateStmt(multiGateCall);
      for (const section of nodeList(stmt.Sections)) {
        const body = this.lowerSwitchSectionBody(section, ctx);
        for (const label of nodeList(section.Labels)) {
          if (!isType(label, "CaseSwitchLabel")) continue;
          const num = readNumberLiteral(label.Value as CsNode);
          if (num === undefined) fail("GC128", label, "multiGate switch case must be a numeric literal");
          base.outs[String(num)] = body;
        }
      }
      return base;
    }
    const selector = this.lowerExpr(selectorNode, "int", ctx);
    const cases: Array<[number, IRStmt]> = [];
    let dflt: IRStmt | undefined;
    for (const section of nodeList(stmt.Sections)) {
      const body = this.lowerSwitchSectionBody(section, ctx);
      for (const label of nodeList(section.Labels)) {
        if (isType(label, "CaseSwitchLabel")) {
          const num = readNumberLiteral(label.Value as CsNode);
          if (num === undefined) fail("GC130", label, "switch case must be a numeric literal");
          cases.push([num, body]);
        } else if (isType(label, "DefaultSwitchLabel")) {
          dflt = body;
        }
      }
    }
    return { k: "switch", selector, cases, default: dflt };
  }

  // Reconstructs `rt.Send`'s 4 fixed payload args (bool,int,float,duration)
  // from the event's OWN declared defaults, for the args-less `rt.Send(idx)`
  // shape — see emit.ts's emitStmt "emitEvent" case's `matchesEventDefaults`
  // shorthand.
  private eventDefaultArgs(eventId: number): IRExpr[] {
    const e = this.events[eventId];
    const boolDefault = e?.values.find((v) => v.name === "boolParameter");
    const intDefault = e?.values.find((v) => v.name === "intParameter");
    const floatDefault = e?.values.find((v) => v.name === "floatParameter");
    const duration = e?.values.find((v) => v.name === "expectedDuration");
    return [
      { k: "const", type: "bool", data: [Boolean(boolDefault?.default.data[0] ?? false)] },
      { k: "const", type: "int", data: [Math.trunc(Number(intDefault?.default.data[0] ?? 0))] },
      { k: "const", type: "float", data: [Number(floatDefault?.default.data[0] ?? 0)] },
      { k: "const", type: "float", data: [Number(duration?.default.data[0] ?? 0)] }
    ];
  }

  // Throttle/multiGate/waitAll reset: direct field ASSIGNMENT statements on
  // the slot (`<slot>.Count = 0.0;`, `<slot>.LastTime = null;` +
  // `<slot>.Remaining = double.NaN;`, ...) — the C#-native counterpart of
  // Python's `.pop(...)`/dict-key-assignment reset shapes (see that file's
  // own `tryReadIfElseOn`-adjacent `tryParseReset` doc comment: same
  // per-kind field set, different host-language spelling).
  private tryParseReset(stmts: CsNode[], i: number): { stmt: IRStmt; consumed: number } | null {
    const stmt = stmts[i];
    if (!isType(stmt, "ExpressionStatement")) {
      return null;
    }
    const assign = unwrap(stmt.Expression as CsNode);
    if (!isType(assign, "SimpleAssignmentExpression")) {
      return null;
    }
    const access = memberAccessOf(assign.Left as CsNode);
    if (!access || access.base === undefined) {
      return null;
    }
    const slotIdx = this.stateSlotIndexByName.get(access.base);
    if (slotIdx === undefined) {
      return null;
    }
    const kind = this.stateSlots[slotIdx].kind;
    if (kind === "doN" && access.name === "Count") {
      return { stmt: { k: "stateful", kind: "doN", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 1 };
    }
    if (kind === "throttle" && access.name === "LastTime") {
      return { stmt: { k: "stateful", kind: "throttle", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    if (kind === "multiGate" && access.name === "Used") {
      return { stmt: { k: "stateful", kind: "multiGate", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    if (kind === "waitAll" && access.name === "Activated") {
      const nextStmt = stmts[i + 1];
      if (isType(nextStmt, "ExpressionStatement")) {
        const nextAssign = unwrap(nextStmt.Expression as CsNode);
        if (isType(nextAssign, "SimpleAssignmentExpression")) {
          const nextAccess = memberAccessOf(nextAssign.Left as CsNode);
          if (nextAccess?.base === access.base && nextAccess.name === "Remaining") {
            const n = readNumberLiteral(unwrap(nextAssign.Right as CsNode));
            if (n !== undefined) {
              this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(n) } };
            }
          }
        }
      }
      return { stmt: { k: "stateful", kind: "waitAll", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    return null;
  }

  // -------------------------------------------------------------------
  // for
  // -------------------------------------------------------------------

  private parseFor(stmts: CsNode[], i: number, slotName: string, startExpr: CsNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const slotIdx = this.stateSlotIndexByName.get(slotName)!;
    const next = stmts[i + 1];
    if (!isType(next, "WhileStatement")) {
      fail("GC129", next, "expected a `while` loop following a for-slot assignment");
    }
    const cond = unwrap(next.Condition as CsNode);
    if (!isType(cond, "LessThanExpression") || identifierNameOf(unwrap(cond.Left as CsNode)) !== slotName) {
      fail("GC129", cond, `expected \`${slotName} < (end)\` for a for-loop condition`);
    }
    const start = this.lowerExpr(startExpr, "int", ctx);
    const end = this.lowerExpr(unwrap(cond.Right as CsNode), "int", ctx);
    const bodyStmts = this.blockStmts(next.Statement as CsNode);
    const last = bodyStmts[bodyStmts.length - 1];
    if (!isType(last, "ExpressionStatement") || !isType(unwrap(last.Expression as CsNode), "SimpleAssignmentExpression")) {
      fail("GC129", last, "expected the for-loop body's last statement to be the index increment");
    }
    const body = this.lowerBlock(bodyStmts.slice(0, -1), ctx);
    return { stmt: { k: "for", slot: { slot: slotIdx }, start, end, body }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // Expression lowering.
  // -------------------------------------------------------------------

  // Literal-token int-vs-float distinction for a node that MIGHT not be a
  // bare `Literal` (also recognizes `int.MinValue`/`double.NaN`/`double.
  // Positive|NegativeInfinity` and a `UnaryMinusExpression`-negated literal
  // — see ast-helpers.ts's `readNumberLiteral` doc comment for the same
  // three shapes, this just returns the TYPE instead of the VALUE).
  private literalNumKind(node: CsNode): "int" | "float" | undefined {
    const n = unwrap(node);
    const pt = literalPType(n);
    if (pt === "int") return "int";
    if (pt === "float") return "float";
    if (isType(n, "UnaryMinusExpression")) return this.literalNumKind(n.Operand as CsNode);
    const access = memberAccessOf(n);
    if (access?.base === "int" && access.name === "MinValue") return "int";
    if (access?.base === "double" && (access.name === "NaN" || access.name === "PositiveInfinity" || access.name === "NegativeInfinity")) return "float";
    return undefined;
  }

  // Bottom-up peek at whichever operand isn't literal-ish (mirrors parse-
  // py's/parse-ts's identically-purposed `inferScalarKind`/
  // `disambiguateOverload` strategy) to pick which of `allowed`'s concrete
  // types a native binary op was over — BROADER than parse-py's own version
  // (which only ever needed bool/float — see this file's header note on why
  // C#'s native-op surface covers int too).
  private inferScalarKind(a: CsNode, b: CsNode, ctx: Ctx, allowed: IRType[]): IRType {
    for (const n of [a, b]) {
      const un = unwrap(n);
      if (isLiteralish(un)) continue;
      const t = this.typeOfExpr(this.lowerExpr(un, undefined, ctx));
      if (allowed.includes(t)) return t;
    }
    for (const n of [a, b]) {
      const kind = this.literalNumKind(n);
      if (kind && allowed.includes(kind)) return kind;
      if (allowed.includes("bool") && readBoolLiteral(unwrap(n)) !== undefined) return "bool";
    }
    return allowed.includes("float") ? "float" : allowed[0];
  }

  private inferNumericOperandType(node: CsNode, ctx: Ctx): IRType {
    const un = unwrap(node);
    const kind = this.literalNumKind(un);
    if (kind) return kind;
    if (!isLiteralish(un)) {
      const t = this.typeOfExpr(this.lowerExpr(un, undefined, ctx));
      if (t === "int" || t === "float") return t;
    }
    return "float";
  }

  // Inverse of emit.ts's `nativeOpInfo`/`emitNativeOp` — see this file's
  // header note on why this is the BROADEST tryLowerNativeOp of any backend
  // (native int arithmetic/comparisons, on top of the float/bool coverage
  // Python/Lua also have).
  private tryLowerNativeOp(node: CsNode, ctx: Ctx): IRExpr | undefined {
    if (isType(node, "UnaryMinusExpression")) {
      // A bare negative NUMERIC LITERAL is caught earlier by
      // readNumberLiteral (lowerExpr's very first check) — reaching here
      // means the operand isn't a literal.
      const operand = node.Operand as CsNode;
      const t = this.inferNumericOperandType(operand, ctx);
      const a = this.lowerExpr(operand, t, ctx);
      const overload = resolveOverload("math/neg", { a: t });
      if (!overload) fail("GC161", node, "could not resolve native neg overload");
      return { k: "op", op: "math/neg", overload, args: [a] };
    }
    if (isType(node, "LogicalNotExpression")) {
      const a = this.lowerExpr(node.Operand as CsNode, "bool", ctx);
      const overload = resolveOverload("math/not", { a: "bool" });
      if (!overload) fail("GC161", node, "could not resolve native not overload");
      return { k: "op", op: "math/not", overload, args: [a] };
    }
    if (isType(node, "LogicalAndExpression") || isType(node, "LogicalOrExpression")) {
      const op = node._type === "LogicalAndExpression" ? "math/and" : "math/or";
      return this.buildBinaryOp(op, "bool", node.Left as CsNode, node.Right as CsNode, ctx);
    }
    // `!=` only ever means bool xor for this emitter (there is no native
    // numeric "not equal" op — see emit.ts's own `nativeOpInfo`).
    if (isType(node, "NotEqualsExpression")) {
      return this.buildBinaryOp("math/xor", "bool", node.Left as CsNode, node.Right as CsNode, ctx);
    }
    if (isType(node, "EqualsExpression")) {
      const kind = this.inferScalarKind(node.Left as CsNode, node.Right as CsNode, ctx, ["bool", "int", "float"]);
      return this.buildBinaryOp("math/eq", kind, node.Left as CsNode, node.Right as CsNode, ctx);
    }
    const REL_OPS: Record<string, string> = {
      LessThanExpression: "math/lt",
      LessThanOrEqualExpression: "math/le",
      GreaterThanExpression: "math/gt",
      GreaterThanOrEqualExpression: "math/ge"
    };
    if (node._type in REL_OPS) {
      const kind = this.inferScalarKind(node.Left as CsNode, node.Right as CsNode, ctx, ["int", "float"]);
      return this.buildBinaryOp(REL_OPS[node._type], kind, node.Left as CsNode, node.Right as CsNode, ctx);
    }
    const ARITH_OPS: Record<string, string> = { AddExpression: "math/add", SubtractExpression: "math/sub", MultiplyExpression: "math/mul" };
    if (node._type in ARITH_OPS) {
      const kind = this.inferScalarKind(node.Left as CsNode, node.Right as CsNode, ctx, ["int", "float"]);
      return this.buildBinaryOp(ARITH_OPS[node._type], kind, node.Left as CsNode, node.Right as CsNode, ctx);
    }
    // Only FLOAT division is ever native — int division always stays
    // `M.DivInt` (throws `DivideByZeroException` for a zero divisor, unlike
    // `double`'s safe IEEE-754 behavior — see emit.ts's own `nativeOpInfo`
    // doc comment), so no int-vs-float inference is needed here at all.
    if (isType(node, "DivideExpression")) {
      return this.buildBinaryOp("math/div", "float", node.Left as CsNode, node.Right as CsNode, ctx);
    }
    return undefined;
  }

  private buildBinaryOp(op: string, kind: IRType, leftNode: CsNode, rightNode: CsNode, ctx: Ctx): IRExpr {
    const a = this.lowerExpr(leftNode, kind, ctx);
    const b = this.lowerExpr(rightNode, kind, ctx);
    const overload = resolveOverload(op, { a: kind, b: kind } as Record<string, TypeSig>);
    if (!overload) {
      fail("GC161", rightNode, `could not resolve native overload for "${op}" with operand type "${kind}"`);
    }
    return { k: "op", op, overload, args: [a, b] };
  }

  private lowerExpr(rawNode: CsNode, expected: IRType | undefined, ctx: Ctx): IRExpr {
    // Cross-handler read: the ONE construct whose outer CAST carries real
    // type information (see ast-helpers.ts's `unwrapCast` doc comment) —
    // checked BEFORE the generic `unwrap` below discards it.
    const castPeek = unwrapCast(rawNode);
    if (castPeek) {
      const evtRead = asAttrCall(castPeek.inner, "rt", "EventOutRead");
      if (evtRead) {
        const [nodeExpr, socketExpr] = callArgs(evtRead);
        const sourceNode = readNumberLiteral(nodeExpr) ?? 0;
        const socket = stringLiteralValue(socketExpr) ?? "";
        this.diagnostics.push({ severity: "info", code: "GC180", message: `best-effort reconstruction of cross-handler read rt.EventOutRead(${sourceNode}, "${socket}")` });
        return { k: "intrinsic", op: "event/unknown", config: { crossContext: true, socket, sourceNode }, args: [], type: castPeek.irType ?? expected ?? "ref" };
      }
    }

    const node = unwrap(rawNode);

    const num = readNumberLiteral(node);
    if (num !== undefined) {
      const t = expected ?? this.literalNumKind(node) ?? "float";
      return { k: "const", type: t, data: [t === "int" ? Math.trunc(num) : num] };
    }
    if (literalPType(node) === "bool") {
      return { k: "const", type: "bool", data: [node.value as boolean] };
    }
    if (literalPType(node) === "str") {
      return { k: "const", type: "ref", data: [node.value as string] };
    }
    const listEl = listElements(node);
    if (listEl) {
      const nums = listEl.map((e) => readNumberLiteral(e) ?? fail("GC140", e, "array literal element must be a numeric literal"));
      const type = expected ?? lengthToType(nums.length, F_FAMILY) ?? fail("GC140", node, `cannot infer type for a ${nums.length}-element array literal`);
      return { k: "const", type, data: nums };
    }

    const native = this.tryLowerNativeOp(node, ctx);
    if (native) {
      return native;
    }

    if (asAttrCall(node, "rt", "Random")) {
      const overload = resolveOverload("math/random", {})!;
      return { k: "op", op: "math/random", overload, args: [] };
    }
    if (asAttrCall(node, "rt", "TickTime")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceStart" }, args: [], type: "float" };
    }
    if (asAttrCall(node, "rt", "TickDelta")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceLastTick" }, args: [], type: "float" };
    }

    // `<slot>.Remaining ?? <inputFlows>` — waitAll's `remainingInputs` read
    // (see emit.ts's `emitStateRead`'s own `??`-based doc comment).
    if (isType(node, "CoalesceExpression")) {
      const left = unwrap(node.Left as CsNode);
      const access = memberAccessOf(left);
      if (access?.base !== undefined && access.name === "Remaining") {
        const slotIdx = this.stateSlotIndexByName.get(access.base);
        if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "waitAll") {
          const inputFlows = readNumberLiteral(unwrap(node.Right as CsNode));
          if (inputFlows !== undefined) {
            this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(inputFlows) } };
          }
          return { k: "stateRead", slot: { slot: slotIdx }, field: "remainingInputs", type: "int" };
        }
      }
    }

    // Every `base.Name` member-access read this emitter produces:
    // `V.<name>` (variable), `rt.PtrGet(...).Value`/`.IsValid`, `rt.
    // EventPayloadOf(<event>).<Field>`, `<slot>.<Field>` (stateRead),
    // `M.<fn>(...).<PascalSocket>` (multi-output socket read), `payload.
    // <Field>` (receive handler's own payload param, dict-free — always a
    // plain param here, unlike `EventPayloadOf`'s cross-event read).
    if (isType(node, "SimpleMemberAccessExpression")) {
      const access = memberAccessOf(node)!;
      const base = unwrap(node.Expression as CsNode);

      if (access.base === "V" && this.varIndexByProp.has(`V.${access.name}`)) {
        return { k: "varGet", varId: this.varIndexByProp.get(`V.${access.name}`)! };
      }

      const ptrGetCall = asAttrCall(base, "rt", "PtrGet");
      if (ptrGetCall) {
        if (access.name === "IsValid") return this.lowerPtrGet(ptrGetCall, true);
        if (access.name === "Value") return this.lowerPtrGet(ptrGetCall, false);
      }

      const payloadOfCall = asAttrCall(base, "rt", "EventPayloadOf");
      if (payloadOfCall) {
        const eventIndex = this.readEventIndex(callArgs(payloadOfCall)[0]) ?? 0;
        const field = PAYLOAD_PROP[access.name];
        if (field) {
          return { k: "intrinsic", op: "event/receive#payload", config: { eventIndex, field }, args: [], type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
        }
      }

      if (access.base === "payload" && ctx.kind === "handler" && ctx.handlerKind === "receive") {
        const field = PAYLOAD_PROP[access.name];
        if (field) {
          return { k: "param", name: field, type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
        }
      }

      if (access.base !== undefined) {
        const slotIdx = this.stateSlotIndexByName.get(access.base);
        if (slotIdx !== undefined) {
          return this.lowerStateFieldRead(slotIdx, access.name);
        }
      }

      const mCall = attrCallOf(base);
      if (mCall && mCall.base === "M") {
        return this.lowerMCall(base, mCall.attr, expected, ctx, lowerFirst(access.name));
      }
    }

    // `M.<fn>(...)[<i>]` — numeric-socket multi-output read (e.g.
    // math/extractN).
    if (isType(node, "ElementAccessExpression")) {
      const base = unwrap(node.Expression as CsNode);
      const mCall = attrCallOf(base);
      if (mCall && mCall.base === "M") {
        const idxArgs = nodeList((node.ArgumentList as CsNode | undefined)?.Arguments).map((a) => a.Expression as CsNode);
        const idx = readNumberLiteral(idxArgs[0]);
        if (idx !== undefined) {
          return this.lowerMCall(base, mCall.attr, expected, ctx, String(idx));
        }
      }
      fail("GC143", node, "expected a literal socket index into a multi-output M.* call");
    }

    const switchCaseCall = asAttrCall(node, "M", "SwitchCase");
    if (switchCaseCall) {
      return this.lowerMathSwitch(switchCaseCall, expected, ctx);
    }
    const mBare = attrCallOf(node);
    if (mBare && mBare.base === "M") {
      return this.lowerMCall(node, mBare.attr, expected, ctx);
    }

    if (isType(node, "IdentifierName")) {
      const text = node.Identifier as string;
      if (ctx.kind === "handler" && ctx.handlerKind === "onTick" && (text === "timeSinceStart" || text === "timeSinceLastTick")) {
        return { k: "param", name: text, type: "float" };
      }
      const slotIdx = this.stateSlotIndexByName.get(text);
      if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "for") {
        return { k: "stateRead", slot: { slot: slotIdx }, field: "index", type: "int" };
      }
      if (this.tempTypeByName.has(text)) {
        return { k: "temp", id: text };
      }
      fail("GC150", node, `unresolved identifier "${text}"`);
    }

    fail("GC140", node, `unrecognized expression shape (kind ${node._type})`);
  }

  private lowerStateFieldRead(slotIdx: number, field: string): IRExpr {
    const kind = this.stateSlots[slotIdx].kind;
    if (kind === "doN" && field === "Count") return { k: "stateRead", slot: { slot: slotIdx }, field: "currentCount", type: "int" };
    if (kind === "multiGate" && field === "LastIndex") return { k: "stateRead", slot: { slot: slotIdx }, field: "lastIndex", type: "int" };
    if (kind === "delay" && field === "LastRef") return { k: "stateRead", slot: { slot: slotIdx }, field: "lastDelay", type: "ref" };
    if (kind === "throttle" && field === "Remaining") return { k: "stateRead", slot: { slot: slotIdx }, field: "lastRemainingTime", type: "float" };
    fail("GC140", undefined, `unrecognized state-slot field read "${field}" on slot kind "${kind}"`);
  }

  private lowerPtrGet(call: CsNode, wantIsValid: boolean): IRExpr {
    const [pointerExpr, typeExpr, argsObjExpr] = callArgs(call);
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GC141", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const valueType = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GC141", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, { kind: "proc" });
    return { k: "ptrGet", template, args, type: wantIsValid ? "bool" : valueType, valueType, wantIsValid };
  }

  private lowerMathSwitch(call: CsNode, expected: IRType | undefined, ctx: Ctx): IRExpr {
    const [selectionExpr, casesExpr, valuesExpr, defaultExpr] = callArgs(call);
    const caseNodes = listElements(casesExpr);
    const valueNodes = listElements(valuesExpr);
    if (!caseNodes || !valueNodes) {
      fail("GC142", call, "M.SwitchCase's cases/values arguments must be plain array literals");
    }
    const cases = caseNodes.map((e) => readNumberLiteral(e) ?? fail("GC142", e, "switch case must be a numeric literal"));
    let outType: IRType | undefined = expected;
    if (!outType) {
      for (const n of [defaultExpr, ...valueNodes]) {
        if (n && !isLiteralish(unwrap(n))) {
          outType = this.typeOfExpr(this.lowerExpr(n, undefined, ctx));
          break;
        }
      }
    }
    outType = outType ?? "float";
    const selection = this.lowerExpr(selectionExpr, "int", ctx);
    const dflt = this.lowerExpr(defaultExpr, outType, ctx);
    const caseArgs = valueNodes.map((n) => this.lowerExpr(n, outType as IRType, ctx));
    return { k: "intrinsic", op: "math/switch", config: { cases }, args: [selection, dflt, ...caseArgs], type: outType };
  }

  private lowerMCall(call: CsNode, rawFnName: string, expected: IRType | undefined, ctx: Ctx, socket?: string): IRExpr {
    const argNodes = callArgs(call);
    // See `lowerFirst`'s own doc comment: try the call's exact spelling
    // against the shared reverse table first (covers `M.Pi`/`Tau`/`Inf`/
    // `NaN`/`E`, whose registered op segment is already capitalized), only
    // falling back to a lower-cased first letter for the ordinary case.
    const fnName = lookupMFunctions(rawFnName, argNodes.length).length > 0 ? rawFnName : lowerFirst(rawFnName);
    if (fnName === "quatFromAngles") {
      const [xN, yN, zN, orderN] = argNodes;
      const overload = resolveOverload("math/quatFromAngles", { x: "float", y: "float", z: "float" })!;
      const order = stringLiteralValue(orderN) ?? "yxz";
      return {
        k: "op",
        op: "math/quatFromAngles",
        overload,
        args: [this.lowerExpr(xN, "float", ctx), this.lowerExpr(yN, "float", ctx), this.lowerExpr(zN, "float", ctx)],
        config: { order }
      };
    }

    const candidates = lookupMFunctions(fnName, argNodes.length);
    if (candidates.length === 0) {
      fail("GC143", call, `unknown M.${rawFnName}(...) call`);
    }
    const op = candidates[0].op;
    const spec = getOpSpec(op);
    if (!spec) {
      fail("GC143", call, `op "${op}" not found in registry`);
    }
    const overloadIndex = candidates.length === 1 ? candidates[0].overloadIndex : this.disambiguateOverload(candidates, spec, argNodes, expected, ctx);
    const row = spec.overloads[overloadIndex];
    if (row.inputs.length !== argNodes.length) {
      fail("GC143", call, `M.${rawFnName} arg count ${argNodes.length} != expected ${row.inputs.length}`);
    }

    const hasGeneric = row.inputs.some((s) => isGenericSig(s.type)) || row.outputs.some((o) => isGenericSig(o.type));
    const argExprs: IRExpr[] = new Array(row.inputs.length);
    let pinned: IRType | undefined;

    if (hasGeneric) {
      const genericLetter = row.inputs.find((s) => isGenericSig(s.type))?.type ?? row.outputs.find((o) => isGenericSig(o.type))?.type;
      const family = genericLetter && isGenericSig(genericLetter) ? familyOf(genericLetter) : null;
      row.inputs.forEach((s, idx) => {
        if (!isGenericSig(s.type) || isLiteralish(unwrap(argNodes[idx]))) {
          return;
        }
        const e = this.lowerExpr(argNodes[idx], undefined, ctx);
        argExprs[idx] = e;
        pinned = pinned ?? this.typeOfExpr(e);
      });
      if (!pinned && expected && (!family || family.includes(expected))) {
        pinned = expected;
      }
      if (!pinned) {
        for (let idx = 0; idx < row.inputs.length; idx += 1) {
          if (!isGenericSig(row.inputs[idx].type)) continue;
          const node = unwrap(argNodes[idx]);
          const els = listElements(node);
          const arrLen = els ? els.length : readNumberLiteral(node) !== undefined ? 1 : undefined;
          if (arrLen !== undefined && family) {
            pinned = lengthToType(arrLen, family);
            if (pinned) break;
          }
        }
      }
      pinned = pinned ?? (family ? family[0] : "float");
    }

    row.inputs.forEach((s, idx) => {
      if (argExprs[idx]) {
        return;
      }
      const socketType: IRType = isGenericSig(s.type) ? (pinned as IRType) : typeSigToIRType(s.type as TypeSig);
      argExprs[idx] = this.lowerExpr(argNodes[idx], socketType, ctx);
    });

    const inputTypesByName: Record<string, TypeSig> = {};
    row.inputs.forEach((s, idx) => {
      inputTypesByName[s.name] = (isGenericSig(s.type) ? pinned : s.type) as TypeSig;
    });
    const overload = resolveOverload(op, inputTypesByName);
    if (!overload) {
      fail("GC143", call, `could not resolve overload for op "${op}" with inputs ${JSON.stringify(inputTypesByName)}`);
    }
    const resultSocket = socket && socket !== "value" ? socket : undefined;
    if (resultSocket !== undefined && !(resultSocket in overload.outputs)) {
      fail("GC143", call, `op "${op}" has no output socket "${resultSocket}"`);
    }
    return { k: "op", op, overload, args: argExprs, socket: resultSocket };
  }

  private disambiguateOverload(candidates: FnCandidate[], spec: OpSpec, argNodes: CsNode[], expected: IRType | undefined, ctx: Ctx): number {
    for (let idx = 0; idx < argNodes.length; idx += 1) {
      if (isLiteralish(unwrap(argNodes[idx]))) {
        continue;
      }
      const t = this.typeOfExpr(this.lowerExpr(argNodes[idx], undefined, ctx));
      const matches = candidates.filter((c) => spec.overloads[c.overloadIndex].inputs[idx]?.type === t);
      if (matches.length === 1) {
        return matches[0].overloadIndex;
      }
    }
    if (expected) {
      const matches = candidates.filter((c) => spec.overloads[c.overloadIndex].outputs.find((o) => o.name === "value")?.type === expected);
      if (matches.length === 1) {
        return matches[0].overloadIndex;
      }
    }
    return candidates[0].overloadIndex;
  }

  // -------------------------------------------------------------------
  // Bottom-up type inference (for temps and generic-op pinning).
  // -------------------------------------------------------------------

  private typeOfExpr(expr: IRExpr): IRType {
    switch (expr.k) {
      case "const":
        return expr.type;
      case "varGet":
        return this.variables[expr.varId]?.type ?? "float";
      case "ptrGet":
        return expr.type;
      case "param":
        return expr.type;
      case "op": {
        const socket = expr.socket ?? "value";
        const t = expr.overload.outputs[socket];
        return t ? typeSigToIRType(t) : "float";
      }
      case "temp":
        return this.tempTypeByName.get(expr.id) ?? "float";
      case "stateRead":
        return expr.type;
      case "intrinsic":
        return expr.type;
    }
  }
}
