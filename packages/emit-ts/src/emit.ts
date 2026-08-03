// IR -> TypeScript emitter. See docs/design/ir-and-transpiler.md's "IR ->
// TypeScript" section for the generated module shape this follows:
//
//   import { createEngine, m } from "@gltfi/runtime-lib";
//   export default createEngine((rt) => {
//     rt.vars([...]);           // declaration order == variable index
//     rt.events([...]);         // declaration order == event index
//     function proc5() { ... }  // procs, defined before handlers
//     rt.onStart(() => { ... });
//   });
//
// Value representation in generated code is raw JS (see design decision 1):
// float=number, int=number (int32 semantics via `m.*` calls), bool=boolean,
// vectors/matrices=number[] tuples, ref=string. All math/type/ref ops go
// through `m.*` calls (design decision 2) — no native-operator substitution
// this milestone.
//
// Scope for this milestone (compiled path M3): every corpus test under
// math/, type/, ref/ — confirmed (see task report) to use only onStart
// handlers, flow/branch, flow/for, flow/sequence, pointer/get, pointer/set,
// variable/get|set, debug/log, event/send, and the math/type/ref op set
// itself (no while/switch/doN/multiGate/waitAll/throttle/setDelay/
// interpolate/animation/onTick/receive/onSelect/onHoverIn/onHoverOut/GI012
// cross-handler reads in scope). Statement/expr kinds beyond that are
// implemented where cheap and clearly correct (while, switch, onTick,
// onReceive, param, GI012) but are NOT exercised by the acceptance corpus;
// stateful/async ops and the two extension-event handler kinds are not
// implemented and raise EmitError — see the per-kind notes below.
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

export type EmitFlavor = "ts" | "js";

export type EmitOptions = {
  // "js" drops type annotations for in-browser Blob import. The generated
  // code carries no type annotations either way in this milestone (every
  // value is a plain inferred JS expression — see the header note), so the
  // two flavors currently produce identical output; the option is accepted
  // now so callers (esp. run-compiled.ts) don't need to change when a later
  // milestone starts emitting explicit annotations for the "ts" flavor.
  flavor?: EmitFlavor;
};

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
// m.* function-name selection: base name derived from the op string, with
// "Int"/"Bool" suffixes chosen from the resolved overload's input type
// (mirrors @gltfi/runtime-lib/math.ts's exported surface exactly).
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

// ---------------------------------------------------------------------------
// Literal formatting.
// ---------------------------------------------------------------------------

function floatLiteral(x: number): string {
  if (Number.isNaN(x)) {
    return "NaN";
  }
  if (x === Infinity) {
    return "Infinity";
  }
  if (x === -Infinity) {
    return "-Infinity";
  }
  return String(x);
}

function constLiteral(type: IRType, data: Array<number | boolean | string>): string {
  if (type === "bool") {
    return data[0] ? "true" : "false";
  }
  if (type === "ref") {
    return JSON.stringify(String(data[0] ?? ""));
  }
  if (type === "int") {
    return String(Math.trunc(Number(data[0] ?? 0)));
  }
  if (type === "float") {
    return floatLiteral(Number(data[0] ?? 0));
  }
  // vector/matrix
  return `[${(data as number[]).map((x) => floatLiteral(Number(x))).join(", ")}]`;
}

// ---------------------------------------------------------------------------
// Emitter.
// ---------------------------------------------------------------------------

type HandlerEventCtx =
  | { kind: "onStart" }
  | { kind: "onTick" }
  | { kind: "receive"; eventRef: number };

