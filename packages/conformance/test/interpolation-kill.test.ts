// Task #10 cross-engine parity: KHR_interactivity's interpolation-kill
// semantics (variable/set step 2a — setting a variable kills any in-flight
// variable/interpolate targeting it, so that interpolation's own `done` flow
// silently never fires) must produce IDENTICAL tick-by-tick variable state
// across every engine this monorepo ships. All six engines below are fed
// the EXACT SAME @gltfi/ir IRModule: it is built ONCE via importGraph from a
// hand-authored KHR_interactivity graph, then every engine (including the
// interpreter — via exportGraph, deliberately NOT the original hand-built
// graph object) re-derives its own input from THAT module, so a pass here is
// genuine "interpreter vs compiled-backend equivalence" evidence, not six
// independently-approximate re-implementations happening to agree.
//
// Companions: packages/runtime/test/interpolation-kill.test.ts (interpreter
// only, exhaustively covers all three spec rules — variable/set killing
// variable/interpolate, variable/interpolate replacing variable/interpolate,
// pointer/set killing pointer/interpolate — plus the "own writes never
// self-kill" regression) and packages/kernel/test/scheduler.test.ts (same
// three rules at the kernel scheduler API, engine-agnostic). This file only
// exercises rule 1 (variable/set kills variable/interpolate) since that's
// the one rule expressible identically through all six engines' public
// surfaces without any engine-specific pointer/adapter plumbing.
//
// NOTE for whoever reads a failure here: the kill wiring for the lua/py/cs/gd
// runtime ports (packages/runtime-lua|py|cs|gd) was being done by a separate
// agent in parallel with this test's authoring. If one of those four legs
// fails, it is either a genuine remaining gap in that port's wiring (exactly
// the regression this test exists to catch) or an unrelated toolchain issue
// (missing godot/dotnet/python3/wasmoon in this sandbox) — see each engine's
// block below for the exact failure mode to expect from either case.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import * as esbuild from "esbuild";
import { LuaEngine, LuaFactory } from "wasmoon";
import { checkModule, exportGraph, importGraph, type Graph as IrGraph, type IRModule } from "@gltfi/ir";
import { InteractivityRuntime, type Graph as RuntimeGraph } from "@gltfi/runtime";
import { emitModule } from "@gltfi/emit-ts";
import { emitModuleLua } from "@gltfi/emit-lua";
import { emitModulePy } from "@gltfi/emit-py";
import { emitModuleCs } from "@gltfi/emit-cs";
import { emitModuleGd } from "@gltfi/emit-gd";
import { LUA_RUNTIME_SOURCE } from "@gltfi/runtime-lua";
import { HARNESS_PATH as PY_HARNESS_PATH, PYTHON_SRC_DIR } from "@gltfi/runtime-py";
import { CsHarnessSession, ensureHarnessBuilt, findDotnetBin } from "@gltfi/runtime-cs";
import { GD_SRC_DIR } from "@gltfi/runtime-gd";
import type { EngineFactory } from "@gltfi/runtime-lib";

// ---------------------------------------------------------------------------
// The graph, built directly as KHR_interactivity JSON (same style as
// packages/runtime/test/pointer-bool-contract.test.ts's `lit` helper and its
// sibling packages/runtime/test/interpolation-kill.test.ts, whose first
// scenario this graph is structurally identical to — that file's own
// comments document the node wiring in full):
//
//   0: event/onStart -> 1: flow/sequence, fanning out to:
//     branch "0" -> 2: variable/interpolate (var0, 0->10 over 1s, linear
//       ease p1=[0,0]/p2=[1,1]) -- done -> 5: variable/set var1=1 (must
//       NEVER fire if the kill works)
//     branch "1" -> 3: flow/setDelay (0.3s) -- done -> 4: variable/set
//       var0=999 (this is what triggers the kill)
// ---------------------------------------------------------------------------

const FLOAT = 0;
const FLOAT2 = 1;

function lit(typeIndex: number, value: Array<number | boolean | string>) {
  return { type: typeIndex, value };
}

