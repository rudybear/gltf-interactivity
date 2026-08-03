// Graph JSON -> IR importer. See docs/design/ir-and-transpiler.md ("Graph ->
// IR") for the 4-step design this follows (resolve / structure / materialize
// / names). Two load-bearing deviations from the doc's stated rationale,
// verified empirically against the full 145-file conformance corpus (see
// scripts used during development — not checked in):
//
//  1. The doc's "Why structuring always works" section claims flow edges
//     form a forward DAG (target index > source index) except inside
//     while/for self-activation and async re-entry. That's false for the
//     real corpus: backward flow edges (target index <= source index) are
//     common even in straight-line, non-looping chains (thousands across
//     the corpus) — asset authoring order doesn't track execution order.
//     Value edges DO always strictly decrease in index (verified, 0
//     exceptions across the corpus), so materialization's recursion is
//     still trivially safe; only flow-target structuring needed a more
//     general algorithm than "index ordering rules out cycles":
//       - A node becomes an `IRProc` boundary if it has >=2 *primary-port*
//         predecessor edges (the doc's rule, just counted without relying on
//         index order), OR if the recursive inliner is about to re-enter a
//         node it is already in the middle of expanding (a real graph cycle,
//         which can only happen through async re-entry per the doc — but we
//         no longer assume that's the *only* place it can happen).
//       - Proc bodies are pre-registered (id allocated, added to the
//         in-progress set) *before* their body is built, so a cycle back to
//         a proc's own entry node resolves to `callProc` immediately instead
//         of infinitely recursing.
//     This also means the proc call graph is not always acyclic: a
//     genuinely repeating async pattern (e.g. a self-restarting setDelay)
//     produces a proc whose body calls itself through an `async.done` Cont.
//     That's fine — done fires after the calling stack has fully unwound
//     (real time elapses), so it's not runaway synchronous recursion. See
//     check.ts for the exact (relaxed) acyclicity rule this implies.
//  2. flow/waitAll has no primary "in" port at all (registry: inputFlows =
//     ["reset"] plus dynamic numbered sockets) — *every* trigger is a
//     "secondary port" edge lowered at the sending site (see
//     `lowerSecondaryPort`). That means predecessor-counting via primary-port
//     edges never sees waitAll's multiple trigger sites, so its "out"/
//     "completed" continuation's true fan-in is invisible to the normal
//     predecessor count. `computePredCounts` patches this: any node that is
//     waitAll's "out" or "completed" target gets its predecessor count
//     forced to >=2 whenever the waitAll node itself has >=2 incoming
//     trigger edges (reset + numbered, combined) — otherwise that
//     continuation would get inlined once per triggering site (correct, but
//     needlessly large) instead of extracted into one shared proc.
import {
  defaultValue,
  getOpSpec,
  parseScalar,
  resolveOverload,
  toValue,
  type ResolvedOverload,
  type TypeSig
} from "@gltfi/kernel";
import { NameAllocator } from "./names.js";
import type {
  Cont,
  Diagnostic,
  HandlerKind,
  IREvent,
  IREventValue,
  IRExpr,
  IRHandler,
  IRHandlerParam,
  IRModule,
  IRProc,
  IRStateSlot,
  IRStmt,
  IRType,
  IRVariable,
  PtrTemplate,
  StateKind,
  StateRef,
  TempId
} from "./model.js";
import { parsePointerTemplate, pointerTemplateParams } from "./pointer.js";

// ---------------------------------------------------------------------------
// Plain-JSON graph shape (decoupled from @gltfi/runtime — the importer takes
// (graph, gltf?) plain JSON with no file I/O and no runtime dependency).
// Structurally compatible with @gltfi/runtime's Graph/GraphNode.
// ---------------------------------------------------------------------------

export type GraphValueRef = { node: number; socket?: string };
export type GraphValueLiteral = { type: number; value: Array<number | boolean | string> };
export type GraphNodeValue = GraphValueRef | GraphValueLiteral;
export type GraphFlowRef = { node: number; socket: string };

export type GraphNode = {
  declaration: number;
  configuration?: Record<string, { value: Array<number | boolean | string> }>;
  values?: Record<string, GraphNodeValue>;
  flows?: Record<string, GraphFlowRef>;
};

export type Graph = {
  types: Array<{ signature: string }>;
  variables?: Array<{ id?: string; type: number; value: Array<number | boolean | string> }>;
  events?: Array<{ id?: string; values?: Record<string, { type: number; value: Array<number | boolean | string> }> }>;
  declarations: Array<{ op: string }>;
  nodes: GraphNode[];
};

export type ImportOptions = {
  // Accepted for forward compatibility (e.g. future diagnostics that cross-
  // check pointer targets against real glTF structure); unused today.
  gltf?: unknown;
};

export type ImportResult = { module: IRModule; diagnostics: Diagnostic[] };

const HANDLER_OPS: Record<string, HandlerKind> = {
  "event/onStart": "onStart",
  "event/onTick": "onTick",
  "event/receive": "receive",
  "event/onSelect": "onSelect",
  "event/onHoverIn": "onHoverIn",
  "event/onHoverOut": "onHoverOut"
};

const ASYNC_OPS: Record<string, "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt"> = {
  "flow/setDelay": "setDelay",
  "variable/interpolate": "varInterp",
  "pointer/interpolate": "ptrInterp",
  "animation/start": "animStart",
  "animation/stop": "animStop",
  "animation/stopAt": "animStopAt"
};

const STATEFUL_OPS: Record<string, "doN" | "multiGate" | "waitAll" | "throttle"> = {
  "flow/doN": "doN",
  "flow/multiGate": "multiGate",
  "flow/waitAll": "waitAll",
  "flow/throttle": "throttle"
};

// Ops whose "value" output socket is state (persisted across executions),
// modeled via IRExpr's `stateRead` rather than `op`: for.index, doN.
// currentCount, multiGate.lastIndex, setDelay.lastDelay, throttle.
// lastRemainingTime, waitAll.remainingInputs.
const STATE_VALUE_OPS = new Set(["flow/for", "flow/doN", "flow/multiGate", "flow/setDelay", "flow/throttle", "flow/waitAll"]);

const STATE_PREFIX: Record<StateKind, string> = {
  doN: "doN",
  multiGate: "gate",
  waitAll: "waitAll",
  throttle: "throttle",
  for: "for",
  delay: "delay"
};

