// Custom event payload sockets ("extras") and float -0 literal round trip
// (mirrors packages/parse-ts's coverage): emit -> parse must reproduce the
// event's extra value declaration, the receive handler's extra param, the
// 5-arg emitEvent and a const -0 exactly.
import { describe, expect, it } from "vitest";
import type { IRModule } from "@gltfi/ir";
import { emitModuleLua } from "@gltfi/emit-lua";
import { parseModuleLua } from "../src/index.js";

const module: IRModule = {
  variables: [
    { name: "got", type: "int", initial: { type: "int", data: [0] } },
    { name: "z", type: "float", initial: { type: "float", data: [1] } }
  ],
  events: [
    {
      name: "Ping",
      values: [
        { name: "boolParameter", type: "bool", default: { type: "bool", data: [false] } },
        { name: "intParameter", type: "int", default: { type: "int", data: [0] } },
        { name: "floatParameter", type: "float", default: { type: "float", data: [0] } },
        { name: "expectedDuration", type: "float", default: { type: "float", data: [0] } },
        { name: "value", type: "int", default: { type: "int", data: [3] } }
      ]
    }
  ],
  stateSlots: [],
  procs: [],
  handlers: [
    {
      kind: "onStart",
      params: [],
      body: {
        k: "seq",
        stmts: [
          { k: "setVar", varId: 1, expr: { k: "const", type: "float", data: [-0] } },
          {
            k: "emitEvent",
            eventId: 0,
            args: [
              { k: "const", type: "bool", data: [false] },
              { k: "const", type: "int", data: [0] },
              { k: "const", type: "float", data: [0] },
              { k: "const", type: "float", data: [0] },
              { k: "const", type: "int", data: [9] }
            ]
          }
        ]
      }
    },
    {
      kind: "receive",
      eventRef: 0,
      params: [
        { name: "boolParameter", type: "bool" },
        { name: "intParameter", type: "int" },
        { name: "floatParameter", type: "float" },
        { name: "expectedDuration", type: "float" },
        { name: "value", type: "int" }
      ],
      body: { k: "seq", stmts: [{ k: "setVar", varId: 0, expr: { k: "param", name: "value", type: "int" } }] }
    }
  ],
  meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} }
} as unknown as IRModule;

describe("event extras + -0 (lua)", () => {
  it("round-trips custom payload sockets and a const -0", () => {
    const { code } = emitModuleLua(module);
    const { module: parsed, diagnostics } = parseModuleLua(code);
    expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);
    expect(parsed.events[0].values.map((v) => v.name)).toEqual(["boolParameter", "intParameter", "floatParameter", "expectedDuration", "value"]);
    expect(parsed.events[0].values[4].default.data).toEqual([3]);
    const recv = parsed.handlers.find((h) => h.kind === "receive")!;
    expect(recv.params.map((p) => p.name)).toContain("value");
    expect(JSON.stringify(recv.body)).toContain('"name":"value"');
    const start = parsed.handlers.find((h) => h.kind === "onStart")!;
    const stmts = (start.body as { stmts: any[] }).stmts;
    const send = stmts.find((s) => s.k === "emitEvent");
    expect(send.args).toHaveLength(5);
    expect(send.args[4].data).toEqual([9]);
    const setZ = stmts.find((s) => s.k === "setVar");
    expect(Object.is(setZ.expr.data[0], -0)).toBe(true);
  });
});
