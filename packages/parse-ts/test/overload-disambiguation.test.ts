// Regression coverage for bug #18: disambiguateOverload (src/index.ts)
// skipped literal-ish args entirely, so an all-literal call to a fn name
// with multiple FIXED-type candidate rows fell through to candidates[0]
// unconditionally. math/transform is the sharpest case — it registers FOUR
// rows under one `m.transform` name ((float4x4,float3), (float3,float4x4),
// (float4x4,float4), (float4,float4x4) — see @gltfi/kernel's registry.ts
// ~line 283), and every corpus call site passes two array LITERALS, so the
// old code always mistyped the call as (float4x4,float3) regardless of the
// literals' actual lengths. See docs/design/ir-and-transpiler.md and the R#
// plan's #18 entry; the double-round-trip symptom this caused (a second
// `gltfi decompile` reporting GIC021) is covered end-to-end by
// packages/cli/test/apply.test.ts's math/transform case.
import { describe, expect, it } from "vitest";
import { parseModule } from "../src/index.js";

function wrap(varDecl: string, stmt: string): string {
  return `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ result: ${varDecl} });
  const E = rt.events({});
  rt.onStart(() => {
    ${stmt}
  });
});
`;
}

describe("disambiguateOverload - literal-shape filtering (#18)", () => {
  it("m.transform(float4-literal, float4x4-literal) resolves to the (float4,float4x4)->float4 row", () => {
    const code = wrap("rt.float4(0,0,0,0)", "V.result = m.transform([1,2,3,4],[1,0,0,0,0,1,0,0,0,0,1,0,1,0,0,1]);");
    const { module, diagnostics } = parseModule(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = module.handlers[0]?.body;
    expect(stmt?.k).toBe("seq");
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    expect(setVar?.k).toBe("setVar");
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    expect(expr?.k).toBe("op");
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float4", b: "float4x4" });
    expect(expr.overload.outputs).toEqual({ value: "float4" });
    expect(expr.args[0]).toMatchObject({ k: "const", type: "float4", data: [1, 2, 3, 4] });
    expect(expr.args[1]).toMatchObject({ k: "const", type: "float4x4", data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1] });
  });

  it("m.transform(float4x4-literal, float3-literal) resolves to the (float4x4,float3)->float3 row (order-agnostic)", () => {
    const code = wrap("rt.float3(0,0,0)", "V.result = m.transform([1,0,0,0,0,1,0,0,0,0,1,0,1,0,0,1],[1,2,3]);");
    const { module, diagnostics } = parseModule(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = module.handlers[0]?.body;
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float4x4", b: "float3" });
    expect(expr.overload.outputs).toEqual({ value: "float3" });
  });

  it("m.transform(float3-literal, float4x4-literal) resolves to the (float3,float4x4)->float3 row", () => {
    const code = wrap("rt.float3(0,0,0)", "V.result = m.transform([1,2,3],[1,0,0,0,0,1,0,0,0,0,1,0,1,0,0,1]);");
    const { module, diagnostics } = parseModule(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = module.handlers[0]?.body;
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float3", b: "float4x4" });
    expect(expr.overload.outputs).toEqual({ value: "float3" });
  });

  // lt/le/gt/ge's float-vs-int collision is NOT resolved by literal shape
  // (both rows are scalar, component count 1 either way) — this pins down
  // that the fix is a pure narrowing addition, not a behavior change, for
  // that pre-existing two-row case.
  it("m.lt(1, 2.5) (all-literal) still resolves to the float row, unchanged by this fix", () => {
    const code = wrap("rt.bool(false)", "V.result = m.lt(1, 2.5);");
    const { module, diagnostics } = parseModule(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = module.handlers[0]?.body;
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float", b: "float" });
  });
});
