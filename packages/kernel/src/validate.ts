// KHR_interactivity load-time validation: the spec's "Validation" section
// (Extension Object / Graph Object / Variable / Event / Declaration / Node /
// Inline Value Object Validation) plus the socket-level rules from "JSON
// Syntax" it refers to (input-socket presence and type matching per operation,
// configuration validity, pointer templates, output-socket references).
//
// Environment-neutral and side-effect free: pure functions over plain JSON
// (`unknown` in, diagnostics out). It never mutates its input and imports no
// node/DOM APIs, so zero-dependency runtimes can run it at load time. It is the
// ONE implementation: @gltfi/verify, @gltfi/ir's importer, @gltfi/runtime and
// @gltfi/runtime-lib all delegate here.
//
// Terminology (spec "Validation Glossary"):
//   - "assert" failure  => the whole extension is rejected   (outcome "rejectExtension")
//   - "reject the graph" => that graph can't be used          (outcome "rejectGraph")
// A graph that is rejected while being the extension's selected default graph
// rejects the extension too (Extension Object Validation, step 3).
//
// Documented leniencies (the repo's corpus and older authoring tools):
//   - non-finite floats may be spelled as the strings "NaN"/"Infinity"/"-Infinity";
//   - event/onSelect|onHoverIn|onHoverOut declared WITHOUT their `extension`
//     property are accepted as the extension operation (warning, not error).
import { getOpSpec, resolveOverload } from "./registry-query.js";
import type { OpSpec, TypeSig } from "./registry.js";
import { isValidConfigValue, normalizeConfiguration, type RawConfiguration } from "./config.js";

export type ValidationOutcome = "rejectGraph" | "rejectExtension";

export type ValidationDiagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  // Originating graph node index, when the diagnostic is about a node.
  nodeIndex?: number;
  // Index into `graphs` (extension-level validation only).
  graphIndex?: number;
  // JSON-ish location, e.g. "nodes[3].values.a".
  path?: string;
  // Spec section the rule comes from, e.g. "Validation › Node Object Validation".
  section: string;
  // What the spec says to do on this failure (errors only).
  outcome?: ValidationOutcome;
};

export type GraphValidation = {
  // No error-severity diagnostics.
  ok: boolean;
  // At least one error is an "assert" failure: the whole extension is invalid.
  rejectsExtension: boolean;
  diagnostics: ValidationDiagnostic[];
};

export type ExtensionValidation = {
  // The extension is usable (not rejected). Implies the selected graph is ok.
  ok: boolean;
  // Index of the selected (default) graph, when it could be determined.
  selectedGraph?: number;
  // Per-graph results, same order as `graphs` (empty when `graphs` is unusable).
  graphs: GraphValidation[];
  // Indices of graphs that may run: [] when the extension is rejected.
  usableGraphs: number[];
  // All diagnostics (extension-level + every graph's, tagged with graphIndex).
  diagnostics: ValidationDiagnostic[];
};

const MAX_COUNT = 2147483648;

const S_EXT = "Validation › Extension Object Validation";
const S_GRAPH = "Validation › Graph Object Validation";
const S_VAR = "Validation › Variable Object Validation";
const S_EVENT = "Validation › Event Object Validation";
const S_DECL = "Validation › Declaration Object Validation";
const S_NODE = "Validation › Node Object Validation";
const S_INLINE = "Validation › Inline Value Object Validation";
const S_TYPES = "JSON Syntax › Types";
const S_EVENTS = "JSON Syntax › Events";
const S_DECLS = "JSON Syntax › Declarations";
const S_VALUES = "JSON Syntax › Nodes › Input Value Sockets";
const S_FLOWS = "JSON Syntax › Nodes › Output Flow Socket Pointers";
const S_CONFIG = "JSON Syntax › Nodes › Configuration";
const S_PTR = "Object Model Access › JSON Pointer Template Parsing";
const S_LOG = "Debug Operations › Log";

// The Validation section's list omits "ref", but it is a value type of the
// specification (variables/inline values/ops use it; the whole corpus
// declares it), so it is accepted.
const SIGNATURES: ReadonlySet<string> = new Set(["bool", "custom", "float", "float2", "float3", "float4", "float2x2", "float3x3", "float4x4", "int", "ref"]);
const VALUE_LENGTH: Record<string, number> = { bool: 1, float: 1, int: 1, ref: 1, float2: 2, float3: 3, float4: 4, float2x2: 4, float3x3: 9, float4x4: 16 };
const FLOAT_TYPES: ReadonlySet<string> = new Set(["float", "float2", "float3", "float4", "float2x2", "float3x3", "float4x4"]);
const NON_FINITE_STRINGS: ReadonlySet<string> = new Set(["NaN", "Infinity", "-Infinity"]);
const EXTENSION_EVENT_OPS: ReadonlySet<string> = new Set(["event/onSelect", "event/onHoverIn", "event/onHoverOut"]);
const HANDLER_OPS = new Set(["event/onStart", "event/onTick", "event/receive", "event/onSelect", "event/onHoverIn", "event/onHoverOut"]);

type Obj = Record<string, unknown>;

