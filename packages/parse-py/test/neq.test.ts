import { afterAll, describe, expect, it } from "vitest";
import { checkModule } from "@gltfi/ir";
import { closeParser, parseModulePy } from "../src/index.js";

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

const SOURCE = `import gltfi_runtime.m as m

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"mode": rt.int_(1), "f": rt.float_(1.0), "b": rt.bool_(True), "r": rt.bool_(False)})
    E = rt.events({})
    def __on_start_0() -> None:
        V.r = V.mode != 3
        V.r = V.f != 2.5
        V.r = V.b != V.r
    rt.on_start(__on_start_0)
`;

afterAll(() => {
  closeParser();
});

describe("inequality lowering (py): not(eq), never bool xor", () => {
  it("int / float / bool operands each lower to math/not(math/eq) of the operand type", async () => {
    const { module, diagnostics } = await parseModulePy(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const { kinds, xors } = inequalityKinds(module.handlers[0].body);
    expect(kinds).toEqual(["int", "float", "bool"]);
    expect(xors).toBe(0);
    expect(checkModule(module).filter((d) => d.severity === "error")).toEqual([]);
  });
});
