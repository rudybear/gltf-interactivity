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

// KHR_node_selectability / KHR_node_hoverability payload shapes handed to
// rt.onSelect/rt.onHoverIn/rt.onHoverOut registrations and read back by
// fireSelect/fireHoverIn/fireHoverOut — see the EngineInteractive doc
// comment below for the ancestor-chain bubbling semantics these drive.
export type SelectParams = {
  selectedNode: string;
  selectedNodeIndex: number;
  controllerIndex: number;
  selectionPoint: [number, number, number];
  selectionRayOrigin: [number, number, number];
};
export type HoverParams = { hoveredNode: string; controllerIndex: number };

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
  // Mirrors interpreter.ts's createRuntime({onPointerSet}) exactly — called
  // with the fully-resolved pointer and raw value whenever a direct
  // pointer/set write (rt.ptrSet), a scheduled pointer/interpolate tick
  // (rt.ptrInterp), or an animation channel sample writes into this
  // engine's internal gltf clone. Lets a host (the viewer's SceneAdapter
  // bridge — see apps/viewer/src/engine-host.ts) mirror those writes into a
  // separately rendered scene without polling; unused by
  // packages/conformance (judgeTest reads variables directly, never the
  // gltf clone).
  onPointerSet?: (pointer: string, value: number[] | boolean[] | number | boolean) => void;
};
// KHR_node_selectability / KHR_node_hoverability entry points, additive
// beyond the conformance-oriented EngineLike surface (the official corpus's
// test-index.json / mathtests-index.json never include the UserInteractions
// category, so packages/conformance never needs these — see
// packages/runtime/src/host.ts's InteractivityRuntime.setSelection/setHover
// for the interpreter-side sibling this mirrors). A `() => EngineInteractive`
// factory is structurally assignable to `() => EngineLike` (covariant
// function return), so EngineFactory below widening to this doesn't disturb
// any existing EngineLike-typed caller (run-compiled.ts, protocol.ts).
export interface EngineInteractive extends EngineLike {
  // Ancestor-chain bubbling from `nodeIndex` (the actual hit node) up to the
  // scene root, deepest first — mirrors host.ts's triggerNodeEvent exactly,
  // including the same (new, symmetric) stopPropagation short-circuit: once
  // any onSelect handler that fires at a given chain level was configured
  // with `stopPropagation: true`, bubbling stops before reaching that
  // level's parent. No-op when nodeIndex < 0 (matches host.ts's setSelection
  // guard).
  fireSelect(nodeIndex: number, point: [number, number, number], rayOrigin?: [number, number, number], controllerIndex?: number): void;
  // Full hover-transition entry point — mirrors host.ts's setHover(nodeIndex,
  // point) exactly: internally tracks the previously-hovered node, no-ops if
  // `nodeIndex` is unchanged, and fires onHoverOut for the old chain / onHoverIn
  // for the new chain excluding whichever ancestor nodes are shared between
  // them (so a hover move within one still-hovered subtree doesn't re-fire a
  // shared ancestor's handlers). Pass nodeIndex -1 to hover nothing.
  fireHoverIn(nodeIndex: number, point?: [number, number, number], controllerIndex?: number): void;
  // Sugar for "pointer left every hoverable target" — equivalent to
  // `fireHoverIn(-1)`. `nodeIndex` is accepted only for call-site symmetry
  // with fireSelect/fireHoverIn (the actual previously-hovered node is
  // whatever this engine's own internal state already tracked); it does not
  // affect which handlers fire.
  fireHoverOut(nodeIndex?: number): void;
}

export type EngineFactory = (options?: EngineOptions) => EngineInteractive;

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

// Legacy named accessor shape, once returned by the object-form of `vars()`
// — kept exported only so old hand-written callers that still destructure
// `{get, set}` off a variable keep compiling; the object form itself no
// longer returns this shape (see `vars()` below, which now binds `V.<name>`
// straight to the store via `Object.defineProperty` getters/setters instead
// — emit-ts emits bare `V.<name>` reads/`V.<name> = v` writes, no `.get()`/
// `.set(v)` calls at all anymore).
export type VarAccessor = { get(): RawValue; set(value: RawValue): void };

