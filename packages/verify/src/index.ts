// Structural graph verification + best-effort equivalence checking. See
// docs/design/ir-and-transpiler.md's "Equivalence" section: this is a
// triage signal, not the gate — execution equivalence via the conformance
// judge protocol (packages/conformance/src/run-roundtrip.ts) is the real
// acceptance criterion. validateGraph checks the structural invariants a
// well-formed KHR_interactivity graph must satisfy (independent of whether
// it came from @gltfi/ir's exportGraph or anywhere else); normalizeGraph +
// equivalentGraphs do a best-effort parallel walk comparing two graphs.
import { getOpSpec } from "@gltfi/kernel";
import type { Diagnostic } from "@gltfi/ir";

// Structurally compatible with @gltfi/ir's Graph/GraphNode/GraphJson types
// (and hence with @gltfi/runtime's Graph) — kept as a local, minimal shape
// so this package doesn't need to pick one specific producer's type.
export type VGraphValue = { node: number; socket?: string } | { type: number; value: Array<number | boolean | string> };
export type VGraphNode = {
  declaration: number;
  configuration?: Record<string, { value: Array<number | boolean | string> }>;
  values?: Record<string, VGraphValue>;
  flows?: Record<string, { node: number; socket: string }>;
};
export type VGraph = {
  types: Array<{ signature: string }>;
  variables?: Array<{ id?: string; type: number; value: Array<number | boolean | string> }>;
  events?: Array<{ id?: string; values?: Record<string, { type: number; value: Array<number | boolean | string> }> }>;
  declarations: Array<{ op: string }>;
  nodes: VGraphNode[];
};

export type ValidateResult = { ok: boolean; diagnostics: Diagnostic[] };

const HANDLER_OPS = new Set(["event/onStart", "event/onTick", "event/receive", "event/onSelect", "event/onHoverIn", "event/onHoverOut"]);

export function validateGraph(graph: VGraph): ValidateResult {
  const diagnostics: Diagnostic[] = [];
  const err = (code: string, message: string, nodeIndex?: number) => diagnostics.push({ severity: "error", code, message, nodeIndex });

  // Declarations: op strings must be non-empty and unique (spec forbids
  // duplicate declarations for the same op — see the design doc's "IR ->
  // graph" section).
  const seenOps = new Map<string, number>();
  graph.declarations.forEach((d, i) => {
    if (!d.op) {
      err("GV001", `declaration ${i} has an empty op string`);
      return;
    }
    const prior = seenOps.get(d.op);
    if (prior !== undefined) {
      err("GV002", `declaration ${i} duplicates declaration ${prior}'s op "${d.op}"`);
    }
    seenOps.set(d.op, i);
  });

  const typeCount = graph.types.length;
  (graph.variables ?? []).forEach((v, i) => {
    if (v.type < 0 || v.type >= typeCount) {
      err("GV010", `variable ${i} has out-of-range type index ${v.type}`);
    }
  });
  (graph.events ?? []).forEach((e, i) => {
    for (const [key, val] of Object.entries(e.values ?? {})) {
      if (val.type < 0 || val.type >= typeCount) {
        err("GV011", `event ${i} value "${key}" has out-of-range type index ${val.type}`);
      }
    }
  });

  graph.nodes.forEach((node, nodeIndex) => {
    if (node.declaration < 0 || node.declaration >= graph.declarations.length) {
      err("GV020", `node ${nodeIndex} has out-of-range declaration index ${node.declaration}`, nodeIndex);
      return;
    }
    const op = graph.declarations[node.declaration].op;
    const spec = getOpSpec(op);

    for (const [socket, v] of Object.entries(node.values ?? {})) {
      if ("node" in v) {
        if (v.node < 0 || v.node >= graph.nodes.length) {
          err("GV021", `node ${nodeIndex} value "${socket}" references out-of-range node ${v.node}`, nodeIndex);
        } else if (v.node >= nodeIndex) {
          // Hard spec requirement, not just an @gltfi/ir export choice — see
          // the design doc's "Why structuring always works": value edges
          // must strictly decrease in index (0 exceptions across the
          // 145-graph conformance corpus).
          err("GV022", `node ${nodeIndex} value "${socket}" references node ${v.node}, which is not strictly before it (value edges must be backward-only)`, nodeIndex);
        }
      } else {
        if (v.type < 0 || v.type >= typeCount) {
          err("GV023", `node ${nodeIndex} value "${socket}" literal has out-of-range type index ${v.type}`, nodeIndex);
        }
        if (!Array.isArray(v.value)) {
          err("GV024", `node ${nodeIndex} value "${socket}" literal's value is not an array`, nodeIndex);
        }
      }
    }

    for (const [socket, f] of Object.entries(node.flows ?? {})) {
      if (f.node < 0 || f.node >= graph.nodes.length) {
        err("GV025", `node ${nodeIndex} flow "${socket}" references out-of-range node ${f.node}`, nodeIndex);
      }
      if (typeof f.socket !== "string" || f.socket.length === 0) {
        err("GV026", `node ${nodeIndex} flow "${socket}" has an invalid target socket`, nodeIndex);
      }
    }

    if (spec?.config) {
      for (const field of spec.config) {
        const entry = node.configuration?.[field.name];
        if (!entry) {
          if (field.required) {
            err("GV027", `node ${nodeIndex} ("${op}") missing required config field "${field.name}"`, nodeIndex);
          }
          continue;
        }
        if (!Array.isArray(entry.value)) {
          err("GV028", `node ${nodeIndex} ("${op}") config field "${field.name}" is not an array`, nodeIndex);
          continue;
        }
        if ((field.type === "int" || field.type === "bool" || field.type === "string") && entry.value.length !== 1) {
          err("GV029", `node ${nodeIndex} ("${op}") config field "${field.name}" (${field.type}) should have exactly one value`, nodeIndex);
        }
      }
    }

    if (HANDLER_OPS.has(op) && Object.keys(node.values ?? {}).length > 0) {
      err("GV030", `node ${nodeIndex} ("${op}") is a handler root and should have no value inputs`, nodeIndex);
    }
  });

  return { ok: diagnostics.every((d) => d.severity !== "error"), diagnostics };
}