const GRAPH: IrGraph = {
  types: [{ signature: "float" }, { signature: "float2" }],
  variables: [
    { id: "v0", type: FLOAT, value: [0] },
    { id: "v1", type: FLOAT, value: [0] }
  ],
  events: [],
  declarations: [
    { op: "event/onStart" },
    { op: "flow/sequence" },
    { op: "variable/interpolate" },
    { op: "flow/setDelay" },
    { op: "variable/set" },
    { op: "variable/set" }
  ],
  nodes: [
    { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
    {
      declaration: 1,
      flows: {
        "0": { node: 2, socket: "in" },
        "1": { node: 3, socket: "in" }
      }
    },
    {
      declaration: 2,
      configuration: { variable: { value: [0] } },
      values: {
        duration: lit(FLOAT, [1]),
        value: lit(FLOAT, [10]),
        p1: lit(FLOAT2, [0, 0]),
        p2: lit(FLOAT2, [1, 1])
      },
      flows: { done: { node: 5, socket: "in" } }
    },
    {
      declaration: 3,
      values: { duration: lit(FLOAT, [0.3]) },
      flows: { done: { node: 4, socket: "in" } }
    },
    {
      declaration: 4,
      configuration: { variables: { value: [0] } },
      values: { "0": lit(FLOAT, [999]) }
    },
    {
      declaration: 5,
      configuration: { variables: { value: [1] } },
      values: { "1": lit(FLOAT, [1]) }
    }
  ]
};

// dt sequence: three 0.1s ticks to reach t=0.3 (where the delay's done flow
// fires and kills the interpolation), seven more 0.1s ticks to reach t=1.0
// (the ORIGINAL interpolation's now-irrelevant duration), then one 0.2s tick
// past it — 11 ticks total, sampling both variables after every one.
const DELTAS = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2];
// Index of the first tick at/after t=0.3 (0-based into DELTAS/samples) —
// from here on, every engine's var0 must be frozen at 999 and var1 must
// stay 0 (its owning interpolation's done flow never fires).
const KILL_TICK_INDEX = 2;

type Sample = { var0: number; var1: number };
type MiniEngine = {
  start(): void;
  advance(dt: number): void;
  // Both graph variables are scalar floats, so a MiniEngine only needs to
  // hand back the single component's raw number — no need for every
  // backend's bridge to round-trip a full {type,data} Value shape.
  readVar(i: number): number;
};