export interface EngineBuilder {
  // Additive object form (see docs/design/ir-and-transpiler.md's IR->TS
  // section and this package's README): `rt.vars({name: rt.int(0), ...})` —
  // property ORDER is the variable index order (object literals preserve
  // insertion/source order for string keys — this is the load-bearing
  // contract the object form relies on), exactly like the array form's
  // element order. Returns a plain object with one OWN accessor property
  // per declared variable (`Object.defineProperty` getter/setter, each
  // closing over that variable's own numeric index — see the
  // implementation below), so emitted code reads/writes it exactly like a
  // normal field: `V.counter1`/`V.counter1 = v`. The array form (unchanged,
  // still used by @gltfi/emit-lua/@gltfi/emit-py's shared IR pipeline
  // expectations and by hand-written callers — see
  // packages/runtime-lib/test/engine.test.ts) returns nothing.
  // One combined signature (rather than a true TS overload pair) so a plain
  // object-literal implementation can satisfy it directly: callers using the
  // array form get `void` back in practice (nothing about the return value
  // is ever asserted there — see engine.test.ts) and callers using the
  // object form get the live-bound variable object.
  vars(decls: VarDecl[] | Record<string, VarDecl>): Record<string, RawValue> | void;
  getVar(index: number): RawValue;
  setVar(index: number, value: RawValue): void;
  // Object form: `rt.events({name: {externalId, expectedDuration, ...}})` —
  // property order is event index order (same insertion-order contract as
  // `vars()`'s object form). Returns a plain name->index map (a bare
  // `number`, since that's exactly what `send`/`onReceive`'s first
  // parameter already accepts — no separate "event ref" wrapper type
  // needed).
  events(decls: EventDecl[] | Record<string, EventDecl>): Record<string, number> | void;
  // Variable-declaration-shorthand helpers, usable as `rt.vars({name:
  // rt.int(0), ...})` entries — each just builds the same `{type, initial}`
  // shape the array form's elements always were. Defaults match
  // @gltfi/kernel's own per-type zero value (see value.ts's defaultValue).
  int(x?: number): VarDecl;
  bool(x?: boolean): VarDecl;
  float(x?: number): VarDecl;
  float2(x?: number, y?: number): VarDecl;
  float3(x?: number, y?: number, z?: number): VarDecl;
  float4(x?: number, y?: number, z?: number, w?: number): VarDecl;
  float2x2(...values: number[]): VarDecl;
  float3x3(...values: number[]): VarDecl;
  float4x4(...values: number[]): VarDecl;
  ref(pointer?: string): VarDecl;
  // Wraps a variable-declaration-shorthand call with the ORIGINAL graph-
  // authored variable id (`module.variables[i].extras.id` — see @gltfi/ir's
  // import.ts/export.ts and display-names.ts's own doc comment), emitted as
  // `rt.withId("the-id", rt.int(0))` by @gltfi/emit-ts whenever a variable's
  // id survived from the source graph (see emit.ts's emitVars). Purely a
  // syntactic carrier for @gltfi/parse-ts to recover the id from — it has NO
  // execution semantics, so the implementation below just returns `decl`
  // unchanged.
  withId(id: string, decl: VarDecl): VarDecl;
  // State-slot factories — plain object literals with the exact shape
  // emit-ts used to write out literally (see DelaySlot/DoNSlot/
  // MultiGateSlot/WaitAllSlot/ThrottleSlot above); the optional parameters
  // exist purely so a call site can echo the same count/options that are
  // ALSO passed to the matching doN/multiGate/waitAll/throttle call for a
  // human reader's benefit — they don't affect the returned slot's shape,
  // which never carries outputCount/inputFlows/isRandom/isLoop (those are
  // re-supplied at every doN/multiGate/waitAll/throttle call site, exactly
  // like before).
  doNState(): DoNSlot;
  multiGateState(outputCount?: number, opts?: { isRandom?: boolean; isLoop?: boolean }): MultiGateSlot;
  waitAllState(inputFlows?: number): WaitAllSlot;
  throttleState(): ThrottleSlot;
  delayState(): DelaySlot;
  onStart(fn: () => void): void;
  onTick(fn: (timeSinceStart: number, timeSinceLastTick: number) => void): void;
  onReceive(eventIndex: number, fn: (payload: [boolean, number, number, number]) => void): void;
  // KHR_node_selectability/hoverability handler registration — `nodeIndex`
  // is the node this handler's event/onSelect|onHoverIn|onHoverOut node was
  // configured with (config.nodeIndex, default -1 meaning "never matches
  // any real chain entry", exactly like the interpreter's own guard — see
  // host.ts's triggerNodeEvent's `configured === target` check). Firing is
  // driven by the engine's fireSelect/fireHoverIn/fireHoverOut methods, not
  // from inside setup() itself.
  onSelect(nodeIndex: number, stopPropagation: boolean, fn: (params: SelectParams) => void): void;
  onHoverIn(nodeIndex: number, fn: (params: HoverParams) => void): void;
  onHoverOut(nodeIndex: number, fn: (params: HoverParams) => void): void;
  // Combined signature covering three call shapes: the OLD `(eventIndex,
  // externalId, payload)` (externalId is IGNORED — it's looked up from this
  // engine's own eventDecls table instead, since it's fully redundant with
  // eventIndex/the `E.<name>` ref that names it), the additive `(eventIndex,
  // payload)`, and `(eventIndex)` alone when every payload value equals the
  // event's own declared default (see emit-ts's emitEvent doc comment) — no
  // second argument at all in that case.
  send(eventIndex: number, secondArg?: string | [boolean, number, number, number], thirdArg?: [boolean, number, number, number]): void;
  log(template: string, args?: unknown[]): void;
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
  // Combined signature covering both the object-args form (unchanged) and an
  // additive args-less form for when every pointer-template parameter is a
  // compile-time constant (see emit-ts's pointerCall — it inlines constant
  // template args straight into the path string, so there's nothing left to
  // pass in an args object at all): `argsOrType` is either the args record
  // (3-arg form omitted) or, when it's a string, IS the type signature and
  // the args object was omitted entirely.
  ptrGet(pointer: string, argsOrType: Record<string, unknown> | ValueType, type?: ValueType): { value: unknown; isValid: boolean };
  ptrSet(pointer: string, argsOrType: Record<string, unknown> | ValueType, typeOrValue: ValueType | unknown, value?: unknown): boolean;

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
  // Combined signature — see ptrGet/ptrSet's doc comment above for the
  // args-less form this also accepts (shifts every parameter left by one
  // when `argsOrType` is a string, i.e. IS the type signature).
  ptrInterp(
    pointer: string,
    argsOrType: Record<string, unknown> | ValueType,
    typeOrValue: ValueType | RawValue,
    valueOrDuration: RawValue | number,
    durationOrP1: number | number[],
    p1OrP2: number[],
    p2OrDone: number[] | FlowCont | undefined,
    done?: FlowCont
  ): { ok: boolean };
  animStart(animationRef: unknown, startTime: number, endTime: number, speed: number, done?: FlowCont): { ok: boolean };
  animStop(animationRef: unknown): { ok: boolean };
  animStopAt(animationRef: unknown, stopTime: number, done?: FlowCont): { ok: boolean };

