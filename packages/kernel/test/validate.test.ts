// Unit coverage of the spec Validation algorithm (src/validate.ts): one or two
// representative cases per rule group. The exhaustive 187-case gate against the
// Khronos invalid-graph corpus lives in @gltfi/conformance (`pnpm conf:invalid`).
import { describe, expect, it } from "vitest";
import {
  InteractivityValidationError,
  assertValidExtension,
  assertValidGraph,
  isGraphValidated,
  isInteractivityValidationError,
  markGraphValidated,
  parseLogMessage,
  parsePointerTemplateStrict,
  validateExtension,
  validateGraphObject
} from "../src/index.js";

// A minimal valid graph: onStart -> debug/log, float/int/bool types.
function graph(): any {
  return {
    types: [{ signature: "float" }, { signature: "int" }, { signature: "bool" }, { signature: "float3" }],
    variables: [{ type: 0, value: [1.5] }, { type: 1 }],
    events: [{ id: "custom/a", values: { v: { type: 1, value: [3] } } }],
    declarations: [{ op: "event/onStart" }, { op: "debug/log" }, { op: "math/add" }, { op: "event/send" }],
    nodes: [
      { declaration: 0, flows: { out: { node: 1 } } },
      { declaration: 1, configuration: { message: { value: ["sum {x}"] } }, values: { x: { node: 2 } }, flows: { out: { node: 3 } } },
      { declaration: 2, values: { a: { type: 1, value: [1] }, b: { type: 1, value: [2] } } },
      { declaration: 3, configuration: { event: { value: [0] } }, values: { v: { type: 1, value: [7] } } }
    ]
  };
}

// The log node above reads node 2 (declared AFTER it): reorder to keep the
// value edge backward-only.
function validGraph(): any {
  const g = graph();
  g.nodes = [
    { declaration: 0, flows: { out: { node: 2 } } },
    { declaration: 2, values: { a: { type: 1, value: [1] }, b: { type: 1, value: [2] } } },
    { declaration: 1, configuration: { message: { value: ["sum {x}"] } }, values: { x: { node: 1 } }, flows: { out: { node: 3 } } },
    { declaration: 3, configuration: { event: { value: [0] } }, values: { v: { type: 1, value: [7] } } }
  ];
  return g;
}

function codes(r: { diagnostics: Array<{ severity: string; code: string }> }): string[] {
  return r.diagnostics.filter((d) => d.severity === "error").map((d) => d.code);
}

describe("validateGraphObject: a valid graph", () => {
  it("passes with no diagnostics", () => {
    const r = validateGraphObject(validGraph());
    expect(r.diagnostics).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.rejectsExtension).toBe(false);
  });
  it("accepts an empty graph object (all arrays may be omitted)", () => {
    expect(validateGraphObject({}).ok).toBe(true);
  });
  it("treats `undefined` properties as absent", () => {
    const g = validGraph();
    g.variables[0].name = undefined;
    g.events = [{ id: undefined, values: undefined }, ...g.events];
    expect(validateGraphObject(g).ok).toBe(true);
  });
});

describe("Graph Object Validation: types / variables / events / declarations / nodes arrays", () => {
  it("empty arrays are asserts (reject the extension)", () => {
    for (const key of ["types", "variables", "events", "declarations", "nodes"]) {
      const g = validGraph();
      g[key] = [];
      const r = validateGraphObject(g);
      expect(r.ok, key).toBe(false);
      expect(r.rejectsExtension, key).toBe(true);
    }
  });
  it("unknown / duplicate type signatures reject the graph only", () => {
    const g = validGraph();
    g.types.push({ signature: "float5" });
    let r = validateGraphObject(g);
    expect(codes(r)).toContain("GV104");
    expect(r.rejectsExtension).toBe(false);
    const d = validGraph();
    d.types.push({ signature: "float" });
    r = validateGraphObject(d);
    expect(codes(r)).toContain("GV105");
    expect(r.rejectsExtension).toBe(false);
  });
  it("two `custom` types are allowed", () => {
    const g = validGraph();
    g.types.push({ signature: "custom" }, { signature: "custom" });
    expect(validateGraphObject(g).ok).toBe(true);
  });
  it("variables without types is an assert", () => {
    const g = validGraph();
    delete g.types;
    expect(codes(validateGraphObject(g))).toContain("GV106");
  });
  it("nodes without declarations is an assert", () => {
    const g = validGraph();
    delete g.declarations;
    const r = validateGraphObject(g);
    expect(codes(r)).toContain("GV135");
    expect(r.rejectsExtension).toBe(true);
  });
  it("non-string graph name is an assert", () => {
    const g = validGraph();
    g.name = 3;
    expect(validateGraphObject(g).rejectsExtension).toBe(true);
  });
});

