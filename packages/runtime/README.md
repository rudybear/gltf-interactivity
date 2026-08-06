# @gltfi/runtime

A dependency-free (beyond `@gltfi/kernel`) `KHR_interactivity` interpreter:
evaluates a graph JSON document directly, node by node, with no compilation
step. `packages/runtime-lib` is the sibling *compiled*-engine path (an IR ->
generated-code pipeline); this package is the reference/oracle
implementation both the conformance suite and this package's own
`InteractivityRuntime` host wrapper are built against.

Two entry points:

- `.` (`src/index.ts`) — `interpreter.ts` (the graph-evaluation core:
  `createRuntime`, `executeFlow`, `advanceTime`, and the `RuntimeGraph`/
  `Graph` types) plus `host.ts` (`InteractivityRuntime`, a stateful wrapper
  that owns hover/select event bubbling and dirty tracking for a scene
  renderer — see "Embedding a host" below).
- `./node` (`src/node.ts`) — Node-only helpers (reads a `.glb` file off disk
  and builds a `RuntimeGraph`/`Graph` from it) that the conformance runners
  use; kept out of the main entry point so nothing in it assumes a
  filesystem exists (this package's core is usable in a browser).

## Embedding a host

A host (a viewer, a game engine adapter, a test harness) drives an
`InteractivityRuntime` instance through a small surface:

```ts
const runtime = new InteractivityRuntime(graph, gltfJson, glbBinary);
runtime.bindAdapter(mySceneAdapter);   // see "SceneAdapter" below
runtime.start();                       // fires every event/onStart handler
// ...per frame:
runtime.tick(dtSeconds);
if (runtime.consumeDirty()) { /* re-read whatever the adapter wrote */ }
```

### `SceneAdapter`

```ts
export type SceneAdapter = {
  applyPointer(pointer: string, value: number[] | boolean[] | number | boolean): void;
};
```

This is the **only** hook a host needs to implement. Every effect a graph
can have on the outside world — `KHR_node_visibility`/`KHR_node_selectability`/
`KHR_node_hoverability`, node TRS, material factors, light parameters,
morph weights, anything reachable through `pointer/set` or
`pointer/interpolate` — arrives here as a resolved JSON-pointer string (e.g.
`/nodes/3/extensions/KHR_node_visibility/visible`) plus a value. There is no
second, parallel dispatch path and no other method to implement: earlier
drafts of this type also declared `setNodeVisibility`/`setNodeSelectable`/
`setNodeHoverable`, but nothing in this package ever called them (confirmed
against this monorepo's own two independent `SceneAdapter`-shaped
implementations — `apps/viewer/src/engine-host.ts`'s `makeSceneAdapter` and
`@gltfi/gltf`'s `applyInteractivityPointer` — both of which handle
`KHR_node_visibility`/`selectability`/`hoverability` purely by matching the
pointer string, never via a dedicated call). They were removed rather than
wired up.

### Pointer value contracts

`applyPointer`'s `value` parameter's *type* (bool vs. int vs. float vs.
vector) always matches the pointer's declared `KHR_interactivity` type, but
the two shapes worth calling out explicitly:

- **Boolean pointers always deliver a real JS `true`/`false`.** A graph is
  allowed to wire a numerically-typed literal or value (declared with an
  "int"/"float" type index) into a bool-typed `pointer/set` node's `value`
  socket — the interpreter tolerates a bare `0`/`1` standing in for a
  boolean there — but it always normalizes that to a real boolean *before*
  `applyPointer` fires. A host implementation can assume
  `typeof value === "boolean"` for any bool-family pointer (`.../visible`,
  `.../selectable`, `.../hoverable`, and any other bool-typed pointer a
  future extension adds) and never needs its own `toBool()` coercion. See
  `src/interpreter.ts`'s `pointerValueMatchesType`/`handlePointerSet` doc
  comments for the exact mechanism, and `coerceBoolLikeForWrite` for the
  equivalent normalization on the `pointer/interpolate`-driven write path.
  A genuinely out-of-range numeric value (anything other than `0`/`1`) for a
  bool pointer is still rejected outright — the write never reaches
  `applyPointer` at all.
- **Scalar pointers unwrap to a bare value, not a 1-element array**: `value`
  is `42`/`true`/`3.5`, not `[42]`/`[true]`/`[3.5]`, whenever the pointer's
  type has exactly one component. Vector/matrix-typed pointers (`float2`,
  `float3`, `float4`, `float4x4`, and their `bool`/`int` equivalents where
  they exist) always arrive as an array.

### `setActiveCamera` / `tick` ordering

```ts
runtime.setActiveCamera(position, rotation);
runtime.tick(dtSeconds);
```

Call `setActiveCamera` **before** `tick` each frame, not after. The
interpreter's per-node output cache (`RuntimeGraph.nodeOutputs`) is cleared
at the start of every flow execution (see `executeFlow`), including the
`event/onTick` flows `tick`'s own `advanceTime` call fires — so whatever
`runtime.activeCameraPosition`/`activeCameraRotation` are set to *before*
that flow execution starts is exactly what a `pointer/get` against
`/extensions/KHR_interactivity/activeCamera/position` (or `.../rotation`)
will read back *during* that same tick. Call it after `tick` instead and a
graph reading the camera pointer this frame sees last frame's pose, one
frame late, until the next tick. Neither `activeCameraPosition` nor
`activeCameraRotation` is populated automatically (both default to `null`,
which reads back as `NaN` per component) — a host that never calls
`setActiveCamera` is choosing not to expose a camera to the graph at all,
which is a valid choice for assets that don't use the camera pointers.

### `queueEvent`'s event kinds

```ts
runtime.queueEvent({ type: "pointermove", x, y });
runtime.queueEvent({ type: "pointerdown", x, y });
runtime.queueEvent({ type: "pointerup", x, y });
```

Queued events are drained (in FIFO order, before `advanceTime` fires
`event/onTick`) by the next `tick(dtSeconds)` call — queue as many as
accumulated since the last tick, call `tick` once per frame. Each one:

1. sets `runtime.pointerX`/`pointerY` from the event's `x`/`y` (read back by
   `event/onPointerMove`/`onPointerDown`/`onPointerUp`'s own `x`/`y`/
   `position` output sockets — these are viewport-space pointer
   coordinates, in whatever units/origin convention the host's own picking
   code uses; the interpreter never interprets them itself), then
