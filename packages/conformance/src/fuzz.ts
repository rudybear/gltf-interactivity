#!/usr/bin/env node
// Differential fuzzer: generates small random KHR_interactivity graphs from
// a curated, registry-checked-safe op pool (math/* incl. random,
// flow/branch|sequence|for|while (bounded)|switch, variable/get|set,
// type/*) and runs each one through BOTH the interpreter (@gltfi/runtime)
// and the compiled path (@gltfi/ir -> @gltfi/emit-ts -> esbuild ->
// @gltfi/runtime-lib) for a few ticks, comparing final variable state.
//
// Design notes:
//  - Every generated graph has exactly one event/onStart handler whose
//    body is a single flow/sequence fanning out to a handful of
//    independent top-level statements (compute-and-store, branch, switch,
//    for, while). flow/sequence firing each numbered output in turn means
//    top-level statements never need their own "out" continuation wiring
//    — see @gltfi/verify's header for the same fact used the other way
//    round (collapsing sequence nesting for equivalence checking).
//  - flow/for's iteration count is bounded by literal start/end indices
//    (never expression-derived); flow/while's condition is always a
//    dedicated counter compared against a small literal bound, with the
//    loop body incrementing that same counter — both are therefore
//    guaranteed to terminate in a handful of iterations regardless of any
//    other randomness, independent of the interpreter's own 10000-
//    iteration safety cap.
//  - math/random is safe to include: both engines seed the same LCG from
//    the same default seed (@gltfi/runtime's `randomState: 123456789` and
//    @gltfi/runtime-lib's `DEFAULT_SEED = 123456789`, identical multiplier
//    /increment — see engine.ts's comment on this), and every draw here
//    is consumed exactly once (no value-node fan-out anywhere in the
//    generator), so both paths draw the same sequence of randoms.
//  - No value-producing node's output is ever read by more than one
//    consumer — every reference is a freshly built subtree, including
//    variable reads — so there's no risk of interpreter/compiled
//    disagreeing over how many times a "readsState"/"volatile" node gets
//    evaluated.
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import { getOpSpec, type Value } from "@gltfi/kernel";
import { createRuntime, executeFlow, advanceTime, type Graph, type GraphNode, type NodeValue } from "@gltfi/runtime";
import { importGraph, checkModule, type Graph as IrGraph } from "@gltfi/ir";
import { emitModule, EmitError } from "@gltfi/emit-ts";
import type { EngineFactory } from "@gltfi/runtime-lib";

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32 — small, fast, decent statistical quality for a
// fuzzer's purposes, and trivially reproducible from a single 32-bit seed).
// ---------------------------------------------------------------------------

type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

// ---------------------------------------------------------------------------
// Op pool — every entry names a concrete (already-resolved) overload of a
// real @gltfi/kernel registry op, checked against the registry at module
// load (see assertRegistrySafe below) so the pool can never silently drift
// from what the interpreter/emit-ts actually implement.
// ---------------------------------------------------------------------------

type Sig = "bool" | "int" | "float";

type PoolOp = { op: string; inputs: Sig[]; output: Sig; outputSocket: string };

function op(name: string, inputs: Sig[], output: Sig, outputSocket = "value"): PoolOp {
  return { op: name, inputs, output, outputSocket };
}

const BOOL_OPS: PoolOp[] = [
  op("math/not", ["bool"], "bool"),
  op("math/and", ["bool", "bool"], "bool"),
  op("math/or", ["bool", "bool"], "bool"),
  op("math/xor", ["bool", "bool"], "bool"),
  op("math/eq", ["bool", "bool"], "bool"),
  op("math/eq", ["int", "int"], "bool"),
  op("math/eq", ["float", "float"], "bool"),
  op("math/lt", ["int", "int"], "bool"),
  op("math/lt", ["float", "float"], "bool"),
  op("math/le", ["int", "int"], "bool"),
  op("math/le", ["float", "float"], "bool"),
  op("math/gt", ["int", "int"], "bool"),
  op("math/gt", ["float", "float"], "bool"),
  op("math/ge", ["int", "int"], "bool"),
  op("math/ge", ["float", "float"], "bool"),
  op("math/isNaN", ["float"], "bool"),
  op("math/isInf", ["float"], "bool"),
  op("type/intToBool", ["int"], "bool"),
  op("type/floatToBool", ["float"], "bool")
];

