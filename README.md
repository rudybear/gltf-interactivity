# glTF Interactivity ↔ Script

A bidirectional transpiler between glTF KHR_interactivity behavior graphs and constrained scripting-language subsets (TypeScript first, then Luau and typed Python), with a spec-conformant interpreter, a compiled-code engine, and a WebGPU viewer. Everything gated on the official Khronos test suite (KhronosGroup/glTF-Test-Assets-Interactivity).

## Status

All core conformance gates pass against the official Khronos test assets (145 tests / 647 sub-tests):

| Gate | Pipeline | Status |
|------|----------|--------|
| V1 Interpreter | graph → interpreter | **145/145** |
| V2 Compiled (TS) | graph → TypeScript → execute | **145/145** |
| V3 Roundtrip (TS) | graph → TypeScript → parse → graph′ → interpreter | **145/145** |
| V2 Compiled (Lua) | graph → Lua → execute (wasmoon) | **145/145** |
| V3 Roundtrip (Lua) | graph → Lua → parse → graph′ → interpreter | **145/145** |
| V2 Compiled (Python) | graph → typed Python → execute (CPython) | **145/145** |
| V3 Roundtrip (Python) | graph → Python → parse → graph′ → interpreter | **145/145** |
| V2 Compiled (C#) | graph → typed C# → execute (Roslyn/dotnet) | **145/145** |
| V3 Roundtrip (C#) | graph → C# → parse → graph′ → interpreter | **145/145** |
| V2 Compiled (GDScript) | graph → GDScript → execute (`godot --headless`) | **145/145** |
| V3 Roundtrip (GDScript) | graph → GDScript → parse → graph′ → interpreter | **145/145** |

The WebGPU viewer (`pnpm dev`) hosts both engines — `?engine=interpreter` (default) or `?engine=compiled` — with click-select and hover bubbling. `pnpm smoke` runs a headless render check (needs a real GPU; software WebGPU in sandboxes can't sustain the swap-chain). All five language backends — TypeScript (`emit-ts`/`parse-ts`/`runtime-lib`), Lua (`emit-lua`/`parse-lua`/`runtime-lua`, executed via wasmoon), typed Python (`emit-py`/`parse-py`/`runtime-py`, executed via CPython), typed C# (`emit-cs`/`parse-cs`/`runtime-cs`, compiled and executed via Roslyn/`dotnet`), and GDScript (`emit-gd`/`parse-gd`/`runtime-gd`, executed via a real `godot --headless` subprocess) — share one IR, one op registry, and one op-naming convention; cross-parser tests assert all five frontends produce identical IR. GDScript is the one backend with no language-native parser to reuse (Godot 4.3 exposes no public GDScript AST API), so `@gltfi/parse-gd` is a small hand-rolled, zero-dependency tokenizer/recursive-descent parser over exactly the subset `emit-gd` emits — see that package's own header for the (brief) `tree-sitter-gdscript` evaluation that led to this design, and `docs/diagnostics.md`'s `GG1xx` section for its diagnostic codes.

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
gltfi extract <in.glb|in.gltf> [-o out] [--lang ts|lua|py|cs|gd] [--graph N] [--force] # graph -> script in any of the five languages
gltfi apply <asset> <script> [--graph N] [--lang ts|lua|py|cs|gd] [--dry-run] [--backup] # script -> byte-preserving splice back into asset
gltfi roundtrip <in.glb|in.gltf> [--graph N]                       # decompile -> compile in memory; equivalentGraphs + interpreter judge verdict
gltfi verify-equal <a.gltf|glb> <b.gltf|glb> [--graph-a N] [--graph-b N] # equivalentGraphs verdict with first-divergence path
gltfi conform <interp|compiled|roundtrip> [--filter x]             # thin wrapper spawning the corresponding conf: runner
```

Diagnostics from every stage print to stderr; see `docs/diagnostics.md` for what each code means. Run `gltfi --help` for the full usage summary. `packages/cli/test/cli.test.ts` exercises decompile/compile/roundtrip/verify-equal/conform against real corpus assets by invoking the built `dist/main.js` via `child_process`, so `pnpm build` must run before `pnpm test`.

### `extract`/`apply`: the byte-preserving edit workflow

`decompile`/`compile` round-trip through TypeScript only, and `compile --merge-into` fully
re-stringifies the target asset (floats reformat, unrecognized GLB chunks drop). `extract`/
`apply` are the safe "decompile a script out of a real asset, edit it, write it back" loop —
byte-identical outside the edited graph, and id-stable across the edit (every backend now
round-trips a variable's declared id, not just events' — see `docs/design/asset-editing.md`):

```bash
gltfi extract scene.glb --lang lua          # -> scene.lua, beside the asset
$EDITOR scene.lua
gltfi apply scene.glb scene.lua --backup    # splices graphs[0] back in; scene.glb.bak keeps the original
```

`apply` prints a stable report *before* writing anything — a declaration diff against the
asset's existing graph, `equivalentGraphs`'s structural verdict, an interpreter-judge PASS/FAIL
(reusing `roundtrip`'s own oracle-discovery convention) old vs. new, and the splice's byte
counts:

```
apply: parsed xor.lua (lua)
validate: OK
declarations vs graphs[0]:  variables[0]: initial false -> true
                            events: unchanged (3)
graph equivalence: EQUIV
interpreter judge: old PASS / new PASS
splice: extensions.KHR_interactivity.graphs[0] (12789 -> 10805 bytes)
wrote xor.glb (backup: xor.glb.bak)
```

`.cs` scripts need `dotnet` on `PATH` (`@gltfi/parse-cs`'s AST harness); `.py` scripts need
`python3`. Both are loaded lazily — only the language actually used ever spawns a subprocess.
`packages/cli/test/apply.test.ts` covers all five languages against a representative corpus
subset (`GLTFI_APPLY_FULL=1` runs the full ~145-asset corpus per language instead), plus
synthetic fixtures for an unrecognized GLB chunk, a UUID variable id, a no-interactivity asset,
and the `--dry-run`/`--backup` flags.

## Examples

[`examples/`](examples/README.md) has nine worked examples generated straight from the official Khronos conformance corpus (`pnpm gen:examples`) — flow control, math, variable interpolation, object-model pointers, custom events, and animation playback. Each example directory holds the same `KHR_interactivity` behavior graph as `graph.json` (raw extension JSON) *and* as `behavior.ts`/`behavior.lua`/`behavior.py`/`behavior.cs`/`behavior.gd` — all six decompiled from, and behaviorally equivalent to, one another; each script round-trips back to an equivalent graph (TS via `gltfi compile`; every language has a conformance-gated round-trip pipeline).

A taste — `flow/doN`'s counter loop as emitted to TypeScript (`examples/doN/behavior.ts`):

```ts
function proc49() {
  if (rt.doN(doN2, 2)) {
    V.counter2 = (V.counter2 + 1) | 0;
  }
}
```

See [`examples/README.md`](examples/README.md) for the full index and the same snippet in Lua and Python side by side.

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
- [docs/design/asset-editing.md](docs/design/asset-editing.md) — `gltfi extract`/`gltfi apply`'s byte-preserving splice writer, the id round-trip contract, and the `compile --merge-into` deprecation note.

## License

MIT
