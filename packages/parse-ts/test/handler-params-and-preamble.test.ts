// #6: onSelect/onHoverIn/onHoverOut callbacks may take the params OBJECT as a
// plain identifier (`(params) => params.selectionPoint`, matching the published
// .d.ts) and lower identically to the destructured forms. #7: the
// `rt.vars(...)` / `rt.events(...)` preamble statements are optional.
import { describe, expect, it } from "vitest";
import { parseModule } from "../src/index.js";

function engine(body: string, preamble = `const V = rt.vars({ p: rt.float(0) });\n  const E = rt.events({});`): string {
  return `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  ${preamble}
  ${body}
});
`;
}

function errors(code: string) {
  return parseModule(code).diagnostics.filter((d) => d.severity === "error");
}

const SELECT_VIA_PARAMS = engine(`rt.onSelect(0, false, (params) => {
    rt.ptrSet("/nodes/0/translation", "float3", params.selectionPoint);
  });`);

describe("handler params object (#6)", () => {
  it("params.<field> lowers identically to the destructured forms", () => {
    const viaObj = parseModule(engine(`rt.onSelect(0, false, (params) => { rt.ptrSet("/nodes/[n]/scale", { n: params.selectedNodeIndex }, "float3", params.selectionPoint); });`));
    const viaParamDestructure = parseModule(engine(`rt.onSelect(0, false, ({ selectedNodeIndex, selectionPoint }) => { rt.ptrSet("/nodes/[n]/scale", { n: selectedNodeIndex }, "float3", selectionPoint); });`));
    const viaBodyDestructure = parseModule(
      engine(`rt.onSelect(0, false, (params) => { const { selectedNodeIndex, selectionPoint } = params; rt.ptrSet("/nodes/[n]/scale", { n: selectedNodeIndex }, "float3", selectionPoint); });`)
    );
    for (const r of [viaObj, viaParamDestructure, viaBodyDestructure]) {
      expect(r.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    }
    expect(viaObj.module.handlers).toEqual(viaParamDestructure.module.handlers);
    expect(viaObj.module.handlers).toEqual(viaBodyDestructure.module.handlers);
  });

  it("hover handlers accept params.hoveredNode / params.controllerIndex", () => {
    const code = engine(`rt.onHoverIn(0, (params) => { V.p = 1; rt.ptrSet("/nodes/[n]/scale", { n: params.controllerIndex }, "float3", [1, 1, 1]); });
  rt.onHoverOut(0, (hover) => { rt.ptrSet("/nodes/[n]/scale", { n: hover.controllerIndex }, "float3", [1, 1, 1]); });`);
    expect(errors(code)).toEqual([]);
    expect(parseModule(code).module.handlers.map((h) => h.kind)).toEqual(["onHoverIn", "onHoverOut"]);
  });

  it("an unknown field is rejected (by the TS type check before it reaches the lowering)", () => {
    const errs = errors(engine(`rt.onSelect(0, false, (params) => { V.p = params.nope; });`));
    expect(errs.length).toBeGreaterThan(0);
  });

  it("using the params object as a whole (pass / spread / store) is GI132", () => {
    for (const use of [`const q = params;`, `const q = { ...params };`]) {
      const errs = errors(engine(`rt.onSelect(0, false, (params) => { ${use} });`));
      expect(errs.map((d) => d.code), use).toContain("GI132");
    }
  });

  it("params.<field> works as a plain value argument", () => {
    expect(errors(SELECT_VIA_PARAMS)).toEqual([]);
  });
});

describe("optional vars/events preamble (#7)", () => {
  it("accepts an engine with neither rt.vars nor rt.events", () => {
    const r = parseModule(engine(`rt.onStart(() => { rt.log("hi", []); });`, ``));
    expect(r.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(r.module.variables).toEqual([]);
    expect(r.module.events).toEqual([]);
    expect(r.module.handlers).toHaveLength(1);
  });

  it("accepts rt.vars alone and rt.events alone", () => {
    const onlyVars = parseModule(engine(`rt.onStart(() => { V.p = 1; });`, `const V = rt.vars({ p: rt.float(0) });`));
    expect(onlyVars.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(onlyVars.module.variables).toHaveLength(1);
    expect(onlyVars.module.events).toEqual([]);

    const onlyEvents = parseModule(engine(`rt.onStart(() => { rt.send(0); });`, `const E = rt.events({ ping: {} });`));
    expect(onlyEvents.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(onlyEvents.module.variables).toEqual([]);
    expect(onlyEvents.module.events).toHaveLength(1);
  });

  it("the explicit-empty form still parses to the same module as the omitted form", () => {
    const body = `rt.onStart(() => { rt.log("hi", []); });`;
    const omitted = parseModule(engine(body, ``));
    const explicit = parseModule(engine(body, `const V = rt.vars({});\n  const E = rt.events({});`));
    expect(omitted.module.handlers).toEqual(explicit.module.handlers);
    expect(omitted.module.variables).toEqual(explicit.module.variables);
  });
});
