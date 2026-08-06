#!/usr/bin/env node
// gltfi — CLI over the decompile/compile/verify pipeline built by the other
// packages in this repo (@gltfi/ir, @gltfi/emit-ts, @gltfi/parse-ts,
// @gltfi/verify, @gltfi/gltf, @gltfi/runtime, @gltfi/conformance). Plain
// process.argv parsing, no CLI framework dependency — see util.ts.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { checkModule, exportGraph, importGraph, type Graph as IrGraph, type IRModule } from "@gltfi/ir";
import { emitModule, EmitError } from "@gltfi/emit-ts";
import { parseModule } from "@gltfi/parse-ts";
import { compareDeclarations, equivalentGraphs, validateGraph, type VGraph } from "@gltfi/verify";
import { parseContainer, spliceGraph, writeContainer, writeGlb, type Container, type GltfJson, type SpliceReport } from "@gltfi/gltf";
import { createRuntime, type Graph as RuntimeGraph } from "@gltfi/runtime";
import { langFromPath, loadLang, LANG_IDS, type LangEmitResult, type LangId } from "./lang.js";
import {
  atomicWriteFile,
  CliError,
  deriveOutPath,
  extractGraph,
  fail,
  findTestJsonSibling,
  loadDocument,
  namesSidecarPath,
  parseArgs,
  printDiagnostics,
  readArrayBuffer,
  tryExtractGraph,
  writeBytes
} from "./util.js";

