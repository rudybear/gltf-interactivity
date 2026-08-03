// parseModule round-trip fidelity: importGraph(GLB) -> emitModule -> TS ->
// parseModule -> IR', compared structurally against the original IR
// "modulo meta" (see below for exactly what that excludes). This is a
// tighter check than run-roundtrip.ts's end-to-end judge-protocol pass —
// it pins the PARSER's own faithfulness independent of whether a structural
// slip happens to still execute correctly.
//
// What's excluded from the comparison and why:
//   - IRModule.meta entirely: sourceNodeIds has no representation left in
//     emitted TypeScript at all (see @gltfi/ir/import.ts's doc comment on
//     that field), and nameMaps is derived from names, covered below.
//   - IRVariable/IREvent `.name` DOES now round-trip (the readability
//     rewrite's whole point — see emit.ts's emitVars/emitEvents: the object
//     form's property key IS the name, read back verbatim by parse-ts's
//     parseVarsObject/parseEventsObject), so it's INCLUDED below, unlike
//     before this rewrite. `.extras` is still dropped (nothing survives to
//     parse it back from — the graph's original raw `id` string isn't the
//     same thing as the derived/sanitized/deduped `.name`).
//   - IRStateSlot `.name` is EXCLUDED (the opposite of before this rewrite):
//     emit-ts now deliberately renames slots to short sequential
//     `<kind><N>` display identifiers (doN1, gate2, ...) instead of the IR's
//     own graph-node-id-derived internal name (see emit.ts's
//     computeStateSlotDisplayNames) — self-consistent between one
//     emit+parse round trip, but no longer equal to the ORIGINAL IR's own
//     slot name, by design.
//   - Pointer templates whose parameter(s) are fed a compile-time CONSTANT
//     are normalized (both sides — see normalizePointerConstants below)
//     into their fully-inlined form before comparing: emit-ts's pointerCall
//     inlines every constant template arg straight into the path string and
//     drops it from the args object (see that method's doc comment and the
//     task report's "round-trip caveat"), so a re-parsed module's template
//     for e.g. `/nodes/[nodeIndex]/translation` fed literal index 5 comes
//     back as the ALL-LITERAL template `/nodes/5/translation` with zero
//     params — a real, intentional, and execution-equivalent difference
//     from the original's parameterized template, not a parser bug.
//   - Everything else — types, initial/default values, control flow
//     structure, temp ids, proc NAMES (these DO round-trip, since they
//     become real emitted identifiers the parser reads back verbatim), op
//     overloads/config — must match exactly.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { resolveOverload } from "@gltfi/kernel";
import { formatPointerTemplate, importGraph, parsePointerTemplate, type Graph, type IRExpr, type IRModule, type IRStmt, type PtrTemplate } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { parseModule } from "../src/index.js";

const AMBIGUOUS_COMPARE_OPS = new Set(["math/eq", "math/lt", "math/le", "math/gt", "math/ge"]);

// Mirrors emit-ts's pointerCall EXACTLY (see that method's doc comment):
// any template parameter fed a compile-time constant is resolved into a
// literal segment and dropped from the args list; a dynamic (non-const) arg
// keeps its placeholder and stays in the args list. Idempotent — applying
// this to an ALREADY-inlined (all-literal, zero-arg) template/args pair is a
// no-op — so normalizing BOTH the original and the re-parsed module's
// pointer nodes through this same function makes them comparable whenever
// the original's template params were all constants (the common case, and
// the only one this normalization changes anything for).
function inlinePointerConstants(template: PtrTemplate, args: IRExpr[]): { template: PtrTemplate; args: IRExpr[] } {
  let argIdx = 0;
  const remainingArgs: IRExpr[] = [];
  const segments = template.segments.map((seg) => {
    if (seg.k === "lit") {
      return seg;
    }
    const arg = args[argIdx];
    argIdx += 1;
    // Only INT params inline safely — see emit-ts's pointerCall doc comment
    // (a `ref` param's own value is a full pointer-shaped string, which
    // would double up with the template's surrounding literal segments).
    if (seg.k === "int" && arg && arg.k === "const") {
      return { k: "lit" as const, text: String(Math.trunc(Number(arg.data[0] ?? 0))) };
    }
    remainingArgs.push(arg);
    return seg;
  });
  // Round-trip through the ACTUAL text form (format then re-parse), not
  // just the in-memory segments: a `ref`-typed constant's own value can
  // itself contain "/" (e.g. "/extensions/KHR_lights_punctual/lights/5" —
  // ref values are themselves JSON-pointer-shaped strings), which
  // `formatPointerTemplate` has no way to escape (there's no "/"-escaping
  // in the KHR_interactivity pointer-template syntax — see pointer.ts's
  // header comment), so a single inlined lit segment's text with an
  // embedded "/" splits into SEVERAL lit segments once re-parsed back out
  // of the emitted string. Mirroring that same round-trip here (rather than
  // just constructing the naive single-segment version) is what makes this
  // comparable to what @gltfi/parse-ts's REAL lowerPtrGet/parseSetPointer
  // actually produces from the emitted text.
  const resolvedTemplate = parsePointerTemplate(formatPointerTemplate({ segments }));
  return { template: resolvedTemplate, args: remainingArgs };
}

