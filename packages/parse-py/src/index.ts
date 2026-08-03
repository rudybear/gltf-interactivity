// Python -> IR parser (packages/parse-py). Mirrors @gltfi/parse-lua's
// index.ts (read that file first — this header only calls out where Python
// differs) — a mechanical INVERSE of @gltfi/emit-py's emit.ts, case for
// case, targeting exactly the subset that emitter produces (see its own
// header comment for the generated module's shape: `import gltfi_runtime.m
// as m` [+ `from types import SimpleNamespace` if there are state slots],
// then `def build(rt): rt.vars(...) rt.events(...) <state slots> <procs>
// <handlers> end`).
//
// Why a real CPython subprocess instead of a JS-side Python grammar: same
// rationale as parse-lua's luaparse dependency (a real grammar, whitespace/
// formatting-agnostic) taken one step further — rather than adding a THIRD
// hand-rolled or third-party Python parser dependency, this reuses CPython
// itself. @gltfi/runtime-py's harness.py gained a `{"cmd":"ast", code}`
// command (see that file's own doc comments) that runs the source through
// Python's OWN `ast.parse` and dumps the resulting tree as JSON; this
// package (via ./session.ts) spawns that harness ONCE, lazily, and reuses it
// for every `parseModulePy` call, turning `ast.parse`'s otherwise-async
// subprocess round trip into the same kind of genuinely-synchronous
// blocking call parseModuleLua/parseModule already are (see session.ts's own
// header for the FIFO trick this borrows from run-compiled-py.ts).
// `parseModulePy`'s second, optional `astProvider` parameter exists so tests
// can inject a stub AST directly (no subprocess at all) when exercising
// malformed-input diagnostics that would be awkward to phrase as valid
// Python; the exported `closeParser()` shuts the shared session down so a
// caller (run-roundtrip-py.ts's `main()`, a vitest `afterAll`) exits
// promptly instead of leaving the child process/fds dangling.
//
// Overload resolution (@gltfi/kernel's resolveOverload) is driven the same
// way parse-ts/parse-lua drive it: from the `m.*` call name via
// @gltfi/kernel's shared fn-naming reverse table, plus literal shapes plus
// variable/event/pointer declared types propagated through the value DAG
// bottom-up. The ONE genuinely Python-specific wrinkle: emit-py renames a
// handful of `m.*` functions that collide with Python keywords/builtins
// (`and`/`or`/`not`/`abs`/`min`/`max`/`pow`/`round` -> `and_`/`or_`/.../
// `round_` — see emit.ts's own `PY_RENAME` table), so `PY_UNRENAME` below
// reverses exactly that rewrite BEFORE consulting the shared reverse table
// (which knows nothing about either backend's own keyword-collision
// renaming — it operates purely on the ORIGINAL base names).
//
// Deliberate simplifications shared with parse-lua/parse-ts (identical
// rationale, see either file's header): while/for's `completed` and
// flow/cancelDelay's `outs.out` are reconstructed as flat seq siblings
// rather than round-tripping the exact original nesting.
//
// One genuinely Python-specific improvement over parse-lua: Lua forces
// EVERY numeral into the float subtype (see that file's own header note),
// so its parser has no choice but to default an unannotated numeric literal
// to "float". Python's `ast.Constant` distinguishes `int` and `float` at the
// VALUE level (emit-py's own `pyIntLiteral`/`pyFloatLiteral` never produce
// an ambiguous literal — see that file's header note: "a value's Python
// runtime type always matches its IRType"), and harness.py's `ast_to_dict`
// stamps an explicit `_ptype` tag on every `Constant` node specifically so
// this information survives the JSON round trip (plain JSON can't otherwise
// distinguish `5` from `5.0` once parsed back into a JS number). This parser
// uses that tag (see `literalNumType` below) to infer a bare numeral's IR
// type EXACTLY, not merely as a best-effort fallback.
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
  constPType,
  dictField,
  dictKeys,
  isLiteralish,
  isType,
  listElements,
  nodeList,
  readBoolLiteral,
  readNumberLiteral,
  sAttrOf,
  sSubscriptOf,
  stringLiteralValue,
  type PyNode
} from "./ast-helpers.js";
import { closeSession, fetchAst } from "./session.js";

export type ParseResult = { module: IRModule; diagnostics: Diagnostic[] };
export type AstProvider = (code: string) => PyNode;