const USAGE = `gltfi — KHR_interactivity decompile/compile/edit/verify CLI

Usage:
  gltfi decompile <in.glb|in.gltf> [-o out.ts] [--js] [--graph N]
  gltfi compile <in.ts> [-o out.gltf|out.glb] [--merge-into base.glb]
  gltfi extract <in.glb|in.gltf> [-o out] [--lang ts|lua|py|cs|gd] [--graph N] [--force]
  gltfi apply <asset.glb|asset.gltf> <script> [--graph N] [--lang ts|lua|py|cs|gd] [--dry-run] [--backup]
  gltfi roundtrip <in.glb|in.gltf> [--graph N]
  gltfi verify-equal <a.gltf|a.glb> <b.gltf|b.glb> [--graph-a N] [--graph-b N]
  gltfi conform <interp|compiled|roundtrip> [--filter x]

extract/apply are the byte-preserving edit workflow: "gltfi extract asset.glb"
writes a script beside the asset (language inferred from --lang, default ts);
after editing it, "gltfi apply asset.glb asset.ts" splices the edited graph
back in, leaving every byte outside extensions.KHR_interactivity.graphs[N]
untouched. .cs scripts require \`dotnet\` on PATH (parse-cs's AST harness);
.py scripts require \`python3\` on PATH.
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

    // Preserve every sibling KHR_interactivity key (most importantly the
    // "graph" selector, and any graphs[] slot other than 0) instead of
    // replacing the whole extension object — the bug this milestone fixes
    // (see the R3 plan's A4: "--merge-into replaces the whole
    // KHR_interactivity object" used to delete the selector and could only
    // ever write graphs[0]). Still a full JSON.stringify via writeGlb below
    // (floats reformat, unknown GLB chunks are dropped) — that byte-
    // preservation gap is what `gltfi apply` (extract/apply's splice path)
    // exists to close; this path is kept only for compiling a brand-new
    // script into an EXISTING base asset that has no prior script to
    // extract from.
    const existingExt = (base.json.extensions as Record<string, unknown> | undefined)?.KHR_interactivity as
      | { graphs?: unknown[]; graph?: number }
      | undefined;
    const graphs = Array.isArray(existingExt?.graphs) ? [...existingExt.graphs] : [];
    graphs[0] = graph;
    const mergedExt: Record<string, unknown> = { ...(existingExt ?? {}), graphs };
    if (typeof mergedExt.graph !== "number") {
      mergedExt.graph = 0;
    }

    outJson.extensions = { ...(outJson.extensions ?? {}), KHR_interactivity: mergedExt };
    outJson.extensionsUsed = Array.from(new Set([...(outJson.extensionsUsed ?? []), "KHR_interactivity"]));
    console.error(
      "gltfi compile --merge-into: full-document re-stringify (floats reformat, unknown GLB chunks dropped, only graphs[0] is written) — prefer `gltfi apply` for byte-preserving, id-stable edits to an existing asset."
    );
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

function assertKnownLang(id: string): asserts id is LangId {
  if (!(LANG_IDS as string[]).includes(id)) {
    fail(`unknown --lang "${id}" (expected one of: ${LANG_IDS.join(", ")})`);
  }
}

// gltfi extract: parseContainer -> extractGraph -> importGraph -> checkModule
// (errors fatal — stricter than `decompile`, which only gates on import
// errors) -> the chosen language's emitter -> write script. Deliberately
// writes NO .names.json sidecar (see the R3 plan's A4): once variable ids
// round-trip in-source (R3-A1), the sidecar is redundant for this workflow —
// `decompile` still writes one for its own, separate use case.
async function cmdExtract(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, { "-o": "string", "--lang": "string", "--graph": "string", "--force": "boolean" });
  const inPath = positional[0];
  if (!inPath) fail("extract: missing <asset>");

  const langId = (flags["--lang"] as string | undefined) ?? "ts";
  assertKnownLang(langId);

  const graphIndex = flags["--graph"] ? Number(flags["--graph"]) : 0;
  const bytes = new Uint8Array(fs.readFileSync(inPath));
  const container = parseContainer(bytes);
  const graph = extractGraph(container.json, graphIndex);

  const { module, diagnostics: importDiags } = importGraph(graph as IrGraph);
  printDiagnostics(importDiags);
  const checkDiags = checkModule(module);
  printDiagnostics(checkDiags);
  if (importDiags.some((d) => d.severity === "error") || checkDiags.some((d) => d.severity === "error")) {
    fail("extract: aborting — module did not pass import/checkModule (see errors above)");
  }

  const lang = await loadLang(langId);
  const explicitOut = flags["-o"] !== undefined;
  const outPath = (flags["-o"] as string | undefined) ?? deriveOutPath(inPath, lang.ext);
  if (fs.existsSync(outPath) && !explicitOut && !flags["--force"]) {
    fail(`extract: ${outPath} already exists — pass -o to choose a different path or --force to overwrite`);
  }

  let emitted: LangEmitResult;
  try {
    emitted = lang.emitModule(module);
  } catch (err) {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    fail("extract: emit failed — see error above");
  }

  writeBytes(outPath, emitted.code);
  console.log(`wrote ${outPath}`);
}

// declarations vs graphs[N]'s per-table sub-line: compareDeclarations
// returns one string per individual change with no summary — this adds the
// "unchanged (N)" summary line the R3 plan's A5 report format calls for
// when a table (variables, or events) has no changes at all, and otherwise
// lists that table's changes verbatim (compareDeclarations' own lines
// already read naturally, e.g. `variables[2]: id "counter" -> (none)`).
function declarationTableItems(prefix: "variables" | "events", changes: string[], count: number): string[] {
  const tableChanges = changes.filter((c) => c.startsWith(prefix));
  return tableChanges.length === 0 ? [`${prefix}: unchanged (${count})`] : tableChanges;
}

// Renders the report's "declarations vs graphs[N]:" block per the R3 plan's
// A5 stable format: the label, then the first item on the same line, then
// every subsequent item indented to align under it — e.g.
//   declarations vs graphs[0]:  variables: unchanged (3)
//                               events[1].values.expectedDuration: default 1 -> 2
function formatDeclarationsSection(graphIndex: number, comparison: { changes: string[] }, oldGraph: VGraph): string {
  const label = `declarations vs graphs[${graphIndex}]:`;
  const items = [
    ...declarationTableItems("variables", comparison.changes, oldGraph.variables?.length ?? 0),
    ...declarationTableItems("events", comparison.changes, oldGraph.events?.length ?? 0)
  ];
  const indent = " ".repeat(label.length + 2);
  return items.map((item, i) => (i === 0 ? `${label}  ${item}` : `${indent}${item}`)).join("\n");
}

// gltfi apply: parse script -> exportGraph -> validateGraph (hard gate: on
// error, print + exit 1 + write nothing) -> build the FULL report (decl
// diff, structural equivalence, interpreter judge, splice mode/byte counts)
// BEFORE any write -> --dry-run stops here -> splice + atomic write. Exit
// nonzero on validation/splice failure or a FAIL judge verdict on the NEW
// graph (the asset is still written in that last case — the report says so
// explicitly). The declaration diff is advisory only and never affects the
// exit code, per the R3 plan's A4/A5.
async function cmdApply(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv, {
    "--graph": "string",
    "--dry-run": "boolean",
    "--backup": "boolean",
    "--lang": "string"
  });
  const [assetPath, scriptPath] = positional;
  if (!assetPath || !scriptPath) fail("apply: missing <asset> <script>");

  const graphIndex = flags["--graph"] ? Number(flags["--graph"]) : 0;
  const dryRun = Boolean(flags["--dry-run"]);
  const backup = Boolean(flags["--backup"]);

  const langId = (flags["--lang"] as string | undefined) ?? langFromPath(scriptPath);
  if (!langId) {
    fail(`apply: cannot infer a language from "${scriptPath}" — pass --lang (${LANG_IDS.join("|")})`);
  }
  assertKnownLang(langId);

  const lang = await loadLang(langId);
  const code = fs.readFileSync(scriptPath, "utf8");

  let module: IRModule;
  try {
    const { module: parsedModule, diagnostics: parseDiags } = lang.parseModule(code);
    printDiagnostics(parseDiags);
    if (parseDiags.some((d) => d.severity === "error")) {
      process.exitCode = 1;
      return;
    }
    module = parsedModule;
  } catch (err) {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exitCode = 1;
    return;
  } finally {
    lang.close?.();
  }

  const { graph: newGraph, diagnostics: exportDiags } = exportGraph(module);
  printDiagnostics(exportDiags);
  if (exportDiags.some((d) => d.severity === "error")) {
    process.exitCode = 1;
    return;
  }

  const validation = validateGraph(newGraph as unknown as VGraph);
  printDiagnostics(validation.diagnostics);
  if (!validation.ok) {
    process.exitCode = 1;
    return;
  }

  // --- validate: OK — build the full report before any write. ---
  const assetBytes = new Uint8Array(fs.readFileSync(assetPath));
  const container = parseContainer(assetBytes);
  const oldGraphRaw = tryExtractGraph(container.json, graphIndex);

  const lines: string[] = [];
  lines.push(`apply: parsed ${path.basename(scriptPath)} (${langId})`);
  lines.push(`validate: OK`);

  if (oldGraphRaw === undefined) {
    lines.push(`declarations vs graphs[${graphIndex}]:  (no existing graph — nothing to compare)`);
    lines.push(`graph equivalence: n/a (no existing graph at graphs[${graphIndex}])`);
  } else {
    const comparison = compareDeclarations(oldGraphRaw as unknown as VGraph, newGraph as unknown as VGraph);
    lines.push(formatDeclarationsSection(graphIndex, comparison, oldGraphRaw as unknown as VGraph));
    const equiv = equivalentGraphs(oldGraphRaw as unknown as VGraph, newGraph as unknown as VGraph);
    lines.push(`graph equivalence: ${equiv.equivalent ? "EQUIV" : `DIVERGED — ${equiv.firstDivergence}`}`);
  }

  // Interpreter judge: reuses cmdRoundtrip's own engine adapter/judgeTest
  // wiring (see above) against the SAME asset's test-Json sibling, judging
  // the old graph (if one exists) and the newly-exported one identically.
  let newJudgeFailed = false;
  const testPath = findTestJsonSibling(assetPath);
  if (testPath) {
    const { interpEngineFromRuntime } = await import("@gltfi/conformance/interp-adapter");
    const { judgeTest } = await import("@gltfi/conformance/protocol");
    const testJson = JSON.parse(fs.readFileSync(testPath, "utf8"));
    const doc = await loadDocument(assetPath);
    const binary = doc.binaryChunk;

    let oldStatus = "n/a (no existing graph)";
    if (oldGraphRaw !== undefined) {
      const oldResult = judgeTest(
        () => interpEngineFromRuntime(createRuntime(oldGraphRaw as unknown as RuntimeGraph, doc.json, { binary })),
        testJson
      );
      oldStatus = oldResult.ok ? "PASS" : `FAIL (${oldResult.failures.join("; ")})`;
    }
    const newResult = judgeTest(() => interpEngineFromRuntime(createRuntime(newGraph as unknown as RuntimeGraph, doc.json, { binary })), testJson);
    const newStatus = newResult.ok ? "PASS" : `FAIL (${newResult.failures.join("; ")})`;
    newJudgeFailed = !newResult.ok;
    lines.push(`interpreter judge: old ${oldStatus} / new ${newStatus}`);
  } else {
    lines.push(`interpreter judge: skipped (no test-Json sibling)`);
  }

  // Splice the new graph into the container IN MEMORY now (so its
  // mode/byte counts can appear in the report below) — nothing touches disk
  // until the --dry-run check.
  let spliceOutcome: { container: Container; report: SpliceReport } | undefined;
  let spliceError: string | undefined;
  try {
    spliceOutcome = spliceGraph(container, graphIndex, newGraph);
  } catch (err) {
    spliceError = err instanceof Error ? err.message : String(err);
  }

  if (spliceError !== undefined) {
    lines.push(`splice: FAILED (${spliceError})`);
  } else if (spliceOutcome!.report.mode === "splice") {
    lines.push(
      `splice: extensions.KHR_interactivity.graphs[${graphIndex}] (${spliceOutcome!.report.spanBytesBefore} -> ${spliceOutcome!.report.spanBytesAfter} bytes)`
    );
  } else {
    lines.push(`splice: full reserialize (byte-preservation not possible; ${spliceOutcome!.report.spanBytesAfter} bytes)`);
  }

  if (dryRun) {
    lines.push(`dry-run: no changes written`);
    console.log(lines.join("\n"));
    if (spliceError !== undefined || newJudgeFailed) {
      process.exitCode = 1;
    }
    return;
  }

  if (spliceError !== undefined) {
    lines.push(`ERROR: nothing written (splice failed)`);
    console.log(lines.join("\n"));
    process.exitCode = 1;
    return;
  }

  let backupPath: string | undefined;
  if (backup) {
    backupPath = `${assetPath}.bak`;
    fs.copyFileSync(assetPath, backupPath);
  }
  const outData = writeContainer(spliceOutcome!.container);
  atomicWriteFile(assetPath, outData);

  lines.push(backupPath ? `wrote ${assetPath} (backup: ${backupPath})` : `wrote ${assetPath}`);
  if (newJudgeFailed) {
    lines.push(`note: exiting nonzero — interpreter judge FAILed on the new graph (asset was still written)`);
  }
  console.log(lines.join("\n"));

  if (newJudgeFailed) {
    process.exitCode = 1;
  }
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
    const { interpEngineFromRuntime } = await import("@gltfi/conformance/interp-adapter");
    const { judgeTest } = await import("@gltfi/conformance/protocol");
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
      case "extract":
        await cmdExtract(rest);
        break;
      case "apply":
        await cmdApply(rest);
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
