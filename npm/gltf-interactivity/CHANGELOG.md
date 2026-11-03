# Changelog

## 0.3.0

Packaging changes (the 0.2.0 install footprint was dominated by `ts-morph`/`typescript`, even for consumers that only use the runtime, IR or verifier).

- `ts-morph` (^23.0.0) and `luaparse` (^0.3.1) are now **optional peer dependencies** instead of dependencies. Install them only to parse TypeScript / Lua (`./parse/ts`, `./parse/lua`, and the CLI's `compile`, `apply`, `roundtrip` with those languages). No entry other than `./parse/ts` / `./parse/lua` loads them; the build fails if that ever changes.
- The CLI prints a friendly "needs the optional peer dependency" message (exit 1, no stack trace) when a parser peer is missing; the TypeScript parser is now loaded lazily.
- `./runtime` and `./runtime/node` are now thin re-exports of the new regular dependency `@gltfi/runtime` (^0.1.1). The CLI and conformance adapter use it too, so exactly one interpreter implementation is installed. `InteractivityRuntime` from `gltf-interactivity/runtime` is identical to the one from `@gltfi/runtime`.
- Added classic `main` and top-level `types` fields (keeping `exports`).
- Parser fixes: see TODO (to be filled in).

## 0.2.0

- Runtime tolerates omitted graph arrays and honors `KHR_interactivity.graph`.
