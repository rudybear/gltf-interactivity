// JSON Pointer Template resolver for compiled `rt.ptrGet`/`rt.ptrSet` calls.
// Ports packages/runtime/src/interpreter.ts's pointer machinery
// (buildEffectivePointer, resolvePointerValue, resolvePointerRef,
// setPointerValue, resolveVirtualPointer) in full: plain property/array
// traversal, TRS defaults, node matrix/globalMatrix (get + set), morph-target
// weights (get + set, mirroring the mesh/meshNode weights-array fallback
// chain), ref-typed reads of sibling-collection properties, and the
// KHR_interactivity host-fed / runtime virtual pointers (asset capabilities,
// extension-enabled flags, runtime limits, active camera pose, animation
// control state, delay/event reference validity).
import { getAnimationTimeRange, mat4Compose, mat4Mul } from "@gltfi/kernel";
import type { ValueType } from "@gltfi/kernel";

// Host state a pointer resolution may need beyond the raw glTF JSON —
// supplied by the engine (see engine.ts's `rt.ptrGet`/`rt.ptrSet`).
export interface PointerHost {
  gltf: any;
  isDelayActive(ref: string): boolean;
  isAnimationPlaying(animationIndex: number): boolean;
  getAnimationPlayhead(animationIndex: number): { playhead: number; virtualPlayhead: number };
  activeCameraPosition: [number, number, number] | null;
  activeCameraRotation: [number, number, number, number] | null;
}

function decodeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function computeLocalMatrix(node: unknown): number[] {
  const n = node as { matrix?: unknown; translation?: unknown; rotation?: unknown; scale?: unknown } | undefined;
  if (Array.isArray(n?.matrix) && n.matrix.length === 16) {
    return n.matrix.map(Number);
  }
  const t = Array.isArray(n?.translation) ? (n.translation as number[]) : [0, 0, 0];
  const r = Array.isArray(n?.rotation) ? (n.rotation as number[]) : [0, 0, 0, 1];
  const s = Array.isArray(n?.scale) ? (n.scale as number[]) : [1, 1, 1];
  return mat4Compose(t, r, s);
}

function findParent(gltf: any, nodeIndex: number): number {
  const nodes = gltf?.nodes ?? [];
  for (let i = 0; i < nodes.length; i += 1) {
    if (Array.isArray(nodes[i]?.children) && nodes[i].children.includes(nodeIndex)) {
      return i;
    }
  }
  return -1;
}

function computeGlobalMatrix(gltf: any, nodeIndex: number, cache: Map<number, number[]>): number[] {
  const cached = cache.get(nodeIndex);
  if (cached) {
    return cached;
  }
  const local = computeLocalMatrix(gltf?.nodes?.[nodeIndex]);
  const parent = findParent(gltf, nodeIndex);
  const global = parent >= 0 ? mat4Mul(computeGlobalMatrix(gltf, parent, cache), local) : local;
  cache.set(nodeIndex, global);
  return global;
}

function getMeshTargetCount(mesh: any): number {
  const primitives = mesh?.primitives;
  if (!Array.isArray(primitives) || primitives.length === 0) {
    return 0;
  }
  const targets = primitives[0]?.targets;
  return Array.isArray(targets) ? targets.length : 0;
}

