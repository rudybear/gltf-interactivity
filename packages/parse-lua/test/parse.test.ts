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
import { checkModule, importGraph, type Graph, type IRExpr, type IRModule, type IRStmt } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { emitModuleLua } from "@gltfi/emit-lua";
import { parseModule } from "@gltfi/parse-ts";
import { parseModuleLua } from "../src/index.js";

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
  return seqOf(normalizeToList(stmt));
}

const PLACEHOLDER_LOG_ARG: IRExpr = { k: "const", type: "ref", data: ["<log-arg>"] };

function stripForComparison(module: IRModule): unknown {
  return {
    variables: module.variables.map((v) => ({ type: v.type, initial: v.initial })),
    events: module.events.map((e) => ({ id: e.id, values: e.values })),
    stateSlots: module.stateSlots,
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
