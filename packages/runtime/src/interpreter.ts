
import type { Value, ValueType } from "@gltfi/kernel";
export type { Value, ValueType };
import {
  applyBinary,
  applyUnary,
  boolValue,
  broadcast,
  cloneValue,
  crossVec3,
  cubicBezierEase,
  defaultValue,
  floatValue,
  intValue,
  isFiniteValue,
  mat2Determinant,
  mat2Invert,
  mat2Mul,
  mat3Determinant,
  mat3Invert,
  mat3Mul,
  mat4Compose,
  mat4Decompose,
  mat4Determinant,
  mat4Identity,
  mat4Invert,
  mat4Mul,
  mat4Transpose,
  normalizeVec3,
  parseScalar,
  quatAngleBetween,
  quatFromAxisAngle,
  quatFromDirections,
  quatFromUpForward,
  quatMul,
  quatNormalize,
  quatSlerp,
  quatToAxisAngle,
  rotate2D,
  toValue,
  transformVec3,
  valueToNumberArray,
  vectorSlerp,
  doNAdvance,
  multiGateAdvance,
  throttleAdvance,
  waitAllAdvance
} from "@gltfi/kernel";

export type NodeRef = { node: number; socket: string };

export type NodeValue =
  | { type: number; value: Array<number | boolean | string> }
  | NodeRef;

export type GraphNode = {
  declaration: number;
  configuration?: Record<string, { value: Array<number | boolean | string> }>;
  values?: Record<string, NodeValue>;
  flows?: Record<string, NodeRef>;
};

export type Graph = {
  types: Array<{ signature: ValueType }>;
  variables: Array<{ id: string; type: number; value: Array<number | boolean | string> }>;
  events: Array<{ id: string; values: Record<string, { type: number; value: Array<number | boolean | string> }> }>;
  declarations: Array<{ op: string }>;
  nodes: GraphNode[];
};

export type RuntimeGraph = {
  graph: Graph;
  variables: Value[];
  nodeStates: Map<number, NodeState>;
  nodeOutputs: Map<number, Map<string, Value>>;
  eventPayloads: Map<number, EventPayload>;
  time: number;
  pointerX: number;
  pointerY: number;
  activeCameraPosition: [number, number, number] | null;
  activeCameraRotation: [number, number, number, number] | null;
  hoveredNodeIndex: number;
  hoverPoint: [number, number, number];
  selectedNodeIndex: number;
  selectionPoint: [number, number, number];
  selectionRayOrigin: [number, number, number];
  delays: DelayItem[];
  interpolations: Interpolation[];
  pointerInterpolations: PointerInterpolation[];
  animationStates: AnimationState[];
  animationRuntimes: Map<number, { playhead: number; virtualPlayhead: number }>;
  gltf: any;
  // Binary buffer chunk (GLB BIN) when available; animation sampler decoding
  // degrades gracefully when it is null (see readAccessorElements).
  glbBin: DataView | null;
  eventReceivers: Map<number, number[]>;
  randomState: number;
  nextDelayId: number;
  activeDelayRefs: Set<string>;
  tickCount: number;
  lastTickDelta: number;
  stoppedEvents: Set<string>;
  trace?: number[];
  onPointerSet?: (pointer: string, value: number[] | boolean[] | number | boolean) => void;
  onDirty?: () => void;
};

export type PointerInterpolation = {
  pointer: string;
  startTime: number;
  duration: number;
  startValue: number[];
  endValue: number[];
  p1: [number, number];
  p2: [number, number];
  isQuaternion: boolean;
  doneFlow?: NodeRef;
};

export type AnimationState = {
  animationIndex: number;
  startTime: number;
  endTime: number;
  stopTime: number;
  speed: number;
  entryCreation: number;
  endDoneFlow?: NodeRef;
  stopDoneFlow?: NodeRef;
};

export type NodeState = {
  doNCount?: number;
  forIndex?: number;
  throttleTime?: number;
  throttleRemaining?: number;
  remainingInputs?: number;
  waitAllSeen?: Set<string>;
  waitAllActivated?: boolean[];
  multiGateLastIndex?: number;
  multiGateUsed?: boolean[];
  lastDelayIndex?: number;
  lastDelayRef?: string;
  delayIds?: number[];
};

export type DelayItem = {
  id: number;
  ref: string;
  time: number;
  nodeId: number;
  socket: string;
  canceled: boolean;
  ownerNodeId: number;
};

export type Interpolation = {
  variableIndex: number;
  startTime: number;
  duration: number;
  startValue: Value;
  endValue: Value;
  p1: [number, number];
  p2: [number, number];
  useSlerp: boolean;
  doneFlow?: NodeRef;
  errFlow?: NodeRef;
};

export type EventPayload = {
  boolParameter?: boolean;
  intParameter?: number;
  floatParameter?: number;
  expectedDuration?: number;
};

// Shape of a KHR_interactivity conformance-corpus test-oracle JSON file. Env
// neutral: describing it here doesn't require file I/O.
export type TestJson = {
  glbFileName: string;
  name: string;
  tests: Array<{
    name: string;
    entryPoints: Array<{ name: string; nodeId: number; delayedExecutionTime?: number }>;
    subTests: Array<{
      name: string;
      resultVarId: number;
      successResultVarId: number;
      resultVarType: ValueType;
      expectedResultValue: Array<number | boolean>;
    }>;
  }>;
};

// Identifies a conformance test case by file path; the paths are only ever
// touched by node.ts, which is the sole place that reads them from disk.
export type TestEntry = {
  name: string;
  glbPath: string;
  testPath: string;
};

export type TestResult = { ok: boolean; failures: string[] };

export type ExecuteOptions = {
  maxIterations?: number;
  tickStep?: number;
};

export function resolveGraph(gltf: any): Graph {
  const inter = gltf.extensions?.KHR_interactivity;
  if (!inter) {
    throw new Error("Missing KHR_interactivity.");
  }
  const graph = inter.graphs?.[0] as Graph;
  if (!graph) {
    throw new Error("Missing graph.");
  }
  return graph;
}

const ACCESSOR_COMPONENT_COUNTS: Record<string, number> = {
  SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16
};

