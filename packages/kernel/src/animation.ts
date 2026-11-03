// Animation sampling helpers for KHR_interactivity's animation control
// operations (animation/start, animation/stop, animation/stopAt) and the
// /animations/{n}/extensions/KHR_interactivity/* virtual pointers. Extracted
// from packages/runtime/src/interpreter.ts so both the interpreter and the
// compiled runtime-lib engine reuse the exact same accessor-decoding /
// timeline / sampling math — see docs/design/ir-and-transpiler.md's M3
// refactor note. Environment-neutral: reads the glTF JSON document and an
// optional DataView over the GLB binary chunk, both handed in explicitly
// (no dependency on a "runtime" or "engine" shape).
import { quatNormalize, quatSlerp } from "./math.js";

export type AccessorHost = {
  gltf: any;
  // Binary buffer chunk (GLB BIN) when available; sampling degrades
  // gracefully when it is null (accessor reads return null).
  glbBin: DataView | null;
};

const ACCESSOR_COMPONENT_COUNTS: Record<string, number> = {
  SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16
};

// Bytes per component for each glTF componentType.
const COMPONENT_BYTES: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

// A decoded accessor: `count` elements of `comps` components, flattened into
// one Float32Array (element i, component j at data[i * comps + j]). Integer
// data is already de-normalized when the accessor says `normalized`.
export type DecodedAccessor = { data: Float32Array; count: number; comps: number };

// Reads one scalar component of `componentType` at `offset` (little-endian,
// as glTF mandates), applying the spec's normalization when requested:
// signed max(c / (2^(n-1)-1), -1), unsigned c / (2^n-1).
function readComponent(bin: DataView, offset: number, componentType: number, normalized: boolean): number {
  switch (componentType) {
    case 5126:
      return bin.getFloat32(offset, true);
    case 5120: {
      const c = bin.getInt8(offset);
      return normalized ? Math.max(c / 127, -1) : c;
    }
    case 5121: {
      const c = bin.getUint8(offset);
      return normalized ? c / 255 : c;
    }
    case 5122: {
      const c = bin.getInt16(offset, true);
      return normalized ? Math.max(c / 32767, -1) : c;
    }
    case 5123: {
      const c = bin.getUint16(offset, true);
      return normalized ? c / 65535 : c;
    }
    default: {
      // 5125 (UNSIGNED_INT); never normalized in practice.
      const c = bin.getUint32(offset, true);
      return normalized ? c / 4294967295 : c;
    }
  }
}

