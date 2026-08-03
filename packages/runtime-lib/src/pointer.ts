// Minimal JSON Pointer Template resolver for compiled `rt.ptrGet`/`rt.ptrSet`
// calls. Ports the subset of packages/runtime/src/interpreter.ts's pointer
// machinery (buildEffectivePointer, resolvePointerValue, resolvePointerRef,
// setPointerValue) this milestone's corpus scope (math/, type/, ref/)
// actually exercises: plain property/array traversal, TRS defaults,
// node matrix/globalMatrix, and ref-typed reads of sibling-collection
// properties (mesh, children, ...). Deliberately drops what that scope never
// touches: weights, animation sampler decoding, virtual host-fed pointers
// (active camera, runtime limits, delay/event reference validation) — none
// of those are reachable from a math/type/ref graph (see task report).
import { mat4Compose, mat4Mul } from "@gltfi/kernel";
import type { ValueType } from "@gltfi/kernel";

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

function resolvePointerValue(gltf: any, resolved: string): { value: unknown; isValid: boolean } {
  const tokens = resolved.split("/").filter(Boolean).map(decodeToken);
  let current: any = gltf;
  let nodeIndex: number | null = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (current === undefined || current === null) {
      return { value: undefined, isValid: false };
    }
    if (token.endsWith(".length")) {
      const base = token.slice(0, -".length".length);
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
    const index = Number(token);
    if (!Number.isNaN(index) && Array.isArray(current)) {
      if (index < 0 || index >= current.length) {
        return { value: undefined, isValid: false };
      }
      current = current[index];
      if (current && current === gltf?.nodes?.[index]) {
        nodeIndex = index;
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
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const isLast = i === tokens.length - 1;
    if (token.endsWith(".length") || token === "globalMatrix") {
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
      }
    } else {
      if (isLast) {
        current[token] = value;
      } else {
        current[token] = current[token] ?? {};
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

export function ptrGet(gltf: unknown, pointer: string, args: Record<string, unknown>, type: ValueType): { value: unknown; isValid: boolean } {
  if (!gltf) {
    return { value: defaultRaw(type), isValid: false };
  }
  const resolved = buildEffectivePointer(pointer, args);
  if (resolved === null) {
    return { value: defaultRaw(type), isValid: false };
  }
  if (type === "ref") {
    return resolvePointerRef(gltf, resolved);
  }
  const { value, isValid } = resolvePointerValue(gltf, resolved);
  if (!isValid || !valueMatchesType(value, type)) {
    return { value: defaultRaw(type), isValid: false };
  }
  return { value, isValid: true };
}

export function ptrSet(gltf: unknown, pointer: string, args: Record<string, unknown>, value: unknown): boolean {
  if (!gltf) {
    return false;
  }
  const resolved = buildEffectivePointer(pointer, args);
  if (resolved === null) {
    return false;
  }
  return setPointerValue(gltf, resolved, value);
}
