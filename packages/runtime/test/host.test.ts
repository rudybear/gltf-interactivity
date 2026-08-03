// DOM-less coverage for host.ts's KHR_node_selectability/hoverability
// ancestor-chain bubbling (InteractivityRuntime.setSelection/setHover) and
// its stopPropagation short-circuit — mirrors
// packages/runtime-lib/test/engine.test.ts's identical scenarios against
// the compiled engine, so both engines' bubbling behavior is checked to
// agree without needing a browser. This is the "DOM-less engine-path unit
// test" the task report substitutes for a green headless-Chrome smoke run
// on this sandbox (no /dev/dri render-node group membership -> WebGPU can
// get a device but not sustain the canvas swap-chain — see
// scripts/render-verify.mjs's header comment for the full failure mode).
import { describe, expect, it } from "vitest";
import { InteractivityRuntime } from "../src/host.js";
import type { Graph } from "../src/interpreter.js";

// A literal (non-wired) NodeValue entry — the graph JSON shape a bare
// boolean/int/float/vector constant takes on a node's `values` map.
function lit(typeIndex: number, value: Array<number | boolean | string>) {
  return { type: typeIndex, value };
}

describe("InteractivityRuntime.setSelection bubbling", () => {
  // gltf scene: root(0) -> mid(1) -> leaf(2). Graph: three event/onSelect
  // handlers (one per scene node) each wired to a variable/set node that
  // flips a dedicated bool variable to true when that handler fires —
  // firing order/inclusion is read back from `runtime.getVariable(i)`.
  function buildGraph(midStopsPropagation: boolean): Graph {
    const BOOL = 0;
    return {
      types: [{ signature: "bool" }],
      variables: [
        { id: "firedRoot", type: BOOL, value: [false] },
        { id: "firedMid", type: BOOL, value: [false] },
        { id: "firedLeaf", type: BOOL, value: [false] }
      ],
      events: [],
      declarations: [{ op: "event/onSelect" }, { op: "variable/set" }],
      nodes: [
        // 0: onSelect(nodeIndex=0) -> setVar(firedRoot)
        { declaration: 0, configuration: { nodeIndex: { value: [0] } }, flows: { out: { node: 3, socket: "in" } } },
        // 1: onSelect(nodeIndex=1, stopPropagation=midStopsPropagation) -> setVar(firedMid)
        {
          declaration: 0,
          configuration: { nodeIndex: { value: [1] }, stopPropagation: { value: [midStopsPropagation] } },
          flows: { out: { node: 4, socket: "in" } }
        },
        // 2: onSelect(nodeIndex=2) -> setVar(firedLeaf)
        { declaration: 0, configuration: { nodeIndex: { value: [2] } }, flows: { out: { node: 5, socket: "in" } } },
        // 3/4/5: variable/set literal true into var 0/1/2 respectively.
        { declaration: 1, configuration: { variables: { value: [0] } }, values: { "0": lit(BOOL, [true]) } },
        { declaration: 1, configuration: { variables: { value: [1] } }, values: { "1": lit(BOOL, [true]) } },
        { declaration: 1, configuration: { variables: { value: [2] } }, values: { "2": lit(BOOL, [true]) } }
      ]
    };
  }

  const scene = { nodes: [{ children: [1] }, { children: [2] }, {}] };

  it("fires deepest-first and stops bubbling once a stopPropagation:true handler fires", () => {
    const graph = buildGraph(true);
    const runtime = new InteractivityRuntime(graph, scene);
    runtime.setSelection(2, [1, 2, 3]);
    expect(runtime.getVariable(2)?.data).toEqual([true]); // leaf (hit node) fired
    expect(runtime.getVariable(1)?.data).toEqual([true]); // mid fired (and stopped further bubbling)
    expect(runtime.getVariable(0)?.data).toEqual([false]); // root must NOT fire
  });

  it("without stopPropagation, bubbling reaches every ancestor handler", () => {
    const graph = buildGraph(false);
    const runtime = new InteractivityRuntime(graph, scene);
    runtime.setSelection(2, [1, 2, 3]);
    expect(runtime.getVariable(2)?.data).toEqual([true]);
    expect(runtime.getVariable(1)?.data).toEqual([true]);
    expect(runtime.getVariable(0)?.data).toEqual([true]);
  });

  it("is a no-op for a negative nodeIndex", () => {
    const graph = buildGraph(false);
    const runtime = new InteractivityRuntime(graph, scene);
    runtime.setSelection(-1, [0, 0, 0]);
    expect(runtime.getVariable(0)?.data).toEqual([false]);
    expect(runtime.getVariable(1)?.data).toEqual([false]);
    expect(runtime.getVariable(2)?.data).toEqual([false]);
  });
});

