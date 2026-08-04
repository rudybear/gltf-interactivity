// KHR_node_selectability/hoverability handler parsing (P0 prerequisite for
// R4 — see docs/design/ir-and-transpiler.md and the plan's P0 section):
// parse-ts previously only accepted rt.onStart/onTick/onReceive (GI104),
// even though emit-ts, @gltfi/ir's import/export, and runtime-lib fully
// support rt.onSelect/onHoverIn/onHoverOut. Three kinds of coverage here:
//   1. Synthetic per-handler emit -> parse -> export round trips, pinning
//      the config (nodeIndex, stopPropagation) survives both parseModule
//      AND exportGraph's own node configuration encoding.
//   2. Real-world corpus assets (TrafficLight.glb uses onSelect,
//      ghost_v2.glb uses onHoverIn/onHoverOut) taken through the same
//      import -> emit -> parse -> export -> validateGraph pipeline
//      @gltfi/cli's `gltfi roundtrip` uses (see packages/cli/src/main.ts's
//      cmdRoundtrip) — these aren't in Tests/Interactivity (see
//      packages/kernel/src/registry.ts's event/onSelect doc comment: the
//      official corpus never exercises UserInteractions), so they're not
//      covered by the existing CURATED round-trip suite in parse.test.ts.
//   3. The GI150 regression this same prerequisite fixes: lowerPtrGet used
//      to hard-code `{kind: "proc"}` as its context instead of threading
//      the real one, so a pointer-template arg referencing a handler param
//      (e.g. onSelect's selectedNodeIndex) failed to resolve even though
//      it's a perfectly legal int identifier in that scope.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph, importGraph, type Graph, type IRHandler, type IRModule } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { validateGraph, type VGraph } from "@gltfi/verify";
import { parseModule } from "../src/index.js";

function baseModule(handlers: IRHandler[]): IRModule {
  return {
    variables: [],
    events: [],
    stateSlots: [],
    procs: [],
    handlers,
    meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
  };
}

describe("parseModule - onSelect/onHoverIn/onHoverOut handler registrations", () => {
  it("round-trips rt.onSelect's config (nodeIndex, stopPropagation) through emit -> parse -> export", () => {
    const module = baseModule([
      {
        kind: "onSelect",
        config: { nodeIndex: 7, stopPropagation: true },
        params: [
          { name: "selectedNode", type: "ref" },
          { name: "selectedNodeIndex", type: "int" },
          { name: "controllerIndex", type: "int" },
          { name: "selectionPoint", type: "float3" },
          { name: "selectionRayOrigin", type: "float3" },
          { name: "event", type: "ref" }
        ],
        body: { k: "seq", stmts: [] }
      }
    ]);

    const { code } = emitModule(module);
    expect(code).toContain("rt.onSelect(7, true, (params) => {");

    const { module: parsed, diagnostics } = parseModule(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);
    expect(parsed.handlers).toHaveLength(1);
    expect(parsed.handlers[0].kind).toBe("onSelect");
    expect(parsed.handlers[0].config).toEqual({ nodeIndex: 7, stopPropagation: true });

    const { graph, diagnostics: exportDiags } = exportGraph(parsed);
    expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
    const handlerNode = graph.nodes[graph.nodes.length - 1] ?? graph.nodes[0];
    const onSelectNode = graph.nodes.find((n) => graph.declarations[n.declaration].op === "event/onSelect");
    expect(onSelectNode).toBeDefined();
    expect(onSelectNode!.configuration).toEqual({ nodeIndex: { value: [7] }, stopPropagation: { value: [true] } });
    void handlerNode;
  });

  it.each([
    ["onHoverIn", 3],
    ["onHoverOut", 12]
  ] as const)("round-trips rt.%s's config (nodeIndex) through emit -> parse -> export", (kind, nodeIndex) => {
    const module = baseModule([
      {
        kind,
        config: { nodeIndex },
        params: [
          { name: "hoveredNode", type: "ref" },
          { name: "controllerIndex", type: "int" },
          { name: "event", type: "ref" }
        ],
        body: { k: "seq", stmts: [] }
      }
    ]);

    const { code } = emitModule(module);
    expect(code).toContain(`rt.${kind}(${nodeIndex}, (params) => {`);

    const { module: parsed, diagnostics } = parseModule(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);
    expect(parsed.handlers).toHaveLength(1);
    expect(parsed.handlers[0].kind).toBe(kind);
    expect(parsed.handlers[0].config).toEqual({ nodeIndex });

    const { graph, diagnostics: exportDiags } = exportGraph(parsed);
    expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
    const op = kind === "onHoverIn" ? "event/onHoverIn" : "event/onHoverOut";
    const node = graph.nodes.find((n) => graph.declarations[n.declaration].op === op);
    expect(node).toBeDefined();
    expect(node!.configuration).toEqual({ nodeIndex: { value: [nodeIndex] } });
  });

  // GI150 regression: a handler param (bound via the emitted `const {...} =
  // params;` destructure) used as a pointer-template arg — lowerPtrGet used
  // to hard-code `{kind: "proc"}` regardless of the actual call site, so
  // this failed with "unresolved identifier" even though selectedNodeIndex
  // is a perfectly legal int in an onSelect handler body.
  it("accepts a handler param as a ptrGet pointer-template arg (lowerPtrGet ctx threading)", () => {
    const code = `
import { createEngine } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ pos: rt.float3(0, 0, 0) });
  const E = rt.events({});
  rt.onSelect(-1, false, (params) => {
    const { selectedNode, selectedNodeIndex, controllerIndex, selectionPoint, selectionRayOrigin } = params;
    V.pos = rt.ptrGet("/nodes/[n]/translation", { n: selectedNodeIndex }, "float3").value;
  });
});
`;
    const { module: parsed, diagnostics } = parseModule(code);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    expect(parsed.handlers).toHaveLength(1);
    const body = parsed.handlers[0].body;
    expect(JSON.stringify(body)).toContain('"k":"ptrGet"');
    expect(JSON.stringify(body)).toContain('"k":"param"');

    const { diagnostics: exportDiags } = exportGraph(parsed);
    expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
  });
});

