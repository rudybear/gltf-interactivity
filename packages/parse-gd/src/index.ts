// GDScript -> IR parser (packages/parse-gd). Mirrors @gltfi/parse-py's
// index.ts (read that file first — this header only calls out where
// GDScript differs) — a mechanical INVERSE of @gltfi/emit-gd's emit.ts,
// case for case, targeting exactly the subset that emitter produces (see
// its own header comment for the generated module's shape: `extends
// RefCounted` + one `var` per (m, rt, V, E, state-slot) class field, then
// `func build(_rt) -> void: ...`, then every proc as its own top-level
// `func`, then every handler body as its own top-level `func`, with any
// synthesized `contN` continuation funcs interleaved right after whichever
// proc/handler spawned them).
//
// Why a hand-rolled tokenizer/parser instead of shelling out to the
// language's own grammar (parse-py's/parse-cs's own trick, reusing CPython's
// `ast.parse`/Roslyn's `CSharpSyntaxTree.ParseText` via a harness process):
// Godot 4.3 exposes NO public GDScript AST API — there is no `gdscript.
// parse(code)` to call into, in-process or via subprocess. See
// ./gdscript-syntax.ts's own header for the (brief, time-boxed)
// `tree-sitter-gdscript` evaluation and why this package took the task's
// designed fallback instead: a small, deterministic, ZERO-dependency
// indentation-aware recursive-descent parser over exactly the constructs
// `emit-gd`'s `emit.ts` can produce. That parser (tokenizer + Pratt
// expression parser + statement parser, producing an untyped `GStmt`/`GExpr`
// tree with no KHR_interactivity knowledge at all) lives in
// ./gdscript-syntax.ts; THIS file is the IR-lowering pass on top of it —
// the direct GDScript-surface analog of parse-py's `ModuleParser` walking
// Python's `ast` tree, parse-lua's walking `luaparse`'s tree, and parse-cs's
// walking Roslyn's tree.
//
// Two structural simplifications this parser gets for free that parse-py's
// own header calls out as NOT available to it:
//  1. No OLD/NEW dual-shape matching. `emit-gd` is a brand-new emitter with
//     no prior "shape" to stay backward-compatible with (unlike emit-py's
//     documented old-list/new-dict `rt.vars` duality, or its old-named-
//     result/new-bare-call async duality) — every construct below has
//     exactly ONE canonical emitted shape, so this parser (unlike parse-py's
//     `matchNamedCall`/`tryParseAsync`'s old/new branches) never needs to
//     try two shapes per construct.
//  2. No `if`/`elif` ambiguity. GDScript's `elif` is a distinct token from
//     `else:` followed by a nested `if` — @gltfi/parse-gd's own grammar
//     (./gdscript-syntax.ts) captures a WHOLE `if`/`elif*`/`else?` chain as
//     one `GStmt` up front, so unlike parse-py's/parse-lua's own extensive
//     "is this elif-looking nested-if actually part of an unrelated
//     genuine flow/branch" defensive commentary (Python's/Lua's own
//     grammars have NO distinct elif-chain AST shape at all — `else: if
//     ...` is byte-identical to a real `elif`), switch/multiGate/throttle
//     lookaheads here just inspect `stmt.elifs` directly with no risk of
//     misreading an unrelated nested `if` as a chain continuation.
//
// Genuinely GDScript-specific complications parse-py doesn't have:
//  - Async "done" continuations are bare IDENTIFIER references (a Callable
//    value), never an inline nested function the way Python's/Lua's own
//    local `def`/`local function` is — see emit-gd's own header note on why
//    (GDScript lambdas can't forward-reference/self-recurse, so every
//    proc/handler/continuation is a separate TOP-LEVEL `func`). This parser
//    resolves each bare reference against TWO pools built in a first pass
//    over the whole file (see `run()`): known proc names (`procIndexByName`)
//    and known `contN`-named synthesized continuation bodies
//    (`contRawBodies`, lowered lazily — see `lowerContBody`) — a name
//    matching neither is `GG122`.
//  - Handler-body funcs are identified by REGISTRATION (the `rt.on_start`/
//    `rt.on_tick`/`rt.on_receive` calls inside `build()`), and everything
//    else surviving that filter is classified purely by NAME PATTERN
//    (`/^cont\d+$/` for a continuation, anything else a proc) rather than by
//    scanning every body for call-vs-Callable usage sites — safe because
//    `emit-gd`'s own naming is a closed, reserved convention (`__on_start_
//    N`/`__on_tick_N`/`__on_receive_N`/`contN`, the latter a single whole-
//    module-scoped counter — see emit.ts's own header note on why) that a
//    real proc's own display name is vanishingly unlikely to collide with
//    (same accepted-simplification spirit as parse-cs's `GC127`'s "the
//    emitter's own fixed slot identifiers" trust).
//  - Numeric literal INT-vs-FLOAT typing is recovered LEXICALLY, exactly,
//    with no fallback guessing at all (better than Python's own `_ptype`-tag
//    approach, itself already exact — see parse-py's header): `gdIntLiteral`
//    NEVER prints a decimal point and `gdFloatLiteral` ALWAYS does (or is
//    the bare `NAN`/`INF`/`-INF` token) — see ./gdscript-syntax.ts's own
//    `Lexer.readNumber`/`Parser.parseAtom` — so a bare numeral's own token
//    text alone (not `expected`) decides its IR type.
import { getOpSpec, isGenericSig, lookupMFunctions, resolveOverload, type FnCandidate, type OpSpec, type TypeSig } from "@gltfi/kernel";
import {
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
import { GdSyntaxError, parseGdScript, type GExpr, type GStmt } from "./gdscript-syntax.js";

export type ParseResult = { module: IRModule; diagnostics: Diagnostic[] };

class ParseError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
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

// No subprocess/session of any kind is spawned by this package (unlike
// parse-py's/parse-cs's own lazily-spawned harness sessions — see this
// file's own header) — `parseModuleGd` is a plain, fully synchronous, pure
// function. There is nothing for a `closeParser()` to shut down.
export function parseModuleGd(code: string): ParseResult {
  let stmts: GStmt[];
  try {
    stmts = parseGdScript(code);
  } catch (err) {
    if (err instanceof GdSyntaxError) {
      return { module: emptyModule(), diagnostics: [{ severity: "error", code: "GG001", message: `GDScript syntax error: ${err.message}` }] };
    }
    throw err;
  }
  try {
    const parser = new ModuleParser();
    const module = parser.run(stmts);
    return { module, diagnostics: parser.diagnostics };
  } catch (err) {
    if (err instanceof ParseError) {
      return { module: emptyModule(), diagnostics: [{ severity: "error", code: err.code, message: err.message }] };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Small free-function helpers over the generic GExpr/GStmt tree.
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

// See parse-py's/parse-lua's own `lengthToType` doc comment (identical
// rationale): infers a concrete vector/matrix IRType from a literal's
// element count when no `expected` type was propagated top-down.
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

function identName(expr: GExpr | undefined): string | undefined {
  return expr && expr.t === "ident" ? expr.name : undefined;
}

function numLit(node: GExpr | undefined): number | undefined {
  return node && node.t === "num" ? node.value : undefined;
}

function boolLit(node: GExpr | undefined): boolean | undefined {
  return node && node.t === "bool" ? node.value : undefined;
}

function strLit(node: GExpr | undefined): string | undefined {
  return node && node.t === "str" ? node.value : undefined;
}

// A node whose value is knowable purely from its own literal text — used by
// `disambiguateOverload`'s/`inferScalarKind`'s bottom-up "skip the literal
// operand, look at the other one" strategy, mirroring parse-py's/parse-lua's
// identically-named helper.
function isLiteralish(node: GExpr): boolean {
  return node.t === "num" || node.t === "bool" || node.t === "str" || (node.t === "array" && node.items.every(isLiteralish));
}

// Component count for each fixed (non-generic) TypeSig math/vector/matrix
// shape — used by literalShapeCompatible below to filter overload
// candidates by a literal argument's own length, independent of that arg's
// (as yet unknown) socket type. Identical table to parse-ts's own (task
// #21 port of that file's bug #18 fix); "ref"/"custom" have no numeric
// shape and are intentionally omitted (never a literal-array target).
const TYPE_COMPONENT_COUNT: Partial<Record<TypeSig, number>> = {
  float: 1,
  int: 1,
  float2: 2,
  float3: 3,
  float4: 4,
  float2x2: 4,
  float3x3: 9,
  float4x4: 16
};

// A literal-ish argument's own shape: an array literal's element count, 1
// for a bare numeric literal, "bool" for true/false, or undefined when the
// literal carries no useful shape signal (e.g. a string literal — no math
// op argument is ever shape-disambiguated by string content).
function literalShape(node: GExpr): number | "bool" | undefined {
  if (node.t === "array") {
    return node.items.length;
  }
  if (node.t === "num") {
    return 1;
  }
  if (node.t === "bool") {
    return "bool";
  }
  return undefined;
}

// Is `node`'s literal shape consistent with a candidate row's declared
// socket type `sigType` at the same argument index? Generic (F/V/M/T)
// sockets and sockets with no usable shape signal are always considered
// compatible (this is a FILTER, not a resolver — see parse-ts's identical
// helper's doc comment for why this is intentionally count-only, and why
// combining it across multiple args still resolves math/transform's rows
// even though no single arg does).
function literalShapeCompatible(node: GExpr, sigType: TypeSig | "F" | "V" | "M" | "T" | undefined): boolean {
  if (!sigType || isGenericSig(sigType)) {
    return true;
  }
  const shape = literalShape(node);
  if (shape === undefined) {
    return true;
  }
  if (shape === "bool" || sigType === "bool") {
    return shape === "bool" && sigType === "bool";
  }
  return TYPE_COMPONENT_COUNT[sigType] === shape;
}

// `<base>.<attr>(<args>)` where `<base>` is a bare identifier matching
// `baseName` and `<attr>` matches `attrName` exactly.
function matchAttrCall(expr: GExpr, baseName: string, attrName: string): { args: GExpr[] } | undefined {
  if (expr.t !== "call" || expr.callee.t !== "attr" || expr.callee.name !== attrName) {
    return undefined;
  }
  return identName(expr.callee.base) === baseName ? { args: expr.args } : undefined;
}

// `<expr>[<key>]` bare string-keyed subscript — returns `<expr>`'s own base
// when it matches, `undefined` otherwise. Used to recognize the `["ok"]`/
// `["completed"]`/`["index"]` wrapper shapes async/waitAll/multiGate's
// bare-`if` forms read directly off a call result with no named local.
function indexStrKey(expr: GExpr, key: string): GExpr | undefined {
  return expr.t === "index" && expr.index.t === "str" && expr.index.value === key ? expr.base : undefined;
}

// `<base>[<key>] == <rhs>` — used by multiGate's if/elif-chain lookahead.
function matchIndexEq(cond: GExpr, key: string): { base: GExpr; rhs: GExpr } | undefined {
  if (cond.t !== "binary" || cond.op !== "==" || cond.left.t !== "index" || cond.left.index.t !== "str" || cond.left.index.value !== key) {
    return undefined;
  }
  return { base: cond.left.base, rhs: cond.right };
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
  // KHR_node_selectability/hoverability (R4 #20-4): @gltfi/emit-gd now
  // emits rt.on_select/on_hover_in/on_hover_out REGISTRATIONS (authoring
  // parity with emit-ts — see that file's header note); runtime-gd's own
  // rt.on_select/on_hover_in/on_hover_out are still no-op-tolerant stubs
  // that never fire (execution stays out of scope, see engine.gd's header
  // note), but that's a runtime concern, not a parse one.
  onSelect: [
    { name: "selectedNode", type: "ref" },
    { name: "selectedNodeIndex", type: "int" },
    { name: "controllerIndex", type: "int" },
    { name: "selectionPoint", type: "float3" },
    { name: "selectionRayOrigin", type: "float3" },
    { name: "event", type: "ref" }
  ],
  onHoverIn: [
    { name: "hoveredNode", type: "ref" },
    { name: "controllerIndex", type: "int" },
    { name: "event", type: "ref" }
  ],
  onHoverOut: [
    { name: "hoveredNode", type: "ref" },
    { name: "controllerIndex", type: "int" },
    { name: "event", type: "ref" }
  ]
};

const PAYLOAD_FIELDS = ["boolParameter", "intParameter", "floatParameter", "expectedDuration"] as const;

// `params["<key>"]` string key -> IR param name/type (see emit-gd's own
// paramAccess onSelect/onHoverIn/onHoverOut cases, mirrored exactly). No
// destructuring exists in this backend at all (see emit-gd's header note),
// so — unlike parse-ts/parse-lua/parse-py's separate "local param" tables —
// this is the ONLY lookup table needed for these three handler kinds.
const ONSELECT_PARAM_KEY: Record<string, { name: string; type: IRType }> = {
  selectedNode: { name: "selectedNode", type: "ref" },
  selectedNodeIndex: { name: "selectedNodeIndex", type: "int" },
  controllerIndex: { name: "controllerIndex", type: "int" },
  selectionPoint: { name: "selectionPoint", type: "float3" },
  selectionRayOrigin: { name: "selectionRayOrigin", type: "float3" }
};
const HOVER_PARAM_KEY: Record<string, { name: string; type: IRType }> = {
  hoveredNode: { name: "hoveredNode", type: "ref" },
  controllerIndex: { name: "controllerIndex", type: "int" }
};

// Reverse of emit-gd's `GD_RENAME` (only the bare, non-Int-suffixed forms
// collide with a GDScript keyword/@GlobalScope builtin — see that table's
// own doc comment in emit.ts; hand-transcribed here rather than imported
// from `@gltfi/emit-gd`, same convention as parse-py's `PY_UNRENAME` not
// importing from `@gltfi/emit-py` — this package has no runtime dependency
// on its sibling emitter package at all).
const GD_UNRENAME: Record<string, string> = {
  and_: "and",
  or_: "or",
  not_: "not",
  abs_: "abs",
  min_: "min",
  max_: "max",
  pow_: "pow",
  round_: "round",
  floor_: "floor",
  ceil_: "ceil",
  sin_: "sin",
  cos_: "cos",
  tan_: "tan",
  asin_: "asin",
  acos_: "acos",
  atan_: "atan",
  atan2_: "atan2",
  sinh_: "sinh",
  cosh_: "cosh",
  tanh_: "tanh",
  exp_: "exp",
  log_: "log",
  log2_: "log2",
  log10_: "log10",
  sqrt_: "sqrt"
};

type AsyncKind = "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt";
const ASYNC_ATTR_TO_KIND: Record<string, AsyncKind> = {
  set_delay: "setDelay",
  var_interp: "varInterp",
  ptr_interp: "ptrInterp",
  anim_start: "animStart",
  anim_stop: "animStop",
  anim_stop_at: "animStopAt"
};

function matchAsyncCall(expr: GExpr): { kind: AsyncKind; args: GExpr[] } | undefined {
  if (expr.t !== "call" || expr.callee.t !== "attr" || identName(expr.callee.base) !== "rt") {
    return undefined;
  }
  const kind = ASYNC_ATTR_TO_KIND[expr.callee.name];
  return kind ? { kind, args: expr.args } : undefined;
}

const FACTORY_KIND: Record<string, StateKind> = {
  delay_state: "delay",
  don_state: "doN",
  multi_gate_state: "multiGate",
  wait_all_state: "waitAll",
  throttle_state: "throttle"
};

const VECTOR_MATRIX_DEFAULTS: Record<string, number[]> = {
  float2: [0, 0],
  float3: [0, 0, 0],
  float4: [0, 0, 0, 0],
  float2x2: [1, 0, 0, 1],
  float3x3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  float4x4: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

type Ctx = { kind: "proc" } | { kind: "handler"; handlerKind: HandlerKind };
type HandlerDesc = { kind: HandlerKind; eventRef?: number; config?: Record<string, unknown>; funcName: string };

class ModuleParser {
  diagnostics: Diagnostic[] = [];

  variables: IRVariable[] = [];
  events: IREvent[] = [];
  stateSlots: IRStateSlot[] = [];
  procs: IRProc[] = [];
  handlers: IRHandler[] = [];

  private varIndexByName = new Map<string, number>();
  private eventIndexByName = new Map<string, number>();
  private stateSlotIndexByName = new Map<string, number>();
  private procIndexByName = new Map<string, number>();
  // name -> raw (unlowered) body of a `contN` top-level func, populated by
  // `run()`'s classification pass, consumed lazily by `lowerContBody`.
  private contRawBodies = new Map<string, GStmt[]>();
  private contBodyCache = new Map<string, IRStmt>();
  // Per-handler/proc/cont-body-scoped temp-name -> IRType map, reset before
  // lowering each body (mirrors parse-py's identically-scoped
  // `tempTypeByName`).
  private tempTypeByName = new Map<string, IRType>();
  // Best-effort "current statement" source line for diagnostic messages —
  // set by `lowerBlock`'s loop and by every top-level structural check in
  // `run()`/`parseBuildBody` right before it might fail; read by `fail()`.
  // Simpler than threading a line number through every expression-lowering
  // helper's signature (mirrors emit-gd's own mutable `originNodeId`
  // context-tracking style for its error messages).
  private currentLine = 0;

  private fail(code: string, message: string): never {
    throw new ParseError(code, `${message} at line ${this.currentLine}`);
  }

  run(topStmts: GStmt[]): IRModule {
    let i = 0;

    const s0 = topStmts[i];
    this.currentLine = s0?.line ?? 0;
    if (!s0 || s0.t !== "extends" || s0.name !== "RefCounted") {
      this.fail("GG100", "expected `extends RefCounted` as the module's first statement");
    }
    i += 1;

    const expectClassVar = (name: string) => {
      const s = topStmts[i];
      this.currentLine = s?.line ?? this.currentLine;
      if (!s || s.t !== "classVar" || s.name !== name) {
        this.fail("GG100", `expected \`var ${name}\` at this position`);
      }
      i += 1;
    };
    expectClassVar("m");
    expectClassVar("rt");
    expectClassVar("V");
    expectClassVar("E");

    const stateSlotNames: string[] = [];
    while (topStmts[i] && topStmts[i].t === "classVar") {
      stateSlotNames.push((topStmts[i] as Extract<GStmt, { t: "classVar" }>).name);
      i += 1;
    }

    const buildFn = topStmts[i];
    this.currentLine = buildFn?.line ?? this.currentLine;
    if (!buildFn || buildFn.t !== "funcDef" || buildFn.name !== "build") {
      this.fail("GG100", "expected `func build(_rt) -> void:` immediately after the class-field declarations");
    }
    if (buildFn.params.length !== 1 || buildFn.params[0].name !== "_rt") {
      this.fail("GG100", "expected `build` to take a single untyped parameter named `_rt`");
    }
    i += 1;

    const handlerDescs = this.parseBuildBody(buildFn.body, stateSlotNames);

    const restStmts = topStmts.slice(i);
    const funcMap = new Map<string, Extract<GStmt, { t: "funcDef" }>>();
    for (const s of restStmts) {
      this.currentLine = s.line;
      if (s.t !== "funcDef") {
        this.fail("GG105", "expected only top-level `func` definitions after `build`");
      }
      funcMap.set(s.name, s);
    }

    // Classification pass (see this file's own header note): a handler-
    // registered name is a handler body; a `contN`-shaped remaining name is
    // a continuation (lowered lazily, on first reference); everything else
    // is a proc, assigned an id in file order.
    const handlerFuncNames = new Set(handlerDescs.map((h) => h.funcName));
    const procRawBodies: Array<{ id: number; body: GStmt[] }> = [];
    for (const s of restStmts) {
      const fn = s as Extract<GStmt, { t: "funcDef" }>;
      if (handlerFuncNames.has(fn.name)) {
        continue;
      }
      if (/^cont\d+$/.test(fn.name)) {
        this.contRawBodies.set(fn.name, fn.body);
        continue;
      }
      const id = this.procs.length;
      this.procIndexByName.set(fn.name, id);
      this.procs.push({ id, name: fn.name, body: { k: "seq", stmts: [] } });
      procRawBodies.push({ id, body: fn.body });
    }

    procRawBodies.forEach(({ id, body }) => {
      this.tempTypeByName = new Map();
      this.procs[id] = { ...this.procs[id], body: this.lowerBlock(body, { kind: "proc" }) };
    });

    handlerDescs.forEach((desc) => {
      const fn = funcMap.get(desc.funcName);
      this.currentLine = buildFn.line;
      if (!fn) {
        this.fail("GG104", `handler registration references undefined function "${desc.funcName}"`);
      }
      this.tempTypeByName = new Map();
      const body = this.lowerBlock(fn.body, { kind: "handler", handlerKind: desc.kind });
      this.handlers.push({ kind: desc.kind, eventRef: desc.eventRef, config: desc.config, params: HANDLER_PARAMS[desc.kind], body });
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

  // `build()`'s body: `rt = _rt`, `V = rt.vars([...])`, `E =
  // rt.events([...])`, one state-slot init assignment per declared slot
  // field (in field-declaration order), then zero or more handler-
  // registration calls. Returns the handler descriptors for `run()` to
  // resolve against the file's remaining top-level funcs.
  private parseBuildBody(bodyStmts: GStmt[], stateSlotNames: string[]): HandlerDesc[] {
    let j = 0;

    const s0 = bodyStmts[j];
    this.currentLine = s0?.line ?? this.currentLine;
    if (!s0 || s0.t !== "assign" || identName(s0.target) !== "rt") {
      this.fail("GG100", "expected `rt = _rt` as build()'s first statement");
    }
    j += 1;

    const s1 = bodyStmts[j];
    this.currentLine = s1?.line ?? this.currentLine;
    const varsCall = s1 && s1.t === "assign" && identName(s1.target) === "V" ? matchAttrCall(s1.value, "rt", "vars") : undefined;
    if (!varsCall) {
      this.fail("GG101", "expected `V = rt.vars([...])` as build()'s second statement");
    }
    this.parseVars(varsCall.args[0]);
    j += 1;

    const s2 = bodyStmts[j];
    this.currentLine = s2?.line ?? this.currentLine;
    const eventsCall = s2 && s2.t === "assign" && identName(s2.target) === "E" ? matchAttrCall(s2.value, "rt", "events") : undefined;
    if (!eventsCall) {
      this.fail("GG102", "expected `E = rt.events([...])` as build()'s third statement");
    }
    this.parseEvents(eventsCall.args[0]);
    j += 1;

    for (const slotName of stateSlotNames) {
      const s = bodyStmts[j];
      this.currentLine = s?.line ?? this.currentLine;
      if (!s || s.t !== "assign" || identName(s.target) !== slotName) {
        this.fail("GG103", `expected a state-slot init assignment for "${slotName}"`);
      }
      const value = s.value;
      let kind: StateKind | undefined;
      let config: Record<string, unknown> = {};
      if (value.t === "num" && !value.isFloat) {
        kind = "for";
        config = { initialIndex: Math.trunc(value.value) };
      } else if (value.t === "call" && value.callee.t === "attr" && identName(value.callee.base) === "rt") {
        kind = FACTORY_KIND[value.callee.name];
      }
      if (!kind) {
        this.fail("GG103", `unrecognized state-slot init shape for "${slotName}"`);
      }
      const idx = this.stateSlots.length;
      this.stateSlots.push({ name: slotName, kind, config });
      this.stateSlotIndexByName.set(slotName, idx);
      j += 1;
    }

    const handlerDescs: HandlerDesc[] = [];
    while (j < bodyStmts.length) {
      const s = bodyStmts[j];
      this.currentLine = s.line;
      if (s.t !== "exprStmt" || s.expr.t !== "call" || s.expr.callee.t !== "attr" || identName(s.expr.callee.base) !== "rt") {
        this.fail("GG104", "expected a handler-registration call (rt.on_start/rt.on_tick/rt.on_receive/rt.on_select/rt.on_hover_in/rt.on_hover_out)");
      }
      const attrName = s.expr.callee.name;
      const args = s.expr.args;
      if (attrName === "on_start") {
        const fnName = identName(args[0]);
        if (fnName === undefined) this.fail("GG104", "rt.on_start's argument must be a bare function reference");
        handlerDescs.push({ kind: "onStart", funcName: fnName });
      } else if (attrName === "on_tick") {
        const fnName = identName(args[0]);
        if (fnName === undefined) this.fail("GG104", "rt.on_tick's argument must be a bare function reference");
        handlerDescs.push({ kind: "onTick", funcName: fnName });
      } else if (attrName === "on_receive") {
        const eventRef = this.readEventIndex(args[0]);
        const fnName = identName(args[1]);
        if (eventRef === undefined) this.fail("GG104", 'rt.on_receive\'s first argument must be a numeric literal or E["<name>"]');
        if (fnName === undefined) this.fail("GG104", "rt.on_receive's second argument must be a bare function reference");
        handlerDescs.push({ kind: "receive", eventRef, funcName: fnName });
      } else if (attrName === "on_select") {
        const nodeIndex = numLit(args[0]);
        const stopPropagation = boolLit(args[1]);
        const fnName = identName(args[2]);
        if (nodeIndex === undefined) this.fail("GG104", "rt.on_select's first argument must be a numeric node-index literal");
        if (stopPropagation === undefined) this.fail("GG104", "rt.on_select's second argument must be a boolean literal (stop_propagation)");
        if (fnName === undefined) this.fail("GG104", "rt.on_select's third argument must be a bare function reference");
        handlerDescs.push({ kind: "onSelect", config: { nodeIndex: Math.trunc(nodeIndex), stopPropagation }, funcName: fnName });
      } else if (attrName === "on_hover_in" || attrName === "on_hover_out") {
        const nodeIndex = numLit(args[0]);
        const fnName = identName(args[1]);
        if (nodeIndex === undefined) this.fail("GG104", "rt.on_hover_in/rt.on_hover_out's first argument must be a numeric node-index literal");
        if (fnName === undefined) this.fail("GG104", "rt.on_hover_in/rt.on_hover_out's second argument must be a bare function reference");
        handlerDescs.push({ kind: attrName === "on_hover_in" ? "onHoverIn" : "onHoverOut", config: { nodeIndex: Math.trunc(nodeIndex) }, funcName: fnName });
      } else {
        this.fail("GG104", `unrecognized handler-registration call "rt.${attrName}"`);
      }
      j += 1;
    }
    return handlerDescs;
  }

  // -------------------------------------------------------------------
  // vars / events
  // -------------------------------------------------------------------

  // `V = rt.vars([["counter1", rt.int_var(0)], ...])` — an ARRAY of
  // [name, declCall] pairs (not a dict — mirrors emit-gd's own `vars()`
  // convention, see emit.ts's `emitVars` doc comment for why: it sidesteps
  // ever needing to rely on GDScript Dictionary insertion-order
  // preservation). Array element order IS the variable index order. An
  // OPTIONAL third element carries the source graph variable's original id
  // (see emit.ts's emitVars doc comment): `["counter1", rt.int_var(0),
  // "the-id"]`.
  private parseVars(arg: GExpr) {
    if (arg.t !== "array") this.fail("GG101", "rt.vars expects an array literal argument");
    arg.items.forEach((pair) => {
      if (pair.t !== "array" || (pair.items.length !== 2 && pair.items.length !== 3)) {
        this.fail("GG101", "rt.vars element must be a [name, declCall] or [name, declCall, id] tuple");
      }
      const name = strLit(pair.items[0]);
      if (name === undefined) this.fail("GG101", "rt.vars pair's first element must be a string literal");
      const decl = this.parseVarDeclShorthand(pair.items[1]);
      const id = pair.items.length === 3 ? strLit(pair.items[2]) : undefined;
      const idx = this.variables.length;
      this.variables.push({ name, type: decl.type, initial: { type: decl.type, data: decl.data as never }, extras: id ? { id } : undefined });
      this.varIndexByName.set(name, idx);
    });
  }

  // `rt.int_var(0)`/`rt.bool_var(false)`/`rt.float_var(0.0)`/`rt.float2(x,
  // y)`/.../`rt.ref_var(s)` — inverse of emit-gd's `varDeclCall`, mirrors
  // engine.gd's own factory methods' defaults.
  private parseVarDeclShorthand(init: GExpr): { type: IRType; data: Array<number | boolean | string> } {
    if (init.t !== "call" || init.callee.t !== "attr" || identName(init.callee.base) !== "rt") {
      this.fail("GG101", "rt.vars value must be an rt.<type>(...) declaration helper call");
    }
    const attrName = init.callee.name;
    const args = init.args;
    const type = attrName.endsWith("_var") ? attrName.slice(0, -4) : attrName;
    if (type === "bool") return { type: "bool", data: [args[0] ? (boolLit(args[0]) ?? false) : false] };
    if (type === "ref") return { type: "ref", data: [args[0] ? (strLit(args[0]) ?? "") : ""] };
    if (type === "int") return { type: "int", data: [args[0] ? Math.trunc(numLit(args[0]) ?? 0) : 0] };
    if (type === "float") return { type: "float", data: [args[0] ? (numLit(args[0]) ?? 0) : 0] };
    if (!(type in VECTOR_MATRIX_DEFAULTS)) this.fail("GG101", `unknown rt.${attrName}(...) variable-declaration helper`);
    const nums = args.map((a) => numLit(a) ?? 0);
    return { type: type as IRType, data: nums.length > 0 ? nums : VECTOR_MATRIX_DEFAULTS[type] };
  }

  // `E = rt.events([["Explode", {...}], ...])` — same array-of-pairs
  // convention as `parseVars`.
  private parseEvents(arg: GExpr) {
    if (arg.t !== "array") this.fail("GG102", "rt.events expects an array literal argument");
    arg.items.forEach((pair) => {
      if (pair.t !== "array" || pair.items.length !== 2) this.fail("GG102", "rt.events element must be a [name, dict] pair");
      const name = strLit(pair.items[0]);
      if (name === undefined) this.fail("GG102", "rt.events pair's first element must be a string literal");
      const dictNode = pair.items[1];
      if (dictNode.t !== "dict") this.fail("GG102", "rt.events pair's second element must be a dict literal");
      const { externalId, values } = this.parseEventValues(dictNode);
      const idx = this.events.length;
      this.events.push({ name, id: externalId, values });
      this.eventIndexByName.set(name, idx);
    });
  }

  private parseEventValues(dict: Extract<GExpr, { t: "dict" }>): { externalId: string | undefined; values: IREventValue[] } {
    const field = (key: string) => dict.entries.find((e) => e.key === key)?.value;
    const externalId = strLit(field("externalId"));
    const values: IREventValue[] = [];
    const boolExpr = field("defaultBool");
    if (boolExpr) values.push({ name: "boolParameter", type: "bool", default: { type: "bool", data: [boolLit(boolExpr) ?? false] } });
    const intExpr = field("defaultInt");
    if (intExpr) values.push({ name: "intParameter", type: "int", default: { type: "int", data: [Math.trunc(numLit(intExpr) ?? 0)] } });
    const floatExpr = field("defaultFloat");
    if (floatExpr) values.push({ name: "floatParameter", type: "float", default: { type: "float", data: [numLit(floatExpr) ?? 0] } });
    const durExpr = field("expectedDuration");
    if (durExpr) values.push({ name: "expectedDuration", type: "float", default: { type: "float", data: [numLit(durExpr) ?? 0] } });
    return { externalId, values };
  }

  // Reconstructs `rt.send`'s 4 fixed payload args (bool,int,float,duration)
  // from the event's OWN declared defaults, for the args-less
  // `rt.send(eventArg)` shape — see emit-gd's `emitEvent`/
  // `matchesEventDefaults` doc comment.
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

  // `E["<name>"]` resolves through `eventIndexByName`; a bare numeric
  // literal resolves directly.
  private readEventIndex(expr: GExpr | undefined): number | undefined {
    if (!expr) return undefined;
    const n = numLit(expr);
    if (n !== undefined) return Math.trunc(n);
    if (expr.t === "index" && expr.base.t === "ident" && expr.base.name === "E" && expr.index.t === "str") {
      return this.eventIndexByName.get(expr.index.value);
    }
    return undefined;
  }

  // Lowers (and memoizes) a `contN` continuation's body on first reference
  // — see this file's header note on why continuations are resolved by
  // name against a pool built up-front rather than inlined at their
  // definition site the way parse-py's nested-`def` continuations are.
  // Lowered with `{kind:"proc"}` context: a Cont body only ever touches
  // module state, never a caller's params/temps (IR's GI105 invariant),
  // exactly the same reasoning parse-py's own `emitCont`-inverse relies on.
  private lowerContBody(name: string): IRStmt {
    const cached = this.contBodyCache.get(name);
    if (cached) return cached;
    const raw = this.contRawBodies.get(name);
    if (!raw) this.fail("GG122", `unknown continuation reference "${name}"`);
    const savedTemps = this.tempTypeByName;
    this.tempTypeByName = new Map();
    const body = this.lowerBlock(raw, { kind: "proc" });
    this.tempTypeByName = savedTemps;
    this.contBodyCache.set(name, body);
    return body;
  }

  // -------------------------------------------------------------------
  // Statement lowering
  // -------------------------------------------------------------------

  private lowerBlock(stmts: GStmt[], ctx: Ctx): IRStmt {
    const out: IRStmt[] = [];
    let i = 0;
    while (i < stmts.length) {
      this.currentLine = stmts[i].line;
      const { stmt, consumed } = this.lowerOne(stmts, i, ctx);
      if (stmt) out.push(stmt);
      i += consumed;
    }
    return { k: "seq", stmts: out };
  }

  private lowerOptionalBlock(stmts: GStmt[], ctx: Ctx): IRStmt | undefined {
    const result = this.lowerBlock(stmts, ctx);
    return result.k === "seq" && result.stmts.length === 0 ? undefined : result;
  }

  private lowerOne(stmts: GStmt[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const s = stmts[i];

    if (s.t === "pass") {
      return { stmt: null, consumed: 1 };
    }

    const resetResult = this.tryParseReset(stmts, i);
    if (resetResult) return resetResult;

    const asyncResult = this.tryParseAsync(stmts, i, ctx);
    if (asyncResult) return asyncResult;

    if (s.t === "varLocal") {
      return this.lowerVarLocal(stmts, i, ctx);
    }

    if (s.t === "assign") {
      if (s.target.t === "attr" && identName(s.target.base) === "V") {
        const varId = this.varIndexByName.get(s.target.name);
        if (varId === undefined) this.fail("GG123", `assignment to unknown variable "V.${s.target.name}"`);
        const varType = this.variables[varId].type;
        return { stmt: { k: "setVar", varId, expr: this.lowerExpr(s.value, varType, ctx) }, consumed: 1 };
      }
      if (s.target.t === "ident") {
        const forResult = this.tryParseFor(stmts, i, ctx);
        if (forResult) return forResult;
      }
      this.fail("GG110", "unrecognized assignment-statement shape");
    }

    if (s.t === "exprStmt") {
      return this.lowerExprStmt(stmts, i, ctx);
    }

    if (s.t === "if") {
      return this.lowerIf(stmts, i, ctx);
    }

    if (s.t === "while") {
      const cond = this.lowerExpr(s.cond, "bool", ctx);
      const body = this.lowerBlock(s.body, ctx);
      return { stmt: { k: "while", cond, body }, consumed: 1 };
    }

    this.fail("GG110", `unrecognized statement shape (kind "${s.t}")`);
  }

  // -------------------------------------------------------------------
  // resets — throttle/doN/multiGate/waitAll's `port: "reset"` shapes.
  // -------------------------------------------------------------------

  private tryParseReset(stmts: GStmt[], i: number): { stmt: IRStmt; consumed: number } | null {
    const s = stmts[i];

    // throttle reset: `<slot>.erase("lastTime")` + `<slot>["remaining"] = NAN`.
    if (s.t === "exprStmt") {
      const call = s.expr;
      if (call.t === "call" && call.callee.t === "attr" && call.callee.name === "erase" && call.callee.base.t === "ident") {
        const slotName = call.callee.base.name;
        const slotIdx = this.stateSlotIndexByName.get(slotName);
        if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "throttle") {
          const next = stmts[i + 1];
          if (next && next.t === "assign" && next.target.t === "index" && identName(next.target.base) === slotName && next.target.index.t === "str" && next.target.index.value === "remaining") {
            return { stmt: { k: "stateful", kind: "throttle", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
          }
        }
      }
      return null;
    }

    if (s.t !== "assign" || s.target.t !== "index" || s.target.base.t !== "ident" || s.target.index.t !== "str") {
      return null;
    }
    const slotName = s.target.base.name;
    const key = s.target.index.value;
    const slotIdx = this.stateSlotIndexByName.get(slotName);
    if (slotIdx === undefined) return null;
    const kind = this.stateSlots[slotIdx].kind;

    if (kind === "doN" && key === "count") {
      return { stmt: { k: "stateful", kind: "doN", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 1 };
    }
    if (kind === "multiGate" && key === "used") {
      const next = stmts[i + 1];
      if (next && next.t === "assign" && next.target.t === "index" && identName(next.target.base) === slotName && next.target.index.t === "str" && next.target.index.value === "lastIndex") {
        return { stmt: { k: "stateful", kind: "multiGate", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
      }
    }
    if (kind === "waitAll" && key === "activated") {
      const next = stmts[i + 1];
      if (next && next.t === "assign" && next.target.t === "index" && identName(next.target.base) === slotName && next.target.index.t === "str" && next.target.index.value === "remaining") {
        const n = numLit(next.value);
        if (n !== undefined) {
          this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(n) } };
        }
        return { stmt: { k: "stateful", kind: "waitAll", slot: { slot: slotIdx }, port: "reset", args: [], outs: {} }, consumed: 2 };
      }
    }
    return null;
  }

  // -------------------------------------------------------------------
  // async ops — bare/`if <call>["ok"]:`/negated-`if not <call>["ok"]:`.
  // Unlike parse-py's `tryParseAsync`, there is no inline-continuation
  // lookahead here at all (see this file's own header note) — the "done"
  // reference is resolved purely from the call's own last argument.
  // -------------------------------------------------------------------

  private tryParseAsync(stmts: GStmt[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const s = stmts[i];

    if (s.t === "exprStmt") {
      const matched = matchAsyncCall(s.expr);
      return matched ? { stmt: this.buildAsyncStmt(matched, undefined, undefined, ctx), consumed: 1 } : undefined;
    }

    if (s.t === "if") {
      if (s.elifs.length === 0) {
        const okBase = indexStrKey(s.cond, "ok");
        const matched = okBase ? matchAsyncCall(okBase) : undefined;
        if (matched) {
          return { stmt: this.buildAsyncStmt(matched, s.then, s.else, ctx), consumed: 1 };
        }
        if (s.cond.t === "unary" && s.cond.op === "not" && !s.else) {
          const innerOk = indexStrKey(s.cond.operand, "ok");
          const negMatched = innerOk ? matchAsyncCall(innerOk) : undefined;
          if (negMatched) {
            return { stmt: this.buildAsyncStmt(negMatched, undefined, s.then, ctx), consumed: 1 };
          }
        }
      }
    }
    return undefined;
  }

  private buildAsyncStmt(matched: { kind: AsyncKind; args: GExpr[] }, outStmts: GStmt[] | undefined, errStmts: GStmt[] | undefined, ctx: Ctx): IRStmt {
    const args = matched.args;
    const kind = matched.kind;
    let lastArg: GExpr | undefined;
    const baseStmt: Partial<Extract<IRStmt, { k: "async" }>> = { k: "async", kind };

    if (kind === "setDelay") {
      const [slotExpr, durationExpr, doneExpr] = args;
      baseStmt.slot = this.slotRefOf(slotExpr);
      baseStmt.args = [this.lowerExpr(durationExpr, "float", ctx)];
      lastArg = doneExpr;
    } else if (kind === "varInterp") {
      const [varIdExpr, valueExpr, durationExpr, p1Expr, p2Expr, useSlerpExpr, doneExpr] = args;
      const varId = Math.trunc(numLit(varIdExpr) ?? this.fail("GG126", "var_interp's first argument must be a numeric literal"));
      const varType = this.variables[varId]?.type ?? "float";
      baseStmt.config = { varId, useSlerp: boolLit(useSlerpExpr) ?? false };
      baseStmt.args = [
        this.lowerExpr(valueExpr, varType, ctx),
        this.lowerExpr(durationExpr, "float", ctx),
        this.lowerExpr(p1Expr, "float2", ctx),
        this.lowerExpr(p2Expr, "float2", ctx)
      ];
      lastArg = doneExpr;
    } else if (kind === "ptrInterp") {
      const hasArgsObj = args.length >= 2 && args[1].t === "dict";
      const [pointerExpr, argsObjExpr, typeExpr, valueExpr, durationExpr, p1Expr, p2Expr, doneExpr] = hasArgsObj
        ? args
        : [args[0], undefined, args[1], args[2], args[3], args[4], args[5], args[6]];
      const pointerLit = strLit(pointerExpr) ?? this.fail("GG126", "ptr_interp pointer must be a string literal");
      const template = parsePointerTemplate(pointerLit);
      const type = (strLit(typeExpr) as IRType | undefined) ?? this.fail("GG126", "ptr_interp type must be a string literal");
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

    if (lastArg) {
      if (lastArg.t === "call" && identName(lastArg.callee) === "Callable" && lastArg.args.length === 0) {
        // `Callable()` — no continuation.
      } else if (lastArg.t === "ident") {
        const name = lastArg.name;
        if (this.procIndexByName.has(name)) {
          baseStmt.done = { kind: "proc", procId: this.procIndexByName.get(name)! } as Cont;
        } else if (this.contRawBodies.has(name)) {
          baseStmt.done = { kind: "inline", body: this.lowerContBody(name) } as Cont;
        } else {
          this.fail("GG122", `unknown async done-continuation reference "${name}"`);
        }
      } else {
        this.fail("GG126", "async done continuation must be a proc/continuation reference or Callable()");
      }
    }

    baseStmt.out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    baseStmt.err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return baseStmt as IRStmt;
  }

  // -------------------------------------------------------------------
  // varLocal (`var <name> = <expr>`) — throttle-in / multiGate-in / switch-
  // selector-hoist / plain temp, in that dispatch order.
  // -------------------------------------------------------------------

  private lowerVarLocal(stmts: GStmt[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const s = stmts[i] as Extract<GStmt, { t: "varLocal" }>;
    const throttleCall = matchAttrCall(s.init, "rt", "throttle");
    if (throttleCall) return this.parseThrottleIn(stmts, i, s.name, throttleCall.args, ctx);
    const mgCall = matchAttrCall(s.init, "rt", "multi_gate");
    if (mgCall) return this.parseMultiGateIn(stmts, i, s.name, mgCall.args, ctx);
    const switchResult = this.tryParseSwitchAfterLet(stmts, i, s.name, s.init, ctx);
    if (switchResult) return switchResult;
    const expr = this.lowerExpr(s.init, undefined, ctx);
    const type = this.typeOfExpr(expr);
    this.tempTypeByName.set(s.name, type);
    return { stmt: { k: "let", temp: s.name, type, expr }, consumed: 1 };
  }

  private parseThrottleIn(stmts: GStmt[], i: number, resName: string, args: GExpr[], ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const slot = this.slotRefOf(args[0]);
    const durationArgs = [this.lowerExpr(args[1], "float", ctx)];
    const outs: Record<string, IRStmt> = {};
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && next.t === "if" && next.elifs.length === 1 && !next.else) {
      const invalidBase = indexStrKey(next.cond, "invalid");
      const fireBase = indexStrKey(next.elifs[0].cond, "fire");
      if (invalidBase && identName(invalidBase) === resName && fireBase && identName(fireBase) === resName) {
        const errBlock = this.lowerOptionalBlock(next.then, ctx);
        const outBlock = this.lowerOptionalBlock(next.elifs[0].body, ctx);
        if (errBlock) outs.err = errBlock;
        if (outBlock) outs.out = outBlock;
        consumed = 2;
      }
    }
    return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args: durationArgs, outs }, consumed };
  }

  private parseMultiGateIn(stmts: GStmt[], i: number, resName: string, args: GExpr[], ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const base = this.buildMultiGateStmt(args);
    let consumed = 1;
    const next = stmts[i + 1];
    if (next && next.t === "if" && !next.else) {
      const clauses = [{ cond: next.cond, body: next.then }, ...next.elifs];
      const matches = clauses.map((c) => matchIndexEq(c.cond, "index"));
      if (matches.every((m) => m && identName(m.base) === resName)) {
        clauses.forEach((clause, idx) => {
          const num = numLit(matches[idx]!.rhs);
          if (num === undefined) this.fail("GG128", "multiGate switch case must be a numeric literal");
          base.outs[String(Math.trunc(num))] = this.lowerBlock(clause.body, ctx);
        });
        consumed = 2;
      }
    }
    return { stmt: base, consumed };
  }

  private buildMultiGateStmt(args: GExpr[]): Extract<IRStmt, { k: "stateful" }> {
    const [slotExpr, , isRandomExpr, isLoopExpr] = args;
    const slot = this.slotRefOf(slotExpr);
    const isRandom = boolLit(isRandomExpr) ?? false;
    const isLoop = boolLit(isLoopExpr) ?? false;
    this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { isRandom, isLoop } };
    return { k: "stateful", kind: "multiGate", slot, port: "in", args: [], outs: {} };
  }

  // -------------------------------------------------------------------
  // flow/switch — `var <name> = <selector>` immediately followed by
  // `if <name> == C0: ... elif <name> == C1: ... [else: ...]`, or (empty-
  // cases-with-default) `if true: ...`. See emit-gd's `emitSwitch` doc
  // comment. Vastly simpler than parse-py's/parse-lua's own equivalent —
  // see this file's own header note on why `elif` needs no chain-walking
  // disambiguation here.
  // -------------------------------------------------------------------

  private tryParseSwitchAfterLet(stmts: GStmt[], i: number, name: string, initExpr: GExpr, ctx: Ctx): { stmt: IRStmt; consumed: number } | undefined {
    const next = stmts[i + 1];
    if (!next || next.t !== "if") return undefined;

    if (next.elifs.length === 0 && !next.else && next.cond.t === "bool" && next.cond.value === true) {
      const selector = this.lowerExpr(initExpr, "int", ctx);
      return { stmt: { k: "switch", selector, cases: [], default: this.lowerBlock(next.then, ctx) }, consumed: 2 };
    }

    const isCaseEq = (cond: GExpr): number | undefined => {
      if (cond.t !== "binary" || cond.op !== "==" || identName(cond.left) !== name || cond.right.t !== "num" || cond.right.isFloat) {
        return undefined;
      }
      return Math.trunc(cond.right.value);
    };
    const firstCase = isCaseEq(next.cond);
    if (firstCase === undefined) return undefined;

    const cases: Array<[number, IRStmt]> = [[firstCase, this.lowerBlock(next.then, ctx)]];
    for (const clause of next.elifs) {
      const c = isCaseEq(clause.cond);
      if (c === undefined) this.fail("GG130", "switch elif-chain case must be a numeric-literal equality test against the selector");
      cases.push([c, this.lowerBlock(clause.body, ctx)]);
    }
    const selector = this.lowerExpr(initExpr, "int", ctx);
    const dflt = next.else ? this.lowerBlock(next.else, ctx) : undefined;
    return { stmt: { k: "switch", selector, cases, default: dflt }, consumed: 2 };
  }

  // -------------------------------------------------------------------
  // for — `<slot> = <start>` + `while <slot> < (<end>): <body>; <slot> =
  // <slot> + 1`. See emit-gd's `emitFor` doc comment.
  // -------------------------------------------------------------------

  private tryParseFor(stmts: GStmt[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } | null {
    const s = stmts[i] as Extract<GStmt, { t: "assign" }>;
    const slotName = identName(s.target);
    if (slotName === undefined) return null;
    const slotIdx = this.stateSlotIndexByName.get(slotName);
    if (slotIdx === undefined || this.stateSlots[slotIdx].kind !== "for") return null;

    const next = stmts[i + 1];
    if (!next || next.t !== "while") this.fail("GG129", "expected a `while` loop following a for-slot assignment");
    if (next.cond.t !== "binary" || next.cond.op !== "<" || identName(next.cond.left) !== slotName) {
      this.fail("GG129", "expected `<slot> < (end)` for a for-loop condition");
    }
    const start = this.lowerExpr(s.value, "int", ctx);
    const end = this.lowerExpr(next.cond.right, "int", ctx);
    const bodyStmts = next.body;
    const last = bodyStmts[bodyStmts.length - 1];
    if (!last || last.t !== "assign" || identName(last.target) !== slotName) {
      this.fail("GG129", "expected the for-loop body's last statement to be the index increment");
    }
    const body = this.lowerBlock(bodyStmts.slice(0, -1), ctx);
    return { stmt: { k: "for", slot: { slot: slotIdx }, start, end, body }, consumed: 2 };
  }

  private slotRefOf(expr: GExpr): { slot: number } {
    const name = identName(expr);
    if (name === undefined) this.fail("GG127", "expected a state-slot identifier");
    const idx = this.stateSlotIndexByName.get(name);
    if (idx === undefined) this.fail("GG127", `unknown state slot "${name}"`);
    return { slot: idx };
  }

  // -------------------------------------------------------------------
  // exprStmt dispatch (bare calls).
  // -------------------------------------------------------------------

  private lowerExprStmt(stmts: GStmt[], i: number, ctx: Ctx): { stmt: IRStmt | null; consumed: number } {
    const s = stmts[i] as Extract<GStmt, { t: "exprStmt" }>;
    const call = s.expr;
    if (call.t !== "call") {
      this.fail("GG110", "unrecognized expression statement (a bare non-call expression is never emitted by this backend)");
    }

    const cancelSlot = matchAttrCall(call, "rt", "cancel_delay_slot");
    if (cancelSlot) {
      const slot = this.slotRefOf(cancelSlot.args[0]);
      return { stmt: { k: "intrinsic", op: "flow/setDelay#cancel", config: { slot: slot.slot }, args: [], outs: {} }, consumed: 1 };
    }
    const cancelDelay = matchAttrCall(call, "rt", "cancel_delay");
    if (cancelDelay) {
      const refExpr = this.lowerExpr(cancelDelay.args[0], "ref", ctx);
      return { stmt: { k: "intrinsic", op: "flow/cancelDelay", config: {}, args: [refExpr], outs: {} }, consumed: 1 };
    }
    // Pure emit-time bookkeeping (crossHandlerReads), not part of the IR
    // model — see emit-gd's `emitEventOutWrites` doc comment.
    if (matchAttrCall(call, "rt", "event_out")) {
      return { stmt: null, consumed: 1 };
    }
    const ptrSetBare = matchAttrCall(call, "rt", "ptr_set");
    if (ptrSetBare) return { stmt: this.buildSetPointerStmt(ptrSetBare.args, undefined, undefined, ctx), consumed: 1 };

    const donBare = matchAttrCall(call, "rt", "don");
    if (donBare) {
      const [slotExpr, nExpr] = donBare.args;
      const slot = this.slotRefOf(slotExpr);
      return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args: [this.lowerExpr(nExpr, "int", ctx)], outs: {} }, consumed: 1 };
    }
    const mgBare = matchAttrCall(call, "rt", "multi_gate");
    if (mgBare) return { stmt: this.buildMultiGateStmt(mgBare.args), consumed: 1 };

    const waitAllBare = matchAttrCall(call, "rt", "wait_all");
    if (waitAllBare) return { stmt: this.buildWaitAllStmt(waitAllBare.args, undefined, undefined, ctx), consumed: 1 };

    const throttleBare = matchAttrCall(call, "rt", "throttle");
    if (throttleBare) {
      const [slotExpr, durationExpr] = throttleBare.args;
      const slot = this.slotRefOf(slotExpr);
      return { stmt: { k: "stateful", kind: "throttle", slot, port: "in", args: [this.lowerExpr(durationExpr, "float", ctx)], outs: {} }, consumed: 1 };
    }
    const send = matchAttrCall(call, "rt", "send");
    if (send) return { stmt: this.buildEmitEventStmt(send.args, ctx), consumed: 1 };

    const stopProp = matchAttrCall(call, "rt", "stop_propagation");
    if (stopProp) {
      const [, stopImmediateExpr] = stopProp.args;
      return { stmt: { k: "stopPropagation", stopImmediate: this.lowerExpr(stopImmediateExpr, "bool", ctx), config: {} }, consumed: 1 };
    }
    const log = matchAttrCall(call, "rt", "log_msg");
    if (log) {
      const template = strLit(log.args[0]) ?? "";
      const argList = log.args[1] && log.args[1].t === "array" ? log.args[1].items : [];
      return { stmt: { k: "log", template, args: argList.map((a) => this.lowerExpr(a, undefined, ctx)) }, consumed: 1 };
    }

    if (call.callee.t === "ident" && call.args.length === 0) {
      const procId = this.procIndexByName.get(call.callee.name);
      if (procId !== undefined) return { stmt: { k: "callProc", procId }, consumed: 1 };
    }
    this.fail("GG110", "unrecognized call statement (unknown callee)");
  }

  private buildEmitEventStmt(args: GExpr[], ctx: Ctx): IRStmt {
    const eventId = this.readEventIndex(args[0]);
    if (eventId === undefined) this.fail("GG124", 'rt.send\'s first argument must be a numeric literal or E["<name>"]');
    if (args.length === 1) {
      return { k: "emitEvent", eventId, args: this.eventDefaultArgs(eventId) };
    }
    const payload = args[1];
    if (!payload || payload.t !== "array" || payload.items.length !== 4) {
      this.fail("GG124", "rt.send's payload argument must be a 4-element array literal");
    }
    const types: IRType[] = ["bool", "int", "float", "float"];
    return { k: "emitEvent", eventId, args: payload.items.map((e, k) => this.lowerExpr(e, types[k], ctx)) };
  }

  private buildWaitAllStmt(args: GExpr[], completedStmts: GStmt[] | undefined, outStmts: GStmt[] | undefined, ctx: Ctx): IRStmt {
    const [slotExpr, inputFlowsExpr, indexExpr] = args;
    const slot = this.slotRefOf(slotExpr);
    const inputFlows = numLit(inputFlowsExpr);
    if (inputFlows !== undefined) {
      this.stateSlots[slot.slot] = { ...this.stateSlots[slot.slot], config: { ...this.stateSlots[slot.slot].config, inputFlows: Math.trunc(inputFlows) } };
    }
    const index = numLit(indexExpr) ?? 0;
    const outs: Record<string, IRStmt> = {};
    if (completedStmts) {
      const b = this.lowerOptionalBlock(completedStmts, ctx);
      if (b) outs.completed = b;
    }
    if (outStmts) {
      const b = this.lowerOptionalBlock(outStmts, ctx);
      if (b) outs.out = b;
    }
    return { k: "stateful", kind: "waitAll", slot, port: Math.trunc(index), args: [], outs };
  }

  // -------------------------------------------------------------------
  // if dispatch — doN-in-with-out / setPointer (direct + negated) /
  // waitAll / multiGate-single-output / async (delegated to
  // `tryParseAsync`) / negated-empty-then / plain flow/branch.
  // -------------------------------------------------------------------

  private lowerIf(stmts: GStmt[], i: number, ctx: Ctx): { stmt: IRStmt; consumed: number } {
    const s = stmts[i] as Extract<GStmt, { t: "if" }>;

    if (s.elifs.length === 0 && !s.else) {
      const donCall = matchAttrCall(s.cond, "rt", "don");
      if (donCall) {
        const [slotExpr, nExpr] = donCall.args;
        const slot = this.slotRefOf(slotExpr);
        const outs: Record<string, IRStmt> = {};
        const block = this.lowerOptionalBlock(s.then, ctx);
        if (block) outs.out = block;
        return { stmt: { k: "stateful", kind: "doN", slot, port: "in", args: [this.lowerExpr(nExpr, "int", ctx)], outs }, consumed: 1 };
      }
    }

    if (s.elifs.length === 0) {
      const ptrCall = matchAttrCall(s.cond, "rt", "ptr_set");
      if (ptrCall) {
        return { stmt: this.buildSetPointerStmt(ptrCall.args, s.then, s.else, ctx), consumed: 1 };
      }
      if (s.cond.t === "unary" && s.cond.op === "not" && !s.else) {
        const negPtr = matchAttrCall(s.cond.operand, "rt", "ptr_set");
        if (negPtr) {
          return { stmt: this.buildSetPointerStmt(negPtr.args, undefined, s.then, ctx), consumed: 1 };
        }
      }
    }

    if (s.elifs.length === 0) {
      const completedBase = indexStrKey(s.cond, "completed");
      const waitAllCall = completedBase ? matchAttrCall(completedBase, "rt", "wait_all") : undefined;
      if (waitAllCall) {
        return { stmt: this.buildWaitAllStmt(waitAllCall.args, s.then, s.else, ctx), consumed: 1 };
      }
    }

    if (s.elifs.length === 0 && !s.else) {
      const eq = matchIndexEq(s.cond, "index");
      const mgCall = eq ? matchAttrCall(eq.base, "rt", "multi_gate") : undefined;
      const caseNum = eq ? numLit(eq.rhs) : undefined;
      if (mgCall && caseNum !== undefined) {
        const stmtNode = this.buildMultiGateStmt(mgCall.args);
        stmtNode.outs[String(Math.trunc(caseNum))] = this.lowerBlock(s.then, ctx);
        return { stmt: stmtNode, consumed: 1 };
      }
    }

    const asyncResult = this.tryParseAsync(stmts, i, ctx);
    if (asyncResult) return asyncResult;

    if (s.elifs.length === 0 && !s.else && s.cond.t === "unary" && s.cond.op === "not") {
      const cond = this.lowerExpr(s.cond.operand, "bool", ctx);
      const elseBody = this.lowerBlock(s.then, ctx);
      return { stmt: { k: "if", cond, then: { k: "seq", stmts: [] }, else: elseBody }, consumed: 1 };
    }

    if (s.elifs.length > 0) {
      this.fail("GG110", "unrecognized elif-chain (not consumed by a switch/multiGate/throttle lookahead)");
    }

    const cond = this.lowerExpr(s.cond, "bool", ctx);
    const thenS = this.lowerBlock(s.then, ctx);
    const elseS = s.else ? this.lowerOptionalBlock(s.else, ctx) : undefined;
    return { stmt: { k: "if", cond, then: thenS, else: elseS }, consumed: 1 };
  }

  // -------------------------------------------------------------------
  // setPointer
  // -------------------------------------------------------------------

  private buildSetPointerStmt(argNodes: GExpr[], outStmts: GStmt[] | undefined, errStmts: GStmt[] | undefined, ctx: Ctx): IRStmt {
    const hasArgsObj = argNodes.length >= 2 && argNodes[1].t === "dict";
    const [pointerExpr, argsObjExpr, typeExpr, valueExpr] = hasArgsObj ? argNodes : [argNodes[0], undefined, argNodes[1], argNodes[2]];
    const pointerLit = strLit(pointerExpr) ?? this.fail("GG125", "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const type = (strLit(typeExpr) as IRType | undefined) ?? this.fail("GG125", "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, ctx);
    const value = this.lowerExpr(valueExpr, type, ctx);
    const out = outStmts ? this.lowerOptionalBlock(outStmts, ctx) : undefined;
    const err = errStmts ? this.lowerOptionalBlock(errStmts, ctx) : undefined;
    return { k: "setPointer", template, args, value, type, out, err };
  }

  private lowerPointerArgs(objExpr: GExpr | undefined, template: PtrTemplate, ctx: Ctx): IRExpr[] {
    const params = pointerTemplateParams(template);
    if (params.length === 0) return [];
    if (!objExpr || objExpr.t !== "dict") this.fail("GG125", "pointer args must be a dict literal");
    return params.map((p) => {
      const entry = objExpr.entries.find((e) => e.key === p.name);
      if (!entry) this.fail("GG125", `pointer args dict missing param "${p.name}"`);
      return this.lowerExpr(entry.value, p.kind === "int" ? "int" : "ref", ctx);
    });
  }

  // -------------------------------------------------------------------
  // Expression lowering.
  // -------------------------------------------------------------------

  private lowerExpr(expr: GExpr, expected: IRType | undefined, ctx: Ctx): IRExpr {
    if (expr.t === "num") {
      const type: IRType = expr.isFloat ? "float" : "int";
      return { k: "const", type, data: [type === "int" ? Math.trunc(expr.value) : expr.value] };
    }
    if (expr.t === "bool") return { k: "const", type: "bool", data: [expr.value] };
    if (expr.t === "str") return { k: "const", type: "ref", data: [expr.value] };
    if (expr.t === "array") {
      const nums = expr.items.map((e) => numLit(e) ?? this.fail("GG140", "array literal element must be a numeric literal"));
      const type = expected ?? lengthToType(nums.length, F_FAMILY) ?? this.fail("GG140", `cannot infer type for a ${nums.length}-element array literal`);
      return { k: "const", type, data: nums };
    }

    // `V.<name>` read.
    if (expr.t === "attr" && identName(expr.base) === "V") {
      const varId = this.varIndexByName.get(expr.name);
      if (varId === undefined) this.fail("GG123", `read of unknown variable "V.${expr.name}"`);
      return { k: "varGet", varId };
    }

    const native = this.tryLowerNativeOp(expr, ctx);
    if (native) return native;

    if (expr.t === "call" && expr.callee.t === "attr" && identName(expr.callee.base) === "rt") {
      const attrName = expr.callee.name;
      if (attrName === "random" && expr.args.length === 0) {
        const overload = resolveOverload("math/random", {})!;
        return { k: "op", op: "math/random", overload, args: [] };
      }
      if (attrName === "tick_time") return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceStart" }, args: [], type: "float" };
      if (attrName === "tick_delta") return { k: "intrinsic", op: "event/onTick#time", config: { field: "timeSinceLastTick" }, args: [], type: "float" };
      if (attrName === "event_out_read") {
        const [nodeExpr, socketExpr] = expr.args;
        const sourceNode = Math.trunc(numLit(nodeExpr) ?? 0);
        const socket = strLit(socketExpr) ?? "";
        this.diagnostics.push({ severity: "info", code: "GG180", message: `best-effort reconstruction of cross-handler read rt.event_out_read(${sourceNode}, "${socket}")` });
        return { k: "intrinsic", op: "event/unknown", config: { crossContext: true, socket, sourceNode }, args: [], type: expected ?? "ref" };
      }
    }

    if (expr.t === "index") {
      const base = expr.base;
      if (base.t === "call" && base.callee.t === "attr" && identName(base.callee.base) === "rt" && base.callee.name === "ptr_get" && expr.index.t === "str") {
        return this.lowerPtrGet(base.args, expr.index.value === "isValid", ctx);
      }
      if (base.t === "call" && base.callee.t === "attr" && identName(base.callee.base) === "rt" && base.callee.name === "event_payload" && expr.index.t === "num") {
        const eventIndex = this.readEventIndex(base.args[0]) ?? 0;
        const field = PAYLOAD_FIELDS[Math.trunc(expr.index.value)] ?? "boolParameter";
        const type: IRType = field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float";
        return { k: "intrinsic", op: "event/receive#payload", config: { eventIndex, field }, args: [], type };
      }
      if (base.t === "call" && base.callee.t === "attr" && identName(base.callee.base) === "m") {
        const socket = expr.index.t === "str" ? expr.index.value : expr.index.t === "num" ? String(Math.trunc(expr.index.value)) : undefined;
        if (socket === undefined) this.fail("GG143", "expected a literal socket index/name into a multi-output m.* call");
        return this.lowerMCall(base.args, base.callee.name, expected, ctx, socket);
      }
      if (base.t === "ident" && base.name === "payload" && ctx.kind === "handler" && ctx.handlerKind === "receive" && expr.index.t === "num") {
        const field = PAYLOAD_FIELDS[Math.trunc(expr.index.value)] ?? "boolParameter";
        const type: IRType = field === "boolParameter" ? "bool" : field === "intParameter" ? "int" : "float";
        return { k: "param", name: field, type };
      }
      // `params["<key>"]` — no destructuring step in this backend (see
      // emit-gd's header note): the handler's own `params: Dictionary`
      // parameter is read via a string-keyed subscript directly, mirroring
      // `payload[<N>]` above.
      if (base.t === "ident" && base.name === "params" && ctx.kind === "handler" && ctx.handlerKind === "onSelect" && expr.index.t === "str") {
        const p = ONSELECT_PARAM_KEY[expr.index.value];
        if (p) {
          return { k: "param", name: p.name, type: p.type };
        }
      }
      if (base.t === "ident" && base.name === "params" && ctx.kind === "handler" && (ctx.handlerKind === "onHoverIn" || ctx.handlerKind === "onHoverOut") && expr.index.t === "str") {
        const p = HOVER_PARAM_KEY[expr.index.value];
        if (p) {
          return { k: "param", name: p.name, type: p.type };
        }
      }
      if (base.t === "ident" && expr.index.t === "str") {
        const slotIdx = this.stateSlotIndexByName.get(base.name);
        if (slotIdx !== undefined) {
          return this.lowerStateFieldRead(slotIdx, expr.index.value);
        }
      }
    }

    if (expr.t === "call" && expr.callee.t === "attr" && identName(expr.callee.base) === "m" && expr.callee.name === "switchCase") {
      return this.lowerMathSwitch(expr.args, expected, ctx);
    }
    if (expr.t === "call" && expr.callee.t === "attr" && identName(expr.callee.base) === "m") {
      return this.lowerMCall(expr.args, expr.callee.name, expected, ctx, undefined);
    }

    if (expr.t === "ident") {
      const text = expr.name;
      if (ctx.kind === "handler" && ctx.handlerKind === "onTick" && (text === "time_since_start" || text === "time_since_last_tick")) {
        return { k: "param", name: text === "time_since_start" ? "timeSinceStart" : "timeSinceLastTick", type: "float" };
      }
      if (this.tempTypeByName.has(text)) return { k: "temp", id: text };
      const slotIdx = this.stateSlotIndexByName.get(text);
      if (slotIdx !== undefined && this.stateSlots[slotIdx].kind === "for") {
        return { k: "stateRead", slot: { slot: slotIdx }, field: "index", type: "int" };
      }
      this.fail("GG150", `unresolved identifier "${text}"`);
    }

    // `(<slot>["remaining"] if <slot>.has("remaining") else N)` — GDScript
    // idiom for TS's `slot.remaining ?? N` (see emit-gd's `emitStateRead`
    // waitAll case's own doc comment on why an explicit membership check is
    // the safe nullish-coalesce equivalent here).
    if (expr.t === "ternary") {
      const cond = expr.cond;
      if (cond.t === "call" && cond.callee.t === "attr" && cond.callee.name === "has" && cond.callee.base.t === "ident" && cond.args.length === 1 && strLit(cond.args[0]) === "remaining") {
        const slotName = cond.callee.base.name;
        const slotIdx = this.stateSlotIndexByName.get(slotName);
        const thenOk = expr.then.t === "index" && identName(expr.then.base) === slotName && expr.then.index.t === "str" && expr.then.index.value === "remaining";
        if (slotIdx !== undefined && thenOk) {
          const inputFlows = numLit(expr.else);
          if (inputFlows !== undefined) {
            this.stateSlots[slotIdx] = { ...this.stateSlots[slotIdx], config: { ...this.stateSlots[slotIdx].config, inputFlows: Math.trunc(inputFlows) } };
          }
          return { k: "stateRead", slot: { slot: slotIdx }, field: "remainingInputs", type: "int" };
        }
      }
    }

    this.fail("GG140", `unrecognized expression shape (kind "${expr.t}")`);
  }

  private lowerStateFieldRead(slotIdx: number, field: string): IRExpr {
    const kind = this.stateSlots[slotIdx].kind;
    if (kind === "doN" && field === "count") return { k: "stateRead", slot: { slot: slotIdx }, field: "currentCount", type: "int" };
    if (kind === "multiGate" && field === "lastIndex") return { k: "stateRead", slot: { slot: slotIdx }, field: "lastIndex", type: "int" };
    if (kind === "delay" && field === "lastRef") return { k: "stateRead", slot: { slot: slotIdx }, field: "lastDelay", type: "ref" };
    if (kind === "throttle" && field === "remaining") return { k: "stateRead", slot: { slot: slotIdx }, field: "lastRemainingTime", type: "float" };
    this.fail("GG140", `unrecognized state-slot field read "${field}" on slot kind "${kind}"`);
  }

  private lowerPtrGet(argNodes: GExpr[], wantIsValid: boolean, ctx: Ctx): IRExpr {
    const hasArgsObj = argNodes.length >= 2 && argNodes[1].t === "dict";
    const pointerExpr = argNodes[0];
    const argsObjExpr = hasArgsObj ? argNodes[1] : undefined;
    const typeExpr = hasArgsObj ? argNodes[2] : argNodes[1];
    const pointerLit = strLit(pointerExpr) ?? this.fail("GG141", "pointer must be a string literal");
    const template = parsePointerTemplate(pointerLit);
    const valueType = (strLit(typeExpr) as IRType | undefined) ?? this.fail("GG141", "pointer type must be a string literal");
    const args = this.lowerPointerArgs(argsObjExpr, template, ctx);
    return { k: "ptrGet", template, args, type: wantIsValid ? "bool" : valueType, valueType, wantIsValid };
  }

  private lowerMathSwitch(args: GExpr[], expected: IRType | undefined, ctx: Ctx): IRExpr {
    const [selectionExpr, casesExpr, valuesExpr, defaultExpr] = args;
    if (casesExpr.t !== "array" || valuesExpr.t !== "array") this.fail("GG142", "m.switchCase's cases/values arguments must be plain array literals");
    const cases = casesExpr.items.map((e) => Math.trunc(numLit(e) ?? this.fail("GG142", "switch case must be a numeric literal")));
    let outType: IRType | undefined = expected;
    if (!outType) {
      for (const n of [defaultExpr, ...valuesExpr.items]) {
        if (n && !isLiteralish(n)) {
          outType = this.typeOfExpr(this.lowerExpr(n, undefined, ctx));
          break;
        }
      }
    }
    outType = outType ?? "float";
    const selection = this.lowerExpr(selectionExpr, "int", ctx);
    const dflt = this.lowerExpr(defaultExpr, outType, ctx);
    const caseArgs = valuesExpr.items.map((n) => this.lowerExpr(n, outType as IRType, ctx));
    return { k: "intrinsic", op: "math/switch", config: { cases }, args: [selection, dflt, ...caseArgs], type: outType };
  }

  private lowerMCall(argNodes: GExpr[], rawFnName: string, expected: IRType | undefined, ctx: Ctx, socket: string | undefined): IRExpr {
    const fnName = GD_UNRENAME[rawFnName] ?? rawFnName;
    if (fnName === "quatFromAngles") {
      const [xN, yN, zN, orderN] = argNodes;
      const overload = resolveOverload("math/quatFromAngles", { x: "float", y: "float", z: "float" })!;
      const order = strLit(orderN) ?? "yxz";
      return {
        k: "op",
        op: "math/quatFromAngles",
        overload,
        args: [this.lowerExpr(xN, "float", ctx), this.lowerExpr(yN, "float", ctx), this.lowerExpr(zN, "float", ctx)],
        config: { order }
      };
    }

    const candidates = lookupMFunctions(fnName, argNodes.length);
    if (candidates.length === 0) this.fail("GG143", `unknown m.${rawFnName}(...) call`);
    const op = candidates[0].op;
    const spec = getOpSpec(op);
    if (!spec) this.fail("GG143", `op "${op}" not found in registry`);
    const overloadIndex = candidates.length === 1 ? candidates[0].overloadIndex : this.disambiguateOverload(candidates, spec, argNodes, expected, ctx);
    const row = spec.overloads[overloadIndex];
    if (row.inputs.length !== argNodes.length) this.fail("GG143", `m.${rawFnName} arg count ${argNodes.length} != expected ${row.inputs.length}`);

    const hasGeneric = row.inputs.some((s) => isGenericSig(s.type)) || row.outputs.some((o) => isGenericSig(o.type));
    const argExprs: IRExpr[] = new Array(row.inputs.length);
    let pinned: IRType | undefined;

    if (hasGeneric) {
      const genericLetter = row.inputs.find((s) => isGenericSig(s.type))?.type ?? row.outputs.find((o) => isGenericSig(o.type))?.type;
      const family = genericLetter && isGenericSig(genericLetter) ? familyOf(genericLetter) : null;
      row.inputs.forEach((s, idx) => {
        if (!isGenericSig(s.type) || isLiteralish(argNodes[idx])) return;
        const e = this.lowerExpr(argNodes[idx], undefined, ctx);
        argExprs[idx] = e;
        pinned = pinned ?? this.typeOfExpr(e);
      });
      if (!pinned && expected && (!family || family.includes(expected))) pinned = expected;
      if (!pinned) {
        for (let idx = 0; idx < row.inputs.length; idx += 1) {
          if (!isGenericSig(row.inputs[idx].type)) continue;
          const node = argNodes[idx];
          const arrLen = node.t === "array" ? node.items.length : numLit(node) !== undefined ? 1 : undefined;
          if (arrLen !== undefined && family) {
            pinned = lengthToType(arrLen, family);
            if (pinned) break;
          }
        }
      }
      pinned = pinned ?? (family ? family[0] : "float");
    }

    row.inputs.forEach((s, idx) => {
      if (argExprs[idx]) return;
      const socketType: IRType = isGenericSig(s.type) ? (pinned as IRType) : typeSigToIRType(s.type as TypeSig);
      argExprs[idx] = this.lowerExpr(argNodes[idx], socketType, ctx);
    });

    const inputTypesByName: Record<string, TypeSig> = {};
    row.inputs.forEach((s) => {
      inputTypesByName[s.name] = (isGenericSig(s.type) ? pinned : s.type) as TypeSig;
    });
    const overload = resolveOverload(op, inputTypesByName);
    if (!overload) this.fail("GG143", `could not resolve overload for op "${op}" with inputs ${JSON.stringify(inputTypesByName)}`);
    const resultSocket = socket && socket !== "value" ? socket : undefined;
    if (resultSocket !== undefined && !(resultSocket in overload.outputs)) this.fail("GG143", `op "${op}" has no output socket "${resultSocket}"`);
    return { k: "op", op, overload, args: argExprs, socket: resultSocket };
  }

  // See parse-ts's own disambiguateOverload doc comment for the full
  // math/transform rationale behind the literal-shape narrowing pass below
  // (port of that file's bug #18 fix, task #21): an all-literal call like
  // `m.transform([1,2,3,4],[...16 elems])` has no non-literal arg for the
  // loop above to probe, so it used to fall straight through to
  // candidates[0], mistyping both literals as (float4x4,float3) regardless
  // of their actual lengths.
  private disambiguateOverload(candidates: FnCandidate[], spec: OpSpec, argNodes: GExpr[], expected: IRType | undefined, ctx: Ctx): number {
    for (let idx = 0; idx < argNodes.length; idx += 1) {
      if (isLiteralish(argNodes[idx])) continue;
      const t = this.typeOfExpr(this.lowerExpr(argNodes[idx], undefined, ctx));
      const matches = candidates.filter((c) => spec.overloads[c.overloadIndex].inputs[idx]?.type === t);
      if (matches.length === 1) return matches[0].overloadIndex;
    }
    let narrowed = candidates;
    for (let idx = 0; idx < argNodes.length; idx += 1) {
      if (!isLiteralish(argNodes[idx])) continue;
      const shapeMatches = narrowed.filter((c) => literalShapeCompatible(argNodes[idx], spec.overloads[c.overloadIndex].inputs[idx]?.type));
      // Only accept a narrowing that leaves at least one candidate — see
      // parse-ts's identical guard: an arg whose shape matches none of the
      // current candidates carries no usable signal here, so falling
      // through (rather than narrowing to empty) keeps this a pure ADDITION
      // to the existing fallbacks.
      if (shapeMatches.length > 0) narrowed = shapeMatches;
    }
    if (narrowed.length === 1) return narrowed[0].overloadIndex;
    if (expected) {
      const matches = narrowed.filter((c) => spec.overloads[c.overloadIndex].outputs.find((o) => o.name === "value")?.type === expected);
      if (matches.length === 1) return matches[0].overloadIndex;
    }
    return narrowed[0].overloadIndex;
  }

  // -------------------------------------------------------------------
  // Native-operator forms — the inverse of emit-gd's `nativeOpInfo`/
  // `emitNativeOp`. Identical operator set/rationale to parse-py's own
  // `tryLowerNativeOp` (see emit-gd's own header note: "identical operator
  // SET and precedence table to emit-py's own"), including the same
  // int-arithmetic/division exclusions (never natively substituted, so
  // every comparison/eq this dispatch reaches is unambiguously float-or-
  // bool typed).
  // -------------------------------------------------------------------

  private tryLowerNativeOp(expr: GExpr, ctx: Ctx): IRExpr | undefined {
    if (expr.t === "unary") {
      if (expr.op === "-") {
        const a = this.lowerExpr(expr.operand, "float", ctx);
        const overload = resolveOverload("math/neg", { a: "float" });
        if (!overload) this.fail("GG161", "could not resolve native float neg overload");
        return { k: "op", op: "math/neg", overload, args: [a] };
      }
      const a = this.lowerExpr(expr.operand, "bool", ctx);
      const overload = resolveOverload("math/not", { a: "bool" });
      if (!overload) this.fail("GG161", "could not resolve native bool not overload");
      return { k: "op", op: "math/not", overload, args: [a] };
    }
    if (expr.t === "binary") {
      const { op, left, right } = expr;
      if (op === "and") return this.buildBinaryOp("math/and", "bool", left, right, ctx);
      if (op === "or") return this.buildBinaryOp("math/or", "bool", left, right, ctx);
      if (op === "!=") return this.buildBinaryOp("math/xor", "bool", left, right, ctx);
      if (op === "==") return this.buildBinaryOp("math/eq", this.inferScalarKind(left, right, ctx, ["bool", "float"]), left, right, ctx);
      if (op === "<") return this.buildBinaryOp("math/lt", "float", left, right, ctx);
      if (op === "<=") return this.buildBinaryOp("math/le", "float", left, right, ctx);
      if (op === ">") return this.buildBinaryOp("math/gt", "float", left, right, ctx);
      if (op === ">=") return this.buildBinaryOp("math/ge", "float", left, right, ctx);
      if (op === "+") return this.buildBinaryOp("math/add", "float", left, right, ctx);
      if (op === "-") return this.buildBinaryOp("math/sub", "float", left, right, ctx);
      if (op === "*") return this.buildBinaryOp("math/mul", "float", left, right, ctx);
    }
    return undefined;
  }

  private buildBinaryOp(op: string, kind: IRType, leftNode: GExpr, rightNode: GExpr, ctx: Ctx): IRExpr {
    const a = this.lowerExpr(leftNode, kind, ctx);
    const b = this.lowerExpr(rightNode, kind, ctx);
    const overload = resolveOverload(op, { a: kind, b: kind } as Record<string, TypeSig>);
    if (!overload) this.fail("GG161", `could not resolve native overload for "${op}" with operand type "${kind}"`);
    return { k: "op", op, overload, args: [a, b] };
  }

  // Bottom-up peek at whichever operand isn't literal-ish (mirrors
  // `disambiguateOverload`'s identical strategy) to pick which of
  // `allowed`'s concrete types this native `==` was over (math/eq is the
  // only native op this backend ever renders for BOTH float and bool — see
  // `nativeOpInfo`); falls back to "float".
  private inferScalarKind(a: GExpr, b: GExpr, ctx: Ctx, allowed: IRType[]): IRType {
    for (const n of [a, b]) {
      if (isLiteralish(n)) continue;
      const t = this.typeOfExpr(this.lowerExpr(n, undefined, ctx));
      if (allowed.includes(t)) return t;
    }
    return allowed.includes("float") ? "float" : allowed[0];
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
