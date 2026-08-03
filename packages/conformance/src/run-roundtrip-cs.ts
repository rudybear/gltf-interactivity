// Round-trip conformance runner (C# surface): GLB -> importGraph ->
// emitModuleCs -> parseModuleCs -> exportGraph -> run graph' on the
// INTERPRETER via the judge protocol. Mirrors run-roundtrip-py.ts EXACTLY
// (see that file's own header comment for the full rationale) except the
// Python-surface emit/parse pair (@gltfi/emit-py's emitModulePy /
// @gltfi/parse-py's parseModulePy) is swapped for the C#-surface pair
// (@gltfi/emit-cs's emitModuleCs / @gltfi/parse-cs's parseModuleCs) —
// everything downstream of that swap (exportGraph, validateGraph, the
// interpreter judge, the informational equivalentGraphs check) is the same
// shared, backend-neutral machinery run-roundtrip.ts/run-roundtrip-py.ts
// already exercise. A passing run here is evidence that @gltfi/parse-cs
// reconstructs semantically equivalent IR from emit-cs's output, independent
// of the SEPARATE compiled-C# conformance path (run-compiled-cs.ts), which
// never touches @gltfi/parse-cs at all.
//
// @gltfi/parse-cs's `parseModuleCs` lazily spawns ONE persistent `dotnet
// gltfi-harness-cs.dll` process the first time it's called (see
// packages/parse-cs/src/session.ts) and reuses it for every asset in this
// run; `closeParser()` is called once at the very end so that shared process
// (and its FIFO fds) is torn down and this script's own process exits
// promptly instead of hanging on a lingering child.
import fs from "node:fs";
import { createRuntime, createRuntimeFromGlbFile, type Graph as RuntimeGraphType } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModuleCs, EmitError } from "@gltfi/emit-cs";
import { closeParser, parseModuleCs } from "@gltfi/parse-cs";
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

async function runOne(asset: { name: string; glbPath: string; testPath: string }): Promise<RunOutcome> {
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

    const { code } = emitModuleCs(module);

    const { module: module2, diagnostics: parseDiags } = parseModuleCs(code);
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

async function main() {
  const { filter } = parseArgs(process.argv.slice(2));
  const assets = loadTestAssets(undefined, filter);
  let failures = 0;
  let skips = 0;
  let equivCount = 0;
  let divergedCount = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  try {
    for (const asset of assets) {
      const outcome = await runOne(asset);
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
  } finally {
    closeParser();
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