function isObj(x: unknown): x is Obj {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function has(o: Obj, key: string): boolean {
  // `undefined` is "absent": JSON cannot carry it, so an in-memory graph with
  // `{ name: undefined }` is the same document as one without `name`.
  return Object.prototype.hasOwnProperty.call(o, key) && o[key] !== undefined;
}
function isJsonIndex(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x >= 0 && x < MAX_COUNT;
}
function isInt32(x: unknown): x is number {
  return typeof x === "number" && x === (x | 0);
}
function isNonEmptyArray(x: unknown): x is unknown[] {
  return Array.isArray(x) && x.length > 0 && x.length <= MAX_COUNT;
}
function isNonEmptyObj(x: unknown): x is Obj {
  return isObj(x) && Object.keys(x).length > 0;
}

// This repository's runtimes carry runtime-object references ("event:<name>",
// "delay:<n>"; see pointer-path.ts) as ref-typed strings, and exportGraph
// writes them as inline ref values. They are accepted as a documented
// leniency; anything else must be a JSON Pointer.
function isRuntimeRef(s: unknown): boolean {
  return typeof s === "string" && /^(event|delay):/.test(s);
}

// RFC 6901 syntax: "" or "/"-prefixed with only ~0 / ~1 escapes.
export function isValidJsonPointer(s: unknown): s is string {
  if (typeof s !== "string") {
    return false;
  }
  if (s === "") {
    return true;
  }
  return s[0] === "/" && !/~(?![01])/.test(s);
}

export type PointerTemplateParse =
  | { valid: true; params: Array<{ id: string; kind: "int" | "ref" }> }
  | { valid: false; reason: string };

// Spec "JSON Pointer Template Parsing" (Object Model Access), step by step.
export function parsePointerTemplateStrict(pointer: string): PointerTemplateParse {
  if (!isValidJsonPointer(pointer)) {
    return { valid: false, reason: "not a syntactically valid JSON Pointer" };
  }
  const params: Array<{ id: string; kind: "int" | "ref" }> = [];
  const decode = (s: string) => s.replace(/~1/g, "/").replace(/~0/g, "~");
  for (const seg of pointer.split("/")) {
    if (seg === "[" || seg === "{") {
      return { valid: false, reason: `path segment "${seg}" is a lone bracket` };
    }
    const first = seg[0];
    if ((first === "[" || first === "{") && seg[1] !== first) {
      const close = first === "[" ? "]" : "}";
      const inner = seg.slice(1, -1);
      if (!seg.endsWith(close) || seg.length < 3 || /[[\]{}]/.test(inner)) {
        return { valid: false, reason: `malformed template parameter "${seg}"` };
      }
      const id = decode(inner);
      if (params.some((p) => p.id === id)) {
        return { valid: false, reason: `duplicate template parameter "${id}"` };
      }
      params.push({ id, kind: first === "[" ? "int" : "ref" });
      continue;
    }
    for (const ch of ["[", "]", "{", "}"]) {
      const runs = seg.match(new RegExp(`\\${ch}+`, "g")) ?? [];
      if (runs.some((r) => r.length % 2 === 1)) {
        return { valid: false, reason: `literal segment "${seg}" has an odd run of "${ch}"` };
      }
    }
  }
  return { valid: true, params };
}

// debug/log `message` template: returns the parameter ids, or null when the
// message is syntactically invalid (the spec's state machine).
export function parseLogMessage(message: string): string[] | null {
  const ids: string[] = [];
  let state = 0;
  let paramStart = -1;
  const cps = Array.from(message);
  for (let i = 0; i < cps.length; i += 1) {
    const c = cps[i];
    if (c === "{") {
      if (state === 0) state = 1;
      else if (state === 1) state = 0;
      else return null;
    } else if (c === "}") {
      if (state === 0) state = 3;
      else if (state === 3) state = 0;
      else if (state === 2) {
        ids.push(cps.slice(paramStart + 1, i).join(""));
        state = 0;
      } else return null;
    } else if (state === 1) {
      paramStart = i - 1;
      state = 2;
    } else if (state === 3) {
      return null;
    }
  }
  return state === 0 ? ids : null;
}

// ---------------------------------------------------------------------------

class Collector {
  readonly list: ValidationDiagnostic[] = [];
  constructor(private readonly graphIndex?: number) {}
  fail(outcome: ValidationOutcome, code: string, section: string, message: string, path?: string, nodeIndex?: number) {
    const d: ValidationDiagnostic = { severity: "error", code, message, section, outcome };
    if (path !== undefined) d.path = path;
    if (nodeIndex !== undefined) d.nodeIndex = nodeIndex;
    if (this.graphIndex !== undefined) d.graphIndex = this.graphIndex;
    this.list.push(d);
  }
  warn(code: string, section: string, message: string, path?: string, nodeIndex?: number) {
    const d: ValidationDiagnostic = { severity: "warning", code, message, section };
    if (path !== undefined) d.path = path;
    if (nodeIndex !== undefined) d.nodeIndex = nodeIndex;
    if (this.graphIndex !== undefined) d.graphIndex = this.graphIndex;
    this.list.push(d);
  }
  /** "assert" failure: rejects the whole extension. */
  assert(code: string, section: string, message: string, path?: string, nodeIndex?: number) {
    this.fail("rejectExtension", code, section, message, path, nodeIndex);
  }
  /** "reject the graph". */
  reject(code: string, section: string, message: string, path?: string, nodeIndex?: number) {
    this.fail("rejectGraph", code, section, message, path, nodeIndex);
  }
}

// Validates an inline value array against a type signature. Returns an error
// string, or null when valid. `custom` values are defined by other extensions.
function inlineValueError(sig: string | undefined, value: unknown[]): string | null {
  if (sig === undefined || sig === "custom") {
    return null;
  }
  const len = VALUE_LENGTH[sig];
  if (len !== undefined && value.length !== len) {
    return `"${sig}" value needs ${len} element(s), got ${value.length}`;
  }
  if (sig === "bool") {
    return typeof value[0] === "boolean" ? null : `"bool" value must be a JSON boolean`;
  }
  if (sig === "int") {
    return isInt32(value[0]) ? null : `"int" value must be a number exactly representable as a 32-bit signed integer`;
  }
  if (sig === "ref") {
    return isValidJsonPointer(value[0]) || isRuntimeRef(value[0]) ? null : `"ref" value must be a syntactically valid JSON Pointer string`;
  }
  if (FLOAT_TYPES.has(sig)) {
    const bad = value.findIndex((v) => !(typeof v === "number" || (typeof v === "string" && NON_FINITE_STRINGS.has(v))));
    return bad < 0 ? null : `"${sig}" value element ${bad} must be a JSON number`;
  }
  return null;
}

type SockTypes = Record<string, TypeSig | undefined>;

type NodeOutcome = {
  // Output socket id -> type (undefined type = exists, type unknown). null =
  // outputs unknown (invalid node): skip checks that depend on them.
  outputs: SockTypes | null;
};

/**
 * Validates one graph object (spec "Graph Object Validation" and everything
 * beneath it). `graphIndex` only tags the diagnostics.
 */
export function validateGraphObject(graph: unknown, graphIndex?: number): GraphValidation {
  const c = new Collector(graphIndex);
  validateGraphInto(graph, c);
  const errors = c.list.filter((d) => d.severity === "error");
  return {
    ok: errors.length === 0,
    rejectsExtension: errors.some((d) => d.outcome === "rejectExtension"),
    diagnostics: c.list
  };
}

function validateGraphInto(graph: unknown, c: Collector): void {
  if (!isObj(graph)) {
    c.assert("GV100", S_GRAPH, "graph is not a JSON object");
    return;
  }

  // --- types ---------------------------------------------------------------
  let sigs: Array<string | undefined> | undefined;
  if (has(graph, "types")) {
    const types = graph.types;
    if (!isNonEmptyArray(types)) {
      c.assert("GV101", S_GRAPH, "`types` must be a non-empty JSON array", "types");
    } else {
      sigs = [];
      const seen = new Map<string, number>();
      types.forEach((t, i) => {
        if (!isObj(t)) {
          c.assert("GV102", S_GRAPH, `types[${i}] is not a JSON object`, `types[${i}]`);
          sigs!.push(undefined);
          return;
        }
        if (typeof t.signature !== "string") {
          c.assert("GV103", S_GRAPH, `types[${i}] has no string \`signature\``, `types[${i}].signature`);
          sigs!.push(undefined);
          return;
        }
        const sig = t.signature;
        if (!SIGNATURES.has(sig)) {
          c.reject("GV104", S_TYPES, `types[${i}] has unknown signature "${sig}" (case-sensitive)`, `types[${i}].signature`);
          sigs!.push(undefined);
          return;
        }
        sigs!.push(sig);
        if (sig !== "custom") {
          const prior = seen.get(sig);
          if (prior !== undefined) {
            c.reject("GV105", S_TYPES, `types[${i}] duplicates types[${prior}]'s signature "${sig}"`, `types[${i}].signature`);
          } else {
            seen.set(sig, i);
          }
        }
      });
    }
  }
  const typeCount = sigs?.length ?? 0;
  const sigAt = (i: number): string | undefined => sigs?.[i];

  // --- variables -------------------------------------------------------------
  const varSigs: Array<string | undefined> = [];
  if (has(graph, "variables")) {
    const variables = graph.variables;
    if (!has(graph, "types")) {
      c.assert("GV106", S_GRAPH, "`variables` defined but the graph has no `types` array", "variables");
    }
    if (!isNonEmptyArray(variables)) {
      c.assert("GV107", S_GRAPH, "`variables` must be a non-empty JSON array", "variables");
    } else {
      variables.forEach((v, i) => {
        const p = `variables[${i}]`;
        if (!isObj(v)) {
          c.assert("GV108", S_VAR, `${p} is not a JSON object`, p);
          varSigs.push(undefined);
          return;
        }
        if (!isJsonIndex(v.type)) {
          c.assert("GV109", S_VAR, `${p} \`type\` is missing or not a JSON index`, `${p}.type`);
          varSigs.push(undefined);
          return;
        }
        if (v.type >= typeCount) {
          c.reject("GV010", S_VAR, `variable ${i} has out-of-range type index ${v.type}`, `${p}.type`);
          varSigs.push(undefined);
          return;
        }
        const sig = sigAt(v.type);
        varSigs.push(sig);
        if (has(v, "value")) {
          if (!isNonEmptyArray(v.value)) {
            c.assert("GV110", S_VAR, `${p} \`value\` must be a non-empty JSON array`, `${p}.value`);
          } else {
            const err = inlineValueError(sig, v.value);
            if (err) c.reject("GV111", S_INLINE, `${p}: ${err}`, `${p}.value`);
          }
        }
        if (has(v, "name") && typeof v.name !== "string") {
          c.assert("GV112", S_VAR, `${p} \`name\` is not a string`, `${p}.name`);
        }
      });
    }
  }

  // --- events ----------------------------------------------------------------
  const eventValueSigs: Array<Record<string, string | undefined>> = [];
  if (has(graph, "events")) {
    const events = graph.events;
    if (!isNonEmptyArray(events)) {
      c.assert("GV113", S_GRAPH, "`events` must be a non-empty JSON array", "events");
    } else {
      const ids = new Map<string, number>();
      events.forEach((e, i) => {
        const p = `events[${i}]`;
        const sockets: Record<string, string | undefined> = {};
        eventValueSigs.push(sockets);
        if (!isObj(e)) {
          c.assert("GV114", S_EVENT, `${p} is not a JSON object`, p);
          return;
        }
        if (has(e, "id")) {
          if (typeof e.id !== "string") {
            c.assert("GV115", S_EVENT, `${p} \`id\` is not a string`, `${p}.id`);
          } else {
            const prior = ids.get(e.id);
            if (prior !== undefined) {
              c.reject("GV116", S_EVENTS, `${p} duplicates events[${prior}]'s id "${e.id}"`, `${p}.id`);
            } else {
              ids.set(e.id, i);
            }
          }
        }
        if (has(e, "values")) {
          if (!isNonEmptyObj(e.values)) {
            c.assert("GV117", S_EVENT, `${p} \`values\` must be a non-empty JSON object`, `${p}.values`);
          } else {
            for (const [key, val] of Object.entries(e.values)) {
              const vp = `${p}.values.${key}`;
              if (key === "event") {
                c.assert("GV118", S_EVENT, `${p} value socket id "event" is reserved`, vp);
              }
              if (!isObj(val)) {
                c.assert("GV119", S_EVENT, `${vp} is not a JSON object`, vp);
                continue;
              }
              if (!isJsonIndex(val.type)) {
                c.assert("GV120", S_EVENT, `${vp} \`type\` is missing or not a JSON index`, `${vp}.type`);
                continue;
              }
              if (val.type >= typeCount) {
                c.reject("GV011", S_EVENT, `event ${i} value "${key}" has out-of-range type index ${val.type}`, `${vp}.type`);
                continue;
              }
              const sig = sigAt(val.type);
              sockets[key] = sig;
              if (has(val, "value")) {
                if (!isNonEmptyArray(val.value)) {
                  c.assert("GV121", S_EVENT, `${vp} \`value\` must be a non-empty JSON array`, `${vp}.value`);
                } else {
                  const err = inlineValueError(sig, val.value);
                  if (err) c.reject("GV122", S_INLINE, `${vp}: ${err}`, `${vp}.value`);
                }
              }
            }
          }
        }
        if (has(e, "name") && typeof e.name !== "string") {
          c.assert("GV123", S_EVENT, `${p} \`name\` is not a string`, `${p}.name`);
        }
      });
    }
  }

  // --- declarations ----------------------------------------------------------
  type DeclInfo = {
    op?: string;
    extension?: string;
    inputs?: Record<string, string | undefined>;
    outputs?: Record<string, string | undefined>;
  };
  const decls: DeclInfo[] = [];
  if (has(graph, "declarations")) {
    const declarations = graph.declarations;
    if (!isNonEmptyArray(declarations)) {
      c.assert("GV124", S_GRAPH, "`declarations` must be a non-empty JSON array", "declarations");
    } else {
      const declKey: string[] = [];
      declarations.forEach((d, i) => {
        const p = `declarations[${i}]`;
        const info: DeclInfo = {};
        decls.push(info);
        declKey.push("");
        if (!isObj(d)) {
          c.assert("GV125", S_DECL, `${p} is not a JSON object`, p);
          return;
        }
        if (typeof d.op !== "string") {
          c.assert("GV001", S_DECL, `declaration ${i} has no string \`op\``, `${p}.op`);
          return;
        }
        // A runtime-normalized graph (see normalizeGraph in @gltfi/runtime) blanks the
        // op of an unsupported declaration and keeps the original in `unsupportedOp`.
        const opName: string = d.op === "" && typeof d.unsupportedOp === "string" ? d.unsupportedOp : d.op;
        info.op = opName;
        const hasExt = has(d, "extension");
        if (!hasExt) {
          const spec = getOpSpec(opName);
          if (!spec) {
            c.reject("GV126", S_DECLS, `declaration ${i}: "${opName}" is not an operation defined by the specification and has no \`extension\``, `${p}.op`);
          } else if (spec.extension !== undefined) {
            c.warn("GV127", S_DECLS, `declaration ${i}: "${opName}" belongs to ${spec.extension} but is declared without \`extension\``, `${p}`);
          }
          if (has(d, "inputValueSockets") || has(d, "outputValueSockets")) {
            c.reject("GV128", S_DECLS, `declaration ${i}: a specification operation must not define inputValueSockets/outputValueSockets`, p);
          }
        } else {
          if (typeof d.extension !== "string") {
            c.assert("GV129", S_DECL, `declaration ${i} \`extension\` is not a string`, `${p}.extension`);
          } else {
            info.extension = d.extension;
          }
          for (const which of ["inputValueSockets", "outputValueSockets"] as const) {
            if (!has(d, which)) continue;
            const socks = d[which];
            if (!isNonEmptyObj(socks)) {
              c.assert("GV130", S_DECL, `${p}.${which} must be a non-empty JSON object`, `${p}.${which}`);
              continue;
            }
            if (!has(graph, "types")) {
              c.assert("GV131", S_DECL, `${p}.${which} defined but the graph has no \`types\` array`, `${p}.${which}`);
            }
            const out: Record<string, string | undefined> = {};
            for (const [sid, sd] of Object.entries(socks)) {
              const sp = `${p}.${which}.${sid}`;
              if (!isObj(sd)) {
                c.assert("GV132", S_DECL, `${sp} is not a JSON object`, sp);
                continue;
              }
              if (!isJsonIndex(sd.type)) {
                c.assert("GV133", S_DECL, `${sp} \`type\` is missing or not a JSON index`, `${sp}.type`);
                continue;
              }
              if (sd.type >= typeCount) {
                c.reject("GV134", S_DECL, `${sp} has out-of-range type index ${sd.type}`, `${sp}.type`);
                continue;
              }
              out[sid] = sigAt(sd.type);
            }
            if (which === "inputValueSockets") info.inputs = out;
            else info.outputs = out;
          }
        }
        // Declaration equality: op + extension + input socket ids/types.
        const inputs = info.inputs ? Object.entries(info.inputs).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) : [];
        declKey[i] = JSON.stringify([opName, info.extension ?? null, inputs]);
      });
      const firstByKey = new Map<string, number>();
      const reported = new Set<number>();
      declKey.forEach((k, i) => {
        if (k === "" || !isObj(declarations[i]) || typeof (declarations[i] as Obj).op !== "string") return;
        const prior = firstByKey.get(k);
        if (prior === undefined) {
          firstByKey.set(k, i);
          return;
        }
        for (const idx of [prior, i]) {
          if (!reported.has(idx)) {
            reported.add(idx);
            c.reject(
              "GV002",
              S_DECLS,
              `declaration ${idx} is equal to declaration ${idx === prior ? i : prior} (same op "${decls[idx].op ?? ""}", extension and input sockets)`,
              `declarations[${idx}]`
            );
          }
        }
      });
    }
  }

  // --- nodes -----------------------------------------------------------------
  if (has(graph, "nodes")) {
    const nodes = graph.nodes;
    if (!has(graph, "declarations")) {
      c.assert("GV135", S_GRAPH, "`nodes` defined but the graph has no `declarations` array", "nodes");
    }
    if (!isNonEmptyArray(nodes)) {
      c.assert("GV136", S_GRAPH, "`nodes` must be a non-empty JSON array", "nodes");
    } else {
      const results: NodeOutcome[] = [];
      nodes.forEach((n, i) => {
        results.push(validateNode(n, i, nodes.length));
      });

      function validateNode(n: unknown, ni: number, nodeCount: number): NodeOutcome {
        const p = `nodes[${ni}]`;
        const bad: NodeOutcome = { outputs: null };
        if (!isObj(n)) {
          c.assert("GV137", S_NODE, `${p} is not a JSON object`, p, ni);
          return bad;
        }
        let declOk = true;
        let declIdx = -1;
        if (!isJsonIndex(n.declaration)) {
          c.assert("GV138", S_NODE, `node ${ni} \`declaration\` is missing or not a JSON index`, `${p}.declaration`, ni);
          declOk = false;
        } else if (n.declaration >= decls.length) {
          c.reject("GV020", S_NODE, `node ${ni} has out-of-range declaration index ${n.declaration}`, `${p}.declaration`, ni);
          declOk = false;
        } else {
          declIdx = n.declaration;
        }
        const decl = declOk ? decls[declIdx] : undefined;

        // configuration (shape)
        let cfg: RawConfiguration | undefined;
        let cfgShapeOk = true;
        if (has(n, "configuration")) {
          if (!isNonEmptyObj(n.configuration)) {
            c.assert("GV139", S_NODE, `node ${ni} \`configuration\` must be a non-empty JSON object`, `${p}.configuration`, ni);
            cfgShapeOk = false;
          } else {
            for (const [k, ce] of Object.entries(n.configuration)) {
              if (!isObj(ce)) {
                c.assert("GV028", S_NODE, `node ${ni} configuration "${k}" is not a JSON object`, `${p}.configuration.${k}`, ni);
                cfgShapeOk = false;
              } else if (!isNonEmptyArray(ce.value)) {
                c.assert("GV140", S_NODE, `node ${ni} configuration "${k}" needs a non-empty \`value\` array`, `${p}.configuration.${k}`, ni);
                cfgShapeOk = false;
              }
            }
            if (cfgShapeOk) cfg = n.configuration as RawConfiguration;
          }
        }

        // values (shape + per-socket source checks). Types are resolved after
        // we know referenced nodes' outputs.
        const given: SockTypes = {};
        const givenKnown: Record<string, boolean> = {};
        // Where each given socket's value comes from (diagnostics only).
        const givenSrc: Record<string, "inline" | "connected"> = {};
        let valuesShapeOk = true;
        if (has(n, "values")) {
          if (!isNonEmptyObj(n.values)) {
            c.assert("GV141", S_NODE, `node ${ni} \`values\` must be a non-empty JSON object`, `${p}.values`, ni);
            valuesShapeOk = false;
          } else {
            for (const [sock, v] of Object.entries(n.values)) {
              const vp = `${p}.values.${sock}`;
              // Present but (so far) of unknown type: a rejected entry must not cascade into "missing socket" errors.
              given[sock] = undefined;
              givenKnown[sock] = true;
              if (!isObj(v)) {
                c.assert("GV142", S_NODE, `node ${ni} value "${sock}" is not a JSON object`, vp, ni);
                valuesShapeOk = false;
                continue;
              }
              if (has(v, "node")) {
                if (has(v, "value")) {
                  c.assert("GV143", S_NODE, `node ${ni} value "${sock}" defines both \`node\` and \`value\``, vp, ni);
                  valuesShapeOk = false;
                  continue;
                }
                if (!isJsonIndex(v.node)) {
                  c.assert("GV144", S_NODE, `node ${ni} value "${sock}" \`node\` is not a JSON index`, `${vp}.node`, ni);
                  valuesShapeOk = false;
                  continue;
                }
                if (v.node >= ni) {
                  if (v.node >= nodeCount) {
                    c.reject("GV021", S_VALUES, `node ${ni} value "${sock}" references out-of-range node ${v.node}`, `${vp}.node`, ni);
                  } else {
                    c.reject("GV022", S_VALUES, `node ${ni} value "${sock}" references node ${v.node}, which is not strictly before it (value edges must be backward-only)`, `${vp}.node`, ni);
                  }
                  continue;
                }
                let socket = "value";
                if (has(v, "socket")) {
                  if (typeof v.socket !== "string") {
                    c.assert("GV145", S_NODE, `node ${ni} value "${sock}" \`socket\` is not a string`, `${vp}.socket`, ni);
                    valuesShapeOk = false;
                    continue;
                  }
                  socket = v.socket;
                }
                let explicit: string | undefined;
                let explicitOk = true;
                if (has(v, "type")) {
                  if (!isJsonIndex(v.type)) {
                    c.assert("GV146", S_NODE, `node ${ni} value "${sock}" \`type\` is not a JSON index`, `${vp}.type`, ni);
                    valuesShapeOk = false;
                    explicitOk = false;
                  } else if (v.type >= typeCount) {
                    c.reject("GV147", S_NODE, `node ${ni} value "${sock}" has out-of-range type index ${v.type}`, `${vp}.type`, ni);
                    explicitOk = false;
                  } else {
                    explicit = sigAt(v.type);
                  }
                }
                const src = results[v.node];
                let srcType: string | undefined;
                if (src.outputs !== null) {
                  if (!has(src.outputs, socket)) {
                    c.reject("GV148", S_VALUES, `node ${ni} value "${sock}" references output socket "${socket}" that node ${v.node} does not have`, `${vp}.socket`, ni);
                    continue;
                  }
                  srcType = src.outputs[socket];
                }
                if (explicitOk && explicit !== undefined && srcType !== undefined && explicit !== srcType) {
                  c.reject("GV149", S_VALUES, `node ${ni} value "${sock}" declares type "${explicit}" but node ${v.node} socket "${socket}" is "${srcType}"`, `${vp}.type`, ni);
                  continue;
                }
                given[sock] = (srcType ?? explicit) as TypeSig | undefined;
                givenKnown[sock] = true;
                givenSrc[sock] = "connected";
              } else {
                if (!isJsonIndex(v.type)) {
                  c.assert("GV150", S_NODE, `node ${ni} value "${sock}" \`type\` is missing or not a JSON index`, `${vp}.type`, ni);
                  valuesShapeOk = false;
                  continue;
                }
                if (v.type >= typeCount) {
                  c.reject("GV023", S_NODE, `node ${ni} value "${sock}" literal has out-of-range type index ${v.type}`, `${vp}.type`, ni);
                  continue;
                }
                const sig = sigAt(v.type);
                if (has(v, "value")) {
                  if (!isNonEmptyArray(v.value)) {
                    if (Array.isArray(v.value)) {
                      c.assert("GV151", S_NODE, `node ${ni} value "${sock}" \`value\` must be a non-empty JSON array`, `${vp}.value`, ni);
                    } else {
                      c.assert("GV024", S_NODE, `node ${ni} value "${sock}" literal's value is not an array`, `${vp}.value`, ni);
                    }
                    valuesShapeOk = false;
                    continue;
                  }
                  const err = inlineValueError(sig, v.value);
                  if (err) {
                    c.reject("GV152", S_INLINE, `node ${ni} value "${sock}": ${err}`, `${vp}.value`, ni);
                    continue;
                  }
                }
                given[sock] = sig as TypeSig | undefined;
                givenKnown[sock] = true;
                givenSrc[sock] = "inline";
              }
            }
          }
        }
        void valuesShapeOk;

        // flows
        if (has(n, "flows")) {
          if (!isNonEmptyObj(n.flows)) {
            c.assert("GV153", S_NODE, `node ${ni} \`flows\` must be a non-empty JSON object`, `${p}.flows`, ni);
          } else {
            for (const [fs, f] of Object.entries(n.flows)) {
              const fp = `${p}.flows.${fs}`;
              if (!isObj(f)) {
                c.assert("GV154", S_NODE, `node ${ni} flow "${fs}" is not a JSON object`, fp, ni);
                continue;
              }
              if (!isJsonIndex(f.node)) {
                c.assert("GV155", S_NODE, `node ${ni} flow "${fs}" \`node\` is missing or not a JSON index`, `${fp}.node`, ni);
                continue;
              }
              if (f.node >= nodeCount) {
                c.reject("GV025", S_FLOWS, `node ${ni} flow "${fs}" references out-of-range node ${f.node}`, `${fp}.node`, ni);
              } else if (f.node <= ni) {
                c.reject("GV156", S_FLOWS, `node ${ni} flow "${fs}" targets node ${f.node}, which is not after it (flows must point forward)`, `${fp}.node`, ni);
              }
              if (has(f, "socket") && typeof f.socket !== "string") {
                c.assert("GV026", S_NODE, `node ${ni} flow "${fs}" \`socket\` is not a string`, `${fp}.socket`, ni);
              }
            }
          }
        }

        if (!declOk || decl === undefined || decl.op === undefined) {
          return bad;
        }
        if (!cfgShapeOk) {
          return bad;
        }
        const op = decl.op;
        const spec = getOpSpec(op);
        const nodeErr = (code: string, section: string, msg: string, path?: string) =>
          c.reject(code, section, `node ${ni} ("${op}"): ${msg}`, path ?? p, ni);

        if (HANDLER_OPS.has(op) && Object.keys(isObj(n.values) ? n.values : {}).length > 0) {
          c.warn("GV030", S_VALUES, `node ${ni} ("${op}") is a handler root and should have no value inputs`, `${p}.values`, ni);
        }

        // --- required sockets ---------------------------------------------
        // `required`: socket id -> required concrete type, or "any".
        let required: Record<string, TypeSig | "any"> | null = {};
        // pointer/* template parameter id -> its template kind (GV165 hints only).
        const ptrParamKind: Record<string, "int" | "ref"> = {};
        let outputs: SockTypes | null = null;
        let ok = true;

        const useDecl = decl.extension !== undefined;
        if (useDecl || !spec) {
          // Extension operation: sockets come from the declaration.
          for (const [sid, sig] of Object.entries(decl.inputs ?? {})) {
            required[sid] = (sig as TypeSig | undefined) ?? "any";
          }
          outputs = {};
          for (const [sid, sig] of Object.entries(decl.outputs ?? {})) {
            outputs[sid] = sig as TypeSig | undefined;
          }
          if (!spec) {
            // Not a registry op (and, if no `extension`, already rejected in
            // the declaration): nothing more to know.
          } else {
            // Known extension op under a matching extension: configuration
            // keeps its default-fallback semantics (no rejection).
          }
        } else if (spec) {
          const res = coreSockets(spec);
          required = res.required;
          outputs = res.outputs;
          ok = res.ok;
        }

        // Configuration for core ops with REQUIRED fields (no default config).
        function coreSockets(s: OpSpec): { required: Record<string, TypeSig | "any"> | null; outputs: SockTypes | null; ok: boolean } {
          const req: Record<string, TypeSig | "any"> = {};
          let outs: SockTypes | null = null;
          let good = true;
          const cfgValue = (name: string): unknown[] | undefined => cfg?.[name]?.value as unknown[] | undefined;
          const need = (field: string): unknown[] | null => {
            const def = s.config?.find((f) => f.name === field);
            const raw = cfg?.[field]?.value;
            if (!def || raw === undefined || !isValidConfigValue(def, raw)) {
              nodeErr("GV027", S_CONFIG, `missing or invalid required configuration "${field}"`, `${p}.configuration.${field}`);
              good = false;
              return null;
            }
            return raw as unknown[];
          };
          const typeFromIndex = (field: string): string | null | undefined => {
            const v = need(field);
            if (!v) return undefined;
            const idx = v[0] as number;
            if (idx < 0 || idx >= typeCount) {
              nodeErr("GV157", S_CONFIG, `configuration "${field}" type index ${idx} is out of range`, `${p}.configuration.${field}`);
              good = false;
              return undefined;
            }
            return sigAt(idx) ?? null;
          };

          switch (op) {
            case "variable/get": {
              const v = need("variable");
              if (!v) break;
              const vi = v[0] as number;
              if (vi < 0 || vi >= varSigs.length) {
                nodeErr("GV158", S_CONFIG, `variable index ${vi} is out of range (${varSigs.length} variables)`, `${p}.configuration.variable`);
                good = false;
                break;
              }
              outs = { value: varSigs[vi] as TypeSig | undefined };
              return { required: req, outputs: outs, ok: good };
            }
            case "variable/set": {
              const v = need("variables");
              if (!v || v.length === 0) {
                if (v) {
                  nodeErr("GV027", S_CONFIG, `configuration "variables" must name at least one variable`, `${p}.configuration.variables`);
                }
                good = false;
                break;
              }
              for (const raw of v) {
                const vi = raw as number;
                if (vi < 0 || vi >= varSigs.length) {
                  nodeErr("GV158", S_CONFIG, `variable index ${vi} is out of range (${varSigs.length} variables)`, `${p}.configuration.variables`);
                  good = false;
                  continue;
                }
                req[String(vi)] = (varSigs[vi] as TypeSig | undefined) ?? "any";
              }
              return { required: req, outputs: {}, ok: good };
            }
            case "variable/interpolate": {
              const v = need("variable");
              const sl = need("useSlerp");
              if (!v || !sl) break;
              const vi = v[0] as number;
              if (vi < 0 || vi >= varSigs.length) {
                nodeErr("GV158", S_CONFIG, `variable index ${vi} is out of range (${varSigs.length} variables)`, `${p}.configuration.variable`);
                good = false;
                break;
              }
              const vs = varSigs[vi];
              if (vs !== undefined && !FLOAT_TYPES.has(vs)) {
                nodeErr("GV159", S_CONFIG, `variable ${vi} has type "${vs}", which cannot be interpolated`, `${p}.configuration.variable`);
                good = false;
              }
              if (sl[0] === true && vs !== undefined && vs !== "float4") {
                nodeErr("GV160", S_CONFIG, `useSlerp requires a float4 variable, variable ${vi} is "${vs}"`, `${p}.configuration.useSlerp`);
                good = false;
              }
              req.value = (vs as TypeSig | undefined) ?? "any";
              req.duration = "float";
              req.p1 = "float2";
              req.p2 = "float2";
              return { required: req, outputs: {}, ok: good };
            }
            case "pointer/get":
            case "pointer/set":
            case "pointer/interpolate": {
              const ptr = need("pointer");
              const ts = typeFromIndex("type");
              if (!ptr || ts === undefined) {
                break;
              }
              const parsed = parsePointerTemplateStrict(ptr[0] as string);
              if (!parsed.valid) {
                nodeErr("GV161", S_PTR, `invalid pointer template "${ptr[0]}": ${parsed.reason}`, `${p}.configuration.pointer`);
                good = false;
                break;
              }
              const reserved = op === "pointer/set" ? ["value"] : op === "pointer/interpolate" ? ["value", "duration", "p1", "p2"] : [];
              for (const prm of parsed.params) {
                if (reserved.includes(prm.id)) {
                  nodeErr("GV162", S_PTR, `template parameter "${prm.id}" collides with the operation's own input socket`, `${p}.configuration.pointer`);
                  good = false;
                }
                req[prm.id] = prm.kind === "int" ? "int" : "ref";
                ptrParamKind[prm.id] = prm.kind === "int" ? "int" : "ref";
              }
              const T = (ts ?? undefined) as TypeSig | undefined;
              if (op === "pointer/interpolate") {
                if (ts && !FLOAT_TYPES.has(ts)) {
                  nodeErr("GV159", S_CONFIG, `type "${ts}" cannot be interpolated`, `${p}.configuration.type`);
                  good = false;
                }
                req.value = T ?? "any";
                req.duration = "float";
                req.p1 = "float2";
                req.p2 = "float2";
                return { required: req, outputs: {}, ok: good };
              }
              if (op === "pointer/set") {
                req.value = T ?? "any";
                return { required: req, outputs: {}, ok: good };
              }
              return { required: req, outputs: { value: T, isValid: "bool" }, ok: good };
            }
            case "event/send":
            case "event/receive": {
              const v = need("event");
              if (!v) break;
              const ei = v[0] as number;
              if (ei < 0 || ei >= eventValueSigs.length) {
                nodeErr("GV163", S_CONFIG, `event index ${ei} is out of range (${eventValueSigs.length} events)`, `${p}.configuration.event`);
                good = false;
                break;
              }
              const socks = eventValueSigs[ei];
              if (op === "event/send") {
                for (const [k, sg] of Object.entries(socks)) {
                  req[k] = (sg as TypeSig | undefined) ?? "any";
                }
                return { required: req, outputs: {}, ok: good };
              }
              const o: SockTypes = {};
              for (const ov of s.overloads[0].outputs) {
                o[ov.name] = ov.type as TypeSig;
              }
              for (const [k, sg] of Object.entries(socks)) {
                o[k] = sg as TypeSig | undefined;
              }
              return { required: req, outputs: o, ok: good };
            }
            case "math/switch":
            case "flow/switch": {
              // Invalid `cases` => default configuration (no cases).
              const norm = normalizeConfiguration(op, cfg);
              const cases = ((norm?.cases?.value as unknown[] | undefined) ?? (s.config?.[0].default as unknown[])) as number[];
              req.selection = "int";
              if (op === "flow/switch") {
                return { required: req, outputs: {}, ok: good };
              }
              // math/switch: default + one input per case, all of one type T.
              const ids = ["default", ...[...new Set(cases)].map((x) => String(x))];
              for (const id of ids) req[id] = "any";
              return { required: req, outputs: null, ok: good };
            }
            case "debug/log": {
              const msg = cfgValue("message");
              if (msg && typeof msg[0] === "string" && msg.length === 1) {
                const ids = parseLogMessage(msg[0]);
                if (ids) {
                  for (const id of ids) req[id] = "any";
                }
              }
              return { required: req, outputs: {}, ok: good };
            }
            default:
              break;
          }
          if (!good) {
            return { required: null, outputs: null, ok: false };
          }
          return { required: null, outputs: null, ok: true };
        }

        // Special-cased: math/switch (generic T across default + case inputs).
        if (ok && spec && !useDecl && op === "math/switch" && required) {
          const sel = given.selection;
          if (!has(isObj(n.values) ? n.values : {}, "selection")) {
            nodeErr("GV164", S_VALUES, `missing required input value socket "selection"`);
            return bad;
          }
          if (sel !== undefined && sel !== "int") {
            nodeErr("GV165", S_VALUES, `input "selection" has type "${sel}", expected "int"`);
            return bad;
          }
          let T: TypeSig | undefined;
          let good = true;
          for (const id of Object.keys(required)) {
            if (id === "selection") continue;
            if (!(id in given)) {
              nodeErr("GV164", S_VALUES, `missing required input value socket "${id}"`);
              good = false;
              continue;
            }
            const t = given[id];
            if (t === undefined) continue;
            if (T === undefined) T = t;
            else if (T !== t) {
              nodeErr("GV165", S_VALUES, `input "${id}" has type "${t}" but the other cases use "${T}"`);
              good = false;
            }
          }
          return good ? { outputs: { value: T } } : bad;
        }

        if (!ok) {
          return bad;
        }

        // Generic overloaded core ops (no explicit socket requirements built above).
        if (required === null && spec && !useDecl) {
          const rows = spec.overloads;
          const names = new Set<string>();
          for (const r of rows) for (const i of r.inputs) names.add(i.name);
          const rowFull = rows.find((r) => r.inputs.every((i) => (i.name in given)));
          if (!rowFull) {
            const first = rows[0];
            const missing = first.inputs.filter((i) => !(i.name in given)).map((i) => i.name);
            nodeErr("GV164", S_VALUES, `missing required input value socket(s): ${missing.join(", ")}`);
            return bad;
          }
          const probe: Record<string, TypeSig> = {};
          let unknown = false;
          for (const i of rowFull.inputs) {
            const t = given[i.name];
            if (t === undefined) unknown = true;
            else probe[i.name] = t;
          }
          if (unknown) {
            const o: SockTypes = {};
            for (const ov of rowFull.outputs) {
              o[ov.name] = ["F", "V", "M", "T"].includes(ov.type) ? undefined : (ov.type as TypeSig);
            }
            return { outputs: o };
          }
          // Spec: math/mix's `c` is "floatN c or floatNxN c", i.e. the SAME type
          // as a and b (the registry models it as a scalar float for the IR's
          // benefit), so validate it as a plain F,F,F -> F overload.
          if (op === "math/mix") {
            const t = probe.a;
            if (!FLOAT_TYPES.has(t) || probe.b !== t || probe.c !== t) {
              nodeErr("GV165", S_VALUES, `input value socket types (a: ${probe.a}, b: ${probe.b}, c: ${probe.c}) must all be the same float type`);
              return bad;
            }
            return { outputs: { value: t } };
          }
          const resolved = resolveOverload(op, probe);
          if (!resolved || !rowFull.inputs.every((i) => resolved.inputs[i.name] !== undefined)) {
            nodeErr("GV165", S_VALUES, `input value socket types (${rowFull.inputs.map((i) => `${i.name}: ${probe[i.name]}`).join(", ")}) match no overload`);
            return bad;
          }
          return { outputs: { ...resolved.outputs } };
        }

        // Explicit requirements (config-derived or declaration-derived).
        if (required) {
          let good = true;
          for (const [sid, want] of Object.entries(required)) {
            if (!(sid in given)) {
              nodeErr("GV164", S_VALUES, `missing required input value socket "${sid}"`);
              good = false;
              continue;
            }
            const got = given[sid];
            if (want !== "any" && got !== undefined && got !== want) {
              const tk = ptrParamKind[sid];
              if (tk === undefined) {
                nodeErr("GV165", S_VALUES, `input "${sid}" has type "${got}", expected "${want}"`);
              } else {
                const tmpl = tk === "int" ? `[${sid}]` : `{${sid}}`;
                if ((got === "int" || got === "ref") && (want === "int" || want === "ref")) {
                  const fix = got === "int" ? `int template parameters are written [${sid}]` : `ref template parameters are written {${sid}}`;
                  nodeErr("GV165", S_VALUES, `input "${sid}" is ${want} (${tmpl} in the pointer template) but its ${givenSrc[sid] ?? "inline"} value is ${got}; ${fix}`);
                } else {
                  nodeErr("GV165", S_VALUES, `input "${sid}" has type "${got}", expected "${want}" (${tmpl} in the pointer template)`);
                }
              }
              good = false;
            }
          }
          if (!good) {
            return bad;
          }
        }
        return { outputs: outputs ?? {} };
      }
    }
  }

  // --- name ------------------------------------------------------------------
  if (has(graph, "name") && typeof graph.name !== "string") {
    c.assert("GV166", S_GRAPH, "graph `name` is not a string", "name");
  }
}

