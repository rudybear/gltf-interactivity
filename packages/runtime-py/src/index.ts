// TS-side index for @gltfi/runtime-py: exports filesystem paths to the
// Python runtime package (src/py/gltfi_runtime) and the harness entry point
// (src/py/harness.py) so packages/conformance/src/run-compiled-py.ts can
// spawn `python3 harness.py` with PYTHONPATH pointed at PYTHON_SRC_DIR.
//
// Unlike @gltfi/runtime-lua (whose Lua sources are bundled as a TS string
// constant — see its build-lua-sources.mjs — because wasmoon needs the
// whole runtime as one in-memory chunk to `doStringSync`), the Python
// sources are shipped as plain files on disk and referenced by path here: a
// real `python3` subprocess just imports them normally off PYTHONPATH, so
// there's nothing to bundle/embed.
import path from "node:path";

export const PYTHON_SRC_DIR: string = path.resolve(import.meta.dirname, "../src/py");
export const HARNESS_PATH: string = path.join(PYTHON_SRC_DIR, "harness.py");
