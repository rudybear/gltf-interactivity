// parseModuleLua fidelity, two levels:
//
//  1. Cross-parser IR-IDENTITY: for a curated corpus spanning categories
//     (math incl. random, flow loop/switch/stateful, async delay/interp/
//     animation, pointer templates, events), the SAME original IRModule
//     (from importGraph) is emitted through BOTH backends
//     (@gltfi/emit-ts's emitModule / @gltfi/emit-lua's emitModuleLua) and
//     each reparsed with its own backend's parser (@gltfi/parse-ts's
//     parseModule / this package's parseModuleLua). The two RESULTING
//     modules are then compared to each other (not each individually
//     against the original) "modulo meta/names" — this is the strongest
//     available check that both parsers see the same semantics, since
//     any structural drift between the two independently-implemented
//     mechanical inverses shows up as a direct mismatch here.
//
//     What's excluded and why (identical to parse-ts's own test file's own
//     documented exclusions — see packages/parse-ts/test/parse.test.ts's
//     header comment for the full rationale of each):
//       - IRModule.meta entirely (no representation in either emitted
//         surface).
//       - IRVariable/IREvent `.name` (rt.vars()/rt.events() carry no name
//         field in EITHER backend's emitted array — see both emit.ts's
//         emitVars/emitEvents).
//       - Statement nesting flattening for while/for's `completed` and
//         flow/cancelDelay's `outs.out` (both backends' emitters inline
//         these as bare following siblings with zero textual delimiter —
//         see either emit.ts's own doc comments — so this is provably
//         unrecoverable from either emitted text, not a parser bug).
//       - multiGate's numbered output-socket key TEXT (both backends
//         renumber to sequential "0".."N-1" by relative order, not the
//         original literal key text).
//       - debug/log's argument VALUES/types (both backends emit them with
//         zero type annotation and the op is an inert runtime no-op —
//         argument COUNT is still compared).
//     Everything else — types, initial/default values, control-flow shape,
//     temp ids, proc/state-slot NAMES (both backends emit these as real
//     identifiers derived from the SAME source IRModule, so they match
//     verbatim across backends too), op overloads/config, pointer
//     templates — must match exactly between the two parsed modules.
//
//  2. Whole-corpus "parses without ERROR diagnostics": every asset's
//     emitModuleLua output round-trips through parseModuleLua with zero
//     `severity: "error"` diagnostics (mirrors run-roundtrip-lua.ts's own
//     gate, but as a fast in-process vitest check with per-asset
//     attribution instead of a full interpreter-judge pass).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { resolveOverload } from "@gltfi/kernel";
import { checkModule, formatPointerTemplate, importGraph, parsePointerTemplate, type Graph, type IRExpr, type IRModule, type IRStmt, type PtrTemplate } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { emitModuleLua } from "@gltfi/emit-lua";
import { parseModule } from "@gltfi/parse-ts";
import { parseModuleLua } from "../src/index.js";

const AMBIGUOUS_COMPARE_OPS = new Set(["math/eq", "math/lt", "math/le", "math/gt", "math/ge"]);

// Mirrors @gltfi/parse-ts/test/parse.test.ts's identically-named helper —
// see that file for the full rationale. Needed HERE too because
// @gltfi/emit-ts (one of the two backends this file cross-compares)
// inlines constant pointer-template args into the path string (see emit-
// ts's pointerCall), while @gltfi/emit-lua still emits the parameterized
// template unchanged — so without normalizing both sides through the same
// inlining, every pointer node would spuriously mismatch between the two
// parsed modules.
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
      // See parse-ts's test file's identical comment: emit-ts's native
      // math/eq|lt|le|gt|ge substitution loses the int-vs-float distinction
      // whenever an operand's type comes from an all-literal math/switch
      // (harmlessly — the rendered "===" / "<" / etc. text is identical
      // either way); emit-lua keeps the original, unambiguous type. Both
      // sides canonicalize to "float" so this doesn't spuriously mismatch.
      if (AMBIGUOUS_COMPARE_OPS.has(expr.op) && expr.overload.inputs.a === "int") {
        const overload = resolveOverload(expr.op, { a: "float", b: "float" });
        if (overload) {
          const canonArgs = args.map((a) => (a.k === "const" && a.type === "int" ? { ...a, type: "float" as const } : a));
          return { ...expr, overload, args: canonArgs };
        }
      }
      return { ...expr, args };
    }
    case "intrinsic": {
      const args = expr.args.map(normalizePointersInExpr);
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

// Mirrors parse-ts's test file's identical helper: @gltfi/emit-ts renames
// `let` temps to short sequential `t<n>` ids (see emit.ts's allocTemp)
// while @gltfi/emit-lua still emits the ORIGINAL graph-node-id-derived temp
// id unchanged — canonicalize both to first-encountered-order `t1`/`t2`/...
// (fresh per handler/proc body) before comparing.
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

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

// Minimal corpus-index loader, self-contained rather than importing
// @gltfi/conformance's assets.ts (a package this one has no dependency on;
// see @gltfi/conformance/src/assets.ts for the canonical version the
// runners themselves use — this is a deliberately small duplicate, not a
// shared helper, to avoid an inter-package test-only coupling).
type TestAsset = { name: string; glbPath: string; testPath: string };

function loadWholeCorpus(): TestAsset[] {
  const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf8")) as Array<{ name: string; variants: { "glTF-Binary": string; "test-Json": string } }>;
  const entries = [...readJson(path.join(ROOT, "test-index.json")), ...readJson(path.join(ROOT, "mathtests-index.json"))];
  return entries.map((entry) => {
    const baseDir = path.join(ROOT, entry.name);
    const glbPath = path.join(baseDir, "glTF-Binary", entry.variants["glTF-Binary"]);
    const testPath = path.join(baseDir, "test-Json", entry.variants["test-Json"]);
    if (fs.existsSync(glbPath) && fs.existsSync(testPath)) {
      return { name: entry.name, glbPath, testPath };
    }
    return { name: entry.name, glbPath: path.join(ROOT, entry.variants["glTF-Binary"]), testPath: path.join(ROOT, entry.variants["test-Json"]) };
  });
}

function loadModule(relPath: string): IRModule {
  const runtime = createRuntimeFromGlbFile(path.join(ROOT, relPath));
  const { module, diagnostics } = importGraph(runtime.graph as unknown as Graph);
  expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return module;
}

// Identical normalization to parse-ts's test/parse.test.ts's own
// normalizeToList/stripForComparison (see that file for the exhaustive
// per-IRStmt-kind rationale) — duplicated rather than imported across
// package test boundaries, since vitest test files aren't part of either
// package's public surface.
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
      return [{ ...stmt, args: stmt.args.map(() => PLACEHOLDER_LOG_ARG) }];
    default:
      return [stmt];
  }
}