const INT_OPS: PoolOp[] = [
  op("math/abs", ["int"], "int"),
  op("math/sign", ["int"], "int"),
  op("math/neg", ["int"], "int"),
  op("math/add", ["int", "int"], "int"),
  op("math/sub", ["int", "int"], "int"),
  op("math/mul", ["int", "int"], "int"),
  op("math/div", ["int", "int"], "int"),
  op("math/rem", ["int", "int"], "int"),
  op("math/min", ["int", "int"], "int"),
  op("math/max", ["int", "int"], "int"),
  op("math/clamp", ["int", "int", "int"], "int"),
  op("math/and", ["int", "int"], "int"),
  op("math/or", ["int", "int"], "int"),
  op("math/xor", ["int", "int"], "int"),
  op("math/not", ["int"], "int"),
  op("math/asr", ["int", "int"], "int"),
  op("math/lsl", ["int", "int"], "int"),
  op("math/clz", ["int"], "int"),
  op("math/ctz", ["int"], "int"),
  op("math/popcnt", ["int"], "int"),
  op("type/boolToInt", ["bool"], "int"),
  op("type/floatToInt", ["float"], "int")
];

const FLOAT_OPS: PoolOp[] = [
  op("math/abs", ["float"], "float"),
  op("math/sign", ["float"], "float"),
  op("math/trunc", ["float"], "float"),
  op("math/floor", ["float"], "float"),
  op("math/ceil", ["float"], "float"),
  op("math/round", ["float"], "float"),
  op("math/fract", ["float"], "float"),
  op("math/neg", ["float"], "float"),
  op("math/saturate", ["float"], "float"),
  op("math/sin", ["float"], "float"),
  op("math/cos", ["float"], "float"),
  op("math/sqrt", ["float"], "float"),
  op("math/add", ["float", "float"], "float"),
  op("math/sub", ["float", "float"], "float"),
  op("math/mul", ["float", "float"], "float"),
  op("math/div", ["float", "float"], "float"),
  op("math/rem", ["float", "float"], "float"),
  op("math/min", ["float", "float"], "float"),
  op("math/max", ["float", "float"], "float"),
  op("math/pow", ["float", "float"], "float"),
  op("math/atan2", ["float", "float"], "float"),
  op("math/clamp", ["float", "float", "float"], "float"),
  op("math/random", [], "float"),
  op("type/boolToFloat", ["bool"], "float"),
  op("type/intToFloat", ["int"], "float")
];

const OPS_BY_OUTPUT: Record<Sig, PoolOp[]> = { bool: BOOL_OPS, int: INT_OPS, float: FLOAT_OPS };

function assertRegistrySafe(): void {
  const allOps = new Set([...BOOL_OPS, ...INT_OPS, ...FLOAT_OPS].map((o) => o.op));
  for (const name of allOps) {
    if (!getOpSpec(name)) {
      throw new Error(`fuzz op pool references unknown kernel op "${name}" — registry drift?`);
    }
  }
  for (const name of ["flow/branch", "flow/sequence", "flow/for", "flow/while", "flow/switch", "variable/get", "variable/set", "event/onStart"]) {
    if (!getOpSpec(name)) {
      throw new Error(`fuzz control-flow op "${name}" missing from kernel registry — registry drift?`);
    }
  }
}

// ---------------------------------------------------------------------------
// Graph generation
// ---------------------------------------------------------------------------

const TYPES = [{ signature: "bool" as const }, { signature: "int" as const }, { signature: "float" as const }];
const TYPE_INDEX: Record<Sig, number> = { bool: 0, int: 1, float: 2 };

type VarInfo = { sig: Sig; index: number };

class GraphBuilder {
  readonly nodes: GraphNode[] = [];
  readonly declarations: Array<{ op: string }> = [];
  private readonly declIndex = new Map<string, number>();

  constructor(public readonly rng: Rng, public readonly variables: VarInfo[], private nodeBudget: number) {}

  get remaining(): number {
    return this.nodeBudget - this.nodes.length;
  }

