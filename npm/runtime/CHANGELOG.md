# Changelog

## Unreleased

- Inter-asset communication: new `EventBus` (also `isPublicEventId`, `joinEventBus`, `InteractivityRuntime.joinEventBus(bus)`). Runtimes joined to one bus forward custom events with a public id (any id not starting with `_`) to every other joined runtime that has an `event/receive` for the same id and compatible value sockets (same-tick, FIFO, join order, `ref` values forwarded verbatim). Passes the corpus `InterGlb/` tests (`pnpm conf:interglb`). Runtimes that never join a bus are unchanged.

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
- `InteractivityRuntime.setActiveCamera(position, rotation, projection?)`: optional projection for the activeCamera perspective/orthographic pointers.

## 0.1.0

- Initial release.