  // --- stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle)
  // — each is the "in" port's decision function; reset ports are lowered
  // directly by emit-ts as plain field assignments on the slot object (no
  // dedicated rt.* call needed — see emit.ts's emitStateful). ---
  // Returns the fire decision directly (not `{fire}`) — the *only*
  // non-additive shape change in this surface (see the task report): every
  // real call site checks this exactly once (`if (rt.doN(...)) {...}`), so
  // there was never a reason to name an intermediate result — see emit-ts's
  // emitStateful, which now inlines the call straight into the `if`.
  doN(slot: DoNSlot, n: number): boolean;
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

// Mirrors interpreter.ts's prepareGltfData's parent-index pass: for
// fireSelect/fireHoverIn's ancestor-chain bubbling, computed once per engine
// instance from the (already-cloned) gltf document handed to this factory
// call. Index i holds node i's parent node index, or -1 for a root/orphan.
function computeNodeParents(gltf: any): number[] {
  const nodes = gltf?.nodes ?? [];
  const parents = new Array(nodes.length).fill(-1);
  nodes.forEach((node: any, index: number) => {
    (node?.children ?? []).forEach((child: number) => {
      if (child >= 0 && child < parents.length) {
        parents[child] = index;
      }
    });
  });
  return parents;
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
  return (options: EngineOptions = {}): EngineInteractive => {
    const varTypes: ValueType[] = [];
    const varRaw: RawValue[] = [];
    const eventDecls: EventDecl[] = [];
    const onStartHandlers: Array<() => void> = [];
    const onTickHandlers: Array<(timeSinceStart: number, timeSinceLastTick: number) => void> = [];
    const onReceiveHandlers = new Map<number, Array<(payload: [boolean, number, number, number]) => void>>();
    // KHR_node_selectability/hoverability handler registries, keyed by the
    // handler's configured nodeIndex (see EngineBuilder.onSelect's doc
    // comment) — fired by fireSelect/fireHoverIn/fireHoverOut below.
    const selectHandlers = new Map<number, Array<{ fn: (params: SelectParams) => void; stopPropagation: boolean }>>();
    const hoverInHandlers = new Map<number, Array<(params: HoverParams) => void>>();
    const hoverOutHandlers = new Map<number, Array<(params: HoverParams) => void>>();
    // Mirrors host.ts's InteractivityRuntime.lastHoverIndex.
    let hoverIndex = -1;
    const sentEvents: SentEvent[] = [];
    const eventOutRegisters = new Map<string, unknown>();
    // Last-sent payload per event index — mirrors interpreter.ts's
    // `runtime.eventPayloads` (a persistent Map, distinct from the
    // per-dispatch `sentEvents` log above): read by `rt.eventPayload` for
    // order-independent cross-handler event/receive payload reads.
    const lastPayloadByIndex = new Map<number, [boolean, number, number, number]>();
    const gltf: unknown = options.gltf ? JSON.parse(JSON.stringify(options.gltf)) : undefined;
    const nodeParents = computeNodeParents(gltf);
    // Chain of glTF node indices from `nodeIndex` up to the scene root
    // (inclusive of the node itself) — mirrors host.ts's ancestorChain
    // exactly (same cycle guard via the includes() check).
    function ancestorChain(nodeIndex: number): number[] {
      const chain: number[] = [];
      let current = nodeIndex;
      while (current >= 0 && current < nodeParents.length && !chain.includes(current)) {
        chain.push(current);
        current = nodeParents[current];
      }
      return chain;
    }
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
      activeCameraRotation: null,
      onPointerSet: options.onPointerSet as ((pointer: string, value: unknown) => void) | undefined
    };

    const effects: SchedulerEffects<FlowCont> = {
      fireFlow(cont) {
        cont();
      },
      applyAnimationSample(animationIndex, requestedTime) {
        const result = applyAnimationAt({ gltf, glbBin }, animationIndex, requestedTime, (pointer, value) => {
          options.onPointerSet?.(pointer, value);
        });
        if (!result) {
          return;
        }
        animationPlayheads.set(animationIndex, { playhead: result.t, virtualPlayhead: requestedTime });
      },
      setPointer(pointer, value) {
        writePointerRaw(gltf, pointer, value);
        options.onPointerSet?.(pointer, value as number[] | boolean[] | number | boolean);
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
        if (Array.isArray(decls)) {
          for (const decl of decls) {
            varTypes.push(decl.type);
            varRaw.push(decl.initial);
          }
          return undefined;
        }
        const V: Record<string, RawValue> = {};
        for (const [name, decl] of Object.entries(decls)) {
          const idx = varTypes.length;
          varTypes.push(decl.type);
          varRaw.push(decl.initial);
          // Bind `V.<name>` straight to this variable's store slot — a
          // plain read/assignment in generated code (`V.counter1`/
          // `V.counter1 = v`) goes through this getter/setter with no
          // intermediate accessor object at all.
          Object.defineProperty(V, name, {
            enumerable: true,
            get: () => varRaw[idx],
            set: (value: RawValue) => { varRaw[idx] = value; }
          });
        }
        return V;
      },
      getVar(index) {
        return varRaw[index];
      },
      setVar(index, value) {
        varRaw[index] = value;
      },
      events(decls) {
        if (Array.isArray(decls)) {
          eventDecls.push(...decls);
          return undefined;
        }
        const E: Record<string, number> = {};
        for (const [name, decl] of Object.entries(decls)) {
          const idx = eventDecls.length;
          eventDecls.push(decl);
          E[name] = idx;
        }
        return E;
      },
      int: (x = 0) => ({ type: "int", initial: Math.trunc(x) }),
      bool: (x = false) => ({ type: "bool", initial: x }),
      float: (x = 0) => ({ type: "float", initial: x }),
      float2: (x = 0, y = 0) => ({ type: "float2", initial: [x, y] }),
      float3: (x = 0, y = 0, z = 0) => ({ type: "float3", initial: [x, y, z] }),
      float4: (x = 0, y = 0, z = 0, w = 0) => ({ type: "float4", initial: [x, y, z, w] }),
      float2x2: (...values) => ({ type: "float2x2", initial: values.length > 0 ? values : [1, 0, 0, 1] }),
      float3x3: (...values) => ({ type: "float3x3", initial: values.length > 0 ? values : [1, 0, 0, 0, 1, 0, 0, 0, 1] }),
      float4x4: (...values) => ({
        type: "float4x4",
        initial: values.length > 0 ? values : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
      }),
      ref: (pointer = "") => ({ type: "ref", initial: pointer }),
      withId: (_id, decl) => decl,
      doNState: () => ({ count: 0 }),
      multiGateState: () => ({ lastIndex: -1, used: [] }),
      waitAllState: () => ({ activated: [], remaining: undefined }),
      throttleState: () => ({ lastTime: undefined, remaining: NaN }),
      delayState: () => ({ lastId: -1, lastRef: "", ids: [] }),
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
      onSelect(nodeIndex, stopPropagation, fn) {
        const list = selectHandlers.get(nodeIndex) ?? [];
        list.push({ fn, stopPropagation });
        selectHandlers.set(nodeIndex, list);
      },
      onHoverIn(nodeIndex, fn) {
        const list = hoverInHandlers.get(nodeIndex) ?? [];
        list.push(fn);
        hoverInHandlers.set(nodeIndex, list);
      },
      onHoverOut(nodeIndex, fn) {
        const list = hoverOutHandlers.get(nodeIndex) ?? [];
        list.push(fn);
        hoverOutHandlers.set(nodeIndex, list);
      },
      send(eventIndex, secondArg, thirdArg) {
        const decl = eventDecls[eventIndex];
        const payload: [boolean, number, number, number] = Array.isArray(secondArg)
          ? secondArg
          : Array.isArray(thirdArg)
            ? thirdArg
            : [decl?.defaultBool ?? false, decl?.defaultInt ?? 0, decl?.defaultFloat ?? 0, decl?.expectedDuration ?? 0];
        const externalId = decl?.externalId;
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
      ptrGet(pointer, argsOrType, type) {
        if (typeof argsOrType === "string") {
          return resolvePtrGet(pointerHost, pointer, {}, argsOrType);
        }
        return resolvePtrGet(pointerHost, pointer, argsOrType, type as ValueType);
      },
      ptrSet(pointer, argsOrType, typeOrValue, value) {
        if (typeof argsOrType === "string") {
          return resolvePtrSet(pointerHost, pointer, {}, argsOrType, typeOrValue);
        }
        return resolvePtrSet(pointerHost, pointer, argsOrType, typeOrValue as ValueType, value);
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
      ptrInterp(pointer, argsOrType, typeOrValue, valueOrDuration, durationOrP1, p1OrP2, p2OrDone, doneMaybe) {
        // See ptrGet/ptrSet's identical dispatch: `argsOrType` being a
        // string means the args object was omitted (every pointer-template
        // param was a compile-time constant, already inlined into `pointer`
        // itself — see emit-ts's pointerCall) and every following parameter
        // shifts left by one.
        let args: Record<string, unknown>;
        let type: ValueType;
        let value: RawValue;
        let duration: number;
        let p1: number[];
        let p2: number[];
        let done: FlowCont | undefined;
        if (typeof argsOrType === "string") {
          args = {};
          type = argsOrType;
          value = typeOrValue as RawValue;
          duration = valueOrDuration as number;
          p1 = durationOrP1 as number[];
          p2 = p1OrP2;
          done = p2OrDone as FlowCont | undefined;
        } else {
          args = argsOrType;
          type = typeOrValue as ValueType;
          value = valueOrDuration as RawValue;
          duration = durationOrP1 as number;
          p1 = p1OrP2;
          p2 = p2OrDone as number[];
          done = doneMaybe;
        }
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
        return decision.fire;
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
      },
      fireSelect(nodeIndex, point, rayOrigin, controllerIndex = 0) {
        if (nodeIndex < 0) {
          return;
        }
        const params: SelectParams = {
          selectedNode: `/nodes/${nodeIndex}`,
          selectedNodeIndex: nodeIndex,
          controllerIndex,
          selectionPoint: [...point],
          selectionRayOrigin: rayOrigin ? [...rayOrigin] : [Number.NaN, Number.NaN, Number.NaN]
        };
        // Deepest-first bubbling with a symmetric stopPropagation
        // short-circuit — see EngineInteractive.fireSelect's doc comment
        // and host.ts's triggerNodeEvent (enhanced the same way for parity).
        for (const target of ancestorChain(nodeIndex)) {
          const handlers = selectHandlers.get(target);
          if (!handlers || handlers.length === 0) {
            continue;
          }
          let stopped = false;
          for (const handler of handlers) {
            handler.fn(params);
            if (handler.stopPropagation) {
              stopped = true;
            }
          }
          if (stopped) {
            break;
          }
        }
      },
      fireHoverIn(nodeIndex, point, controllerIndex = 0) {
        const previous = hoverIndex;
        if (nodeIndex === previous) {
          return;
        }
        hoverIndex = nodeIndex;
        const prevChain = new Set(ancestorChain(previous));
        const nextChain = new Set(ancestorChain(nodeIndex));
        if (previous >= 0) {
          const outParams: HoverParams = { hoveredNode: `/nodes/${previous}`, controllerIndex };
          for (const target of ancestorChain(previous)) {
            if (nextChain.has(target)) {
              continue;
            }
            for (const handler of hoverOutHandlers.get(target) ?? []) {
              handler(outParams);
            }
          }
        }
        if (nodeIndex >= 0) {
          const inParams: HoverParams = { hoveredNode: `/nodes/${nodeIndex}`, controllerIndex };
          for (const target of ancestorChain(nodeIndex)) {
            if (prevChain.has(target)) {
              continue;
            }
            for (const handler of hoverInHandlers.get(target) ?? []) {
              handler(inParams);
            }
          }
        }
        void point; // reserved for a future hoverPoint pointer bridge; unused by onHoverIn/Out's current output sockets.
      },
      fireHoverOut() {
        this.fireHoverIn(-1);
      }
    };
  };
}
