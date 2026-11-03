// Animation parity for the C# runtime (src/cs/Animation.cs): the same fixtures
// as packages/kernel/test/animation.test.ts (normalized SHORT rotation,
// interleaved byteStride, sparse incl. no-bufferView base, CUBICSPLINE Hermite
// translation/rotation, morph weights, STEP, undecodable channels) run through
// Harness.cs's test-only `anim_sample` command, each cross-checked against the
// TypeScript kernel (`applyAnimationAt`) as oracle. Also checks the per-document
// decode cache (decode counts) and the last-key/binary-search agreement.
// Skips cleanly when `dotnet` is unavailable, like harness.test.ts.
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyAnimationAt } from "../../kernel/src/index.js";
import { CSPROJ_PATH, HARNESS_DLL_PATH, hashCsSources, needsBuild, writeBuildMarker } from "../src/index.js";
import { BinBuilder, binView, cubicRotationFixture, cubicTranslationFixture } from "../../kernel/test/animation-fixtures.js";

type Fixture = { gltf: any; bin: Uint8Array };
type StepResult = { exists: boolean; skipped: number; nodes: any[] };
type SampleResp = { ok: boolean; results: StepResult[]; decodes: number; hits: number };

function findDotnetBin(): string | null {
  const candidates = [process.env.GLTFI_DOTNET, "dotnet", path.join(os.homedir(), ".dotnet", "dotnet"), "/usr/local/share/dotnet/dotnet", "/usr/lib/dotnet/dotnet"].filter(
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
      while ((idx = this.buf.indexOf("\n")) !== -1) {
        const line = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 1);
        this.pending.shift()?.(line);
      }
    });
  }

  request<T>(req: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pending.push((line) => {
        const resp = JSON.parse(line) as { ok: boolean; error?: string; traceback?: string };
        if (!resp.ok) {
          reject(new Error(`${resp.error}\n${resp.traceback ?? ""}`));
          return;
        }
        resolve(resp as T);
      });
      this.child.stdin.write(`${JSON.stringify(req)}\n`);
    });
  }

  dispose(): void {
    this.child.kill();
  }
}

const dotnetBin = findDotnetBin();

