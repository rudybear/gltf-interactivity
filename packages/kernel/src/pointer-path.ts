// F6 (upstream fix for a friction item filed against @gltfi/runtime):
// KHR_interactivity's JSON Pointer Template grammar, and the table of
// "virtual" pointer families the interpreter answers WITHOUT ever touching
// the glTF JSON tree, extracted verbatim out of
// packages/runtime/src/interpreter.ts (extractPointerParams/
// buildEffectivePointer/resolveVirtualPointer + the two delay/event ref
// checks inside handlePointerGet) so a host embedding this engine (or a
// second, independent engine implementation) has an importable, tested
// reference instead of re-deriving either one by reading interpreter.ts's
// source directly. Behavior-preserving extraction only — @gltfi/runtime
// now imports parsePointerTemplate/resolvePointerTemplate from here rather
// than keeping its own copies; the virtual-pointer table below documents
// what interpreter.ts's resolveVirtualPointer already implements, it does
// not change it.
//
// Deliberately NOT attempted here: a family list for the "ordinary"
// JSON-backed pointers (/nodes/{n}/translation, /materials/{m}/.../
// baseColorFactor, KHR_lights_punctual, ...). Those aren't a fixed table
// inside the interpreter at all — packages/runtime/src/interpreter.ts's
// setPointerValue/resolvePointerValue walk the glTF JSON generically (split
// the pointer on "/", index into whatever's there), so there is nothing
// enumerable to extract; the interpreter itself has no opinion on which
// property paths are "real" pointer families, only glTF's own JSON shape
// does. A host wanting a concrete family list for THAT category (to build
// e.g. a pointer-router dispatch table) has to derive it from the target
// glTF extension it cares about, the same way this repo's own
// glTF-Test-Assets-Interactivity-derived tooling does — extracting a
// fixed list here would be inventing one, not extracting one.

// Square brackets denote integer template parameters, curly brackets denote
// reference template parameters (KHR_interactivity JSON Pointer Templates,
// spec §3.3.3.1).
export type PointerTemplateParam = { name: string; kind: "int" | "ref" };

// Parses a JSON Pointer Template string (e.g.
// "/nodes/[nodeIndex]/extensions/KHR_node_visibility/visible", or
// "/extensions/KHR_interactivity/delays/{delayRef}") into its ordered list
// of template parameters. A pointer with no template parameters at all
// (most pointers) returns an empty array.
export function parsePointerTemplate(pointer: string): PointerTemplateParam[] {
  const params: PointerTemplateParam[] = [];
  for (const segment of pointer.split("/")) {
    if (segment.startsWith("[") && segment.endsWith("]") && segment.length > 2) {
      params.push({ name: segment.slice(1, -1), kind: "int" });
    } else if (segment.startsWith("{") && segment.endsWith("}") && segment.length > 2) {
      params.push({ name: segment.slice(1, -1), kind: "ref" });
    }
  }
  return params;
}

