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

// JSON.stringify collapses NaN/Infinity/-Infinity to `null`, which would
// make e.g. [NaN,2,3] and [Infinity,2,3] compare equal here — see
// @gltfi/ir/export.ts's stableDataKey, which this mirrors (a real bug
// caught during development, in the CSE cache key rather than here, but the
// same hazard applies to any JSON.stringify over graph literal values).
function stableDataKey(data: ReadonlyArray<number | boolean | string>): string {
  return JSON.stringify(
    data.map((v) => {
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

function canonicalConfig(node: VGraphNode): string {
  const cfg = node.configuration ?? {};
  const keys = Object.keys(cfg).sort();
  return JSON.stringify(keys.map((k) => [k, stableDataKey(cfg[k].value)]));
}

export function normalizeGraph(graph: VGraph): NormalizedGraph {
  const nodes: NormalizedNode[] = graph.nodes.map((node) => {
    const op = graph.declarations[node.declaration]?.op ?? `<invalid:${node.declaration}>`;
    const values = Object.entries(node.values ?? {})
      .map(([socket, v]): [string, string] => {
        const key = "node" in v ? `ref:${v.node}:${normSocket(v.socket ?? "value")}` : `lit:${graph.types[v.type]?.signature ?? v.type}:${stableDataKey(v.value)}`;
        return [normSocket(socket), key];
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
    const flows = Object.entries(node.flows ?? {})
      .map(([socket, f]): [string, number] => [normSocket(socket), f.node])
      .sort((a, b) => a[0].localeCompare(b[0]));
    return { op, config: canonicalConfig(node), values, flows };
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
      for (const k of valKeysA) {
        if (!valKeysB.has(k)) return `${path}: value socket "${k}" present in a (${nodeA.op}#${ai}) but missing in b`;
      }
      for (const k of valKeysB) {
        if (!valKeysA.has(k)) return `${path}: value socket "${k}" present in b (${nodeB.op}#${bi}) but missing in a`;
      }
      for (const [socket, refA] of nodeA.values) {
        const refB = nodeB.values.find(([k]) => k === socket)![1];
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

  // Compares flow socket sets and recursively walks matching targets. Note:
  // @gltfi/ir/export.ts may synthesize an extra flow/sequence node to join
  // independent branches (see that file's header) where the original graph
  // used one wider flow/sequence node (e.g. 3 keys "0","1","2" vs a
  // synthesized 2-level nesting) — this reads as a structural divergence
  // here even though the two graphs are execution-equivalent (same nodes
  // fire in the same order). That's intentional: this checker reports
  // honest structural differences rather than guessing at equivalence
  // across a restructuring — see this file's header ("a triage signal, not
  // the gate").
  function compareFlows(nodeA: NormalizedNode, nodeB: NormalizedNode, ai: number, bi: number, path: string): string | null {
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
      const sub = walk(targetA, targetB, `${path}.flows[${socket}]`);
      if (sub) return sub;
    }
    return null;
  }

  for (let i = 0; i < aHandlers.length; i += 1) {
    const div = walk(aHandlers[i].i, bHandlers[i].i, `handler[${i}]`);
    if (div) {
      return { equivalent: false, firstDivergence: div };
    }
  }
  return { equivalent: true };
}
