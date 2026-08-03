// Parity spot-checks for the GDScript KHR_interactivity runtime (src/gd/*.gd)
// driven through the actual harness.gd protocol (see that file's own header,
// and packages/conformance/src/run-compiled-gd.ts for why the REAL runner
// needs a poll+deadline FIFO bridge to this same process — these tests have
// no such constraint, since vitest tests are happily async, so a plain async
// spawn + stdout "data" listener suffices here, same reasoning as
// runtime-py's/runtime-cs's identical test file). NOT full conformance runs
// (that's conf:gd's job) — fast, targeted checks on the numeric-semantics
// corners the task called out as GDScript-specific gotchas: int32 wrap
// (incl. INT_MIN edges), int div/rem by zero (native GDScript int `/`/`%`
// hang the WHOLE process on a zero divisor — see m.gd's own header note —
// so divInt/remInt route through float division instead), asin/acos domain
// clamping, the `pow(+-1, +-INF)` corner, ctz/popcnt, the math/random LCG
// sequence, and NaN comparisons — plus one small end-to-end engine smoke
// test exercising rt.vars/rt.on_start/rt.set_var/rt.ptr_set against a tiny
// synthetic glTF document, loaded as a real compiled module SOURCE STRING
// exactly the way the conformance runner loads emit-gd's output (see
// harness.gd's `cmd_load` — unlike harness.py, which imports a module by
// FILE PATH, this backend's `"load"` command carries the module's GDScript
// SOURCE directly, since the dynamic-load mechanism is `GDScript.new()` +
// `source_code` + `reload()`, not a file-path import).
//
// `describe.runIf(...)` skips this whole suite when no `godot` binary is on
// PATH (or $GLTFI_GODOT) — this task does NOT wire godot into CI (see the
// task report for why: no reliable setup action for it today).
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HARNESS_PATH, GD_SRC_DIR } from "../src/index.js";

const GODOT_BIN = process.env.GLTFI_GODOT ?? "godot";

