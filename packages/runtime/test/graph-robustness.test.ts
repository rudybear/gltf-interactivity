// Robustness of the public entry points against legal-but-sparse input:
//   - Khronos' graph.schema.json has no required properties and every array
//     has minItems: 1, so a graph may omit empty types/variables/events/
//     declarations/nodes (normalizeGraph);
//   - resolveGraph honors extensions.KHR_interactivity.graph;
//   - none of resolveGraph / createRuntime / InteractivityRuntime mutate the
//     glTF JSON or graph they are handed (checked with deep-frozen input:
//     ESM is strict mode, so any write to a frozen object throws).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { InteractivityRuntime, type SceneAdapter } from "../src/host.js";
import { createRuntime, InteractivityValidationError, normalizeGraph, resolveGraph } from "../src/interpreter.js";

function spyAdapter() {
  const calls: Array<{ pointer: string; value: unknown }> = [];
  const adapter: SceneAdapter = { applyPointer: (pointer, value) => void calls.push({ pointer, value }) };
  return { adapter, calls };
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as object)) deepFreeze(v);
  }
  return o;
}

describe("graphs with omitted arrays", () => {
  it("no variables / events: onStart -> pointer/set reaches the adapter synchronously", () => {
    // `types` can't be omitted here: pointer/set's `type` config and the
    // literal both index into it.
    const graph: any = {
      types: [{ signature: "float3" }],
      declarations: [{ op: "event/onStart" }, { op: "pointer/set" }],
      nodes: [
        { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
        {
          declaration: 1,
          configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [0] } },
          values: { value: { type: 0, value: [1, 2, 3] } }
        }
      ]
    };
    const runtime = new InteractivityRuntime(graph, { nodes: [{}] });
    const { adapter, calls } = spyAdapter();
    runtime.bindAdapter(adapter);
    runtime.start();
    expect(calls).toEqual([{ pointer: "/nodes/0/translation", value: [1, 2, 3] }]);
    expect(() => runtime.tick(0.016)).not.toThrow();
    expect(runtime.consumeDirty()).toBe(true);
    expect(runtime.consumeDirty()).toBe(false);
  });

  it("no types / variables / events: declarations + nodes only", () => {
    const graph: any = {
      declarations: [{ op: "event/onStart" }],
      nodes: [{ declaration: 0 }]
    };
    const runtime = new InteractivityRuntime(graph, { nodes: [{}] });
    runtime.start();
    expect(() => runtime.tick(0.016)).not.toThrow();
    expect(runtime.getDiagnostics().nodes).toBe(1);
  });

  it("empty graph {}: construct, start, tick, and createRuntime directly", () => {
    const runtime = new InteractivityRuntime({}, {});
    runtime.start();
    expect(() => runtime.tick(0.016)).not.toThrow();
    expect(runtime.getDiagnostics().nodes).toBe(0);
    expect(() => createRuntime({}, {})).not.toThrow();
  });

  it("normalizeGraph returns a new object and leaves the input alone", () => {
    const input = Object.freeze({}) as any;
    const out = normalizeGraph(input);
    expect(out).not.toBe(input);
    expect(out).toEqual({ types: [], variables: [], events: [], declarations: [], nodes: [] });
    expect(Object.keys(input)).toEqual([]);
  });
});

describe("resolveGraph", () => {
  const g0 = { declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] };
  const g1 = { declarations: [{ op: "event/onTick" }], nodes: [{ declaration: 0 }] };
  const gltfWith = (extra: object) => ({ extensions: { KHR_interactivity: { graphs: [g0, g1], ...extra } } });

  it("defaults to graph 0", () => {
    expect(resolveGraph(gltfWith({}))).toBe(g0);
  });
  it("`graph` selects graphs[graph]", () => {
    expect(resolveGraph(gltfWith({ graph: 1 }))).toBe(g1);
    expect(resolveGraph(gltfWith({ graph: 0 }))).toBe(g0);
  });
  it.each([2, -1, 0.5, "1", null, NaN])("rejects invalid graph index %j", (graph) => {
    // Spec "Extension Object Validation": an invalid default-graph index
    // rejects the whole extension with a typed, diagnosable error.
    let thrown: unknown;
    try {
      resolveGraph(gltfWith({ graph }));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(InteractivityValidationError);
    expect((thrown as InteractivityValidationError).scope).toBe("extension");
    expect((thrown as InteractivityValidationError).diagnostics[0].section).toBe("Validation › Extension Object Validation");
  });
  it("still reports missing extension / graphs", () => {
    expect(() => resolveGraph({})).toThrow("Missing KHR_interactivity.");
    expect(() => resolveGraph({ extensions: { KHR_interactivity: {} } })).toThrow(InteractivityValidationError);
    expect(() => resolveGraph({ extensions: { KHR_interactivity: { graphs: [] } } })).toThrow(InteractivityValidationError);
  });
  it("does not mutate its input", () => {
    const gltf = deepFreeze(gltfWith({ graph: 1 }));
    expect(() => resolveGraph(gltf)).not.toThrow();
  });
});

// Needs the (gitignored) Khronos corpus checkout; skipped without it.
const corpus = path.resolve(
  import.meta.dirname,
  "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity/UserInteractions/eventOnSelect/glTF-Binary/eventOnSelect.glb"
);

function readGlb(file: string) {
  const data = fs.readFileSync(file);
  let offset = 12;
  let json: any = null;
  let bin: Uint8Array | undefined;
  while (offset < data.length) {
    const len = data.readUInt32LE(offset);
    const type = data.readUInt32LE(offset + 4);
    const chunk = data.subarray(offset + 8, offset + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8"));
    else if (type === 0x004e4942) bin = new Uint8Array(chunk);
    offset += 8 + len;
  }
  return { json, bin };
}

describe.skipIf(!fs.existsSync(corpus))("no-mutation guarantee (deep-frozen corpus input)", () => {
  it("construct / start / tick / hover / select never write to the glTF or graph", () => {
    const { json, bin } = readGlb(corpus);
    const gltf = deepFreeze(json);
    const graph = resolveGraph(gltf);
    const runtime = new InteractivityRuntime(graph, gltf, bin);
    const { adapter } = spyAdapter();
    runtime.bindAdapter(adapter);
    runtime.start();
    for (let i = 0; i < 5; i++) runtime.tick(0.016);
    runtime.setHover(0, [0, 0, 0]);
    runtime.setSelection(0, [0, 0, 0], [0, 0, 5]);
    runtime.tick(0.016);
    runtime.setHover(-1, [NaN, NaN, NaN]);
    runtime.tick(0.016);
    expect(Object.isFrozen(graph)).toBe(true);
  });
});