  declFor(opName: string): number {
    let idx = this.declIndex.get(opName);
    if (idx === undefined) {
      idx = this.declarations.push({ op: opName }) - 1;
      this.declIndex.set(opName, idx);
    }
    return idx;
  }

  pushNode(node: GraphNode): number {
    return this.nodes.push(node) - 1;
  }

  varsOf(sig: Sig): VarInfo[] {
    return this.variables.filter((v) => v.sig === sig);
  }
}

function literalFor(b: GraphBuilder, sig: Sig): NodeValue {
  const rng = b.rng;
  if (sig === "bool") {
    return { type: TYPE_INDEX.bool, value: [rng() < 0.5] };
  }
  if (sig === "int") {
    return { type: TYPE_INDEX.int, value: [randInt(rng, -50, 50)] };
  }
  return { type: TYPE_INDEX.float, value: [Math.round((rng() * 200 - 100) * 100) / 100] };
}

// Always creates a fresh variable/get node (no fan-out — see this file's
// header) and returns a value-ref to it, or falls back to a literal if no
// variable of the requested type exists yet.
function readVariable(b: GraphBuilder, sig: Sig): NodeValue {
  const candidates = b.varsOf(sig);
  if (candidates.length === 0 || b.remaining <= 0) {
    return literalFor(b, sig);
  }
  const v = pick(b.rng, candidates);
  const decl = b.declFor("variable/get");
  const idx = b.pushNode({ declaration: decl, configuration: { variable: { value: [v.index] } }, values: {}, flows: {} });
  return { node: idx, socket: "value" };
}

// Builds a fresh value-producing subtree (never reusing an existing node)
// of the requested output type, bottoming out in a literal or a variable
// read once `depth` is exhausted or the node budget runs low.
function buildValue(b: GraphBuilder, sig: Sig, depth: number): NodeValue {
  if (depth <= 0 || b.remaining <= 1 || b.rng() < 0.3) {
    return b.rng() < 0.5 ? literalFor(b, sig) : readVariable(b, sig);
  }
  const candidates = OPS_BY_OUTPUT[sig];
  const chosen = pick(b.rng, candidates);
  if (chosen.op === "math/random") {
    const decl = b.declFor(chosen.op);
    const idx = b.pushNode({ declaration: decl, values: {}, flows: {} });
    return { node: idx, socket: chosen.outputSocket };
  }
  const values: Record<string, NodeValue> = {};
  const inputNames = ["a", "b", "c"];
  chosen.inputs.forEach((inputSig, i) => {
    values[inputNames[i]] = buildValue(b, inputSig, depth - 1);
  });
  const decl = b.declFor(chosen.op);
  const idx = b.pushNode({ declaration: decl, values, flows: {} });
  return { node: idx, socket: chosen.outputSocket };
}

// A "compute and store" leaf statement: builds a small value expression and
// writes it into a variable of matching type via variable/set. Returns the
// variable/set node's index (both entry and tail — it never has a
// continuation of its own; ordering is entirely flow/sequence's job at the
// top level, or the loop-body wiring for for/while).
function buildComputeStatement(b: GraphBuilder, depth: number): number {
  const sig = pick(b.rng, ["bool", "int", "float"] as const);
  const targets = b.varsOf(sig);
  const target = targets.length > 0 ? pick(b.rng, targets) : b.variables[0];
  const expr = buildValue(b, target.sig, depth);
  const decl = b.declFor("variable/set");
  return b.pushNode({
    declaration: decl,
    // variable/set's value socket for a single-variable set is keyed by the
    // variable's own index (not its position in the "variables" config
    // list, which happens to coincide only when that index is 0) — see
    // @gltfi/ir/export.ts's setVar case and every corpus asset's
    // variable/set nodes for the convention this mirrors.
    configuration: { variables: { value: [target.index] } },
    values: { [String(target.index)]: expr },
    flows: {}
  });
}

function buildBranchStatement(b: GraphBuilder): number {
  const condition = buildValue(b, "bool", 2);
  const decl = b.declFor("flow/branch");
  const idx = b.pushNode({ declaration: decl, values: { condition }, flows: {} });
  const trueArm = buildComputeStatement(b, 2);
  const falseArm = b.remaining > 1 ? buildComputeStatement(b, 2) : undefined;
  const flows: Record<string, { node: number; socket: string }> = { true: { node: trueArm, socket: "in" } };
  if (falseArm !== undefined) {
    flows.false = { node: falseArm, socket: "in" };
  }
  b.nodes[idx].flows = flows;
  return idx;
}

