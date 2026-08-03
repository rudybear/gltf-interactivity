// Compiled-C#-engine conformance runner: GLB -> importGraph -> emitModuleCs
// -> spawn ONE persistent `dotnet gltfi-harness-cs.dll` harness process for
// the whole run (building it once first, if needed) -> judgeTest via a
// synchronous EngineLike bridge that speaks line-delimited JSON with it.
// Mirrors run-compiled-py.ts's overall shape (GLB -> IR -> emit -> load ->
// judge) and reuses its exact FIFO-bridge trick unmodified (see that file's
// own header for the full rationale: judgeTest calls every EngineLike
// method SYNCHRONOUSLY, but a plain child_process pipe pair is fundamentally
// async, so two mkfifo-backed named pipes opened O_RDWR by this process and
// handed to the child as its stdin/stdout give a genuinely blocking request/
// response round trip).
//
// The one real difference from run-compiled-py.ts: there is no `python3`
// already on PATH able to just `import` a plain source file — the harness
// itself is a compiled .NET executable that must be BUILT before it can be
// spawned at all. That build is expensive (a few seconds) but the SOURCE
// TREE rarely changes between runs, so @gltfi/runtime-cs's needsBuild()/
// hashCsSources() are used to skip rebuilding when nothing under src/cs
// changed since the last successful build (mirrors this task's own
// "rebuild when sources change — hash the src/cs dir" design note).
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModuleCs, EmitError } from "@gltfi/emit-cs";
import { CSPROJ_PATH, HARNESS_DLL_PATH, hashCsSources, needsBuild, readBuildMarker, writeBuildMarker } from "@gltfi/runtime-cs";
import type { EngineLike, SentEvent } from "@gltfi/runtime-lib";
import type { Value, ValueType } from "@gltfi/kernel";
import { loadTestAssets } from "./assets.js";
import { judgeTest, type TestJson } from "./protocol.js";

