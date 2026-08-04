// GL150 regression (mirrors packages/parse-ts/test/handlers.test.ts's
// identical TS-side test): lowerPtrGet used to hard-code `{kind: "proc"}`
// as its lowering context instead of threading the real one through from
// its call site (unlike buildSetPointerStmt/lowerPointerArgs, which already
// threaded ctx correctly for rt.ptrSet) — so a handler param (e.g.
// onReceive's intParameter, here used as the pointer template's dynamic
// `n` arg) failed to resolve with an "unrecognized identifier" error even
// though it's a perfectly legal int value in that scope.
import { describe, expect, it } from "vitest";
import { exportGraph } from "@gltfi/ir";
import { parseModuleLua } from "../src/index.js";

describe("parseModuleLua - accepts a handler param as a ptrGet pointer-template arg (lowerPtrGet ctx threading)", () => {
  it("resolves onReceive's intParameter used inside rt.ptrGet's args table", () => {
    const code = `
return function(rt)
  local V = rt.vars({ { name = "pos", decl = rt.float3(0.0, 0.0, 0.0) } })
  local E = rt.events({})
  rt.onReceive(0, function(payload)
    local t = rt.ptrGet("/nodes/[n]/translation", { n = payload[2] }, "float3").value
    rt.setVar(0, t)
  end)
end
`;
    const { module: parsed, diagnostics } = parseModuleLua(code);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    expect(parsed.handlers).toHaveLength(1);
    expect(JSON.stringify(parsed.handlers[0].body)).toContain('"k":"ptrGet"');
    expect(JSON.stringify(parsed.handlers[0].body)).toContain('"k":"param"');

    const { diagnostics: exportDiags } = exportGraph(parsed);
    expect(exportDiags.filter((d) => d.severity === "error")).toEqual([]);
  });
});
