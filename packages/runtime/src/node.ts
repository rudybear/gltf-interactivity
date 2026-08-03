// Node-only shim around the environment-neutral interpreter core: reads GLB
// files from disk (JSON + BIN chunk splitting) and wires the result into
// createRuntime. Import this from Node/CLI code (conformance runner, debug
// tooling); browser bundlers should stick to the package root, which never
// touches node:fs.
import fs from "node:fs";
import {
  createRuntime,
  evaluateGraphTests,
  executeFlow,
  resolveGraph,
  type RuntimeGraph,
  type TestEntry,
  type TestJson,
  type TestResult
} from "./interpreter.js";

export * from "./interpreter.js";

function readGlb(filePath: string): { json: any; bin: Buffer | null } {
  const data = fs.readFileSync(filePath);
  const magic = data.toString("utf8", 0, 4);
  if (magic !== "glTF") {
    throw new Error(`Invalid GLB magic in ${filePath}`);
  }
  let offset = 12;
  let jsonChunk: Buffer | null = null;
  let binChunk: Buffer | null = null;
  while (offset < data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    offset += 8;
    const chunkData = data.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === 0x4e4f534a) {
      jsonChunk = chunkData;
    } else if (chunkType === 0x004e4942) {
      binChunk = chunkData;
    }
  }
  if (!jsonChunk) {
    throw new Error(`Missing JSON chunk in ${filePath}`);
  }
  return { json: JSON.parse(jsonChunk.toString("utf8")), bin: binChunk };
}

export function createRuntimeFromGlbFile(glbPath: string): RuntimeGraph {
  const { json: gltf, bin } = readGlb(glbPath);
  const graph = resolveGraph(gltf);
  return createRuntime(graph, gltf, { binary: bin ?? undefined });
}

// Follows the official protocol from glTF-Test-Assets-Interactivity. Thin
// file-loading wrapper around the core's evaluateGraphTests: builds a fresh
// runtime per sub-test (matching the corpus's isolated-test-case protocol)
// straight from the GLB on disk.
export function evaluateTest(entry: TestEntry): TestResult {
  const testJson = JSON.parse(fs.readFileSync(entry.testPath, "utf8")) as TestJson;
  return evaluateGraphTests(() => createRuntimeFromGlbFile(entry.glbPath), testJson);
}

export function debugRun(glbPath: string, nodeId: number) {
  const runtime = createRuntimeFromGlbFile(glbPath);
  runtime.trace = [];
  executeFlow(runtime, nodeId);
  return { variables: runtime.variables, trace: runtime.trace, gltf: runtime.gltf };
}
