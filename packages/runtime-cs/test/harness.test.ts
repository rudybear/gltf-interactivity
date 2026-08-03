// Parity spot-checks for the compiled C# KHR_interactivity runtime
// (src/cs/*.cs) driven through the actual Harness.cs protocol (see that
// file's own header, and packages/conformance/src/run-compiled-cs.ts's for
// why the real runner needs a synchronous FIFO bridge to this same process
// — these tests have no such constraint, since vitest tests are happily
// async, so a plain async spawn + stdout "data" listener suffices here,
// exactly mirroring @gltfi/runtime-py's identical test file). These are NOT
// full conformance runs (that's conf:cs's job), just fast, targeted checks
// on the numeric-semantics corners the task called out (int32 wrap incl.
// INT_MIN/-1 edges, float/int division and remainder by zero, ctz/popcnt,
// the math/random LCG sequence, NaN comparisons) plus one small end-to-end
// engine smoke test exercising rt.DeclareVar/OnStart/PtrSet/PtrGet against
// a tiny synthetic glTF document, loaded exactly the way the conformance
// runner loads emit-cs's output (a full module source string, not a file).
//
// `dotnet` may legitimately be absent from a given CI/dev environment (this
// task explicitly does not add it there) — every test in this file checks
// for it up front and calls `ctx.skip()` with a console warning instead of
// failing when it's unavailable, same policy this task's own report
// documents for the M.cs parity/e2e vitest coverage.
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CSPROJ_PATH, HARNESS_DLL_PATH, hashCsSources, needsBuild, writeBuildMarker } from "../src/index.js";

type Resp = Record<string, unknown>;

function findDotnetBin(): string | null {
  const fromEnv = process.env.GLTFI_DOTNET;
  const candidates = [fromEnv, "dotnet", path.join(os.homedir(), ".dotnet", "dotnet"), "/usr/local/share/dotnet/dotnet", "/usr/lib/dotnet/dotnet"].filter(
    (x): x is string => Boolean(x)
  );
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["--version"], { stdio: ["ignore", "ignore", "ignore"] });
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

class AsyncHarness {
  private readonly child: ChildProcessWithoutNullStreams;
  private buf = "";
  private readonly pending: Array<(line: string) => void> = [];

