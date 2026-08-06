// Task #10: KHR_interactivity spec's interpolation-kill semantics, at the
// kernel scheduler level. Three normative rules (Specification.adoc):
//   - variable/set step 2a: setting a variable silently kills any in-flight
//     variable/interpolate targeting it (its done flow never fires).
//   - variable/interpolate step 5: starting a new interpolation for the SAME
//     variable silently kills (replaces) an existing one for that variable.
//   - pointer/set step 5: setting a pointer silently kills any in-flight
//     pointer/interpolate targeting the same effective JSON Pointer.
// (pointer/interpolate's own same-pointer replacement was already
// implemented before this task — addPointerInterp calling killPointerInterp
// first — see this file's "interpolate-replaces-same-pointer" test, which
// pins pre-existing behavior rather than task #10 itself.)
//
// This is deliberately a kernel-only test: it drives createScheduler
// directly against a mock SchedulerEffects, independent of any of the five
// engines that embed this scheduler (interpreter.ts, engine.ts, and the
// lua/py/cs/gd ports) — each of those gets its own equivalent test at its
// own layer (see packages/runtime/test/interpolation-kill.test.ts for the
// interpreter, packages/runtime-lib/test/engine.test.ts for the compiled TS
// engine).
import { describe, expect, it } from "vitest";
import { createScheduler, type SchedulerEffects } from "../src/scheduler.js";
import type { Value } from "../src/value.js";

type Cont = () => void;

function makeEffects() {
  const fired: string[] = [];
  const variableWrites: Array<{ variableIndex: number; value: Value }> = [];
  const pointerWrites: Array<{ pointer: string; value: number | number[] }> = [];
  const effects: SchedulerEffects<Cont> = {
    fireFlow(cont) {
      cont();
    },
    applyAnimationSample() {
      // not exercised by these tests
    },
    setPointer(pointer, value) {
      pointerWrites.push({ pointer, value });
    },
    setVariable(variableIndex, value) {
      variableWrites.push({ variableIndex, value });
    },
    onTickPhase() {
      // not exercised by these tests
    }
  };
  return { effects, fired, variableWrites, pointerWrites };
}

const FLOAT = (n: number): Value => ({ type: "float", data: [n] });

describe("scheduler: variable/set kills in-flight variable/interpolate (spec step 2a)", () => {
  it("killVariableInterp drops the table entry — its done flow never fires, and it stops receiving writes", () => {
    const { effects, fired, variableWrites } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);

    scheduler.addVariableInterp({
      variableIndex: 0,
      duration: 1,
      startValue: FLOAT(0),
      endValue: FLOAT(10),
      p1: [0, 0],
      p2: [1, 1],
      useSlerp: false,
      doneCont: () => fired.push("interp-done")
    });

    scheduler.advance(0.5);
    expect(variableWrites).toHaveLength(1);
    expect(fired).toEqual([]);

    // Simulate a graph-level variable/set targeting the same variable.
    scheduler.killVariableInterp(0);

    // Advance well past the original duration: no further writes, and the
    // done continuation must never fire.
    scheduler.advance(1.0);
    expect(variableWrites).toHaveLength(1);
    expect(fired).toEqual([]);
  });

  it("killing a different variableIndex leaves the entry untouched", () => {
    const { effects, fired } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);
    scheduler.addVariableInterp({
      variableIndex: 0,
      duration: 0.5,
      startValue: FLOAT(0),
      endValue: FLOAT(1),
      p1: [0, 0],
      p2: [1, 1],
      useSlerp: false,
      doneCont: () => fired.push("done")
    });
    scheduler.killVariableInterp(1);
    scheduler.advance(1.0);
    expect(fired).toEqual(["done"]);
  });
});

