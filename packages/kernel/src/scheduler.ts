// Time/async scheduler for KHR_interactivity: owns the delay table, the
// variable- and pointer-interpolation tables, the active-animation table,
// the current time and the tick counters, and implements the exact phase
// ordering an engine must run on every time advance: animation playback,
// then object-model pointer interpolations, then variable interpolations,
// then due delays, then per-tick handler activation (with tick bookkeeping
// updated around it). This module owns *when* things happen and *in what
// order*; it never touches a graph node, a glTF document or an execution
// stack directly. Callers — an interpreter today, eventually a compiled-code
// engine too — supply a small `SchedulerEffects` object that says *what*
// happens: how to write a sampled/interpolated value to its target, and how
// to resume execution for a stored continuation.
//
// `Cont` is left generic on purpose: this interpreter's implementation uses
// `() => void` thunks that close over `executeFlow`/node ids (see
// interpreter.ts), but nothing here assumes that shape — a compiled engine
// could hand back a resume-point id instead.

import { cubicBezierEase, quatSlerp } from "./math.js";
import { type Value, valueToNumberArray } from "./value.js";

export type DelayHandle = { id: number; ref: string };

export type DelayEntry<Cont> = DelayHandle & {
  time: number;
  cont: Cont;
};

export type VariableInterpEntry<Cont> = {
  variableIndex: number;
  startTime: number;
  duration: number;
  startValue: Value;
  endValue: Value;
  p1: [number, number];
  p2: [number, number];
  useSlerp: boolean;
  doneCont?: Cont;
};

export type AddVariableInterpParams<Cont> = Omit<VariableInterpEntry<Cont>, "startTime">;

export type PointerInterpEntry<Cont> = {
  pointer: string;
  startTime: number;
  duration: number;
  startValue: number[];
  endValue: number[];
  p1: [number, number];
  p2: [number, number];
  isQuaternion: boolean;
  doneCont?: Cont;
};

export type AddPointerInterpParams<Cont> = Omit<PointerInterpEntry<Cont>, "startTime">;

export type AnimationEntry<Cont> = {
  animationIndex: number;
  startTime: number;
  endTime: number;
  stopTime: number;
  speed: number;
  entryCreation: number;
  endCont?: Cont;
  stopCont?: Cont;
};

export type StartAnimationParams<Cont> = {
  animationIndex: number;
  startTime: number;
  endTime: number;
  speed: number;
  endCont?: Cont;
};

export type SchedulerEffects<Cont> = {
  // Resumes execution at a stored continuation: a delay's "done" flow, an
  // interpolation's or animation's "done" flow, or (via onTickPhase) a
  // per-tick handler.
  fireFlow(cont: Cont): void;
  // Samples animation `animationIndex` at virtual-timeline position
  // `requestedTime` and applies it to the target document/scene. The
  // scheduler only tracks *when* an animation is at which timeline
  // position; mapping that onto the animation's own [0,duration] range and
  // writing the sampled channels is entirely the caller's job.
  applyAnimationSample(animationIndex: number, requestedTime: number): void;
  // Writes an eased or final value to the object-model property addressed
  // by `pointer` (a pointer/interpolate target).
  setPointer(pointer: string, value: number | number[]): void;
  // Writes an eased or final value to variable `variableIndex`.
  setVariable(variableIndex: number, value: Value): void;
  // Runs the caller's own per-tick handlers (e.g. event/onTick nodes) in
  // whatever order its graph model defines. Called once per `advance()`
  // with delta > 0, after `lastTickDelta` is updated but before `tickCount`
  // is incremented — handlers observe the new delta and the pre-increment
  // tick count, matching KHR_interactivity's onTick timeSinceStart/
  // timeSinceLastTick semantics.
  onTickPhase(): void;
};

