#!/usr/bin/env node
// Generates examples/<name>/ from a curated slice of the official Khronos
// KHR_interactivity conformance corpus (external/glTF-Test-Assets-
// Interactivity, fetched by `pnpm fetch:assets`): GLB -> importGraph ->
// {graph.json, behavior.ts, behavior.lua, behavior.py, README.md}. Each
// example's four files are the SAME behavior graph in four representations
// — the raw glTF extension JSON, and the three decompiled scripting
// languages this repo's emitters (`@gltfi/emit-ts`/`emit-lua`/`emit-py`)
// produce from it in their normal (readable) emit style, i.e. exactly what
// `gltfi decompile` writes for each language.
//
// Deterministic and idempotent: no timestamps, no non-graph-derived
// randomness, byte-for-byte the same output on every run against the same
// corpus checkout — `pnpm gen:examples` twice in a row must produce zero
// git diff (see README.md's gates).
//
// Usage: pnpm gen:examples   (equivalently: node scripts/gen-examples.mjs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkModule, importGraph } from "../packages/ir/dist/index.js";
import { emitModule } from "../packages/emit-ts/dist/index.js";
import { emitModuleLua } from "../packages/emit-lua/dist/index.js";
import { emitModulePy } from "../packages/emit-py/dist/index.js";
import { emitModuleCs } from "../packages/emit-cs/dist/index.js";
import { emitModuleGd } from "../packages/emit-gd/dist/index.js";
import { loadGltf } from "../packages/gltf/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_ROOT = path.join(ROOT, "external/glTF-Test-Assets-Interactivity/Tests/Interactivity");
const EXAMPLES_ROOT = path.join(ROOT, "examples");

// Curated to span the categories a reader skimming the extension spec would
// want to see worked examples of: flow control (a counted loop, a timed
// delay + cancellation, a fan-out gate), math (a stateful RNG, a vector op),
// variable interpolation, object-model pointer set/get, custom events, and
// animation playback. Each `glb` path is relative to ASSETS_ROOT and mirrors
// the corpus's own <category>/<test>/glTF-Binary/<file>.glb layout (see
// packages/conformance/src/assets.ts for the general-purpose loader this
// hand-picked list intentionally does not need).
const EXAMPLES = [
  {
    dir: "doN",
    category: "flow/doN",
    glb: "flow/doN/glTF-Binary/doN.glb",
    summary:
      "A counted loop: `flow/doN` fires its `[out]` flow N times, tracks the running iteration count, and exposes a `[reset]` flow that rewinds the counter."
  },
  {
    dir: "setDelay_and_cancelDelay",
    category: "flow/setDelay_and_cancelDelay",
    glb: "flow/setDelay_and_cancelDelay/glTF-Binary/setDelay_and_cancelDelay.glb",
    summary:
      "`flow/setDelay` schedules a flow to fire after a duration, returning a delay-ref pointer that `flow/cancelDelay` can resolve and cancel before it fires."
  },
  {
    dir: "multiGate",
    category: "flow/multiGate",
    glb: "flow/multiGate/glTF-Binary/multiGate.glb",
    summary:
      "`flow/multiGate` fans one input flow out to a fixed set of output flows, each firing exactly once (random or sequential order), with a `[reset]` flow to start the cycle over."
  },
  {
    dir: "random",
    category: "math/random",
    glb: "math/random/glTF-Binary/random.glb",
    summary:
      "`math/random` draws pseudo-random floats and checks their distribution across repeated flow-graph runs, including a Monte-Carlo estimate of π."
  },
  {
    dir: "cross",
    category: "math/cross",
    glb: "math/cross/glTF-Binary/cross.glb",
    summary: "The 3D vector cross product (`math/cross`), cross-checked against `math/dot`, `math/length`, and `math/normalize` for several vector pairs."
  },
  {
    dir: "interpolate",
    category: "variable/interpolate",
    glb: "variable/interpolate/glTF-Binary/interpolate.glb",
    summary:
      "`variable/interpolate` eases a variable toward a target value over a duration, sampled mid-flight and at completion, with NaN/negative-duration error flows."
  },
  {
    dir: "set_and_get",
    category: "pointer/set_and_get",
    glb: "pointer/set_and_get/glTF-Binary/set_and_get.glb",
    summary:
      "Object-model pointer read/write: sets and reads back a light's color/intensity/range/cone angles and a material's alphaCutoff/emissiveFactor/texture scale through `pointer/set` and `pointer/get`."
  },
  {
    dir: "send_and_receive",
    category: "event/send_and_receive",
    glb: "event/send_and_receive/glTF-Binary/send_and_receive.glb",
    summary:
      "A custom event carrying typed parameters (int/bool/float), sent with `event/send` and received with `event/receive` in the same graph, including default-value fallbacks."
  },
  {
    dir: "start",
    category: "animation/start",
    glb: "animation/start/glTF-Binary/start.glb",
    summary:
      "`animation/start` plays a custom AnimationClip, sampling a node's position mid-clip and at completion, plus the full set of invalid-argument (`speed`/`startTime`/`endTime`) error flows."
  }
];

