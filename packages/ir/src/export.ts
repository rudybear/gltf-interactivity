// IR -> KHR_interactivity graph JSON exporter. See docs/design/ir-and-
// transpiler.md's "IR -> graph" section for the design this follows: CSE
// (pure-closed rule), union-constraint topological index assignment,
// declaration/type dedup, zero-padded sequence/multiGate socket ids, config
// serialization.
//
// Node-graph construction happens in two phases against PLACEHOLDER ids
// (simple incrementing integers assigned at node-creation time, unrelated to
// final graph order):
//   1. Build every node (handler roots, flow nodes, value nodes) with
//      placeholder ids, recording value/flow references as they're wired.
//   2. Derive a topological order from the placeholder graph itself (every
//      `{node: N, ...}` reference already IS a "N must precede me" edge, for
//      both values and flows — see step (2)'s own comment below) and remap
//      every reference to final indices.
//
// Two load-bearing simplifications, both justified in this file's own
// comments at point of use:
//   - `seq` is ambiguous in the IR model (it's reused both for "chain these
//     flow-producing statements one after another via each one's own
//     unconnected trailing socket" AND for "these are N independent branches
//     of a multi-output upstream node, e.g. flow/sequence's keys" — nothing
//     in the shape itself says which). This exporter resolves the ambiguity
//     uniformly and safely: process left-to-right; a statement kind with a
//     known implicit trailing socket (setVar/emitEvent/log/stopPropagation/
//     flow/cancelDelay's "out"; while/for's "completed" when not already
//     populated) chains directly into whatever follows; anything else that's
//     followed by more statements gets wrapped in a *synthesized*
//     `flow/sequence` node with two branches. A synthesized wrapper changes
//     nothing about execution order or which nodes fire — see "Equivalence":
//     this is a structural, not semantic, difference from any one particular
//     original graph.
//   - every `variable/set` IRStmt becomes its own single-variable
//     `variable/set` graph node (never re-merged with an adjacent one into a
//     multi-variable node) — always spec-valid, just not maximally compact.
import type { TypeSig } from "@gltfi/kernel";
import { formatPointerTemplate, pointerTemplateParams } from "./pointer.js";
import type {
  Cont,
  Diagnostic,
  HandlerKind,
  IRExpr,
  IRHandler,
  IRModule,
  IRProc,
  IRStateSlot,
  IRStmt,
  IRType,
  PtrTemplate,
  StateKind
} from "./model.js";
import type { GraphFlowRef, GraphNode, GraphNodeValue } from "./import.js";

export type GraphJson = {
  types: Array<{ signature: string }>;
  variables: Array<{ id?: string; type: number; value: Array<number | boolean | string> }>;
  events: Array<{ id?: string; values?: Record<string, { type: number; value: Array<number | boolean | string> }> }>;
  declarations: Array<{ op: string }>;
  nodes: GraphNode[];
};

export type ExportResult = { graph: GraphJson; diagnostics: Diagnostic[]; stats: ExportStats };

export type ExportStats = {
  nodesBeforeMerge: number;
  nodesAfterMerge: number;
  mergedCount: number;
};

const HANDLER_OP: Record<HandlerKind, string> = {
  onStart: "event/onStart",
  onTick: "event/onTick",
  receive: "event/receive",
  onSelect: "event/onSelect",
  onHoverIn: "event/onHoverIn",
  onHoverOut: "event/onHoverOut"
};

const ASYNC_OP: Record<Extract<IRStmt, { k: "async" }>["kind"], string> = {
  setDelay: "flow/setDelay",
  varInterp: "variable/interpolate",
  ptrInterp: "pointer/interpolate",
  animStart: "animation/start",
  animStop: "animation/stop",
  animStopAt: "animation/stopAt"
};

const STATEFUL_OP: Record<StateKind, string> = {
  doN: "flow/doN",
  multiGate: "flow/multiGate",
  waitAll: "flow/waitAll",
  throttle: "flow/throttle",
  for: "flow/for",
  delay: "flow/setDelay"
};

type NodeRef = { node: number; socket: string };

// A builder node: same shape as the final GraphNode but `values`/`flows`
// reference PLACEHOLDER ids (see file header) until the final remap pass.
type Builder = {
  op: string;
  config: Record<string, { value: Array<number | boolean | string> }>;
  values: Record<string, NodeRef | { literalType: IRType; data: Array<number | boolean | string> }>;
  flows: Record<string, NodeRef>;
};

// One handler/proc/done-continuation body's local temp -> already-built
// value-reference cache (see file header: temp ids never leak across
// bodies, matching @gltfi/ir's own materialization invariant, so a plain
// per-body Map is exactly the right scope — no finer-grained "site"
// tracking is needed here, unlike importGraph's materializeSite).
type SiteScope = { tempRef: Map<string, Builder["values"][string]>; handlerRoot: number | null };

export function exportGraph(module: IRModule): ExportResult {
  return new Exporter(module).run();
}

class Exporter {
  private readonly module: IRModule;
  private readonly diagnostics: Diagnostic[] = [];

  private nextId = 0;
  private readonly nodes = new Map<number, Builder>();
  private readonly declByOp = new Map<string, number>();
  private readonly declOrder: string[] = [];
  private readonly typeIndexByName = new Map<IRType, number>();
  private readonly typeOrder: IRType[] = [];

