// KHR_node_selectability/hoverability handler parsing (R4 #20-4 — see
// packages/parse-ts/test/handlers.test.ts, the reference implementation
// this mirrors): emit-lua/parse-lua previously REFUSED rt.onSelect/
// onHoverIn/onHoverOut (GL104), a runtime-scope decision (runtime-lua never
// FIRES select/hover — see engine.lua's header note) that had leaked into
// the emitter/parser. Now both sides round-trip the registration +
// config + params exactly like every other handler kind; only EXECUTION
// stays out of scope (runtime-lua's rt.onSelect/onHoverIn/onHoverOut are
// no-op-tolerant stubs that never fire).
//
// Three kinds of coverage here, mirroring parse-ts's handlers.test.ts:
//   1. Synthetic per-handler emit -> parse -> export round trips, pinning
//      the config (nodeIndex, stopPropagation) survives both parseModuleLua
//      AND exportGraph's own node configuration encoding.
//   2. A real-world corpus asset (TrafficLight.glb uses onSelect; ghost_v2
//      uses onHoverIn/onHoverOut) taken through the same import -> emit ->
//      parse -> export -> validateGraph pipeline as the TS reference.
//   3. A handler param used as a pointer-template arg, proving lowerPtrGet's
//      ctx threading (already fixed for onTick/onReceive — see
//      ptr-ctx.test.ts) also covers onSelect's params.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph, importGraph, type Graph, type IRHandler, type IRModule } from "@gltfi/ir";
import { emitModuleLua } from "@gltfi/emit-lua";
import { validateGraph, type VGraph } from "@gltfi/verify";
import { parseModuleLua } from "../src/index.js";

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

describe("parseModuleLua - onSelect/onHoverIn/onHoverOut handler registrations", () => {
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

    const { code } = emitModuleLua(module);
    expect(code).toContain("rt.onSelect(7.0, true, function(params)");

    const { module: parsed, diagnostics } = parseModuleLua(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);
    expect(parsed.handlers).toHaveLength(1);
    expect(parsed.handlers[0].kind).toBe("onSelect");
    expect(parsed.handlers[0].config).toEqual({ nodeIndex: 7, stopPropagation: true });

    const { graph, diagnostics: exportDiags } = exportGraph(parsed);
    expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
    const onSelectNode = graph.nodes.find((n) => graph.declarations[n.declaration].op === "event/onSelect");
    expect(onSelectNode).toBeDefined();
    expect(onSelectNode!.configuration).toEqual({ nodeIndex: { value: [7] }, stopPropagation: { value: [true] } });
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

    const { code } = emitModuleLua(module);
    expect(code).toContain(`rt.${kind}(${nodeIndex}.0, function(params)`);

    const { module: parsed, diagnostics } = parseModuleLua(code);
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

  // Regression mirroring parse-ts's GI150/ptr-ctx.test.ts's GL150 fix: a
  // handler param (bound via the emitted `local ... = params...`
  // multiple-assignment) used as a pointer-template arg — proves
  // lowerPtrGet's ctx threading also covers onSelect's own local params,
  // not just onTick/onReceive's.
  it("accepts a handler param as a ptrGet pointer-template arg (lowerPtrGet ctx threading)", () => {
    const code = `
return function(rt)
  local V = rt.vars({ { name = "pos", decl = rt.float3(0.0, 0.0, 0.0) } })
  local E = rt.events({})
  rt.onSelect(-1.0, false, function(params)
    local selectedNode, selectedNodeIndex, controllerIndex, selectionPoint, selectionRayOrigin =
      params.selectedNode, params.selectedNodeIndex, params.controllerIndex, params.selectionPoint, params.selectionRayOrigin
    V.pos = rt.ptrGet("/nodes/[n]/translation", { n = selectedNodeIndex }, "float3").value
  end)
end
`;
    const { module: parsed, diagnostics } = parseModuleLua(code);
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

// Mirrors @gltfi/cli's `gltfi roundtrip` pipeline (applied to the Lua
// backend instead of TS): importGraph -> emitModuleLua -> parseModuleLua ->
// exportGraph -> validateGraph, against real-world (not conformance-corpus)
// assets that actually use onSelect/onHoverIn/onHoverOut.
function roundtripCorpusHandlers(glbPath: string, expectedKinds: string[]) {
  const runtime = createRuntimeFromGlbFile(glbPath);
  const { module, diagnostics: importDiags } = importGraph(runtime.graph as unknown as Graph);
  expect(importDiags.filter((d) => d.severity === "error")).toEqual([]);

  const presentKinds = new Set(module.handlers.map((h) => h.kind));
  for (const kind of expectedKinds) {
    expect(presentKinds.has(kind as IRHandler["kind"]), `expected a "${kind}" handler in ${glbPath}`).toBe(true);
  }

  const { code } = emitModuleLua(module);
  const { module: parsed, diagnostics: parseDiags } = parseModuleLua(code);
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

describe("parseModuleLua - corpus round-trip (Models/, real assets outside the conformance corpus)", () => {
  it("TrafficLight.glb (onSelect) survives extract -> emitModuleLua -> parseModuleLua -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "TrafficLight/glTF-Binary/TrafficLight.glb"), ["onSelect"]);
  });

  it("ghost_v2.glb (onHoverIn/onHoverOut) survives extract -> emitModuleLua -> parseModuleLua -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "Ghost/glTF-Binary/ghost_v2.glb"), ["onHoverIn", "onHoverOut"]);
  });
});