// Threaded through one site's value-DAG build: `null` means "no sharing ever"
// (used for while.cond / for.end, which are re-evaluated per check/iteration
// and have no statement slot to hoist a `let` into — see model.ts's header
// comment and the design doc's materialization rules).
type SiteCtx = { counts: Map<string, number>; tempsBuilt: Map<string, TempId>; lets: IRStmt[] };

export function importGraph(graph: Graph, opts: ImportOptions = {}): ImportResult {
  void opts;
  return new Importer(graph).run();
}

class Importer {
  private readonly graph: Graph;
  private readonly diagnostics: Diagnostic[] = [];

  private readonly variables: IRVariable[] = [];
  private readonly variableTypes: IRType[] = [];
  private readonly events: IREvent[] = [];
  private readonly stateSlots: IRStateSlot[] = [];
  private readonly handlers: IRHandler[] = [];
  private readonly procs: IRProc[] = [];
  private readonly sourceNodeIds: Record<string, number> = {};

  private readonly stateSlotNames = new NameAllocator();
  private readonly procNames = new NameAllocator();
  private readonly stateSlotByNode = new Map<number, number>();
  private readonly procIdByNode = new Map<number, number>();
  private readonly nodeOutputTypes = new Map<number, Record<string, IRType>>();
  private readonly resolvedOverloadByNode = new Map<number, ResolvedOverload>();
  private readonly pointerTemplateCache = new Map<number, PtrTemplate>();
  private predCount = new Map<number, number>();

