import { afterAll, describe, expect, it } from "vitest";
import { eventExtraValues } from "@gltfi/ir";
import { closeParser, parseModuleCs } from "../src/index.js";

// Custom event payload sockets ("extras", payload slots 4+) and -0.0.
const SOURCE = `using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public double x { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }
        public int n { get => E.GetVarInt(1); set => E.SetVarInt(1, value); }
    }

    public static class Events
    {
        public const int Ping = 0;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("float", -0.0);
        rt.DeclareVar("int", 0);
        rt.DeclareEvent(null, (bool?)false, (int?)0, (double?)0.0, (double?)0.0, new EventExtra("value", "int", 7));
        var V = new Vars(rt);
        void OnStart0()
        {
            rt.Send(Events.Ping, new EventPayload(false, 0, 0.0, 0.0, 3));
            rt.Send(Events.Ping);
        }
        rt.OnStart(OnStart0);
        void OnReceive1(EventPayload payload)
        {
            V.n = payload.ExtraInt(0);
        }
        rt.OnReceive(Events.Ping, OnReceive1);
    }
}
`;

afterAll(() => {
  closeParser();
});

describe("parse-cs event extras and -0", () => {
  it("reads extras into the event, receive params, and send payload arity", async () => {
    const { module, diagnostics } = await parseModuleCs(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(eventExtraValues(module.events[0]).map((v) => [v.name, v.type, v.default.data])).toEqual([["value", "int", [7]]]);
    const recv = module.handlers.find((h) => h.kind === "receive")!;
    expect(recv.params.map((p) => p.name)).toContain("value");
    const sends = (module.handlers[0].body as any).stmts.filter((s: any) => s.k === "emitEvent");
    expect(sends[0].args).toHaveLength(5);
    expect(sends[1].args[4]).toEqual({ k: "const", type: "int", data: [7] });
  });

  it("keeps the sign of -0.0", async () => {
    const { module } = await parseModuleCs(SOURCE);
    expect(Object.is(module.variables[0].initial.data[0], -0)).toBe(true);
  });
});
