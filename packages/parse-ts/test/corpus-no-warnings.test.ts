// #20-3 (GI190)'s own acceptance bar (see lintTempReuseAfterWrite's doc
// comment in src/index.ts): the new temp-reuse-after-write lint must warn
// on the real trap pattern but NEVER fire across the full conformance
// corpus — emit-ts only ever introduces a `let` temp for a value actually
// read more than once (see emit.ts's own header note), which structurally
// can't produce the "read after a write the temp's initializer depends on"
// shape this lint watches for. A GI190 firing here would mean either a
// false positive in the lint itself or (more likely) a real emit-ts
// regression worth its own investigation — either way, this is the signal
// the "no warnings across the corpus" requirement asks for, run over decompile
// -> emit -> parse for every one of the 145 corpus GLBs (mirrors
// packages/ir/test/export.test.ts's own full-corpus loop).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { importGraph, type Graph } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { parseModule } from "../src/index.js";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

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

describe("parseModule - GI190 never fires across the full corpus (145 files)", () => {
  it("decompile (importGraph -> emitModule) -> parseModule produces zero GI190 warnings for every corpus GLB", () => {
    const entries = [...loadIndex("test-index.json"), ...loadIndex("mathtests-index.json")];
    expect(entries.length).toBe(145);

    const failures: string[] = [];
    for (const entry of entries) {
      const glbPath = resolveGlbPath(entry);
      const runtime = createRuntimeFromGlbFile(glbPath);
      const { module, diagnostics: importDiags } = importGraph(runtime.graph as unknown as Graph);
      if (importDiags.some((d) => d.severity === "error")) {
        // Not this test's concern (covered by packages/ir/test/import.test.ts's
        // own full-corpus test) — skip so an unrelated import failure doesn't
        // masquerade as a GI190 false positive/negative.
        continue;
      }
      const { code } = emitModule(module);
      const { diagnostics: parseDiags } = parseModule(code);
      const gi190 = parseDiags.filter((d) => d.code === "GI190");
      if (gi190.length > 0) {
        failures.push(`${entry.name}: ${gi190.map((d) => d.message).join("; ")}`);
      }
    }

    expect(failures, `GI190 fired on corpus assets it should never fire on:\n${failures.join("\n")}`).toEqual([]);
  });
});