2. fires every `event/onPointerMove`/`onPointerDown`/`onPointerUp` handler
   node in the graph (no ancestor-chain bubbling or node-index targeting —
   unlike `event/onSelect`/`onHoverIn`/`onHoverOut`, these three events are
   graph-global, not per-node).

`queueEvent` is for the three *pointer-move/down/up* events specifically.
Hover and selection gestures (`KHR_node_hoverability`/`KHR_node_selectability`)
are a different, richer API — `setHover(nodeIndex, point)` and
`setSelection(nodeIndex, point, rayOrigin?)` — because those two need
ancestor-chain bubbling and a `stopPropagation` short-circuit that a plain
FIFO queue can't express; call them directly instead of routing a
hover/select gesture through `queueEvent`. See `setHover`'s and
`setSelection`'s own doc comments in `src/host.ts` for the bubbling
semantics.

## `EngineLike` / `EngineInteractive` (conformance-judge integration)

`InteractivityRuntime` exposes the same minimal surface
`@gltfi/conformance`'s judge protocol drives against any KHR_interactivity
engine (`@gltfi/runtime-lib`'s `EngineLike`/`EngineInteractive`), directly as
public members — `sentEvents`, `eventDefaults`, `getVariableByIndex`,
`variableCount`, `time`, plus `start`/`tick` — so a host or test harness
never needs to reach through a private field to drive a conformance-style
run. `asEngineLike()` bundles all of it (plus `fireSelect`/`fireHoverIn`/
`fireHoverOut`, bridged onto `setSelection`/`setHover`) into one object
matching `@gltfi/runtime-lib`'s `EngineInteractive` shape structurally:

```ts
const engine = runtime.asEngineLike();
engine.start();
engine.advance(1 / 60);       // == runtime.tick(1/60)
engine.fireSelect(nodeIndex, point, rayOrigin);
engine.getVariableByIndex(0);
```

This package doesn't import `@gltfi/runtime-lib` (it would be a backwards
dependency — the compiled-engine package depending on nothing this package
needs), so `EngineLike`/`EngineInteractive`/`SentEvent` are declared locally
in `src/host.ts`, structurally identical to their `@gltfi/runtime-lib`
counterparts. See `packages/conformance/src/interp-adapter.ts` for the
equivalent adapter built by hand over a bare `RuntimeGraph` (the lower-level
type this class wraps) instead of over an `InteractivityRuntime` instance.