function collect(engine: MiniEngine): Sample[] {
  engine.start();
  const out: Sample[] = [];
  for (const dt of DELTAS) {
    engine.advance(dt);
    out.push({ var0: engine.readVar(0), var1: engine.readVar(1) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// TS compiled engine: emitModule + esbuild bundle + dynamic import +
// runtime-lib's createEngine factory. Mirrors compiled-e2e.test.ts's
// compileAndLoad helper exactly, minus the GLB-probing (this graph has no
// glTF-side pointer targets, so `gltf: {}` is enough).
// ---------------------------------------------------------------------------

async function buildTsFactory(module: IRModule): Promise<EngineFactory> {
  const { code } = emitModule(module);
  const result = await esbuild.build({
    stdin: { contents: code, loader: "ts", resolveDir: path.resolve(import.meta.dirname, "../src"), sourcefile: "compiled-engine.ts" },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    write: false
  });
  const bundled = result.outputFiles?.[0]?.text;
  if (!bundled) {
    throw new Error("esbuild produced no output for the interpolation-kill fixture module");
  }
  const tmpFile = path.join(os.tmpdir(), `gltfi-emit-ts-interp-kill-${crypto.randomUUID()}.mjs`);
  fs.writeFileSync(tmpFile, bundled);
  try {
    const mod = (await import(pathToFileURL(tmpFile).href)) as { default: EngineFactory };
    return mod.default;
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// ---------------------------------------------------------------------------
// Compiled Python / C# / GDScript engines all talk a synchronous,
// line-delimited-JSON, mkfifo-backed protocol to a persistent subprocess —
// see packages/conformance/src/run-compiled-py.ts's header for the full
// rationale (judgeTest-style callers need a genuinely BLOCKING round trip
// out of Node's fundamentally-async child_process pipes). Those runner
// files' own session classes are internal (not exported) and each file
// calls its own main() at import time, so they can't be imported as
// libraries here — MINIMAL from-scratch sessions below, trimmed to just the
// "load"/"start"/"advance"/"get_var" commands this test actually needs
// (@gltfi/runtime-cs's CsHarnessSession IS exported as a reusable class, so
// the C# leg reuses it directly instead of duplicating it).
// ---------------------------------------------------------------------------

class PySession {
  private readonly reqWriteFd: number;
  private readonly respReadFd: number;
  private readonly child: ChildProcess;
  private readonly tmpDir: string;
  private buf: Buffer = Buffer.alloc(0);

  constructor(pythonBin: string) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-py-fifo-interp-kill-"));
    const reqPath = path.join(this.tmpDir, "req.fifo");
    const respPath = path.join(this.tmpDir, "resp.fifo");
    execFileSync("mkfifo", [reqPath]);
    execFileSync("mkfifo", [respPath]);
    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(pythonBin, [PY_HARNESS_PATH], {
      stdio: [spawnReqFd, spawnRespFd, "inherit"],
      env: { ...process.env, PYTHONPATH: PYTHON_SRC_DIR }
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
        throw new Error("python harness process closed its output unexpectedly (it may have crashed)");
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

// GDScript has no exception handling at all (see run-compiled-gd.ts's header
// for the full empirical finding): a runtime error inside the compiled
// module or the runtime itself hangs the whole process with no response
// ever coming down the FIFO, rather than surfacing as an ordinary
// `{"ok":false}` like every other backend's harness. Reused here verbatim
// (poll-with-deadline read instead of a plain blocking read) so a genuine
// hang fails this ONE test with a clear timeout message instead of hanging
// the whole vitest run.
const GD_REQUEST_TIMEOUT_MS = 10_000;
const GD_POLL_INTERVAL_MS = 5;

class GdSession {
  private reqWriteFd = -1;
  private respReadFd = -1;
  private child: ChildProcess | null = null;
  private readonly tmpDir: string;
  private buf: Buffer = Buffer.alloc(0);
  private healthy = true;

  constructor(private readonly godotBin: string) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-gd-fifo-interp-kill-"));
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
    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(this.godotBin, ["--headless", "--no-header", "--path", GD_SRC_DIR, "--script", "res://harness.gd"], {
      stdio: [spawnReqFd, spawnRespFd, "inherit"]
    });
    fs.closeSync(spawnReqFd);
    fs.closeSync(spawnRespFd);
    this.reqWriteFd = fs.openSync(reqPath, "r+");
    this.respReadFd = fs.openSync(respPath, fs.constants.O_RDWR | fs.constants.O_NONBLOCK);
    this.buf = Buffer.alloc(0);
    this.healthy = true;
  }

  private isHealthy(): boolean {
    return this.healthy && this.child !== null && this.child.exitCode === null && this.child.signalCode === null;
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
        throw new Error("godot harness process exited/crashed unexpectedly");
      }
      if (Date.now() >= deadline) {
        this.healthy = false;
        throw new Error(
          `godot harness process did not respond within ${GD_REQUEST_TIMEOUT_MS}ms (GDScript has no exception handling — see run-compiled-gd.ts's header note)`
        );
      }
      try {
        const n = fs.readSync(this.respReadFd, chunk, 0, chunk.length, null);
        if (n === 0) {
          this.healthy = false;
          throw new Error("godot harness process closed its output unexpectedly (it may have crashed)");
        }
        this.buf = Buffer.concat([this.buf, chunk.subarray(0, n)]);
      } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code === "EAGAIN") {
          GdSession.sleep(GD_POLL_INTERVAL_MS);
          continue;
        }
        throw err;
      }
    }
  }

  request(req: Record<string, unknown>): Record<string, unknown> {
    fs.writeSync(this.reqWriteFd, Buffer.from(`${JSON.stringify(req)}\n`, "utf8"));
    const resp = JSON.parse(this.readLine(Date.now() + GD_REQUEST_TIMEOUT_MS)) as Record<string, unknown>;
    if (!resp.ok) {
      throw new Error(String(resp.error));
    }
    return resp;
  }

  dispose(): void {
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
    this.child?.kill("SIGKILL");
    try {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

describe("interpolation-kill (task #10): cross-engine parity across interpreter + all 4 compiled backends", () => {
  const { module, diagnostics } = importGraph(GRAPH);

  it("fixture sanity: the hand-authored graph imports and type-checks cleanly", () => {
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(checkModule(module).filter((d) => d.severity === "error")).toEqual([]);
  });

  it(
    "interpreter + ts + lua + py + cs + gd all freeze var0 at 999 from t=0.3 on, with identical tick-by-tick sequences and var1's done flow never firing",
    async () => {
      // --- interpreter: fed exportGraph(module)'s OUTPUT, not the original
      // hand-built GRAPH object, so it and every compiled backend below are
      // all provably descended from the exact same IRModule. ---
      const { graph: exportedGraph, diagnostics: exportDiagnostics } = exportGraph(module);
      expect(exportDiagnostics.filter((d) => d.severity === "error")).toEqual([]);

      const interpRuntime = new InteractivityRuntime(exportedGraph as unknown as RuntimeGraph, {});
      const interpSamples = collect({
        start: () => interpRuntime.start(),
        advance: (dt) => interpRuntime.tick(dt),
        readVar: (i) => interpRuntime.getVariableByIndex(i).data[0] as number
      });

      // Sanity on the interpreter's own numbers before comparing everyone
      // else against it: var0 should be rising (linear ease, p1=[0,0]/
      // p2=[1,1] reduces the cubic-bezier solve to the identity function —
      // see packages/kernel/src/math.ts's cubicBezierEase) up to the kill
      // tick, then frozen; var1 must never move off its initial 0.
      expect(interpSamples[0].var0).toBeGreaterThan(0);
      expect(interpSamples[0].var0).toBeLessThan(interpSamples[1].var0);
      expect(interpSamples[1].var0).toBeLessThan(10);
      for (const s of interpSamples) {
        expect(s.var1).toBe(0);
      }

      // --- ts compiled engine ---
      const tsFactory = await buildTsFactory(module);
      const tsEngine = tsFactory({ gltf: {} });
      const tsSamples = collect({
        start: () => tsEngine.start(),
        advance: (dt) => tsEngine.advance(dt),
        readVar: (i) => tsEngine.getVariableByIndex(i).data[0] as number
      });

      // --- lua compiled engine (wasmoon) ---
      const { code: luaCode } = emitModuleLua(module);
      const luaScript = [
        LUA_RUNTIME_SOURCE,
        "local MODULE_SETUP = (function()",
        luaCode,
        "end)()",
        "ENGINE = CreateEngine(MODULE_SETUP)({ gltf = nil, glbBin = nil, seed = 123456789.0 })",
        "function BRIDGE_START() ENGINE.start() end",
        "function BRIDGE_ADVANCE(dt) ENGINE.advance(dt) end",
        "function BRIDGE_VAR(i) return ENGINE.getVariableByIndex(i).data[1] end"
      ].join("\n");
      const luaFactory = new LuaFactory();
      const luaWasmModule = await luaFactory.getLuaModule();
      const lua = new LuaEngine(luaWasmModule);
      let luaSamples: Sample[];
      try {
        lua.doStringSync(luaScript);
        const luaStart = lua.global.get("BRIDGE_START") as () => void;
        const luaAdvance = lua.global.get("BRIDGE_ADVANCE") as (dt: number) => void;
        const luaVar = lua.global.get("BRIDGE_VAR") as (i: number) => number;
        luaSamples = collect({
          start: () => luaStart(),
          advance: (dt) => luaAdvance(dt),
          readVar: (i) => Number(luaVar(i))
        });
      } finally {
        lua.global.close();
      }

      // --- python compiled engine (persistent harness.py subprocess) ---
      const pySession = new PySession(process.env.GLTFI_PYTHON ?? "python3");
      let pySamples: Sample[];
      try {
        const { code: pyCode } = emitModulePy(module);
        const pyModuleDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-py-mod-interp-kill-"));
        const pyModulePath = path.join(pyModuleDir, "interp_kill.py");
        fs.writeFileSync(pyModulePath, pyCode, "utf8");
        pySession.request({ cmd: "load", module_path: pyModulePath, gltf: {}, bin_b64: null });
        pySamples = collect({
          start: () => {
            pySession.request({ cmd: "start" });
          },
          advance: (dt) => {
            pySession.request({ cmd: "advance", dt });
          },
          readVar: (i) => Number((pySession.request({ cmd: "get_var", i }).data as unknown[])[0])
        });
      } finally {
        pySession.dispose();
      }

      // --- c# compiled engine (persistent dotnet gltfi-harness-cs subprocess) ---
      const dotnetBin = findDotnetBin();
      ensureHarnessBuilt(dotnetBin);
      const csSession = new CsHarnessSession(dotnetBin);
      let csSamples: Sample[];
      try {
        const { code: csCode } = emitModuleCs(module);
        csSession.request({ cmd: "load", source: csCode, gltf: {}, bin_b64: null });
        csSamples = collect({
          start: () => {
            csSession.request({ cmd: "start" });
          },
          advance: (dt) => {
            csSession.request({ cmd: "advance", dt });
          },
          readVar: (i) => Number((csSession.request({ cmd: "get_var", i }).data as unknown[])[0])
        });
      } finally {
        csSession.dispose();
      }

      // --- gdscript compiled engine (persistent godot --headless subprocess) ---
      const gdSession = new GdSession(process.env.GLTFI_GODOT ?? "godot");
      let gdSamples: Sample[];
      try {
        const { code: gdCode } = emitModuleGd(module);
        gdSession.request({ cmd: "load", source: gdCode, gltf: {}, bin_b64: null });
        gdSamples = collect({
          start: () => {
            gdSession.request({ cmd: "start" });
          },
          advance: (dt) => {
            gdSession.request({ cmd: "advance", dt });
          },
          readVar: (i) => Number((gdSession.request({ cmd: "get_var", i }).data as unknown[])[0])
        });
      } finally {
        gdSession.dispose();
      }

      const engines: Record<string, Sample[]> = {
        ts: tsSamples,
        lua: luaSamples,
        py: pySamples,
        cs: csSamples,
        gd: gdSamples
      };

      for (const [name, samples] of Object.entries(engines)) {
        expect(samples.length, `${name}: sample count`).toBe(DELTAS.length);
      }

      // Tick-by-tick parity against the interpreter (var0's eased values get
      // a small float tolerance; var1 — always exactly 0 or 1 — must match
      // exactly).
      for (const [name, samples] of Object.entries(engines)) {
        for (let i = 0; i < DELTAS.length; i += 1) {
          expect(samples[i].var0, `${name}: var0 at tick ${i} (t=${((i + 1) * 0.1).toFixed(1)})`).toBeCloseTo(interpSamples[i].var0, 6);
          expect(samples[i].var1, `${name}: var1 at tick ${i}`).toBe(interpSamples[i].var1);
        }
      }

      // The actual behavioral assertion this whole task is about: from the
      // kill tick onward, var0 is frozen at EXACTLY 999 (the interpolation's
      // table entry was killed, so no further eased writes ever land) and
      // var1 stays EXACTLY 0 (the killed interpolation's own `done` flow
      // never fires) — for every one of the six engines, interpreter
      // included.
      const allSamples: Record<string, Sample[]> = { interpreter: interpSamples, ...engines };
      for (const [name, samples] of Object.entries(allSamples)) {
        for (let i = KILL_TICK_INDEX; i < DELTAS.length; i += 1) {
          expect(samples[i].var0, `${name}: var0 at tick ${i} must be frozen at 999`).toBe(999);
          expect(samples[i].var1, `${name}: var1 at tick ${i} must still be 0 (done flow never fired)`).toBe(0);
        }
      }
    },
    180_000
  );
});
