// Parity spot-checks for the pure-Python KHR_interactivity runtime
// (src/py/gltfi_runtime/*.py) driven through the actual harness.py protocol
// (see that file's own header, and packages/conformance/src/run-compiled-
// py.ts's for why the real runner needs a synchronous FIFO bridge to this
// same process — these tests have no such constraint, since vitest tests are
// happily async, so a plain async spawn + stdout "data" listener suffices
// here). These are NOT full conformance runs (that's conf:py's job), just
// fast, targeted checks on the numeric-semantics corners the task called out
// as Python-specific gotchas: int32 wrap (incl. INT_MIN edges), float/int
// division and remainder by zero (Python raises ZeroDivisionError where
// JS/Lua return +-Infinity/NaN), ctz/popcnt, the math/random LCG sequence,
// and NaN comparisons — plus one small end-to-end engine smoke test
// exercising rt.vars/rt.on_start/rt.set_var/rt.ptr_set against a tiny
// synthetic glTF document, loaded as a real compiled module file exactly the
// way the conformance runner loads emit-py's output.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HARNESS_PATH, PYTHON_SRC_DIR } from "../src/index.js";

type Resp = Record<string, unknown>;

class AsyncHarness {
  private readonly child: ChildProcessWithoutNullStreams;
  private buf = "";
  private readonly pending: Array<(line: string) => void> = [];