export type Scheduler<Cont> = {
  readonly time: number;
  readonly tickCount: number;
  readonly lastTickDelta: number;
  // Table sizes, for callers that want introspection/telemetry (e.g. a host
  // app's debug overlay) without reaching into scheduler internals.
  readonly delayCount: number;
  readonly pointerInterpCount: number;

  // Advances time by `delta` and runs the full phase sequence once:
  // animations -> pointer interpolations -> variable interpolations ->
  // due delays -> (if delta > 0) tick bookkeeping + onTickPhase.
  advance(delta: number): void;

  // Delay table. `allocateDelayId`/`scheduleDelay` are split from the
  // `addDelay` convenience wrapper so a caller can mint an id/ref (to hand
  // out on an output socket, say) without necessarily scheduling a table
  // entry for it.
  allocateDelayId(): DelayHandle;
  scheduleDelay(id: number, ref: string, duration: number, cont: Cont): void;
  addDelay(duration: number, cont: Cont): DelayHandle;
  cancelDelay(id: number): DelayEntry<Cont> | undefined;
  findDelayById(id: number): DelayEntry<Cont> | undefined;
  findDelayByRef(ref: string): DelayEntry<Cont> | undefined;
  isDelayActive(ref: string): boolean;

  // Variable-interpolation table (variable/interpolate).
  addVariableInterp(params: AddVariableInterpParams<Cont>): void;
  killVariableInterp(variableIndex: number): void;

  // Pointer-interpolation table (pointer/interpolate). Adding an entry
  // always first kills any existing entry for the same pointer — same-
  // target replacement silently drops the old entry's done flow, matching
  // the source interpreter's dedup-at-creation behavior.
  addPointerInterp(params: AddPointerInterpParams<Cont>): void;
  killPointerInterp(pointer: string): void;

  // Active-animation table (animation/start, animation/stop,
  // animation/stopAt). Starting an animation always first drops any
  // existing entry for the same animationIndex.
  startAnimation(params: StartAnimationParams<Cont>): void;
  stopAnimation(animationIndex: number): void;
  stopAnimationAt(animationIndex: number, stopTime: number, stopCont?: Cont): boolean;
  isAnimationPlaying(animationIndex: number): boolean;
};