  // Pure-closed CSE cache: structural key -> already-built node reference.
  private readonly pureCache = new Map<string, Builder["values"][string]>();
  // Every allocNode() call counts toward the actual, post-merge node count
  // (nodes.size); cseHits counts how many of those allocations a CSE cache
  // hit AVOIDED — see the stats computation in run() for how these combine
  // into a "before merge" figure (nodesBeforeMerge stats field name is
  // slightly informal: it's actually reconstructed as
  // `nodes.size + cseHits`, i.e. "how many nodes there would be with CSE
  // turned off", not a separately-tracked running total).
  private cseHits = 0;

  private readonly procEntry = new Map<number, NodeRef>();
  private readonly procBuilding = new Set<number>();
  private readonly stateNodeId = new Map<number, number>();

  constructor(module: IRModule) {
    this.module = module;
  }

  run(): ExportResult {
    const handlerRoots: number[] = [];
    this.module.handlers.forEach((h) => {
      handlerRoots.push(this.buildHandler(h));
    });
    // Build every proc reachable only via done-continuations too (procs
    // referenced solely from an async `done` field, never a plain
    // callProc) — a plain forward pass over module.procs after handlers
    // ensures totality even if some proc is otherwise unreachable from any
    // handler (shouldn't happen for a check.ts-valid module, but cheap to
    // guarantee).
    this.module.procs.forEach((p) => this.getProcEntry(p.id));

    const { finalIndex, orderedIds } = this.topoSort();
    const nodes: GraphNode[] = orderedIds.map((placeholderId) => this.remapNode(this.nodes.get(placeholderId)!, finalIndex));

    const graph: GraphJson = {
      types: this.typeOrder.map((t) => ({ signature: t })),
      variables: this.module.variables.map((v) => ({
        id: v.extras && typeof v.extras.id === "string" ? (v.extras.id as string) : undefined,
        type: this.typeIndex(v.type),
        value: v.initial.data as Array<number | boolean | string>
      })),
      events: this.module.events.map((e) => ({
        id: e.id,
        values:
          e.values.length > 0
            ? Object.fromEntries(e.values.map((v) => [v.name, { type: this.typeIndex(v.type), value: v.default.data as Array<number | boolean | string> }]))
            : undefined
      })),
      declarations: this.declOrder.map((op) => ({ op })),
      nodes
    };

    return {
      graph,
      diagnostics: this.diagnostics,
      stats: { nodesBeforeMerge: this.nodes.size + this.cseHits, nodesAfterMerge: this.nodes.size, mergedCount: this.cseHits }
    };
  }

  // -------------------------------------------------------------------
  // Declaration / type tables
  // -------------------------------------------------------------------

  private declIndex(op: string): number {
    const existing = this.declByOp.get(op);
    if (existing !== undefined) {
      return existing;
    }
    const idx = this.declOrder.length;
    this.declOrder.push(op);
    this.declByOp.set(op, idx);
    return idx;
  }

  private typeIndex(t: IRType): number {
    const existing = this.typeIndexByName.get(t);
    if (existing !== undefined) {
      return existing;
    }
    const idx = this.typeOrder.length;
    this.typeOrder.push(t);
    this.typeIndexByName.set(t, idx);
    return idx;
  }

  // -------------------------------------------------------------------
  // Node allocation
  // -------------------------------------------------------------------

  private allocNode(op: string, config: Builder["config"], forcedId?: number): number {
    const id = forcedId ?? this.nextId;
    this.nextId = Math.max(this.nextId, id + 1);
    this.nodes.set(id, { op, config, values: {}, flows: {} });
    return id;
  }

  private cfgInt(n: number): { value: number[] } {
    return { value: [Math.trunc(n)] };
  }
  private cfgBool(b: boolean): { value: boolean[] } {
    return { value: [b] };
  }
  private cfgString(s: string): { value: string[] } {
    return { value: [s] };
  }
  private cfgIntArray(arr: number[]): { value: number[] } {
    return { value: arr.map((n) => Math.trunc(n)) };
  }

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------

