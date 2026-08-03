// Lua -> IR parser (packages/parse-lua). Mirrors @gltfi/parse-ts's index.ts
// (read that file first — the design note below only calls out where this
// module differs) — it is a mechanical INVERSE of @gltfi/emit-lua's emit.ts,
// case for case, targeting exactly the subset that emitter produces (see its
// header comment for the generated module's shape: `return function(rt)
// rt.vars(...) rt.events(...) <state slots> <procs> <handlers> end`).
//
// Why luaparse instead of a bespoke tokenizer: it's a real Lua grammar (a
// Mozilla-Parser-API-style JSON AST, `{luaVersion:"5.1", locations:true}` —
// matching the emitter's deliberately 5.1-compatible syntax), so whitespace/
// comment variations come for free, same rationale as parse-ts's ts-morph
// dependency. Unlike TS, there is no ambient type-checker step here (Lua has
// no static types) — GL1xx's structural "subset validator" carries the FULL
// soundness burden this file's design puts on parse-ts's TS-diagnostics pass
// (GI001) PLUS its own GI1xx structural checks combined. Overload resolution
// (@gltfi/kernel's resolveOverload) is driven the same way parse-ts drives
// it: from the `m.*` function name (via @gltfi/kernel's shared fn-naming
// reverse table — the SAME table parse-ts uses, since emit-ts's and
// emit-lua's `m.*` naming rule is byte-for-byte identical) plus literal
// shapes plus variable/event/pointer declared types propagated through the
// value DAG bottom-up.
//
// Deliberate simplifications shared with parse-ts (see that file's header
// for the full rationale, identical here): while/for's `completed` and
// flow/cancelDelay's `outs.out` are reconstructed as flat seq siblings
// rather than round-tripping the exact original nesting (execution-
// equivalent either way — see docs/design/ir-and-transpiler.md's
// "Equivalence" section).
//
// One thing genuinely simpler here than in parse-ts: Lua's grammar has no
// parenthesized-expression AST node at all (grouping parens are purely a
// parse-time precedence device and leave no trace in the tree — verified
// against luaparse's own AST: `(0/0)` parses directly to a bare
// `BinaryExpression{operator:"/"}`, `(slot < (10.0))`'s inner parens vanish
// entirely), so there is no analog to parse-ts's `Node.isParenthesizedExpression`
// unwrapping anywhere in this file.
import { parse as luaParse } from "luaparse";
import type {
  AssignmentStatement,
  CallExpression,
  Chunk,
  DoStatement,
  Expression,
  FunctionDeclaration,
  IfStatement,
  LocalStatement,
  ReturnStatement,
  Statement,
  TableConstructorExpression,
  TableValue
} from "luaparse";
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
import { decodeLuaStringLiteral } from "./lua-string.js";

export type ParseResult = { module: IRModule; diagnostics: Diagnostic[] };

