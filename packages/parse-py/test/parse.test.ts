// parseModulePy fidelity, three levels — mirrors packages/parse-lua/test/
// parse.test.ts's own structure (read that file's header first; this only
// calls out where Python's own three-way comparison differs):
//
//  1. Cross-parser IR-IDENTITY, THREE ways: for a curated corpus spanning
//     categories (math incl. random, flow loop/switch/stateful, async
//     delay/interp/animation, pointer templates, events), the SAME original
//     IRModule (from importGraph) is emitted through all three backends
//     (@gltfi/emit-ts's emitModule / @gltfi/emit-lua's emitModuleLua /
//     @gltfi/emit-py's emitModulePy) and reparsed with each one's own
//     parser (parseModule / parseModuleLua / parseModulePy). All three
//     resulting modules are compared to EACH OTHER "modulo meta/names" (the
//     same normalization parse-lua's own test file documents in full —
//     duplicated here rather than imported across package test boundaries,
//     since vitest test files aren't part of any package's public surface).
//
//  2. Whole-corpus "parses without ERROR diagnostics": every asset's
//     emitModulePy output round-trips through parseModulePy with zero
//     `severity: "error"` diagnostics (mirrors run-roundtrip-py.ts's own
//     gate, but as a fast in-process vitest check with per-asset
//     attribution instead of a full interpreter-judge pass).
//
// `afterAll` calls `closeParser()` so the shared, lazily-spawned harness
// process this whole file's `parseModulePy` calls share gets torn down —
// otherwise vitest would hang waiting for that child process's fds to close.
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph, type IRExpr, type IRModule, type IRStmt } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { emitModuleLua } from "@gltfi/emit-lua";
import { emitModulePy } from "@gltfi/emit-py";
import { parseModule } from "@gltfi/parse-ts";
import { parseModuleLua } from "@gltfi/parse-lua";
import { closeParser, parseModulePy } from "../src/index.js";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

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

// Identical normalization to parse-lua's/parse-ts's own test files (see
// either for the exhaustive per-IRStmt-kind rationale) — duplicated rather
// than imported across package test boundaries.
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

afterAll(() => {
  closeParser();
});

describe("parseModulePy - round-trips emitted Python to deep-equal IR (modulo meta)", () => {
  for (const [name, relPath] of CURATED) {
    it(`round-trips "${name}"`, () => {
      const original = loadModule(relPath);
      const { code } = emitModulePy(original);
      const { module: parsed, diagnostics } = parseModulePy(code);
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
      expect(stripForComparison(parsed)).toEqual(stripForComparison(original));
    });
  }
});

describe("parseModulePy vs parseModule vs parseModuleLua - cross-parser IR identity (modulo meta/names)", () => {
  for (const [name, relPath] of CURATED) {
    it(`agrees with parseModule/parseModuleLua on "${name}"`, () => {
      const original = loadModule(relPath);
      const pyCode = emitModulePy(original).code;
      const tsCode = emitModule(original).code;
      const luaCode = emitModuleLua(original).code;
      const { module: parsedPy, diagnostics: pyDiags } = parseModulePy(pyCode);
      const { module: parsedTs, diagnostics: tsDiags } = parseModule(tsCode);
      const { module: parsedLua, diagnostics: luaDiags } = parseModuleLua(luaCode);
      expect(pyDiags.filter((d) => d.severity === "error"), "parseModulePy diagnostics").toEqual([]);
      expect(tsDiags.filter((d) => d.severity === "error"), "parseModule diagnostics").toEqual([]);
      expect(luaDiags.filter((d) => d.severity === "error"), "parseModuleLua diagnostics").toEqual([]);
      const py = stripForComparison(parsedPy);
      expect(py).toEqual(stripForComparison(parsedTs));
      expect(py).toEqual(stripForComparison(parsedLua));
    });
  }
});

describe("parseModulePy - whole corpus parses without ERROR diagnostics", () => {
  const assets = loadWholeCorpus();
  for (const asset of assets) {
    it(`parses "${asset.name}" cleanly`, () => {
      const runtime = createRuntimeFromGlbFile(asset.glbPath);
      const { module, diagnostics: importDiags } = importGraph(runtime.graph as unknown as Graph);
      const importErrors = importDiags.filter((d) => d.severity === "error");
      if (importErrors.length > 0) {
        // Mirrors run-roundtrip-py.ts's own SKIP convention: a graph
        // @gltfi/ir's importGraph itself can't cleanly structure is out of
        // scope for this parser-fidelity test.
        return;
      }
      const checkErrors = checkModule(module).filter((d) => d.severity === "error");
      if (checkErrors.length > 0) {
        return;
      }
      const { code } = emitModulePy(module);
      const { diagnostics } = parseModulePy(code);
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    });
  }
});