class Emitter {
  private readonly module: IRModule;
  private readonly lines: string[] = [];
  private indent = 2; // inside `createEngine((rt) => { ... })`
  // Current handler's event context, for `param` lowering (see emitExpr's
  // "param" case) and for the current origin node id used in EmitError
  // messages.
  private handlerEventCtx: HandlerEventCtx | null = null;
  private originNodeId: number | undefined;
  // Cross-handler GI012 reads found anywhere in the module, keyed by
  // "<sourceNode>:<socket>" — every handler whose own source node matches
  // one of these must write rt.eventOut(sourceNode, socket, value) so the
  // read has something to observe. Not exercised by this milestone's
  // corpus (math/type/ref never read cross-handler) but implemented since
  // @gltfi/ir already carries the data (see import.ts's GI012 branch).
  private readonly crossHandlerReads = new Set<string>();
  // Monotonic counter for synthesized local identifiers (async-op result
  // vars, lifted inline-Cont function names, ...) — guaranteed not to
  // collide with graph-derived names (temps/procs/state slots all come from
  // @gltfi/ir's own NameAllocator, which never produces a bare "varN"/
  // "contN" of this shape without a graph-derived prefix; see names.ts).
  private varCounter = 0;

  private freshVar(prefix: string): string {
    this.varCounter += 1;
    return `__${prefix}${this.varCounter}`;
  }

