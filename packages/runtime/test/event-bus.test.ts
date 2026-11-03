// Cross-asset custom-event bus: delivery, public vs "_" private ids, join
// ordering, ref echo, leaving, and that a graph without a bus is unchanged.
import { describe, expect, it } from "vitest";
import { EventBus, type EventBusMember, type Value } from "@gltfi/kernel";
import { InteractivityRuntime } from "../src/host.js";
import { createRuntime, executeFlow, normalizeGraph, type Graph } from "../src/interpreter.js";
import { joinEventBus } from "../src/event-bus.js";

const lit = (type: number, value: Array<number | boolean | string>) => ({ type, value });
const INT = 0;
const REF = 1;

// Sender: onStart -> send(pub, n=7) -> send(_priv, n=9) -> send(req, r="/meshes/3").
// Also receives "resp" and stores its ref in variable 1.
function senderGraph(): Graph {
  return {
    types: [{ signature: "int" }, { signature: "ref" }],
    variables: [
      { id: "a", type: INT, value: [0] },
      { id: "echoed", type: REF, value: [""] }
    ],
    events: [
      { id: "pub", values: { n: { type: INT, value: [0] } } },
      { id: "_priv", values: { n: { type: INT, value: [0] } } },
      { id: "req", values: { r: { type: REF, value: [""] } } },
      { id: "resp", values: { r: { type: REF, value: [""] } } }
    ],
    declarations: [{ op: "event/onStart" }, { op: "event/send" }, { op: "event/receive" }, { op: "variable/set" }],
    nodes: [
      { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
      { declaration: 1, configuration: { event: { value: [0] } }, values: { n: lit(INT, [7]) }, flows: { out: { node: 2, socket: "in" } } },
      { declaration: 1, configuration: { event: { value: [1] } }, values: { n: lit(INT, [9]) }, flows: { out: { node: 3, socket: "in" } } },
      { declaration: 1, configuration: { event: { value: [2] } }, values: { r: lit(REF, ["/meshes/3"]) } },
      { declaration: 2, configuration: { event: { value: [3] } }, flows: { out: { node: 5, socket: "in" } } },
      { declaration: 3, configuration: { variables: { value: [1] } }, values: { "1": { node: 4, socket: "r" } } }
    ]
  } as unknown as Graph;
}

// Receiver: stores pub.n in var 0, _priv.n in var 1, and echoes req.r as resp.r.
function receiverGraph(): Graph {
  return {
    types: [{ signature: "int" }, { signature: "ref" }],
    variables: [
      { id: "pubN", type: INT, value: [0] },
      { id: "privN", type: INT, value: [0] }
    ],
    events: [
      { id: "pub", values: { n: { type: INT, value: [0] } } },
      { id: "_priv", values: { n: { type: INT, value: [0] } } },
      { id: "req", values: { r: { type: REF, value: [""] } } },
      { id: "resp", values: { r: { type: REF, value: [""] } } }
    ],
    declarations: [{ op: "event/receive" }, { op: "variable/set" }, { op: "event/send" }],
    nodes: [
      { declaration: 0, configuration: { event: { value: [0] } }, flows: { out: { node: 3, socket: "in" } } },
      { declaration: 0, configuration: { event: { value: [1] } }, flows: { out: { node: 4, socket: "in" } } },
      { declaration: 0, configuration: { event: { value: [2] } }, flows: { out: { node: 5, socket: "in" } } },
      { declaration: 1, configuration: { variables: { value: [0] } }, values: { "0": { node: 0, socket: "n" } } },
      { declaration: 1, configuration: { variables: { value: [1] } }, values: { "1": { node: 1, socket: "n" } } },
      { declaration: 2, configuration: { event: { value: [3] } }, values: { r: { node: 2, socket: "r" } } }
    ]
  } as unknown as Graph;
}

function mk(graph: Graph) {
  return createRuntime(normalizeGraph(graph), {});
}
const start = (rt: ReturnType<typeof mk>) => executeFlow(rt, 0);
const num = (rt: ReturnType<typeof mk>, i: number) => (rt.variables[i].data as number[])[0];
const str = (rt: ReturnType<typeof mk>, i: number) => (rt.variables[i].data as string[])[0];

describe("EventBus with interpreter runtimes", () => {
  it("delivers public events to the other runtime and forwards refs verbatim (echo)", () => {
    const bus = new EventBus();
    const a = mk(senderGraph());
    const b = mk(receiverGraph());
    joinEventBus(a, bus, "A");
    joinEventBus(b, bus, "B");
    start(a);
    expect(num(b, 0)).toBe(7);
    // req.r travelled A -> B, was echoed as resp.r and came back unchanged.
    expect(str(a, 1)).toBe("/meshes/3");
  });

  it("never forwards '_'-prefixed ids", () => {
    const bus = new EventBus();
    const a = mk(senderGraph());
    const b = mk(receiverGraph());
    joinEventBus(a, bus);
    joinEventBus(b, bus);
    start(a);
    expect(num(b, 1)).toBe(0);
  });

  it("does nothing without a bus (no cross-delivery, no hook installed)", () => {
    const a = mk(senderGraph());
    const b = mk(receiverGraph());
    expect(a.onEventSent).toBeUndefined();
    start(a);
    expect(num(b, 0)).toBe(0);
    expect(str(a, 1)).toBe("");
  });

  it("a runtime that left the bus neither sends nor receives", () => {
    const bus = new EventBus();
    const a = mk(senderGraph());
    const b = mk(receiverGraph());
    joinEventBus(a, bus);
    const leave = joinEventBus(b, bus);
    leave();
    expect(bus.size).toBe(1);
    start(a);
    expect(num(b, 0)).toBe(0);
    expect(b.onEventSent).toBeUndefined();
  });

  it("works through InteractivityRuntime.joinEventBus and leaves cleanly", () => {
    const bus = new EventBus();
    const a = new InteractivityRuntime(senderGraph(), {});
    const b = new InteractivityRuntime(receiverGraph(), {});
    a.joinEventBus(bus, "A");
    const leaveB = b.joinEventBus(bus, "B");
    a.start();
    expect(b.getVariableByIndex(0).data).toEqual([7]);
    leaveB();
    expect(bus.size).toBe(1);
  });

  it("skips targets whose socket types are incompatible", () => {
    const g = receiverGraph();
    // Receiver listens for "pub".n as float (sender sends int); its own
    // variable is float too so the receiver graph stays spec-valid.
    g.types.push({ signature: "float" } as never);
    (g.events[0].values as Record<string, { type: number; value: number[] }>).n = { type: 2, value: [0] };
    (g.variables[0] as { type: number }).type = 2;
    const bus = new EventBus();
    const a = mk(senderGraph());
    const b = mk(g);
    joinEventBus(a, bus);
    joinEventBus(b, bus);
    start(a);
    expect(num(b, 0)).toBe(0);
  });
});

describe("EventBus ordering", () => {
  const spy = (name: string, log: string[], onReceive?: () => void): EventBusMember => ({
    name,
    listeningSockets: () => ({}),
    receive(id) {
      log.push(`${name}:${id}`);
      onReceive?.();
    }
  });

  it("delivers in join order, excluding the sender, and ignores private ids", () => {
    const bus = new EventBus();
    const log: string[] = [];
    const [m1, m2, m3] = [spy("m1", log), spy("m2", log), spy("m3", log)];
    bus.join(m1);
    bus.join(m2);
    bus.join(m3);
    bus.publish(m2, "x", {});
    bus.publish(m2, "_x", {});
    bus.publish(m2, undefined, {});
    expect(log).toEqual(["m1:x", "m3:x"]);
  });

  it("queues events published during delivery (FIFO, no re-entrancy)", () => {
    const bus = new EventBus();
    const log: string[] = [];
    const empty: Record<string, Value> = {};
    const m1: EventBusMember = spy("m1", log, () => bus.publish(m1, "second", empty));
    const m2 = spy("m2", log);
    bus.join(m1);
    bus.join(m2);
    // m2 sends "first": m1 receives it and sends "second" from inside its handler.
    bus.publish(m2, "first", empty);
    expect(log).toEqual(["m1:first", "m2:second"]);
  });

  it("is idempotent on join/leave", () => {
    const bus = new EventBus();
    const m = spy("m", []);
    bus.join(m);
    bus.join(m);
    expect(bus.size).toBe(1);
    bus.leave(m);
    bus.leave(m);
    expect(bus.size).toBe(0);
  });
});