// ---------------------------------------------------------------------------
// normalizeGraph / equivalentGraphs
// ---------------------------------------------------------------------------

export type NormalizedNode = {
  op: string;
  config: string;
  values: Array<[string, string]>; // [socket, canonical value-ref or literal key]
  flows: Array<[string, number]>; // [socket, target node index]
};

export type NormalizedGraph = { graph: VGraph; nodes: NormalizedNode[] };

function normSocket(key: string): string {
  // Collapse zero-padding ("00" vs "0") for structural comparison — see the
  // design doc's "Equivalence" section.
  return /^\d+$/.test(key) ? String(Number(key)) : key;
}

// flow/sequence's ordered output sockets show up under two different naming
// conventions across the corpus: plain decimal ("0","1",...) — what
// @gltfi/ir/export.ts synthesizes — and the zero-padded "sNNN" form used by
// some authoring tools in the wild (e.g. "s000","s001","s002"). Both name
// the same thing (the Nth branch to fire, in order), so chainSteps below
// needs to recognize either spelling; returns null for keys that are
// neither (a flow/sequence node should not have any).
function sequenceSocketIndex(key: string): number | null {
  if (/^\d+$/.test(key)) return Number(key);
  const m = /^s(\d+)$/.exec(key);
  return m ? Number(m[1]) : null;
}

// JSON.stringify collapses NaN/Infinity/-Infinity to `null`, which would
// make e.g. [NaN,2,3] and [Infinity,2,3] compare equal here — see
// @gltfi/ir/export.ts's stableDataKey, which this mirrors (a real bug
// caught during development, in the CSE cache key rather than here, but the
// same hazard applies to any JSON.stringify over graph literal values).
function stableDataKey(data: ReadonlyArray<number | boolean | string>): string {
  return JSON.stringify(
    data.map((raw) => {
      // KHR_interactivity encodes non-finite floats as the strings
      // "NaN"/"Infinity"/"-Infinity" in glTF JSON (numbers can't carry
      // them); @gltfi/kernel's parseScalar does this same coercion
      // elsewhere. A graph fresh off disk and one that's been through
      // @gltfi/ir (which materializes them as real JS numbers) must
      // compare equal here.
      const v = raw === "NaN" ? NaN : raw === "Infinity" ? Infinity : raw === "-Infinity" ? -Infinity : raw;
      if (typeof v === "number") {
        if (Number.isNaN(v)) return "NaN";
        if (v === Infinity) return "Inf";
        if (v === -Infinity) return "-Inf";
        return v;
      }
      return v;
    })
  );
}