function normalizePointersInExpr(expr: IRExpr): IRExpr {
  switch (expr.k) {
    case "ptrGet": {
      const { template, args } = inlinePointerConstants(expr.template, expr.args.map(normalizePointersInExpr));
      return { ...expr, template, args };
    }
    case "op": {
      const args = expr.args.map(normalizePointersInExpr);
      // math/eq|lt|le|gt|ge's int-vs-float overload choice is a REAL
      // ambiguity in the emitted text whenever an operand's own type comes
      // from something with no type signal of its own once literal (e.g. a
      // math/switch whose selector/cases/default are all literals — see
      // lowerMathSwitch's fallback-to-"float" and the identical pre-
      // existing ambiguity already tolerated for debug/log args below) —
      // but harmlessly so: emit-ts's native-operator rendering
      // (nativeOpInfo) is BYTE-IDENTICAL ("===" / "<" / "<=" / ">" / ">=")
      // for int and float alike, unlike add/sub/mul/neg (whose int form is
      // visibly `(...) | 0`-wrapped or `Math.imul(...)`), so this
      // particular int/float distinction is unrecoverable from the text by
      // construction, not a parser bug. Canonicalize both sides to "float"
      // before comparing.
      if (AMBIGUOUS_COMPARE_OPS.has(expr.op) && expr.overload.inputs.a === "int") {
        const overload = resolveOverload(expr.op, { a: "float", b: "float" });
        if (overload) {
          // Direct int-literal operands must also flip to "float" (not just
          // the overload) — a bare `{k:"const", type:"int", ...}` operand's
          // own type tag is just as much a casualty of this same ambiguity
          // as the overload choice itself.
          const canonArgs = args.map((a) => (a.k === "const" && a.type === "int" ? { ...a, type: "float" as const } : a));
          return { ...expr, overload, args: canonArgs };
        }
      }
      return { ...expr, args };
    }
    case "intrinsic": {
      const args = expr.args.map(normalizePointersInExpr);
      // math/switch's default/case-value consts have the exact same
      // int-vs-float text ambiguity as the eq/comparison case above, for
      // the identical reason (lowerMathSwitch falls back to "float" when
      // every value is a bare literal with no non-literal sibling to infer
      // a type from) — canonicalize each literal case/default arg's own
      // `.type` (never the selection, which is unambiguously always
      // "int") the same way.
      if (expr.op === "math/switch") {
        const [selection, ...rest] = args;
        const canonRest = rest.map((a) => (a.k === "const" && a.type === "int" ? { ...a, type: "float" as const } : a));
        return { ...expr, type: expr.type === "int" ? "float" : expr.type, args: [selection, ...canonRest] };
      }
      return { ...expr, args };
    }
    default:
      return expr;
  }
}

