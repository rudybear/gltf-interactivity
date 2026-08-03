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
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
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

// ---------------------------------------------------------------------------
// Shared `dotnet gltfi-harness-cs.dll` process bridge. Originally lived only
// in packages/conformance/src/run-compiled-cs.ts (findDotnetBin/
// ensureHarnessBuilt/class CsSession); factored out here so @gltfi/parse-cs's
// own session.ts (which needs the exact same "find `dotnet`, build the
// harness if the source tree changed, then talk to ONE persistent harness
// process over a synchronous mkfifo-backed request/response bridge" dance —
// see run-compiled-cs.ts's own header comment for the full rationale on why
// two named pipes opened O_RDWR are needed for a genuinely blocking round
// trip out of Node's fundamentally-async child_process pipes, the same
// reasoning packages/parse-py/src/session.ts's AstSession documents for its
// own Python-harness counterpart) can reuse it verbatim instead of
// maintaining a second copy. run-compiled-cs.ts itself now imports
// findDotnetBin/ensureHarnessBuilt/CsHarnessSession from here too, rather
// than keeping its own now-redundant local copies.
// ---------------------------------------------------------------------------

export function findDotnetBin(): string {
  const fromEnv = process.env.GLTFI_DOTNET;
  if (fromEnv) {
    return fromEnv;
  }
  // Common install locations not always on a non-interactive shell's PATH
  // (e.g. the user-level SDK install under ~/.dotnet).
  const candidates = ["dotnet", path.join(os.homedir(), ".dotnet", "dotnet"), "/usr/local/share/dotnet/dotnet", "/usr/lib/dotnet/dotnet"];
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["--version"], { stdio: ["ignore", "ignore", "ignore"] });
      return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error("could not find a `dotnet` executable (set GLTFI_DOTNET to its path)");
}

// Builds GltfiRuntime.csproj (which also produces the Harness.cs/Program.cs
// executable) in Release configuration, once, iff the source tree's
// fingerprint changed since the last successful build.
export function ensureHarnessBuilt(dotnetBin: string): void {
  if (!needsBuild()) {
    return;
  }
  console.error("gltfi-harness-cs: source changed (or no prior build) -- running `dotnet build -c Release`...");
  execFileSync(dotnetBin, ["build", CSPROJ_PATH, "-c", "Release"], { stdio: "inherit" });
  writeBuildMarker(hashCsSources());
}

// Generic, synchronous FIFO-backed session with ONE persistent `dotnet
// gltfi-harness-cs.dll` process, speaking the harness's line-delimited-JSON
// protocol (see Harness.cs's own header for the full command list) —
// command-agnostic (unlike run-compiled-cs.ts's own CsEngineLike wrapper,
// this class has no opinion on which commands get sent; it's just the
// transport). Any caller (a conformance runner driving "load"/"reset"/
// "advance"/..., @gltfi/parse-cs's session.ts driving "ast") constructs one
// and calls `request()`.
export class CsHarnessSession {
  private readonly reqWriteFd: number;
  private readonly respReadFd: number;
  private readonly child: ChildProcess;
  private readonly tmpDir: string;
  private buf: Buffer = Buffer.alloc(0);

  constructor(dotnetBin: string) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-cs-fifo-"));
    const reqPath = path.join(this.tmpDir, "req.fifo");
    const respPath = path.join(this.tmpDir, "resp.fifo");
    execFileSync("mkfifo", [reqPath]);
    execFileSync("mkfifo", [respPath]);

    // Opened O_RDWR ("r+") specifically so this open call can never block —
    // see this file's header note. Handed to the child as its stdin/stdout,
    // then closed here once the child owns its own copies.
    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(dotnetBin, [HARNESS_DLL_PATH], {
      stdio: [spawnReqFd, spawnRespFd, "inherit"]
    });
    fs.closeSync(spawnReqFd);
    fs.closeSync(spawnRespFd);

    // Fresh fds for OUR OWN use — distinct opens from the ones just handed
    // to the child and closed above, all pointing at the same two FIFO
    // paths on disk.
    this.reqWriteFd = fs.openSync(reqPath, "r+");
    this.respReadFd = fs.openSync(respPath, "r+");
  }

  private readLine(): string {
    const chunk = Buffer.alloc(1 << 16);
    for (;;) {
      const idx = this.buf.indexOf(10);
      if (idx !== -1) {
        const line = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        return line;
      }
      const n = fs.readSync(this.respReadFd, chunk, 0, chunk.length, null);
      if (n === 0) {
        throw new Error("dotnet harness process closed its output unexpectedly (it may have crashed — check stderr above)");
      }
      this.buf = Buffer.concat([this.buf, chunk.subarray(0, n)]);
    }
  }

  request(req: Record<string, unknown>): Record<string, unknown> {
    fs.writeSync(this.reqWriteFd, Buffer.from(`${JSON.stringify(req)}\n`, "utf8"));
    const resp = JSON.parse(this.readLine()) as Record<string, unknown>;
    if (!resp.ok) {
      const reason = typeof resp.traceback === "string" ? `${String(resp.error)}\n${resp.traceback}` : String(resp.error);
      throw new Error(reason);
    }
    return resp;
  }

  dispose(): void {
    try {
      fs.closeSync(this.reqWriteFd);
    } catch {
      /* already closed */
    }
    try {
      fs.closeSync(this.respReadFd);
    } catch {
      /* already closed */
    }
    this.child.kill();
    try {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}
