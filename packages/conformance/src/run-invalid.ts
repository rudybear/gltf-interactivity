// Invalid-graph conformance gate: Tests/Interactivity/invalid/ in the Khronos
// corpus. Every case breaks exactly one rule of the spec's "Validation"
// section; a conformant implementation REJECTS it (rejectGraph: the graph;
// rejectExtension: the whole extension, so no graph of the document runs).
// The corpus' own pass criterion is "test/onFailed never arrives"; this runner
// asserts the stronger, explicit property that every load path REJECTS:
//
//   (1) kernel validation (validateExtension) reports >= 1 error, and the
//       outcome mapping (rejectGraph vs rejectExtension) is honoured;
//   (2) the interpreter's load path rejects with InteractivityValidationError:
//       resolveGraph(gltf), `new InteractivityRuntime(graph, gltf)`, and (when
//       the selected graph is itself invalid) createRuntime(graph, gltf);
//       should construction ever succeed the case falls back to the corpus
//       criterion (start + tick, test/onFailed must not be sent) -- counted
//       separately as "ran-clean" and reported;
//   (3) @gltfi/ir importGraph rejects (graph-level invalid), and the compiled
//       pipeline resolveGraph -> importGraph rejects for every case (which is
//       what feeds all of the TS/Lua/Python/C#/GDScript emitters: nothing is
//       emitted for an invalid input);
//   (4) the compiled TS engine path rejects: an engine factory (runtime-lib
//       createEngine) instantiated with the invalid document throws.
//
// It also validates all valid corpus assets (zero errors required) and, when
// checked out, the Models/*.glb showcase assets (reported, not gating).
import fs from "node:fs";
import path from "node:path";
import {
  InteractivityValidationError,
  type ValidationDiagnostic,
  validateExtension,
  validateGraphObject
} from "@gltfi/kernel";
import { importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { createRuntime, InteractivityRuntime, resolveGraph, type Graph } from "@gltfi/runtime";
import { createEngine } from "@gltfi/runtime-lib";
import { DEFAULT_ROOT, loadTestAssets } from "./assets.js";

type InvalidCase = {
  id: string;
  name: string;
  title: string;
  expectedOutcome: "rejectGraph" | "rejectExtension";
  schemaAssert: boolean;
  signalEvent: string;
  variants: { glTF: string };
};

function rejects(fn: () => unknown): { rejected: boolean; typed: boolean; error?: unknown } {
  try {
    fn();
    return { rejected: false, typed: false };
  } catch (error) {
    return { rejected: true, typed: error instanceof InteractivityValidationError, error };
  }
}

function readGlbJson(glbPath: string): any {
  const data = fs.readFileSync(glbPath);
  let offset = 12;
  while (offset < data.length) {
    const len = data.readUInt32LE(offset);
    const type = data.readUInt32LE(offset + 4);
    offset += 8;
    if (type === 0x4e4f534a) {
      return JSON.parse(data.subarray(offset, offset + len).toString("utf8"));
    }
    offset += len;
  }
  throw new Error(`No JSON chunk in ${glbPath}`);
}

function runInvalidCase(root: string, c: InvalidCase): string[] {
  const failures: string[] = [];
  const file = path.join(root, "invalid", c.name.split("/")[1], c.variants.glTF);
  const gltf = JSON.parse(fs.readFileSync(file, "utf8"));
  const ext = gltf.extensions?.KHR_interactivity;

  // (1) kernel validation + outcome mapping
  const v = validateExtension(ext);
  const errors = v.diagnostics.filter((d: ValidationDiagnostic) => d.severity === "error");
  if (v.ok || errors.length === 0) {
    failures.push("kernel validateExtension accepted the extension");
  } else {
    const assertFailures = errors.filter((d: ValidationDiagnostic) => d.outcome === "rejectExtension" && !d.code.startsWith("GE005"));
    if (c.expectedOutcome === "rejectGraph" && assertFailures.length > 0) {
      failures.push(`expected rejectGraph but validation reported extension-level (assert) failures: ${assertFailures[0].code} ${assertFailures[0].message}`);
    }
    if (c.expectedOutcome === "rejectExtension" && c.schemaAssert && assertFailures.length === 0) {
      failures.push("expected an assert (rejectExtension) failure, got only graph-level rejections");
    }
    if (c.expectedOutcome === "rejectGraph" && v.graphs.every((g) => g.ok)) {
      failures.push("expected the graph to be rejected but every graph validated");
    }
    if (errors.some((d: ValidationDiagnostic) => !d.section || !d.code)) {
      failures.push("diagnostic without code/section");
    }
  }

  // (2) interpreter load path
  const viaResolve = rejects(() => resolveGraph(gltf));
  if (!viaResolve.rejected) {
    failures.push("resolveGraph did not reject");
  } else if (!viaResolve.typed) {
    failures.push(`resolveGraph threw a non-InteractivityValidationError: ${String(viaResolve.error)}`);
  }
  const rawGraphs: unknown[] = Array.isArray(ext?.graphs) ? ext.graphs : [];
  const selIndex = typeof ext?.graph === "number" && Number.isInteger(ext.graph) && ext.graph >= 0 ? ext.graph : 0;
  const selected = rawGraphs[selIndex] ?? rawGraphs[0];
  if (selected && typeof selected === "object") {
    const ctor = rejects(() => new InteractivityRuntime(selected as Partial<Graph>, gltf));
    if (!ctor.rejected) {
      // Corpus criterion as fallback: start + tick, the signal must not arrive.
      let sent = false;
      try {
        const rt = new InteractivityRuntime(selected as Partial<Graph>, gltf);
        rt.start();
        for (let i = 0; i < 3; i += 1) rt.tick(1 / 60);
        sent = rt.sentEvents.some((e) => e.externalId === c.signalEvent);
      } catch {
        sent = false;
      }
      failures.push(`InteractivityRuntime constructor did not reject${sent ? ` and ${c.signalEvent} was sent` : " (ran clean)"}`);
    } else if (!ctor.typed) {
      failures.push(`InteractivityRuntime threw a non-InteractivityValidationError: ${String(ctor.error)}`);
    }
    if (!validateGraphObject(selected).ok) {
      const cr = rejects(() => createRuntime(selected as Partial<Graph>, gltf));
      if (!cr.rejected || !cr.typed) {
        failures.push("createRuntime did not reject an invalid selected graph");
      }
      // (3a) importer, graph-level
      const imp = rejects(() => importGraph(selected as IrGraph));
      if (!imp.rejected || !imp.typed) {
        failures.push("importGraph did not reject an invalid selected graph");
      }
    }
  }

  // (3b) compiled pipeline front half: document -> selected graph -> IR
  const pipeline = rejects(() => importGraph(resolveGraph(gltf) as unknown as IrGraph));
  if (!pipeline.rejected || !pipeline.typed) {
    failures.push("resolveGraph -> importGraph pipeline did not reject (emitters would receive input)");
  }

  // (4) compiled TS engine path: any engine factory refuses an invalid document
  const factory = createEngine(() => undefined);
  const eng = rejects(() => factory({ gltf }));
  if (!eng.rejected || !eng.typed) {
    failures.push("runtime-lib engine factory did not reject the invalid document");
  }
  return failures;
}

function main() {
  const root = DEFAULT_ROOT;
  const cases = JSON.parse(fs.readFileSync(path.join(root, "invalid", "invalid-index.json"), "utf8")) as InvalidCase[];
  let passed = 0;
  const failedIds: string[] = [];
  for (const c of cases) {
    let failures: string[];
    try {
      failures = runInvalidCase(root, c);
    } catch (error) {
      failures = [`runner crashed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`];
    }
    if (failures.length === 0) {
      passed += 1;
    } else {
      failedIds.push(c.id);
      console.error(`FAIL ${c.id} (${c.expectedOutcome}) ${c.title}`);
      for (const f of failures) console.error(`  - ${f}`);
    }
  }
  console.log(`invalid corpus: ${passed}/${cases.length} rejected on every load path (kernel, interpreter, importer, compiled pipeline, engine).`);

  // Valid corpus: zero errors required.
  let validFailures = 0;
  const assets = loadTestAssets(root);
  for (const a of assets) {
    const json = readGlbJson(a.glbPath);
    const r = validateExtension(json.extensions?.KHR_interactivity);
    const errs = r.diagnostics.filter((d: ValidationDiagnostic) => d.severity === "error" && (r.graphs.length === 1 || d.graphIndex === r.selectedGraph || d.graphIndex === undefined));
    if (!r.ok || errs.length > 0) {
      validFailures += 1;
      console.error(`FAIL valid ${a.name}: ${errs[0]?.code} ${errs[0]?.message}`);
    }
  }
  console.log(`valid corpus: ${assets.length - validFailures}/${assets.length} validate with zero errors.`);

  // Models (informational; legitimately-invalid showcase assets are reported, not gated).
  const modelsDir = path.resolve(root, "../../Models");
  let modelCount = 0;
  const modelProblems: string[] = [];
  if (fs.existsSync(modelsDir)) {
    for (const dir of fs.readdirSync(modelsDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const binDir = path.join(modelsDir, dir.name, "glTF-Binary");
      if (!fs.existsSync(binDir)) continue;
      for (const f of fs.readdirSync(binDir).filter((n) => n.endsWith(".glb"))) {
        modelCount += 1;
        try {
          const json = readGlbJson(path.join(binDir, f));
          const ext = json.extensions?.KHR_interactivity;
          if (!ext) {
            modelProblems.push(`${dir.name}/${f}: no KHR_interactivity extension`);
            continue;
          }
          const r = validateExtension(ext);
          const errs = r.diagnostics.filter((d: ValidationDiagnostic) => d.severity === "error");
          if (!r.ok || errs.length > 0) {
            modelProblems.push(`${dir.name}/${f}: ${r.ok ? "ok but" : "REJECTED;"} ${errs.length} error(s), first: ${errs[0]?.code} ${errs[0]?.message}`);
          }
        } catch (error) {
          modelProblems.push(`${dir.name}/${f}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    console.log(`models: ${modelCount - modelProblems.length}/${modelCount} validate cleanly.`);
    for (const p of modelProblems) console.log(`  MODEL ${p}`);
  } else {
    console.log("models: Models/ not checked out, skipped.");
  }

  if (failedIds.length > 0 || validFailures > 0) {
    process.exit(1);
  }
  console.log(`All ${cases.length} invalid cases rejected; all ${assets.length} valid assets accepted.`);
}

main();
