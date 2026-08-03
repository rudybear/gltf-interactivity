import { describe, expect, it } from "vitest";
import { OP_REGISTRY } from "../src/registry.js";
import { getOpSpec, opsByCategory, resolveOverload } from "../src/registry-query.js";

describe("OP_REGISTRY", () => {
  it("has no fewer than 138 entries (113 core-ish catalog names, plus doc-omitted combine/extract ops, plus 3 extension events)", () => {
    expect(OP_REGISTRY.size).toBeGreaterThanOrEqual(138);
  });

  it("every op has at least one overload and a purity", () => {
    for (const spec of OP_REGISTRY.values()) {
      expect(spec.overloads.length, `${spec.op} should have >=1 overload`).toBeGreaterThan(0);
      expect(spec.purity, `${spec.op} should declare a purity`).toBeTruthy();
    }
  });

  it("every overload row's generic sockets are internally consistent (no row mixes a stray family member)", () => {
    // Sanity check on the data itself, independent of resolveOverload: every
    // declared socket type is either a known TypeSig or one of F/V/M/T.
    const known = new Set([
      "bool", "int", "float", "float2", "float3", "float4",
      "float2x2", "float3x3", "float4x4", "ref", "custom", "F", "V", "M", "T"
    ]);
    for (const spec of OP_REGISTRY.values()) {
      for (const row of spec.overloads) {
        for (const socket of [...row.inputs, ...row.outputs]) {
          expect(known.has(socket.type), `${spec.op}: unknown socket type ${socket.type}`).toBe(true);
        }
      }
    }
  });

  it("opsByCategory buckets every op into exactly one of the schema's categories", () => {
    const categories = ["math", "type", "ref", "flow", "variable", "pointer", "animation", "event", "debug"] as const;
    let total = 0;
    for (const category of categories) {
      total += opsByCategory(category).length;
    }
    expect(total).toBe(OP_REGISTRY.size);
  });

  it("getOpSpec looks up by op name and returns undefined for unknown ops", () => {
    expect(getOpSpec("math/add")?.category).toBe("math");
    expect(getOpSpec("math/does-not-exist")).toBeUndefined();
  });
});

describe("resolveOverload", () => {
  it("math/add with int,int resolves the int overload", () => {
    const resolved = resolveOverload("math/add", { a: "int", b: "int" });
    expect(resolved).toBeDefined();
    expect(resolved?.inputs).toEqual({ a: "int", b: "int" });
    expect(resolved?.outputs).toEqual({ value: "int" });
  });

  it("math/add with float,float resolves the F-family overload", () => {
    const resolved = resolveOverload("math/add", { a: "float", b: "float" });
    expect(resolved?.inputs).toEqual({ a: "float", b: "float" });
    expect(resolved?.outputs).toEqual({ value: "float" });
  });

  it("math/add with mixed int/float is unresolvable", () => {
    expect(resolveOverload("math/add", { a: "int", b: "float" })).toBeUndefined();
  });

  it("math/eq with float3 inputs resolves to a bool output", () => {
    const resolved = resolveOverload("math/eq", { a: "float3", b: "float3" });
    expect(resolved).toBeDefined();
    expect(resolved?.inputs).toEqual({ a: "float3", b: "float3" });
    expect(resolved?.outputs).toEqual({ value: "bool" });
  });

  it("math/eq with matrix inputs also resolves (F family includes matrices)", () => {
    const resolved = resolveOverload("math/eq", { a: "float4x4", b: "float4x4" });
    expect(resolved?.outputs).toEqual({ value: "bool" });
  });

  it("math/lt (scalar-only comparison) rejects vector inputs", () => {
    expect(resolveOverload("math/lt", { a: "float3", b: "float3" })).toBeUndefined();
    expect(resolveOverload("math/lt", { a: "float", b: "float" })?.outputs).toEqual({ value: "bool" });
  });

  it("all generic sockets in one overload row must resolve to the same concrete type", () => {
    // math/select: condition:bool, a:T, b:T -> value:T. a and b disagreeing is unresolvable.
    expect(resolveOverload("math/select", { condition: "bool", a: "float", b: "float" })?.outputs).toEqual({
      value: "float"
    });
    expect(resolveOverload("math/select", { condition: "bool", a: "float", b: "int" })).toBeUndefined();
  });

  it("math/transform pairs a V with a matching square matrix per the DESIGN DOC's claim -- but the interpreter only ever implements float4x4, not float2x2/float3x3", () => {
    // This encodes a real doc-vs-interpreter discrepancy (see registry.ts
    // comment on math/transform): packages/runtime/src/interpreter.ts's
    // "math/transform" case picks whichever operand has array length 16 as
    // the matrix and treats the other as the vector; it never handles
    // float2+float2x2 or float3+float3x3 pairs, and the single conformance
    // test for this op (external/glTF-Test-Assets-Interactivity/Tests/
    // Interactivity/math/transform) only exercises float4x4+float3/float4.
    expect(resolveOverload("math/transform", { a: "float3", b: "float3x3" })).toBeUndefined();
    expect(resolveOverload("math/transform", { a: "float2", b: "float2x2" })).toBeUndefined();

    const withVectorFirst = resolveOverload("math/transform", { a: "float3", b: "float4x4" });
    expect(withVectorFirst?.outputs).toEqual({ value: "float3" });

    const withMatrixFirst = resolveOverload("math/transform", { a: "float4x4", b: "float4" });
    expect(withMatrixFirst?.outputs).toEqual({ value: "float4" });
  });

  it("math/matMul resolves generically across all three matrix sizes", () => {
    expect(resolveOverload("math/matMul", { a: "float2x2", b: "float2x2" })?.outputs).toEqual({ value: "float2x2" });
    expect(resolveOverload("math/matMul", { a: "float3x3", b: "float3x3" })?.outputs).toEqual({ value: "float3x3" });
    expect(resolveOverload("math/matMul", { a: "float4x4", b: "float4x4" })?.outputs).toEqual({ value: "float4x4" });
  });

  it("returns undefined for an unknown op", () => {
    expect(resolveOverload("math/nope", { a: "int" })).toBeUndefined();
  });
});

