// Animation sampling helpers for KHR_interactivity's animation control
// operations (animation/start, animation/stop, animation/stopAt) and the
// /animations/{n}/extensions/KHR_interactivity/* virtual pointers. Extracted
// verbatim (behavior-preserving) from packages/runtime/src/interpreter.ts so
// both the interpreter and the compiled runtime-lib engine can reuse the
// exact same sampling/timeline math — see docs/design/ir-and-transpiler.md's
// M3 refactor note. Environment-neutral: reads the glTF JSON document and an
// optional DataView over the GLB binary chunk, both handed in explicitly
// (no dependency on a "runtime" or "engine" shape).
import { quatSlerp } from "./math.js";

export type AccessorHost = {
  gltf: any;
  // Binary buffer chunk (GLB BIN) when available; sampling degrades
  // gracefully when it is null (accessor reads return null).
  glbBin: DataView | null;
};

const ACCESSOR_COMPONENT_COUNTS: Record<string, number> = {
  SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16
};

// Decodes an accessor from the binary chunk as an array of per-element number
// arrays. Only tightly-packed float32 data is supported, which covers
// animation samplers. Returns null when no binary chunk is available.
export function readAccessorElements(host: AccessorHost, accessorIndex: number): number[][] | null {
  const accessor = host.gltf?.accessors?.[accessorIndex];
  const bin = host.glbBin;
  if (!accessor || !bin || accessor.componentType !== 5126) {
    return null;
  }
  const componentCount = ACCESSOR_COMPONENT_COUNTS[accessor.type] ?? 1;
  const view = host.gltf?.bufferViews?.[accessor.bufferView ?? -1];
  if (!view) {
    return null;
  }
  const byteOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const end = byteOffset + accessor.count * componentCount * 4;
  if (end > bin.byteLength) {
    return null;
  }
  const out: number[][] = [];
  for (let i = 0; i < accessor.count; i += 1) {
    const element: number[] = [];
    for (let j = 0; j < componentCount; j += 1) {
      element.push(bin.getFloat32(byteOffset + (i * componentCount + j) * 4, true));
    }
    out.push(element);
  }
  return out;
}

export function getAnimationTimeRange(host: AccessorHost, animationIndex: number): { min: number; max: number } {
  const animation = host.gltf?.animations?.[animationIndex];
  if (!animation) {
    return { min: NaN, max: NaN };
  }
  let min = Infinity;
  let max = -Infinity;
  const usedSamplers = new Set<number>((animation.channels ?? []).map((channel: any) => channel.sampler));
  for (const samplerIndex of usedSamplers) {
    const sampler = animation.samplers?.[samplerIndex];
    const input = host.gltf?.accessors?.[sampler?.input ?? -1];
    if (!input) {
      continue;
    }
    if (Array.isArray(input.min)) {
      min = Math.min(min, input.min[0]);
    }
    if (Array.isArray(input.max)) {
      max = Math.max(max, input.max[0]);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: NaN, max: NaN };
  }
  return { min, max };
}

// Maps a requested timestamp on the infinite timeline to the effective
// timestamp within the animation data range [0, T] (KHR_interactivity §4.6).
export function effectiveAnimationTime(requested: number, maxTime: number): number {
  if (!maxTime) {
    return 0;
  }
  const s = requested > 0 ? Math.ceil((requested - maxTime) / maxTime) : Math.floor(requested / maxTime);
  return requested - s * maxTime;
}

export type ApplyAnimationResult = { t: number; wroteAny: boolean };

// Samples animation `animationIndex` at virtual-timeline position `requested`
// and writes the resulting channel values straight into `host.gltf`'s node
// objects (translation/rotation/scale/weights), calling `onChannelWrite` for
// each written channel (pointer path + sampled value) so a caller can notify
// its own dirty/observer hooks. Returns null when the animation doesn't
// exist; otherwise the effective sample time `t` and whether any channel was
// actually written (no binary chunk / no accessor data => false).
export function applyAnimationAt(
  host: AccessorHost,
  animationIndex: number,
  requested: number,
  onChannelWrite?: (pointer: string, value: number[]) => void
): ApplyAnimationResult | null {
  const animation = host.gltf?.animations?.[animationIndex];
  if (!animation) {
    return null;
  }
  const { max } = getAnimationTimeRange(host, animationIndex);
  const t = effectiveAnimationTime(requested, Number.isFinite(max) ? max : 0);
  let wroteAny = false;
  for (const channel of animation.channels ?? []) {
    const sampler = animation.samplers?.[channel.sampler];
    const target = channel.target;
    if (!sampler || !target || target.node === undefined) {
      continue;
    }
    const times = readAccessorElements(host, sampler.input)?.map((item) => item[0]);
    const values = readAccessorElements(host, sampler.output);
    if (!times || !values || times.length === 0) {
      continue;
    }
    const interpolation = sampler.interpolation ?? "LINEAR";
    const stride = interpolation === "CUBICSPLINE" ? 3 : 1;
    let sampled: number[];
    if (t <= times[0]) {
      sampled = values[0 * stride + (stride === 3 ? 1 : 0)];
    } else if (t >= times[times.length - 1]) {
      sampled = values[(times.length - 1) * stride + (stride === 3 ? 1 : 0)];
    } else {
      let k = 0;
      while (k + 1 < times.length && times[k + 1] < t) {
        k += 1;
      }
      const t0 = times[k];
      const t1 = times[k + 1];
      const u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
      const v0 = values[k * stride + (stride === 3 ? 1 : 0)];
      const v1 = values[(k + 1) * stride + (stride === 3 ? 1 : 0)];
      if (interpolation === "STEP") {
        sampled = v0;
      } else if (target.path === "rotation") {
        sampled = quatSlerp(v0, v1, u);
      } else {
        sampled = v0.map((item, index) => item + (v1[index] - item) * u);
      }
    }
    const node = host.gltf?.nodes?.[target.node];
    if (!node) {
      continue;
    }
    if (target.path === "weights") {
      node.weights = sampled;
    } else {
      node[target.path] = sampled;
    }
    onChannelWrite?.(`/nodes/${target.node}/${target.path}`, sampled);
    wroteAny = true;
  }
  return { t, wroteAny };
}
