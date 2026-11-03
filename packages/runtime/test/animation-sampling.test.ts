import { describe, expect, it } from "vitest";
import { advanceTime, createRuntime } from "../src/interpreter.js";
import { createEngine } from "../../runtime-lib/src/engine.js";
import { BinBuilder, cubicRotationFixture, cubicTranslationFixture } from "../../kernel/test/animation-fixtures.js";

// Drives the real consumers (interpreter scheduler + compiled engine) over
// in-memory fixtures; kernel/test/animation.test.ts covers the sampler math.

describe("interpreter animation playback uses full accessor decoding", () => {
  it("samples a CUBICSPLINE translation clip through createRuntime({binary})", () => {
    const fx = cubicTranslationFixture();
    const writes: Array<[string, number[]]> = [];
    const runtime = createRuntime({}, fx.gltf, {
      binary: fx.bin,
      onPointerSet: (pointer, value) => writes.push([pointer, value as number[]])
    });
    runtime.scheduler.startAnimation({ animationIndex: 0, startTime: 0, endTime: 2, speed: 1 });
    advanceTime(runtime, 1);
    expect(writes.at(-1)![0]).toBe("/nodes/0/translation");
    runtime.gltf.nodes[0].translation.forEach((c: number) => expect(c).toBeCloseTo(4.25, 5));
  });

  it("samples a normalized-SHORT interleaved rotation clip", () => {
    const b = new BinBuilder();
    const input = b.floats("SCALAR", [0, 1], 1);
    const q = Math.round(Math.SQRT1_2 * 32767);
    // stride 12: 4 shorts of rotation + 4 bytes padding
    const view = b.bufferView(BinBuilder.intBytes([0, 0, 0, 32767, 0, 0, 0, 0, q, q, 0, 0], 2, true), 12);
    const output = b.accessor({ bufferView: view, componentType: 5122, normalized: true, count: 2, type: "VEC4" });
    b.animation([{ input, output, path: "rotation" }]);
    const fx = b.build();
    const runtime = createRuntime({}, fx.gltf, { binary: fx.bin });
    runtime.scheduler.startAnimation({ animationIndex: 0, startTime: 0, endTime: 1, speed: 1 });
    advanceTime(runtime, 0.5);
    const r = runtime.gltf.nodes[0].rotation;
    expect(Math.hypot(...r)).toBeCloseTo(1, 5);
    expect(r[2]).toBeCloseTo(Math.sin(Math.PI / 8), 4);
  });
});

describe("compiled engine (runtime-lib) animation playback", () => {
  it("samples CUBICSPLINE rotation (unit length) and keeps decoding off the tick path", () => {
    const fx = cubicRotationFixture();
    const writes: Array<[string, number[]]> = [];
    const factory = createEngine((rt) => {
      rt.onStart(() => {
        rt.animStart("/animations/0", 0, 1, 1);
      });
    });
    const engine = factory({
      gltf: fx.gltf,
      glbBin: fx.bin,
      onPointerSet: (pointer, value) => writes.push([pointer, value as number[]])
    });
    engine.start();
    engine.advance(0.5);
    expect(writes.at(-1)![0]).toBe("/nodes/0/rotation");
    const r = writes.at(-1)![1];
    expect(Math.hypot(...r)).toBeCloseTo(1, 6);
    expect(r[2]).toBeGreaterThan(0.4);
    const count = writes.length;
    for (let i = 0; i < 50; i += 1) {
      engine.advance(0.01);
    }
    expect(writes.length).toBeGreaterThan(count);
  });
});
