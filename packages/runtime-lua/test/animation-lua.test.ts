// Executes the kernel animation fixtures (packages/kernel/test/animation.test.ts)
// through the Lua runtime's animation.lua: accessor decoding (normalized,
// interleaved byteStride, sparse incl. no-bufferView), CUBICSPLINE Hermite,
// morph weights, and the per-document decode cache.
import { describe, expect, it, beforeAll, afterEach } from "vitest";
import { LuaEngine, LuaFactory, type LuaWasm } from "wasmoon";
import { LUA_RUNTIME_SOURCE } from "../src/lua-sources.js";
import { BinBuilder, cubicRotationFixture, cubicTranslationFixture } from "../../kernel/test/animation-fixtures.js";

let cmodule: LuaWasm;
const openEngines: LuaEngine[] = [];

beforeAll(async () => {
  cmodule = await new LuaFactory().getLuaModule();
});

afterEach(() => {
  for (const lua of openEngines.splice(0)) lua.global.close();
});

function literal(bytes: Uint8Array): string {
  let out = '"';
  for (const b of bytes) out += `\\${String(b).padStart(3, "0")}`;
  return `${out}"`;
}

type Fixture = { gltf: any; bin: Uint8Array };

class LuaAnim {
  lua: LuaEngine;
  constructor(fx: Fixture) {
    this.lua = new LuaEngine(cmodule);
    openEngines.push(this.lua);
    this.lua.doStringSync(LUA_RUNTIME_SOURCE);
    this.lua.doStringSync(`
      G = json_decode(${literal(Buffer.from(JSON.stringify(fx.gltf), "utf8"))})
      B = ${literal(fx.bin)}
      function SAMPLE(anim, t, field)
        local r = anim_applyAnimationAt({ gltf = G, glbBin = B }, anim, t)
        assert(r ~= nil, "animation missing")
        return G.nodes[1][field]
      end
      function RESULT(anim, t)
        local r = anim_applyAnimationAt({ gltf = G, glbBin = B }, anim, t)
        return r.skippedChannels * 10 + (r.wroteAny and 1 or 0)
      end
      function DECODES()
        local d = anim_getAnimationCacheStats({ gltf = G, glbBin = B })
        return d
      end
      function INVALIDATE() anim_invalidateAnimationCache(G) end
      function DECODE(idx)
        local d = anim_decodeAccessor({ gltf = G, glbBin = B }, idx)
        return d and d.data or nil
      end
    `);
  }
  sample(anim: number, t: number, field: string): number[] {
    return (this.lua.global.get("SAMPLE") as any)(anim, t, field);
  }
  decodes(): number {
    return (this.lua.global.get("DECODES") as any)();
  }
  decode(idx: number): number[] | null {
    return (this.lua.global.get("DECODE") as any)(idx) ?? null;
  }
  invalidate(): void {
    (this.lua.global.get("INVALIDATE") as any)();
  }
}

const close = (actual: number[], expected: number[], digits = 5) => {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((e, i) => expect(actual[i]).toBeCloseTo(e, digits));
};

