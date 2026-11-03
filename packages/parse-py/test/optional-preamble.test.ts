import { afterAll, describe, expect, it } from "vitest";
import { closeParser, parseModulePy } from "../src/index.js";

// The vars/events preamble is optional: a module declaring neither parses to
// an empty-variables/empty-events module (previously GX101/GX102 errors).
const SOURCE = `def build(rt) -> None:
    def __on_start_0() -> None:
        rt.log("hi", [])
    rt.on_start(__on_start_0)
`;

afterAll(() => {
  closeParser();
});

describe("optional vars/events preamble (py)", () => {
  it("accepts a module with neither vars nor events", async () => {
    const { module, diagnostics } = await parseModulePy(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(module.variables).toEqual([]);
    expect(module.events).toEqual([]);
    expect(module.handlers).toHaveLength(1);
  });
});
