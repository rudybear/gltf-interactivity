// Interpreter side of the cross-asset event bus (the bus itself lives in
// @gltfi/kernel's event-bus.ts, which also documents the forwarding rules).
// Purely additive: a RuntimeGraph that never joins a bus behaves exactly as
// before (RuntimeGraph.onEventSent stays undefined).
import { cloneValue, EventBus, isPublicEventId, type EventBusMember, type Value } from "@gltfi/kernel";
import { executeFlow, type EventPayload, type RuntimeGraph } from "./interpreter.js";

export { EventBus, isPublicEventId };
export type { EventBusMember };

function eventIndexById(runtime: RuntimeGraph, id: string): number {
  const events = runtime.graph.events ?? [];
  for (let i = 0; i < events.length; i += 1) {
    if (events[i]?.id === id) {
      return i;
    }
  }
  return -1;
}

// Wrap a RuntimeGraph as a bus member (without joining).
export function createEventBusMember(runtime: RuntimeGraph, bus: EventBus, name?: string): EventBusMember {
  const sockets = (index: number): Record<string, string> => {
    const out: Record<string, string> = {};
    const values = runtime.graph.events?.[index]?.values ?? {};
    for (const key of Object.keys(values)) {
      out[key] = runtime.graph.types[values[key].type]?.signature ?? "float";
    }
    return out;
  };
  const member: EventBusMember = {
    name,
    listeningSockets(id) {
      const index = eventIndexById(runtime, id);
      // Only graphs that actually have an event/receive node for it listen.
      return index >= 0 && (runtime.eventReceivers.get(index)?.length ?? 0) > 0 ? sockets(index) : undefined;
    },
    receive(id, values) {
      const index = eventIndexById(runtime, id);
      if (index < 0) {
        return;
      }
      const payload: EventPayload = { values: {} };
      for (const key of Object.keys(sockets(index))) {
        payload.values![key] = cloneValue(values[key]);
      }
      const num = (key: string): number | undefined => {
        const v = payload.values![key];
        return v ? Number((v.data as unknown[])[0]) : undefined;
      };
      const b = payload.values!.boolParameter;
      if (b) {
        payload.boolParameter = Boolean((b.data as unknown[])[0]);
      }
      if (num("intParameter") !== undefined) {
        payload.intParameter = Math.trunc(num("intParameter") as number);
      }
      if (num("floatParameter") !== undefined) {
        payload.floatParameter = num("floatParameter");
      }
      if (num("expectedDuration") !== undefined) {
        payload.expectedDuration = num("expectedDuration");
      }
      runtime.eventPayloads.set(index, payload);
      const eventRef = `event:custom:${index}`;
      runtime.stoppedEvents.delete(eventRef);
      for (const receiverId of runtime.eventReceivers.get(index) ?? []) {
        if (runtime.stoppedEvents.has(eventRef)) {
          break;
        }
        executeFlow(runtime, receiverId, "in");
      }
      runtime.stoppedEvents.delete(eventRef);
    }
  };
  return member;
}

// Join `runtime` to `bus`: its public event/send occurrences are forwarded to
// the other members and it receives theirs. Returns a function that leaves.
export function joinEventBus(runtime: RuntimeGraph, bus: EventBus, name?: string): () => void {
  const member = createEventBusMember(runtime, bus, name);
  const leave = bus.join(member);
  runtime.onEventSent = (eventIndex, payload) => {
    const def = runtime.graph.events?.[eventIndex];
    if (!isPublicEventId(def?.id)) {
      return;
    }
    const values: Record<string, Value> = {};
    for (const key of Object.keys(def?.values ?? {})) {
      const v = payload.values?.[key];
      if (v) {
        values[key] = cloneValue(v);
      }
    }
    bus.publish(member, def?.id, values);
  };
  return () => {
    leave();
    runtime.onEventSent = undefined;
  };
}
