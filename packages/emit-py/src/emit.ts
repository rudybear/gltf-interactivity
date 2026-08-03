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
//       rt.vars([...])                          -- declaration order == variable index
//       rt.events([...])                        -- declaration order == event index
//       S = SimpleNamespace()                   -- one attribute per state slot
//       S.slot0 = ...
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
// arithmetic op wraps explicitly, same principle as the Lua backend's forced-
// float-literal trick solves a DIFFERENT problem, see m.py), bool=Python
// bool, vectors/matrices=0-based Python lists (no index-base conversion
// needed, unlike Lua's 1-based tables — this is the TS backend's own
// convention, reused verbatim), ref=Python str. All math/type/ref ops go
// through `m.*` calls, exactly like the other two backends' design decision
// — see @gltfi/runtime-py's gltfi_runtime/m.py, which mirrors
// @gltfi/runtime-lib/src/math.ts's surface and (critically) its exact
// function NAMES (camelCase, e.g. `quatFromAxisAngle`, not snake_case) so
// @gltfi/kernel's fn-naming.ts reverse table — already shared by
// @gltfi/parse-ts and @gltfi/parse-lua — would work unmodified for a future
// @gltfi/parse-py. Only the ENGINE's rt.* surface is snake_case (Python-
// idiomatic hand-written runtime code, not a reversal target).
//
// Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
// onHoverOut) is intentionally NOT emitted here — see
// @gltfi/runtime-py/src/py/gltfi_runtime/engine.py's header note for why
// (viewer-only, never exercised by the conformance corpus this backend
// targets), same scope decision as the Lua backend.
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
// Literal formatting.
// ---------------------------------------------------------------------------

// Unlike the Lua backend (whose lexer needs every numeral forced into the
// float subtype — see emit-lua's own floatLiteral doc comment), Python
// cleanly distinguishes `int` and `float` at the VALUE level with no
// subtype-dependent arithmetic quirk (`/` is always true division regardless
// of operand type; `+`/`-`/`*` never silently wrap based on which literal
// spelling produced an operand) — so there is no correctness reason to force
// a decimal point on an int-typed literal. This still always emits a
// genuine `float` literal for float-typed constants (never a bare int
// literal that Python would parse as `int`), purely so a value's Python
// runtime type always matches its IRType — cheap and removes any latent risk
// from a future consumer that DOES branch on `isinstance`.
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

// ---------------------------------------------------------------------------
// Emitter.
// ---------------------------------------------------------------------------

type HandlerEventCtx = { kind: "onStart" } | { kind: "onTick" } | { kind: "receive"; eventRef: number };

class Emitter {
  private readonly module: IRModule;
  private readonly lines: string[] = [];
  private indent = 1; // inside `def build(rt): ...`
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
    const header = ['import gltfi_runtime.m as m'];
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
      names: this.module.meta.nameMaps
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