class ParseError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function fail(code: string, node: { loc?: { start: { line: number; column: number } } } | undefined, message: string): never {
  const where = node?.loc ? ` at line ${node.loc.start.line}, column ${node.loc.start.column}` : "";
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

export function parseModuleLua(code: string): ParseResult {
  let chunk: Chunk;
  try {
    chunk = luaParse(code, { luaVersion: "5.1", locations: true });
  } catch (err) {
    const raw = err as { line?: number; column?: number; message?: string };
    const where = raw.line !== undefined ? ` (line ${raw.line}${raw.column !== undefined ? `, column ${raw.column}` : ""})` : "";
    const message = err instanceof Error ? err.message : String(err);
    return { module: emptyModule(), diagnostics: [{ severity: "error", code: "GL001", message: `Lua syntax error${where}: ${message}` }] };
  }

  try {
    const parser = new ModuleParser();
    const module = parser.run(chunk.body);
    return { module, diagnostics: parser.diagnostics };
  } catch (err) {
    if (err instanceof ParseError) {
      return { module: emptyModule(), diagnostics: [{ severity: "error", code: err.code, message: err.message }] };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Small AST helpers (free functions — mirror parse-ts's own free-function
// helpers exactly; none of these need ModuleParser's instance state).
// ---------------------------------------------------------------------------

// Matches `rt.foo(...)` (MemberExpression callee, `.` indexer) AND
// `m["and"](...)` (IndexExpression callee with a string-literal index — see
// emit-lua's `mCall`'s LUA_KEYWORDS bracket-access fallback for `and`/`or`/
// `not`, the only ops whose base name collides with a Lua keyword).
function calleeOf(call: CallExpression): { base: string; name: string } | undefined {
  const callee = call.base;
  if (callee.type === "MemberExpression" && callee.indexer === "." && callee.base.type === "Identifier") {
    return { base: callee.base.name, name: callee.identifier.name };
  }
  if (callee.type === "IndexExpression" && callee.base.type === "Identifier" && callee.index.type === "StringLiteral") {
    return { base: callee.base.name, name: decodeLuaStringLiteral(callee.index.raw) };
  }
  return undefined;
}

function asCall(call: CallExpression | undefined, base: string, name: string): CallExpression | undefined {
  if (!call) {
    return undefined;
  }
  const c = calleeOf(call);
  return c && c.base === base && c.name === name ? call : undefined;
}

// Matches EITHER the old bare `rt.<name>({...})` call-statement shape or the
// new `local X = rt.<name>({...})` declaration shape — both accepted for
// `vars`/`events` (mirrors @gltfi/parse-ts's identically-named helper).
function matchNamedCall(stmt: Statement | undefined, base: string, name: string): { call: CallExpression; boundName?: string } | undefined {
  if (!stmt) {
    return undefined;
  }
  if (stmt.type === "CallStatement" && stmt.expression.type === "CallExpression") {
    const call = asCall(stmt.expression, base, name);
    return call ? { call } : undefined;
  }
  if (stmt.type === "LocalStatement" && stmt.variables.length === 1 && stmt.init.length === 1) {
    const call = asCallExpr(stmt.init[0], base, name);
    return call ? { call, boundName: stmt.variables[0].name } : undefined;
  }
  return undefined;
}

// `not <inner>` unwrap — used by the negated-condition shapes (empty-then
// `if`, async/setPointer err-only) exactly like emit-lua's own negateCond
// produces. luaparse has no parenthesized-expression node (see this file's
// header note), so there is no analog to parse-ts's extra paren-stripping.
function unwrapNot(cond: Expression): { negated: boolean; inner: Expression } {
  if (cond.type === "UnaryExpression" && cond.operator === "not") {
    return { negated: true, inner: cond.argument };
  }
  return { negated: false, inner: cond };
}

// `<expr>.<field>` bare member access (used to recognize an INLINE call
// result read directly in an `if` condition, e.g. `rt.setDelay(...).ok`,
// with no named local backing it at all).
function fieldOf(expr: Expression, field: string): Expression | undefined {
  return expr.type === "MemberExpression" && expr.indexer === "." && expr.identifier.name === field ? expr.base : undefined;
}

// Expression-level counterpart to `asCall`: `expr` might not even be a call
// at all (e.g. a plain identifier or literal reached the same dispatch
// point), so this checks the node kind first.
function asCallExpr(expr: Expression, base: string, name: string): CallExpression | undefined {
  return expr.type === "CallExpression" ? asCall(expr, base, name) : undefined;
}

function stringLiteralValue(node: Expression | undefined): string | undefined {
  return node && node.type === "StringLiteral" ? decodeLuaStringLiteral(node.raw) : undefined;
}

function readBoolLiteral(node: Expression | undefined): boolean | undefined {
  return node && node.type === "BooleanLiteral" ? node.value : undefined;
}

// Inverse of emit.ts's `floatLiteral`: NumericLiteral, a unary-minus-negated
// NumericLiteral or `math.huge` (i.e. `-math.huge`), the bare `math.huge`
// MemberExpression (`Infinity`), or the exact `0/0` BinaryExpression shape
// (`NaN`) — the only four number-literal forms that emitter ever produces
// (see floatLiteral's own doc comment).
function readNumberLiteral(node: Expression | undefined): number | undefined {
  if (!node) {
    return undefined;
  }
  if (node.type === "NumericLiteral") {
    return node.value;
  }
  if (node.type === "UnaryExpression" && node.operator === "-") {
    const v = readNumberLiteral(node.argument);
    return v === undefined ? undefined : -v;
  }
  if (node.type === "MemberExpression" && node.indexer === "." && node.base.type === "Identifier" && node.base.name === "math" && node.identifier.name === "huge") {
    return Infinity;
  }
  if (node.type === "BinaryExpression" && node.operator === "/" && node.left.type === "NumericLiteral" && node.left.value === 0 && node.right.type === "NumericLiteral" && node.right.value === 0) {
    return NaN;
  }
  return undefined;
}

function isLiteralish(node: Expression): boolean {
  return readNumberLiteral(node) !== undefined || node.type === "TableConstructorExpression" || node.type === "BooleanLiteral" || node.type === "StringLiteral";
}

// Bare-identifier-keyed table field lookup (`{ type = ..., initial = ... }`,
// pointer-arg objects `{ nodeIndex = ... }`) — the ONLY table-key shape this
// emitter ever produces for named fields (see emit.ts: every named table
// field is `${name} = ${...}` with `name` always a plain Lua identifier,
// never a computed/quoted key), so — unlike parse-ts's `getObjProp`, which
// has to special-case JSON.stringify'd quoted keys for pointer args — there
// is exactly one field shape (`TableKeyString`) to look for here.
function getTableKeyString(table: TableConstructorExpression, name: string): Expression | undefined {
  for (const f of table.fields) {
    if (f.type === "TableKeyString" && f.key.name === name) {
      return f.value;
    }
  }
  return undefined;
}

// Plain-array table reading (`{ a, b, c }` — rt.vars/rt.events/rt.send's
// payload/vectors/math/switch's cases-and-values arrays): every field must be
// a `TableValue` (no computed/named keys mixed in), in source order.
function tableArrayValues(node: Expression | undefined): Expression[] | undefined {
  if (!node || node.type !== "TableConstructorExpression") {
    return undefined;
  }
  const out: Expression[] = [];
  for (const f of node.fields) {
    if (f.type !== "TableValue") {
      return undefined;
    }
    out.push(f.value);
  }
  return out;
}

const F_FAMILY: readonly IRType[] = ["float", "float2", "float3", "float4", "float2x2", "float3x3", "float4x4"];
const V_FAMILY: readonly IRType[] = ["float2", "float3", "float4"];
const M_FAMILY: readonly IRType[] = ["float2x2", "float3x3", "float4x4"];

function familyOf(generic: "F" | "V" | "M" | "T"): readonly IRType[] | null {
  if (generic === "F") return F_FAMILY;
  if (generic === "V") return V_FAMILY;
  if (generic === "M") return M_FAMILY;
  return null;
}

// See parse-ts's own `lengthToType` doc comment (identical rationale/caveat:
// a documented best-effort fallback for a length-4 literal's vector-vs-matrix
// ambiguity, never exercised ambiguously by the conformance corpus).
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

// ---------------------------------------------------------------------------
// Handler param tables — identical to parse-ts's (both derive from the same
// @gltfi/ir/import.ts's discoverHandlers convention).
// ---------------------------------------------------------------------------

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
  // Object-form accessor lookup: `"<boundName>.<propName>"` -> variable/
  // event index (see matchNamedCall/parseVars/parseEvents's population) —
  // identical convention to @gltfi/parse-ts's varIndexByProp/eventIndexByProp.
  private varIndexByProp = new Map<string, number>();
  private eventIndexByProp = new Map<string, number>();

  run(topStmts: Statement[]): IRModule {
    const stmts = this.findFactoryBody(topStmts);
    let i = 0;

    const varsMatch = matchNamedCall(stmts[i], "rt", "vars");
    if (!varsMatch) {
      fail("GL101", stmts[i], "expected rt.vars({...}) as the first statement");
    }
    this.parseVars(varsMatch);
    i += 1;

    const eventsMatch = matchNamedCall(stmts[i], "rt", "events");
    if (!eventsMatch) {
      fail("GL102", stmts[i], "expected rt.events({...}) as the second statement");
    }
    this.parseEvents(eventsMatch);
    i += 1;

    // State slots: a run of `local X = N` / `local X = {...}` declarations
    // matching one of the six known shapes.
    while (i < stmts.length && this.tryRegisterStateSlot(stmts[i])) {
      i += 1;
    }

    // Procs: `local proc1, proc2, ...` (forward declare, no initializer —
    // see emit.ts's emitProcs) followed by one `procN = function() ... end`
    // AssignmentStatement per proc.
    const procBodies: Statement[][] = [];
    if (i < stmts.length) {
      const decl = stmts[i];
      if (decl.type === "LocalStatement" && decl.init.length === 0 && decl.variables.length >= 1) {
        decl.variables.forEach((v) => {
          const id = this.procs.length;
          this.procIndexByName.set(v.name, id);
          this.procs.push({ id, name: v.name, body: { k: "seq", stmts: [] } });
          procBodies.push([]);
        });
        i += 1;
        while (i < stmts.length) {
          const s = stmts[i];
          if (s.type !== "AssignmentStatement" || s.variables.length !== 1 || s.variables[0].type !== "Identifier") {
            break;
          }
          const procId = this.procIndexByName.get(s.variables[0].name);
          if (procId === undefined) {
            break;
          }
          const fnExpr = s.init[0];
          if (!fnExpr || fnExpr.type !== "FunctionDeclaration" || fnExpr.isLocal || fnExpr.identifier !== null) {
            fail("GL103", s, "expected an anonymous function assigned to a pre-declared proc");
          }
          procBodies[procId] = fnExpr.body;
          i += 1;
        }
      }
    }

    // Handlers: a run of rt.onStart / rt.onTick / rt.onReceive registrations.
    type HandlerDesc = { kind: HandlerKind; eventRef?: number; bodyStmts: Statement[] };
    const handlerDescs: HandlerDesc[] = [];
    while (i < stmts.length) {
      const expr = this.exprOf(stmts[i]);
      const onStart = asCall(expr, "rt", "onStart");
      const onTick = asCall(expr, "rt", "onTick");
      const onReceive = asCall(expr, "rt", "onReceive");
      if (onStart) {
        handlerDescs.push({ kind: "onStart", bodyStmts: this.handlerFnBody(onStart.arguments[0]) });
      } else if (onTick) {
        handlerDescs.push({ kind: "onTick", bodyStmts: this.handlerFnBody(onTick.arguments[0]) });
      } else if (onReceive) {
        const idx = this.readEventIndex(onReceive.arguments[0]);
        if (idx === undefined) {
          fail("GL104", onReceive.arguments[0], "rt.onReceive's first argument must be a numeric event index literal or `E.<name>`");
        }
        handlerDescs.push({ kind: "receive", eventRef: idx, bodyStmts: this.handlerFnBody(onReceive.arguments[1]) });
      } else {
        fail("GL104", stmts[i], "expected a handler registration (rt.onStart/rt.onTick/rt.onReceive) or unrecognized top-level statement");
      }
      i += 1;
    }

    // Now lower proc bodies then handler bodies (order doesn't matter for
    // correctness since names are pre-registered; mirrors emit.ts's own
    // proc-then-handler ordering).
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

  private exprOf(stmt: Statement | undefined): CallExpression | undefined {
    if (!stmt || stmt.type !== "CallStatement" || stmt.expression.type !== "CallExpression") {
      return undefined;
    }
    return stmt.expression;
  }

  private handlerFnBody(fn: Expression | undefined): Statement[] {
    if (!fn || fn.type !== "FunctionDeclaration") {
      fail("GL104", fn, "expected an anonymous function handler body");
    }
    return fn.body;
  }

  private findFactoryBody(topStmts: Statement[]): Statement[] {
    if (topStmts.length !== 1 || topStmts[0].type !== "ReturnStatement") {
      fail("GL100", topStmts[0], "expected the module's entire top level to be exactly `return function(rt) ... end`");
    }
    const ret = topStmts[0] as ReturnStatement;
    if (ret.arguments.length !== 1) {
      fail("GL100", ret, "expected `return` to have exactly one value");
    }
    const fn = ret.arguments[0];
    if (fn.type !== "FunctionDeclaration" || fn.isLocal || fn.identifier !== null) {
      fail("GL100", fn, "expected an anonymous, non-local function expression");
    }
    if (fn.parameters.length !== 1 || fn.parameters[0].type !== "Identifier" || fn.parameters[0].name !== "rt") {
      fail("GL100", fn, "expected a single `rt` parameter");
    }
    return fn.body;
  }

  // -------------------------------------------------------------------
  // vars / events / state slots
  // -------------------------------------------------------------------

  // Both `rt.vars` shapes are a single ARRAY argument (see emit-lua's
  // emitVars doc comment for why: a Lua table literal's key/value pairs have
  // no guaranteed iteration order, so the new named form has to keep the
  // outer array-of-entries shape too, unlike parse-ts's object-keyed form).
  // Distinguished element-by-element: a `{ name = ..., decl = ... }` entry
  // is the new form, a bare `{ type = ..., initial = ... }` entry is the old
  // one — dispatched once from the FIRST element (mixing shapes within one
  // call is never emitted, so this is an unambiguous, cheap check).
  private parseVars(match: { call: CallExpression; boundName?: string }) {
    const arr = match.call.arguments[0];
    if (!arr || arr.type !== "TableConstructorExpression") {
      fail("GL101", arr, "rt.vars expects a table-literal argument");
    }
    const firstField = arr.fields[0];
    const firstEl = firstField && firstField.type === "TableValue" && firstField.value.type === "TableConstructorExpression" ? firstField.value : undefined;
    if (firstEl && getTableKeyString(firstEl, "name")) {
      this.parseVarsNamedArray(arr, match.boundName ?? "V");
      return;
    }
    arr.fields.forEach((field, idx) => {
      if (field.type !== "TableValue" || field.value.type !== "TableConstructorExpression") {
        fail("GL101", field, "rt.vars element must be a table literal");
      }
      const el = field.value;
      const typeExpr = getTableKeyString(el, "type");
      const type = stringLiteralValue(typeExpr);
      if (!type) {
        fail("GL101", el, "rt.vars element missing string `type`");
      }
      const initExpr = getTableKeyString(el, "initial");
      const initial = initExpr ? this.lowerExpr(initExpr, type as IRType, { kind: "proc" }) : { k: "const" as const, type: type as IRType, data: defaultValue(type as IRType).data };
      if (initial.k !== "const") {
        fail("GL101", initExpr, "rt.vars initial value must be a literal");
      }
      this.variables.push({ name: `var${idx}`, type: type as IRType, initial: { type: type as IRType, data: initial.data as never } });
    });
  }

  // `{ { name = "counter1", decl = rt.int(0.0) }, ... }` — element order is
  // the variable index order (the load-bearing contract — see emit-lua's
  // emitVars/engine.lua's rt.vars doc comments). Each entry's real name
  // round-trips exactly (unlike the plain-array form's synthetic `var<N>`).
  private parseVarsNamedArray(arr: TableConstructorExpression, boundName: string) {
    arr.fields.forEach((field) => {
      if (field.type !== "TableValue" || field.value.type !== "TableConstructorExpression") {
        fail("GL101", field, "rt.vars element must be a table literal");
      }
      const el = field.value;
      const name = stringLiteralValue(getTableKeyString(el, "name"));
      if (!name) {
        fail("GL101", el, "rt.vars named element missing string `name`");
      }
      const declExpr = getTableKeyString(el, "decl");
      if (!declExpr) {
        fail("GL101", el, "rt.vars named element missing `decl`");
      }
      const decl = this.parseVarDeclShorthand(declExpr);
      const idx = this.variables.length;
      this.variables.push({ name, type: decl.type, initial: { type: decl.type, data: decl.data as never } });
      this.varIndexByProp.set(`${boundName}.${name}`, idx);
    });
  }

  // `rt.int(0.0)`/`rt.bool(false)`/`rt.float(0.0)`/`rt.float2(x,y)`/../
  // `rt.ref(s)` — inverse of emit-lua's varDeclCall, mirrors engine.lua's
  // int/bool/float/.../ref factory functions' own defaults.
  private parseVarDeclShorthand(init: Expression): { type: IRType; data: Array<number | boolean | string> } {
    const c = init.type === "CallExpression" ? calleeOf(init) : undefined;
    if (!c || c.base !== "rt") {
      fail("GL101", init, "rt.vars named element's `decl` must be an rt.<type>(...) declaration helper call");
    }
    const args = (init as CallExpression).arguments;
    const type = c.name;
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
      fail("GL101", init, `unknown rt.${type}(...) variable-declaration helper`);
    }
    const nums = args.map((a) => readNumberLiteral(a) ?? 0);
    return { type: type as IRType, data: nums.length > 0 ? nums : VECTOR_MATRIX_DEFAULTS[type] };
  }

  private parseEvents(match: { call: CallExpression; boundName?: string }) {
    const arr = match.call.arguments[0];
    if (!arr || arr.type !== "TableConstructorExpression") {
      fail("GL102", arr, "rt.events expects a table-literal argument");
    }
    const firstField = arr.fields[0];
    const firstEl = firstField && firstField.type === "TableValue" && firstField.value.type === "TableConstructorExpression" ? firstField.value : undefined;
    if (firstEl && getTableKeyString(firstEl, "name")) {
      this.parseEventsNamedArray(arr, match.boundName ?? "E");
      return;
    }
    arr.fields.forEach((field, idx) => {
      if (field.type !== "TableValue" || field.value.type !== "TableConstructorExpression") {
        fail("GL102", field, "rt.events element must be a table literal");
      }
      const { externalId, values } = this.parseEventValues(field.value);
      this.events.push({ name: `event${idx}`, id: externalId, values });
    });
  }

  private parseEventValues(el: TableConstructorExpression): { externalId: string | undefined; values: IREventValue[] } {
    const externalId = stringLiteralValue(getTableKeyString(el, "externalId"));
    const values: IREventValue[] = [];
    const boolExpr = getTableKeyString(el, "defaultBool");
    if (boolExpr) {
      values.push({ name: "boolParameter", type: "bool", default: { type: "bool", data: [readBoolLiteral(boolExpr) ?? false] } });
    }
    const intExpr = getTableKeyString(el, "defaultInt");
    if (intExpr) {
      values.push({ name: "intParameter", type: "int", default: { type: "int", data: [readNumberLiteral(intExpr) ?? 0] } });
    }
    const floatExpr = getTableKeyString(el, "defaultFloat");
    if (floatExpr) {
      values.push({ name: "floatParameter", type: "float", default: { type: "float", data: [readNumberLiteral(floatExpr) ?? 0] } });
    }
    const durExpr = getTableKeyString(el, "expectedDuration");
    if (durExpr) {
      values.push({ name: "expectedDuration", type: "float", default: { type: "float", data: [readNumberLiteral(durExpr) ?? 0] } });
    }
    return { externalId, values };
  }

  // `{ name = "Explode", decl = { externalId = ..., ... } }` — same
  // insertion-order-is-index-order contract as parseVarsNamedArray.
  private parseEventsNamedArray(arr: TableConstructorExpression, boundName: string) {
    arr.fields.forEach((field) => {
      if (field.type !== "TableValue" || field.value.type !== "TableConstructorExpression") {
        fail("GL102", field, "rt.events element must be a table literal");
      }
      const el = field.value;
      const name = stringLiteralValue(getTableKeyString(el, "name"));
      if (!name) {
        fail("GL102", el, "rt.events named element missing string `name`");
      }
      const declExpr = getTableKeyString(el, "decl");
      if (!declExpr || declExpr.type !== "TableConstructorExpression") {
        fail("GL102", el, "rt.events named element missing table `decl`");
      }
      const { externalId, values } = this.parseEventValues(declExpr);
      const idx = this.events.length;
      this.events.push({ name, id: externalId, values });
      this.eventIndexByProp.set(`${boundName}.${name}`, idx);
    });
  }

  // Reconstructs `rt.send`'s 4 fixed payload args (bool,int,float,duration)
  // from the event's OWN declared defaults, for the args-less `rt.send(idx)`
  // shape — see emit-lua's emitEvent/matchesEventDefaults doc comment.
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

  // `E.<name>` (named form) resolves through eventIndexByProp; a bare
  // numeric literal (plain-array form, unchanged) resolves directly.
  private readEventIndex(node: Expression | undefined): number | undefined {
    const n = readNumberLiteral(node);
    if (n !== undefined) {
      return n;
    }
    if (node && node.type === "MemberExpression" && node.indexer === "." && node.base.type === "Identifier") {
      return this.eventIndexByProp.get(`${node.base.name}.${node.identifier.name}`);
    }
    return undefined;
  }

  // Returns true and registers a state slot iff `stmt` matches one of the
  // six shapes emit.ts's emitStateSlots produces.
  private tryRegisterStateSlot(stmt: Statement): boolean {
    if (stmt.type !== "LocalStatement" || stmt.variables.length !== 1 || stmt.init.length !== 1) {
      return false;
    }
    const name = stmt.variables[0].name;
    const init = stmt.init[0];
    const num = readNumberLiteral(init);
    if (num !== undefined) {
      const idx = this.stateSlots.length;
      this.stateSlots.push({ name, kind: "for", config: { initialIndex: Math.trunc(num) } });
      this.stateSlotIndexByName.set(name, idx);
      return true;
    }
    // New state-slot factory-call shape: `local name = rt.doNState()`/etc —
    // see engine.lua's rt.doNState/multiGateState/waitAllState/
    // throttleState/delayState.
    if (init.type === "CallExpression") {
      const c = calleeOf(init);
      const FACTORY_KIND: Record<string, StateKind> = {
        doNState: "doN",
        multiGateState: "multiGate",
        waitAllState: "waitAll",
        throttleState: "throttle",
        delayState: "delay"
      };
      const kind = c && c.base === "rt" ? FACTORY_KIND[c.name] : undefined;
      if (kind) {
        const idx = this.stateSlots.length;
        this.stateSlots.push({ name, kind, config: {} });
        this.stateSlotIndexByName.set(name, idx);
        return true;
      }
      return false;
    }
    if (init.type !== "TableConstructorExpression") {
      return false;
    }
    const keys = new Set(init.fields.filter((f) => f.type === "TableKeyString").map((f) => (f.type === "TableKeyString" ? f.key.name : "")));
    let kind: StateKind | undefined;
    // Unlike emit-ts (which always writes every NodeState field, even ones
    // whose JS value is `undefined`), emit-lua's emitStateSlots omits any
    // field whose default is `undefined` entirely (an absent Lua table key
    // already reads as `nil` — see that method's own doc comment): waitAll's
    // slot table has only `activated` (no `remaining` key), throttle's has
    // only `remaining` (no `lastTime` key). Both are otherwise
    // unambiguous single-key shapes (no other kind uses either key name).
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

  // -------------------------------------------------------------------
  // Statement lowering
  // -------------------------------------------------------------------

  private lowerBlock(stmts: Statement[], ctx: Ctx): IRStmt {
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

  // See parse-ts's own `lowerOptionalBlock` doc comment — identical
  // rationale and identical "empty block == absent branch" convention.
  private lowerOptionalBlock(stmts: Statement[], ctx: Ctx): IRStmt | undefined {
    const result = this.lowerBlock(stmts, ctx);
    return result.k === "seq" && result.stmts.length === 0 ? undefined : result;
  }

  // Shared by doN/async/waitAll's `if (R.<field>) {...} [else {...}]`
  // lookahead check (throttle's invalid/elseif-fire chain is different
  // enough — two DIFFERENT truthy fields, not one — to need its own bespoke
  // reader; see parseThrottle).
  private tryReadIfElseOn(next: Statement | undefined, name: string, field: string, ctx: Ctx): { out?: IRStmt; err?: IRStmt } | undefined {
    if (!next || next.type !== "IfStatement") {
      return undefined;
    }
    const clauses = next.clauses;
    const first = clauses[0];
    if (!first || first.type !== "IfClause" || !this.isFieldTruthyCond(first.condition, name, field)) {
      return undefined;
    }
    const out = this.lowerOptionalBlock(first.body, ctx);
    if (clauses.length === 1) {
      return { out };
    }
    if (clauses.length === 2 && clauses[1].type === "ElseClause") {
      return { out, err: this.lowerOptionalBlock(clauses[1].body, ctx) };
    }
    return undefined;
  }

  private isFieldTruthyCond(cond: Expression, name: string, field: string): boolean {
    return cond.type === "MemberExpression" && cond.indexer === "." && cond.base.type === "Identifier" && cond.base.name === name && cond.identifier.name === field;
  }

  // `<boundName>.<name>.get()` / `<boundName>.<name>.set(value)` — the
  // object-form accessor call shape (see engine.lua's rt.vars doc comment).
  // Returns the `"<base>.<prop>"` lookup key (checked against
  // varIndexByProp by the two call sites) plus the call's own arguments
  // (empty for "get", one value for "set").
  private matchAccessorCall(expr: Expression, method: "get" | "set"): { key: string; args: Expression[] } | undefined {
    if (expr.type !== "CallExpression") {
      return undefined;
    }
    const callee = expr.base;
    if (callee.type !== "MemberExpression" || callee.indexer !== "." || callee.identifier.name !== method) {
      return undefined;
    }
    const objExpr = callee.base;
    if (objExpr.type !== "MemberExpression" || objExpr.indexer !== "." || objExpr.base.type !== "Identifier") {
      return undefined;
    }
    return { key: `${objExpr.base.name}.${objExpr.identifier.name}`, args: expr.arguments };
  }

  private isFieldEqCond(cond: Expression, name: string, field: string): boolean {
    return (
      cond.type === "BinaryExpression" &&
      cond.operator === "==" &&
      cond.left.type === "MemberExpression" &&
      cond.left.indexer === "." &&
      cond.left.base.type === "Identifier" &&
      cond.left.base.name === name &&
      cond.left.identifier.name === field
    );
  }

  private parseOne(stmts: Statement[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const stmt = stmts[i];

    // --- setPointer, OLD block-wrapped shape:
    // `do local ok = rt.ptrSet(...); if ok then {...} else {...} end end`
    if (stmt.type === "DoStatement") {
      const inner = (stmt as DoStatement).body;
      const decl0 = inner[0];
      if (decl0 && decl0.type === "LocalStatement" && decl0.variables.length === 1 && decl0.init.length === 1) {
        const ptrSetCall = asCallExpr(decl0.init[0], "rt", "ptrSet");
        if (ptrSetCall) {
          return { stmt: this.parseSetPointer(decl0, ptrSetCall, inner, ctx), consumed: 1 };
        }
      }
      fail("GL121", stmt, "unrecognized bare do...end block (expected a pointer/set wrapper)");
    }

    // --- async ops: optional `local function __contN() ... end` then either
    // shape (see tryParseAsync's own doc comment for the full old/new shape
    // matrix). Checked early since it can match a bare FunctionDeclaration
    // (always an async done-continuation in this parser), a `local R =
    // rt.<fn>(...)` declaration, a bare `rt.<fn>(...)` statement, or a bare
    // `if rt.<fn>(...).ok then ... end`.
    const asyncResult = this.tryParseAsync(stmts, i, ctx);
    if (asyncResult) {
      return asyncResult;
    }

    if (stmt.type === "LocalStatement" && stmt.variables.length === 1 && stmt.init.length === 1) {
      const name = stmt.variables[0].name;
      const init = stmt.init[0];
      const doN = asCallExpr(init, "rt", "doN");
      if (doN) return this.parseDoN(stmts, i, name, doN, ctx);
      const multiGate = asCallExpr(init, "rt", "multiGate");
      if (multiGate) return this.parseMultiGate(stmts, i, name, multiGate, ctx);
      const waitAll = asCallExpr(init, "rt", "waitAll");
      if (waitAll) return this.parseWaitAll(stmts, i, name, waitAll, ctx);
      const throttle = asCallExpr(init, "rt", "throttle");
      if (throttle) return this.parseThrottle(stmts, i, name, throttle, ctx);
      const switchResult = this.tryParseSwitchAfterLet(stmts, i, name, init, ctx);
      if (switchResult) return switchResult;

      // plain `local` temp.
      const expr = this.lowerExpr(init, undefined, ctx);
      const type = this.typeOfExpr(expr);
      this.tempTypeByName.set(name, type);
      return { stmt: { k: "let", temp: name, type, expr }, consumed: 1 };
    }

    if (stmt.type === "CallStatement") {
      const expr = stmt.expression.type === "CallExpression" ? stmt.expression : undefined;
      if (!expr) {
        fail("GL110", stmt, "unrecognized call-statement shape (string-call/table-call sugar is never emitted by this backend)");
      }

      const cancelSlot = asCall(expr, "rt", "cancelDelaySlot");
      if (cancelSlot) {
        const slot = this.slotRefOf(cancelSlot.arguments[0]);
        return { stmt: { k: "intrinsic", op: "flow/setDelay#cancel", config: { slot: slot.slot }, args: [], outs: {} }, consumed: 1 };
      }
      const cancelDelay = asCall(expr, "rt", "cancelDelay");
      if (cancelDelay) {
        const refExpr = this.lowerExpr(cancelDelay.arguments[0], "ref", ctx);
        return { stmt: { k: "intrinsic", op: "flow/cancelDelay", config: {}, args: [refExpr], outs: {} }, consumed: 1 };
      }
      const eventOut = asCall(expr, "rt", "eventOut");
      if (eventOut) {
        // Not part of the IR model (pure emit-time bookkeeping — see
        // model.ts/emit.ts's crossHandlerReads note); safe to drop.
        return { stmt: null, consumed: 1 };
      }
      // setPointer, new bare-statement shape (no out/err at all — see
      // emit-lua's emitSetPointer doc comment).
      const ptrSetBare = asCall(expr, "rt", "ptrSet");
      if (ptrSetBare) {
        return { stmt: this.buildSetPointerStmt(ptrSetBare, undefined, undefined, ctx), consumed: 1 };
      }
      // Stateful ops with NO branch at all wired still MUST run (they
      // advance state) — emit-lua emits a bare, return-value-discarding call
      // statement for exactly this case (see emitStateful's `else` branches).
      const doNBare = asCall(expr, "rt", "doN");
      if (doNBare) {
        const [slotExpr, nExpr] = doNBare.arguments;
        const slot = this.slotRefOf(slotExpr);
        const args = [this.lowerExpr(nExpr, "int", ctx)];
        return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs: {} }, consumed: 1 };
      }
      const multiGateBare = asCall(expr, "rt", "multiGate");
      if (multiGateBare) {
        return { stmt: this.buildMultiGateStmt(multiGateBare, ctx), consumed: 1 };
      }
      const waitAllBare = asCall(expr, "rt", "waitAll");
      if (waitAllBare) {
        return { stmt: this.buildWaitAllStmt(waitAllBare, undefined, undefined, ctx), consumed: 1 };
      }
      const throttleBare = asCall(expr, "rt", "throttle");
      if (throttleBare) {
        const [slotExpr, durationExpr] = throttleBare.arguments;
        const slot = this.slotRefOf(slotExpr);
        const args = [this.lowerExpr(durationExpr, "float", ctx)];
        return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs: {} }, consumed: 1 };
      }
      const setVar = asCall(expr, "rt", "setVar");
      if (setVar) {
        const [idxExpr, valExpr] = setVar.arguments;
        const varId = readNumberLiteral(idxExpr);
        if (varId === undefined) fail("GL123", idxExpr, "rt.setVar's first argument must be a numeric literal");
        const varType = this.variables[varId]?.type ?? fail("GL123", idxExpr, `rt.setVar references out-of-range var ${varId}`);
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(valExpr, varType, ctx) }, consumed: 1 };
      }
      // Object form: `V.<name>.set(value)` — see matchAccessorCall's doc
      // comment and parseVarsNamedArray's varIndexByProp population.
      const setAccessor = this.matchAccessorCall(expr, "set");
      if (setAccessor && this.varIndexByProp.has(setAccessor.key)) {
        const varId = this.varIndexByProp.get(setAccessor.key)!;
        const varType = this.variables[varId]?.type ?? "float";
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(setAccessor.args[0], varType, ctx) }, consumed: 1 };
      }
      const send = asCall(expr, "rt", "send");
      if (send) {
        const sendArgs = send.arguments;
        const eventId = this.readEventIndex(sendArgs[0]);
        if (eventId === undefined) fail("GL124", sendArgs[0], "rt.send's first argument must be a numeric literal or `E.<name>`");
        // Three call shapes (see engine.lua's rt.send doc comment): OLD
        // `(idx, externalId, payload)` (3 args — payload is args[2],
        // externalId is ignored), NEW `(idx, payload)` (2 args), and NEW
        // `(idx)` alone (1 arg — every value equals the event's own
        // declared default, reconstructed by eventDefaultArgs).
        const payloadExpr = sendArgs.length >= 3 ? sendArgs[2] : sendArgs.length === 2 ? sendArgs[1] : undefined;
        const types: IRType[] = ["bool", "int", "float", "float"];
        const args = payloadExpr
          ? (() => {
              const elems = tableArrayValues(payloadExpr);
              if (!elems || elems.length !== 4) {
                fail("GL124", payloadExpr, "rt.send's payload argument must be a 4-element table literal");
              }
              return elems.map((e, k) => this.lowerExpr(e, types[k], ctx));
            })()
          : this.eventDefaultArgs(eventId);
        return { stmt: { k: "emitEvent", eventId, args }, consumed: 1 };
      }
      const stopProp = asCall(expr, "rt", "stopPropagation");
      if (stopProp) {
        const [, stopImmediateExpr] = stopProp.arguments;
        return { stmt: { k: "stopPropagation", stopImmediate: this.lowerExpr(stopImmediateExpr, "bool", ctx), config: {} }, consumed: 1 };
      }
      const log = asCall(expr, "rt", "log");
      if (log) {
        const [templateExpr, argsExpr] = log.arguments;
        const template = stringLiteralValue(templateExpr) ?? "";
        const argList = tableArrayValues(argsExpr) ?? [];
        const args = argList.map((a) => this.lowerExpr(a, undefined, ctx));
        return { stmt: { k: "log", template, args }, consumed: 1 };
      }
      if (expr.base.type === "Identifier" && expr.arguments.length === 0) {
        const procId = this.procIndexByName.get(expr.base.name);
        if (procId !== undefined) {
          return { stmt: { k: "callProc", procId }, consumed: 1 };
        }
      }
      fail("GL110", stmt, "unrecognized call statement (unknown callee)");
    }

