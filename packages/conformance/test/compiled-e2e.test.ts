// End-to-end smoke test for the compiled path: GLB -> importGraph ->
// emitModule -> esbuild bundle -> dynamic import -> judgeTest, on one small
// corpus math GLB. run-compiled.ts exercises this same pipeline across the
// whole math/type/ref corpus; this test pins the pipeline itself (not the
// corpus breadth) so a regression here is fast to isolate from a slow full
// conformance run.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import * as esbuild from "esbuild";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import type { EngineFactory } from "@gltfi/runtime-lib";
import { judgeTest, type TestJson } from "../src/protocol.js";

const ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

async function compileAndLoad(glbPath: string) {
  const probe = createRuntimeFromGlbFile(glbPath);
  const { module, diagnostics } = importGraph(probe.graph as unknown as IrGraph);
  expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  expect(checkModule(module).filter((d) => d.severity === "error")).toEqual([]);

  const { code } = emitModule(module);
  const result = await esbuild.build({
    stdin: { contents: code, loader: "ts", resolveDir: path.resolve(import.meta.dirname, "../src"), sourcefile: "compiled-engine.ts" },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    write: false
  });
  const bundled = result.outputFiles?.[0]?.text;
  expect(bundled).toBeTruthy();

  const tmpFile = path.join(os.tmpdir(), `gltfi-emit-ts-e2e-${crypto.randomUUID()}.mjs`);
  fs.writeFileSync(tmpFile, bundled!);
  try {
    const mod = (await import(pathToFileURL(tmpFile).href)) as { default: EngineFactory };
    return { factory: mod.default, gltf: probe.gltf, code };
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

describe("emit-ts + runtime-lib end-to-end (compiled path)", () => {
  it("compiles and passes math/abs", async () => {
    const { factory, gltf } = await compileAndLoad(path.join(ROOT, "math/abs/glTF-Binary/abs.glb"));
    const testJson = JSON.parse(fs.readFileSync(path.join(ROOT, "math/abs/test-Json/abs.json"), "utf8")) as TestJson;
    const result = judgeTest(() => factory({ gltf }), testJson);
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("compiles and passes ref/eq (pointer/get against real glTF node data)", async () => {
    const { factory, gltf } = await compileAndLoad(path.join(ROOT, "ref/eq/glTF-Binary/eq.glb"));
    const testJson = JSON.parse(fs.readFileSync(path.join(ROOT, "ref/eq/test-Json/eq.json"), "utf8")) as TestJson;
    const result = judgeTest(() => factory({ gltf }), testJson);
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("compiles and passes math/random (RNG parity is what makes this pass — see runtime-lib's engine.test.ts for a direct LCG-sequence assertion)", async () => {
    const { factory, gltf } = await compileAndLoad(path.join(ROOT, "math/random/glTF-Binary/random.glb"));
    const testJson = JSON.parse(fs.readFileSync(path.join(ROOT, "math/random/test-Json/random.json"), "utf8")) as TestJson;
    const result = judgeTest(() => factory({ gltf }), testJson);
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
