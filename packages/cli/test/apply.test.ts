// End-to-end coverage for `gltfi extract`/`gltfi apply` (see the R3 plan's
// A6 and main.ts's cmdExtract/cmdApply) — invoked exactly as a user would,
// via child_process against the BUILT dist/main.js (see cli.test.ts's own
// header for why: catches argv/IO/"bin" wiring regressions, not just
// unit-level ones). Covers, per language:
//   (a) byte-identical prefix/suffix outside the recomputed graph-element
//       span (GLB: plus every non-JSON chunk and header field)
//   (b) re-extract -> parse -> every variable/event id round-trips
//   (c) structural equivalence (equivalentGraphs), tolerating the corpus's
//       documented DIVERGED classes (see @gltfi/verify's own header: ~131/
//       145 EQUIV after canonicalization; the rest are explained, execution-
//       equivalent divergences) by falling back to the interpreter judge
//   (d) interpreter judge PASS against the asset's test-Json oracle
// plus the synthetic-fixture and flag-behavior cases the plan's A6 calls
// out by name (unknown GLB chunk preserved, UUID variable id round-trips
// byte-identically in all five languages, a no-interactivity asset hits
// spliceGraph's reserialize fallback, --dry-run writes nothing, --backup
// creates a .bak).
//
// The default run exercises a 6-asset subset spanning the corpus's
// categories (math/flow/event/pointer/animation/variable); set
// GLTFI_APPLY_FULL=1 to run the full ~145-asset corpus per language instead
// (slow — every .cs/.py case spawns its own dotnet/python3 subprocess per
// `gltfi apply` invocation, since each is a fresh child process).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { locateJsonSpan, parseContainer, writeContainer, type Container } from "@gltfi/gltf";
import { equivalentGraphs, type VGraph } from "@gltfi/verify";
import { loadLang, LANG_EXTENSIONS, LANG_IDS, type LangId } from "../src/lang.js";

const CLI_PATH = path.resolve(import.meta.dirname, "../dist/main.js");
const CORPUS_ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");
const GRAPH_PATH = ["extensions", "KHR_interactivity", "graphs", 0] as const;

function runCli(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { encoding: "utf8" });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

