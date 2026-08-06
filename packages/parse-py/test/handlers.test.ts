// KHR_node_selectability/hoverability handler parsing (R4 #20-4 — see
// packages/parse-ts/test/handlers.test.ts, the reference implementation
// this mirrors, and packages/parse-lua/test/handlers.test.ts, the sibling
// Lua-backend coverage): emit-py/parse-py previously REFUSED rt.on_select/
// on_hover_in/on_hover_out (GP104), a runtime-scope decision (runtime-py
// never FIRES select/hover — see engine.py's header note) that had leaked
// into the emitter/parser. Now both sides round-trip the registration +
// config + params exactly like every other handler kind; only EXECUTION
// stays out of scope (runtime-py's rt.on_select/on_hover_in/on_hover_out
// are no-op-tolerant stubs that never fire).
//
// Three kinds of coverage here, mirroring parse-ts's/parse-lua's
// handlers.test.ts:
//   1. Synthetic per-handler emit -> parse -> export round trips, pinning
//      the config (nodeIndex, stopPropagation) survives both parseModulePy
//      AND exportGraph's own node configuration encoding.
//   2. A real-world corpus asset (TrafficLight.glb uses onSelect; ghost_v2
//      uses onHoverIn/onHoverOut) taken through the same import -> emit ->
//      parse -> export -> validateGraph pipeline as the TS/Lua reference.
//   3. A handler param used as a pointer-template arg, proving lowerPtrGet's
//      ctx threading (this package's own GP150 fix, mirroring parse-ts's
//      GI150/parse-lua's GL150) covers onSelect's params too.
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph, importGraph, type Graph, type IRHandler, type IRModule } from "@gltfi/ir";
import { emitModulePy } from "@gltfi/emit-py";
import { validateGraph, type VGraph } from "@gltfi/verify";
import { closeParser, parseModulePy } from "../src/index.js";

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

describe("parseModulePy - onSelect/onHoverIn/onHoverOut handler registrations", () => {
  it("round-trips rt.on_select's config (nodeIndex, stopPropagation) through emit -> parse -> export", () => {
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

    const { code } = emitModulePy(module);
    expect(code).toContain("rt.on_select(7, True, __on_select_0)");

    const { module: parsed, diagnostics } = parseModulePy(code);
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

    const { code } = emitModulePy(module);
    const snakeKind = kind === "onHoverIn" ? "on_hover_in" : "on_hover_out";
    expect(code).toContain(`rt.${snakeKind}(${nodeIndex}, `);

    const { module: parsed, diagnostics } = parseModulePy(code);
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

  // Regression mirroring parse-ts's GI150/parse-lua's GL150 fix: a handler
  // param (bound via the emitted destructuring tuple assignment) used as a
  // pointer-template arg — proves lowerPtrGet's ctx threading also covers
  // onSelect's own local params, not just onTick/onReceive's.
  it("accepts a handler param as a ptrGet pointer-template arg (lowerPtrGet ctx threading)", () => {
    const code = `
import gltfi_runtime.m as m


def build(rt: "Engine") -> None:
    V = rt.vars({"pos": rt.float3(0.0, 0.0, 0.0)})
    E = rt.events({})

    def __on_select_0(params: dict) -> None:
        selected_node, selected_node_index, controller_index, selection_point, selection_ray_origin = (params["selectedNode"], params["selectedNodeIndex"], params["controllerIndex"], params["selectionPoint"], params["selectionRayOrigin"])
        V.pos = rt.ptr_get("/nodes/[n]/translation", {"n": selected_node_index}, "float3")["value"]
    rt.on_select(-1, False, __on_select_0)
`;
    const { module: parsed, diagnostics } = parseModulePy(code);
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

afterAll(() => {
  closeParser();
});

const MODELS_ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Models");

// Mirrors @gltfi/cli's `gltfi roundtrip` pipeline (applied to the Python
// backend instead of TS): importGraph -> emitModulePy -> parseModulePy ->
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

  const { code } = emitModulePy(module);
  const { module: parsed, diagnostics: parseDiags } = parseModulePy(code);
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

describe("parseModulePy - corpus round-trip (Models/, real assets outside the conformance corpus)", () => {
  it("TrafficLight.glb (onSelect) survives extract -> emitModulePy -> parseModulePy -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "TrafficLight/glTF-Binary/TrafficLight.glb"), ["onSelect"]);
  });

  it("ghost_v2.glb (onHoverIn/onHoverOut) survives extract -> emitModulePy -> parseModulePy -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "Ghost/glTF-Binary/ghost_v2.glb"), ["onHoverIn", "onHoverOut"]);
  });
});