describe("scheduler: variable/interpolate replaces a same-variable entry (spec step 5)", () => {
  it("addVariableInterp for an already-interpolating variable kills the old entry first — only the new one's done flow ever fires", () => {
    const { effects, fired, variableWrites } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);

    scheduler.addVariableInterp({
      variableIndex: 0,
      duration: 1,
      startValue: FLOAT(0),
      endValue: FLOAT(10),
      p1: [0, 0],
      p2: [1, 1],
      useSlerp: false,
      doneCont: () => fired.push("first")
    });
    scheduler.advance(0.2);

    // A second variable/interpolate targeting the SAME variable arrives
    // mid-flight — it must silently replace the first (old done never
    // fires), matching addPointerInterp's existing same-pointer behavior.
    scheduler.addVariableInterp({
      variableIndex: 0,
      duration: 1,
      startValue: FLOAT(100),
      endValue: FLOAT(200),
      p1: [0, 0],
      p2: [1, 1],
      useSlerp: false,
      doneCont: () => fired.push("second")
    });

    scheduler.advance(1.5);
    expect(fired).toEqual(["second"]);
    // Final write lands on the SECOND interpolation's endValue, not the
    // first's.
    const last = variableWrites[variableWrites.length - 1];
    expect(last.value).toEqual(FLOAT(200));
  });
});

describe("scheduler: pointer/set kills in-flight pointer/interpolate (spec step 5)", () => {
  it("killPointerInterp drops the table entry — its done flow never fires", () => {
    const { effects, fired, pointerWrites } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);

    scheduler.addPointerInterp({
      pointer: "/nodes/0/translation",
      duration: 1,
      startValue: [0, 0, 0],
      endValue: [10, 10, 10],
      p1: [0, 0],
      p2: [1, 1],
      isQuaternion: false,
      doneCont: () => fired.push("ptr-done")
    });

    scheduler.advance(0.5);
    expect(pointerWrites).toHaveLength(1);

    // Simulate a graph-level pointer/set targeting the same effective
    // pointer.
    scheduler.killPointerInterp("/nodes/0/translation");

    scheduler.advance(1.0);
    expect(pointerWrites).toHaveLength(1);
    expect(fired).toEqual([]);
  });

  it("interpolate-replaces-same-pointer: addPointerInterp for the same pointer kills the old entry (pre-existing behavior, pinned alongside the new variable/pointer set-kill rules)", () => {
    const { effects, fired } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);
    scheduler.addPointerInterp({
      pointer: "/nodes/0/translation",
      duration: 1,
      startValue: [0, 0, 0],
      endValue: [10, 10, 10],
      p1: [0, 0],
      p2: [1, 1],
      isQuaternion: false,
      doneCont: () => fired.push("first")
    });
    scheduler.addPointerInterp({
      pointer: "/nodes/0/translation",
      duration: 1,
      startValue: [0, 0, 0],
      endValue: [20, 20, 20],
      p1: [0, 0],
      p2: [1, 1],
      isQuaternion: false,
      doneCont: () => fired.push("second")
    });
    scheduler.advance(2);
    expect(fired).toEqual(["second"]);
  });
});

describe("scheduler: an interpolation's own per-tick writes never self-kill", () => {
  it("advancing a variable/interpolate to completion in several small steps fires its done continuation exactly once (the scheduler never calls killVariableInterp from inside advance())", () => {
    const { effects, fired, variableWrites } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);
    scheduler.addVariableInterp({
      variableIndex: 0,
      duration: 1,
      startValue: FLOAT(0),
      endValue: FLOAT(10),
      p1: [0, 0],
      p2: [1, 1],
      useSlerp: false,
      doneCont: () => fired.push("done")
    });

    // Four ticks of the scheduler's own internal writes, mid-flight — none
    // of them may drop the table entry.
    scheduler.advance(0.25);
    scheduler.advance(0.25);
    scheduler.advance(0.25);
    expect(fired).toEqual([]);
    expect(variableWrites).toHaveLength(3);

    scheduler.advance(0.25);
    expect(fired).toEqual(["done"]);
    expect(variableWrites).toHaveLength(4);
    expect(variableWrites[3].value).toEqual(FLOAT(10));
  });

  it("same, for a pointer/interpolate", () => {
    const { effects, fired, pointerWrites } = makeEffects();
    const scheduler = createScheduler<Cont>(effects);
    scheduler.addPointerInterp({
      pointer: "/nodes/0/translation",
      duration: 1,
      startValue: [0, 0, 0],
      endValue: [10, 10, 10],
      p1: [0, 0],
      p2: [1, 1],
      isQuaternion: false,
      doneCont: () => fired.push("done")
    });
    scheduler.advance(0.5);
    scheduler.advance(0.49);
    expect(fired).toEqual([]);
    scheduler.advance(0.01);
    expect(fired).toEqual(["done"]);
    expect(pointerWrites[pointerWrites.length - 1].value).toEqual([10, 10, 10]);
  });
});
