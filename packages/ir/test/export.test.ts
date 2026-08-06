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

// Regression test for a real bug found while building `gltfi apply`
// (packages/cli/test/apply.test.ts's full-corpus mode): exportGraph left
// non-finite literal values (NaN/Infinity/-Infinity) as real JS numbers in
// every `value:` array it returns — variable initial values, event
// defaults, and node-level value-socket literals alike. Every EXISTING
// consumer of exportGraph's output happened to use it as a plain in-memory
// JS object (the interpreter, `gltfi roundtrip`'s judge), so this was
// invisible: `JSON.stringify` silently collapses NaN/Infinity/-Infinity to
// `null` with no error, and nothing had ever actually JSON.stringify'd an
// exported graph containing one of these values until @gltfi/gltf's
// spliceGraph did, for real, via `gltfi apply` (see math/length,
// math/matDecompose, pointer/interpolate, variable/interpolate in the
// corpus — all four hit this once `apply` actually wrote them to disk).
// The fix is @gltfi/kernel's `formatValueArray` (the exact inverse of
// `parseScalar`, which is what @gltfi/ir/import.ts already uses on the way
// IN) applied at export.ts's three literal-materializing sites.
describe("exportGraph - non-finite literals survive a JSON round trip", () => {
  function moduleWithLiteral(data: number[]): IRModule {
    return {
      variables: [{ name: "v0", type: "float", initial: { type: "float", data: [0] } }],
      events: [],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "seq", stmts: [{ k: "setVar", varId: 0, expr: { k: "const", type: "float", data } }] }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
  }

  it.each([
    ["NaN", NaN, "NaN"],
    ["Infinity", Infinity, "Infinity"],
    ["-Infinity", -Infinity, "-Infinity"]
  ] as const)("a %s node-value literal serializes to the spec's %s string, not null", (_label, raw, expectedEncoding) => {
    const { graph, diagnostics } = exportGraph(moduleWithLiteral([raw]));
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);

    const setVarNode = graph.nodes.find((n) => graph.declarations[n.declaration].op === "variable/set");
    expect(setVarNode).toBeDefined();
    const literalValue = Object.values(setVarNode!.values ?? {}).find((v) => "value" in v) as { value: unknown[] } | undefined;
    expect(literalValue).toBeDefined();

    // The bug: JSON.stringify(NaN) === "null" — round-tripping through the
    // exact serialization spliceGraph/cmdCompile actually perform is the
    // only assertion that would have caught the original defect.
    const roundTripped = JSON.parse(JSON.stringify(literalValue!.value));
    expect(roundTripped[0]).toBe(expectedEncoding);
  });

  it("a NaN variable initial value and event default both survive the same way", () => {
    const module: IRModule = {
      variables: [{ name: "v0", type: "float", initial: { type: "float", data: [NaN] } }],
      events: [{ name: "e0", values: [{ name: "p", type: "float", default: { type: "float", data: [Infinity] } }] }],
      stateSlots: [],
      procs: [],
      handlers: [],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);

    const roundTripped = JSON.parse(JSON.stringify(graph));
    expect(roundTripped.variables[0].value[0]).toBe("NaN");
    expect(roundTripped.events[0].values.p.value[0]).toBe("Infinity");
  });
});