// Decodes an accessor from the binary chunk as an array of per-element number
// arrays. Only tightly-packed float32 data is supported, which covers
// animation samplers. Returns null when no binary chunk is available — hosts
// that construct this runtime from glTF JSON only still get animation
// playhead tracking and done flows, just without sampled TRS/weights values.
function readAccessorElements(runtime: RuntimeGraph, accessorIndex: number): number[][] | null {
  const accessor = runtime.gltf?.accessors?.[accessorIndex];
  const bin = runtime.glbBin;
  if (!accessor || !bin || accessor.componentType !== 5126) {
    return null;
  }
  const componentCount = ACCESSOR_COMPONENT_COUNTS[accessor.type] ?? 1;
  const view = runtime.gltf?.bufferViews?.[accessor.bufferView ?? -1];
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

function getAnimationTimeRange(runtime: RuntimeGraph, animationIndex: number): { min: number; max: number } {
  const animation = runtime.gltf?.animations?.[animationIndex];
  if (!animation) {
    return { min: NaN, max: NaN };
  }
  let min = Infinity;
  let max = -Infinity;
  const usedSamplers = new Set<number>((animation.channels ?? []).map((channel: any) => channel.sampler));
  for (const samplerIndex of usedSamplers) {
    const sampler = animation.samplers?.[samplerIndex];
    const input = runtime.gltf?.accessors?.[sampler?.input ?? -1];
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
function effectiveAnimationTime(requested: number, maxTime: number): number {
  if (!maxTime) {
    return 0;
  }
  const s = requested > 0 ? Math.ceil((requested - maxTime) / maxTime) : Math.floor(requested / maxTime);
  return requested - s * maxTime;
}

function applyAnimationAt(runtime: RuntimeGraph, animationIndex: number, requested: number) {
  const animation = runtime.gltf?.animations?.[animationIndex];
  if (!animation) {
    return;
  }
  const { max } = getAnimationTimeRange(runtime, animationIndex);
  const t = effectiveAnimationTime(requested, Number.isFinite(max) ? max : 0);
  let wroteAny = false;
  for (const channel of animation.channels ?? []) {
    const sampler = animation.samplers?.[channel.sampler];
    const target = channel.target;
    if (!sampler || !target || target.node === undefined) {
      continue;
    }
    const times = readAccessorElements(runtime, sampler.input)?.map((item) => item[0]);
    const values = readAccessorElements(runtime, sampler.output);
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
    const node = runtime.gltf?.nodes?.[target.node];
    if (!node) {
      continue;
    }
    if (target.path === "weights") {
      node.weights = sampled;
    } else {
      node[target.path] = sampled;
    }
    runtime.onPointerSet?.(`/nodes/${target.node}/${target.path}`, sampled);
    wroteAny = true;
  }
  if (wroteAny) {
    runtime.onDirty?.();
  }
  const state = runtime.animationRuntimes.get(animationIndex) ?? { playhead: 0, virtualPlayhead: 0 };
  state.playhead = t;
  state.virtualPlayhead = requested;
  runtime.animationRuntimes.set(animationIndex, state);
}

function prepareGltfData(gltf: any) {
  const cloned = JSON.parse(JSON.stringify(gltf));
  const nodes = cloned.nodes ?? [];
  const parents = new Array(nodes.length).fill(-1);
  nodes.forEach((node: any, index: number) => {
    (node.children ?? []).forEach((child: number) => {
      parents[child] = index;
    });
  });
  nodes.forEach((node: any, index: number) => {
    if (parents[index] >= 0) {
      node.parent = parents[index];
    }
  });
  return cloned;
}

function getConfigValue(node: GraphNode, key: string) {
  const entry = node.configuration?.[key];
  if (!entry) {
    return undefined;
  }
  const parsed = entry.value.map((item) => parseScalar(item));
  return parsed.length === 1 ? parsed[0] : parsed;
}

function getNodeValue(graph: Graph, node: GraphNode, key: string): Value | NodeRef | undefined {
  const entry = node.values?.[key];
  if (!entry) {
    return undefined;
  }
  if ("node" in entry) {
    return { node: entry.node, socket: entry.socket ?? "value" };
  }
  const signature = graph.types[entry.type]?.signature ?? "float";
  return toValue(signature, entry.value);
}

function getOutputCached(runtime: RuntimeGraph, nodeId: number, socket: string) {
  const map = runtime.nodeOutputs.get(nodeId);
  if (!map) {
    return undefined;
  }
  return map.get(socket);
}

function setOutput(runtime: RuntimeGraph, nodeId: number, socket: string, value: Value) {
  let map = runtime.nodeOutputs.get(nodeId);
  if (!map) {
    map = new Map();
    runtime.nodeOutputs.set(nodeId, map);
  }
  map.set(socket, value);
}

function toIndex(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (Array.isArray(value)) {
    return toIndex(value[0]);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function evaluateValue(runtime: RuntimeGraph, nodeId: number, socket: string, stack: Set<string>): Value {
  const key = `${nodeId}:${socket}`;
  if (stack.has(key)) {
    return defaultValue("float");
  }
  stack.add(key);
  const node = runtime.graph.nodes[nodeId];
  const op = runtime.graph.declarations[node.declaration]?.op ?? "";
  const cached = getOutputCached(runtime, nodeId, socket);
  if (cached) {
    if (
      op !== "event/onTick"
      && op !== "event/onPointerMove"
      && op !== "event/onPointerDown"
      && op !== "event/onPointerUp"
      && op !== "event/onSelect"
      && op !== "event/onHover"
      && op !== "event/onHoverIn"
      && op !== "event/onHoverOut"
    ) {
      stack.delete(key);
      return cached;
    }
  }

  let result = defaultValue("float");
  switch (op) {
    case "math/add":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => x + y);
      break;
    case "math/sub":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => x - y);
      break;
    case "math/mul":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => x * y);
      break;
    case "math/div":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => x / y);
      break;
    case "math/rem":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => x % y);
      break;
    case "math/abs":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.abs(x));
      break;
    case "math/ceil":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.ceil(x));
      break;
    case "math/floor":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.floor(x));
      break;
    case "math/trunc":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.trunc(x));
      break;
    case "math/fract":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => x - Math.floor(x));
      break;
    case "math/sign":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.sign(x));
      break;
    case "math/sqrt":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.sqrt(x));
      break;
    case "math/exp":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.exp(x));
      break;
    case "math/neg":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => -x);
      break;
    case "math/log":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.log(x));
      break;
    case "math/log2":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.log2(x));
      break;
    case "math/log10":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.log10(x));
      break;
    case "math/pow":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => Math.pow(x, y));
      break;
    case "math/asin":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.asin(x));
      break;
    case "math/acos":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.acos(x));
      break;
    case "math/atan":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.atan(x));
      break;
    case "math/atan2":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => Math.atan2(x, y));
      break;
    case "math/sin":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.sin(x));
      break;
    case "math/cos":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.cos(x));
      break;
    case "math/tan":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.tan(x));
      break;
    case "math/sinh":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.sinh(x));
      break;
    case "math/cosh":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.cosh(x));
      break;
    case "math/tanh":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.tanh(x));
      break;
    case "math/asinh":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.asinh(x));
      break;
    case "math/acosh":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.acosh(x));
      break;
    case "math/atanh":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.atanh(x));
      break;
    case "math/cbrt":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.cbrt(x));
      break;
    case "math/deg":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => (x * 180) / Math.PI);
      break;
    case "math/rad":
      result = applyUnary(getInput(runtime, nodeId, "a", stack), (x) => (x * Math.PI) / 180);
      break;
    case "math/gt":
      result = boolValue([valueToNumberArray(getInput(runtime, nodeId, "a", stack))[0] > valueToNumberArray(getInput(runtime, nodeId, "b", stack))[0]]);
      break;
    case "math/ge":
      result = boolValue([valueToNumberArray(getInput(runtime, nodeId, "a", stack))[0] >= valueToNumberArray(getInput(runtime, nodeId, "b", stack))[0]]);
      break;
    case "math/lt":
      result = boolValue([valueToNumberArray(getInput(runtime, nodeId, "a", stack))[0] < valueToNumberArray(getInput(runtime, nodeId, "b", stack))[0]]);
      break;
    case "math/le":
      result = boolValue([valueToNumberArray(getInput(runtime, nodeId, "a", stack))[0] <= valueToNumberArray(getInput(runtime, nodeId, "b", stack))[0]]);
      break;
    case "math/eq": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const [left, right] = broadcast(a, b);
      const matches = left.every((item, index) => item === (right[index] ?? right[0]));
      result = boolValue([matches]);
      break;
    }
    case "ref/eq": {
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      const refOf = (v: Value) => (v.type === "ref" ? String(v.data[0] ?? "") : "");
      result = boolValue([refOf(a) === refOf(b)]);
      break;
    }
    case "math/and": {
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      if (a.type === "bool" || b.type === "bool") {
        const left = valueToNumberArray(a).map((item) => Boolean(item));
        const right = valueToNumberArray(b).map((item) => Boolean(item));
        const [l, r] = broadcast(left.map((item) => (item ? 1 : 0)), right.map((item) => (item ? 1 : 0)));
        result = boolValue(l.map((item, index) => Boolean(item) && Boolean(r[index] ?? r[0])));
      } else {
        result = intValue(applyBinary(a, b, (x, y) => (x | 0) & (y | 0), "int").data as number[]);
      }
      break;
    }
    case "math/or": {
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      if (a.type === "bool" || b.type === "bool") {
        const left = valueToNumberArray(a).map((item) => Boolean(item));
        const right = valueToNumberArray(b).map((item) => Boolean(item));
        const [l, r] = broadcast(left.map((item) => (item ? 1 : 0)), right.map((item) => (item ? 1 : 0)));
        result = boolValue(l.map((item, index) => Boolean(item) || Boolean(r[index] ?? r[0])));
      } else {
        result = intValue(applyBinary(a, b, (x, y) => (x | 0) | (y | 0), "int").data as number[]);
      }
      break;
    }
    case "math/xor": {
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      result = intValue(applyBinary(a, b, (x, y) => (x | 0) ^ (y | 0), "int").data as number[]);
      break;
    }
    case "math/not": {
      const a = getInput(runtime, nodeId, "a", stack);
      if (a.type === "bool") {
        const out = (a.data as boolean[]).map((item) => !item);
        result = boolValue(out);
      } else {
        result = intValue(valueToNumberArray(a).map((item) => ~item));
      }
      break;
    }
    case "math/lsl":
      result = intValue(applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => (x | 0) << (y | 0), "int").data as number[]);
      break;
    case "math/asr":
      result = intValue(applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => (x | 0) >> (y | 0), "int").data as number[]);
      break;
    case "math/clz":
      result = intValue(applyUnary(getInput(runtime, nodeId, "a", stack), (x) => Math.clz32(x), "int").data as number[]);
      break;
    case "math/ctz":
      result = intValue(applyUnary(getInput(runtime, nodeId, "a", stack), (x) => (x | 0) === 0 ? 32 : Math.clz32(x & -x) ^ 31, "int").data as number[]);
      break;
    case "math/popcnt":
      result = intValue(applyUnary(getInput(runtime, nodeId, "a", stack), (x) => {
        let v = x >>> 0;
        let count = 0;
        while (v) {
          count += v & 1;
          v >>>= 1;
        }
        return count;
      }, "int").data as number[]);
      break;
    case "math/min":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => Math.min(x, y));
      break;
    case "math/max":
      result = applyBinary(getInput(runtime, nodeId, "a", stack), getInput(runtime, nodeId, "b", stack), (x, y) => Math.max(x, y));
      break;
    case "math/clamp": {
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      const c = getInput(runtime, nodeId, "c", stack);
      const aNum = valueToNumberArray(a);
      const bNum = valueToNumberArray(b);
      const cNum = valueToNumberArray(c);
      const [low, high] = broadcast(bNum, cNum);
      // Per spec: clamp(a, b, c) = max(b, min(c, a)) — the lower bound wins
      // when b > c, so apply min with c first, then max with b.
      const out = aNum.map((item, index) => Math.max(low[index] ?? low[0], Math.min(high[index] ?? high[0], item)));
      result = a.type === "int" ? intValue(out) : floatValue(out);
      break;
    }
    case "math/mix": {
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      const c = getInput(runtime, nodeId, "c", stack);
      const t = valueToNumberArray(c)[0] ?? 0;
      const out = valueToNumberArray(a).map((item, index) => item + (valueToNumberArray(b)[index] - item) * t);
      result = floatValue(out);
      break;
    }
    case "math/select": {
      const condition = getInput(runtime, nodeId, "condition", stack);
      const a = getInput(runtime, nodeId, "a", stack);
      const b = getInput(runtime, nodeId, "b", stack);
      const cond = valueToNumberArray(condition).map((item) => Boolean(item));
      const aNum = valueToNumberArray(a);
      const bNum = valueToNumberArray(b);
      if (cond.length === 1) {
        result = cond[0] ? cloneValue(a) : cloneValue(b);
      } else {
        const out = aNum.map((item, index) => (cond[index] ? item : bNum[index] ?? bNum[0]));
        result = floatValue(out);
      }
      break;
    }
    case "math/length": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const len = Math.hypot(...a);
      result = floatValue([len]);
      break;
    }
    case "math/dot": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const len = Math.min(a.length, b.length);
      let sum = 0;
      for (let i = 0; i < len; i += 1) {
        sum += a[i] * b[i];
      }
      result = floatValue([sum]);
      break;
    }
    case "math/normalize": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      if (!a.every(Number.isFinite)) {
        setOutput(runtime, nodeId, "isValid", boolValue([false]));
        result = floatValue(a.map(() => 0));
        break;
      }
      const len = Math.hypot(...a);
      if (!len) {
        setOutput(runtime, nodeId, "isValid", boolValue([false]));
        result = floatValue(a.map(() => 0));
      } else {
        setOutput(runtime, nodeId, "isValid", boolValue([true]));
        result = floatValue(a.map((item) => item / len));
      }
      break;
    }
    case "math/isNaN": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = boolValue([a.some((item) => Number.isNaN(item))]);
      break;
    }
    case "math/isInf": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = boolValue([a.some((item) => !Number.isFinite(item))]);
      break;
    }
    case "math/saturate": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = floatValue(a.map((item) => Math.min(Math.max(item, 0), 1)));
      break;
    }
    case "math/E":
      result = floatValue([Math.E]);
      break;
    case "math/Pi":
      result = floatValue([Math.PI]);
      break;
    case "math/NaN":
      result = floatValue([NaN]);
      break;
    case "math/Inf":
      result = floatValue([Infinity]);
      break;
    case "math/random": {
      runtime.randomState = (1664525 * runtime.randomState + 1013904223) >>> 0;
      result = floatValue([runtime.randomState / 0xffffffff]);
      break;
    }
    case "math/combine2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = { type: "float2", data: [a[0], b[0]] };
      break;
    }
    case "math/combine3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const c = valueToNumberArray(getInput(runtime, nodeId, "c", stack));
      result = { type: "float3", data: [a[0], b[0], c[0]] };
      break;
    }
    case "math/combine4": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const c = valueToNumberArray(getInput(runtime, nodeId, "c", stack));
      const d = valueToNumberArray(getInput(runtime, nodeId, "d", stack));
      result = { type: "float4", data: [a[0], b[0], c[0], d[0]] };
      break;
    }
    case "math/combine4x4": {
      const values = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p"].map((key) => valueToNumberArray(getInput(runtime, nodeId, key, stack))[0]);
      result = { type: "float4x4", data: values };
      break;
    }
    case "math/extract2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      setOutput(runtime, nodeId, "0", floatValue([a[0]]));
      setOutput(runtime, nodeId, "1", floatValue([a[1]]));
      result = floatValue([a[0]]);
      break;
    }
    case "math/extract3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      setOutput(runtime, nodeId, "0", floatValue([a[0]]));
      setOutput(runtime, nodeId, "1", floatValue([a[1]]));
      setOutput(runtime, nodeId, "2", floatValue([a[2]]));
      result = floatValue([a[0]]);
      break;
    }
    case "math/extract4": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      setOutput(runtime, nodeId, "0", floatValue([a[0]]));
      setOutput(runtime, nodeId, "1", floatValue([a[1]]));
      setOutput(runtime, nodeId, "2", floatValue([a[2]]));
      setOutput(runtime, nodeId, "3", floatValue([a[3]]));
      result = floatValue([a[0]]);
      break;
    }
    case "math/extract4x4": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      for (let i = 0; i < 16; i += 1) {
        setOutput(runtime, nodeId, `${i}`, floatValue([a[i]]));
      }
      result = floatValue([a[0]]);
      break;
    }
    case "math/matMul": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      if (a.length === 4) {
        result = { type: "float2x2", data: mat2Mul(a, b) };
      } else if (a.length === 9) {
        result = { type: "float3x3", data: mat3Mul(a, b) };
      } else {
        result = { type: "float4x4", data: mat4Mul(a, b) };
      }
      break;
    }
    case "math/cross": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = {
        type: "float3",
        data: [
          a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]
        ]
      };
      break;
    }
    case "math/combine2x2": {
      const values = ["a", "b", "c", "d"].map((key) => valueToNumberArray(getInput(runtime, nodeId, key, stack))[0]);
      result = { type: "float2x2", data: values };
      break;
    }
    case "math/combine3x3": {
      const values = ["a", "b", "c", "d", "e", "f", "g", "h", "i"].map((key) => valueToNumberArray(getInput(runtime, nodeId, key, stack))[0]);
      result = { type: "float3x3", data: values };
      break;
    }
    case "math/extract2x2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      for (let i = 0; i < 4; i += 1) {
        setOutput(runtime, nodeId, `${i}`, floatValue([a[i]]));
      }
      result = floatValue([a[0]]);
      break;
    }
    case "math/extract3x3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      for (let i = 0; i < 9; i += 1) {
        setOutput(runtime, nodeId, `${i}`, floatValue([a[i]]));
      }
      result = floatValue([a[0]]);
      break;
    }
    case "math/matMul2x2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = { type: "float2x2", data: mat2Mul(a, b) };
      break;
    }
    case "math/matMul3x3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = { type: "float3x3", data: mat3Mul(a, b) };
      break;
    }
    case "math/transpose2x2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = { type: "float2x2", data: [a[0], a[2], a[1], a[3]] };
      break;
    }
    case "math/transpose3x3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = { type: "float3x3", data: [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]] };
      break;
    }
    case "math/determinant2x2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = floatValue([mat2Determinant(a)]);
      break;
    }
    case "math/determinant3x3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = floatValue([mat3Determinant(a)]);
      break;
    }
    case "math/inverse2x2": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const { value, isValid } = mat2Invert(a);
      setOutput(runtime, nodeId, "isValid", boolValue([isValid]));
      result = { type: "float2x2", data: value };
      break;
    }
    case "math/inverse3x3": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const { value, isValid } = mat3Invert(a);
      setOutput(runtime, nodeId, "isValid", boolValue([isValid]));
      result = { type: "float3x3", data: value };
      break;
    }
    case "math/transpose": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      if (a.length === 4) {
        result = { type: "float2x2", data: [a[0], a[2], a[1], a[3]] };
      } else if (a.length === 9) {
        result = { type: "float3x3", data: [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]] };
      } else {
        result = { type: "float4x4", data: mat4Transpose(a) };
      }
      break;
    }
    case "math/determinant": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      if (a.length === 4) {
        result = floatValue([mat2Determinant(a)]);
      } else if (a.length === 9) {
        result = floatValue([mat3Determinant(a)]);
      } else {
        result = floatValue([mat4Determinant(a)]);
      }
      break;
    }
    case "math/inverse": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const inverted = a.length === 4 ? mat2Invert(a) : a.length === 9 ? mat3Invert(a) : mat4Invert(a);
      setOutput(runtime, nodeId, "isValid", boolValue([inverted.isValid]));
      const type = a.length === 4 ? "float2x2" : a.length === 9 ? "float3x3" : "float4x4";
      result = { type: type as ValueType, data: inverted.value };
      break;
    }
    case "math/round": {
      const a = getInput(runtime, nodeId, "a", stack);
      // Half-way cases round away from zero (unlike Math.round for negatives).
      result = applyUnary(a, (x) => Math.sign(x) * Math.round(Math.abs(x)));
      break;
    }
    case "math/Tau":
      result = floatValue([6.283185307179586]);
      break;
    case "math/smoothStep": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const c = getInput(runtime, nodeId, "c", stack);
      const cNum = valueToNumberArray(c);
      const out = cNum.map((cv, i) => {
        const av = a[i] ?? a[0];
        const bv = b[i] ?? b[0];
        const t = Math.min(1, Math.max(0, (cv - Math.min(av, bv)) / Math.abs(bv - av)));
        return t * t * (3 - 2 * t);
      });
      result = { type: c.type, data: out } as Value;
      break;
    }
    case "math/slerp": {
      const aVal = getInput(runtime, nodeId, "a", stack);
      const a = valueToNumberArray(aVal);
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const t = valueToNumberArray(getInput(runtime, nodeId, "c", stack))[0] ?? 0;
      result = { type: aVal.type, data: vectorSlerp(a, b, t) } as Value;
      break;
    }
    case "math/quatSlerp": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const t = valueToNumberArray(getInput(runtime, nodeId, "c", stack))[0] ?? 0;
      result = { type: "float4", data: quatSlerp(a, b, t) };
      break;
    }
    case "math/quatFromAngles": {
      const order = (getConfigValue(node, "order") as string | undefined) ?? "yxz";
      const angles: Record<string, number> = {
        x: valueToNumberArray(getInput(runtime, nodeId, "x", stack))[0] ?? 0,
        y: valueToNumberArray(getInput(runtime, nodeId, "y", stack))[0] ?? 0,
        z: valueToNumberArray(getInput(runtime, nodeId, "z", stack))[0] ?? 0
      };
      const axes: Record<string, number[]> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
      let q = [0, 0, 0, 1];
      // Intrinsic Tait-Bryan rotations compose left-to-right in the given order.
      for (const axis of order.split("")) {
        const rotation = quatFromAxisAngle(axes[axis] ?? [0, 0, 0], angles[axis] ?? 0);
        q = quatMul(q, rotation);
      }
      result = { type: "float4", data: q };
      break;
    }
    case "math/rgbToOkLCh": {
      const r = valueToNumberArray(getInput(runtime, nodeId, "r", stack))[0] ?? 0;
      const g = valueToNumberArray(getInput(runtime, nodeId, "g", stack))[0] ?? 0;
      const bIn = valueToNumberArray(getInput(runtime, nodeId, "b", stack))[0] ?? 0;
      const Lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bIn);
      const Mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bIn);
      const Sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bIn);
      const L = 0.2104542553 * Lp + 0.7936177850 * Mp - 0.0040720468 * Sp;
      const aLab = 1.9779984951 * Lp - 2.4285922050 * Mp + 0.4505937099 * Sp;
      const bLab = 0.0259040371 * Lp + 0.7827717662 * Mp - 0.8086757660 * Sp;
      const C = Math.sqrt(aLab * aLab + bLab * bLab);
      const H = Math.atan2(bLab, aLab);
      setOutput(runtime, nodeId, "l", floatValue([L]));
      setOutput(runtime, nodeId, "c", floatValue([C]));
      setOutput(runtime, nodeId, "h", floatValue([H]));
      result = socket === "c" ? floatValue([C]) : socket === "h" ? floatValue([H]) : floatValue([L]);
      break;
    }
    case "math/rgbFromOkLCh": {
      const L = valueToNumberArray(getInput(runtime, nodeId, "l", stack))[0] ?? 0;
      const C = valueToNumberArray(getInput(runtime, nodeId, "c", stack))[0] ?? 0;
      const H = valueToNumberArray(getInput(runtime, nodeId, "h", stack))[0] ?? 0;
      const aLab = C * Math.cos(H);
      const bLab = C * Math.sin(H);
      const Lp = (L + 0.3963377774 * aLab + 0.2158037573 * bLab) ** 3;
      const Mp = (L - 0.1055613458 * aLab - 0.0638541728 * bLab) ** 3;
      const Sp = (L - 0.0894841775 * aLab - 1.2914855480 * bLab) ** 3;
      const r = 4.0767416621 * Lp - 3.3077115913 * Mp + 0.2309699292 * Sp;
      const g = -1.2684380046 * Lp + 2.6097574011 * Mp - 0.3413193965 * Sp;
      const b = -0.0041960863 * Lp - 0.7034186147 * Mp + 1.7076147010 * Sp;
      setOutput(runtime, nodeId, "r", floatValue([r]));
      setOutput(runtime, nodeId, "g", floatValue([g]));
      setOutput(runtime, nodeId, "b", floatValue([b]));
      result = socket === "g" ? floatValue([g]) : socket === "b" ? floatValue([b]) : floatValue([r]);
      break;
    }
    case "math/transform": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      const matrix = a.length === 16 ? a : b;
      const vector = a.length === 16 ? b : a;
      const transformed = transformVec3(matrix, vector);
      result = vector.length === 4 ? { type: "float4", data: transformed } : { type: "float3", data: transformed.slice(0, 3) };
      break;
    }
    case "math/matCompose": {
      const t = valueToNumberArray(getInput(runtime, nodeId, "translation", stack));
      const r = valueToNumberArray(getInput(runtime, nodeId, "rotation", stack));
      const s = valueToNumberArray(getInput(runtime, nodeId, "scale", stack));
      result = { type: "float4x4", data: mat4Compose(t, r, s) };
      break;
    }
    case "math/matDecompose": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const { translation, rotation, scale, isValid } = mat4Decompose(a);
      setOutput(runtime, nodeId, "translation", { type: "float3", data: translation });
      setOutput(runtime, nodeId, "rotation", { type: "float4", data: rotation });
      setOutput(runtime, nodeId, "scale", { type: "float3", data: scale });
      setOutput(runtime, nodeId, "isValid", boolValue([isValid]));
      result = { type: "float3", data: translation };
      break;
    }
    case "math/quatMul": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = { type: "float4", data: quatMul(a, b) };
      break;
    }
    case "math/quatConjugate": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = { type: "float4", data: [-a[0], -a[1], -a[2], a[3]] };
      break;
    }
    case "math/quatFromAxisAngle": {
      const axis = valueToNumberArray(getInput(runtime, nodeId, "axis", stack));
      const angle = valueToNumberArray(getInput(runtime, nodeId, "angle", stack))[0] ?? 0;
      result = { type: "float4", data: quatFromAxisAngle(axis, angle) };
      break;
    }
    case "math/quatToAxisAngle": {
      const q = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const { axis, angle } = quatToAxisAngle(q);
      setOutput(runtime, nodeId, "axis", { type: "float3", data: axis });
      setOutput(runtime, nodeId, "angle", floatValue([angle]));
      result = { type: "float3", data: axis };
      break;
    }
    case "math/quatFromDirections": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = { type: "float4", data: quatFromDirections(a, b) };
      break;
    }
    case "math/quatFromUpForward": {
      const up = valueToNumberArray(getInput(runtime, nodeId, "up", stack));
      const forward = valueToNumberArray(getInput(runtime, nodeId, "forward", stack));
      result = { type: "float4", data: quatFromUpForward(up, forward) };
      break;
    }
    case "math/quatAngleBetween": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const b = valueToNumberArray(getInput(runtime, nodeId, "b", stack));
      result = floatValue([quatAngleBetween(a, b)]);
      break;
    }
    case "math/rotate2D": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const angle = valueToNumberArray(getInput(runtime, nodeId, "angle", stack))[0] ?? 0;
      result = { type: "float2", data: rotate2D(a, angle) };
      break;
    }
    case "math/rotate3D": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const r = valueToNumberArray(getInput(runtime, nodeId, "rotation", stack));
      // Spec formula: v' = v + 2*cross(q.xyz, cross(q.xyz, v) + q.w * v),
      // applied without normalizing the quaternion.
      const qx = r[0] ?? 0, qy = r[1] ?? 0, qz = r[2] ?? 0, qw = r[3] ?? 1;
      const cx = qy * (a[2] ?? 0) - qz * (a[1] ?? 0) + qw * (a[0] ?? 0);
      const cy = qz * (a[0] ?? 0) - qx * (a[2] ?? 0) + qw * (a[1] ?? 0);
      const cz = qx * (a[1] ?? 0) - qy * (a[0] ?? 0) + qw * (a[2] ?? 0);
      result = {
        type: "float3",
        data: [
          (a[0] ?? 0) + 2 * (qy * cz - qz * cy),
          (a[1] ?? 0) + 2 * (qz * cx - qx * cz),
          (a[2] ?? 0) + 2 * (qx * cy - qy * cx)
        ]
      };
      break;
    }
    case "math/switch": {
      const selection = valueToNumberArray(getInput(runtime, nodeId, "selection", stack))[0] ?? 0;
      const valueKey = `${selection}`;
      const value = getInputOptional(runtime, nodeId, valueKey, stack) ?? getInput(runtime, nodeId, "default", stack);
      result = cloneValue(value);
      break;
    }
    case "pointer/get": {
      const { value, isValid } = handlePointerGet(runtime, nodeId, stack);
      setOutput(runtime, nodeId, "isValid", boolValue([isValid]));
      result = value;
      break;
    }
    case "type/intToFloat": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = floatValue([a[0] ?? 0]);
      break;
    }
    case "type/boolToInt": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = intValue([a[0] ? 1 : 0]);
      break;
    }
    case "type/boolToFloat": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = floatValue([a[0] ? 1 : 0]);
      break;
    }
    case "type/intToBool": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = boolValue([(a[0] ?? 0) !== 0]);
      break;
    }
    case "type/floatToBool": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      const x = a[0] ?? 0;
      result = boolValue([!Number.isNaN(x) && x !== 0]);
      break;
    }
    case "type/floatToInt": {
      const a = valueToNumberArray(getInput(runtime, nodeId, "a", stack));
      result = intValue([a[0] ?? 0]);
      break;
    }
    case "variable/get": {
      const variableIndex = getConfigValue(node, "variable");
      const index = toIndex(variableIndex);
      result = cloneValue(runtime.variables[index] ?? defaultValue("float"));
      break;
    }
    case "event/onStart": {
      if (socket === "event") {
        result = { type: "ref", data: ["event:onStart"] };
      }
      break;
    }
    case "event/onTick": {
      if (socket === "event") {
        result = { type: "ref", data: ["event:onTick"] };
      } else if (socket === "timeSinceLastTick") {
        result = floatValue([runtime.lastTickDelta]);
      } else if (socket === "timeSinceStart") {
        result = floatValue([runtime.tickCount === 0 ? 0 : runtime.time]);
      } else {
        result = floatValue([runtime.time]);
      }
      break;
    }
    case "event/onPointerMove":
    case "event/onPointerDown":
    case "event/onPointerUp": {
      if (socket === "x") {
        result = floatValue([runtime.pointerX]);
      } else if (socket === "y") {
        result = floatValue([runtime.pointerY]);
      } else if (socket === "position") {
        result = { type: "float2", data: [runtime.pointerX, runtime.pointerY] };
      }
      break;
    }
    case "event/onSelect": {
      // KHR_node_selectability sockets: selectedNode is a node reference.
      if (socket === "selectedNode") {
        const index = runtime.selectedNodeIndex;
        result = { type: "ref" as ValueType, data: [index >= 0 ? `/nodes/${index}` : ""] };
      } else if (socket === "selectedNodeIndex") {
        result = intValue([runtime.selectedNodeIndex]);
      } else if (socket === "selectionPoint") {
        result = { type: "float3" as ValueType, data: [...runtime.selectionPoint] };
      } else if (socket === "selectionRayOrigin") {
        result = { type: "float3" as ValueType, data: [...runtime.selectionRayOrigin] };
      } else if (socket === "controllerIndex") {
        result = intValue([0]);
      } else if (socket === "event") {
        result = { type: "ref" as ValueType, data: ["event:onSelect"] };
      }
      break;
    }
    case "event/onHoverIn":
    case "event/onHoverOut": {
      // KHR_node_hoverability sockets: hoveredNode is a node reference.
      if (socket === "hoveredNode") {
        const index = runtime.hoveredNodeIndex;
        result = { type: "ref" as ValueType, data: [index >= 0 ? `/nodes/${index}` : ""] };
      } else if (socket === "controllerIndex") {
        result = intValue([0]);
      } else if (socket === "event") {
        result = { type: "ref" as ValueType, data: [`event:${op === "event/onHoverIn" ? "onHoverIn" : "onHoverOut"}`] };
      }
      break;
    }
    case "event/onHover": {
      if (socket === "hoveredNodeIndex") {
        result = intValue([runtime.hoveredNodeIndex]);
      } else if (socket === "hoverPoint") {
        result = { type: "float3" as ValueType, data: [...runtime.hoverPoint] };
      }
      break;
    }
    case "event/send":
    case "event/receive": {
      if (socket === "event") {
        const eventIndex = getConfigValue(node, "event") as number | undefined;
        result = { type: "ref", data: [eventIndex === undefined ? "" : `event:custom:${eventIndex}`] };
        break;
      }
      const payload = getEventPayload(runtime, node);
      if (socket === "boolParameter") {
        result = boolValue([payload.boolParameter ?? false]);
      } else if (socket === "intParameter") {
        result = intValue([payload.intParameter ?? 0]);
      } else if (socket === "floatParameter") {
        result = floatValue([payload.floatParameter ?? 0]);
      } else if (socket === "expectedDuration") {
        result = floatValue([payload.expectedDuration ?? 0]);
      }
      break;
    }
    case "flow/for": {
      const state = runtime.nodeStates.get(nodeId);
      const initialIndex = getConfigValue(node, "initialIndex");
      const fallback = typeof initialIndex === "number" ? Math.trunc(initialIndex) : 0;
      const index = state?.forIndex ?? fallback;
      result = intValue([index]);
      break;
    }
    case "flow/doN": {
      const state = runtime.nodeStates.get(nodeId);
      const count = state?.doNCount ?? 0;
      result = intValue([count]);
      break;
    }
    case "flow/multiGate": {
      const state = runtime.nodeStates.get(nodeId);
      const lastIndex = state?.multiGateLastIndex ?? -1;
      result = intValue([lastIndex]);
      break;
    }
    case "flow/setDelay": {
      const state = runtime.nodeStates.get(nodeId);
      if (socket === "lastDelay") {
        result = { type: "ref", data: [state?.lastDelayRef ?? ""] };
      } else {
        result = intValue([state?.lastDelayIndex ?? -1]);
      }
      break;
    }
    case "flow/throttle": {
      const state = runtime.nodeStates.get(nodeId);
      const remaining = state?.throttleRemaining ?? Number.NaN;
      result = floatValue([remaining]);
      break;
    }
    case "flow/waitAll": {
      const state = runtime.nodeStates.get(nodeId);
      const inputFlows = Math.trunc((getConfigValue(node, "inputFlows") as number) ?? 0);
      const remaining = state?.remainingInputs ?? inputFlows;
      result = intValue([remaining]);
      break;
    }
    default:
      break;
  }

  const existing = getOutputCached(runtime, nodeId, socket);
  if (existing) {
    result = existing;
  }
  setOutput(runtime, nodeId, socket, result);
  stack.delete(key);
  return result;
}

