#!/usr/bin/env node
// gltfi — CLI over the decompile/compile/verify pipeline built by the other
// packages in this repo (@gltfi/ir, @gltfi/emit-ts, @gltfi/parse-ts,
// @gltfi/verify, @gltfi/gltf, @gltfi/runtime, @gltfi/conformance). Plain
// process.argv parsing, no CLI framework dependency — see util.ts.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { checkModule, exportGraph, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModule, EmitError } from "@gltfi/emit-ts";
import { parseModule } from "@gltfi/parse-ts";
import { equivalentGraphs, validateGraph, type VGraph } from "@gltfi/verify";
import { writeGlb, type GltfJson } from "@gltfi/gltf";
import { createRuntime, type Graph as RuntimeGraph } from "@gltfi/runtime";
import { CliError, deriveOutPath, extractGraph, fail, findTestJsonSibling, loadDocument, namesSidecarPath, parseArgs, printDiagnostics, readArrayBuffer, writeBytes } from "./util.js";

const USAGE = `gltfi — KHR_interactivity decompile/compile/verify CLI

Usage:
  gltfi decompile <in.glb|in.gltf> [-o out.ts] [--js] [--graph N]
  gltfi compile <in.ts> [-o out.gltf|out.glb] [--merge-into base.glb]
  gltfi roundtrip <in.glb|in.gltf> [--graph N]
  gltfi verify-equal <a.gltf|a.glb> <b.gltf|b.glb> [--graph-a N] [--graph-b N]
  gltfi conform <interp|compiled|roundtrip> [--filter x]
`;

async function cmdDecompile(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, { "-o": "string", "--js": "boolean", "--graph": "string" });
  const inPath = positional[0];
  if (!inPath) fail("decompile: missing <in.glb|in.gltf>");

  const doc = await loadDocument(inPath);
  const graphIndex = flags["--graph"] ? Number(flags["--graph"]) : 0;
  const graph = extractGraph(doc.json, graphIndex);

  const { module, diagnostics: importDiags } = importGraph(graph as IrGraph);
  printDiagnostics(importDiags);
  printDiagnostics(checkModule(module));

  const flavor = flags["--js"] ? "js" : "ts";
  const outPath = (flags["-o"] as string | undefined) ?? deriveOutPath(inPath, flavor === "js" ? ".js" : ".ts");
  const { code, names } = emitModule(module, { flavor });

  writeBytes(outPath, code);
  writeBytes(namesSidecarPath(outPath), JSON.stringify(names, null, 2));
  console.log(`wrote ${outPath} (+ ${namesSidecarPath(outPath)})`);

  if (importDiags.some((d) => d.severity === "error")) {
    process.exitCode = 1;
  }
}

async function cmdCompile(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, { "-o": "string", "--merge-into": "string" });
  const inPath = positional[0];
  if (!inPath) fail("compile: missing <in.ts>");

  const code = fs.readFileSync(inPath, "utf8");
  const { module, diagnostics: parseDiags } = parseModule(code);
  printDiagnostics(parseDiags);
  if (parseDiags.some((d) => d.severity === "error")) {
    process.exitCode = 1;
    return;
  }

  const { graph, diagnostics: exportDiags } = exportGraph(module);
  printDiagnostics(exportDiags);
  if (exportDiags.some((d) => d.severity === "error")) {
    process.exitCode = 1;
    return;
  }

  const validation = validateGraph(graph as unknown as VGraph);
  printDiagnostics(validation.diagnostics);
  if (!validation.ok) {
    process.exitCode = 1;
    return;
  }

  const mergeInto = flags["--merge-into"] as string | undefined;
  let outJson: GltfJson;
  let binaryChunk: ArrayBuffer | undefined;

  if (mergeInto) {
    const base = await loadDocument(mergeInto);
    outJson = base.json;
    binaryChunk = base.binaryChunk;
    outJson.extensions = { ...(outJson.extensions ?? {}), KHR_interactivity: { graphs: [graph] } };
    outJson.extensionsUsed = Array.from(new Set([...(outJson.extensionsUsed ?? []), "KHR_interactivity"]));
  } else {
    outJson = {
      asset: { version: "2.0", generator: "gltfi compile" },
      extensionsUsed: ["KHR_interactivity"],
      extensions: { KHR_interactivity: { graphs: [graph] } }
    };
  }

  const outPath = (flags["-o"] as string | undefined) ?? deriveOutPath(inPath, ".gltf");
  if (outPath.toLowerCase().endsWith(".glb")) {
    writeBytes(outPath, writeGlb({ json: outJson, binaryChunk }));
  } else {
    writeBytes(outPath, JSON.stringify(outJson, null, 2));
  }
  console.log(`wrote ${outPath}`);
}

