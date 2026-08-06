// Task #10: KHR_interactivity spec's interpolation-kill semantics, wired
// into the interpreter's variable/set and pointer/set op handlers (see
// interpreter.ts's "variable/set" case and handlePointerSet's
// runtime.scheduler.killPointerInterp(resolved) call for the actual wiring
// this test pins). Companion to packages/kernel/test/scheduler.test.ts
// (which exercises the same three rules at the kernel scheduler API level,
// independent of any engine) and packages/runtime-lib/test/engine.test.ts
// (the compiled-TS-engine equivalent).
//
// Graphs below are built directly as KHR_interactivity JSON (same style as
// pointer-bool-contract.test.ts's `lit` helper) rather than compiled from
// GIscript source, so each test exercises exactly the op sequence it names
// with no codegen machinery in between.
import { describe, expect, it } from "vitest";
import { InteractivityRuntime, type SceneAdapter } from "../src/host.js";
import type { Graph } from "../src/interpreter.js";

const FLOAT = 0;
const FLOAT2 = 1;
const FLOAT3 = 2;

function lit(typeIndex: number, value: Array<number | boolean | string>) {
  return { type: typeIndex, value };
}

function capturingAdapter(): { adapter: SceneAdapter; calls: Array<{ pointer: string; value: unknown }> } {
  const calls: Array<{ pointer: string; value: unknown }> = [];
  return {
    calls,
    adapter: {
      applyPointer(pointer, value) {
        calls.push({ pointer, value });
      }
    }
  };
}

describe("variable/set kills an in-flight variable/interpolate (spec variable/set step 2a)", () => {
  it("setting the variable mid-flight freezes its value and the interpolation's own done flow never fires", () => {
    // 0: event/onStart
    // 1: flow/sequence -> [2: variable/interpolate (var 0, 0->10 over 1s,
    //    done -> 5: variable/set var1=1), 3: flow/setDelay (0.3s, done ->
    //    4: variable/set var0=999)]
    const graph: Graph = {
      types: [{ signature: "float" }, { signature: "float2" }],
      variables: [
        { id: "v0", type: FLOAT, value: [0] },
        { id: "v1", type: FLOAT, value: [0] }
      ],
      events: [],
      declarations: [
        { op: "event/onStart" },
        { op: "flow/sequence" },
        { op: "variable/interpolate" },
        { op: "flow/setDelay" },
        { op: "variable/set" },
        { op: "variable/set" }
      ],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          flows: {
            "0": { node: 2, socket: "in" },
            "1": { node: 3, socket: "in" }
          }
        },
        {
          declaration: 2,
          configuration: { variable: { value: [0] } },
          values: {
            duration: lit(FLOAT, [1]),
            value: lit(FLOAT, [10]),
            p1: lit(FLOAT2, [0, 0]),
            p2: lit(FLOAT2, [1, 1])
          },
          flows: { done: { node: 5, socket: "in" } }
        },
        {
          declaration: 3,
          values: { duration: lit(FLOAT, [0.3]) },
          flows: { done: { node: 4, socket: "in" } }
        },
        {
          declaration: 4,
          configuration: { variables: { value: [0] } },
          values: { "0": lit(FLOAT, [999]) }
        },
        {
          declaration: 5,
          configuration: { variables: { value: [1] } },
          values: { "1": lit(FLOAT, [1]) }
        }
      ]
    };

    const runtime = new InteractivityRuntime(graph, {});
    runtime.start();

    // t=0.3: the delay's "done" flow (variable/set var0=999) fires in the
    // SAME advance() as the interpolation's own phase-3 write — kill takes
    // effect for subsequent ticks, but this tick's eased write already
    // happened before the kill, so the set unconditionally wins by running
    // after it (see interpreter.ts's scheduler phase ordering doc comment).
    runtime.tick(0.3);
    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [999] });

    // Advance well past the original interpolation's 1s duration: variable 0
    // must stay frozen at 999 (no further interpolation writes reach it),
    // and variable 1 (only ever set by the interpolation's own done flow)
    // must stay at its initial 0 — the done flow never fired.
    runtime.tick(0.5);
    runtime.tick(0.5);
    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [999] });
    expect(runtime.getVariable(1)).toEqual({ type: "float", data: [0] });
  });
});