// Regression test for a real bug found during the R4 game build: a
// `rt.vars({...})` variable that's declared but never read or written
// anywhere in the script (and, latently, the same for a custom event that's
// declared but never emitted/received) produced a graph whose
// `variables[i].type` (or `events[i].values[k].type`) index pointed past the
// end of `graph.types` — @gltfi/verify's validateGraph (GV010/GV011) rejects
// this. Root cause: run()'s `types: this.typeOrder.map(...)` field was
// evaluated (capturing a snapshot of typeOrder) BEFORE the `variables:` and
// `events:` fields of the same object literal — whose evaluation is what
// calls `this.typeIndex(v.type)` for a variable/event-value's own declared
// type. Object literal property values are computed strictly in source
// order, so any type that isn't already in typeOrder from some node built
// earlier (e.g. a same-typed literal or pointer access elsewhere in the
// graph) gets appended to typeOrder too late for the already-captured
// `types` array — the returned index is genuinely out of range, not merely
// "unmapped" garbage. This is why it manifests specifically for **unused**
// declarations: a used variable/event's type is often (coincidentally)
// already present via some literal/pointer node of the same type built
// elsewhere first. The fix reorders run() to compute `variables`/`events`
// (and thus every `typeIndex()` call they make) before snapshotting `types`.
describe("exportGraph - unused declarations keep in-range type indices (GV010/GV011 regression)", () => {
  // Inlined mirror of @gltfi/verify's validateGraph GV010/GV011 checks (see
  // this file's own checkValueBackward/declDedupErrors comment for why: a
  // dependency on @gltfi/verify from @gltfi/ir would be a package cycle).
  function checkTypesInRange(graph: ReturnType<typeof exportGraph>["graph"]): string[] {
    const violations: string[] = [];
    const typeCount = graph.types.length;
    (graph.variables ?? []).forEach((v, i) => {
      if (v.type < 0 || v.type >= typeCount) {
        violations.push(`variable ${i} has out-of-range type index ${v.type} (types.length=${typeCount})`);
      }
    });
    (graph.events ?? []).forEach((e, i) => {
      for (const [key, val] of Object.entries(e.values ?? {})) {
        if (val.type < 0 || val.type >= typeCount) {
          violations.push(`event ${i} value "${key}" has out-of-range type index ${val.type} (types.length=${typeCount})`);
        }
      }
    });
    return violations;
  }

  it("a declared-but-never-referenced variable gets a type index within graph.types' bounds", () => {
    // "float3" deliberately appears nowhere else in the module (the sole
    // handler only touches floats via debug/log) so its type can only ever
    // enter `typeOrder` through the unused variable's own declaration —
    // exactly the case the pre-fix ordering bug loses.
    const module: IRModule = {
      variables: [{ name: "unused", type: "float3", initial: { type: "float3", data: [0, 0, 0] } }],
      events: [],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "log", template: "hi", args: [] }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(checkTypesInRange(graph)).toEqual([]);
  });

  it("a declared-but-never-emitted/received custom event gets in-range value type indices", () => {
    // Same shape of bug, on the events side: "float4" appears only in the
    // unused event's value default.
    const module: IRModule = {
      variables: [],
      events: [{ name: "unused-event", values: [{ name: "p", type: "float4", default: { type: "float4", data: [0, 0, 0, 0] } }] }],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "log", template: "hi", args: [] }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(checkTypesInRange(graph)).toEqual([]);
  });

  it("both an unused variable and an unused event survive together, alongside used declarations of other types", () => {
    const module: IRModule = {
      variables: [
        { name: "used", type: "int", initial: { type: "int", data: [0] } },
        { name: "unused", type: "float2x2", initial: { type: "float2x2", data: [1, 0, 0, 1] } }
      ],
      events: [{ name: "unused-event", values: [{ name: "p", type: "float3x3", default: { type: "float3x3", data: [1, 0, 0, 0, 1, 0, 0, 0, 1] } }] }],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "setVar", varId: 0, expr: { k: "const", type: "int", data: [1] } }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(checkTypesInRange(graph)).toEqual([]);
  });
});

