import { afterAll, describe, expect, it } from "vitest";
import { eventExtraValues } from "@gltfi/ir";
import { closeParser, parseModulePy } from "../src/index.js";

// Custom event payload sockets ("extras", payload slots 4+) and -0.0.
const SOURCE = `import gltfi_runtime.m as m

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"x": rt.float_(-0.0), "n": rt.int_(0)})
    E = rt.events({"Ping": {"defaultBool": False, "defaultInt": 0, "defaultFloat": 0.0, "expectedDuration": 0.0, "extras": {"value": rt.int_(7)}}})
    def __on_start_0() -> None:
        rt.send(E["Ping"], [False, 0, 0.0, 0.0, 3])
        rt.send(E["Ping"])
    rt.on_start(__on_start_0)
    def __on_receive_1(payload: list) -> None:
        V.n = payload[4]
    rt.on_receive(E["Ping"], __on_receive_1)
`;

afterAll(() => {
  closeParser();
});

describe("parse-py event extras and -0", () => {
  it("reads extras into the event, receive params, and send payload arity", async () => {
    const { module, diagnostics } = await parseModulePy(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(eventExtraValues(module.events[0]).map((v) => [v.name, v.type, v.default.data])).toEqual([["value", "int", [7]]]);
    const recv = module.handlers.find((h) => h.kind === "receive")!;
    expect(recv.params.map((p) => p.name)).toContain("value");
    const sends = (module.handlers[0].body as any).stmts.filter((s: any) => s.k === "emitEvent");
    expect(sends[0].args).toHaveLength(5);
    expect(sends[1].args[4]).toEqual({ k: "const", type: "int", data: [7] });
  });

  it("keeps the sign of -0.0", async () => {
    const { module } = await parseModulePy(SOURCE);
    expect(Object.is(module.variables[0].initial.data[0], -0)).toBe(true);
  });
});
