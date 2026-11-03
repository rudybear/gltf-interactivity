# Changelog

## Unreleased

- **Load-time validation (spec "Validation").** `resolveGraph`, `createRuntime` and `new InteractivityRuntime(graph, gltf, binary?, options?)` now throw `InteractivityValidationError` (exported; `diagnostics[]` each carry `code`, `message`, `section`, `path`, `nodeIndex`, `outcome`) for an invalid graph or extension instead of running it. `resolveGraph` validates the whole extension (empty/missing `graphs`, bad `graph` index, an invalid default graph all reject the extension, so a valid sibling graph does not run either); `InteractivityRuntime` validates the whole extension when `graph` is one of `gltf.extensions.KHR_interactivity.graphs`, otherwise just the graph. Pass `{ validate: false }` (`createRuntime` options / `InteractivityRuntime` 4th argument) to run unvalidated, e.g. in-progress graphs. Also exported: `validateExtension`, `validateGraphObject`. Validation is the same code as `@gltfi/verify`'s `validateGraph` (`@gltfi/kernel` is inlined). The Khronos `invalid/` corpus is rejected 187/187 (`pnpm conf:invalid`).
- Graphs are now held to the spec: empty arrays instead of omitted ones, duplicate declarations, wrong socket types, missing input sockets, backward flows and the like are rejected. Previously-tolerated hand-written graphs may now throw; `validateGraph` / `error.diagnostics` say why. The default configuration of an operation (e.g. a switch with no cases) no longer materialises an empty `value: []` array.
- Types: `SentEvent.payload` is `[boolean, number, number, number, ...unknown[]]` (matches `@gltfi/runtime-lib`; slots 4+ are the custom event value sockets, this interpreter currently reports the four standard slots).

## 0.1.1

- Animation sampling: full accessor decoding (normalized / byteStride / sparse), CUBICSPLINE Hermite interpolation, per-accessor decode cache and binary-search keyframe lookup.
- Conformance: passes all 158 tests of the Khronos glTF-Test-Assets-Interactivity corpus at f99d9b6 (was 145 at 0f24a49).
- **Behavior changes (spec alignment):**
  - Float type defaults are NaN (spec "Custom Variable Types"): omitted literal values, unwired float inputs and invalid `pointer/get` results read NaN instead of 0 / identity.
  - Invalid configuration falls back to the operation's default configuration (spec "Configuration"), e.g. `flow/for` `initialIndex: 1.5`, non-integer `switch` cases, `multiGate` `isRandom: "yes"`; a `switch` selection not in `cases` takes `default`.
  - **Breaking:** `pointer/set` / `pointer/interpolate` on an unresolvable pointer now take `err` instead of writing (hosts relying on writes creating missing objects must stop). They activate `err` (no write) when the pointer cannot be resolved, the type does not match, or the property is read-only (KHR_interactivity virtual pointers, `.length`, `globalMatrix`). Previously missing objects were created.
  - Operations declared under an unknown `extension` are no-ops whose outputs are type defaults.
  - activeCamera pointers (`/extensions/KHR_interactivity/activeCamera/...`) are implemented: always valid, NaN when no camera data is available.
  - `asset/extensions/<name>/enabled` is invalid for unused/unsupported extensions; `meshes/{}/weights` paths are invalid on read.
  - `variable/interpolate` / `pointer/interpolate`: duration 0 completes on the next tick; out-of-range bezier control points activate `err`.
- Fixes: int `math/mul` wraps like int32 (`Math.imul`); `math/isInf(NaN)` is false; custom events carry value sockets beyond the four standard ones.
- `InteractivityRuntime.setActiveCamera(position, rotation, projection?)`: optional projection for the activeCamera perspective/orthographic pointers.

## 0.1.0

- Initial release.
