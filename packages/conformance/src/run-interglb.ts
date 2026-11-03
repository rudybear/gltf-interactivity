// Inter-GLB conformance runner (Tests/Interactivity/InterGlb/): loads
// RefEcho_FileA.glb + RefEcho_FileB.glb into ONE session joined to a shared
// EventBus and judges all three sub-tests (A: 2, B: 1). Run for the
// interpreter, the compiled TS engine, and the two mixed pairings.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { EventBus } from "@gltfi/kernel";
import { createRuntimeFromGlbFile, joinEventBus } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import type { EngineFactory, EngineLike } from "@gltfi/runtime-lib";
import { DEFAULT_ROOT } from "./assets.js";
import { interpEngineFromRuntime } from "./interp-adapter.js";
import { countSubTests, judgeGroup, type GroupMember } from "./protocol-group.js";
import { CONFORMANCE_ACTIVE_CAMERA, type TestJson } from "./protocol.js";

const FILES = ["RefEcho_FileA", "RefEcho_FileB"] as const;
const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const CACHE_DIR = process.env.SCRATCH ? path.join(process.env.SCRATCH, "gltfi-compiled-cache") : path.join(REPO_ROOT, "node_modules/.cache/gltfi");

type Kind = "interp" | "compiled";
type Loaded = { name: string; glbPath: string; testJson: TestJson; factory?: EngineFactory; gltf: unknown; glbBin: DataView | null };

async function loadCompiledFactory(code: string): Promise<EngineFactory> {
  const hash = crypto.createHash("sha1").update(code).digest("hex");
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${hash}.mjs`);
  if (!fs.existsSync(cachePath)) {
    const result = await esbuild.build({
      stdin: { contents: code, loader: "ts", resolveDir: import.meta.dirname, sourcefile: "compiled-engine.ts" },
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node18",
      write: false
    });
    fs.writeFileSync(cachePath, result.outputFiles[0].text);
  }
  return ((await import(pathToFileURL(cachePath).href)) as { default: EngineFactory }).default;
}

async function load(name: string): Promise<Loaded> {
  const dir = path.join(DEFAULT_ROOT, "InterGlb", name);
  const glbPath = path.join(dir, "glTF-Binary", `${name}.glb`);
  const testJson = JSON.parse(fs.readFileSync(path.join(dir, "test-Json", `${name}.json`), "utf8")) as TestJson;
  const probe = createRuntimeFromGlbFile(glbPath);
  const { module, diagnostics } = importGraph(probe.graph as unknown as IrGraph);
  const errors = [...diagnostics, ...checkModule(module)].filter((d) => d.severity === "error");
  if (errors.length > 0) {
    throw new Error(`${name}: ${JSON.stringify(errors)}`);
  }
  const factory = await loadCompiledFactory(emitModule(module).code);
  return { name, glbPath, testJson, factory, gltf: probe.gltf, glbBin: probe.glbBin };
}

function makeMember(loaded: Loaded, kind: Kind, bus: EventBus): GroupMember {
  let engine: EngineLike;
  if (kind === "interp") {
    const runtime = createRuntimeFromGlbFile(loaded.glbPath, { activeCamera: CONFORMANCE_ACTIVE_CAMERA });
    joinEventBus(runtime, bus, loaded.name);
    engine = interpEngineFromRuntime(runtime);
  } else {
    engine = (loaded.factory as EngineFactory)({
      gltf: loaded.gltf,
      glbBin: loaded.glbBin,
      activeCamera: CONFORMANCE_ACTIVE_CAMERA,
      eventBus: bus,
      eventBusName: loaded.name
    });
  }
  return { name: `${loaded.name}[${kind}]`, engine, testJson: loaded.testJson };
}

async function main() {
  const loaded = await Promise.all(FILES.map(load));
  const combos: Array<[string, Kind[]]> = [
    ["interpreter", ["interp", "interp"]],
    ["compiled-ts", ["compiled", "compiled"]],
    ["mixed interp+compiled", ["interp", "compiled"]],
    ["mixed compiled+interp", ["compiled", "interp"]]
  ];
  let failed = 0;
  let total = 0;
  for (const [label, kinds] of combos) {
    const bus = new EventBus();
    let subTests = 0;
    const result = judgeGroup(() => {
      const members = loaded.map((l, i) => makeMember(l, kinds[i], bus));
      subTests = countSubTests(members);
      return members;
    });
    total = subTests;
    if (result.ok) {
      console.log(`PASS ${label}: ${subTests}/${subTests} sub-tests`);
    } else {
      failed += 1;
      console.error(`FAIL ${label}`);
      for (const f of result.failures) console.error(`  - ${f}`);
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
  console.log(`All InterGlb sub-tests passed (${total}/${total}) in ${combos.length} configurations.`);
}

main();
