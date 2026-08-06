// Host wrapper around the interpreter core: owns pointer/hover/select event
// bubbling and dirty tracking for a scene renderer. Ported from the browser
// fork's runtime/index.ts; adjusted to import the core's own Graph type
// instead of a host-app-specific KHR_interactivity parser type.
import { advanceTime, createRuntime, executeFlow, type Graph, type RuntimeGraph, type Value } from "./interpreter.js";

export type InteractivityEvent =
  | { type: "pointermove"; x: number; y: number }
  | { type: "pointerdown"; x: number; y: number }
  | { type: "pointerup"; x: number; y: number };

// F3 (see INTEGRATION-NOTES.md-style friction log): earlier drafts of this
// type also declared setNodeVisibility/setNodeSelectable/setNodeHoverable,
// but NOTHING in this file (or anywhere else in this package) ever calls
// them — KHR_node_visibility/KHR_node_selectability/KHR_node_hoverability
// only ever reach a host as ordinary `/nodes/{N}/extensions/KHR_node_*/...`
// pointer strings through applyPointer below, exactly like every other
// pointer-set write. Confirmed against BOTH of this monorepo's own
// SceneAdapter-shaped implementations independently: apps/viewer's
// engine-host.ts's makeSceneAdapter and @gltfi/gltf's
// applyInteractivityPointer (the generic pointer-string dispatcher the
// viewer's adapter delegates to) both handle these three extensions purely
// via pointer-string matching (`/nodes/{N}/extensions/KHR_node_visibility/
// visible` etc. — see packages/gltf/src/index.ts's applyInteractivityPointer),
// never via a dedicated method call. So the three methods were dead surface
// with no dispatch path at all; removed rather than wired up, since wiring
// them would mean firing the SAME write twice (once via applyPointer, once
// via a new call) for no behavioral gain.
export type SceneAdapter = {
  applyPointer(pointer: string, value: number[] | boolean[] | number | boolean): void;
};

// The KHR_interactivity conformance-judge protocol's engine-agnostic
// surface (mirrors @gltfi/runtime-lib's own EngineLike field-for-field, and
// packages/conformance/src/interp-adapter.ts's interpEngineFromRuntime,
// which builds the identical shape by hand over a bare RuntimeGraph). Kept
// as a local, structural type rather than an import from @gltfi/runtime-lib
// so this package doesn't grow a dependency on the compiled-engine runtime
// just for a type — TypeScript's structural typing makes the two
// interchangeable for any caller that imports the "real" EngineLike instead.
export type SentEvent = { eventIndex: number; externalId?: string; payload: [boolean, number, number, number] };

export type EngineLike = {
  start(): void;
  advance(dt: number): void;
  getVariableByIndex(index: number): Value;
  readonly variableCount: number;
  readonly sentEvents: readonly SentEvent[];
  readonly time: number;
  readonly eventDefaults: readonly (number | undefined)[];
};

// Additive beyond EngineLike: KHR_node_selectability/KHR_node_hoverability
// gesture injection, mirroring @gltfi/runtime-lib's EngineInteractive
// exactly (see that type's own doc comments for the bubbling/stopPropagation
// semantics fireSelect implements, and the fireHoverIn/fireHoverOut split).
export type EngineInteractive = EngineLike & {
  fireSelect(nodeIndex: number, point: [number, number, number], rayOrigin?: [number, number, number], controllerIndex?: number): void;
  fireHoverIn(nodeIndex: number, point?: [number, number, number], controllerIndex?: number): void;
  fireHoverOut(nodeIndex?: number): void;
};

export class InteractivityRuntime {
  private runtime: RuntimeGraph;
  private graph: Graph;
  private adapter: SceneAdapter | null = null;
  private events: InteractivityEvent[] = [];
  private lastEvent: string = "none";
  private lastHoverIndex = -1;
  private eventNodes: Map<string, number[]> = new Map();
  private dirty = false;

