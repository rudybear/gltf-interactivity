// Regression for the "inequality lowered as bool xor" bug: `V.mode !== 3`
// used to coerce both operands to bool and compute `mode xor true`, which is
// wrong for any non-boolean operand. `!==` now lowers to
// math/not(math/eq(a, b)) with the operand type inferred exactly as `===` does.
// This runs the TS front-end's output through BOTH the graph interpreter
// (parseModule -> exportGraph -> createRuntime) and the compiled TS path
// (parseModule -> emitModule -> esbuild -> engine) and checks full truth tables.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { describe, expect, it } from "vitest";
import { exportGraph } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { parseModule } from "@gltfi/parse-ts";
import { createRuntime } from "@gltfi/runtime";
import { interpEngineFromRuntime } from "../src/interp-adapter.js";
import type { EngineFactory } from "@gltfi/runtime-lib";

type Case = { mode: number; f: number; b: boolean };
const CASES: Case[] = [
  { mode: 0, f: 2.5, b: true },
  { mode: 1, f: 2.5, b: false },
  { mode: 3, f: 1.5, b: true },
  { mode: 3, f: 2.5, b: false }
];

function source(c: Case): string {
  return `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({
    mode: rt.int(${c.mode}), other: rt.int(3),
    f: rt.float(${c.f}), g: rt.float(2.5),
    b: rt.bool(${c.b}), c: rt.bool(true),
    r0: rt.bool(false), r1: rt.bool(false), r2: rt.bool(false),
    r3: rt.bool(false), r4: rt.bool(false), r5: rt.bool(false), r6: rt.bool(false)
  });
  const E = rt.events({});
  rt.onStart(() => {
    V.r0 = V.mode !== 3;
    V.r1 = V.mode !== V.other;
    V.r2 = V.f !== 2.5;
    V.r3 = V.f !== V.g;
    V.r4 = V.b !== true;
    V.r5 = V.b !== V.c;
    V.r6 = m.xor(V.b, V.c);
  });
});
`;
}

function expected(c: Case): boolean[] {
  return [c.mode !== 3, c.mode !== 3, c.f !== 2.5, c.f !== 2.5, c.b !== true, c.b !== true, c.b !== true];
}

const VAR_BASE = 6; // r0..r6 follow mode, other, f, g, b, c

describe("`!==` inequality semantics (TS front-end)", () => {
  it.each(CASES)("graph interpreter: %j", (c) => {
    const { module, diagnostics } = parseModule(source(c));
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const res = exportGraph(module);
    const graph = (res as unknown as { graph: never }).graph;
    const eng = interpEngineFromRuntime(createRuntime(graph, { nodes: [] }));
    eng.start();
    const got = [0, 1, 2, 3, 4, 5, 6].map((i) => eng.getVariableByIndex(VAR_BASE + i));
    expect(got.map((v) => (v as { data: unknown[] }).data[0])).toEqual(expected(c));
  });

  it.each(CASES)("compiled TS: %j", async (c) => {
    const { module, diagnostics } = parseModule(source(c));
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const { code } = emitModule(module);
    const result = await esbuild.build({
      stdin: { contents: code, loader: "ts", resolveDir: path.resolve(import.meta.dirname, "../src"), sourcefile: "neq.ts" },
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node18",
      write: false
    });
    const tmp = path.join(os.tmpdir(), `gltfi-neq-${crypto.randomUUID()}.mjs`);
    fs.writeFileSync(tmp, result.outputFiles![0].text);
    try {
      const mod = (await import(pathToFileURL(tmp).href)) as { default: EngineFactory };
      const eng = mod.default({ gltf: { nodes: [] } });
      eng.start();
      const got = [0, 1, 2, 3, 4, 5, 6].map((i) => eng.getVariableByIndex(VAR_BASE + i));
      expect(got.map((v) => (v as { data: unknown[] }).data[0])).toEqual(expected(c));
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });
});
