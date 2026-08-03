// Hand-written ambient .d.ts for @gltfi/runtime-lib's rt/m surface, loaded
// into the ts-morph in-memory project so parseModule can typecheck emitted
// GIscript modules. See docs/design/ir-and-transpiler.md's "GIscript subset"
// section: "TS type checker runs first (any diagnostic = fail)". Deliberately
// loose (rest-args / any-typed slot params) rather than a byte-accurate
// transcription of packages/runtime-lib/src/engine.ts's EngineBuilder — the
// goal is to catch gross out-of-subset TypeScript (unknown identifiers,
// wrong arg counts, calling something that isn't a function) without coupling
// this package to runtime-lib's exact type shapes, which is what the design
// doc means by "hand-written is fine and stable". Kept in sync with
// runtime-lib's actual JS behavior (packages/runtime-lib/src/engine.ts and
// math.ts) by hand whenever the emitter's call shapes change.
export const RUNTIME_LIB_DTS = `
declare module "@gltfi/runtime-lib" {
  type RawValue = number | boolean | string | number[];
  type FlowCont = () => void;

  interface EngineFactory {
    (options?: { gltf?: unknown; glbBin?: unknown; seed?: number }): unknown;
  }

  interface EngineBuilder {
    vars(decls: Array<{ type: string; initial: RawValue }>): void;
    getVar(index: number): RawValue;
    setVar(index: number, value: RawValue): void;
    events(decls: Array<{ externalId?: string; defaultBool?: boolean; defaultInt?: number; defaultFloat?: number; expectedDuration?: number }>): void;
    onStart(fn: () => void): void;
    onTick(fn: (timeSinceStart: number, timeSinceLastTick: number) => void): void;
    onReceive(eventIndex: number, fn: (payload: [boolean, number, number, number]) => void): void;
    send(eventIndex: number, externalId: string | undefined, payload: [boolean, number, number, number]): void;
    log(template: string, args: unknown[]): void;
    stopPropagation(eventRef: string, stopImmediate: boolean): void;
    eventOut(nodeKey: number, socket: string, value: unknown): void;
    eventOutRead(nodeKey: number, socket: string): unknown;
    eventPayload(eventIndex: number): [boolean, number, number, number];
    tickTime(): number;
    tickDelta(): number;
    random(): number;
    // "value"'s real runtime-lib type is "unknown" (the pointer's static
    // type isn't known without carrying a type-level string literal), but
    // the emitted call site is always used at a definite type (fed straight
    // into rt.setVar/an m.* call/etc.) — see this package's index.ts header
    // note on why this ambient .d.ts is intentionally looser than the real
    // package for exactly this kind of call-site-typed value.
    ptrGet(pointer: string, args: Record<string, unknown>, type: string): { value: RawValue; isValid: boolean };
    ptrSet(pointer: string, args: Record<string, unknown>, type: string, value: unknown): boolean;

    setDelay(slot: any, duration: number, done?: FlowCont): { ok: boolean };
    cancelDelay(ref: unknown): void;
    cancelDelaySlot(slot: any): void;
    varInterp(varId: number, value: RawValue, duration: number, p1: number[], p2: number[], useSlerp: boolean, done?: FlowCont): { ok: boolean };
    ptrInterp(pointer: string, args: Record<string, unknown>, type: string, value: RawValue, duration: number, p1: number[], p2: number[], done?: FlowCont): { ok: boolean };
    animStart(animationRef: unknown, startTime: number, endTime: number, speed: number, done?: FlowCont): { ok: boolean };
    animStop(animationRef: unknown): { ok: boolean };
    animStopAt(animationRef: unknown, stopTime: number, done?: FlowCont): { ok: boolean };

    doN(slot: any, n: number): { fire: boolean };
    multiGate(slot: any, outputCount: number, isRandom: boolean, isLoop: boolean): { index: number };
    waitAll(slot: any, inputFlows: number, index: number): { completed: boolean };
    throttle(slot: any, duration: number): { invalid: boolean; fire: boolean };
  }

  export function createEngine(setup: (rt: EngineBuilder) => void): EngineFactory;
  export const m: Record<string, (...args: any[]) => any>;
}
`;
