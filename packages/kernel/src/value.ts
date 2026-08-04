// KHR_interactivity value model: the tagged number/boolean/string arrays that
// flow through the graph, plus the small set of helpers used to build and
// combine them. Environment-neutral (no node/DOM imports).

export type ValueType = "bool" | "int" | "float" | "float2" | "float3" | "float4" | "float2x2" | "float3x3" | "float4x4" | "ref";

export type Value = {
  type: ValueType;
  data: number[] | boolean[] | string[];
};

export function parseScalar(value: number | boolean | string): number | boolean | string {
  if (typeof value === "string") {
    if (value === "NaN") {
      return NaN;
    }
    if (value === "Infinity") {
      return Infinity;
    }
    if (value === "-Infinity") {
      return -Infinity;
    }
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    return value;
  }
  return value;
}

// Inverse of parseScalar's NaN/Infinity/-Infinity branches — glTF JSON has
// no way to represent a non-finite IEEE float, so KHR_interactivity encodes
// those three as the literal strings "NaN"/"Infinity"/"-Infinity" (every
// consumer of raw graph JSON already round-trips this: parseScalar above on
// read, @gltfi/verify's stableDataKey/compareDeclarations' coerceScalar on
// comparison). Any producer of graph JSON that's ever going to hand its
// output to `JSON.stringify` — @gltfi/ir's exportGraph chief among them —
// MUST run every literal value array through this first: plain
// `JSON.stringify` silently collapses NaN/Infinity/-Infinity to `null`
// with no error, which is a real, previously-latent bug this comment exists
// to prevent from recurring (caught by @gltfi/cli's `apply` e2e suite going
// through an actual JSON round trip via @gltfi/gltf's spliceGraph — the
// first codepath in this repo to ever serialize an exported graph's literal
// values to JSON text). A finite number or a boolean passes through
// unchanged.
export function formatScalar(value: number | boolean | string): number | boolean | string {
  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return "NaN";
    }
    if (value === Infinity) {
      return "Infinity";
    }
    if (value === -Infinity) {
      return "-Infinity";
    }
  }
  return value;
}

// Maps formatScalar over a whole literal value array — the shape every
// GraphJson `value:`/`configuration.<field>.value:` field actually takes.
export function formatValueArray(data: ReadonlyArray<number | boolean | string>): Array<number | boolean | string> {
  return data.map(formatScalar);
}

export function toValue(signature: ValueType, raw: Array<number | boolean | string>): Value {
  if (signature === "ref") {
    return { type: signature, data: raw.map((item) => String(item)) };
  }
  const parsed = raw.map((item) => parseScalar(item));
  if (signature === "bool") {
    return { type: signature, data: parsed.map((item) => Boolean(item)) };
  }
  return { type: signature, data: parsed.map((item) => Number(item)) };
}

export function cloneValue(value: Value): Value {
  return { type: value.type, data: Array.isArray(value.data) ? [...value.data] : value.data } as Value;
}

export function defaultValue(signature: ValueType): Value {
  switch (signature) {
    case "bool":
      return { type: signature, data: [false] };
    case "int":
    case "float":
      return { type: signature, data: [0] };
    case "float2":
      return { type: signature, data: [0, 0] };
    case "float3":
      return { type: signature, data: [0, 0, 0] };
    case "float4":
      return { type: signature, data: [0, 0, 0, 0] };
    case "float2x2":
      return { type: signature, data: [1, 0, 0, 1] };
    case "float3x3":
      return { type: signature, data: [1, 0, 0, 0, 1, 0, 0, 0, 1] };
    case "float4x4":
      return {
        type: signature,
        data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
      };
    case "ref":
      return { type: signature, data: [""] };
  }
}

export function valueToNumberArray(value: Value): number[] {
  if (value.type === "bool") {
    return (value.data as boolean[]).map((item) => (item ? 1 : 0));
  }
  return value.data as number[];
}

export function boolValue(data: boolean[]): Value {
  return { type: "bool", data };
}

export function floatValue(data: number[]): Value {
  return { type: "float", data };
}

export function intValue(data: number[]): Value {
  // KHR_interactivity ints are two's-complement int32: arithmetic wraps
  // (INT_MAX + 1 = INT_MIN), division by zero and NaN produce 0.
  return { type: "int", data: data.map((item) => Math.trunc(item) | 0) };
}

export function broadcast(a: number[], b: number[]) {
  if (a.length === b.length) {
    return [a, b];
  }
  if (a.length === 1) {
    return [new Array(b.length).fill(a[0]), b];
  }
  if (b.length === 1) {
    return [a, new Array(a.length).fill(b[0])];
  }
  return [a, b];
}

export function applyBinary(a: Value, b: Value, op: (x: number, y: number) => number, outputType?: ValueType): Value {
  const aNum = valueToNumberArray(a);
  const bNum = valueToNumberArray(b);
  const [left, right] = broadcast(aNum, bNum);
  const out = left.map((item, index) => op(item, right[index] ?? right[0] ?? 0));
  const type = outputType ?? a.type;
  if (type === "int") {
    return intValue(out);
  }
  if (type === "bool") {
    return boolValue(out.map((item) => Boolean(item)));
  }
  return floatValue(out);
}

export function applyUnary(a: Value, op: (x: number) => number, outputType?: ValueType): Value {
  const aNum = valueToNumberArray(a);
  const out = aNum.map((item) => op(item));
  const type = outputType ?? a.type;
  if (type === "int") {
    return intValue(out);
  }
  if (type === "bool") {
    return boolValue(out.map((item) => Boolean(item)));
  }
  return floatValue(out);
}

export function isFiniteValue(value: Value): boolean {
  return valueToNumberArray(value).every((item) => Number.isFinite(item));
}
