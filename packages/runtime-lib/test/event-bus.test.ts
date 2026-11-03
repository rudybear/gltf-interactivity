import { describe, expect, it } from "vitest";
import { EventBus } from "@gltfi/kernel";
import { createEngine } from "../src/engine.js";

// Initiator: on start sends public "req"(r) and private "_secret"(n); stores
// the echoed "resp"(r) into a ref variable.
const initiator = createEngine((rt) => {
  const V = rt.vars({ echoed: rt.ref("") }) as { echoed: string };
  const E = rt.events({
    req: { externalId: "req", extras: { r: rt.ref("") } },
    resp: { externalId: "resp", extras: { r: rt.ref("") } },
    secret: { externalId: "_secret", extras: { n: rt.int(0) } }
  }) as Record<string, number>;
  rt.onStart(() => {
    rt.send(E.req, [false, 0, 0, 0, "/meshes/2"]);
    rt.send(E.secret, [false, 0, 0, 0, 5]);
  });
  rt.onReceive(E.resp, (p) => {
    V.echoed = p[4] as string;
  });
});

const responder = createEngine((rt) => {
  const V = rt.vars({ secretSeen: rt.int(0) }) as { secretSeen: number };
  const E = rt.events({
    req: { externalId: "req", extras: { r: rt.ref("") } },
    resp: { externalId: "resp", extras: { r: rt.ref("") } },
    secret: { externalId: "_secret", extras: { n: rt.int(0) } }
  }) as Record<string, number>;
  rt.onReceive(E.req, (p) => rt.send(E.resp, [false, 0, 0, 0, p[4]]));
  rt.onReceive(E.secret, (p) => {
    V.secretSeen = p[4] as number;
  });
});

describe("createEngine eventBus option", () => {
  it("echoes a ref across engines and keeps '_' ids private", () => {
    const bus = new EventBus();
    const a = initiator({ eventBus: bus });
    const b = responder({ eventBus: bus });
    a.start();
    expect(a.getVariableByIndex(0).data).toEqual(["/meshes/2"]);
    expect(b.getVariableByIndex(0).data).toEqual([0]);
  });

  it("without a bus nothing is forwarded; after leaveEventBus nothing is forwarded", () => {
    const a1 = initiator();
    responder();
    a1.start();
    expect(a1.getVariableByIndex(0).data).toEqual([""]);

    const bus = new EventBus();
    const a2 = initiator({ eventBus: bus });
    const b2 = responder({ eventBus: bus });
    b2.leaveEventBus();
    expect(bus.size).toBe(1);
    a2.start();
    expect(a2.getVariableByIndex(0).data).toEqual([""]);
  });
});