describe("variable/interpolate replaces an existing same-variable interpolation (spec variable/interpolate step 5)", () => {
  it("only the second interpolation's done flow fires; the first's is silently dropped", () => {
    // 0: event/onStart
    // 1: flow/sequence -> [2: variable/interpolate (var0, ->10, done ->
    //    4: variable/set var1=1), 3: variable/interpolate (var0, ->20,
    //    done -> 5: variable/set var1=2)] — both start at t=0, so #3's
    //    addVariableInterp call kills #2's entry before it ever completes.
    const graph: Graph = {
      types: [{ signature: "float" }, { signature: "float2" }],
      variables: [
        { id: "v0", type: FLOAT, value: [0] },
        { id: "v1", type: FLOAT, value: [0] }
      ],
      events: [],
      declarations: [
        { op: "event/onStart" },
        { op: "flow/sequence" },
        { op: "variable/interpolate" },
        { op: "variable/interpolate" },
        { op: "variable/set" },
        { op: "variable/set" }
      ],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          flows: {
            "0": { node: 2, socket: "in" },
            "1": { node: 3, socket: "in" }
          }
        },
        {
          declaration: 2,
          configuration: { variable: { value: [0] } },
          values: {
            duration: lit(FLOAT, [1]),
            value: lit(FLOAT, [10]),
            p1: lit(FLOAT2, [0, 0]),
            p2: lit(FLOAT2, [1, 1])
          },
          flows: { done: { node: 4, socket: "in" } }
        },
        {
          declaration: 3,
          configuration: { variable: { value: [0] } },
          values: {
            duration: lit(FLOAT, [1]),
            value: lit(FLOAT, [20]),
            p1: lit(FLOAT2, [0, 0]),
            p2: lit(FLOAT2, [1, 1])
          },
          flows: { done: { node: 5, socket: "in" } }
        },
        {
          declaration: 4,
          configuration: { variables: { value: [1] } },
          values: { "1": lit(FLOAT, [1]) }
        },
        {
          declaration: 5,
          configuration: { variables: { value: [1] } },
          values: { "1": lit(FLOAT, [2]) }
        }
      ]
    };

    const runtime = new InteractivityRuntime(graph, {});
    runtime.start();
    runtime.tick(1.0);
    runtime.tick(0.1);

    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [20] });
    expect(runtime.getVariable(1)).toEqual({ type: "float", data: [2] });
  });
});

describe("pointer/set kills an in-flight pointer/interpolate for the same effective pointer (spec pointer/set step 5)", () => {
  it("setting the pointer mid-flight freezes it and the interpolation's own done flow never fires", () => {
    const graph: Graph = {
      types: [{ signature: "float" }, { signature: "float2" }, { signature: "float3" }],
      variables: [{ id: "v0", type: FLOAT, value: [0] }],
      events: [],
      declarations: [
        { op: "event/onStart" },
        { op: "flow/sequence" },
        { op: "pointer/interpolate" },
        { op: "flow/setDelay" },
        { op: "pointer/set" },
        { op: "variable/set" }
      ],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          flows: {
            "0": { node: 2, socket: "in" },
            "1": { node: 3, socket: "in" }
          }
        },
        {
          declaration: 2,
          configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [FLOAT3] } },
          values: {
            duration: lit(FLOAT, [1]),
            value: lit(FLOAT3, [10, 10, 10]),
            p1: lit(FLOAT2, [0, 0]),
            p2: lit(FLOAT2, [1, 1])
          },
          flows: { done: { node: 5, socket: "in" } }
        },
        {
          declaration: 3,
          values: { duration: lit(FLOAT, [0.3]) },
          flows: { done: { node: 4, socket: "in" } }
        },
        {
          declaration: 4,
          configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [FLOAT3] } },
          values: { value: lit(FLOAT3, [999, 999, 999]) }
        },
        {
          declaration: 5,
          configuration: { variables: { value: [0] } },
          values: { "0": lit(FLOAT, [1]) }
        }
      ]
    };

    const gltf = { nodes: [{}] };
    const { adapter, calls } = capturingAdapter();
    const runtime = new InteractivityRuntime(graph, gltf);
    runtime.bindAdapter(adapter);
    runtime.start();

    runtime.tick(0.3);
    expect(calls[calls.length - 1]).toEqual({ pointer: "/nodes/0/translation", value: [999, 999, 999] });

    runtime.tick(0.5);
    runtime.tick(0.5);
    // No further pointer writes past the pointer/set — the interpolation's
    // table entry was killed, so it never got to write [10,10,10] nor fire
    // its own done flow.
    expect(calls[calls.length - 1]).toEqual({ pointer: "/nodes/0/translation", value: [999, 999, 999] });
    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [0] });
  });
});

