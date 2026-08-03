// End-to-end coverage for the built @gltfi/cli binary (dist/main.js),
// invoked exactly as a user would via child_process — not by importing
// main.ts's internals — so a regression in argv parsing, file I/O, or the
// package's "bin" wiring is caught here, not just a unit-level regression.
// Exercises decompile/compile/roundtrip/verify-equal against a handful of
// real corpus assets (see external/glTF-Test-Assets-Interactivity).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI_PATH = path.resolve(import.meta.dirname, "../dist/main.js");
const CORPUS_ROOT = path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

function assetGlb(name: string): string {
  const p = path.join(CORPUS_ROOT, name, "glTF-Binary", `${path.basename(name)}.glb`);
  if (!fs.existsSync(p)) {
    throw new Error(`corpus asset not found: ${p}`);
  }
  return p;
}

function runCli(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { encoding: "utf8" });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

let workDir: string;

beforeAll(() => {
  expect(fs.existsSync(CLI_PATH), `${CLI_PATH} missing — run "pnpm build" first`).toBe(true);
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-cli-test-"));
});

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

describe("gltfi decompile", () => {
  it("writes a .ts module and a .names.json sidecar for a corpus GLB", () => {
    const glb = assetGlb("math/xor");
    const outTs = path.join(workDir, "xor.ts");
    const { stdout, status } = runCli(["decompile", glb, "-o", outTs]);
    expect(status).toBe(0);
    expect(stdout).toContain("wrote");

    const code = fs.readFileSync(outTs, "utf8");
    expect(code).toContain("createEngine");
    expect(code).toContain("rt.vars(");

    const namesPath = path.join(workDir, "xor.names.json");
    expect(fs.existsSync(namesPath)).toBe(true);
    const names = JSON.parse(fs.readFileSync(namesPath, "utf8"));
    expect(names).toHaveProperty("variables");
    expect(names).toHaveProperty("events");
  });

  it("emits plain JS with --js", () => {
    const glb = assetGlb("math/add");
    const outJs = path.join(workDir, "add.js");
    const { status } = runCli(["decompile", glb, "-o", outJs, "--js"]);
    expect(status).toBe(0);
    const code = fs.readFileSync(outJs, "utf8");
    expect(code).toContain("createEngine");
  });
});

describe("gltfi compile", () => {
  it("compiles a decompiled module back into a standalone .gltf asset", () => {
    const glb = assetGlb("flow/branch");
    const ts = path.join(workDir, "branch.ts");
    expect(runCli(["decompile", glb, "-o", ts]).status).toBe(0);

    const outGltf = path.join(workDir, "branch-standalone.gltf");
    const { status } = runCli(["compile", ts, "-o", outGltf]);
    expect(status).toBe(0);

    const json = JSON.parse(fs.readFileSync(outGltf, "utf8"));
    expect(json.extensionsUsed).toContain("KHR_interactivity");
    expect(json.extensions.KHR_interactivity.graphs).toHaveLength(1);
    expect(json.asset.version).toBe("2.0");
  });

  it("merges into a base .glb, replacing its KHR_interactivity extension, and writes a valid .glb", () => {
    const glb = assetGlb("math/xor");
    const ts = path.join(workDir, "xor-for-merge.ts");
    expect(runCli(["decompile", glb, "-o", ts]).status).toBe(0);

    const outGlb = path.join(workDir, "xor-merged.glb");
    const { status } = runCli(["compile", ts, "-o", outGlb, "--merge-into", glb]);
    expect(status).toBe(0);

    const bytes = fs.readFileSync(outGlb);
    expect(bytes.toString("ascii", 0, 4)).toBe("glTF"); // GLB magic
    expect(bytes.byteLength % 4).toBe(0); // 4-byte aligned per the glTF-Binary spec

    // Round-tripping through the CLI's own decompile should still see the
    // same graph shape (the merge shouldn't have corrupted the payload).
    const { status: verifyStatus, stdout } = runCli(["verify-equal", glb, outGlb]);
    expect(verifyStatus, stdout).toBe(0);
    expect(stdout).toContain("EQUIV");
  });
});

describe("gltfi roundtrip", () => {
  it.each(["math/xor", "math/add", "flow/branch"])("reports PASS and EQUIV for %s", (name) => {
    const glb = assetGlb(name);
    const { stdout, status } = runCli(["roundtrip", glb]);
    expect(stdout, stdout).toContain("equivalentGraphs: EQUIV");
    expect(stdout, stdout).toContain("VERDICT: PASS");
    expect(status).toBe(0);
  });
});

describe("gltfi verify-equal", () => {
  it("reports DIVERGED with a first-divergence path for two different assets", () => {
    const a = assetGlb("math/xor");
    const b = assetGlb("math/add");
    const { stdout, status } = runCli(["verify-equal", a, b]);
    expect(status).toBe(1);
    expect(stdout).toContain("DIVERGED");
    expect(stdout).toContain("first divergence:");
  });
});

describe("gltfi conform", () => {
  it("runs the roundtrip conformance runner filtered to a single asset", () => {
    const { stdout, status } = runCli(["conform", "roundtrip", "--filter", "math/xor"]);
    expect(status).toBe(0);
    expect(stdout).toContain("PASS math/xor");
    expect(stdout).toContain("All 1 tests passed.");
  });

  it("rejects an unknown conform target", () => {
    const { status, stderr } = runCli(["conform", "bogus"]);
    expect(status).toBe(1);
    expect(stderr).toContain('unknown target "bogus"');
  });
});
