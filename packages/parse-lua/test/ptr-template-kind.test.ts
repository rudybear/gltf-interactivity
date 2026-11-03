import { describe, expect, it } from "vitest";
import { parseModuleLua } from "../src/index.js";

// `[name]` pointer-template params take an int; `{name}` params take a ref.
// Feeding an int expression to a `{name}` param used to lower silently and
// the write was dropped at runtime with no diagnostic; it is now an error
// (GL131) with a "use [n] for integer indices" hint.
const SOURCE = `return function(rt)
  local V = rt.vars({ { name = "i", decl = rt.int(1.0) } })
  local E = rt.events({  })
  rt.onStart(function()
    rt.ptrSet("/nodes/[n]/scale", { n = V.i }, "float3", { 2.0, 2.0, 2.0 })
  end)
end`;

describe("pointer template param kinds (lua)", () => {
  it("`[n]` with an int expression parses cleanly", () => {
    const { diagnostics } = parseModuleLua(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("`{n}` with an int expression is an error with an index hint", () => {
    const { diagnostics } = parseModuleLua(SOURCE.replace("[n]", "{n}"));
    const errs = diagnostics.filter((d) => d.severity === "error");
    expect(errs.map((d) => d.code)).toEqual(["GL131"]);
    expect(errs[0].message).toContain("use \"[n]\" for integer indices");
  });
});