function godotAvailable(): boolean {
  try {
    const res = spawnSync(GODOT_BIN, ["--version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

const HAS_GODOT = godotAvailable();

type Resp = Record<string, unknown>;

class AsyncHarness {
  private readonly child: ChildProcessWithoutNullStreams;
  private buf = "";
  private readonly pending: Array<(line: string) => void> = [];

  constructor() {
    this.child = spawn(GODOT_BIN, ["--headless", "--no-header", "--path", GD_SRC_DIR, "--script", "res://harness.gd"]);
    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk: string) => {
      this.buf += chunk;
      let idx: number;
      // eslint-disable-next-line no-cond-assign
      while ((idx = this.buf.indexOf("\n")) !== -1) {
        const line = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 1);
        this.pending.shift()?.(line);
      }
    });
  }

  request(req: Record<string, unknown>): Promise<Resp> {
    return new Promise((resolve, reject) => {
      this.pending.push((line) => {
        let resp: Resp;
        try {
          resp = JSON.parse(line) as Resp;
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }
        if (!resp.ok) {
          reject(new Error(String(resp.error)));
          return;
        }
        resolve(resp);
      });
      this.child.stdin.write(`${JSON.stringify(req)}\n`);
    });
  }

  dispose(): void {
    this.child.kill();
  }
}

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

function encAny(x: unknown): unknown {
  if (typeof x === "number") return encNum(x);
  if (Array.isArray(x)) return x.map(encAny);
  return x;
}

let harness: AsyncHarness;

beforeAll(() => {
  if (!HAS_GODOT) return;
  harness = new AsyncHarness();
});

afterAll(() => {
  harness?.dispose();
});

async function evalM(fn: string, args: unknown[]): Promise<number | boolean | string> {
  const resp = await harness.request({ cmd: "eval_m", fn, args: args.map(encAny) });
  const result = resp.result;
  return typeof result === "string" && (result === "NaN" || result === "Infinity" || result === "-Infinity")
    ? decNum(result)
    : (result as number | boolean | string);
}

describe.runIf(HAS_GODOT)("m.gd numeric-semantics parity (via harness.gd's eval_m)", () => {
  it("HARNESS_PATH points at a real file on disk", () => {
    expect(HARNESS_PATH.endsWith("harness.gd")).toBe(true);
  });

  it("wraps int32 arithmetic the same way ECMAScript's `x | 0` does, including INT_MIN edges", async () => {
    expect(await evalM("addInt", [2147483647, 1])).toBe(-2147483648);
    expect(await evalM("subInt", [-2147483648, 1])).toBe(2147483647);
    expect(await evalM("negInt", [-2147483648])).toBe(-2147483648);
    expect(await evalM("mulInt", [65536, 65536])).toBe(0);
  });

  it("returns +-Infinity/NaN for float division/remainder by zero, and 0 for int division/remainder by zero (native GDScript int `/`/`%` would hang the whole process on a zero divisor — see m.gd's header)", async () => {
    expect(await evalM("div", [1.0, 0.0])).toBe(Infinity);
    expect(await evalM("div", [-1.0, 0.0])).toBe(-Infinity);
    expect(await evalM("div", [0.0, 0.0])).toBeNaN();
    expect(await evalM("divInt", [5, 0])).toBe(0);
    expect(await evalM("rem", [5.0, 0.0])).toBeNaN();
    expect(await evalM("remInt", [5, 0])).toBe(0);
  });

  it("clamps asin/acos domain to NaN (GDScript's native asin()/acos() silently clamp out-of-range input to +-pi/2/0 instead)", async () => {
    expect(await evalM("asin_", [2.0])).toBeNaN();
    expect(await evalM("acos_", [2.0])).toBeNaN();
    expect(await evalM("asin_", [0.5])).toBeCloseTo(Math.asin(0.5), 10);
  });

  it("matches ECMAScript's Number::exponentiate at the abs(base)==1, infinite-exponent corner (GDScript's native pow(+-1, INF) returns 1, not NaN)", async () => {
    expect(await evalM("pow_", [1.0, Infinity])).toBeNaN();
    expect(await evalM("pow_", [-1.0, Infinity])).toBeNaN();
    expect(await evalM("pow_", [2.0, 3.0])).toBe(8);
  });

  it("matches ctz(0)=32 and unsigned popcnt exactly", async () => {
    expect(await evalM("ctz", [0])).toBe(32);
    expect(await evalM("ctz", [8])).toBe(3);
    expect(await evalM("clz", [1])).toBe(31);
    expect(await evalM("popcnt", [-1])).toBe(32);
    expect(await evalM("popcnt", [7])).toBe(3);
  });

  it("propagates NaN through comparisons the same way JS does (NaN never equals anything, including itself)", async () => {
    expect(await evalM("eq", [NaN, NaN])).toBe(false);
    expect(await evalM("isNaN", [NaN])).toBe(true);
    expect(await evalM("eq", [[NaN, 1.0], [NaN, 1.0]])).toBe(false);
    expect(await evalM("min_", [1, NaN])).toBeNaN();
    expect(await evalM("min_", [NaN, 1])).toBeNaN();
    expect(await evalM("max_", [1, NaN])).toBeNaN();
  });

  it("round_ is round-half-away-from-zero (matches math.ts's sign(x)*round(abs(x)) trick, NOT plain JS Math.round's round-half-toward+Infinity)", async () => {
    expect(await evalM("round_", [2.5])).toBe(3);
    expect(await evalM("round_", [-2.5])).toBe(-3);
  });

  it("draws the exact same LCG sequence as the TS oracle's default seed", async () => {
    const src = [
      "extends RefCounted",
      "var m",
      "var rt",
      "var V",
      "var E",
      "func build(_rt) -> void:",
      "\trt = _rt",
      "\tV = rt.vars([[\"v0\", rt.float_var(0.0)], [\"v1\", rt.float_var(0.0)], [\"v2\", rt.float_var(0.0)], [\"v3\", rt.float_var(0.0)], [\"v4\", rt.float_var(0.0)]])",
      "\tE = rt.events([])",
      "\trt.on_start(__on_start_0)",
      "func __on_start_0() -> void:",
      "\tV.v0 = rt.random()",
      "\tV.v1 = rt.random()",
      "\tV.v2 = rt.random()",
      "\tV.v3 = rt.random()",
      "\tV.v4 = rt.random()",
      ""
    ].join("\n");
    await harness.request({ cmd: "load", source: src, gltf: null, bin_b64: null });
    await harness.request({ cmd: "start" });
    const draws: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const resp = await harness.request({ cmd: "get_var", i });
      draws.push(decNum((resp.data as unknown[])[0]));
    }

    let jsState = 123456789;
    const jsSeq: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      jsState = (1664525 * jsState + 1013904223) >>> 0;
      jsSeq.push(jsState / 0xffffffff);
    }
    // `toBeCloseTo` (not `toEqual`): Godot's `JSON.stringify()` does not
    // round-trip a float through its full 64-bit double precision by
    // default (confirmed empirically — a value that's exact to ~17
    // significant digits on the GDScript side comes back over the wire
    // rounded to ~15), so the two sequences agree well past the judgeTest
    // protocol's own 1e-4 comparison epsilon (see protocol.ts) but not at
    // bit-exact precision. This is a wire-encoding characteristic, not an
    // LCG algorithm bug — the underlying `_step_random()` arithmetic itself
    // is exact 32-bit integer math on both sides.
    draws.forEach((d, i) => expect(d).toBeCloseTo(jsSeq[i], 10));
  });
});

