// The compiled-engine runtime surface: `createEngine(setup)` builds an
// `EngineFactory`; calling the factory builds a FRESH engine instance (own
// variable storage, own RNG state, own scheduler, own event-output
// registers) — see docs/design/ir-and-transpiler.md's emission shape and the
// task's design decisions. emit-ts's generated module is exactly:
//
//   import { createEngine, m } from "@gltfi/runtime-lib";
//   export default createEngine((rt) => { ...handler registrations... });
//
// `setup` runs once per factory() call (not once at module load), so every
// closure a handler registration captures (onStart/onTick/onReceive bodies)
// is fresh per engine instance too — this is what lets math/random be
// `rt.random()` bound to that instance's own LCG state instead of shared
// module-level mutable state (see math.ts's header note: a shared module-
// level RNG would leak draws between sub-tests built from the same imported
// bundle, since run-compiled.ts builds many engines off one esbuild output).
//
// Beyond the M2 math/type/ref surface, this module now also hosts the async/
// stateful op runtime (flow/setDelay+cancelDelay, variable/interpolate,
// pointer/interpolate, animation/start+stop+stopAt, flow/doN+multiGate+
// waitAll+throttle) and real event/stopPropagation dispatch semantics —
// every one of these mirrors packages/runtime/src/interpreter.ts's own
// per-op case exactly (that file is the semantic oracle; see each method's
// doc comment below for the interpreter case it ports).
import {
  applyAnimationAt,
  createScheduler,
  doNAdvance,
  multiGateAdvance,
  throttleAdvance,
  waitAllAdvance,
  type Scheduler,
  type SchedulerEffects,
  type Value,
  type ValueType
} from "@gltfi/kernel";
import { ptrGet as resolvePtrGet, ptrInterpPrepare, ptrSet as resolvePtrSet, writePointerRaw, type PointerHost } from "./pointer.js";
import { kernelValueToRaw, rawToKernelValue, type RawValue } from "./value.js";

export type SentEvent = { eventIndex: number; externalId?: string; payload: [boolean, number, number, number] };

// The minimal interface both engines (this compiled one, and a thin adapter
// wrapping the interpreter's RuntimeGraph — see packages/conformance/src/
// interp-adapter.ts) satisfy; packages/conformance/src/protocol.ts's
// judgeTest is written entirely against this.
export interface EngineLike {
  start(): void;
  advance(dt: number): void;
  getVariableByIndex(index: number): Value;
  readonly variableCount: number;
  readonly sentEvents: readonly SentEvent[];
  readonly time: number;
  // Additive beyond the design note's five fields: judgeTest must mirror
  // the interpreter's evaluateGraphTests exactly, which folds in *every*
  // declared event's default expectedDuration unconditionally (not only
  // sent ones) when computing the run duration — see interpreter.ts's
  // `for (const event of runtime.graph.events ?? [])` loop. Without this,
  // a test whose expectedDuration comes from the event *declaration*
  // default (nothing ever sends a custom payload) would compute duration 0
  // and never step the scheduler far enough to observe the result.
  readonly eventDefaults: readonly (number | undefined)[];
}

export type EngineOptions = {
  gltf?: unknown;
  // Optional GLB BIN chunk, enabling animation channel sampling — same
  // deal as interpreter.ts's createRuntime({binary}) option. Without it,
  // animation/start|stop|stopAt still track playhead state and fire done
  // flows, just skip writing sampled TRS/weights values (see
  // @gltfi/kernel's animation.ts's readAccessorElements doc comment).
  glbBin?: ArrayBuffer | Uint8Array | DataView | null;
  seed?: number;
};
export type EngineFactory = (options?: EngineOptions) => EngineLike;

export type VarDecl = { type: ValueType; initial: RawValue };
export type EventDecl = {
  externalId?: string;
  expectedDuration?: number;
  // Declared defaults for the other 3 standard payload fields — read by
  // `rt.eventPayload` (see below) when an event has never been sent, so a
  // cross-handler event/receive payload read (GI012) answers "what would
  // this event's payload be right now" exactly like interpreter.ts's
  // getEventPayload does from the graph's own event declarations.
  defaultBool?: boolean;
  defaultInt?: number;
  defaultFloat?: number;
};

