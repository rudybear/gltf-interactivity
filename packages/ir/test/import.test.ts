import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule } from "../src/check.js";
import { importGraph, type Graph } from "../src/import.js";
import type { Diagnostic } from "../src/model.js";
import { printModule } from "../src/printer.js";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

function loadGraph(relPath: string): Graph {
  const runtime = createRuntimeFromGlbFile(path.join(ROOT, relPath));
  return runtime.graph as unknown as Graph;
}

function errorsOf(diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics.filter((d) => d.severity === "error");
}

// ---------------------------------------------------------------------------
// Curated corpus: one representative GLB per major op family. Each must
// import with zero ERROR diagnostics, pass checkModule with zero errors, and
// produce a deterministic printModule() snapshot.
// ---------------------------------------------------------------------------

const CURATED: Array<[string, string]> = [
  ["flow/branch", "flow/branch/glTF-Binary/branch.glb"],
  ["flow/for", "flow/for/glTF-Binary/for.glb"],
  ["flow/while", "flow/while/glTF-Binary/while.glb"],
  ["flow/sequence", "flow/sequence/glTF-Binary/sequence.glb"],
  ["flow/doN", "flow/doN/glTF-Binary/doN.glb"],
  ["flow/setDelay_and_cancelDelay", "flow/setDelay_and_cancelDelay/glTF-Binary/setDelay_and_cancelDelay.glb"],
  ["variable/set_and_get", "variable/set_and_get/glTF-Binary/set_and_get.glb"],
  ["pointer/set_and_get", "pointer/set_and_get/glTF-Binary/set_and_get.glb"],
  ["math/add", "math/add/glTF-Binary/add.glb"],
  ["math/random", "math/random/glTF-Binary/random.glb"],
  ["event/send_and_receive", "event/send_and_receive/glTF-Binary/send_and_receive.glb"]
];

describe("importGraph - curated corpus", () => {
  for (const [name, relPath] of CURATED) {
    it(`imports "${name}" with zero errors, checkModule passes, stable printModule snapshot`, () => {
      const graph = loadGraph(relPath);
      const { module, diagnostics } = importGraph(graph);
      const importErrors = errorsOf(diagnostics);
      expect(importErrors, JSON.stringify(importErrors, null, 2)).toEqual([]);

      const checkDiagnostics = checkModule(module);
      const checkErrors = errorsOf(checkDiagnostics);
      expect(checkErrors, JSON.stringify(checkErrors, null, 2)).toEqual([]);

      expect(printModule(module)).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// Full 145-file corpus: the strong acceptance test. Every graph in both
// index files must import + checkModule without ERROR diagnostics (warnings
// allowed) — the importer must be TOTAL over the corpus, falling back to
// `intrinsic` for anything it doesn't have a dedicated raising rule for.
// ---------------------------------------------------------------------------

type IndexEntry = { name: string; variants: { "glTF-Binary": string; "test-Json": string } };

function loadIndex(fileName: string): IndexEntry[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, fileName), "utf8")) as IndexEntry[];
}

function resolveGlbPath(entry: IndexEntry): string {
  const nested = path.join(ROOT, entry.name, "glTF-Binary", entry.variants["glTF-Binary"]);
  if (fs.existsSync(nested)) {
    return nested;
  }
  const flat = path.join(ROOT, entry.variants["glTF-Binary"]);
  if (fs.existsSync(flat)) {
    return flat;
  }
  throw new Error(`Missing GLB for ${entry.name}`);
}

describe("importGraph - full corpus (145 files)", () => {
  it("imports and checks every corpus GLB without ERROR diagnostics", () => {
    const entries = [...loadIndex("test-index.json"), ...loadIndex("mathtests-index.json")];
    expect(entries.length).toBe(145);

    const failures: string[] = [];
    let graphsWithProcs = 0;
    let totalProcs = 0;
    let graphsWithTemps = 0;
    let totalTemps = 0;
    let totalHandlers = 0;
    const intrinsicOps = new Set<string>();

    for (const entry of entries) {
      const glbPath = resolveGlbPath(entry);
      let module;
      let diagnostics: Diagnostic[];
      try {
        const runtime = createRuntimeFromGlbFile(glbPath);
        const result = importGraph(runtime.graph as unknown as Graph);
        module = result.module;
        diagnostics = result.diagnostics;
      } catch (err) {
        failures.push(`${entry.name}: import threw: ${err instanceof Error ? err.stack : String(err)}`);
        continue;
      }

      const importErrors = errorsOf(diagnostics);
      if (importErrors.length > 0) {
        failures.push(`${entry.name}: import errors: ${JSON.stringify(importErrors)}`);
      }

      let checkDiagnostics: Diagnostic[];
      try {
        checkDiagnostics = checkModule(module);
      } catch (err) {
        failures.push(`${entry.name}: checkModule threw: ${err instanceof Error ? err.stack : String(err)}`);
        continue;
      }
      const checkErrors = errorsOf(checkDiagnostics);
      if (checkErrors.length > 0) {
        failures.push(`${entry.name}: check errors: ${JSON.stringify(checkErrors)}`);
      }

      // printModule must also not throw over the whole corpus.
      try {
        printModule(module);
      } catch (err) {
        failures.push(`${entry.name}: printModule threw: ${err instanceof Error ? err.stack : String(err)}`);
      }

      if (module.procs.length > 0) {
        graphsWithProcs += 1;
        totalProcs += module.procs.length;
      }
      totalHandlers += module.handlers.length;
      for (const d of diagnostics) {
        if (d.code === "GI099") {
          const match = /op "([^"]+)"/.exec(d.message);
          if (match) {
            intrinsicOps.add(match[1]);
          }
        }
      }
      const letCount = countLets(module);
      if (letCount > 0) {
        graphsWithTemps += 1;
        totalTemps += letCount;
      }
    }

    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`${failures.length}/${entries.length} corpus graphs failed:\n${failures.join("\n")}`);
    }
    expect(failures).toEqual([]);

    // eslint-disable-next-line no-console
    console.log(
      `[ir corpus stats] ${entries.length} graphs, ${totalHandlers} handlers total, ` +
        `${graphsWithProcs} graphs needed procs (${totalProcs} procs total), ` +
        `${graphsWithTemps} graphs needed let-temps (${totalTemps} temps total), ` +
        `fell back to intrinsic for: ${[...intrinsicOps].sort().join(", ") || "(none)"}`
    );
  });
});

function countLets(module: { handlers: Array<{ body: unknown }>; procs: Array<{ body: unknown }> }): number {
  let count = 0;
  const visit = (stmt: unknown) => {
    if (!stmt || typeof stmt !== "object") {
      return;
    }
    const s = stmt as { k?: string; [key: string]: unknown };
    if (s.k === "let") {
      count += 1;
    }
    for (const value of Object.values(s)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            if (Array.isArray(item)) {
              for (const nested of item) {
                visit(nested);
              }
            } else {
              visit(item);
            }
          }
        }
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  };
  for (const h of module.handlers) {
    visit(h.body);
  }
  for (const p of module.procs) {
    visit(p.body);
  }
  return count;
}