function getInput(runtime: RuntimeGraph, nodeId: number, socket: string, stack: Set<string>): Value {
  const node = runtime.graph.nodes[nodeId];
  const entry = getNodeValue(runtime.graph, node, socket);
  if (!entry) {
    return defaultValue("float");
  }
  if ("node" in entry) {
    return evaluateValue(runtime, entry.node, entry.socket, stack);
  }
  return entry;
}

function getInputOptional(runtime: RuntimeGraph, nodeId: number, socket: string, stack: Set<string>): Value | null {
  const node = runtime.graph.nodes[nodeId];
  const entry = getNodeValue(runtime.graph, node, socket);
  if (!entry) {
    return null;
  }
  if ("node" in entry) {
    return evaluateValue(runtime, entry.node, entry.socket, stack);
  }
  return entry;
}

type PointerParam = { name: string; kind: "int" | "ref" };

// Square brackets denote integer template parameters, curly brackets denote
// reference template parameters (KHR_interactivity JSON Pointer Templates).
function extractPointerParams(pointer: string): PointerParam[] {
  const params: PointerParam[] = [];
  for (const segment of pointer.split("/")) {
    if (segment.startsWith("[") && segment.endsWith("]") && segment.length > 2) {
      params.push({ name: segment.slice(1, -1), kind: "int" });
    } else if (segment.startsWith("{") && segment.endsWith("}") && segment.length > 2) {
      params.push({ name: segment.slice(1, -1), kind: "ref" });
    }
  }
  return params;
}

