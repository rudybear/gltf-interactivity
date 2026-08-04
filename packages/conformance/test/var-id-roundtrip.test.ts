// Cross-backend contract test for the id-preservation feature added to all
// five code-hop backends (TS/Lua/Python/C#/GDScript): a graph variable's
// original `variables[i].id` (@gltfi/ir's import.ts stores it as
// `extras.id`, export.ts writes it back out — see either file's own doc
// comment) must survive `graph -> importGraph -> emit<Lang> -> parse<Lang>
// -> exportGraph` byte-identical, for EVERY backend, exactly like the
// existing event externalId contract this mirrors.
//
// Two fixtures:
//  1. A real corpus asset (variable/set_and_get) whose graph-authored
//     variable ids are descriptive strings (`TestResult_HasPassed_...`,
//     `VarSetTestStatic_...`) — the common case.
//  2. The same module with variable[0]'s id swapped for a pure-hex UUID
//     (`isUuidLikeId`'s target pattern — see @gltfi/ir's display-names.ts),
//     which additionally exercises the "id is UUID-like, so the EMITTED
//     display name is a synthetic `var<N>`/`counter<N>`, but the id itself
//     must still round-trip unchanged" path.
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { exportGraph, importGraph, type Graph, type IRModule } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { emitModuleLua } from "@gltfi/emit-lua";
import { emitModulePy } from "@gltfi/emit-py";
import { emitModuleCs } from "@gltfi/emit-cs";
import { emitModuleGd } from "@gltfi/emit-gd";
import { parseModule } from "@gltfi/parse-ts";
import { parseModuleLua } from "@gltfi/parse-lua";
import { closeParser as closeParserPy, parseModulePy } from "@gltfi/parse-py";
import { closeParser as closeParserCs, parseModuleCs } from "@gltfi/parse-cs";
import { parseModuleGd } from "@gltfi/parse-gd";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

afterAll(() => {
  closeParserPy();
  closeParserCs();
});

type Backend = {
  name: string;
  emit: (module: IRModule) => { code: string };
  parse: (code: string) => { module: IRModule; diagnostics: Array<{ severity: string }> };
};

const BACKENDS: Backend[] = [
  { name: "ts", emit: emitModule, parse: parseModule },
  { name: "lua", emit: emitModuleLua, parse: parseModuleLua },
  { name: "py", emit: emitModulePy, parse: parseModulePy },
  { name: "cs", emit: emitModuleCs, parse: parseModuleCs },
  { name: "gd", emit: emitModuleGd, parse: parseModuleGd }
];

function idsOf(module: IRModule): Array<string | undefined> {
  return module.variables.map((v) => (v.extras as { id?: string } | undefined)?.id);
}

function loadModule(relPath: string): IRModule {
  const runtime = createRuntimeFromGlbFile(path.join(ROOT, relPath));
  const { module, diagnostics } = importGraph(runtime.graph as unknown as Graph);
  expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return module;
}

// Swaps variable[0]'s id for a pure-hex UUID — same shape as a raw-GUID-
// authoring tool would produce (see display-names.ts's isUuidLikeId doc
// comment for a real example) — leaving every other field (including every
// OTHER variable's id) untouched, so the resulting module is still a
// perfectly valid one every backend already knows how to emit.
function withSyntheticUuidId(module: IRModule): IRModule {
  const variables = module.variables.map((v, i) => (i === 0 ? { ...v, extras: { id: "467a7f10-2a70-49b0-ac90-a045449a37e9" } } : v));
  return { ...module, variables };
}

describe("variable id round-trip: graph -> emit -> parse -> exportGraph, all five backends", () => {
  const corpusModule = loadModule("variable/set_and_get/glTF-Binary/set_and_get.glb");
  const syntheticModule = withSyntheticUuidId(corpusModule);

  it("fixture sanity: corpus asset actually has variable ids, and >=1 is non-UUID-like", () => {
    const ids = idsOf(corpusModule);
    expect(ids.some((id) => id !== undefined)).toBe(true);
    expect(ids[0]).toBe("VarSetTestStatic_boolboolb5e2be06-72dc-4301-8c3f-6be0479ad15a");
  });

  for (const backend of BACKENDS) {
    describe(backend.name, () => {
      it("preserves the corpus asset's variable ids", () => {
        const originalIds = idsOf(corpusModule);
        const { code } = backend.emit(corpusModule);
        const { module: parsed, diagnostics } = backend.parse(code);
        expect(diagnostics.filter((d) => d.severity === "error"), `${backend.name} parse diagnostics`).toEqual([]);
        const { graph } = exportGraph(parsed);
        expect(graph.variables?.map((v) => v.id)).toEqual(originalIds);
      });

      it("preserves a synthetic UUID-like variable id", () => {
        const originalIds = idsOf(syntheticModule);
        const { code } = backend.emit(syntheticModule);
        const { module: parsed, diagnostics } = backend.parse(code);
        expect(diagnostics.filter((d) => d.severity === "error"), `${backend.name} parse diagnostics`).toEqual([]);
        const { graph } = exportGraph(parsed);
        expect(graph.variables?.map((v) => v.id)).toEqual(originalIds);
        expect(graph.variables?.[0]?.id).toBe("467a7f10-2a70-49b0-ac90-a045449a37e9");
      });
    });
  }
});