  private buildHandler(h: IRHandler): number {
    const op = HANDLER_OP[h.kind];
    const config: Builder["config"] = {};
    if (h.kind === "receive") {
      config.event = this.cfgInt(h.eventRef ?? 0);
    } else if (h.kind === "onSelect") {
      config.nodeIndex = this.cfgInt(Number((h.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
      config.stopPropagation = this.cfgBool(Boolean((h.config as { stopPropagation?: boolean } | undefined)?.stopPropagation));
    } else if (h.kind === "onHoverIn" || h.kind === "onHoverOut") {
      config.nodeIndex = this.cfgInt(Number((h.config as { nodeIndex?: number } | undefined)?.nodeIndex ?? -1));
    }
    const rootId = this.allocNode(op, config);
    const scope: SiteScope = { tempRef: new Map(), handlerRoot: rootId };
    const entry = this.buildStmtList(flattenStmts([h.body]), scope);
    if (entry) {
      this.nodes.get(rootId)!.flows.out = entry;
    }
    return rootId;
  }

  // -------------------------------------------------------------------
  // Procs (memoized; see file header — a proc's root id is registered
  // BEFORE its body is built so a done-continuation that eventually calls
  // back into the same proc resolves to the same node instead of recursing
  // forever).
  // -------------------------------------------------------------------

  private getProcEntry(procId: number): NodeRef {
    const existing = this.procEntry.get(procId);
    if (existing) {
      return existing;
    }
    const proc = this.module.procs[procId];
    if (!proc) {
      this.error("GI200", `callProc references out-of-range procId ${procId}`);
      return { node: this.allocNode("flow/sequence", {}), socket: "in" };
    }
    if (this.procBuilding.has(procId)) {
      // Should be unreachable: only a done-Cont edge may legally cycle back
      // (see check.ts), and done-Conts don't call getProcEntry recursively
      // before their own proc's entry is registered — defensive only.
      this.error("GI210", `synchronous cycle building proc "${proc.name}"`);
      return { node: this.allocNode("flow/sequence", {}), socket: "in" };
    }
    this.procBuilding.add(procId);
    const items = flattenStmts([proc.body]);
    let entry: NodeRef;
    if (items.length === 0) {
      // Empty proc body: synthesize a harmless pass-through node so callers
      // still have something to wire a flow edge to.
      entry = { node: this.allocNode("flow/sequence", {}), socket: "in" };
    } else {
      const scope: SiteScope = { tempRef: new Map(), handlerRoot: null };
      const built = this.buildStmtList(items, scope);
      entry = built ?? { node: this.allocNode("flow/sequence", {}), socket: "in" };
    }
    this.procEntry.set(procId, entry);
    this.procBuilding.delete(procId);
    return entry;
  }

  // -------------------------------------------------------------------
  // State slots (lazy: first reference — "in"/numbered occurrence, a
  // "reset" occurrence, or a stateRead value — allocates the node; the
  // "in"/numbered occurrence, which is unique per module by construction
  // — see import.ts's predecessor-count proc extraction — fills in its
  // values/flows in place once processed).
  // -------------------------------------------------------------------

  private getOrCreateStateNode(slotIdx: number): number {
    const existing = this.stateNodeId.get(slotIdx);
    if (existing !== undefined) {
      return existing;
    }
    const slot = this.module.stateSlots[slotIdx];
    const op = STATEFUL_OP[slot.kind];
    const config = this.stateSlotConfig(slot);
    const id = this.allocNode(op, config);
    this.stateNodeId.set(slotIdx, id);
    return id;
  }

  private stateSlotConfig(slot: IRStateSlot): Builder["config"] {
    const cfg: Builder["config"] = {};
    if (slot.kind === "multiGate") {
      cfg.isRandom = this.cfgBool(Boolean((slot.config as { isRandom?: boolean }).isRandom));
      cfg.isLoop = this.cfgBool(Boolean((slot.config as { isLoop?: boolean }).isLoop));
    } else if (slot.kind === "waitAll") {
      cfg.inputFlows = this.cfgInt(Number((slot.config as { inputFlows?: number }).inputFlows ?? 0));
    } else if (slot.kind === "for") {
      cfg.initialIndex = this.cfgInt(Number((slot.config as { initialIndex?: number }).initialIndex ?? 0));
    }
    return cfg;
  }

  // -------------------------------------------------------------------
  // Statement-list flow construction (see file header for the seq-
  // ambiguity resolution strategy).
  // -------------------------------------------------------------------

  private buildStmtList(items: IRStmt[], scope: SiteScope): NodeRef | null {
    let idx = 0;
    while (idx < items.length && items[idx].k === "let") {
      this.materializeLet(items[idx] as Extract<IRStmt, { k: "let" }>, scope);
      idx += 1;
    }
    if (idx >= items.length) {
      return null;
    }
    const head = items[idx];
    const rest = items.slice(idx + 1);

    const { entry, openSocket } = this.buildStmtHead(head, scope);
    const restEntry = this.buildStmtList(rest, scope);
    if (!restEntry) {
      return entry;
    }
    if (openSocket) {
      this.nodes.get(openSocket.node)!.flows[openSocket.socket] = restEntry;
      return entry;
    }
    // No implicit trailing socket (if/switch/setPointer/async/stateful/
    // callProc/...) but more statements follow: they're independent
    // branches, not a chained continuation — see file header. Wrapping in a
    // synthesized flow/sequence node changes nothing about execution order.
    const seqId = this.allocNode("flow/sequence", {});
    this.nodes.get(seqId)!.flows["0"] = entry;
    this.nodes.get(seqId)!.flows["1"] = restEntry;
    return { node: seqId, socket: "in" };
  }

  // Builds one flow-producing statement's own node structure (including all
  // of its OWN explicit nested branches). `openSocket`, when returned, is
  // this statement's implicit trailing socket that @gltfi/ir's buildStmtList
  // should wire to whatever follows — omitted when the statement already has
  // an explicit field/outs-key for it (see file header: while/for's
  // `completed` and flow/cancelDelay's `outs.out` may already be explicit
  // when this module came straight from importGraph rather than a round
  // trip through @gltfi/parse-ts) or when the statement kind has no such
  // socket at all (if/switch/setPointer/async/stateful/callProc/reset).
  private buildStmtHead(stmt: IRStmt, scope: SiteScope): { entry: NodeRef; openSocket?: { node: number; socket: string } } {
    switch (stmt.k) {
      case "if": {
        const id = this.allocNode("flow/branch", {});
        this.nodes.get(id)!.values.condition = this.buildValueRef(stmt.cond, scope);
        const thenEntry = this.buildStmtList(flattenStmts([stmt.then]), scope);
        if (thenEntry) this.nodes.get(id)!.flows.true = thenEntry;
        if (stmt.else) {
          const elseEntry = this.buildStmtList(flattenStmts([stmt.else]), scope);
          if (elseEntry) this.nodes.get(id)!.flows.false = elseEntry;
        }
        return { entry: { node: id, socket: "in" } };
      }
      case "while": {
        const id = this.allocNode("flow/while", {});
        this.nodes.get(id)!.values.condition = this.buildValueRef(stmt.cond, scope);
        const bodyEntry = this.buildStmtList(flattenStmts([stmt.body]), scope);
        if (bodyEntry) this.nodes.get(id)!.flows.loopBody = bodyEntry;
        if (stmt.completed) {
          const completedEntry = this.buildStmtList(flattenStmts([stmt.completed]), scope);
          if (completedEntry) this.nodes.get(id)!.flows.completed = completedEntry;
          return { entry: { node: id, socket: "in" } };
        }
        return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "completed" } };
      }
      case "for": {
        const slotIdx = stmt.slot?.slot;
        const id = slotIdx !== undefined ? this.getOrCreateStateNode(slotIdx) : this.allocNode("flow/for", this.stateSlotConfig({ name: "", kind: "for", config: {} }));
        this.nodes.get(id)!.values.startIndex = this.buildValueRef(stmt.start, scope);
        this.nodes.get(id)!.values.endIndex = this.buildValueRef(stmt.end, scope);
        const bodyEntry = this.buildStmtList(flattenStmts([stmt.body]), scope);
        if (bodyEntry) this.nodes.get(id)!.flows.loopBody = bodyEntry;
        if (stmt.completed) {
          const completedEntry = this.buildStmtList(flattenStmts([stmt.completed]), scope);
          if (completedEntry) this.nodes.get(id)!.flows.completed = completedEntry;
          return { entry: { node: id, socket: "in" } };
        }
        return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "completed" } };
      }
      case "switch": {
        const id = this.allocNode("flow/switch", {});
        this.nodes.get(id)!.values.selection = this.buildValueRef(stmt.selector, scope);
        const cases = stmt.cases.map(([c]) => c);
        this.nodes.get(id)!.config.cases = this.cfgIntArray(cases);
        stmt.cases.forEach(([c, body]) => {
          const entry = this.buildStmtList(flattenStmts([body]), scope);
          if (entry) this.nodes.get(id)!.flows[String(c)] = entry;
        });
        if (stmt.default) {
          const entry = this.buildStmtList(flattenStmts([stmt.default]), scope);
          if (entry) this.nodes.get(id)!.flows.default = entry;
        }
        return { entry: { node: id, socket: "in" } };
      }
      case "setVar": {
        const id = this.allocNode("variable/set", { variables: this.cfgIntArray([stmt.varId]) });
        this.nodes.get(id)!.values[String(stmt.varId)] = this.buildValueRef(stmt.expr, scope);
        return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "out" } };
      }
      case "setPointer": {
        const id = this.allocNode("pointer/set", {
          pointer: this.cfgString(formatPointerTemplate(stmt.template)),
          type: this.cfgInt(this.typeIndex(stmt.type))
        });
        const b = this.nodes.get(id)!;
        b.values.value = this.buildValueRef(stmt.value, scope);
        this.wirePointerParams(b, stmt.template, stmt.args, scope);
        if (stmt.out) {
          const e = this.buildStmtList(flattenStmts([stmt.out]), scope);
          if (e) b.flows.out = e;
        }
        if (stmt.err) {
          const e = this.buildStmtList(flattenStmts([stmt.err]), scope);
          if (e) b.flows.err = e;
        }
        return { entry: { node: id, socket: "in" } };
      }
      case "emitEvent": {
        const id = this.allocNode("event/send", { event: this.cfgInt(stmt.eventId) });
        const b = this.nodes.get(id)!;
        const keys = ["boolParameter", "intParameter", "floatParameter", "expectedDuration"];
        stmt.args.forEach((a, i) => {
          b.values[keys[i]] = this.buildValueRef(a, scope);
        });
        return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "out" } };
      }
      case "stopPropagation": {
        const id = this.allocNode("event/stopPropagation", {});
        const b = this.nodes.get(id)!;
        b.values.stopImmediate = this.buildValueRef(stmt.stopImmediate, scope);
        if (scope.handlerRoot !== null) {
          b.values.event = { node: scope.handlerRoot, socket: "event" };
        }
        return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "out" } };
      }
      case "log": {
        const id = this.allocNode("debug/log", { severity: this.cfgInt(0), message: this.cfgString(stmt.template) });
        const b = this.nodes.get(id)!;
        stmt.args.forEach((a, i) => {
          b.values[String(i)] = this.buildValueRef(a, scope);
        });
        return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "out" } };
      }
      case "callProc": {
        const entry = this.getProcEntry(stmt.procId);
        return { entry };
      }
      case "async":
        return { entry: this.buildAsync(stmt, scope) };
      case "stateful":
        return this.buildStateful(stmt, scope);
      case "intrinsic":
        return this.buildIntrinsicStmt(stmt, scope);
      case "seq":
      case "let":
        // Unreachable: flattenStmts() removes seq/let before dispatch.
        this.error("GI201", `unexpected "${stmt.k}" reached flow dispatch`);
        return { entry: { node: this.allocNode("flow/sequence", {}), socket: "in" } };
    }
  }

  // -------------------------------------------------------------------
  // async ops
  // -------------------------------------------------------------------

  private buildAsync(stmt: Extract<IRStmt, { k: "async" }>, scope: SiteScope): NodeRef {
    const op = ASYNC_OP[stmt.kind];
    let id: number;
    if (stmt.kind === "setDelay" && stmt.slot) {
      id = this.getOrCreateStateNode(stmt.slot.slot);
    } else {
      id = this.allocNode(op, {});
    }
    const b = this.nodes.get(id)!;
    if (stmt.kind === "setDelay") {
      b.values.duration = this.buildValueRef(stmt.args[0], scope);
    } else if (stmt.kind === "varInterp") {
      const cfg = (stmt.config ?? {}) as { varId: number; useSlerp: boolean };
      b.config.variable = this.cfgInt(cfg.varId);
      b.config.useSlerp = this.cfgBool(Boolean(cfg.useSlerp));
      const [value, duration, p1, p2] = stmt.args;
      b.values.value = this.buildValueRef(value, scope);
      b.values.duration = this.buildValueRef(duration, scope);
      b.values.p1 = this.buildValueRef(p1, scope);
      b.values.p2 = this.buildValueRef(p2, scope);
    } else if (stmt.kind === "ptrInterp") {
      b.config.pointer = this.cfgString(formatPointerTemplate(stmt.template!));
      b.config.type = this.cfgInt(this.typeIndex(stmt.type!));
      const [value, duration, p1, p2, ...ptrArgs] = stmt.args;
      b.values.value = this.buildValueRef(value, scope);
      b.values.duration = this.buildValueRef(duration, scope);
      b.values.p1 = this.buildValueRef(p1, scope);
      b.values.p2 = this.buildValueRef(p2, scope);
      this.wirePointerParams(b, stmt.template!, ptrArgs, scope);
    } else if (stmt.kind === "animStart") {
      const [animation, startTime, endTime, speed] = stmt.args;
      b.values.animation = this.buildValueRef(animation, scope);
      b.values.startTime = this.buildValueRef(startTime, scope);
      b.values.endTime = this.buildValueRef(endTime, scope);
      b.values.speed = this.buildValueRef(speed, scope);
    } else if (stmt.kind === "animStop") {
      b.values.animation = this.buildValueRef(stmt.args[0], scope);
    } else {
      const [animation, stopTime] = stmt.args;
      b.values.animation = this.buildValueRef(animation, scope);
      b.values.stopTime = this.buildValueRef(stopTime, scope);
    }

    if (stmt.out) {
      const e = this.buildStmtList(flattenStmts([stmt.out]), scope);
      if (e) b.flows.out = e;
    }
    if (stmt.err) {
      const e = this.buildStmtList(flattenStmts([stmt.err]), scope);
      if (e) b.flows.err = e;
    }
    if (stmt.done) {
      b.flows.done = this.buildCont(stmt.done, scope);
    }
    return { node: id, socket: "in" };
  }

  private buildCont(cont: Cont, _scope: SiteScope): NodeRef {
    if (cont.kind === "proc") {
      return this.getProcEntry(cont.procId);
    }
    const fresh: SiteScope = { tempRef: new Map(), handlerRoot: _scope.handlerRoot };
    const items = flattenStmts([cont.body]);
    const entry = this.buildStmtList(items, fresh);
    return entry ?? { node: this.allocNode("flow/sequence", {}), socket: "in" };
  }

  // -------------------------------------------------------------------
  // stateful ops
  // -------------------------------------------------------------------

  private buildStateful(stmt: Extract<IRStmt, { k: "stateful" }>, scope: SiteScope): { entry: NodeRef; openSocket?: { node: number; socket: string } } {
    const id = this.getOrCreateStateNode(stmt.slot.slot);
    const b = this.nodes.get(id)!;

    if (stmt.port === "reset") {
      return { entry: { node: id, socket: "reset" } };
    }

    if (stmt.kind === "doN") {
      b.values.n = this.buildValueRef(stmt.args[0], scope);
      if (stmt.outs.out) {
        const e = this.buildStmtList(flattenStmts([stmt.outs.out]), scope);
        if (e) b.flows.out = e;
      }
      return { entry: { node: id, socket: "in" } };
    }
    if (stmt.kind === "throttle") {
      b.values.duration = this.buildValueRef(stmt.args[0], scope);
      if (stmt.outs.out) {
        const e = this.buildStmtList(flattenStmts([stmt.outs.out]), scope);
        if (e) b.flows.out = e;
      }
      if (stmt.outs.err) {
        const e = this.buildStmtList(flattenStmts([stmt.outs.err]), scope);
        if (e) b.flows.err = e;
      }
      return { entry: { node: id, socket: "in" } };
    }
    if (stmt.kind === "multiGate") {
      const keys = Object.keys(stmt.outs);
      const width = String(Math.max(0, keys.length - 1)).length;
      keys.forEach((key) => {
        const e = this.buildStmtList(flattenStmts([stmt.outs[key]]), scope);
        if (e) b.flows[key.padStart(width, "0")] = e;
      });
      return { entry: { node: id, socket: "in" } };
    }
    // waitAll: numbered secondary port. completed/out are redundantly
    // rebuilt at every trigger site by construction — see file header on
    // import.ts's own waitAll blind-spot handling, which forces every
    // numbered trigger to route through the same shared proc when there's
    // more than one; harmless to just overwrite.
    const port = typeof stmt.port === "number" ? stmt.port : 0;
    if (stmt.outs.completed) {
      const e = this.buildStmtList(flattenStmts([stmt.outs.completed]), scope);
      if (e) b.flows.completed = e;
    }
    if (stmt.outs.out) {
      const e = this.buildStmtList(flattenStmts([stmt.outs.out]), scope);
      if (e) b.flows.out = e;
    }
    return { entry: { node: id, socket: String(port) } };
  }

  // -------------------------------------------------------------------
  // intrinsic statements (flow/cancelDelay, flow/setDelay#cancel)
  // -------------------------------------------------------------------

  private buildIntrinsicStmt(stmt: Extract<IRStmt, { k: "intrinsic" }>, scope: SiteScope): { entry: NodeRef; openSocket?: { node: number; socket: string } } {
    if (stmt.op === "flow/setDelay#cancel") {
      const slotIdx = (stmt.config as { slot?: number }).slot;
      if (slotIdx === undefined) {
        this.error("GI202", "flow/setDelay#cancel missing its state slot");
        return { entry: { node: this.allocNode("flow/sequence", {}), socket: "in" } };
      }
      return { entry: { node: this.getOrCreateStateNode(slotIdx), socket: "cancel" } };
    }
    if (stmt.op === "flow/cancelDelay") {
      const id = this.allocNode("flow/cancelDelay", {});
      const b = this.nodes.get(id)!;
      b.values.delay = this.buildValueRef(stmt.args[0], scope);
      if (stmt.outs.out) {
        const e = this.buildStmtList(flattenStmts([stmt.outs.out]), scope);
        if (e) b.flows.out = e;
        return { entry: { node: id, socket: "in" } };
      }
      return { entry: { node: id, socket: "in" }, openSocket: { node: id, socket: "out" } };
    }
    this.error("GI203", `intrinsic statement "${stmt.op}" has no export lowering`);
    return { entry: { node: this.allocNode("flow/sequence", {}), socket: "in" } };
  }

  // -------------------------------------------------------------------
  // Pointer arg wiring (shared by setPointer/ptrInterp/ptrGet).
  // -------------------------------------------------------------------

  private wirePointerParams(b: Builder, template: PtrTemplate, args: IRExpr[], scope: SiteScope) {
    pointerTemplateParams(template).forEach((p, i) => {
      b.values[p.name] = this.buildValueRef(args[i], scope);
    });
  }

  // -------------------------------------------------------------------
  // `let` materialization
  // -------------------------------------------------------------------

  private materializeLet(stmt: Extract<IRStmt, { k: "let" }>, scope: SiteScope) {
    const ref = this.buildValueRef(stmt.expr, scope);
    scope.tempRef.set(stmt.temp, ref);
  }

  // -------------------------------------------------------------------
  // Value expression construction
  // -------------------------------------------------------------------

  private buildValueRef(expr: IRExpr, scope: SiteScope): Builder["values"][string] {
    if (expr.k === "const") {
      return { literalType: expr.type, data: expr.data as Array<number | boolean | string> };
    }
    if (expr.k === "temp") {
      const ref = scope.tempRef.get(expr.id);
      if (!ref) {
        this.error("GI204", `temp "${expr.id}" referenced outside its materializing site`);
        return { literalType: "float", data: [0] };
      }
      return ref;
    }

    const structKey = this.structuralKey(expr);
    if (structKey) {
      const cached = this.pureCache.get(structKey);
      if (cached) {
        this.cseHits += 1;
        return cached;
      }
    }
    const ref = this.buildValueNode(expr, scope);
    if (structKey) {
      this.pureCache.set(structKey, ref);
    }
    return ref;
  }

  private buildValueNode(expr: IRExpr, scope: SiteScope): NodeRef {
    switch (expr.k) {
      case "varGet": {
        const id = this.allocNode("variable/get", { variable: this.cfgInt(expr.varId) });
        return { node: id, socket: "value" };
      }
      case "ptrGet": {
        const id = this.allocNode("pointer/get", { pointer: this.cfgString(formatPointerTemplate(expr.template)), type: this.cfgInt(this.typeIndex(expr.valueType)) });
        const b = this.nodes.get(id)!;
        this.wirePointerParams(b, expr.template, expr.args, scope);
        return { node: id, socket: expr.wantIsValid ? "isValid" : "value" };
      }
      case "param": {
        if (scope.handlerRoot === null) {
          this.error("GI205", `param "${expr.name}" read outside a handler`);
          return { node: this.allocNode("event/onStart", {}), socket: expr.name };
        }
        return { node: scope.handlerRoot, socket: expr.name };
      }
      case "stateRead": {
        const nodeId = this.getOrCreateStateNode(expr.slot.slot);
        const socket = STATE_READ_SOCKET[expr.field] ?? expr.field;
        return { node: nodeId, socket };
      }
      case "op": {
        const config: Builder["config"] = {};
        if (expr.config) {
          for (const [k, v] of Object.entries(expr.config)) {
            if (k === "order" && typeof v === "string") {
              config[k] = this.cfgString(v);
            } else if (typeof v === "number") {
              config[k] = this.cfgInt(v);
            } else if (typeof v === "boolean") {
              config[k] = this.cfgBool(v);
            }
          }
        }
        const id = this.allocNode(expr.op, config);
        const b = this.nodes.get(id)!;
        const argNames = argSocketNames(expr.op, expr.overload);
        expr.args.forEach((a, i) => {
          b.values[argNames[i] ?? `a${i}`] = this.buildValueRef(a, scope);
        });
        return { node: id, socket: expr.socket ?? "value" };
      }
      case "intrinsic": {
        if (expr.op === "math/switch") {
          const id = this.allocNode("math/switch", { cases: this.cfgIntArray((expr.config.cases as number[]) ?? []) });
          const b = this.nodes.get(id)!;
          const [selection, dflt, ...caseArgs] = expr.args;
          b.values.selection = this.buildValueRef(selection, scope);
          b.values.default = this.buildValueRef(dflt, scope);
          const cases = (expr.config.cases as number[]) ?? [];
          caseArgs.forEach((a, i) => {
            b.values[String(cases[i])] = this.buildValueRef(a, scope);
          });
          return { node: id, socket: "value" };
        }
        if (expr.op === "event/receive#payload") {
          // Best-effort: reads the SAME event's own receive-handler-root
          // param, which requires locating that handler — not exercised by
          // the conformance corpus (see @gltfi/parse-ts's header note on
          // GI012). Falls back to a fresh literal-default node so export
          // still produces a valid (if not fully faithful) graph.
          this.diagnostics.push({ severity: "info", code: "GI212", message: "best-effort export of event/receive#payload cross-handler read" });
          const id = this.allocNode("event/receive", { event: this.cfgInt((expr.config.eventIndex as number) ?? 0) });
          return { node: id, socket: (expr.config.field as string) ?? "boolParameter" };
        }
        if (expr.op === "event/onTick#time") {
          const id = this.allocNode("event/onTick", {});
          return { node: id, socket: (expr.config.field as string) ?? "timeSinceStart" };
        }
        if (expr.config?.crossContext === true) {
          this.diagnostics.push({ severity: "info", code: "GI212", message: `best-effort export of cross-handler read "${expr.op}"#${expr.config.socket}` });
          const sourceOp = expr.op in HANDLER_KIND_BY_OP ? expr.op : "event/onStart";
          const id = this.allocNode(sourceOp, {});
          return { node: id, socket: (expr.config.socket as string) ?? "value" };
        }
        this.error("GI206", `intrinsic expr "${expr.op}" has no export lowering`);
        return { node: this.allocNode("math/E", {}), socket: "value" };
      }
      default:
        this.error("GI207", `unexpected expr kind reached buildValueNode`);
        return { node: this.allocNode("math/E", {}), socket: "value" };
    }
  }

  // -------------------------------------------------------------------
  // Pure-closed structural key (CSE) — see file header + design doc's CSE
  // rule: null (never cached) for anything reading variables/pointers/
  // state/params, math/random, or a temp (site-scoped, never globally
  // shared — see this file's SiteScope comment).
  // -------------------------------------------------------------------

  private structuralKey(expr: IRExpr): string | null {
    switch (expr.k) {
      case "const":
        return `c:${expr.type}:${stableDataKey(expr.data)}`;
      case "temp":
      case "varGet":
      case "ptrGet":
      case "stateRead":
      case "param":
        return null;
      case "op": {
        if (expr.op === "math/random") {
          return null;
        }
        const argKeys: string[] = [];
        for (const a of expr.args) {
          const k = this.structuralKey(a);
          if (k === null) {
            return null;
          }
          argKeys.push(k);
        }
        return `op:${expr.op}:${expr.socket ?? "value"}:${JSON.stringify(expr.config ?? {})}(${argKeys.join(",")})`;
      }
      case "intrinsic":
        // Conservative: never merge intrinsics (math/switch could in
        // principle be pure-closed, but "when unsure, duplicate" — see the
        // design doc's CSE rule).
        return null;
    }
  }

  private error(code: string, message: string) {
    this.diagnostics.push({ severity: "error", code, message });
  }

  // -------------------------------------------------------------------
  // Topological index assignment (union of value-ref and flow-ref
  // constraints — see file header).
  // -------------------------------------------------------------------

  private topoSort(): { finalIndex: Map<number, number>; orderedIds: number[] } {
    const ids = [...this.nodes.keys()].sort((a, b) => a - b);
    const indeg = new Map<number, number>();
    const succ = new Map<number, number[]>();
    for (const id of ids) {
      indeg.set(id, 0);
      succ.set(id, []);
    }
    const addEdge = (from: number, to: number) => {
      succ.get(from)!.push(to);
      indeg.set(to, (indeg.get(to) ?? 0) + 1);
    };
    for (const id of ids) {
      const b = this.nodes.get(id)!;
      for (const v of Object.values(b.values)) {
        if ("node" in v) {
          addEdge(v.node, id);
        }
      }
      for (const f of Object.values(b.flows)) {
        addEdge(id, f.node);
      }
    }
    // Kahn's algorithm, ready-queue processed in ascending placeholder-id
    // order each round for a deterministic, close-to-construction-order
    // result (see file header).
    const ready = ids.filter((id) => (indeg.get(id) ?? 0) === 0).sort((a, b) => a - b);
    const orderedIds: number[] = [];
    const finalIndex = new Map<number, number>();
    while (ready.length > 0) {
      ready.sort((a, b) => a - b);
      const id = ready.shift()!;
      finalIndex.set(id, orderedIds.length);
      orderedIds.push(id);
      for (const next of succ.get(id) ?? []) {
        indeg.set(next, (indeg.get(next) ?? 0) - 1);
        if (indeg.get(next) === 0) {
          ready.push(next);
        }
      }
    }
    if (orderedIds.length !== ids.length) {
      this.error("GI210", "cyclic constraint graph while assigning graph node indices (value/flow ordering conflict)");
      // Fall back to placeholder order for any remaining (cyclic) nodes so
      // export still terminates with a (structurally invalid, diagnosed)
      // graph rather than throwing.
      for (const id of ids) {
        if (!finalIndex.has(id)) {
          finalIndex.set(id, orderedIds.length);
          orderedIds.push(id);
        }
      }
    }
    return { finalIndex, orderedIds };
  }

  private remapNode(b: Builder, finalIndex: Map<number, number>): GraphNode {
    const values: Record<string, GraphNodeValue> = {};
    for (const [socket, v] of Object.entries(b.values)) {
      values[socket] = "node" in v ? { node: finalIndex.get(v.node) ?? 0, socket: v.socket === "value" ? undefined : v.socket } : { type: this.typeIndex(v.literalType), value: v.data };
    }
    // Drop `socket: undefined` cleanly (matches import.ts's GraphValueRef
    // shape, which treats a missing socket as "value").
    for (const key of Object.keys(values)) {
      const v = values[key];
      if ("socket" in v && v.socket === undefined) {
        delete (v as { socket?: string }).socket;
      }
    }
    const flows: Record<string, GraphFlowRef> = {};
    for (const [socket, f] of Object.entries(b.flows)) {
      flows[socket] = { node: finalIndex.get(f.node) ?? 0, socket: f.socket };
    }
    return {
      declaration: this.declIndex(b.op),
      configuration: Object.keys(b.config).length > 0 ? b.config : undefined,
      values: Object.keys(values).length > 0 ? values : undefined,
      flows: Object.keys(flows).length > 0 ? flows : undefined
    };
  }
}

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

