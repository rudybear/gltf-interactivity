import { afterAll, describe, expect, it } from "vitest";
import { closeParser, parseModuleCs } from "../src/index.js";

// The vars/events preamble is optional: a module declaring neither parses to
// an empty-variables/empty-events module (previously GX101/GX102 errors).
const SOURCE = `using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public static void Build(Engine rt)
    {
        void OnStart0()
        {
            rt.Log("hi", new object[] { });
        }
        rt.OnStart(OnStart0);
    }
}
`;

afterAll(() => {
  closeParser();
});

describe("optional vars/events preamble (cs)", () => {
  it("accepts a module with neither vars nor events", async () => {
    const { module, diagnostics } = await parseModuleCs(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(module.variables).toEqual([]);
    expect(module.events).toEqual([]);
    expect(module.handlers).toHaveLength(1);
  });
});
