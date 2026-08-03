// Compiled-GDScript-engine conformance runner: GLB -> importGraph ->
// emitModuleGd -> spawn ONE persistent `godot --headless` harness process
// for the whole run -> judgeTest via a synchronous EngineLike bridge that
// speaks line-delimited JSON with it. Mirrors run-compiled-py.ts's/
// run-compiled-cs.ts's overall shape (GLB -> IR -> emit -> load -> judge)
// and reuses their exact FIFO-bridge trick (two named pipes opened O_RDWR by
// THIS process, handed to the child as its stdin/stdout — see either file's
// header for the full rationale: judgeTest, protocol.ts, calls every
// EngineLike method SYNCHRONOUSLY, but a plain child_process pipe pair is
// fundamentally async).
//
// ONE genuine difference from every other backend's session, forced by a
// real empirical finding (see the task report's "no try/catch" finding):
// GDScript has no exception-handling construct at all, so unlike
// harness.py/Harness.cs (which wrap every command dispatch and turn ANY
// exception into an ordinary `{"ok":false}` response), a single runtime
// error inside harness.gd/engine.gd/m.gd/pointer.gd/etc — an out-of-bounds
// Array access, say — prints one `SCRIPT ERROR` line to stderr and then
// NEVER RETURNS, leaving the whole Godot process idling forever with no
// response coming down the FIFO (confirmed by probe: this is also what an
// unguarded int-by-zero division does). A plain blocking `fs.readSync` has
// no timeout parameter, so GdSession's `respReadFd` is opened O_NONBLOCK
// instead, and `readLine()` polls it against a wall-clock deadline (10s per
// request — enormous headroom over the sub-millisecond cost every
// legitimate command actually takes; only a genuine hang should ever hit
// it), sleeping between poll attempts via `Atomics.wait` on a scratch
// `SharedArrayBuffer` (a well-known synchronous-sleep primitive — keeps
// this whole bridge synchronous, which judgeTest's contract requires, while
// not busy-spinning the CPU). On timeout (or the child process having
// exited/crashed), the session is marked unhealthy; `main()`'s loop
// respawns a fresh child before the NEXT asset, so one asset's hang costs
// that one asset a FAIL, never the other 144.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModuleGd, EmitError } from "@gltfi/emit-gd";
import { GD_SRC_DIR, HARNESS_PATH } from "@gltfi/runtime-gd";
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

// ---------------------------------------------------------------------------
// Wire encoding: mirrors harness.gd's enc_num/dec_num exactly (same
// NaN/Infinity/-Infinity string-sentinel convention every other backend's
// runner uses — plain JSON can't represent those tokens).
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
// Synchronous FIFO-backed session with ONE persistent `godot --headless`
// process, with a poll+deadline read loop (see this file's header) instead
// of every other backend's plain blocking read, plus respawn() for when
// that deadline (or an outright process exit) is hit.
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 5;

class GdSession {
  private readonly godotBin: string;
  private reqWriteFd = -1;
  private respReadFd = -1;
  private child: ChildProcess | null = null;
  private readonly tmpDir: string;
  private buf: Buffer = Buffer.alloc(0);
  private healthy = true;

  constructor(godotBin: string) {
    this.godotBin = godotBin;
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-gd-fifo-"));
    this.spawnChild();
  }

  private spawnChild(): void {
    const reqPath = path.join(this.tmpDir, "req.fifo");
    const respPath = path.join(this.tmpDir, "resp.fifo");
    try {
      fs.rmSync(reqPath, { force: true });
      fs.rmSync(respPath, { force: true });
    } catch {
      /* first spawn — nothing to remove yet */
    }
    execFileSync("mkfifo", [reqPath]);
    execFileSync("mkfifo", [respPath]);

    // Opened O_RDWR ("r+") specifically so this open call can never block —
    // see this file's header note. Handed to the child as its stdin/stdout
    // (ordinary BLOCKING fds — only OUR OWN respReadFd copy, opened
    // separately below, is non-blocking), then closed here once the child
    // owns its own copies.
    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(
      this.godotBin,
      ["--headless", "--no-header", "--path", GD_SRC_DIR, "--script", "res://harness.gd"],
      { stdio: [spawnReqFd, spawnRespFd, "inherit"] }
    );
    fs.closeSync(spawnReqFd);
    fs.closeSync(spawnRespFd);

    // Fresh fds for OUR OWN use — distinct opens from the ones just handed
    // to the child and closed above, all pointing at the same two FIFO
    // paths on disk. respReadFd is O_NONBLOCK so readLine() can poll it
    // against a deadline instead of blocking forever (see header note).
    this.reqWriteFd = fs.openSync(reqPath, "r+");
    this.respReadFd = fs.openSync(respPath, fs.constants.O_RDWR | fs.constants.O_NONBLOCK);
    this.buf = Buffer.alloc(0);
    this.healthy = true;
  }