type FlowCont = () => void;

// Per-state-slot persisted objects — one plain mutable object per originating
// graph node (see emit-ts's emitStateSlots), matching
// packages/runtime/src/interpreter.ts's NodeState fields one-for-one:
// DelaySlot ~ delayIds/lastDelayIndex/lastDelayRef, DoNSlot ~ doNCount,
// MultiGateSlot ~ multiGateUsed/multiGateLastIndex, WaitAllSlot ~
// waitAllActivated/remainingInputs, ThrottleSlot ~ throttleTime/
// throttleRemaining.
export type DelaySlot = { lastId: number; lastRef: string; ids: number[] };
export type DoNSlot = { count: number };
export type MultiGateSlot = { lastIndex: number; used: boolean[] };
export type WaitAllSlot = { activated: boolean[]; remaining: number | undefined };
export type ThrottleSlot = { lastTime: number | undefined; remaining: number };

export interface EngineBuilder {
  vars(decls: VarDecl[]): void;
  getVar(index: number): RawValue;
  setVar(index: number, value: RawValue): void;
  events(decls: EventDecl[]): void;
  onStart(fn: () => void): void;
  onTick(fn: (timeSinceStart: number, timeSinceLastTick: number) => void): void;
  onReceive(eventIndex: number, fn: (payload: [boolean, number, number, number]) => void): void;
  send(eventIndex: number, externalId: string | undefined, payload: [boolean, number, number, number]): void;
  log(template: string, args: unknown[]): void;
  // `eventRef` is the compile-time-known ref string of the CURRENT handler's
  // own event (e.g. "event:custom:3"), exactly what `param("event")` reads
  // — see emit-ts's paramAccess. Mirrors interpreter.ts's event/
  // stopPropagation case: only `stopImmediate === true` has any effect
  // (adds `eventRef` to the stopped-events set checked by `send`'s receiver
  // dispatch loop before every remaining handler for that event).
  stopPropagation(eventRef: string, stopImmediate: boolean): void;
  eventOut(nodeKey: number, socket: string, value: unknown): void;
  eventOutRead(nodeKey: number, socket: string): unknown;
  // The event's current (last-sent-or-declared-default) payload, keyed by
  // event index — order-independent, unlike eventOut/eventOutRead: mirrors
  // interpreter.ts's getEventPayload exactly (see import.ts's GI012 branch
  // for why cross-handler event/receive payload reads need this instead of
  // a register). Same tuple shape as onReceive's own payload param.
  eventPayload(eventIndex: number): [boolean, number, number, number];
  // event/onTick's timeSinceStart/timeSinceLastTick, readable from outside
  // the tick handler itself (GI012) — live scheduler state, same values an
  // onTick handler running *this* tick would see via its own params.
  tickTime(): number;
  tickDelta(): number;
  random(): number;
  ptrGet(pointer: string, args: Record<string, unknown>, type: ValueType): { value: unknown; isValid: boolean };
  ptrSet(pointer: string, args: Record<string, unknown>, type: ValueType, value: unknown): boolean;

