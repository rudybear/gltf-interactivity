import { afterAll, describe, expect, it } from "vitest";
import { checkModule } from "@gltfi/ir";
import { closeParser, parseModuleCs } from "../src/index.js";

// Collects, in source order, the operand type of every math/eq wrapped by a
// math/not (i.e. every lowered inequality) in the first handler's body, and
// counts math/xor ops (which must NOT appear for `!=`).
function walk(x: unknown, f: (e: any) => void): void {
  if (Array.isArray(x)) x.forEach((v) => walk(v, f));
  else if (x && typeof x === "object") {
    f(x);
    Object.values(x as object).forEach((v) => walk(v, f));
  }
}
function inequalityKinds(body: unknown): { kinds: string[]; xors: number } {
  const kinds: string[] = [];
  let xors = 0;
  walk(body, (e) => {
    if (e.k === "op" && e.op === "math/xor") xors += 1;
    if (e.k === "op" && e.op === "math/not" && e.args?.[0]?.k === "op" && e.args[0].op === "math/eq") {
      kinds.push(e.args[0].overload.inputs.a);
    }
  });
  return { kinds, xors };
}

const SOURCE = `using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public int mode { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
        public double f { get => E.GetVarFloat(1); set => E.SetVarFloat(1, value); }
        public bool b { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public bool r { get => E.GetVarBool(3); set => E.SetVarBool(3, value); }
    }

    public static class Events
    {
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 1);
        rt.DeclareVar("float", 1.0);
        rt.DeclareVar("bool", true);
        rt.DeclareVar("bool", false);
        var V = new Vars(rt);
        void OnStart0()
        {
            V.r = V.mode != 3;
            V.r = V.f != 2.5;
            V.r = V.b != V.r;
        }
        rt.OnStart(OnStart0);
    }
}
`;

afterAll(() => {
  closeParser();
});

describe("inequality lowering (cs): not(eq), never bool xor", () => {
  it("int / float / bool operands each lower to math/not(math/eq) of the operand type", async () => {
    const { module, diagnostics } = await parseModuleCs(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const { kinds, xors } = inequalityKinds(module.handlers[0].body);
    expect(kinds).toEqual(["int", "float", "bool"]);
    expect(xors).toBe(0);
    expect(checkModule(module).filter((d) => d.severity === "error")).toEqual([]);
  });
});
