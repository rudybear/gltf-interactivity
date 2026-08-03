// IR model for @gltfi/ir. See docs/design/ir-and-transpiler.md for the design
// rationale. This module is data-only (discriminated-union types + no logic)
// so every other module (import/check/print, and later emit-ts/export) shares
// one vocabulary.
//
// Deviations from the doc's literal model (all additive, all justified in the
// @gltfi/ir import.ts header comment and the task report):
//  - `op` (IRExpr) gained an optional `socket` field: several pure ops have
//    more than one meaningful output (math/normalize+isValid, math/inverse+
//    isValid, math/extractN's "0".."N-1", math/quatToAxisAngle axis+angle,
//    math/matDecompose, math/rgbToOkLCh/rgbFromOkLCh's 3 named outputs). The
//    doc's `op` shape has no way to say *which* output a given read selects;
//    `socket` (defaulting to "value") fixes that without disturbing the
//    common single-output case.
//  - IRExpr gained an `intrinsic` variant mirroring IRStmt's escape hatch
//    (the doc's stated design principle "Intrinsic is the escape hatch" is
//    general, but the model section only wrote the variant into IRStmt).
//    Needed for math/switch: its per-case value sockets are configSockets-
//    driven (not part of the fixed overload row `op` assumes), so it can't
//    be expressed as a plain `op` node.
//  - `param` and `stateRead` gained a `type: IRType` field (the doc's literal
//    shapes omit it). check.ts needs a type to check against without redoing
//    resolution work, and the importer already knows it at construction time.
//  - `stopPropagation` gained `stopImmediate: IRExpr` — the doc's shape has
//    only `config`, but stopImmediate is a normal wired bool input in real
//    graphs (not always a literal); dropping it would silently change
//    behavior. `event` (the op's other input) is not modeled explicitly: in
//    every real graph it is wired to the enclosing handler's own `event`
//    param, so the importer verifies that and warns (not errors) otherwise.
//  - `async` gained optional `config` (variable/interpolate's target varId +
//    useSlerp — there is nowhere else in the doc's shape to put them) and
//    `template` (pointer/interpolate's pointer template — same problem as
//    setPointer's, which the doc already solved with a `template` field on
//    that stmt but omitted from `async`).
import type { ResolvedOverload, TypeSig, Value } from "@gltfi/kernel";

export type IRType =
  | "bool"
  | "int"
  | "float"
  | "float2"
  | "float3"
  | "float4"
  | "float2x2"
  | "float3x3"
  | "float4x4"
  | "ref";

export type ConstData = Array<number | boolean | string>;

// Reuses @gltfi/kernel's tagged value shape verbatim (ValueType is the same
// union as IRType minus "custom", which never appears as a resolved concrete
// type): one fewer type to keep in sync, and importer code can hand kernel's
// own `toValue`/`defaultValue` helpers straight through.
export type Const = Value;

export type TempId = string;

// Index into IRModule.stateSlots.
export interface StateRef {
  slot: number;
}

export type PtrSegment =
  | { k: "lit"; text: string }
  | { k: "int"; name: string }
  | { k: "ref"; name: string };

export interface PtrTemplate {
  segments: PtrSegment[];
}

export interface IRVariable {
  name: string;
  type: IRType;
  initial: Const;
  extras?: Record<string, unknown>;
}

export interface IREventValue {
  name: string;
  type: IRType;
  default: Const;
}

export interface IREvent {
  name: string;
  id?: string;
  values: IREventValue[];
}

export type StateKind = "doN" | "multiGate" | "waitAll" | "throttle" | "for" | "delay";

export interface IRStateSlot {
  name: string;
  kind: StateKind;
  config: Record<string, unknown>;
}

export type HandlerKind = "onStart" | "onTick" | "receive" | "onSelect" | "onHoverIn" | "onHoverOut";

export interface IRHandlerParam {
  name: string;
  type: IRType;
}

export interface IRHandler {
  kind: HandlerKind;
  eventRef?: number;
  config?: Record<string, unknown>;
  params: IRHandlerParam[];
  body: IRStmt;
}

export interface IRProc {
  id: number;
  name: string;
  body: IRStmt;
}

// A continuation reached asynchronously (only `async.done` uses this): either
// inlined directly (safe — per-site temps never leak across sites, so an
// inlined done-body can never see a caller temporary) or a call to a proc.
export type Cont = { kind: "inline"; body: IRStmt } | { kind: "proc"; procId: number };

