// Small argv/IO helpers shared by every subcommand in main.ts. Deliberately
// dependency-free (plain process.argv parsing, no yargs/commander) per the
// polish milestone's brief.
import fs from "node:fs";
import path from "node:path";
import { loadGltf, type GltfDocument, type GltfJson } from "@gltfi/gltf";
import type { Diagnostic } from "@gltfi/ir";

export class CliError extends Error {}

export function fail(message: string): never {
  throw new CliError(message);
}

// Splits argv into positionals and flags. `flagSpec` maps a flag name to
// "string" (consumes the next argv) or "boolean" (present/absent only).
export type FlagSpec = Record<string, "string" | "boolean">;

export function parseArgs(argv: string[], flagSpec: FlagSpec): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const kind = flagSpec[arg];
    if (kind === "boolean") {
      flags[arg] = true;
    } else if (kind === "string") {
      const value = argv[i + 1];
      if (value === undefined) {
        fail(`${arg}: missing value`);
      }
      flags[arg] = value;
      i += 1;
    } else if (arg.startsWith("-")) {
      fail(`unrecognized flag "${arg}"`);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

export function readArrayBuffer(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export function writeBytes(filePath: string, data: ArrayBuffer | Uint8Array | string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (typeof data === "string") {
    fs.writeFileSync(filePath, data);
  } else if (data instanceof Uint8Array) {
    fs.writeFileSync(filePath, Buffer.from(data));
  } else {
    fs.writeFileSync(filePath, Buffer.from(data));
  }
}

// Swaps the input path's extension for `ext` (e.g. "scene.glb" + ".ts" ->
// "scene.ts"), in the same directory as the input.
export function deriveOutPath(inPath: string, ext: string): string {
  const base = path.basename(inPath, path.extname(inPath));
  return path.join(path.dirname(inPath), base + ext);
}

// The decompile sidecar sits next to the emitted module, same basename,
// ".names.json" — see docs/design/ir-and-transpiler.md's "Sidecar
// out.names.json" note.
export function namesSidecarPath(outPath: string): string {
  const ext = path.extname(outPath);
  return (ext ? outPath.slice(0, -ext.length) : outPath) + ".names.json";
}

export function printDiagnostics(diagnostics: Diagnostic[]): void {
  for (const d of diagnostics) {
    const where = d.nodeIndex !== undefined ? ` (node ${d.nodeIndex})` : "";
    console.error(`${d.severity.toUpperCase()} ${d.code}${where}: ${d.message}`);
  }
}

export async function loadDocument(filePath: string): Promise<GltfDocument> {
  return loadGltf(readArrayBuffer(filePath));
}

// Best-effort lookup — returns undefined rather than failing when the asset
// has no KHR_interactivity extension or no graph at that index. `apply`'s
// report (main.ts's cmdApply) needs this non-throwing form: an asset with no
// existing graph is a legitimate starting point (see the "no-interactivity
// asset" case in the R3 plan's A6), just one with nothing to diff against.
export function tryExtractGraph(json: GltfJson, graphIndex: number): unknown | undefined {
  const graphs = (json.extensions as { KHR_interactivity?: { graphs?: unknown[] } } | undefined)?.KHR_interactivity?.graphs;
  return graphs?.[graphIndex];
}

export function extractGraph(json: GltfJson, graphIndex: number): unknown {
  const graph = tryExtractGraph(json, graphIndex);
  if (!graph) {
    const graphs = (json.extensions as { KHR_interactivity?: { graphs?: unknown[] } } | undefined)?.KHR_interactivity?.graphs;
    fail(`no KHR_interactivity.graphs[${graphIndex}] found (asset has ${graphs?.length ?? 0} graph(s))`);
  }
  return graph;
}

// Writes `data` to a same-directory temp file first, then renames it over
// `filePath` — a rename within one filesystem/directory is atomic, so a
// process killed mid-write (or a concurrent reader) never observes a
// partially-written asset. Used by `apply` (main.ts's cmdApply) for its
// final asset write, per the R3 plan's A4/A5 "atomic write" contract.
export function atomicWriteFile(filePath: string, data: Uint8Array | string): void {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.gltfi-tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(tmpPath, typeof data === "string" ? data : Buffer.from(data));
  fs.renameSync(tmpPath, filePath);
}

// KHR_interactivity assets in the wild put the test oracle JSON next to the
// binary in a few conventional layouts (see the glTF-Test-Assets-
// Interactivity corpus: ".../<case>/glTF-Binary/x.glb" beside
// ".../<case>/test-Json/x.json"). Best-effort lookup — returns undefined
// rather than erroring when none of the conventional spellings exist, since
// the oracle check is optional.
export function findTestJsonSibling(inPath: string): string | undefined {
  const dir = path.dirname(inPath);
  const base = path.basename(inPath, path.extname(inPath));
  const parent = path.dirname(dir);
  const candidates = [
    path.join(dir, `${base}.json`),
    path.join(parent, "test-Json", `${base}.json`),
    path.join(dir, "test-Json", `${base}.json`),
    path.join(dir.replace(/glTF-Binary$/, "test-Json"), `${base}.json`)
  ];
  return candidates.find((p) => fs.existsSync(p));
}
