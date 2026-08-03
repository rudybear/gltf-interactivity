// Thin EngineLike adapter over the interpreter's RuntimeGraph, so
// protocol.ts's judgeTest can drive either engine identically. Observes
// exactly what evaluateGraphTests observed before the M3 refactor:
//   - start(): fire every event/onStart node, in graph node-index order
//     (executeFlow per node — same as evaluateGraphTests's own loop).
//   - sentEvents: read from `runtime.eventPayloads` (populated only by
//     "event/send" node execution — see interpreter.ts's executeNodeFlow
//     "event/send" case), one entry per event index that was ever sent.
//   - eventDefaults: each declared event's default `expectedDuration`
//     value (index == event index), read straight from the graph JSON.
import { advanceTime, executeFlow, type RuntimeGraph } from "@gltfi/runtime";
import type { EngineLike, SentEvent } from "@gltfi/runtime-lib";

export function interpEngineFromRuntime(runtime: RuntimeGraph): EngineLike {
  return {
    start() {
      runtime.graph.nodes.forEach((node, index) => {
        if ((runtime.graph.declarations[node.declaration]?.op ?? "") === "event/onStart") {
          executeFlow(runtime, index);
        }
      });
    },
    advance(dt: number) {
      advanceTime(runtime, dt);
    },
    getVariableByIndex(index: number) {
      return runtime.variables[index];
    },
    get variableCount() {
      return runtime.variables.length;
    },
    get sentEvents(): readonly SentEvent[] {
      const out: SentEvent[] = [];
      for (const [eventIndex, payload] of runtime.eventPayloads) {
        out.push({
          eventIndex,
          externalId: runtime.graph.events?.[eventIndex]?.id,
          payload: [
            Boolean(payload.boolParameter),
            Number(payload.intParameter ?? 0),
            Number(payload.floatParameter ?? 0),
            Number(payload.expectedDuration ?? 0)
          ]
        });
      }
      return out;
    },
    get time() {
      return runtime.scheduler.time;
    },
    get eventDefaults(): readonly (number | undefined)[] {
      return (runtime.graph.events ?? []).map((event) => {
        const raw = (event as { values?: Record<string, { value?: unknown[] }> }).values?.expectedDuration?.value?.[0];
        return raw !== undefined ? Number(raw) : undefined;
      });
    }
  };
}