function findMeshNodeIndex(gltf: any, startIndex: number): number | null {
  const nodes = gltf?.nodes;
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

// A pointer addressing a property whose value is an index into a sibling
// top-level collection resolves (when read with type "ref") to a reference
// to that collection element — mirrors interpreter.ts's REF_COLLECTIONS.
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

function resolvePointerRef(gltf: any, resolved: string): { value: string; isValid: boolean } {
  const tokens = resolved.split("/").filter(Boolean).map(decodeToken);
  if (tokens.length === 0) {
    return { value: "", isValid: false };
  }
  const last = tokens[tokens.length - 1];
  const isIndex = /^\d+$/.test(last);
  const propToken = isIndex ? tokens[tokens.length - 2] : last;
  const collection = REF_COLLECTIONS[propToken];
  if (!collection) {
    return { value: "", isValid: false };
  }
  const parentTokens = tokens.slice(0, isIndex ? -2 : -1);
  let current: any = gltf;
  for (const token of parentTokens) {
    if (current === undefined || current === null) {
      return { value: "", isValid: false };
    }
    current = current[token];
  }
  if (current === undefined || current === null) {
    return { value: "", isValid: false };
  }
  const raw = isIndex ? current[propToken]?.[Number(last)] : current[propToken];
  if (isIndex && raw !== undefined && raw !== null && typeof raw === "object") {
    return { value: `/${tokens.join("/")}`, isValid: true };
  }
  if (typeof raw !== "number") {
    return { value: "", isValid: true };
  }
  return { value: `/${collection}/${raw}`, isValid: true };
}

function resolveWeightsLength(gltf: any, nodeIndex: number | null, meshIndex: number | null): { value: number; isValid: boolean } {
  if (nodeIndex !== null) {
    const meshNodeIndex = findMeshNodeIndex(gltf, nodeIndex);
    const meshNode = meshNodeIndex !== null ? gltf.nodes?.[meshNodeIndex] : null;
    const mesh = meshNode && typeof meshNode.mesh === "number" ? gltf.meshes?.[meshNode.mesh] : null;
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
  if (meshIndex !== null) {
    const mesh = gltf.meshes?.[meshIndex];
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
}

function resolvePointerValue(gltf: any, resolved: string): { value: any; isValid: boolean } {
  const tokens = resolved.split("/").filter(Boolean).map(decodeToken);
  let current: any = gltf;
  let nodeIndex: number | null = null;
  let meshIndex: number | null = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (current === undefined || current === null) {
      return { value: undefined, isValid: false };
    }
    if (token.endsWith(".length")) {
      const base = token.slice(0, -".length".length);
      if (base === "weights") {
        return resolveWeightsLength(gltf, nodeIndex, meshIndex);
      }
      if (!(base in current)) {
        return { value: 0, isValid: false };
      }
      current = current[base];
      return { value: Array.isArray(current) ? current.length : 0, isValid: Array.isArray(current) };
    }
    if ((token === "matrix" || token === "globalMatrix") && nodeIndex !== null) {
      const matrix = token === "matrix" ? computeLocalMatrix(gltf?.nodes?.[nodeIndex]) : computeGlobalMatrix(gltf, nodeIndex, new Map());
      return { value: matrix, isValid: true };
    }
    if (token === "[]") {
      return { value: undefined, isValid: false };
    }
    if (nodeIndex !== null && current === gltf?.nodes?.[nodeIndex] && current[token] === undefined) {
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
        const meshNodeIndex = findMeshNodeIndex(gltf, nodeIndex);
        const meshNode = meshNodeIndex !== null ? gltf.nodes?.[meshNodeIndex] : null;
        const mesh = meshNode && typeof meshNode.mesh === "number" ? gltf.meshes?.[meshNode.mesh] : null;
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
        const mesh = gltf.meshes?.[meshIndex];
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
      if (current && current === gltf?.nodes?.[index]) {
        nodeIndex = index;
      }
      if (current && current === gltf?.meshes?.[index]) {
        meshIndex = index;
      }
    } else {
      current = current?.[token];
    }
  }
  return { value: current, isValid: current !== undefined };
}

function setPointerValue(gltf: any, resolved: string, value: unknown): boolean {
  const tokens = resolved.split("/").filter(Boolean).map(decodeToken);
  let current: any = gltf;
  let parent: any = null;
  let parentKey: string | number | null = null;
  let nodeIndex: number | null = null;
  let meshIndex: number | null = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const isLast = i === tokens.length - 1;
    if (token.endsWith(".length") || token === "globalMatrix") {
      return false;
    }
    if (token === "matrix" && isLast && nodeIndex !== null) {
      gltf.nodes[nodeIndex].matrix = value;
      return true;
    }
    const nextToken = tokens[i + 1];
    const nextIsIndex = nextToken !== undefined && !Number.isNaN(Number(nextToken));
    if (token === "weights") {
      if (!nextIsIndex) {
        return false;
      }
      if (nodeIndex !== null) {
        const meshNodeIndex = findMeshNodeIndex(gltf, nodeIndex);
        const meshNode = meshNodeIndex !== null ? gltf.nodes?.[meshNodeIndex] : null;
        const mesh = meshNode && typeof meshNode.mesh === "number" ? gltf.meshes?.[meshNode.mesh] : null;
        if (!mesh) {
          return false;
        }
        const targetCount = getMeshTargetCount(mesh);
        if (targetCount === 0) {
          return false;
        }
        if (!Array.isArray(meshNode.weights)) {
          meshNode.weights = Array.isArray(mesh.weights) ? [...mesh.weights] : new Array(targetCount).fill(0.5);
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
        const mesh = gltf.meshes?.[meshIndex];
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
        const next: unknown[] = [];
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
        if (current === gltf.nodes?.[index]) {
          nodeIndex = index;
        }
        if (current === gltf.meshes?.[index]) {
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
      }
    }
  }
  return true;
}

// Substitutes evaluated template parameters into a "/nodes/[nodeIndex]/mesh"
// -style pointer template — mirrors interpreter.ts's buildEffectivePointer.
function buildEffectivePointer(pointer: string, args: Record<string, unknown>): string | null {
  const out: string[] = [];
  for (const segment of pointer.split("/")) {
    if (segment.startsWith("[") && segment.endsWith("]") && segment.length > 2) {
      out.push(String(args[segment.slice(1, -1)] ?? 0));
      continue;
    }
    if (segment.startsWith("{") && segment.endsWith("}") && segment.length > 2) {
      const ref = String(args[segment.slice(1, -1)] ?? "");
      if (!ref) {
        return null;
      }
      if (ref.startsWith("delay:") || ref.startsWith("event:")) {
        out.push(ref);
        continue;
      }
      const slash = ref.lastIndexOf("/");
      const prefix = ref.slice(0, slash);
      const idx = ref.slice(slash + 1);
      if (out.join("/") !== prefix || !/^\d+$/.test(idx)) {
        return null;
      }
      out.push(idx);
      continue;
    }
    out.push(segment);
  }
  return out.join("/");
}

type PointerParam = { name: string; kind: "int" | "ref" };

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

function valueMatchesType(value: unknown, type: ValueType): boolean {
  if (type === "bool") {
    return typeof value === "boolean";
  }
  if (type === "int") {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
  }
  if (type === "float") {
    return typeof value === "number" && Number.isFinite(value);
  }
  const lengths: Record<string, number> = { float2: 2, float3: 3, float4: 4, float2x2: 4, float3x3: 9, float4x4: 16 };
  const expected = lengths[type];
  if (expected !== undefined) {
    return Array.isArray(value) && value.length === expected && value.every((v) => typeof v === "number" && Number.isFinite(v));
  }
  return false;
}

function defaultRaw(type: ValueType): unknown {
  switch (type) {
    case "bool":
      return false;
    case "int":
    case "float":
      return 0;
    case "float2":
      return [0, 0];
    case "float3":
      return [0, 0, 0];
    case "float4":
      return [0, 0, 0, 0];
    case "float2x2":
      return [1, 0, 0, 1];
    case "float3x3":
      return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    case "float4x4":
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    case "ref":
      return "";
  }
}

// Extensions this runtime implements; used by the asset/extensions/{name}/
// enabled capability pointer (KHR_interactivity §4.2.1).
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

function resolveVirtualPointer(host: PointerHost, resolved: string, type: ValueType): { value: unknown; isValid: boolean } | null {
  if (resolved === "/extensions/KHR_interactivity/activeCamera/position") {
    if (type !== "float3") {
      return { value: defaultRaw(type), isValid: false };
    }
    return { value: host.activeCameraPosition ?? [NaN, NaN, NaN], isValid: true };
  }
  if (resolved === "/extensions/KHR_interactivity/activeCamera/rotation") {
    if (type !== "float4") {
      return { value: defaultRaw(type), isValid: false };
    }
    return { value: host.activeCameraRotation ?? [NaN, NaN, NaN, NaN], isValid: true };
  }
  if (resolved === "/extensions/KHR_interactivity/asset/majorVersion" || resolved === "/extensions/KHR_interactivity/asset/minorVersion") {
    if (type !== "int") {
      return { value: defaultRaw(type), isValid: false };
    }
    return { value: resolved.endsWith("majorVersion") ? 2 : 0, isValid: true };
  }
  const extMatch = resolved.match(/^\/extensions\/KHR_interactivity\/asset\/extensions\/([^/]+)\/enabled$/);
  if (extMatch) {
    if (type !== "bool") {
      return { value: defaultRaw(type), isValid: false };
    }
    const used: string[] = Array.isArray(host.gltf?.extensionsUsed) ? host.gltf.extensionsUsed : [];
    const name = extMatch[1];
    const enabled = SUPPORTED_EXTENSIONS.has(name) && (name === "KHR_interactivity" || used.includes(name));
    return { value: enabled, isValid: true };
  }
  const limitMatch = resolved.match(/^\/extensions\/KHR_interactivity\/limits\/([^/]+)$/);
  if (limitMatch) {
    const limit = RUNTIME_LIMITS[limitMatch[1]];
    if (limit === undefined || type !== "int") {
      return { value: defaultRaw(type), isValid: false };
    }
    return { value: limit, isValid: true };
  }
  const animMatch = resolved.match(/^\/animations\/(\d+)\/extensions\/KHR_interactivity\/(isPlaying|minTime|maxTime|playhead|virtualPlayhead)$/);
  if (animMatch) {
    const index = Number(animMatch[1]);
    const prop = animMatch[2];
    const animation = host.gltf?.animations?.[index];
    if (!animation) {
      return { value: defaultRaw(type), isValid: false };
    }
    if (prop === "isPlaying") {
      if (type !== "bool") {
        return { value: defaultRaw(type), isValid: false };
      }
      return { value: host.isAnimationPlaying(index), isValid: true };
    }
    if (type !== "float") {
      return { value: defaultRaw(type), isValid: false };
    }
    if (prop === "minTime" || prop === "maxTime") {
      const range = getAnimationTimeRange({ gltf: host.gltf, glbBin: null }, index);
      return { value: prop === "minTime" ? range.min : range.max, isValid: true };
    }
    const state = host.getAnimationPlayhead(index);
    return { value: prop === "playhead" ? state.playhead : state.virtualPlayhead, isValid: true };
  }
  return null;
}

export function ptrGet(host: PointerHost, pointer: string, args: Record<string, unknown>, type: ValueType): { value: unknown; isValid: boolean } {
  if (!host.gltf) {
    return { value: defaultRaw(type), isValid: false };
  }
  const params = extractPointerParams(pointer);
  for (const param of params) {
    const raw = args[param.name];
    if (param.kind === "int") {
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0) {
        return { value: defaultRaw(type), isValid: false };
      }
    }
  }
  // Runtime reference validation pointers resolve against runtime state, not
  // the glTF asset (KHR_interactivity Delay/Event References).
  if (/^\/extensions\/KHR_interactivity\/delays\/\{[^}]+\}$/.test(pointer)) {
    const ref = String(Object.values(args)[0] ?? "");
    if (type === "ref" && host.isDelayActive(ref)) {
      return { value: ref, isValid: true };
    }
    return { value: defaultRaw(type), isValid: false };
  }
  if (/^\/extensions\/KHR_interactivity\/events\/\{[^}]+\}$/.test(pointer)) {
    const ref = String(Object.values(args)[0] ?? "");
    if (type === "ref" && ref.startsWith("event:")) {
      return { value: ref, isValid: true };
    }
    return { value: defaultRaw(type), isValid: false };
  }
  const resolved = buildEffectivePointer(pointer, args);
  if (resolved === null) {
    return { value: defaultRaw(type), isValid: false };
  }
  const virtual = resolveVirtualPointer(host, resolved, type);
  if (virtual) {
    return virtual;
  }
  if (type === "ref") {
    return resolvePointerRef(host.gltf, resolved);
  }
  const { value, isValid } = resolvePointerValue(host.gltf, resolved);
  if (!isValid || !valueMatchesType(value, type)) {
    return { value: defaultRaw(type), isValid: false };
  }
  return { value, isValid: true };
}