describe("animation.lua accessor decoding + sampling", () => {
  it("decodes normalized SHORT/UBYTE/BYTE (incl. -32768 clamp) and raw USHORT", () => {
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
    const u16 = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([65535], 2, false)),
      componentType: 5123, count: 1, type: "SCALAR"
    });
    const bad = b.accessor({ bufferView: 0, componentType: 5126, count: 100, type: "VEC2" });
    const a = new LuaAnim(b.build());
    expect(a.decode(s16)).toEqual([-1, -1, 0, 1]);
    expect(a.decode(u8)).toEqual([0, 1]);
    expect(a.decode(s8)).toEqual([-1, 1]);
    expect(a.decode(u16)).toEqual([65535]);
    expect(a.decode(bad)).toBeNull();
  });

  it("(a) normalized SHORT rotation clip slerps like float data", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const q = Math.round(Math.SQRT1_2 * 32767);
    const output = b.accessor({
      bufferView: b.bufferView(BinBuilder.intBytes([0, 0, 0, 32767, 0, 0, q, q], 2, true)),
      componentType: 5122, normalized: true, count: 2, type: "VEC4"
    });
    b.animation([{ input, output, path: "rotation" }]);
    const r = new LuaAnim(b.build()).sample(0, 0.5, "rotation");
    const half = Math.PI / 8;
    expect(r[2]).toBeCloseTo(Math.sin(half), 4);
    expect(r[3]).toBeCloseTo(Math.cos(half), 4);
    expect(Math.hypot(...r)).toBeCloseTo(1, 5);
  });

  it("(b) interleaved (byteStride) translation + scale accessors", () => {
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
    const a = new LuaAnim(b.build());
    expect(a.sample(0, 0.5, "translation")).toEqual([2, 3, 4]);
    expect(a.sample(0, 0.5, "scale")).toEqual([2, 3, 4]);
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
    const a = new LuaAnim(b.build());
    expect(a.decode(zeroBase)).toEqual([0, 0, 0, 10, 20, 30, 0, 0, 0]);
    expect(a.sample(0, 0.5, "translation")).toEqual([5, 10, 15]);
    expect(a.sample(0, 0.5, "scale")).toEqual([4.5, 4.5, 4.5]);
    expect(a.sample(0, 1.5, "translation")).toEqual([5, 10, 15]);
    expect(a.sample(0, 1.5, "scale")).toEqual([5.5, 5.5, 5.5]);
  });

  it("(d) CUBICSPLINE translation matches the hand-computed Hermite value (4.25)", () => {
    const a = new LuaAnim(cubicTranslationFixture());
    close(a.sample(0, 1, "translation"), [4.25, 4.25, 4.25]);
    // Clamping uses the keyframe VALUE, never a tangent.
    expect(a.sample(0, 2, "translation")).toEqual([10, 10, 10]);
    expect(a.sample(0, 0, "translation")).toEqual([0, 0, 0]);
    const q = a.sample(0, 0.5, "translation");
    expect(q[0]).toBeCloseTo(0.140625 * 2 * 1 + 0.15625 * 10 - 0.046875 * 2 * 4, 5);
    expect(q[2]).toBeCloseTo(0.140625 * 2 * 3 + 0.15625 * 10 - 0.046875 * 2 * 6, 5);
  });

  it("(d) CUBICSPLINE rotation is Hermite then normalized (unit length)", () => {
    const a = new LuaAnim(cubicRotationFixture());
    const s = Math.SQRT1_2;
    const z = 0.125 * 0.8 + 0.5 * s;
    const w = 0.5 + 0.5 * s - 0.125 * 0.4;
    const n = Math.hypot(z, w);
    const r = a.sample(0, 0.5, "rotation");
    expect(Math.hypot(...r)).toBeCloseTo(1, 6);
    expect(Math.abs(n - 1)).toBeGreaterThan(0.01);
    expect(r[2]).toBeCloseTo(z / n, 5);
    expect(r[3]).toBeCloseTo(w / n, 5);
  });

  it("morph weights: LINEAR and CUBICSPLINE with per-target values", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const linear = b.floats("SCALAR", [0, 1, 1, 0], 1);
    const cubic = b.floats("SCALAR", [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], 1);
    b.animation([{ input, output: linear, path: "weights" }]);
    b.animation([{ input, output: cubic, interpolation: "CUBICSPLINE", path: "weights" }]);
    const a = new LuaAnim(b.build());
    expect(a.sample(0, 0.25, "weights")).toEqual([0.25, 0.75]);
    close(a.sample(1, 0.5, "weights"), [0.5, 0.5], 6);
  });

  it("STEP holds the key value and single keyframes clamp", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [1, 2, 3], 1);
    const out = b.floats("VEC3", [1, 1, 1, 2, 2, 2, 3, 3, 3], 3);
    const one = b.floats("SCALAR", [0.5], 1);
    const oneOut = b.floats("VEC3", [4, 5, 6], 3);
    b.animation([{ input, output: out, interpolation: "STEP", path: "translation" }]);
    b.animation([{ input: one, output: oneOut, path: "translation" }]);
    const a = new LuaAnim(b.build());
    expect(a.sample(0, 2, "translation")).toEqual([2, 2, 2]);
    expect(a.sample(0, 2.9, "translation")).toEqual([2, 2, 2]);
    expect(a.sample(1, 0.3, "translation")).toEqual([4, 5, 6]);
  });

  it("reports undecodable channels via skippedChannels", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const bad = b.accessor({ bufferView: 0, componentType: 5126, count: 50, type: "VEC3" });
    b.animation([{ input, output: bad, path: "translation" }]);
    const a = new LuaAnim(b.build());
    const res = (a.lua.global.get("RESULT") as any)(0, 0.5);
    expect(res).toBe(10); // 1 skipped channel, nothing written
  });

  it("monotonic and random-order sampling agree (last-key fast path vs binary search)", () => {
    const b = new BinBuilder();
    const times = Array.from({ length: 50 }, (_, i) => i * 0.1);
    const input = b.floats("SCALAR", times, 1);
    const out = b.floats("VEC3", times.flatMap((t) => [t, t * 2, -t]), 3);
    b.animation([{ input, output: out, path: "translation" }]);
    const a = new LuaAnim(b.build());
    for (const t of [0.05, 0.15, 0.25, 3.33, 0.01, 4.85, 2.5, 2.51, 1.0]) {
      const r = a.sample(0, t, "translation");
      expect(r[0]).toBeCloseTo(t, 5);
      expect(r[1]).toBeCloseTo(t * 2, 5);
    }
  });
});

describe("animation.lua per-document cache", () => {
  it("decodes each accessor once; later ticks are cache-only", () => {
    const a = new LuaAnim(cubicTranslationFixture());
    a.sample(0, 0.1, "translation");
    const first = a.decodes();
    expect(first).toBe(2); // input + output
    for (let i = 0; i < 200; i += 1) a.sample(0, (i % 20) / 10, "translation");
    expect(a.decodes()).toBe(first);
  });

  it("anim_invalidateAnimationCache forces a re-decode", () => {
    const a = new LuaAnim(cubicTranslationFixture());
    a.sample(0, 1, "translation");
    a.invalidate();
    a.sample(0, 1, "translation");
    expect(a.decodes()).toBe(2);
  });
});