// pointer/get, pointer/set and pointer/interpolate all carry a "type"
// config field whose *value* is a raw index into graph.types — but the
// exported and re-imported graphs each build their own types table
// independently, so the same logical type ("float3", say) can legitimately
// sit at different indices in the two tables (divergence class (a), see
// docs's "Equivalence" section). Compare by the referenced type's
// signature instead of its positional index.
const POINTER_TYPE_OPS = new Set(["pointer/get", "pointer/set", "pointer/interpolate"]);

// int/float literals are graph-level ambiguous for many generically-typed
// sockets (most visibly debug/log's message arguments): the same numeric
// literal can round-trip as "int" on one side and "float" on the other
// purely because JS numbers don't distinguish the two and emit/parse must
// pick a default (divergence class (c), see docs's "Equivalence" section).
// Treat scalar int/float literals as one "num" family for comparison.
function literalTypeFamily(signature: string): string {
  return signature === "int" || signature === "float" ? "num" : signature;
}

// KHR_interactivity treats a missing value-socket input as "use this type's
// default (zero) value" — see @gltfi/kernel's defaultValue, mirrored here.
// So an explicit default-valued literal on one side and an omitted socket
// on the other are execution-equivalent, even though one graph's node has
// the value key and the other's doesn't. This is most visible on
// event/send's optional payload parameters (boolParameter/intParameter/...)
// which @gltfi/ir/export.ts always materializes explicitly.
const IDENTITY_2X2 = [1, 0, 0, 1];
const IDENTITY_3X3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const IDENTITY_4X4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function isDefaultLiteral(signature: string, data: ReadonlyArray<number | boolean | string>): boolean {
  const allZero = (n: number) => data.length === n && data.every((v) => Number(v) === 0);
  switch (signature) {
    case "bool":
      return data.length === 1 && data[0] === false;
    case "int":
    case "float":
      return allZero(1);
    case "float2":
      return allZero(2);
    case "float3":
      return allZero(3);
    case "float4":
      return allZero(4);
    case "float2x2":
      return data.length === IDENTITY_2X2.length && data.every((v, i) => Number(v) === IDENTITY_2X2[i]);
    case "float3x3":
      return data.length === IDENTITY_3X3.length && data.every((v, i) => Number(v) === IDENTITY_3X3[i]);
    case "float4x4":
      return data.length === IDENTITY_4X4.length && data.every((v, i) => Number(v) === IDENTITY_4X4[i]);
    case "ref":
      return data.length === 1 && data[0] === "";
    default:
      return false;
  }
}

function canonicalConfig(graph: VGraph, op: string, node: VGraphNode): string {
  const cfg = node.configuration ?? {};
  const keys = Object.keys(cfg).sort();
  return JSON.stringify(
    keys.map((k) => {
      if (POINTER_TYPE_OPS.has(op) && k === "type") {
        const idx = Number(cfg[k].value[0]);
        return [k, `sig:${graph.types[idx]?.signature ?? `<invalid:${idx}>`}`];
      }
      if (op === "flow/switch" && k === "cases") {
        // flow/switch's output flow sockets are keyed by the case *value*
        // itself (e.g. socket "4" routes case 4), not by its position in
        // this config array — so the declared order of "cases" carries no
        // behavior and two graphs listing the same case values in a
        // different order are execution-equivalent.
        const sorted = [...cfg[k].value].sort((x, y) => Number(x) - Number(y));
        return [k, stableDataKey(sorted)];
      }
      return [k, stableDataKey(cfg[k].value)];
    })
  );
}