class ParseError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function fail(code: string, node: PyNode | undefined, message: string): never {
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

export function parseModulePy(code: string, astProvider?: AstProvider): ParseResult {
  let root: PyNode;
  try {
    root = (astProvider ?? fetchAst)(code) as PyNode;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { module: emptyModule(), diagnostics: [{ severity: "error", code: "GP001", message: `Python syntax error: ${message}` }] };
  }

  try {
    const parser = new ModuleParser();
    const module = parser.run(nodeList(root.body));
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

// See parse-lua's own `lengthToType` doc comment (identical rationale).
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

// See this file's own header note: unlike Lua's forced-float-literal
// convention, a Python `Constant`'s own `_ptype` tag (or the `float("nan"/
// "inf"/"-inf")` call shape, or a `UnaryOp(USub, ...)` wrapper) tells us its
// IR numeric type EXACTLY, with no fallback guessing needed.
function literalNumType(node: PyNode): IRType | undefined {
  const pt = constPType(node);
  if (pt === "int") return "int";
  if (pt === "float") return "float";
  if (isType(node, "UnaryOp") && isType(node.op as PyNode, "USub")) {
    return literalNumType(node.operand as PyNode);
  }
  const bare = bareCallOf(node);
  if (bare && bare.name === "float") {
    return "float";
  }
  return undefined;
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

// Reverse of emit-py's `PY_RENAME` (only the bare, non-Int-suffixed forms
// collide with a Python keyword/builtin — see that table's own doc comment).
const PY_UNRENAME: Record<string, string> = {
  and_: "and",
  or_: "or",
  not_: "not",
  abs_: "abs",
  min_: "min",
  max_: "max",
  pow_: "pow",
  round_: "round"
};

// Reverse of emit-py's async-call dispatch (`rt.set_delay`/`rt.var_interp`/
// `rt.ptr_interp`/`rt.anim_start`/`rt.anim_stop`/`rt.anim_stop_at`).
type AsyncKind = "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt";
const ASYNC_ATTR_TO_KIND: Record<string, AsyncKind> = {
  set_delay: "setDelay",
  var_interp: "varInterp",
  ptr_interp: "ptrInterp",
  anim_start: "animStart",
  anim_stop: "animStop",
  anim_stop_at: "animStopAt"
};

function matchAsyncCall(expr: PyNode | undefined): { kind: AsyncKind; call: PyNode } | undefined {
  const c = attrCallOf(expr);
  if (!c || c.base !== "rt") {
    return undefined;
  }
  const kind = ASYNC_ATTR_TO_KIND[c.attr];
  return kind ? { kind, call: c.call } : undefined;
}

function isNoneConstant(node: PyNode | undefined): boolean {
  return constPType(node) === "none";
}

// Matches EITHER the old bare `rt.<name>([...])` expression-statement shape
// or the new `X = rt.<name>({...})` assignment shape — both accepted for
// `vars`/`events` (mirrors @gltfi/parse-lua's identically-named helper).
function matchNamedCall(stmt: PyNode | undefined, attr: string): { call: PyNode; boundName?: string } | undefined {
  if (!stmt) {
    return undefined;
  }
  if (isType(stmt, "Expr")) {
    const call = asAttrCall(stmt.value as PyNode, "rt", attr);
    return call ? { call } : undefined;
  }
  if (isType(stmt, "Assign") && nodeList(stmt.targets).length === 1 && isType(nodeList(stmt.targets)[0], "Name")) {
    const call = asAttrCall(stmt.value as PyNode, "rt", attr);
    return call ? { call, boundName: (nodeList(stmt.targets)[0] as PyNode).id as string } : undefined;
  }
  return undefined;
}

// `not <inner>` unwrap — used by the negated-condition shapes (empty-then
// `if`, async/setPointer err-only) exactly like emit-py's own negateCond
// produces.
function unwrapNot(cond: PyNode): { negated: boolean; inner: PyNode } {
  if (isType(cond, "UnaryOp") && isType(cond.op as PyNode, "Not")) {
    return { negated: true, inner: cond.operand as PyNode };
  }
  return { negated: false, inner: cond };
}

// `<expr>[<field>]` bare string-keyed subscript (used to recognize an
// INLINE call result read directly in an `if` condition, e.g.
// `rt.set_delay(...)["ok"]`, with no named local backing it at all).
function fieldOf(expr: PyNode, field: string): PyNode | undefined {
  if (!isType(expr, "Subscript")) {
    return undefined;
  }
  return stringLiteralValue(expr.slice as PyNode) === field ? (expr.value as PyNode) : undefined;
}

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
  // Dict-form accessor lookup: `"<boundName>.<propName>"` -> variable/event
  // index (see matchNamedCall/parseVars/parseEvents's population) —
  // identical convention to @gltfi/parse-lua's varIndexByProp/eventIndexByProp.
  private varIndexByProp = new Map<string, number>();
  private eventIndexByProp = new Map<string, number>();

  run(topStmts: PyNode[]): IRModule {
    const stmts = this.findFactoryBody(topStmts);
    let i = 0;

    const varsMatch = matchNamedCall(stmts[i], "vars");
    if (!varsMatch) {
      fail("GP101", stmts[i], "expected rt.vars([...]) as the first statement");
    }
    this.parseVars(varsMatch);
    i += 1;

    const eventsMatch = matchNamedCall(stmts[i], "events");
    if (!eventsMatch) {
      fail("GP102", stmts[i], "expected rt.events([...]) as the second statement");
    }
    this.parseEvents(eventsMatch);
    i += 1;

    // State slots: `S = SimpleNamespace()` (only if the emitter had any to
    // emit — see emit.ts's emitStateSlots) followed by a run of
    // `S.<name> = <init>` assignments matching one of the six known shapes.
    if (isType(stmts[i], "Assign")) {
      const targets = nodeList(stmts[i].targets);
      const target = targets[0];
      const value = stmts[i].value as PyNode;
      const bare = bareCallOf(value);
      if (targets.length === 1 && isType(target, "Name") && target.id === "S" && bare?.name === "SimpleNamespace") {
        i += 1;
        while (i < stmts.length && this.tryRegisterStateSlot(stmts[i])) {
          i += 1;
        }
      }
    }

    // Procs and handlers: a run of top-level `def`s, each either a plain
    // proc (referenced later by name via a bare call) or a handler whose
    // very next statement is its registration call (`rt.on_start`/
    // `rt.on_tick`/`rt.on_receive`) referencing it — see matchHandlerRegistration.
    const procBodies: PyNode[][] = [];
    type HandlerDesc = { kind: HandlerKind; eventRef?: number; bodyStmts: PyNode[] };
    const handlerDescs: HandlerDesc[] = [];
    while (i < stmts.length) {
      const s = stmts[i];
      if (!isType(s, "FunctionDef")) {
        fail("GP104", s, "expected a proc definition or a handler registration (def + rt.on_start/rt.on_tick/rt.on_receive)");
      }
      const defName = s.name as string;
      const handlerMatch = this.matchHandlerRegistration(stmts[i + 1], defName);
      if (handlerMatch) {
        handlerDescs.push({ kind: handlerMatch.kind, eventRef: handlerMatch.eventRef, bodyStmts: nodeList(s.body) });
        i += 2;
        continue;
      }
      const id = this.procs.length;
      this.procIndexByName.set(defName, id);
      this.procs.push({ id, name: defName, body: { k: "seq", stmts: [] } });
      procBodies.push(nodeList(s.body));
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

  private exprCallOf(stmt: PyNode | undefined): PyNode | undefined {
    if (!isType(stmt, "Expr")) {
      return undefined;
    }
    const value = (stmt as PyNode).value as PyNode;
    return isType(value, "Call") ? value : undefined;
  }

  private findFactoryBody(topStmts: PyNode[]): PyNode[] {
    const buildIdx = topStmts.findIndex((s) => isType(s, "FunctionDef") && s.name === "build");
    if (buildIdx === -1) {
      fail("GP100", topStmts[0], "expected a top-level `def build(rt) -> None: ...` function");
    }
    if (buildIdx !== topStmts.length - 1) {
      fail("GP100", topStmts[buildIdx + 1], "expected `def build` to be the module's last top-level statement");
    }
    for (let k = 0; k < buildIdx; k += 1) {
      const s = topStmts[k];
      if (!isType(s, "Import") && !isType(s, "ImportFrom")) {
        fail("GP100", s, "expected only import statements before `def build`");
      }
    }
    const fn = topStmts[buildIdx];
    const fnArgs = fn.args as PyNode;
    const posArgs = nodeList(fnArgs.args);
    if (
      posArgs.length !== 1 ||
      (posArgs[0] as PyNode).arg !== "rt" ||
      nodeList(fnArgs.posonlyargs).length !== 0 ||
      nodeList(fnArgs.kwonlyargs).length !== 0 ||
      fnArgs.vararg ||
      fnArgs.kwarg
    ) {
      fail("GP100", fn, "expected `def build` to take a single parameter named `rt`");
    }
    return nodeList(fn.body);
  }

  // -------------------------------------------------------------------
  // vars / events / state slots
  // -------------------------------------------------------------------

  // Old form: `rt.vars([{"type":...,"initial":...}, ...])` (list literal,
  // synthetic `var<N>` names). New form: `V = rt.vars({"counter1":
  // rt.int_(0), ...})` (dict literal — Python 3.7+ dict insertion order IS
  // the variable index order, the load-bearing contract this relies on,
  // same as the array form's element order).
  private parseVars(match: { call: PyNode; boundName?: string }) {
    const arg = callArgs(match.call)[0];
    if (isType(arg, "Dict")) {
      this.parseVarsDict(arg as PyNode, match.boundName ?? "V");
      return;
    }
    const arr = listElements(arg);
    if (!arr) {
      fail("GP101", arg, "rt.vars expects a list or dict literal argument");
    }
    arr.forEach((el, idx) => {
      if (!isType(el, "Dict")) {
        fail("GP101", el, "rt.vars element must be a dict literal");
      }
      const typeExpr = dictField(el, "type");
      const type = stringLiteralValue(typeExpr);
      if (!type) {
        fail("GP101", el, 'rt.vars element missing string "type"');
      }
      const initExpr = dictField(el, "initial");
      const initial = initExpr ? this.lowerExpr(initExpr, type as IRType, { kind: "proc" }) : { k: "const" as const, type: type as IRType, data: defaultValue(type as IRType).data };
      if (initial.k !== "const") {
        fail("GP101", initExpr, "rt.vars initial value must be a literal");
      }
      this.variables.push({ name: `var${idx}`, type: type as IRType, initial: { type: type as IRType, data: initial.data as never } });
    });
  }

  // `{"counter1": rt.int_(0.0), ...}` — dict key order is the variable
  // index order. Each key's real name round-trips exactly (unlike the
  // plain-list form's synthetic `var<N>`).
  private parseVarsDict(dict: PyNode, boundName: string) {
    const keys = nodeList(dict.keys);
    const values = nodeList(dict.values);
    keys.forEach((keyNode, idx) => {
      const name = stringLiteralValue(keyNode);
      if (!name) {
        fail("GP101", keyNode, "rt.vars dict key must be a string literal");
      }
      const decl = this.parseVarDeclShorthand(values[idx]);
      const varIdx = this.variables.length;
      this.variables.push({ name, type: decl.type, initial: { type: decl.type, data: decl.data as never } });
      this.varIndexByProp.set(`${boundName}.${name}`, varIdx);
    });
  }

  // `rt.int_(0)`/`rt.bool_(False)`/`rt.float_(0.0)`/`rt.float2(x,y)`/../
  // `rt.ref_(s)` — inverse of emit-py's varDeclCall, mirrors engine.py's
  // int_/bool_/float_/.../ref_ factory methods' own defaults.
  private parseVarDeclShorthand(init: PyNode): { type: IRType; data: Array<number | boolean | string> } {
    const c = attrCallOf(init);
    if (!c || c.base !== "rt") {
      fail("GP101", init, "rt.vars dict value must be an rt.<type>(...) declaration helper call");
    }
    const args = callArgs(c.call);
    const type = c.attr.endsWith("_") ? c.attr.slice(0, -1) : c.attr;
    if (type === "bool") {
      return { type: "bool", data: [args[0] ? readBoolLiteral(args[0]) ?? false : false] };
    }
    if (type === "ref") {
      return { type: "ref", data: [args[0] ? stringLiteralValue(args[0]) ?? "" : ""] };
    }
    if (type === "int") {
      return { type: "int", data: [args[0] ? Math.trunc(readNumberLiteral(args[0]) ?? 0) : 0] };
    }
    if (type === "float") {
      return { type: "float", data: [args[0] ? readNumberLiteral(args[0]) ?? 0 : 0] };
    }
    const VECTOR_MATRIX_DEFAULTS: Record<string, number[]> = {
      float2: [0, 0],
      float3: [0, 0, 0],
      float4: [0, 0, 0, 0],
      float2x2: [1, 0, 0, 1],
      float3x3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      float4x4: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    };
    if (!(type in VECTOR_MATRIX_DEFAULTS)) {
      fail("GP101", init, `unknown rt.${c.attr}(...) variable-declaration helper`);
    }
    const nums = args.map((a) => readNumberLiteral(a) ?? 0);
    return { type: type as IRType, data: nums.length > 0 ? nums : VECTOR_MATRIX_DEFAULTS[type] };
  }

  private parseEvents(match: { call: PyNode; boundName?: string }) {
    const arg = callArgs(match.call)[0];
    if (isType(arg, "Dict")) {
      this.parseEventsDict(arg as PyNode, match.boundName ?? "E");
      return;
    }
    const arr = listElements(arg);
    if (!arr) {
      fail("GP102", arg, "rt.events expects a list or dict literal argument");
    }
    arr.forEach((el, idx) => {
      if (!isType(el, "Dict")) {
        fail("GP102", el, "rt.events element must be a dict literal");
      }
      const { externalId, values } = this.parseEventValues(el);
      this.events.push({ name: `event${idx}`, id: externalId, values });
    });
  }

  private parseEventValues(el: PyNode): { externalId: string | undefined; values: IREventValue[] } {
    const externalId = stringLiteralValue(dictField(el, "externalId"));
    const values: IREventValue[] = [];
    const boolExpr = dictField(el, "defaultBool");
    if (boolExpr) {
      values.push({ name: "boolParameter", type: "bool", default: { type: "bool", data: [readBoolLiteral(boolExpr) ?? false] } });
    }
    const intExpr = dictField(el, "defaultInt");
    if (intExpr) {
      values.push({ name: "intParameter", type: "int", default: { type: "int", data: [readNumberLiteral(intExpr) ?? 0] } });
    }
    const floatExpr = dictField(el, "defaultFloat");
    if (floatExpr) {
      values.push({ name: "floatParameter", type: "float", default: { type: "float", data: [readNumberLiteral(floatExpr) ?? 0] } });
    }
    const durExpr = dictField(el, "expectedDuration");
    if (durExpr) {
      values.push({ name: "expectedDuration", type: "float", default: { type: "float", data: [readNumberLiteral(durExpr) ?? 0] } });
    }
    return { externalId, values };
  }

  // `{"Explode": {"externalId": ..., ...}, ...}` — same insertion-order-is-
  // index-order contract as parseVarsDict.
  private parseEventsDict(dict: PyNode, boundName: string) {
    const keys = nodeList(dict.keys);
    const values = nodeList(dict.values);
    keys.forEach((keyNode, idx) => {
      const name = stringLiteralValue(keyNode);
      if (!name) {
        fail("GP102", keyNode, "rt.events dict key must be a string literal");
      }
      const el = values[idx];
      if (!isType(el, "Dict")) {
        fail("GP102", el, "rt.events dict value must be a dict literal");
      }
      const { externalId, values: eventValues } = this.parseEventValues(el);
      const eventIdx = this.events.length;
      this.events.push({ name, id: externalId, values: eventValues });
      this.eventIndexByProp.set(`${boundName}.${name}`, eventIdx);
    });
  }

  // Reconstructs `rt.send`'s 4 fixed payload args (bool,int,float,duration)
  // from the event's OWN declared defaults, for the args-less `rt.send(idx)`
  // shape — see emit-py's emitEvent/matchesEventDefaults doc comment.
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

  // `E["<name>"]` (dict form) resolves through eventIndexByProp; a bare
  // numeric literal (list form, unchanged) resolves directly.
  private readEventIndex(node: PyNode | undefined): number | undefined {
    const n = readNumberLiteral(node);
    if (n !== undefined) {
      return n;
    }
    if (node && isType(node, "Subscript") && isType(node.value as PyNode, "Name")) {
      const boundName = (node.value as PyNode).id as string;
      const key = stringLiteralValue(node.slice as PyNode);
      if (key !== undefined) {
        return this.eventIndexByProp.get(`${boundName}.${key}`);
      }
    }
    return undefined;
  }

  private tryRegisterStateSlot(stmt: PyNode): boolean {
    if (!isType(stmt, "Assign") || nodeList(stmt.targets).length !== 1) {
      return false;
    }
    const name = sAttrOf(nodeList(stmt.targets)[0]);
    if (name === undefined) {
      return false;
    }
    const init = stmt.value as PyNode;
    const num = readNumberLiteral(init);
    if (num !== undefined) {
      const idx = this.stateSlots.length;
      this.stateSlots.push({ name, kind: "for", config: { initialIndex: Math.trunc(num) } });
      this.stateSlotIndexByName.set(name, idx);
      return true;
    }
    // New state-slot factory-call shape: `S.<name> = rt.do_n_state()`/etc —
    // see engine.py's do_n_state/multi_gate_state/wait_all_state/
    // throttle_state/delay_state.
    const factoryCall = attrCallOf(init);
    if (factoryCall && factoryCall.base === "rt") {
      const FACTORY_KIND: Record<string, StateKind> = {
        do_n_state: "doN",
        multi_gate_state: "multiGate",
        wait_all_state: "waitAll",
        throttle_state: "throttle",
        delay_state: "delay"
      };
      const kind = FACTORY_KIND[factoryCall.attr];
      if (kind) {
        const idx = this.stateSlots.length;
        this.stateSlots.push({ name, kind, config: {} });
        this.stateSlotIndexByName.set(name, idx);
        return true;
      }
      return false;
    }
    if (!isType(init, "Dict")) {
      return false;
    }
    const keys = dictKeys(init);
    let kind: StateKind | undefined;
    if (keys.has("lastId") && keys.has("lastRef") && keys.has("ids")) kind = "delay";
    else if (keys.has("count") && keys.size === 1) kind = "doN";
    else if (keys.has("lastIndex") && keys.has("used")) kind = "multiGate";
    else if (keys.has("activated") && keys.size === 1) kind = "waitAll";
    else if (keys.has("remaining") && keys.size === 1) kind = "throttle";
    if (!kind) {
      return false;
    }
    const idx = this.stateSlots.length;
    this.stateSlots.push({ name, kind, config: {} });
    this.stateSlotIndexByName.set(name, idx);
    return true;
  }

  // Matches a top-level handler registration (`rt.on_start(name)`/
  // `rt.on_tick(name)`/`rt.on_receive(idx, name)`) immediately following the
  // `def <name>` it registers. Returns `undefined` (not a diagnostic) when
  // `next` isn't an attempt at one of these three calls at all — the caller
  // then treats the preceding `def` as a plain proc — but throws once it
  // superficially matches one of the three attribute names, since at that
  // point a mismatch (wrong referenced name, non-literal event index) can
  // only mean the source diverged from emit.ts's own convention.
  private matchHandlerRegistration(next: PyNode | undefined, defName: string): { kind: HandlerKind; eventRef?: number } | undefined {
    if (!isType(next, "Expr")) {
      return undefined;
    }
    const call = (next as PyNode).value as PyNode;
    const onStart = asAttrCall(call, "rt", "on_start");
    if (onStart) {
      const args = callArgs(onStart);
      if (isType(args[0], "Name") && args[0].id === defName) {
        return { kind: "onStart" };
      }
      fail("GP103", next, "rt.on_start's argument must reference the immediately preceding `def`");
    }
    const onTick = asAttrCall(call, "rt", "on_tick");
    if (onTick) {
      const args = callArgs(onTick);
      if (isType(args[0], "Name") && args[0].id === defName) {
        return { kind: "onTick" };
      }
      fail("GP103", next, "rt.on_tick's argument must reference the immediately preceding `def`");
    }
    const onReceive = asAttrCall(call, "rt", "on_receive");
    if (onReceive) {
      const args = callArgs(onReceive);
      const idx = this.readEventIndex(args[0]);
      if (idx === undefined) {
        fail("GP103", next, "rt.on_receive's first argument must be a numeric event-index literal or `E[\"<name>\"]`");
      }
      if (!(isType(args[1], "Name") && args[1].id === defName)) {
        fail("GP103", next, "rt.on_receive's second argument must reference the immediately preceding `def`");
      }
      return { kind: "receive", eventRef: idx };
    }
    return undefined;
  }

  // -------------------------------------------------------------------
  // Statement lowering
  // -------------------------------------------------------------------

  private lowerBlock(stmts: PyNode[], ctx: Ctx): IRStmt {
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

  private lowerOptionalBlock(stmts: PyNode[], ctx: Ctx): IRStmt | undefined {
    const result = this.lowerBlock(stmts, ctx);
    return result.k === "seq" && result.stmts.length === 0 ? undefined : result;
  }

  // `<boundName>["<name>"].get()` / `<boundName>["<name>"].set(value)` — the
  // dict-form accessor call shape (see engine.py's vars doc comment).
  // Returns the `"<base>.<prop>"` lookup key (checked against
  // varIndexByProp by the two call sites) plus the call's own arguments
  // (empty for "get", one value for "set").
  private matchAccessorCall(expr: PyNode, method: "get" | "set"): { key: string; args: PyNode[] } | undefined {
    if (!isType(expr, "Call")) {
      return undefined;
    }
    const func = expr.func as PyNode | undefined;
    if (!isType(func, "Attribute") || (func as PyNode).attr !== method) {
      return undefined;
    }
    const objExpr = (func as PyNode).value as PyNode | undefined;
    if (!isType(objExpr, "Subscript") || !isType((objExpr as PyNode).value as PyNode, "Name")) {
      return undefined;
    }
    const boundName = ((objExpr as PyNode).value as PyNode).id as string;
    const key = stringLiteralValue((objExpr as PyNode).slice as PyNode);
    if (key === undefined) {
      return undefined;
    }
    return { key: `${boundName}.${key}`, args: callArgs(expr) };
  }

  private isFieldTruthyCond(cond: PyNode, name: string, field: string): boolean {
    if (!isType(cond, "Subscript")) {
      return false;
    }
    const value = cond.value as PyNode;
    return isType(value, "Name") && value.id === name && stringLiteralValue(cond.slice as PyNode) === field;
  }

  private isFieldEqCond(cond: PyNode, name: string, field: string): boolean {
    if (!isType(cond, "Compare")) {
      return false;
    }
    const ops = nodeList(cond.ops);
    const comparators = nodeList(cond.comparators);
    if (ops.length !== 1 || comparators.length !== 1 || (ops[0] as PyNode)._type !== "Eq") {
      return false;
    }
    const left = cond.left as PyNode;
    return isType(left, "Subscript") && isType(left.value as PyNode, "Name") && (left.value as PyNode).id === name && stringLiteralValue(left.slice as PyNode) === field;
  }

  // Shared by doN/waitAll's `if R["<field>"]: ... [else: ...]` lookahead —
  // throttle's invalid/fire elif chain and multiGate's index elif chain are
  // different enough (two/many distinct branches, not one) to need their own
  // bespoke readers (parseThrottle/parseMultiGate).
  private tryReadIfElseOn(next: PyNode | undefined, name: string, field: string, ctx: Ctx): { out?: IRStmt; err?: IRStmt } | undefined {
    if (!isType(next, "If") || !this.isFieldTruthyCond(next!.test as PyNode, name, field)) {
      return undefined;
    }
    const out = this.lowerOptionalBlock(nodeList(next!.body), ctx);
    const orelse = nodeList(next!.orelse);
    if (orelse.length === 0) {
      return { out };
    }
    if (orelse.length === 1 && isType(orelse[0], "If")) {
      return undefined; // an elif chain here is never this shape's own convention
    }
    return { out, err: this.lowerOptionalBlock(orelse, ctx) };
  }

  private parseOne(stmts: PyNode[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const stmt = stmts[i];

    if (isType(stmt, "Pass")) {
      // The exact inverse of emit.ts's emitBlock/emitHandlerBody's own
      // "insert `pass` for an otherwise-empty block" convention.
      return { stmt: null, consumed: 1 };
    }

    const resetResult = this.tryParseReset(stmts, i);
    if (resetResult) {
      return resetResult;
    }

    // --- async ops: optional `def __contN() -> None: ...` then either
    // shape (see tryParseAsync's own doc comment for the full old/new shape
    // matrix). Checked early since it can match a bare FunctionDef (always
    // an async done-continuation in this parser), a `resVar =
    // rt.<async_fn>(...)` assignment, a bare `rt.<async_fn>(...)`
    // statement, or a bare `if rt.<async_fn>(...)["ok"]: ...`.
    const asyncResult = this.tryParseAsync(stmts, i, ctx);
    if (asyncResult) {
      return asyncResult;
    }

    if (isType(stmt, "Assign") && nodeList(stmt.targets).length === 1) {
      const target = nodeList(stmt.targets)[0] as PyNode;
      const init = stmt.value as PyNode;

      if (isType(target, "Name")) {
        const name = target.id as string;

        const ptrSet = asAttrCall(init, "rt", "ptr_set");
        if (ptrSet) return this.parseSetPointer(stmts, i, ptrSet, ctx);

        const doN = asAttrCall(init, "rt", "do_n");
        if (doN) return this.parseDoN(stmts, i, name, doN, ctx);
        const multiGate = asAttrCall(init, "rt", "multi_gate");
        if (multiGate) return this.parseMultiGate(stmts, i, name, multiGate, ctx);
        const waitAll = asAttrCall(init, "rt", "wait_all");
        if (waitAll) return this.parseWaitAll(stmts, i, name, waitAll, ctx);
        const throttle = asAttrCall(init, "rt", "throttle");
        if (throttle) return this.parseThrottle(stmts, i, name, throttle, ctx);

        const switchResult = this.tryParseSwitchAfterLet(stmts, i, name, init, ctx);
        if (switchResult) return switchResult;

        // Plain temp.
        const expr = this.lowerExpr(init, undefined, ctx);
        const type = this.typeOfExpr(expr);
        this.tempTypeByName.set(name, type);
        return { stmt: { k: "let", temp: name, type, expr }, consumed: 1 };
      }

      if (isType(target, "Attribute")) {
        // Bare `V.<name> = <expr>` (new emit-py output shape — see
        // tryParseVarAssign's doc comment). Checked before the `S.<name>`
        // for-loop shape below since both are Attribute-target assignments,
        // but distinguished at the AST level the same way lowerExpr's read
        // side is: this only matches varIndexByProp's own "V.<name>"-style
        // keys, never an "S.<name>" for-slot.
        const varAssign = this.tryParseVarAssign(stmts, i, ctx);
        if (varAssign) return varAssign;
        const forResult = this.tryParseFor(stmts, i, ctx);
        if (forResult) return forResult;
      }
      fail("GP110", stmt, "unrecognized assignment-statement shape");
    }

    if (isType(stmt, "Expr")) {
      const call = stmt.value as PyNode;
      if (!isType(call, "Call")) {
        fail("GP110", stmt, "unrecognized expression-statement shape (a bare non-call expression is never emitted by this backend)");
      }

      const cancelSlot = asAttrCall(call, "rt", "cancel_delay_slot");
      if (cancelSlot) {
        const slot = this.slotRefOf(callArgs(cancelSlot)[0]);
        return { stmt: { k: "intrinsic", op: "flow/setDelay#cancel", config: { slot: slot.slot }, args: [], outs: {} }, consumed: 1 };
      }
      const cancelDelay = asAttrCall(call, "rt", "cancel_delay");
      if (cancelDelay) {
        const refExpr = this.lowerExpr(callArgs(cancelDelay)[0], "ref", ctx);
        return { stmt: { k: "intrinsic", op: "flow/cancelDelay", config: {}, args: [refExpr], outs: {} }, consumed: 1 };
      }
      const eventOut = asAttrCall(call, "rt", "event_out");
      if (eventOut) {
        // Pure emit-time bookkeeping (crossHandlerReads), not part of the
        // IR model — see emit-py's emitEventOutWrites doc comment.
        return { stmt: null, consumed: 1 };
      }
      // setPointer, new bare-statement shape (no out/err at all — see
      // emit-py's emitSetPointer doc comment).
      const ptrSetBare = asAttrCall(call, "rt", "ptr_set");
      if (ptrSetBare) {
        return { stmt: this.buildSetPointerStmt(ptrSetBare, undefined, undefined, ctx), consumed: 1 };
      }
      // Stateful ops with NO branch at all wired still MUST run (they
      // advance state) — emit-py emits a bare, return-value-discarding call
      // statement for exactly this case (see emitStateful's `else` branches).
      const doNBare = asAttrCall(call, "rt", "do_n");
      if (doNBare) {
        const [slotExpr, nExpr] = callArgs(doNBare);
        const slot = this.slotRefOf(slotExpr);
        const args = [this.lowerExpr(nExpr, "int", ctx)];
        return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs: {} }, consumed: 1 };
      }
      const multiGateBare = asAttrCall(call, "rt", "multi_gate");
      if (multiGateBare) {
        return { stmt: this.buildMultiGateStmt(multiGateBare), consumed: 1 };
      }
      const waitAllBare = asAttrCall(call, "rt", "wait_all");
      if (waitAllBare) {
        return { stmt: this.buildWaitAllStmt(waitAllBare, undefined, undefined, ctx), consumed: 1 };
      }
      const throttleBare = asAttrCall(call, "rt", "throttle");
      if (throttleBare) {
        const [slotExpr, durationExpr] = callArgs(throttleBare);
        const slot = this.slotRefOf(slotExpr);
        const args = [this.lowerExpr(durationExpr, "float", ctx)];
        return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs: {} }, consumed: 1 };
      }
      const setVar = asAttrCall(call, "rt", "set_var");
      if (setVar) {
        const [idxExpr, valExpr] = callArgs(setVar);
        const varId = readNumberLiteral(idxExpr);
        if (varId === undefined) fail("GP123", idxExpr, "rt.set_var's first argument must be a numeric literal");
        const varType = this.variables[varId]?.type ?? fail("GP123", idxExpr, `rt.set_var references out-of-range var ${varId}`);
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(valExpr, varType, ctx) }, consumed: 1 };
      }
      // Dict form: `V["<name>"].set(value)` — see matchAccessorCall's doc
      // comment and parseVarsDict's varIndexByProp population.
      const setAccessor = this.matchAccessorCall(call, "set");
      if (setAccessor && this.varIndexByProp.has(setAccessor.key)) {
        const varId = this.varIndexByProp.get(setAccessor.key)!;
        const varType = this.variables[varId]?.type ?? "float";
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(setAccessor.args[0], varType, ctx) }, consumed: 1 };
      }
      const send = asAttrCall(call, "rt", "send");
      if (send) {
        const sendArgs = callArgs(send);
        const eventId = this.readEventIndex(sendArgs[0]);
        if (eventId === undefined) fail("GP124", sendArgs[0], 'rt.send\'s first argument must be a numeric literal or `E["<name>"]`');
        // Three call shapes (see engine.py's send doc comment): OLD
        // `(idx, external_id, payload)` (3 args — payload is args[2],
        // external_id is ignored), NEW `(idx, payload)` (2 args), and NEW
        // `(idx)` alone (1 arg — every value equals the event's own
        // declared default, reconstructed by eventDefaultArgs).
        const payloadExpr = sendArgs.length >= 3 ? sendArgs[2] : sendArgs.length === 2 ? sendArgs[1] : undefined;
        const types: IRType[] = ["bool", "int", "float", "float"];
        const args = payloadExpr
          ? (() => {
              const elems = listElements(payloadExpr);
              if (!elems || elems.length !== 4) {
                fail("GP124", payloadExpr, "rt.send's payload argument must be a 4-element list literal");
              }
              return elems.map((e, k) => this.lowerExpr(e, types[k], ctx));
            })()
          : this.eventDefaultArgs(eventId);
        return { stmt: { k: "emitEvent", eventId, args }, consumed: 1 };
      }
      const stopProp = asAttrCall(call, "rt", "stop_propagation");
      if (stopProp) {
        const [, stopImmediateExpr] = callArgs(stopProp);
        return { stmt: { k: "stopPropagation", stopImmediate: this.lowerExpr(stopImmediateExpr, "bool", ctx), config: {} }, consumed: 1 };
      }
      const log = asAttrCall(call, "rt", "log");
      if (log) {
        const [templateExpr, argsExpr] = callArgs(log);
        const template = stringLiteralValue(templateExpr) ?? "";
        const argList = listElements(argsExpr) ?? [];
        const args = argList.map((a) => this.lowerExpr(a, undefined, ctx));
        return { stmt: { k: "log", template, args }, consumed: 1 };
      }
      const bare = bareCallOf(call);
      if (bare && callArgs(bare.call).length === 0) {
        const procId = this.procIndexByName.get(bare.name);
        if (procId !== undefined) {
          return { stmt: { k: "callProc", procId }, consumed: 1 };
        }
      }
      fail("GP110", stmt, "unrecognized call statement (unknown callee)");
    }