  // Cycle guard for the recursive inliner; per-handler/proc `let` temp name
  // allocator (fresh per top-level body so different handlers/procs may
  // reuse short names like `t5` without colliding).
  private buildingStack = new Set<number>();
  private tempNames = new NameAllocator();
  // Which handler-root node's outputs currently count as `param` (see
  // buildRawExpr's HANDLER_OPS branch) — null while building a proc body
  // (procs must not depend on a specific handler's dispatch context; see
  // check.ts's soft warning for a `param` found inside a proc).
  private currentHandlerRootNode: number | null = null;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  run(): ImportResult {
    this.resolveVariables();
    this.resolveEvents();
    this.resolveTypes();
    this.computePredCounts();
    this.discoverHandlers();

    const module: IRModule = {
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
        sourceNodeIds: this.sourceNodeIds
      }
    };
    return { module, diagnostics: this.diagnostics };
  }

  // -------------------------------------------------------------------
  // Step 1a/1d: variables, events, predecessor counts.
  // -------------------------------------------------------------------

  private resolveVariables() {
    const names = new NameAllocator();
    for (let i = 0; i < (this.graph.variables ?? []).length; i += 1) {
      const v = this.graph.variables![i];
      const sig = this.typeSigAt(v.type);
      const initial = toValue(sig, v.value ?? []);
      const preferred = v.id && v.id.length > 0 ? v.id : `var${i}`;
      const name = names.alloc(preferred);
      this.variables.push({ name, type: sig, initial, extras: v.id ? { id: v.id } : undefined });
      this.variableTypes.push(sig);
    }
  }

  private resolveEvents() {
    const names = new NameAllocator();
    const fixedOrder = ["boolParameter", "intParameter", "floatParameter", "expectedDuration"];
    for (let i = 0; i < (this.graph.events ?? []).length; i += 1) {
      const e = this.graph.events![i];
      const preferred = e.id && e.id.length > 0 ? e.id : `event${i}`;
      const name = names.alloc(preferred);
      const keys = Object.keys(e.values ?? {});
      const ordered = [...fixedOrder.filter((k) => keys.includes(k)), ...keys.filter((k) => !fixedOrder.includes(k)).sort()];
      const values: IREventValue[] = ordered.map((key) => {
        const entry = e.values![key];
        const sig = this.typeSigAt(entry.type);
        return { name: key, type: sig, default: toValue(sig, entry.value) };
      });
      this.events.push({ name, id: e.id, values });
    }
  }

  private typeSigAt(index: number): IRType {
    const sig = this.graph.types[index]?.signature;
    if (!sig) {
      this.warn("GI004", -1, `type index ${index} out of range; defaulting to float`);
      return "float";
    }
    return sig as IRType;
  }

  // Single forward pass (node index ascending): value edges always
  // strictly decrease in index (verified against the whole corpus), so every
  // dependency of node i is already resolved by the time we reach i.
  private resolveTypes() {
    for (let i = 0; i < this.graph.nodes.length; i += 1) {
      this.nodeOutputTypes.set(i, this.computeNodeOutputTypes(i));
    }
  }

  private computeNodeOutputTypes(nodeId: number): Record<string, IRType> {
    const op = this.opOf(nodeId);
    if (op in HANDLER_OPS) {
      const spec = getOpSpec(op);
      const out: Record<string, IRType> = {};
      for (const o of spec?.overloads[0]?.outputs ?? []) {
        out[o.name] = this.toIRType(o.type as TypeSig);
      }
      return out;
    }
    if (op === "variable/get") {
      const varId = this.toIndex(this.configValue(nodeId, "variable"));
      return { value: this.variableTypes[varId] ?? "float" };
    }
    if (op === "pointer/get") {
      return { value: this.pointerValueType(nodeId), isValid: "bool" };
    }
    if (op === "flow/for") {
      return { index: "int" };
    }
    if (op === "flow/doN") {
      return { currentCount: "int" };
    }
    if (op === "flow/multiGate") {
      return { lastIndex: "int" };
    }
    if (op === "flow/setDelay") {
      return { lastDelay: "ref" };
    }
    if (op === "flow/throttle") {
      return { lastRemainingTime: "float" };
    }
    if (op === "flow/waitAll") {
      return { remainingInputs: "int" };
    }
    const spec = getOpSpec(op);
    if (!spec || spec.overloads.length === 0 || spec.purity === "flow") {
      return {};
    }
    const inputTypes = this.gatherDeclaredInputTypes(nodeId, spec.overloads);
    const resolved = resolveOverload(op, inputTypes);
    if (!resolved) {
      return {};
    }
    this.resolvedOverloadByNode.set(nodeId, resolved);
    const out: Record<string, IRType> = {};
    for (const [name, t] of Object.entries(resolved.outputs)) {
      out[name] = this.toIRType(t);
    }
    return out;
  }

  // Builds the probe resolveOverload uses to pick (and unify) an overload
  // row. A fixed (non-generic) socket that some real graph over-widens (e.g.
  // math/mix's scalar "c" fed a same-valued float2 broadcast — the
  // interpreter tolerates this via valueToNumberArray(v)[0]) must not be fed
  // into the probe when it doesn't match any row's declared type: doing so
  // would disqualify the whole row even though a fixed socket never helps
  // *select* a row in the first place (resolveOverload already treats a
  // missing socket as "don't disqualify"; this just extends that leniency to
  // a present-but-mismatched fixed socket). Generic (F/V/M/T) sockets are
  // always fed through as-is since they're exactly what unification needs.
  private gatherDeclaredInputTypes(
    nodeId: number,
    overloads: Array<{ inputs: Array<{ name: string; type: string }> }>
  ): Record<string, TypeSig> {
    const declaredTypesByName = new Map<string, Set<string>>();
    for (const row of overloads) {
      for (const input of row.inputs) {
        let set = declaredTypesByName.get(input.name);
        if (!set) {
          set = new Set();
          declaredTypesByName.set(input.name, set);
        }
        set.add(input.type);
      }
    }
    const result: Record<string, TypeSig> = {};
    for (const [name, declaredTypes] of declaredTypesByName) {
      const provided = this.tryValueSocketType(nodeId, name);
      if (!provided) {
        continue;
      }
      const isGenericSocket = [...declaredTypes].some((t) => t === "F" || t === "V" || t === "M" || t === "T");
      if (isGenericSocket || declaredTypes.has(provided)) {
        result[name] = provided;
      }
    }
    return result;
  }

  private tryValueSocketType(nodeId: number, socket: string): TypeSig | undefined {
    const raw = this.rawValueEntry(nodeId, socket);
    if (!raw) {
      return undefined;
    }
    if ("node" in raw) {
      return this.nodeOutputTypes.get(raw.node)?.[raw.socket ?? "value"];
    }
    return this.graph.types[raw.type]?.signature as TypeSig | undefined;
  }

  private socketType(nodeId: number, socket: string): IRType {
    const t = this.nodeOutputTypes.get(nodeId)?.[socket];
    if (t) {
      return t;
    }
    this.warn("GI003", nodeId, `unresolved type for ${this.opOf(nodeId)}#${socket}; defaulting to float`);
    return "float";
  }

  private pointerValueType(nodeId: number): IRType {
    const idx = this.toIndex(this.configValue(nodeId, "type"));
    const sig = this.graph.types[idx]?.signature;
    if (!sig) {
      this.warn("GI005", nodeId, `pointer node's config.type index ${idx} out of range; defaulting to float`);
      return "float";
    }
    return sig as IRType;
  }

  private pointerTemplateOf(nodeId: number): PtrTemplate {
    const cached = this.pointerTemplateCache.get(nodeId);
    if (cached) {
      return cached;
    }
    const raw = this.configValue(nodeId, "pointer");
    const tpl = parsePointerTemplate(typeof raw === "string" ? raw : "");
    this.pointerTemplateCache.set(nodeId, tpl);
    return tpl;
  }

  // Predecessor counts drive the proc-vs-inline decision (doc: target with
  // >=2 predecessors becomes an IRProc). Only *primary-port* edges count —
  // secondary ports (reset/cancel/numbered) never route through the normal
  // inliner at all (see lowerSecondaryPort), so they must not contribute.
  private computePredCounts() {
    const predCount = new Map<number, number>();
    const allInDegree = new Map<number, number>();
    this.graph.nodes.forEach((node) => {
      for (const ref of Object.values(node.flows ?? {})) {
        allInDegree.set(ref.node, (allInDegree.get(ref.node) ?? 0) + 1);
        if (this.isPrimaryPortEdge(ref.node, ref.socket)) {
          predCount.set(ref.node, (predCount.get(ref.node) ?? 0) + 1);
        }
      }
    });
    // waitAll blind spot (see file header note 2).
    this.graph.nodes.forEach((node, idx) => {
      if (getOpSpec(this.opOf(idx))?.stateKind !== "waitAll") {
        return;
      }
      if ((allInDegree.get(idx) ?? 0) < 2) {
        return;
      }
      const flows = node.flows ?? {};
      for (const key of ["out", "completed"]) {
        const ref = flows[key];
        if (ref) {
          predCount.set(ref.node, Math.max(predCount.get(ref.node) ?? 0, 2));
        }
      }
    });
    this.predCount = predCount;
  }

  private isPrimaryPortEdge(nodeId: number, socket: string): boolean {
    const spec = getOpSpec(this.opOf(nodeId));
    if (!spec) {
      return socket === "in";
    }
    if (spec.stateKind === "waitAll") {
      return false;
    }
    const primary = spec.inputFlows?.[0] ?? "in";
    return socket === primary;
  }

  // -------------------------------------------------------------------
  // Step 2: handler discovery (node-array order == dispatch order) and the
  // recursive flow-structuring descent (proc extraction, per-op raising).
  // -------------------------------------------------------------------

  private discoverHandlers() {
    this.graph.nodes.forEach((node, idx) => {
      const op = this.opOf(idx);
      const kind = HANDLER_OPS[op];
      if (!kind) {
        return;
      }
      this.tempNames = new NameAllocator();
      this.buildingStack = new Set();
      this.currentHandlerRootNode = idx;
      const spec = getOpSpec(op);
      const params: IRHandlerParam[] = (spec?.overloads[0]?.outputs ?? []).map((o) => ({
        name: o.name,
        type: this.toIRType(o.type as TypeSig)
      }));
      let eventRef: number | undefined;
      let config: Record<string, unknown> | undefined;
      if (kind === "receive") {
        eventRef = this.toIndex(this.configValue(idx, "event"));
      } else if (kind === "onSelect") {
        config = {
          nodeIndex: this.toIndex(this.configValue(idx, "nodeIndex") ?? -1),
          stopPropagation: Boolean(this.configValue(idx, "stopPropagation"))
        };
      } else if (kind === "onHoverIn" || kind === "onHoverOut") {
        config = { nodeIndex: this.toIndex(this.configValue(idx, "nodeIndex") ?? -1) };
      }
      const body = this.continueTo(node.flows?.out);
      this.currentHandlerRootNode = null;
      const handlerIndex = this.handlers.length;
      this.handlers.push({ kind, eventRef, config, params, body });
      this.sourceNodeIds[`handler:${handlerIndex}`] = idx;
    });
  }

  private continueTo(ref: GraphFlowRef | undefined): IRStmt {
    if (!ref) {
      return { k: "seq", stmts: [] };
    }
    if (!this.isPrimaryPortEdge(ref.node, ref.socket)) {
      return this.lowerSecondaryPort(ref.node, ref.socket);
    }
    return this.enterNode(ref.node);
  }

  private enterNode(nodeId: number): IRStmt {
    const existingProc = this.procIdByNode.get(nodeId);
    if (existingProc !== undefined) {
      return { k: "callProc", procId: existingProc };
    }
    if ((this.predCount.get(nodeId) ?? 0) >= 2 || this.buildingStack.has(nodeId)) {
      return { k: "callProc", procId: this.buildProc(nodeId) };
    }
    this.buildingStack.add(nodeId);
    const stmt = this.buildInline(nodeId);
    this.buildingStack.delete(nodeId);
    return stmt;
  }

  private buildProc(nodeId: number): number {
    const procId = this.procs.length;
    this.procIdByNode.set(nodeId, procId);
    const name = this.procNames.alloc(`proc${nodeId}`);
    this.procs.push({ id: procId, name, body: { k: "seq", stmts: [] } });
    this.sourceNodeIds[`proc:${procId}`] = nodeId;
    const savedTempNames = this.tempNames;
    const savedHandlerRoot = this.currentHandlerRootNode;
    this.tempNames = new NameAllocator();
    this.currentHandlerRootNode = null;
    this.buildingStack.add(nodeId);
    const body = this.buildInline(nodeId);
    this.buildingStack.delete(nodeId);
    this.tempNames = savedTempNames;
    this.currentHandlerRootNode = savedHandlerRoot;
    this.procs[procId] = { id: procId, name, body };
    return procId;
  }

  // A done-continuation fires after the calling stack fully unwinds (real
  // time elapses before it runs), so it must not share the synchronous
  // buildingStack — see file header note 1.
  private buildDoneCont(ref: GraphFlowRef): Cont {
    if (!this.isPrimaryPortEdge(ref.node, ref.socket)) {
      return { kind: "inline", body: this.lowerSecondaryPort(ref.node, ref.socket) };
    }
    const saved = this.buildingStack;
    this.buildingStack = new Set();
    const stmt = this.enterNode(ref.node);
    this.buildingStack = saved;
    if (stmt.k === "callProc") {
      return { kind: "proc", procId: stmt.procId };
    }
    return { kind: "inline", body: stmt };
  }

  private buildInline(nodeId: number): IRStmt {
    const op = this.opOf(nodeId);
    if (op === "flow/branch") {
      return this.raiseBranch(nodeId);
    }
    if (op === "flow/while") {
      return this.raiseWhile(nodeId);
    }
    if (op === "flow/for") {
      return this.raiseFor(nodeId);
    }
    if (op === "flow/switch") {
      return this.raiseSwitch(nodeId);
    }
    if (op === "flow/sequence") {
      return this.raiseSequence(nodeId);
    }
    if (op === "variable/set") {
      return this.raiseVariableSet(nodeId);
    }
    if (op === "pointer/set") {
      return this.raisePointerSet(nodeId);
    }
    if (op === "event/send") {
      return this.raiseEventSend(nodeId);
    }
    if (op === "event/stopPropagation") {
      return this.raiseStopPropagation(nodeId);
    }
    if (op === "debug/log") {
      return this.raiseLog(nodeId);
    }
    if (op in ASYNC_OPS) {
      return this.raiseAsync(nodeId, ASYNC_OPS[op]);
    }
    if (op in STATEFUL_OPS) {
      return this.raiseStateful(nodeId, STATEFUL_OPS[op]);
    }
    return this.raiseIntrinsic(nodeId);
  }

  private raiseBranch(nodeId: number): IRStmt {
    const { lets, values } = this.materializeSite(nodeId, [{ key: "condition", type: "bool" }]);
    const flows = this.node(nodeId).flows ?? {};
    const thenS = this.continueTo(flows.true);
    const elseS = flows.false ? this.continueTo(flows.false) : undefined;
    return this.withLets(lets, { k: "if", cond: values.condition, then: thenS, else: elseS });
  }

  private raiseWhile(nodeId: number): IRStmt {
    const cond = this.buildNoTempExpr(nodeId, "condition", "bool");
    const flows = this.node(nodeId).flows ?? {};
    const body = this.continueTo(flows.loopBody);
    const completed = flows.completed ? this.continueTo(flows.completed) : undefined;
    return { k: "while", cond, body, completed };
  }

  private raiseFor(nodeId: number): IRStmt {
    const { lets, values } = this.materializeSite(nodeId, [{ key: "startIndex", type: "int" }]);
    const end = this.buildNoTempExpr(nodeId, "endIndex", "int");
    const slot = this.getOrCreateStateSlot(nodeId);
    const flows = this.node(nodeId).flows ?? {};
    const body = this.continueTo(flows.loopBody);
    const completed = flows.completed ? this.continueTo(flows.completed) : undefined;
    return this.withLets(lets, { k: "for", slot, start: values.startIndex, end, body, completed });
  }

  private raiseSwitch(nodeId: number): IRStmt {
    const { lets, values } = this.materializeSite(nodeId, [{ key: "selection", type: "int" }]);
    const casesCfg = (this.configValue(nodeId, "cases") as number[] | undefined) ?? [];
    const flows = this.node(nodeId).flows ?? {};
    const cases: Array<[number, IRStmt]> = [...new Set(casesCfg)]
      .sort((a, b) => a - b)
      .map((c) => {
        const ref = flows[String(c)];
        return [c, ref ? this.continueTo(ref) : { k: "seq", stmts: [] }] as [number, IRStmt];
      });
    const def = flows.default ? this.continueTo(flows.default) : undefined;
    return this.withLets(lets, { k: "switch", selector: values.selection, cases, default: def });
  }

  private raiseSequence(nodeId: number): IRStmt {
    const flows = this.node(nodeId).flows ?? {};
    const keys = Object.keys(flows).sort();
    return { k: "seq", stmts: keys.map((key) => this.continueTo(flows[key])) };
  }

  private raiseVariableSet(nodeId: number): IRStmt {
    const idsRaw = this.configValue(nodeId, "variables");
    const ids = (Array.isArray(idsRaw) ? idsRaw : idsRaw !== undefined ? [idsRaw] : []).map((v) => this.toIndex(v));
    const stmts: IRStmt[] = [];
    for (const varId of ids) {
      const varType = this.variableTypes[varId] ?? "float";
      const { lets, values } = this.materializeSite(nodeId, [{ key: String(varId), type: varType }]);
      stmts.push(...lets);
      stmts.push({ k: "setVar", varId, expr: values[String(varId)] });
    }
    stmts.push(this.continueTo(this.node(nodeId).flows?.out));
    return { k: "seq", stmts };
  }

  private raisePointerSet(nodeId: number): IRStmt {
    const template = this.pointerTemplateOf(nodeId);
    const params = pointerTemplateParams(template);
    const valueType = this.pointerValueType(nodeId);
    const roots: Array<{ key: string; type: IRType }> = [
      { key: "value", type: valueType },
      ...params.map((p) => ({ key: p.name, type: (p.kind === "int" ? "int" : "ref") as IRType }))
    ];
    const { lets, values } = this.materializeSite(nodeId, roots);
    const args = params.map((p) => values[p.name]);
    const flows = this.node(nodeId).flows ?? {};
    const out = flows.out ? this.continueTo(flows.out) : undefined;
    const err = flows.err ? this.continueTo(flows.err) : undefined;
    return this.withLets(lets, { k: "setPointer", template, args, value: values.value, out, err });
  }

  private raiseEventSend(nodeId: number): IRStmt {
    const eventId = this.toIndex(this.configValue(nodeId, "event"));
    const roots: Array<{ key: string; type: IRType }> = [
      { key: "boolParameter", type: "bool" },
      { key: "intParameter", type: "int" },
      { key: "floatParameter", type: "float" },
      { key: "expectedDuration", type: "float" }
    ];
    const { lets, values } = this.materializeSite(nodeId, roots);
    const args = roots.map((r) => values[r.key]);
    const stmts: IRStmt[] = [...lets, { k: "emitEvent", eventId, args }, this.continueTo(this.node(nodeId).flows?.out)];
    return { k: "seq", stmts };
  }

  private raiseStopPropagation(nodeId: number): IRStmt {
    const { lets, values } = this.materializeSite(nodeId, [{ key: "stopImmediate", type: "bool" }]);
    const eventRaw = this.rawValueEntry(nodeId, "event");
    if (eventRaw && "node" in eventRaw) {
      const originOp = this.opOf(eventRaw.node);
      if (!(originOp in HANDLER_OPS) || (eventRaw.socket ?? "value") !== "event") {
        this.warn(
          "GI010",
          nodeId,
          "event/stopPropagation's `event` input is not the enclosing handler's own event; IR always targets the current event"
        );
      }
    }
    const stmts: IRStmt[] = [
      ...lets,
      { k: "stopPropagation", stopImmediate: values.stopImmediate, config: {} },
      this.continueTo(this.node(nodeId).flows?.out)
    ];
    return { k: "seq", stmts };
  }

  private raiseLog(nodeId: number): IRStmt {
    const template = (this.configValue(nodeId, "message") as string | undefined) ?? "";
    const node = this.node(nodeId);
    const keys = Object.keys(node.values ?? {})
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b));
    const roots = keys.map((k) => ({ key: k, type: this.inferLogArgType(nodeId, k) }));
    const { lets, values } = this.materializeSite(nodeId, roots);
    const args = keys.map((k) => values[k]);
    const stmts: IRStmt[] = [...lets, { k: "log", template, args }, this.continueTo(node.flows?.out)];
    return { k: "seq", stmts };
  }

  private inferLogArgType(nodeId: number, key: string): IRType {
    const raw = this.rawValueEntry(nodeId, key);
    if (raw && "node" in raw) {
      return this.socketType(raw.node, raw.socket ?? "value");
    }
    if (raw) {
      return this.typeSigAt(raw.type);
    }
    return "float";
  }

  private raiseAsync(nodeId: number, kind: "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt"): IRStmt {
    const flows = this.node(nodeId).flows ?? {};
    const out = flows.out ? this.continueTo(flows.out) : undefined;
    const err = flows.err ? this.continueTo(flows.err) : undefined;
    const done = flows.done ? this.buildDoneCont(flows.done) : undefined;

    if (kind === "setDelay") {
      const slot = this.getOrCreateStateSlot(nodeId);
      const { lets, values } = this.materializeSite(nodeId, [{ key: "duration", type: "float" }]);
      return this.withLets(lets, { k: "async", kind, slot, args: [values.duration], done, out, err });
    }
    if (kind === "varInterp") {
      const varId = this.toIndex(this.configValue(nodeId, "variable"));
      const useSlerp = Boolean(this.configValue(nodeId, "useSlerp"));
      const varType = this.variableTypes[varId] ?? "float";
      const roots: Array<{ key: string; type: IRType }> = [
        { key: "value", type: varType },
        { key: "duration", type: "float" },
        { key: "p1", type: "float2" },
        { key: "p2", type: "float2" }
      ];
      const { lets, values } = this.materializeSite(nodeId, roots);
      const args = roots.map((r) => values[r.key]);
      return this.withLets(lets, { k: "async", kind, config: { varId, useSlerp }, args, done, out, err });
    }
    if (kind === "ptrInterp") {
      const template = this.pointerTemplateOf(nodeId);
      const params = pointerTemplateParams(template);
      const valueType = this.pointerValueType(nodeId);
      const roots: Array<{ key: string; type: IRType }> = [
        { key: "value", type: valueType },
        { key: "duration", type: "float" },
        { key: "p1", type: "float2" },
        { key: "p2", type: "float2" },
        ...params.map((p) => ({ key: p.name, type: (p.kind === "int" ? "int" : "ref") as IRType }))
      ];
      const { lets, values } = this.materializeSite(nodeId, roots);
      const args = roots.map((r) => values[r.key]);
      return this.withLets(lets, { k: "async", kind, template, args, done, out, err });
    }
    if (kind === "animStart") {
      const roots: Array<{ key: string; type: IRType }> = [
        { key: "animation", type: "ref" },
        { key: "startTime", type: "float" },
        { key: "endTime", type: "float" },
        { key: "speed", type: "float" }
      ];
      const { lets, values } = this.materializeSite(nodeId, roots);
      const args = roots.map((r) => values[r.key]);
      return this.withLets(lets, { k: "async", kind, args, done, out, err });
    }
    if (kind === "animStop") {
      const { lets, values } = this.materializeSite(nodeId, [{ key: "animation", type: "ref" }]);
      return this.withLets(lets, { k: "async", kind, args: [values.animation], done, out, err });
    }
    // animStopAt
    const roots: Array<{ key: string; type: IRType }> = [
      { key: "animation", type: "ref" },
      { key: "stopTime", type: "float" }
    ];
    const { lets, values } = this.materializeSite(nodeId, roots);
    const args = roots.map((r) => values[r.key]);
    return this.withLets(lets, { k: "async", kind, args, done, out, err });
  }

  private raiseStateful(nodeId: number, kind: "doN" | "multiGate" | "waitAll" | "throttle"): IRStmt {
    const slot = this.getOrCreateStateSlot(nodeId);
    const flows = this.node(nodeId).flows ?? {};
    if (kind === "doN") {
      const { lets, values } = this.materializeSite(nodeId, [{ key: "n", type: "int" }]);
      const outs: Record<string, IRStmt> = {};
      if (flows.out) {
        outs.out = this.continueTo(flows.out);
      }
      return this.withLets(lets, { k: "stateful", kind, slot, port: "in", args: [values.n], outs });
    }
    if (kind === "throttle") {
      const { lets, values } = this.materializeSite(nodeId, [{ key: "duration", type: "float" }]);
      const outs: Record<string, IRStmt> = {};
      if (flows.out) {
        outs.out = this.continueTo(flows.out);
      }
      if (flows.err) {
        outs.err = this.continueTo(flows.err);
      }
      return this.withLets(lets, { k: "stateful", kind, slot, port: "in", args: [values.duration], outs });
    }
    if (kind === "multiGate") {
      const outs: Record<string, IRStmt> = {};
      for (const key of Object.keys(flows).sort()) {
        outs[key] = this.continueTo(flows[key]);
      }
      return { k: "stateful", kind, slot, port: "in", args: [], outs };
    }
    // waitAll's "in" is never reached via primary-port entry (it declares
    // none) — this branch is a defensive fallback only.
    const outs: Record<string, IRStmt> = {};
    if (flows.out) {
      outs.out = this.continueTo(flows.out);
    }
    if (flows.completed) {
      outs.completed = this.continueTo(flows.completed);
    }
    return { k: "stateful", kind, slot, port: "in", args: [], outs };
  }

  // Edges targeting a node's non-primary input socket (doN/multiGate/
  // throttle/waitAll's "reset", waitAll's numbered ports, setDelay's
  // "cancel") never enter the normal inliner — the interpreter fires no
  // further downstream flow at all for most of these (reset, cancel), and
  // waitAll's numbered ports resolve to whichever of its own "out"/
  // "completed" continuations the runtime decision picks. Lowered at the
  // *sending* site per the design doc.
  private lowerSecondaryPort(nodeId: number, socket: string): IRStmt {
    const op = this.opOf(nodeId);
    const spec = getOpSpec(op);
    const flows = this.node(nodeId).flows ?? {};
    if (spec?.stateKind === "doN" && socket === "reset") {
      return { k: "stateful", kind: "doN", slot: this.getOrCreateStateSlot(nodeId), port: "reset", args: [], outs: {} };
    }
    if (spec?.stateKind === "multiGate" && socket === "reset") {
      return { k: "stateful", kind: "multiGate", slot: this.getOrCreateStateSlot(nodeId), port: "reset", args: [], outs: {} };
    }
    if (spec?.stateKind === "throttle" && socket === "reset") {
      return { k: "stateful", kind: "throttle", slot: this.getOrCreateStateSlot(nodeId), port: "reset", args: [], outs: {} };
    }
    if (spec?.stateKind === "waitAll") {
      const slot = this.getOrCreateStateSlot(nodeId);
      if (socket === "reset") {
        return { k: "stateful", kind: "waitAll", slot, port: "reset", args: [], outs: {} };
      }
      const idx = Number(socket);
      const outs: Record<string, IRStmt> = {};
      if (flows.out) {
        outs.out = this.continueTo(flows.out);
      }
      if (flows.completed) {
        outs.completed = this.continueTo(flows.completed);
      }
      return { k: "stateful", kind: "waitAll", slot, port: Number.isFinite(idx) ? idx : 0, args: [], outs };
    }
    if (op === "flow/setDelay" && socket === "cancel") {
      const slot = this.getOrCreateStateSlot(nodeId);
      return { k: "intrinsic", op: "flow/setDelay#cancel", config: { slot: slot.slot }, args: [], outs: {} };
    }
    this.warn("GI011", nodeId, `unhandled secondary flow port "${socket}" on "${op}"`);
    return { k: "seq", stmts: [] };
  }

  private raiseIntrinsic(nodeId: number): IRStmt {
    const op = this.opOf(nodeId);
    const spec = getOpSpec(op);
    const flows = this.node(nodeId).flows ?? {};
    let lets: IRStmt[] = [];
    let args: IRExpr[] = [];
    if (spec && spec.overloads.length > 0) {
      const roots = spec.overloads[0].inputs.map((s) => ({ key: s.name, type: this.toIRType(s.type as TypeSig) }));
      const site = this.materializeSite(nodeId, roots);
      lets = site.lets;
      args = roots.map((r) => site.values[r.key]);
    }
    const outs: Record<string, IRStmt> = {};
    for (const key of Object.keys(flows).sort()) {
      outs[key] = this.continueTo(flows[key]);
    }
    this.warn("GI099", nodeId, `op "${op}" lowered to intrinsic (no dedicated raising rule)`);
    return this.withLets(lets, { k: "intrinsic", op, config: {}, args, outs });
  }

  // -------------------------------------------------------------------
  // Step 3: materialization (caching-correct inlining).
  // -------------------------------------------------------------------

  private materializeSite(nodeId: number, roots: Array<{ key: string; type: IRType }>): { lets: IRStmt[]; values: Record<string, IRExpr> } {
    const node = this.node(nodeId);
    const counts = new Map<string, number>();
    const visited = new Set<string>();
    const refs = new Map<string, { node: number; socket: string }>();
    for (const r of roots) {
      const raw = node.values?.[r.key];
      if (raw && "node" in raw) {
        const ref = { node: raw.node, socket: raw.socket ?? "value" };
        refs.set(r.key, ref);
        this.countRefs(ref.node, ref.socket, counts, visited);
      }
    }
    const ctx: SiteCtx = { counts, tempsBuilt: new Map(), lets: [] };
    const values: Record<string, IRExpr> = {};
    for (const r of roots) {
      const ref = refs.get(r.key);
      if (ref) {
        values[r.key] = this.buildValueExpr(ref.node, ref.socket, ctx);
        continue;
      }
      const raw = node.values?.[r.key] as GraphValueLiteral | undefined;
      values[r.key] = raw ? this.constExprFromRaw(raw) : { k: "const", type: r.type, data: defaultValue(r.type).data };
    }
    return { lets: ctx.lets, values };
  }

  private buildNoTempExpr(nodeId: number, key: string, fallbackType: IRType): IRExpr {
    const raw = this.rawValueEntry(nodeId, key);
    if (raw && "node" in raw) {
      return this.buildValueExpr(raw.node, raw.socket ?? "value", null);
    }
    if (raw) {
      return this.constExprFromRaw(raw);
    }
    return { k: "const", type: fallbackType, data: defaultValue(fallbackType).data };
  }

  private countRefs(nodeId: number, socket: string, counts: Map<string, number>, visited: Set<string>) {
    const key = `${nodeId}:${socket}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (visited.has(key)) {
      return;
    }
    visited.add(key);
    for (const dep of this.valueDeps(nodeId)) {
      this.countRefs(dep.node, dep.socket, counts, visited);
    }
  }

  private valueDeps(nodeId: number): Array<{ node: number; socket: string }> {
    const out: Array<{ node: number; socket: string }> = [];
    for (const v of Object.values(this.node(nodeId).values ?? {})) {
      if (v && "node" in v) {
        out.push({ node: v.node, socket: v.socket ?? "value" });
      }
    }
    return out;
  }

  // ctx === null means "no sharing, ever" (while.cond / for.end).
  private buildValueExpr(nodeId: number, socket: string, ctx: SiteCtx | null): IRExpr {
    if (!ctx) {
      return this.buildRawExpr(nodeId, socket, null);
    }
    const key = `${nodeId}:${socket}`;
    const existing = ctx.tempsBuilt.get(key);
    if (existing) {
      return { k: "temp", id: existing };
    }
    const needsTemp = (ctx.counts.get(key) ?? 0) >= 2;
    const expr = this.buildRawExpr(nodeId, socket, ctx);
    if (!needsTemp) {
      return expr;
    }
    const type = this.socketType(nodeId, socket);
    const id = this.tempNames.alloc(`t${nodeId}`);
    ctx.lets.push({ k: "let", temp: id, type, expr });
    ctx.tempsBuilt.set(key, id);
    this.sourceNodeIds[`temp:${id}`] = nodeId;
    return { k: "temp", id };
  }

  private buildRawExpr(nodeId: number, socket: string, ctx: SiteCtx | null): IRExpr {
    const op = this.opOf(nodeId);
    if (op in HANDLER_OPS) {
      // A handler-root node's outputs are, semantically, reads of interpreter-
      // global dispatch state (current tick timing, current selection, the
      // active event payload, ...) rather than a lexically-scoped parameter
      // — the graph JSON has no notion of "handler" at all, only node index
      // ordering, so a value edge is free to read an event node's output
      // from anywhere with a higher index (verified in the corpus: e.g.
      // flow/setDelay_and_cancelDelay reads event/onTick's timeSinceStart
      // from a node that ends up structured under the onStart handler).
      // `param` models the common (and only *safely* IR-representable) case
      // — a read from within the SAME handler whose root produced it; a
      // cross-context read falls back to `intrinsic` (with a diagnostic)
      // since there is no dedicated IR node for "read some other dispatch
      // context's payload".
      if (nodeId === this.currentHandlerRootNode) {
        return { k: "param", name: socket, type: this.socketType(nodeId, socket) };
      }
      this.warn("GI012", nodeId, `read of handler-root node's "${socket}" output from outside its own handler body; lowered to intrinsic`);
      // `sourceNode` is the original graph node index of the event node
      // whose output is being read cross-handler — @gltfi/emit-ts needs it
      // to correlate this read against the writing handler's
      // `sourceNodeIds["handler:<i>"]` entry (see docs/design/ir-and-
      // transpiler.md's GI012 note) and lower to rt.eventOutRead(sourceNode,
      // socket), with the owning handler emitting a matching
      // rt.eventOut(sourceNode, socket, ...) write.
      return {
        k: "intrinsic",
        op,
        config: { crossContext: true, socket, sourceNode: nodeId },
        args: [],
        type: this.socketType(nodeId, socket)
      };
    }
    if (op === "variable/get") {
      return { k: "varGet", varId: this.toIndex(this.configValue(nodeId, "variable")) };
    }
    if (op === "pointer/get") {
      return this.buildPointerGetExpr(nodeId, socket, ctx);
    }
    if (op === "math/switch") {
      return this.buildMathSwitchExpr(nodeId, ctx);
    }
    if (STATE_VALUE_OPS.has(op)) {
      return { k: "stateRead", slot: this.getOrCreateStateSlot(nodeId), field: socket, type: this.socketType(nodeId, socket) };
    }
    const spec = getOpSpec(op);
    if (!spec) {
      this.warn("GI001", nodeId, `unknown op "${op}" in value position; using intrinsic fallback`);
      return { k: "intrinsic", op, config: {}, args: [], type: "float" };
    }
    const resolved = this.resolvedOverloadByNode.get(nodeId);
    if (!resolved) {
      this.warn("GI002", nodeId, `could not resolve overload for "${op}"; using intrinsic fallback`);
      return { k: "intrinsic", op, config: {}, args: [], type: "float" };
    }
    const row = spec.overloads[resolved.overloadIndex];
    const args = row.inputs.map((inputSocket) => this.buildArgExpr(nodeId, inputSocket.name, resolved.inputs[inputSocket.name] ?? "float", ctx));
    // Plain (non-configSockets) config fields — e.g. math/quatFromAngles's
    // "order" — affect fixed op behavior but never show up as a wired value
    // socket, so they must be read here or lost entirely. Ops using
    // configSockets (math/switch, variable/*, pointer/*, event/*, debug/log,
    // flow/for/multiGate/waitAll) all have dedicated raising rules above and
    // never reach this generic path.
    let config: Record<string, unknown> | undefined;
    if (spec.config && spec.config.length > 0) {
      config = {};
      for (const field of spec.config) {
        const raw = this.configValue(nodeId, field.name);
        config[field.name] = raw !== undefined ? raw : field.default;
      }
    }
    return { k: "op", op, overload: resolved, args, socket: socket === "value" ? undefined : socket, config };
  }

  private buildArgExpr(nodeId: number, socket: string, fallbackTypeSig: TypeSig, ctx: SiteCtx | null): IRExpr {
    const raw = this.rawValueEntry(nodeId, socket);
    if (raw && "node" in raw) {
      return this.buildValueExpr(raw.node, raw.socket ?? "value", ctx);
    }
    if (raw) {
      return this.constExprFromRaw(raw);
    }
    const t = this.toIRType(fallbackTypeSig);
    return { k: "const", type: t, data: defaultValue(t).data };
  }

  private buildPointerGetExpr(nodeId: number, socket: string, ctx: SiteCtx | null): IRExpr {
    const template = this.pointerTemplateOf(nodeId);
    const params = pointerTemplateParams(template);
    const args = params.map((p) => this.buildArgExpr(nodeId, p.name, p.kind === "int" ? "int" : "ref", ctx));
    if (socket === "isValid") {
      return { k: "ptrGet", template, args, type: "bool", wantIsValid: true };
    }
    return { k: "ptrGet", template, args, type: this.pointerValueType(nodeId), wantIsValid: false };
  }

  private buildMathSwitchExpr(nodeId: number, ctx: SiteCtx | null): IRExpr {
    const cases = (this.configValue(nodeId, "cases") as number[] | undefined) ?? [];
    const sorted = [...new Set(cases)].sort((a, b) => a - b);
    const resolved = this.resolvedOverloadByNode.get(nodeId);
    const outType = resolved ? this.toIRType(resolved.outputs.value ?? "float") : "float";
    const selection = this.buildArgExpr(nodeId, "selection", "int", ctx);
    const def = this.buildArgExpr(nodeId, "default", outType, ctx);
    const caseArgs = sorted.map((c) => this.buildArgExpr(nodeId, String(c), outType, ctx));
    return { k: "intrinsic", op: "math/switch", config: { cases: sorted }, args: [selection, def, ...caseArgs], type: outType };
  }

  private constExprFromRaw(raw: GraphValueLiteral): IRExpr {
    const sig = this.typeSigAt(raw.type);
    const value = toValue(sig, raw.value);
    return { k: "const", type: sig, data: value.data };
  }

  // -------------------------------------------------------------------
  // State slots (doN/multiGate/waitAll/throttle/for/delay).
  // -------------------------------------------------------------------

  private getOrCreateStateSlot(nodeId: number): StateRef {
    const existing = this.stateSlotByNode.get(nodeId);
    if (existing !== undefined) {
      return { slot: existing };
    }
    const op = this.opOf(nodeId);
    const spec = getOpSpec(op);
    const kind = (spec?.stateKind ?? "delay") as StateKind;
    const config = this.stateSlotConfig(nodeId, kind);
    const prefix = STATE_PREFIX[kind];
    const name = this.stateSlotNames.alloc(`${prefix}${nodeId}`);
    const idx = this.stateSlots.length;
    this.stateSlots.push({ name, kind, config });
    this.sourceNodeIds[`stateSlot:${idx}`] = nodeId;
    this.stateSlotByNode.set(nodeId, idx);
    return { slot: idx };
  }

  private stateSlotConfig(nodeId: number, kind: StateKind): Record<string, unknown> {
    if (kind === "multiGate") {
      return { isRandom: Boolean(this.configValue(nodeId, "isRandom")), isLoop: Boolean(this.configValue(nodeId, "isLoop")) };
    }
    if (kind === "waitAll") {
      return { inputFlows: this.toIndex(this.configValue(nodeId, "inputFlows") ?? 0) };
    }
    if (kind === "for") {
      return { initialIndex: this.toIndex(this.configValue(nodeId, "initialIndex") ?? 0) };
    }
    return {};
  }

  // -------------------------------------------------------------------
  // Small shared helpers.
  // -------------------------------------------------------------------

  private withLets(lets: IRStmt[], stmt: IRStmt): IRStmt {
    return lets.length > 0 ? { k: "seq", stmts: [...lets, stmt] } : stmt;
  }

  private node(nodeId: number): GraphNode {
    return this.graph.nodes[nodeId];
  }

  private opOf(nodeId: number): string {
    const node = this.graph.nodes[nodeId];
    if (!node) {
      return "";
    }
    return this.graph.declarations[node.declaration]?.op ?? "";
  }

  private rawValueEntry(nodeId: number, key: string): GraphNodeValue | undefined {
    return this.node(nodeId).values?.[key];
  }

  private configValue(nodeId: number, key: string): unknown {
    const entry = this.node(nodeId).configuration?.[key];
    if (!entry) {
      return undefined;
    }
    const parsed = entry.value.map((v) => parseScalar(v));
    return parsed.length === 1 ? parsed[0] : parsed;
  }

  private toIRType(t: TypeSig): IRType {
    return t === "custom" ? "ref" : t;
  }

  private toIndex(v: unknown): number {
    if (typeof v === "number") {
      return v;
    }
    if (typeof v === "boolean") {
      return v ? 1 : 0;
    }
    if (Array.isArray(v)) {
      return this.toIndex(v[0]);
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private warn(code: string, nodeIndex: number, message: string) {
    this.diagnostics.push({ severity: "warning", code, message, nodeIndex });
  }
}
