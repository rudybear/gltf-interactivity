# @gltfi/runtime

Reference interpreter for glTF [`KHR_interactivity`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_interactivity) behavior graphs, plus a small host wrapper for scene viewers. Zero dependencies, ESM, ES2020 syntax, no side effects (tree-shakable), no DOM / Node APIs in the main entry. Ships as a single unminified file (`dist/index.js`, the workspace `@gltfi/kernel` is inlined) so older bundlers that only read `main` can consume it directly.

## Usage (browser)

```ts
import { InteractivityRuntime, resolveGraph, type SceneAdapter } from "@gltfi/runtime";

// gltf: parsed glTF JSON; glbBin: optional GLB BIN chunk (needed for animation sampling)
const graph = resolveGraph(gltf); // honors extensions.KHR_interactivity.graph (default 0)
const runtime = new InteractivityRuntime(graph, gltf, glbBin);

const adapter: SceneAdapter = {
  // Called for every pointer/set (and interpolation step), e.g. "/nodes/3/translation".
  applyPointer(pointer, value) { /* mirror the write into your scene */ }
};
runtime.bindAdapter(adapter);
runtime.start(); // fires event/onStart

function frame(dtSeconds: number) {
  runtime.tick(dtSeconds); // timers, delays, interpolations, animations, onTick
  if (runtime.consumeDirty()) { /* scene state changed: re-render */ }
}

// Input (KHR_node_selectability / KHR_node_hoverability): node index, hit point,
// and for selection optionally the ray origin.
runtime.setHover(nodeIndex, [x, y, z]);
runtime.setHover(-1, [NaN, NaN, NaN]); // pointer is over nothing: fires hover-out
runtime.setSelection(nodeIndex, [x, y, z], [ox, oy, oz]);
```

### Invalid graphs

Inputs are validated against the spec's Validation section at load. `resolveGraph`, `createRuntime` and `new InteractivityRuntime(...)` throw an `InteractivityValidationError` if the extension or graph is invalid (an invalid default graph rejects the whole extension, so no graph runs):

```ts
import { InteractivityValidationError, resolveGraph, InteractivityRuntime } from "@gltfi/runtime";

try {
  const runtime = new InteractivityRuntime(resolveGraph(gltf), gltf, glbBin);
} catch (e) {
  if (e instanceof InteractivityValidationError) {
    for (const d of e.diagnostics) console.warn(d.code, d.message, d.section, d.path); // e.scope: "graph" | "extension"
  } else throw e;
}
```

To run an unvalidated, in-progress graph anyway, pass `{ validate: false }` (4th constructor argument / `createRuntime` option). `validateExtension(ext)` and `validateGraphObject(graph)` return the diagnostics without throwing.

The runtime never mutates the glTF JSON or graph you pass in (it works on its own deep copy), and a graph must omit empty `types` / `variables` / `events` / `declarations` / `nodes` arrays (the spec forbids `[]`).

Other exports: `createRuntime`, `executeFlow`, `advanceTime` (the bare interpreter core), `compareValues`, `evaluateGraphTests` (Khronos test-asset protocol), `normalizeGraph`, and all public types (`Graph`, `RuntimeGraph`, `Value`, `ValueType`, `TestJson`, ...).

## Node helpers: `@gltfi/runtime/node`

```ts
import { createInteractivityRuntimeFromGlbFile } from "@gltfi/runtime/node";

const runtime = createInteractivityRuntimeFromGlbFile("scene.glb");
```

Re-exports everything from the main entry (the same single copy, so `instanceof` works across both) and adds `node:fs`-based GLB loading (`createRuntimeFromGlbFile`, `createInteractivityRuntimeFromGlbFile`, `evaluateTest`, `debugRun`). Browser code should import only the package root, which never touches `node:fs`.

## License

MIT
