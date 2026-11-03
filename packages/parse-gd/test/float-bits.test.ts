// `m.f64FromBits(<int64>)` float literals (emit-gd's exact spelling for
// doubles Godot's literal parser can't round-trip): emit -> parse must give
// back the identical double in every literal position.
import { describe, expect, it } from "vitest";
import type { IRModule } from "@gltfi/ir";
import { emitModuleGd } from "@gltfi/emit-gd";
import { parseModuleGd } from "../src/index.js";

const SPECIAL = [
  -0,
  0,
  5e-324,
  -5e-324,
  1e-310,
  2.2250738585072014e-308,
  9007199254740991,
  7679528789200015,
  0.45913173191066836,
  2.60464476415712e-297,
  1.7976931348623157e308,
  -1.1352904205810249e-307,
  0.1,
  -2.5
];

function moduleFor(values: number[]): IRModule {
  return {
    variables: [
      { name: "v", type: "float", initial: { type: "float", data: [values[0] ?? 0] } },
      { name: "w", type: "float4", initial: { type: "float4", data: values.slice(0, 4) } }
    ],
    events: [],
    stateSlots: [],
    procs: [],
    handlers: [
      {
        kind: "onStart",
        params: [],
        body: {
          k: "seq",
          stmts: values.map((x) => ({ k: "setVar" as const, varId: 0, expr: { k: "const" as const, type: "float" as const, data: [x] } }))
        }
      }
    ],
    meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
  } as unknown as IRModule;
}

describe("m.f64FromBits literals", () => {
  it("round-trips special doubles through emit-gd -> parse-gd", () => {
    const mod = moduleFor(SPECIAL);
    const emitted = emitModuleGd(mod);
    expect(emitted.code).toContain("m.f64FromBits(");
    const parsed = parseModuleGd(emitted.code);
    expect(parsed.diagnostics.filter((d) => d.severity === "error"), emitted.code).toEqual([]);
    const h = parsed.module.handlers[0];
    const stmts = (h?.body as { stmts: Array<{ expr: { data: number[] } }> }).stmts;
    expect(stmts.map((s) => s.expr.data[0])).toEqual(SPECIAL);
    for (let i = 0; i < SPECIAL.length; i += 1) {
      expect(Object.is(stmts[i]?.expr.data[0], SPECIAL[i])).toBe(true);
    }
    expect(parsed.module.variables[1]?.initial?.data).toEqual(SPECIAL.slice(0, 4));
  });
});
