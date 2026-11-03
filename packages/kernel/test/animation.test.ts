import { describe, expect, it } from "vitest";
import {
  applyAnimationAt,
  decodeAccessor,
  getAnimationCacheStats,
  invalidateAnimationCache,
  readAccessorElements
} from "../src/index.js";
import { BinBuilder, binView, cubicRotationFixture, cubicTranslationFixture } from "./animation-fixtures.js";

function sample(fx: { gltf: any; bin: Uint8Array }, t: number, node = 0): any {
  const host = { gltf: fx.gltf, glbBin: binView(fx.bin) };
  expect(applyAnimationAt(host, 0, t)).not.toBeNull();
  return fx.gltf.nodes[node];
}

describe("decodeAccessor", () => {
  it("normalizes signed/unsigned integers per the glTF spec (incl. -32768 clamp)", () => {
    const b = new BinBuilder();
    const s16 = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([-32768, -32767, 0, 32767], 2, true)),
      componentType: 5122, normalized: true, count: 4, type: "SCALAR"
    });
    const u8 = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([0, 255], 1, false)),
      componentType: 5121, normalized: true, count: 2, type: "SCALAR"
    });
    const s8 = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([-128, 127], 1, true)),
      componentType: 5120, normalized: true, count: 2, type: "SCALAR"
    });
    const u16raw = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([65535], 2, false)),
      componentType: 5123, count: 1, type: "SCALAR"
    });
    const { gltf, bin } = b.build();
    const host = { gltf, glbBin: binView(bin) };
    expect(Array.from(decodeAccessor(host, s16)!.data)).toEqual([-1, -1, 0, 1]);
    expect(Array.from(decodeAccessor(host, u8)!.data)).toEqual([0, 1]);
    expect(Array.from(decodeAccessor(host, s8)!.data)).toEqual([-1, 1]);
    expect(Array.from(decodeAccessor(host, u16raw)!.data)).toEqual([65535]);
  });

  it("returns null for out-of-range / missing data, and readAccessorElements still works", () => {
    const b = new BinBuilder();
    const ok = b.floats("VEC2", [1, 2, 3, 4], 2);
    const bad = b.accessor({ bufferView: 0, componentType: 5126, count: 100, type: "VEC2" });
    const { gltf, bin } = b.build();
    const host = { gltf, glbBin: binView(bin) };
    expect(decodeAccessor(host, bad)).toBeNull();
    expect(decodeAccessor({ gltf, glbBin: null }, ok)).toBeNull();
    expect(readAccessorElements(host, ok)).toEqual([[1, 2], [3, 4]]);
  });
});

