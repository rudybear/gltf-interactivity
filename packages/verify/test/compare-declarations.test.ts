import { describe, expect, it } from "vitest";
import { compareDeclarations, type VGraph } from "../src/index.js";

// Base fixture: 3 variables (float, float3, int-with-id "counter" at index
// 2 — matching the "variables[2]" spelling used in the R3 plan's worked
// example) and one event carrying a single value key.
function baseGraph(): VGraph {
  return {
    types: [{ signature: "float" }, { signature: "float3" }, { signature: "int" }],
    variables: [
      { type: 0, value: [0] },
      { type: 1, value: [0, 0, 0] },
      { id: "counter", type: 2, value: [0] }
    ],
    events: [{ id: "onTick", values: { expectedDuration: { type: 0, value: [1] } } }],
    declarations: [{ op: "event/onTick" }],
    nodes: []
  };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

describe("compareDeclarations", () => {
  it("reports same:true and no changes for identical graphs", () => {
    const a = baseGraph();
    const b = clone(a);
    expect(compareDeclarations(a, b)).toEqual({ same: true, changes: [] });
  });

  it("resolves variable/event types through each graph's own types table, tolerating index reshuffles", () => {
    const a = baseGraph();
    // b's types table lists the same three signatures in reverse order, so
    // every type index used by b's variables/events is different from a's
    // — but the *resolved* signatures and values are identical, so this
    // must still compare same:true.
    const b: VGraph = {
      types: [{ signature: "int" }, { signature: "float3" }, { signature: "float" }],
      variables: [
        { type: 2, value: [0] },
        { type: 1, value: [0, 0, 0] },
        { id: "counter", type: 0, value: [0] }
      ],
      events: [{ id: "onTick", values: { expectedDuration: { type: 2, value: [1] } } }],
      declarations: [{ op: "event/onTick" }],
      nodes: []
    };
    expect(compareDeclarations(a, b)).toEqual({ same: true, changes: [] });
  });

  it("tolerates 0 vs 0.0 and -0 vs 0 in initial/default values", () => {
    const a = baseGraph();
    const b = clone(a);
    b.variables![0].value = [-0];
    b.events![0].values!.expectedDuration.value = [1.0];
    expect(compareDeclarations(a, b)).toEqual({ same: true, changes: [] });
  });

  it("flags a dropped variable id with the exact expected line", () => {
    const a = baseGraph();
    const b = clone(a);
    delete b.variables![2].id;
    const result = compareDeclarations(a, b);
    expect(result.same).toBe(false);
    expect(result.changes).toContain('variables[2]: id "counter" -> (none)');
  });

  it("flags a variable type change by resolved signature", () => {
    const a = baseGraph();
    const b = clone(a);
    b.types[2] = { signature: "bool" };
    const result = compareDeclarations(a, b);
    expect(result.same).toBe(false);
    expect(result.changes).toContain('variables[2]: type "int" -> "bool"');
  });

  it("flags an initial value change", () => {
    const a = baseGraph();
    const b = clone(a);
    b.variables![2].value = [5];
    const result = compareDeclarations(a, b);
    expect(result.same).toBe(false);
    expect(result.changes).toContain("variables[2]: initial 0 -> 5");
  });

  it("flags an event default value change with the exact expected line", () => {
    const a = baseGraph();
    const b = clone(a);
    b.events![0].values!.expectedDuration.value = [2];
    const result = compareDeclarations(a, b);
    expect(result.same).toBe(false);
    expect(result.changes).toContain("events[0].values.expectedDuration: default 1 -> 2");
  });

  it("flags a variable count mismatch", () => {
    const a = baseGraph();
    const b = clone(a);
    b.variables!.pop();
    const result = compareDeclarations(a, b);
    expect(result.same).toBe(false);
    expect(result.changes).toContain("variables: count 3 -> 2");
    expect(result.changes).toContain('variables[2]: type "int" -> (none)');
  });

  it("flags an event count mismatch", () => {
    const a = baseGraph();
    const b = clone(a);
    b.events = [];
    const result = compareDeclarations(a, b);
    expect(result.same).toBe(false);
    expect(result.changes).toContain("events: count 1 -> 0");
    expect(result.changes).toContain("events[0]: present -> (none)");
  });

  it("flags an event id change", () => {
    const a = baseGraph();
    const b = clone(a);
    b.events![0].id = "onStart";
    const result = compareDeclarations(a, b);
    expect(result.changes).toContain('events[0]: id "onTick" -> "onStart"');
  });

  it("flags event value keys added/removed and per-key type changes", () => {
    const a = baseGraph();
    const b = clone(a);
    delete b.events![0].values!.expectedDuration;
    b.events![0].values!.newField = { type: 1, value: [0, 0, 0] };
    const removed = compareDeclarations(a, b);
    expect(removed.changes).toContain('events[0].values: key "expectedDuration" removed');
    expect(removed.changes).toContain('events[0].values: key "newField" added');

    const c = clone(a);
    c.events![0].values!.expectedDuration.type = 1; // float -> float3
    const typeChanged = compareDeclarations(a, c);
    expect(typeChanged.changes).toContain('events[0].values.expectedDuration: type "float" -> "float3"');
  });
});