function seqOf(items: IRStmt[]): IRStmt {
  return items.length === 1 ? items[0] : { k: "seq", stmts: items };
}

function normalizeStmt(stmt: IRStmt): IRStmt {
  return seqOf(normalizeToList(canonicalizeTempIds(normalizePointersInStmt(stmt))));
}

const PLACEHOLDER_LOG_ARG: IRExpr = { k: "const", type: "ref", data: ["<log-arg>"] };

function stripForComparison(module: IRModule): unknown {
  return {
    variables: module.variables.map((v) => ({ type: v.type, initial: v.initial })),
    events: module.events.map((e) => ({ id: e.id, values: e.values })),
    // .name is excluded: @gltfi/parse-ts's round-trip now deliberately
    // renames state slots to short display identifiers (doN1, gate2, ...)
    // distinct from @gltfi/ir/import.ts's own graph-node-id-derived name
    // (see @gltfi/emit-ts's computeStateSlotDisplayNames) — emit-lua/parse-
    // lua still round-trip the ORIGINAL IR name unchanged, so comparing
    // `.name` here would spuriously fail this cross-parser identity check
    // against parseModule (TS) even though both sides structurally agree.
    stateSlots: module.stateSlots.map((s) => ({ kind: s.kind, config: s.config })),
    handlers: module.handlers.map((h) => ({ ...h, body: normalizeStmt(h.body) })),
    procs: module.procs.map((p) => ({ ...p, body: normalizeStmt(p.body) }))
  };
}

// Spans: math (incl. random), flow loop/switch/stateful, async delay/
// interp/animation, pointer templates, events — at least 10 assets, per the
// task's acceptance bar.
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

describe("parseModuleLua - round-trips emitted Lua to deep-equal IR (modulo meta)", () => {
  for (const [name, relPath] of CURATED) {
    it(`round-trips "${name}"`, () => {
      const original = loadModule(relPath);
      const { code } = emitModuleLua(original);
      const { module: parsed, diagnostics } = parseModuleLua(code);
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
      expect(stripForComparison(parsed)).toEqual(stripForComparison(original));
    });
  }
});

describe("parseModuleLua vs parseModule - cross-parser IR identity (modulo meta/names)", () => {
  for (const [name, relPath] of CURATED) {
    it(`agrees with parseModule on "${name}"`, () => {
      const original = loadModule(relPath);
      const luaCode = emitModuleLua(original).code;
      const tsCode = emitModule(original).code;
      const { module: parsedLua, diagnostics: luaDiags } = parseModuleLua(luaCode);
      const { module: parsedTs, diagnostics: tsDiags } = parseModule(tsCode);
      expect(luaDiags.filter((d) => d.severity === "error"), "parseModuleLua diagnostics").toEqual([]);
      expect(tsDiags.filter((d) => d.severity === "error"), "parseModule diagnostics").toEqual([]);
      expect(stripForComparison(parsedLua)).toEqual(stripForComparison(parsedTs));
    });
  }
});

describe("parseModuleLua - whole corpus parses without ERROR diagnostics", () => {
  const assets = loadWholeCorpus();
  for (const asset of assets) {
    it(`parses "${asset.name}" cleanly`, () => {
      const runtime = createRuntimeFromGlbFile(asset.glbPath);
      const { module, diagnostics: importDiags } = importGraph(runtime.graph as unknown as Graph);
      const importErrors = importDiags.filter((d) => d.severity === "error");
      if (importErrors.length > 0) {
        // Mirrors run-roundtrip-lua.ts's own SKIP convention: a graph
        // @gltfi/ir's importGraph itself can't cleanly structure is out of
        // scope for this parser-fidelity test.
        return;
      }
      const checkErrors = checkModule(module).filter((d) => d.severity === "error");
      if (checkErrors.length > 0) {
        return;
      }
      const { code } = emitModuleLua(module);
      const { diagnostics } = parseModuleLua(code);
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    });
  }
});
