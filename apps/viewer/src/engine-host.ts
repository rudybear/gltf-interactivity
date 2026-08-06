// One small interface both KHR_interactivity engines sit behind, so main.ts
// never has to branch on which engine is active beyond the single place that
// constructs one (createEngineHost, at the bottom of this file). Wraps:
//  - the interpreter (@gltfi/runtime's InteractivityRuntime + host.ts's
//    SceneAdapter bubbling — reused as-is, not duplicated), and
//  - the compiled engine (@gltfi/runtime-lib's EngineInteractive, built
//    in-browser per loaded asset by compiled-loader.ts).
import { applyInteractivityPointer, type RenderScene } from "@gltfi/gltf";
import { InteractivityRuntime, resolveGraph, type SceneAdapter } from "@gltfi/runtime";
import type { EngineInteractive } from "@gltfi/runtime-lib";
import { loadCompiledEngine } from "./compiled-loader.js";

export type EngineName = "interpreter" | "compiled";

export type HitInfo = {
  point: [number, number, number];
  rayOrigin?: [number, number, number];
};

export interface EngineHost {
  readonly name: EngineName;
  start(): void;
  tick(dtSeconds: number): void;
  // `hit` carries the world-space hit point/ray (KHR_node_selectability's
  // selectionPoint/selectionRayOrigin) — required for select, optional for
  // hover (onHoverIn/onHoverOut have no point-typed output socket; kept on
  // the signature only so a future hoverPoint pointer bridge doesn't need an
  // interface change).
  fireSelect(nodeIndex: number, hit: HitInfo): void;
  fireHoverIn(nodeIndex: number, hit?: HitInfo): void;
  fireHoverOut(nodeIndex: number): void;
  // True (and resets to false) iff a pointer/render-affecting write happened
  // since the last call — the signal main.ts's tick loop uses to decide
  // whether to re-run updateWorldMatrices/refreshInstanceMatrices/
  // updateSkinMatrices + push fresh GPU buffers this frame.
  consumeDirtyPointers(): boolean;
  getVariable(index: number): unknown;
  readonly variableCount: number;
  readonly time: number;
}

// KHR_interactivity pointer/set values arrive as bool/bool[]/number/number[]
// (see host.ts's SceneAdapter.applyPointer and runtime-lib's onPointerSet —
// both use this exact union); @gltfi/gltf's applyInteractivityPointer only
// accepts number[] (booleans as 0/1 — see its own JSON-pointer node/material
// property setters, which read raw numeric factors either way).
function toPointerArray(value: number[] | boolean[] | number | boolean): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "boolean" ? (item ? 1 : 0) : Number(item)));
  }
  return [typeof value === "boolean" ? (value ? 1 : 0) : Number(value)];
}

// F3 upstream fix: @gltfi/runtime's SceneAdapter no longer declares
// setNodeVisibility/setNodeSelectable/setNodeHoverable (they had no call
// site anywhere in that package — KHR_node_visibility/selectability/
// hoverability always arrive here as ordinary `/nodes/{N}/extensions/
// KHR_node_*/...` pointer strings through applyPointer below, dispatched by
// applyInteractivityPointer itself; see packages/gltf/src/index.ts). This
// adapter used to implement all three anyway to be an "honest, complete"
// SceneAdapter; now that the type only declares applyPointer, there's
// nothing left to implement.
function makeSceneAdapter(scene: RenderScene, markDirty: () => void): SceneAdapter {
  return {
    applyPointer(pointer, value) {
      applyInteractivityPointer(scene, pointer, toPointerArray(value));
      markDirty();
    }
  };
}

class InterpreterEngineHost implements EngineHost {
  readonly name = "interpreter" as const;
  private readonly runtime: InteractivityRuntime;
  private dirty = false;

  constructor(gltfJson: unknown, binary: Uint8Array | ArrayBuffer | null, scene: RenderScene) {
    const graph = resolveGraph(gltfJson);
    this.runtime = new InteractivityRuntime(graph, gltfJson, binary);
    this.runtime.bindAdapter(
      makeSceneAdapter(scene, () => {
        this.dirty = true;
      })
    );
  }

