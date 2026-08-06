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

// DOM-less coverage for the KHR_node_selectability/hoverability additions
// (EngineBuilder.onSelect/onHoverIn/onHoverOut + EngineInteractive.fireSelect/
// fireHoverIn/fireHoverOut) — proves the compiled engine's ancestor-chain
// bubbling and stopPropagation short-circuit without needing a browser or
// emit-ts, mirroring packages/runtime/test/host.test.ts's identical scenario
// against the interpreter so both engines' behavior is checked to agree.
// See apps/viewer's engine-host.ts for how the real viewer wires this up;
// this is the "DOM-less engine-path unit test" fallback the task report
// documents in place of a working headless-Chrome smoke run on this sandbox
// (no /dev/dri render-node group membership -> WebGPU forced onto a
// software path that can obtain a device but can't sustain the canvas
// swap-chain — see scripts/render-verify.mjs's header comment).
describe("createEngine KHR_node_selectability bubbling", () => {
  // root(0) -> mid(1) -> leaf(2): a plain 3-level chain with no gltf.nodes
  // beyond what computeNodeParents needs (children arrays).
  const gltf = { nodes: [{ children: [1] }, { children: [2] }, {}] };

  it("fires handlers deepest-first and stops bubbling once a stopPropagation handler fires", () => {
    const fired: number[] = [];
    const factory = createEngine((rt) => {
      rt.onSelect(0, false, () => fired.push(0));
      rt.onSelect(1, true, () => fired.push(1)); // stopPropagation: true
      rt.onSelect(2, false, () => fired.push(2));
    });
    const engine = factory({ gltf });
    engine.fireSelect(2, [1, 2, 3]);
    // node2 (the hit node) fires first, then node1 (whose handler stops
    // propagation) — node0's handler must NOT fire.
    expect(fired).toEqual([2, 1]);
  });

  it("passes the hit node's selectedNode/selectedNodeIndex/selectionPoint/selectionRayOrigin to every bubbled handler", () => {
    const seen: unknown[] = [];
    const factory = createEngine((rt) => {
      rt.onSelect(0, false, (params) => seen.push(params));
      rt.onSelect(2, false, (params) => seen.push(params));
    });
    const engine = factory({ gltf });
    engine.fireSelect(2, [1, 2, 3], [4, 5, 6], 7);
    expect(seen).toEqual([
      { selectedNode: "/nodes/2", selectedNodeIndex: 2, controllerIndex: 7, selectionPoint: [1, 2, 3], selectionRayOrigin: [4, 5, 6] },
      { selectedNode: "/nodes/2", selectedNodeIndex: 2, controllerIndex: 7, selectionPoint: [1, 2, 3], selectionRayOrigin: [4, 5, 6] }
    ]);
  });

  it("is a no-op for a negative nodeIndex (mirrors host.ts's setSelection guard)", () => {
    const fired: number[] = [];
    const factory = createEngine((rt) => {
      rt.onSelect(0, false, () => fired.push(0));
    });
    factory({ gltf }).fireSelect(-1, [0, 0, 0]);
    expect(fired).toEqual([]);
  });
});