// Substitutes evaluated template parameters into the pointer template.
// Integer parameters become decimal indices. Reference parameters are our
// "/collection/index" path strings: the segment is replaced with the ref's
// trailing index, but only when the template's prefix matches the ref's
// collection path — otherwise the pointer is unresolvable and null is returned.
function buildEffectivePointer(
  pointer: string,
  inputs: Record<string, number | string>
): string | null {
  const segments = pointer.split("/");
  const out: string[] = [];
  for (const segment of segments) {
    if (segment.startsWith("[") && segment.endsWith("]") && segment.length > 2) {
      out.push(String(inputs[segment.slice(1, -1)] ?? 0));
      continue;
    }
    if (segment.startsWith("{") && segment.endsWith("}") && segment.length > 2) {
      const ref = String(inputs[segment.slice(1, -1)] ?? "");
      if (!ref) {
        return null;
      }
      if (ref.startsWith("delay:") || ref.startsWith("event:")) {
        out.push(ref);
        continue;
      }
      const slash = ref.lastIndexOf("/");
      const prefix = ref.slice(0, slash);
      const index = ref.slice(slash + 1);
      if (out.join("/") !== prefix || !/^\d+$/.test(index)) {
        return null;
      }
      out.push(index);
      continue;
    }
    out.push(segment);
  }
  return out.join("/");
}

function decodePointerToken(token: string) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function computeNodeLocalMatrix(node: any): number[] {
  if (Array.isArray(node?.matrix) && node.matrix.length === 16) {
    return node.matrix.map((v: any) => Number(v));
  }
  const t = Array.isArray(node?.translation) ? node.translation : [0, 0, 0];
  const r = Array.isArray(node?.rotation) ? node.rotation : [0, 0, 0, 1];
  const s = Array.isArray(node?.scale) ? node.scale : [1, 1, 1];
  return mat4Compose(t, r, s);
}

function computeNodeGlobalMatrix(gltf: any, nodeIndex: number, cache: Map<number, number[]>): number[] {
  if (cache.has(nodeIndex)) {
    return cache.get(nodeIndex) ?? mat4Identity();
  }
  const node = gltf.nodes?.[nodeIndex];
  const local = computeNodeLocalMatrix(node);
  const parentIndex = typeof node?.parent === "number" ? node.parent : -1;
  if (parentIndex >= 0) {
    const parentGlobal = computeNodeGlobalMatrix(gltf, parentIndex, cache);
    const global = mat4Mul(parentGlobal, local);
    cache.set(nodeIndex, global);
    return global;
  }
  cache.set(nodeIndex, local);
  return local;
}

function getMeshTargetCount(mesh: any): number {
  const primitives = mesh?.primitives;
  if (!Array.isArray(primitives) || primitives.length === 0) {
    return 0;
  }
  const targets = primitives[0]?.targets;
  return Array.isArray(targets) ? targets.length : 0;
}

function findMeshNodeIndex(data: any, startIndex: number): number | null {
  const nodes = data.nodes;
  if (!Array.isArray(nodes) || startIndex < 0 || startIndex >= nodes.length) {
    return null;
  }
  const visited = new Set<number>();
  const queue: number[] = [startIndex];
  while (queue.length > 0) {
    const index = queue.shift();
    if (index === undefined || visited.has(index)) {
      continue;
    }
    visited.add(index);
    const node = nodes[index];
    if (node && typeof node.mesh === "number") {
      return index;
    }
    const children = Array.isArray(node?.children) ? node.children : [];
    for (const child of children) {
      if (Number.isFinite(child)) {
        queue.push(child);
      }
    }
  }
  return null;
}

function resolvePointerValue(data: any, pointer: string): { value: any; isValid: boolean } {
  const tokens = pointer.split("/").filter(Boolean).map(decodePointerToken);
  let current: any = data;
  let nodeIndex: number | null = null;
  let meshIndex: number | null = null;
  const resolveWeightsLength = (nodeIdx: number | null, meshIdx: number | null) => {
    if (nodeIdx !== null) {
      const meshNodeIndex = findMeshNodeIndex(data, nodeIdx);
      const meshNode = meshNodeIndex !== null ? data.nodes?.[meshNodeIndex] : null;
      const mesh = meshNode && typeof meshNode.mesh === "number" ? data.meshes?.[meshNode.mesh] : null;
      if (!mesh) {
        return { value: 0, isValid: false };
      }
      const targetCount = getMeshTargetCount(mesh);
      if (Array.isArray(meshNode?.weights)) {
        return { value: meshNode.weights.length, isValid: true };
      }
      if (Array.isArray(mesh.weights)) {
        return { value: mesh.weights.length, isValid: true };
      }
      return { value: targetCount, isValid: true };
    }
    if (meshIdx !== null) {
      const mesh = data.meshes?.[meshIdx];
      if (!mesh) {
        return { value: 0, isValid: false };
      }
      const targetCount = getMeshTargetCount(mesh);
      if (Array.isArray(mesh.weights)) {
        return { value: mesh.weights.length, isValid: true };
      }
      return { value: targetCount, isValid: true };
    }
    return { value: 0, isValid: false };
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (current === undefined || current === null) {
      return { value: undefined, isValid: false };
    }
    if (token.endsWith(".length")) {
      const base = token.slice(0, -".length".length);
      if (base === "weights") {
        return resolveWeightsLength(nodeIndex, meshIndex);
      }
      if (!(base in current)) {
        return { value: 0, isValid: false };
      }
      current = current[base];
      return { value: Array.isArray(current) ? current.length : 0, isValid: Array.isArray(current) };
    }
    if ((token === "matrix" || token === "globalMatrix") && nodeIndex !== null) {
      const cache = new Map<number, number[]>();
      const matrix = token === "matrix"
        ? computeNodeLocalMatrix(data.nodes?.[nodeIndex])
        : computeNodeGlobalMatrix(data, nodeIndex, cache);
      return { value: matrix, isValid: true };
    }
    if (token === "[]") {
      return { value: undefined, isValid: false };
    }
    // glTF Object Model: TRS properties have well-defined defaults when the
    // node omits them.
    if (nodeIndex !== null && current === data.nodes?.[nodeIndex] && current[token] === undefined) {
      if (token === "translation") {
        return { value: [0, 0, 0], isValid: true };
      }
      if (token === "rotation") {
        return { value: [0, 0, 0, 1], isValid: true };
      }
      if (token === "scale") {
        return { value: [1, 1, 1], isValid: true };
      }
    }
    if (token === "weights") {
      const nextToken = tokens[i + 1];
      const hasIndex = nextToken !== undefined && !Number.isNaN(Number(nextToken));
      if (!hasIndex) {
        return { value: undefined, isValid: false };
      }
      if (nodeIndex !== null) {
        const meshNodeIndex = findMeshNodeIndex(data, nodeIndex);
        const meshNode = meshNodeIndex !== null ? data.nodes?.[meshNodeIndex] : null;
        const mesh = meshNode && typeof meshNode.mesh === "number" ? data.meshes?.[meshNode.mesh] : null;
        if (!mesh) {
          return { value: undefined, isValid: false };
        }
        const targetCount = getMeshTargetCount(mesh);
        if (Array.isArray(meshNode?.weights)) {
          current = meshNode.weights;
          continue;
        }
        if (Array.isArray(mesh.weights)) {
          current = mesh.weights;
          continue;
        }
        if (targetCount > 0) {
          current = new Array(targetCount).fill(0.5);
          continue;
        }
        return { value: undefined, isValid: false };
      }
      if (meshIndex !== null) {
        const mesh = data.meshes?.[meshIndex];
        if (!mesh) {
          return { value: undefined, isValid: false };
        }
        const targetCount = getMeshTargetCount(mesh);
        if (Array.isArray(mesh.weights)) {
          current = mesh.weights;
          continue;
        }
        if (targetCount > 0) {
          current = new Array(targetCount).fill(0.5);
          continue;
        }
        current = [0];
        continue;
      }
    }
    const index = Number(token);
    if (!Number.isNaN(index) && Array.isArray(current)) {
      if (index < 0 || index >= current.length) {
        return { value: undefined, isValid: false };
      }
      current = current[index];
      if (current && current === data.nodes?.[index]) {
        nodeIndex = index;
      }
      if (current && current === data.meshes?.[index]) {
        meshIndex = index;
      }
    } else {
      current = current[token];
      if (token === "nodes" && Array.isArray(current)) {
        // Next numeric token refers to a node index.
      }
      if (token === "meshes" && Array.isArray(current)) {
        // Next numeric token refers to a mesh index.
      }
    }
  }
  return { value: current, isValid: current !== undefined };
}

