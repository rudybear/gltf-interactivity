// TS-side index for @gltfi/runtime-gd: exports filesystem paths to the
// GDScript runtime package (src/gd) and the harness entry point
// (src/gd/harness.gd) so packages/conformance/src/run-compiled-gd.ts can
// spawn `godot --headless --no-header --path GD_SRC_DIR --script
// res://harness.gd`. Mirrors @gltfi/runtime-py's index.ts exactly (real
// files on disk, referenced by path — nothing to bundle/embed) except the
// consumer is a real Godot subprocess rather than python3, so GD_SRC_DIR
// doubles as the `--path` project root every res://-relative load()/preload()
// call inside the GDScript sources resolves against (see engine.gd's own
// header note on why every *runtime* file can safely use res://-relative
// loads while the dynamically-compiled per-test module never can).
import path from "node:path";

export const GD_SRC_DIR: string = path.resolve(import.meta.dirname, "../src/gd");
export const HARNESS_PATH: string = path.join(GD_SRC_DIR, "harness.gd");
