// Compiled-engine conformance runner: GLB -> importGraph -> emitModule ->
// esbuild bundle (in-process) -> dynamic import() -> judgeTest. Shares the
// corpus index/variant-resolution code with run-interp.ts via assets.ts, and
// the judge protocol via protocol.ts — the only genuinely new code here is
// the emit+bundle+load pipeline.
//
// `@gltfi/runtime-lib` is bundled straight into the compiled-module output
// (not marked external): the generated `.mjs` is written to a content-hash
// cache path that may live outside this package's own node_modules tree
// (see SCRATCH below), so it must not depend on Node's bare-specifier
// resolution finding "@gltfi/runtime-lib" relative to wherever it happens to
// land — a fully self-contained bundle works from any directory.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModule, EmitError } from "@gltfi/emit-ts";
import type { EngineFactory } from "@gltfi/runtime-lib";
import { loadTestAssets } from "./assets.js";
import { judgeTest, type TestJson } from "./protocol.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const CACHE_DIR = process.env.SCRATCH ? path.join(process.env.SCRATCH, "gltfi-compiled-cache") : path.join(REPO_ROOT, "node_modules/.cache/gltfi");

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

async function bundle(code: string): Promise<string> {
  const result = await esbuild.build({
    stdin: {
      contents: code,
      loader: "ts",
      resolveDir: import.meta.dirname,
      sourcefile: "compiled-engine.ts"
    },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    write: false
  });
  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error("esbuild produced no output");
  }
  return output.text;
}

async function loadCompiledFactory(code: string): Promise<EngineFactory> {
  const hash = crypto.createHash("sha1").update(code).digest("hex");
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${hash}.mjs`);
  if (!fs.existsSync(cachePath)) {
    const bundled = await bundle(code);
    fs.writeFileSync(cachePath, bundled);
  }
  const mod = (await import(pathToFileURL(cachePath).href)) as { default: EngineFactory };
  return mod.default;
}

type RunOutcome = { ok: true } | { ok: false; kind: "SKIP" | "FAIL"; reason: string };

async function runOne(asset: { name: string; glbPath: string; testPath: string }): Promise<RunOutcome> {
  let factory: EngineFactory;
  let testJson: TestJson;
  let gltf: unknown;
  try {
    const probe = createRuntimeFromGlbFile(asset.glbPath);
    gltf = probe.gltf;
    const { module, diagnostics } = importGraph(probe.graph as unknown as IrGraph);
    const importErrors = diagnostics.filter((d) => d.severity === "error");
    if (importErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `import errors: ${JSON.stringify(importErrors)}` };
    }
    const checkErrors = checkModule(module).filter((d) => d.severity === "error");
    if (checkErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `check errors: ${JSON.stringify(checkErrors)}` };
    }
    const { code } = emitModule(module);
    factory = await loadCompiledFactory(code);
    testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
  } catch (err) {
    const reason = err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err);
    return { ok: false, kind: err instanceof EmitError ? "SKIP" : "FAIL", reason };
  }

  try {
    const result = judgeTest(() => factory({ gltf }), testJson);
    if (!result.ok) {
      return { ok: false, kind: "FAIL", reason: result.failures.join("\n  - ") };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, kind: "FAIL", reason: err instanceof Error ? (err.stack ?? err.message) : String(err) };
  }
}

async function main() {
  const { filter } = parseArgs(process.argv.slice(2));
  const assets = loadTestAssets(undefined, filter);
  let failures = 0;
  let skips = 0;
  for (const asset of assets) {
    const outcome = await runOne(asset);
    if (outcome.ok) {
      console.log(`PASS ${asset.name}`);
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
  console.log(`${assets.length} tests, ${assets.length - failures - skips} passed, ${failures} failed, ${skips} skipped.`);
  if (failures > 0 || skips > 0) {
    process.exit(1);
  }
  console.log(`All ${assets.length} tests passed.`);
}

main();
