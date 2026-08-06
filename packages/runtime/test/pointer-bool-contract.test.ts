// F4 (see the friction log referenced from the repo's upstream fix commit):
// the boolean pointer-value contract. A "bool"-signature pointer/set node's
// "value" socket is TOLERATED even when wired to a numerically-typed
// literal/value (a real-world case: an authoring tool or hand-built graph
// declares the literal with an "int"/"float" type index rather than "bool"),
// but the host-facing onPointerSet callback must always see a real JS
// boolean, never the tolerated 0/1 standing in for one — see
// packages/runtime/src/interpreter.ts's pointerValueMatchesType/
// handlePointerSet doc comments for the full contract this asserts.
import { describe, expect, it } from "vitest";
import { InteractivityRuntime, type SceneAdapter } from "../src/host.js";
import type { Graph } from "../src/interpreter.js";

function lit(typeIndex: number, value: Array<number | boolean | string>) {
  return { type: typeIndex, value };
}

// Captures every applyPointer call so a test can assert both the JS type and
// value of what a real SceneAdapter would receive.
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

describe("boolean pointer-value contract (F4)", () => {
  it("a bool pointer/set wired to an INT-typed literal `1` reaches the host as real boolean `true`", () => {
    const BOOL = 0;
    const INT = 1;
    const graph: Graph = {
      types: [{ signature: "bool" }, { signature: "int" }],
      variables: [],
      events: [],
      declarations: [{ op: "event/onStart" }, { op: "pointer/set" }],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          configuration: {
            pointer: { value: ["/nodes/[nodeIndex]/extensions/KHR_node_visibility/visible"] },
            type: { value: [BOOL] }
          },
          // Deliberately mismatched: "value" is declared with the INT type
          // index (raw JSON `1`, not `true`) even though the pointer/set
          // node's own "type" config says "bool" — the exact cross-type
          // shape pointerValueMatchesType's bool branch now tolerates.
          values: {
            value: lit(INT, [1]),
            nodeIndex: lit(INT, [0])
          }
        }
      ]
    };
    const scene = { nodes: [{}] };
    const { adapter, calls } = capturingAdapter();
    const runtime = new InteractivityRuntime(graph, scene);
    runtime.bindAdapter(adapter);

    runtime.start();

    expect(calls).toHaveLength(1);
    expect(calls[0].pointer).toBe("/nodes/0/extensions/KHR_node_visibility/visible");
    expect(calls[0].value).toBe(true);
    expect(typeof calls[0].value).toBe("boolean");
  });

  it("a bool pointer/set wired to an INT-typed literal `0` reaches the host as real boolean `false`", () => {
    const BOOL = 0;
    const INT = 1;
    const graph: Graph = {
      types: [{ signature: "bool" }, { signature: "int" }],
      variables: [],
      events: [],
      declarations: [{ op: "event/onStart" }, { op: "pointer/set" }],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          configuration: {
            pointer: { value: ["/nodes/[nodeIndex]/extensions/KHR_node_visibility/visible"] },
            type: { value: [BOOL] }
          },
          values: {
            value: lit(INT, [0]),
            nodeIndex: lit(INT, [0])
          }
        }
      ]
    };
    const scene = { nodes: [{}] };
    const { adapter, calls } = capturingAdapter();
    const runtime = new InteractivityRuntime(graph, scene);
    runtime.bindAdapter(adapter);

    runtime.start();

    expect(calls).toHaveLength(1);
    expect(calls[0].value).toBe(false);
    expect(typeof calls[0].value).toBe("boolean");
  });

  it("a genuinely non-boolean numeric value (2) is still rejected for a bool pointer", () => {
    const BOOL = 0;
    const INT = 1;
    const graph: Graph = {
      types: [{ signature: "bool" }, { signature: "int" }],
      variables: [],
      events: [],
      declarations: [{ op: "event/onStart" }, { op: "pointer/set" }],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          configuration: {
            pointer: { value: ["/nodes/[nodeIndex]/extensions/KHR_node_visibility/visible"] },
            type: { value: [BOOL] }
          },
          values: {
            value: lit(INT, [2]),
            nodeIndex: lit(INT, [0])
          }
        }
      ]
    };
    const scene = { nodes: [{}] };
    const { adapter, calls } = capturingAdapter();
    const runtime = new InteractivityRuntime(graph, scene);
    runtime.bindAdapter(adapter);

    runtime.start();

    expect(calls).toHaveLength(0);
  });
});
