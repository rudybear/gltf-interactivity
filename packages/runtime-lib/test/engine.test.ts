import { describe, expect, it } from "vitest";
import { createEngine } from "../src/engine.js";

// Mirrors packages/runtime/src/interpreter.ts's `runtime.randomState` LCG
// (same multiplier/increment/modulus, same default seed 123456789) to
// compute the expected sequence independently of engine.ts's own
// implementation.
function lcgSequence(seed: number, n: number): number[] {
  let state = seed;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    out.push(state / 0xffffffff);
  }
  return out;
}

describe("createEngine RNG parity", () => {
  it("rt.random() draws the interpreter's default-seeded LCG sequence", () => {
    const draws: number[] = [];
    const factory = createEngine((rt) => {
      rt.onStart(() => {
        draws.push(rt.random(), rt.random(), rt.random());
      });
    });
    factory().start();
    expect(draws).toEqual(lcgSequence(123456789, 3));
  });

  it("a non-default seed produces a different (but still deterministic) sequence", () => {
    const draws: number[] = [];
    const factory = createEngine((rt) => {
      rt.onStart(() => {
        draws.push(rt.random(), rt.random());
      });
    });
    factory({ seed: 42 }).start();
    expect(draws).toEqual(lcgSequence(42, 2));
    expect(draws).not.toEqual(lcgSequence(123456789, 2));
  });

  it("two engine instances from the same factory each get their own fresh RNG state", () => {
    const factory = createEngine((rt) => {
      rt.onStart(() => {
        rt.setVar(0, rt.random());
      });
      rt.vars([{ type: "float", initial: 0 }]);
    });
    const a = factory();
    const b = factory();
    a.start();
    b.start();
    expect(a.getVariableByIndex(0)).toEqual(b.getVariableByIndex(0));
  });
});

describe("createEngine variable indexing", () => {
  it("getVariableByIndex reflects declaration order and returns a kernel Value", () => {
    const factory = createEngine((rt) => {
      rt.vars([
        { type: "int", initial: 7 },
        { type: "bool", initial: true },
        { type: "float3", initial: [1, 2, 3] }
      ]);
    });
    const engine = factory();
    expect(engine.variableCount).toBe(3);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "int", data: [7] });
    expect(engine.getVariableByIndex(1)).toEqual({ type: "bool", data: [true] });
    expect(engine.getVariableByIndex(2)).toEqual({ type: "float3", data: [1, 2, 3] });
  });
});