export function ptrSet(host: PointerHost, pointer: string, args: Record<string, unknown>, type: ValueType, value: unknown): boolean {
  if (!host.gltf) {
    return false;
  }
  if (!valueMatchesType(value, type)) {
    return false;
  }
  const params = extractPointerParams(pointer);
  for (const param of params) {
    if (param.kind === "int") {
      const num = Number(args[param.name]);
      if (!Number.isFinite(num) || num < 0) {
        return false;
      }
    } else if (!String(args[param.name] ?? "")) {
      return false;
    }
  }
  const resolved = buildEffectivePointer(pointer, args);
  if (resolved === null) {
    return false;
  }
  return setPointerValue(host.gltf, resolved, value);
}

// Writes an already-resolved (no template substitution needed) pointer path
// straight into the document — used by the scheduler's `setPointer` effect
// to apply eased/final pointer/interpolate values (the pointer was already
// resolved once at interpolation-start time by ptrInterpPrepare below; the
// scheduler just replays writes against that same resolved path every tick,
// mirroring interpreter.ts's makeSchedulerEffects().setPointer).
export function writePointerRaw(gltf: unknown, resolvedPointer: string, value: unknown): boolean {
  return setPointerValue(gltf, resolvedPointer, value);
}

// Resolves + validates a pointer/interpolate target exactly like
// interpreter.ts's handlePointerInterpolate does for its "read the current
// value to interpolate from" step: build the effective pointer, reject
// invalid/negative int params or empty ref params, then read+validate the
// CURRENT value against the configured type (virtual pointers are never
// interpolation targets — only real document properties are, matching the
// interpreter, which calls resolvePointerValue directly here, not
// resolveVirtualPointer). Returns null on any failure (caller emits "err").
export function ptrInterpPrepare(
  host: PointerHost,
  pointer: string,
  args: Record<string, unknown>,
  type: ValueType
): { resolved: string; startValue: number[] } | null {
  if (!host.gltf) {
    return null;
  }
  const params = extractPointerParams(pointer);
  for (const param of params) {
    if (param.kind === "int") {
      const num = Number(args[param.name]);
      if (!Number.isFinite(num) || num < 0) {
        return null;
      }
    } else if (!String(args[param.name] ?? "")) {
      return null;
    }
  }
  const resolved = buildEffectivePointer(pointer, args);
  if (resolved === null) {
    return null;
  }
  const { value, isValid } = resolvePointerValue(host.gltf, resolved);
  if (!isValid || !valueMatchesType(value, type)) {
    return null;
  }
  const startValue = Array.isArray(value) ? value.map(Number) : [Number(value)];
  return { resolved, startValue };
}