// Regression tests for #20-1: a proc whose async `done` continuation calls
// back into ITSELF (the self-rescheduling setDelay pattern —
// `function p(){ rt.setDelay(slot, 0.25, () => { p(); }); }`) is legal (see
// import.ts's own header comment: "done fires after the calling stack has
// fully unwound... not runaway synchronous recursion", and check.ts's
// GIC040 rule explicitly excludes async.done edges from its cycle check),
// but exportGraph used to reject it at TWO separate sites:
//   (a) getProcEntry's re-entrancy guard: building p's body lowers the
//       done-Cont, which calls getProcEntry(p.id) again while p is still
//       `procBuilding` — reported as GI210 "synchronous cycle building
//       proc" unconditionally, with no distinction from a genuine
//       stack-blowing direct self-call.
//   (b) topoSort: once (a) is fixed by wiring a real pass-through node, the
//       exported graph legitimately contains a 2-node flow cycle (the
//       pass-through's "out" -> the setDelay node, and the setDelay's
//       "done" -> back to the pass-through) — Kahn's algorithm stalls on
//       that back-edge and topoSort reported the SAME GI210 code for a
//       completely different reason ("cyclic constraint graph").
// Both are fixed; this suite pins the fix and checks the two error paths
// this change deliberately does NOT touch: a genuinely synchronous (no
// async boundary) proc self/mutual-call cycle must still error GI210 (that
// shape really would blow the stack at runtime).
describe("exportGraph - proc self-continuation via async done (#20-1 GI210 regression)", () => {
  // Cycle detector over the FLOW graph only (mirrors this file's own
  // checkValueBackward for why it's inlined rather than imported from
  // @gltfi/verify: that package depends on @gltfi/ir, so the reverse import
  // would be a package cycle). Used to confirm the self-continuation's
  // characteristic flow back-edge actually survives both the original
  // export AND a re-import/re-export round trip, without needing
  // execution-level judging.
  function hasFlowCycle(graph: ReturnType<typeof exportGraph>["graph"]): boolean {
    const state = new Array<0 | 1 | 2>(graph.nodes.length).fill(0);
    const visit = (i: number): boolean => {
      if (state[i] === 1) return true;
      if (state[i] === 2) return false;
      state[i] = 1;
      for (const f of Object.values(graph.nodes[i]?.flows ?? {})) {
        if (visit(f.node)) return true;
      }
      state[i] = 2;
      return false;
    };
    return graph.nodes.some((_, i) => state[i] === 0 && visit(i));
  }

  function selfReschedulingModule(): IRModule {
    return {
      variables: [],
      events: [],
      stateSlots: [{ name: "delaySlot", kind: "delay", config: {} }],
      procs: [
        {
          id: 0,
          name: "p",
          body: {
            k: "seq",
            stmts: [
              {
                k: "async",
                kind: "setDelay",
                slot: { slot: 0 },
                args: [{ k: "const", type: "float", data: [0.25] }],
                done: { kind: "proc", procId: 0 }
              }
            ]
          }
        }
      ],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "callProc", procId: 0 }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
  }

  it("exports without GI210, produces a structurally valid graph, and round-trips through import->export", () => {
    const module = selfReschedulingModule();
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics, JSON.stringify(diagnostics)).toEqual([]);
    expect(checkValueBackward(graph)).toEqual([]);
    expect(declDedupErrors(graph)).toEqual([]);
    // The whole point of the fix: the exported graph really does contain
    // the self-continuation's flow back-edge (pass-through "out" -> setDelay,
    // setDelay "done" -> pass-through) rather than a disconnected
    // placeholder standing in for a rejected cycle.
    expect(hasFlowCycle(graph)).toBe(true);

    const { module: reimported, diagnostics: importDiags } = importGraph(graph as unknown as Graph);
    expect(importDiags.filter((d) => d.severity === "error"), JSON.stringify(importDiags)).toEqual([]);

    const { graph: reexported, diagnostics: reexportDiags } = exportGraph(reimported);
    expect(reexportDiags, JSON.stringify(reexportDiags)).toEqual([]);
    expect(checkValueBackward(reexported)).toEqual([]);
    expect(declDedupErrors(reexported)).toEqual([]);
    // Equivalence signal (see this describe block's own comment on why a
    // full @gltfi/verify equivalentGraphs check isn't available here): the
    // re-exported graph still contains a genuine self-continuation flow
    // cycle, i.e. import->export preserved the legal loop rather than
    // collapsing or rejecting it.
    expect(hasFlowCycle(reexported)).toBe(true);
  });

  it("does NOT affect an acyclic proc's export (no pass-through node, same shape as before this fix)", () => {
    const module: IRModule = {
      variables: [{ name: "v0", type: "float", initial: { type: "float", data: [0] } }],
      events: [],
      stateSlots: [],
      procs: [{ id: 0, name: "p", body: { k: "setVar", varId: 0, expr: { k: "const", type: "float", data: [1] } } }],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "callProc", procId: 0 }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { graph, diagnostics } = exportGraph(module);
    expect(diagnostics).toEqual([]);
    expect(hasFlowCycle(graph)).toBe(false);
    // Exactly two nodes: the handler root and the proc's single setVar node
    // — no extra pass-through node synthesized for a proc that was never
    // re-entered while building.
    expect(graph.nodes.length).toBe(2);
  });

  it("still errors GI210 for a genuinely synchronous (non-async) proc self-call — no async boundary crossed", () => {
    const module: IRModule = {
      variables: [],
      events: [],
      stateSlots: [],
      procs: [{ id: 0, name: "p", body: { k: "callProc", procId: 0 } }],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "callProc", procId: 0 }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { diagnostics } = exportGraph(module);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors.map((d) => d.code)).toEqual(["GI210"]);
  });

  it("still errors GI210 for a genuinely synchronous MUTUAL (non-async) proc cycle (A calls B calls A)", () => {
    const module: IRModule = {
      variables: [],
      events: [],
      stateSlots: [],
      procs: [
        { id: 0, name: "a", body: { k: "callProc", procId: 1 } },
        { id: 1, name: "b", body: { k: "callProc", procId: 0 } }
      ],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "callProc", procId: 0 }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { diagnostics } = exportGraph(module);
    const errors = diagnostics.filter((d) => d.severity === "error");
    // Exactly one GI210 — the re-entrant getProcEntry call for whichever
    // proc closes the cycle reports once; this is also the "don't
    // double-report" check called out in the fix's task description (the
    // topoSort fallback below does NOT additionally fire for this shape,
    // since getProcEntry's error path returns a disconnected placeholder
    // node rather than ever wiring a real cyclic flow edge into the graph).
    expect(errors.map((d) => d.code)).toEqual(["GI210"]);
  });
});