  constructor(module: IRModule) {
    this.module = module;
    this.collectCrossHandlerReads(module);
  }

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
    this.push('import { createEngine, m } from "@gltfi/runtime-lib";');
    this.push("");
    this.push("export default createEngine((rt) => {");
    this.emitVars();
    this.emitEvents();
    this.emitStateSlots();
    this.emitProcs();
    this.emitHandlers();
    this.push("});");
    this.push("");
    return {
      code: `${this.lines.join("\n")}\n`,
      names: this.module.meta.nameMaps
    };
  }

  private push(text: string) {
    this.lines.push(text.length === 0 ? "" : `${"  ".repeat(this.indent)}${text}`);
  }

  private emitVars() {
    const entries = this.module.variables.map((v) => `{ type: "${v.type}", initial: ${constLiteral(v.type, v.initial.data)} }`);
    this.push(`rt.vars([${entries.join(", ")}]);`);
  }

  private emitEvents() {
    const entries = this.module.events.map((e) => {
      const fields: string[] = [];
      if (e.id) {
        fields.push(`externalId: ${JSON.stringify(e.id)}`);
      }
      // All four standard payload fields' declared defaults — not just
      // expectedDuration — so rt.eventPayload() (see engine.ts) can answer
      // "what would this event's payload be if it were never sent" for
      // cross-handler event/receive payload reads (GI012; see
      // emitIntrinsicExpr's "event/receive#payload" case) exactly like
      // interpreter.ts's getEventPayload does from the graph's own event
      // declarations.
      const boolDefault = e.values.find((v) => v.name === "boolParameter");
      const intDefault = e.values.find((v) => v.name === "intParameter");
      const floatDefault = e.values.find((v) => v.name === "floatParameter");
      const duration = e.values.find((v) => v.name === "expectedDuration");
      if (boolDefault) {
        fields.push(`defaultBool: ${Boolean(boolDefault.default.data[0]) ? "true" : "false"}`);
      }
      if (intDefault) {
        fields.push(`defaultInt: ${Math.trunc(Number(intDefault.default.data[0] ?? 0))}`);
      }
      if (floatDefault) {
        fields.push(`defaultFloat: ${floatLiteral(Number(floatDefault.default.data[0] ?? 0))}`);
      }
      if (duration) {
        fields.push(`expectedDuration: ${floatLiteral(Number(duration.default.data[0] ?? 0))}`);
      }
      return `{ ${fields.join(", ")} }`;
    });
    this.push(`rt.events([${entries.join(", ")}]);`);
  }

  // State slots are real persisted cross-invocation registers — module-level
  // `let`/`const` bindings assigned (never re-declared) by whichever
  // statement drives that slot's state machine, exactly mirroring
  // interpreter.ts's per-node NodeState fields (see engine.ts's DelaySlot/
  // DoNSlot/MultiGateSlot/WaitAllSlot/ThrottleSlot doc comments for the
  // field-by-field correspondence). stateRead just references the slot (or
  // one of its fields) unconditionally — no lexical scoping needed, since a
  // graph value edge can read a state slot's output from anywhere (same
  // reasoning as "for"'s own note below).
  //
  // "for" specifically stays a bare number register (interpreter.ts's
  // `nodeStates.get(nodeId).forIndex`): before the loop has ever run it
  // reads config.initialIndex, and after it reads whatever the last run
  // left it at, until the loop runs again.
  // Explicit type annotations (not just the doc's "plain inferred JS
  // expression" shape — see this file's header note) are needed on the
  // waitAll/throttle slot objects specifically: TS infers an object
  // literal's `undefined`-valued property as the literal type `undefined`
  // (not `number | undefined`), which then rejects the reset code's later
  // `slot.remaining = <number>;` assignment under strict mode. Annotating
  // keeps every flavor's *runtime* shape identical (erased by esbuild in the
  // --js/bundled path — see run-compiled.ts) while making the "ts" flavor's
  // own file strict-mode sound, which @gltfi/parse-ts's type checker
  // requires (see docs/design/ir-and-transpiler.md's GIscript subset: "The
  // TS type checker runs first").
  private emitStateSlots() {
    this.module.stateSlots.forEach((slot) => {
      switch (slot.kind) {
        case "for": {
          const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
          this.push(`let ${slot.name} = ${floatLiteral(Math.trunc(initial))};`);
          return;
        }
        case "delay":
          this.push(`const ${slot.name}: { lastId: number; lastRef: string; ids: number[] } = { lastId: -1, lastRef: "", ids: [] };`);
          return;
        case "doN":
          this.push(`const ${slot.name}: { count: number } = { count: 0 };`);
          return;
        case "multiGate":
          this.push(`const ${slot.name}: { lastIndex: number; used: boolean[] } = { lastIndex: -1, used: [] };`);
          return;
        case "waitAll":
          this.push(`const ${slot.name}: { activated: boolean[]; remaining: number | undefined } = { activated: [], remaining: undefined };`);
          return;
        case "throttle":
          this.push(`const ${slot.name}: { lastTime: number | undefined; remaining: number } = { lastTime: undefined, remaining: NaN };`);
          return;
      }
    });
  }

  private emitProcs() {
    this.module.procs.forEach((proc) => {
      this.originNodeId = this.module.meta.sourceNodeIds[`proc:${proc.id}`];
      this.handlerEventCtx = null;
      this.push(`function ${proc.name}() {`);
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
    switch (handler.kind) {
      case "onStart": {
        this.handlerEventCtx = { kind: "onStart" };
        this.push("rt.onStart(() => {");
        this.indent += 1;
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      case "onTick": {
        this.handlerEventCtx = { kind: "onTick" };
        this.push("rt.onTick((timeSinceStart, timeSinceLastTick) => {");
        this.indent += 1;
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      case "receive": {
        if (handler.eventRef === undefined) {
          throw new EmitError("event/receive handler missing eventRef", "event/receive", this.originNodeId);
        }
        this.handlerEventCtx = { kind: "receive", eventRef: handler.eventRef };
        this.push(`rt.onReceive(${handler.eventRef}, (payload) => {`);
        this.indent += 1;
        this.emitEventOutWrites();
        this.emitStmt(handler.body);
        this.indent -= 1;
        this.push("});");
        return;
      }
      default:
        throw new EmitError(`handler kind "${handler.kind}" not supported this milestone`, handler.kind, this.originNodeId);
    }
  }

  // Writes rt.eventOut(sourceNode, socket, value) for every output socket
  // of *this* handler's own event node that some other handler reads
  // cross-handler (GI012) — see the crossHandlerReads note above.
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
      this.push(`rt.eventOut(${sourceNode}, ${JSON.stringify(socket)}, ${value});`);
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
        this.push(`const ${stmt.temp} = ${this.emitExpr(stmt.expr)};`);
        return;
      case "if": {
        this.push(`if (${this.emitExpr(stmt.cond)}) {`);
        this.indent += 1;
        this.emitStmt(stmt.then);
        this.indent -= 1;
        if (stmt.else) {
          this.push("} else {");
          this.indent += 1;
          this.emitStmt(stmt.else);
          this.indent -= 1;
        }
        this.push("}");
        return;
      }
      case "while": {
        this.push(`while (${this.emitExpr(stmt.cond)}) {`);
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
        // `| 0` is a semantic no-op for an already-int value (spec ints are
        // int32) but forces TS to widen a compile-time-constant selector
        // (e.g. a literal-condition graph like flow/switch's own conformance
        // asset) from a numeric-literal type to plain `number` — a bare
        // `switch (4) { case 1: ... }` is a strict-mode TS error ("Type '1'
        // is not comparable to type '4'") otherwise, since TS narrows the
        // switch discriminant to the literal type of a literal expression.
        this.push(`switch (${this.emitExpr(stmt.selector)} | 0) {`);
        this.indent += 1;
        for (const [c, body] of stmt.cases) {
          this.push(`case ${c}: {`);
          this.indent += 1;
          this.emitStmt(body);
          this.push("break;");
          this.indent -= 1;
          this.push("}");
        }
        if (stmt.default) {
          this.push("default: {");
          this.indent += 1;
          this.emitStmt(stmt.default);
          this.push("break;");
          this.indent -= 1;
          this.push("}");
        }
        this.indent -= 1;
        this.push("}");
        return;
      }
      case "setVar":
        this.push(`rt.setVar(${stmt.varId}, ${this.emitExpr(stmt.expr)});`);
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
        this.push(`rt.send(${stmt.eventId}, ${externalId ? JSON.stringify(externalId) : "undefined"}, [${argsCode}]);`);
        return;
      }
      case "stopPropagation":
        // eventRef is the CURRENT handler's own event ref — always known at
        // compile time (paramAccess("event") resolves it the same way a
        // param("event") read would; see import.ts's note that IR always
        // targets the enclosing handler's own event regardless of what the
        // graph node's "event" input was actually wired to).
        this.push(`rt.stopPropagation(${this.paramAccess("event")}, ${this.emitExpr(stmt.stopImmediate)});`);
        return;
      case "log": {
        const argsCode = stmt.args.map((a) => this.emitExpr(a)).join(", ");
        this.push(`rt.log(${JSON.stringify(stmt.template)}, [${argsCode}]);`);
        return;
      }
      case "callProc": {
        const proc = this.module.procs[stmt.procId];
        if (!proc) {
          throw new EmitError(`unknown proc id ${stmt.procId}`, "callProc", this.originNodeId);
        }
        this.push(`${proc.name}();`);
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
  // Async ops (flow/setDelay, variable/interpolate, pointer/interpolate,
  // animation/start|stop|stopAt). Each rt.* call below returns {ok:boolean}
  // — see engine.ts's EngineBuilder doc comments for exactly which
  // interpreter.ts executeNodeFlow case each one mirrors.
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
        const entries = params.map((p, i) => `${JSON.stringify(p.name)}: ${this.emitExpr(paramArgs[i])}`);
        const pointerLit = JSON.stringify(formatPointerTemplate(template));
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
    this.push(`const ${resVar} = ${callCode};`);
    if (stmt.out || stmt.err) {
      this.push(`if (${resVar}.ok) {`);
      this.indent += 1;
      if (stmt.out) this.emitStmt(stmt.out);
      this.indent -= 1;
      if (stmt.err) {
        this.push("} else {");
        this.indent += 1;
        this.emitStmt(stmt.err);
        this.indent -= 1;
      }
      this.push("}");
    }
  }

  // A `Cont` is either a plain proc reference (`{kind:"proc"}` — just its
  // name, callable with no args, exactly the shape rt.* async calls expect
  // for `done`) or an inline body (`{kind:"inline"}`). Inline bodies are
  // lifted to a synthetic top-level-in-their-enclosing-block function
  // declaration emitted right before the call that references it — safe
  // because a Cont body can only touch module state, never a caller's
  // temps (see docs/design/ir-and-transpiler.md's GI105 / the IR invariant
  // checker), and it sidesteps needing to embed a multi-statement block as
  // a single call-argument expression.
  private emitCont(cont: Extract<IRStmt, { k: "async" }>["done"]): string {
    if (!cont) {
      return "undefined";
    }
    if (cont.kind === "proc") {
      const proc = this.module.procs[cont.procId];
      if (!proc) {
        throw new EmitError(`unknown proc id ${cont.procId}`, "async.done", this.originNodeId);
      }
      return proc.name;
    }
    const name = this.freshVar("cont");
    this.push(`function ${name}() {`);
    this.indent += 1;
    this.emitStmt(cont.body);
    this.indent -= 1;
    this.push("}");
    return name;
  }

  // ---------------------------------------------------------------------
  // Stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle).
  // Reset ports are plain field assignments on the slot object (mirroring
  // interpreter.ts's own reset cases exactly — no rt.* call needed); "in"
  // ports call the matching rt.* decision function and branch on its
  // result. See engine.ts's EngineBuilder doc comments for exactly which
  // interpreter.ts executeNodeFlow case each one mirrors.
  // ---------------------------------------------------------------------

  private emitStateful(stmt: Extract<IRStmt, { k: "stateful" }>) {
    const slotIndex = stmt.slot.slot;
    const slot = this.module.stateSlots[slotIndex];
    const slotName = slot?.name ?? `slot${slotIndex}`;
    switch (stmt.kind) {
      case "doN": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.count = 0;`);
          return;
        }
        const resVar = this.freshVar("doN");
        this.push(`const ${resVar} = rt.doN(${slotName}, ${this.emitExpr(stmt.args[0])});`);
        if (stmt.outs.out) {
          this.push(`if (${resVar}.fire) {`);
          this.indent += 1;
          this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("}");
        }
        return;
      }
      case "throttle": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.lastTime = undefined;`);
          this.push(`${slotName}.remaining = NaN;`);
          return;
        }
        const resVar = this.freshVar("throttle");
        this.push(`const ${resVar} = rt.throttle(${slotName}, ${this.emitExpr(stmt.args[0])});`);
        if (stmt.outs.out || stmt.outs.err) {
          this.push(`if (${resVar}.invalid) {`);
          this.indent += 1;
          if (stmt.outs.err) this.emitStmt(stmt.outs.err);
          this.indent -= 1;
          this.push(`} else if (${resVar}.fire) {`);
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("}");
        }
        return;
      }
      case "multiGate": {
        if (stmt.port === "reset") {
          this.push(`${slotName}.used = [];`);
          this.push(`${slotName}.lastIndex = -1;`);
          return;
        }
        // UTF-16/lexical sort — matches interpreter.ts's own
        // `Object.keys(flows).sort()` exactly (see flow/multiGate's
        // executeNodeFlow case), not JS's automatic ascending-numeric
        // reordering of integer-like object keys, which would only
        // coincide with this for < 10 outputs.
        const keys = Object.keys(stmt.outs).sort();
        const isRandom = Boolean((slot?.config as { isRandom?: boolean } | undefined)?.isRandom);
        const isLoop = Boolean((slot?.config as { isLoop?: boolean } | undefined)?.isLoop);
        const resVar = this.freshVar("gate");
        this.push(`const ${resVar} = rt.multiGate(${slotName}, ${keys.length}, ${isRandom ? "true" : "false"}, ${isLoop ? "true" : "false"});`);
        if (keys.length > 0) {
          this.push(`switch (${resVar}.index) {`);
          this.indent += 1;
          keys.forEach((key, i) => {
            this.push(`case ${i}: {`);
            this.indent += 1;
            this.emitStmt(stmt.outs[key]);
            this.push("break;");
            this.indent -= 1;
            this.push("}");
          });
          this.indent -= 1;
          this.push("}");
        }
        return;
      }
      case "waitAll": {
        const inputFlows = Number((slot?.config as { inputFlows?: number } | undefined)?.inputFlows ?? 0);
        if (stmt.port === "reset") {
          this.push(`${slotName}.activated = [];`);
          this.push(`${slotName}.remaining = ${inputFlows};`);
          return;
        }
        const index = typeof stmt.port === "number" ? stmt.port : 0;
        const resVar = this.freshVar("waitAll");
        this.push(`const ${resVar} = rt.waitAll(${slotName}, ${inputFlows}, ${index});`);
        if (stmt.outs.completed || stmt.outs.out) {
          this.push(`if (${resVar}.completed) {`);
          this.indent += 1;
          if (stmt.outs.completed) this.emitStmt(stmt.outs.completed);
          this.indent -= 1;
          this.push("} else {");
          this.indent += 1;
          if (stmt.outs.out) this.emitStmt(stmt.outs.out);
          this.indent -= 1;
          this.push("}");
        }
        return;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Intrinsic statements: the escape hatch for ops with no dedicated IRStmt
  // shape. Only two synthetic ops reach here in practice (see
  // import.ts's lowerSecondaryPort and its ASYNC_OPS/STATEFUL_OPS-miss
  // fallback to raiseIntrinsic): a delay node's own "cancel" input port,
  // and the standalone flow/cancelDelay op (cancels an arbitrary delay by
  // ref, looked up at the scheduler level — see engine.ts's cancelDelay).
  // ---------------------------------------------------------------------

  private emitIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>) {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIndex = (stmt.config as { slot?: number }).slot;
      if (slotIndex === undefined) {
        throw new EmitError("flow/setDelay#cancel missing its state slot", stmt.op, this.originNodeId);
      }
      const slotName = this.module.stateSlots[slotIndex]?.name ?? `delay${slotIndex}`;
      this.push(`rt.cancelDelaySlot(${slotName});`);
      return;
    }
    if (stmt.op === "flow/cancelDelay") {
      this.push(`rt.cancelDelay(${this.emitExpr(stmt.args[0])});`);
      if (stmt.outs.out) {
        this.emitStmt(stmt.outs.out);
      }
      return;
    }
    throw new EmitError(`intrinsic op "${stmt.op}" has no dedicated lowering`, stmt.op, this.originNodeId);
  }

  // The for-loop's index lives in the module-level register emitted by
  // emitForStateSlots — this just *assigns* it (matching the interpreter's
  // unconditional `state.forIndex = startIndex` on every "in" trigger), it
  // never re-declares a local. stateRead{field:"index"} reads the same
  // register from anywhere (see emitStateRead), so no scoping bookkeeping
  // is needed here at all.
  private emitFor(stmt: Extract<IRStmt, { k: "for" }>) {
    const slotIndex = stmt.slot?.slot;
    if (slotIndex === undefined) {
      throw new EmitError("for statement missing its state slot", "flow/for", this.originNodeId);
    }
    const varName = this.module.stateSlots[slotIndex]?.name ?? `for_${slotIndex}`;
    this.push(`${varName} = ${this.emitExpr(stmt.start)};`);
    this.push(`while (${varName} < (${this.emitExpr(stmt.end)})) {`);
    this.indent += 1;
    this.emitStmt(stmt.body);
    this.push(`${varName} = ${varName} + 1;`);
    this.indent -= 1;
    this.push("}");
    if (stmt.completed) {
      this.emitStmt(stmt.completed);
    }
  }

  private emitSetPointer(stmt: Extract<IRStmt, { k: "setPointer" }>) {
    const { pointer, argsObj } = this.pointerCall(stmt.template, stmt.args);
    const valueCode = this.emitExpr(stmt.value);
    const ok = "ok" + Math.abs(hashString(pointer + this.lines.length));
    this.push(`{`);
    this.indent += 1;
    this.push(`const ${ok} = rt.ptrSet(${pointer}, ${argsObj}, "${stmt.type}", ${valueCode});`);
    if (stmt.out || stmt.err) {
      this.push(`if (${ok}) {`);
      this.indent += 1;
      if (stmt.out) this.emitStmt(stmt.out);
      this.indent -= 1;
      if (stmt.err) {
        this.push("} else {");
        this.indent += 1;
        this.emitStmt(stmt.err);
        this.indent -= 1;
      }
      this.push("}");
    }
    this.indent -= 1;
    this.push("}");
  }

  private pointerCall(template: PtrTemplate, args: IRExpr[]): { pointer: string; argsObj: string } {
    const params = pointerTemplateParams(template);
    const entries = params.map((p, i) => `${JSON.stringify(p.name)}: ${this.emitExpr(args[i])}`);
    return { pointer: JSON.stringify(formatPointerTemplate(template)), argsObj: `{ ${entries.join(", ")} }` };
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
        // Always validate against the pointer's own configured signature
        // (valueType), even when reading the "isValid" socket — see
        // model.ts's ptrGet doc comment: `type` is this expression's own
        // result type (bool for isValid reads), not what the resolver
        // should check the raw value against.
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
      if (name === "boolParameter") return "payload[0]";
      if (name === "intParameter") return "payload[1]";
      if (name === "floatParameter") return "payload[2]";
      if (name === "expectedDuration") return "payload[3]";
    }
    throw new EmitError(`param("${name}") not supported for handler kind "${ctx.kind}"`, "param", this.originNodeId);
  }

  // Every case here is a module-level register/slot field (see
  // emitStateSlots) — readable from anywhere, not just lexically inside the
  // owning statement, matching interpreter.ts's own per-op "value" cases
  // (flow/for, flow/doN, flow/multiGate, flow/setDelay, flow/throttle,
  // flow/waitAll — see evaluateValue's switch), each keyed by the same
  // output socket name the field mirrors.
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
      // Unset (never-advanced) reads as the slot's own configured
      // inputFlows — mirrors interpreter.ts's `state?.remainingInputs ??
      // inputFlows` fallback (see flow/waitAll's evaluateValue case).
      const inputFlows = Number((slot.config as { inputFlows?: number }).inputFlows ?? 0);
      return `(${slot.name}.remaining ?? ${inputFlows})`;
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
      // Direct read of the (persistent, event-index-keyed) last-sent
      // payload — order-independent by construction, see engine.ts's
      // eventPayload doc comment and import.ts's GI012 branch.
      const eventIndex = expr.config.eventIndex as number;
      const field = expr.config.field as string;
      const fieldIndex = { boolParameter: 0, intParameter: 1, floatParameter: 2, expectedDuration: 3 }[field];
      return `rt.eventPayload(${eventIndex})[${fieldIndex}]`;
    }
    if (expr.op === "event/onTick#time") {
      return (expr.config.field as string) === "timeSinceStart" ? "rt.tickTime()" : "rt.tickDelta()";
    }
    if (expr.config?.crossContext === true) {
      const sourceNode = expr.config.sourceNode as number;
      const socket = expr.config.socket as string;
      return `rt.eventOutRead(${sourceNode}, ${JSON.stringify(socket)})`;
    }
    throw new EmitError(`intrinsic expr "${expr.op}" has no dedicated lowering`, expr.op, this.originNodeId);
  }

  private emitOp(expr: Extract<IRExpr, { k: "op" }>): string {
    // math/random needs per-engine-instance LCG state (see runtime-lib's
    // math.ts header note), so it's `rt.random()`, not a static `m.*` call.
    if (expr.op === "math/random") {
      return "rt.random()";
    }
    const argsCode = expr.args.map((a) => this.emitExpr(a));
    if (expr.op === "math/quatFromAngles") {
      argsCode.push(JSON.stringify((expr.config?.order as string | undefined) ?? "yxz"));
    }
    const fn = mFunctionName(expr.op, expr.overload);
    const call = `m.${fn}(${argsCode.join(", ")})`;
    const multiOutput = Object.keys(expr.overload.outputs).length > 1;
    if (expr.socket === undefined) {
      return multiOutput ? `${call}.value` : call;
    }
    return /^\d+$/.test(expr.socket) ? `${call}[${expr.socket}]` : `${call}.${expr.socket}`;
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function emitModule(module: IRModule, opts: EmitOptions = {}): EmitResult {
  void opts.flavor;
  return new Emitter(module).run();
}