function setPointerValue(data: any, pointer: string, value: any): boolean {
  const tokens = pointer.split("/").filter(Boolean).map(decodePointerToken);
  let current: any = data;
  let parent: any = null;
  let parentKey: string | number | null = null;
  let nodeIndex: number | null = null;
  let meshIndex: number | null = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const isLast = i === tokens.length - 1;
    if (token.endsWith(".length")) {
      return false;
    }
    if (token === "globalMatrix") {
      return false;
    }
    if (token === "matrix" && isLast && nodeIndex !== null) {
      data.nodes[nodeIndex].matrix = value;
      return true;
    }
    const nextToken = tokens[i + 1];
    const nextIsIndex = nextToken !== undefined && !Number.isNaN(Number(nextToken));
    if (token === "weights") {
      if (!nextIsIndex) {
        return false;
      }
      if (nodeIndex !== null) {
        const meshNodeIndex = findMeshNodeIndex(data, nodeIndex);
        const meshNode = meshNodeIndex !== null ? data.nodes?.[meshNodeIndex] : null;
        const mesh = meshNode && typeof meshNode.mesh === "number" ? data.meshes?.[meshNode.mesh] : null;
        if (!mesh) {
          return false;
        }
        const targetCount = getMeshTargetCount(mesh);
        if (targetCount === 0) {
          return false;
        }
        if (!Array.isArray(meshNode.weights)) {
          if (Array.isArray(mesh.weights)) {
            meshNode.weights = [...mesh.weights];
          } else {
            meshNode.weights = new Array(targetCount).fill(0.5);
          }
        }
        if (Array.isArray(meshNode.weights)) {
          const nextWeights = new Array(targetCount);
          for (let j = 0; j < targetCount; j += 1) {
            const item = meshNode.weights[j];
            const num = Number(item);
            nextWeights[j] = Number.isFinite(num) ? num : 0;
          }
          meshNode.weights = nextWeights;
        }
        current = meshNode.weights;
        continue;
      }
      if (meshIndex !== null) {
        const mesh = data.meshes?.[meshIndex];
        if (!mesh) {
          return false;
        }
        const targetCount = getMeshTargetCount(mesh);
        if (targetCount === 0) {
          return false;
        }
        if (!Array.isArray(mesh.weights)) {
          mesh.weights = new Array(targetCount).fill(0.5);
        }
        if (Array.isArray(mesh.weights)) {
          const nextWeights = new Array(targetCount);
          for (let j = 0; j < targetCount; j += 1) {
            const item = mesh.weights[j];
            const num = Number(item);
            nextWeights[j] = Number.isFinite(num) ? num : 0;
          }
          mesh.weights = nextWeights;
        }
        current = mesh.weights;
        continue;
      }
      return false;
    }
    const index = Number(token);
    if (!Number.isNaN(index)) {
      if (!Array.isArray(current)) {
        const next: any[] = [];
        if (parent !== null && parentKey !== null) {
          parent[parentKey] = next;
        }
        current = next;
      }
      if (isLast) {
        current[index] = value;
      } else {
        current[index] = current[index] ?? {};
        parent = current;
        parentKey = index;
        current = current[index];
        if (current === data.nodes?.[index]) {
          nodeIndex = index;
        }
        if (current === data.meshes?.[index]) {
          meshIndex = index;
        }
      }
    } else {
      if (isLast) {
        current[token] = value;
      } else {
        current[token] = current[token] ?? (nextIsIndex ? [] : {});
        parent = current;
        parentKey = token;
        current = current[token];
        if (token === "nodes" && Array.isArray(current)) {
          // Next numeric token refers to a node index.
        }
        if (token === "meshes" && Array.isArray(current)) {
          // Next numeric token refers to a mesh index.
        }
      }
    }
  }
  return true;
}

function pointerValueMatchesType(value: any, signature: ValueType): boolean {
  if (signature === "bool") {
    return typeof value === "boolean";
  }
  if (signature === "int") {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
  }
  if (signature === "float") {
    return typeof value === "number" && Number.isFinite(value);
  }
  if (signature === "float2") {
    return Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === "number" && Number.isFinite(v));
  }
  if (signature === "float3") {
    return Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === "number" && Number.isFinite(v));
  }
  if (signature === "float4") {
    return Array.isArray(value) && value.length === 4 && value.every((v) => typeof v === "number" && Number.isFinite(v));
  }
  if (signature === "float4x4") {
    return Array.isArray(value) && value.length === 16 && value.every((v) => typeof v === "number" && Number.isFinite(v));
  }
  return false;
}

// Extensions this runtime implements; used by the asset/extensions/{name}/enabled
// capability pointer (KHR_interactivity §4.2.1).
const SUPPORTED_EXTENSIONS = new Set([
  "KHR_interactivity",
  "KHR_node_visibility",
  "KHR_node_selectability",
  "KHR_node_hoverability",
  "KHR_animation_pointer",
  "KHR_lights_punctual"
]);

// Runtime limits reported through /extensions/KHR_interactivity/limits/* (§4.2.2).
const RUNTIME_LIMITS: Record<string, number> = {
  maxActiveAnimations: 32,
  maxActiveDelays: 64,
  maxActivePropertyInterpolations: 64,
  maxActiveVariableInterpolations: 64
};

function resolveVirtualPointer(runtime: RuntimeGraph, resolved: string, signature: ValueType): { value: Value; isValid: boolean } | null {
  // Host-fed virtual pointers: active camera pose.
  if (resolved === "/extensions/KHR_interactivity/activeCamera/position") {
    if (signature !== "float3") {
      return { value: defaultValue(signature), isValid: false };
    }
    const value = runtime.activeCameraPosition ?? [NaN, NaN, NaN];
    return { value: { type: "float3" as ValueType, data: [...value] }, isValid: true };
  }
  if (resolved === "/extensions/KHR_interactivity/activeCamera/rotation") {
    if (signature !== "float4") {
      return { value: defaultValue(signature), isValid: false };
    }
    const value = runtime.activeCameraRotation ?? [NaN, NaN, NaN, NaN];
    return { value: { type: "float4" as ValueType, data: [...value] }, isValid: true };
  }
  if (resolved === "/extensions/KHR_interactivity/asset/majorVersion"
    || resolved === "/extensions/KHR_interactivity/asset/minorVersion") {
    if (signature !== "int") {
      return { value: defaultValue(signature), isValid: false };
    }
    return { value: intValue([resolved.endsWith("majorVersion") ? 2 : 0]), isValid: true };
  }
  const extMatch = resolved.match(/^\/extensions\/KHR_interactivity\/asset\/extensions\/([^/]+)\/enabled$/);
  if (extMatch) {
    if (signature !== "bool") {
      return { value: defaultValue(signature), isValid: false };
    }
    const used: string[] = Array.isArray(runtime.gltf?.extensionsUsed) ? runtime.gltf.extensionsUsed : [];
    const name = extMatch[1];
    const enabled = SUPPORTED_EXTENSIONS.has(name) && (name === "KHR_interactivity" || used.includes(name));
    return { value: boolValue([enabled]), isValid: true };
  }
  const limitMatch = resolved.match(/^\/extensions\/KHR_interactivity\/limits\/([^/]+)$/);
  if (limitMatch) {
    const limit = RUNTIME_LIMITS[limitMatch[1]];
    if (limit === undefined || signature !== "int") {
      return { value: defaultValue(signature), isValid: false };
    }
    return { value: intValue([limit]), isValid: true };
  }
  const animMatch = resolved.match(/^\/animations\/(\d+)\/extensions\/KHR_interactivity\/(isPlaying|minTime|maxTime|playhead|virtualPlayhead)$/);
  if (animMatch) {
    const index = Number(animMatch[1]);
    const prop = animMatch[2];
    const animation = runtime.gltf?.animations?.[index];
    if (!animation) {
      return { value: defaultValue(signature), isValid: false };
    }
    if (prop === "isPlaying") {
      if (signature !== "bool") {
        return { value: defaultValue(signature), isValid: false };
      }
      const playing = runtime.animationStates.some((state) => state.animationIndex === index);
      return { value: boolValue([playing]), isValid: true };
    }
    if (signature !== "float") {
      return { value: defaultValue(signature), isValid: false };
    }
    if (prop === "minTime" || prop === "maxTime") {
      const range = getAnimationTimeRange(runtime, index);
      return { value: floatValue([prop === "minTime" ? range.min : range.max]), isValid: true };
    }
    const state = runtime.animationRuntimes.get(index) ?? { playhead: 0, virtualPlayhead: 0 };
    return { value: floatValue([prop === "playhead" ? state.playhead : state.virtualPlayhead]), isValid: true };
  }
  return null;
}

// Properties whose value is an index into a sibling top-level collection; a
// ref-typed pointer/get on such a property yields a reference to that object.
const REF_COLLECTIONS: Record<string, string> = {
  mesh: "meshes",
  camera: "cameras",
  skin: "skins",
  material: "materials",
  scene: "scenes",
  node: "nodes",
  children: "nodes",
  parent: "nodes",
  nodes: "nodes",
  joints: "nodes",
  skeleton: "nodes",
  animations: "animations",
  meshes: "meshes",
  cameras: "cameras",
  skins: "skins",
  materials: "materials",
  scenes: "scenes",
  lights: "lights"
};

function resolvePointerRef(data: any, resolved: string): { value: Value; isValid: boolean } {
  const tokens = resolved.split("/").filter(Boolean).map(decodePointerToken);
  if (tokens.length === 0) {
    return { value: defaultValue("ref"), isValid: false };
  }
  const last = tokens[tokens.length - 1];
  const isIndex = /^\d+$/.test(last);
  const propToken = isIndex ? tokens[tokens.length - 2] : last;
  const collection = REF_COLLECTIONS[propToken];
  if (!collection) {
    return { value: defaultValue("ref"), isValid: false };
  }
  const parentTokens = tokens.slice(0, isIndex ? -2 : -1);
  let current: any = data;
  for (const token of parentTokens) {
    if (current === undefined || current === null) {
      return { value: defaultValue("ref"), isValid: false };
    }
    current = current[token];
  }
  if (current === undefined || current === null) {
    return { value: defaultValue("ref"), isValid: false };
  }
  const raw = isIndex ? current[propToken]?.[Number(last)] : current[propToken];
  // A pointer addressing a collection element directly (e.g. /animations/0)
  // is a reference to that element itself.
  if (isIndex && raw !== undefined && raw !== null && typeof raw === "object") {
    return { value: { type: "ref", data: [`/${tokens.join("/")}`] }, isValid: true };
  }
  if (typeof raw !== "number") {
    return { value: { type: "ref", data: [""] }, isValid: true };
  }
  return { value: { type: "ref", data: [`/${collection}/${raw}`] }, isValid: true };
}

