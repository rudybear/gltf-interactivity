# Changelog

## Unreleased

- **Load-time validation and rejection** (spec "Validation"): the full Extension Object / Graph Object / Variable / Event / Declaration / Node / Inline Value validation algorithm (plus per-operation socket presence/type matching, configuration validity and pointer templates) is implemented once, in `@gltfi/kernel`, and used everywhere:
  - New `InteractivityValidationError` (`diagnostics` with `code`, `message`, `section`, `path`, `nodeIndex`, `outcome: "rejectGraph" | "rejectExtension"`; `scope: "graph" | "extension"`), exported from `gltf-interactivity/ir`, `/verify` and `/runtime`.
  - `importGraph` (and so every compiled backend: TS / Lua / Python / C# / GDScript emit from validated IR) throws it for an invalid graph instead of importing it; pass `{ validate: false }` to opt out.
  - `resolveGraph`, `createRuntime` and `new InteractivityRuntime` reject invalid input (an invalid default graph or extension object rejects the whole extension, so no graph runs). See `@gltfi/runtime`.
  - `gltf-interactivity/verify`: `validateGraph` delegates to the same implementation (diagnostic codes unchanged where the rule is unchanged; new `section` / `path` / `outcome` fields) and gains `validateExtension(ext)`. Fixed false positives on valid assets (equal-declaration check ignored input sockets; flow `socket` is optional) and the previously missed extension-level rules.
  - New conformance gate `pnpm conf:invalid`: 187/187 cases of the Khronos `invalid/` corpus are rejected on every load path; the 158 valid assets and the 17 Models validate cleanly.
- `exportGraph` now emits spec-valid JSON: empty `types` / `variables` / `events` / `declarations` / `nodes` arrays and empty configuration arrays (e.g. a switch with no cases) are omitted. (`GraphJson` members are optional accordingly.) Note: a self-rescheduling proc still exports a flow back-edge, which the spec forbids and validation rejects.

## 0.3.0

Packaging changes (the 0.2.0 install footprint was dominated by `ts-morph`/`typescript`, even for consumers that only use the runtime, IR or verifier).

- `ts-morph` (^23.0.0) and `luaparse` (^0.3.1) are now **optional peer dependencies** instead of dependencies. Install them only to parse TypeScript / Lua (`./parse/ts`, `./parse/lua`, and the CLI's `compile`, `apply`, `roundtrip` with those languages). No entry other than `./parse/ts` / `./parse/lua` loads them; the build fails if that ever changes.
- The CLI prints a friendly "needs the optional peer dependency" message (exit 1, no stack trace) when a parser peer is missing; the TypeScript parser is now loaded lazily.
- `./runtime` and `./runtime/node` are now thin re-exports of the new regular dependency `@gltfi/runtime` (^0.1.1). The CLI and conformance adapter use it too, so exactly one interpreter implementation is installed. `InteractivityRuntime` from `gltf-interactivity/runtime` is identical to the one from `@gltfi/runtime`.
- Added classic `main` and top-level `types` fields (keeping `exports`).
- Front-end fixes (all five languages: TS, Lua, Python, C#, GDScript):
  - Inequality (`!==`, `~=`, `!=`) is lowered as `math/not(math/eq(a, b))` with the correct operand type. It was lowered as a bool `math/xor`, so `x !== 3` computed `x xor true`. Emitters no longer print bool `math/xor` as an inequality operator (`m.xor(a, b)`).
  - Pointer templates: `{name}` parameters take a ref and `[name]` an int; a mismatch is now a compile error (GI131 / GL131 / GP131 / GC131 / GG131) with a hint instead of a silent no-write.
  - `rt.vars(...)` / `rt.events(...)` (and the Lua/Python/C#/GDScript equivalents) may be omitted when empty.
- GIscript: block-scoped temps (GI190 no longer fires for same-named temps in different blocks); `params.<field>` works in `onSelect` / `onHoverIn` / `onHoverOut` handlers, and using the whole params object is error GI132.
- **Breaking:** `exportGraph` writes the variable's user-facing name as `name` instead of `id` (`importGraph` reads `name ?? id`). Consumers that read `variables[i].id` from exported graphs must read `name ?? id`.
- Corpus upgrade to Khronos f99d9b6 (158 tests): omitted literal values, invalid configuration, unsupported-extension ops, event value sockets beyond the standard four, exact `-0` and denormal literals in emitters/parsers, variable `name` (reads `name ?? id`, writes `name`). Runtime semantics: see @gltfi/runtime 0.1.1.

## 0.2.0

- Runtime tolerates omitted graph arrays and honors `KHR_interactivity.graph`.
