// pointer/set + pointer/interpolate target validation, shared by the
// interpreter and @gltfi/runtime-lib (whose pointer resolvers are separate
// ports of each other, so the *decision* lives here and each side only
// supplies its own pointer reader).
//
// Spec pointer/set (and pointer/interpolate) `in` activation: "If the
// effective JSON Pointer cannot be resolved against the glTF asset, if the
// Object Model type of the resolved property does not match the type T, or if
// the property is not mutable, activate the `err` output flow".
// Environment-neutral (no node/DOM imports).

// Properties no graph may write: every KHR_interactivity virtual pointer
// (asset capabilities, limits, activeCamera, animation state, delay/event
// references -- all declared read-only by the spec's "Extending glTF Object
// Model" section), array `.length` pseudo-properties, and a node's derived
// `globalMatrix`.
export function isReadOnlyPointer(resolved: string): boolean {
  if (resolved.includes("/extensions/KHR_interactivity/")) {
    return true;
  }
  const tokens = resolved.split("/").filter(Boolean);
  const last = tokens[tokens.length - 1] ?? "";
  return last.endsWith(".length") || last === "globalMatrix";
}

// Whether a property currently holding `current` (as resolved from the asset)
// has an Object Model type that `signature` can write to. Scalars are
// number/boolean; vectors/quaternions/matrices are arrays of 2/3/4/9/16.
export function propertyAcceptsSignature(current: unknown, signature: string): boolean {
  if (typeof current === "boolean") {
    return signature === "bool";
  }
  if (typeof current === "number") {
    return signature === "int" || signature === "float";
  }
  if (Array.isArray(current)) {
    switch (current.length) {
      case 2:
        return signature === "float2";
      case 3:
        return signature === "float3";
      case 4:
        return signature === "float4" || signature === "float2x2";
      case 9:
        return signature === "float3x3";
      case 16:
        return signature === "float4x4";
      default:
        return false;
    }
  }
  return false;
}

// Intermediate path elements that may legitimately be absent in the asset JSON
// (the Object Model defines defaults for them), so a write may still target a
// property below them.
const OPTIONAL_PARENT_TOKENS = new Set(["pbrMetallicRoughness", "weights", "translation", "rotation", "scale", "extras"]);

// Full pre-write validation of a resolved pointer for pointer/set. `resolve`
// is the caller's own pointer reader.
export function canWritePointer(
  resolved: string,
  signature: string,
  resolve: (pointer: string) => { value: unknown; isValid: boolean }
): boolean {
  if (isReadOnlyPointer(resolved)) {
    return false;
  }
  const raw = resolved.split("/").filter(Boolean);
  // Every collection element / container above the target must exist
  // (writing into a missing node, mesh, light, ... is an error, never an
  // implicit creation).
  for (let k = 1; k < raw.length; k += 1) {
    const prefix = `/${raw.slice(0, k).join("/")}`;
    // `extensions` and the extension objects directly below it may be absent
    // (e.g. a node without a KHR_node_visibility object still has a
    // writable `visible` property -- the Object Model defines its default).
    const optional = OPTIONAL_PARENT_TOKENS.has(raw[k - 1]) || raw[k - 1] === "extensions" || raw[k - 2] === "extensions";
    if (!resolve(prefix).isValid && !optional) {
      return false;
    }
  }
  const current = resolve(resolved);
  if (current.isValid && !propertyAcceptsSignature(current.value, signature)) {
    return false;
  }
  return true;
}