  constructor(graph: Graph, gltf: unknown, binary?: Uint8Array | ArrayBuffer | null) {
    if (!graph) {
      throw new Error("Missing KHR_interactivity graph.");
    }
    this.graph = graph;
    this.runtime = createRuntime(this.graph, gltf, {
      onPointerSet: (pointer, value) => {
        this.adapter?.applyPointer(pointer, value);
        this.dirty = true;
      },
      onDirty: () => {
        this.dirty = true;
      },
      binary
    });
    this.buildEventIndex();
  }

  bindAdapter(adapter: SceneAdapter) {
    this.adapter = adapter;
  }

  setActiveCamera(position: [number, number, number], rotation: [number, number, number, number]) {
    this.runtime.activeCameraPosition = [...position];
    this.runtime.activeCameraRotation = [...rotation];
  }

  setHover(nodeIndex: number, point: [number, number, number]) {
    const previous = this.lastHoverIndex;
    if (nodeIndex === previous) {
      return;
    }
    this.lastHoverIndex = nodeIndex;
    this.runtime.hoverPoint = [...point];
    this.lastEvent = "hover";
    const prevChain = new Set(this.ancestorChain(previous));
    const nextChain = new Set(this.ancestorChain(nodeIndex));
    // Hover Out fires on handlers whose subtree the pointer left; Hover In on
    // handlers whose subtree it entered (KHR_node_hoverability propagation).
    if (previous >= 0) {
      this.runtime.hoveredNodeIndex = previous;
      this.triggerNodeEvent("event/onHoverOut", previous, (handlerNode) => !nextChain.has(handlerNode));
    }
    this.runtime.hoveredNodeIndex = nodeIndex;
    if (nodeIndex >= 0) {
      this.triggerNodeEvent("event/onHoverIn", nodeIndex, (handlerNode) => !prevChain.has(handlerNode));
    }
    // Legacy op used by earlier authored assets.
    this.triggerEvent("event/onHover");
  }

  setSelection(nodeIndex: number, point: [number, number, number], rayOrigin?: [number, number, number]) {
    this.runtime.selectedNodeIndex = nodeIndex;
    this.runtime.selectionPoint = [...point];
    this.runtime.selectionRayOrigin = rayOrigin ? [...rayOrigin] : [NaN, NaN, NaN];
    this.lastEvent = "select";
    if (nodeIndex >= 0) {
      this.triggerNodeEvent("event/onSelect", nodeIndex, () => true);
    }
  }

  start() {
    this.triggerEvent("event/onStart");
  }

  queueEvent(event: InteractivityEvent) {
    this.events.push(event);
  }

  tick(dtSeconds: number) {
    // advanceTime fires event/onTick flows itself when dtSeconds > 0 (and
    // maintains tickCount / timeSinceLastTick), so no explicit trigger here.
    advanceTime(this.runtime, dtSeconds);
    while (this.events.length > 0) {
      const event = this.events.shift();
      if (!event) {
        break;
      }
      this.lastEvent = event.type;
      const op = this.eventOpFromEvent(event);
      if (op) {
        this.runtime.pointerX = event.x;
        this.runtime.pointerY = event.y;
        this.triggerEvent(op);
      }
    }
  }

  consumeDirty() {
    const dirty = this.dirty;
    this.dirty = false;
    return dirty;
  }

  // Read-by-index variable access — mirrors @gltfi/runtime-lib's
  // EngineLike.getVariableByIndex/variableCount exactly (see
  // packages/conformance/src/interp-adapter.ts's sibling implementation),
  // so a host (e.g. apps/viewer's window.__gltfi smoke-test probe) can read
  // either engine's variable state through the same shape without knowing
  // which one it's holding.
  getVariable(index: number) {
    return this.runtime.variables[index];
  }

  get variableCount() {
    return this.runtime.variables.length;
  }

  get time() {
    return this.runtime.scheduler.time;
  }