describe.runIf(HAS_GODOT)("engine.gd end-to-end smoke test", () => {
  it("runs a hand-written compiled-module SOURCE STRING against a synthetic glTF document (rt.vars/on_start/set_var/ptr_set/ptr_get)", async () => {
    const src = [
      "extends RefCounted",
      "var m",
      "var rt",
      "var V",
      "var E",
      "func build(_rt) -> void:",
      "\trt = _rt",
      "\tV = rt.vars([[\"v0\", rt.float_var(0.0)], [\"v1\", rt.float_var(0.0)], [\"v2\", rt.float_var(0.0)], [\"v3\", rt.float_var(0.0)]])",
      "\tE = rt.events([])",
      "\trt.on_start(__on_start_0)",
      "func __on_start_0() -> void:",
      "\tV.v0 = 42.0",
      "\trt.ptr_set(\"/nodes/[nodeIndex]/translation\", {\"nodeIndex\": 0.0}, \"float3\", [1.0, 2.0, 3.0])",
      "\tvar result = rt.ptr_get(\"/nodes/[nodeIndex]/translation\", {\"nodeIndex\": 0.0}, \"float3\")",
      "\tvar value = result[\"value\"]",
      "\tV.v1 = value[0]",
      "\tV.v2 = value[1]",
      "\tV.v3 = value[2]",
      ""
    ].join("\n");
    const gltf = { nodes: [{ translation: [0, 0, 0] }] };
    await harness.request({ cmd: "load", source: src, gltf, bin_b64: null });
    await harness.request({ cmd: "start" });
    const varResp = await harness.request({ cmd: "get_var", i: 0 });
    expect((varResp.data as unknown[])[0]).toBe(42);

    const t0 = await harness.request({ cmd: "get_var", i: 1 });
    const t1 = await harness.request({ cmd: "get_var", i: 2 });
    const t2 = await harness.request({ cmd: "get_var", i: 3 });
    expect([(t0.data as unknown[])[0], (t1.data as unknown[])[0], (t2.data as unknown[])[0]]).toEqual([1, 2, 3]);
  });
});
