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
import { createScheduler, type Scheduler, type SchedulerEffects, type Value, type ValueType } from "@gltfi/kernel";
import { ptrGet, ptrSet } from "./pointer.js";
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

export type EngineOptions = { gltf?: unknown; seed?: number };
export type EngineFactory = (options?: EngineOptions) => EngineLike;

export type VarDecl = { type: ValueType; initial: RawValue };
export type EventDecl = { externalId?: string; expectedDuration?: number };

type FlowCont = () => void;

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
  stopPropagation(): void;
  eventOut(nodeKey: number, socket: string, value: unknown): void;
  eventOutRead(nodeKey: number, socket: string): unknown;
  random(): number;
  ptrGet(pointer: string, args: Record<string, unknown>, type: ValueType): { value: unknown; isValid: boolean };
  ptrSet(pointer: string, args: Record<string, unknown>, type: ValueType, value: unknown): boolean;
}

const DEFAULT_SEED = 123456789;

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
    const gltf: unknown = options.gltf ? JSON.parse(JSON.stringify(options.gltf)) : undefined;
    let randomState = options.seed ?? DEFAULT_SEED;

    const effects: SchedulerEffects<FlowCont> = {
      fireFlow(cont) {
        cont();
      },
      applyAnimationSample() {
        // Not needed this milestone (math/type/ref never schedule animations).
      },
      setPointer() {
        // Not needed this milestone (no pointer/interpolate in scope).
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
        for (const handler of onReceiveHandlers.get(eventIndex) ?? []) {
          handler(payload);
        }
      },
      log() {
        // debug/log has no effect on pass/fail (the interpreter's own
        // "debug/log" case is a pure flow pass-through — see
        // interpreter.ts); intentionally a no-op to keep conformance runs
        // quiet.
      },
      stopPropagation() {
        // event/stopPropagation affects only event dispatch fan-out, which
        // this milestone's scope (single onStart handlers, no receive/
        // onSelect/onHoverIn/Out fan-out) never exercises; reserved for a
        // later milestone's onReceive/onSelect dispatch loop.
      },
      eventOut(nodeKey, socket, value) {
        eventOutRegisters.set(`${nodeKey}:${socket}`, value);
      },
      eventOutRead(nodeKey, socket) {
        return eventOutRegisters.get(`${nodeKey}:${socket}`);
      },
      random() {
        // Mirrors interpreter.ts's `runtime.randomState` LCG exactly (same
        // multiplier/increment/modulus and the same default seed) so
        // compiled and interpreted runs draw identical sequences given the
        // same seed.
        randomState = (1664525 * randomState + 1013904223) >>> 0;
        return randomState / 0xffffffff;
      },
      ptrGet(pointer, args, type) {
        return ptrGet(gltf, pointer, args, type);
      },
      ptrSet(pointer, args, type, value) {
        void type;
        return ptrSet(gltf, pointer, args, value);
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
