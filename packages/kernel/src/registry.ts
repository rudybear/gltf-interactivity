// KHR_interactivity op registry: the single machine-readable description of
// every operation. See docs/design/op-registry.md for the schema and catalog
// this file implements. Consumers: IR validation, overload resolution in
// both transpiler directions, emit/parse socket naming, the graph validator.
// The interpreter (packages/runtime/src/interpreter.ts) is the conformance-
// tested authority for exact socket names; this file transcribes from it.
// Data-only: no logic beyond the small builder helpers below.

export type TypeSig =
  | "bool"
  | "int"
  | "float"
  | "float2"
  | "float3"
  | "float4"
  | "float2x2"
  | "float3x3"
  | "float4x4"
  | "ref"
  | "custom";

// Generic placeholders used in overload rows. All generic sockets of one
// node must resolve to the SAME concrete type (see registry-query.ts).
export type Generic = "F" | "V" | "M" | "T";

export const F_FAMILY: readonly TypeSig[] = [
  "float", "float2", "float3", "float4", "float2x2", "float3x3", "float4x4"
];
export const V_FAMILY: readonly TypeSig[] = ["float2", "float3", "float4"];
export const M_FAMILY: readonly TypeSig[] = ["float2x2", "float3x3", "float4x4"];

export interface OpSocket {
  name: string;
  type: TypeSig | Generic;
}

export interface OpOverload {
  inputs: OpSocket[];
  outputs: OpSocket[];
}

export interface OpConfigField {
  name: string;
  type: "bool" | "int" | "int[]" | "string";
  // Ops with NO default config (variable/*, pointer/*, event/send,
  // event/receive): invalid config => graph rejected; otherwise invalid
  // config => fall back to `default`.
  required: boolean;
  default?: unknown;
}

export type OpCategory =
  | "math" | "type" | "ref" | "flow" | "variable" | "pointer" | "animation" | "event" | "debug";

export type ConfigSocketsKind =
  | "switchCases" | "variableSet" | "pointerTemplate" | "eventPayload" | "waitAllFlows" | "logMessage";

export type Purity =
  | "pureClosed"   // output depends only on inputs (CSE-safe globally)
  | "readsState"   // reads variables/pointers/node state (site-local CSE only)
  | "volatile"     // math/random (never merge across sites)
  | "flow";        // has flow sockets (not a value op)

export type StateKind = "doN" | "multiGate" | "waitAll" | "throttle" | "for" | "delay";

export interface OpSpec {
  op: string;
  category: OpCategory;
  overloads: OpOverload[];
  // Sockets whose existence/names derive from configuration (switch cases,
  // variable ids, pointer template params, event payload, waitAll count,
  // log message params). Such sockets are NOT listed in `overloads`.
  configSockets?: ConfigSocketsKind;
  config?: OpConfigField[];
  inputFlows?: string[];   // e.g. ["in","reset"]; omitted => fully dynamic (flow/sequence, flow/multiGate)
  outputFlows?: string[];  // e.g. ["out"], ["out","err","done"]; omitted => fully dynamic
  schedule?: Record<string, "once" | "perIteration" | "perCheck">;
  purity: Purity;
  stateKind?: StateKind;
  extension?: string; // KHR_node_selectability / KHR_node_hoverability events
}

// ---------------------------------------------------------------------------
// Small builder helpers (data-only file: these just cut down repetition for
// the ~90 math ops that follow a handful of fixed shapes).
// ---------------------------------------------------------------------------

function s(name: string, type: TypeSig | Generic): OpSocket {
  return { name, type };
}

function mathOp(op: string, overloads: OpOverload[], purity: Purity = "pureClosed"): OpSpec {
  return { op, category: "math", overloads, purity };
}

// Component-wise F-family unary op (abs, floor, sin, ...), optionally also
// defined over int (per doc: abs/sign/neg add sub mul div rem min max clamp).
function unaryF(op: string, withInt = false): OpSpec {
  const overloads: OpOverload[] = [{ inputs: [s("a", "F")], outputs: [s("value", "F")] }];
  if (withInt) {
    overloads.push({ inputs: [s("a", "int")], outputs: [s("value", "int")] });
  }
  return mathOp(op, overloads);
}

function binaryF(op: string, withInt = false): OpSpec {
  const overloads: OpOverload[] = [{ inputs: [s("a", "F"), s("b", "F")], outputs: [s("value", "F")] }];
  if (withInt) {
    overloads.push({ inputs: [s("a", "int"), s("b", "int")], outputs: [s("value", "int")] });
  }
  return mathOp(op, overloads);
}