    if (stmt.type === "AssignmentStatement") {
      const resetConsumed = this.tryParseReset(stmts, i);
      if (resetConsumed) {
        return resetConsumed;
      }
      const forResult = this.tryParseFor(stmts, i, ctx);
      if (forResult) {
        return forResult;
      }
      fail("GL110", stmt, "unrecognized assignment-statement shape");
    }

    if (stmt.type === "IfStatement") {
      // `if rt.doN(slot, n) then ... end` — doN's fire decision is now a
      // bare boolean (see engine.lua's rt.doN doc comment), inlined
      // directly into the condition with no result variable at all (there's
      // no "no-fire" flow branch to speak of, so an `else`/`elseif` here is
      // never emitted for this shape).
      const firstClause0 = stmt.clauses[0];
      if (firstClause0 && firstClause0.type === "IfClause" && (stmt.clauses.length === 1 || (stmt.clauses.length === 2 && stmt.clauses[1].type === "ElseClause"))) {
        const doNCall = stmt.clauses.length === 1 ? asCallExpr(firstClause0.condition, "rt", "doN") : undefined;
        if (doNCall) {
          const [slotExpr, nExpr] = doNCall.arguments;
          const slot = this.slotRefOf(slotExpr);
          const args = [this.lowerExpr(nExpr, "int", ctx)];
          const outs: Record<string, IRStmt> = {};
          const block = this.lowerOptionalBlock(firstClause0.body, ctx);
          if (block) outs.out = block;
          return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs }, consumed: 1 };
        }
        // setPointer, new bare-`if` shape (no wrapping block, no named
        // result — see emit-lua's emitSetPointer doc comment).
        const ptrSetIfCall = asCallExpr(firstClause0.condition, "rt", "ptrSet");
        if (ptrSetIfCall) {
          const elseClause0 = stmt.clauses[1];
          const errStmts = elseClause0 && elseClause0.type === "ElseClause" ? elseClause0.body : undefined;
          return { stmt: this.buildSetPointerStmt(ptrSetIfCall, firstClause0.body, errStmts, ctx), consumed: 1 };
        }
        // waitAll, new bare-`if` shape (no named result — `.completed` read
        // at most once, see emit-lua's emitStateful's waitAll case).
        const completedBase = fieldOf(firstClause0.condition, "completed");
        const waitAllCall = completedBase ? asCallExpr(completedBase, "rt", "waitAll") : undefined;
        if (waitAllCall) {
          const elseClause0 = stmt.clauses[1];
          const outStmts = elseClause0 && elseClause0.type === "ElseClause" ? elseClause0.body : undefined;
          return { stmt: this.buildWaitAllStmt(waitAllCall, firstClause0.body, outStmts, ctx), consumed: 1 };
        }
        // multiGate, new single-wired-output bare-`if` shape: `if
        // rt.multiGate(...).index == 0 then ... end` (no elseif chain — see
        // emit-lua's emitStateful's multiGate case: 2+ outputs instead use a
        // named result + elseif chain, structurally identical to the OLD
        // shape parseMultiGate already handles unchanged).
        if (stmt.clauses.length === 1 && firstClause0.condition.type === "BinaryExpression" && firstClause0.condition.operator === "==") {
          const indexBase = fieldOf(firstClause0.condition.left, "index");
          const multiGateCall = indexBase ? asCallExpr(indexBase, "rt", "multiGate") : undefined;
          const caseNum = readNumberLiteral(firstClause0.condition.right);
          if (multiGateCall && caseNum !== undefined) {
            const stmtNode = this.buildMultiGateStmt(multiGateCall, ctx);
            stmtNode.outs[String(caseNum)] = this.lowerBlock(firstClause0.body, ctx);
            return { stmt: stmtNode, consumed: 1 };
          }
        }
        // setPointer, negated empty-"out" bare-`if` shape: `if not
        // rt.ptrSet(...) then errBody end` (no else) — see emit-lua's
        // emitSetPointer doc comment. A bare function-call result is always
        // atomic, so the negated operand is exactly the same CallExpression
        // as the non-negated case.
        if (!stmt.clauses[1]) {
          const { negated, inner } = unwrapNot(firstClause0.condition);
          if (negated) {
            const negPtrSetCall = asCallExpr(inner, "rt", "ptrSet");
            if (negPtrSetCall) {
              return { stmt: this.buildSetPointerStmt(negPtrSetCall, undefined, firstClause0.body, ctx), consumed: 1 };
            }
            // Generic empty-"then" negated-condition shape: `if not cond
            // then elseBody end` (no else at all) — see emit-lua's emitStmt
            // "if" case's thenEmpty branch. Reconstructs the ORIGINAL
            // (un-negated) cond, an empty "then", and the printed body as
            // "else" — the exact inverse of that transform. Checked last
            // (after every more-specific negated shape above) since it's
            // the most general match on a bare `not <expr>` condition with
            // no else.
            const cond = this.lowerExpr(inner, "bool", ctx);
            const elseBody = this.lowerBlock(firstClause0.body, ctx);
            return { stmt: { k: "if", cond, then: { k: "seq", stmts: [] }, else: elseBody }, consumed: 1 };
          }
        }
      }
      const first = stmt.clauses[0];
      // NOTE: a native `==` in an `if` condition is NOT necessarily a
      // flow/switch or multiGate dispatch — since the readability pass's
      // native-operator substitution renders float/bool math/eq as a plain
      // `==` too (see emit-lua's nativeOpInfo), an ordinary flow/branch
      // condition can legitimately be `==`-headed (e.g. `if t1 - t1 == 0.0
      // then`). flow/switch (`tryParseSwitchAfterLet`) and OLD-shape
      // multiGate (`parseMultiGate`) are both still always consumed via
      // LOOKAHEAD from their preceding `local` statement, and the NEW bare/
      // single-output multiGate shape is consumed by this same IfStatement
      // dispatch's own earlier branch (above) — so by construction, an
      // `==`-headed IfStatement reaching this point is always a genuine
      // plain-boolean condition, lowered the same as any other.
      if (!first || first.type !== "IfClause") {
        fail("GL110", stmt, "unrecognized if-statement shape");
      }
      if (stmt.clauses.length > 2 || (stmt.clauses[1] && stmt.clauses[1].type === "ElseifClause")) {
        fail("GL110", stmt, "unrecognized if-statement shape (unexpected elseif chain for a plain flow/branch)");
      }
      const cond = this.lowerExpr(first.condition, "bool", ctx);
      const thenS = this.lowerBlock(first.body, ctx);
      const elseClause = stmt.clauses[1];
      const elseS = elseClause ? this.lowerOptionalBlock(elseClause.body, ctx) : undefined;
      return { stmt: { k: "if", cond, then: thenS, else: elseS }, consumed: 1 };
    }

    if (stmt.type === "WhileStatement") {
      const cond = this.lowerExpr(stmt.condition, "bool", ctx);
      const body = this.lowerBlock(stmt.body, ctx);
      return { stmt: { k: "while", cond, body }, consumed: 1 };
    }

    fail("GL110", stmt, `unrecognized statement shape (kind ${stmt.type})`);
  }

  // -------------------------------------------------------------------
  // setPointer
  // -------------------------------------------------------------------

  // OLD block-wrapped shape: `do local ok = rt.ptrSet(...); if ok then {...}
  // else {...} end end`.
  private parseSetPointer(decl: LocalStatement, call: CallExpression, inner: Statement[], ctx: Ctx): IRStmt {
    const okName = decl.variables[0].name;
    let outStmts: Statement[] | undefined;
    let errStmts: Statement[] | undefined;
    const ifStmt = inner[1];
    if (ifStmt) {
      const firstClause = ifStmt.type === "IfStatement" ? ifStmt.clauses[0] : undefined;
      const cond = firstClause && firstClause.type === "IfClause" ? firstClause.condition : undefined;
      if (ifStmt.type !== "IfStatement" || !firstClause || firstClause.type !== "IfClause" || !cond || cond.type !== "Identifier" || cond.name !== okName) {
        fail("GL125", ifStmt, "expected `if ok then ... else ... end` following a pointer/set call");
      }
      outStmts = firstClause.body;
      const elseClause = ifStmt.clauses[1];
      errStmts = elseClause ? elseClause.body : undefined;
    }
    return this.buildSetPointerStmt(call, outStmts, errStmts, ctx);
  }

  // Shared arg-extraction for every pointer/set shape (old block-wrapped,
  // new bare-call, new bare-`if`) — `call`'s own arguments alone (a 3-arg
  // args-less form vs the 4-arg args-object form, disambiguated the same
  // way pointerCall's counterpart on the emit side infers it: position 1 is
  // either the args table or, when it's a string, the type signature and
  // the whole args table was omitted — see emit-lua's pointerCall doc
  // comment) determine everything except out/err, which the three call
  // sites derive differently from their own surrounding syntax.
  private buildSetPointerStmt(call: CallExpression, outStmts: Statement[] | undefined, errStmts: Statement[] | undefined, ctx: Ctx): IRStmt {
    const argNodes = call.arguments;
    const hasArgsObj = argNodes.length >= 2 && argNodes[1].type === "TableConstructorExpression";
    const [pointerExpr, argsObjExpr, typeExpr, valueExpr] = hasArgsObj ? argNodes : [argNodes[0], undefined, argNodes[1], argNodes[2]];
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GL125", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GL125", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, ctx);
    const value = this.lowerExpr(valueExpr, type, ctx);
    const out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    const err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return { k: "setPointer", template, args, value, type, out, err };
  }

  // `objExpr` is undefined both when the template has zero dynamic params
  // (args-less form — see emit-lua's pointerCall) and, defensively, whenever
  // there's genuinely nothing left to look up; only fail on a MISSING table
  // literal when the template actually still has params to resolve.
  private lowerPointerArgs(objExpr: Expression | undefined, template: PtrTemplate, ctx: Ctx): IRExpr[] {
    const params = pointerTemplateParams(template);
    if (params.length === 0) {
      return [];
    }
    if (!objExpr || objExpr.type !== "TableConstructorExpression") {
      fail("GL125", objExpr, "pointer args must be a table literal");
    }
    return params.map((p) => {
      const init = getTableKeyString(objExpr, p.name);
      if (!init) {
        fail("GL125", objExpr, `pointer args table missing param "${p.name}"`);
      }
      return this.lowerExpr(init, p.kind === "int" ? "int" : "ref", ctx);
    });
  }

  // -------------------------------------------------------------------
  // async ops
  // -------------------------------------------------------------------

  // Entry point for both async-op shapes: the OLD `[contFn?] local R =
  // rt.<fn>(...); [if R.ok then ... else ... end]` and the NEW `[contFn?]
  // (rt.<fn>(...) | if rt.<fn>(...).ok then ... else ... end)` — the latter
  // has no named result variable at all (`.ok` is read at most once, so
  // emit-lua inlines the call straight into the check — see emit-lua's
  // emitAsync doc comment). Returns undefined (falling through to the rest
  // of parseOne's dispatch) when `stmts[i]` isn't a local-function AND
  // doesn't otherwise start a recognizable async site; still `fail()`s when
  // `stmts[i]` IS a local-function declaration but nothing valid follows it,
  // since every local function declaration this parser can reach is, by
  // construction, an async-op's lifted inline continuation.
  private tryParseAsync(stmts: Statement[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const stmt = stmts[i];
    const contFn = stmt.type === "FunctionDeclaration" && stmt.isLocal && stmt.identifier !== null ? stmt : undefined;
    const offset = contFn ? 1 : 0;
    const site = stmts[i + offset];
    if (!site) {
      if (contFn) fail("GL122", stmt, "unrecognized local function declaration (expected an async done-continuation)");
      return undefined;
    }

    // OLD shape: `local R = rt.<fn>(...)` [+ `if R.ok then ... else ... end`]
    if (site.type === "LocalStatement" && site.variables.length === 1 && site.init.length === 1) {
      const matched = matchAsyncCall(site.init[0]);
      if (matched) {
        const resName = site.variables[0].name;
        let consumed = offset + 1;
        const nextStmt = stmts[i + consumed];
        const firstClause = nextStmt && nextStmt.type === "IfStatement" ? nextStmt.clauses[0] : undefined;
        let outStmts: Statement[] | undefined;
        let errStmts: Statement[] | undefined;
        if (nextStmt && nextStmt.type === "IfStatement" && firstClause && firstClause.type === "IfClause" && this.isFieldTruthyCond(firstClause.condition, resName, "ok")) {
          outStmts = firstClause.body;
          const elseClause = nextStmt.clauses[1];
          errStmts = elseClause && elseClause.type === "ElseClause" ? elseClause.body : undefined;
          consumed += 1;
        }
        return { stmt: this.buildAsyncStmt(matched, contFn, outStmts, errStmts, ctx), consumed };
      }
    }

    // NEW shape: bare `rt.<fn>(...)` (no out/err — the call's return value
    // is discarded entirely, matching the always-runs semantics exactly).
    if (site.type === "CallStatement" && site.expression.type === "CallExpression") {
      const matched = matchAsyncCall(site.expression);
      if (matched) {
        return { stmt: this.buildAsyncStmt(matched, contFn, undefined, undefined, ctx), consumed: offset + 1 };
      }
    }

    // NEW shape: `if rt.<fn>(...).ok then ... else ... end`.
    if (site.type === "IfStatement") {
      const first = site.clauses[0];
      if (first && first.type === "IfClause") {
        const okBase = fieldOf(first.condition, "ok");
        const matched = okBase ? matchAsyncCall(okBase) : undefined;
        if (matched) {
          const elseClause = site.clauses[1];
          const err = elseClause && elseClause.type === "ElseClause" ? elseClause.body : undefined;
          return { stmt: this.buildAsyncStmt(matched, contFn, first.body, err, ctx), consumed: offset + 1 };
        }
        // Negated empty-"out" shape: `if not rt.<fn>(...).ok then errBody
        // end` (no else) — see emit-lua's emitAsync doc comment for the
        // negation this inverts. `not x.ok` always parses as `not (x.ok)`
        // (member access binds tighter than `not`), so the operand here is
        // exactly the same `<call>.ok` MemberExpression as the non-negated
        // case above.
        if (!site.clauses[1]) {
          const { negated, inner } = unwrapNot(first.condition);
          if (negated) {
            const innerOkBase = fieldOf(inner, "ok");
            const negMatched = innerOkBase ? matchAsyncCall(innerOkBase) : undefined;
            if (negMatched) {
              return { stmt: this.buildAsyncStmt(negMatched, contFn, undefined, first.body, ctx), consumed: offset + 1 };
            }
          }
        }
      }
    }

    if (contFn) {
      fail("GL122", stmt, "unrecognized local function declaration (expected an async done-continuation)");
    }
    return undefined;
  }

  private buildAsyncStmt(
    matched: { fn: string; call: CallExpression },
    contFn: FunctionDeclaration | undefined,
    outStmts: Statement[] | undefined,
    errStmts: Statement[] | undefined,
    ctx: Ctx
  ): IRStmt {
    const args = matched.call.arguments;
    const kind = matched.fn as "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt";

    let lastArg: Expression | undefined;
    const baseStmt: Partial<Extract<IRStmt, { k: "async" }>> = { k: "async", kind };

    if (kind === "setDelay") {
      const [slotExpr, durationExpr, doneExpr] = args;
      baseStmt.slot = this.slotRefOf(slotExpr);
      baseStmt.args = [this.lowerExpr(durationExpr, "float", ctx)];
      lastArg = doneExpr;
    } else if (kind === "varInterp") {
      const [varIdExpr, valueExpr, durationExpr, p1Expr, p2Expr, useSlerpExpr, doneExpr] = args;
      const varId = readNumberLiteral(varIdExpr) ?? fail("GL126", varIdExpr, "varInterp's first argument must be a numeric literal");
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
      const hasArgsObj = args.length >= 2 && args[1].type === "TableConstructorExpression";
      const [pointerExpr, argsObjExpr, typeExpr, valueExpr, durationExpr, p1Expr, p2Expr, doneExpr] = hasArgsObj
        ? args
        : [args[0], undefined, args[1], args[2], args[3], args[4], args[5], args[6]];
      const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GL126", pointerExpr, "ptrInterp pointer must be a string literal");
      const template = parsePointerTemplate(pointerLit);
      const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GL126", typeExpr, "ptrInterp type must be a string literal");
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

    if (lastArg && lastArg.type !== "NilLiteral") {
      if (contFn) {
        baseStmt.done = { kind: "inline", body: this.lowerBlock(contFn.body, ctx) } as Cont;
      } else if (lastArg.type === "Identifier") {
        const procId = this.procIndexByName.get(lastArg.name);
        if (procId === undefined) fail("GL126", lastArg, `unknown proc reference "${lastArg.name}" as async done continuation`);
        baseStmt.done = { kind: "proc", procId } as Cont;
      } else {
        fail("GL126", lastArg, "async done continuation must be a proc reference, inline function, or nil");
      }
    }

    baseStmt.out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    baseStmt.err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return baseStmt as IRStmt;
  }

  // -------------------------------------------------------------------
  // stateful ops
  // -------------------------------------------------------------------

  private slotRefOf(expr: Expression): { slot: number } {
    if (expr.type !== "Identifier") {
      fail("GL127", expr, "expected a state-slot identifier");
    }
    const idx = this.stateSlotIndexByName.get(expr.name);
    if (idx === undefined) {
      fail("GL127", expr, `unknown state slot "${expr.name}"`);
    }
    return { slot: idx };
  }

  private parseDoN(stmts: Statement[], i: number, resName: string, call: CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, nExpr] = call.arguments;
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

  private parseThrottle(stmts: Statement[], i: number, resName: string, call: CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, durationExpr] = call.arguments;
    const slot = this.slotRefOf(slotExpr);
    const args = [this.lowerExpr(durationExpr, "float", ctx)];
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (
      next &&
      next.type === "IfStatement" &&
      next.clauses.length === 2 &&
      next.clauses[0].type === "IfClause" &&
      this.isFieldTruthyCond(next.clauses[0].condition, resName, "invalid") &&
      next.clauses[1].type === "ElseifClause" &&
      this.isFieldTruthyCond(next.clauses[1].condition, resName, "fire")
    ) {
      const errBlock = this.lowerOptionalBlock(next.clauses[0].body, ctx);
      const outBlock = this.lowerOptionalBlock(next.clauses[1].body, ctx);
      if (errBlock) outs.err = errBlock;
      if (outBlock) outs.out = outBlock;
      consumed = 2;
    }
    return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs }, consumed };
  }

  // OLD shape: `local R = rt.waitAll(...); if R.completed then ... else ...
  // end`. The NEW bare-`if` shape (no named result at all) is dispatched
  // straight to buildWaitAllStmt from parseOne's own IfStatement handling.
  private parseWaitAll(stmts: Statement[], i: number, resName: string, call: CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const next = stmts[i + 1];
    const firstClause = next && next.type === "IfStatement" ? next.clauses[0] : undefined;
    if (next && next.type === "IfStatement" && firstClause && firstClause.type === "IfClause" && this.isFieldTruthyCond(firstClause.condition, resName, "completed")) {
      const elseClause = next.clauses[1];
      const outStmts = elseClause && elseClause.type === "ElseClause" ? elseClause.body : undefined;
      return { stmt: this.buildWaitAllStmt(call, firstClause.body, outStmts, ctx), consumed: 2 };
    }
    return { stmt: this.buildWaitAllStmt(call, undefined, undefined, ctx), consumed: 1 };
  }

  // Shared arg-parsing (+ config back-fill) for both waitAll shapes: the OLD
  // named-result form and the NEW bare `if rt.waitAll(...).completed then
  // ... else ... end` form (`.completed` read at most once — see emit-lua's
  // emitStateful's waitAll case).
  private buildWaitAllStmt(call: CallExpression, completedStmts: Statement[] | undefined, outStmts: Statement[] | undefined, ctx: Ctx): IRStmt {
    const [slotExpr, inputFlowsExpr, indexExpr] = call.arguments;
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

  // OLD shape: `local R = rt.multiGate(...); if R.index == 0 then ... elseif
  // ... end` (also reused, UNCHANGED, for the new 2+-output named-result
  // shape — see emit-lua's emitStateful's multiGate case: only a SINGLE
  // wired output ever inlines the call directly with no named result, since
  // an if/elseif chain re-evaluating a literal call expression 2+ times
  // would re-invoke — and re-mutate — this stateful op; that bare-`if`
  // single-output shape is dispatched straight to buildMultiGateStmt from
  // parseOne's own IfStatement handling instead).
  private parseMultiGate(stmts: Statement[], i: number, resName: string, call: CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const base = this.buildMultiGateStmt(call, ctx);
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && next.type === "IfStatement" && next.clauses.every((c) => c.type !== "ElseClause" && this.isFieldEqCond(c.condition, resName, "index"))) {
      next.clauses.forEach((clause) => {
        if (clause.type === "ElseClause") {
          return; // excluded by the `every` guard above; unreachable
        }
        const num = readNumberLiteral((clause.condition as Extract<Expression, { type: "BinaryExpression" }>).right);
        if (num === undefined) {
          fail("GL128", clause, "multiGate switch case must be a numeric literal");
        }
        base.outs[String(num)] = this.lowerBlock(clause.body, ctx);
      });
      consumed = 2;
    }
    return { stmt: base, consumed };
  }

  // Shared arg-parsing (+ config back-fill) for every multiGate shape — see
  // parseMultiGate's own doc comment for which surrounding syntax each
  // caller derives `outs` from.
  private buildMultiGateStmt(call: CallExpression, ctx: Ctx): Extract<IRStmt, { k: "stateful" }> {
    void ctx;
    const [slotExpr, , isRandomExpr, isLoopExpr] = call.arguments;
    const slot = this.slotRefOf(slotExpr);
    const isRandom = readBoolLiteral(isRandomExpr) ?? false;
    const isLoop = readBoolLiteral(isLoopExpr) ?? false;
    this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { isRandom, isLoop } };
    return { k: "stateful", kind: "multiGate", slot, port: "in", args: [], outs: {} };
  }

  private tryParseReset(stmts: Statement[], i: number): { stmt: IRStmt; consumed: number } | null {
    const stmt = stmts[i] as AssignmentStatement;
    if (stmt.variables.length !== 1 || stmt.init.length !== 1) {
      return null;
    }
    const left = stmt.variables[0];
    if (left.type !== "MemberExpression" || left.indexer !== "." || left.base.type !== "Identifier") {
      return null;
    }
    const slotName = left.base.name;
    const slotIdx = this.stateSlotIndexByName.get(slotName);
    if (slotIdx === undefined) {
      return null;
    }
    const kind = this.stateSlots[slotIdx].kind;
    const field = left.identifier.name;
    if (kind === "doN" && field === "count") {
      return { stmt: { k: "stateful", kind: "doN", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 1 };
    }
    if (kind === "multiGate" && field === "used") {
      return { stmt: { k: "stateful", kind: "multiGate", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    if (kind === "waitAll" && field === "activated") {
      const nextStmt = stmts[i + 1];
      if (nextStmt && nextStmt.type === "AssignmentStatement" && nextStmt.variables[0]?.type === "MemberExpression") {
        const n = readNumberLiteral(nextStmt.init[0]);
        if (n !== undefined) {
          this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(n) } };
        }
      }
      return { stmt: { k: "stateful", kind: "waitAll", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    if (kind === "throttle" && field === "lastTime") {
      return { stmt: { k: "stateful", kind: "throttle", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    return null;
  }

  // -------------------------------------------------------------------
  // for
  // -------------------------------------------------------------------

  private tryParseFor(stmts: Statement[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | null {
    const stmt = stmts[i] as AssignmentStatement;
    if (stmt.variables.length !== 1 || stmt.init.length !== 1) {
      return null;
    }
    const left = stmt.variables[0];
    if (left.type !== "Identifier") {
      return null;
    }
    const slotIdx = this.stateSlotIndexByName.get(left.name);
    if (slotIdx === undefined || this.stateSlots[slotIdx].kind !== "for") {
      return null;
    }
    const next = stmts[i + 1];
    if (!next || next.type !== "WhileStatement") {
      fail("GL129", next, "expected a `while` loop following a for-slot assignment");
    }
    const cond = next.condition;
    if (cond.type !== "BinaryExpression" || cond.operator !== "<" || cond.left.type !== "Identifier" || cond.left.name !== left.name) {
      fail("GL129", cond, "expected `slot < end` for a for-loop condition");
    }
    const start = this.lowerExpr(stmt.init[0], "int", ctx);
    const end = this.lowerExpr(cond.right, "int", ctx);
    const bodyStmts = next.body;
    const last = bodyStmts[bodyStmts.length - 1];
    if (!last || last.type !== "AssignmentStatement" || last.variables.length !== 1) {
      fail("GL129", last, "expected the for-loop body's last statement to be the index increment");
    }
    const body = this.lowerBlock(bodyStmts.slice(0, -1), ctx);
    return { stmt: { k: "for", slot: { slot: slotIdx }, start, end, body }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // flow/switch — emit.ts's emitSwitch ALWAYS hoists the selector into a
  // fresh local first (`local selVar = <selector>`) before the
  // `if selVar == c0 then ... elseif selVar == c1 then ... [else ...] end`
  // chain, even when `<selector>` is itself already a bare literal — a Lua-
  // specific emission choice (repeating a possibly non-trivial selector
  // expression in every `elseif` clause would be wasteful/wrong if it had
  // side effects) with no analog in emit-ts (whose native `switch (<expr>)`
  // statement evaluates the discriminant exactly once by construction, so
  // it never needs a synthetic temp — see e.g. its plain `switch (4 | 0)`
  // output for a literal selector). Reconstructing a plain temp-and-switch
  // pair here would NOT round-trip to the original IR (whose `selector` is
  // often a literal `const`, not a `temp` reference to a hoisted local), so
  // this is called from the LocalStatement dispatch as a lookahead — like
  // doN/multiGate/waitAll/throttle's own result-var lookaheads — folding the
  // hoisted local's OWN initializer expression back in as the switch's
  // selector directly and consuming both statements as a single IRStmt
  // (dropping the synthetic local entirely, exactly mirroring what emit-ts's
  // parser sees: one expression, no intermediate temp).
  private tryParseSwitchAfterLet(stmts: Statement[], i: number, name: string, initExpr: Expression, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const next = stmts[i + 1];
    if (!next || next.type !== "IfStatement") {
      return undefined;
    }
    const first = next.clauses[0];
    if (!first || first.type !== "IfClause") {
      return undefined;
    }
    // Empty-cases-with-default edge case: `if true then <default> end` (see
    // emitSwitch: when `stmt.cases` is empty but `stmt.default` exists, the
    // `first` flag is never cleared, so it pushes a literal `if true then`
    // instead of an `==` test) — the ONLY shape this backend ever emits with
    // a bare `true` condition (flow/branch's cond is always a real value
    // expression via emitExpr, never the literal keyword), so this alone is
    // unambiguous even though it doesn't reference `name` at all.
    if (next.clauses.length === 1 && first.condition.type === "BooleanLiteral" && first.condition.value === true) {
      const selector = this.lowerExpr(initExpr, "int", ctx);
      return { stmt: { k: "switch", selector, cases: [], default: this.lowerBlock(first.body, ctx) }, consumed: 2 };
    }
    if (first.condition.type !== "BinaryExpression" || first.condition.operator !== "==" || first.condition.left.type !== "Identifier" || first.condition.left.name !== name) {
      return undefined;
    }
    const selector = this.lowerExpr(initExpr, "int", ctx);
    const cases: Array<[number, IRStmt]> = [];
    let dflt: IRStmt | undefined;
    for (const clause of next.clauses) {
      if (clause.type === "ElseClause") {
        dflt = this.lowerBlock(clause.body, ctx);
        continue;
      }
      if (clause.condition.type !== "BinaryExpression" || clause.condition.operator !== "==") {
        fail("GL130", clause, "switch case must be a numeric-literal equality test");
      }
      const num = readNumberLiteral(clause.condition.right);
      if (num === undefined) {
        fail("GL130", clause, "switch case must be a numeric literal");
      }
      cases.push([num, this.lowerBlock(clause.body, ctx)]);
    }
    return { stmt: { k: "switch", selector, cases, default: dflt }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // Expression lowering
  // -------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // Native-operator forms — the inverse of emit-lua's nativeOpInfo/
  // emitNativeOp. Deliberately narrower than @gltfi/parse-ts's identical-
  // purpose tryLowerNativeOp: this backend's emitter never natively
  // substitutes int arithmetic/comparisons or division (see emit-lua's
  // nativeOpInfo doc comment), so there is no `(...) | 0`/`Math.imul`-style
  // int-wrap unwrapping to do here, and every comparison/eq this dispatch
  // reaches is unambiguously float-or-bool typed.
  // ---------------------------------------------------------------------

  private tryLowerNativeOp(expr: Expression, ctx: Ctx): IRExpr | undefined {
    if (expr.type === "UnaryExpression") {
      if (expr.operator === "-") {
        // A bare negative NUMERIC LITERAL is caught earlier by
        // readNumberLiteral (lowerExpr's very first check) — reaching here
        // means the operand isn't a literal, so this is always float neg.
        const a = this.lowerExpr(expr.argument, "float", ctx);
        const overload = resolveOverload("math/neg", { a: "float" });
        if (!overload) fail("GL161", expr, "could not resolve native float neg overload");
        return { k: "op", op: "math/neg", overload, args: [a] };
      }
      if (expr.operator === "not") {
        const a = this.lowerExpr(expr.argument, "bool", ctx);
        const overload = resolveOverload("math/not", { a: "bool" });
        if (!overload) fail("GL161", expr, "could not resolve native bool not overload");
        return { k: "op", op: "math/not", overload, args: [a] };
      }
      return undefined;
    }
    if (expr.type === "LogicalExpression") {
      if (expr.operator === "and") return this.buildBinaryOp("math/and", "bool", expr.left, expr.right, ctx);
      if (expr.operator === "or") return this.buildBinaryOp("math/or", "bool", expr.left, expr.right, ctx);
      return undefined;
    }
    if (expr.type !== "BinaryExpression") {
      return undefined;
    }
    const { left, right, operator } = expr;
    if (operator === "+") return this.buildBinaryOp("math/add", "float", left, right, ctx);
    if (operator === "-") return this.buildBinaryOp("math/sub", "float", left, right, ctx);
    if (operator === "*") return this.buildBinaryOp("math/mul", "float", left, right, ctx);
    if (operator === "~=") return this.buildBinaryOp("math/xor", "bool", left, right, ctx);
    if (operator === "==") return this.buildBinaryOp("math/eq", this.inferScalarKind(left, right, ctx, ["bool", "float"]), left, right, ctx);
    if (operator === "<") return this.buildBinaryOp("math/lt", "float", left, right, ctx);
    if (operator === "<=") return this.buildBinaryOp("math/le", "float", left, right, ctx);
    if (operator === ">") return this.buildBinaryOp("math/gt", "float", left, right, ctx);
    if (operator === ">=") return this.buildBinaryOp("math/ge", "float", left, right, ctx);
    return undefined;
  }

  private buildBinaryOp(op: string, kind: IRType, leftNode: Expression, rightNode: Expression, ctx: Ctx): IRExpr {
    const a = this.lowerExpr(leftNode, kind, ctx);
    const b = this.lowerExpr(rightNode, kind, ctx);
    const overload = resolveOverload(op, { a: kind, b: kind } as Record<string, TypeSig>);
    if (!overload) {
      fail("GL161", leftNode, `could not resolve native overload for "${op}" with operand type "${kind}"`);
    }
    return { k: "op", op, overload, args: [a, b] };
  }

  // Bottom-up peek at whichever operand isn't literal-ish (mirrors
  // disambiguateOverload's identical strategy) to pick which of `allowed`'s
  // concrete types this native `==` was over (math/eq is the only native op
  // this backend ever renders for BOTH float and bool — see nativeOpInfo);
  // falls back to "float".
  private inferScalarKind(a: Expression, b: Expression, ctx: Ctx, allowed: IRType[]): IRType {
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

  private lowerExpr(expr: Expression, expected: IRType | undefined, ctx: Ctx): IRExpr {
    // Literals.
    const num = readNumberLiteral(expr);
    if (num !== undefined) {
      const t = expected ?? "float";
      return { k: "const", type: t, data: [t === "int" ? Math.trunc(num) : num] };
    }
    if (expr.type === "BooleanLiteral") {
      return { k: "const", type: "bool", data: [expr.value] };
    }
    if (expr.type === "StringLiteral") {
      return { k: "const", type: "ref", data: [decodeLuaStringLiteral(expr.raw)] };
    }
    if (expr.type === "TableConstructorExpression") {
      const values = tableArrayValues(expr) ?? fail("GL140", expr, "array literal must be a plain table (no named keys)");
      const nums = values.map((e) => readNumberLiteral(e) ?? fail("GL140", e, "array literal element must be a numeric literal"));
      const type = expected ?? lengthToType(nums.length, F_FAMILY) ?? fail("GL140", expr, `cannot infer type for a ${nums.length}-element array literal`);
      return { k: "const", type, data: nums };
    }

    // rt.getVar
    const getVar = asCallExpr(expr, "rt", "getVar");
    if (getVar) {
      const varId = readNumberLiteral(getVar.arguments[0]) ?? fail("GL141", expr, "rt.getVar's argument must be a numeric literal");
      return { k: "varGet", varId };
    }
    // Object form: `V.<name>.get()` — see matchAccessorCall's doc comment.
    const getAccessor = this.matchAccessorCall(expr, "get");
    if (getAccessor && this.varIndexByProp.has(getAccessor.key)) {
      return { k: "varGet", varId: this.varIndexByProp.get(getAccessor.key)! };
    }
    // `(slot.remaining or N)` — Lua idiom for TS's `slot.remaining ?? N`
    // (see emit-ts's emitStateRead waitAll case's own doc comment on why
    // this substitution is safe: the LHS is never boolean `false`, only a
    // number or `nil`). Checked BEFORE tryLowerNativeOp below, since a bare
    // `or` LogicalExpression is otherwise indistinguishable from a genuine
    // native bool-or — this idiom's very specific left-hand shape (a state-
    // slot's own `.remaining` field) never collides with an actual bool/bool
    // `math/or` operand. No parens node exists in Lua's AST (see this
    // file's header note), so this is just a bare LogicalExpression here.
    if (expr.type === "LogicalExpression" && expr.operator === "or" && expr.left.type === "MemberExpression" && expr.left.indexer === "." && expr.left.base.type === "Identifier") {
      const slotIdx = this.stateSlotIndexByName.get(expr.left.base.name);
      if (slotIdx !== undefined && expr.left.identifier.name === "remaining" && this.stateSlots[slotIdx].kind === "waitAll") {
        const inputFlows = readNumberLiteral(expr.right);
        if (inputFlows !== undefined) {
          this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(inputFlows) } };
        }
        return { k: "stateRead", slot: { slot: slotIdx }, field: "remainingInputs", type: "int" };
      }
    }
    // Native-operator forms (`a + b`, `a == b`, `a < b`, `a and b`, `not a`,
    // ...) — see emit-lua's nativeOpInfo for exactly which op/type
    // combinations these can come from.
    const native = this.tryLowerNativeOp(expr, ctx);
    if (native) {
      return native;
    }
    // rt.random
    if (asCallExpr(expr, "rt", "random")) {
      const overload = resolveOverload("math/random", {})!;
      return { k: "op", op: "math/random", overload, args: [] };
    }
    // rt.tickTime / rt.tickDelta (always cross-handler per emit.ts's paramAccess split)
    if (asCallExpr(expr, "rt", "tickTime")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceStart" }, args: [], type: "float" };
    }
    if (asCallExpr(expr, "rt", "tickDelta")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceLastTick" }, args: [], type: "float" };
    }

    // rt.ptrGet(...).value / .isValid
    if (expr.type === "MemberExpression" && expr.indexer === ".") {
      const ptrGet = asCallExpr(expr.base, "rt", "ptrGet");
      if (ptrGet) {
        return this.lowerPtrGet(ptrGet, expr.identifier.name === "isValid");
      }
    }
    // rt.eventPayload(i)[k] (1-based Lua index -> 0-based field index)
    if (expr.type === "IndexExpression") {
      const payloadCall = asCallExpr(expr.base, "rt", "eventPayload");
      if (payloadCall) {
        const eventIndex = this.readEventIndex(payloadCall.arguments[0]) ?? 0;
        const fieldIdx = (readNumberLiteral(expr.index) ?? 1) - 1;
        const field = PAYLOAD_FIELDS[fieldIdx] ?? "boolParameter";
        return { k: "intrinsic", op: "event/receive#payload", config: { eventIndex, field }, args: [], type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
      }
    }
    // Multi-output `m.<fn>(...)` reads: `.value`/`.isValid` (normalize,
    // inverse), named outputs, or 1-based-indexed outputs ("0".."N-1" in the
    // IR, `[k+1]` in emitted Lua — see emit.ts's emitOp).
    if (expr.type === "MemberExpression" && expr.indexer === "." && expr.base.type === "CallExpression") {
      const c = calleeOf(expr.base);
      if (c && c.base === "m") {
        return this.lowerMCall(expr.base, c.name, expected, ctx, expr.identifier.name);
      }
    }
    if (expr.type === "IndexExpression" && expr.base.type === "CallExpression") {
      const c = calleeOf(expr.base);
      if (c && c.base === "m") {
        const idx1 = readNumberLiteral(expr.index);
        if (idx1 === undefined) {
          fail("GL143", expr, "expected a numeric literal index into a multi-output m.* call");
        }
        return this.lowerMCall(expr.base, c.name, expected, ctx, String(idx1 - 1));
      }
    }
    // rt.eventOutRead(node, socket) — best-effort GL180 fallback (not
    // exercised by the conformance corpus; see parse-ts's GI180 analog).
    const eventOutRead = asCallExpr(expr, "rt", "eventOutRead");
    if (eventOutRead) {
      const [nodeExpr, socketExpr] = eventOutRead.arguments;
      const sourceNode = readNumberLiteral(nodeExpr) ?? 0;
      const socket = stringLiteralValue(socketExpr) ?? "";
      this.diagnostics.push({ severity: "info", code: "GL180", message: `best-effort reconstruction of cross-handler read rt.eventOutRead(${sourceNode}, "${socket}")` });
      return { k: "intrinsic", op: "event/unknown", config: { crossContext: true, socket, sourceNode }, args: [], type: expected ?? "ref" };
    }

    // m.switchCase(...)
    const switchCase = asCallExpr(expr, "m", "switchCase");
    if (switchCase) {
      return this.lowerMathSwitch(switchCase, expected, ctx);
    }
    // m.<fn>(...)
    if (expr.type === "CallExpression") {
      const c = calleeOf(expr);
      if (c && c.base === "m") {
        return this.lowerMCall(expr, c.name, expected, ctx);
      }
    }

    if (expr.type === "Identifier") {
      const text = expr.name;
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
      fail("GL150", expr, `unresolved identifier "${text}"`);
    }

    if (expr.type === "IndexExpression" && expr.base.type === "Identifier" && expr.base.name === "payload") {
      if (ctx.kind === "handler" && ctx.handlerKind === "receive") {
        const fieldIdx = (readNumberLiteral(expr.index) ?? 1) - 1;
        const field = PAYLOAD_FIELDS[fieldIdx] ?? "boolParameter";
        return { k: "param", name: field, type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
      }
    }

    if (expr.type === "MemberExpression" && expr.indexer === "." && expr.base.type === "Identifier") {
      const slotIdx = this.stateSlotIndexByName.get(expr.base.name);
      if (slotIdx !== undefined) {
        return this.lowerStateFieldRead(slotIdx, expr.identifier.name);
      }
    }

    fail("GL140", expr, `unrecognized expression shape (kind ${expr.type})`);
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
    fail("GL140", undefined, `unrecognized state-slot field read "${field}" on slot kind "${kind}"`);
  }

  private lowerPtrGet(call: CallExpression, wantIsValid: boolean): IRExpr {
    const argNodes = call.arguments;
    // Args-less form (see emit-lua's pointerCall doc comment): every
    // template param was a compile-time constant, already inlined into the
    // path string, so the whole args table is omitted and `type` shifts
    // into position 1 — disambiguated the same way engine.lua's rt.ptrGet
    // does: position 1 is either the args table or, when it's a string, IS
    // the type signature.
    const hasArgsObj = argNodes.length >= 2 && argNodes[1].type === "TableConstructorExpression";
    const pointerExpr = argNodes[0];
    const argsObjExpr = hasArgsObj ? argNodes[1] : undefined;
    const typeExpr = hasArgsObj ? argNodes[2] : argNodes[1];
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GL141", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const valueType = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GL141", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, { kind: "proc" });
    return { k: "ptrGet", template, args, type: wantIsValid ? "bool" : valueType, valueType, wantIsValid };
  }

  private lowerMathSwitch(call: CallExpression, expected: IRType | undefined, ctx: Ctx): IRExpr {
    const [selectionExpr, casesExpr, valuesExpr, defaultExpr] = call.arguments;
    const caseNodes = tableArrayValues(casesExpr);
    const valueNodes = tableArrayValues(valuesExpr);
    if (!caseNodes || !valueNodes) {
      fail("GL142", call, "m.switchCase's cases/values arguments must be plain table literals");
    }
    const cases = caseNodes.map((e) => readNumberLiteral(e) ?? fail("GL142", e, "switch case must be a numeric literal"));
    // Determine the shared value type: prefer a non-literal sibling (default
    // or any case value), else fall back to the caller's expected type, else
    // "float" — mirrors parse-ts's general generic-resolution strategy.
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

  private lowerMCall(call: CallExpression, fnName: string, expected: IRType | undefined, ctx: Ctx, socket?: string): IRExpr {
    const argNodes = call.arguments;
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
      fail("GL143", call, `unknown m.${fnName}(...) call`);
    }
    const op = candidates[0].op;
    const spec = getOpSpec(op);
    if (!spec) {
      fail("GL143", call, `op "${op}" not found in registry`);
    }
    const overloadIndex = candidates.length === 1 ? candidates[0].overloadIndex : this.disambiguateOverload(candidates, spec, argNodes, expected, ctx);
    const row = spec.overloads[overloadIndex];
    if (row.inputs.length !== argNodes.length) {
      fail("GL143", call, `m.${fnName} arg count ${argNodes.length} != expected ${row.inputs.length}`);
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
          const arrLen = node.type === "TableConstructorExpression" ? (tableArrayValues(node)?.length ?? 0) : readNumberLiteral(node) !== undefined ? 1 : undefined;
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
      fail("GL143", call, `could not resolve overload for op "${op}" with inputs ${JSON.stringify(inputTypesByName)}`);
    }
    const resultSocket = socket && socket !== "value" ? socket : undefined;
    if (resultSocket !== undefined && !(resultSocket in overload.outputs)) {
      fail("GL143", call, `op "${op}" has no output socket "${resultSocket}"`);
    }
    return { k: "op", op, overload, args: argExprs, socket: resultSocket };
  }

  // Picks which of several same-named candidate rows (see @gltfi/kernel's
  // fn-naming's lookupMFunctions doc comment) matches the actual call site —
  // identical strategy to parse-ts's own disambiguateOverload.
  private disambiguateOverload(candidates: FnCandidate[], spec: OpSpec, argNodes: Expression[], expected: IRType | undefined, ctx: Ctx): number {
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
  // Bottom-up type inference (for `local` temps and generic-op pinning).
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

// Reverse of emit.ts's async-call dispatch (`rt.setDelay`/`rt.varInterp`/
// `rt.ptrInterp`/`rt.animStart`/`rt.animStop`/`rt.animStopAt`).
function matchAsyncCall(expr: Expression): { fn: string; call: CallExpression } | undefined {
  for (const fn of ["setDelay", "varInterp", "ptrInterp", "animStart", "animStop", "animStopAt"]) {
    const c = asCallExpr(expr, "rt", fn);
    if (c) return { fn, call: c };
  }
  return undefined;
}