// Regression tests for #20-2 (GI208): setDelay's graph node is keyed by
// STATE SLOT (getOrCreateStateNode's memoization), not by the setDelay
// STATEMENT that fills in its duration/done — so two genuinely different
// setDelay call sites sharing one slot used to silently clobber each
// other's wiring on the same underlying node instead of erroring. Covers
// both shapes the task calls out as producing the SAME underlying clobber:
// "sibling" (two independent call sites) and "nested" (one inside the
// other's own done-Cont) — plus the negative case (distinct slots: no
// error) and confirms FIX 2 (#20-1)'s legal self-rescheduling pattern
// (the SAME call site reusing its own slot) is still not flagged.
describe("exportGraph - setDelay state-slot sharing (#20-2 GI208 regression)", () => {
  function twoSetDelaysOnOneSlot(place: "sibling" | "nested"): IRModule {
    const durationA: IRExpr = { k: "const", type: "float", data: [1] };
    const durationB: IRExpr = { k: "const", type: "float", data: [2] };
    const inner: IRStmt = { k: "async", kind: "setDelay", slot: { slot: 0 }, args: [durationB] };
    const body: IRStmt =
      place === "sibling"
        ? {
            k: "seq",
            stmts: [{ k: "async", kind: "setDelay", slot: { slot: 0 }, args: [durationA] }, inner]
          }
        : { k: "async", kind: "setDelay", slot: { slot: 0 }, args: [durationA], done: { kind: "inline", body: inner } };
    return {
      variables: [],
      events: [],
      stateSlots: [{ name: "sharedSlot", kind: "delay", config: {} }],
      procs: [],
      handlers: [{ kind: "onStart", params: [{ name: "event", type: "ref" }], body }],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
  }

  it.each(["sibling", "nested"] as const)("errors GI208 when two DIFFERENT setDelay call sites share one slot (%s)", (place) => {
    const { diagnostics } = exportGraph(twoSetDelaysOnOneSlot(place));
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors.map((d) => d.code)).toEqual(["GI208"]);
    expect(errors[0].message).toContain('state slot "sharedSlot"');
    expect(errors[0].message).toContain("more than one setDelay call site");
  });

  it("does NOT error when two setDelay statements use DIFFERENT slots", () => {
    const module: IRModule = {
      variables: [],
      events: [],
      stateSlots: [
        { name: "slotA", kind: "delay", config: {} },
        { name: "slotB", kind: "delay", config: {} }
      ],
      procs: [],
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: {
            k: "seq",
            stmts: [
              { k: "async", kind: "setDelay", slot: { slot: 0 }, args: [{ k: "const", type: "float", data: [1] }] },
              { k: "async", kind: "setDelay", slot: { slot: 1 }, args: [{ k: "const", type: "float", data: [2] }] }
            ]
          }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("does NOT error for FIX 2 (#20-1)'s self-rescheduling pattern — same call site reusing its own slot", () => {
    // Same construction as the #20-1 describe block's selfReschedulingModule
    // above: proc p's own setDelay done-Cont calls back into p, re-using
    // p's own slot through the exact same (memoized) IRStmt object.
    const module: IRModule = {
      variables: [],
      events: [],
      stateSlots: [{ name: "delaySlot", kind: "delay", config: {} }],
      procs: [
        {
          id: 0,
          name: "p",
          body: {
            k: "seq",
            stmts: [
              {
                k: "async",
                kind: "setDelay",
                slot: { slot: 0 },
                args: [{ k: "const", type: "float", data: [0.25] }],
                done: { kind: "proc", procId: 0 }
              }
            ]
          }
        }
      ],
      handlers: [{ kind: "onStart", params: [{ name: "event", type: "ref" }], body: { k: "callProc", procId: 0 } }],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };
    const { diagnostics } = exportGraph(module);
    expect(diagnostics.filter((d) => d.code === "GI208")).toEqual([]);
  });
});
