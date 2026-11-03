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

The runtime never mutates the glTF JSON or graph you pass in (it works on its own deep copy), and a graph may omit empty `types` / `variables` / `events` / `declarations` / `nodes` arrays as the schema allows.

Other exports: `createRuntime`, `executeFlow`, `advanceTime` (the bare interpreter core), `compareValues`, `evaluateGraphTests` (Khronos test-asset protocol), `normalizeGraph`, and all public types (`Graph`, `RuntimeGraph`, `Value`, `ValueType`, `TestJson`, ...).

## Node helpers: `@gltfi/runtime/node`

```ts
import { createInteractivityRuntimeFromGlbFile } from "@gltfi/runtime/node";

const runtime = createInteractivityRuntimeFromGlbFile("scene.glb");
```

Re-exports everything from the main entry (the same single copy, so `instanceof` works across both) and adds `node:fs`-based GLB loading (`createRuntimeFromGlbFile`, `createInteractivityRuntimeFromGlbFile`, `evaluateTest`, `debugRun`). Browser code should import only the package root, which never touches `node:fs`.

## Several assets in one session (inter-GLB events)

Custom events whose `id` does not start with `_` are public. Join several runtimes to one `EventBus` and they are forwarded between assets:

```js
import { EventBus, InteractivityRuntime } from "@gltfi/runtime";

const bus = new EventBus();
const a = new InteractivityRuntime(graphA, gltfA);
const b = new InteractivityRuntime(graphB, gltfB);
a.joinEventBus(bus, "A");
b.joinEventBus(bus, "B"); // join everything before calling start()
a.start();
b.start();
```

An `event/send` in one runtime also triggers the `event/receive` nodes of every other joined runtime that declares the same event `id` with compatible value sockets (the receiver's sockets must exist in the sender with the same types). Delivery is synchronous in the same tick, after the sender's own receivers, in join order; events sent from inside a delivery are queued and delivered after it returns. `ref` values are forwarded verbatim, so a ref echoed back compares equal under `ref/eq`; a ref is not re-targeted to the receiving asset. `_`-prefixed and id-less events never leave their graph. The KHR_interactivity spec leaves all of this application-specific; these rules follow the corpus's `InterGlb/README.md`. `joinEventBus` returns a function that leaves the bus; without a bus nothing changes.

## License

MIT