describe("Variable / Event / Inline Value validation", () => {
  it("variable type out of range rejects the graph; non-index type asserts", () => {
    const g = validGraph();
    g.variables[0].type = 9;
    let r = validateGraphObject(g);
    expect(codes(r)).toContain("GV010");
    expect(r.rejectsExtension).toBe(false);
    g.variables[0].type = 0.5;
    r = validateGraphObject(g);
    expect(r.rejectsExtension).toBe(true);
  });
  it.each([
    ["float3", [1, 2], "length"],
    ["bool", [1], "boolean"],
    ["int", [1.5], "int"],
    ["int", [2147483648], "int32"],
    ["float", ["1.0"], "number"],
    ["float", [null], "number"]
  ])("inline %s value %j is invalid (%s)", (sig, value) => {
    const g: any = { types: [{ signature: sig }], variables: [{ type: 0, value }] };
    const r = validateGraphObject(g);
    expect(r.ok).toBe(false);
    expect(r.rejectsExtension).toBe(false);
  });
  it("accepts the spec's non-finite spellings and valid ref pointers", () => {
    const g: any = { types: [{ signature: "float2" }, { signature: "ref" }], variables: [{ type: 0, value: ["NaN", "-Infinity"] }, { type: 1, value: ["/nodes/0"] }] };
    expect(validateGraphObject(g).diagnostics).toEqual([]);
  });
  it.each([["nodes/0"], ["/nodes/~2"], [0]])("ref value %j is invalid", (value) => {
    const g: any = { types: [{ signature: "ref" }], variables: [{ type: 0, value: [value] }] };
    expect(validateGraphObject(g).ok).toBe(false);
  });
  it("duplicate event ids reject the graph; the reserved `event` socket id asserts", () => {
    const g = validGraph();
    g.events.push({ id: "custom/a" });
    let r = validateGraphObject(g);
    expect(codes(r)).toContain("GV116");
    expect(r.rejectsExtension).toBe(false);
    const h = validGraph();
    h.events[0].values.event = { type: 0 };
    r = validateGraphObject(h);
    expect(codes(r)).toContain("GV118");
    expect(r.rejectsExtension).toBe(true);
  });
});

describe("Declaration validation", () => {
  it("unknown op without `extension` rejects the graph; case matters", () => {
    for (const op of ["math/addd", "Math/Add"]) {
      const g = validGraph();
      g.declarations.push({ op });
      const r = validateGraphObject(g);
      expect(codes(r)).toContain("GV126");
      expect(r.rejectsExtension).toBe(false);
    }
  });
  it("a spec op must not declare sockets", () => {
    const g = validGraph();
    g.declarations.push({ op: "math/sub", inputValueSockets: { a: { type: 0 } } });
    expect(codes(validateGraphObject(g))).toContain("GV128");
  });
  it("equal declarations are rejected (socket order is irrelevant, outputs are not part of equality)", () => {
    const g = validGraph();
    g.declarations.push(
      { op: "x/op", extension: "VND_x", inputValueSockets: { a: { type: 0 }, b: { type: 0 } }, outputValueSockets: { value: { type: 0 } } },
      { op: "x/op", extension: "VND_x", inputValueSockets: { b: { type: 0 }, a: { type: 0 } }, outputValueSockets: { value: { type: 1 } } }
    );
    expect(codes(validateGraphObject(g))).toContain("GV002");
  });
  it("overloaded extension declarations with different input types are NOT equal", () => {
    const g = validGraph();
    g.declarations.push(
      { op: "x/op", extension: "VND_x", inputValueSockets: { a: { type: 0 } } },
      { op: "x/op", extension: "VND_x", inputValueSockets: { a: { type: 1 } } }
    );
    expect(validateGraphObject(g).ok).toBe(true);
  });
  it("a socket type out of range rejects the graph; a missing type asserts", () => {
    const g = validGraph();
    g.declarations.push({ op: "x/op", extension: "VND_x", inputValueSockets: { a: { type: 99 } } });
    expect(codes(validateGraphObject(g))).toContain("GV134");
    g.declarations[g.declarations.length - 1].inputValueSockets.a = {};
    expect(validateGraphObject(g).rejectsExtension).toBe(true);
  });
  it("accepts an unsupported extension op and checks nodes against its declaration", () => {
    const g = validGraph();
    g.declarations.push({ op: "x/op", extension: "VND_x", inputValueSockets: { a: { type: 1 } }, outputValueSockets: { value: { type: 1 } } });
    g.nodes.push({ declaration: 4, values: { a: { type: 1, value: [1] } } });
    expect(validateGraphObject(g).ok).toBe(true);
    g.nodes[4].values.a = { type: 0, value: [1] };
    expect(codes(validateGraphObject(g))).toContain("GV165");
    delete g.nodes[4].values;
    expect(codes(validateGraphObject(g))).toContain("GV164");
  });
});