describe("InteractivityRuntime.setHover transitions", () => {
  // gltf scene: root(0) -> mid(1) -> {leafA(2), leafB(3)}.
  function buildGraph(): Graph {
    const BOOL = 0;
    const nodes: Graph["nodes"] = [];
    const declarations: Graph["declarations"] = [{ op: "event/onHoverIn" }, { op: "event/onHoverOut" }, { op: "variable/set" }];
    const variables: Graph["variables"] = [];
    let varIndex = 0;
    const varFor = (label: string) => {
      variables.push({ id: label, type: BOOL, value: [false] });
      return varIndex++;
    };
    for (const sceneNode of [0, 1, 2, 3]) {
      const inVar = varFor(`in${sceneNode}`);
      nodes.push({ declaration: 0, configuration: { nodeIndex: { value: [sceneNode] } }, flows: { out: { node: -1, socket: "in" } } });
      nodes.push({ declaration: 2, configuration: { variables: { value: [inVar] } }, values: { [String(inVar)]: lit(BOOL, [true]) } });
      nodes[nodes.length - 2].flows = { out: { node: nodes.length - 1, socket: "in" } };

      const outVar = varFor(`out${sceneNode}`);
      nodes.push({ declaration: 1, configuration: { nodeIndex: { value: [sceneNode] } }, flows: { out: { node: -1, socket: "in" } } });
      nodes.push({ declaration: 2, configuration: { variables: { value: [outVar] } }, values: { [String(outVar)]: lit(BOOL, [true]) } });
      nodes[nodes.length - 2].flows = { out: { node: nodes.length - 1, socket: "in" } };
    }
    return { types: [{ signature: "bool" }], variables, events: [], declarations, nodes };
  }

  // Returns {in: bool[4], out: bool[4]} indexed by scene node (0..3), read
  // back from the graph's own variable layout (in0,out0,in1,out1,...).
  function readFlags(runtime: InteractivityRuntime) {
    const at = (i: number) => Boolean(runtime.getVariable(i)?.data?.[0]);
    return {
      in: [at(0), at(2), at(4), at(6)],
      out: [at(1), at(3), at(5), at(7)]
    };
  }

  const scene = { nodes: [{ children: [1] }, { children: [2, 3] }, {}, {}] };

  it("first hover fires onHoverIn up the whole ancestor chain", () => {
    const runtime = new InteractivityRuntime(buildGraph(), scene);
    runtime.setHover(2, [0, 0, 0]);
    const flags = readFlags(runtime);
    expect(flags.in).toEqual([true, true, true, false]); // root, mid, leafA in; leafB untouched
    expect(flags.out).toEqual([false, false, false, false]);
  });

  it("moving hover to a sibling leaf only transitions the non-shared part of the chain", () => {
    const runtime = new InteractivityRuntime(buildGraph(), scene);
    runtime.setHover(2, [0, 0, 0]);
    runtime.setHover(3, [0, 0, 0]);
    const flags = readFlags(runtime);
    // root/mid stayed hovered the whole time: no onHoverOut for them, and no
    // redundant second onHoverIn (their bool flags are still just `true`,
    // which this test can't distinguish from "fired twice" — the important
    // assertion is leafA got exactly the Out it should and leafB got the In
    // it should, without leafA re-firing In or leafB firing Out).
    expect(flags.out).toEqual([false, false, true, false]); // leafA (index 2) got onHoverOut
    expect(flags.in).toEqual([true, true, true, true]); // leafB (index 3) newly got onHoverIn
  });

  it("re-hovering the already-hovered node is a no-op", () => {
    const runtime = new InteractivityRuntime(buildGraph(), scene);
    runtime.setHover(2, [0, 0, 0]);
    const before = readFlags(runtime);
    runtime.setHover(2, [1, 1, 1]);
    expect(readFlags(runtime)).toEqual(before);
  });
});
