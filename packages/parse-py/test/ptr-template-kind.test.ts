import { afterAll, describe, expect, it } from "vitest";
import { closeParser, parseModulePy } from "../src/index.js";

// `[name]` pointer-template params take an int; `{name}` params take a ref.
// Feeding an int expression to a `{name}` param used to lower silently and
// the write was dropped at runtime with no diagnostic; it is now an error
// (GP131) with a "use [n] for integer indices" hint.
const SOURCE = `import gltfi_runtime.m as m

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"i": rt.int_(1)})
    E = rt.events({})
    def __on_start_0() -> None:
        rt.ptr_set("/nodes/[n]/scale", {"n": V.i}, "float3", [2.0, 2.0, 2.0])
    rt.on_start(__on_start_0)
`;

afterAll(() => {
  closeParser();
});

describe("pointer template param kinds (py)", () => {
  it("`[n]` with an int expression parses cleanly", async () => {
    const { diagnostics } = await parseModulePy(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("`{n}` with an int expression is an error with an index hint", async () => {
    const { diagnostics } = await parseModulePy(SOURCE.replace("[n]", "{n}"));
    const errs = diagnostics.filter((d) => d.severity === "error");
    expect(errs.map((d) => d.code)).toEqual(["GP131"]);
    expect(errs[0].message).toContain("use \"[n]\" for integer indices");
  });
});