  // --- async ops (flow/setDelay, variable/interpolate, pointer/interpolate,
  // animation/start|stop|stopAt) — each mirrors its interpreter.ts
  // executeNodeFlow case: validate inputs, and on success schedule the
  // effect through the kernel scheduler and return {ok:true}; on failure
  // return {ok:false} (emit-ts lowers that to the op's out/err branch). ---
  setDelay(slot: DelaySlot, duration: number, done?: FlowCont): { ok: boolean };
  cancelDelay(ref: unknown): void;
  // The delay node's OWN "cancel" input port (interpreter.ts's flow/setDelay
  // socket==="cancel" case) — cancels every delay this slot ever minted,
  // matching NodeState.delayIds's loop-cancel-clear behavior exactly.
  cancelDelaySlot(slot: DelaySlot): void;
  varInterp(varId: number, value: RawValue, duration: number, p1: number[], p2: number[], useSlerp: boolean, done?: FlowCont): { ok: boolean };
  ptrInterp(
    pointer: string,
    args: Record<string, unknown>,
    type: ValueType,
    value: RawValue,
    duration: number,
    p1: number[],
    p2: number[],
    done?: FlowCont
  ): { ok: boolean };
  animStart(animationRef: unknown, startTime: number, endTime: number, speed: number, done?: FlowCont): { ok: boolean };
  animStop(animationRef: unknown): { ok: boolean };
  animStopAt(animationRef: unknown, stopTime: number, done?: FlowCont): { ok: boolean };

  // --- stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle)
  // — each is the "in" port's decision function; reset ports are lowered
  // directly by emit-ts as plain field assignments on the slot object (no
  // dedicated rt.* call needed — see emit.ts's emitStateful). ---
  doN(slot: DoNSlot, n: number): { fire: boolean };
  multiGate(slot: MultiGateSlot, outputCount: number, isRandom: boolean, isLoop: boolean): { index: number };
  waitAll(slot: WaitAllSlot, inputFlows: number, index: number): { completed: boolean };
  throttle(slot: ThrottleSlot, duration: number): { invalid: boolean; fire: boolean };
}

const DEFAULT_SEED = 123456789;

function isFiniteRaw(value: RawValue): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => Number.isFinite(item));
  }
  return true;
}

function normalizeGlbBin(bin: EngineOptions["glbBin"]): DataView | null {
  if (!bin) {
    return null;
  }
  if (bin instanceof DataView) {
    return bin;
  }
  if (bin instanceof ArrayBuffer) {
    return new DataView(bin);
  }
  return new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
}

// Mirrors interpreter.ts's parseAnimationRef: a ref-typed value is only a
// valid animation reference when it's literally "/animations/<n>" and that
// animation exists in the document.
function parseAnimationRef(gltf: any, ref: unknown): number | null {
  if (typeof ref !== "string") {
    return null;
  }
  const match = ref.match(/^\/animations\/(\d+)$/);
  if (!match) {
    return null;
  }
  const index = Number(match[1]);
  return gltf?.animations?.[index] ? index : null;
}