function commandAvailable(cmd: string): boolean {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const HAS_DOTNET = commandAvailable("dotnet");
const HAS_GODOT = commandAvailable("godot");

let workDir: string;

beforeAll(() => {
  expect(fs.existsSync(CLI_PATH), `${CLI_PATH} missing — run "pnpm build" first`).toBe(true);
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-apply-test-"));
});

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Corpus helpers
// ---------------------------------------------------------------------------

function corpusCase(name: string): { glbPath: string; testPath: string } {
  const base = path.basename(name);
  const dir = path.join(CORPUS_ROOT, name);
  const glbPath = path.join(dir, "glTF-Binary", `${base}.glb`);
  const testPath = path.join(dir, "test-Json", `${base}.json`);
  if (!fs.existsSync(glbPath) || !fs.existsSync(testPath)) {
    throw new Error(`missing corpus case "${name}" (looked for ${glbPath} / ${testPath})`);
  }
  return { glbPath, testPath };
}

// Copies one corpus case into a fresh temp directory, preserving the
// glTF-Binary/test-Json sibling layout `findTestJsonSibling` (util.ts) looks
// for, so `apply`'s interpreter judge step actually finds the oracle.
function setupCase(name: string, tag: string): { glbPath: string; testPath: string } {
  const { glbPath, testPath } = corpusCase(name);
  const base = path.basename(name);
  const caseDir = path.join(workDir, `${tag}-${name.replace(/[\\/]/g, "_")}`);
  const outGlb = path.join(caseDir, "glTF-Binary", `${base}.glb`);
  const outTest = path.join(caseDir, "test-Json", `${base}.json`);
  fs.mkdirSync(path.dirname(outGlb), { recursive: true });
  fs.mkdirSync(path.dirname(outTest), { recursive: true });
  fs.copyFileSync(glbPath, outGlb);
  fs.copyFileSync(testPath, outTest);
  return { glbPath: outGlb, testPath: outTest };
}

const REPRESENTATIVE_CASES = ["math/xor", "flow/branch", "event/send_and_receive", "pointer/set_and_get", "animation/start", "variable/set_and_get"];

function allCorpusCaseNames(): string[] {
  const names: string[] = [];
  for (const file of ["test-index.json", "mathtests-index.json"]) {
    const entries = JSON.parse(fs.readFileSync(path.join(CORPUS_ROOT, file), "utf8")) as Array<{ name: string }>;
    names.push(...entries.map((e) => e.name));
  }
  return names;
}

const CASES = process.env.GLTFI_APPLY_FULL === "1" ? allCorpusCaseNames() : REPRESENTATIVE_CASES;

// KNOWN GLTFI_APPLY_FULL=1 EXCEPTION: "math/transform" fails re-extract with
// a GIC021 type mismatch (a generically-typed TestResult variable declared
// float4, fed a float3 on the SECOND import). This reproduces identically
// via plain `gltfi decompile`/`compile`/`decompile` chained twice — a
// pre-existing double-round-trip defect in @gltfi/ir's export/parse-ts's
// type inference, unrelated to `extract`/`apply` or this milestone (R3-A4/
// A5/A6) — `apply` itself only ever does ONE round trip per invocation, the
// same one `gltfi roundtrip`/the conf:roundtrip-* gates already cover at
// 145/145. Left as a documented, out-of-scope exception rather than masked;
// worth fixing in a follow-up focused on export.ts's generic-type handling.
// (A related, in-scope bug this same full-corpus mode DID catch and get
// fixed as part of this milestone: exportGraph silently corrupting NaN/
// Infinity literals via JSON.stringify — see @gltfi/kernel's
// formatValueArray and packages/ir/test/export.test.ts's regression tests.)

type LangCase = { id: LangId; runIf: boolean };
const LANGS: LangCase[] = [
  { id: "ts", runIf: true },
  { id: "lua", runIf: true },
  { id: "py", runIf: true },
  { id: "cs", runIf: HAS_DOTNET },
  { id: "gd", runIf: HAS_GODOT }
];

// ---------------------------------------------------------------------------
// Low-level GLB assertions independent of @gltfi/gltf's own parser — point
// (a)'s "header fields" requirement.
// ---------------------------------------------------------------------------

function assertValidGlbHeader(bytes: Buffer): void {
  expect(bytes.toString("ascii", 0, 4)).toBe("glTF");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(view.getUint32(4, true)).toBe(2); // version
  expect(view.getUint32(8, true)).toBe(bytes.byteLength); // total length field matches the real file size
  expect(bytes.byteLength % 4).toBe(0);
}

// ---------------------------------------------------------------------------
// (a)-(d): corpus round trip, per language
// ---------------------------------------------------------------------------

for (const lang of LANGS) {
  describe.runIf(lang.runIf)(`gltfi extract/apply round trip (${lang.id})`, () => {
    it.each(CASES)(`%s: byte-preserving, id-stable, judge-passing`, async (caseName) => {
      const ext = LANG_EXTENSIONS[lang.id];
      const { glbPath, testPath } = setupCase(caseName, lang.id);
      const originalBytes = fs.readFileSync(glbPath);

      const scriptPath = path.join(path.dirname(glbPath), `script${ext}`);
      const extracted = runCli(["extract", glbPath, "-o", scriptPath, "--lang", lang.id]);
      expect(extracted.status, `extract failed:\n${extracted.stdout}\n${extracted.stderr}`).toBe(0);

      const applied = runCli(["apply", glbPath, scriptPath]);
      expect(applied.status, `apply failed:\n${applied.stdout}\n${applied.stderr}`).toBe(0);
      expect(applied.stdout).toContain("validate: OK");
      expect(applied.stdout).toContain(`splice: extensions.KHR_interactivity.graphs[0]`);

      const newBytes = fs.readFileSync(glbPath);
      assertValidGlbHeader(newBytes);

      // (a) byte-identical prefix/suffix outside the recomputed graph span
      // — every non-JSON chunk verbatim, and the JSON chunk's text
      // identical everywhere except inside the spliced graphs[0] element.
      const oldContainer = parseContainer(new Uint8Array(originalBytes)) as Container;
      const newContainer = parseContainer(new Uint8Array(newBytes)) as Container;
      expect(oldContainer.kind).toBe("glb");
      expect(newContainer.kind).toBe("glb");
      if (oldContainer.kind === "glb" && newContainer.kind === "glb") {
        expect(newContainer.chunks.length).toBe(oldContainer.chunks.length);
        oldContainer.chunks.forEach((chunk, i) => {
          if (i === oldContainer.jsonChunkIndex) return;
          expect(newContainer.chunks[i].type).toBe(chunk.type);
          expect(Buffer.compare(Buffer.from(newContainer.chunks[i].bytes), Buffer.from(chunk.bytes))).toBe(0);
        });
      }

      const oldSpan = locateJsonSpan(oldContainer.jsonText, [...GRAPH_PATH]);
      const newSpan = locateJsonSpan(newContainer.jsonText, [...GRAPH_PATH]);
      expect(oldSpan, "graphs[0] must be locatable in the original asset text").toBeDefined();
      expect(newSpan, "graphs[0] must be locatable in the applied asset text").toBeDefined();
      if (oldSpan && newSpan) {
        expect(newContainer.jsonText.slice(0, oldSpan.start)).toBe(oldContainer.jsonText.slice(0, oldSpan.start));
        // Trailing ASCII-space padding (writeContainer's own 4-byte GLB
        // chunk alignment — see container.ts's padTo4) is synthesized fresh
        // from the NEW total length, not preserved content, so its byte
        // COUNT legitimately differs between old and new even though
        // everything it pads is unrelated to the graph edit — trimEnd both
        // sides before comparing the real (non-padding) suffix text.
        expect(newContainer.jsonText.slice(newSpan.end).trimEnd()).toBe(oldContainer.jsonText.slice(oldSpan.end).trimEnd());
      }

      // (b) re-extract -> parse -> every variable/event id round-trips.
      // NOTE: this deliberately does NOT assert full IRModule deep-equality
      // — proc/state-slot names are synthesized from the re-imported
      // graph's own node indices (which legitimately differ from the
      // original's after an export/import cycle re-numbers nodes), so
      // e.g. "proc5" vs "proc9" is expected and not a regression. What
      // MUST be stable is every declared id (the R3-A1 contract) and the
      // graph's structural/execution behavior, checked here and in (c)/(d).
      const script1 = fs.readFileSync(scriptPath, "utf8");
      const scriptPath2 = path.join(path.dirname(glbPath), `script2${ext}`);
      const reExtracted = runCli(["extract", glbPath, "-o", scriptPath2, "--lang", lang.id]);
      expect(reExtracted.status, `re-extract failed:\n${reExtracted.stdout}\n${reExtracted.stderr}`).toBe(0);
      const script2 = fs.readFileSync(scriptPath2, "utf8");

      const langModule = await loadLang(lang.id);
      try {
        const { module: module1, diagnostics: d1 } = langModule.parseModule(script1);
        expect(d1.filter((d) => d.severity === "error")).toEqual([]);
        const { module: module2, diagnostics: d2 } = langModule.parseModule(script2);
        expect(d2.filter((d) => d.severity === "error")).toEqual([]);

        expect(module2.variables.length).toBe(module1.variables.length);
        module1.variables.forEach((v, i) => {
          expect(module2.variables[i]?.extras?.id).toBe(v.extras?.id);
        });
        expect(module2.events.length).toBe(module1.events.length);
        module1.events.forEach((e, i) => {
          expect(module2.events[i]?.id).toBe(e.id);
        });
      } finally {
        langModule.close?.();
      }

      // (c)/(d): structural equivalence (tolerating documented divergence)
      // and the interpreter judge against the oracle.
      const oldGraph = (oldContainer.json as any).extensions.KHR_interactivity.graphs[0] as VGraph;
      const newGraph = (newContainer.json as any).extensions.KHR_interactivity.graphs[0] as VGraph;
      const equiv = equivalentGraphs(oldGraph, newGraph);

      const { interpEngineFromRuntime } = await import("@gltfi/conformance/dist/interp-adapter.js");
      const { judgeTest } = await import("@gltfi/conformance/dist/protocol.js");
      const { createRuntime } = await import("@gltfi/runtime");
      const testJson = JSON.parse(fs.readFileSync(testPath, "utf8"));
      const binary = newContainer.kind === "glb" ? newContainer.binaryChunk : undefined;
      const result = judgeTest(
        () => interpEngineFromRuntime(createRuntime(newGraph as any, newContainer.json, { binary })),
        testJson
      );
      expect(result.ok, `interpreter judge FAILed on the new graph:\n  - ${result.failures.join("\n  - ")}`).toBe(true);

      if (!equiv.equivalent) {
        // Tolerated ONLY because the judge above already confirmed
        // execution equivalence — see @gltfi/verify's header for the
        // documented divergence classes this corpus is known to hit.
        console.warn(`[apply e2e] ${caseName} (${lang.id}) structurally DIVERGED (judge PASS): ${equiv.firstDivergence}`);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Synthetic fixtures
// ---------------------------------------------------------------------------

const CHUNK_JSON = 0x4e4f534a;
const UNKNOWN_CHUNK_TYPE = 0x544e554a; // arbitrary 4-byte tag, deliberately not JSON (0x4e4f534a) or BIN (0x004e4942)
const UNKNOWN_CHUNK_TEXT = "test"; // 4 bytes — already 4-byte aligned, no padding needed

function minimalVariableGraph(varId: string): unknown {
  // A variable actually used by a variable/set node (not merely declared):
  // @gltfi/ir's exportGraph only registers a type in the graph's `types`
  // table as a side effect of processing node bodies (see export.ts's
  // typeIndex calls during buildHandler, which run before the `types:`
  // array literal is captured) — a variable declared but never referenced
  // anywhere else exports with an EMPTY types table and fails
  // validateGraph's GV010 (out-of-range type index). Giving it a real
  // reference sidesteps that pre-existing, unrelated quirk.
  return {
    types: [{ signature: "int" }],
    variables: [{ id: varId, type: 0, value: [0] }],
    events: [],
    declarations: [{ op: "event/onStart" }, { op: "variable/set" }],
    nodes: [
      { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
      { declaration: 1, configuration: { variables: { value: [0] } }, values: { "0": { type: 0, value: [42] } } }
    ]
  };
}

function minimalGltfJson(graph: unknown): unknown {
  return {
    asset: { version: "2.0" },
    extensionsUsed: ["KHR_interactivity"],
    extensions: { KHR_interactivity: { graphs: [graph], graph: 0 } }
  };
}

describe("gltfi apply: synthetic unknown GLB chunk", () => {
  it("preserves an unrecognized chunk type through extract -> apply", () => {
    const json = minimalGltfJson(minimalVariableGraph("11111111-2222-3333-4444-555555555555"));
    const jsonText = JSON.stringify(json);
    const container: Container = {
      kind: "glb",
      chunks: [
        { type: CHUNK_JSON, bytes: new TextEncoder().encode(jsonText) },
        { type: UNKNOWN_CHUNK_TYPE, bytes: new TextEncoder().encode(UNKNOWN_CHUNK_TEXT) }
      ],
      jsonChunkIndex: 0,
      jsonText,
      json
    };
    const glbPath = path.join(workDir, "unknown-chunk.glb");
    fs.writeFileSync(glbPath, Buffer.from(writeContainer(container) as Uint8Array));

    const scriptPath = path.join(workDir, "unknown-chunk.ts");
    expect(runCli(["extract", glbPath, "-o", scriptPath, "--lang", "ts"]).status).toBe(0);
    const applied = runCli(["apply", glbPath, scriptPath]);
    expect(applied.status, applied.stdout + applied.stderr).toBe(0);

    const roundTripped = parseContainer(new Uint8Array(fs.readFileSync(glbPath))) as Container;
    expect(roundTripped.kind).toBe("glb");
    if (roundTripped.kind === "glb") {
      const unknown = roundTripped.chunks.find((c) => c.type === UNKNOWN_CHUNK_TYPE);
      expect(unknown, "unknown chunk must survive apply").toBeDefined();
      expect(Buffer.from(unknown!.bytes).toString("utf8")).toBe(UNKNOWN_CHUNK_TEXT);
    }
  });
});

describe("gltfi apply: UUID variable id round-trips byte-identically", () => {
  const UUID = "a3f1c2d4-5678-4abc-9def-0123456789ab";

  it.each(LANGS.filter((l) => l.runIf).map((l) => l.id))("in %s", async (langId) => {
    const ext = LANG_EXTENSIONS[langId];
    const json = minimalGltfJson(minimalVariableGraph(UUID));
    const assetPath = path.join(workDir, `uuid-var-${langId}.gltf`);
    fs.writeFileSync(assetPath, JSON.stringify(json));

    const scriptPath = path.join(workDir, `uuid-var-${langId}${ext}`);
    const extracted = runCli(["extract", assetPath, "-o", scriptPath, "--lang", langId]);
    expect(extracted.status, extracted.stdout + extracted.stderr).toBe(0);
    const script = fs.readFileSync(scriptPath, "utf8");
    expect(script).toContain(UUID);

    const applied = runCli(["apply", assetPath, scriptPath]);
    expect(applied.status, applied.stdout + applied.stderr).toBe(0);

    const resultJson = JSON.parse(fs.readFileSync(assetPath, "utf8"));
    const resultGraph = resultJson.extensions.KHR_interactivity.graphs[0];
    expect(resultGraph.variables[0].id).toBe(UUID);
  });
});

describe("gltfi apply: no-interactivity asset", () => {
  it("hits spliceGraph's reserialize fallback and reports it", () => {
    const assetPath = path.join(workDir, "no-interactivity.gltf");
    fs.writeFileSync(assetPath, JSON.stringify({ asset: { version: "2.0" } }));

    // Any valid script works here — content doesn't matter, only that the
    // target asset has no existing KHR_interactivity.graphs[0] to splice
    // into.
    const json = minimalGltfJson(minimalVariableGraph("22222222-3333-4444-5555-666666666666"));
    const donorPath = path.join(workDir, "no-interactivity-donor.gltf");
    fs.writeFileSync(donorPath, JSON.stringify(json));
    const scriptPath = path.join(workDir, "no-interactivity.ts");
    expect(runCli(["extract", donorPath, "-o", scriptPath, "--lang", "ts"]).status).toBe(0);

    const applied = runCli(["apply", assetPath, scriptPath]);
    expect(applied.status, applied.stdout + applied.stderr).toBe(0);
    expect(applied.stdout).toContain("no existing graph");
    expect(applied.stdout).toContain("full reserialize");
    expect(applied.stdout).toContain("byte-preservation not possible");

    const result = JSON.parse(fs.readFileSync(assetPath, "utf8"));
    expect(result.extensionsUsed).toContain("KHR_interactivity");
    expect(result.extensions.KHR_interactivity.graphs).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// --dry-run / --backup
// ---------------------------------------------------------------------------

describe("gltfi apply: --dry-run", () => {
  it("writes nothing — size and mtime unchanged", () => {
    const { glbPath } = setupCase("math/xor", "dry-run");
    const scriptPath = path.join(path.dirname(glbPath), "script.lua");
    expect(runCli(["extract", glbPath, "-o", scriptPath, "--lang", "lua"]).status).toBe(0);

    const before = fs.statSync(glbPath);
    const applied = runCli(["apply", glbPath, scriptPath, "--dry-run"]);
    expect(applied.status, applied.stdout + applied.stderr).toBe(0);
    expect(applied.stdout).toContain("dry-run: no changes written");
    const after = fs.statSync(glbPath);

    expect(after.size).toBe(before.size);
    expect(after.mtimeMs).toBe(before.mtimeMs);
  });
});

describe("gltfi apply: --backup", () => {
  it("copies the original to <asset>.bak before writing", () => {
    const { glbPath } = setupCase("math/xor", "backup");
    const scriptPath = path.join(path.dirname(glbPath), "script.lua");
    expect(runCli(["extract", glbPath, "-o", scriptPath, "--lang", "lua"]).status).toBe(0);

    const originalBytes = fs.readFileSync(glbPath);
    const applied = runCli(["apply", glbPath, scriptPath, "--backup"]);
    expect(applied.status, applied.stdout + applied.stderr).toBe(0);
    expect(applied.stdout).toContain(".bak");

    const backupPath = `${glbPath}.bak`;
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(Buffer.compare(fs.readFileSync(backupPath), originalBytes)).toBe(0);
    // The live asset should have actually changed (otherwise this proves
    // nothing about backup-before-write ordering).
    expect(Buffer.compare(fs.readFileSync(glbPath), originalBytes)).not.toBe(0);
  });
});

// ---------------------------------------------------------------------------
// extract: overwrite refusal / --force / language inference
// ---------------------------------------------------------------------------

describe("gltfi extract: overwrite protection", () => {
  it("refuses to overwrite an existing default-path output without -o or --force", () => {
    const { glbPath } = setupCase("math/xor", "overwrite");
    expect(runCli(["extract", glbPath, "--lang", "ts"]).status).toBe(0);
    const second = runCli(["extract", glbPath, "--lang", "ts"]);
    expect(second.status).toBe(1);
    expect(second.stderr).toContain("already exists");
  });

  it("overwrites with --force", () => {
    const { glbPath } = setupCase("math/xor", "force");
    expect(runCli(["extract", glbPath, "--lang", "ts"]).status).toBe(0);
    const second = runCli(["extract", glbPath, "--lang", "ts", "--force"]);
    expect(second.status).toBe(0);
  });

  it("always overwrites an explicit -o path", () => {
    const { glbPath } = setupCase("math/xor", "explicit-o");
    const outPath = path.join(path.dirname(glbPath), "explicit.ts");
    expect(runCli(["extract", glbPath, "-o", outPath, "--lang", "ts"]).status).toBe(0);
    const second = runCli(["extract", glbPath, "-o", outPath, "--lang", "ts"]);
    expect(second.status).toBe(0);
  });
});

describe("gltfi apply: language inference", () => {
  it("infers the language from the script's extension when --lang is omitted", () => {
    const { glbPath } = setupCase("math/xor", "infer-lang");
    const scriptPath = path.join(path.dirname(glbPath), "script.py");
    expect(runCli(["extract", glbPath, "-o", scriptPath, "--lang", "py"]).status).toBe(0);
    const applied = runCli(["apply", glbPath, scriptPath]);
    expect(applied.status, applied.stdout + applied.stderr).toBe(0);
    expect(applied.stdout).toContain("(py)");
  });

  it("rejects a script with an unrecognized extension and no --lang", () => {
    const { glbPath } = setupCase("math/xor", "unknown-lang");
    const scriptPath = path.join(path.dirname(glbPath), "script.txt");
    fs.writeFileSync(scriptPath, "not a real script");
    const applied = runCli(["apply", glbPath, scriptPath]);
    expect(applied.status).toBe(1);
    expect(applied.stderr).toContain("--lang");
  });
});

describe("gltfi apply: validation failure writes nothing", () => {
  it("exits nonzero and leaves the asset untouched on a syntax error", () => {
    const { glbPath } = setupCase("math/xor", "syntax-error");
    const scriptPath = path.join(path.dirname(glbPath), "broken.lua");
    fs.writeFileSync(scriptPath, "this is not valid lua {{{");

    const before = fs.readFileSync(glbPath);
    const applied = runCli(["apply", glbPath, scriptPath]);
    expect(applied.status).toBe(1);
    const after = fs.readFileSync(glbPath);
    expect(Buffer.compare(after, before)).toBe(0);
  });
});

// Sanity check on the language table itself — every id maps to the exact
// extension the R3 plan's A4 specifies.
describe("lang.ts", () => {
  it("maps every language id to its correct extension", () => {
    expect(LANG_EXTENSIONS).toEqual({ ts: ".ts", lua: ".lua", py: ".py", cs: ".cs", gd: ".gd" });
    expect(LANG_IDS.sort()).toEqual(["cs", "gd", "lua", "py", "ts"]);
  });
});