function buildSwitchStatement(b: GraphBuilder): number {
  const caseCount = randInt(b.rng, 2, 3);
  const cases = Array.from(new Set(Array.from({ length: caseCount }, () => randInt(b.rng, 0, 4))));
  const selection = buildValue(b, "int", 2);
  const decl = b.declFor("flow/switch");
  const idx = b.pushNode({ declaration: decl, configuration: { cases: { value: cases } }, values: { selection }, flows: {} });
  const flows: Record<string, { node: number; socket: string }> = {};
  for (const c of cases) {
    if (b.remaining <= 1) break;
    flows[String(c)] = { node: buildComputeStatement(b, 1), socket: "in" };
  }
  if (b.remaining > 1) {
    flows.default = { node: buildComputeStatement(b, 1), socket: "in" };
  }
  b.nodes[idx].flows = flows;
  return idx;
}

// Bounded by literal start/end indices only — never expression-derived —
// so this always terminates in `end` iterations regardless of anything
// else the generator does.
function buildForStatement(b: GraphBuilder): number {
  const end = randInt(b.rng, 1, 5);
  const decl = b.declFor("flow/for");
  const idx = b.pushNode({
    declaration: decl,
    values: { startIndex: { type: TYPE_INDEX.int, value: [0] }, endIndex: { type: TYPE_INDEX.int, value: [end] } },
    flows: {}
  });
  if (b.remaining > 0) {
    // Loop body: fold the per-iteration `index` output into a random
    // float variable, exercising the for-node's own value output.
    const floatVars = b.varsOf("float");
    if (floatVars.length > 0 && b.remaining > 1) {
      const target = pick(b.rng, floatVars);
      const indexRef: NodeValue = { node: idx, socket: "index" };
      const decl2 = b.declFor("type/intToFloat");
      const asFloat = b.pushNode({ declaration: decl2, values: { a: indexRef }, flows: {} });
      const decl3 = b.declFor("math/add");
      const other = readVariable(b, "float");
      const sum = b.pushNode({ declaration: decl3, values: { a: { node: asFloat, socket: "value" }, b: other }, flows: {} });
      const setDecl = b.declFor("variable/set");
      const bodyIdx = b.pushNode({
        declaration: setDecl,
        configuration: { variables: { value: [target.index] } },
        values: { [String(target.index)]: { node: sum, socket: "value" } },
        flows: {}
      });
      b.nodes[idx].flows = { loopBody: { node: bodyIdx, socket: "in" } };
    } else {
      const bodyIdx = buildComputeStatement(b, 1);
      b.nodes[idx].flows = { loopBody: { node: bodyIdx, socket: "in" } };
    }
  }
  return idx;
}

// Bounded via a dedicated counter variable + a small literal bound — the
// loop body always increments the same counter it's guarded by, so this
// terminates in `bound` iterations no matter what.
function buildWhileStatement(b: GraphBuilder): number {
  const bound = randInt(b.rng, 1, 5);
  const counterIndex = b.variables.length;
  b.variables.push({ sig: "int", index: counterIndex });

  const getCounter = () => {
    const decl = b.declFor("variable/get");
    const idx = b.pushNode({ declaration: decl, configuration: { variable: { value: [counterIndex] } }, values: {}, flows: {} });
    return { node: idx, socket: "value" } as NodeValue;
  };

  const condDecl = b.declFor("math/lt");
  const condIdx = b.pushNode({
    declaration: condDecl,
    values: { a: getCounter(), b: { type: TYPE_INDEX.int, value: [bound] } },
    flows: {}
  });

  const whileDecl = b.declFor("flow/while");
  const whileIdx = b.pushNode({ declaration: whileDecl, values: { condition: { node: condIdx, socket: "value" } }, flows: {} });

  const incDecl = b.declFor("math/add");
  const incIdx = b.pushNode({ declaration: incDecl, values: { a: getCounter(), b: { type: TYPE_INDEX.int, value: [1] } }, flows: {} });
  const setDecl = b.declFor("variable/set");
  const bodyIdx = b.pushNode({
    declaration: setDecl,
    configuration: { variables: { value: [counterIndex] } },
    values: { [String(counterIndex)]: { node: incIdx, socket: "value" } },
    flows: {}
  });
  b.nodes[whileIdx].flows = { loopBody: { node: bodyIdx, socket: "in" } };
  return whileIdx;
}