describe("Node validation: values, flows, configuration", () => {
  it("declaration index out of range rejects the graph; missing asserts", () => {
    const g = validGraph();
    g.nodes[0].declaration = 99;
    expect(codes(validateGraphObject(g))).toContain("GV020");
    delete g.nodes[0].declaration;
    expect(validateGraphObject(g).rejectsExtension).toBe(true);
  });
  it("value edges must point strictly backward and name an existing output socket", () => {
    const g = validGraph();
    g.nodes[2].values.x = { node: 3 };
    expect(codes(validateGraphObject(g))).toContain("GV022");
    const h = validGraph();
    h.nodes[2].values.x = { node: 1, socket: "result" };
    expect(codes(validateGraphObject(h))).toContain("GV148");
  });
  it("`node` and `value` together assert; an explicit type must match the output", () => {
    const g = validGraph();
    g.nodes[2].values.x = { node: 1, value: [1], type: 1 };
    expect(validateGraphObject(g).rejectsExtension).toBe(true);
    const h = validGraph();
    h.nodes[2].values.x = { node: 1, type: 0 };
    expect(codes(validateGraphObject(h))).toContain("GV149");
  });
  it("flows must point strictly forward and stay in range", () => {
    const g = validGraph();
    g.nodes[2].flows.out = { node: 0 };
    expect(codes(validateGraphObject(g))).toContain("GV156");
    const h = validGraph();
    h.nodes[2].flows.out = { node: 4 };
    expect(codes(validateGraphObject(h))).toContain("GV025");
  });
  it("empty values/flows/configuration objects assert", () => {
    for (const key of ["values", "flows", "configuration"]) {
      const g = validGraph();
      g.nodes[1][key] = {};
      expect(validateGraphObject(g).rejectsExtension, key).toBe(true);
    }
  });
  it("configuration entries need a non-empty `value` array", () => {
    const g = validGraph();
    g.nodes[3].configuration.event = { value: [] };
    expect(validateGraphObject(g).rejectsExtension).toBe(true);
  });
  it("missing input sockets and mismatched overload types reject the graph", () => {
    const g = validGraph();
    delete g.nodes[1].values.b;
    expect(codes(validateGraphObject(g))).toContain("GV164");
    const h = validGraph();
    h.nodes[1].values.b = { type: 0, value: [2] };
    expect(codes(validateGraphObject(h))).toContain("GV165");
  });
  it("extra input sockets are ignored but still validated", () => {
    const g = validGraph();
    g.nodes[1].values.extra = { type: 0, value: [1] };
    expect(validateGraphObject(g).ok).toBe(true);
    g.nodes[1].values.extra = { type: 99, value: [1] };
    expect(validateGraphObject(g).ok).toBe(false);
  });
  it("required configuration: variable / event indices", () => {
    const g = validGraph();
    g.nodes[3].configuration.event.value = [5];
    expect(codes(validateGraphObject(g))).toContain("GV163");
    delete g.nodes[3].configuration;
    expect(codes(validateGraphObject(g))).toContain("GV027");
  });
  it("event/send needs the event's value sockets with matching types", () => {
    const g = validGraph();
    delete g.nodes[3].values;
    expect(codes(validateGraphObject(g))).toContain("GV164");
    g.nodes[3].values = { v: { type: 0, value: [1] } };
    expect(codes(validateGraphObject(g))).toContain("GV165");
  });
  it("math/mix takes three operands of the same float type", () => {
    const g: any = {
      types: [{ signature: "float3" }, { signature: "float" }],
      declarations: [{ op: "math/mix" }],
      nodes: [{ declaration: 0, values: { a: { type: 0 }, b: { type: 0 }, c: { type: 0 } } }]
    };
    expect(validateGraphObject(g).ok).toBe(true);
    g.nodes[0].values.c = { type: 1 };
    expect(validateGraphObject(g).ok).toBe(false);
  });
  it("an invalid default-configuration value falls back instead of rejecting", () => {
    const g: any = {
      types: [{ signature: "float" }],
      declarations: [{ op: "flow/for" }, { op: "event/onStart" }],
      nodes: [{ declaration: 1, flows: { out: { node: 1 } } }, { declaration: 0, configuration: { initialIndex: { value: ["x"] } }, values: { startIndex: { type: 0, value: [0] }, endIndex: { type: 0, value: [2] } } }]
    };
    // startIndex/endIndex are int sockets: float literals are a TYPE error even though the config falls back.
    const r = validateGraphObject(g);
    expect(codes(r)).not.toContain("GV027");
    expect(codes(r)).toContain("GV165");
  });
  it("warns (does not reject) about values on a handler root", () => {
    const g = validGraph();
    g.nodes[0].values = { x: { type: 0, value: [1] } };
    const r = validateGraphObject(g);
    expect(r.ok).toBe(true);
    expect(r.diagnostics.some((d) => d.severity === "warning" && d.code === "GV030")).toBe(true);
  });
});

