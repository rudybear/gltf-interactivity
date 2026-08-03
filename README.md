# glTF Interactivity ↔ Script

A bidirectional transpiler between glTF KHR_interactivity behavior graphs and constrained scripting-language subsets (TypeScript first, then Luau and typed Python), with a spec-conformant interpreter, a compiled-code engine, and a WebGPU viewer. Everything gated on the official Khronos test suite (KhronosGroup/glTF-Test-Assets-Interactivity).

## Status

All core conformance gates pass against the official Khronos test assets (145 tests / 647 sub-tests):

| Gate | Pipeline | Status |
|------|----------|--------|
| V1 Interpreter | graph → interpreter | **145/145** |
| V2 Compiled | graph → TypeScript → execute | **145/145** |
| V3 Roundtrip | graph → TypeScript → parse → graph′ → interpreter | **145/145** |

The WebGPU viewer (`pnpm dev`) hosts both engines — `?engine=interpreter` (default) or `?engine=compiled` — with click-select and hover bubbling. `pnpm smoke` runs a headless render check (needs a real GPU; software WebGPU in sandboxes can't sustain the swap-chain). Planned: Luau and typed-Python backends over the same IR.

The V3 roundtrip gate above is execution equivalence (interpreter judges the re-imported/re-exported graph against the same oracle); `@gltfi/verify`'s `equivalentGraphs` additionally reports *structural* equivalence between the original and round-tripped graph as an informational signal (not a gate — see that package's header) — currently **131/145 EQUIV** after canonicalizing the three cosmetic divergence classes documented there (type-table ordering, flow/sequence nesting shape, int/float literal ambiguity); the remaining 14 are explained (cross-handler value materialization duplicating handler roots, or generic-`T` literal round-trip ambiguity) rather than left as unexplained noise.

A differential fuzzer (`pnpm fuzz`) generates small random graphs from a safe op pool and runs each one through both the interpreter and the compiled path, diffing final variable state — see "Fuzzing" below.

## Quickstart

```bash
pnpm install
pnpm fetch:assets
pnpm build
pnpm conf:interp
```

## CLI (`@gltfi/cli`, binary `gltfi`)

```bash
gltfi decompile <in.glb|in.gltf> [-o out.ts] [--js] [--graph N]   # graph -> TS/JS module + <out>.names.json sidecar
gltfi compile <in.ts> [-o out.gltf|out.glb] [--merge-into base.glb] # TS module -> standalone asset, or merged into base.glb
gltfi roundtrip <in.glb|in.gltf> [--graph N]                       # decompile -> compile in memory; equivalentGraphs + interpreter judge verdict
gltfi verify-equal <a.gltf|glb> <b.gltf|glb> [--graph-a N] [--graph-b N] # equivalentGraphs verdict with first-divergence path
gltfi conform <interp|compiled|roundtrip> [--filter x]             # thin wrapper spawning the corresponding conf: runner
```

Diagnostics from every stage print to stderr; see `docs/diagnostics.md` for what each code means. Run `gltfi --help` for the full usage summary. `packages/cli/test/cli.test.ts` exercises all five subcommands against real corpus assets by invoking the built `dist/main.js` via `child_process`, so `pnpm build` must run before `pnpm test`.

## Fuzzing

```bash
pnpm fuzz                        # 200 graphs, fixed default seed
node packages/conformance/dist/fuzz.js --seed 42 --count 500
```

`packages/conformance/src/fuzz.ts` is a seeded differential fuzzer: it generates small (5-30 node) random KHR_interactivity graphs from a curated, registry-checked op pool (`math/*` including `random`, `flow/branch|sequence|for|while|switch` — loops always bounded by construction, never by relying on the interpreter's iteration safety cap — `variable/get|set`, `type/*`), then runs each graph through the interpreter (`@gltfi/runtime`) and the compiled path (`@gltfi/ir` → `@gltfi/emit-ts` → esbuild → `@gltfi/runtime-lib`) for a few ticks and diffs every variable's final value. On a mismatch (or a pipeline error), it writes the repro graph to `fuzz-failures/` and exits non-zero. This has already found and fixed two real bugs: `@gltfi/ir/import.ts` crashing on a `flow/switch`/`math/switch` with exactly one case (a config-array-collapsed-to-scalar bug), and the interpreter's `math/xor` always returning an `int`-typed result even for `bool` inputs.

## Packages

- **@gltfi/kernel**: Core types and utilities
- **@gltfi/gltf**: glTF format handling
- **@gltfi/runtime**: Spec-conformant interpreter runtime
- **@gltfi/ir**: Intermediate representation for behavior graphs
- **@gltfi/emit-ts**: Emit TypeScript code from IR
- **@gltfi/parse-ts**: Parse TypeScript to IR
- **@gltfi/runtime-lib**: Runtime support library
- **@gltfi/verify**: IR verification and validation
- **@gltfi/conformance**: Conformance test suite
- **@gltfi/cli**: Command-line interface
- **@gltfi/viewer**: WebGPU viewer (private)

## Docs

- [docs/diagnostics.md](docs/diagnostics.md) — every `GI`/`GIC`/`GV` diagnostic code, its meaning, and the spec rationale behind it.
- [docs/design/ir-and-transpiler.md](docs/design/ir-and-transpiler.md) — the IR's design principles and the graph ↔ IR ↔ TypeScript pivot.
- [docs/design/op-registry.md](docs/design/op-registry.md) — the kernel op registry's shape and conventions.

## License

MIT