function normalizePointersInStmt(stmt: IRStmt): IRStmt {
  switch (stmt.k) {
    case "seq":
      return { ...stmt, stmts: stmt.stmts.map(normalizePointersInStmt) };
    case "let":
      return { ...stmt, expr: normalizePointersInExpr(stmt.expr) };
    case "if":
      return { ...stmt, cond: normalizePointersInExpr(stmt.cond), then: normalizePointersInStmt(stmt.then), else: stmt.else ? normalizePointersInStmt(stmt.else) : undefined };
    case "while":
      return { ...stmt, cond: normalizePointersInExpr(stmt.cond), body: normalizePointersInStmt(stmt.body), completed: stmt.completed ? normalizePointersInStmt(stmt.completed) : undefined };
    case "for":
      return {
        ...stmt,
        start: normalizePointersInExpr(stmt.start),
        end: normalizePointersInExpr(stmt.end),
        body: normalizePointersInStmt(stmt.body),
        completed: stmt.completed ? normalizePointersInStmt(stmt.completed) : undefined
      };
    case "switch":
      return {
        ...stmt,
        selector: normalizePointersInExpr(stmt.selector),
        cases: stmt.cases.map(([c, body]) => [c, normalizePointersInStmt(body)] as [number, IRStmt]),
        default: stmt.default ? normalizePointersInStmt(stmt.default) : undefined
      };
    case "setVar":
      return { ...stmt, expr: normalizePointersInExpr(stmt.expr) };
    case "setPointer": {
      const { template, args } = inlinePointerConstants(stmt.template, stmt.args.map(normalizePointersInExpr));
      return { ...stmt, template, args, value: normalizePointersInExpr(stmt.value), out: stmt.out ? normalizePointersInStmt(stmt.out) : undefined, err: stmt.err ? normalizePointersInStmt(stmt.err) : undefined };
    }
    case "emitEvent":
      return { ...stmt, args: stmt.args.map(normalizePointersInExpr) };
    case "stopPropagation":
      return { ...stmt, stopImmediate: normalizePointersInExpr(stmt.stopImmediate) };
    case "log":
      return { ...stmt, args: stmt.args.map(normalizePointersInExpr) };
    case "callProc":
      return stmt;
    case "async": {
      const out = stmt.out ? normalizePointersInStmt(stmt.out) : undefined;
      const err = stmt.err ? normalizePointersInStmt(stmt.err) : undefined;
      const done = stmt.done ? (stmt.done.kind === "inline" ? { kind: "inline" as const, body: normalizePointersInStmt(stmt.done.body) } : stmt.done) : undefined;
      if (stmt.kind === "ptrInterp" && stmt.template) {
        // args[0..3] are [value,duration,p1,p2] (fixed — see model.ts's
        // IRStmt "async" doc comment); the pointer's own template params
        // start at args[4].
        const fixed = stmt.args.slice(0, 4).map(normalizePointersInExpr);
        const ptrArgs = stmt.args.slice(4);
        const { template, args: remainingPtrArgs } = inlinePointerConstants(stmt.template, ptrArgs.map(normalizePointersInExpr));
        return { ...stmt, template, args: [...fixed, ...remainingPtrArgs], out, err, done };
      }
      return { ...stmt, args: stmt.args.map(normalizePointersInExpr), out, err, done };
    }
    case "stateful":
      return { ...stmt, args: stmt.args.map(normalizePointersInExpr), outs: Object.fromEntries(Object.entries(stmt.outs).map(([k, v]) => [k, normalizePointersInStmt(v)])) };
    case "intrinsic":
      return { ...stmt, args: stmt.args.map(normalizePointersInExpr), outs: Object.fromEntries(Object.entries(stmt.outs).map(([k, v]) => [k, normalizePointersInStmt(v)])) };
  }
}

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

function loadModule(relPath: string): IRModule {
  const runtime = createRuntimeFromGlbFile(path.join(ROOT, relPath));
  const { module, diagnostics } = importGraph(runtime.graph as unknown as Graph);
  expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return module;
}