/**
 * Validates the whole `KHR_interactivity` extension object (spec "Extension
 * Object Validation"), every graph in it, and the default-graph selection.
 */
export function validateExtension(ext: unknown): ExtensionValidation {
  const c = new Collector();
  const out: ExtensionValidation = { ok: false, graphs: [], usableGraphs: [], diagnostics: c.list };
  if (!isObj(ext)) {
    c.assert("GE001", S_EXT, "the KHR_interactivity extension is not a JSON object");
    return out;
  }
  const graphs = ext.graphs;
  if (!isNonEmptyArray(graphs)) {
    c.assert("GE002", S_EXT, "`graphs` must be a non-empty JSON array", "graphs");
    return out;
  }
  graphs.forEach((g, i) => {
    const r = validateGraphObject(g, i);
    out.graphs.push(r);
    c.list.push(...r.diagnostics);
  });
  let selected = 0;
  let selectionOk = true;
  if (has(ext, "graph")) {
    if (!isJsonIndex(ext.graph)) {
      c.assert("GE003", S_EXT, `\`graph\` (default graph index) ${JSON.stringify(ext.graph)} is not a JSON index`, "graph");
      selectionOk = false;
    } else if (ext.graph >= graphs.length) {
      c.fail("rejectExtension", "GE004", S_EXT, `\`graph\` (default graph index) ${ext.graph} is not less than the number of graphs (${graphs.length})`, "graph");
      selectionOk = false;
    } else {
      selected = ext.graph;
    }
  }
  if (selectionOk) {
    out.selectedGraph = selected;
    if (!out.graphs[selected].ok) {
      c.fail("rejectExtension", "GE005", S_EXT, `the default graph (${selected}) is invalid, so the extension is rejected`, `graphs[${selected}]`);
    }
  }
  const rejected = c.list.some((d) => d.severity === "error" && d.outcome === "rejectExtension");
  out.ok = !rejected && selectionOk;
  if (out.ok) {
    out.usableGraphs = out.graphs.map((g, i) => (g.ok ? i : -1)).filter((i) => i >= 0);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Typed load-time rejection error
// ---------------------------------------------------------------------------

/**
 * Thrown by the load entry points (resolveGraph, createRuntime,
 * InteractivityRuntime, importGraph, engine factories) when a graph or the
 * whole extension is invalid per the spec's Validation section.
 */
export class InteractivityValidationError extends Error {
  readonly diagnostics: ValidationDiagnostic[];
  /** "extension": the whole KHR_interactivity extension is rejected; "graph": one graph. */
  readonly scope: "extension" | "graph";
  readonly code = "INTERACTIVITY_VALIDATION";

  constructor(diagnostics: ValidationDiagnostic[], scope: "extension" | "graph" = "graph") {
    const errors = diagnostics.filter((d) => d.severity === "error");
    const first = errors[0];
    const summary =
      `Invalid KHR_interactivity ${scope}: ${errors.length} error${errors.length === 1 ? "" : "s"}` +
      (first ? ` (first: ${first.code} ${first.message} [${first.section}])` : "");
    super(summary);
    // Explicit own assignment: some ES5 down-levelers lose super(message).
    this.message = summary;
    this.name = "InteractivityValidationError";
    this.diagnostics = diagnostics;
    this.scope = scope;
    Object.setPrototypeOf(this, InteractivityValidationError.prototype);
  }
}

/** Duck-typed check that survives duplicated module copies / bundles. */
export function isInteractivityValidationError(e: unknown): e is InteractivityValidationError {
  return e instanceof Error && (e as { code?: unknown }).code === "INTERACTIVITY_VALIDATION" && Array.isArray((e as { diagnostics?: unknown }).diagnostics);
}

// Marker for graphs that already passed validation and were then normalized by
// a runtime (normalizeGraph fills absent arrays with `[]`, which the spec's
// Validation forbids on the wire). A non-enumerable property keyed by a
// global symbol, so it survives hand-offs between separately bundled copies of
// this module and never shows up in JSON/equality.
const VALIDATED_MARK = Symbol.for("@gltfi/kernel.validatedGraph");

/** Marks `graph` (typically a runtime-normalized copy of a validated graph) as already validated. */
export function markGraphValidated<T extends object>(graph: T): T {
  Object.defineProperty(graph, VALIDATED_MARK, { value: true, enumerable: false, configurable: true });
  return graph;
}

export function isGraphValidated(graph: unknown): boolean {
  return typeof graph === "object" && graph !== null && (graph as Record<symbol, unknown>)[VALIDATED_MARK] === true;
}

/**
 * Throws {@link InteractivityValidationError} unless `graph` is a valid graph
 * object. Graphs marked by {@link markGraphValidated} are accepted as-is.
 */
export function assertValidGraph(graph: unknown): void {
  if (isGraphValidated(graph)) {
    return;
  }
  const r = validateGraphObject(graph);
  if (!r.ok) {
    throw new InteractivityValidationError(r.diagnostics, r.rejectsExtension ? "extension" : "graph");
  }
}

/** Throws {@link InteractivityValidationError} unless the extension is usable. */
export function assertValidExtension(ext: unknown): ExtensionValidation {
  const r = validateExtension(ext);
  if (!r.ok) {
    throw new InteractivityValidationError(r.diagnostics, "extension");
  }
  return r;
}