describe("variable/* and pointer/* operations", () => {
  function varGraph(op: string, configuration: any, values: any): any {
    return {
      types: [{ signature: "float" }, { signature: "int" }, { signature: "float4" }, { signature: "float2" }, { signature: "bool" }],
      variables: [{ type: 0 }, { type: 1 }, { type: 2 }],
      declarations: [{ op: "event/onStart" }, { op }],
      nodes: [{ declaration: 0, flows: { out: { node: 1 } } }, { declaration: 1, configuration, values }]
    };
  }
  it("variable/set: indices in range, one typed input per variable", () => {
    const ok = varGraph("variable/set", { variables: { value: [0] } }, { "0": { type: 0, value: [1] } });
    expect(validateGraphObject(ok).ok).toBe(true);
    expect(codes(validateGraphObject(varGraph("variable/set", { variables: { value: [9] } }, {})))).toContain("GV158");
    expect(codes(validateGraphObject(varGraph("variable/set", { variables: { value: [0] } }, { "0": { type: 1, value: [1] } })))).toContain("GV165");
  });
  it("variable/interpolate: numeric float types only, useSlerp only for float4", () => {
    const vals = { value: { type: 0, value: [1] }, duration: { type: 0, value: [1] }, p1: { type: 3 }, p2: { type: 3 } };
    const good = varGraph("variable/interpolate", { variable: { value: [0] }, useSlerp: { value: [false] } }, vals);
    expect(validateGraphObject(good).ok).toBe(true);
    const onInt = varGraph("variable/interpolate", { variable: { value: [1] }, useSlerp: { value: [false] } }, vals);
    expect(codes(validateGraphObject(onInt))).toContain("GV159");
    const slerp = varGraph("variable/interpolate", { variable: { value: [0] }, useSlerp: { value: [true] } }, vals);
    expect(codes(validateGraphObject(slerp))).toContain("GV160");
  });
  it("pointer ops: template syntax, parameter sockets and types", () => {
    const get = (pointer: string, values: any, type = 0) =>
      varGraph("pointer/get", { pointer: { value: [pointer] }, type: { value: [type] } }, values);
    expect(validateGraphObject(get("/nodes/[i]/translation", { i: { type: 1, value: [0] } }, 2)).ok).toBe(true);
    expect(codes(validateGraphObject(get("/nodes/[i]/x", {})))).toContain("GV164");
    expect(codes(validateGraphObject(get("/nodes/[i]/x", { i: { type: 0, value: [0] } })))).toContain("GV165");
    expect(codes(validateGraphObject(get("/nodes/[]/x", {})))).toContain("GV161");
    expect(codes(validateGraphObject(get("/x", {}, 99)))).toContain("GV157");
  });
  it("pointer ops: GV165 explains int/ref template parameter mix-ups (inline vs connected)", () => {
    const msgs = (g: any) => validateGraphObject(g).diagnostics.filter((d) => d.code === "GV165").map((d) => d.message);
    const mk = (op: string, pointer: string, extra: any, values: any) =>
      varGraph(op, { pointer: { value: [pointer] }, type: { value: [0] }, ...extra }, values);
    expect(msgs(mk("pointer/set", "/nodes/{nodeIndex}/x", {}, { nodeIndex: { type: 1, value: [0] }, value: { type: 0, value: [1] } }))).toEqual([
      `node 1 ("pointer/set"): input "nodeIndex" is ref ({nodeIndex} in the pointer template) but its inline value is int; int template parameters are written [nodeIndex]`
    ]);
    // connected ref (pointer/get of type ref, node 1) into an int [n] slot (node 2)
    const g = varGraph("pointer/get", { pointer: { value: ["/nodes/0/x"] }, type: { value: [5] } }, {});
    g.types.push({ signature: "ref" });
    g.nodes.push({ declaration: 1, configuration: { pointer: { value: ["/nodes/[n]/x"] }, type: { value: [0] } }, values: { n: { node: 1 } } });
    expect(msgs(g)).toEqual([
      `node 2 ("pointer/get"): input "n" is int ([n] in the pointer template) but its connected value is ref; ref template parameters are written {n}`
    ]);
    expect(msgs(mk("pointer/get", "/nodes/[n]/x", {}, { n: { type: 0, value: [1] } }))).toEqual([
      `node 1 ("pointer/get"): input "n" has type "float", expected "int" ([n] in the pointer template)`
    ]);
  });
});