describe("an interpolation's own per-tick writes never self-kill (regression for the internal-write-bypass trap)", () => {
  it("variable/interpolate ticked to completion in several small steps fires its done flow exactly once", () => {
    const graph: Graph = {
      types: [{ signature: "float" }, { signature: "float2" }],
      variables: [
        { id: "v0", type: FLOAT, value: [0] },
        { id: "v1", type: FLOAT, value: [0] }
      ],
      events: [],
      declarations: [
        { op: "event/onStart" },
        { op: "variable/interpolate" },
        { op: "variable/set" }
      ],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          configuration: { variable: { value: [0] } },
          values: {
            duration: lit(FLOAT, [1]),
            value: lit(FLOAT, [10]),
            p1: lit(FLOAT2, [0, 0]),
            p2: lit(FLOAT2, [1, 1])
          },
          flows: { done: { node: 2, socket: "in" } }
        },
        {
          declaration: 2,
          configuration: { variables: { value: [1] } },
          values: { "1": lit(FLOAT, [1]) }
        }
      ]
    };

    const runtime = new InteractivityRuntime(graph, {});
    runtime.start();

    // Four ticks of the scheduler's OWN internal setVariable writes — none
    // of them may kill the table entry (that would require going through
    // the "variable/set" op case, which never runs here).
    runtime.tick(0.25);
    runtime.tick(0.25);
    runtime.tick(0.25);
    expect(runtime.getVariable(1)).toEqual({ type: "float", data: [0] });
    expect((runtime.getVariable(0).data as number[])[0]).toBeGreaterThan(0);
    expect((runtime.getVariable(0).data as number[])[0]).toBeLessThan(10);

    runtime.tick(0.25);
    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [10] });
    expect(runtime.getVariable(1)).toEqual({ type: "float", data: [1] });
  });

  it("pointer/interpolate ticked to completion in several small steps fires its done flow exactly once", () => {
    const graph: Graph = {
      types: [{ signature: "float" }, { signature: "float2" }, { signature: "float3" }],
      variables: [{ id: "v0", type: FLOAT, value: [0] }],
      events: [],
      declarations: [
        { op: "event/onStart" },
        { op: "pointer/interpolate" },
        { op: "variable/set" }
      ],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [FLOAT3] } },
          values: {
            duration: lit(FLOAT, [1]),
            value: lit(FLOAT3, [10, 10, 10]),
            p1: lit(FLOAT2, [0, 0]),
            p2: lit(FLOAT2, [1, 1])
          },
          flows: { done: { node: 2, socket: "in" } }
        },
        {
          declaration: 2,
          configuration: { variables: { value: [0] } },
          values: { "0": lit(FLOAT, [1]) }
        }
      ]
    };

    const gltf = { nodes: [{}] };
    const { adapter, calls } = capturingAdapter();
    const runtime = new InteractivityRuntime(graph, gltf);
    runtime.bindAdapter(adapter);
    runtime.start();

    runtime.tick(0.5);
    runtime.tick(0.49);
    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [0] });
    runtime.tick(0.01);
    expect(calls[calls.length - 1]).toEqual({ pointer: "/nodes/0/translation", value: [10, 10, 10] });
    expect(runtime.getVariable(0)).toEqual({ type: "float", data: [1] });
  });
});
