// Load-time rejection per the spec's Validation section: resolveGraph,
// createRuntime and InteractivityRuntime throw a typed InteractivityValidationError
// (carrying spec-section diagnostics) for invalid input, and keep working for
// valid input and for the explicit `validate: false` opt-out.
import { describe, expect, it } from "vitest";
import { InteractivityRuntime } from "../src/host.js";
import { createRuntime, InteractivityValidationError, resolveGraph } from "../src/interpreter.js";

const valid = () => ({
  types: [{ signature: "int" }],
  variables: [{ type: 0, value: [0] }],
  declarations: [{ op: "event/onStart" }, { op: "variable/set" }],
  nodes: [
    { declaration: 0, flows: { out: { node: 1 } } },
    { declaration: 1, configuration: { variables: { value: [0] } }, values: { "0": { type: 0, value: [42] } } }
  ]
});
const invalid = () => {
  const g: any = valid();
  g.declarations.push({ op: "math/doesNotExist" });
  return g;
};
const gltfOf = (graphs: unknown[], extra: object = {}) => ({ extensions: { KHR_interactivity: { graphs, ...extra } } });

describe("load-time validation", () => {
  it("valid graphs load and run unchanged", () => {
    const gltf = gltfOf([valid()]);
    const rt = new InteractivityRuntime(resolveGraph(gltf), gltf);
    rt.start();
    expect(rt.getVariableByIndex(0).data[0]).toBe(42);
    expect(createRuntime(valid(), {}).variables[0].data[0]).toBe(0);
  });

  it("createRuntime / InteractivityRuntime reject an invalid graph with diagnostics", () => {
    for (const make of [() => createRuntime(invalid(), {}), () => new InteractivityRuntime(invalid(), {})]) {
      let err: unknown;
      try {
        make();
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(InteractivityValidationError);
      const e = err as InteractivityValidationError;
      expect(e.scope).toBe("graph");
      expect(e.diagnostics[0]).toMatchObject({ code: "GV126", section: "JSON Syntax › Declarations", outcome: "rejectGraph", severity: "error" });
    }
  });

  it("resolveGraph rejects the whole extension when the selected default graph is invalid, even if another graph is fine", () => {
    const gltf = gltfOf([valid(), invalid()], { graph: 1 });
    expect(() => resolveGraph(gltf)).toThrow(InteractivityValidationError);
    // The valid sibling must not run either: the constructor validates the extension too.
    expect(() => new InteractivityRuntime(valid(), gltfOf([valid(), invalid()], { graph: 1 }))).not.toThrow();
    const g0 = valid();
    const g1 = invalid();
    expect(() => new InteractivityRuntime(g0, gltfOf([g0, g1], { graph: 1 }))).toThrow(InteractivityValidationError);
  });

  it("an invalid non-default graph does not stop the default graph from loading", () => {
    const gltf = gltfOf([valid(), invalid()]);
    expect(() => resolveGraph(gltf)).not.toThrow();
    const g0 = (gltf.extensions.KHR_interactivity.graphs as any[])[0];
    expect(() => new InteractivityRuntime(g0, gltf)).not.toThrow();
  });

  it("`validate: false` opts out (in-progress graphs)", () => {
    expect(() => createRuntime(invalid(), {}, { validate: false })).not.toThrow();
    expect(() => new InteractivityRuntime(invalid(), {}, undefined, { validate: false })).not.toThrow();
  });

  it("still reports a missing extension with a plain error", () => {
    expect(() => resolveGraph({})).toThrow("Missing KHR_interactivity.");
  });
});