export type GeneratedGraph = { graph: Graph; variableSigs: Sig[] };

export function generateGraph(rng: Rng, minNodes = 5, maxNodes = 30): GeneratedGraph {
  const nodeBudget = randInt(rng, minNodes, maxNodes);
  const varCount = randInt(rng, 3, 6);
  const variables: VarInfo[] = Array.from({ length: varCount }, (_, index) => ({ sig: pick(rng, ["bool", "int", "float"] as const), index }));

  const b = new GraphBuilder(rng, variables, nodeBudget);
  const topEntries: number[] = [];
  const kinds: Array<() => number> = [
    () => buildComputeStatement(b, 2),
    () => buildComputeStatement(b, 2),
    () => buildComputeStatement(b, 2),
    () => buildBranchStatement(b),
    () => buildSwitchStatement(b),
    () => buildForStatement(b),
    () => buildWhileStatement(b)
  ];

  while (b.remaining > 3 && topEntries.length < 8) {
    topEntries.push(pick(rng, kinds)());
  }
  if (topEntries.length === 0) {
    topEntries.push(buildComputeStatement(b, 1));
  }

  // Wire event/onStart -> flow/sequence -> each top-level statement, in
  // generation order (flow/sequence fires "0","1","2",... in order).
  const startDecl = b.declFor("event/onStart");
  let entryNodeIndex: number;
  if (topEntries.length === 1) {
    entryNodeIndex = topEntries[0];
  } else {
    const seqDecl = b.declFor("flow/sequence");
    const seqFlows: Record<string, { node: number; socket: string }> = {};
    topEntries.forEach((target, i) => {
      seqFlows[String(i)] = { node: target, socket: "in" };
    });
    entryNodeIndex = b.pushNode({ declaration: seqDecl, values: {}, flows: seqFlows });
  }
  const startIdx = b.pushNode({ declaration: startDecl, values: {}, flows: { out: { node: entryNodeIndex, socket: "in" } } });
  // event/onStart must be findable by index-order scan (see runInterpreter
  // below) — it doesn't matter that it ended up last in `nodes`, since flow
  // edges (unlike value edges) aren't required to be backward-only.
  void startIdx;

  const graphVariables = b.variables.map((v) => ({ id: `v${v.index}`, type: TYPE_INDEX[v.sig], value: [defaultLiteral(rng, v.sig)] }));

  const graph: Graph = {
    types: TYPES,
    variables: graphVariables,
    events: [],
    declarations: b.declarations,
    nodes: b.nodes
  };
  return { graph, variableSigs: b.variables.map((v) => v.sig) };
}

