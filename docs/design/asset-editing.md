# Asset editing design (`gltfi extract`/`gltfi apply`, @gltfi/gltf's container.ts)

`gltfi decompile`/`gltfi compile` are the *language* pivot (graph ↔ script); `gltfi extract`/
`gltfi apply` are the *asset-editing* workflow built on top of them (see the R3 plan's
workstream A) — "decompile a script out of a real asset, edit it, write it back" without
corrupting anything the edit didn't touch. Three problems made the naive version of that loop
lossy, and each has a specific fix:

1. **Variable ids dropped in the code hop.** Events already round-tripped their `id` (a
   `Diagnostic`-free `externalId`/`E.foo`-style field in every emitter); variables didn't —
   `emit-ts` never wrote one out, `parse-ts` never reconstructed one. Fixed in lockstep across
   all five emitters/parsers (R3-A1): each writes a variable's id iff
   `module.variables[i].extras?.id` is present (mirroring `IREvent.id`, which variables now
   get via the generic `extras` bag instead of a dedicated field), and each parser sets that
   `extras.id` iff the source explicitly carries one — never synthesized. Per-language surface:
   TS's `rt.withId("<uuid>", rt.int(0))`, Lua's third `id = "<uuid>"` array-entry key, Python's
   `rt.with_id("<uuid>", rt.int_(0))`, C#'s optional third `DeclareVar` argument, GDScript's
   optional third `["name", rt.int_var(0), "<uuid>"]` element.

2. **No byte-preserving write path.** `parseGlb`/`writeGlb` (index.ts) discard everything but
   the JSON/BIN chunks and always fully re-`JSON.stringify` the document — fine for the viewer,
   fatal for an editing loop (every float in *untouched* geometry reformats, integer-like keys
   can reorder, and any GLB chunk type the loader doesn't recognize is silently dropped).
   `container.ts`'s `parseContainer`/`writeContainer`/`spliceGraph` are a **separate** path
   (existing `parseGlb`/`writeGlb` consumers are untouched) built specifically to avoid all
   three: `parseContainer` keeps every GLB chunk verbatim, in order, alongside the JSON chunk's
   *raw text*; `spliceGraph` replaces exactly the
   `extensions.KHR_interactivity.graphs[N]` array *element* (not the whole `KHR_interactivity`
   object) via a single-pass, string-aware text scanner (`locateJsonSpan`) instead of a full
   reparse/restringify — see that file's own header for the scanner's design. Replacing one
   array element rather than the whole extension object is also what makes the `graph` selector
   key and any sibling `graphs[]` entries survive by construction, with zero special-casing.

3. **The declaration tables (variables/events) had no diff.** `equivalentGraphs`
   (`@gltfi/verify`) walks *reachable node behavior* and never looks at `graph.variables`/
   `graph.events` at all — a variable that's declared but never read, or an id silently dropped
   in an edit, is invisible to it. `compareDeclarations` (R3-A3, same package) is the
   complementary advisory diff an editing loop actually wants: per-variable resolved type/
   initial value/id, per-event id/values/defaults, index by index. It never gates an exit code
   — see `apply`'s report below.

## The splice writer's contract

`spliceGraph(container, graphIndex, newGraphJson)`:

- **Primary path ("splice" mode):** if `extensions.KHR_interactivity.graphs[graphIndex]`
  already has a locatable text span, replace exactly that span with
  `JSON.stringify(newGraphJson)`. Everything else — every byte before the span, every byte
  after it (up to GLB padding — see below), every other GLB chunk in its original position —
  is untouched. `writeContainer` then re-encodes only the JSON chunk's bytes (re-padded to
  4-byte alignment with `0x20`, the existing GLB convention); every other chunk's bytes/type/
  order pass through the round trip verbatim, including chunk types `writeContainer` doesn't
  recognize.
