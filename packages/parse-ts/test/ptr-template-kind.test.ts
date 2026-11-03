import { describe, expect, it } from "vitest";
import { parseModule } from "../src/index.js";

// `[name]` pointer-template params take an int; `{name}` params take a ref.
// Feeding an int expression to a `{name}` param used to lower silently and
// the write was dropped at runtime with no diagnostic; it is now an error
// (GI131) with a "use [n] for integer indices" hint.
const SOURCE = `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ i: rt.int(1) });
  const E = rt.events({});
  rt.onStart(() => {
    rt.ptrSet("/nodes/[n]/scale", { n: V.i }, "float3", [2, 2, 2]);
  });
});
`;

describe("pointer template param kinds (ts)", () => {
  it("`[n]` with an int expression parses cleanly", () => {
    const { diagnostics } = parseModule(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("`{n}` with an int expression is an error with an index hint", () => {
    const { diagnostics } = parseModule(SOURCE.replace("[n]", "{n}"));
    const errs = diagnostics.filter((d) => d.severity === "error");
    expect(errs.map((d) => d.code)).toEqual(["GI131"]);
    expect(errs[0].message).toContain("use \"[n]\" for integer indices");
  });
});