function parseAnimationRef(runtime: RuntimeGraph, input: Value): number | null {
  if (input.type !== "ref") {
    return null;
  }
  const match = String(input.data[0] ?? "").match(/^\/animations\/(\d+)$/);
  if (!match) {
    return null;
  }
  const index = Number(match[1]);
  return runtime.gltf?.animations?.[index] ? index : null;
}

function handlePointerInterpolate(runtime: RuntimeGraph, nodeId: number, stack: Set<string>): boolean {
  const node = runtime.graph.nodes[nodeId];
  const pointer = getConfigValue(node, "pointer") as string | undefined;
  if (!pointer) {
    return false;
  }
  const typeIndex = getConfigValue(node, "type") as number | undefined;
  const signature = runtime.graph.types[typeIndex ?? 2]?.signature ?? "float";
  const inputs: Record<string, number | string> = {};
  for (const param of extractPointerParams(pointer)) {
    const input = getInput(runtime, nodeId, param.name, stack);
    if (param.kind === "ref") {
      const ref = input.type === "ref" ? String(input.data[0] ?? "") : "";
      if (!ref) {
        return false;
      }
      inputs[param.name] = ref;
      continue;
    }
    const raw = valueToNumberArray(input)[0] ?? 0;
    if (!Number.isFinite(raw) || raw < 0) {
      return false;
    }
    inputs[param.name] = Math.trunc(raw);
  }
  const resolved = buildEffectivePointer(pointer, inputs);
  if (resolved === null) {
    return false;
  }
  const { value: current, isValid } = resolvePointerValue(runtime.gltf, resolved);
  if (!isValid || !pointerValueMatchesType(current, signature)) {
    return false;
  }
  const duration = valueToNumberArray(getInput(runtime, nodeId, "duration", stack))[0] ?? 0;
  if (Number.isNaN(duration) || !Number.isFinite(duration) || duration < 0) {
    return false;
  }
  const p1 = valueToNumberArray(getInput(runtime, nodeId, "p1", stack));
  const p2 = valueToNumberArray(getInput(runtime, nodeId, "p2", stack));
  if (
    !p1.every(Number.isFinite) || !p2.every(Number.isFinite)
    || p1[0] < 0 || p1[0] > 1 || p2[0] < 0 || p2[0] > 1
  ) {
    return false;
  }
  const target = valueToNumberArray(getInput(runtime, nodeId, "value", stack));
  const startValue = Array.isArray(current) ? current.map(Number) : [Number(current)];
  runtime.pointerInterpolations = runtime.pointerInterpolations.filter((item) => item.pointer !== resolved);
  runtime.pointerInterpolations.push({
    pointer: resolved,
    startTime: runtime.time,
    duration,
    startValue,
    endValue: target,
    p1: [p1[0] ?? 0, p1[1] ?? 0],
    p2: [p2[0] ?? 0, p2[1] ?? 0],
    isQuaternion: /\/rotation$/.test(resolved),
    doneFlow: node.flows?.done
  });
  return true;
}

function handlePointerGet(runtime: RuntimeGraph, nodeId: number, stack: Set<string>) {
  const node = runtime.graph.nodes[nodeId];
  const pointer = getConfigValue(node, "pointer") as string | undefined;
  if (!pointer) {
    return { value: defaultValue("float"), isValid: false };
  }
  const typeIndex = getConfigValue(node, "type") as number | undefined;
  const signature = runtime.graph.types[typeIndex ?? 2]?.signature ?? "float";
  const params = extractPointerParams(pointer);
  const inputs: Record<string, number | string> = {};
  for (const param of params) {
    const input = getInput(runtime, nodeId, param.name, stack);
    if (param.kind === "ref") {
      const ref = input.type === "ref" ? String(input.data[0] ?? "") : "";
      if (!ref) {
        return { value: defaultValue(signature), isValid: false };
      }
      inputs[param.name] = ref;
      continue;
    }
    const raw = valueToNumberArray(input)[0] ?? 0;
    const value = Math.trunc(raw);
    if (!Number.isFinite(raw) || value < 0) {
      return { value: defaultValue(signature), isValid: false };
    }
    inputs[param.name] = value;
  }
  // Runtime reference validation pointers resolve against runtime state,
  // not the glTF asset (KHR_interactivity Delay/Event References).
  if (/^\/extensions\/KHR_interactivity\/delays\/\{[^}]+\}$/.test(pointer)) {
    const ref = String(Object.values(inputs)[0] ?? "");
    if (signature === "ref" && runtime.activeDelayRefs.has(ref)) {
      return { value: { type: "ref", data: [ref] } as Value, isValid: true };
    }
    return { value: defaultValue(signature), isValid: false };
  }
  if (/^\/extensions\/KHR_interactivity\/events\/\{[^}]+\}$/.test(pointer)) {
    const ref = String(Object.values(inputs)[0] ?? "");
    if (signature === "ref" && ref.startsWith("event:")) {
      return { value: { type: "ref", data: [ref] } as Value, isValid: true };
    }
    return { value: defaultValue(signature), isValid: false };
  }
  const resolved = buildEffectivePointer(pointer, inputs);
  if (resolved === null) {
    return { value: defaultValue(signature), isValid: false };
  }
  const virtual = resolveVirtualPointer(runtime, resolved, signature);
  if (virtual) {
    return virtual;
  }
  if (signature === "ref") {
    return resolvePointerRef(runtime.gltf, resolved);
  }
  const { value, isValid } = resolvePointerValue(runtime.gltf, resolved);
  if (!isValid || !pointerValueMatchesType(value, signature)) {
    return { value: defaultValue(signature), isValid: false };
  }
  const normalizedValue = Array.isArray(value) ? value : [value];
  return { value: toValue(signature, normalizedValue.map((item) => item ?? 0)), isValid: true };
}

function handlePointerSet(runtime: RuntimeGraph, nodeId: number, stack: Set<string>): boolean {
  const node = runtime.graph.nodes[nodeId];
  const pointer = getConfigValue(node, "pointer") as string | undefined;
  if (!pointer) {
    if (runtime.trace) {
      runtime.trace.push(-1000 - nodeId);
    }
    return false;
  }
  const valueInput = getInput(runtime, nodeId, "value", stack);
  const typeIndex = getConfigValue(node, "type") as number | undefined;
  const signature = runtime.graph.types[typeIndex ?? 2]?.signature ?? "float";
  const params = extractPointerParams(pointer);
  const inputs: Record<string, number | string> = {};
  for (const param of params) {
    const input = getInput(runtime, nodeId, param.name, stack);
    if (param.kind === "ref") {
      const ref = input.type === "ref" ? String(input.data[0] ?? "") : "";
      if (!ref) {
        if (runtime.trace) {
          runtime.trace.push(-2000 - nodeId);
        }
        return false;
      }
      inputs[param.name] = ref;
      continue;
    }
    const raw = valueToNumberArray(input)[0] ?? 0;
    const value = Math.trunc(raw);
    if (!Number.isFinite(raw) || value < 0) {
      if (runtime.trace) {
        runtime.trace.push(-2000 - nodeId);
      }
      return false;
    }
    inputs[param.name] = value;
  }
  const resolved = buildEffectivePointer(pointer, inputs);
  if (resolved === null) {
    if (runtime.trace) {
      runtime.trace.push(-2000 - nodeId);
    }
    return false;
  }
  const value = valueInput.data.length === 1 ? valueInput.data[0] : valueInput.data;
  if (!pointerValueMatchesType(value, signature)) {
    if (runtime.trace) {
      runtime.trace.push(-3000 - nodeId);
    }
    return false;
  }
  const ok = setPointerValue(runtime.gltf, resolved, value);
  if (ok) {
    runtime.onPointerSet?.(resolved, value as number[] | boolean[] | number | boolean);
    runtime.onDirty?.();
  }
  if (!ok && runtime.trace) {
    runtime.trace.push(-4000 - nodeId);
  }
  return ok;
}

function getEventPayload(runtime: RuntimeGraph, node: GraphNode): EventPayload {
  const index = getConfigValue(node, "event") as number | undefined;
  if (index === undefined) {
    return {};
  }
  const payload = runtime.eventPayloads.get(index);
  if (payload) {
    return payload;
  }
  const eventDefaults = runtime.graph.events?.[index]?.values ?? {};
  return {
    boolParameter: Boolean(eventDefaults.boolParameter?.value?.[0] ?? false),
    intParameter: Number(eventDefaults.intParameter?.value?.[0] ?? 0),
    floatParameter: Number(eventDefaults.floatParameter?.value?.[0] ?? 0),
    expectedDuration: Number(eventDefaults.expectedDuration?.value?.[0] ?? 0)
  };
}
function runFlow(runtime: RuntimeGraph, node: GraphNode, socket: string) {
  const flow = node.flows?.[socket];
  if (flow) {
    executeFlow(runtime, flow.node, flow.socket);
  }
}