// Decodes an accessor per glTF 2.0 §3.6.2: all six component types,
// `normalized`, bufferView.byteStride (interleaved data; stride defaults to
// the element size), accessor+bufferView byteOffset, sparse substitution
// (indices of 5121/5123/5125) and a missing bufferView (all zeros, which a
// sparse block may then patch). Returns null when the data cannot be decoded
// (no binary chunk, unknown type, or ranges outside the chunk) — callers
// skip such data deterministically. Matrix column padding is not modelled
// (animation accessors are never matrices).
export function decodeAccessor(host: AccessorHost, accessorIndex: number): DecodedAccessor | null {
  const accessor = host.gltf?.accessors?.[accessorIndex];
  const bin = host.glbBin;
  if (!accessor || !bin) {
    return null;
  }
  const comps = ACCESSOR_COMPONENT_COUNTS[accessor.type];
  const compBytes = COMPONENT_BYTES[accessor.componentType];
  const count = accessor.count;
  if (!comps || !compBytes || !Number.isInteger(count) || count < 0) {
    return null;
  }
  const normalized = accessor.normalized === true;
  const data = new Float32Array(count * comps);
  if (accessor.bufferView !== undefined) {
    const view = host.gltf?.bufferViews?.[accessor.bufferView];
    if (!view) {
      return null;
    }
    const elementBytes = comps * compBytes;
    const stride = view.byteStride ?? elementBytes;
    const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    if (count > 0 && base + (count - 1) * stride + elementBytes > bin.byteLength) {
      return null;
    }
    for (let i = 0; i < count; i += 1) {
      const at = base + i * stride;
      for (let j = 0; j < comps; j += 1) {
        data[i * comps + j] = readComponent(bin, at + j * compBytes, accessor.componentType, normalized);
      }
    }
  }
  const sparse = accessor.sparse;
  if (sparse) {
    const n = sparse.count;
    const idxType = sparse.indices?.componentType;
    const idxBytes = idxType === 5121 || idxType === 5123 || idxType === 5125 ? COMPONENT_BYTES[idxType] : 0;
    const idxView = host.gltf?.bufferViews?.[sparse.indices?.bufferView];
    const valView = host.gltf?.bufferViews?.[sparse.values?.bufferView];
    if (!Number.isInteger(n) || n < 0 || !idxBytes || !idxView || !valView) {
      return null;
    }
    const idxBase = (idxView.byteOffset ?? 0) + (sparse.indices.byteOffset ?? 0);
    const valBase = (valView.byteOffset ?? 0) + (sparse.values.byteOffset ?? 0);
    if (idxBase + n * idxBytes > bin.byteLength || valBase + n * comps * compBytes > bin.byteLength) {
      return null;
    }
    for (let s = 0; s < n; s += 1) {
      const target = readComponent(bin, idxBase + s * idxBytes, idxType, false);
      if (target >= count) {
        return null;
      }
      for (let j = 0; j < comps; j += 1) {
        data[target * comps + j] = readComponent(bin, valBase + (s * comps + j) * compBytes, accessor.componentType, normalized);
      }
    }
  }
  return { data, count, comps };
}