const HANDLER_KIND_BY_OP: Record<string, HandlerKind> = {
  "event/onStart": "onStart",
  "event/onTick": "onTick",
  "event/receive": "receive",
  "event/onSelect": "onSelect",
  "event/onHoverIn": "onHoverIn",
  "event/onHoverOut": "onHoverOut"
};

// stateRead field name -> the owning graph node's actual output socket name
// (mirrors import.ts's computeNodeOutputTypes STATE_VALUE_OPS table and
// emit-ts's emitStateRead — see model.ts's stateRead doc comment).
const STATE_READ_SOCKET: Record<string, string> = {
  index: "index",
  currentCount: "currentCount",
  lastIndex: "lastIndex",
  lastDelay: "lastDelay",
  lastRemainingTime: "lastRemainingTime",
  remainingInputs: "remainingInputs"
};

// JSON.stringify collapses NaN/Infinity/-Infinity to `null`, which would
// make e.g. const [NaN,2,3] and const [Infinity,2,3] hash-cons to the SAME
// CSE structural key (a real bug caught during development: two distinct
// math/length(...) conformance sub-tests, one fed NaN and one fed Infinity,
// got merged into one node, breaking the NaN sub-test). Every element gets
// an unambiguous token instead.
function stableDataKey(data: Array<number | boolean | string>): string {
  return JSON.stringify(
    data.map((v) => {
      if (typeof v === "number") {
        if (Number.isNaN(v)) return "NaN";
        if (v === Infinity) return "Inf";
        if (v === -Infinity) return "-Inf";
        return v;
      }
      return v;
    })
  );
}