  isHealthy(): boolean {
    return this.healthy && this.child !== null && this.child.exitCode === null && this.child.signalCode === null;
  }

  // Recreates the child process + FIFOs from scratch — called by main()'s
  // loop right after a session goes unhealthy (a timed-out request or a
  // crashed child), before moving on to the NEXT asset.
  respawn(): void {
    this.disposeChildAndFds();
    this.spawnChild();
  }

  private static sleep(ms: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  }

  private readLine(deadline: number): string {
    const chunk = Buffer.alloc(1 << 16);
    for (;;) {
      const idx = this.buf.indexOf(10);
      if (idx !== -1) {
        const line = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        return line;
      }
      if (!this.isHealthy()) {
        this.healthy = false;
        throw new Error("godot harness process exited/crashed unexpectedly (check stderr above)");
      }
      if (Date.now() >= deadline) {
        this.healthy = false;
        throw new Error(
          `godot harness process did not respond within ${REQUEST_TIMEOUT_MS}ms (GDScript has no exception handling — a runtime error inside the compiled module or the runtime itself likely hung the process; see run-compiled-gd.ts's header note)`
        );
      }
      try {
        const n = fs.readSync(this.respReadFd, chunk, 0, chunk.length, null);
        if (n === 0) {
          this.healthy = false;
          throw new Error("godot harness process closed its output unexpectedly (it may have crashed — check stderr above)");
        }
        this.buf = Buffer.concat([this.buf, chunk.subarray(0, n)]);
      } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code === "EAGAIN") {
          GdSession.sleep(POLL_INTERVAL_MS);
          continue;
        }
        throw err;
      }
    }
  }

  // Sends one request, blocks (with a timeout — see header) for the
  // matching one-line JSON response, and throws on `{"ok":false}` —
  // callers never need to check `.ok` themselves.
  request(req: Record<string, unknown>): Record<string, unknown> {
    if (!this.isHealthy()) {
      throw new Error("godot harness session is not healthy (previous request timed out or the process crashed) — call respawn() first");
    }
    fs.writeSync(this.reqWriteFd, Buffer.from(`${JSON.stringify(req)}\n`, "utf8"));
    const resp = JSON.parse(this.readLine(Date.now() + REQUEST_TIMEOUT_MS)) as Record<string, unknown>;
    if (!resp.ok) {
      throw new Error(String(resp.error));
    }
    return resp;
  }

  private disposeChildAndFds(): void {
    try {
      if (this.reqWriteFd >= 0) fs.closeSync(this.reqWriteFd);
    } catch {
      /* already closed */
    }
    try {
      if (this.respReadFd >= 0) fs.closeSync(this.respReadFd);
    } catch {
      /* already closed */
    }
    this.reqWriteFd = -1;
    this.respReadFd = -1;
    this.child?.kill("SIGKILL");
    this.child = null;
  }

  dispose(): void {
    this.disposeChildAndFds();
    try {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

// Wraps the persistent session as an EngineLike for ONE test — judgeTest
// (protocol.ts) is written entirely against this interface and has no idea
// it's talking to a Godot subprocess. `time` is cached from every
// start()/advance() response, same as every other backend's *EngineLike.
class GdEngineLike implements EngineLike {
  private cachedTime = 0;

  constructor(private readonly session: GdSession) {}

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

function runOne(session: GdSession, asset: { name: string; glbPath: string; testPath: string }): RunOutcome {
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
    ({ code } = emitModuleGd(module));
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
      return new GdEngineLike(session);
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
  const godotBin = process.env.GLTFI_GODOT ?? "godot";
  let session = new GdSession(godotBin);
  let failures = 0;
  let skips = 0;
  try {
    for (const asset of assets) {
      const outcome = runOne(session, asset);
      if (outcome.ok) {
        console.log(`PASS ${asset.name}`);
      } else if (outcome.kind === "SKIP") {
        skips += 1;
        console.error(`SKIP ${asset.name}`);
        console.error(`  - ${outcome.reason}`);
      } else {
        failures += 1;
        console.error(`FAIL ${asset.name}`);
        console.error(`  - ${outcome.reason}`);
      }
      // See this file's header note: a hung/crashed GDScript process can't
      // self-report the way every other backend's exception-wrapped harness
      // can — respawn before the NEXT asset so one bad asset never costs
      // the rest of the run.
      if (!session.isHealthy()) {
        session.dispose();
        session = new GdSession(godotBin);
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