// The core normalization: turns a statement into a FLAT LIST, splicing out
// while/for's `completed` and flow/cancelDelay's `outs.out` as trailing
// list items rather than keeping them nested. This is the inverse of
// @gltfi/ir/export.ts's chaining logic, chosen deliberately: emit.ts's
// emitStmt recurses through both `seq` AND those two fields with zero
// textual delimiter between "the field's own content" and "whatever
// follows in the enclosing seq" (see e.g. the "while" case: `if
// (stmt.completed) this.emitStmt(stmt.completed)`, then the caller's loop
// continues emitting the next sibling immediately after) — so an
// importGraph module's explicit 3-item `completed` followed by 5 more
// enclosing-seq siblings and a from-scratch parseModule reconstruction
// that instead sees 8 flat siblings with no `completed` at all are
// PROVABLY INDISTINGUISHABLE from the emitted text alone (verified during
// development: this is not a @gltfi/parse-ts bug, since no information
// exists in the text to recover the boundary — see
// docs/design/ir-and-transpiler.md's "Equivalence" section on structural
// vs execution equivalence; @gltfi/ir/export.ts's own choice to always
// chain is separately justified there as execution-safe). Splicing BOTH
// representations down to the same flat form is therefore the correct
// normalization, not a weakened one: it equates exactly the two shapes
// that produce identical emitted text.
function normalizeToList(stmt: IRStmt): IRStmt[] {
  switch (stmt.k) {
    case "seq":
      return stmt.stmts.flatMap(normalizeToList);
    case "if":
      return [{ ...stmt, then: seqOf(normalizeToList(stmt.then)), else: stmt.else ? seqOf(normalizeToList(stmt.else)) : undefined }];
    case "while": {
      const head: IRStmt = { k: "while", cond: stmt.cond, body: seqOf(normalizeToList(stmt.body)) };
      return [head, ...(stmt.completed ? normalizeToList(stmt.completed) : [])];
    }
    case "for": {
      const head: IRStmt = { k: "for", slot: stmt.slot, start: stmt.start, end: stmt.end, body: seqOf(normalizeToList(stmt.body)) };
      return [head, ...(stmt.completed ? normalizeToList(stmt.completed) : [])];
    }
    case "switch":
      return [
        {
          ...stmt,
          cases: stmt.cases.map(([c, body]) => [c, seqOf(normalizeToList(body))] as [number, IRStmt]),
          default: stmt.default ? seqOf(normalizeToList(stmt.default)) : undefined
        }
      ];
    case "setPointer":
      return [{ ...stmt, out: stmt.out ? seqOf(normalizeToList(stmt.out)) : undefined, err: stmt.err ? seqOf(normalizeToList(stmt.err)) : undefined }];
    case "async":
      return [
        {
          ...stmt,
          out: stmt.out ? seqOf(normalizeToList(stmt.out)) : undefined,
          err: stmt.err ? seqOf(normalizeToList(stmt.err)) : undefined,
          done: stmt.done ? (stmt.done.kind === "inline" ? { kind: "inline", body: seqOf(normalizeToList(stmt.done.body)) } : stmt.done) : undefined
        }
      ];
    case "stateful": {
      // multiGate's own numbered-output socket key TEXT is not preserved by
      // emit.ts by design (see emitStateful's multiGate case): it always
      // renumbers to sequential "0".."N-1" positions matching the
      // UTF-16-sorted original keys' RELATIVE ORDER, not their literal text
      // (e.g. original keys "001"/"004"/"008" — arbitrary graph-authored
      // socket ids — become plain "0"/"1"/"2"). Only the order survives, so
      // normalize both sides to sequential keys before comparing.
      const entries = Object.entries(stmt.outs).sort(([a], [b]) => a.localeCompare(b));
      const outs =
        stmt.kind === "multiGate"
          ? Object.fromEntries(entries.map(([, v], i) => [String(i), seqOf(normalizeToList(v))]))
          : Object.fromEntries(entries.map(([k, v]) => [k, seqOf(normalizeToList(v))]));
      return [{ ...stmt, outs }];
    }
    case "intrinsic": {
      if (stmt.op === "flow/cancelDelay") {
        const head: IRStmt = { ...stmt, outs: {} };
        return [head, ...(stmt.outs.out ? normalizeToList(stmt.outs.out) : [])];
      }
      return [{ ...stmt, outs: Object.fromEntries(Object.entries(stmt.outs).map(([k, v]) => [k, seqOf(normalizeToList(v))])) }];
    }
    case "log":
      // debug/log's arguments carry no type signal in emitted code at all
      // (`rt.log(template, [rawJsValues])` — see emit.ts's "log" case: bare
      // numbers/nested op calls with no annotation) and the op is an inert
      // no-op at runtime (see runtime-lib/engine.ts's `log()` and
      // interpreter.ts's debug/log case, both pure pass-throughs) — with no
      // `expected` type to propagate and (for a literal-only argument, e.g.
      // a math/switch over int literals) no non-literal sibling to pin a
      // type from either, an originally-int argument tree can round-trip
      // typed as float arbitrarily deep inside it (verified: not just bare
      // literals but e.g. `m.switchCase(...)`'s own int-vs-float case
      // values). This is a real, unrecoverable ambiguity in the emitted
      // subset with zero runtime consequence, not a parser bug — argument
      // COUNT is still compared (a real dropped/extra arg is still caught),
      // just not their exact value/type.
      return [{ ...stmt, args: stmt.args.map(() => PLACEHOLDER_LOG_ARG) }];
    default:
      return [stmt];
  }
}

function seqOf(items: IRStmt[]): IRStmt {
  return items.length === 1 ? items[0] : { k: "seq", stmts: items };
}