  // F2 (see INTEGRATION-NOTES.md-style friction log): before this getter
  // existed, a host needing sentEvents to drive the conformance judge
  // protocol (packages/conformance/src/protocol.ts's judgeTest) had no
  // public way to get it off an InteractivityRuntime instance — it had to
  // reach through a private `runtime` field with an `as any` cast (exactly
  // as this class's own private `runtime: RuntimeGraph` field is declared
  // above). Mirrors packages/conformance/src/interp-adapter.ts's
  // interpEngineFromRuntime field-for-field (same source data: each sent
  // event's payload, one entry per event index that was ever sent via
  // "event/send" — see interpreter.ts's executeNodeFlow "event/send" case).
  get sentEvents(): readonly SentEvent[] {
    const out: SentEvent[] = [];
    for (const [eventIndex, payload] of this.runtime.eventPayloads) {
      out.push({
        eventIndex,
        externalId: this.runtime.graph.events?.[eventIndex]?.id,
        payload: [
          Boolean(payload.boolParameter),
          Number(payload.intParameter ?? 0),
          Number(payload.floatParameter ?? 0),
          Number(payload.expectedDuration ?? 0)
        ]
      });
    }
    return out;
  }

  // F2, continued: each declared event's default `expectedDuration` value
  // (index == event index), read straight from the graph JSON — needed
  // alongside sentEvents so judgeTest can compute a run's total duration
  // even when an event's default is never overridden by an actual send
  // (see protocol.ts's own doc comment on why it folds in every declared
  // default, not only sent ones).
  get eventDefaults(): readonly (number | undefined)[] {
    return (this.runtime.graph.events ?? []).map((event) => {
      const raw = (event as { values?: Record<string, { value?: unknown[] }> }).values?.expectedDuration?.value?.[0];
      return raw !== undefined ? Number(raw) : undefined;
    });
  }

  // Same value as getVariable — named to match EngineLike.getVariableByIndex
  // exactly, for callers building an EngineLike from this class by hand
  // (asEngineLike below does this internally; getVariable is kept as-is for
  // existing callers, e.g. apps/viewer's smoke-test probe).
  getVariableByIndex(index: number): Value {
    return this.runtime.variables[index];
  }

  // A conformance-judge-ready (EngineInteractive) view of this instance —
  // the fix for F2's actual reported cost: a host wrapping
  // InteractivityRuntime (e.g. a third-party engine adapter driving
  // packages/conformance's judgeTest, or this repo's own future
  // UserInteractions-category tests) can call this instead of reaching
  // through a private field. `advance` is `tick` under a EngineLike-
  // compatible name (safe to alias: a judge-style caller never queues
  // pointer events, so tick's queued-event drain is always a no-op in that
  // usage). `fireSelect`/`fireHoverIn`/`fireHoverOut` bridge to
  // setSelection/setHover exactly like apps/viewer's engine-host.ts's own
  // InterpreterEngineHost does (see that file's fireSelect/fireHoverIn/
  // fireHoverOut for the identical mapping).
  asEngineLike(): EngineInteractive {
    const self = this;
    return {
      start() {
        self.start();
      },
      advance(dt: number) {
        self.tick(dt);
      },
      getVariableByIndex(index: number) {
        return self.getVariableByIndex(index);
      },
      get variableCount() {
        return self.variableCount;
      },
      get sentEvents() {
        return self.sentEvents;
      },
      get time() {
        return self.time;
      },
      get eventDefaults() {
        return self.eventDefaults;
      },
      fireSelect(nodeIndex: number, point: [number, number, number], rayOrigin?: [number, number, number]) {
        self.setSelection(nodeIndex, point, rayOrigin);
      },
      fireHoverIn(nodeIndex: number, point?: [number, number, number]) {
        self.setHover(nodeIndex, point ?? [0, 0, 0]);
      },
      fireHoverOut() {
        self.setHover(-1, [0, 0, 0]);
      }
    };
  }

