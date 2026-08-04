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
  // Generic over the declared value's own JS shape (number for int/float,
  // boolean for bool, number[] for vectors/matrices, string for ref) so
  // \`vars()\`'s object form (below) can propagate each PROPERTY's own type
  // straight through to \`V.<name>\`'s own read/write type — narrower than
  // the old array form's plain RawValue ever was, which matters here:
  // emit-ts's native-operator substitution (e.g. \`V.counter + 1\`) needs TS
  // to see \`V.counter\` as plain \`number\`, not the wide \`RawValue\` union,
  // or the native \`+\`/\`<\`/etc. text wouldn't type-check at all, and a bare
  // assignment (\`V.counter = (V.counter + 1) | 0;\`) needs the property
  // itself to be a plain assignable \`number\`, not a \`{get,set}\` wrapper.
  type VarDecl<T = RawValue> = { type: string; initial: T };
  type EventDecl = { externalId?: string; defaultBool?: boolean; defaultInt?: number; defaultFloat?: number; expectedDuration?: number };
  // Maps a pointer's "type" signature STRING LITERAL (always a literal in
  // emitted code — see emit-ts's pointerCall) to the JS shape ptrGet's
  // \`.value\` actually has at that type — same motivation as VarAccessor<T>
  // above: emit-ts's native-operator substitution can embed \`rt.ptrGet(...)
  // .value\` directly as an operand (e.g. \`rt.ptrGet(...).value - 1 < eps\`),
  // which needs \`.value\` narrowed to \`number\`, not the wide RawValue union,
  // to type-check at all.
  type ValueOfSig<T> = T extends "bool" ? boolean : T extends "ref" ? string : T extends "float" | "int" ? number : number[];

  interface EngineFactory {
    (options?: { gltf?: unknown; glbBin?: unknown; seed?: number }): unknown;
  }

  interface EngineBuilder {
    // Array form (index-addressed, unchanged) and object form (named,
    // declaration-order-addressed — see engine.ts's EngineBuilder.vars doc
    // comment) as real overloads (this ambient .d.ts is a pure type
    // declaration with no implementation to reconcile against, unlike
    // runtime-lib's own object-literal-implemented interface, so there's no
    // obstacle to precise overload resolution here — and emitted code
    // property-accesses \`V.<name>\`/\`E.<name>\` off the *object*-form
    // result, which needs the narrower return type to type-check at all).
    // The object form is generic so each property's own VarDecl<T> carries
    // through to that property's own plain value type \`T\` in the result —
    // \`V.<name>\` is directly the value (number/boolean/number[]/string),
    // readable AND assignable (see the header note above).
    vars(decls: VarDecl[]): void;
    vars<T extends Record<string, VarDecl<any>>>(decls: T): { [K in keyof T]: T[K] extends VarDecl<infer U> ? U : never };
    getVar(index: number): RawValue;
    setVar(index: number, value: RawValue): void;
    events(decls: EventDecl[]): void;
    events(decls: Record<string, EventDecl>): Record<string, number>;
    int(x?: number): VarDecl<number>;
    bool(x?: boolean): VarDecl<boolean>;
    float(x?: number): VarDecl<number>;
    float2(x?: number, y?: number): VarDecl<number[]>;
    float3(x?: number, y?: number, z?: number): VarDecl<number[]>;
    float4(x?: number, y?: number, z?: number, w?: number): VarDecl<number[]>;
    float2x2(...values: number[]): VarDecl<number[]>;
    float3x3(...values: number[]): VarDecl<number[]>;
    float4x4(...values: number[]): VarDecl<number[]>;
    ref(pointer?: string): VarDecl<string>;
    // Carries a variable's original graph-authored id through emitted code
    // (see runtime-lib's engine.ts EngineBuilder.withId doc comment) —
    // generic so \`rt.withId(id, rt.int(0))\` still type-checks as \`VarDecl<number>\`,
    // preserving \`vars()\`'s object-form property typing exactly as if the
    // wrapper weren't there.
    withId<T>(id: string, decl: VarDecl<T>): VarDecl<T>;
    doNState(): any;
    multiGateState(outputCount?: number, opts?: { isRandom?: boolean; isLoop?: boolean }): any;
    waitAllState(inputFlows?: number): any;
    throttleState(): any;
    delayState(): any;
    onStart(fn: () => void): void;
    onTick(fn: (timeSinceStart: number, timeSinceLastTick: number) => void): void;
    onReceive(eventIndex: number, fn: (payload: [boolean, number, number, number]) => void): void;
    // Combined signature — see engine.ts's EngineBuilder.send doc comment
    // for the three call shapes this covers.
    send(eventIndex: number, secondArg?: string | [boolean, number, number, number], thirdArg?: [boolean, number, number, number]): void;
    log(template: string, args?: unknown[]): void;
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
    // package for exactly this kind of call-site-typed value. Each pointer
    // method's combined signature also covers the args-less form (constant
    // template args inlined into the path — see emit-ts's pointerCall).
    ptrGet<T extends string>(pointer: string, args: Record<string, unknown>, type: T): { value: ValueOfSig<T>; isValid: boolean };
    ptrGet<T extends string>(pointer: string, type: T): { value: ValueOfSig<T>; isValid: boolean };
    ptrSet(pointer: string, argsOrType: Record<string, unknown> | string, typeOrValue: string | unknown, value?: unknown): boolean;

    setDelay(slot: any, duration: number, done?: FlowCont): { ok: boolean };
    cancelDelay(ref: unknown): void;
    cancelDelaySlot(slot: any): void;
    varInterp(varId: number, value: RawValue, duration: number, p1: number[], p2: number[], useSlerp: boolean, done?: FlowCont): { ok: boolean };
    ptrInterp(
      pointer: string,
      argsOrType: Record<string, unknown> | string,
      typeOrValue: string | RawValue,
      valueOrDuration: RawValue | number,
      durationOrP1: number | number[],
      p1OrP2: number[],
      p2OrDone: number[] | FlowCont | undefined,
      done?: FlowCont
    ): { ok: boolean };
    animStart(animationRef: unknown, startTime: number, endTime: number, speed: number, done?: FlowCont): { ok: boolean };
    animStop(animationRef: unknown): { ok: boolean };
    animStopAt(animationRef: unknown, stopTime: number, done?: FlowCont): { ok: boolean };

    // doN now returns the fire decision directly (boolean), not {fire} — see
    // engine.ts's EngineBuilder.doN doc comment.
    doN(slot: any, n: number): boolean;
    multiGate(slot: any, outputCount: number, isRandom: boolean, isLoop: boolean): { index: number };
    waitAll(slot: any, inputFlows: number, index: number): { completed: boolean };
    throttle(slot: any, duration: number): { invalid: boolean; fire: boolean };
  }

  export function createEngine(setup: (rt: EngineBuilder) => void): EngineFactory;
  export const m: Record<string, (...args: any[]) => any>;
}
`;