function ternaryF(op: string, withInt = false): OpSpec {
  const overloads: OpOverload[] = [
    { inputs: [s("a", "F"), s("b", "F"), s("c", "F")], outputs: [s("value", "F")] }
  ];
  if (withInt) {
    overloads.push({ inputs: [s("a", "int"), s("b", "int"), s("c", "int")], outputs: [s("value", "int")] });
  }
  return mathOp(op, overloads);
}

function mathConst(op: string): OpSpec {
  return mathOp(op, [{ inputs: [], outputs: [s("value", "float")] }]);
}

// not/and/or/xor: int overloads shared with bool overloads (doc: "math int
// bitwise" and "math bool" categories name the same 4 op names).
function boolIntUnary(op: string): OpSpec {
  return mathOp(op, [
    { inputs: [s("a", "bool")], outputs: [s("value", "bool")] },
    { inputs: [s("a", "int")], outputs: [s("value", "int")] }
  ]);
}
function boolIntBinary(op: string): OpSpec {
  return mathOp(op, [
    { inputs: [s("a", "bool"), s("b", "bool")], outputs: [s("value", "bool")] },
    { inputs: [s("a", "int"), s("b", "int")], outputs: [s("value", "int")] }
  ]);
}

function intUnary(op: string): OpSpec {
  return mathOp(op, [{ inputs: [s("a", "int")], outputs: [s("value", "int")] }]);
}
function intBinary(op: string): OpSpec {
  return mathOp(op, [{ inputs: [s("a", "int"), s("b", "int")], outputs: [s("value", "int")] }]);
}