describe("flow/for", () => {
  it("has schedule metadata matching the KHR_interactivity spec's once/perIteration split", () => {
    const spec = getOpSpec("flow/for");
    expect(spec?.schedule).toEqual({ startIndex: "once", endIndex: "perIteration" });
    expect(spec?.stateKind).toBe("for");
  });
});

describe("flow/while", () => {
  it("evaluates its condition perCheck", () => {
    expect(getOpSpec("flow/while")?.schedule).toEqual({ condition: "perCheck" });
  });
});

describe("required config (variable/*, pointer/*, event/send, event/receive have no default)", () => {
  it("variable/get's config has no default", () => {
    const config = getOpSpec("variable/get")?.config ?? [];
    expect(config.every((field) => field.required)).toBe(true);
  });

  it("pointer/set's config has no default", () => {
    const config = getOpSpec("pointer/set")?.config ?? [];
    expect(config.length).toBeGreaterThan(0);
    expect(config.every((field) => field.required)).toBe(true);
  });

  it("event/send's config has no default", () => {
    const config = getOpSpec("event/send")?.config ?? [];
    expect(config.every((field) => field.required)).toBe(true);
  });

  it("a non-exempt op (flow/for) DOES have a default config", () => {
    const config = getOpSpec("flow/for")?.config ?? [];
    expect(config.every((field) => !field.required && field.default !== undefined)).toBe(true);
  });
});

describe("doc-omitted combine/extract ops are real, registered ops", () => {
  it("math/combine2 and math/extract2 round-trip float2", () => {
    expect(resolveOverload("math/combine2", { a: "float", b: "float" })?.outputs).toEqual({ value: "float2" });
    const extract = resolveOverload("math/extract2", { a: "float2" });
    expect(extract?.outputs).toEqual({ "0": "float", "1": "float" });
  });

  it("math/combine4x4 takes 16 scalar float inputs", () => {
    const spec = getOpSpec("math/combine4x4");
    expect(spec?.overloads[0]?.inputs).toHaveLength(16);
  });
});

describe("extension events", () => {
  it("event/onSelect and event/onHoverIn/onHoverOut carry their KHR extension name", () => {
    expect(getOpSpec("event/onSelect")?.extension).toBe("KHR_node_selectability");
    expect(getOpSpec("event/onHoverIn")?.extension).toBe("KHR_node_hoverability");
    expect(getOpSpec("event/onHoverOut")?.extension).toBe("KHR_node_hoverability");
  });
});