describe("createEngine KHR_node_hoverability transitions", () => {
  // root(0) -> mid(1) -> {leafA(2), leafB(3)}: two leaves sharing root+mid as
  // ancestors, so moving hover from one leaf to the other must NOT re-fire
  // onHoverIn/onHoverOut on the shared ancestors (root, mid).
  const gltf = { nodes: [{ children: [1] }, { children: [2, 3] }, {}, {}] };

  it("fires onHoverIn up the whole chain on the first hover, then only the non-shared part on a move to a sibling leaf", () => {
    const inFired: number[] = [];
    const outFired: number[] = [];
    const factory = createEngine((rt) => {
      for (const node of [0, 1, 2, 3]) {
        rt.onHoverIn(node, () => inFired.push(node));
        rt.onHoverOut(node, () => outFired.push(node));
      }
    });
    const engine = factory({ gltf });

    engine.fireHoverIn(2, [0, 0, 0]);
    expect(inFired.slice().sort()).toEqual([0, 1, 2]);
    expect(outFired).toEqual([]);

    inFired.length = 0;
    engine.fireHoverIn(3, [0, 0, 0]);
    // Only leafA (2) — the part of the old chain not shared with the new
    // one — gets onHoverOut; root(0)/mid(1) stay "hovered" throughout.
    expect(outFired).toEqual([2]);
    // Only leafB (3) — the part of the new chain not shared with the old
    // one — gets onHoverIn; root(0)/mid(1) don't re-fire.
    expect(inFired).toEqual([3]);
  });

  it("fireHoverOut clears the current hover exactly like fireHoverIn(-1)", () => {
    const inFired: number[] = [];
    const outFired: number[] = [];
    const factory = createEngine((rt) => {
      rt.onHoverIn(2, () => inFired.push(2));
      rt.onHoverOut(2, () => outFired.push(2));
    });
    const engine = factory({ gltf });
    engine.fireHoverIn(2, [0, 0, 0]);
    expect(inFired).toEqual([2]);
    engine.fireHoverOut(2);
    expect(outFired).toEqual([2]);
  });

  it("re-hovering the already-hovered node is a no-op (mirrors host.ts's setHover early-return)", () => {
    const inFired: number[] = [];
    const factory = createEngine((rt) => {
      rt.onHoverIn(2, () => inFired.push(2));
    });
    const engine = factory({ gltf });
    engine.fireHoverIn(2, [0, 0, 0]);
    engine.fireHoverIn(2, [0, 0, 0]);
    expect(inFired).toEqual([2]);
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

// Task #10: KHR_interactivity spec's interpolation-kill semantics, wired into
// this compiled engine's two variable/set entry points (the `V.<name>`
// property setter emit-ts's "setVar" case lowers every compiled
// variable/set to, and the index-based `rt.setVar` used by hand-authored
// fixtures/tests) and its pointer/set entry point (`rt.ptrSet`, via
// pointer.ts's PointerHost.killPointerInterp hook). Companion to
// packages/kernel/test/scheduler.test.ts (same three rules at the kernel
// scheduler API level) and packages/runtime/test/interpolation-kill.test.ts
// (the interpreter equivalent) — all three engines are expected to agree.
describe("createEngine interpolation-kill semantics (task #10)", () => {
  it("the `V.<name>` setter kills an in-flight variable/interpolate for that variable (spec variable/set step 2a)", () => {
    const factory = createEngine((rt) => {
      const V = rt.vars({ v0: { type: "float", initial: 0 }, v1: { type: "float", initial: 0 } });
      rt.onStart(() => {
        rt.varInterp(0, 10, 1, [0, 0], [1, 1], false, () => {
          V.v1 = 1;
        });
        const slot = rt.delayState();
        rt.setDelay(slot, 0.3, () => {
          V.v0 = 999;
        });
      });
    });
    const engine = factory();
    engine.start();
    engine.advance(0.3);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [999] });
    engine.advance(0.5);
    engine.advance(0.5);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [999] });
    expect(engine.getVariableByIndex(1)).toEqual({ type: "float", data: [0] });
  });

  it("rt.setVar (index-based) kills an in-flight variable/interpolate for that variable (spec variable/set step 2a)", () => {
    const factory = createEngine((rt) => {
      rt.vars([{ type: "float", initial: 0 }, { type: "float", initial: 0 }]);
      rt.onStart(() => {
        rt.varInterp(0, 10, 1, [0, 0], [1, 1], false, () => {
          rt.setVar(1, 1);
        });
        const slot = rt.delayState();
        rt.setDelay(slot, 0.3, () => {
          rt.setVar(0, 999);
        });
      });
    });
    const engine = factory();
    engine.start();
    engine.advance(0.3);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [999] });
    engine.advance(1.0);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [999] });
    expect(engine.getVariableByIndex(1)).toEqual({ type: "float", data: [0] });
  });

  it("varInterp for an already-interpolating variable replaces the old entry — only the new one's done fires (spec variable/interpolate step 5)", () => {
    const factory = createEngine((rt) => {
      const V = rt.vars({ v0: { type: "float", initial: 0 }, v1: { type: "float", initial: 0 } });
      rt.onStart(() => {
        rt.varInterp(0, 10, 1, [0, 0], [1, 1], false, () => {
          V.v1 = 1;
        });
        rt.varInterp(0, 20, 1, [0, 0], [1, 1], false, () => {
          V.v1 = 2;
        });
      });
    });
    const engine = factory();
    engine.start();
    engine.advance(1.0);
    engine.advance(0.1);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [20] });
    expect(engine.getVariableByIndex(1)).toEqual({ type: "float", data: [2] });
  });

  it("rt.ptrSet kills an in-flight ptrInterp for the same effective pointer (spec pointer/set step 5)", () => {
    const writes: Array<{ pointer: string; value: unknown }> = [];
    const factory = createEngine((rt) => {
      const V = rt.vars({ v0: { type: "float", initial: 0 } });
      rt.onStart(() => {
        rt.ptrInterp("/nodes/0/translation", "float3", [10, 10, 10], 1, [0, 0], [1, 1], () => {
          V.v0 = 1;
        });
        const slot = rt.delayState();
        rt.setDelay(slot, 0.3, () => {
          rt.ptrSet("/nodes/0/translation", "float3", [999, 999, 999]);
        });
      });
    });
    const engine = factory({ gltf: { nodes: [{}] }, onPointerSet: (pointer, value) => writes.push({ pointer, value }) });
    engine.start();
    engine.advance(0.3);
    expect(writes[writes.length - 1]).toEqual({ pointer: "/nodes/0/translation", value: [999, 999, 999] });
    engine.advance(0.5);
    engine.advance(0.5);
    expect(writes[writes.length - 1]).toEqual({ pointer: "/nodes/0/translation", value: [999, 999, 999] });
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [0] });
  });

  it("an interpolation's own per-tick writes never self-kill: varInterp ticked to completion in small steps fires done exactly once", () => {
    const factory = createEngine((rt) => {
      const V = rt.vars({ v0: { type: "float", initial: 0 }, v1: { type: "float", initial: 0 } });
      rt.onStart(() => {
        rt.varInterp(0, 10, 1, [0, 0], [1, 1], false, () => {
          V.v1 = 1;
        });
      });
    });
    const engine = factory();
    engine.start();
    engine.advance(0.25);
    engine.advance(0.25);
    engine.advance(0.25);
    expect(engine.getVariableByIndex(1)).toEqual({ type: "float", data: [0] });
    const midValue = (engine.getVariableByIndex(0).data as number[])[0];
    expect(midValue).toBeGreaterThan(0);
    expect(midValue).toBeLessThan(10);
    engine.advance(0.25);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [10] });
    expect(engine.getVariableByIndex(1)).toEqual({ type: "float", data: [1] });
  });

  it("an interpolation's own per-tick writes never self-kill: ptrInterp ticked to completion in small steps fires done exactly once", () => {
    const writes: Array<{ pointer: string; value: unknown }> = [];
    const factory = createEngine((rt) => {
      const V = rt.vars({ v0: { type: "float", initial: 0 } });
      rt.onStart(() => {
        rt.ptrInterp("/nodes/0/translation", "float3", [10, 10, 10], 1, [0, 0], [1, 1], () => {
          V.v0 = 1;
        });
      });
    });
    const engine = factory({ gltf: { nodes: [{}] }, onPointerSet: (pointer, value) => writes.push({ pointer, value }) });
    engine.start();
    engine.advance(0.5);
    engine.advance(0.49);
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [0] });
    engine.advance(0.01);
    expect(writes[writes.length - 1]).toEqual({ pointer: "/nodes/0/translation", value: [10, 10, 10] });
    expect(engine.getVariableByIndex(0)).toEqual({ type: "float", data: [1] });
  });
});
