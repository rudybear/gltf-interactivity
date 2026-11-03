import { afterAll, describe, expect, it } from "vitest";
import { closeParser, parseModuleCs } from "../src/index.js";

// `[name]` pointer-template params take an int; `{name}` params take a ref.
// Feeding an int expression to a `{name}` param used to lower silently and
// the write was dropped at runtime with no diagnostic; it is now an error
// (GC131) with a "use [n] for integer indices" hint.
const SOURCE = `using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public int i { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
    }

    public static class Events
    {
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 1);
        var V = new Vars(rt);
        void OnStart0()
        {
            rt.PtrSet("/nodes/[n]/scale", "float3", new double[] { 2.0, 2.0, 2.0 }, new Dictionary<string, object> { ["n"] = (double)(V.i) });
        }
        rt.OnStart(OnStart0);
    }
}
`;

afterAll(() => {
  closeParser();
});

describe("pointer template param kinds (cs)", () => {
  it("`[n]` with an int expression parses cleanly", async () => {
    const { diagnostics } = await parseModuleCs(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("`{n}` with an int expression is an error with an index hint", async () => {
    const { diagnostics } = await parseModuleCs(SOURCE.replace("[n]", "{n}"));
    const errs = diagnostics.filter((d) => d.severity === "error");
    expect(errs.map((d) => d.code)).toEqual(["GC131"]);
    expect(errs[0].message).toContain("use \"[n]\" for integer indices");
  });
});