// lt/le/gt/ge: scalar float AND scalar int overloads only (no vector/matrix).
function scalarCompare(op: string): OpSpec {
  return mathOp(op, [
    { inputs: [s("a", "float"), s("b", "float")], outputs: [s("value", "bool")] },
    { inputs: [s("a", "int"), s("b", "int")], outputs: [s("value", "bool")] }
  ]);
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

// math/combineN, combineNxN: N (or NxN) float scalar inputs named a,b,c,... -> value:concrete vector/matrix type.
function combineOp(op: string, inputCount: number, outputType: TypeSig): OpSpec {
  return mathOp(op, [
    { inputs: LETTERS.slice(0, inputCount).map((n) => s(n, "float")), outputs: [s("value", outputType)] }
  ]);
}

// math/extractN, extractNxN: single vector/matrix input -> decimal-indexed float outputs "0".."N-1".
function extractOp(op: string, inputType: TypeSig, outputCount: number): OpSpec {
  return mathOp(op, [
    {
      inputs: [s("a", inputType)],
      outputs: Array.from({ length: outputCount }, (_, i) => s(String(i), "float"))
    }
  ]);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

const ops: OpSpec[] = [
  // --- math constants (5) ---
  mathConst("math/E"),
  mathConst("math/Pi"),
  mathConst("math/Tau"),
  mathConst("math/Inf"),
  mathConst("math/NaN"),

  // --- math float arith (19, component-wise on F, NaN-propagating) ---
  // int overloads: abs, sign, neg, add, sub, mul, div, rem, min, max, clamp
  unaryF("math/abs", true),
  unaryF("math/sign", true),
  unaryF("math/trunc"),
  unaryF("math/floor"),
  unaryF("math/ceil"),
  unaryF("math/round"),
  unaryF("math/fract"),
  unaryF("math/neg", true),
  binaryF("math/add", true),
  binaryF("math/sub", true),
  binaryF("math/mul", true),
  binaryF("math/div", true), // int div truncates toward zero; div/rem by 0 -> 0; wraps on overflow
  binaryF("math/rem", true),
  binaryF("math/min", true),
  binaryF("math/max", true),
  ternaryF("math/clamp", true),
  unaryF("math/saturate"),
  // mix(a,b:F, c:float [interpolation factor, always scalar]) -> F; socket names a/b/c
  mathOp("math/mix", [{ inputs: [s("a", "F"), s("b", "F"), s("c", "float")], outputs: [s("value", "F")] }]),
  ternaryF("math/smoothStep"),

  // --- math comparison (5) ---
  // eq: bool/int/F (incl. matrices), per-component AND -> bool. NaN => false.
  mathOp("math/eq", [
    { inputs: [s("a", "bool"), s("b", "bool")], outputs: [s("value", "bool")] },
    { inputs: [s("a", "int"), s("b", "int")], outputs: [s("value", "bool")] },
    { inputs: [s("a", "F"), s("b", "F")], outputs: [s("value", "bool")] }
  ]),
  scalarCompare("math/lt"),
  scalarCompare("math/le"),
  scalarCompare("math/gt"),
  scalarCompare("math/ge"),

  // --- math special (5) ---
  mathOp("math/isNaN", [{ inputs: [s("a", "F")], outputs: [s("value", "bool")] }]),
  mathOp("math/isInf", [{ inputs: [s("a", "F")], outputs: [s("value", "bool")] }]),
  mathOp("math/select", [
    { inputs: [s("condition", "bool"), s("a", "T"), s("b", "T")], outputs: [s("value", "T")] }
  ]),
  // switch: config int[] cases; selection + dynamic per-case T inputs (configSockets) + default -> value
  {
    op: "math/switch",
    category: "math",
    overloads: [{ inputs: [s("selection", "int"), s("default", "T")], outputs: [s("value", "T")] }],
    configSockets: "switchCases",
    config: [{ name: "cases", type: "int[]", required: false, default: [] }],
    purity: "pureClosed"
  },
  mathOp("math/random", [{ inputs: [], outputs: [s("value", "float")] }], "volatile"),

  // --- math trig (9) ---
  unaryF("math/rad"),
  unaryF("math/deg"),
  unaryF("math/sin"),
  unaryF("math/cos"),
  unaryF("math/tan"),
  unaryF("math/asin"),
  unaryF("math/acos"),
  unaryF("math/atan"),
  binaryF("math/atan2"),

  // --- math hyperbolic (6) ---
  unaryF("math/sinh"),
  unaryF("math/cosh"),
  unaryF("math/tanh"),
  unaryF("math/asinh"),
  unaryF("math/acosh"),
  unaryF("math/atanh"),

  // --- math exp (7) ---
  binaryF("math/pow"),
  unaryF("math/exp"),
  unaryF("math/log"),
  unaryF("math/log2"),
  unaryF("math/log10"),
  unaryF("math/sqrt"),
  unaryF("math/cbrt"),

  // --- math vector (8) ---
  mathOp("math/length", [{ inputs: [s("a", "V")], outputs: [s("value", "float")] }]),
  // DISCREPANCY vs doc ("normalize (V->V)"): interpreter also sets an
  // "isValid" bool output (false for zero-length/non-finite input).
  mathOp("math/normalize", [{ inputs: [s("a", "V")], outputs: [s("value", "V"), s("isValid", "bool")] }]),
  mathOp("math/dot", [{ inputs: [s("a", "V"), s("b", "V")], outputs: [s("value", "float")] }]),
  mathOp("math/cross", [{ inputs: [s("a", "float3"), s("b", "float3")], outputs: [s("value", "float3")] }]),
  mathOp("math/rotate2D", [{ inputs: [s("a", "float2"), s("angle", "float")], outputs: [s("value", "float2")] }]),
  mathOp("math/rotate3D", [{ inputs: [s("a", "float3"), s("rotation", "float4")], outputs: [s("value", "float3")] }]),
  // DISCREPANCY vs doc ("transform (V by matching M)"): the interpreter's
  // math/transform only ever treats one operand as a float4x4 (via
  // array-length dispatch) and the other as float3/float4 — it never pairs
  // float2 with float2x2 or float3 with float3x3. It's also order-agnostic
  // (either "a" or "b" may be the matrix), so both orders are registered.
  mathOp("math/transform", [
    { inputs: [s("a", "float4x4"), s("b", "float3")], outputs: [s("value", "float3")] },
    { inputs: [s("a", "float3"), s("b", "float4x4")], outputs: [s("value", "float3")] },
    { inputs: [s("a", "float4x4"), s("b", "float4")], outputs: [s("value", "float4")] },
    { inputs: [s("a", "float4"), s("b", "float4x4")], outputs: [s("value", "float4")] }
  ]),
  mathOp("math/slerp", [{ inputs: [s("a", "V"), s("b", "V"), s("c", "float")], outputs: [s("value", "V")] }]),

  // --- math matrix (6) ---
  mathOp("math/transpose", [{ inputs: [s("a", "M")], outputs: [s("value", "M")] }]),
  mathOp("math/determinant", [{ inputs: [s("a", "M")], outputs: [s("value", "float")] }]),
  // DISCREPANCY vs doc ("inverse (M->M)"): interpreter also sets "isValid".
  mathOp("math/inverse", [{ inputs: [s("a", "M")], outputs: [s("value", "M"), s("isValid", "bool")] }]),
  mathOp("math/matMul", [{ inputs: [s("a", "M"), s("b", "M")], outputs: [s("value", "M")] }]),
  mathOp("math/matCompose", [
    {
      inputs: [s("translation", "float3"), s("rotation", "float4"), s("scale", "float3")],
      outputs: [s("value", "float4x4")]
    }
  ]),
  // DISCREPANCY vs doc: interpreter also sets "isValid".
  mathOp("math/matDecompose", [
    {
      inputs: [s("a", "float4x4")],
      outputs: [s("translation", "float3"), s("rotation", "float4"), s("scale", "float3"), s("isValid", "bool")]
    }
  ]),

  // --- math quaternion (9) ---
  mathOp("math/quatConjugate", [{ inputs: [s("a", "float4")], outputs: [s("value", "float4")] }]),
  mathOp("math/quatMul", [{ inputs: [s("a", "float4"), s("b", "float4")], outputs: [s("value", "float4")] }]),
  mathOp("math/quatAngleBetween", [{ inputs: [s("a", "float4"), s("b", "float4")], outputs: [s("value", "float")] }]),
  mathOp("math/quatFromAxisAngle", [
    { inputs: [s("axis", "float3"), s("angle", "float")], outputs: [s("value", "float4")] }
  ]),
  mathOp("math/quatToAxisAngle", [
    { inputs: [s("a", "float4")], outputs: [s("axis", "float3"), s("angle", "float")] }
  ]),
  mathOp("math/quatFromDirections", [
    { inputs: [s("a", "float3"), s("b", "float3")], outputs: [s("value", "float4")] }
  ]),
  mathOp("math/quatFromUpForward", [
    { inputs: [s("up", "float3"), s("forward", "float3")], outputs: [s("value", "float4")] }
  ]),
  {
    op: "math/quatFromAngles",
    category: "math",
    overloads: [
      { inputs: [s("x", "float"), s("y", "float"), s("z", "float")], outputs: [s("value", "float4")] }
    ],
    config: [{ name: "order", type: "string", required: false, default: "yxz" }],
    purity: "pureClosed"
  },
  mathOp("math/quatSlerp", [
    { inputs: [s("a", "float4"), s("b", "float4"), s("c", "float")], outputs: [s("value", "float4")] }
  ]),

  // --- math int bitwise (9) ---
  // not/and/or/xor: int overloads shared with bool overloads.
  // ctz(0) = 32; popcnt counts over the 32-bit two's-complement pattern.
  boolIntUnary("math/not"),
  boolIntBinary("math/and"),
  boolIntBinary("math/or"),
  boolIntBinary("math/xor"),
  intBinary("math/asr"),
  intBinary("math/lsl"),
  intUnary("math/clz"),
  intUnary("math/ctz"),
  intUnary("math/popcnt"),

  // --- math color (2) ---
  // DISCREPANCY vs doc ("float3<->float3"): interpreter uses individually
  // named scalar sockets (r/g/b and l/c/h), not float3-typed sockets.
  mathOp("math/rgbToOkLCh", [
    {
      inputs: [s("r", "float"), s("g", "float"), s("b", "float")],
      outputs: [s("l", "float"), s("c", "float"), s("h", "float")]
    }
  ]),
  mathOp("math/rgbFromOkLCh", [
    {
      inputs: [s("l", "float"), s("c", "float"), s("h", "float")],
      outputs: [s("r", "float"), s("g", "float"), s("b", "float")]
    }
  ]),

  // --- math vector/matrix construction & extraction (12) ---
  // NOTE: omitted from the design doc's catalog prose entirely, but real,
  // individually conformance-tested ops (see external/glTF-Test-Assets-
  // Interactivity/Tests/Interactivity/math/{combine2,extract2,...}, whose
  // schema listings cite these exact op names). Fixed (non-generic)
  // signatures per dimension — arity changes so a generic V/M row can't
  // express them.
  combineOp("math/combine2", 2, "float2"),
  combineOp("math/combine3", 3, "float3"),
  combineOp("math/combine4", 4, "float4"),
  combineOp("math/combine2x2", 4, "float2x2"),
  combineOp("math/combine3x3", 9, "float3x3"),
  combineOp("math/combine4x4", 16, "float4x4"),
  extractOp("math/extract2", "float2", 2),
  extractOp("math/extract3", "float3", 3),
  extractOp("math/extract4", "float4", 4),
  extractOp("math/extract2x2", "float2x2", 4),
  extractOp("math/extract3x3", "float3x3", 9),
  extractOp("math/extract4x4", "float4x4", 16),

  // --- ref (1) ---
  { op: "ref/eq", category: "ref", overloads: [{ inputs: [s("a", "ref"), s("b", "ref")], outputs: [s("value", "bool")] }], purity: "pureClosed" },

  // --- type (6) ---
  { op: "type/boolToInt", category: "type", overloads: [{ inputs: [s("a", "bool")], outputs: [s("value", "int")] }], purity: "pureClosed" },
  { op: "type/boolToFloat", category: "type", overloads: [{ inputs: [s("a", "bool")], outputs: [s("value", "float")] }], purity: "pureClosed" },
  { op: "type/intToBool", category: "type", overloads: [{ inputs: [s("a", "int")], outputs: [s("value", "bool")] }], purity: "pureClosed" },
  { op: "type/intToFloat", category: "type", overloads: [{ inputs: [s("a", "int")], outputs: [s("value", "float")] }], purity: "pureClosed" },
  // false iff NaN or +/-0
  { op: "type/floatToBool", category: "type", overloads: [{ inputs: [s("a", "float")], outputs: [s("value", "bool")] }], purity: "pureClosed" },
  // 0 for NaN/+-Inf, else truncate + wrap to int32 (a|0)
  { op: "type/floatToInt", category: "type", overloads: [{ inputs: [s("a", "float")], outputs: [s("value", "int")] }], purity: "pureClosed" },

  // --- flow (11) ---
  {
    op: "flow/sequence",
    category: "flow",
    overloads: [{ inputs: [], outputs: [] }],
    inputFlows: ["in"],
    // outputFlows omitted: fully dynamic, ordered by UTF-16 sort of the
    // wired flow socket keys (node.flows), not derived from any config field.
    purity: "flow"
  },
  {
    op: "flow/branch",
    category: "flow",
    overloads: [{ inputs: [s("condition", "bool")], outputs: [] }],
    inputFlows: ["in"],
    outputFlows: ["true", "false"],
    purity: "flow"
  },
  {
    op: "flow/switch",
    category: "flow",
    overloads: [{ inputs: [s("selection", "int")], outputs: [] }],
    configSockets: "switchCases",
    config: [{ name: "cases", type: "int[]", required: false, default: [] }],
    inputFlows: ["in"],
    outputFlows: ["default"], // + dynamic decimal-keyed case flows (from config "cases")
    purity: "flow"
  },
  {
    op: "flow/while",
    category: "flow",
    overloads: [{ inputs: [s("condition", "bool")], outputs: [] }],
    inputFlows: ["in"],
    outputFlows: ["loopBody", "completed"],
    schedule: { condition: "perCheck" },
    purity: "flow"
  },
  {
    op: "flow/for",
    category: "flow",
    overloads: [{ inputs: [s("startIndex", "int"), s("endIndex", "int")], outputs: [s("index", "int")] }],
    config: [{ name: "initialIndex", type: "int", required: false, default: 0 }],
    inputFlows: ["in"],
    outputFlows: ["loopBody", "completed"],
    schedule: { startIndex: "once", endIndex: "perIteration" },
    purity: "flow",
    stateKind: "for"
  },
  {
    op: "flow/doN",
    category: "flow",
    overloads: [{ inputs: [s("n", "int")], outputs: [s("currentCount", "int")] }],
    inputFlows: ["in", "reset"],
    outputFlows: ["out"],
    purity: "flow",
    stateKind: "doN"
  },
  {
    op: "flow/multiGate",
    category: "flow",
    overloads: [{ inputs: [], outputs: [s("lastIndex", "int")] }],
    config: [
      { name: "isRandom", type: "bool", required: false, default: false },
      { name: "isLoop", type: "bool", required: false, default: false }
    ],
    inputFlows: ["in", "reset"],
    // outputFlows omitted: fully dynamic (UTF-16-sorted wired flow keys),
    // like flow/sequence — not enumerable from config alone.
    purity: "flow",
    stateKind: "multiGate"
  },
  {
    op: "flow/waitAll",
    category: "flow",
    overloads: [{ inputs: [], outputs: [s("remainingInputs", "int")] }],
    configSockets: "waitAllFlows",
    config: [{ name: "inputFlows", type: "int", required: false, default: 0 }], // <= 64
    inputFlows: ["reset"], // + dynamic "0".."N-1" (N = config inputFlows)
    outputFlows: ["out", "completed"],
    purity: "flow",
    stateKind: "waitAll"
  },
  {
    op: "flow/throttle",
    category: "flow",
    overloads: [{ inputs: [s("duration", "float")], outputs: [s("lastRemainingTime", "float")] }],
    inputFlows: ["in", "reset"],
    outputFlows: ["out", "err"],
    purity: "flow",
    stateKind: "throttle"
  },
  {
    op: "flow/setDelay",
    category: "flow",
    overloads: [{ inputs: [s("duration", "float")], outputs: [s("lastDelay", "ref")] }],
    inputFlows: ["in", "cancel"],
    outputFlows: ["out", "err", "done"],
    purity: "flow",
    stateKind: "delay"
  },
  {
    op: "flow/cancelDelay",
    category: "flow",
    // Legacy int-typed "delayIndex" input fallback (older assets) exists in
    // the interpreter for back-compat but isn't part of the current surface.
    overloads: [{ inputs: [s("delay", "ref")], outputs: [] }],
    inputFlows: ["in"],
    outputFlows: ["out"],
    purity: "flow"
  },

  // --- variable (3) ---
  {
    op: "variable/get",
    category: "variable",
    overloads: [{ inputs: [], outputs: [s("value", "T")] }],
    config: [{ name: "variable", type: "int", required: true }],
    purity: "readsState"
  },
  {
    op: "variable/set",
    category: "variable",
    overloads: [{ inputs: [], outputs: [] }],
    configSockets: "variableSet",
    config: [{ name: "variables", type: "int[]", required: true }],
    inputFlows: ["in"],
    outputFlows: ["out"],
    purity: "flow"
  },
  {
    op: "variable/interpolate",
    category: "variable",
    overloads: [
      {
        inputs: [s("value", "T"), s("duration", "float"), s("p1", "float2"), s("p2", "float2")],
        outputs: []
      }
    ],
    config: [
      { name: "variable", type: "int", required: true },
      { name: "useSlerp", type: "bool", required: true } // T must not be bool/int; useSlerp only valid for float4
    ],
    inputFlows: ["in"],
    outputFlows: ["out", "err", "done"],
    purity: "flow"
  },

  // --- pointer (3) ---
  {
    op: "pointer/get",
    category: "pointer",
    overloads: [{ inputs: [], outputs: [s("value", "T"), s("isValid", "bool")] }],
    configSockets: "pointerTemplate", // template params: int "[seg]" / ref "{seg}" input sockets
    config: [
      { name: "pointer", type: "string", required: true },
      { name: "type", type: "int", required: true }
    ],
    purity: "readsState"
  },
  {
    op: "pointer/set",
    category: "pointer",
    overloads: [{ inputs: [s("value", "T")], outputs: [] }],
    configSockets: "pointerTemplate",
    config: [
      { name: "pointer", type: "string", required: true },
      { name: "type", type: "int", required: true }
    ],
    inputFlows: ["in"],
    outputFlows: ["out", "err"],
    purity: "flow"
  },
  {
    op: "pointer/interpolate",
    category: "pointer",
    overloads: [
      {
        inputs: [s("value", "T"), s("duration", "float"), s("p1", "float2"), s("p2", "float2")],
        outputs: []
      }
    ],
    configSockets: "pointerTemplate",
    config: [
      { name: "pointer", type: "string", required: true },
      { name: "type", type: "int", required: true }
    ],
    inputFlows: ["in"],
    outputFlows: ["out", "err", "done"],
    purity: "flow"
  },

  // --- animation (3) ---
  {
    op: "animation/start",
    category: "animation",
    overloads: [
      {
        inputs: [s("animation", "ref"), s("startTime", "float"), s("endTime", "float"), s("speed", "float")],
        outputs: []
      }
    ],
    inputFlows: ["in"],
    outputFlows: ["out", "err", "done"],
    purity: "flow"
  },
  {
    op: "animation/stop",
    category: "animation",
    overloads: [{ inputs: [s("animation", "ref")], outputs: [] }],
    inputFlows: ["in"],
    outputFlows: ["out", "err"],
    purity: "flow"
  },
  {
    op: "animation/stopAt",
    category: "animation",
    overloads: [{ inputs: [s("animation", "ref"), s("stopTime", "float")], outputs: [] }],
    inputFlows: ["in"],
    outputFlows: ["out", "err", "done"],
    purity: "flow"
  },

  // --- event (5) ---
  {
    op: "event/onStart",
    category: "event",
    overloads: [{ inputs: [], outputs: [s("event", "ref")] }],
    outputFlows: ["out"],
    purity: "flow"
  },
  {
    op: "event/onTick",
    category: "event",
    overloads: [
      { inputs: [], outputs: [s("timeSinceStart", "float"), s("timeSinceLastTick", "float"), s("event", "ref")] }
    ],
    outputFlows: ["out"],
    purity: "flow"
  },
  {
    op: "event/receive",
    category: "event",
    overloads: [
      {
        inputs: [],
        outputs: [
          s("boolParameter", "bool"), s("intParameter", "int"), s("floatParameter", "float"),
          s("expectedDuration", "float"), s("event", "ref")
        ]
      }
    ],
    configSockets: "eventPayload",
    config: [{ name: "event", type: "int", required: true }],
    outputFlows: ["out"], // triggered internally by the matching event/send, not graph-wired
    purity: "flow"
  },
  {
    op: "event/send",
    category: "event",
    overloads: [
      {
        inputs: [
          s("boolParameter", "bool"), s("intParameter", "int"), s("floatParameter", "float"),
          s("expectedDuration", "float")
        ],
        outputs: []
      }
    ],
    configSockets: "eventPayload",
    config: [{ name: "event", type: "int", required: true }],
    inputFlows: ["in"],
    outputFlows: ["out"],
    purity: "flow"
  },
  {
    op: "event/stopPropagation",
    category: "event",
    overloads: [{ inputs: [s("stopImmediate", "bool"), s("event", "ref")], outputs: [] }],
    inputFlows: ["in"],
    outputFlows: ["out"],
    purity: "flow"
  },

  // --- debug (1) ---
  {
    op: "debug/log",
    category: "debug",
    overloads: [{ inputs: [], outputs: [] }],
    configSockets: "logMessage", // dynamic input sockets, one per `{param}` placeholder in `message`
    config: [
      { name: "severity", type: "int", required: false, default: 0 },
      { name: "message", type: "string", required: false, default: "" }
    ],
    inputFlows: ["in"],
    outputFlows: ["out"],
    purity: "flow"
  },

  // --- extension events (3) ---
  {
    op: "event/onSelect",
    category: "event",
    overloads: [
      {
        inputs: [],
        // DISCREPANCY vs doc (which lists selectedNode/controllerIndex/
        // selectionPoint/selectionRayOrigin/event only): the interpreter
        // additionally exposes a legacy "selectedNodeIndex" int output
        // alongside the ref "selectedNode".
        outputs: [
          s("selectedNode", "ref"), s("selectedNodeIndex", "int"), s("controllerIndex", "int"),
          s("selectionPoint", "float3"), s("selectionRayOrigin", "float3"), s("event", "ref")
        ]
      }
    ],
    config: [
      { name: "nodeIndex", type: "int", required: false, default: -1 },
      { name: "stopPropagation", type: "bool", required: false, default: false }
    ],
    outputFlows: ["out"],
    purity: "flow",
    extension: "KHR_node_selectability"
  },
  {
    op: "event/onHoverIn",
    category: "event",
    overloads: [
      { inputs: [], outputs: [s("hoveredNode", "ref"), s("controllerIndex", "int"), s("event", "ref")] }
    ],
    config: [{ name: "nodeIndex", type: "int", required: false, default: -1 }],
    outputFlows: ["out"],
    purity: "flow",
    extension: "KHR_node_hoverability"
  },
  {
    op: "event/onHoverOut",
    category: "event",
    overloads: [
      { inputs: [], outputs: [s("hoveredNode", "ref"), s("controllerIndex", "int"), s("event", "ref")] }
    ],
    config: [{ name: "nodeIndex", type: "int", required: false, default: -1 }],
    outputFlows: ["out"],
    purity: "flow",
    extension: "KHR_node_hoverability"
  }
];

export const OP_REGISTRY: ReadonlyMap<string, OpSpec> = new Map(ops.map((spec) => [spec.op, spec]));