  constructor(pythonBin: string) {
    this.child = spawn(pythonBin, [HARNESS_PATH], {
      env: { ...process.env, PYTHONPATH: PYTHON_SRC_DIR }
    });
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
          reject(new Error(typeof resp.traceback === "string" ? `${String(resp.error)}\n${resp.traceback}` : String(resp.error)));
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

let harness: AsyncHarness;
let scratchDir: string;

beforeAll(() => {
  harness = new AsyncHarness(process.env.GLTFI_PYTHON ?? "python3");
  scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-py-test-"));
});

afterAll(() => {
  harness.dispose();
  fs.rmSync(scratchDir, { recursive: true, force: true });
});

// Recursively applies encNum so a NaN/Infinity nested inside an array arg
// (e.g. the `eq([NaN, 1.0], [NaN, 1.0])` check below) doesn't get silently
// collapsed to `null` by `JSON.stringify` before it ever reaches Python.
function encAny(x: unknown): unknown {
  if (typeof x === "number") return encNum(x);
  if (Array.isArray(x)) return x.map(encAny);
  return x;
}

async function evalM(fn: string, args: unknown[]): Promise<number | boolean | string> {
  const resp = await harness.request({ cmd: "eval_m", fn, args: args.map(encAny) });
  const result = resp.result;
  return typeof result === "string" && (result === "NaN" || result === "Infinity" || result === "-Infinity")
    ? decNum(result)
    : (result as number | boolean | string);
}

describe("gltfi_runtime.m numeric-semantics parity (via harness.py's eval_m)", () => {
  it("wraps int32 arithmetic the same way ECMAScript's `x | 0` does, including INT_MIN edges", async () => {
    expect(await evalM("addInt", [2147483647, 1])).toBe(-2147483648);
    expect(await evalM("subInt", [-2147483648, 1])).toBe(2147483647);
    // -INT_MIN wraps back to itself in 32-bit two's complement.
    expect(await evalM("negInt", [-2147483648])).toBe(-2147483648);
    expect(await evalM("mulInt", [65536, 65536])).toBe(0);
  });

  it("returns +-Infinity/NaN for float division/remainder by zero (Python's `/`/`%` raise natively)", async () => {
    expect(await evalM("div", [1.0, 0.0])).toBe(Infinity);
    expect(await evalM("div", [-1.0, 0.0])).toBe(-Infinity);
    expect(await evalM("div", [0.0, 0.0])).toBeNaN();
    expect(await evalM("divInt", [5, 0])).toBe(0);
    expect(await evalM("rem", [5.0, 0.0])).toBeNaN();
    expect(await evalM("remInt", [5, 0])).toBe(0);
  });

  it("matches JS's masked/sign-extending shift semantics (lsl/asr), not Python's native arbitrary-width shift", async () => {
    // JS: (20 << 32) === 20 (shift count masked to 5 bits: 32 & 31 === 0).
    expect(await evalM("lsl", [20, 32])).toBe(20);
    expect(await evalM("lsl", [20, 33])).toBe(40);
    // JS: -7 >> 1 === -4 (arithmetic/sign-propagating shift).
    expect(await evalM("asr", [-7, 1])).toBe(-4);
    expect(await evalM("asr", [-8, 1])).toBe(-4);
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
    // min_/max_ must be order-independent NaN-propagating, unlike Python's
    // own min()/max() builtins (min(1, nan) === 1 but min(nan, 1) === nan).
    expect(await evalM("min_", [1, NaN])).toBeNaN();
    expect(await evalM("min_", [NaN, 1])).toBeNaN();
    expect(await evalM("max_", [1, NaN])).toBeNaN();
  });

  it("draws the exact same LCG sequence as the TS oracle's default seed", async () => {
    const modulePath = path.join(scratchDir, "lcg_check.py");
    fs.writeFileSync(
      modulePath,
      [
        "def build(rt):",
        "    rt.vars([{'type': 'float', 'initial': 0.0} for _ in range(5)])",
        "    rt.events([])",
        "    def _start():",
        "        for i in range(5):",
        "            rt.set_var(i, rt.random())",
        "    rt.on_start(_start)",
        ""
      ].join("\n"),
      "utf8"
    );
    await harness.request({ cmd: "load", module_path: modulePath, gltf: null, bin_b64: null });
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
    expect(draws).toEqual(jsSeq);
  });
});

describe("engine.py end-to-end smoke test", () => {
  it("runs a hand-written build() function against a synthetic glTF document (rt.vars/on_start/set_var/ptr_set/ptr_get)", async () => {
    // Deliberately passes the pointer template's int param as a Python
    // FLOAT (`0.0`, not `0`) — real emit-py output always produces a
    // genuine int here (see pointer.py's `_js_like_str` doc comment for
    // why), but a hand-written module is exactly the kind of caller that
    // might not, so this doubles as a regression check for that fix.
    const modulePath = path.join(scratchDir, "e2e_check.py");
    fs.writeFileSync(
      modulePath,
      [
        "def build(rt):",
        "    rt.vars([{'type': 'float', 'initial': 0.0}] * 4)",
        "    rt.events([])",
        "    def _start():",
        "        rt.set_var(0, 42.0)",
        "        rt.ptr_set('/nodes/[nodeIndex]/translation', {'nodeIndex': 0.0}, 'float3', [1.0, 2.0, 3.0])",
        "        result = rt.ptr_get('/nodes/[nodeIndex]/translation', {'nodeIndex': 0.0}, 'float3')",
        "        value = result['value']",
        "        rt.set_var(1, value[0])",
        "        rt.set_var(2, value[1])",
        "        rt.set_var(3, value[2])",
        "    rt.on_start(_start)",
        ""
      ].join("\n"),
      "utf8"
    );
    const gltf = { nodes: [{ translation: [0, 0, 0] }] };
    await harness.request({ cmd: "load", module_path: modulePath, gltf, bin_b64: null });
    await harness.request({ cmd: "start" });
    const varResp = await harness.request({ cmd: "get_var", i: 0 });
    expect((varResp.data as unknown[])[0]).toBe(42);

    // Confirms the pointer write actually landed in the engine's own gltf
    // clone (read back through rt.ptr_get in the SAME handler, not just
    // trusting ptr_set's `true` return value).
    const t0 = await harness.request({ cmd: "get_var", i: 1 });
    const t1 = await harness.request({ cmd: "get_var", i: 2 });
    const t2 = await harness.request({ cmd: "get_var", i: 3 });
    expect([(t0.data as unknown[])[0], (t1.data as unknown[])[0], (t2.data as unknown[])[0]]).toEqual([1, 2, 3]);
  });
});
