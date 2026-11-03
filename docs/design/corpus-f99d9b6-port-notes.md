# Corpus upgrade 0f24a49 -> f99d9b6: port notes for the Lua / Python / C# / GDScript runtimes

`scripts/fetch-assets.mjs` now pins `glTF-Test-Assets-Interactivity` at
`f99d9b6cac73513282fc4fa8bbcc6b3a94ad8283` (145 -> 158 tests; many existing
tests re-exported). Phase 1 made the TypeScript side green (interpreter,
`@gltfi/kernel`, `@gltfi/runtime-lib`, IR, all five emitters/parsers). This
document lists every semantic change made in the shared TS kernel /
interpreter / runtime-lib, with the spec citation and the file the other four
runtimes must mirror. Everything that happens at IR-import time
(configuration validation, unsupported declarations, event-socket plumbing in
emitted code) is shared by all backends already and needs no runtime work.

Spec: `extensions/2.0/Khronos/KHR_interactivity/Specification.adoc` (section
names below are the spec's own headings).

Runtime file map (TS reference -> others):

| Concern | TS (reference) | Lua (`packages/runtime-lua/src/lua/`) | Python (`packages/runtime-py/src/py/gltfi_runtime/`) | C# (`packages/runtime-cs/src/cs/`) | GDScript (`packages/runtime-gd/src/gd/`) |
| --- | --- | --- | --- | --- | --- |
| math | `runtime-lib/src/math.ts` | `m.lua` | `m.py` | `M.cs` | `m.gd` |
| engine / events / interp validation | `runtime-lib/src/engine.ts` | `engine.lua` | `engine.py` | `Engine.cs` | `engine.gd` |
| pointer | `runtime-lib/src/pointer.ts` | `pointer.lua` | `pointer.py` | `Pointer.cs` | `pointer.gd` |
| scheduler | `kernel/src/scheduler.ts` | `scheduler.lua` | `scheduler.py` | `Scheduler.cs` | `scheduler.gd` |
| type defaults | `kernel/src/value.ts` `defaultValue` | `kmath.lua`/`pointer.lua` | `kmath.py`/`numeric.py`/`pointer.py` | `KMath.cs`/`Numeric.cs`/`Pointer.cs` | `kmath.gd`/`numeric.gd`/`pointer.gd` |
| conformance harness | `conformance/src/run-compiled*.ts` | `run-compiled-lua.ts` + engine ctor | `run-compiled-py.ts` | `run-compiled-cs.ts` + `Harness.cs` | `run-compiled-gd.ts` + `harness.gd` |

## 1. Type defaults are NaN for float types (spec "Custom Variable Types")

- Spec: bool false, int 0, ref null, **float / float2..4 / float2x2..4x4: all
  components NaN** (matrices are NOT identity).
- TS: `kernel/src/value.ts` `defaultValue()`; `toValue(sig, undefined)` returns
  it (an omitted JSON `value` array = type-default, spec "Variables"/"Event"
  value syntax). `runtime-lib/src/pointer.ts` `defaultRaw()` now delegates to
  it. Used for: invalid `pointer/get` results, unwired inputs, unsupported
  value ops, omitted literal `value`s in graph JSON.
- Others: replace the per-type zero/identity default tables (`defaultRaw` /
  `_default_raw` / `DefaultRaw` / `ptr_defaultRaw`) with NaN-filled float
  defaults. Variable initial values come from IR (`rt.vars`) so only the
  pointer/invalid-read defaults and any engine-internal fallbacks matter.
- Note for IR consumers: an event/send socket the node does not wire still
  carries the historic zeros for the four standard payload fields (importer
  `raiseEventSend`), NOT NaN.

## 2. int `math/mul` wraps with imul (spec "Multiplication", int)

- Spec: `2147483647 * 2147483647 == 1`; tip `Math.imul(a, b)`. The double
  product loses low bits past 2^53. All other int ops (add/sub/neg/div/rem/
  abs/min/max) were audited: `(a op b) | 0` on doubles is exact for 32-bit
  inputs, no change needed.
- TS: `runtime/src/interpreter.ts` case `math/mul`; `runtime-lib/src/math.ts`
  `mulInt`.
- Others: **no change needed** -- they already multiply exactly and wrap:
  Lua `m.mulInt` (64-bit integer product then `i32`), Python `to_int32(a * b)`,
  GDScript `_int32Wrap(a * b)` (64-bit ints), C# `unchecked(a * b)`. Only the
  JS double product was inexact. (Verify the Lua emitter keeps int operands as
  Lua integers, not floats.)

## 3. `math/isInf(NaN)` is false (spec "Is Infinity")

- Spec: true iff positive or negative infinity.
- TS: `runtime-lib/src/math.ts` `isInf`, interpreter `math/isInf`.
- Others: all four are wrong today (they treat NaN as infinite): `m.lua:m.isInf`
  (`x ~= x` clause), `m.py:isInf` (`x != x` clause), `m.gd:isInf` (`is_nan`
  clause), `M.cs:IsInf(double)` / `IsInf(double[])` (`double.IsNaN ||`). Drop
  the NaN clause.

## 4. Variable interpolation tick + input validation (spec "variable/interpolate", "pointer/interpolate")

- Spec activation: err if duration is NaN, infinite or **negative** (0 is
  valid), or any component of p1/p2 is non-finite, or the X components are
  outside [0, 1]. A non-finite *target value* is NOT an error. Tick:
  `t = elapsed / duration`; `t <= 0` skip; `t` NaN (duration 0 at the start
  instant) or `t >= 1` writes the exact target, removes the entry and fires
  `done`; otherwise eased interpolation.
- TS: `kernel/src/scheduler.ts` `isValidInterpolation()` (shared by
  `interpreter.ts` variable/pointer interpolate and `engine.ts` `varInterp`/
  `ptrInterp`) and the "Phase 3: variable interpolations" block.
- Others: `engine.{lua,py,cs,gd}` varInterp / ptrInterp argument checks
  (remove `duration > 0` and finite-value requirement, add X-in-[0,1]), and
  the scheduler variable-interp phase (`scheduler.*`): duration 0 must
  complete on the next tick instead of dividing by zero / being rejected.

## 5. Custom event value sockets beyond the four standard ones (spec "Custom Events", "Receive", "Send")

- Spec: a custom event defines arbitrary typed value sockets with optional
  initial values; `event/receive` outputs them, `event/send` takes them as
  inputs; unset values are the initial value or type-default.
- IR / emitters (already done, all five languages): payload tuple =
  `[boolParameter, intParameter, floatParameter, expectedDuration, ...extras]`
  where extras follow `eventExtraValues(event)` order (sorted by socket id).
  Events table entries gain an `extras` declaration: TS
  `extras: { "value": rt.int(0) }`, Lua `extras = { { name = "value", decl = rt.int(0) } }`
  (slot `5+k`, 1-based), Python `"extras": {"value": rt.int_(0)}` (slot `4+k`),
  C# `rt.DeclareEvent(ext, b, i, f, d, new EventExtra("value", "int", 0))` with
  typed accessors `payload.ExtraInt(k)` / `rt.EventPayloadOf(E).ExtraInt(k)`
  (suffix Bool/Int/Float/Ref/Vec) and `new EventPayload(b, i, f, d, extra...)`,
  GDScript `"extras": [["value", rt.int_var(0)]]` (slot `4+k`).
- TS runtime: `runtime-lib/src/engine.ts` `EventDecl.extras`, `EventPayload`
  tuple type, `defaultEventPayload()` (used by `send` without payload and by
  `eventPayload` for never-sent events); interpreter `EventPayload.values`,
  `eventSocketDefault()`.
- Others: `rt.events()` must accept `extras` (a list/dict of typed initial
  values); `send`/`onReceive`/`eventPayload` payloads become variable length
  (C#: `EventPayload` is a fixed 4-field struct in `Engine.cs` and needs an
  `object[] Extras` or similar; `SentEvent` likewise); `sentEvents` still
  exposes the first four for the judge.

## 6. Pointer semantics

All pointer code is duplicated between the interpreter (`runtime/src/interpreter.ts`)
and `runtime-lib/src/pointer.ts`; the decision helpers are shared in the kernel.

### 6a. Writability and type match for pointer/set and pointer/interpolate (spec "pointer/set" step 4, "pointer/interpolate" step 4)
- Spec: err if the effective pointer cannot be resolved, the Object Model type
  of the property does not match `T`, or the property is not mutable.
- Kernel: `kernel/src/pointer-write.ts` `isReadOnlyPointer()` (any
  `/extensions/KHR_interactivity/` virtual pointer, `*.length`, `globalMatrix`),
  `propertyAcceptsSignature()` (property shape vs. signature), `canWritePointer()`
  (every collection element / container above the target must exist -- no
  implicit creation; `extensions`, extension objects, `pbrMetallicRoughness`,
  TRS and `weights` may be absent; existing property must accept the type).
- TS call sites: `interpreter.ts` `handlePointerSet` / `handlePointerInterpolate`,
  `pointer.ts` `ptrSet` / `ptrInterpPrepare`.
- Others: port the three helpers next to `ptrSet` / `ptr_interp_prepare`
  (`pointer.lua:ptr_ptrSet`, `pointer.py:ptr_set`, `Pointer.cs:PtrSet`,
  `pointer.gd:ptr_set`) and call before the write. Corpus tests:
  `pointer/set_edge_cases`, `pointer/get_light_type_pointers`
  (`spot/outerConeAngle` on a point light), `pointer/interpolate`
  (read-only `globalMatrix`), `pointer/activeCamera`.

### 6b. `asset/extensions/<name>/enabled` exists only for used+supported extensions (spec "Asset Capabilities")
- Unlisted or unsupported name => `isValid == false` (value = type-default),
  not a valid `false`.
- TS: `interpreter.ts` / `pointer.ts` `resolveVirtualPointer` extMatch branch.
- Others: `ptr_resolveVirtualPointer` / `_resolve_virtual_pointer` /
  `ResolveVirtualPointer` / `_resolve_virtual_pointer`.

### 6c. `meshes/{}/weights` is not a pointer (spec note on `/nodes/{}/weights`, corpus `pointer/get_set_morphtargets`)
- `meshes/{}/weights.length` and `meshes/{}/weights/N` are invalid on read;
  only `nodes/{}/weights...` (resolved through the node's mesh) is valid.
  (Writes through a mesh path are left as before; the corpus does not test
  them.)
- TS: `resolveWeightsLength` and the `weights` branch of `resolvePointerValue`
  in both pointer implementations. Others: `ptr_resolveWeightsLength` /
  `_resolve_weights_length` / `ResolveWeightsLength` plus the weights branch of
  their resolve function.

### 6d. activeCamera pointers (spec "Active Camera State")
- `activeCamera/position|rotation` and the eight `perspective/*`,
  `orthographic/*` floats are always valid and read-only; unavailable data is
  NaN (the other projection kind is all-NaN).
- Kernel: `kernel/src/active-camera.ts` `readActiveCameraPointer()` (single
  read implementation), `ActiveCamera`, `ActiveCameraProjection`,
  **`CONFORMANCE_ACTIVE_CAMERA`** (position `[0,1,5]`, identity rotation,
  perspective aspect 16/9, yfov 0.8, znear 0.1, zfar 100).
- TS plumbing: `createRuntime(..., { activeCamera })`,
  `InteractivityRuntime.setActiveCamera(position, rotation, projection?)`,
  engine `EngineOptions.activeCamera`, `PointerHost.activeCameraProjection`.
- Conformance harness: the corpus test `pointer/activeCamera` "assumes the
  viewer renders with an active camera, otherwise all values are NaN", so the
  TS runners (`run-interp`, `run-compiled`, all `run-roundtrip*`) hand every
  engine `CONFORMANCE_ACTIVE_CAMERA`.
- Others: add the projection fields to the pointer host (`host.activeCamera*`),
  implement the same path table in `ptr_resolveVirtualPointer` etc., and make
  the Lua / Python / C# / GDScript conformance harnesses construct the engine
  with the camera above (values must match exactly for cross-language parity).

## 7. Graph-level changes handled in the shared IR (no runtime work, listed for completeness)

- **Invalid configuration => default configuration** (spec "Configuration":
  "the whole configuration is invalid and the operation behavior MUST fall back
  to the default configuration"). One implementation: `kernel/src/config.ts`
  `normalizeConfiguration()` driven by `OP_REGISTRY` field metadata
  (`type`, `default`, new `min` / `max` / `oneOf`). Applied once in the
  interpreter (`normalizeGraph`) and in the IR importer (constructor), so
  emitted code already contains the valid configuration for every backend.
  Covers `flow/for` (initialIndex int32), `flow/switch` & `math/switch`
  (`cases` int32 array), `flow/multiGate` (both bools or both default),
  `flow/waitAll` (`inputFlows` in 0..64), `math/quatFromAngles` (`order` one of
  six), `debug/log`. Extension events (`event/onSelect|onHoverIn|onHoverOut`)
  fall back per property instead (their own extension specs define per-property
  defaults). Ops with a required field (variable/*, pointer/*, event/*) are
  left alone.
- **Switch case sockets exist only for configured `cases`** (spec
  "Switch"): a selection not in `cases` takes `default` even if the JSON has a
  same-named socket. Interpreter: `switchCases()`; IR already lowered from
  `cases`.
- **Unsupported declarations are no-ops** (spec "Declarations"): an op with an
  `extension` the implementation does not know -- even if named like a core op
  (`math/pi`) -- never activates flows and outputs the type-default of each
  declared `outputValueSockets` type. Shared predicate:
  `kernel/src/registry-query.ts` `isSupportedDeclaration()` (an
  `event/onSelect` etc. written without `extension` is still accepted, for
  older authoring tools). Interpreter: `normalizeGraph` blanks the op and
  `evaluateValue` default branch returns the declared type default; IR
  importer: `unsupportedNodes` -> empty statement / default const.
- **`-0` float literals keep their sign** in all five emitters (`String(-0)` is
  `"0"`; `1 / -0` must stay `-Infinity`; corpus `Extras/Float_Precision`).
- **Variable user-facing name** is `name` in the final spec (older corpus
  spelled it `id`): the IR importer reads `name ?? id`, the exporter writes
  `name`.
- **`@gltfi/verify`** treats an omitted literal `value` as the type-default.
- **Generic custom events in the interpreter**: `event/send` stores every
  declared value socket, `event/receive` outputs the event's own socket ids.

## 8. Behavior changes visible to downstream consumers (e.g. gltf-studio)

- `defaultValue('float' | ...)` is NaN, not 0 / identity. Anything reading
  invalid `pointer/get` values or unwired float inputs now sees NaN (spec).
- `exportGraph` writes variable `name` instead of `id`; reading still accepts
  both.
- `InteractivityRuntime.setActiveCamera` takes an optional third
  `projection` argument; without it the projection pointers read NaN.
- `pointer/set` now yields `err` for non-existent targets (it used to create
  intermediate objects), type-mismatched values and read-only properties.
- `asset/extensions/<unused>/enabled` is now `isValid == false`.
- `@gltfi/runtime-lib` `EngineOptions.activeCamera`, `EventDecl.extras`;
  payload tuples may be longer than four entries.
- `normalizeGraph()` returns declarations with `op: ""` + `unsupportedOp` for
  unsupported ones (the original name is kept in `unsupportedOp`).

## 9. Phase-2 target list: `conf:lua|py|cs|gd` after phase 1 (TS side green)

Measured on the phase-1 tree (`pnpm conf:<lang>`), expected failures only:

- **Lua 145/158**: `Extras/Float_Precision` (`round(0.49999999999999994)` must be 0 -- use
  `trunc`-based half-away-from-zero, not `floor(x + 0.5)`; `min(0, -0)` must return `-0`, i.e.
  NaN/zero-sign aware min/max), `pointer/AssetCapabilities_GetTests`, `pointer/activeCamera`,
  `pointer/get_light_type_pointers`, `pointer/get_set_morphtargets`, `pointer/interpolate`,
  `pointer/set_edge_cases`, `variable/interpolate` (X in [0,1], duration 0), `math/clamp` and
  `math/max` (NaN must propagate: `max(1, NaN) == NaN`, `clamp(NaN, 0, 1) == NaN`), `math/isInf`
  (section 3), `math/mul` (the Lua runtime multiplies `Lua number`s; check int operands are Lua
  integers), `math/pow` (`pow(1, Infinity)` and `pow(-1, Infinity)` are NaN per the spec's pow
  table; `pow(NaN, 0) == 1`). `event/activation_order_and_onTick` passes only because the Lua
  runtime ignores extras; implement section 5 properly.
- **Python 148/158**: `Extras/Float_Precision` (`round(0.49999999999999994) == 0`: Python's
  `round` is banker's rounding and `floor(x+0.5)` is wrong -- use `copysign(floor(abs(x)+0.5))`
  only after correcting the 0.49999999999999994 case, e.g. via `math.trunc(x + copysign(0.5, x))`
  guarded by the exact-half test), the six `pointer/*` tests above, `variable/interpolate`,
  `math/isInf`, `math/pow` (`pow(NaN, 0) == 1`: Python raises/returns nan -- special-case).
- **C# 147/158**: `Extras/Float_Precision` (same `round` issue), `event/activation_order_and_onTick`
  (compiled module does not build: `EventExtra`, 5-arg `EventPayload`, `payload.ExtraInt(k)` are
  missing in `Engine.cs` -- section 5), the six `pointer/*` tests, `variable/interpolate`,
  `math/isInf` (`M.cs:IsInf`), `math/pow` (`pow(NaN, 0) == 1`). `math/switch` was an emitter bug
  (empty `new[] { }` array, CS0826) fixed in `emit-cs` during phase 1.
- **GDScript 147/158**: `Extras/Float_Precision` (float-literal precision: `(2^53-1) - (2^53-2)`
  yields 0 and `5e-324 > 0` is false -- the emitted `9007199254740991.0` / `5e-324` literals are
  not read exactly by Godot's script parser; consider emitting such literals through
  `float("...")`/string parsing or a hex/exponent split), the six `pointer/*` tests,
  `variable/interpolate`, `math/isInf`, `math/pow`, `math/saturate` (`saturate(NaN)` must be NaN).
  Godot also logs `Unicode parsing error` noise from a test string; harmless.

The six `pointer/*` tests are `AssetCapabilities_GetTests`, `activeCamera`,
`get_light_type_pointers`, `get_set_morphtargets`, `interpolate`, `set_edge_cases`: sections 6a-6d.
The math items (`clamp`, `max`, `pow`, `saturate`, `round`, `min`) behave correctly in the TS
runtime for free because JS `Math.*` already follows the corpus's IEEE edge cases; the other
languages need explicit NaN/infinity/signed-zero handling in `m.*` (compare with `math.ts` /
the spec's per-op tables).

## 10. C# runtime status (phase 2, `packages/runtime-cs/src/cs/`): done

`pnpm conf:cs` 158/158, `pnpm conf:roundtrip-cs` 158/158. Items 1-6 above and the
animation fixes are ported:

- Section 1: `Pointer.DefaultRaw` returns NaN-filled floats/vectors/matrices.
- Section 3: `M.IsInf` (scalar and array) no longer treats NaN as infinite.
- Section 4: `Engine.IsValidInterpolation` (duration finite and >= 0, p1/p2 finite, X in [0,1]; target value may
  be non-finite) is shared by `VarInterp`/`PtrInterp`; `Scheduler` variable phase follows the kernel tick
  (`t <= 0` skip, NaN or `t >= 1` writes the exact target, removes and fires done).
- Section 5: `EventExtra`, `DeclareEvent(..., params EventExtra[])`, `EventPayload(b, i, f, d, params object[])` with
  `ExtraBool/Int/Float/Ref/Vec(k)`; `Send` without payload and `EventPayloadOf` for never-sent events use the declared initial values.
- Section 6: `IsReadOnlyPointer` / `PropertyAcceptsSignature` / `CanWritePointer` in `Pointer.cs` (called by `PtrSet`;
  `PtrInterpPrepare` rejects read-only); `asset/extensions/<x>/enabled` invalid unless used+supported;
  `meshes/{}/weights[.length]` invalid on read; activeCamera via `ReadActiveCameraPointer` +
  `PointerHost.ActiveCameraProjection`; `Engine.SetActiveCamera` / `SetConformanceActiveCamera` (called by `Harness.cs`).
  Non-leaf JSON nodes now resolve as "exists" (needed by the container check).
- Extras/Float_Precision: `Numeric.SafeRound` uses the exact fractional part (not `floor(x + 0.5)`) and keeps -0;
  `math/pow`: `pow(x, +-0) == 1` before the NaN check (`pow(NaN, 0) == 1`), `pow(-Inf, odd<0) == -0`.
- `Engine._onPointerSetHook` (never assigned warning) became the public `Engine.OnPointerSetHook` property, the C# analog
  of `EngineOptions.onPointerSet`.
- Animation (`Animation.cs`): full `DecodeAccessor` (all six component types, normalized, byteStride, sparse, missing
  bufferView), per-document `ConditionalWeakTable` cache of decoded accessors and channel plans, binary-search keyframes
  with last-key fast path, CUBICSPLINE Hermite (rotations re-normalized); `ApplyAnimationAt` also returns `SkippedChannels`.
  Tests: `packages/runtime-cs/test/animation.test.ts` (via the test-only `anim_sample` harness command).

## 11. Port status: Lua (`packages/runtime-lua`) -- DONE

`pnpm conf:lua` 158/158, `pnpm conf:roundtrip-lua` 158/158.

- [x] 1 type defaults NaN (`pointer.lua` `ptr_defaultRaw`)
- [x] 2 `math/mul` imul (`m.lua` `m.mulInt` forces Lua integers; the double product lost low bits)
- [x] 3 `math/isInf` NaN clause dropped
- [x] 4 variable/pointer interpolate validation (X in [0,1], duration >= 0, non-finite target OK) and scheduler tick (`engine.lua` `rt.varInterp`, `scheduler.lua` phase 3)
- [x] 5 event extras (`engine.lua` `defaultEventPayload`, slots 5+k)
- [x] 6a-6d pointer writability/type match, `asset/extensions/<n>/enabled`, `meshes/{}/weights` invalid, activeCamera (engine option `activeCamera`; `run-compiled-lua.ts` harness passes the conformance camera)
- [x] math NaN/-0 semantics: `jsmin`/`jsmax` (min/max/clamp/saturate/smoothStep), `Math.round` half-up on the float magnitude (0.49999999999999994 -> 0, -0.3 -> -0), `jspow` (`pow(1, +-Inf)`, `pow(x, NaN)`)
- [x] animation: full accessor decode, Hermite CUBICSPLINE, per-document cache (`animation.lua`)

## 12. Python runtime status (done)

`pnpm conf:py` 158/158 and `pnpm conf:roundtrip-py` 158/158. Python items done
(`packages/runtime-py/src/py/gltfi_runtime/`):

- Section 1: `pointer._default_raw` returns NaN float defaults.
- Section 3: `m.isInf` no longer treats NaN as infinite.
- Section 4: `scheduler.is_valid_interpolation` (shared by `engine.var_interp` /
  `ptr_interp`) and the variable-interp tick (duration 0 completes on the next
  tick).
- Section 6a-6d: `pointer._can_write_pointer` / `_is_read_only_pointer` in
  `ptr_set` and `ptr_interp_prepare`; `asset/extensions/<n>/enabled` invalid
  unless used+supported; `meshes/{}/weights` invalid; activeCamera pointer
  table (`Engine(active_camera=...)`, `harness.py` hands the conformance camera).
- Section 9 Python list: `Extras/Float_Precision` (`numeric.safe_round` compares
  the fraction instead of `floor(|x| + 0.5)`), `math/pow` (`pow(NaN, 0) == 1`
  checked before the NaN guard).
- Animation (user bug #3/#4): `animation.py` ports kernel `decodeAccessor`
  (all component types, normalized, byteStride, sparse, missing bufferView),
  Hermite CUBICSPLINE, per-document cache, binary search with last-key fast
  path. Tests: `packages/runtime-py/test/test_animation.py` (run by vitest via
  `animation.test.ts`).

## 13. GDScript port status (packages/runtime-gd)

Done in `packages/runtime-gd/src/gd/`:

- Section 1: `pointer.gd:_default_raw` is NaN-filled for float types (matrices not identity).
- Section 3: `m.gd:isInf` drops the NaN clause. `math/pow`: `numeric.gd:safePow` returns 1 for `b == 0` before the NaN check. `math/saturate(NaN)` is NaN. `min`/`max` use `Numeric.fmin/fmax` (NaN propagation + signed zero). `toInt32` now goes through `fmod(x, 2^32)` because GDScript `int(float)` saturates past 2^63 (`floatToInt(1e20)`).
- Section 4: `engine.gd:_is_valid_interpolation` (mirrors `isValidInterpolation`) for var/ptr interpolate; `scheduler.gd` variable-interp phase writes the exact target on `t >= 1` or NaN (duration 0), skips `t <= 0`.
- Section 6a-6d: `pointer.gd` `is_read_only_pointer` / `property_accepts_signature` / `can_write_pointer` (used by `ptr_set`; `ptr_interp_prepare` checks read-only), `asset/extensions/<x>/enabled` invalid unless used+supported, `meshes/{}/weights` invalid, activeCamera table (`_read_active_camera_pointer`); the engine takes an optional `active_camera` dict and `harness.gd` hands every engine the `CONFORMANCE_ACTIVE_CAMERA` values.
- Animation (user bug report #3/#4): `animation.gd` ports `decodeAccessor` (all component types, normalized, byteStride, sparse, missing bufferView), CUBICSPLINE Hermite, per-document cache (`host["_animCache"]`) and binary-search keyframes with a last-index fast path. Tests: `packages/runtime-gd/test/animation_test.gd` (+ vitest wrapper `animation.test.ts`, skipped without godot).

Open: `Extras/Float_Precision` (`conf:gd` is 157/158). Godot's script parser cannot read the emitted literals `9007199254740991.0` (comes out as 2^53-2), `5e-324` (denormals flush to 0), and `-0.0` as a call argument / unary-neg of `0.0` loses the sign (constant folding). This needs an `emit-gd` change (and a matching `parse-gd` change so the roundtrip stays green): emit `m.f64FromBits(<signed int64 bit pattern>)` (already provided by `m.gd`/`numeric.gd`) for negative zero (including `-0.0` produced by unary neg of literal `0.0`), denormals and literals with >= 16 significant digits.