export function createScheduler<Cont>(effects: SchedulerEffects<Cont>): Scheduler<Cont> {
  let time = 0;
  let tickCount = 0;
  let lastTickDelta = NaN;
  let nextDelayId = 0;

  let delays: DelayEntry<Cont>[] = [];
  // "Is this ref active" is tracked separately from the fire table: a ref
  // becomes active the instant it's allocated (whether or not it ever gets
  // a scheduled table entry — a caller can mint an id/ref pair for e.g. an
  // output socket without actually scheduling anything, see
  // scheduleDelay), and only stops being active when a *table entry* for
  // it is found and consumed (fired or canceled). A ref that was allocated
  // but never scheduled therefore reads as active forever. Copied verbatim
  // from the source interpreter, where this asymmetry was already load-
  // bearing behavior (a KHR_interactivity conformance case pins it).
  let activeRefs = new Set<string>();
  let variableInterps: VariableInterpEntry<Cont>[] = [];
  let pointerInterps: PointerInterpEntry<Cont>[] = [];
  let animations: AnimationEntry<Cont>[] = [];

  function allocateDelayId(): DelayHandle {
    const id = nextDelayId;
    nextDelayId += 1;
    const ref = `delay:${id}`;
    activeRefs.add(ref);
    return { id, ref };
  }

  function scheduleDelay(id: number, ref: string, duration: number, cont: Cont): void {
    delays.push({ id, ref, time: time + duration, cont });
  }

  function addDelay(duration: number, cont: Cont): DelayHandle {
    const handle = allocateDelayId();
    scheduleDelay(handle.id, handle.ref, duration, cont);
    return handle;
  }

  function cancelDelay(id: number): DelayEntry<Cont> | undefined {
    const found = delays.find((item) => item.id === id);
    if (found) {
      delays = delays.filter((item) => item.id !== id);
      activeRefs.delete(found.ref);
    }
    return found;
  }

  function findDelayById(id: number): DelayEntry<Cont> | undefined {
    return delays.find((item) => item.id === id);
  }

  function findDelayByRef(ref: string): DelayEntry<Cont> | undefined {
    return delays.find((item) => item.ref === ref);
  }

  function isDelayActive(ref: string): boolean {
    return activeRefs.has(ref);
  }

  function addVariableInterp(params: AddVariableInterpParams<Cont>): void {
    variableInterps.push({ ...params, startTime: time });
  }

  function killVariableInterp(variableIndex: number): void {
    variableInterps = variableInterps.filter((item) => item.variableIndex !== variableIndex);
  }

  function addPointerInterp(params: AddPointerInterpParams<Cont>): void {
    killPointerInterp(params.pointer);
    pointerInterps.push({ ...params, startTime: time });
  }

  function killPointerInterp(pointer: string): void {
    pointerInterps = pointerInterps.filter((item) => item.pointer !== pointer);
  }

  function startAnimation(params: StartAnimationParams<Cont>): void {
    animations = animations.filter((state) => state.animationIndex !== params.animationIndex);
    animations.push({
      animationIndex: params.animationIndex,
      startTime: params.startTime,
      endTime: params.endTime,
      stopTime: params.endTime,
      speed: params.speed,
      entryCreation: time,
      endCont: params.endCont,
      stopCont: undefined
    });
  }

  function stopAnimation(animationIndex: number): void {
    animations = animations.filter((state) => state.animationIndex !== animationIndex);
  }

  function stopAnimationAt(animationIndex: number, stopTime: number, stopCont?: Cont): boolean {
    const entry = animations.find((state) => state.animationIndex === animationIndex);
    if (!entry) {
      return false;
    }
    entry.stopTime = stopTime;
    entry.stopCont = stopCont;
    return true;
  }

  function isAnimationPlaying(animationIndex: number): boolean {
    return animations.some((state) => state.animationIndex === animationIndex);
  }

  function advance(delta: number): void {
    time += delta;

    // Phase 1: animation playback (KHR_interactivity Animation Control
    // Operations). Infinite virtual timeline: each active entry advances
    // toward stopTime/endTime and is dropped — with its done flow queued —
    // once hit. Flows fire after the whole table has been advanced once, so
    // a done handler that starts a new animation on the same index can't
    // observe (or corrupt) this pass.
    const finishedAnimations: Cont[] = [];
    animations = animations.filter((state) => {
      const { animationIndex, startTime, endTime, stopTime, speed, entryCreation, endCont, stopCont } = state;
      if (startTime === endTime) {
        effects.applyAnimationSample(animationIndex, startTime);
        if (endCont !== undefined) {
          finishedAnimations.push(endCont);
        }
        return false;
      }
      const elapsed = Math.max(0, time - entryCreation);
      const scaled = startTime > endTime ? -elapsed * speed : elapsed * speed;
      const current = startTime + scaled;
      const forward = startTime < endTime;
      const stopHit = forward
        ? current >= stopTime && stopTime >= startTime && stopTime < endTime
        : current <= stopTime && stopTime <= startTime && stopTime > endTime;
      if (stopHit) {
        effects.applyAnimationSample(animationIndex, stopTime);
        if (stopCont !== undefined) {
          finishedAnimations.push(stopCont);
        }
        return false;
      }
      const endHit = forward ? current >= endTime : current <= endTime;
      if (endHit) {
        effects.applyAnimationSample(animationIndex, endTime);
        if (endCont !== undefined) {
          finishedAnimations.push(endCont);
        }
        return false;
      }
      effects.applyAnimationSample(animationIndex, current);
      return true;
    });
    for (const cont of finishedAnimations) {
      effects.fireFlow(cont);
    }

    // Phase 2: object-model pointer interpolations (pointer/interpolate).
    // Same collect-then-fire pattern as animations.
    const finishedPointerInterps: Cont[] = [];
    pointerInterps = pointerInterps.filter((interp) => {
      const t = interp.duration > 0 ? (time - interp.startTime) / interp.duration : Infinity;
      if (t <= 0) {
        return true;
      }
      if (Number.isNaN(t) || t >= 1) {
        const target = interp.endValue.length === 1 ? interp.endValue[0] : interp.endValue;
        effects.setPointer(interp.pointer, target);
        if (interp.doneCont !== undefined) {
          finishedPointerInterps.push(interp.doneCont);
        }
        return false;
      }
      const q = cubicBezierEase(t, interp.p1, interp.p2);
      const value = interp.isQuaternion
        ? quatSlerp(interp.startValue, interp.endValue, q)
        : interp.startValue.map((item, index) => item + (interp.endValue[index] - item) * q);
      const written = value.length === 1 ? value[0] : value;
      effects.setPointer(interp.pointer, written);
      return true;
    });
    for (const cont of finishedPointerInterps) {
      effects.fireFlow(cont);
    }

    // Phase 3: variable interpolations (variable/interpolate). Unlike the
    // two phases above, the done flow fires *inline*, mid-filter — copied
    // verbatim from the source interpreter, mid-iteration array-mutation
    // quirk and all: a done handler that itself starts a new interpolation
    // pushes onto this same table while it's still being filtered, and
    // (per normal JS Array#filter semantics) won't be visited by this pass.
    variableInterps = variableInterps.filter((interp) => {
      const t = Math.min(1, (time - interp.startTime) / interp.duration);
      const ease = cubicBezierEase(t, interp.p1, interp.p2);
      if (interp.useSlerp && interp.startValue.type === "float4" && interp.endValue.type === "float4") {
        const q = quatSlerp(valueToNumberArray(interp.startValue), valueToNumberArray(interp.endValue), ease);
        effects.setVariable(interp.variableIndex, { type: "float4", data: q });
      } else {
        const start = valueToNumberArray(interp.startValue);
        const end = valueToNumberArray(interp.endValue);
        const out = start.map((item, index) => item + (end[index] - item) * ease);
        effects.setVariable(interp.variableIndex, { type: interp.endValue.type, data: out } as Value);
      }
      if (t >= 1) {
        if (interp.doneCont !== undefined) {
          effects.fireFlow(interp.doneCont);
        }
        return false;
      }
      return true;
    });

    // Phase 4: due delays (flow/setDelay). Two passes (collect "ready", then
    // drop them from the table) before any flow fires, same collect-then-
    // fire shape as animations/pointer interpolations.
    const ready = delays.filter((item) => item.time <= time);
    delays = delays.filter((item) => item.time > time);
    for (const item of ready) {
      activeRefs.delete(item.ref);
      effects.fireFlow(item.cont);
    }

    // Phase 5: per-tick handler activation, with tick bookkeeping updated
    // around it (see onTickPhase doc above for the exact ordering).
    if (delta > 0) {
      lastTickDelta = tickCount === 0 ? NaN : delta;
      effects.onTickPhase();
      tickCount += 1;
    }
  }

  return {
    get time() {
      return time;
    },
    get tickCount() {
      return tickCount;
    },
    get lastTickDelta() {
      return lastTickDelta;
    },
    get delayCount() {
      return delays.length;
    },
    get pointerInterpCount() {
      return pointerInterps.length;
    },
    advance,
    allocateDelayId,
    scheduleDelay,
    addDelay,
    cancelDelay,
    findDelayById,
    findDelayByRef,
    isDelayActive,
    addVariableInterp,
    killVariableInterp,
    addPointerInterp,
    killPointerInterp,
    startAnimation,
    stopAnimation,
    stopAnimationAt,
    isAnimationPlaying
  };
}