export function normalizeGraph(graph: VGraph): NormalizedGraph {
  const nodes: NormalizedNode[] = graph.nodes.map((node) => {
    const op = graph.declarations[node.declaration]?.op ?? `<invalid:${node.declaration}>`;
    const values = Object.entries(node.values ?? {})
      .map(([socket, v]): [string, string] => {
        if ("node" in v) {
          return [normSocket(socket), `ref:${v.node}:${normSocket(v.socket ?? "value")}`];
        }
        const signature = graph.types[v.type]?.signature ?? String(v.type);
        const key = `lit:${literalTypeFamily(signature)}:${stableDataKey(v.value)}`;
        return [normSocket(socket), isDefaultLiteral(signature, v.value) ? `${key}:default` : key];
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
    const flows = Object.entries(node.flows ?? {})
      .map(([socket, f]): [string, number] => [normSocket(socket), f.node])
      .sort((a, b) => a[0].localeCompare(b[0]));
    return { op, config: canonicalConfig(graph, op, node), values, flows };
  });
  return { graph, nodes };
}

export type EquivalenceResult = { equivalent: boolean; firstDivergence?: string };

export function equivalentGraphs(a: VGraph, b: VGraph): EquivalenceResult {
  const na = normalizeGraph(a);
  const nb = normalizeGraph(b);

  const aHandlers = a.nodes.map((n, i) => ({ i, op: a.declarations[n.declaration]?.op ?? "" })).filter((x) => HANDLER_OPS.has(x.op));
  const bHandlers = b.nodes.map((n, i) => ({ i, op: b.declarations[n.declaration]?.op ?? "" })).filter((x) => HANDLER_OPS.has(x.op));
  if (aHandlers.length !== bHandlers.length) {
    return { equivalent: false, firstDivergence: `handler count differs: ${aHandlers.length} vs ${bHandlers.length}` };
  }

  // Flow-chain canonicalization (divergence class (b), see docs's
  // "Equivalence" section): a flow/sequence node with N ordered outputs is
  // execution-equivalent to the same N targets fired one after another via
  // plain "out" chaining, at any nesting depth — @gltfi/ir/export.ts may
  // synthesize nested flow/sequence wrappers (or none at all, chaining
  // through plain "out" sockets instead) where the original graph used one
  // flatter or differently-shaped structure. chainSteps() flattens both
  // representations into the same canonical ordered list of "real"
  // (non-flow/sequence) node indices: it inlines every flow/sequence
  // target in socket order ("0","1","2",...) and, for any other node whose
  // *only* flow output socket is "out" (a plain statement handing off to
  // the next one), continues the list through that socket instead of
  // stopping.
  function chainSteps(ng: NormalizedGraph, start: number): number[] {
    const steps: number[] = [];
    const visited = new Set<number>();
    let current: number | undefined = start;
    while (current !== undefined) {
      if (visited.has(current)) break; // cycle guard — shouldn't happen in well-formed graphs.
      visited.add(current);
      const normNode: NormalizedNode | undefined = ng.nodes[current];
      if (!normNode) break;
      if (normNode.op === "flow/sequence") {
        const targets: number[] = normNode.flows
          .filter((entry: [string, number]) => sequenceSocketIndex(entry[0]) !== null)
          .sort((x: [string, number], y: [string, number]) => sequenceSocketIndex(x[0])! - sequenceSocketIndex(y[0])!)
          .map((entry: [string, number]) => entry[1]);
        for (const target of targets) {
          steps.push(...chainSteps(ng, target));
        }
        current = undefined;
      } else {
        steps.push(current);
        current = normNode.flows.length === 1 && normNode.flows[0][0] === "out" ? normNode.flows[0][1] : undefined;
      }
    }
    return steps;
  }

  // Compares the canonical flattened chains starting at two flow targets
  // (see chainSteps above), walking matching steps pairwise.
  function compareChain(ai: number, bi: number, path: string): string | null {
    const chainA = chainSteps(na, ai);
    const chainB = chainSteps(nb, bi);
    if (chainA.length !== chainB.length) {
      return `${path}: flattened sequence length differs (${chainA.length} vs ${chainB.length}) starting at a:${ai} vs b:${bi}`;
    }
    for (let i = 0; i < chainA.length; i += 1) {
      const stepPath = chainA.length > 1 ? `${path}[chain step ${i}]` : path;
      const div = walk(chainA[i], chainB[i], stepPath);
      if (div) return div;
    }
    return null;
  }

  const visiting = new Set<string>();

  function walk(ai: number, bi: number, path: string): string | null {
    const pairKey = `${ai}:${bi}`;
    if (visiting.has(pairKey)) {
      return null; // already comparing this pair further up the recursion — assume consistent (cycle guard).
    }
    if (ai < 0 || ai >= na.nodes.length) return `${path}: node index ${ai} out of range (a)`;
    if (bi < 0 || bi >= nb.nodes.length) return `${path}: node index ${bi} out of range (b)`;
    visiting.add(pairKey);
    try {
      const nodeA = na.nodes[ai];
      const nodeB = nb.nodes[bi];
      if (nodeA.op !== nodeB.op) {
        return `${path}: op "${nodeA.op}" (a:${ai}) vs "${nodeB.op}" (b:${bi})`;
      }
      if (nodeA.config !== nodeB.config) {
        return `${path}: config differs at ${nodeA.op} (a:${ai} vs b:${bi}): ${nodeA.config} vs ${nodeB.config}`;
      }
      const valKeysA = new Set(nodeA.values.map(([k]) => k));
      const valKeysB = new Set(nodeB.values.map(([k]) => k));
      for (const [k, ref] of nodeA.values) {
        if (!valKeysB.has(k) && !ref.endsWith(":default")) {
          return `${path}: value socket "${k}" present in a (${nodeA.op}#${ai}) but missing in b`;
        }
      }
      for (const [k, ref] of nodeB.values) {
        if (!valKeysA.has(k) && !ref.endsWith(":default")) {
          return `${path}: value socket "${k}" present in b (${nodeB.op}#${bi}) but missing in a`;
        }
      }
      for (const [socket, refA] of nodeA.values) {
        const entryB = nodeB.values.find(([k]) => k === socket);
        if (!entryB) continue; // missing on b, but refA was verified default-valued above.
        const refB = entryB[1];
        if (refA.startsWith("ref:") && refB.startsWith("ref:")) {
          const [, aNodeStr, aSocket] = refA.split(":");
          const [, bNodeStr, bSocket] = refB.split(":");
          if (aSocket !== bSocket) return `${path}.values[${socket}]: output socket "${aSocket}" vs "${bSocket}"`;
          const sub = walk(Number(aNodeStr), Number(bNodeStr), `${path}.values[${socket}]`);
          if (sub) return sub;
        } else if (refA !== refB) {
          return `${path}.values[${socket}]: ${refA} vs ${refB}`;
        }
      }

      return compareFlows(nodeA, nodeB, ai, bi, path);
    } finally {
      visiting.delete(pairKey);
    }
  }

  // Compares flow socket sets and recursively compares matching targets'
  // flattened chains (see compareChain/chainSteps above). A node whose only
  // flow output socket is "out" has already been absorbed into its caller's
  // chain (chainSteps followed it), so there's nothing left to compare here
  // for that socket.
  function compareFlows(nodeA: NormalizedNode, nodeB: NormalizedNode, ai: number, bi: number, path: string): string | null {
    if (nodeA.flows.length === 1 && nodeA.flows[0][0] === "out" && nodeB.flows.length === 1 && nodeB.flows[0][0] === "out") {
      return null;
    }
    // flow/multiGate's output sockets are "fully dynamic" (see
    // registry.ts): @gltfi/runtime picks which one fires by rank —
    // `Object.keys(node.flows).sort()[index]`, not by the sockets' literal
    // key text — so two independently-authored/exported multiGate nodes
    // can legitimately use different key spellings for "the Nth gate" (see
    // e.g. zero-padded "001"/"004"/"008" vs plain "0"/"1"/"2" in the
    // corpus) as long as the rank order of targets matches.
    if (nodeA.op === "flow/multiGate" && nodeB.op === "flow/multiGate") {
      const rankedA = [...nodeA.flows].sort((x, y) => Number(x[0]) - Number(y[0]));
      const rankedB = [...nodeB.flows].sort((x, y) => Number(x[0]) - Number(y[0]));
      if (rankedA.length !== rankedB.length) {
        return `${path}: flow/multiGate output count differs (${rankedA.length} vs ${rankedB.length}) at a:${ai} vs b:${bi}`;
      }
      for (let i = 0; i < rankedA.length; i += 1) {
        const sub = compareChain(rankedA[i][1], rankedB[i][1], `${path}.flows[rank ${i}]`);
        if (sub) return sub;
      }
      return null;
    }
    const flowKeysA = new Set(nodeA.flows.map(([k]) => k));
    const flowKeysB = new Set(nodeB.flows.map(([k]) => k));
    for (const k of flowKeysA) {
      if (!flowKeysB.has(k)) return `${path}: flow socket "${k}" present in a (${nodeA.op}#${ai}) but missing in b`;
    }
    for (const k of flowKeysB) {
      if (!flowKeysA.has(k)) return `${path}: flow socket "${k}" present in b (${nodeB.op}#${bi}) but missing in a`;
    }
    for (const [socket, targetA] of nodeA.flows) {
      const targetB = nodeB.flows.find(([k]) => k === socket)![1];
      const sub = compareChain(targetA, targetB, `${path}.flows[${socket}]`);
      if (sub) return sub;
    }
    return null;
  }

  for (let i = 0; i < aHandlers.length; i += 1) {
    const div = compareChain(aHandlers[i].i, bHandlers[i].i, `handler[${i}]`);
    if (div) {
      return { equivalent: false, firstDivergence: div };
    }
  }
  return { equivalent: true };
}
