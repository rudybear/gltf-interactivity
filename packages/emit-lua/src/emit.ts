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
//     rt.vars({ ... })          -- declaration order == variable index
//     rt.events({ ... })        -- declaration order == event index
//     local proc5                -- procs, forward-declared then defined
//     proc5 = function() ... end -- before handlers (supports either-order
//                                   proc-to-proc calls)
//     rt.onStart(function() ... end)
//   end
//
// Value representation: float=Lua number, int=Lua number (int32 semantics
// via `m.*` calls; every numeric literal is forced to Lua's float subtype —
// see floatLiteral below), bool=Lua boolean, vectors/matrices=1-based Lua
// tables, ref=Lua string. All math/type/ref ops go through `m.*` calls,
// exactly like emit-ts's `m.*` design decision — see @gltfi/runtime-lua's
// src/lua/m.lua, which mirrors @gltfi/runtime-lib/src/math.ts's surface.
//
// Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
// onHoverOut) is intentionally NOT emitted here — see
// @gltfi/runtime-lua/src/lua/engine.lua's header note for why (viewer-only,
// never exercised by the conformance corpus this backend targets).
import {
  formatPointerTemplate,
  pointerTemplateParams,
  type IRExpr,
  type IRHandler,
  type IRModule,
  type IRStmt,
  type IRType,
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

// ---------------------------------------------------------------------------
// Emitter.
// ---------------------------------------------------------------------------

type HandlerEventCtx = { kind: "onStart" } | { kind: "onTick" } | { kind: "receive"; eventRef: number };

class Emitter {
  private readonly module: IRModule;
  private readonly lines: string[] = [];
  private indent = 1; // inside `return function(rt) ... end`
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  private readonly crossHandlerReads = new Set<string>();
  private varCounter = 0;

  private freshVar(prefix: string): string {
    this.varCounter += 1;
    return `__${prefix}${this.varCounter}`;
  }

  constructor(module: IRModule) {
    this.module = module;
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
      names: this.module.meta.nameMaps
    };
  }

  private push(text: string) {
    this.lines.push(text.length === 0 ? "" : `${"  ".repeat(this.indent)}${text}`);
  }

  private emitVars() {
    const entries = this.module.variables.map((v) => `{ type = "${v.type}", initial = ${constLiteral(v.type, v.initial.data)} }`);
    this.push(`rt.vars({ ${entries.join(", ")} })`);
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
      return `{ ${fields.join(", ")} }`;
    });
    this.push(`rt.events({ ${entries.join(", ")} })`);
  }

  // See emit-ts's emitStateSlots doc comment for the full rationale (per-
  // node persisted state registers, mirroring interpreter.ts's NodeState
  // fields one-for-one) — Lua has no static types, so there's no analog to
  // that file's "annotate" TS-type-suffix step; every field an `undefined`
  // default (waitAll's `remaining`, throttle's `lastTime`) is simply
  // omitted here (an absent Lua table key already reads as `nil`).
  private emitStateSlots() {
    this.module.stateSlots.forEach((slot) => {
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`local ${slot.name} = ${floatLiteral(Math.trunc(initial))}`);
          return;
        }
        case "delay":
          this.push(`local ${slot.name} = { lastId = -1.0, lastRef = "", ids = {} }`);
          return;
        case "doN":
          this.push(`local ${slot.name} = { count = 0.0 }`);
          return;
        case "multiGate":
          this.push(`local ${slot.name} = { lastIndex = -1.0, used = {} }`);
          return;
        case "waitAll":
          this.push(`local ${slot.name} = { activated = {} }`);
          return;
        case "throttle":
          this.push(`local ${slot.name} = { remaining = ${floatLiteral(NaN)} }`);
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
      this.push(`rt.onReceive(${handler.eventRef}, function(payload)`);
      this.indent += 1;
      this.emitEventOutWrites();
      this.emitStmt(handler.body);
      this.indent -= 1;
      this.push("end)");
      return;
    }
    // KHR_node_selectability/hoverability — viewer-only, never emitted by
    // the official conformance corpus this backend targets (see
    // @gltfi/runtime-lua's engine.lua header note); intentionally
    // unsupported here rather than ported, unlike emit-ts.
    throw new EmitError(
      `handler kind "${handler.kind}" is not supported by the Lua backend (KHR_node_selectability/hoverability is viewer-only)`,
      handler.kind,
      this.originNodeId
    );
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

  // ---------------------------------------------------------------------
  // Statements.
  // ---------------------------------------------------------------------

  private emitStmt(stmt: IRStmt) {
    switch (stmt.k) {
      case "seq":
        stmt.stmts.forEach((s) => this.emitStmt(s));
        return;
      case "let":
        this.push(`local ${stmt.temp} = ${this.emitExpr(stmt.expr)}`);
        return;
      case "if": {
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
      case "setVar":
        this.push(`rt.setVar(${stmt.varId}, ${this.emitExpr(stmt.expr)})`);
        return;
      case "setPointer": {
        this.emitSetPointer(stmt);
        return;
      }
      case "emitEvent": {
        if (stmt.args.length !== 4) {
          throw new EmitError("emitEvent expects exactly 4 payload args (bool,int,float,duration)", "event/send", this.originNodeId);
        }
        const externalId = this.module.events[stmt.eventId]?.id;
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.send(${stmt.eventId}, ${externalId ? luaStringLiteral(externalId) : "nil"}, { ${argsCode} })`);
        return;
      }
      case "stopPropagation":
        this.push(`rt.stopPropagation(${this.paramAccess("event")}, ${this.emitExpr(stmt.stopImmediate)})`);
        return;
      case "log": {
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.log(${luaStringLiteral(stmt.template)}, { ${argsCode} })`);
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
  // Async ops — identical logic to emit-ts's emitAsync; see that file's
  // doc comment for which interpreter.ts case each one mirrors.
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
        const slotName = this.module.stateSlots[slotIndex]?.name ?? `delay${slotIndex}`;
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
        const entries = params.map((p, i) => `${p.name} = ${this.emitExpr(paramArgs[i])}`);
        const pointerLit = luaStringLiteral(formatPointerTemplate(template));
        callCode =
          `rt.ptrInterp(${pointerLit}, { ${entries.join(", ")} }, "${stmt.type}", ${this.emitExpr(value)}, ` +
          `${this.emitExpr(duration)}, ${this.emitExpr(p1)}, ${this.emitExpr(p2)}, ${doneCode})`;
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
    const resVar = this.freshVar("async");
    this.push(`local ${resVar} = ${callCode}`);
    if (stmt.out || stmt.err) {
      this.push(`if ${resVar}.ok then`);
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
  }

  // A `Cont` is either a plain proc reference (just its name) or an inline
  // body, lifted to a synthetic local function declared immediately before
  // the call site that references it (safe for the same reason emit-ts's
  // version is: a Cont body only ever touches module state, never a
  // caller's temps — see @gltfi/ir's GI105 invariant). `local function`
  // (not the forward-declare-then-assign pattern emitProcs uses) is fine
  // here specifically because this definition's only use is textually
  // right after it, in the same statement sequence — never a forward
  // reference.
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
    const name = this.freshVar("cont");
    this.push(`local function ${name}()`);
    this.indent += 1;
    this.emitStmt(cont.body);
    this.indent -= 1;
    this.push("end");
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops — identical logic to emit-ts's emitStateful.
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = slot?.name ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.count = 0.0`);
          return;
        }
        const resVar = this.freshVar("doN");
        this.push(`local ${resVar} = rt.doN(${slotName}, ${this.emitExpr(stmt.args[0])})`);
        if (stmt.outs.out) {
          this.push(`if ${resVar}.fire then`);
          this.indent += 1;
          this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("end");
        }
        return;
      }
      case "throttle": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.lastTime = nil`);
          this.push(`${slotName}.remaining = ${floatLiteral(NaN)}`);
          return;
        }
        const resVar = this.freshVar("throttle");
        this.push(`local ${resVar} = rt.throttle(${slotName}, ${this.emitExpr(stmt.args[0])})`);
        if (stmt.outs.out || stmt.outs.err) {
          this.push(`if ${resVar}.invalid then`);
          this.indent += 1;
          if (stmt.outs.err) this.emitStmt(stmt.outs.err);
          this.indent -= 1;
          this.push(`elseif ${resVar}.fire then`);
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("end");
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
        const resVar = this.freshVar("gate");
        this.push(`local ${resVar} = rt.multiGate(${slotName}, ${floatLiteral(keys.length)}, ${isRandom ? "true" : "false"}, ${isLoop ? "true" : "false"})`);
        keys.forEach((key, i) => {
          this.push(`${i === 0 ? "if" : "elseif"} ${resVar}.index == ${floatLiteral(i)} then`);
          this.indent += 1;
          this.emitStmt(stmt.outs[key]);
          this.indent -= 1;
        });
        if (keys.length > 0) {
          this.push("end");
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
        const resVar = this.freshVar("waitAll");
        this.push(`local ${resVar} = rt.waitAll(${slotName}, ${floatLiteral(inputFlows)}, ${floatLiteral(index)})`);
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if ${resVar}.completed then`);
          this.indent += 1;
          if (stmt.outs.completed) this.emitStmt(stmt.outs.completed);
          this.indent -= 1;
          this.push("else");
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("end");
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
      const slotName = this.module.stateSlots[slotIndex]?.name ?? `delay${slotIndex}`;
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
    const varName = this.module.stateSlots[slotIndex]?.name ?? `for_${slotIndex}`;
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
  // selector's value, with `default` as the final `else`. `selector` is a
  // spec int32 already (no TS-typing `| 0` widening hack needed, unlike
  // emit-ts — Lua has no literal-type narrowing to work around).
  private emitSwitch(stmt: Extract<IRStmt, { k: "switch" }>) {
    const selVar = this.freshVar("sel");
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
    const ok = "ok" + Math.abs(hashString(pointer + this.lines.length));
    this.push("do");
    this.indent += 1;
    this.push(`local ${ok} = rt.ptrSet(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode})`);
    if (stmt.out || stmt.err) {
      this.push(`if ${ok} then`);
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
    this.indent -= 1;
    this.push("end");
  }

  private pointerCall(template: PtrTemplate, args: IRExpr[]): { pointer: string; argsObj: string } {
    const params = pointerTemplateParams(template);
    const entries = params.map((p, i) => `${p.name} = ${this.emitExpr(args[i])}`);
    return { pointer: luaStringLiteral(formatPointerTemplate(template)), argsObj: `{ ${entries.join(", ")} }` };
  }

  // ---------------------------------------------------------------------
  // Expressions.
  // ---------------------------------------------------------------------

  private emitExpr(expr: IRExpr): string {
    switch (expr.k) {
      case "const":
        return constLiteral(expr.type, expr.data);
      case "varGet":
        return `rt.getVar(${expr.varId})`;
      case "ptrGet": {
        const { pointer, argsObj } = this.pointerCall(expr.template, expr.args);
        const call = `rt.ptrGet(${pointer}, ${argsObj}, "${expr.valueType}")`;
        return expr.wantIsValid ? `${call}.isValid` : `${call}.value`;
      }
      case "param":
        return this.paramAccess(expr.name);
      case "op":
        return this.emitOp(expr);
      case "temp":
        return expr.id;
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
      if (name === "timeSinceStart") return "timeSinceStart";
      if (name === "timeSinceLastTick") return "timeSinceLastTick";
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
    if (slot.kind === "for" && field === "index") {
      return slot.name;
    }
    if (slot.kind === "doN" && field === "currentCount") {
      return `${slot.name}.count`;
    }
    if (slot.kind === "multiGate" && field === "lastIndex") {
      return `${slot.name}.lastIndex`;
    }
    if (slot.kind === "delay" && field === "lastDelay") {
      return `${slot.name}.lastRef`;
    }
    if (slot.kind === "throttle" && field === "lastRemainingTime") {
      return `${slot.name}.remaining`;
    }
    if (slot.kind === "waitAll" && field === "remainingInputs") {
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      // Lua idiom for TS's `?? inputFlows` — safe here because the LHS
      // (this slot's own numeric field) is never `false`, only a number or
      // `nil` (see the ternary-safety architecture note: this "and/or"
      // substitutes for a nullish-coalesce, not a boolean ternary, and the
      // value side is never boolean false).
      return `(${slot.name}.remaining or ${floatLiteral(inputFlows)})`;
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
      return `rt.eventPayload(${eventIndex})[${fieldIndex}]`;
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
    // Named sockets (isValid, translation, axis, angle, l/c/h, r/g/b, ...)
    // are plain dot access, same as emit-ts. A numeric socket would be
    // indexing into a plain-array result 0-based in TS; Lua's arrays are
    // 1-based, hence +1 (see this file's header note on the boundary).
    if (/^\d+$/.test(expr.socket)) {
      return `${call}[${Number(expr.socket) + 1}]`;
    }
    return `${call}.${expr.socket}`;
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function emitModuleLua(module: IRModule): EmitResult {
  return new Emitter(module).run();
}
