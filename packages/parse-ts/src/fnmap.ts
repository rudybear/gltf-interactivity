// Reverse of @gltfi/emit-ts's `m.*` function-name selection (emit.ts's
// baseMName/mFunctionName/ARITH_INT_OPS/BOOL_INT_OPS): given a `m.<fn>` call
// name found in emitted TypeScript, recover the (op, overloadIndex) pair it
// was generated from. Built once at module load by re-running emit.ts's own
// naming rule forward over every (op, overloadIndex) row in @gltfi/kernel's
// OP_REGISTRY and inverting the resulting table — this keeps the two
// directions mechanically in sync (any change to emit.ts's naming rule that
// isn't mirrored here shows up as a build-time assertion failure, not a
// silent parse divergence).
import { OP_REGISTRY, type TypeSig } from "@gltfi/kernel";

const ARITH_INT_OPS = new Set(["abs", "sign", "neg", "add", "sub", "mul", "div", "rem", "min", "max", "clamp"]);
const BOOL_INT_OPS = new Set(["and", "or", "not", "xor"]);

function baseMName(op: string): string {
  if (op === "ref/eq") {
    return "refEq";
  }
  const short = op.split("/")[1];
  return short ?? op;
}

// Row-level stand-in for emit.ts's `primaryInputSig(overload)`: emit.ts reads
// the RESOLVED concrete type of socket "a" (or the first input) off a
// ResolvedOverload; naming only ever branches on whether that's "int"/"bool"
// vs anything else, and a row's declared (possibly generic) type for that
// same socket already carries that distinction (a generic F/V/M/T socket is
// never "int" or "bool"), so the raw declared row type is sufficient here.
function primaryRowSig(row: { inputs: Array<{ name: string; type: string }> }): string {
  const a = row.inputs.find((i) => i.name === "a");
  return (a ?? row.inputs[0])?.type ?? "float";
}

function mFunctionNameForRow(op: string, overloadIndex: number, row: { inputs: Array<{ name: string; type: string }> }): string {
  const base = baseMName(op);
  const primary = primaryRowSig(row);
  if (op === "math/eq") {
    return primary === "bool" ? "eqBool" : primary === "int" ? "eqInt" : "eq";
  }
  if ((ARITH_INT_OPS.has(base) || BOOL_INT_OPS.has(base)) && primary === "int") {
    return `${base}Int`;
  }
  return base;
}

export type FnCandidate = { op: string; overloadIndex: number; argCount: number };

const FN_TABLE = new Map<string, FnCandidate[]>();

for (const spec of OP_REGISTRY.values()) {
  if (spec.purity === "flow") {
    continue;
  }
  spec.overloads.forEach((row, overloadIndex) => {
    const fn = mFunctionNameForRow(spec.op, overloadIndex, row);
    const list = FN_TABLE.get(fn) ?? [];
    list.push({ op: spec.op, overloadIndex, argCount: row.inputs.length });
    FN_TABLE.set(fn, list);
  });
}

// math/random has no `m.*` entry (it's `rt.random()`); nothing else to add.

// Returns every (op, overloadIndex) row whose emitted function name is
// `fnName` and whose declared arg count matches — usually exactly one, but
// ops with no int-suffixed sibling (lt/le/gt/ge, the bitwise-only ops —
// see emit-ts/src/math.ts's header note: "lt/le/gt/ge and the bitwise-only
// ops have no int suffix... one function covers both") have TWO: a float
// row and an int row sharing the same name. Callers must disambiguate
// among the results using the actual argument types (see
// index.ts's lowerMCall) — silently picking the first candidate here
// previously caused a real bug (an int comparison like `m.lt(intVar, 2)`
// always resolved to the float row, mistyping the literal `2` as float
// instead of int).
export function lookupMFunctions(fnName: string, argCount: number): FnCandidate[] {
  const candidates = FN_TABLE.get(fnName);
  if (!candidates || candidates.length === 0) {
    return [];
  }
  const exact = candidates.filter((c) => c.argCount === argCount);
  return exact.length > 0 ? exact : candidates;
}

export function socketTypeSig(op: string, overloadIndex: number, socketName: string, direction: "input" | "output"): TypeSig | undefined {
  const spec = OP_REGISTRY.get(op);
  const row = spec?.overloads[overloadIndex];
  if (!row) {
    return undefined;
  }
  const sockets = direction === "input" ? row.inputs : row.outputs;
  const socket = sockets.find((s) => s.name === socketName);
  return socket ? (socket.type as TypeSig) : undefined;
}

export function isGenericSig(t: string | undefined): t is "F" | "V" | "M" | "T" {
  return t === "F" || t === "V" || t === "M" || t === "T";
}