export function createEngine(setup: (rt: EngineBuilder) => void): EngineFactory {
  return (options: EngineOptions = {}): EngineLike => {
    const varTypes: ValueType[] = [];
    const varRaw: RawValue[] = [];
    const eventDecls: EventDecl[] = [];
    const onStartHandlers: Array<() => void> = [];
    const onTickHandlers: Array<(timeSinceStart: number, timeSinceLastTick: number) => void> = [];
    const onReceiveHandlers = new Map<number, Array<(payload: [boolean, number, number, number]) => void>>();
    const sentEvents: SentEvent[] = [];
    const eventOutRegisters = new Map<string, unknown>();
    // Last-sent payload per event index — mirrors interpreter.ts's
    // `runtime.eventPayloads` (a persistent Map, distinct from the
    // per-dispatch `sentEvents` log above): read by `rt.eventPayload` for
    // order-independent cross-handler event/receive payload reads.
    const lastPayloadByIndex = new Map<number, [boolean, number, number, number]>();
    const gltf: unknown = options.gltf ? JSON.parse(JSON.stringify(options.gltf)) : undefined;
    const glbBin = normalizeGlbBin(options.glbBin);
    let randomState = options.seed ?? DEFAULT_SEED;
    // Per-send-dispatch stop set, keyed by event ref string — see
    // EngineBuilder.stopPropagation's doc comment and interpreter.ts's
    // event/send / event/stopPropagation cases (runtime.stoppedEvents).
    const stoppedEvents = new Set<string>();
    // Delay-id -> owning slot, so the standalone flow/cancelDelay op (given
    // an arbitrary ref) can find and clean up whichever slot minted it —
    // mirrors interpreter.ts's runtime.delayOwners.
    const delayOwners = new Map<number, DelaySlot>();
    // animationIndex -> last-sampled {playhead, virtualPlayhead} — mirrors
    // interpreter.ts's runtime.animationRuntimes, feeding the
    // /animations/{n}/extensions/KHR_interactivity/{playhead,virtualPlayhead}
    // virtual pointers.
    const animationPlayheads = new Map<number, { playhead: number; virtualPlayhead: number }>();

    function stepRandom(): number {
      // Mirrors interpreter.ts's `runtime.randomState` LCG exactly (same
      // multiplier/increment/modulus and the same default seed) so
      // compiled and interpreted runs draw identical sequences given the
      // same seed — shared by math/random (rt.random) and flow/multiGate's
      // isRandom branch (rt.multiGate), exactly as interpreter.ts shares
      // one `runtime.randomState` between both op cases.
      randomState = (1664525 * randomState + 1013904223) >>> 0;
      return randomState;
    }

    const pointerHost: PointerHost = {
      gltf,
      isDelayActive: (ref) => scheduler.isDelayActive(ref),
      isAnimationPlaying: (index) => scheduler.isAnimationPlaying(index),
      getAnimationPlayhead: (index) => animationPlayheads.get(index) ?? { playhead: 0, virtualPlayhead: 0 },
      // Host-fed active-camera pose: no host feed mechanism exists this
      // milestone (not exercised by the acceptance corpus — see task
      // report), so this stays permanently null, matching
      // interpreter.ts's own default (nothing in the corpus ever calls the
      // interpreter's equivalent camera-pose setter either).
      activeCameraPosition: null,
      activeCameraRotation: null
    };

    const effects: SchedulerEffects<FlowCont> = {
      fireFlow(cont) {
        cont();
      },
      applyAnimationSample(animationIndex, requestedTime) {
        const result = applyAnimationAt({ gltf, glbBin }, animationIndex, requestedTime);
        if (!result) {
          return;
        }
        animationPlayheads.set(animationIndex, { playhead: result.t, virtualPlayhead: requestedTime });
      },
      setPointer(pointer, value) {
        writePointerRaw(gltf, pointer, value);
      },
      setVariable(variableIndex, value) {
        varRaw[variableIndex] = kernelValueToRaw(varTypes[variableIndex] ?? value.type, value);
      },
      onTickPhase() {
        for (const handler of onTickHandlers) {
          handler(scheduler.tickCount === 0 ? 0 : scheduler.time, scheduler.lastTickDelta);
        }
      }
    };
    const scheduler: Scheduler<FlowCont> = createScheduler(effects);

    const rt: EngineBuilder = {
      vars(decls) {
        for (const decl of decls) {
          varTypes.push(decl.type);
          varRaw.push(decl.initial);
        }
      },
      getVar(index) {
        return varRaw[index];
      },
      setVar(index, value) {
        varRaw[index] = value;
      },
      events(decls) {
        eventDecls.push(...decls);
      },
      onStart(fn) {
        onStartHandlers.push(fn);
      },
      onTick(fn) {
        onTickHandlers.push(fn);
      },
      onReceive(eventIndex, fn) {
        const list = onReceiveHandlers.get(eventIndex) ?? [];
        list.push(fn);
        onReceiveHandlers.set(eventIndex, list);
      },
      send(eventIndex, externalId, payload) {
        sentEvents.push({ eventIndex, externalId, payload });
        lastPayloadByIndex.set(eventIndex, payload);
        // Mirrors interpreter.ts's "event/send" case: clear any stale stop
        // flag for this event ref, dispatch receivers in registration
        // order while checking the flag before each call (so a receiver
        // that calls stopPropagation(stopImmediate=true) cancels every
        // *later* receiver of this same send), then clear again.
        const eventRef = `event:custom:${eventIndex}`;
        stoppedEvents.delete(eventRef);
        for (const handler of onReceiveHandlers.get(eventIndex) ?? []) {
          if (stoppedEvents.has(eventRef)) {
            break;
          }
          handler(payload);
        }
        stoppedEvents.delete(eventRef);
      },
      log() {
        // debug/log has no effect on pass/fail (the interpreter's own
        // "debug/log" case is a pure flow pass-through — see
        // interpreter.ts); intentionally a no-op to keep conformance runs
        // quiet.
      },
      stopPropagation(eventRef, stopImmediate) {
        if (stopImmediate && eventRef) {
          stoppedEvents.add(eventRef);
        }
      },
      eventOut(nodeKey, socket, value) {
        eventOutRegisters.set(`${nodeKey}:${socket}`, value);
      },
      eventOutRead(nodeKey, socket) {
        return eventOutRegisters.get(`${nodeKey}:${socket}`);
      },
      eventPayload(eventIndex) {
        const sent = lastPayloadByIndex.get(eventIndex);
        if (sent) {
          return sent;
        }
        const decl = eventDecls[eventIndex];
        return [decl?.defaultBool ?? false, decl?.defaultInt ?? 0, decl?.defaultFloat ?? 0, decl?.expectedDuration ?? 0];
      },
      tickTime() {
        return scheduler.tickCount === 0 ? 0 : scheduler.time;
      },
      tickDelta() {
        return scheduler.lastTickDelta;
      },
      random() {
        return stepRandom() / 0xffffffff;
      },
      ptrGet(pointer, args, type) {
        return resolvePtrGet(pointerHost, pointer, args, type);
      },
      ptrSet(pointer, args, type, value) {
        return resolvePtrSet(pointerHost, pointer, args, type, value);
      },

      // -- async ops --------------------------------------------------

      setDelay(slot, duration, done) {
        // Mirrors interpreter.ts's flow/setDelay "in" case: an id/ref is
        // minted unconditionally on valid duration (even with no "done"
        // continuation) so lastDelay stays populated; only a provided
        // `done` actually schedules a table entry.
        if (!Number.isFinite(duration) || duration < 0) {
          return { ok: false };
        }
        const handle = scheduler.allocateDelayId();
        slot.lastId = handle.id;
        slot.lastRef = handle.ref;
        slot.ids.push(handle.id);
        delayOwners.set(handle.id, slot);
        if (done) {
          scheduler.scheduleDelay(handle.id, handle.ref, duration, () => {
            slot.ids = slot.ids.filter((id) => id !== handle.id);
            delayOwners.delete(handle.id);
            done();
          });
        }
        return { ok: true };
      },
      cancelDelay(ref) {
        if (typeof ref !== "string" || !ref) {
          return;
        }
        const found = scheduler.findDelayByRef(ref);
        if (!found) {
          return;
        }
        scheduler.cancelDelay(found.id);
        const owner = delayOwners.get(found.id);
        delayOwners.delete(found.id);
        if (owner) {
          owner.ids = owner.ids.filter((id) => id !== found.id);
        }
      },
      cancelDelaySlot(slot) {
        for (const id of slot.ids) {
          scheduler.cancelDelay(id);
          delayOwners.delete(id);
        }
        slot.ids = [];
        slot.lastId = -1;
        slot.lastRef = "";
      },
      varInterp(varId, value, duration, p1, p2, useSlerp, done) {
        const type = varTypes[varId] ?? "float";
        const endKernel = rawToKernelValue(type, value);
        const isValid =
          Number.isFinite(duration) && duration > 0 && isFiniteRaw(value) && p1.every(Number.isFinite) && p2.every(Number.isFinite);
        if (!isValid) {
          return { ok: false };
        }
        const startKernel = rawToKernelValue(type, varRaw[varId]);
        scheduler.addVariableInterp({
          variableIndex: varId,
          duration,
          startValue: startKernel,
          endValue: endKernel,
          p1: [p1[0] ?? 0, p1[1] ?? 0],
          p2: [p2[0] ?? 0, p2[1] ?? 0],
          useSlerp,
          doneCont: done
        });
        return { ok: true };
      },
      ptrInterp(pointer, args, type, value, duration, p1, p2, done) {
        const prep = ptrInterpPrepare(pointerHost, pointer, args, type);
        if (!prep) {
          return { ok: false };
        }
        if (!Number.isFinite(duration) || duration < 0) {
          return { ok: false };
        }
        if (
          !p1.every(Number.isFinite) || !p2.every(Number.isFinite)
          || (p1[0] ?? 0) < 0 || (p1[0] ?? 0) > 1 || (p2[0] ?? 0) < 0 || (p2[0] ?? 0) > 1
        ) {
          return { ok: false };
        }
        const target = Array.isArray(value) ? value.map(Number) : [Number(value)];
        scheduler.addPointerInterp({
          pointer: prep.resolved,
          duration,
          startValue: prep.startValue,
          endValue: target,
          p1: [p1[0] ?? 0, p1[1] ?? 0],
          p2: [p2[0] ?? 0, p2[1] ?? 0],
          isQuaternion: /\/rotation$/.test(prep.resolved),
          doneCont: done
        });
        return { ok: true };
      },
      animStart(animationRef, startTime, endTime, speed, done) {
        const index = parseAnimationRef(gltf, animationRef);
        if (
          index === null
          || !Number.isFinite(startTime)
          || Number.isNaN(endTime)
          || !Number.isFinite(speed) || speed <= 0
        ) {
          return { ok: false };
        }
        scheduler.startAnimation({ animationIndex: index, startTime, endTime, speed, endCont: done });
        return { ok: true };
      },
      animStop(animationRef) {
        const index = parseAnimationRef(gltf, animationRef);
        if (index === null) {
          return { ok: false };
        }
        scheduler.stopAnimation(index);
        return { ok: true };
      },
      animStopAt(animationRef, stopTime, done) {
        const index = parseAnimationRef(gltf, animationRef);
        if (index === null || Number.isNaN(stopTime)) {
          return { ok: false };
        }
        scheduler.stopAnimationAt(index, stopTime, done);
        return { ok: true };
      },

      // -- stateful ops -------------------------------------------------

      doN(slot, n) {
        const decision = doNAdvance(slot.count, Math.trunc(n));
        slot.count = decision.count;
        return { fire: decision.fire };
      },
      multiGate(slot, outputCount, isRandom, isLoop) {
        const decision = multiGateAdvance(slot.used, outputCount, isRandom, isLoop, (count) => stepRandom() % count);
        slot.used = decision.used;
        if (decision.index >= 0) {
          slot.lastIndex = decision.index;
        }
        return { index: decision.index };
      },
      waitAll(slot, inputFlows, index) {
        const decision = waitAllAdvance(slot.activated, slot.remaining, inputFlows, index);
        slot.activated = decision.activated;
        slot.remaining = decision.remaining;
        return { completed: decision.completed };
      },
      throttle(slot, duration) {
        if (!Number.isFinite(duration) || duration < 0) {
          return { invalid: true, fire: false };
        }
        const decision = throttleAdvance(slot.lastTime, duration, scheduler.time);
        slot.lastTime = decision.lastTime;
        slot.remaining = decision.remaining;
        return { invalid: false, fire: decision.fire };
      }
    };

    setup(rt);

    return {
      start() {
        for (const handler of onStartHandlers) {
          handler();
        }
      },
      advance(dt) {
        scheduler.advance(dt);
      },
      getVariableByIndex(index) {
        return rawToKernelValue(varTypes[index] ?? "float", varRaw[index]);
      },
      get variableCount() {
        return varTypes.length;
      },
      get sentEvents() {
        return sentEvents;
      },
      get time() {
        return scheduler.time;
      },
      get eventDefaults() {
        return eventDecls.map((d) => d.expectedDuration);
      }
    };
  };
}
