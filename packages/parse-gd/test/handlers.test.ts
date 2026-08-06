// KHR_node_selectability/hoverability handler parsing (R4 #20-4 — see
// packages/parse-ts/test/handlers.test.ts, the reference implementation
// this mirrors, and packages/parse-lua/test/handlers.test.ts/packages/
// parse-py/test/handlers.test.ts/packages/parse-cs/test/handlers.test.ts,
// the sibling backend coverage): emit-gd/parse-gd previously REFUSED
// rt.on_select/on_hover_in/on_hover_out (GG104), a runtime-scope decision
// (runtime-gd never FIRES select/hover — see engine.gd's header note) that
// had leaked into the emitter/parser. Now both sides round-trip the
// registration + config + params exactly like every other handler kind;
// only EXECUTION stays out of scope (runtime-gd's rt.on_select/
// on_hover_in/on_hover_out are no-op-tolerant stubs that never fire).
//
// Three kinds of coverage here, mirroring the sibling backends'
// handlers.test.ts:
//   1. Synthetic per-handler emit -> parse -> export round trips, pinning
//      the config (nodeIndex, stopPropagation) survives both parseModuleGd
//      AND exportGraph's own node configuration encoding.
//   2. A real-world corpus asset (TrafficLight.glb uses onSelect; ghost_v2
//      uses onHoverIn/onHoverOut) taken through the same import -> emit ->
//      parse -> export -> validateGraph pipeline as the other backends.
//   3. A handler param used as a pointer-template arg, proving lowerPtrGet's
//      ctx threading (this package's own GG150 fix, mirroring the sibling
//      backends' identical GI150/GL150/GP150/GC150 fixes) covers onSelect's
//      params too.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph, importGraph, type Graph, type IRHandler, type IRModule } from "@gltfi/ir";
import { emitModuleGd } from "@gltfi/emit-gd";
import { validateGraph, type VGraph } from "@gltfi/verify";
import { parseModuleGd } from "../src/index.js";

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

describe("parseModuleGd - onSelect/onHoverIn/onHoverOut handler registrations", () => {
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

    const { code } = emitModuleGd(module);
    expect(code).toContain("rt.on_select(7, true, __on_select_0)");

    const { module: parsed, diagnostics } = parseModuleGd(code);
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

    const { code } = emitModuleGd(module);
    const snakeKind = kind === "onHoverIn" ? "on_hover_in" : "on_hover_out";
    const funcKind = kind === "onHoverIn" ? "__on_hover_in_0" : "__on_hover_out_0";
    expect(code).toContain(`rt.${snakeKind}(${nodeIndex}, ${funcKind})`);

    const { module: parsed, diagnostics } = parseModuleGd(code);
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

  // Regression mirroring the sibling backends' GI150/GL150/GP150/GC150
  // fixes: a handler param (read directly off the handler's own `params:
  // Dictionary` parameter — no destructuring in this backend, see
  // emit-gd's header note) used as a pointer-template arg — proves
  // lowerPtrGet's ctx threading also covers onSelect's own params, not
  // just onTick/onReceive's. Built via emitModuleGd (not hand-written
  // GDScript) so the exact generated syntax is always in sync with the
  // emitter.
  it("accepts a handler param as a ptrGet pointer-template arg (lowerPtrGet ctx threading)", () => {
    const module: IRModule = {
      variables: [{ name: "pos", type: "float3", initial: { type: "float3", data: [0, 0, 0] } }],
      events: [],
      stateSlots: [],
      procs: [],
      handlers: [
        {
          kind: "onSelect",
          config: { nodeIndex: -1, stopPropagation: false },
          params: [
            { name: "selectedNode", type: "ref" },
            { name: "selectedNodeIndex", type: "int" },
            { name: "controllerIndex", type: "int" },
            { name: "selectionPoint", type: "float3" },
            { name: "selectionRayOrigin", type: "float3" },
            { name: "event", type: "ref" }
          ],
          body: {
            k: "seq",
            stmts: [
              {
                k: "setVar",
                varId: 0,
                expr: {
                  k: "ptrGet",
                  template: {
                    segments: [
                      { k: "lit", text: "nodes" },
                      { k: "int", name: "n" },
                      { k: "lit", text: "translation" }
                    ]
                  },
                  args: [{ k: "param", name: "selectedNodeIndex", type: "int" }],
                  type: "float3",
                  valueType: "float3",
                  wantIsValid: false
                }
              }
            ]
          }
        }
      ],
      meta: { nameMaps: { variables: ["pos"], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
    };

    const { code } = emitModuleGd(module);
    const { module: parsed, diagnostics } = parseModuleGd(code);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors, JSON.stringify(errors, null, 2) + "\n\n" + code).toEqual([]);
    expect(parsed.handlers).toHaveLength(1);
    const body = parsed.handlers[0].body;
    expect(JSON.stringify(body)).toContain('"k":"ptrGet"');
    expect(JSON.stringify(body)).toContain('"k":"param"');

    const { diagnostics: exportDiags } = exportGraph(parsed);
    expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
  });
});

const MODELS_ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Models");

// Mirrors @gltfi/cli's `gltfi roundtrip` pipeline (applied to the GDScript
// backend instead of TS): importGraph -> emitModuleGd -> parseModuleGd ->
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

  const { code } = emitModuleGd(module);
  const { module: parsed, diagnostics: parseDiags } = parseModuleGd(code);
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

describe("parseModuleGd - corpus round-trip (Models/, real assets outside the conformance corpus)", () => {
  it("TrafficLight.glb (onSelect) survives extract -> emitModuleGd -> parseModuleGd -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "TrafficLight/glTF-Binary/TrafficLight.glb"), ["onSelect"]);
  });

  it("ghost_v2.glb (onHoverIn/onHoverOut) survives extract -> emitModuleGd -> parseModuleGd -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "Ghost/glTF-Binary/ghost_v2.glb"), ["onHoverIn", "onHoverOut"]);
  });
});
