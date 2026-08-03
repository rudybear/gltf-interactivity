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
    this.emitForStateSlots();
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
      const duration = e.values.find((v) => v.name === "expectedDuration");
      const fields: string[] = [];
      if (e.id) {
        fields.push(`externalId: ${JSON.stringify(e.id)}`);
      }
      if (duration) {
        fields.push(`expectedDuration: ${floatLiteral(Number(duration.default.data[0] ?? 0))}`);
      }
      return `{ ${fields.join(", ")} }`;
    });
    this.push(`rt.events([${entries.join(", ")}]);`);
  }

  // "for" state slots are real persisted cross-invocation registers (the
  // interpreter's flow/for keeps `nodeStates.get(nodeId).forIndex` around
  // between executions, readable via a value edge from *anywhere* — before
  // the loop has ever run it reads config.initialIndex, and after it reads
  // whatever the last run left it at, until the loop runs again — see
  // interpreter.ts's "flow/for" evaluateValue and executeNodeFlow cases).
  // A plain module-level `let` per slot, assigned (not re-declared) by the
  // for-statement's own execution, reproduces that exactly; stateRead just
  // references it unconditionally (see emitStateRead) — no lexical scoping
  // needed. Other state slot kinds (doN/multiGate/waitAll/throttle/delay)
  // aren't in this milestone's scope (see file header note).
  private emitForStateSlots() {
    this.module.stateSlots.forEach((slot) => {
      if (slot.kind !== "for") {
        return;
      }
      const initial = Number((slot.config as { initialIndex?: number }).initialIndex ?? 0);
      this.push(`let ${slot.name} = ${floatLiteral(Math.trunc(initial))};`);
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
        this.push(`switch (${this.emitExpr(stmt.selector)}) {`);
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
        this.push("rt.stopPropagation();");
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
        throw new EmitError(`async op "${stmt.kind}" not supported this milestone (no delay/interpolate/animation in scope)`, `async/${stmt.kind}`, this.originNodeId);
      case "stateful":
        throw new EmitError(`stateful op "${stmt.kind}" not supported this milestone (no doN/multiGate/waitAll/throttle in scope)`, `stateful/${stmt.kind}`, this.originNodeId);
      case "intrinsic":
        throw new EmitError(`intrinsic op "${stmt.op}" has no dedicated lowering`, stmt.op, this.originNodeId);
    }
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
    this.push(`const ${ok} = rt.ptrSet(${pointer}, ${argsObj}, ${valueCode});`);
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
        const call = `rt.ptrGet(${pointer}, ${argsObj}, "${expr.type}")`;
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

  private emitStateRead(slotIndex: number, field: string): string {
    const slot = this.module.stateSlots[slotIndex];
    if (!slot || slot.kind !== "for" || field !== "index") {
      throw new EmitError(`stateRead on "${slot?.kind ?? "?"}".${field} not supported this milestone`, "stateRead", this.originNodeId);
    }
    // Module-level register (see emitForStateSlots) — readable from
    // anywhere, not just lexically inside the owning for-statement.
    return slot.name;
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
