// Host wrapper around the interpreter core: owns pointer/hover/select event
// bubbling and dirty tracking for a scene renderer. Ported from the browser
// fork's runtime/index.ts; adjusted to import the core's own Graph type
// instead of a host-app-specific KHR_interactivity parser type.
import { advanceTime, createRuntime, executeFlow, type Graph, type RuntimeGraph } from "./interpreter.js";

export type InteractivityEvent =
  | { type: "pointermove"; x: number; y: number }
  | { type: "pointerdown"; x: number; y: number }
  | { type: "pointerup"; x: number; y: number };

export type SceneAdapter = {
  applyPointer(pointer: string, value: number[] | boolean[] | number | boolean): void;
  setNodeVisibility(nodeIndex: number, visible: boolean): void;
  setNodeSelectable(nodeIndex: number, selectable: boolean): void;
  setNodeHoverable(nodeIndex: number, hoverable: boolean): void;
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

  getDebugState() {
    const r = this.runtime as unknown as {
      time: number;
      tickCount: number;
      lastTickDelta: number;
      delays: unknown[];
      pointerInterpolations: unknown[];
      gltf?: { nodes?: Array<{ translation?: number[] }> };
    };
    return {
      time: r.time,
      tickCount: r.tickCount,
      lastTickDelta: r.lastTickDelta,
      delays: r.delays?.length,
      pointerInterpolations: r.pointerInterpolations?.length,
      node3: r.gltf?.nodes?.[3]?.translation ?? null,
      node4: r.gltf?.nodes?.[4]?.translation ?? null
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
  private triggerNodeEvent(op: string, hitNodeIndex: number, accept: (handlerNodeIndex: number) => boolean) {
    const handlers = this.eventNodes.get(op);
    if (!handlers || handlers.length === 0) {
      return;
    }
    const chain = this.ancestorChain(hitNodeIndex);
    for (const target of chain) {
      for (const handlerId of handlers) {
        const node = this.graph.nodes[handlerId];
        const raw = (node.configuration as Record<string, { value?: unknown[] }> | undefined)?.nodeIndex?.value?.[0];
        const configured = typeof raw === "number" ? Math.trunc(raw) : -1;
        if (configured === target && accept(configured)) {
          executeFlow(this.runtime, handlerId, "in");
        }
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
