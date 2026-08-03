// Ray-vs-scene picking for click-select and hover. Broad-phase-only: each
// primitive's LOCAL bounds (RenderPrimitive.bounds) are transformed into a
// world-space AABB per instancing node (via that node's own worldMatrix,
// not the primitive's flattened instance-matrix buffer — simpler, and
// authoritative regardless of skinning) and tested against the pick ray with
// a standard slab test; the closest hit AABB's owning node wins. This is a
// deliberate simplification of "true" triangle-precise picking (Möller–
// Trumbore against the mesh) — plenty precise for KHR_node_selectability/
// hoverability's actual job (picking which glTF *node* a click landed on,
// not exact surface geometry), and keeps this file small.
import type { RenderNode, RenderPrimitive, RenderScene } from "@gltfi/gltf";
import { vec3TransformMat4, type Mat4, type Vec3 } from "./renderer/math.js";

export type Ray = { origin: Vec3; dir: Vec3 };
export type PickMode = "select" | "hover";
export type PickResult = { nodeIndex: number; point: Vec3 };

type Aabb = { min: Vec3; max: Vec3 };

function transformAabb(local: { min: [number, number, number]; max: [number, number, number] }, m: Mat4): Aabb {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < 8; i += 1) {
    const corner: Vec3 = [
      i & 1 ? local.max[0] : local.min[0],
      i & 2 ? local.max[1] : local.min[1],
      i & 4 ? local.max[2] : local.min[2]
    ];
    const world = vec3TransformMat4(m, corner);
    for (let k = 0; k < 3; k += 1) {
      if (world[k] < min[k]) min[k] = world[k];
      if (world[k] > max[k]) max[k] = world[k];
    }
  }
  return { min, max };
}

// Standard slab test; returns the nearest non-negative hit distance along
// the ray, or null for a miss. A ray starting inside the box returns 0.
function rayAabbDistance(ray: Ray, box: Aabb): number | null {
  let tmin = -Infinity;
  let tmax = Infinity;
  for (let i = 0; i < 3; i += 1) {
    const origin = ray.origin[i];
    const dir = ray.dir[i];
    if (Math.abs(dir) < 1e-12) {
      if (origin < box.min[i] || origin > box.max[i]) {
        return null;
      }
      continue;
    }
    let t1 = (box.min[i] - origin) / dir;
    let t2 = (box.max[i] - origin) / dir;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) {
      return null;
    }
  }
  if (tmax < 0) {
    return null;
  }
  return tmin >= 0 ? tmin : tmax;
}

function eligible(node: RenderNode, mode: PickMode): boolean {
  if (!node.visible) {
    return false;
  }
  return mode === "select" ? node.selectable : node.hoverable;
}

export function pickNode(scene: RenderScene, ray: Ray, mode: PickMode): PickResult | null {
  let bestT = Infinity;
  let best: PickResult | null = null;
  for (const prim of scene.primitives as RenderPrimitive[]) {
    for (const nodeIndex of prim.nodeIndices) {
      const node = scene.nodes[nodeIndex];
      if (!node || !eligible(node, mode)) {
        continue;
      }
      const box = transformAabb(prim.bounds, node.worldMatrix);
      const t = rayAabbDistance(ray, box);
      if (t !== null && t < bestT) {
        bestT = t;
        best = {
          nodeIndex,
          point: [ray.origin[0] + ray.dir[0] * t, ray.origin[1] + ray.dir[1] * t, ray.origin[2] + ray.dir[2] * t]
        };
      }
    }
  }
  return best;
}
