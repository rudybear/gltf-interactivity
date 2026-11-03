import { describe, expect, it } from "vitest";
import { parseModuleLua } from "../src/index.js";

// The vars/events preamble is optional: a module declaring neither parses to
// an empty-variables/empty-events module (previously GX101/GX102 errors).
const SOURCE = `return function(rt)
  rt.onStart(function()
    rt.log("hi", {})
  end)
end`;

describe("optional vars/events preamble (lua)", () => {
  it("accepts a module with neither vars nor events", () => {
    const { module, diagnostics } = parseModuleLua(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(module.variables).toEqual([]);
    expect(module.events).toEqual([]);
    expect(module.handlers).toHaveLength(1);
  });
});