  start(): void {
    this.runtime.start();
  }

  tick(dtSeconds: number): void {
    this.runtime.tick(dtSeconds);
    if (this.runtime.consumeDirty()) {
      this.dirty = true;
    }
  }

  fireSelect(nodeIndex: number, hit: HitInfo): void {
    this.runtime.setSelection(nodeIndex, hit.point, hit.rayOrigin);
  }

  // host.ts's InteractivityRuntime.setHover(nodeIndex, point) already IS the
  // full hover-transition entry point (fires onHoverOut for whatever was
  // previously hovered + onHoverIn for the new node, tracking its own
  // lastHoverIndex) — so both EngineHost hover methods route through it; the
  // "In"/"Out" split only matters at the call site (see main.ts's picking
  // code), not to the interpreter itself.
  fireHoverIn(nodeIndex: number, hit?: HitInfo): void {
    this.runtime.setHover(nodeIndex, hit?.point ?? [0, 0, 0]);
  }

  fireHoverOut(): void {
    this.runtime.setHover(-1, [0, 0, 0]);
  }

  consumeDirtyPointers(): boolean {
    const dirty = this.dirty;
    this.dirty = false;
    return dirty;
  }

  getVariable(index: number): unknown {
    return this.runtime.getVariable(index);
  }

  get variableCount(): number {
    return this.runtime.variableCount;
  }

  get time(): number {
    return this.runtime.time;
  }
}

// Shared mutable box so the onPointerSet closure handed to
// loadCompiledEngine (which needs to exist *before* the engine itself does —
// it's one of the engine's own construction options) and the EngineHost
// built from the resulting engine (constructed *after*) can agree on one
// dirty flag without a chicken-and-egg ordering problem.
type DirtyBox = { dirty: boolean };

class CompiledEngineHost implements EngineHost {
  readonly name = "compiled" as const;
  private readonly engine: EngineInteractive;
  private readonly box: DirtyBox;

  constructor(engine: EngineInteractive, box: DirtyBox) {
    this.engine = engine;
    this.box = box;
  }

  start(): void {
    this.engine.start();
  }

  tick(dtSeconds: number): void {
    this.engine.advance(dtSeconds);
  }

  fireSelect(nodeIndex: number, hit: HitInfo): void {
    this.engine.fireSelect(nodeIndex, hit.point, hit.rayOrigin);
  }

  fireHoverIn(nodeIndex: number, hit?: HitInfo): void {
    this.engine.fireHoverIn(nodeIndex, hit?.point);
  }

  fireHoverOut(nodeIndex: number): void {
    this.engine.fireHoverOut(nodeIndex);
  }

  consumeDirtyPointers(): boolean {
    const dirty = this.box.dirty;
    this.box.dirty = false;
    return dirty;
  }

  getVariable(index: number): unknown {
    return this.engine.getVariableByIndex(index);
  }

  get variableCount(): number {
    return this.engine.variableCount;
  }

  get time(): number {
    return this.engine.time;
  }
}

// Builds the EngineHost for whichever mode ?engine= selected. `scene` is the
// already-built RenderScene (SceneAdapter target); `gltfJson`/`binary` are
// the loaded document's parsed JSON and GLB BIN chunk (may be null for a
// .gltf with no binary chunk).
export async function createEngineHost(
  engineName: EngineName,
  gltfJson: unknown,
  binary: Uint8Array | ArrayBuffer | null,
  scene: RenderScene
): Promise<EngineHost> {
  if (engineName === "interpreter") {
    return new InterpreterEngineHost(gltfJson, binary, scene);
  }
  const box: DirtyBox = { dirty: false };
  const { engine } = await loadCompiledEngine(gltfJson, binary, (pointer, value) => {
    applyInteractivityPointer(scene, pointer, toPointerArray(value));
    box.dirty = true;
  });
  return new CompiledEngineHost(engine, box);
}