// Recursively flattens nested `seq` wrappers (and drops empty ones) into a
// flat statement list — see file header: nested seq has no meaning of its
// own beyond grouping, so flattening it is always transparent.
function flattenStmts(stmts: IRStmt[]): IRStmt[] {
  const out: IRStmt[] = [];
  for (const s of stmts) {
    if (s.k === "seq") {
      out.push(...flattenStmts(s.stmts));
    } else {
      out.push(s);
    }
  }
  return out;
}

// Resolves an op's declared input-socket NAMES in the order matching
// `expr.args` (row.inputs order) — needed to reconstruct `values` keys since
// IRExpr's "op" only carries positional args, not their socket names.
function argSocketNames(op: string, overload: { inputs: Record<string, TypeSig> }): string[] {
  // ResolvedOverload's `inputs` is a Record keyed by socket name but doesn't
  // preserve declaration order on its own — Object.keys() over a
  // string-keyed object literal built via `row.inputs.map(...)` in
  // registry-query.ts's resolveOverload preserves insertion order (the same
  // order OP_REGISTRY declares the row's inputs), which is exactly the
  // argument order @gltfi/ir's own op-args arrays use (see import.ts's
  // `row.inputs.map((inputSocket) => buildArgExpr(...))`), so this is safe.
  return Object.keys(overload.inputs);
}
