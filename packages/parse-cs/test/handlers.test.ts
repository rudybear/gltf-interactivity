// KHR_node_selectability/hoverability handler parsing (R4 #20-4 — see
// packages/parse-ts/test/handlers.test.ts, the reference implementation
// this mirrors, and packages/parse-lua/test/handlers.test.ts/packages/
// parse-py/test/handlers.test.ts, the sibling backend coverage): emit-cs/
// parse-cs previously REFUSED rt.OnSelect/OnHoverIn/OnHoverOut (GC104), a
// runtime-scope decision (runtime-cs never FIRES select/hover — see
// Engine.cs's header note) that had leaked into the emitter/parser. Now
// both sides round-trip the registration + config + params exactly like
// every other handler kind; only EXECUTION stays out of scope (runtime-cs's
// rt.OnSelect/OnHoverIn/OnHoverOut are no-op-tolerant stubs that never
// fire).
//
// Three kinds of coverage here, mirroring parse-ts's/parse-lua's/parse-py's
// handlers.test.ts:
//   1. Synthetic per-handler emit -> parse -> export round trips, pinning
//      the config (nodeIndex, stopPropagation) survives both parseModuleCs
//      AND exportGraph's own node configuration encoding.
//   2. A real-world corpus asset (TrafficLight.glb uses onSelect; ghost_v2
//      uses onHoverIn/onHoverOut) taken through the same import -> emit ->
//      parse -> export -> validateGraph pipeline as the other backends.
//   3. A handler param used as a pointer-template arg, proving lowerPtrGet's
//      ctx threading (this package's own GC150 fix, mirroring parse-ts's
//      GI150/parse-lua's GL150/parse-py's GP150) covers onSelect's params.
//
// `afterAll` calls `closeParser()` so the shared, lazily-spawned Roslyn
// harness process this whole file's `parseModuleCs` calls share gets torn
// down — otherwise vitest would hang waiting for that child process's fds
// to close (mirrors parse.test.ts's own identical afterAll).
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph, importGraph, type Graph, type IRHandler, type IRModule } from "@gltfi/ir";
import { emitModuleCs } from "@gltfi/emit-cs";
import { validateGraph, type VGraph } from "@gltfi/verify";
import { closeParser, parseModuleCs } from "../src/index.js";

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

afterAll(() => {
  closeParser();
});

describe("parseModuleCs - onSelect/onHoverIn/onHoverOut handler registrations", () => {
  it("round-trips rt.OnSelect's config (nodeIndex, stopPropagation) through emit -> parse -> export", () => {
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

    const { code } = emitModuleCs(module);
    expect(code).toContain("rt.OnSelect(7, true, OnSelect0);");

    const { module: parsed, diagnostics } = parseModuleCs(code);
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

    const { code } = emitModuleCs(module);
    const pascalKind = kind === "onHoverIn" ? "OnHoverIn" : "OnHoverOut";
    expect(code).toContain(`rt.${pascalKind}(${nodeIndex}, ${pascalKind}0);`);

    const { module: parsed, diagnostics } = parseModuleCs(code);
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

  // Regression mirroring parse-ts's GI150/parse-lua's GL150/parse-py's
  // GP150 fix: a handler param (read directly off the handler's own typed
  // `SelectParams selectParams` parameter — no destructuring in this
  // backend, see emit-cs's header note) used as a pointer-template arg —
  // proves lowerPtrGet's ctx threading also covers onSelect's own params,
  // not just onTick/onReceive's. Built via emitModuleCs (not hand-written
  // C#) so the exact generated syntax is always in sync with the emitter.
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

    const { code } = emitModuleCs(module);
    const { module: parsed, diagnostics } = parseModuleCs(code);
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

// Mirrors @gltfi/cli's `gltfi roundtrip` pipeline (applied to the C#
// backend instead of TS): importGraph -> emitModuleCs -> parseModuleCs ->
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

  const { code } = emitModuleCs(module);
  const { module: parsed, diagnostics: parseDiags } = parseModuleCs(code);
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

describe("parseModuleCs - corpus round-trip (Models/, real assets outside the conformance corpus)", () => {
  it("TrafficLight.glb (onSelect) survives extract -> emitModuleCs -> parseModuleCs -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "TrafficLight/glTF-Binary/TrafficLight.glb"), ["onSelect"]);
  });

  it("ghost_v2.glb (onHoverIn/onHoverOut) survives extract -> emitModuleCs -> parseModuleCs -> exportGraph -> validateGraph", () => {
    roundtripCorpusHandlers(path.join(MODELS_ROOT, "Ghost/glTF-Binary/ghost_v2.glb"), ["onHoverIn", "onHoverOut"]);
  });
});