// Substitutes evaluated template parameters into a pointer template,
// producing the concrete, resolved pointer string a `SceneAdapter.
// applyPointer` (or an equivalent host hook) receives. `inputs` maps each
// template parameter's `name` (as returned by parsePointerTemplate) to its
// evaluated value: int-kind parameters take a plain number (rendered as a
// decimal index), ref-kind parameters take one of this engine's own
// "/collection/index" reference strings (e.g. "/nodes/3") OR a "delay:"/
// "event:"-prefixed runtime-reference string, passed through unresolved.
//
// Returns null when the pointer is unresolvable: a ref-kind parameter with
// no value, or one whose reference doesn't point at a collection element
// under the pointer's own already-resolved prefix (e.g. a "/materials/2"
// reference substituted where the template's preceding literal segments
// were "/nodes", which can never be a valid pointer).
export function resolvePointerTemplate(pointer: string, inputs: Record<string, number | string>): string | null {
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

// The KHR_interactivity "virtual" pointer families this engine answers
// entirely from runtime/scheduler state (or fixed constants) rather than by
// reading/writing the glTF JSON tree at all — the CoreReadOnlyPointers and
// AssetCapabilities conformance categories, plus the host-fed active-camera
// pose pointers. Every one of these is read-only from a graph's perspective
// (only reachable via pointer/get, never a valid pointer/set target) except
// the two activeCamera pointers, which a HOST writes into the engine
// out-of-band (see @gltfi/runtime's InteractivityRuntime.setActiveCamera)
// rather than a graph ever setting via pointer/set.
//
// `pattern` matches the pointer template string BEFORE template-parameter
// substitution (i.e. what a `pointer/get` node's own `pointer` config
// literally contains) for the two ref-templated rows (delays/events);
// every other row has no template parameters and matches the resolved
// pointer string directly (the two are the same string in that case).
export type VirtualPointerFamily = {
  /** Short, human-readable family name — not itself part of the pointer string. */
  family: string;
  /** Matches the pointer template string (pre-substitution). */
  pattern: RegExp;
  /** The KHR_interactivity value type this family always returns. */
  type: "bool" | "int" | "float" | "float3" | "float4" | "ref";
  readOnly: boolean;
  description: string;
};

export const KHR_INTERACTIVITY_VIRTUAL_POINTERS: readonly VirtualPointerFamily[] = [
  {
    family: "activeCamera/position",
    pattern: /^\/extensions\/KHR_interactivity\/activeCamera\/position$/,
    type: "float3",
    readOnly: true,
    description: "Host-fed active camera world position; NaN-per-component until a host calls setActiveCamera."
  },
  {
    family: "activeCamera/rotation",
    pattern: /^\/extensions\/KHR_interactivity\/activeCamera\/rotation$/,
    type: "float4",
    readOnly: true,
    description: "Host-fed active camera world rotation (quaternion); NaN-per-component until a host calls setActiveCamera."
  },
  {
    family: "asset/majorVersion",
    pattern: /^\/extensions\/KHR_interactivity\/asset\/majorVersion$/,
    type: "int",
    readOnly: true,
    description: "This engine's supported KHR_interactivity spec major version (fixed constant)."
  },
  {
    family: "asset/minorVersion",
    pattern: /^\/extensions\/KHR_interactivity\/asset\/minorVersion$/,
    type: "int",
    readOnly: true,
    description: "This engine's supported KHR_interactivity spec minor version (fixed constant)."
  },
  {
    family: "asset/extensions/{name}/enabled",
    pattern: /^\/extensions\/KHR_interactivity\/asset\/extensions\/\{[^}]+\}\/enabled$/,
    type: "bool",
    readOnly: true,
    description: "Whether the named glTF extension is supported by this engine AND used by the current asset."
  },
  {
    family: "limits/*",
    pattern: /^\/extensions\/KHR_interactivity\/limits\/[^/]+$/,
    type: "int",
    readOnly: true,
    description: "Fixed runtime capacity constants (maxActiveAnimations/Delays/PropertyInterpolations/VariableInterpolations)."
  },
  {
    family: "animations/{n}/extensions/KHR_interactivity/isPlaying",
    pattern: /^\/animations\/\d+\/extensions\/KHR_interactivity\/isPlaying$/,
    type: "bool",
    readOnly: true,
    description: "Whether animation-control ops (animation/start etc.) currently have this animation index active."
  },
  {
    family: "animations/{n}/extensions/KHR_interactivity/{minTime,maxTime,playhead,virtualPlayhead}",
    pattern: /^\/animations\/\d+\/extensions\/KHR_interactivity\/(minTime|maxTime|playhead|virtualPlayhead)$/,
    type: "float",
    readOnly: true,
    description: "Animation timeline range and current sample-time playhead state."
  },
  {
    family: "delays/{delayRef}",
    pattern: /^\/extensions\/KHR_interactivity\/delays\/\{[^}]+\}$/,
    type: "ref",
    readOnly: true,
    description: "Resolves to the delay's own reference iff a flow/setDelay-created delay with that reference is still pending; matched against the pointer TEMPLATE, not a resolved index (delay refs are opaque \"delay:N\" runtime tokens, never a collection index)."
  },
  {
    family: "events/{eventRef}",
    pattern: /^\/extensions\/KHR_interactivity\/events\/\{[^}]+\}$/,
    type: "ref",
    readOnly: true,
    description: "Resolves to the event's own reference iff it is a valid \"event:\"-prefixed runtime token; matched against the pointer TEMPLATE like delays/{delayRef} above."
  }
];