function executeNodeFlow(runtime: RuntimeGraph, nodeId: number, socket: string, queue: Array<{ nodeId: number; socket: string }>) {
  runtime.nodeOutputs.clear();
  if (runtime.trace) {
    runtime.trace.push(nodeId);
  }
  const node = runtime.graph.nodes[nodeId];
  const op = runtime.graph.declarations[node.declaration]?.op ?? "";
  const stack = new Set<string>();

  switch (op) {
    case "event/onStart":
      runFlow(runtime, node, "out");
      break;
    case "event/send": {
      const eventIndex = getConfigValue(node, "event") as number | undefined;
      if (eventIndex !== undefined) {
        const payload: EventPayload = {};
        if (node.values?.boolParameter) {
          payload.boolParameter = Boolean(valueToNumberArray(getInput(runtime, nodeId, "boolParameter", stack))[0]);
        }
        if (node.values?.intParameter) {
          payload.intParameter = Math.trunc(valueToNumberArray(getInput(runtime, nodeId, "intParameter", stack))[0] ?? 0);
        }
        if (node.values?.floatParameter) {
          payload.floatParameter = valueToNumberArray(getInput(runtime, nodeId, "floatParameter", stack))[0] ?? 0;
        }
        if (node.values?.expectedDuration) {
          payload.expectedDuration = valueToNumberArray(getInput(runtime, nodeId, "expectedDuration", stack))[0] ?? 0;
        }
        runtime.eventPayloads.set(eventIndex, payload);
        const eventRef = `event:custom:${eventIndex}`;
        runtime.stoppedEvents.delete(eventRef);
        const receivers = runtime.eventReceivers.get(eventIndex) ?? [];
        for (const receiverId of receivers) {
          if (runtime.stoppedEvents.has(eventRef)) {
            break;
          }
          executeFlow(runtime, receiverId, "in");
        }
        runtime.stoppedEvents.delete(eventRef);
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "event/receive":
      runFlow(runtime, node, "out");
      break;
    case "debug/log":
      runFlow(runtime, node, "out");
      break;
    case "flow/sequence": {
      if (socket !== "in") {
        break;
      }
      const flows = node.flows ?? {};
      const ordered = Object.keys(flows).sort();
      for (const key of ordered) {
        const flow = flows[key];
        executeFlow(runtime, flow.node, flow.socket);
      }
      break;
    }
    case "flow/branch": {
      if (socket !== "in") {
        break;
      }
      const condition = getInput(runtime, nodeId, "condition", stack);
      const cond = Boolean(valueToNumberArray(condition)[0]);
      runFlow(runtime, node, cond ? "true" : "false");
      break;
    }
    case "flow/switch": {
      if (socket !== "in") {
        break;
      }
      const selection = valueToNumberArray(getInput(runtime, nodeId, "selection", stack))[0] ?? 0;
      const key = `${selection}`;
      if (node.flows?.[key]) {
        executeFlow(runtime, node.flows[key].node, node.flows[key].socket);
      } else if (node.flows?.default) {
        executeFlow(runtime, node.flows.default.node, node.flows.default.socket);
      }
      break;
    }
    case "flow/for": {
      if (socket !== "in") {
        break;
      }
      const initialIndex = getConfigValue(node, "initialIndex");
      const state = runtime.nodeStates.get(nodeId) ?? {};
      if (state.forIndex === undefined) {
        state.forIndex = typeof initialIndex === "number" ? Math.trunc(initialIndex) : 0;
      }
      const startIndex = Math.trunc(valueToNumberArray(getInput(runtime, nodeId, "startIndex", stack))[0] ?? 0);
      state.forIndex = startIndex;
      runtime.nodeStates.set(nodeId, state);
      const loopBody = node.flows?.loopBody;
      const completed = node.flows?.completed;
      let iterations = 0;
      while (iterations < 10000) {
        runtime.nodeOutputs.clear();
        const endIndex = Math.trunc(valueToNumberArray(getInput(runtime, nodeId, "endIndex", stack))[0] ?? 0);
        if (state.forIndex >= endIndex) {
          break;
        }
        if (loopBody) {
          executeFlow(runtime, loopBody.node, loopBody.socket);
        }
        state.forIndex += 1;
        runtime.nodeStates.set(nodeId, state);
        iterations += 1;
      }
      if (completed) {
        queue.push({ nodeId: completed.node, socket: completed.socket });
      }
      break;
    }
    case "flow/doN": {
      const state = runtime.nodeStates.get(nodeId) ?? {};
      if (socket === "reset") {
        state.doNCount = 0;
        runtime.nodeStates.set(nodeId, state);
        break;
      }
      if (socket !== "in") {
        break;
      }
      const n = Math.trunc(valueToNumberArray(getInput(runtime, nodeId, "n", stack))[0] ?? 0);
      const decision = doNAdvance(state.doNCount ?? 0, n);
      state.doNCount = decision.count;
      runtime.nodeStates.set(nodeId, state);
      if (decision.fire) {
        runFlow(runtime, node, "out");
      }
      break;
    }
    case "flow/while": {
      if (socket !== "in") {
        break;
      }
      const loopBody = node.flows?.loopBody;
      const completed = node.flows?.completed;
      let iterations = 0;
      while (iterations < 10000) {
        runtime.nodeOutputs.clear();
        const condition = Boolean(valueToNumberArray(getInput(runtime, nodeId, "condition", stack))[0]);
        if (!condition) {
          break;
        }
        if (loopBody) {
          executeFlow(runtime, loopBody.node, loopBody.socket);
        }
        iterations += 1;
      }
      if (completed) {
        queue.push({ nodeId: completed.node, socket: completed.socket });
      }
      break;
    }
    case "flow/multiGate": {
      const flows = node.flows ?? {};
      const outputs = Object.keys(flows).sort();
      const state = runtime.nodeStates.get(nodeId) ?? {};
      if (socket === "reset") {
        state.multiGateLastIndex = -1;
        state.multiGateUsed = new Array(outputs.length).fill(false);
        runtime.nodeStates.set(nodeId, state);
        break;
      }
      if (socket !== "in") {
        break;
      }
      if (outputs.length === 0) {
        break;
      }
      const isRandom = Boolean(getConfigValue(node, "isRandom"));
      const isLoop = Boolean(getConfigValue(node, "isLoop"));
      const decision = multiGateAdvance(state.multiGateUsed ?? [], outputs.length, isRandom, isLoop, (count) => {
        runtime.randomState = (1664525 * runtime.randomState + 1013904223) >>> 0;
        return runtime.randomState % count;
      });
      state.multiGateUsed = decision.used;
      if (decision.index >= 0) {
        state.multiGateLastIndex = decision.index;
      }
      runtime.nodeStates.set(nodeId, state);
      if (decision.index >= 0) {
        const key = outputs[decision.index];
        const flow = flows[key];
        if (flow) {
          executeFlow(runtime, flow.node, flow.socket);
        }
      }
      break;
    }
    case "flow/waitAll": {
      const inputFlows = Math.trunc((getConfigValue(node, "inputFlows") as number) ?? 0);
      const state = runtime.nodeStates.get(nodeId) ?? {};
      state.waitAllActivated = state.waitAllActivated ?? new Array(inputFlows).fill(false);
      if (socket === "reset") {
        state.waitAllActivated.fill(false);
        state.remainingInputs = inputFlows;
        runtime.nodeStates.set(nodeId, state);
        break;
      }
      const index = Number(socket);
      if (!Number.isFinite(index)) {
        break;
      }
      const decision = waitAllAdvance(state.waitAllActivated, state.remainingInputs, inputFlows, index);
      state.waitAllActivated = decision.activated;
      state.remainingInputs = decision.remaining;
      runtime.nodeStates.set(nodeId, state);
      if (decision.completed) {
        const flow = node.flows?.completed;
        if (flow) {
          executeFlow(runtime, flow.node, flow.socket);
        }
      } else {
        const flow = node.flows?.out;
        if (flow) {
          executeFlow(runtime, flow.node, flow.socket);
        }
      }
      break;
    }
    case "flow/setDelay": {
      const state = runtime.nodeStates.get(nodeId) ?? {};
      state.delayIds = state.delayIds ?? [];
      if (socket === "cancel") {
        const cancelIds = new Set(state.delayIds);
        for (const item of runtime.delays) {
          if (cancelIds.has(item.id)) {
            runtime.activeDelayRefs.delete(item.ref);
          }
        }
        runtime.delays = runtime.delays.filter((item) => !cancelIds.has(item.id));
        state.delayIds = [];
        state.lastDelayIndex = -1;
        state.lastDelayRef = "";
        runtime.nodeStates.set(nodeId, state);
        break;
      }
      if (socket !== "in") {
        break;
      }
      const duration = valueToNumberArray(getInput(runtime, nodeId, "duration", stack))[0] ?? 0;
      if (!Number.isFinite(duration) || duration < 0) {
        runFlow(runtime, node, "err");
        break;
      }
      const delayId = runtime.nextDelayId;
      runtime.nextDelayId += 1;
      const delayRef = `delay:${delayId}`;
      state.lastDelayIndex = delayId;
      state.lastDelayRef = delayRef;
      state.delayIds.push(delayId);
      runtime.nodeStates.set(nodeId, state);
      runtime.activeDelayRefs.add(delayRef);
      const doneFlow = node.flows?.done;
      if (doneFlow) {
        runtime.delays.push({
          id: delayId,
          ref: delayRef,
          time: runtime.time + duration,
          nodeId: doneFlow.node,
          socket: doneFlow.socket,
          canceled: false,
          ownerNodeId: nodeId
        });
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "flow/cancelDelay": {
      if (socket !== "in") {
        break;
      }
      // Spec socket is "delay" (ref-typed); older assets used the int-typed
      // "delayIndex" socket, so keep it as a fallback.
      const delayInput = getInputOptional(runtime, nodeId, "delay", stack)
        ?? getInput(runtime, nodeId, "delayIndex", stack);
      let delay: DelayItem | undefined;
      if (delayInput.type === "ref") {
        const ref = String(delayInput.data[0] ?? "");
        delay = runtime.delays.find((item) => item.ref === ref);
      } else {
        const delayIndex = Math.trunc(valueToNumberArray(delayInput)[0] ?? -1);
        delay = runtime.delays.find((item) => item.id === delayIndex);
      }
      if (delay) {
        const found = delay;
        runtime.activeDelayRefs.delete(found.ref);
        runtime.delays = runtime.delays.filter((item) => item.id !== found.id);
        const ownerState = runtime.nodeStates.get(found.ownerNodeId);
        if (ownerState?.delayIds) {
          ownerState.delayIds = ownerState.delayIds.filter((id) => id !== found.id);
          runtime.nodeStates.set(found.ownerNodeId, ownerState);
        }
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "event/stopPropagation": {
      if (socket !== "in") {
        break;
      }
      const stopImmediate = Boolean(valueToNumberArray(getInput(runtime, nodeId, "stopImmediate", stack))[0]);
      const eventInput = getInput(runtime, nodeId, "event", stack);
      const eventRef = eventInput.type === "ref" ? String(eventInput.data[0] ?? "") : "";
      if (stopImmediate && eventRef) {
        runtime.stoppedEvents.add(eventRef);
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "animation/start": {
      if (socket !== "in") {
        break;
      }
      const animIndex = parseAnimationRef(runtime, getInput(runtime, nodeId, "animation", stack));
      const startTime = valueToNumberArray(getInput(runtime, nodeId, "startTime", stack))[0] ?? 0;
      const endTime = valueToNumberArray(getInput(runtime, nodeId, "endTime", stack))[0] ?? 0;
      const speed = valueToNumberArray(getInput(runtime, nodeId, "speed", stack))[0] ?? 1;
      if (
        animIndex === null
        || Number.isNaN(startTime) || !Number.isFinite(startTime)
        || Number.isNaN(endTime)
        || Number.isNaN(speed) || !Number.isFinite(speed) || speed <= 0
      ) {
        runFlow(runtime, node, "err");
        break;
      }
      runtime.animationStates = runtime.animationStates.filter((state) => state.animationIndex !== animIndex);
      runtime.animationStates.push({
        animationIndex: animIndex,
        startTime,
        endTime,
        stopTime: endTime,
        speed,
        entryCreation: runtime.time,
        endDoneFlow: node.flows?.done,
        stopDoneFlow: undefined
      });
      runFlow(runtime, node, "out");
      break;
    }
    case "animation/stop": {
      if (socket !== "in") {
        break;
      }
      const animIndex = parseAnimationRef(runtime, getInput(runtime, nodeId, "animation", stack));
      if (animIndex === null) {
        runFlow(runtime, node, "err");
        break;
      }
      runtime.animationStates = runtime.animationStates.filter((state) => state.animationIndex !== animIndex);
      runFlow(runtime, node, "out");
      break;
    }
    case "animation/stopAt": {
      if (socket !== "in") {
        break;
      }
      const animIndex = parseAnimationRef(runtime, getInput(runtime, nodeId, "animation", stack));
      const stopTime = valueToNumberArray(getInput(runtime, nodeId, "stopTime", stack))[0] ?? 0;
      if (animIndex === null || Number.isNaN(stopTime)) {
        runFlow(runtime, node, "err");
        break;
      }
      const entry = runtime.animationStates.find((state) => state.animationIndex === animIndex);
      if (entry) {
        entry.stopTime = stopTime;
        entry.stopDoneFlow = node.flows?.done;
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "pointer/interpolate": {
      if (socket !== "in") {
        break;
      }
      if (!handlePointerInterpolate(runtime, nodeId, stack)) {
        runFlow(runtime, node, "err");
        break;
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "flow/throttle": {
      const state = runtime.nodeStates.get(nodeId) ?? {};
      if (socket === "reset") {
        state.throttleTime = undefined;
        state.throttleRemaining = Number.NaN;
        runtime.nodeStates.set(nodeId, state);
        break;
      }
      if (socket !== "in") {
        break;
      }
      const duration = valueToNumberArray(getInput(runtime, nodeId, "duration", stack))[0] ?? 0;
      if (!Number.isFinite(duration) || duration < 0) {
        runFlow(runtime, node, "err");
        break;
      }
      const decision = throttleAdvance(state.throttleTime, duration, runtime.time);
      state.throttleTime = decision.lastTime;
      state.throttleRemaining = decision.remaining;
      runtime.nodeStates.set(nodeId, state);
      if (decision.fire) {
        runFlow(runtime, node, "out");
      }
      break;
    }
    case "pointer/set":
      if (handlePointerSet(runtime, nodeId, stack)) {
        runFlow(runtime, node, "out");
      } else {
        runFlow(runtime, node, "err");
      }
      break;
    case "variable/set": {
      const variables = getConfigValue(node, "variables");
      const indices = Array.isArray(variables) ? variables : [variables ?? 0];
      for (const index of indices) {
        const resolvedIndex = toIndex(index);
        const key = String(resolvedIndex);
        const value = getInput(runtime, nodeId, key, stack);
        runtime.variables[resolvedIndex] = cloneValue(value);
      }
      runFlow(runtime, node, "out");
      break;
    }
    case "variable/interpolate": {
      const variableIndex = getConfigValue(node, "variable");
      const useSlerp = Boolean(getConfigValue(node, "useSlerp"));
      const duration = valueToNumberArray(getInput(runtime, nodeId, "duration", stack))[0] ?? 0;
      const value = getInput(runtime, nodeId, "value", stack);
      const p1 = valueToNumberArray(getInput(runtime, nodeId, "p1", stack));
      const p2 = valueToNumberArray(getInput(runtime, nodeId, "p2", stack));
      const isValid = duration > 0 && Number.isFinite(duration) && isFiniteValue(value) && p1.every(Number.isFinite) && p2.every(Number.isFinite);
      if (!isValid) {
        runFlow(runtime, node, "err");
        break;
      }
      const index = toIndex(variableIndex);
      const startValue = cloneValue(runtime.variables[index] ?? defaultValue(value.type));
      const endValue = cloneValue(value);
      runtime.interpolations.push({
        variableIndex: index,
        startTime: runtime.time,
        duration,
        startValue,
        endValue,
        p1: [p1[0] ?? 0, p1[1] ?? 0],
        p2: [p2[0] ?? 0, p2[1] ?? 0],
        useSlerp,
        doneFlow: node.flows?.done,
        errFlow: node.flows?.err
      });
      runFlow(runtime, node, "out");
      break;
    }
    default:
      runFlow(runtime, node, "out");
      break;
  }
}

export function executeFlow(runtime: RuntimeGraph, nodeId: number, socket = "in") {
  runtime.nodeOutputs.clear();
  const queue: Array<{ nodeId: number; socket: string }> = [{ nodeId, socket }];
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      break;
    }
    executeNodeFlow(runtime, item.nodeId, item.socket, queue);
  }
}

export function advanceTime(runtime: RuntimeGraph, delta: number) {
  runtime.time += delta;
  // Animation playback (KHR_interactivity Animation Control Operations).
  const finishedAnimations: Array<{ flow?: NodeRef }> = [];
  runtime.animationStates = runtime.animationStates.filter((state) => {
    const { animationIndex, startTime, endTime, stopTime, speed } = state;
    if (startTime === endTime) {
      applyAnimationAt(runtime, animationIndex, startTime);
      finishedAnimations.push({ flow: state.endDoneFlow });
      return false;
    }
    const elapsed = Math.max(0, runtime.time - state.entryCreation);
    const scaled = startTime > endTime ? -elapsed * speed : elapsed * speed;
    const current = startTime + scaled;
    const forward = startTime < endTime;
    const stopHit = forward
      ? current >= stopTime && stopTime >= startTime && stopTime < endTime
      : current <= stopTime && stopTime <= startTime && stopTime > endTime;
    if (stopHit) {
      applyAnimationAt(runtime, animationIndex, stopTime);
      finishedAnimations.push({ flow: state.stopDoneFlow });
      return false;
    }
    const endHit = forward ? current >= endTime : current <= endTime;
    if (endHit) {
      applyAnimationAt(runtime, animationIndex, endTime);
      finishedAnimations.push({ flow: state.endDoneFlow });
      return false;
    }
    applyAnimationAt(runtime, animationIndex, current);
    return true;
  });
  for (const finished of finishedAnimations) {
    if (finished.flow) {
      executeFlow(runtime, finished.flow.node, finished.flow.socket);
    }
  }
  // Object-model property interpolations (pointer/interpolate).
  const finishedPointerInterps: Array<{ flow?: NodeRef }> = [];
  runtime.pointerInterpolations = runtime.pointerInterpolations.filter((interp) => {
    const t = interp.duration > 0 ? (runtime.time - interp.startTime) / interp.duration : Infinity;
    if (t <= 0) {
      return true;
    }
    if (Number.isNaN(t) || t >= 1) {
      const target = interp.endValue.length === 1 ? interp.endValue[0] : interp.endValue;
      if (setPointerValue(runtime.gltf, interp.pointer, target)) {
        runtime.onPointerSet?.(interp.pointer, target);
        runtime.onDirty?.();
      }
      finishedPointerInterps.push({ flow: interp.doneFlow });
      return false;
    }
    const q = cubicBezierEase(t, interp.p1, interp.p2);
    const value = interp.isQuaternion
      ? quatSlerp(interp.startValue, interp.endValue, q)
      : interp.startValue.map((item, index) => item + (interp.endValue[index] - item) * q);
    const written = value.length === 1 ? value[0] : value;
    if (setPointerValue(runtime.gltf, interp.pointer, written)) {
      runtime.onPointerSet?.(interp.pointer, written);
      runtime.onDirty?.();
    }
    return true;
  });
  for (const finished of finishedPointerInterps) {
    if (finished.flow) {
      executeFlow(runtime, finished.flow.node, finished.flow.socket);
    }
  }
  runtime.interpolations = runtime.interpolations.filter((interp) => {
    const t = Math.min(1, (runtime.time - interp.startTime) / interp.duration);
    const ease = cubicBezierEase(t, interp.p1, interp.p2);
    if (interp.useSlerp && interp.startValue.type === "float4" && interp.endValue.type === "float4") {
      const q = quatSlerp(valueToNumberArray(interp.startValue), valueToNumberArray(interp.endValue), ease);
      runtime.variables[interp.variableIndex] = { type: "float4", data: q };
    } else {
      const start = valueToNumberArray(interp.startValue);
      const end = valueToNumberArray(interp.endValue);
      const out = start.map((item, index) => item + (end[index] - item) * ease);
      runtime.variables[interp.variableIndex] = { type: interp.endValue.type, data: out } as Value;
    }
    if (t >= 1) {
      if (interp.doneFlow) {
        executeFlow(runtime, interp.doneFlow.node, interp.doneFlow.socket);
      }
      return false;
    }
    return true;
  });
  const ready = runtime.delays.filter((item) => !item.canceled && item.time <= runtime.time);
  runtime.delays = runtime.delays.filter((item) => !item.canceled && item.time > runtime.time);
  for (const item of ready) {
    runtime.activeDelayRefs.delete(item.ref);
    const ownerState = runtime.nodeStates.get(item.ownerNodeId);
    if (ownerState?.delayIds) {
      ownerState.delayIds = ownerState.delayIds.filter((id) => id !== item.id);
      runtime.nodeStates.set(item.ownerNodeId, ownerState);
    }
    executeFlow(runtime, item.nodeId, item.socket);
  }
  if (delta > 0) {
    runtime.lastTickDelta = runtime.tickCount === 0 ? NaN : delta;
    runtime.graph.nodes.forEach((node, index) => {
      if ((runtime.graph.declarations[node.declaration]?.op ?? "") === "event/onTick") {
        executeFlow(runtime, index);
      }
    });
    runtime.tickCount += 1;
  }
}

function runEntryPoint(runtime: RuntimeGraph, entry: { nodeId: number; delayedExecutionTime?: number }, options: ExecuteOptions) {
  runtime.time = 0;
  runtime.delays = [];
  runtime.interpolations = [];
  runtime.nodeStates.clear();
  runtime.nodeOutputs.clear();
  runtime.eventPayloads.clear();
  executeFlow(runtime, entry.nodeId);
  const delay = entry.delayedExecutionTime ?? 0;
  if (delay <= 0) {
    advanceTime(runtime, 0);
    return;
  }
  while (runtime.time + 1e-6 < delay) {
    let nextTime = delay;
    if (runtime.delays.length > 0) {
      const soonest = Math.min(...runtime.delays.filter((item) => !item.canceled).map((item) => item.time));
      if (Number.isFinite(soonest)) {
        nextTime = Math.min(nextTime, soonest);
      }
    }
    if (runtime.interpolations.length > 0) {
      const soonestInterp = Math.min(...runtime.interpolations.map((interp) => interp.startTime + interp.duration));
      if (Number.isFinite(soonestInterp)) {
        nextTime = Math.min(nextTime, soonestInterp);
      }
    }
    const delta = Math.max(0, nextTime - runtime.time);
    if (delta === 0) {
      advanceTime(runtime, options.tickStep ?? 1 / 60);
    } else {
      advanceTime(runtime, delta);
    }
  }
}

export function compareValues(expected: Array<number | boolean>, actual: Value, type: ValueType, epsilon = 1e-4): boolean {
  if (type === "ref" || actual.type === "ref") {
    const data = actual.data as string[];
    return expected.every((item, index) => String(item) === String(data[index] ?? data[0] ?? ""));
  }
  if (type === "bool") {
    const data = actual.data as boolean[];
    return expected.every((item, index) => Boolean(item) === Boolean(data[index] ?? data[0]));
  }
  const data = valueToNumberArray(actual);
  return expected.every((item, index) => {
    const expectedValue = parseScalar(item as number | boolean | string);
    const actualValue = data[index] ?? data[0];
    if (typeof expectedValue === "number" && Number.isNaN(expectedValue)) {
      return Number.isNaN(actualValue);
    }
    if (expectedValue === Infinity || expectedValue === -Infinity) {
      return actualValue === expectedValue;
    }
      return Math.abs(Number(expectedValue) - actualValue) <= epsilon;
    });
}

export function createRuntime(
  graph: Graph,
  gltf: any,
  options: {
    onPointerSet?: RuntimeGraph["onPointerSet"];
    onDirty?: RuntimeGraph["onDirty"];
    // Optional binary buffer chunk (e.g. GLB BIN) enabling animation channel
    // sampling; without it, animation control ops still track playhead state
    // and fire done flows, but skip writing sampled TRS/weights values.
    binary?: Uint8Array | ArrayBuffer | null;
  } = {}
): RuntimeGraph {
  const variables = graph.variables.map((variable) => {
    const signature = graph.types[variable.type]?.signature ?? "float";
    if (!Array.isArray(variable.value)) {
      return defaultValue(signature);
    }
    return toValue(signature, variable.value);
  });
  const eventReceivers = new Map<number, number[]>();
  graph.nodes.forEach((node, index) => {
    const op = graph.declarations[node.declaration]?.op ?? "";
    if (op === "event/receive") {
      const eventIndex = getConfigValue(node, "event") as number | undefined;
      if (eventIndex !== undefined) {
        const list = eventReceivers.get(eventIndex) ?? [];
        list.push(index);
        eventReceivers.set(eventIndex, list);
      }
    }
  });
  let glbBin: DataView | null = null;
  const binary = options.binary;
  if (binary instanceof ArrayBuffer) {
    glbBin = new DataView(binary);
  } else if (binary) {
    glbBin = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  }
  return {
    graph,
    variables,
    nodeStates: new Map(),
    nodeOutputs: new Map(),
    eventPayloads: new Map(),
    time: 0,
    pointerX: 0,
    pointerY: 0,
    activeCameraPosition: null,
    activeCameraRotation: null,
    hoveredNodeIndex: -1,
    hoverPoint: [NaN, NaN, NaN],
    selectedNodeIndex: -1,
    selectionPoint: [NaN, NaN, NaN],
    selectionRayOrigin: [NaN, NaN, NaN],
    delays: [],
    interpolations: [],
    pointerInterpolations: [],
    animationStates: [],
    animationRuntimes: new Map(),
    gltf: prepareGltfData(gltf),
    glbBin,
    eventReceivers,
    randomState: 123456789,
    nextDelayId: 0,
    activeDelayRefs: new Set(),
    tickCount: 0,
    lastTickDelta: NaN,
    stoppedEvents: new Set(),
    onPointerSet: options.onPointerSet,
    onDirty: options.onDirty
  };
}

// Follows the official protocol from glTF-Test-Assets-Interactivity: run the
// whole graph once (all entry points fire together, as they would on load),
// tick the runtime for the asset-advertised expectedDuration, then judge each
// sub-test by the HasPassed boolean the graph computed itself. The expected
// value from the oracle JSON is reported only as a diagnostic. `buildRuntime`
// is invoked fresh for every `test` entry (matching the corpus protocol of
// isolated sub-tests) and is the seam where env-specific asset loading plugs
// in — see node.ts's evaluateTest for the file-based implementation.
export function evaluateGraphTests(buildRuntime: () => RuntimeGraph, testJson: TestJson): TestResult {
  const failures: string[] = [];
  for (const test of testJson.tests) {
    const runtime = buildRuntime();
    // Per the corpus protocol, the whole graph runs on load: every
    // event/onStart node activates, in JSON order (the oracle's entryPoints
    // list is only a subset useful for driving sub-tests individually).
    runtime.graph.nodes.forEach((graphNode, index) => {
      if ((runtime.graph.declarations[graphNode.declaration]?.op ?? "") === "event/onStart") {
        executeFlow(runtime, index);
      }
    });
    let duration = 0;
    for (const payload of runtime.eventPayloads.values()) {
      if (payload?.expectedDuration !== undefined && Number.isFinite(payload.expectedDuration)) {
        duration = Math.max(duration, payload.expectedDuration);
      }
    }
    for (const event of runtime.graph.events ?? []) {
      const d = Number((event as any)?.values?.expectedDuration?.value?.[0] ?? 0);
      if (Number.isFinite(d)) {
        duration = Math.max(duration, d);
      }
    }
    const deadline = duration + 0.25;
    const step = 1 / 60;
    while (runtime.time < deadline) {
      advanceTime(runtime, step);
    }
    for (const subTest of test.subTests) {
      const passedVar = runtime.variables[subTest.successResultVarId];
      const passed = passedVar ? Boolean((passedVar.data as unknown[])[0]) : false;
      if (!passed) {
        const value = runtime.variables[subTest.resultVarId];
        failures.push(
          `${test.name} :: ${subTest.name} expected ${JSON.stringify(subTest.expectedResultValue)} got ${JSON.stringify(value?.data ?? null)}`
        );
      }
    }
  }
  return { ok: failures.length === 0, failures };
}