describe.runIf(dotnetBin !== null)("GltfiRuntime.Animation parity with the TS kernel (via Harness.cs's anim_sample)", () => {
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

  function cs(fx: Fixture, steps: Array<Record<string, unknown>>): Promise<SampleResp> {
    return harness.request<SampleResp>({
      cmd: "anim_sample",
      gltf: fx.gltf,
      bin_b64: Buffer.from(fx.bin).toString("base64"),
      steps
    });
  }

  // C# node 0 after sampling animation 0 at time t (fresh document).
  async function csNode(fx: Fixture, t: number, animation = 0): Promise<any> {
    const resp = await cs(fx, [{ animation, ts: [t] }]);
    return resp.results[0].nodes[0];
  }

  // TS oracle: same sample on a clone of the document.
  function tsNode(fx: Fixture, t: number, animation = 0): any {
    const gltf = structuredClone(fx.gltf);
    applyAnimationAt({ gltf, glbBin: binView(fx.bin) }, animation, t);
    return gltf.nodes[0];
  }

  async function expectParity(fx: Fixture, t: number, animation = 0): Promise<any> {
    const got = await csNode(fx, t, animation);
    const want = tsNode(fx, t, animation);
    for (const key of ["translation", "rotation", "scale", "weights"]) {
      if (want[key] === undefined) {
        expect(got[key]).toBeUndefined();
        continue;
      }
      expect(got[key]).toHaveLength(want[key].length);
      want[key].forEach((v: number, i: number) => expect(got[key][i]).toBeCloseTo(v, 6));
    }
    return got;
  }

  it("(a) normalized SHORT rotation clip slerps like float data", async () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const q = Math.round(Math.SQRT1_2 * 32767);
    const output = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([0, 0, 0, 32767, 0, 0, q, q], 2, true)),
      componentType: 5122, normalized: true, count: 2, type: "VEC4"
    });
    b.animation([{ input, output, path: "rotation" }]);
    const node = await expectParity(b.build(), 0.5);
    const half = Math.PI / 8;
    expect(node.rotation[2]).toBeCloseTo(Math.sin(half), 4);
    expect(node.rotation[3]).toBeCloseTo(Math.cos(half), 4);
    expect(Math.hypot(...(node.rotation as number[]))).toBeCloseTo(1, 5);
  });

  it("(b) interleaved (byteStride) translation + scale accessors sample correctly", async () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const rows = [
      [1, 2, 3, 1, 1, 1, 99],
      [3, 4, 5, 3, 5, 7, 99]
    ];
    const view = b.bufferView(BinBuilder.f32Bytes(rows.flat()), 28);
    const trs = b.accessor({ bufferView: view, byteOffset: 0, componentType: 5126, count: 2, type: "VEC3" });
    const scl = b.accessor({ bufferView: view, byteOffset: 12, componentType: 5126, count: 2, type: "VEC3" });
    b.animation([
      { input, output: trs, path: "translation" },
      { input, output: scl, path: "scale" }
    ]);
    const node = await expectParity(b.build(), 0.5);
    expect(node.translation).toEqual([2, 3, 4]);
    expect(node.scale).toEqual([2, 3, 4]);
  });

  it("(c) sparse accessors: no-bufferView base (zeros) and bufferView base with uint16 indices", async () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1, 2], 1);
    const zeroBase = b.accessor({
      componentType: 5126, count: 3, type: "VEC3",
      sparse: {
        count: 1,
        indices: { bufferView: b.bufferView(BinBuilder.intBytes([1], 1, false)), componentType: 5121 },
        values: { bufferView: b.bufferView(BinBuilder.f32Bytes([10, 20, 30])) }
      }
    });
    const patched = b.accessor({
      bufferView: b.bufferView(BinBuilder.f32Bytes([1, 1, 1, 2, 2, 2, 3, 3, 3])),
      componentType: 5126, count: 3, type: "VEC3",
      sparse: {
        count: 2,
        indices: { bufferView: b.bufferView(BinBuilder.intBytes([0, 2], 2, false)), componentType: 5123 },
        values: { bufferView: b.bufferView(BinBuilder.f32Bytes([7, 7, 7, 9, 9, 9])) }
      }
    });
    b.animation([
      { input, output: zeroBase, path: "translation" },
      { input, output: patched, path: "scale" }
    ]);
    const fx = b.build();
    const at05 = await expectParity(fx, 0.5);
    expect(at05.translation).toEqual([5, 10, 15]);
    expect(at05.scale).toEqual([4.5, 4.5, 4.5]);
    const at15 = await expectParity(fx, 1.5);
    expect(at15.translation).toEqual([5, 10, 15]);
    expect(at15.scale).toEqual([5.5, 5.5, 5.5]);
  });

  it("(d) CUBICSPLINE translation matches the hand-computed Hermite value (4.25, 4.25, 4.25)", async () => {
    const fx = cubicTranslationFixture();
    const mid = await expectParity(fx, 1);
    (mid.translation as number[]).forEach((c) => expect(c).toBeCloseTo(4.25, 5));
    expect((await expectParity(fx, 2)).translation).toEqual([10, 10, 10]);
    expect((await expectParity(fx, 0)).translation).toEqual([0, 0, 0]);
    const q = (await expectParity(fx, 0.5)).translation as number[];
    expect(q[0]).toBeCloseTo(0.140625 * 2 * 1 + 0.15625 * 10 - 0.046875 * 2 * 4, 5);
    expect(q[2]).toBeCloseTo(0.140625 * 2 * 3 + 0.15625 * 10 - 0.046875 * 2 * 6, 5);
  });

  it("(d) CUBICSPLINE rotation is Hermite then normalized (unit length)", async () => {
    const node = await expectParity(cubicRotationFixture(), 0.5);
    const s = Math.SQRT1_2;
    const z = 0.125 * 0.8 + 0.5 * s;
    const w = 0.5 + 0.5 * s - 0.125 * 0.4;
    const n = Math.hypot(z, w);
    expect(Math.hypot(...(node.rotation as number[]))).toBeCloseTo(1, 6);
    expect(node.rotation[2]).toBeCloseTo(z / n, 5);
    expect(node.rotation[3]).toBeCloseTo(w / n, 5);
  });

  it("morph weights: LINEAR and CUBICSPLINE with per-target values", async () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const linear = b.floats("SCALAR", [0, 1, 1, 0], 1);
    const cubic = b.floats("SCALAR", [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], 1);
    b.animation([{ input, output: linear, path: "weights" }]);
    b.animation([{ input, output: cubic, interpolation: "CUBICSPLINE", path: "weights" }]);
    const fx = b.build();
    expect((await expectParity(fx, 0.25, 0)).weights).toEqual([0.25, 0.75]);
    const c = await expectParity(fx, 0.5, 1);
    expect(c.weights[0]).toBeCloseTo(0.5, 6);
    expect(c.weights[1]).toBeCloseTo(0.5, 6);
  });

  it("STEP holds the key value (including exactly on a key) and single keyframes clamp", async () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [1, 2, 3], 1);
    const out = b.floats("VEC3", [1, 1, 1, 2, 2, 2, 3, 3, 3], 3);
    const one = b.floats("SCALAR", [0.5], 1);
    const oneOut = b.floats("VEC3", [4, 5, 6], 3);
    b.animation([{ input, output: out, interpolation: "STEP", path: "translation" }]);
    b.animation([{ input: one, output: oneOut, path: "translation" }]);
    const fx = b.build();
    expect((await expectParity(fx, 2, 0)).translation).toEqual([2, 2, 2]);
    expect((await expectParity(fx, 2.9, 0)).translation).toEqual([2, 2, 2]);
    expect((await expectParity(fx, 0.3, 1)).translation).toEqual([4, 5, 6]);
  });

  it("reports undecodable channels via skippedChannels instead of silently dropping", async () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const bad = b.accessor({ bufferView: 0, componentType: 5126, count: 50, type: "VEC3" });
    b.animation([{ input, output: bad, path: "translation" }]);
    const resp = await cs(b.build(), [{ animation: 0, ts: [0.5] }]);
    expect(resp.results[0].skipped).toBe(1);
    expect(resp.results[0].nodes[0].translation).toBeUndefined();
  });

  it("decodes each accessor once; later ticks are cache-only (decode-count check)", async () => {
    const fx = cubicTranslationFixture();
    const ts = Array.from({ length: 1000 }, (_, i) => (i % 20) / 10);
    const one = await cs(fx, [{ animation: 0, ts: [0.1] }]);
    expect(one.decodes).toBe(2); // input + output
    const many = await cs(fx, [{ animation: 0, ts: [0.1] }, { animation: 0, ts }]);
    expect(many.decodes).toBe(2);
    expect(many.hits).toBe(0); // the plan itself is cached; no accessor lookups after the first tick
  });

  it("invalidateAnimationCache and a swapped binary chunk force a re-decode", async () => {
    const fx = cubicTranslationFixture();
    const resp = await cs(fx, [
      { animation: 0, ts: [1] },
      { animation: 0, ts: [1], invalidate: true },
      { animation: 0, ts: [1], swap_bin: true }
    ]);
    expect(resp.decodes).toBe(4); // invalidate resets the counters (2), the swapped bin carries them over and adds 2
  });

  it("monotonic and random-order sampling agree (last-key fast path vs binary search)", async () => {
    const b = new BinBuilder();
    const times = Array.from({ length: 50 }, (_, i) => i * 0.1);
    const input = b.floats("SCALAR", times, 1);
    const out = b.floats("VEC3", times.flatMap((t) => [t, t * 2, -t]), 3);
    b.animation([{ input, output: out, path: "translation" }]);
    const fx = b.build();
    const order = [0.05, 0.15, 0.25, 3.33, 0.01, 4.85, 2.5, 2.51, 1.0];
    const resp = await cs(fx, order.map((t) => ({ animation: 0, ts: [t] })));
    order.forEach((t, i) => {
      const tr = resp.results[i].nodes[0].translation as number[];
      expect(tr[0]).toBeCloseTo(t, 5);
      expect(tr[1]).toBeCloseTo(t * 2, 5);
    });
  });
});