const MODELS_ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Models");

// Mirrors @gltfi/cli's `gltfi roundtrip` pipeline (packages/cli/src/main.ts's
// cmdRoundtrip): importGraph -> emitModule -> parseModule -> exportGraph ->
// validateGraph, against real-world (not conformance-corpus) assets that
// actually use onSelect/onHoverIn/onHoverOut — see this file's header note.
function roundtripCorpusHandlers(glbPath: string, expectedKinds: string[]) {
  const runtime = createRuntimeFromGlbFile(glbPath);
  const { module, diagnostics: importDiags } = importGraph(runtime.graph as unknown as Graph);
  expect(importDiags.filter((d) => d.severity === "error")).toEqual([]);

  const presentKinds = new Set(module.handlers.map((h) => h.kind));
  for (const kind of expectedKinds) {
    expect(presentKinds.has(kind as IRHandler["kind"]), `expected a "${kind}" handler in ${glbPath}`).toBe(true);
  }

  const { code } = emitModule(module);
  const { module: parsed, diagnostics: parseDiags } = parseModule(code);
  const parseErrors = parseDiags.filter((d) => d.severity === "error");
  expect(parseErrors, JSON.stringify(parseErrors, null, 2)).toEqual([]);

  // The handlers, and their configs, survive the round trip.
  const original = module.handlers.filter((h) => expectedKinds.includes(h.kind)).map((h) => ({ kind: h.kind, config: h.config }));
  const reparsed = parsed.handlers.filter((h) => expectedKinds.includes(h.kind)).map((h) => ({ kind: h.kind, config: h.config }));
  expect(reparsed).toEqual(original);

  const { graph, diagnostics: exportDiags } = exportGraph(parsed);
  expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
  const validation = validateGraph(graph as unknown as VGraph);
  expect(validation.diagnostics.filter((d) => d.severity === "error"), JSON.stringify(validation.diagnostics, null, 2)).toEqual([]);
  expect(validation.ok).toBe(true);
}

describe("parseModule - corpus round-trip (Models/, real assets outside the conformance corpus)", () => {
  it("TrafficLight.glb (onSelect) survives extract -> parseModule -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "TrafficLight/glTF-Binary/TrafficLight.glb"), ["onSelect"]);
  });

  it("ghost_v2.glb (onHoverIn/onHoverOut) survives extract -> parseModule -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "Ghost/glTF-Binary/ghost_v2.glb"), ["onHoverIn", "onHoverOut"]);
  });
});