  private emitVars() {
    const entries = this.module.variables.map(
      (v) => `{"type": "${v.type}", "initial": ${constLiteral(v.type, v.initial.data)}}`
    );
    this.push(`rt.vars([${entries.join(", ")}])`);
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
      return `{${fields.join(", ")}}`;
    });
    this.push(`rt.events([${entries.join(", ")}])`);
  }

  // See emit-ts's/emit-lua's emitStateSlots doc comments for the full
  // rationale (per-node persisted state registers, mirroring
  // interpreter.ts's NodeState fields one-for-one). Every "kind" except
  // "for" is a plain dict attribute on the single `S` SimpleNamespace (its
  // shape matches the Lua backend's per-slot table literal field-for-field);
  // "for" is a bare scalar attribute (compared/incremented directly by
  // emitFor). A field an interpreter/TS/Lua oracle leaves `undefined`/`nil`
  // (waitAll's `remaining`, throttle's `lastTime`) is simply OMITTED from
  // the dict here too — engine.py's rt.wait_all/rt.throttle/emitStateRead
  // all read it via `.get(...)`, which returns `None` for a missing key,
  // matching that "unset" semantics exactly.
  private emitStateSlots() {
    if (this.module.stateSlots.length === 0) {
      return;
    }
    this.push("S = SimpleNamespace()");
    this.module.stateSlots.forEach((slot) => {
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`S.${slot.name} = ${pyIntLiteral(Math.trunc(initial))}`);
          return;
        }
        case "delay":
          this.push(`S.${slot.name} = {"lastId": -1.0, "lastRef": "", "ids": []}`);
          return;
        case "doN":
          this.push(`S.${slot.name} = {"count": 0.0}`);
          return;
        case "multiGate":
          this.push(`S.${slot.name} = {"lastIndex": -1.0, "used": []}`);
          return;
        case "waitAll":
          this.push(`S.${slot.name} = {"activated": []}`);
          return;
        case "throttle":
          this.push(`S.${slot.name} = {"remaining": ${pyFloatLiteral(NaN)}}`);
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
      const name = `__on_receive_${index}`;
      this.push(`def ${name}(payload: list) -> None:`);
      this.indent += 1;
      this.emitHandlerBody(handler.body);
      this.indent -= 1;
      this.push(`rt.on_receive(${handler.eventRef}, ${name})`);
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

  // ---------------------------------------------------------------------
  // Statements.
  // ---------------------------------------------------------------------

  private emitStmt(stmt: IRStmt) {
    switch (stmt.k) {
      case "seq":
        stmt.stmts.forEach((s) => this.emitStmt(s));
        return;
      case "let":
        this.push(`${stmt.temp} = ${this.emitExpr(stmt.expr)}`);
        return;
      case "if": {
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
      case "setVar":
        this.push(`rt.set_var(${stmt.varId}, ${this.emitExpr(stmt.expr)})`);
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
        this.push(`rt.send(${stmt.eventId}, ${externalId ? pyStringLiteral(externalId) : "None"}, [${argsCode}])`);
        return;
      }
      case "stopPropagation":
        this.push(`rt.stop_propagation(${this.paramAccess("event")}, ${this.emitExpr(stmt.stopImmediate)})`);
        return;
      case "log": {
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.log(${pyStringLiteral(stmt.template)}, [${argsCode}])`);
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
  // Async ops — identical logic to emit-ts's/emit-lua's emitAsync; see
  // either file's doc comment for which interpreter.ts case each one mirrors.
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
        const entries = params.map((p, i) => `"${p.name}": ${this.emitExpr(paramArgs[i])}`);
        const pointerLit = pyStringLiteral(formatPointerTemplate(template));
        callCode =
          `rt.ptr_interp(${pointerLit}, {${entries.join(", ")}}, "${stmt.type}", ${this.emitExpr(value)}, ` +
          `${this.emitExpr(duration)}, ${this.emitExpr(p1)}, ${this.emitExpr(p2)}, ${doneCode})`;
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
    const resVar = this.freshVar("async");
    this.push(`${resVar} = ${callCode}`);
    if (stmt.out || stmt.err) {
      this.push(`if ${resVar}["ok"]:`);
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
  }

  // A `Cont` is either a plain proc reference (its bare name, passed as a
  // callable — NOT called here) or an inline body, lifted to a synthetic
  // nested `def` declared immediately before the call site that references
  // it (safe for the same reason emit-ts's/emit-lua's version is: a Cont
  // body only ever touches module state, never a caller's temps — see
  // @gltfi/ir's GI105 invariant).
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
    const name = this.freshVar("cont");
    this.push(`def ${name}() -> None:`);
    this.indent += 1;
    this.emitBlock(cont.body);
    this.indent -= 1;
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops — identical logic to emit-ts's/emit-lua's emitStateful.
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = slot?.name ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`S.${slotName}["count"] = 0.0`);
          return;
        }
        const resVar = this.freshVar("doN");
        this.push(`${resVar} = rt.do_n(S.${slotName}, ${this.emitExpr(stmt.args[0])})`);
        if (stmt.outs.out) {
          this.push(`if ${resVar}["fire"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.out);
          this.indent -= 1;
        }
        return;
      }
      case "throttle": {
        if (stmt.port === "reset") {
          this.push(`S.${slotName}.pop("lastTime", None)`);
          this.push(`S.${slotName}["remaining"] = ${pyFloatLiteral(NaN)}`);
          return;
        }
        const resVar = this.freshVar("throttle");
        this.push(`${resVar} = rt.throttle(S.${slotName}, ${this.emitExpr(stmt.args[0])})`);
        if (stmt.outs.out || stmt.outs.err) {
          this.push(`if ${resVar}["invalid"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.err ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push(`elif ${resVar}["fire"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.out ?? { k: "seq", stmts: [] });
          this.indent -= 1;
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
        const resVar = this.freshVar("gate");
        this.push(
          `${resVar} = rt.multi_gate(S.${slotName}, ${keys.length}, ${isRandom ? "True" : "False"}, ${isLoop ? "True" : "False"})`
        );
        keys.forEach((key, i) => {
          this.push(`${i === 0 ? "if" : "elif"} ${resVar}["index"] == ${i}:`);
          this.indent += 1;
          this.emitBlock(stmt.outs[key]);
          this.indent -= 1;
        });
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
        const resVar = this.freshVar("waitAll");
        this.push(`${resVar} = rt.wait_all(S.${slotName}, ${inputFlows}, ${index})`);
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if ${resVar}["completed"]:`);
          this.indent += 1;
          this.emitBlock(stmt.outs.completed ?? { k: "seq", stmts: [] });
          this.indent -= 1;
          this.push("else:");
          this.indent += 1;
          this.emitBlock(stmt.outs.out ?? { k: "seq", stmts: [] });
          this.indent -= 1;
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
      const slotName = this.module.stateSlots[slotIndex]?.name ?? `delay${slotIndex}`;
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
    const varName = this.module.stateSlots[slotIndex]?.name ?? `for_${slotIndex}`;
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
    const selVar = this.freshVar("sel");
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
    const ok = this.freshVar("ok");
    this.push(`${ok} = rt.ptr_set(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode})`);
    if (stmt.out || stmt.err) {
      this.push(`if ${ok}:`);
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
  }

  private pointerCall(template: PtrTemplate, args: IRExpr[]): { pointer: string; argsObj: string } {
    const params = pointerTemplateParams(template);
    const entries = params.map((p, i) => `"${p.name}": ${this.emitExpr(args[i])}`);
    return { pointer: pyStringLiteral(formatPointerTemplate(template)), argsObj: `{${entries.join(", ")}}` };
  }

  // ---------------------------------------------------------------------
  // Expressions.
  // ---------------------------------------------------------------------

  private emitExpr(expr: IRExpr): string {
    switch (expr.k) {
      case "const":
        return constLiteral(expr.type, expr.data);
      case "varGet":
        return `rt.get_var(${expr.varId})`;
      case "ptrGet": {
        const { pointer, argsObj } = this.pointerCall(expr.template, expr.args);
        const call = `rt.ptr_get(${pointer}, ${argsObj}, "${expr.valueType}")`;
        return expr.wantIsValid ? `${call}["isValid"]` : `${call}["value"]`;
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
    if (slot.kind === "for" && field === "index") {
      return `S.${slot.name}`;
    }
    if (slot.kind === "doN" && field === "currentCount") {
      return `S.${slot.name}["count"]`;
    }
    if (slot.kind === "multiGate" && field === "lastIndex") {
      return `S.${slot.name}["lastIndex"]`;
    }
    if (slot.kind === "delay" && field === "lastDelay") {
      return `S.${slot.name}["lastRef"]`;
    }
    if (slot.kind === "throttle" && field === "lastRemainingTime") {
      return `S.${slot.name}["remaining"]`;
    }
    if (slot.kind === "waitAll" && field === "remainingInputs") {
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      // Python idiom for TS's `?? inputFlows` — NOT `S.x.get("remaining") or
      // inputFlows` (Python's `or`, unlike Lua's, treats 0 as falsy too, so
      // that would wrongly substitute inputFlows once remaining genuinely
      // reaches 0). An explicit dict-membership check is the safe
      // nullish-coalesce equivalent here.
      return `(S.${slot.name}["remaining"] if "remaining" in S.${slot.name} else ${pyFloatLiteral(inputFlows)})`;
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
      return `rt.event_payload(${eventIndex})[${fieldIndex}]`;
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
    // Named sockets (isValid, translation, axis, angle, l/c/h, r/g/b, ...)
    // are plain dict-key access, same convention as the Lua backend's dot
    // access. A numeric socket indexes into a 0-based list result directly
    // — no Lua-style "+1" boundary adjustment needed (see this file's
    // header note).
    if (/^\d+$/.test(expr.socket)) {
      return `${call}[${Number(expr.socket)}]`;
    }
    return `${call}["${expr.socket}"]`;
  }
}

export function emitModulePy(module: IRModule): EmitResult {
  return new Emitter(module).run();
}
