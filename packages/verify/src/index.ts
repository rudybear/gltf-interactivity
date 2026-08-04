// Structural graph verification + best-effort equivalence checking. See
// docs/design/ir-and-transpiler.md's "Equivalence" section: this is a
// triage signal, not the gate — execution equivalence via the conformance
// judge protocol (packages/conformance/src/run-roundtrip.ts) is the real
// acceptance criterion. validateGraph checks the structural invariants a
// well-formed KHR_interactivity graph must satisfy (independent of whether
// it came from @gltfi/ir's exportGraph or anywhere else); normalizeGraph +
// equivalentGraphs do a best-effort parallel walk comparing two graphs.
import { getOpSpec } from "@gltfi/kernel";
import { formatPointerTemplate, parsePointerTemplate, type Diagnostic } from "@gltfi/ir";

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

// pointer/get|set|interpolate's "pointer" config carries a template string
// ("/nodes/[nodeIndex]/translation") whose bracketed params are backed by
// ordinary value sockets of the same name. @gltfi/emit-ts's readability
// rewrite inlines any CONSTANT-fed int param straight into the path string
// at emit time (see emit.ts's pointerCall doc comment), which is execution-
// equivalent but structurally different: the re-exported graph's "pointer"
// config text and value-socket set genuinely differ from a graph that never
// went through that inlining. Since this specific pattern — a literal node/
// material/etc. index feeding a pointer/set that writes a fixed "test
// passed" marker — is essentially universal across the official corpus
// (verified: every one of the 145 conformance assets follows it), leaving
// it uncanonicalized would make equivalentGraphs report DIVERGED for
// nearly every test, defeating its purpose as a triage signal. Resolve
// BOTH graphs' pointer templates through the same "inline any literal int
// param" transform before comparing (mirrors emit-ts's pointerCall exactly,
// including restricting this to `int` params only — a `ref` param's value
// is itself a full pointer-shaped string, unsafe to splice as raw literal
// path text) — an already-literal template is a no-op under this, so this
// only ever makes two graphs MORE likely to compare equal, never less.
function resolvePointerTemplate(node: VGraphNode, pointerStr: string): { resolvedPointer: string; inlinedSockets: Set<string> } {
  const template = parsePointerTemplate(pointerStr);
  const inlinedSockets = new Set<string>();
  const segments = template.segments.map((seg) => {
    if (seg.k === "lit") {
      return seg;
    }
    const entry = node.values?.[seg.name];
    if (seg.k === "int" && entry && !("node" in entry)) {
      inlinedSockets.add(seg.name);
      return { k: "lit" as const, text: String(Math.trunc(Number(entry.value[0] ?? 0))) };
    }
    return seg;
  });
  return { resolvedPointer: formatPointerTemplate({ segments }), inlinedSockets };
}

