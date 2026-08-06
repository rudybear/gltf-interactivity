// Regression coverage for bug #18 (task #21 — port of packages/parse-ts/
// test/overload-disambiguation.test.ts and packages/parse-lua/test/
// overload-disambiguation.test.ts, both mirrored here): disambiguateOverload
// (src/index.ts) skipped literal-ish args entirely, so an all-literal call
// to a fn name with multiple FIXED-type candidate rows fell through to
// candidates[0] unconditionally. math/transform is the sharpest case — it
// registers FOUR rows under one `m.transform` name ((float4x4,float3),
// (float3,float4x4), (float4x4,float4), (float4,float4x4) — see
// @gltfi/kernel's registry.ts ~line 283), and every corpus call site passes
// two array LITERALS, so the old code always mistyped the call as
// (float4x4,float3) regardless of the literals' actual lengths.
//
// As in parse-lua's sibling test, these build a tiny IRModule with the
// m.transform op ALREADY correctly resolved, emit it to Python
// (emitModulePy always spells a vector/matrix const as a plain `[...]` list
// literal — reproducing the exact all-literal-args call shape the bug
// needs), then re-parse that Python and assert parseModulePy's own
// disambiguateOverload recovers the same overload. Same emit -> parse
// round-trip idiom this package's own handlers.test.ts uses.
import { afterAll, describe, expect, it } from "vitest";
import { defaultValue, resolveOverload, type TypeSig } from "@gltfi/kernel";
import type { IRModule, IRType } from "@gltfi/ir";
import { emitModulePy } from "@gltfi/emit-py";
import { closeParser, parseModulePy } from "../src/index.js";

afterAll(() => {
  closeParser();
});

function moduleWithOp(op: string, inputTypes: Record<string, TypeSig>, argsData: Array<{ type: IRType; data: number[] }>, varType: IRType): IRModule {
  const overload = resolveOverload(op, inputTypes)!;
  return {
    variables: [{ name: "result", type: varType, initial: defaultValue(varType) }],
    events: [],
    stateSlots: [],
    procs: [],
    handlers: [
      {
        kind: "onStart",
        params: [{ name: "event", type: "ref" }],
        body: {
          k: "seq",
          stmts: [{ k: "setVar", varId: 0, expr: { k: "op", op, overload, args: argsData.map((a) => ({ k: "const" as const, type: a.type, data: a.data })) } }]
        }
      }
    ],
    meta: { nameMaps: { variables: ["result"], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
  };
}

const IDENTITY_4X4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1];

describe("parseModulePy - disambiguateOverload literal-shape filtering (#18/#21)", () => {
  it("m.transform(float4-literal, float4x4-literal) round-trips through the (float4,float4x4)->float4 row", () => {
    const module = moduleWithOp(
      "math/transform",
      { a: "float4", b: "float4x4" },
      [
        { type: "float4", data: [1, 2, 3, 4] },
        { type: "float4x4", data: IDENTITY_4X4 }
      ],
      "float4"
    );
    const { code } = emitModulePy(module);
    expect(code).toContain("m.transform(");

    const { module: parsed, diagnostics } = parseModulePy(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = parsed.handlers[0]?.body;
    expect(stmt?.k).toBe("seq");
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    expect(setVar?.k).toBe("setVar");
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    expect(expr?.k).toBe("op");
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float4", b: "float4x4" });
    expect(expr.overload.outputs).toEqual({ value: "float4" });
    expect(expr.args[0]).toMatchObject({ k: "const", type: "float4", data: [1, 2, 3, 4] });
    expect(expr.args[1]).toMatchObject({ k: "const", type: "float4x4", data: IDENTITY_4X4 });
  });

  it("m.transform(float4x4-literal, float3-literal) round-trips through the (float4x4,float3)->float3 row (order-agnostic)", () => {
    const module = moduleWithOp(
      "math/transform",
      { a: "float4x4", b: "float3" },
      [
        { type: "float4x4", data: IDENTITY_4X4 },
        { type: "float3", data: [1, 2, 3] }
      ],
      "float3"
    );
    const { code } = emitModulePy(module);

    const { module: parsed, diagnostics } = parseModulePy(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = parsed.handlers[0]?.body;
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float4x4", b: "float3" });
    expect(expr.overload.outputs).toEqual({ value: "float3" });
  });

  it("m.transform(float3-literal, float4x4-literal) round-trips through the (float3,float4x4)->float3 row", () => {
    const module = moduleWithOp(
      "math/transform",
      { a: "float3", b: "float4x4" },
      [
        { type: "float3", data: [1, 2, 3] },
        { type: "float4x4", data: IDENTITY_4X4 }
      ],
      "float3"
    );
    const { code } = emitModulePy(module);

    const { module: parsed, diagnostics } = parseModulePy(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = parsed.handlers[0]?.body;
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
    const module = moduleWithOp(
      "math/lt",
      { a: "float", b: "float" },
      [
        { type: "float", data: [1] },
        { type: "float", data: [2.5] }
      ],
      "bool"
    );
    const { code } = emitModulePy(module);

    const { module: parsed, diagnostics } = parseModulePy(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);

    const stmt = parsed.handlers[0]?.body;
    const setVar = stmt && stmt.k === "seq" ? stmt.stmts[0] : undefined;
    const expr = setVar && setVar.k === "setVar" ? setVar.expr : undefined;
    if (expr?.k !== "op") throw new Error("expected op expr");

    expect(expr.overload.inputs).toEqual({ a: "float", b: "float" });
  });
});
