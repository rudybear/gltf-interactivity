// TS-side index for @gltfi/runtime-cs: exports filesystem paths to the C#
// runtime sources (src/cs/*.cs — Engine/M/KMath/Numeric/State/Scheduler/
// Pointer/Animation/JsonUtil) and its .csproj (GltfiRuntime.csproj, which
// also builds the persistent Harness.cs/Program.cs conformance-runner
// executable, AssemblyName `gltfi-harness-cs`), plus a small helper for
// deciding whether packages/conformance/src/run-compiled-cs.ts needs to
// rebuild it (hash every .cs file's mtime+size — cheap, no need to read
// full file contents — and compare against a marker file dropped next to
// the last successful build's output).
//
// Unlike @gltfi/runtime-py (a real `python3` subprocess just imports plain
// files off PYTHONPATH directly, nothing to build) or @gltfi/runtime-lua
// (Lua sources bundled as a TS string constant at build time), this backend
// needs an actual `dotnet build` step before its harness executable exists
// at all — see run-compiled-cs.ts's own header for the caching strategy
// this enables (build once per source-tree-hash, not once per test).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const CS_SRC_DIR: string = path.resolve(import.meta.dirname, "../src/cs");
export const CSPROJ_PATH: string = path.join(CS_SRC_DIR, "GltfiRuntime.csproj");

// `dotnet build -c Release` (no explicit -o) drops its output under
// bin/<Configuration>/<TargetFramework>/ relative to the project file —
// matches GltfiRuntime.csproj's own <TargetFramework>net8.0</...>.
export const BUILD_OUTPUT_DIR: string = path.join(CS_SRC_DIR, "bin", "Release", "net8.0");
export const HARNESS_DLL_PATH: string = path.join(BUILD_OUTPUT_DIR, "gltfi-harness-cs.dll");
const HASH_MARKER_PATH: string = path.join(BUILD_OUTPUT_DIR, ".src-hash");

// Cheap content-independent-ish fingerprint (name + mtime + size per .cs
// file, sorted) — good enough to detect "did any source file change since
// the last successful build", the only question the caller needs answered;
// not a cryptographic integrity check.
export function hashCsSources(): string {
  const files = fs
    .readdirSync(CS_SRC_DIR)
    .filter((f) => f.endsWith(".cs") || f.endsWith(".csproj"))
    .sort();
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    const full = path.join(CS_SRC_DIR, file);
    const stat = fs.statSync(full);
    hash.update(`${file}:${stat.mtimeMs}:${stat.size}\n`);
  }
  return hash.digest("hex");
}

export function readBuildMarker(): string | null {
  try {
    return fs.readFileSync(HASH_MARKER_PATH, "utf8").trim();
  } catch {
    return null;
  }
}

export function writeBuildMarker(hash: string): void {
  fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(HASH_MARKER_PATH, hash, "utf8");
}

// True when a build is needed: the harness DLL is missing, or the source
// tree's fingerprint no longer matches the last successful build's marker.
export function needsBuild(): boolean {
  if (!fs.existsSync(HARNESS_DLL_PATH)) {
    return true;
  }
  return readBuildMarker() !== hashCsSources();
}