describe("parsePointerTemplateStrict / parseLogMessage", () => {
  it("parses parameters and rejects malformed templates", () => {
    expect(parsePointerTemplateStrict("/nodes/[i]/extras/{{lit}}")).toEqual({ valid: true, params: [{ id: "i", kind: "int" }] });
    expect(parsePointerTemplateStrict("/a/{r}/[my~1index]")).toEqual({
      valid: true,
      params: [
        { id: "r", kind: "ref" },
        { id: "my/index", kind: "int" }
      ]
    });
    for (const bad of ["a/b", "/a/~2", "/a/[i]/[i]", "/a/[i]/{i}", "/a/[", "/a/{", "/a/[]", "/a/[i", "/a/[i[x]", "/a/[[x]", "/a/{{x}"]) {
      expect(parsePointerTemplateStrict(bad).valid, bad).toBe(false);
    }
  });
  it("extracts log parameters and rejects unbalanced braces", () => {
    expect(parseLogMessage("a {x} {{lit}} {y}")).toEqual(["x", "y"]);
    expect(parseLogMessage("")).toEqual([]);
    expect(parseLogMessage("{")).toBeNull();
    expect(parseLogMessage("}")).toBeNull();
    expect(parseLogMessage("{}")).toBeNull();
  });
});

describe("validateExtension", () => {
  const ext = (extra: object = {}) => ({ graphs: [validGraph(), validGraph()], ...extra });
  it("accepts a valid extension; default graph is 0", () => {
    const r = validateExtension(ext());
    expect(r.ok).toBe(true);
    expect(r.selectedGraph).toBe(0);
    expect(r.usableGraphs).toEqual([0, 1]);
  });
  it.each([
    ["graphs missing", {}],
    ["graphs empty", { graphs: [] }],
    ["graphs not an array", { graphs: {} }]
  ])("%s asserts", (_n, e) => {
    const r = validateExtension(e);
    expect(r.ok).toBe(false);
    expect(r.diagnostics[0].outcome).toBe("rejectExtension");
    expect(r.diagnostics[0].section).toBe("Validation › Extension Object Validation");
  });
  it.each([[-1], [0.5], ["0"], [2], [null]])("default graph index %j rejects the extension", (graph) => {
    const r = validateExtension(ext({ graph }));
    expect(r.ok).toBe(false);
    expect(r.usableGraphs).toEqual([]);
  });
  it("an invalid default graph rejects the extension even when another graph is valid", () => {
    const e: any = ext({ graph: 1 });
    e.graphs[1].declarations.push({ op: "math/nope" });
    const r = validateExtension(e);
    expect(r.ok).toBe(false);
    expect(r.graphs[0].ok).toBe(true);
    expect(r.graphs[1].ok).toBe(false);
    expect(r.usableGraphs).toEqual([]);
  });
  it("an invalid NON-default graph does not reject the extension, but an assert does", () => {
    const e: any = ext();
    e.graphs[1].declarations.push({ op: "math/nope" });
    let r = validateExtension(e);
    expect(r.ok).toBe(true);
    expect(r.usableGraphs).toEqual([0]);
    e.graphs[1].types = [];
    r = validateExtension(e);
    expect(r.ok).toBe(false);
  });
  it("tags graph diagnostics with their graphIndex", () => {
    const e: any = ext();
    e.graphs[1].declarations.push({ op: "math/nope" });
    expect(validateExtension(e).diagnostics.find((d) => d.code === "GV126")?.graphIndex).toBe(1);
  });
  it("rejects a non-object extension", () => {
    expect(validateExtension(undefined).ok).toBe(false);
    expect(validateExtension([]).ok).toBe(false);
  });
});

