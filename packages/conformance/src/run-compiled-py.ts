// Compiled-Python-engine conformance runner: GLB -> importGraph ->
// emitModulePy -> write generated module to a scratch cache dir -> spawn ONE
// persistent `python3` harness process for the whole run -> judgeTest via a
// synchronous EngineLike bridge that speaks line-delimited JSON with it.
// Mirrors run-compiled-lua.ts's overall shape (GLB -> IR -> emit -> load ->
// judge) but the "load" step is a real OS subprocess instead of an in-
// process VM, which raises one real problem run-compiled-lua.ts never had to
// solve: judgeTest (protocol.ts) calls every EngineLike method SYNCHRONOUSLY
// (no `await` anywhere in its loop), but Node's child_process pipes are
// fundamentally async (non-blocking fds pumped by libuv's event loop) — a
// plain `child.stdin.write()` / `child.stdout.on("data", ...)` pair cannot
// be turned into a blocking round trip without restructuring judgeTest
// itself, which this task must NOT do (it's shared with run-interp.ts/
// run-compiled.ts/run-compiled-lua.ts and is the engine-agnostic protocol
// authority).
//
// The fix: two named pipes (FIFOs, via `mkfifo`) on disk, each opened O_RDWR
// ("r+") by THIS process — opening a POSIX FIFO O_RDWR never blocks
// (unlike a strictly-O_RDONLY or -O_WRONLY open, which blocks until a
// counterpart end is opened), sidestepping any open-ordering/deadlock
// concern entirely. Those two fds are handed to the spawned `python3
// harness.py` as ITS stdin/stdout (via numeric `stdio` entries, which
// `child_process.spawn` dup()s into the child) — so from the Python side,
// it's simply reading/writing its own real `sys.stdin`/`sys.stdout`, exactly
// as harness.py's own docstring describes, with no idea its pipes happen to
// be FIFOs on disk rather than a shell/terminal's ordinary pipes. This
// process then opens FRESH fds on the SAME two FIFO paths for its own use
// (write requests / read responses) — `fs.writeSync`/`fs.readSync` are true
// blocking syscalls in Node (unlike the stream API), giving genuinely
// synchronous request/response semantics good enough for EngineLike.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModulePy, EmitError } from "@gltfi/emit-py";
import { HARNESS_PATH, PYTHON_SRC_DIR } from "@gltfi/runtime-py";
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
// Wire encoding: mirrors harness.py's enc_num/dec_num exactly. Plain JSON
// can't represent NaN/Infinity/-Infinity, and while Python's `json` module
// has a non-standard extension for it, `JSON.parse` here does not accept
// those bare tokens — so every numeric leaf that might carry a non-finite
// KHR_interactivity value crosses the wire as the STRING "NaN" / "Infinity"
// / "-Infinity" instead; finite numbers, bools and ordinary strings (e.g.
// the actual glTF JSON document, `module_path`) are untouched.
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

const VALUE_TYPE_COMPONENT_COUNT: Record<ValueType, number> = {
  bool: 1, int: 1, float: 1, ref: 1,
  float2: 2, float3: 3, float4: 4,
  float2x2: 4, float3x3: 9, float4x4: 16
};
void VALUE_TYPE_COMPONENT_COUNT; // component count is driven by the harness's own response length, not recomputed here.

// ---------------------------------------------------------------------------
// Synchronous FIFO-backed session with ONE persistent `python3 harness.py`
// process — see this file's header for the full rationale.
// ---------------------------------------------------------------------------

class PySession {
  private readonly reqWriteFd: number;
  private readonly respReadFd: number;
  private readonly child: ChildProcess;
  private readonly tmpDir: string;
  private buf: Buffer = Buffer.alloc(0);

  constructor(pythonBin: string) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-py-fifo-"));
    const reqPath = path.join(this.tmpDir, "req.fifo");
    const respPath = path.join(this.tmpDir, "resp.fifo");
    execFileSync("mkfifo", [reqPath]);
    execFileSync("mkfifo", [respPath]);

    // Opened O_RDWR ("r+") specifically so this open call can never block —
    // see header note. Handed to the child as its stdin/stdout (numeric
    // stdio entries get dup()'d into the child's fd table), then closed
    // here once the child owns its own copies.
    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(pythonBin, [HARNESS_PATH], {
      stdio: [spawnReqFd, spawnRespFd, "inherit"],
      env: { ...process.env, PYTHONPATH: PYTHON_SRC_DIR }
    });
    fs.closeSync(spawnReqFd);
    fs.closeSync(spawnRespFd);

    // Fresh fds for OUR OWN use (writing requests / reading responses) —
    // distinct opens from the ones just handed to the child and closed
    // above, all pointing at the same two FIFO paths on disk.
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
        throw new Error("python harness process closed its output unexpectedly (it may have crashed — check stderr above)");
      }
      this.buf = Buffer.concat([this.buf, chunk.subarray(0, n)]);
    }
  }

  // Sends one request, blocks for the matching one-line JSON response, and
  // throws (surfacing the Python traceback in the message) on `{"ok":false}`
  // — callers never need to check `.ok` themselves.
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

// Wraps the persistent session as an EngineLike for ONE test — judgeTest
// (protocol.ts) is written entirely against this interface and has no idea
// it's talking to a Python subprocess. `time` is cached from every
// start()/advance() response instead of a dedicated round trip, since
// judgeTest's own `while (engine.time < deadline)` loop reads it once per
// tick — halving the round-trip count for what's by far the hottest path.
class PyEngineLike implements EngineLike {
  private cachedTime = 0;

  constructor(private readonly session: PySession) {}

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

function sanitizeModuleName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function runOne(session: PySession, cacheDir: string, asset: { name: string; glbPath: string; testPath: string }): RunOutcome {
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
    ({ code } = emitModulePy(module));
    gltfJson = probe.gltf ?? null;
    binB64 = probe.glbBin ? Buffer.from(probe.glbBin.buffer, probe.glbBin.byteOffset, probe.glbBin.byteLength).toString("base64") : null;
    testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
  } catch (err) {
    const reason = err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err);
    return { ok: false, kind: err instanceof EmitError ? "SKIP" : "FAIL", reason };
  }

  const modulePath = path.join(cacheDir, `${sanitizeModuleName(asset.name)}.py`);
  fs.writeFileSync(modulePath, code, "utf8");

  let loaded = false;
  try {
    const result = judgeTest(() => {
      if (!loaded) {
        session.request({ cmd: "load", module_path: modulePath, gltf: gltfJson, bin_b64: binB64 });
        loaded = true;
      } else {
        session.request({ cmd: "reset" });
      }
      return new PyEngineLike(session);
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
  const pythonBin = process.env.GLTFI_PYTHON ?? "python3";
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-py-modules-"));
  const session = new PySession(pythonBin);
  let failures = 0;
  let skips = 0;
  try {
    for (const asset of assets) {
      const outcome = runOne(session, cacheDir, asset);
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
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  console.log(`${assets.length} tests, ${assets.length - failures - skips} passed, ${failures} failed, ${skips} skipped.`);
  if (failures > 0 || skips > 0) {
    process.exit(1);
  }
  console.log(`All ${assets.length} tests passed.`);
}

main();