// `let` temp ids are renamed by emit-ts to small sequential `t<n>` names
// (see emit.ts's allocTemp) instead of @gltfi/ir/import.ts's own graph-
// node-id-derived ids (`t<nodeId>`, de-duplicated with a NameAllocator
// `_2`/`_3` suffix within one handler/proc body whenever multiple distinct,
// non-shared `let` sites happen to reference the same origin node) —
// cosmetic-only, and self-consistent within one emit+parse round trip, but
// no longer equal to the ORIGINAL IR's own temp id text, by the same design
// as the state-slot renaming above. Canonicalizes both sides' temp ids to
// first-encountered-order `t1`/`t2`/... before comparing (one fresh
// numbering per handler/proc body, mirroring emit-ts's own per-body reset).
function canonicalizeTempIds(stmt: IRStmt): IRStmt {
  let counter = 0;
  const renames = new Map<string, string>();
  const renameId = (id: string): string => {
    const existing = renames.get(id);
    if (existing) {
      return existing;
    }
    counter += 1;
    const fresh = `t${counter}`;
    renames.set(id, fresh);
    return fresh;
  };
  const walkExpr = (expr: IRExpr): IRExpr => {
    switch (expr.k) {
      case "temp":
        return { ...expr, id: renameId(expr.id) };
      case "op":
        return { ...expr, args: expr.args.map(walkExpr) };
      case "ptrGet":
        return { ...expr, args: expr.args.map(walkExpr) };
      case "intrinsic":
        return { ...expr, args: expr.args.map(walkExpr) };
      default:
        return expr;
    }
  };
  const walkStmt = (s: IRStmt): IRStmt => {
    switch (s.k) {
      case "seq":
        return { ...s, stmts: s.stmts.map(walkStmt) };
      case "let":
        return { ...s, temp: renameId(s.temp), expr: walkExpr(s.expr) };
      case "if":
        return { ...s, cond: walkExpr(s.cond), then: walkStmt(s.then), else: s.else ? walkStmt(s.else) : undefined };
      case "while":
        return { ...s, cond: walkExpr(s.cond), body: walkStmt(s.body), completed: s.completed ? walkStmt(s.completed) : undefined };
      case "for":
        return { ...s, start: walkExpr(s.start), end: walkExpr(s.end), body: walkStmt(s.body), completed: s.completed ? walkStmt(s.completed) : undefined };
      case "switch":
        return { ...s, selector: walkExpr(s.selector), cases: s.cases.map(([c, body]) => [c, walkStmt(body)] as [number, IRStmt]), default: s.default ? walkStmt(s.default) : undefined };
      case "setVar":
        return { ...s, expr: walkExpr(s.expr) };
      case "setPointer":
        return { ...s, args: s.args.map(walkExpr), value: walkExpr(s.value), out: s.out ? walkStmt(s.out) : undefined, err: s.err ? walkStmt(s.err) : undefined };
      case "emitEvent":
        return { ...s, args: s.args.map(walkExpr) };
      case "stopPropagation":
        return { ...s, stopImmediate: walkExpr(s.stopImmediate) };
      case "log":
        return { ...s, args: s.args.map(walkExpr) };
      case "callProc":
        return s;
      case "async": {
        const out = s.out ? walkStmt(s.out) : undefined;
        const err = s.err ? walkStmt(s.err) : undefined;
        const done = s.done ? (s.done.kind === "inline" ? { kind: "inline" as const, body: walkStmt(s.done.body) } : s.done) : undefined;
        return { ...s, args: s.args.map(walkExpr), out, err, done };
      }
      case "stateful":
        return { ...s, args: s.args.map(walkExpr), outs: Object.fromEntries(Object.entries(s.outs).map(([k, v]) => [k, walkStmt(v)])) };
      case "intrinsic":
        return { ...s, args: s.args.map(walkExpr), outs: Object.fromEntries(Object.entries(s.outs).map(([k, v]) => [k, walkStmt(v)])) };
    }
  };
  return walkStmt(stmt);
}

function normalizeStmt(stmt: IRStmt): IRStmt {
  return seqOf(normalizeToList(canonicalizeTempIds(normalizePointersInStmt(stmt))));
}

const PLACEHOLDER_LOG_ARG: IRExpr = { k: "const", type: "ref", data: ["<log-arg>"] };

