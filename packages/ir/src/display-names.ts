// Shared display-name computation for the readable emitters (@gltfi/emit-ts,
// @gltfi/emit-lua, @gltfi/emit-py): turns @gltfi/ir's own internal, graph-
// node-id-derived names (module.stateSlots[i].name, module.variables[i].name)
// into short, human-friendly identifiers for GENERATED CODE ONLY — the IR's
// own names are left untouched (still used for nothing but import.ts's own
// within-module de-duplication). Lives here (not copy-pasted three times, not
// re-exported from @gltfi/emit-ts) because every backend that wants readable
// output needs the exact same answer for the exact same IRModule — see each
// emitter's own header note ("Readability pass") for the full rationale, and
// the task report for the cross-backend mirroring decision.
import type { IRExpr, IRModule, IRStateSlot, IRStmt } from "./model.js";

// ---------------------------------------------------------------------------
// State-slot display names: `<kind><N>` (doN1, gate2, waitAll1, throttle3,
// delay1, for1 — sequential PER KIND, in the module's own declaration
// order), replacing the IR's internal graph-node-id-derived names
// (`module.stateSlots[i].name`, e.g. "doN375130172") for the purposes of
// emitted code only.
// ---------------------------------------------------------------------------

const STATE_DISPLAY_PREFIX: Record<IRStateSlot["kind"], string> = {
  doN: "doN",
  multiGate: "gate",
  waitAll: "waitAll",
  throttle: "throttle",
  for: "for",
  delay: "delay"
};

export function computeStateSlotDisplayNames(slots: IRStateSlot[]): string[] {
  const counters: Record<string, number> = {};
  return slots.map((slot) => {
    const prefix = STATE_DISPLAY_PREFIX[slot.kind];
    counters[prefix] = (counters[prefix] ?? 0) + 1;
    return `${prefix}${counters[prefix]}`;
  });
}

// ---------------------------------------------------------------------------
// Variable display names: most graph-authored variable ids are genuinely
// meaningful ("TestResult_HasPassed_...") and are kept exactly as @gltfi/ir
// already sanitized them. Some authoring tools instead assign raw UUIDs
// (e.g. "467a7f10-2a70-49b0-ac90-a045449a37e9"), which sanitize to noisy
// identifiers like "_467a7f10_2a70_49b0_ac90_a045449a37e9" — no more
// readable than the index-addressed form this whole rewrite is trying to
// get away from. Detect that pattern from the ORIGINAL id (module.
// variables[i].extras.id — before @gltfi/ir's own sanitizing) and fall back
// to a short synthetic name instead: `counter<N>` when the variable is an
// int that's ever incremented by exactly 1 (a cheap, common "flow counter"
// intent signal — see detectCounterVarIds), else plain `var<N>`.
// ---------------------------------------------------------------------------

// A UUID (or similarly-generated hex id) stripped of its usual separators is
// a long run of *only* hex digits — no genuinely-authored name is ever
// exclusively [0-9a-f] for 20+ characters, so this is a safe, cheap
// heuristic with no real false-positive risk against the conformance corpus.
export function isUuidLikeId(rawId: string): boolean {
  const stripped = rawId.replace(/[-_]/g, "");
  return stripped.length >= 20 && /^[0-9a-f]+$/i.test(stripped);
}

// Variable ids that are ever the target of `setVar(id, add(varGet(id), 1))`
// (either argument order) anywhere in the module — a cheap, purely
// structural signal that a variable is being used as a flow counter,
// independent of which native-operator substitution (if any) a given
// backend renders that add with. Only considered for `int`-typed variables
// (a "counter" reads oddly for a float/bool/vector).
export function detectCounterVarIds(module: IRModule): Set<number> {
  const result = new Set<number>();
  const isIncrement = (expr: IRExpr, varId: number): boolean => {
    if (expr.k !== "op" || expr.op !== "math/add") {
      return false;
    }
    const [a, b] = expr.args;
    const isThisVar = (e: IRExpr) => e.k === "varGet" && e.varId === varId;
    const isOne = (e: IRExpr) => e.k === "const" && e.type === "int" && Number(e.data[0]) === 1;
    return (isThisVar(a) && isOne(b)) || (isThisVar(b) && isOne(a));
  };
  const visitStmt = (stmt: IRStmt) => {
    switch (stmt.k) {
      case "setVar":
        if (module.variables[stmt.varId]?.type === "int" && isIncrement(stmt.expr, stmt.varId)) {
          result.add(stmt.varId);
        }
        return;
      case "seq":
        stmt.stmts.forEach(visitStmt);
        return;
      case "if":
        visitStmt(stmt.then);
        if (stmt.else) visitStmt(stmt.else);
        return;
      case "while":
        visitStmt(stmt.body);
        if (stmt.completed) visitStmt(stmt.completed);
        return;
      case "for":
        visitStmt(stmt.body);
        if (stmt.completed) visitStmt(stmt.completed);
        return;
      case "switch":
        stmt.cases.forEach(([, body]) => visitStmt(body));
        if (stmt.default) visitStmt(stmt.default);
        return;
      case "setPointer":
        if (stmt.out) visitStmt(stmt.out);
        if (stmt.err) visitStmt(stmt.err);
        return;
      case "async":
        if (stmt.out) visitStmt(stmt.out);
        if (stmt.err) visitStmt(stmt.err);
        if (stmt.done?.kind === "inline") visitStmt(stmt.done.body);
        return;
      case "stateful":
        Object.values(stmt.outs).forEach(visitStmt);
        return;
      case "intrinsic":
        Object.values(stmt.outs).forEach(visitStmt);
        return;
      default:
        return;
    }
  };
  for (const h of module.handlers) visitStmt(h.body);
  for (const p of module.procs) visitStmt(p.body);
  return result;
}

export function computeVariableDisplayNames(module: IRModule): string[] {
  const counterVarIds = detectCounterVarIds(module);
  const isUuidLike = module.variables.map((v) => {
    const rawId = (v.extras as { id?: string } | undefined)?.id;
    return rawId !== undefined && isUuidLikeId(rawId);
  });
  const used = new Set<string>();
  module.variables.forEach((v, i) => {
    if (!isUuidLike[i]) {
      used.add(v.name);
    }
  });
  const seqCounters: Record<string, number> = {};
  const allocSeq = (prefix: string): string => {
    let n = (seqCounters[prefix] ?? 0) + 1;
    let candidate = `${prefix}${n}`;
    while (used.has(candidate)) {
      n += 1;
      candidate = `${prefix}${n}`;
    }
    seqCounters[prefix] = n;
    used.add(candidate);
    return candidate;
  };
  return module.variables.map((v, i) => {
    if (!isUuidLike[i]) {
      return v.name;
    }
    return allocSeq(counterVarIds.has(i) ? "counter" : "var");
  });
}