async function readArrayBuffer(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function writeDeterministic(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function exampleReadme(example) {
  return `# ${example.category}

${example.summary}

This directory holds the SAME KHR_interactivity behavior graph in six representations: \`graph.json\` (the raw glTF extension node graph, decompiled straight out of the official Khronos \`${example.category}\` conformance asset), and \`behavior.ts\` / \`behavior.lua\` / \`behavior.py\` / \`behavior.cs\` / \`behavior.gd\` — what the repo's emitters produce from that graph in each supported scripting language. All six are behaviorally equivalent, and each script round-trips back to an equivalent graph (see the repo root README's Examples section, and \`examples/README.md\`, for details). Regenerate with \`pnpm gen:examples\`; do not hand-edit these files.
`;
}

async function genOne(example) {
  const glbPath = path.join(ASSETS_ROOT, example.glb);
  const arrayBuffer = await readArrayBuffer(glbPath);
  const doc = await loadGltf(arrayBuffer);
  const khrInteractivity = doc.json.extensions?.KHR_interactivity;
  if (!khrInteractivity) {
    throw new Error(`${example.dir}: no extensions.KHR_interactivity in ${glbPath}`);
  }
  const graph = khrInteractivity.graphs?.[0];
  if (!graph) {
    throw new Error(`${example.dir}: no extensions.KHR_interactivity.graphs[0] in ${glbPath}`);
  }

  const { module, diagnostics: importDiags } = importGraph(graph);
  const importErrors = importDiags.filter((d) => d.severity === "error");
  if (importErrors.length > 0) {
    throw new Error(`${example.dir}: importGraph errors: ${JSON.stringify(importErrors)}`);
  }
  const checkErrors = checkModule(module).filter((d) => d.severity === "error");
  if (checkErrors.length > 0) {
    throw new Error(`${example.dir}: checkModule errors: ${JSON.stringify(checkErrors)}`);
  }

  const ts = emitModule(module); // default flavor: "ts" — the readable style
  const lua = emitModuleLua(module);
  const py = emitModulePy(module);
  const cs = emitModuleCs(module);
  const gd = emitModuleGd(module);

  const outDir = path.join(EXAMPLES_ROOT, example.dir);
  writeDeterministic(path.join(outDir, "graph.json"), JSON.stringify(khrInteractivity, null, 2) + "\n");
  writeDeterministic(path.join(outDir, "behavior.ts"), ts.code);
  writeDeterministic(path.join(outDir, "behavior.lua"), lua.code);
  writeDeterministic(path.join(outDir, "behavior.py"), py.code);
  writeDeterministic(path.join(outDir, "behavior.cs"), cs.code);
  writeDeterministic(path.join(outDir, "behavior.gd"), gd.code);
  writeDeterministic(path.join(outDir, "README.md"), exampleReadme(example));
}

async function main() {
  for (const example of EXAMPLES) {
    await genOne(example);
    console.log(`wrote examples/${example.dir}/`);
  }
  console.log(`${EXAMPLES.length} examples generated.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