describe("InteractivityValidationError and assert helpers", () => {
  it("carries diagnostics with spec sections and a scope", () => {
    const g = validGraph();
    g.declarations.push({ op: "math/nope" });
    let err: unknown;
    try {
      assertValidGraph(g);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(InteractivityValidationError);
    expect(err).toBeInstanceOf(Error);
    const e = err as InteractivityValidationError;
    expect(e.name).toBe("InteractivityValidationError");
    expect(e.scope).toBe("graph");
    expect(e.diagnostics.length).toBeGreaterThan(0);
    expect(e.diagnostics.every((d) => typeof d.section === "string" && d.section.length > 0)).toBe(true);
    expect(e.message).toContain("GV126");
    expect(isInteractivityValidationError(e)).toBe(true);
    expect(isInteractivityValidationError(new Error("x"))).toBe(false);
  });
  it("assertValidGraph reports extension scope for assert failures", () => {
    expect(() => assertValidGraph({ nodes: [] })).toThrow(InteractivityValidationError);
    try {
      assertValidGraph({ types: [] });
    } catch (e) {
      expect((e as InteractivityValidationError).scope).toBe("extension");
    }
  });
  it("assertValidExtension returns the validation (selected graph) when valid", () => {
    expect(assertValidExtension({ graphs: [validGraph()] }).selectedGraph).toBe(0);
    expect(() => assertValidExtension({ graphs: [] })).toThrow(InteractivityValidationError);
  });
  it("graphs marked validated (runtime-normalized copies) are accepted as-is", () => {
    const normalized = { types: [], variables: [], events: [], declarations: [], nodes: [] };
    expect(() => assertValidGraph(normalized)).toThrow(InteractivityValidationError);
    markGraphValidated(normalized);
    expect(isGraphValidated(normalized)).toBe(true);
    expect(() => assertValidGraph(normalized)).not.toThrow();
    expect(Object.keys(normalized)).toEqual(["types", "variables", "events", "declarations", "nodes"]);
    expect(JSON.stringify(normalized)).not.toContain("validated");
  });
  it("does not mutate its input", () => {
    const g = validGraph();
    const copy = JSON.stringify(g);
    validateGraphObject(g);
    expect(JSON.stringify(g)).toBe(copy);
  });
});