// Compat wrapper (public export; downstream code may import it): decodes an
// accessor as an array of per-element number arrays, or null when it cannot
// be decoded. Uncached — the animation sampler uses the cached flat path.
export function readAccessorElements(host: AccessorHost, accessorIndex: number): number[][] | null {
  const decoded = decodeAccessor(host, accessorIndex);
  if (!decoded) {
    return null;
  }
  const out: number[][] = [];
  for (let i = 0; i < decoded.count; i += 1) {
    out.push(Array.from(decoded.data.subarray(i * decoded.comps, (i + 1) * decoded.comps)));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-document cache. Decoding accessors and scanning keyframes every tick
// was the hot spot (thousands of float reads + small allocations per frame),
// so decoded accessors and per-animation channel plans are built once and
// kept in a WeakMap keyed by the host's glTF JSON object (the interpreter
// and the compiled engine each own one cloned gltf for their lifetime and
// build a fresh AccessorHost wrapper per call, so the gltf object — not the
// wrapper — is the stable identity). This is not module-level mutable state
// in the problematic sense: the WeakMap only maps live documents to their
// own caches, and entries die with the document. Invalidation: an entry also
// remembers the binary chunk and the accessors/animations/bufferViews array
// identities and is rebuilt when any differs; callers that mutate those
// arrays in place can call invalidateAnimationCache(gltf).
type ChannelPlan = {
  times: Float32Array;
  values: Float32Array;
  width: number; // components per sampled value (weights: target count)
  cubic: boolean;
  step: boolean;
  path: string;
  node: number;
  pointer: string;
  lastKey: number; // last-used keyframe index, fast path for monotonic playback
};
type AnimationPlan = { maxTime: number; channels: ChannelPlan[]; skipped: number };
type DocCache = {
  bin: DataView | null;
  accessors: unknown;
  animations: unknown;
  bufferViews: unknown;
  decoded: Map<number, DecodedAccessor | null>;
  plans: Map<number, AnimationPlan>;
  decodes: number;
  hits: number;
};

const docCaches = new WeakMap<object, DocCache>();

function getDocCache(host: AccessorHost): DocCache | null {
  const gltf = host.gltf;
  if (!gltf || typeof gltf !== "object") {
    return null;
  }
  let cache = docCaches.get(gltf);
  if (
    !cache ||
    cache.bin !== host.glbBin ||
    cache.accessors !== gltf.accessors ||
    cache.animations !== gltf.animations ||
    cache.bufferViews !== gltf.bufferViews
  ) {
    cache = {
      bin: host.glbBin,
      accessors: gltf.accessors,
      animations: gltf.animations,
      bufferViews: gltf.bufferViews,
      decoded: new Map(),
      plans: new Map(),
      decodes: cache ? cache.decodes : 0,
      hits: cache ? cache.hits : 0
    };
    docCaches.set(gltf, cache);
  }
  return cache;
}

// Drops the cached decoded accessors / channel plans for a document.
export function invalidateAnimationCache(gltf: object): void {
  docCaches.delete(gltf);
}

// Diagnostics for tests/benchmarks: how many accessor decodes ran vs. were
// served from the cache for this host's document.
export function getAnimationCacheStats(host: AccessorHost): { decodes: number; hits: number } {
  const cache = getDocCache(host);
  return { decodes: cache?.decodes ?? 0, hits: cache?.hits ?? 0 };
}

function cachedAccessor(host: AccessorHost, cache: DocCache, index: number): DecodedAccessor | null {
  if (cache.decoded.has(index)) {
    cache.hits += 1;
    return cache.decoded.get(index) ?? null;
  }
  cache.decodes += 1;
  const decoded = decodeAccessor(host, index);
  cache.decoded.set(index, decoded);
  return decoded;
}

// Builds the sampling plan for one channel, or null when its data is
// unusable (counted in the plan's `skipped`).
function buildChannelPlan(host: AccessorHost, cache: DocCache, animation: any, channel: any): ChannelPlan | null {
  const sampler = animation.samplers?.[channel.sampler];
  const target = channel.target;
  if (typeof target.path !== "string") {
    return null;
  }
  const input = cachedAccessor(host, cache, sampler.input);
  const output = cachedAccessor(host, cache, sampler.output);
  if (!input || !output || input.count === 0 || input.comps !== 1) {
    return null;
  }
  const interpolation = sampler.interpolation ?? "LINEAR";
  const cubic = interpolation === "CUBICSPLINE";
  // Output holds `keys * (cubic ? 3 : 1)` values; each value has `width`
  // components (weights outputs are SCALAR accessors holding
  // keys * perKey * targetCount floats).
  const valueCount = input.count * (cubic ? 3 : 1);
  if (output.data.length === 0 || output.data.length % valueCount !== 0) {
    return null;
  }
  return {
    times: input.data,
    values: output.data,
    width: output.data.length / valueCount,
    cubic,
    step: interpolation === "STEP",
    path: target.path,
    node: target.node,
    pointer: `/nodes/${target.node}/${target.path}`,
    lastKey: 0
  };
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

export type ApplyAnimationResult = {
  t: number;
  wroteAny: boolean;
  // Channels skipped because their accessor data was undecodable (no binary
  // chunk, out-of-range, unsupported layout...). The runtimes have no
  // console/diagnostic channel, so this count is the deterministic,
  // non-throwing signal for hosts that care.
  skippedChannels: number;
};

function getAnimationPlan(host: AccessorHost, cache: DocCache, animationIndex: number, animation: any): AnimationPlan {
  let plan = cache.plans.get(animationIndex);
  if (plan) {
    return plan;
  }
  const { max } = getAnimationTimeRange(host, animationIndex);
  plan = { maxTime: Number.isFinite(max) ? max : 0, channels: [], skipped: 0 };
  for (const channel of animation.channels ?? []) {
    const sampler = animation.samplers?.[channel.sampler];
    if (!sampler || !channel.target || channel.target.node === undefined) {
      continue; // structurally invalid channel: ignored, not a data failure
    }
    const channelPlan = buildChannelPlan(host, cache, animation, channel);
    if (channelPlan) {
      plan.channels.push(channelPlan);
    } else {
      plan.skipped += 1;
    }
  }
  cache.plans.set(animationIndex, plan);
  return plan;
}

// Finds k with times[k] <= t < times[k+1] (t strictly inside the range).
// Playback is mostly monotonic, so try the last-used key and its successor
// before falling back to binary search.
function findKey(plan: ChannelPlan, t: number): number {
  const times = plan.times;
  const n = times.length;
  const last = plan.lastKey;
  if (last + 1 < n && times[last] <= t && t < times[last + 1]) {
    return last;
  }
  if (last + 2 < n && times[last + 1] <= t && t < times[last + 2]) {
    plan.lastKey = last + 1;
    return last + 1;
  }
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  plan.lastKey = lo;
  return lo;
}

// Reads value slot `slot` (index in units of `width`) into a new array.
function readValue(plan: ChannelPlan, slot: number): number[] {
  const out = new Array<number>(plan.width);
  const base = slot * plan.width;
  for (let j = 0; j < plan.width; j += 1) {
    out[j] = plan.values[base + j];
  }
  return out;
}

function sampleChannel(plan: ChannelPlan, t: number): number[] {
  const n = plan.times.length;
  // CUBICSPLINE keyframes are [inTangent, value, outTangent]; the value of
  // key k sits at slot k*3+1.
  const valueSlot = (key: number) => (plan.cubic ? key * 3 + 1 : key);
  if (n === 1 || t <= plan.times[0]) {
    return readValue(plan, valueSlot(0));
  }
  if (t >= plan.times[n - 1]) {
    return readValue(plan, valueSlot(n - 1));
  }
  const k = findKey(plan, t);
  const t0 = plan.times[k];
  const dt = plan.times[k + 1] - t0;
  const u = dt > 0 ? (t - t0) / dt : 0;
  if (plan.step) {
    return readValue(plan, k);
  }
  if (plan.cubic) {
    // Cubic Hermite (glTF 2.0 Appendix C): tangents are scaled by the
    // keyframe interval dt; rotations are re-normalized afterwards.
    const w = plan.width;
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;
    const v0 = valueSlot(k) * w;
    const b0 = (k * 3 + 2) * w; // outTangent of k
    const v1 = valueSlot(k + 1) * w;
    const a1 = (k + 1) * 3 * w; // inTangent of k+1
    const out = new Array<number>(w);
    for (let j = 0; j < w; j += 1) {
      out[j] =
        h00 * plan.values[v0 + j] + h10 * dt * plan.values[b0 + j] + h01 * plan.values[v1 + j] + h11 * dt * plan.values[a1 + j];
    }
    return plan.path === "rotation" ? quatNormalize(out) : out;
  }
  if (plan.path === "rotation") {
    return quatSlerp(readValue(plan, k), readValue(plan, k + 1), u);
  }
  const out = new Array<number>(plan.width);
  const a = k * plan.width;
  const b = a + plan.width;
  for (let j = 0; j < plan.width; j += 1) {
    const x = plan.values[a + j];
    out[j] = x + (plan.values[b + j] - x) * u;
  }
  return out;
}

// Samples animation `animationIndex` at virtual-timeline position `requested`
// and writes the resulting channel values straight into `host.gltf`'s node
// objects (translation/rotation/scale/weights), calling `onChannelWrite` for
// each written channel (pointer path + sampled value) so a caller can notify
// its own dirty/observer hooks. Returns null when the animation doesn't
// exist; otherwise the effective sample time `t`, whether any channel was
// actually written, and how many channels were skipped as undecodable.
// Accessor decoding and channel setup happen once per document (see the
// cache above); a tick only does keyframe lookup + interpolation.
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
  const cache = getDocCache(host);
  if (!cache) {
    return null;
  }
  const plan = getAnimationPlan(host, cache, animationIndex, animation);
  const t = effectiveAnimationTime(requested, plan.maxTime);
  let wroteAny = false;
  for (const channel of plan.channels) {
    const node = host.gltf?.nodes?.[channel.node];
    if (!node) {
      continue;
    }
    const sampled = sampleChannel(channel, t);
    node[channel.path] = sampled;
    onChannelWrite?.(channel.pointer, sampled);
    wroteAny = true;
  }
  return { t, wroteAny, skippedChannels: plan.skipped };
}
