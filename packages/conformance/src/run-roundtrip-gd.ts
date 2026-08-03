// Round-trip conformance runner (GDScript surface): GLB -> importGraph ->
// emitModuleGd -> parseModuleGd -> exportGraph -> run graph' on the
// INTERPRETER via the judge protocol. Mirrors run-roundtrip-py.ts EXACTLY
// (see that file's own header comment for the full rationale) except the
// Python-surface emit/parse pair (@gltfi/emit-py's emitModulePy /
// @gltfi/parse-py's parseModulePy) is swapped for the GDScript-surface pair
// (@gltfi/emit-gd's emitModuleGd / @gltfi/parse-gd's parseModuleGd) —
// everything downstream of that swap (exportGraph, validateGraph, the
// interpreter judge, the informational equivalentGraphs check) is the same
// shared, backend-neutral machinery run-roundtrip.ts/run-roundtrip-py.ts
// already exercise. A passing run here is evidence that @gltfi/parse-gd
// reconstructs semantically equivalent IR from emit-gd's output, independent
// of the SEPARATE compiled-GDScript-engine conformance path
// (run-compiled-gd.ts), which never touches @gltfi/parse-gd at all AND
// (unlike this file) needs a real `godot --headless` subprocess — this
// runner needs no `godot` binary whatsoever, since `@gltfi/parse-gd` is a
// pure, dependency-free, in-process parser (see that package's own header
// for why: Godot 4.3 exposes no public GDScript AST API, so unlike
// parse-py's/parse-cs's own harness-process trick, there is no language-
// native grammar to shell out to here at all).
//
// No `closeParser()`-style teardown call at the end (unlike run-roundtrip-
// py.ts's/run-roundtrip-lua.ts's own `finally` block) — `@gltfi/parse-gd`
// spawns no subprocess/session of any kind, so there is nothing to shut
// down.
import fs from "node:fs";
import { createRuntime, createRuntimeFromGlbFile, type Graph as RuntimeGraphType } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModuleGd, EmitError } from "@gltfi/emit-gd";
import { parseModuleGd } from "@gltfi/parse-gd";
import { exportGraph } from "@gltfi/ir";
import { validateGraph, equivalentGraphs, type VGraph } from "@gltfi/verify";
import { loadTestAssets } from "./assets.js";
import { interpEngineFromRuntime } from "./interp-adapter.js";
import { judgeTest, type TestJson } from "./protocol.js";

function parseArgs(argv: string[]): { filter?: string } {
  const out: { filter?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--filter") {
      out.filter = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

type RunOutcome =
  | { ok: true; equivalent: boolean; divergence?: string; stats: { nodesBeforeMerge: number; nodesAfterMerge: number } }
  | { ok: false; kind: "SKIP" | "FAIL"; reason: string };

function toUint8(bin: DataView | null): Uint8Array | undefined {
  if (!bin) {
    return undefined;
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength);
}

function runOne(asset: { name: string; glbPath: string; testPath: string }): RunOutcome {
  try {
    const probe = createRuntimeFromGlbFile(asset.glbPath);
    const originalGraph = probe.graph as unknown as IrGraph;

    const { module, diagnostics: importDiags } = importGraph(originalGraph);
    const importErrors = importDiags.filter((d) => d.severity === "error");
    if (importErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `import errors: ${JSON.stringify(importErrors)}` };
    }
    const checkErrors = checkModule(module).filter((d) => d.severity === "error");
    if (checkErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `check errors: ${JSON.stringify(checkErrors)}` };
    }

    const { code } = emitModuleGd(module);

    const { module: module2, diagnostics: parseDiags } = parseModuleGd(code);
    const parseErrors = parseDiags.filter((d) => d.severity === "error");
    if (parseErrors.length > 0) {
      return { ok: false, kind: "FAIL", reason: `parse errors: ${JSON.stringify(parseErrors, null, 2)}` };
    }

    const { graph: graph2, diagnostics: exportDiags, stats } = exportGraph(module2);
    const exportErrors = exportDiags.filter((d) => d.severity === "error");
    if (exportErrors.length > 0) {
      return { ok: false, kind: "FAIL", reason: `export errors: ${JSON.stringify(exportErrors, null, 2)}` };
    }

    const validation = validateGraph(graph2 as unknown as VGraph);
    if (!validation.ok) {
      return { ok: false, kind: "FAIL", reason: `validateGraph errors: ${JSON.stringify(validation.diagnostics, null, 2)}` };
    }

    const binary = toUint8(probe.glbBin);
    const testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
    const runtimeGraph2 = graph2 as unknown as RuntimeGraphType;
    const result = judgeTest(() => interpEngineFromRuntime(createRuntime(runtimeGraph2, probe.gltf, { binary })), testJson);

    const equiv = equivalentGraphs(originalGraph as unknown as VGraph, graph2 as unknown as VGraph);

    if (!result.ok) {
      return { ok: false, kind: "FAIL", reason: result.failures.join("\n  - ") };
    }
    return { ok: true, equivalent: equiv.equivalent, divergence: equiv.firstDivergence, stats: { nodesBeforeMerge: stats.nodesBeforeMerge, nodesAfterMerge: stats.nodesAfterMerge } };
  } catch (err) {
    const reason = err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err);
    return { ok: false, kind: "FAIL", reason };
  }
}

function main() {
  const { filter } = parseArgs(process.argv.slice(2));
  const assets = loadTestAssets(undefined, filter);
  let failures = 0;
  let skips = 0;
  let equivCount = 0;
  let divergedCount = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (const asset of assets) {
    const outcome = runOne(asset);
    if (outcome.ok) {
      console.log(`PASS ${asset.name}`);
      totalBefore += outcome.stats.nodesBeforeMerge;
      totalAfter += outcome.stats.nodesAfterMerge;
      if (outcome.equivalent) {
        equivCount += 1;
        console.log(`  EQUIV`);
      } else {
        divergedCount += 1;
        console.log(`  DIVERGED ${outcome.divergence ?? "(no path)"}`);
      }
      continue;
    }
    if (outcome.kind === "SKIP") {
      skips += 1;
      console.error(`SKIP ${asset.name}`);
      console.error(`  - ${outcome.reason}`);
    } else {
      failures += 1;
      console.error(`FAIL ${asset.name}`);
      console.error(`  - ${outcome.reason}`);
    }
  }

  console.log(
    `${assets.length} tests, ${assets.length - failures - skips} passed, ${failures} failed, ${skips} skipped. ` +
      `equivalentGraphs: ${equivCount} EQUIV, ${divergedCount} DIVERGED. ` +
      `CSE: ${totalBefore} nodes before merge, ${totalAfter} after (${totalBefore - totalAfter} merged).`
  );
  if (failures > 0 || skips > 0) {
    process.exit(1);
  }
  console.log(`All ${assets.length} tests passed.`);
}

main();