// Mirrors emit-ts's identically-named helpers exactly (isUuidLikeId /
// detectCounterVarIds / computeVariableDisplayNames): a UUID-ish original
// variable id (module.variables[i].extras.id — the RAW graph id, before
// @gltfi/ir's own sanitizing) is renamed to a short synthetic `counter<N>`/
// `var<N>` at emit time (see emit.ts's header note on this), so the
// ORIGINAL module's `.name` no longer matches the re-parsed one for those
// variables — canonicalize the ORIGINAL side through the same transform
// before comparing. The re-parsed side never needs this: its variables
// carry no `.extras` at all (parse-ts has no raw id to recover — see
// parseVarsObject), so `isUuidLikeId` is trivially false there and this is
// a no-op on that side.
function isUuidLikeId(rawId: string): boolean {
  const stripped = rawId.replace(/[-_]/g, "");
  return stripped.length >= 20 && /^[0-9a-f]+$/i.test(stripped);
}

function detectCounterVarIds(module: IRModule): Set<number> {
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

function canonicalVariableNames(module: IRModule): string[] {
  const counterVarIds = detectCounterVarIds(module);
  const isUuidLike = module.variables.map((v) => {
    const rawId = (v.extras as { id?: string } | undefined)?.id;
    return rawId !== undefined && isUuidLikeId(rawId);
  });
  const used = new Set<string>();
  module.variables.forEach((v, i) => {
    if (!isUuidLike[i]) used.add(v.name);
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
  return module.variables.map((v, i) => (isUuidLike[i] ? allocSeq(counterVarIds.has(i) ? "counter" : "var") : v.name));
}

// Strips exactly the fields documented above as not round-tripping through
// emitted TypeScript, so the remainder can be compared with a plain
// `toEqual`.
function stripForComparison(module: IRModule): unknown {
  const varNames = canonicalVariableNames(module);
  return {
    variables: module.variables.map((v, i) => ({ name: varNames[i], type: v.type, initial: v.initial })),
    events: module.events.map((e) => ({ name: e.name, id: e.id, values: e.values })),
    stateSlots: module.stateSlots.map((s) => ({ kind: s.kind, config: s.config })),
    handlers: module.handlers.map((h) => ({ ...h, body: normalizeStmt(h.body) })),
    procs: module.procs.map((p) => ({ ...p, body: normalizeStmt(p.body) }))
  };
}

const CURATED: Array<[string, string]> = [
  ["flow/branch", "flow/branch/glTF-Binary/branch.glb"],
  ["flow/for", "flow/for/glTF-Binary/for.glb"],
  ["flow/while", "flow/while/glTF-Binary/while.glb"],
  ["flow/switch", "flow/switch/glTF-Binary/switch.glb"],
  ["flow/doN", "flow/doN/glTF-Binary/doN.glb"],
  ["flow/multiGate", "flow/multiGate/glTF-Binary/multiGate.glb"],
  ["flow/waitAll", "flow/waitAll/glTF-Binary/waitAll.glb"],
  ["flow/throttle", "flow/throttle/glTF-Binary/throttle.glb"],
  ["flow/setDelay_and_cancelDelay", "flow/setDelay_and_cancelDelay/glTF-Binary/setDelay_and_cancelDelay.glb"],
  ["variable/set_and_get", "variable/set_and_get/glTF-Binary/set_and_get.glb"],
  ["variable/interpolate", "variable/interpolate/glTF-Binary/interpolate.glb"],
  ["pointer/set_and_get", "pointer/set_and_get/glTF-Binary/set_and_get.glb"],
  ["pointer/interpolate", "pointer/interpolate/glTF-Binary/interpolate.glb"],
  ["animation/start", "animation/start/glTF-Binary/start.glb"],
  ["math/add", "math/add/glTF-Binary/add.glb"],
  ["math/random", "math/random/glTF-Binary/random.glb"],
  ["math/matDecompose", "math/matDecompose/glTF-Binary/matDecompose.glb"],
  ["math/switch", "math/switch/glTF-Binary/switch.glb"],
  ["math/quatFromAngles", "math/quatFromAngles/glTF-Binary/quatFromAngles.glb"],
  ["event/send_and_receive", "event/send_and_receive/glTF-Binary/send_and_receive.glb"],
  ["event/stopPropagation", "event/stopPropagation/glTF-Binary/stopPropagation.glb"]
];

describe("parseModule - round-trips emitted modules to deep-equal IR (modulo meta)", () => {
  for (const [name, relPath] of CURATED) {
    it(`round-trips "${name}"`, () => {
      const original = loadModule(relPath);
      const { code } = emitModule(original);
      const { module: parsed, diagnostics } = parseModule(code);
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
      expect(stripForComparison(parsed)).toEqual(stripForComparison(original));
    });
  }
});