function parseArgs(argv: string[]): { filter?: string } {
  const out: { filter?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--filter") {
      out.filter = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function findDotnetBin(): string {
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
function ensureHarnessBuilt(dotnetBin: string): void {
  if (!needsBuild()) {
    return;
  }
  console.error("gltfi-harness-cs: source changed (or no prior build) -- running `dotnet build -c Release`...");
  execFileSync(dotnetBin, ["build", CSPROJ_PATH, "-c", "Release"], { stdio: "inherit" });
  writeBuildMarker(hashCsSources());
  void readBuildMarker; // (available for callers that want to inspect the marker; unused here beyond the write above)
}

// ---------------------------------------------------------------------------
// Wire encoding: mirrors Harness.cs's EncodeNum/DecodeNum exactly (and, in
// turn, harness.py's enc_num/dec_num — see either file's own header).
// ---------------------------------------------------------------------------

function encNum(x: number): number | string {
  if (Number.isNaN(x)) return "NaN";
  if (x === Infinity) return "Infinity";
  if (x === -Infinity) return "-Infinity";
  return x;
}

function decNum(x: unknown): number {
  if (x === "NaN") return NaN;
  if (x === "Infinity") return Infinity;
  if (x === "-Infinity") return -Infinity;
  return Number(x);
}

// ---------------------------------------------------------------------------
// Synchronous FIFO-backed session with ONE persistent `dotnet gltfi-
// harness-cs.dll` process — see this file's header for the full rationale.
// ---------------------------------------------------------------------------

class CsSession {
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

    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(dotnetBin, [HARNESS_DLL_PATH], {
      stdio: [spawnReqFd, spawnRespFd, "inherit"]
    });
    fs.closeSync(spawnReqFd);
    fs.closeSync(spawnRespFd);

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

class CsEngineLike implements EngineLike {
  private cachedTime = 0;

  constructor(private readonly session: CsSession) {}

  start(): void {
    const resp = this.session.request({ cmd: "start" });
    this.cachedTime = decNum(resp.time);
  }

  advance(dt: number): void {
    const resp = this.session.request({ cmd: "advance", dt: encNum(dt) });
    this.cachedTime = decNum(resp.time);
  }

  getVariableByIndex(index: number): Value {
    const resp = this.session.request({ cmd: "get_var", i: index });
    const type = resp.type as ValueType;
    const raw = resp.data as unknown[];
    if (type === "bool") {
      return { type, data: raw.map((v) => Boolean(v)) };
    }
    if (type === "ref") {
      return { type, data: raw.map((v) => String(v)) };
    }
    return { type, data: raw.map((v) => decNum(v)) };
  }

  get variableCount(): number {
    return Number(this.session.request({ cmd: "variable_count" }).count);
  }

  get sentEvents(): readonly SentEvent[] {
    const events = this.session.request({ cmd: "sent_events" }).events as Array<{ eventIndex: number; payload: unknown[] }>;
    return events.map((e) => ({
      eventIndex: e.eventIndex,
      payload: [Boolean(e.payload[0]), decNum(e.payload[1]), decNum(e.payload[2]), decNum(e.payload[3])] as [
        boolean,
        number,
        number,
        number
      ]
    }));
  }

  get time(): number {
    return this.cachedTime;
  }

  get eventDefaults(): readonly (number | undefined)[] {
    const defaults = this.session.request({ cmd: "event_defaults" }).defaults as Array<unknown>;
    return defaults.map((d) => (d === null || d === undefined ? undefined : decNum(d)));
  }
}

type RunOutcome = { ok: true } | { ok: false; kind: "SKIP" | "FAIL"; reason: string };

function runOne(session: CsSession, asset: { name: string; glbPath: string; testPath: string }): RunOutcome {
  let code: string;
  let gltfJson: unknown;
  let binB64: string | null;
  let testJson: TestJson;
  try {
    const probe = createRuntimeFromGlbFile(asset.glbPath);
    const { module, diagnostics } = importGraph(probe.graph as unknown as IrGraph);
    const importErrors = diagnostics.filter((d) => d.severity === "error");
    if (importErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `import errors: ${JSON.stringify(importErrors)}` };
    }
    const checkErrors = checkModule(module).filter((d) => d.severity === "error");
    if (checkErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `check errors: ${JSON.stringify(checkErrors)}` };
    }
    ({ code } = emitModuleCs(module));
    gltfJson = probe.gltf ?? null;
    binB64 = probe.glbBin ? Buffer.from(probe.glbBin.buffer, probe.glbBin.byteOffset, probe.glbBin.byteLength).toString("base64") : null;
    testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
  } catch (err) {
    const reason = err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err);
    return { ok: false, kind: err instanceof EmitError ? "SKIP" : "FAIL", reason };
  }

  let loaded = false;
  try {
    const result = judgeTest(() => {
      if (!loaded) {
        session.request({ cmd: "load", source: code, gltf: gltfJson, bin_b64: binB64 });
        loaded = true;
      } else {
        session.request({ cmd: "reset" });
      }
      return new CsEngineLike(session);
    }, testJson);
    if (!result.ok) {
      return { ok: false, kind: "FAIL", reason: result.failures.join("\n  - ") };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, kind: "FAIL", reason: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const { filter } = parseArgs(process.argv.slice(2));
  const assets = loadTestAssets(undefined, filter);
  const dotnetBin = findDotnetBin();
  ensureHarnessBuilt(dotnetBin);
  const session = new CsSession(dotnetBin);
  let failures = 0;
  let skips = 0;
  try {
    for (const asset of assets) {
      const outcome = runOne(session, asset);
      if (outcome.ok) {
        console.log(`PASS ${asset.name}`);
        continue;
      }
      if (outcome.kind === "SKIP") {
        skips += 1;
        console.error(`SKIP ${asset.name}`);
        console.error(`  - ${outcome.reason}`);
      } else {
        failures += 1;
        console.error(`FAIL ${asset.name}`);
        console.error(`  - ${outcome.reason}`);
      }
    }
  } finally {
    session.dispose();
  }
  console.log(`${assets.length} tests, ${assets.length - failures - skips} passed, ${failures} failed, ${skips} skipped.`);
  if (failures > 0 || skips > 0) {
    process.exit(1);
  }
  console.log(`All ${assets.length} tests passed.`);
}

main();
