# Changelog

## 0.2.1

- Validation: clearer message when a pointer template parameter's value has the wrong type ([x] = int, {x} = ref), naming inline vs connected source.

## 0.2.0

- `engine.setActiveCamera(position, rotation, projection?)`: per-tick host feed for the `activeCamera/*` pointers on compiled engines, same signature and semantics as the interpreter's `InteractivityRuntime.setActiveCamera` (inputs copied; pointers read NaN for absent parts).
- `createEngine` options `eventBus` / `eventBusName` and `engine.leaveEventBus()`: compiled engines can join an `EventBus` (from `@gltfi/kernel` / `@gltfi/runtime`) and exchange public custom events (ids not starting with `_`) with other engines, compiled or interpreted. No effect without `eventBus`.

## 0.1.1

- Animation sampling: full accessor decoding (normalized / byteStride / sparse), CUBICSPLINE Hermite interpolation, per-accessor decode cache and binary-search keyframe lookup.
- Conformance: passes all 158 tests of the Khronos glTF-Test-Assets-Interactivity corpus at f99d9b6 (was 145 at 0f24a49).
- **Behavior changes (spec alignment):**
  - Float type defaults are NaN (spec "Custom Variable Types"): omitted literal values, unwired float inputs and invalid `pointer/get` results read NaN instead of 0 / identity.
  - Invalid configuration falls back to the operation's default configuration (spec "Configuration"), e.g. `flow/for` `initialIndex: 1.5`, non-integer `switch` cases, `multiGate` `isRandom: "yes"`; a `switch` selection not in `cases` takes `default`.
  - `pointer/set` / `pointer/interpolate` activate `err` (no write) when the pointer cannot be resolved, the type does not match, or the property is read-only (KHR_interactivity virtual pointers, `.length`, `globalMatrix`). Previously missing objects were created.
  - Operations declared under an unknown `extension` are no-ops whose outputs are type defaults.
  - activeCamera pointers (`/extensions/KHR_interactivity/activeCamera/...`) are implemented: always valid, NaN when no camera data is available.
  - `asset/extensions/<name>/enabled` is invalid for unused/unsupported extensions; `meshes/{}/weights` paths are invalid on read.
  - `variable/interpolate` / `pointer/interpolate`: duration 0 completes on the next tick; out-of-range bezier control points activate `err`.
- Fixes: int `math/mul` wraps like int32 (`Math.imul`); `math/isInf(NaN)` is false; custom events carry value sockets beyond the four standard ones.
- `createEngine` options: `activeCamera`; event declarations accept `extras` (payload tuples may be longer than four).

## 0.1.0

- Initial release.