  constructor(dotnetBin: string) {
    this.child = spawn(dotnetBin, [HARNESS_DLL_PATH]);
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

function encAny(x: unknown): unknown {
  if (typeof x === "number") return encNum(x);
  if (Array.isArray(x)) return x.map(encAny);
  return x;
}

const dotnetBin = findDotnetBin();

describe.runIf(dotnetBin !== null)("GltfiRuntime.M numeric-semantics parity (via Harness.cs's eval_m)", () => {
  let harness: AsyncHarness;

  beforeAll(() => {
    if (needsBuild()) {
      execFileSync(dotnetBin!, ["build", CSPROJ_PATH, "-c", "Release"], { stdio: "inherit" });
      writeBuildMarker(hashCsSources());
    }
    harness = new AsyncHarness(dotnetBin!);
  });

  afterAll(() => {
    harness.dispose();
  });

  async function evalM(fn: string, args: unknown[]): Promise<number | boolean | string> {
    const resp = await harness.request({ cmd: "eval_m", fn, args: args.map(encAny) });
    const result = resp.result;
    return typeof result === "string" && (result === "NaN" || result === "Infinity" || result === "-Infinity")
      ? decNum(result)
      : (result as number | boolean | string);
  }

  it("wraps int32 arithmetic the same way ECMAScript's `x | 0` does, including INT_MIN edges", async () => {
    expect(await evalM("AddInt", [2147483647, 1])).toBe(-2147483648);
    expect(await evalM("SubInt", [-2147483648, 1])).toBe(2147483647);
    expect(await evalM("NegInt", [-2147483648])).toBe(-2147483648);
    expect(await evalM("MulInt", [65536, 65536])).toBe(0);
  });

  it("returns +-Infinity/NaN for float division/remainder by zero (C# int division/remainder THROW instead)", async () => {
    expect(await evalM("Div", [1.0, 0.0])).toBe(Infinity);
    expect(await evalM("Div", [-1.0, 0.0])).toBe(-Infinity);
    expect(await evalM("Div", [0.0, 0.0])).toBeNaN();
    expect(await evalM("DivInt", [5, 0])).toBe(0);
    expect(await evalM("Rem", [5.0, 0.0])).toBeNaN();
    expect(await evalM("RemInt", [5, 0])).toBe(0);
  });

  it("matches JS's masked/sign-extending shift semantics (lsl/asr) — native C# `<<`/`>>` on `int` already do this", async () => {
    expect(await evalM("Lsl", [20, 32])).toBe(20);
    expect(await evalM("Lsl", [20, 33])).toBe(40);
    expect(await evalM("Asr", [-7, 1])).toBe(-4);
    expect(await evalM("Asr", [-8, 1])).toBe(-4);
  });

  it("matches ctz(0)=32 and unsigned popcnt exactly (via System.Numerics.BitOperations)", async () => {
    expect(await evalM("Ctz", [0])).toBe(32);
    expect(await evalM("Ctz", [8])).toBe(3);
    expect(await evalM("Clz", [1])).toBe(31);
    expect(await evalM("Popcnt", [-1])).toBe(32);
    expect(await evalM("Popcnt", [7])).toBe(3);
  });

  it("propagates NaN through comparisons the same way JS does (NaN never equals anything, including itself)", async () => {
    expect(await evalM("Eq", [NaN, NaN])).toBe(false);
    expect(await evalM("IsNaN", [NaN])).toBe(true);
    expect(await evalM("Eq", [[NaN, 1.0], [NaN, 1.0]])).toBe(false);
    // Min/Max must be order-independent NaN-propagating (native C#
    // Math.Min/Math.Max already are — unlike Python's min()/max() builtins,
    // which needed a hand-written fmin/fmax fix in that backend).
    expect(await evalM("Min", [1, NaN])).toBeNaN();
    expect(await evalM("Min", [NaN, 1])).toBeNaN();
    expect(await evalM("Max", [1, NaN])).toBeNaN();
  });

  it("draws the exact same LCG sequence as the TS oracle's default seed", async () => {
    const source = [
      "using GltfiRuntime;",
      "namespace GltfiCompiled;",
      "public static class Module",
      "{",
      "    public sealed class Vars",
      "    {",
      "        private readonly Engine E;",
      "        public Vars(Engine e) { E = e; }",
      "        public double v0 { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }",
      "        public double v1 { get => E.GetVarFloat(1); set => E.SetVarFloat(1, value); }",
      "        public double v2 { get => E.GetVarFloat(2); set => E.SetVarFloat(2, value); }",
      "        public double v3 { get => E.GetVarFloat(3); set => E.SetVarFloat(3, value); }",
      "        public double v4 { get => E.GetVarFloat(4); set => E.SetVarFloat(4, value); }",
      "    }",
      "    public static void Build(Engine rt)",
      "    {",
      "        for (int i = 0; i < 5; i++) rt.DeclareVar(\"float\", 0.0);",
      "        var V = new Vars(rt);",
      "        void OnStart0()",
      "        {",
      "            V.v0 = rt.Random();",
      "            V.v1 = rt.Random();",
      "            V.v2 = rt.Random();",
      "            V.v3 = rt.Random();",
      "            V.v4 = rt.Random();",
      "        }",
      "        rt.OnStart(OnStart0);",
      "    }",
      "}",
      ""
    ].join("\n");
    await harness.request({ cmd: "load", source, gltf: null, bin_b64: null });
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

describe.runIf(dotnetBin !== null)("GltfiRuntime.Engine end-to-end smoke test", () => {
  let harness: AsyncHarness;

  beforeAll(() => {
    if (needsBuild()) {
      execFileSync(dotnetBin!, ["build", CSPROJ_PATH, "-c", "Release"], { stdio: "inherit" });
      writeBuildMarker(hashCsSources());
    }
    harness = new AsyncHarness(dotnetBin!);
  });

  afterAll(() => {
    harness.dispose();
  });

  it("runs a hand-written module source against a synthetic glTF document (DeclareVar/OnStart/SetVarFloat/PtrSet/PtrGet)", async () => {
    const source = [
      "using System.Collections.Generic;",
      "using GltfiRuntime;",
      "namespace GltfiCompiled;",
      "public static class Module",
      "{",
      "    public sealed class Vars",
      "    {",
      "        private readonly Engine E;",
      "        public Vars(Engine e) { E = e; }",
      "        public double v0 { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }",
      "        public double v1 { get => E.GetVarFloat(1); set => E.SetVarFloat(1, value); }",
      "        public double v2 { get => E.GetVarFloat(2); set => E.SetVarFloat(2, value); }",
      "        public double v3 { get => E.GetVarFloat(3); set => E.SetVarFloat(3, value); }",
      "    }",
      "    public static void Build(Engine rt)",
      "    {",
      "        for (int i = 0; i < 4; i++) rt.DeclareVar(\"float\", 0.0);",
      "        var V = new Vars(rt);",
      "        void OnStart0()",
      "        {",
      "            V.v0 = 42.0;",
      "            var args = new Dictionary<string, object> { [\"nodeIndex\"] = 0.0 };",
      "            rt.PtrSet(\"/nodes/[nodeIndex]/translation\", \"float3\", new double[] { 1.0, 2.0, 3.0 }, args);",
      "            var result = rt.PtrGet(\"/nodes/[nodeIndex]/translation\", \"float3\", args);",
      "            var value = (double[])result.Value;",
      "            V.v1 = value[0];",
      "            V.v2 = value[1];",
      "            V.v3 = value[2];",
      "        }",
      "        rt.OnStart(OnStart0);",
      "    }",
      "}",
      ""
    ].join("\n");
    const gltf = { nodes: [{ translation: [0, 0, 0] }] };
    await harness.request({ cmd: "load", source, gltf, bin_b64: null });
    await harness.request({ cmd: "start" });
    const v0 = await harness.request({ cmd: "get_var", i: 0 });
    expect((v0.data as unknown[])[0]).toBe(42);

    const v1 = await harness.request({ cmd: "get_var", i: 1 });
    const v2 = await harness.request({ cmd: "get_var", i: 2 });
    const v3 = await harness.request({ cmd: "get_var", i: 3 });
    expect([(v1.data as unknown[])[0], (v2.data as unknown[])[0], (v3.data as unknown[])[0]]).toEqual([1, 2, 3]);
  });
});

describe("dotnet availability", () => {
  it("notes whether `dotnet` was found (skips the suites above cleanly otherwise)", () => {
    if (dotnetBin === null) {
      // eslint-disable-next-line no-console
      console.warn("gltfi runtime-cs tests: no `dotnet` executable found on PATH (or $GLTFI_DOTNET) -- skipping C# harness tests.");
    }
    expect(true).toBe(true);
  });
});
