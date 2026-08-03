// TypeScript -> IR parser (packages/parse-ts). See docs/design/ir-and-
// transpiler.md's "GIscript subset" section: this module parses exactly the
// shapes @gltfi/emit-ts's emit.ts produces (see that file's header comment
// for the generated module shape) — it is a mechanical INVERSE of emit.ts,
// case for case. It does not attempt to accept arbitrary hand-written
// TypeScript beyond the emitted subset plus obvious whitespace/naming
// variations (ts-morph parses real ASTs, so those come for free).
//
// Pipeline: (1) ts-morph in-memory project + a hand-written ambient .d.ts
// for @gltfi/runtime-lib's rt/m surface (runtime-lib-dts.ts) — a real
// TypeScript diagnostic here is a parse failure (GI0xx); (2) structural
// "registration" pass over the createEngine(rt => {...}) body's top-level
// statements (vars/events/state-slots/procs/handlers), each un-recognized
// shape raising a GI1xx diagnostic; (3) recursive statement/expression
// lowering back to @gltfi/ir's IRModule shape, threading an "expected type"
// top-down (mirroring @gltfi/ir/import.ts's own top-down socket-type
// threading) since emitted literals carry no explicit type tag of their own
// (see model.ts's IRExpr "const" — the emitter never annotates types, see
// emit.ts's header note "every value is a plain inferred JS expression").
//
// Flattening simplification (deliberate, not a bug): several IRStmt kinds
// have an "unconditional" continuation that emit.ts inlines as a bare
// following sibling statement rather than a nested field (flow/cancelDelay's
// `outs.out`, while/for's `completed`) — see each op's emit.ts case. Since a
// flattened sibling and a nested-but-unconditional field execute identically
// (both mean "next thing happens right after"), this parser reconstructs
// those as plain seq siblings instead of round-tripping the exact original
// nesting. This is sound for re-export (the flow graph shape is the same)
// even though it isn't a byte-identical inverse of one specific import.ts
// output — see docs/design/ir-and-transpiler.md's "Equivalence" section:
// structural equivalence is a triage signal, execution equivalence is the
// gate, and this simplification never changes execution.
import { Node, Project, ScriptTarget, SyntaxKind, ts, type Expression, type Statement, type VariableDeclaration } from "ts-morph";
import {
  defaultValue,
  getOpSpec,
  isGenericSig,
  lookupMFunctions,
  resolveOverload,
  type FnCandidate,
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
import { RUNTIME_LIB_DTS } from "./runtime-lib-dts.js";

export type ParseResult = { module: IRModule; diagnostics: Diagnostic[] };

class ParseError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function fail(code: string, node: Node | undefined, message: string): never {
  const where = node ? ` at ${node.getSourceFile().getFilePath()}:${node.getStartLineNumber()}: \`${node.getText().slice(0, 120)}\`` : "";
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

export function parseModule(code: string): ParseResult {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      strict: true,
      target: ScriptTarget.ES2022,
      skipLibCheck: true,
      esModuleInterop: true
    }
  });
  project.createSourceFile("runtime-lib.d.ts", RUNTIME_LIB_DTS);
  const sf = project.createSourceFile("module.ts", code, { overwrite: true });

  const diagnostics: Diagnostic[] = [];
  for (const d of sf.getPreEmitDiagnostics()) {
    if (d.getCategory() !== ts.DiagnosticCategory.Error) {
      continue;
    }
    const msg = d.getMessageText();
    const text = typeof msg === "string" ? msg : msg.getMessageText();
    const start = d.getStart();
    const line = start !== undefined ? sf.getLineAndColumnAtPos(start).line : undefined;
    diagnostics.push({ severity: "error", code: "GI001", message: `TypeScript diagnostic${line ? ` (line ${line})` : ""}: ${text}` });
  }
  if (diagnostics.some((d) => d.severity === "error")) {
    return { module: emptyModule(), diagnostics };
  }

  try {
    const parser = new ModuleParser();
    const module = parser.run(sf.getStatements());
    return { module, diagnostics: [...diagnostics, ...parser.diagnostics] };
  } catch (err) {
    if (err instanceof ParseError) {
      diagnostics.push({ severity: "error", code: err.code, message: err.message });
      return { module: emptyModule(), diagnostics };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Small AST helpers.
// ---------------------------------------------------------------------------

function calleeOf(expr: Node): { base: string; name: string } | undefined {
  if (!Node.isCallExpression(expr)) {
    return undefined;
  }
  const callee = expr.getExpression();
  if (!Node.isPropertyAccessExpression(callee)) {
    return undefined;
  }
  const baseExpr = callee.getExpression();
  if (!Node.isIdentifier(baseExpr)) {
    return undefined;
  }
  return { base: baseExpr.getText(), name: callee.getName() };
}

function asCall(expr: Node | undefined, base: string, name: string): import("ts-morph").CallExpression | undefined {
  if (!expr || !Node.isCallExpression(expr)) {
    return undefined;
  }
  const c = calleeOf(expr);
  return c && c.base === base && c.name === name ? expr : undefined;
}

function stringLiteralValue(node: Node | undefined): string | undefined {
  if (node && Node.isStringLiteral(node)) {
    return node.getLiteralValue();
  }
  return undefined;
}

function readNumber(node: Node): number | undefined {
  if (Node.isNumericLiteral(node)) {
    return node.getLiteralValue();
  }
  if (Node.isPrefixUnaryExpression(node) && node.getOperatorToken() === SyntaxKind.MinusToken) {
    const v = readNumber(node.getOperand());
    return v === undefined ? undefined : -v;
  }
  if (Node.isIdentifier(node)) {
    if (node.getText() === "NaN") {
      return NaN;
    }
    if (node.getText() === "Infinity") {
      return Infinity;
    }
  }
  return undefined;
}

function readBool(node: Node): boolean | undefined {
  const k = node.getKind();
  if (k === SyntaxKind.TrueKeyword) {
    return true;
  }
  if (k === SyntaxKind.FalseKeyword) {
    return false;
  }
  return undefined;
}

function isUndefinedKeyword(node: Node | undefined): boolean {
  return !!node && Node.isIdentifier(node) && node.getText() === "undefined";
}

function singleDeclarator(stmt: Statement): VariableDeclaration | undefined {
  if (!Node.isVariableStatement(stmt)) {
    return undefined;
  }
  const decls = stmt.getDeclarationList().getDeclarations();
  return decls.length === 1 ? decls[0] : undefined;
}

// Pointer-arg object literal properties are emitted with JSON.stringify'd
// (i.e. quoted) keys (see emit.ts's pointerCall: `${JSON.stringify(p.name)}:
// ...`), unlike rt.vars/rt.events entries which use bare identifier keys —
// ObjectLiteralExpression.getProperty(name) only matches bare-identifier
// property names, so quoted keys need their own lookup.
function getObjProp(obj: import("ts-morph").ObjectLiteralExpression, name: string): Node | undefined {
  for (const prop of obj.getProperties()) {
    if (Node.isPropertyAssignment(prop) && (prop.getName() === name || prop.getName() === JSON.stringify(name))) {
      return prop.getInitializer();
    }
  }
  return undefined;
}

// A CaseClause's `case N: { ...; break; }` is syntactically indistinguishable
// from a case clause whose statement LIST happens to contain exactly one
// (unrelated) block statement — emit.ts always emits the former shape (see
// its "switch"/multiGate-switch cases: the opening `{`/closing `}` are part
// of the case body's own emission, i.e. a genuine nested BlockStatement), so
// `clause.getStatements()` here is always `[Block]`, not the block's own
// contents. Unwrap it, then drop the trailing `break;`.
function caseBody(clause: import("ts-morph").CaseClause | import("ts-morph").DefaultClause): Statement[] {
  const stmts = clause.getStatements();
  const inner = stmts.length === 1 && Node.isBlock(stmts[0]) ? stmts[0].getStatements() : stmts;
  return inner.filter((s) => !Node.isBreakStatement(s));
}

function blockStmts(node: Node | undefined): Statement[] {
  if (!node) {
    return [];
  }
  if (Node.isBlock(node)) {
    return node.getStatements();
  }
  return [node as Statement];
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

// Length -> concrete type within a family, preferring the vector reading
// over the (F-family-only) matrix reading of a length-4/9/16 literal when
// both are legal — see this file's header + @gltfi/kernel's fn-naming.ts header note. Never
// actually exercised ambiguously by the conformance corpus (verified during
// development: every generic-op literal argument in the corpus is length-1/
// 2/3 or co-occurs with a definitely-typed sibling), so this is a documented
// best-effort fallback, not a load-bearing heuristic.
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
// Handler param tables (mirror @gltfi/ir/import.ts's discoverHandlers, which
// derives these from the op registry's event/* output sockets).
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
  private tempTypeByDecl = new Map<Node, IRType>();

  run(topStmts: Statement[]): IRModule {
    const engineBody = this.findEngineBody(topStmts);
    const stmts = engineBody.getStatements();
    let i = 0;

    if (stmts.length === 0 || !asCall(this.exprOf(stmts[i]), "rt", "vars")) {
      fail("GI101", stmts[i], "expected rt.vars([...]) as the first statement");
    }
    this.parseVars(asCall(this.exprOf(stmts[i]), "rt", "vars")!);
    i += 1;

    if (i >= stmts.length || !asCall(this.exprOf(stmts[i]), "rt", "events")) {
      fail("GI101", stmts[i], "expected rt.events([...]) as the second statement");
    }
    this.parseEvents(asCall(this.exprOf(stmts[i]), "rt", "events")!);
    i += 1;

    // State slots: a run of `let X = N;` / `const X = {...};` declarations
    // matching one of the six known shapes.
    while (i < stmts.length && this.tryRegisterStateSlot(stmts[i])) {
      i += 1;
    }

    // Procs: a run of `function procN() {...}` declarations.
    const procBodies: Statement[][] = [];
    while (i < stmts.length && Node.isFunctionDeclaration(stmts[i])) {
      const fn = stmts[i] as import("ts-morph").FunctionDeclaration;
      const name = fn.getName() ?? fail("GI103", fn, "anonymous proc function declaration");
      const id = this.procs.length;
      this.procIndexByName.set(name, id);
      this.procs.push({ id, name, body: { k: "seq", stmts: [] } });
      const body = fn.getBody();
      procBodies.push(body && Node.isBlock(body) ? body.getStatements() : []);
      i += 1;
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
        const fn = onStart.getArguments()[0];
        handlerDescs.push({ kind: "onStart", bodyStmts: this.arrowBody(fn) });
      } else if (onTick) {
        const fn = onTick.getArguments()[0];
        handlerDescs.push({ kind: "onTick", bodyStmts: this.arrowBody(fn) });
      } else if (onReceive) {
        const args = onReceive.getArguments();
        const idx = readNumber(args[0]);
        if (idx === undefined) {
          fail("GI104", args[0], "rt.onReceive's first argument must be a numeric event index literal");
        }
        handlerDescs.push({ kind: "receive", eventRef: idx, bodyStmts: this.arrowBody(args[1]) });
      } else {
        fail("GI104", stmts[i], "expected a handler registration (rt.onStart/rt.onTick/rt.onReceive) or unrecognized top-level statement");
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

  private exprOf(stmt: Statement): Expression | undefined {
    return Node.isExpressionStatement(stmt) ? stmt.getExpression() : undefined;
  }

  private arrowBody(fn: Node | undefined): Statement[] {
    if (!fn || !Node.isArrowFunction(fn)) {
      fail("GI104", fn, "expected an arrow function handler body");
    }
    const body = fn.getBody();
    return Node.isBlock(body) ? body.getStatements() : [];
  }

  private findEngineBody(topStmts: Statement[]): import("ts-morph").Block {
    const exportStmt = topStmts.find((s) => Node.isExportAssignment(s)) as import("ts-morph").ExportAssignment | undefined;
    if (!exportStmt || exportStmt.isExportEquals()) {
      fail("GI100", exportStmt, "expected exactly one `export default createEngine((rt) => {...})`");
    }
    const call = exportStmt.getExpression();
    const createEngineCall = Node.isCallExpression(call) && Node.isIdentifier(call.getExpression()) && call.getExpression().getText() === "createEngine" ? call : undefined;
    if (!createEngineCall) {
      fail("GI100", call, "export default's expression must be a createEngine(...) call");
    }
    const arrow = createEngineCall.getArguments()[0];
    if (!arrow || !Node.isArrowFunction(arrow)) {
      fail("GI100", arrow, "createEngine's argument must be an arrow function (rt) => {...}");
    }
    const body = arrow.getBody();
    if (!Node.isBlock(body)) {
      fail("GI100", body, "createEngine's setup function must have a block body");
    }
    return body;
  }

  // -------------------------------------------------------------------
  // vars / events / state slots
  // -------------------------------------------------------------------

  private parseVars(call: import("ts-morph").CallExpression) {
    const arr = call.getArguments()[0];
    if (!arr || !Node.isArrayLiteralExpression(arr)) {
      fail("GI101", arr, "rt.vars expects an array literal argument");
    }
    arr.getElements().forEach((el, idx) => {
      if (!Node.isObjectLiteralExpression(el)) {
        fail("GI101", el, "rt.vars element must be an object literal");
      }
      const typeProp = el.getProperty("type");
      const initProp = el.getProperty("initial");
      const type = Node.isPropertyAssignment(typeProp) ? stringLiteralValue(typeProp.getInitializer()) : undefined;
      if (!type) {
        fail("GI101", el, "rt.vars element missing string `type`");
      }
      const initExpr = Node.isPropertyAssignment(initProp) ? initProp.getInitializer() : undefined;
      const initial = initExpr ? this.lowerExpr(initExpr, type as IRType, { kind: "proc" }) : { k: "const" as const, type: type as IRType, data: defaultValue(type as IRType).data };
      if (initial.k !== "const") {
        fail("GI101", initExpr, "rt.vars initial value must be a literal");
      }
      this.variables.push({ name: `var${idx}`, type: type as IRType, initial: { type: type as IRType, data: initial.data as never } });
    });
  }

  private parseEvents(call: import("ts-morph").CallExpression) {
    const arr = call.getArguments()[0];
    if (!arr || !Node.isArrayLiteralExpression(arr)) {
      fail("GI102", arr, "rt.events expects an array literal argument");
    }
    arr.getElements().forEach((el, idx) => {
      if (!Node.isObjectLiteralExpression(el)) {
        fail("GI102", el, "rt.events element must be an object literal");
      }
      const get = (name: string) => {
        const p = el.getProperty(name);
        return Node.isPropertyAssignment(p) ? p.getInitializer() : undefined;
      };
      const externalId = stringLiteralValue(get("externalId"));
      const values: IREventValue[] = [];
      const boolExpr = get("defaultBool");
      if (boolExpr) {
        values.push({ name: "boolParameter", type: "bool", default: { type: "bool", data: [readBool(boolExpr) ?? false] } });
      }
      const intExpr = get("defaultInt");
      if (intExpr) {
        values.push({ name: "intParameter", type: "int", default: { type: "int", data: [readNumber(intExpr) ?? 0] } });
      }
      const floatExpr = get("defaultFloat");
      if (floatExpr) {
        values.push({ name: "floatParameter", type: "float", default: { type: "float", data: [readNumber(floatExpr) ?? 0] } });
      }
      const durExpr = get("expectedDuration");
      if (durExpr) {
        values.push({ name: "expectedDuration", type: "float", default: { type: "float", data: [readNumber(durExpr) ?? 0] } });
      }
      this.events.push({ name: `event${idx}`, id: externalId, values });
    });
  }

  // Returns true and registers a state slot iff `stmt` matches one of the
  // six shapes emit.ts's emitStateSlots produces.
  private tryRegisterStateSlot(stmt: Statement): boolean {
    const decl = singleDeclarator(stmt);
    if (!decl) {
      return false;
    }
    const name = decl.getName();
    const init = decl.getInitializer();
    if (!init) {
      return false;
    }
    if (Node.isVariableStatement(stmt) && stmt.getDeclarationKind() === "let" && (Node.isNumericLiteral(init) || (Node.isPrefixUnaryExpression(init) && Node.isNumericLiteral(init.getOperand())))) {
      const initial = readNumber(init) ?? 0;
      const idx = this.stateSlots.length;
      this.stateSlots.push({ name, kind: "for", config: { initialIndex: Math.trunc(initial) } });
      this.stateSlotIndexByName.set(name, idx);
      return true;
    }
    if (!Node.isObjectLiteralExpression(init)) {
      return false;
    }
    const keys = new Set(init.getProperties().map((p) => (Node.isPropertyAssignment(p) ? p.getName() : "")));
    let kind: StateKind | undefined;
    if (keys.has("lastId") && keys.has("lastRef") && keys.has("ids")) kind = "delay";
    else if (keys.has("count") && keys.size === 1) kind = "doN";
    else if (keys.has("lastIndex") && keys.has("used")) kind = "multiGate";
    else if (keys.has("activated") && keys.has("remaining")) kind = "waitAll";
    else if (keys.has("lastTime") && keys.has("remaining")) kind = "throttle";
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

  // Like lowerBlock, but returns undefined for an empty result — for
  // OPTIONAL branch fields (setPointer/async's out/err, stateful's outs
  // entries) where @gltfi/ir/import.ts's own convention is `flows.X ?
  // continueTo(flows.X) : undefined` (see e.g. raiseAsync), never an empty
  // seq: emit.ts unconditionally emits `if (ok) { <out-or-nothing> } else {
  // <err-or-nothing> }` whenever EITHER out or err exists (see emitAsync),
  // so a genuinely-absent branch (the common case — e.g. an "always fails"
  // setDelay duration test that only wires `err`) shows up in source as an
  // empty `{}` block textually indistinguishable from "a wired edge whose
  // target happens to produce no statements". The latter essentially never
  // happens in practice (every raised node produces something), so treating
  // an empty block as "absent" matches import.ts's own modeling — and it's
  // required for exact structural round-trip fidelity (verified against a
  // real corpus asset: flow/setDelay_and_cancelDelay's duration=-1 err-only
  // case), even though it makes no execution difference either way (an
  // empty seq and undefined both wire zero flow edges — see
  // @gltfi/ir/export.ts's buildAsync/buildStateful, which treat them
  // identically).
  private lowerOptionalBlock(stmts: Statement[], ctx: Ctx): IRStmt | undefined {
    const result = this.lowerBlock(stmts, ctx);
    return result.k === "seq" && result.stmts.length === 0 ? undefined : result;
  }

  private parseOne(stmts: Statement[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const stmt = stmts[i];

    // --- setPointer: `{ const ok = rt.ptrSet(...); if (ok) {...} else {...} }`
    if (Node.isBlock(stmt)) {
      const inner = stmt.getStatements();
      const decl0 = inner[0] ? singleDeclarator(inner[0]) : undefined;
      const ptrSetCall = decl0?.getInitializer() ? asCall(decl0.getInitializer(), "rt", "ptrSet") : undefined;
      if (decl0 && ptrSetCall) {
        return { stmt: this.parseSetPointer(decl0, ptrSetCall, inner, ctx), consumed: 1 };
      }
      fail("GI121", stmt, "unrecognized bare block (expected a pointer/set wrapper)");
    }

    // --- async: optional `function __contN(){...}` then `const R = rt.<asyncFn>(...)`
    if (Node.isFunctionDeclaration(stmt)) {
      const next = stmts[i + 1];
      const nextDecl = next ? singleDeclarator(next) : undefined;
      const asyncCall = nextDecl?.getInitializer() ? this.matchAsyncCall(nextDecl.getInitializer()!) : undefined;
      if (nextDecl && asyncCall) {
        return this.parseAsync(stmts, i, stmt, nextDecl, asyncCall, ctx);
      }
      fail("GI122", stmt, "unrecognized function declaration (expected an async done-continuation)");
    }

    const decl = singleDeclarator(stmt);
    if (decl && decl.getInitializer()) {
      const init = decl.getInitializer()!;
      const asyncCall = this.matchAsyncCall(init);
      if (asyncCall) {
        return this.parseAsync(stmts, i, undefined, decl, asyncCall, ctx);
      }
      const doN = asCall(init, "rt", "doN");
      if (doN) return this.parseDoN(stmts, i, decl, doN, ctx);
      const multiGate = asCall(init, "rt", "multiGate");
      if (multiGate) return this.parseMultiGate(stmts, i, decl, multiGate, ctx);
      const waitAll = asCall(init, "rt", "waitAll");
      if (waitAll) return this.parseWaitAll(stmts, i, decl, waitAll, ctx);
      const throttle = asCall(init, "rt", "throttle");
      if (throttle) return this.parseThrottle(stmts, i, decl, throttle, ctx);

      // plain `let` temp.
      const expr = this.lowerExpr(init, undefined, ctx);
      const type = this.typeOfExpr(expr);
      this.tempTypeByDecl.set(decl, type);
      this.tempTypeById.set(decl.getName(), type);
      return { stmt: { k: "let", temp: decl.getName(), type, expr }, consumed: 1 };
    }

    if (Node.isExpressionStatement(stmt)) {
      const expr = stmt.getExpression();

      const cancelSlot = asCall(expr, "rt", "cancelDelaySlot");
      if (cancelSlot) {
        const slot = this.slotRefOf(cancelSlot.getArguments()[0]);
        return { stmt: { k: "intrinsic", op: "flow/setDelay#cancel", config: { slot: slot.slot }, args: [], outs: {} }, consumed: 1 };
      }
      const cancelDelay = asCall(expr, "rt", "cancelDelay");
      if (cancelDelay) {
        const refExpr = this.lowerExpr(cancelDelay.getArguments()[0], "ref", ctx);
        return { stmt: { k: "intrinsic", op: "flow/cancelDelay", config: {}, args: [refExpr], outs: {} }, consumed: 1 };
      }
      const eventOut = asCall(expr, "rt", "eventOut");
      if (eventOut) {
        // Not part of the IR model (pure emit-time bookkeeping — see
        // model.ts/emit.ts's crossHandlerReads note); safe to drop.
        return { stmt: null, consumed: 1 };
      }

      const setVar = asCall(expr, "rt", "setVar");
      if (setVar) {
        const [idxExpr, valExpr] = setVar.getArguments();
        const varId = readNumber(idxExpr);
        if (varId === undefined) fail("GI123", idxExpr, "rt.setVar's first argument must be a numeric literal");
        const varType = this.variables[varId]?.type ?? fail("GI123", idxExpr, `rt.setVar references out-of-range var ${varId}`);
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(valExpr, varType, ctx) }, consumed: 1 };
      }
      const send = asCall(expr, "rt", "send");
      if (send) {
        const [idxExpr, , payloadExpr] = send.getArguments();
        const eventId = readNumber(idxExpr);
        if (eventId === undefined) fail("GI124", idxExpr, "rt.send's first argument must be a numeric literal");
        if (!payloadExpr || !Node.isArrayLiteralExpression(payloadExpr) || payloadExpr.getElements().length !== 4) {
          fail("GI124", payloadExpr, "rt.send's payload argument must be a 4-element array literal");
        }
        const elems = payloadExpr.getElements();
        const types: IRType[] = ["bool", "int", "float", "float"];
        const args = elems.map((e, k) => this.lowerExpr(e, types[k], ctx));
        return { stmt: { k: "emitEvent", eventId, args }, consumed: 1 };
      }
      const stopProp = asCall(expr, "rt", "stopPropagation");
      if (stopProp) {
        const [, stopImmediateExpr] = stopProp.getArguments();
        return { stmt: { k: "stopPropagation", stopImmediate: this.lowerExpr(stopImmediateExpr, "bool", ctx), config: {} }, consumed: 1 };
      }
      const log = asCall(expr, "rt", "log");
      if (log) {
        const [templateExpr, argsExpr] = log.getArguments();
        const template = stringLiteralValue(templateExpr) ?? "";
        const argList = argsExpr && Node.isArrayLiteralExpression(argsExpr) ? argsExpr.getElements() : [];
        const args = argList.map((a) => this.lowerExpr(a, undefined, ctx));
        return { stmt: { k: "log", template, args }, consumed: 1 };
      }
      if (Node.isCallExpression(expr) && Node.isIdentifier(expr.getExpression()) && expr.getArguments().length === 0) {
        const name = expr.getExpression().getText();
        const procId = this.procIndexByName.get(name);
        if (procId !== undefined) {
          return { stmt: { k: "callProc", procId }, consumed: 1 };
        }
      }

      // doN / multiGate / waitAll / throttle reset shapes.
      const resetConsumed = this.tryParseReset(stmts, i);
      if (resetConsumed) {
        return resetConsumed;
      }

      // `X = <startExpr>;` possibly beginning a "for" pattern.
      const forResult = this.tryParseFor(stmts, i, ctx);
      if (forResult) {
        return forResult;
      }
    }

    if (Node.isIfStatement(stmt)) {
      const cond = this.lowerExpr(stmt.getExpression(), "bool", ctx);
      const thenS = this.lowerBlock(blockStmts(stmt.getThenStatement()), ctx);
      const elseNode = stmt.getElseStatement();
      const elseS = elseNode ? this.lowerOptionalBlock(blockStmts(elseNode), ctx) : undefined;
      return { stmt: { k: "if", cond, then: thenS, else: elseS }, consumed: 1 };
    }
    if (Node.isWhileStatement(stmt)) {
      const cond = this.lowerExpr(stmt.getExpression(), "bool", ctx);
      const body = this.lowerBlock(blockStmts(stmt.getStatement()), ctx);
      return { stmt: { k: "while", cond, body }, consumed: 1 };
    }
    if (Node.isSwitchStatement(stmt)) {
      return { stmt: this.parsePlainSwitch(stmt, ctx), consumed: 1 };
    }

    fail("GI110", stmt, `unrecognized statement shape (kind ${stmt.getKindName()})`);
  }

  // -------------------------------------------------------------------
  // setPointer
  // -------------------------------------------------------------------

  private parseSetPointer(decl: VariableDeclaration, call: import("ts-morph").CallExpression, inner: Statement[], ctx: Ctx): IRStmt {
    const [pointerExpr, argsObjExpr, typeExpr, valueExpr] = call.getArguments();
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GI125", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GI125", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, ctx);
    const value = this.lowerExpr(valueExpr, type, ctx);
    const okName = decl.getName();
    let out: IRStmt | undefined;
    let err: IRStmt | undefined;
    const ifStmt = inner[1];
    if (ifStmt) {
      if (!Node.isIfStatement(ifStmt) || !this.isResultVarCondition(ifStmt.getExpression(), okName)) {
        fail("GI125", ifStmt, "expected `if (ok) {...} else {...}` following a pointer/set call");
      }
      out = this.lowerOptionalBlock(blockStmts(ifStmt.getThenStatement()), ctx);
      const elseNode = ifStmt.getElseStatement();
      err = elseNode ? this.lowerOptionalBlock(blockStmts(elseNode), ctx) : undefined;
    }
    return { k: "setPointer", template, args, value, type, out, err };
  }

  private lowerPointerArgs(objExpr: Node | undefined, template: PtrTemplate, ctx: Ctx): IRExpr[] {
    if (!objExpr || !Node.isObjectLiteralExpression(objExpr)) {
      fail("GI125", objExpr, "pointer args must be an object literal");
    }
    return pointerTemplateParams(template).map((p) => {
      const init = getObjProp(objExpr, p.name);
      if (!init) {
        fail("GI125", objExpr, `pointer args object missing param "${p.name}"`);
      }
      return this.lowerExpr(init, p.kind === "int" ? "int" : "ref", ctx);
    });
  }

  // A single Identifier `okName` or PropertyAccessExpression `resVar.field`.
  private isResultVarCondition(expr: Node, name: string): boolean {
    return Node.isIdentifier(expr) && expr.getText() === name;
  }
  private isResultVarField(expr: Node, name: string, field: string): boolean {
    return Node.isPropertyAccessExpression(expr) && Node.isIdentifier(expr.getExpression()) && expr.getExpression().getText() === name && expr.getName() === field;
  }

  // -------------------------------------------------------------------
  // async ops
  // -------------------------------------------------------------------

  private matchAsyncCall(expr: Node): { fn: string; call: import("ts-morph").CallExpression } | undefined {
    for (const fn of ["setDelay", "varInterp", "ptrInterp", "animStart", "animStop", "animStopAt"]) {
      const c = asCall(expr, "rt", fn);
      if (c) return { fn, call: c };
    }
    return undefined;
  }

  private parseAsync(
    stmts: Statement[],
    i: number,
    contFn: import("ts-morph").FunctionDeclaration | undefined,
    decl: VariableDeclaration,
    matched: { fn: string; call: import("ts-morph").CallExpression },
    ctx: Ctx
  ): { stmt: IRStmt; consumed: number } {
    const args = matched.call.getArguments();
    const kindMap: Record<string, IRStmt extends never ? never : "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt"> = {
      setDelay: "setDelay",
      varInterp: "varInterp",
      ptrInterp: "ptrInterp",
      animStart: "animStart",
      animStop: "animStop",
      animStopAt: "animStopAt"
    } as const;
    const kind = kindMap[matched.fn];

    let lastArg: Node | undefined;
    let baseStmt: Partial<Extract<IRStmt, { k: "async" }>> = { k: "async", kind };

    if (kind === "setDelay") {
      const [slotExpr, durationExpr, doneExpr] = args;
      baseStmt.slot = this.slotRefOf(slotExpr);
      baseStmt.args = [this.lowerExpr(durationExpr, "float", ctx)];
      lastArg = doneExpr;
    } else if (kind === "varInterp") {
      const [varIdExpr, valueExpr, durationExpr, p1Expr, p2Expr, useSlerpExpr, doneExpr] = args;
      const varId = readNumber(varIdExpr) ?? fail("GI126", varIdExpr, "varInterp's first argument must be a numeric literal");
      const varType = this.variables[varId]?.type ?? "float";
      baseStmt.config = { varId, useSlerp: readBool(useSlerpExpr) ?? false };
      baseStmt.args = [
        this.lowerExpr(valueExpr, varType, ctx),
        this.lowerExpr(durationExpr, "float", ctx),
        this.lowerExpr(p1Expr, "float2", ctx),
        this.lowerExpr(p2Expr, "float2", ctx)
      ];
      lastArg = doneExpr;
    } else if (kind === "ptrInterp") {
      const [pointerExpr, argsObjExpr, typeExpr, valueExpr, durationExpr, p1Expr, p2Expr, doneExpr] = args;
      const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GI126", pointerExpr, "ptrInterp pointer must be a string literal");
      const template = parsePointerTemplate(pointerLit);
      const type = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GI126", typeExpr, "ptrInterp type must be a string literal");
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

    if (lastArg && !isUndefinedKeyword(lastArg)) {
      if (contFn) {
        baseStmt.done = { kind: "inline", body: this.lowerBlock((contFn.getBodyOrThrow() as import("ts-morph").Block).getStatements(), ctx) } as Cont;
      } else if (Node.isIdentifier(lastArg)) {
        const procId = this.procIndexByName.get(lastArg.getText());
        if (procId === undefined) fail("GI126", lastArg, `unknown proc reference "${lastArg.getText()}" as async done continuation`);
        baseStmt.done = { kind: "proc", procId } as Cont;
      } else {
        fail("GI126", lastArg, "async done continuation must be a proc reference, inline function, or undefined");
      }
    }

    const resName = decl.getName();
    let consumed = (contFn ? 1 : 0) + 1;
    const nextIdx = i + consumed;
    const nextStmt = stmts[nextIdx];
    if (nextStmt && Node.isIfStatement(nextStmt) && this.isResultVarField(nextStmt.getExpression(), resName, "ok")) {
      baseStmt.out = this.lowerOptionalBlock(blockStmts(nextStmt.getThenStatement()), ctx);
      const elseNode = nextStmt.getElseStatement();
      baseStmt.err = elseNode ? this.lowerOptionalBlock(blockStmts(elseNode), ctx) : undefined;
      consumed += 1;
    }

    return { stmt: baseStmt as IRStmt, consumed };
  }

  // -------------------------------------------------------------------
  // stateful ops
  // -------------------------------------------------------------------

  private slotRefOf(expr: Node): { slot: number } {
    if (!Node.isIdentifier(expr)) {
      fail("GI127", expr, "expected a state-slot identifier");
    }
    const idx = this.stateSlotIndexByName.get(expr.getText());
    if (idx === undefined) {
      fail("GI127", expr, `unknown state slot "${expr.getText()}"`);
    }
    return { slot: idx };
  }

  private parseDoN(stmts: Statement[], i: number, decl: VariableDeclaration, call: import("ts-morph").CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, nExpr] = call.getArguments();
    const slot = this.slotRefOf(slotExpr);
    const args = [this.lowerExpr(nExpr, "int", ctx)];
    const resName = decl.getName();
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && Node.isIfStatement(next) && this.isResultVarField(next.getExpression(), resName, "fire")) {
      const block = this.lowerOptionalBlock(blockStmts(next.getThenStatement()), ctx);
      if (block) outs.out = block;
      consumed = 2;
    }
    return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args, outs }, consumed };
  }

  private parseThrottle(stmts: Statement[], i: number, decl: VariableDeclaration, call: import("ts-morph").CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, durationExpr] = call.getArguments();
    const slot = this.slotRefOf(slotExpr);
    const args = [this.lowerExpr(durationExpr, "float", ctx)];
    const resName = decl.getName();
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && Node.isIfStatement(next) && this.isResultVarField(next.getExpression(), resName, "invalid")) {
      const elseNode = next.getElseStatement();
      if (elseNode && Node.isIfStatement(elseNode) && this.isResultVarField(elseNode.getExpression(), resName, "fire")) {
        const errBlock = this.lowerOptionalBlock(blockStmts(next.getThenStatement()), ctx);
        const outBlock = this.lowerOptionalBlock(blockStmts(elseNode.getThenStatement()), ctx);
        if (errBlock) outs.err = errBlock;
        if (outBlock) outs.out = outBlock;
        consumed = 2;
      }
    }
    return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args, outs }, consumed };
  }

  private parseWaitAll(stmts: Statement[], i: number, decl: VariableDeclaration, call: import("ts-morph").CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, inputFlowsExpr, indexExpr] = call.getArguments();
    const slot = this.slotRefOf(slotExpr);
    const inputFlows = readNumber(inputFlowsExpr);
    if (inputFlows !== undefined) {
      this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { ...this.stateSlots[slot.slot].config, inputFlows: Math.trunc(inputFlows) } };
    }
    const index = readNumber(indexExpr) ?? 0;
    const resName = decl.getName();
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && Node.isIfStatement(next) && this.isResultVarField(next.getExpression(), resName, "completed")) {
      const completedBlock = this.lowerOptionalBlock(blockStmts(next.getThenStatement()), ctx);
      if (completedBlock) outs.completed = completedBlock;
      const elseNode = next.getElseStatement();
      if (elseNode) {
        const outBlock = this.lowerOptionalBlock(blockStmts(elseNode), ctx);
        if (outBlock) outs.out = outBlock;
      }
      consumed = 2;
    }
    return { stmt: { k: "stateful", kind: "waitAll", slot, port: Math.trunc(index), args: [], outs }, consumed };
  }

  private parseMultiGate(stmts: Statement[], i: number, decl: VariableDeclaration, call: import("ts-morph").CallExpression, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const [slotExpr, , isRandomExpr, isLoopExpr] = call.getArguments();
    const slot = this.slotRefOf(slotExpr);
    const isRandom = readBool(isRandomExpr) ?? false;
    const isLoop = readBool(isLoopExpr) ?? false;
    this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { isRandom, isLoop } };
    const resName = decl.getName();
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && Node.isSwitchStatement(next) && this.isResultVarField(next.getExpression(), resName, "index")) {
      next.getCaseBlock().getClauses().forEach((clause) => {
        if (!Node.isCaseClause(clause)) {
          return;
        }
        const caseNum = readNumber(clause.getExpression());
        if (caseNum === undefined) {
          fail("GI128", clause, "multiGate switch case must be a numeric literal");
        }
        outs[String(caseNum)] = this.lowerBlock(caseBody(clause), ctx);
      });
      consumed = 2;
    }
    return { stmt: { k: "stateful", kind: "multiGate", slot, port: "in", args: [], outs }, consumed };
  }

  private tryParseReset(stmts: Statement[], i: number): { stmt: IRStmt; consumed: number } | null {
    const expr = this.exprOf(stmts[i]);
    if (!expr || !Node.isBinaryExpression(expr) || expr.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) {
      return null;
    }
    const left = expr.getLeft();
    if (!Node.isPropertyAccessExpression(left) || !Node.isIdentifier(left.getExpression())) {
      return null;
    }
    const slotName = left.getExpression().getText();
    const slotIdx = this.stateSlotIndexByName.get(slotName);
    if (slotIdx === undefined) {
      return null;
    }
    const kind = this.stateSlots[slotIdx].kind;
    const field = left.getName();
    if (kind === "doN" && field === "count") {
      return { stmt: { k: "stateful", kind: "doN", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 1 };
    }
    if (kind === "multiGate" && field === "used") {
      return { stmt: { k: "stateful", kind: "multiGate", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
    }
    if (kind === "waitAll" && field === "activated") {
      const nextExpr = this.exprOf(stmts[i + 1]);
      if (nextExpr && Node.isBinaryExpression(nextExpr) && Node.isPropertyAccessExpression(nextExpr.getLeft())) {
        const n = readNumber(nextExpr.getRight());
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
    const expr = this.exprOf(stmts[i]);
    if (!expr || !Node.isBinaryExpression(expr) || expr.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) {
      return null;
    }
    const left = expr.getLeft();
    if (!Node.isIdentifier(left)) {
      return null;
    }
    const slotIdx = this.stateSlotIndexByName.get(left.getText());
    if (slotIdx === undefined || this.stateSlots[slotIdx].kind !== "for") {
      return null;
    }
    const next = stmts[i + 1];
    if (!next || !Node.isWhileStatement(next)) {
      fail("GI129", next, "expected a `while` loop following a for-slot assignment");
    }
    const cond = next.getExpression();
    if (!Node.isBinaryExpression(cond) || cond.getOperatorToken().getKind() !== SyntaxKind.LessThanToken || !Node.isIdentifier(cond.getLeft()) || cond.getLeft().getText() !== left.getText()) {
      fail("GI129", cond, "expected `slot < (end)` for a for-loop condition");
    }
    const condRight = cond.getRight();
    const endExpr = Node.isParenthesizedExpression(condRight) ? condRight.getExpression() : condRight;
    const start = this.lowerExpr(expr.getRight(), "int", ctx);
    const end = this.lowerExpr(endExpr, "int", ctx);
    const bodyStmts = blockStmts(next.getStatement());
    const last = bodyStmts[bodyStmts.length - 1];
    const lastExpr = last ? this.exprOf(last) : undefined;
    if (!lastExpr || !Node.isBinaryExpression(lastExpr) || lastExpr.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) {
      fail("GI129", last, "expected the for-loop body's last statement to be the index increment");
    }
    const body = this.lowerBlock(bodyStmts.slice(0, -1), ctx);
    return { stmt: { k: "for", slot: { slot: slotIdx }, start, end, body }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // plain switch (flow/switch)
  // -------------------------------------------------------------------

  private parsePlainSwitch(stmt: import("ts-morph").SwitchStatement, ctx: Ctx): IRStmt {
    // See emit.ts's "switch" case: the selector is wrapped `<expr> | 0` to
    // keep TS from narrowing a literal-constant selector to its own literal
    // type (which would make non-matching `case` labels a strict-mode
    // error) — semantically a no-op since flow/switch's selection is always
    // int, but the wrapper itself must be stripped before lowering.
    const rawSelector = stmt.getExpression();
    const selectorExpr =
      Node.isBinaryExpression(rawSelector) && rawSelector.getOperatorToken().getKind() === SyntaxKind.BarToken && readNumber(rawSelector.getRight()) === 0
        ? rawSelector.getLeft()
        : rawSelector;
    const selector = this.lowerExpr(selectorExpr, "int", ctx);
    const cases: Array<[number, IRStmt]> = [];
    let dflt: IRStmt | undefined;
    stmt.getCaseBlock().getClauses().forEach((clause) => {
      if (Node.isCaseClause(clause)) {
        const num = readNumber(clause.getExpression());
        if (num === undefined) {
          fail("GI130", clause, "switch case must be a numeric literal");
        }
        cases.push([num, this.lowerBlock(caseBody(clause), ctx)]);
      } else {
        dflt = this.lowerBlock(caseBody(clause), ctx);
      }
    });
    return { k: "switch", selector, cases, default: dflt };
  }

  // -------------------------------------------------------------------
  // Expression lowering
  // -------------------------------------------------------------------

  private lowerExpr(expr: Node, expected: IRType | undefined, ctx: Ctx): IRExpr {
    // Literals.
    const num = tryLiteralNumber(expr);
    if (num !== undefined) {
      const t = expected ?? "float";
      return { k: "const", type: t, data: [t === "int" ? Math.trunc(num) : num] };
    }
    const b = readBool(expr);
    if (b !== undefined) {
      return { k: "const", type: "bool", data: [b] };
    }
    if (Node.isStringLiteral(expr) || Node.isNoSubstitutionTemplateLiteral(expr)) {
      return { k: "const", type: "ref", data: [expr.getLiteralText()] };
    }
    if (Node.isArrayLiteralExpression(expr)) {
      const nums = expr.getElements().map((e) => readNumber(e) ?? fail("GI140", e, "array literal element must be a numeric literal"));
      const type = expected ?? lengthToType(nums.length, F_FAMILY) ?? fail("GI140", expr, `cannot infer type for a ${nums.length}-element array literal`);
      return { k: "const", type, data: nums };
    }

    // rt.getVar
    const getVar = asCall(expr, "rt", "getVar");
    if (getVar) {
      const varId = readNumber(getVar.getArguments()[0]) ?? fail("GI141", expr, "rt.getVar's argument must be a numeric literal");
      return { k: "varGet", varId };
    }
    // rt.random
    if (asCall(expr, "rt", "random")) {
      const overload = resolveOverload("math/random", {})!;
      return { k: "op", op: "math/random", overload, args: [] };
    }
    // rt.tickTime / rt.tickDelta (always cross-handler per emit.ts's paramAccess split)
    if (asCall(expr, "rt", "tickTime")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceStart" }, args: [], type: "float" };
    }
    if (asCall(expr, "rt", "tickDelta")) {
      return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceLastTick" }, args: [], type: "float" };
    }

    // rt.ptrGet(...).value / .isValid
    if (Node.isPropertyAccessExpression(expr)) {
      const ptrGet = asCall(expr.getExpression(), "rt", "ptrGet");
      if (ptrGet) {
        return this.lowerPtrGet(ptrGet, expr.getName() === "isValid");
      }
    }
    // rt.eventPayload(i)[k]
    if (Node.isElementAccessExpression(expr)) {
      const payloadCall = asCall(expr.getExpression(), "rt", "eventPayload");
      if (payloadCall) {
        const eventIndex = readNumber(payloadCall.getArguments()[0]) ?? 0;
        const fieldIdx = readNumber(expr.getArgumentExpressionOrThrow()) ?? 0;
        const field = PAYLOAD_FIELDS[fieldIdx] ?? "boolParameter";
        return { k: "intrinsic", op: "event/receive#payload", config: { eventIndex, field }, args: [], type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
      }
    }
    // Multi-output `m.<fn>(...)` reads: `.value`/`.isValid` (normalize,
    // inverse), named outputs (matDecompose's translation/rotation/scale,
    // quatToAxisAngle's axis/angle, rgbToOkLCh/rgbFromOkLCh's l/c/h / r/g/b),
    // or decimal-indexed outputs (extractN/extractNxN's "0".."N-1") — see
    // emit.ts's emitOp: any op with >1 declared output socket is called bare
    // and then the specific socket is read off the result object/array.
    if (Node.isPropertyAccessExpression(expr)) {
      const inner = expr.getExpression();
      const c = calleeOf(inner);
      if (c && c.base === "m" && Node.isCallExpression(inner)) {
        return this.lowerMCall(inner, c.name, expected, ctx, expr.getName());
      }
    }
    if (Node.isElementAccessExpression(expr)) {
      const inner = expr.getExpression();
      const c = calleeOf(inner);
      if (c && c.base === "m" && Node.isCallExpression(inner)) {
        const idx = readNumber(expr.getArgumentExpressionOrThrow());
        if (idx === undefined) {
          fail("GI143", expr, "expected a numeric literal index into a multi-output m.* call");
        }
        return this.lowerMCall(inner, c.name, expected, ctx, String(idx));
      }
    }
    // rt.eventOutRead(node, socket) — best-effort GI012 fallback (not
    // exercised by the conformance corpus; see this file's header note).
    const eventOutRead = asCall(expr, "rt", "eventOutRead");
    if (eventOutRead) {
      const [nodeExpr, socketExpr] = eventOutRead.getArguments();
      const sourceNode = readNumber(nodeExpr) ?? 0;
      const socket = stringLiteralValue(socketExpr) ?? "";
      this.diagnostics.push({ severity: "info", code: "GI180", message: `best-effort reconstruction of cross-handler read rt.eventOutRead(${sourceNode}, "${socket}")` });
      return { k: "intrinsic", op: "event/unknown", config: { crossContext: true, socket, sourceNode }, args: [], type: expected ?? "ref" };
    }

    // m.switchCase(...)
    const switchCase = asCall(expr, "m", "switchCase");
    if (switchCase) {
      return this.lowerMathSwitch(switchCase, expected, ctx);
    }
    // m.<fn>(...)
    if (Node.isCallExpression(expr)) {
      const c = calleeOf(expr);
      if (c && c.base === "m") {
        return this.lowerMCall(expr, c.name, expected, ctx);
      }
    }

    if (Node.isIdentifier(expr)) {
      const text = expr.getText();
      if (ctx.kind === "handler" && ctx.handlerKind === "onTick" && (text === "timeSinceStart" || text === "timeSinceLastTick")) {
        return { k: "param", name: text, type: "float" };
      }
      const slotIdx = this.stateSlotIndexByName.get(text);
      if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "for") {
        return { k: "stateRead", slot: { slot: slotIdx }, field: "index", type: "int" };
      }
      const decl = this.resolveDecl(expr);
      if (decl && this.tempTypeByDecl.has(decl)) {
        return { k: "temp", id: text };
      }
      fail("GI150", expr, `unresolved identifier "${text}"`);
    }

    if (Node.isElementAccessExpression(expr) && Node.isIdentifier(expr.getExpression()) && expr.getExpression().getText() === "payload") {
      if (ctx.kind === "handler" && ctx.handlerKind === "receive") {
        const fieldIdx = readNumber(expr.getArgumentExpressionOrThrow()) ?? 0;
        const field = PAYLOAD_FIELDS[fieldIdx] ?? "boolParameter";
        return { k: "param", name: field, type: field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float" };
      }
    }

    if (Node.isPropertyAccessExpression(expr) && Node.isIdentifier(expr.getExpression())) {
      const slotIdx = this.stateSlotIndexByName.get(expr.getExpression().getText());
      if (slotIdx !== undefined) {
        return this.lowerStateFieldRead(slotIdx, expr.getName());
      }
    }
    if (Node.isParenthesizedExpression(expr) && Node.isBinaryExpression(expr.getExpression())) {
      const bin = expr.getExpression() as import("ts-morph").BinaryExpression;
      if (bin.getOperatorToken().getKind() !== SyntaxKind.QuestionQuestionToken) {
        fail("GI140", expr, "unrecognized parenthesized expression");
      }
      const left = bin.getLeft();
      if (Node.isPropertyAccessExpression(left) && Node.isIdentifier(left.getExpression())) {
        const slotIdx = this.stateSlotIndexByName.get(left.getExpression().getText());
        if (slotIdx !== undefined && left.getName() === "remaining") {
          const inputFlows = readNumber(bin.getRight());
          if (inputFlows !== undefined) {
            this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(inputFlows) } };
          }
          return { k: "stateRead", slot: { slot: slotIdx }, field: "remainingInputs", type: "int" };
        }
      }
    }

    fail("GI140", expr, `unrecognized expression shape (kind ${expr.getKindName()})`);
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
    fail("GI140", undefined, `unrecognized state-slot field read "${field}" on slot kind "${kind}"`);
  }

  private resolveDecl(id: Node): Node | undefined {
    const sym = id.getSymbol();
    const decls = sym?.getDeclarations();
    return decls?.[0];
  }

  private lowerPtrGet(call: import("ts-morph").CallExpression, wantIsValid: boolean): IRExpr {
    const [pointerExpr, argsObjExpr, typeExpr] = call.getArguments();
    const pointerLit = stringLiteralValue(pointerExpr) ?? fail("GI141", pointerExpr, "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const valueType = (stringLiteralValue(typeExpr) as IRType | undefined) ?? fail("GI141", typeExpr, "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, { kind: "proc" });
    return { k: "ptrGet", template, args, type: wantIsValid ? "bool" : valueType, valueType, wantIsValid };
  }

  private lowerMathSwitch(call: import("ts-morph").CallExpression, expected: IRType | undefined, ctx: Ctx): IRExpr {
    const [selectionExpr, casesExpr, valuesExpr, defaultExpr] = call.getArguments();
    if (!Node.isArrayLiteralExpression(casesExpr) || !Node.isArrayLiteralExpression(valuesExpr)) {
      fail("GI142", call, "m.switchCase's cases/values arguments must be array literals");
    }
    const cases = casesExpr.getElements().map((e) => readNumber(e) ?? fail("GI142", e, "switch case must be a numeric literal"));
    const valueNodes = valuesExpr.getElements();
    // Determine the shared value type: prefer a non-literal sibling (default
    // or any case value), else fall back to the caller's expected type, else
    // "float" — mirrors this file's general generic-resolution strategy.
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

  private lowerMCall(call: import("ts-morph").CallExpression, fnName: string, expected: IRType | undefined, ctx: Ctx, socket?: string): IRExpr {
    const argNodes = call.getArguments();
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
      fail("GI143", call, `unknown m.${fnName}(...) call`);
    }
    const op = candidates[0].op;
    const spec = getOpSpec(op);
    if (!spec) {
      fail("GI143", call, `op "${op}" not found in registry`);
    }
    // Some fn names (lt/le/gt/ge, the bitwise-only ops) map to TWO fixed
    // rows (a float row and an int row) with no suffix to distinguish them
    // — see @gltfi/kernel's fn-naming.ts lookupMFunctions doc comment. Disambiguate using the
    // actual argument types before picking a row (picking candidates[0]
    // unconditionally was a real bug: `m.lt(intVar, 2)` always resolved to
    // the float row, mistyping the literal `2` as float).
    const overloadIndex = candidates.length === 1 ? candidates[0].overloadIndex : this.disambiguateOverload(candidates, spec, argNodes, expected, ctx);
    const row = spec.overloads[overloadIndex];
    if (row.inputs.length !== argNodes.length) {
      fail("GI143", call, `m.${fnName} arg count ${argNodes.length} != expected ${row.inputs.length}`);
    }

    const hasGeneric = row.inputs.some((s) => isGenericSig(s.type)) || row.outputs.some((o) => isGenericSig(o.type));
    const argExprs: IRExpr[] = new Array(row.inputs.length);
    let pinned: IRType | undefined;

    if (hasGeneric) {
      const genericLetter = row.inputs.find((s) => isGenericSig(s.type))?.type ?? row.outputs.find((o) => isGenericSig(o.type))?.type;
      const family = genericLetter && isGenericSig(genericLetter) ? familyOf(genericLetter) : null;
      // First pass: lower non-literal-ish args at their generic socket with
      // no expected type (bottom-up), to discover a definite pinned type.
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
          const arrLen = Node.isArrayLiteralExpression(node) ? node.getElements().length : tryLiteralNumber(node) !== undefined ? 1 : undefined;
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
      fail("GI143", call, `could not resolve overload for op "${op}" with inputs ${JSON.stringify(inputTypesByName)}`);
    }
    const resultSocket = socket && socket !== "value" ? socket : undefined;
    if (resultSocket !== undefined && !(resultSocket in overload.outputs)) {
      fail("GI143", call, `op "${op}" has no output socket "${resultSocket}"`);
    }
    return { k: "op", op, overload, args: argExprs, socket: resultSocket };
  }

  // Picks which of several same-named candidate rows (see @gltfi/kernel's
  // fn-naming.ts's lookupMFunctions) matches the actual call site, using the same
  // "probe a non-literal arg's own bottom-up type" strategy as the generic
  // pinning above — sound here too since every currently-colliding case
  // (lt/le/gt/ge, the bitwise ops) has fully FIXED (non-generic) rows, so a
  // discovered concrete type either matches a row's declared socket type
  // exactly or it doesn't.
  private disambiguateOverload(candidates: FnCandidate[], spec: import("@gltfi/kernel").OpSpec, argNodes: Node[], expected: IRType | undefined, ctx: Ctx): number {
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
  // Bottom-up type inference (for `let` temps and generic-op pinning).
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
        return this.tempTypeById.get(expr.id) ?? "float";
      case "stateRead":
        return expr.type;
      case "intrinsic":
        return expr.type;
    }
  }

  // Parallel lookup by temp-id text (populated alongside tempTypeByDecl —
  // see the `let` case in parseOne). Two maps because `typeOfExpr` only has
  // the already-built IRExpr (carrying just the string id), not the
  // declaration node.
  private tempTypeById = new Map<string, IRType>();
}

function tryLiteralNumber(expr: Node): number | undefined {
  if (Node.isNumericLiteral(expr)) {
    return expr.getLiteralValue();
  }
  if (Node.isPrefixUnaryExpression(expr) && expr.getOperatorToken() === SyntaxKind.MinusToken && Node.isNumericLiteral(expr.getOperand())) {
    return -(expr.getOperand() as import("ts-morph").NumericLiteral).getLiteralValue();
  }
  if (Node.isIdentifier(expr) && (expr.getText() === "NaN" || expr.getText() === "Infinity")) {
    return expr.getText() === "NaN" ? NaN : Infinity;
  }
  if (Node.isPrefixUnaryExpression(expr) && expr.getOperatorToken() === SyntaxKind.MinusToken && Node.isIdentifier(expr.getOperand()) && expr.getOperand().getText() === "Infinity") {
    return -Infinity;
  }
  return undefined;
}

function isLiteralish(node: Node): boolean {
  return tryLiteralNumber(node as Expression) !== undefined || Node.isArrayLiteralExpression(node) || node.getKind() === SyntaxKind.TrueKeyword || node.getKind() === SyntaxKind.FalseKeyword || Node.isStringLiteral(node);
}