function canonicalConfig(graph: VGraph, op: string, node: VGraphNode, resolvedPointer: string | undefined): string {
  const cfg = node.configuration ?? {};
  const keys = Object.keys(cfg).sort();
  return JSON.stringify(
    keys.map((k) => {
      if (POINTER_TYPE_OPS.has(op) && k === "type") {
        const idx = Number(cfg[k].value[0]);
        return [k, `sig:${graph.types[idx]?.signature ?? `<invalid:${idx}>`}`];
      }
      if (POINTER_TYPE_OPS.has(op) && k === "pointer" && resolvedPointer !== undefined) {
        return [k, resolvedPointer];
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
    const pointerCfgValue = POINTER_TYPE_OPS.has(op) ? node.configuration?.pointer?.value[0] : undefined;
    const pointerResolution = typeof pointerCfgValue === "string" ? resolvePointerTemplate(node, pointerCfgValue) : undefined;
    const inlinedSockets = pointerResolution?.inlinedSockets ?? new Set<string>();
    const values = Object.entries(node.values ?? {})
      .filter(([socket]) => !inlinedSockets.has(socket))
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
    return { op, config: canonicalConfig(graph, op, node, pointerResolution?.resolvedPointer), values, flows };
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

// ---------------------------------------------------------------------------
// compareDeclarations
// ---------------------------------------------------------------------------
//
// Advisory declaration-table diff, deliberately separate from
// equivalentGraphs above: equivalentGraphs walks *reachable node behavior*
// and never looks at graph.variables/graph.events at all (a variable that's
// declared but never read/written, or an event value the graph never
// receives, is invisible to it). An editing loop (extract -> edit -> apply)
// wants exactly that visibility — did the edit round-trip drop a variable
// id, change a declared type, or change an event's default? — so this
// walks the declaration tables directly, index by index, since edit
// round-trips are expected to preserve declaration order.
//
// Like POINTER_TYPE_OPS's config-type comparison above, "type" is compared
// as the *resolved* signature via each graph's own types table, not the
// raw index — the two graphs build that table independently, so the same
// signature can legitimately sit at a different index on each side.

export type DeclarationsComparison = { same: boolean; changes: string[] };

function resolvedTypeSig(g: VGraph, typeIndex: number): string {
  return g.types[typeIndex]?.signature ?? `<invalid:${typeIndex}>`;
}

function formatId(id: string | undefined): string {
  return id === undefined ? "(none)" : `"${id}"`;
}

// Mirrors stableDataKey's NaN/Infinity string coercion above (KHR_interactivity
// encodes non-finite floats as strings in glTF JSON, but a graph that's been
// through @gltfi/ir materializes them as real JS numbers) so both spellings
// compare equal here too.
function coerceScalar(raw: number | boolean | string): number | boolean | string {
  if (raw === "NaN") return NaN;
  if (raw === "Infinity") return Infinity;
  if (raw === "-Infinity") return -Infinity;
  return raw;
}

// Numeric-family tolerant scalar comparison: 0 and 0.0 are the same JS
// number already, and using plain `===` after coercion also makes -0 and 0
// compare equal (Object.is would not) — matching this file's existing
// "0 vs 0.0, -0 vs 0" tolerance convention.
function sameScalar(a: number | boolean | string, b: number | boolean | string): boolean {
  const ca = coerceScalar(a);
  const cb = coerceScalar(b);
  if (typeof ca === "number" || typeof cb === "number") {
    const na = Number(ca);
    const nb = Number(cb);
    if (Number.isNaN(na) && Number.isNaN(nb)) return true;
    return na === nb;
  }
  return ca === cb;
}

function sameValueArray(
  a: ReadonlyArray<number | boolean | string> | undefined,
  b: ReadonlyArray<number | boolean | string> | undefined
): boolean {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => sameScalar(v, b[i]));
}

function formatValue(value: ReadonlyArray<number | boolean | string> | undefined): string {
  if (!value) return "(none)";
  if (value.length === 1) return String(value[0]);
  return `[${value.map(String).join(",")}]`;
}

function compareVariableDeclarations(a: VGraph, b: VGraph, changes: string[]): void {
  const varsA = a.variables ?? [];
  const varsB = b.variables ?? [];
  if (varsA.length !== varsB.length) {
    changes.push(`variables: count ${varsA.length} -> ${varsB.length}`);
  }
  const count = Math.max(varsA.length, varsB.length);
  for (let i = 0; i < count; i += 1) {
    const va = varsA[i];
    const vb = varsB[i];
    if (va && !vb) {
      changes.push(`variables[${i}]: type "${resolvedTypeSig(a, va.type)}" -> (none)`);
      continue;
    }
    if (!va && vb) {
      changes.push(`variables[${i}]: (none) -> type "${resolvedTypeSig(b, vb.type)}"`);
      continue;
    }
    if (!va || !vb) continue;

    if (va.id !== vb.id) {
      changes.push(`variables[${i}]: id ${formatId(va.id)} -> ${formatId(vb.id)}`);
    }
    const sigA = resolvedTypeSig(a, va.type);
    const sigB = resolvedTypeSig(b, vb.type);
    if (sigA !== sigB) {
      changes.push(`variables[${i}]: type "${sigA}" -> "${sigB}"`);
    }
    if (!sameValueArray(va.value, vb.value)) {
      changes.push(`variables[${i}]: initial ${formatValue(va.value)} -> ${formatValue(vb.value)}`);
    }
  }
}

function compareEventDeclarations(a: VGraph, b: VGraph, changes: string[]): void {
  const eventsA = a.events ?? [];
  const eventsB = b.events ?? [];
  if (eventsA.length !== eventsB.length) {
    changes.push(`events: count ${eventsA.length} -> ${eventsB.length}`);
  }
  const count = Math.max(eventsA.length, eventsB.length);
  for (let i = 0; i < count; i += 1) {
    const ea = eventsA[i];
    const eb = eventsB[i];
    if (ea && !eb) {
      changes.push(`events[${i}]: present -> (none)`);
      continue;
    }
    if (!ea && eb) {
      changes.push(`events[${i}]: (none) -> present`);
      continue;
    }
    if (!ea || !eb) continue;

    if (ea.id !== eb.id) {
      changes.push(`events[${i}]: id ${formatId(ea.id)} -> ${formatId(eb.id)}`);
    }

    const valuesA = ea.values ?? {};
    const valuesB = eb.values ?? {};
    const keysA = new Set(Object.keys(valuesA));
    const keysB = new Set(Object.keys(valuesB));
    for (const key of keysA) {
      if (!keysB.has(key)) {
        changes.push(`events[${i}].values: key "${key}" removed`);
      }
    }
    for (const key of keysB) {
      if (!keysA.has(key)) {
        changes.push(`events[${i}].values: key "${key}" added`);
      }
    }
    for (const key of keysA) {
      if (!keysB.has(key)) continue;
      const valA = valuesA[key];
      const valB = valuesB[key];
      const sigA = resolvedTypeSig(a, valA.type);
      const sigB = resolvedTypeSig(b, valB.type);
      if (sigA !== sigB) {
        changes.push(`events[${i}].values.${key}: type "${sigA}" -> "${sigB}"`);
      }
      if (!sameValueArray(valA.value, valB.value)) {
        changes.push(`events[${i}].values.${key}: default ${formatValue(valA.value)} -> ${formatValue(valB.value)}`);
      }
    }
  }
}

// Declaration-table diff between two graphs' variables/events, index by
// index: resolved type signature (not raw index — see note above), initial/
// default value (numeric-family tolerant), and id presence/equality for
// variables; id, value key set, and per-key resolved type + default for
// events. Never gates exit codes on its own — an advisory signal for an
// edit round-trip's change report (see the R3 plan's A5 apply report).
export function compareDeclarations(a: VGraph, b: VGraph): DeclarationsComparison {
  const changes: string[] = [];
  compareVariableDeclarations(a, b, changes);
  compareEventDeclarations(a, b, changes);
  return { same: changes.length === 0, changes };
}