async function cmdRoundtrip(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, { "--graph": "string" });
  const inPath = positional[0];
  if (!inPath) fail("roundtrip: missing <in.glb|in.gltf>");

  const doc = await loadDocument(inPath);
  const graphIndex = flags["--graph"] ? Number(flags["--graph"]) : 0;
  const originalGraph = extractGraph(doc.json, graphIndex) as IrGraph;

  const { module, diagnostics: importDiags } = importGraph(originalGraph);
  const importErrors = importDiags.filter((d) => d.severity === "error");
  if (importErrors.length > 0) {
    printDiagnostics(importErrors);
    console.log("VERDICT: FAIL (import errors)");
    process.exitCode = 1;
    return;
  }

  let exported: { graph: unknown; ok: boolean };
  try {
    const { code } = emitModule(module);
    const { module: module2, diagnostics: parseDiags } = parseModule(code);
    const parseErrors = parseDiags.filter((d) => d.severity === "error");
    if (parseErrors.length > 0) {
      printDiagnostics(parseErrors);
      console.log("VERDICT: FAIL (parse errors)");
      process.exitCode = 1;
      return;
    }
    const { graph, diagnostics: exportDiags } = exportGraph(module2);
    printDiagnostics(exportDiags);
    if (exportDiags.some((d) => d.severity === "error")) {
      console.log("VERDICT: FAIL (export errors)");
      process.exitCode = 1;
      return;
    }
    const validation = validateGraph(graph as unknown as VGraph);
    printDiagnostics(validation.diagnostics);
    exported = { graph, ok: validation.ok };
  } catch (err) {
    console.error(err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err));
    console.log("VERDICT: FAIL (emit/parse/export threw)");
    process.exitCode = 1;
    return;
  }
  if (!exported.ok) {
    console.log("VERDICT: FAIL (validateGraph rejected the round-tripped graph)");
    process.exitCode = 1;
    return;
  }

  const equiv = equivalentGraphs(originalGraph as unknown as VGraph, exported.graph as unknown as VGraph);
  console.log(equiv.equivalent ? "equivalentGraphs: EQUIV" : `equivalentGraphs: DIVERGED — ${equiv.firstDivergence}`);

  const testPath = findTestJsonSibling(inPath);
  let judgeOk = true;
  if (testPath) {
    const { interpEngineFromRuntime } = await import("@gltfi/conformance/dist/interp-adapter.js");
    const { judgeTest } = await import("@gltfi/conformance/dist/protocol.js");
    const testJson = JSON.parse(fs.readFileSync(testPath, "utf8"));
    const binary = doc.binaryChunk;

    const originalResult = judgeTest(() => interpEngineFromRuntime(createRuntime(originalGraph as unknown as RuntimeGraph, doc.json, { binary })), testJson);
    const exportedResult = judgeTest(() => interpEngineFromRuntime(createRuntime(exported.graph as unknown as RuntimeGraph, doc.json, { binary })), testJson);
    console.log(`interpreter judge (original):      ${originalResult.ok ? "PASS" : `FAIL\n  - ${originalResult.failures.join("\n  - ")}`}`);
    console.log(`interpreter judge (round-tripped):  ${exportedResult.ok ? "PASS" : `FAIL\n  - ${exportedResult.failures.join("\n  - ")}`}`);
    judgeOk = originalResult.ok && exportedResult.ok;
  } else {
    console.log(`interpreter judge: skipped (no test-Json sibling found for ${inPath})`);
  }

  console.log(`VERDICT: ${judgeOk ? "PASS" : "FAIL"} (structurally ${equiv.equivalent ? "EQUIV" : "DIVERGED"})`);
  if (!judgeOk) {
    process.exitCode = 1;
  }
}

async function cmdVerifyEqual(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, { "--graph-a": "string", "--graph-b": "string" });
  const [aPath, bPath] = positional;
  if (!aPath || !bPath) fail("verify-equal: missing <a.gltf|glb> <b.gltf|glb>");

  const [docA, docB] = await Promise.all([loadDocument(aPath), loadDocument(bPath)]);
  const graphA = extractGraph(docA.json, flags["--graph-a"] ? Number(flags["--graph-a"]) : 0);
  const graphB = extractGraph(docB.json, flags["--graph-b"] ? Number(flags["--graph-b"]) : 0);

  const equiv = equivalentGraphs(graphA as unknown as VGraph, graphB as unknown as VGraph);
  if (equiv.equivalent) {
    console.log(`EQUIV: ${aPath} == ${bPath}`);
  } else {
    console.log(`DIVERGED: ${aPath} != ${bPath}`);
    console.log(`  first divergence: ${equiv.firstDivergence}`);
    process.exitCode = 1;
  }
}

const CONFORM_RUNNERS: Record<string, string> = {
  interp: "run-interp.js",
  compiled: "run-compiled.js",
  roundtrip: "run-roundtrip.js"
};

function cmdConform(argv: string[]): void {
  const [target, ...rest] = argv;
  const runnerFile = CONFORM_RUNNERS[target];
  if (!runnerFile) {
    fail(`conform: unknown target "${target}" (expected one of: ${Object.keys(CONFORM_RUNNERS).join(", ")})`);
  }
  const pkgJsonPath = createRequire(import.meta.url).resolve("@gltfi/conformance/package.json");
  const runnerPath = path.join(path.dirname(pkgJsonPath), "dist", runnerFile);
  const result = spawnSync(process.execPath, [runnerPath, ...rest], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  try {
    switch (command) {
      case "decompile":
        await cmdDecompile(rest);
        break;
      case "compile":
        await cmdCompile(rest);
        break;
      case "roundtrip":
        await cmdRoundtrip(rest);
        break;
      case "verify-equal":
        await cmdVerifyEqual(rest);
        break;
      case "conform":
        cmdConform(rest);
        break;
      case undefined:
      case "-h":
      case "--help":
      case "help":
        console.log(USAGE);
        break;
      default:
        console.error(`Unknown command "${command}".\n`);
        console.error(USAGE);
        process.exitCode = 1;
    }
  } catch (err) {
    if (err instanceof CliError) {
      console.error(`gltfi: ${err.message}`);
      process.exitCode = 1;
    } else {
      throw err;
    }
  }
}

main();