function defaultLiteral(rng: Rng, sig: Sig): number | boolean {
  if (sig === "bool") return rng() < 0.5;
  if (sig === "int") return randInt(rng, -20, 20);
  return Math.round((rng() * 40 - 20) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Running both paths
// ---------------------------------------------------------------------------

const TICKS = 5;
const DT = 1 / 60;

function runInterpreter(graph: Graph): Value[] {
  const runtime = createRuntime(graph, {});
  runtime.graph.nodes.forEach((node, index) => {
    if ((runtime.graph.declarations[node.declaration]?.op ?? "") === "event/onStart") {
      executeFlow(runtime, index);
    }
  });
  for (let t = 0; t < TICKS; t += 1) {
    advanceTime(runtime, DT);
  }
  return runtime.variables.map((v) => ({ type: v.type, data: [...v.data] }) as Value);
}

async function bundle(code: string): Promise<string> {
  const result = await esbuild.build({
    stdin: { contents: code, loader: "ts", resolveDir: import.meta.dirname, sourcefile: "fuzz-engine.ts" },
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

async function runCompiled(graph: Graph): Promise<Value[]> {
  const { module, diagnostics: importDiags } = importGraph(graph as unknown as IrGraph);
  const importErrors = importDiags.filter((d) => d.severity === "error");
  if (importErrors.length > 0) {
    throw new Error(`importGraph errors: ${JSON.stringify(importErrors)}`);
  }
  const checkErrors = checkModule(module).filter((d) => d.severity === "error");
  if (checkErrors.length > 0) {
    throw new Error(`checkModule errors: ${JSON.stringify(checkErrors)}`);
  }
  const { code } = emitModule(module);
  const bundled = await bundle(code);
  const dataUrl = `data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`;
  const mod = (await import(dataUrl)) as { default: EngineFactory };
  const engine = mod.default({});
  engine.start();
  for (let t = 0; t < TICKS; t += 1) {
    engine.advance(DT);
  }
  const out: Value[] = [];
  for (let i = 0; i < engine.variableCount; i += 1) {
    out.push(engine.getVariableByIndex(i));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function valuesEqual(a: Value, b: Value, epsilon = 1e-4): string | null {
  if (a.type !== b.type) {
    return `type ${a.type} vs ${b.type}`;
  }
  if (a.type === "bool") {
    const av = (a.data as boolean[])[0];
    const bv = (b.data as boolean[])[0];
    return av === bv ? null : `bool ${av} vs ${bv}`;
  }
  if (a.type === "ref") {
    const av = String((a.data as string[])[0] ?? "");
    const bv = String((b.data as string[])[0] ?? "");
    return av === bv ? null : `ref "${av}" vs "${bv}"`;
  }
  const av = Number((a.data as number[])[0]);
  const bv = Number((b.data as number[])[0]);
  if (Number.isNaN(av) && Number.isNaN(bv)) return null;
  if (av === Infinity && bv === Infinity) return null;
  if (av === -Infinity && bv === -Infinity) return null;
  return Math.abs(av - bv) <= epsilon ? null : `${a.type} ${av} vs ${bv} (diff ${Math.abs(av - bv)})`;
}

function diffValues(interp: Value[], compiled: Value[]): string | null {
  if (interp.length !== compiled.length) {
    return `variable count differs: ${interp.length} (interpreter) vs ${compiled.length} (compiled)`;
  }
  for (let i = 0; i < interp.length; i += 1) {
    const mismatch = valuesEqual(interp[i], compiled[i]);
    if (mismatch) {
      return `variable ${i}: ${mismatch}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { seed: number; count: number } {
  let seed = 1234567;
  let count = 200;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--seed") {
      seed = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i] === "--count") {
      count = Number(argv[i + 1]);
      i += 1;
    }
  }
  return { seed, count };
}

const FAILURES_DIR = path.resolve(import.meta.dirname, "../../../fuzz-failures");

function writeFailure(index: number, seed: number, graph: Graph, reason: string): string {
  fs.mkdirSync(FAILURES_DIR, { recursive: true });
  const filePath = path.join(FAILURES_DIR, `seed${seed}-case${index}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ seed, index, reason, graph }, null, 2));
  return filePath;
}

async function main() {
  assertRegistrySafe();
  const { seed, count } = parseArgs(process.argv.slice(2));
  const rng = mulberry32(seed);
  let failures = 0;

  for (let i = 0; i < count; i += 1) {
    const { graph } = generateGraph(rng);
    try {
      const interpValues = runInterpreter(graph);
      const compiledValues = await runCompiled(graph);
      const mismatch = diffValues(interpValues, compiledValues);
      if (mismatch) {
        failures += 1;
        const filePath = writeFailure(i, seed, graph, mismatch);
        console.error(`MISMATCH case ${i} (seed ${seed}): ${mismatch}\n  repro written to ${filePath}`);
      }
    } catch (err) {
      failures += 1;
      const reason = err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err);
      const filePath = writeFailure(i, seed, graph, reason);
      console.error(`ERROR case ${i} (seed ${seed}): ${reason}\n  repro written to ${filePath}`);
    }
  }

  console.log(`${count} graphs fuzzed (seed=${seed}), ${count - failures} passed, ${failures} failed.`);
  if (failures > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("fuzz.js")) {
  main();
}
