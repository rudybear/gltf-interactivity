// F8 (upstream fix for a friction item filed against @gltfi/conformance):
// judgeTest (the actual KHR_interactivity conformance-corpus pass/fail
// oracle) and interpEngineFromRuntime (the thin EngineLike adapter over
// @gltfi/runtime's RuntimeGraph judgeTest drives) used to exist only inside
// this package's own source, never re-exported from its main entry or
// reachable as a subpath import — a downstream engine embedder wanting to
// run the judge against their own EngineLike implementation had no
// supported way to get at either without vendoring the source files by
// hand. Both are safe to re-export here (side-effect-free at import time,
// unlike every run-*.ts file in this package, which unconditionally invokes
// its own main() at the top level and must never be imported as a library).
// Also reachable individually as "@gltfi/conformance/protocol" and
// "@gltfi/conformance/interp-adapter" (see package.json's "exports" map)
// for a consumer that wants only one and not this package's full dependency
// graph pulled in transitively.
export * from "./protocol.js";
export * from "./interp-adapter.js";
export * from "./assets.js";