  getDebugState() {
    const scheduler = this.runtime.scheduler;
    const gltf = this.runtime.gltf as { nodes?: Array<{ translation?: number[] }> } | undefined;
    return {
      time: scheduler.time,
      tickCount: scheduler.tickCount,
      lastTickDelta: scheduler.lastTickDelta,
      delays: scheduler.delayCount,
      pointerInterpolations: scheduler.pointerInterpCount,
      node3: gltf?.nodes?.[3]?.translation ?? null,
      node4: gltf?.nodes?.[4]?.translation ?? null
    };
  }

  getDiagnostics() {
    return {
      nodes: this.graph.nodes.length,
      edges: this.graph.nodes.reduce((total, node) => total + (node.flows ? Object.keys(node.flows).length : 0), 0),
      lastEvent: this.lastEvent
    };
  }

  private eventOpFromEvent(event: InteractivityEvent) {
    if (event.type === "pointermove") {
      return "event/onPointerMove";
    }
    if (event.type === "pointerdown") {
      return "event/onPointerDown";
    }
    if (event.type === "pointerup") {
      return "event/onPointerUp";
    }
    return null;
  }

  private triggerEvent(op: string) {
    const nodes = this.eventNodes.get(op);
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (const nodeId of nodes) {
      executeFlow(this.runtime, nodeId, "in");
    }
  }

  // Chain of glTF node indices from the given node up to the scene root
  // (inclusive of the node itself). Uses the parent links prepareGltfData adds.
  private ancestorChain(nodeIndex: number): number[] {
    const chain: number[] = [];
    let current = nodeIndex;
    const nodes = (this.runtime.gltf as { nodes?: Array<{ parent?: number }> }).nodes ?? [];
    while (current >= 0 && current < nodes.length && !chain.includes(current)) {
      chain.push(current);
      const parent = nodes[current]?.parent;
      current = typeof parent === "number" ? parent : -1;
    }
    return chain;
  }

  // Fires interactivity event handlers whose configured nodeIndex is the hit
  // node or one of its ancestors, deepest first (event bubbling per
  // KHR_node_selectability / KHR_node_hoverability). `accept` lets hover
  // transitions skip handlers whose subtree contained both hover targets.
  // For "event/onSelect" specifically, once any handler that fires at a
  // given chain level was configured with stopPropagation:true, bubbling
  // stops before reaching that level's parent — mirrors
  // @gltfi/runtime-lib's engine.ts's fireSelect exactly (added there first;
  // ported back here so both engines' bubbling behavior is identical, since
  // the official corpus never exercises this — UserInteractions isn't in
  // test-index.json/mathtests-index.json — so there was no conformance gate
  // forcing the two to agree before now).
  private triggerNodeEvent(op: string, hitNodeIndex: number, accept: (handlerNodeIndex: number) => boolean) {
    const handlers = this.eventNodes.get(op);
    if (!handlers || handlers.length === 0) {
      return;
    }
    const chain = this.ancestorChain(hitNodeIndex);
    for (const target of chain) {
      let stopped = false;
      for (const handlerId of handlers) {
        const node = this.graph.nodes[handlerId];
        const raw = (node.configuration as Record<string, { value?: unknown[] }> | undefined)?.nodeIndex?.value?.[0];
        const configured = typeof raw === "number" ? Math.trunc(raw) : -1;
        if (configured === target && accept(configured)) {
          executeFlow(this.runtime, handlerId, "in");
          if (op === "event/onSelect") {
            const stopRaw = (node.configuration as Record<string, { value?: unknown[] }> | undefined)?.stopPropagation?.value?.[0];
            if (Boolean(stopRaw)) {
              stopped = true;
            }
          }
        }
      }
      if (stopped) {
        break;
      }
    }
  }

  private buildEventIndex() {
    this.eventNodes.clear();
    this.graph.nodes.forEach((node, index) => {
      const op = this.graph.declarations[node.declaration]?.op;
      if (!op || !op.startsWith("event/")) {
        return;
      }
      const list = this.eventNodes.get(op) ?? [];
      list.push(index);
      this.eventNodes.set(op, list);
    });
  }
}
