// exportGraph tests: whole-corpus structural validity (via @gltfi/verify's
// validateGraph, which independently re-checks the value-backward-only
// constraint export.ts's own topological sort is supposed to guarantee —
// see that function's own doc comment), plus a couple of targeted
// regression tests for two of export.ts's specific design rules from
// docs/design/ir-and-transpiler.md's "IR -> graph" section: math/random
// must never be shared by CSE, and every value edge must point strictly
// backward (producer index < consumer index).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph } from "../src/export.js";
import { importGraph, type Graph, type IRModule } from "../src/index.js";
import type { Diagnostic, IRExpr } from "../src/model.js";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

type IndexEntry = { name: string; variants: { "glTF-Binary": string; "test-Json": string } };

function loadIndex(fileName: string): IndexEntry[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, fileName), "utf8")) as IndexEntry[];
}

function resolveGlbPath(entry: IndexEntry): string {
  const nested = path.join(ROOT, entry.name, "glTF-Binary", entry.variants["glTF-Binary"]);
  if (fs.existsSync(nested)) {
    return nested;
  }
  const flat = path.join(ROOT, entry.variants["glTF-Binary"]);
  if (fs.existsSync(flat)) {
    return flat;
  }
  throw new Error(`Missing GLB for ${entry.name}`);
}

function loadModule(glbPath: string): IRModule {
  const runtime = createRuntimeFromGlbFile(glbPath);
  const { module, diagnostics } = importGraph(runtime.graph as unknown as Graph);
  const errors = diagnostics.filter((d) => d.severity === "error");
  expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  return module;
}

// Structural mirror of @gltfi/verify's validateGraph, inlined here (rather
// than depending on @gltfi/verify, which itself depends on @gltfi/ir — a
// cycle) so this test can assert the value-backward-only constraint
// directly against exportGraph's own output without a second package in
// the loop.
function checkValueBackward(graph: ReturnType<typeof exportGraph>["graph"]): string[] {
  const violations: string[] = [];
  graph.nodes.forEach((node, nodeIndex) => {
    for (const [socket, v] of Object.entries(node.values ?? {})) {
      if ("node" in v && v.node >= nodeIndex) {
        violations.push(`node ${nodeIndex} value "${socket}" references node ${v.node} (not strictly before it)`);
      }
    }
  });
  return violations;
}

function declDedupErrors(graph: ReturnType<typeof exportGraph>["graph"]): string[] {
  const seen = new Map<string, number>();
  const errors: string[] = [];
  graph.declarations.forEach((d, i) => {
    const prior = seen.get(d.op);
    if (prior !== undefined) {
      errors.push(`declaration ${i} duplicates declaration ${prior}'s op "${d.op}"`);
    }
    seen.set(d.op, i);
  });
  return errors;
}

describe("exportGraph - full corpus (145 files)", () => {
  it("produces a structurally valid graph (in-range indices, backward-only value edges, no duplicate declarations) for every corpus GLB", () => {
    const entries = [...loadIndex("test-index.json"), ...loadIndex("mathtests-index.json")];
    expect(entries.length).toBe(145);

    const failures: string[] = [];
    let totalNodesBefore = 0;
    let totalNodesAfter = 0;

    for (const entry of entries) {
      const glbPath = resolveGlbPath(entry);
      let module: IRModule;
      try {
        module = loadModule(glbPath);
      } catch (err) {
        failures.push(`${entry.name}: importGraph threw: ${err instanceof Error ? err.stack : String(err)}`);
        continue;
      }

      let exportDiagnostics: Diagnostic[];
      let graph: ReturnType<typeof exportGraph>["graph"];
      try {
        const result = exportGraph(module);
        graph = result.graph;
        exportDiagnostics = result.diagnostics;
        totalNodesBefore += result.stats.nodesBeforeMerge;
        totalNodesAfter += result.stats.nodesAfterMerge;
      } catch (err) {
        failures.push(`${entry.name}: exportGraph threw: ${err instanceof Error ? err.stack : String(err)}`);
        continue;
      }

      const exportErrors = exportDiagnostics.filter((d) => d.severity === "error");
      if (exportErrors.length > 0) {
        failures.push(`${entry.name}: export errors: ${JSON.stringify(exportErrors)}`);
      }

      // Every node's declaration index must be in range.
      graph.nodes.forEach((node, i) => {
        if (node.declaration < 0 || node.declaration >= graph.declarations.length) {
          failures.push(`${entry.name}: node ${i} has out-of-range declaration ${node.declaration}`);
        }
      });

      const backward = checkValueBackward(graph);
      if (backward.length > 0) {
        failures.push(`${entry.name}: value-backward violations: ${backward.join("; ")}`);
      }

      const dedup = declDedupErrors(graph);
      if (dedup.length > 0) {
        failures.push(`${entry.name}: declaration dedup violations: ${dedup.join("; ")}`);
      }
    }

    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`${failures.length} corpus graphs failed export validation:\n${failures.join("\n")}`);
    }
    expect(failures).toEqual([]);

    // eslint-disable-next-line no-console
    console.log(`[export corpus stats] ${entries.length} graphs, ${totalNodesBefore} nodes before CSE, ${totalNodesAfter} after (${totalNodesBefore - totalNodesAfter} merged)`);
  });
});

describe("exportGraph - CSE regression rules", () => {
  it("never merges two math/random op instances into one graph node", () => {
    const randomExpr = (): IRExpr => ({
      k: "op",
      op: "math/random",
      overload: { op: "math/random", overloadIndex: 0, inputs: {}, outputs: { value: "float" } },
      args: []
    });
    const module: IRModule = {
      variables: [
        { name: "v0", type: "float", initial: { type: "float", data: [0] } },
        { name: "v1", type: "float", initial: { type: "float", data: [0] } }
      ],
      events: [],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: {
            k: "seq",
            stmts: [
              { k: "setVar", varId: 0, expr: randomExpr() },
              { k: "setVar", varId: 1, expr: randomExpr() }
            ]
          }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const randomNodeIndices = graph.nodes
      .map((n, i) => ({ op: graph.declarations[n.declaration].op, i }))
      .filter((x) => x.op === "math/random")
      .map((x) => x.i);
    expect(randomNodeIndices.length).toBe(2);
    expect(randomNodeIndices[0]).not.toBe(randomNodeIndices[1]);
  });

  it("does merge two identical pure-closed (literal-only) op trees into one shared node", () => {
    const pureExpr = (): IRExpr => ({
      k: "op",
      op: "math/add",
      overload: { op: "math/add", overloadIndex: 0, inputs: { a: "float", b: "float" }, outputs: { value: "float" } },
      args: [
        { k: "const", type: "float", data: [1] },
        { k: "const", type: "float", data: [2] }
      ]
    });
    const module: IRModule = {
      variables: [
        { name: "v0", type: "float", initial: { type: "float", data: [0] } },
        { name: "v1", type: "float", initial: { type: "float", data: [0] } }
      ],
      events: [],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: {
            k: "seq",
            stmts: [
              { k: "setVar", varId: 0, expr: pureExpr() },
              { k: "setVar", varId: 1, expr: pureExpr() }
            ]
          }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, stats } = exportGraph(module);
    const addNodeIndices = graph.nodes.map((n, i) => ({ op: graph.declarations[n.declaration].op, i })).filter((x) => x.op === "math/add");
    expect(addNodeIndices.length).toBe(1);
    expect(stats.mergedCount).toBeGreaterThanOrEqual(1);
  });
});