    if (isType(stmt, "If")) {
      const test = stmt.test as PyNode;
      const orelse = nodeList(stmt.orelse);
      const hasPlainElse = orelse.length > 0 && !(orelse.length === 1 && isType(orelse[0], "If"));

      // `if rt.do_n(slot, n):` — doN's fire decision is now a bare boolean
      // (see engine.py's do_n doc comment), inlined directly into the test
      // with no result variable at all (there's no "no-fire" flow branch
      // to speak of, so an `else`/`elif` here is never emitted for this
      // shape).
      if (orelse.length === 0) {
        const doNCall = asAttrCall(test, "rt", "do_n");
        if (doNCall) {
          const [slotExpr, nExpr] = callArgs(doNCall);
          const slot = this.slotRefOf(slotExpr);
          const args = [this.lowerExpr(nExpr, "int", ctx)];
          const outs: Record<string, IRStmt> = {};
          const block = this.lowerOptionalBlock(nodeList(stmt.body), ctx);
          if (block) outs.out = block;
          return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs }, consumed: 1 };
        }
      }
      // setPointer, new bare-`if` shape (no named result — see emit-py's
      // emitSetPointer doc comment).
      if (orelse.length === 0 || hasPlainElse) {
        const ptrSetIfCall = asAttrCall(test, "rt", "ptr_set");
        if (ptrSetIfCall) {
          return { stmt: this.buildSetPointerStmt(ptrSetIfCall, nodeList(stmt.body), hasPlainElse ? orelse : undefined, ctx), consumed: 1 };
        }
      }
      // waitAll, new bare-`if` shape (no named result — `"completed"` read
      // at most once, see emit-py's emitStateful's waitAll case).
      if (orelse.length === 0 || hasPlainElse) {
        const completedBase = fieldOf(test, "completed");
        const waitAllCall = completedBase ? asAttrCall(completedBase, "rt", "wait_all") : undefined;
        if (waitAllCall) {
          return { stmt: this.buildWaitAllStmt(waitAllCall, nodeList(stmt.body), hasPlainElse ? orelse : undefined, ctx), consumed: 1 };
        }
      }
      // multiGate, new single-wired-output bare-`if` shape: `if
      // rt.multi_gate(...)["index"] == 0:` (no elif chain — see emit-py's
      // emitStateful's multiGate case: 2+ outputs instead use a named
      // result + elif chain, structurally identical to the OLD shape
      // parseMultiGate already handles unchanged).
      if (orelse.length === 0 && isType(test, "Compare") && nodeList(test.ops).length === 1 && (nodeList(test.ops)[0] as PyNode)._type === "Eq") {
        const indexBase = fieldOf(test.left as PyNode, "index");
        const multiGateCall = indexBase ? asAttrCall(indexBase, "rt", "multi_gate") : undefined;
        const caseNum = readNumberLiteral(nodeList(test.comparators)[0]);
        if (multiGateCall && caseNum !== undefined) {
          const stmtNode = this.buildMultiGateStmt(multiGateCall);
          stmtNode.outs[String(caseNum)] = this.lowerBlock(nodeList(stmt.body), ctx);
          return { stmt: stmtNode, consumed: 1 };
        }
      }
      // setPointer, negated empty-"out" bare-`if` shape: `if not
      // rt.ptr_set(...): errBody` (no else) — see emit-py's emitSetPointer
      // doc comment. A bare function-call result is always atomic, so the
      // negated operand is exactly the same Call as the non-negated case.
      if (orelse.length === 0) {
        const { negated, inner } = unwrapNot(test);
        if (negated) {
          const negPtrSetCall = asAttrCall(inner, "rt", "ptr_set");
          if (negPtrSetCall) {
            return { stmt: this.buildSetPointerStmt(negPtrSetCall, undefined, nodeList(stmt.body), ctx), consumed: 1 };
          }
          // Generic empty-"then" negated-condition shape: `if not cond:
          // elseBody` (no else at all) — see emit-py's emitStmt "if" case's
          // thenEmpty branch. Reconstructs the ORIGINAL (un-negated) cond,
          // an empty "then", and the printed body as "else" — the exact
          // inverse of that transform. Checked last (after every more-
          // specific negated shape above) since it's the most general
          // match on a bare `not <expr>` test with no else.
          const cond = this.lowerExpr(inner, "bool", ctx);
          const elseBody = this.lowerBlock(nodeList(stmt.body), ctx);
          return { stmt: { k: "if", cond, then: { k: "seq", stmts: [] }, else: elseBody }, consumed: 1 };
        }
      }

      // NOTE: neither a native `==` in an `if` test, NOR an `orelse` of
      // exactly one nested `If`, is on its own proof of a flow/switch or
      // multiGate dispatch reaching this point unrecognized:
      //   - the readability pass's native-operator substitution renders
      //     float/bool math/eq as a plain `==` too (see emit-py's
      //     nativeOpInfo), so an ordinary flow/branch test can legitimately
      //     be `==`-headed;
      //   - Python's grammar has no distinct AST node for `elif` at all —
      //     `else:\n    if ...:` and `elif ...:` are BYTE-IDENTICAL ASTs
      //     (`If.orelse = [If(...)]`), so a plain "if/else" whose else-arm
      //     happens to contain exactly one (semantically unrelated) nested
      //     `if` — e.g. flow/branch's own two-ptr_set-arms test asset, once
      //     the new bare-`if` ptr_set shape (see emit-py's emitSetPointer)
      //     makes each arm exactly one statement — is INDISTINGUISHABLE
      //     from a genuine elif chain by shape alone.
      // flow/switch (tryParseSwitchAfterLet) and OLD/NEW-shape multiGate
      // (parseMultiGate/buildMultiGateStmt) are both consumed via
      // LOOKAHEAD/dispatch keyed to their own SPECIFIC preceding
      // assignment or call shape (checked earlier, above, and in the
      // Assign-statement dispatch) — never by a blanket "orelse is one If"
      // shape check — so there is no actual ambiguity to defend against
      // here: whatever reaches this point is always a genuine plain
      // flow/branch, lowered the same whether its else-arm is a block or a
      // single nested if.
      const cond = this.lowerExpr(test, "bool", ctx);
      const thenS = this.lowerBlock(nodeList(stmt.body), ctx);
      const elseS = orelse.length ? this.lowerOptionalBlock(orelse, ctx) : undefined;
      return { stmt: { k: "if", cond, then: thenS, else: elseS }, consumed: 1 };
    }

    if (isType(stmt, "While")) {
      const cond = this.lowerExpr(stmt.test as PyNode, "bool", ctx);
      const body = this.lowerBlock(nodeList(stmt.body), ctx);
      return { stmt: { k: "while", cond, body }, consumed: 1 };
    }

    fail("GP110", stmt, `unrecognized statement shape (kind ${stmt._type})`);
  }

  // -------------------------------------------------------------------
  // setPointer
  // -------------------------------------------------------------------

  // OLD shape: `ok = rt.ptr_set(...)` [+ `if ok: ... else: ...`].
  private parseSetPointer(stmts: PyNode[], i: number, call: PyNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const stmt = stmts[i];
    const okName = (nodeList(stmt.targets)[0] as PyNode).id as string;

    // Unlike Lua (whose `do...end` wrapper makes "does this ptr_set have a
    // following if" unambiguous — the do-block contains ONLY the assign and,
    // optionally, the if), Python's emitSetPointer emits no wrapper at all:
    // when the original IR's setPointer had NEITHER an `out` NOR an `err`
    // branch, emit.ts (`if (stmt.out || stmt.err) { ... }`) emits no `if`
    // whatsoever, so the very next top-level-of-block statement can be a
    // totally unrelated one (see e.g. pointer/get_set_morphtargets, where a
    // plain flow/branch `if` immediately follows an unrelated `ptr_set`).
    // So a following `If` is only ever consumed here when its test is
    // EXACTLY `Name(okName)` — anything else means there simply is no
    // if/else for this pointer/set, not a malformed one.
    const next = stmts[i + 1];
    if (isType(next, "If") && isType(next.test as PyNode, "Name") && (next.test as PyNode).id === okName) {
      const orelse = nodeList(next.orelse);
      return { stmt: this.buildSetPointerStmt(call, nodeList(next.body), orelse.length ? orelse : undefined, ctx), consumed: 2 };
    }
    return { stmt: this.buildSetPointerStmt(call, undefined, undefined, ctx), consumed: 1 };
  }

  // Shared arg-extraction for every pointer/set shape (old assign-then-if,
  // new bare-call, new bare-`if`) — `call`'s own arguments alone (a 3-arg
  // args-less form vs the 4-arg args-dict form, disambiguated the same way
  // pointerCall's counterpart on the emit side infers it: position 1 is
  // either the args dict or, when it's a string, the type signature and the
  // whole args dict was omitted — see emit-py's pointerCall doc comment)
  // determine everything except out/err, which the three call sites derive
  // differently from their own surrounding syntax.
  private buildSetPointerStmt(call: PyNode, outStmts: PyNode[] | undefined, errStmts: PyNode[] | undefined, ctx: Ctx): IRStmt {
    const argNodes = callArgs(call);
    const hasArgsObj = argNodes.length >= 2 && isType(argNodes[1], "Dict");
    const [pointerExpr, argsObjExpr, typeExpr, valueExpr] = hasArgsObj ? argNodes : [argNodes[0], undefined, argNodes[1], argNodes[2]];
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GP125", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GP125", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, ctx);
    const value = this.lowerExpr(valueExpr, type, ctx);
    const out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    const err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return { k: "setPointer", template, args, value, type, out, err };
  }

  // `objExpr` is undefined both when the template has zero dynamic params
  // (args-less form — see emit-py's pointerCall) and, defensively, whenever
  // there's genuinely nothing left to look up; only fail on a MISSING dict
  // literal when the template actually still has params to resolve.
  private lowerPointerArgs(objExpr: PyNode | undefined, template: PtrTemplate, ctx: Ctx): IRExpr[] {
    const params = pointerTemplateParams(template);
    if (params.length === 0) {
      return [];
    }
    if (!objExpr || !isType(objExpr, "Dict")) {
      fail("GP125", objExpr, "pointer args must be a dict literal");
    }
    return params.map((p) => {
      const init = dictField(objExpr, p.name);
      if (!init) {
        fail("GP125", objExpr, `pointer args dict missing param "${p.name}"`);
      }
      return this.lowerExpr(init, p.kind === "int" ? "int" : "ref", ctx);
    });
  }

  // -------------------------------------------------------------------
  // async ops
  // -------------------------------------------------------------------

  // Entry point for both async-op shapes: the OLD `[contFn?] resVar =
  // rt.<fn>(...)` [+ `if resVar["ok"]: ... else: ...`] and the NEW
  // `[contFn?] (rt.<fn>(...) | if rt.<fn>(...)["ok"]: ... else: ...)` — the
  // latter has no named result variable at all (`"ok"` is read at most
  // once, so emit-py inlines the call straight into the check — see emit-
  // py's emitAsync doc comment). Returns undefined (falling through to the
  // rest of parseOne's dispatch) when `stmts[i]` isn't a `def` AND doesn't
  // otherwise start a recognizable async site; still `fail()`s when
  // `stmts[i]` IS a `def` but nothing valid follows it, since every nested
  // `def` this parser can reach is, by construction, an async-op's lifted
  // inline continuation.
  private tryParseAsync(stmts: PyNode[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const stmt = stmts[i];
    const contFn = isType(stmt, "FunctionDef") ? stmt : undefined;
    const offset = contFn ? 1 : 0;
    const site = stmts[i + offset];
    if (!site) {
      if (contFn) fail("GP122", stmt, "unrecognized function definition (expected an async done-continuation)");
      return undefined;
    }

    // OLD shape: `resVar = rt.<fn>(...)` [+ `if resVar["ok"]: ... else: ...`]
    if (isType(site, "Assign") && nodeList(site.targets).length === 1 && isType(nodeList(site.targets)[0], "Name")) {
      const matched = matchAsyncCall(site.value as PyNode);
      if (matched) {
        const resName = (nodeList(site.targets)[0] as PyNode).id as string;
        let consumed = offset + 1;
        const nextStmt = stmts[i + consumed];
        let outStmts: PyNode[] | undefined;
        let errStmts: PyNode[] | undefined;
        if (isType(nextStmt, "If") && this.isFieldTruthyCond(nextStmt!.test as PyNode, resName, "ok")) {
          outStmts = nodeList(nextStmt!.body);
          const orelse = nodeList(nextStmt!.orelse);
          errStmts = orelse.length ? orelse : undefined;
          consumed += 1;
        }
        return { stmt: this.buildAsyncStmt(matched, contFn, outStmts, errStmts, ctx), consumed };
      }
    }

    // NEW shape: bare `rt.<fn>(...)` (no out/err — the call's return value
    // is discarded entirely, matching the always-runs semantics exactly).
    if (isType(site, "Expr")) {
      const matched = matchAsyncCall(site.value as PyNode);
      if (matched) {
        return { stmt: this.buildAsyncStmt(matched, contFn, undefined, undefined, ctx), consumed: offset + 1 };
      }
    }

    // NEW shape: `if rt.<fn>(...)["ok"]: ... else: ...`.
    if (isType(site, "If")) {
      const test = site.test as PyNode;
      const okBase = fieldOf(test, "ok");
      const matched = okBase ? matchAsyncCall(okBase) : undefined;
      if (matched) {
        const orelse = nodeList(site.orelse);
        return { stmt: this.buildAsyncStmt(matched, contFn, nodeList(site.body), orelse.length ? orelse : undefined, ctx), consumed: offset + 1 };
      }
      // Negated empty-"out" shape: `if not rt.<fn>(...)["ok"]: errBody`
      // (no else) — see emit-py's emitAsync doc comment for the negation
      // this inverts. `not x["ok"]` always parses as `not (x["ok"])`
      // (subscript binds tighter than `not`), so the operand here is
      // exactly the same `<call>["ok"]` Subscript as the non-negated case.
      if (nodeList(site.orelse).length === 0) {
        const { negated, inner } = unwrapNot(test);
        if (negated) {
          const innerOkBase = fieldOf(inner, "ok");
          const negMatched = innerOkBase ? matchAsyncCall(innerOkBase) : undefined;
          if (negMatched) {
            return { stmt: this.buildAsyncStmt(negMatched, contFn, undefined, nodeList(site.body), ctx), consumed: offset + 1 };
          }
        }
      }
    }

    if (contFn) {
      fail("GP122", stmt, "unrecognized function definition (expected an async done-continuation)");
    }
    return undefined;
  }

  private buildAsyncStmt(
    matched: { kind: AsyncKind; call: PyNode },
    contFn: PyNode | undefined,
    outStmts: PyNode[] | undefined,
    errStmts: PyNode[] | undefined,
    ctx: Ctx
  ): IRStmt {
    const args = callArgs(matched.call);
    const kind = matched.kind;

    let lastArg: PyNode | undefined;
    const baseStmt: Partial<Extract<IRStmt, { k: "async" }>> = { k: "async", kind };

    if (kind === "setDelay") {
      const [slotExpr, durationExpr, doneExpr] = args;
      baseStmt.slot = this.slotRefOf(slotExpr);
      baseStmt.args = [this.lowerExpr(durationExpr, "float", ctx)];
      lastArg = doneExpr;
    } else if (kind === "varInterp") {
      const [varIdExpr, valueExpr, durationExpr, p1Expr, p2Expr, useSlerpExpr, doneExpr] = args;
      const varId = readNumberLiteral(varIdExpr) ?? fail("GP126", varIdExpr, "var_interp's first argument must be a numeric literal");
      const varType = this.variables[varId]?.type ?? "float";
      baseStmt.config = { varId, useSlerp: readBoolLiteral(useSlerpExpr) ?? false };
      baseStmt.args = [
        this.lowerExpr(valueExpr, varType, ctx),
        this.lowerExpr(durationExpr, "float", ctx),
        this.lowerExpr(p1Expr, "float2", ctx),
        this.lowerExpr(p2Expr, "float2", ctx)
      ];
      lastArg = doneExpr;
    } else if (kind === "ptrInterp") {
      const hasArgsObj = args.length >= 2 && isType(args[1], "Dict");
      const [pointerExpr, argsObjExpr, typeExpr, valueExpr, durationExpr, p1Expr, p2Expr, doneExpr] = hasArgsObj
        ? args
        : [args[0], undefined, args[1], args[2], args[3], args[4], args[5], args[6]];
      const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GP126", pointerExpr, "ptr_interp pointer must be a string literal");
      const template = parsePointerTemplate(pointerLit);
      const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GP126", typeExpr, "ptr_interp type must be a string literal");
      const ptrArgs = this.lowerPointerArgs(argsObjExpr, template, ctx);
      baseStmt.template = template;
      baseStmt.type = type;
      baseStmt.args = [this.lowerExpr(valueExpr, type, ctx), this.lowerExpr(durationExpr, "float", ctx), this.lowerExpr(p1Expr, "float2", ctx), this.lowerExpr(p2Expr, "float2", ctx), ...ptrArgs];
      lastArg = doneExpr;
    } else if (kind === "animStart") {
      const [animExpr, startExpr, endExpr, speedExpr, doneExpr] = args;
      baseStmt.args = [this.lowerExpr(animExpr, "ref", ctx), this.lowerExpr(startExpr, "float", ctx), this.lowerExpr(endExpr, "float", ctx), this.lowerExpr(speedExpr, "float", ctx)];
      lastArg = doneExpr;
    } else if (kind === "animStop") {
      const [animExpr] = args;
      baseStmt.args = [this.lowerExpr(animExpr, "ref", ctx)];
    } else {
      const [animExpr, stopTimeExpr, doneExpr] = args;
      baseStmt.args = [this.lowerExpr(animExpr, "ref", ctx), this.lowerExpr(stopTimeExpr, "float", ctx)];
      lastArg = doneExpr;
    }

    if (lastArg && !isNoneConstant(lastArg)) {
      if (contFn) {
        baseStmt.done = { kind: "inline", body: this.lowerBlock(nodeList(contFn.body), ctx) } as Cont;
      } else if (isType(lastArg, "Name")) {
        const procId = this.procIndexByName.get(lastArg.id as string);
        if (procId === undefined) fail("GP126", lastArg, `unknown proc reference "${lastArg.id}" as async done continuation`);
        baseStmt.done = { kind: "proc", procId } as Cont;
      } else {
        fail("GP126", lastArg, "async done continuation must be a proc reference, inline def, or None");
      }
    }

    baseStmt.out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    baseStmt.err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return baseStmt as IRStmt;
  }

  // -------------------------------------------------------------------
  // stateful ops
  // -------------------------------------------------------------------

  private slotRefOf(expr: PyNode): { slot: number } {
    const name = sAttrOf(expr);
    if (name === undefined) {
      fail("GP127", expr, "expected a state-slot attribute (S.<name>)");
    }
    const idx = this.stateSlotIndexByName.get(name);
    if (idx === undefined) {
      fail("GP127", expr, `unknown state slot "${name}"`);
    }
    return { slot: idx };
  }

  private parseDoN(stmts: PyNode[], i: number, resName: string, call: PyNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, nExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const args = [this.lowerExpr(nExpr, "int", ctx)];
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const ifRes = this.tryReadIfElseOn(stmts[i + 1], resName, "fire", ctx);
    if (ifRes) {
      if (ifRes.out) outs.out = ifRes.out;
      consumed = 2;
    }
    return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs }, consumed };
  }

  private parseThrottle(stmts: PyNode[], i: number, resName: string, call: PyNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, durationExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const args = [this.lowerExpr(durationExpr, "float", ctx)];
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (isType(next, "If") && this.isFieldTruthyCond(next!.test as PyNode, resName, "invalid")) {
      const orelse = nodeList(next!.orelse);
      if (orelse.length === 1 && isType(orelse[0], "If") && this.isFieldTruthyCond(orelse[0].test as PyNode, resName, "fire")) {
        const errBlock = this.lowerOptionalBlock(nodeList(next!.body), ctx);
        const outBlock = this.lowerOptionalBlock(nodeList(orelse[0].body), ctx);
        if (errBlock) outs.err = errBlock;
        if (outBlock) outs.out = outBlock;
        consumed = 2;
      }
    }
    return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs }, consumed };
  }

  // OLD shape: `resVar = rt.wait_all(...)` [+ `if resVar["completed"]: ...
  // else: ...`]. The NEW bare-`if` shape (no named result at all) is
  // dispatched straight to buildWaitAllStmt from parseOne's own If handling.
  private parseWaitAll(stmts: PyNode[], i: number, resName: string, call: PyNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const next = stmts[i + 1];
    if (isType(next, "If") && this.isFieldTruthyCond(next!.test as PyNode, resName, "completed")) {
      const orelse = nodeList(next!.orelse);
      return { stmt: this.buildWaitAllStmt(call, nodeList(next!.body), orelse.length ? orelse : undefined, ctx), consumed: 2 };
    }
    return { stmt: this.buildWaitAllStmt(call, undefined, undefined, ctx), consumed: 1 };
  }

  // Shared arg-parsing (+ config back-fill) for both waitAll shapes: the OLD
  // named-result form and the NEW bare `if rt.wait_all(...)["completed"]:
  // ... else: ...` form (`"completed"` read at most once — see emit-py's
  // emitStateful's waitAll case).
  private buildWaitAllStmt(call: PyNode, completedStmts: PyNode[] | undefined, outStmts: PyNode[] | undefined, ctx: Ctx): IRStmt {
    const [slotExpr, inputFlowsExpr, indexExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const inputFlows = readNumberLiteral(inputFlowsExpr);
    if (inputFlows !== undefined) {
      this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { ...this.stateSlots[slot.slot].config, inputFlows: Math.trunc(inputFlows) } };
    }
    const index = readNumberLiteral(indexExpr) ?? 0;
    const outs: Record<string, IRStmt> = {};
    if (completedStmts) {
      const completedBlock = this.lowerOptionalBlock(completedStmts, ctx);
      if (completedBlock) outs.completed = completedBlock;
    }
    if (outStmts) {
      const outBlock = this.lowerOptionalBlock(outStmts, ctx);
      if (outBlock) outs.out = outBlock;
    }
    return { k: "stateful", kind: "waitAll", slot, port: Math.trunc(index), args: [], outs };
  }

  // OLD shape: `resVar = rt.multi_gate(...); if resVar["index"] == 0: ...
  // elif ... :` (also reused, UNCHANGED, for the new 2+-output named-result
  // shape — see emit-py's emitStateful's multiGate case: only a SINGLE
  // wired output ever inlines the call directly with no named result,
  // since an if/elif chain re-evaluating a literal call expression 2+
  // times would re-invoke — and re-mutate — this stateful op; that bare-
  // `if` single-output shape is dispatched straight to buildMultiGateStmt
  // from parseOne's own If handling instead).
  private parseMultiGate(stmts: PyNode[], i: number, resName: string, call: PyNode, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const base = this.buildMultiGateStmt(call);
    let consumed = 1;
    const next = stmts[i + 1];
    if (isType(next, "If")) {
      const chain: PyNode[] = [];
      let cur: PyNode | undefined = next;
      while (cur && isType(cur, "If") && this.isFieldEqCond(cur.test as PyNode, resName, "index")) {
        chain.push(cur);
        const orelse = nodeList(cur.orelse);
        cur = orelse.length === 1 && isType(orelse[0], "If") ? orelse[0] : undefined;
        if (orelse.length > 0 && cur === undefined) {
          // a trailing plain else-block is never emitted for multiGate.
          chain.length = 0;
          break;
        }
      }
      if (chain.length > 0) {
        chain.forEach((clause) => {
          const test = clause.test as PyNode;
          const num = readNumberLiteral(nodeList(test.comparators)[0]);
          if (num === undefined) {
            fail("GP128", clause, "multiGate switch case must be a numeric literal");
          }
          base.outs[String(num)] = this.lowerBlock(nodeList(clause.body), ctx);
        });
        consumed = 2;
      }
    }
    return { stmt: base, consumed };
  }

  // Shared arg-parsing (+ config back-fill) for every multiGate shape — see
  // parseMultiGate's own doc comment for which surrounding syntax each
  // caller derives `outs` from.
  private buildMultiGateStmt(call: PyNode): Extract<IRStmt, { k: "stateful" }> {
    const [slotExpr, , isRandomExpr, isLoopExpr] = callArgs(call);
    const slot = this.slotRefOf(slotExpr);
    const isRandom = readBoolLiteral(isRandomExpr) ?? false;
    const isLoop = readBoolLiteral(isLoopExpr) ?? false;
    this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { isRandom, isLoop } };
    return { k: "stateful", kind: "multiGate", slot, port: "in", args: [], outs: {} };
  }

  // Bare `V.<name> = <expr>` — the new emit-py output shape for setVar (see
  // emit.ts's "setVar" case; replaces the old `V["<name>"].set(<expr>)`
  // dict-subscript-call form, still separately accepted below by
  // matchAccessorCall for backward compat with previously-emitted code).
  // The RHS lowers through the ordinary lowerExpr path, and a compound
  // update like `V.counter1 = m.add_int(V.counter1, 1)` naturally bottoms
  // out at the bare `V.<name>` READ handling added to lowerExpr's Attribute
  // case above, so this lowers to setVar(counter1, add_int(varGet(counter1),
  // 1)) exactly like the old `.set(...)`/`.get()` pair did.
  private tryParseVarAssign(stmts: PyNode[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | null {
    const stmt = stmts[i];
    const target = nodeList(stmt.targets)[0] as PyNode;
    if (!isType(target, "Attribute") || !isType(target.value as PyNode, "Name")) {
      return null;
    }
    const key = `${(target.value as PyNode).id}.${target.attr}`;
    const varId = this.varIndexByProp.get(key);
    if (varId === undefined) {
      return null;
    }
    const varType = this.variables[varId]?.type ?? "float";
    return { stmt: { k: "setVar", varId, expr: this.lowerExpr(stmt.value as PyNode, varType, ctx) }, consumed: 1 };
  }

  private tryParseReset(stmts: PyNode[], i: number): { stmt: IRStmt; consumed: number } | null {
    const stmt = stmts[i];

    // throttle reset: `S.<slot>.pop("lastTime", None)` followed by
    // `S.<slot>["remaining"] = float("nan")`.
    if (isType(stmt, "Expr")) {
      const call = stmt.value as PyNode;
      if (isType(call, "Call") && isType(call.func as PyNode, "Attribute") && (call.func as PyNode).attr === "pop") {
        const slotName = sAttrOf((call.func as PyNode).value as PyNode);
        if (slotName !== undefined) {
          const slotIdx = this.stateSlotIndexByName.get(slotName);
          if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "throttle") {
            return { stmt: { k: "stateful", kind: "throttle", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
          }
        }
      }
      return null;
    }

    if (!isType(stmt, "Assign") || nodeList(stmt.targets).length !== 1) {
      return null;
    }
    const sub = sSubscriptOf(nodeList(stmt.targets)[0]);
    if (!sub) {
      return null;
    }
    const slotIdx = this.stateSlotIndexByName.get(sub.slotName);
    if (slotIdx === undefined) {
      return null;
    }
    const kind = this.stateSlots[slotIdx].kind;
    const field = stringLiteralValue(sub.key);
    if (kind === "doN" && field === "count") {
      return { stmt: { k: "stateful", kind: "doN", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 1 };
    }
    if (kind === "multiGate" && field === "used") {
      return { stmt: { k: "stateful", kind: "multiGate", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    if (kind === "waitAll" && field === "activated") {
      const nextStmt = stmts[i + 1];
      if (isType(nextStmt, "Assign")) {
        const nextSub = sSubscriptOf(nodeList(nextStmt.targets)[0]);
        if (nextSub && nextSub.slotName === sub.slotName) {
          const n = readNumberLiteral(nextStmt.value as PyNode);
          if (n !== undefined) {
            this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(n) } };
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

  private tryParseFor(stmts: PyNode[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | null {
    const stmt = stmts[i];
    const target = nodeList(stmt.targets)[0] as PyNode;
    const slotName = sAttrOf(target);
    if (slotName === undefined) {
      return null;
    }
    const slotIdx = this.stateSlotIndexByName.get(slotName);
    if (slotIdx === undefined || this.stateSlots[slotIdx].kind !== "for") {
      return null;
    }
    const next = stmts[i + 1];
    if (!isType(next, "While")) {
      fail("GP129", next, "expected a `while` loop following a for-slot assignment");
    }
    const test = next!.test as PyNode;
    if (!isType(test, "Compare") || nodeList(test.ops).length !== 1 || (nodeList(test.ops)[0] as PyNode)._type !== "Lt") {
      fail("GP129", test, "expected `S.<slot> < end` for a for-loop condition");
    }
    if (sAttrOf(test.left as PyNode) !== slotName) {
      fail("GP129", test, "expected `S.<slot> < end` for a for-loop condition");
    }
    const start = this.lowerExpr(stmt.value as PyNode, "int", ctx);
    const end = this.lowerExpr(nodeList(test.comparators)[0], "int", ctx);
    const bodyStmts = nodeList(next!.body);
    const last = bodyStmts[bodyStmts.length - 1];
    if (!isType(last, "Assign") || nodeList(last.targets).length !== 1) {
      fail("GP129", last, "expected the for-loop body's last statement to be the index increment");
    }
    const body = this.lowerBlock(bodyStmts.slice(0, -1), ctx);
    return { stmt: { k: "for", slot: { slot: slotIdx }, start, end, body }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // flow/switch — see parse-lua's own `tryParseSwitchAfterLet` doc comment
  // (identical rationale: emit.ts always hoists the selector into a fresh
  // temp first, even for a literal selector, since Python has no switch
  // statement either — so this is a lookahead from the hoisting Assign,
  // folding it back in as the switch's selector directly).
  // -------------------------------------------------------------------

  private tryParseSwitchAfterLet(stmts: PyNode[], i: number, name: string, initExpr: PyNode, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const next = stmts[i + 1];
    if (!isType(next, "If")) {
      return undefined;
    }
    const firstTest = next!.test as PyNode;
    // Empty-cases-with-default: `if True:` (see emitSwitch: when `stmt.cases`
    // is empty but `stmt.default` exists, `first` is never cleared, so it
    // emits a literal `if True:` instead of an `==` test).
    if (nodeList(next!.orelse).length === 0 && constPType(firstTest) === "bool" && firstTest.value === true) {
      const selector = this.lowerExpr(initExpr, "int", ctx);
      return { stmt: { k: "switch", selector, cases: [], default: this.lowerBlock(nodeList(next!.body), ctx) }, consumed: 2 };
    }
    if (!isType(firstTest, "Compare") || nodeList(firstTest.ops).length !== 1 || (nodeList(firstTest.ops)[0] as PyNode)._type !== "Eq") {
      return undefined;
    }
    const left = firstTest.left as PyNode;
    if (!isType(left, "Name") || left.id !== name) {
      return undefined;
    }
    const selector = this.lowerExpr(initExpr, "int", ctx);
    const cases: Array<[number, IRStmt]> = [];
    let dflt: IRStmt | undefined;
    let node: PyNode | undefined = next;
    while (node) {
      const test = node.test as PyNode;
      if (!isType(test, "Compare") || nodeList(test.ops).length !== 1 || (nodeList(test.ops)[0] as PyNode)._type !== "Eq") {
        fail("GP130", node, "switch case must be a numeric-literal equality test");
      }
      const num = readNumberLiteral(nodeList(test.comparators)[0]);
      if (num === undefined) {
        fail("GP130", node, "switch case must be a numeric literal");
      }
      cases.push([num, this.lowerBlock(nodeList(node.body), ctx)]);
      const orelse = nodeList(node.orelse);
      // Python's grammar has no distinct AST node for `elif` at all — a
      // genuine `elif <selector> == N:` and an `else:` block whose sole
      // statement happens to be an UNRELATED nested `if` (e.g. this
      // switch's own default arm, once a single ptr_set/etc. bare-`if`
      // shape makes it exactly one statement — see parse-lua's/this file's
      // identical ambiguity note on the generic "if" dispatch) are BYTE-
      // IDENTICAL ASTs. Only continue the chain when the nested If's own
      // test is ALSO `<selector> == <literal>` — anything else (including a
      // single nested If with a different shape) is this switch's default
      // body, not another case.
      const nextClauseTest = orelse.length === 1 && isType(orelse[0], "If") ? (orelse[0].test as PyNode) : undefined;
      const continuesChain =
        nextClauseTest &&
        isType(nextClauseTest, "Compare") &&
        nodeList(nextClauseTest.ops).length === 1 &&
        (nodeList(nextClauseTest.ops)[0] as PyNode)._type === "Eq" &&
        isType(nextClauseTest.left as PyNode, "Name") &&
        (nextClauseTest.left as PyNode).id === name;
      if (orelse.length === 0) {
        node = undefined;
      } else if (continuesChain) {
        node = orelse[0];
      } else {
        dflt = this.lowerBlock(orelse, ctx);
        node = undefined;
      }
    }
    return { stmt: { k: "switch", selector, cases, default: dflt }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // Expression lowering
  // -------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // Native-operator forms — the inverse of emit-py's nativeOpInfo/
  // emitNativeOp. Deliberately narrower than @gltfi/parse-ts's identical-
  // purpose tryLowerNativeOp: this backend's emitter never natively
  // substitutes int arithmetic/comparisons or division (see emit-py's
  // nativeOpInfo doc comment), so every comparison/eq this dispatch reaches
  // is unambiguously float-or-bool typed, and there is no int-wrap
  // unwrapping to do.
  // ---------------------------------------------------------------------

  private tryLowerNativeOp(expr: PyNode, ctx: Ctx): IRExpr | undefined {
    if (isType(expr, "UnaryOp")) {
      const opKind = (expr.op as PyNode)._type;
      if (opKind === "USub") {
        // A bare negative NUMERIC LITERAL is caught earlier by
        // readNumberLiteral (lowerExpr's very first check) — reaching here
        // means the operand isn't a literal, so this is always float neg.
        const a = this.lowerExpr(expr.operand as PyNode, "float", ctx);
        const overload = resolveOverload("math/neg", { a: "float" });
        if (!overload) fail("GP161", expr, "could not resolve native float neg overload");
        return { k: "op", op: "math/neg", overload, args: [a] };
      }
      if (opKind === "Not") {
        const a = this.lowerExpr(expr.operand as PyNode, "bool", ctx);
        const overload = resolveOverload("math/not", { a: "bool" });
        if (!overload) fail("GP161", expr, "could not resolve native bool not overload");
        return { k: "op", op: "math/not", overload, args: [a] };
      }
      return undefined;
    }
    if (isType(expr, "BoolOp")) {
      // Unlike TS's/Lua's own `&&`/`and` (always a plain BinaryExpression
      // tree, nesting exactly however emit-ts's/emit-lua's own recursive
      // emitExpr calls produced it), Python's grammar FLATTENS a bare chain
      // of the same and/or operator into ONE BoolOp node with 3+ `values`
      // (`a and b and c` parses as `BoolOp(And, [a, b, c])`, never nested
      // two-operand BoolOps) — a real corpus case (math/saturate's chained
      // "every sub-test passed" condition) hits this whenever 3+ math/and
      // nodes chain together and all render bare (no parens needed at that
      // uniform precedence level — see emit-py's emitNativeOp). Folded back
      // into the same LEFT-associative nested binary shape emit-ts's/emit-
      // lua's own explicit-tree emission always produces, matching how
      // @gltfi/ir/import.ts itself builds a multi-input and/or chain (see
      // e.g. flow/branch's own boolean-AND-of-conditions authoring
      // pattern) — proven correct by the other two backends' own
      // structural round-trip passing against the exact same corpus asset.
      const values = nodeList(expr.values);
      if (values.length < 2) {
        return undefined;
      }
      const opKind = (expr.op as PyNode)._type;
      const op = opKind === "And" ? "math/and" : opKind === "Or" ? "math/or" : undefined;
      if (!op) {
        return undefined;
      }
      let acc = this.lowerExpr(values[0], "bool", ctx);
      for (let idx = 1; idx < values.length; idx += 1) {
        acc = this.buildBinaryOpFromExpr(op, "bool", acc, values[idx], ctx);
      }
      return acc;
    }
    if (isType(expr, "Compare")) {
      const ops = nodeList(expr.ops);
      const comparators = nodeList(expr.comparators);
      if (ops.length !== 1 || comparators.length !== 1) {
        return undefined; // this emitter never chains comparisons
      }
      const opKind = (ops[0] as PyNode)._type;
      const left = expr.left as PyNode;
      const right = comparators[0];
      if (opKind === "NotEq") return this.buildBinaryOp("math/xor", "bool", left, right, ctx);
      if (opKind === "Eq") return this.buildBinaryOp("math/eq", this.inferScalarKind(left, right, ctx, ["bool", "float"]), left, right, ctx);
      if (opKind === "Lt") return this.buildBinaryOp("math/lt", "float", left, right, ctx);
      if (opKind === "LtE") return this.buildBinaryOp("math/le", "float", left, right, ctx);
      if (opKind === "Gt") return this.buildBinaryOp("math/gt", "float", left, right, ctx);
      if (opKind === "GtE") return this.buildBinaryOp("math/ge", "float", left, right, ctx);
      return undefined;
    }
    if (isType(expr, "BinOp")) {
      const opKind = (expr.op as PyNode)._type;
      const left = expr.left as PyNode;
      const right = expr.right as PyNode;
      if (opKind === "Add") return this.buildBinaryOp("math/add", "float", left, right, ctx);
      if (opKind === "Sub") return this.buildBinaryOp("math/sub", "float", left, right, ctx);
      if (opKind === "Mult") return this.buildBinaryOp("math/mul", "float", left, right, ctx);
      return undefined;
    }
    return undefined;
  }

  private buildBinaryOp(op: string, kind: IRType, leftNode: PyNode, rightNode: PyNode, ctx: Ctx): IRExpr {
    return this.buildBinaryOpFromExpr(op, kind, this.lowerExpr(leftNode, kind, ctx), rightNode, ctx);
  }

  // Like buildBinaryOp, but the left operand is ALREADY a lowered IRExpr —
  // used by the BoolOp left-fold above, where the "left" side of each fold
  // step is the accumulator from the previous step, not a raw AST node.
  private buildBinaryOpFromExpr(op: string, kind: IRType, a: IRExpr, rightNode: PyNode, ctx: Ctx): IRExpr {
    const b = this.lowerExpr(rightNode, kind, ctx);
    const overload = resolveOverload(op, { a: kind, b: kind } as Record<string, TypeSig>);
    if (!overload) {
      fail("GP161", rightNode, `could not resolve native overload for "${op}" with operand type "${kind}"`);
    }
    return { k: "op", op, overload, args: [a, b] };
  }

  // Bottom-up peek at whichever operand isn't literal-ish (mirrors
  // disambiguateOverload's identical strategy) to pick which of `allowed`'s
  // concrete types this native `==` was over (math/eq is the only native op
  // this backend ever renders for BOTH float and bool — see nativeOpInfo);
  // falls back to "float".
  private inferScalarKind(a: PyNode, b: PyNode, ctx: Ctx, allowed: IRType[]): IRType {
    for (const n of [a, b]) {
      if (isLiteralish(n)) {
        continue;
      }
      const t = this.typeOfExpr(this.lowerExpr(n, undefined, ctx));
      if (allowed.includes(t)) {
        return t;
      }
    }
    return allowed.includes("float") ? "float" : allowed[0];
  }

  private lowerExpr(expr: PyNode, expected: IRType | undefined, ctx: Ctx): IRExpr {
    const num = readNumberLiteral(expr);
    if (num !== undefined) {
      const t = expected ?? literalNumType(expr) ?? "float";
      return { k: "const", type: t, data: [t === "int" ? Math.trunc(num) : num] };
    }
    if (constPType(expr) === "bool") {
      return { k: "const", type: "bool", data: [expr.value as boolean] };
    }
    if (constPType(expr) === "str") {
      return { k: "const", type: "ref", data: [expr.value as string] };
    }
    const listEl = listElements(expr);
    if (listEl) {
      const nums = listEl.map((e) => readNumberLiteral(e) ?? fail("GP140", e, "array literal element must be a numeric literal"));
      const type = expected ?? lengthToType(nums.length, F_FAMILY) ?? fail("GP140", expr, `cannot infer type for a ${nums.length}-element array literal`);
      return { k: "const", type, data: nums };
    }

    const getVar = asAttrCall(expr, "rt", "get_var");
    if (getVar) {
      const varId = readNumberLiteral(callArgs(getVar)[0]) ?? fail("GP141", expr, "rt.get_var's argument must be a numeric literal");
      return { k: "varGet", varId };
    }
    // Dict form: `V["name"].get()` — see matchAccessorCall's doc comment.
    const getAccessor = this.matchAccessorCall(expr, "get");
    if (getAccessor && this.varIndexByProp.has(getAccessor.key)) {
      return { k: "varGet", varId: this.varIndexByProp.get(getAccessor.key)! };
    }
    // Native-operator forms (`a + b`, `a == b`, `a < b`, `a and b`, `not a`,
    // ...) — see emit-py's nativeOpInfo for exactly which op/type
    // combinations these can come from.
    const native = this.tryLowerNativeOp(expr, ctx);
    if (native) {
      return native;
    }
    if (asAttrCall(expr, "rt", "random")) {
      const overload = resolveOverload("math/random", {})!;
      return { k: "op", op: "math/random", overload, args: [] };
    }
    if (asAttrCall(expr, "rt", "tick_time")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceStart" }, args: [], type: "float" };
    }
    if (asAttrCall(expr, "rt", "tick_delta")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceLastTick" }, args: [], type: "float" };
    }

    if (isType(expr, "Subscript")) {
      const base = expr.value as PyNode;
      const sliceNode = expr.slice as PyNode;

      const ptrGet = asAttrCall(base, "rt", "ptr_get");
      if (ptrGet) {
        return this.lowerPtrGet(ptrGet, stringLiteralValue(sliceNode) === "isValid");
      }
      const payloadCall = asAttrCall(base, "rt", "event_payload");
      if (payloadCall) {
        const eventIndex = this.readEventIndex(callArgs(payloadCall)[0]) ?? 0;
        const fieldIdx = readNumberLiteral(sliceNode) ?? 0;
        const field = PAYLOAD_FIELDS[fieldIdx] ?? "boolParameter";
        return { k: "intrinsic", op: "event/receive#payload", config: { eventIndex, field }, args: [], type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
      }
      const mCall = attrCallOf(base);
      if (mCall && mCall.base === "m") {
        const s = stringLiteralValue(sliceNode);
        if (s !== undefined) {
          return this.lowerMCall(base, mCall.attr, expected, ctx, s);
        }
        const idx = readNumberLiteral(sliceNode);
        if (idx !== undefined) {
          return this.lowerMCall(base, mCall.attr, expected, ctx, String(idx));
        }
        fail("GP143", expr, "expected a literal socket index/name into a multi-output m.* call");
      }
      const sSub = sSubscriptOf(expr);
      if (sSub) {
        const slotIdx = this.stateSlotIndexByName.get(sSub.slotName);
        if (slotIdx !== undefined) {
          const field = stringLiteralValue(sSub.key) ?? fail("GP140", expr, "expected a string-literal state-slot field key");
          return this.lowerStateFieldRead(slotIdx, field);
        }
      }
      if (isType(base, "Name") && base.id === "payload" && ctx.kind === "handler" && ctx.handlerKind === "receive") {
        const fieldIdx = readNumberLiteral(sliceNode) ?? 0;
        const field = PAYLOAD_FIELDS[fieldIdx] ?? "boolParameter";
        return { k: "param", name: field, type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
      }
    }

    const eventOutRead = asAttrCall(expr, "rt", "event_out_read");
    if (eventOutRead) {
      const [nodeExpr, socketExpr] = callArgs(eventOutRead);
      const sourceNode = readNumberLiteral(nodeExpr) ?? 0;
      const socket = stringLiteralValue(socketExpr) ?? "";
      this.diagnostics.push({ severity: "info", code: "GP180", message: `best-effort reconstruction of cross-handler read rt.event_out_read(${sourceNode}, "${socket}")` });
      return { k: "intrinsic", op: "event/unknown", config: { crossContext: true, socket, sourceNode }, args: [], type: expected ?? "ref" };
    }

    const switchCase = asAttrCall(expr, "m", "switchCase");
    if (switchCase) {
      return this.lowerMathSwitch(switchCase, expected, ctx);
    }
    const mBare = attrCallOf(expr);
    if (mBare && mBare.base === "m") {
      return this.lowerMCall(expr, mBare.attr, expected, ctx);
    }

    if (isType(expr, "Name")) {
      const text = expr.id as string;
      if (ctx.kind === "handler" && ctx.handlerKind === "onTick" && (text === "time_since_start" || text === "time_since_last_tick")) {
        return { k: "param", name: text === "time_since_start" ? "timeSinceStart" : "timeSinceLastTick", type: "float" };
      }
      if (this.tempTypeByName.has(text)) {
        return { k: "temp", id: text };
      }
      fail("GP150", expr, `unresolved identifier "${text}"`);
    }

    // Bare `V.<name>` read (new emit-py output shape — see parseVarsDict's
    // varIndexByProp doc comment). Distinct from the `S.<name>` state-slot
    // shape below at the AST level (sAttrOf only ever matches an Attribute
    // whose base Name is literally "S"), so there's no ambiguity — checked
    // first purely for locality with the dict-subscript get() form above.
    if (isType(expr, "Attribute") && isType(expr.value as PyNode, "Name")) {
      const key = `${(expr.value as PyNode).id}.${expr.attr}`;
      if (this.varIndexByProp.has(key)) {
        return { k: "varGet", varId: this.varIndexByProp.get(key)! };
      }
    }

    const sName = sAttrOf(expr);
    if (sName !== undefined) {
      const slotIdx = this.stateSlotIndexByName.get(sName);
      if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "for") {
        return { k: "stateRead", slot: { slot: slotIdx }, field: "index", type: "int" };
      }
    }

    // `(S.<slot>["remaining"] if "remaining" in S.<slot> else N)` — Python
    // idiom for TS's `slot.remaining ?? N` (see emit-py's emitStateRead
    // waitAll case's own doc comment on why an explicit membership check is
    // the safe nullish-coalesce equivalent here).
    if (isType(expr, "IfExp")) {
      const test = expr.test as PyNode;
      if (isType(test, "Compare") && nodeList(test.ops).length === 1 && (nodeList(test.ops)[0] as PyNode)._type === "In") {
        const key = stringLiteralValue(test.left as PyNode);
        const containerName = sAttrOf(nodeList(test.comparators)[0]);
        if (key === "remaining" && containerName !== undefined) {
          const slotIdx = this.stateSlotIndexByName.get(containerName);
          if (slotIdx !== undefined) {
            const inputFlows = readNumberLiteral(expr.orelse as PyNode);
            if (inputFlows !== undefined) {
              this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(inputFlows) } };
            }
            return { k: "stateRead", slot: { slot: slotIdx }, field: "remainingInputs", type: "int" };
          }
        }
      }
    }

    fail("GP140", expr, `unrecognized expression shape (kind ${expr._type})`);
  }

  private lowerStateFieldRead(slotIdx: number, field: string): IRExpr {
    const kind = this.stateSlots[slotIdx].kind;
    if (kind === "doN" && field === "count") {
      return { k: "stateRead", slot: { slot: slotIdx }, field: "currentCount", type: "int" };
    }
    if (kind === "multiGate" && field === "lastIndex") {
      return { k: "stateRead", slot: { slot: slotIdx }, field: "lastIndex", type: "int" };
    }
    if (kind === "delay" && field === "lastRef") {
      return { k: "stateRead", slot: { slot: slotIdx }, field: "lastDelay", type: "ref" };
    }
    if (kind === "throttle" && field === "remaining") {
      return { k: "stateRead", slot: { slot: slotIdx }, field: "lastRemainingTime", type: "float" };
    }
    fail("GP140", undefined, `unrecognized state-slot field read "${field}" on slot kind "${kind}"`);
  }

  private lowerPtrGet(call: PyNode, wantIsValid: boolean): IRExpr {
    const argNodes = callArgs(call);
    // Args-less form (see emit-py's pointerCall doc comment): every
    // template param was a compile-time constant, already inlined into the
    // path string, so the whole args dict is omitted and `type` shifts into
    // position 1 — disambiguated the same way engine.py's ptr_get does:
    // position 1 is either the args dict or, when it's a string, IS the
    // type signature.
    const hasArgsObj = argNodes.length >= 2 && isType(argNodes[1], "Dict");
    const pointerExpr = argNodes[0];
    const argsObjExpr = hasArgsObj ? argNodes[1] : undefined;
    const typeExpr = hasArgsObj ? argNodes[2] : argNodes[1];
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GP141", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const valueType = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GP141", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, { kind: "proc" });
    return { k: "ptrGet", template, args, type: wantIsValid ? "bool" : valueType, valueType, wantIsValid };
  }

  private lowerMathSwitch(call: PyNode, expected: IRType | undefined, ctx: Ctx): IRExpr {
    const [selectionExpr, casesExpr, valuesExpr, defaultExpr] = callArgs(call);
    const caseNodes = listElements(casesExpr);
    const valueNodes = listElements(valuesExpr);
    if (!caseNodes || !valueNodes) {
      fail("GP142", call, "m.switchCase's cases/values arguments must be plain list literals");
    }
    const cases = caseNodes.map((e) => readNumberLiteral(e) ?? fail("GP142", e, "switch case must be a numeric literal"));
    let outType: IRType | undefined = expected;
    if (!outType) {
      for (const n of [defaultExpr, ...valueNodes]) {
        if (n && !isLiteralish(n)) {
          outType = this.typeOfExpr(this.lowerExpr(n, undefined, ctx));
          break;
        }
      }
    }
    outType = outType ?? "float";
    const selection = this.lowerExpr(selectionExpr, "int", ctx);
    const dflt = this.lowerExpr(defaultExpr, outType, ctx);
    const caseArgs = valueNodes.map((n) => this.lowerExpr(n, outType, ctx));
    return { k: "intrinsic", op: "math/switch", config: { cases }, args: [selection, dflt, ...caseArgs], type: outType };
  }

  private lowerMCall(call: PyNode, rawFnName: string, expected: IRType | undefined, ctx: Ctx, socket?: string): IRExpr {
    const fnName = PY_UNRENAME[rawFnName] ?? rawFnName;
    const argNodes = callArgs(call);
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
      fail("GP143", call, `unknown m.${rawFnName}(...) call`);
    }
    const op = candidates[0].op;
    const spec = getOpSpec(op);
    if (!spec) {
      fail("GP143", call, `op "${op}" not found in registry`);
    }
    const overloadIndex = candidates.length === 1 ? candidates[0].overloadIndex : this.disambiguateOverload(candidates, spec, argNodes, expected, ctx);
    const row = spec.overloads[overloadIndex];
    if (row.inputs.length !== argNodes.length) {
      fail("GP143", call, `m.${rawFnName} arg count ${argNodes.length} != expected ${row.inputs.length}`);
    }

    const hasGeneric = row.inputs.some((s) => isGenericSig(s.type)) || row.outputs.some((o) => isGenericSig(o.type));
    const argExprs: IRExpr[] = new Array(row.inputs.length);
    let pinned: IRType | undefined;

    if (hasGeneric) {
      const genericLetter = row.inputs.find((s) => isGenericSig(s.type))?.type ?? row.outputs.find((o) => isGenericSig(o.type))?.type;
      const family = genericLetter && isGenericSig(genericLetter) ? familyOf(genericLetter) : null;
      row.inputs.forEach((s, idx) => {
        if (!isGenericSig(s.type) || isLiteralish(argNodes[idx])) {
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
          const node = argNodes[idx];
          const arrLen = node._type === "List" ? (listElements(node)?.length ?? 0) : readNumberLiteral(node) !== undefined ? 1 : undefined;
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
      fail("GP143", call, `could not resolve overload for op "${op}" with inputs ${JSON.stringify(inputTypesByName)}`);
    }
    const resultSocket = socket && socket !== "value" ? socket : undefined;
    if (resultSocket !== undefined && !(resultSocket in overload.outputs)) {
      fail("GP143", call, `op "${op}" has no output socket "${resultSocket}"`);
    }
    return { k: "op", op, overload, args: argExprs, socket: resultSocket };
  }

  private disambiguateOverload(candidates: FnCandidate[], spec: OpSpec, argNodes: PyNode[], expected: IRType | undefined, ctx: Ctx): number {
    for (let idx = 0; idx < argNodes.length; idx += 1) {
      if (isLiteralish(argNodes[idx])) {
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