export type IRStmt =
  | { k: "seq"; stmts: IRStmt[] }
  | { k: "let"; temp: TempId; type: IRType; expr: IRExpr }
  | { k: "if"; cond: IRExpr; then: IRStmt; else?: IRStmt }
  | { k: "while"; cond: IRExpr; body: IRStmt; completed?: IRStmt }
  | { k: "for"; slot?: StateRef; start: IRExpr; end: IRExpr; body: IRStmt; completed?: IRStmt }
  | { k: "switch"; selector: IRExpr; cases: Array<[number, IRStmt]>; default?: IRStmt }
  | { k: "setVar"; varId: number; expr: IRExpr }
  // `type` is the pointer's configured value signature (same concept as
  // ptrGet's `valueType` — see that field's doc comment) — the resolver
  // needs it to know what shape/kind to validate+coerce the written value
  // against; there's no other field on this shape that carries it.
  | { k: "setPointer"; template: PtrTemplate; args: IRExpr[]; value: IRExpr; type: IRType; out?: IRStmt; err?: IRStmt }
  | { k: "emitEvent"; eventId: number; args: IRExpr[] }
  | { k: "stopPropagation"; stopImmediate: IRExpr; config: Record<string, unknown> }
  | { k: "log"; template: string; args: IRExpr[] }
  | { k: "callProc"; procId: number }
  | {
      k: "async";
      kind: "setDelay" | "varInterp" | "ptrInterp" | "animStart" | "animStop" | "animStopAt";
      slot?: StateRef;
      // varInterp: { varId: number; useSlerp: boolean }. Everything else: {}.
      config?: Record<string, unknown>;
      // ptrInterp only: args[0..3] are [value,duration,p1,p2] (fixed, same as
      // variable/interpolate's overload) and args[4..] are the pointer
      // template's params in template order (pointerTemplateParams(template)
      // gives the split point).
      template?: PtrTemplate;
      // ptrInterp only: the pointer's configured value signature — same
      // concept as ptrGet's `valueType` / setPointer's `type` (see those
      // fields' doc comments): needed to validate+read the CURRENT pointer
      // value at interpolation-start time, and nowhere else on this shape
      // carries it.
      type?: IRType;
      args: IRExpr[];
      done?: Cont;
      out?: IRStmt;
      err?: IRStmt;
    }
  | {
      k: "stateful";
      kind: "doN" | "multiGate" | "waitAll" | "throttle";
      slot: StateRef;
      port: "in" | "reset" | number;
      args: IRExpr[];
      outs: Record<string, IRStmt>;
    }
  | { k: "intrinsic"; op: string; config: Record<string, unknown>; args: IRExpr[]; outs: Record<string, IRStmt> };

export type IRExpr =
  | { k: "const"; type: IRType; data: ConstData }
  | { k: "varGet"; varId: number }
  // `type` is this expression's own result type (checked/consumed as such by
  // check.ts's inferExprType — "bool" when wantIsValid is set). `valueType`
  // is always the pointer's *configured* value signature (independent of
  // wantIsValid) — the type the resolver validates the resolved raw value
  // against; a `pointer/get` node's isValid output reflects whether
  // resolution against ITS OWN configured type succeeded, not "bool", so
  // losing that signature at the isValid read site would make isValid always
  // false (see runtime-lib/pointer.ts's ptrGet: it needs the real signature
  // to validate against, not the boolean result type).
  | { k: "ptrGet"; template: PtrTemplate; args: IRExpr[]; type: IRType; valueType: IRType; wantIsValid?: boolean }
  | { k: "param"; name: string; type: IRType }
  // `config` carries an op's plain (non-configSockets) config field values
  // when present (e.g. math/quatFromAngles's "order") — needed because
  // those fields affect fixed op behavior but never appear as wired value
  // sockets, so nothing else in this shape would preserve them. Additive:
  // omitted (undefined) for the vast majority of ops that have no config.
  | { k: "op"; op: string; overload: ResolvedOverload; args: IRExpr[]; socket?: string; config?: Record<string, unknown> }
  | { k: "temp"; id: TempId }
  | { k: "stateRead"; slot: StateRef; field: string; type: IRType }
  | { k: "intrinsic"; op: string; config: Record<string, unknown>; args: IRExpr[]; type: IRType };

export interface IRModule {
  variables: IRVariable[];
  events: IREvent[];
  stateSlots: IRStateSlot[];
  handlers: IRHandler[];
  procs: IRProc[];
  meta: {
    nameMaps: {
      variables: string[];
      events: string[];
      stateSlots: string[];
      procs: string[];
    };
    // Keys: "handler:<index>", "proc:<id>", "stateSlot:<index>", "temp:<name>"
    // -> original graph node index the IR entity was raised from. Temp names
    // are only unique *within* one handler/proc body (see names.ts), so a
    // "temp:<name>" key reflects whichever body's temp of that name was
    // built last — fine for the map's intended debugging use, not a
    // globally unambiguous index.
    sourceNodeIds: Record<string, number>;
    extras?: Record<string, unknown>;
  };
}

export type Diagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  nodeIndex?: number;
};

// Shared TypeSig -> IRType coercion: identical unions except TypeSig also has
// "custom", which resolveOverload never actually assigns to a resolved
// input/output (it only ever echoes back a concrete type supplied by a real
// wired value) — kept as a defensive fallback, not a real code path.
export function typeSigToIRType(t: TypeSig): IRType {
  return t === "custom" ? "ref" : t;
}