describe("animation sampling", () => {
  it("(a) normalized SHORT rotation clip slerps like float data", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const q = Math.round(Math.SQRT1_2 * 32767);
    const output = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([0, 0, 0, 32767, 0, 0, q, q], 2, true)),
      componentType: 5122, normalized: true, count: 2, type: "VEC4"
    });
    b.animation([{ input, output, path: "rotation" }]);
    const node = sample(b.build(), 0.5);
    const half = Math.PI / 8; // 45 degrees about z => half-angle 22.5 degrees
    expect(node.rotation[2]).toBeCloseTo(Math.sin(half), 4);
    expect(node.rotation[3]).toBeCloseTo(Math.cos(half), 4);
    expect(Math.hypot(...node.rotation)).toBeCloseTo(1, 5);
  });

  it("(b) interleaved (byteStride) translation + scale accessors sample correctly", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    // Two keys, stride 28: translation(12) scale(12) + 4 bytes of padding.
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
    const node = sample(b.build(), 0.5);
    expect(node.translation).toEqual([2, 3, 4]);
    expect(node.scale).toEqual([2, 3, 4]);
  });

  it("(c) sparse accessors: no-bufferView base (zeros) and bufferView base with uint16 indices", () => {
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
    expect(Array.from(decodeAccessor({ gltf: fx.gltf, glbBin: binView(fx.bin) }, zeroBase)!.data)).toEqual([0, 0, 0, 10, 20, 30, 0, 0, 0]);
    const at05 = sample(fx, 0.5);
    expect(at05.translation).toEqual([5, 10, 15]);
    expect(at05.scale).toEqual([4.5, 4.5, 4.5]); // lerp(7, 2)
    const at15 = sample(fx, 1.5);
    expect(at15.translation).toEqual([5, 10, 15]); // lerp((10,20,30), 0)
    expect(at15.scale).toEqual([5.5, 5.5, 5.5]); // lerp(2, 9)
  });

  it("(d) CUBICSPLINE translation matches the hand-computed Hermite value", () => {
    const fx = cubicTranslationFixture();
    // dt=2, u=0.5: 0.5*v0 + 0.125*dt*out0 + 0.5*v1 - 0.125*dt*in1
    //  = 0 + 0.25*(1,2,3) + (5,5,5) - 0.25*(4,5,6) = (4.25, 4.25, 4.25)
    sample(fx, 1).translation.forEach((c: number) => expect(c).toBeCloseTo(4.25, 5));
    // Clamping uses the keyframe VALUE, never a tangent.
    expect(sample(fx, 2).translation).toEqual([10, 10, 10]);
    expect(sample(fx, 0).translation).toEqual([0, 0, 0]);
    // u=0.25 (t=0.5): h10=0.140625 h01=0.15625 h11=-0.046875 (h00 term is 0: v0=0)
    const q = sample(fx, 0.5).translation;
    expect(q[0]).toBeCloseTo(0.140625 * 2 * 1 + 0.15625 * 10 - 0.046875 * 2 * 4, 5);
    expect(q[2]).toBeCloseTo(0.140625 * 2 * 3 + 0.15625 * 10 - 0.046875 * 2 * 6, 5);
  });

  it("(d) CUBICSPLINE rotation is Hermite then normalized (unit length)", () => {
    const fx = cubicRotationFixture();
    const s = Math.SQRT1_2;
    // dt=1, u=0.5: weights (0.5, 0.125, 0.5, -0.125)
    const z = 0.125 * 0.8 + 0.5 * s;
    const w = 0.5 + 0.5 * s - 0.125 * 0.4;
    const n = Math.hypot(z, w);
    const node = sample(fx, 0.5);
    expect(Math.hypot(...node.rotation)).toBeCloseTo(1, 6);
    expect(Math.abs(n - 1)).toBeGreaterThan(0.01); // normalization actually mattered
    expect(node.rotation[2]).toBeCloseTo(z / n, 5);
    expect(node.rotation[3]).toBeCloseTo(w / n, 5);
  });

  it("morph weights: LINEAR and CUBICSPLINE with per-target values", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const linear = b.floats("SCALAR", [0, 1, 1, 0], 1); // 2 keys x 2 targets
    // cubic: per key [in(2), v(2), out(2)], zero tangents
    const cubic = b.floats("SCALAR", [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], 1);
    b.animation([{ input, output: linear, path: "weights" }]);
    b.animation([{ input, output: cubic, interpolation: "CUBICSPLINE", path: "weights" }]);
    const { gltf, bin } = b.build();
    const host = { gltf, glbBin: binView(bin) };
    applyAnimationAt(host, 0, 0.25);
    expect(gltf.nodes[0].weights).toEqual([0.25, 0.75]);
    applyAnimationAt(host, 1, 0.5);
    expect(gltf.nodes[0].weights[0]).toBeCloseTo(0.5, 6); // h01=0.5 at u=0.5 for v 0 -> 1
    expect(gltf.nodes[0].weights[1]).toBeCloseTo(0.5, 6);
  });

  it("STEP holds the key value (including exactly on a key) and single keyframes clamp", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [1, 2, 3], 1);
    const out = b.floats("VEC3", [1, 1, 1, 2, 2, 2, 3, 3, 3], 3);
    const one = b.floats("SCALAR", [0.5], 1);
    const oneOut = b.floats("VEC3", [4, 5, 6], 3);
    b.animation([{ input, output: out, interpolation: "STEP", path: "translation" }]);
    b.animation([{ input: one, output: oneOut, path: "translation" }]);
    const { gltf, bin } = b.build();
    const host = { gltf, glbBin: binView(bin) };
    applyAnimationAt(host, 0, 2);
    expect(gltf.nodes[0].translation).toEqual([2, 2, 2]);
    applyAnimationAt(host, 0, 2.9);
    expect(gltf.nodes[0].translation).toEqual([2, 2, 2]);
    applyAnimationAt(host, 1, 0.3);
    expect(gltf.nodes[0].translation).toEqual([4, 5, 6]);
  });

  it("reports undecodable channels via skippedChannels instead of silently dropping", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const bad = b.accessor({ bufferView: 0, componentType: 5126, count: 50, type: "VEC3" });
    b.animation([{ input, output: bad, path: "translation" }]);
    const { gltf, bin } = b.build();
    const result = applyAnimationAt({ gltf, glbBin: binView(bin) }, 0, 0.5);
    expect(result).toMatchObject({ wroteAny: false, skippedChannels: 1 });
  });
});

describe("animation cache", () => {
  it("decodes each accessor once; later ticks are cache-only", () => {
    const fx = cubicTranslationFixture();
    const glbBin = binView(fx.bin);
    applyAnimationAt({ gltf: fx.gltf, glbBin }, 0, 0.1);
    const first = getAnimationCacheStats({ gltf: fx.gltf, glbBin });
    expect(first.decodes).toBe(2); // input + output
    for (let i = 0; i < 1000; i += 1) {
      // A fresh host wrapper per call, exactly like the interpreter does.
      applyAnimationAt({ gltf: fx.gltf, glbBin }, 0, (i % 20) / 10);
    }
    expect(getAnimationCacheStats({ gltf: fx.gltf, glbBin }).decodes).toBe(first.decodes);
  });

  it("invalidateAnimationCache and a swapped binary chunk force a re-decode", () => {
    const fx = cubicTranslationFixture();
    const host = { gltf: fx.gltf, glbBin: binView(fx.bin) };
    applyAnimationAt(host, 0, 1);
    invalidateAnimationCache(fx.gltf);
    applyAnimationAt(host, 0, 1);
    expect(getAnimationCacheStats(host).decodes).toBe(2);
    const other = { gltf: fx.gltf, glbBin: binView(fx.bin.slice()) };
    applyAnimationAt(other, 0, 1);
    expect(getAnimationCacheStats(other).decodes).toBe(4);
  });

  it("monotonic and random-order sampling agree (last-key fast path vs binary search)", () => {
    const b = new BinBuilder();
    const times = Array.from({ length: 50 }, (_, i) => i * 0.1);
    const input = b.floats("SCALAR", times, 1);
    const out = b.floats("VEC3", times.flatMap((t) => [t, t * 2, -t]), 3);
    b.animation([{ input, output: out, path: "translation" }]);
    const { gltf, bin } = b.build();
    const host = { gltf, glbBin: binView(bin) };
    for (const t of [0.05, 0.15, 0.25, 3.33, 0.01, 4.85, 2.5, 2.51, 1.0]) {
      applyAnimationAt(host, 0, t);
      expect(gltf.nodes[0].translation[0]).toBeCloseTo(t, 5);
      expect(gltf.nodes[0].translation[1]).toBeCloseTo(t * 2, 5);
    }
  });
});
