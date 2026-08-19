// Regression coverage for gltf-studio #31 finding 2: validateGraph's
// Diagnostics carry a structured `nodeIndex` (see @gltfi/ir's Diagnostic
// type) pointing at the offending graph node, so a downstream consumer
// (e.g. gltf-studio's script panel gutter markers) can locate the problem
// node directly instead of regexing the message text.
import { describe, expect, it } from "vitest";
import { validateGraph, type Diagnostic, type VGraph } from "../src/index.js";

function baseGraph(): VGraph {
  return {
    types: [{ signature: "float" }],
    declarations: [{ op: "event/onTick" }],
    nodes: [{ declaration: 0 }]
  };
}

describe("validateGraph - structured Diagnostic.nodeIndex", () => {
  it("attaches nodeIndex to a per-node error (GV021 out-of-range value reference)", () => {
    const graph: VGraph = {
      ...baseGraph(),
      declarations: [{ op: "math/add" }],
      nodes: [{ declaration: 0, values: { a: { node: 5 } } }]
    };
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    const err = result.diagnostics.find((d) => d.code === "GV021");
    expect(err).toBeDefined();
    expect(err!.nodeIndex).toBe(0);
  });

  it("attaches the correct nodeIndex per node when multiple nodes each have their own error", () => {
    const graph: VGraph = {
      types: [{ signature: "float" }],
      declarations: [{ op: "math/add" }],
      nodes: [
        { declaration: 0, values: { a: { node: 99 } } }, // node 0: bad ref
        { declaration: 99 } // node 1: bad declaration index
      ]
    };
    const result = validateGraph(graph);
    const byCode = Object.fromEntries(result.diagnostics.map((d) => [d.code, d] as const)) as Record<string, Diagnostic>;
    expect(byCode.GV021.nodeIndex).toBe(0);
    expect(byCode.GV020.nodeIndex).toBe(1);
  });

  it("Diagnostic is importable from @gltfi/verify's own public entry (not just via @gltfi/ir)", () => {
    // Type-only import above already proves this compiles; this test just
    // exercises a value that satisfies the re-exported type at runtime.
    const d: Diagnostic = { severity: "error", code: "X", message: "m", nodeIndex: 3 };
    expect(d.nodeIndex).toBe(3);
  });
});