- **Fallback ("reserialize" mode):** if the graph slot doesn't already exist in the text (the
  asset has no `KHR_interactivity` extension yet, or a defensive scanner failure), there is no
  span to splice — this is the *only* path that can add the extension, via a full
  parse-mutate-`JSON.stringify` on the parsed document. The report says so explicitly ("full
  reserialize (byte-preservation not possible; N bytes)") — this is expected and correct for a
  genuinely new asset, not a bug.
- **GLB chunk padding is not "preserved content."** The JSON chunk's trailing `0x20` padding
  bytes are recomputed from the *new* total length on every write — their count legitimately
  differs from the original even when nothing meaningful changed nearby (`packages/cli/test/
  apply.test.ts`'s byte-preservation assertions `trimEnd()` both sides before comparing the
  span's suffix for exactly this reason).
- **`spliceGraph` is the first codepath that actually `JSON.stringify`s an exported graph.**
  Every prior consumer of `exportGraph`'s output (the interpreter, `gltfi roundtrip`'s judge)
  used it as a plain in-memory JS object — so a real, previously-latent bug went unnoticed until
  `apply`'s full-corpus test mode (`GLTFI_APPLY_FULL=1`) exercised it: `exportGraph` left
  non-finite literals (`NaN`/`Infinity`/`-Infinity`) as real JS numbers in every `value:` array
  it returned, and plain `JSON.stringify` silently collapses those to `null` with no error.
  Fixed at the source (`@gltfi/kernel`'s `formatValueArray`, the exact inverse of
  `parseScalar` — which `@gltfi/ir/import.ts` already uses on the way in — applied at
  `export.ts`'s three literal-materializing sites), not papered over in the splice writer,
  since `gltfi compile`'s plain-`JSON.stringify` write path had the identical exposure. See
  `packages/ir/test/export.test.ts`'s regression tests.

## `gltfi extract` / `gltfi apply`

```
gltfi extract <asset> [-o out] [--lang ts|lua|py|cs|gd] [--graph N] [--force]
gltfi apply <asset> <script> [--graph N] [--lang ts|lua|py|cs|gd] [--dry-run] [--backup]
```

`extract`: `parseContainer` → `extractGraph(json, N)` → `importGraph` → `checkModule` (errors
are fatal here — stricter than `decompile`, which only gates on import errors) → the chosen
language's emitter → write the script. Deliberately writes **no** `.names.json` sidecar: once
ids round-trip in-source (point 1 above), the sidecar `decompile` writes for its own use case
is redundant for this workflow.

`apply`: parse the script → `exportGraph` → `validateGraph` (hard gate: on error, print
diagnostics, exit 1, write nothing) → build the **full** report (below) *before any write* →
`--dry-run` stops here → `spliceGraph` + atomic write (same-directory temp file + rename;
`--backup` copies the original to `<asset>.bak` first). Exit code is nonzero on a validation/
splice failure or a FAIL interpreter-judge verdict on the *new* graph — in that last case the
asset is still written and the report says so explicitly. The declaration diff is advisory only
and never affects the exit code.

### Report format

```
apply: parsed behavior.lua (lua)
validate: OK
declarations vs graphs[0]:  variables: unchanged (3)
                            events[1].values.expectedDuration: default 1 -> 2
graph equivalence: EQUIV | DIVERGED — <firstDivergence>
interpreter judge: old PASS / new PASS | skipped (no test-Json sibling)
splice: extensions.KHR_interactivity.graphs[0] (4812 -> 4903 bytes) | full reserialize (…)
wrote scene.glb (backup: scene.glb.bak) | dry-run: no changes written
```

The judge line reuses `gltfi roundtrip`'s own engine wiring (`interpEngineFromRuntime` +
`judgeTest` + `findTestJsonSibling`) unchanged — same oracle-discovery convention, same
pass/fail semantics, just judging the *asset's existing* graph against the newly-exported one
instead of an in-memory round trip. When the asset has no graph at the target index yet (a
fresh/no-interactivity asset), the declarations/equivalence lines say so explicitly instead of
diffing against nothing.

### The lang table is lazy on purpose

`packages/cli/src/lang.ts`'s five entries are each loaded via a *dynamic* `import()`, not a
static one — `@gltfi/parse-cs` lazily spawns a persistent `dotnet` subprocess harness the first
time it's actually called, and `@gltfi/parse-py` does the same with `python3`. A static import
of all five emit-*/parse-* packages at CLI startup would defeat that laziness (ESM module
evaluation happens at import time) and make every invocation pay dotnet's spawn latency even
for a plain TypeScript script. `.cs` scripts require `dotnet` on `PATH`; `.py` scripts require
`python3`.

## `gltfi compile --merge-into`: what changed, what didn't

The pre-existing `--merge-into` bug: it replaced the *whole* `KHR_interactivity` extension
object, silently deleting the `graph` selector key (present on essentially every corpus asset)
and any `graphs[]` entry other than 0. The minimal fix (this milestone): preserve every sibling
key on the extension object and replace only `graphs[0]` in place. What's **not** fixed — this
path still goes through `writeGlb`'s full re-stringify (floats reformat, unrecognized GLB
chunks are dropped), because `compile` has no existing script to `extract` from in the first
place; it's compiling a *brand-new* script into a base asset. `gltfi apply` is the byte-
preserving, id-stable tool for editing an asset that already has a script to iterate on —
`compile --merge-into` now prints a warning recommending it for that case.
