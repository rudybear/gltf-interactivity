// Raw-JS math/type/ref namespace for compiled (emit-ts) output. Mirrors
// packages/runtime/src/interpreter.ts's evaluateNode switch semantics
// exactly (component-wise F-family mapping with NaN propagation, int32
// wrapping, div-by-0 -> 0, ctz(0)=32, unsigned popcnt) but operates on raw
// JS values instead of kernel `Value` objects, per the compiled-engine value
// representation: float=number, int=number (int32 semantics via these `m.*`
// calls), bool=boolean, vector/matrix=number[] (column-major, matching
// @gltfi/kernel's convention), ref=string.
//
// One function per registry op the emitter needs. Ops with both a float/F
// and an int overload get an "Int"-suffixed sibling (e.g. add/addInt);
// math/eq additionally gets eqInt/eqBool (three concrete comparison
// shapes). lt/le/gt/ge and the bitwise-only ops have no int suffix: their
// computation is identical for int and float inputs (no wrap concerns), so
// one function covers both — see the task report for this call.
//
// math/random is deliberately NOT here: it needs per-engine-instance LCG
// state (so compiled and interpreted runs draw identical sequences from the
// same seed, and so two concurrently-alive engines never share a stream).
// It's `rt.random()` on the engine surface instead (see engine.ts).
//
// math/combine* and math/extract* are also not here: with vectors/matrices
// represented as plain `number[]`, combine is exactly an array literal and
// extract is exactly an index — see emit-ts, which emits those directly
// rather than routing them through a wrapper call (nothing to compute; a
// wrapper would only add an indirection).
import {
  crossVec3,
  mat2Determinant,
  mat2Invert,
  mat2Mul,
  mat3Determinant,
  mat3Invert,
  mat3Mul,
  mat4Compose,
  mat4Decompose,
  mat4Determinant,
  mat4Invert,
  mat4Mul,
  mat4Transpose,
  quatAngleBetween,
  quatFromAxisAngle,
  quatFromDirections,
  quatFromUpForward,
  quatMul,
  quatNormalize,
  quatSlerp as kernelQuatSlerp,
  quatToAxisAngle,
  rotate2D as kernelRotate2D,
  transformVec3,
  vectorSlerp
} from "@gltfi/kernel";

export type F = number | number[];

function arr(x: F): number[] {
  return Array.isArray(x) ? x : [x];
}

function scalarize(out: number[]): F {
  return out.length === 1 ? out[0] : out;
}

// Mirrors @gltfi/kernel's value.ts `broadcast` exactly.
function broadcast(a: number[], b: number[]): [number[], number[]] {
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

function map1(a: F, f: (x: number) => number): F {
  return scalarize(arr(a).map(f));
}

function map2(a: F, b: F, f: (x: number, y: number) => number): F {
  const [left, right] = broadcast(arr(a), arr(b));
  return scalarize(left.map((item, i) => f(item, right[i] ?? right[0] ?? 0)));
}

function eqArrays(a: F, b: F): boolean {
  const [left, right] = broadcast(arr(a), arr(b));
  return left.every((item, i) => item === (right[i] ?? right[0]));
}

function i32(x: number): number {
  return x | 0;
}

function matDispatch<T>(a: number[], f2: (m: number[]) => T, f3: (m: number[]) => T, f4: (m: number[]) => T): T {
  return a.length === 4 ? f2(a) : a.length === 9 ? f3(a) : f4(a);
}

export const m = {
  // --- constants ---
  E: () => Math.E,
  Pi: () => Math.PI,
  Tau: () => 2 * Math.PI,
  Inf: () => Infinity,
  NaN: () => Number.NaN,

  // --- float arith (component-wise F, NaN-propagating) ---
  abs: (a: F): F => map1(a, Math.abs),
  absInt: (a: number): number => i32(Math.abs(a)),
  sign: (a: F): F => map1(a, Math.sign),
  signInt: (a: number): number => i32(Math.sign(a)),
  trunc: (a: F): F => map1(a, Math.trunc),
  floor: (a: F): F => map1(a, Math.floor),
  ceil: (a: F): F => map1(a, Math.ceil),
  round: (a: F): F => map1(a, (x) => Math.sign(x) * Math.round(Math.abs(x))),
  fract: (a: F): F => map1(a, (x) => x - Math.floor(x)),
  neg: (a: F): F => map1(a, (x) => -x),
  negInt: (a: number): number => i32(-a),
  saturate: (a: F): F => map1(a, (x) => Math.min(Math.max(x, 0), 1)),
  add: (a: F, b: F): F => map2(a, b, (x, y) => x + y),
  addInt: (a: number, b: number): number => i32(a + b),
  sub: (a: F, b: F): F => map2(a, b, (x, y) => x - y),
  subInt: (a: number, b: number): number => i32(a - b),
  mul: (a: F, b: F): F => map2(a, b, (x, y) => x * y),
  mulInt: (a: number, b: number): number => i32(a * b),
  div: (a: F, b: F): F => map2(a, b, (x, y) => x / y),
  divInt: (a: number, b: number): number => i32(a / b),
  rem: (a: F, b: F): F => map2(a, b, (x, y) => x % y),
  remInt: (a: number, b: number): number => i32(a % b),
  min: (a: F, b: F): F => map2(a, b, (x, y) => Math.min(x, y)),
  minInt: (a: number, b: number): number => i32(Math.min(a, b)),
  max: (a: F, b: F): F => map2(a, b, (x, y) => Math.max(x, y)),
  maxInt: (a: number, b: number): number => i32(Math.max(a, b)),
  clamp: (a: F, b: F, c: F): F => {
    const av = arr(a);
    const [low, high] = broadcast(arr(b), arr(c));
    return scalarize(av.map((item, i) => Math.max(low[i] ?? low[0], Math.min(high[i] ?? high[0], item))));
  },
  clampInt: (a: number, b: number, c: number): number => i32(Math.max(b, Math.min(c, a))),
  // `c` is declared as a fixed scalar "float" socket in the registry, but
  // @gltfi/ir's overload resolution doesn't coerce a mismatched *fixed*
  // socket's actual wired type (see math/mix's row: "c" never participates
  // in generic unification, so a literal wired with a wider type — e.g. a
  // float2 constant — still gets imported as that wider IRType and reaches
  // here as an array). Mirrors interpreter.ts's math/mix exactly, which
  // has the same tolerance: `valueToNumberArray(c)[0] ?? 0`.
  mix: (a: F, b: F, c: F): F => {
    const av = arr(a);
    const bv = arr(b);
    const t = arr(c)[0] ?? 0;
    return scalarize(av.map((item, i) => item + ((bv[i] as number) - item) * t));
  },
  smoothStep: (a: F, b: F, c: F): F => {
    const av = arr(a);
    const bv = arr(b);
    const cv = arr(c);
    return scalarize(
      cv.map((cvv, i) => {
        const avv = av[i] ?? av[0];
        const bvv = bv[i] ?? bv[0];
        const t = Math.min(1, Math.max(0, (cvv - Math.min(avv, bvv)) / Math.abs(bvv - avv)));
        return t * t * (3 - 2 * t);
      })
    );
  },

  // --- comparison ---
  eq: (a: F, b: F): boolean => eqArrays(a, b),
  eqInt: (a: number, b: number): boolean => a === b,
  eqBool: (a: boolean, b: boolean): boolean => a === b,
  lt: (a: number, b: number): boolean => a < b,
  le: (a: number, b: number): boolean => a <= b,
  gt: (a: number, b: number): boolean => a > b,
  ge: (a: number, b: number): boolean => a >= b,

  // --- special ---
  isNaN: (a: F): boolean => arr(a).some((x) => Number.isNaN(x)),
  isInf: (a: F): boolean => arr(a).some((x) => !Number.isFinite(x)),
  select: <T>(condition: boolean, a: T, b: T): T => (condition ? a : b),
  // math/switch's intrinsic lowering (see docs/design/ir-and-transpiler.md):
  // `cases` and `values` are parallel arrays (sorted case-number order, as
  // built by @gltfi/ir's buildMathSwitchExpr); returns the value whose case
  // equals `selection`, else `dflt`.
  switchCase: <T>(selection: number, cases: number[], values: T[], dflt: T): T => {
    const idx = cases.indexOf(selection);
    return idx >= 0 ? values[idx] : dflt;
  },

  // --- trig / hyperbolic / exp ---
  rad: (a: F): F => map1(a, (x) => (x * Math.PI) / 180),
  deg: (a: F): F => map1(a, (x) => (x * 180) / Math.PI),
  sin: (a: F): F => map1(a, Math.sin),
  cos: (a: F): F => map1(a, Math.cos),
  tan: (a: F): F => map1(a, Math.tan),
  asin: (a: F): F => map1(a, Math.asin),
  acos: (a: F): F => map1(a, Math.acos),
  atan: (a: F): F => map1(a, Math.atan),
  atan2: (a: F, b: F): F => map2(a, b, (x, y) => Math.atan2(x, y)),
  sinh: (a: F): F => map1(a, Math.sinh),
  cosh: (a: F): F => map1(a, Math.cosh),
  tanh: (a: F): F => map1(a, Math.tanh),
  asinh: (a: F): F => map1(a, Math.asinh),
  acosh: (a: F): F => map1(a, Math.acosh),
  atanh: (a: F): F => map1(a, Math.atanh),
  pow: (a: F, b: F): F => map2(a, b, (x, y) => Math.pow(x, y)),
  exp: (a: F): F => map1(a, Math.exp),
  log: (a: F): F => map1(a, Math.log),
  log2: (a: F): F => map1(a, Math.log2),
  log10: (a: F): F => map1(a, Math.log10),
  sqrt: (a: F): F => map1(a, Math.sqrt),
  cbrt: (a: F): F => map1(a, Math.cbrt),

  // --- bool / int bitwise ---
  and: (a: boolean, b: boolean): boolean => a && b,
  andInt: (a: number, b: number): number => (a | 0) & (b | 0),
  or: (a: boolean, b: boolean): boolean => a || b,
  orInt: (a: number, b: number): number => (a | 0) | (b | 0),
  not: (a: boolean): boolean => !a,
  notInt: (a: number): number => ~a,
  // Mirrors interpreter.ts's "math/xor" bool branch (added after the
  // differential fuzzer caught it missing — every other bool/int op there
  // special-cases `a.type === "bool"`, xor didn't, so it always returned an
  // int-typed 0/1 result even for genuine bool inputs). `!==` is
  // truth-table-identical to bitwise xor over 0/1 booleans.
  xor: (a: boolean, b: boolean): boolean => a !== b,
  xorInt: (a: number, b: number): number => (a | 0) ^ (b | 0),
  asr: (a: number, b: number): number => (a | 0) >> (b | 0),
  lsl: (a: number, b: number): number => (a | 0) << (b | 0),
  clz: (a: number): number => Math.clz32(a),
  ctz: (a: number): number => ((a | 0) === 0 ? 32 : Math.clz32(a & -a) ^ 31),
  popcnt: (a: number): number => {
    let v = a >>> 0;
    let count = 0;
    while (v) {
      count += v & 1;
      v >>>= 1;
    }
    return count;
  },

  // --- vector ---
  length: (a: number[]): number => Math.hypot(...a),
  normalize: (a: number[]): { value: number[]; isValid: boolean } => {
    if (!a.every(Number.isFinite)) {
      return { value: a.map(() => 0), isValid: false };
    }
    const len = Math.hypot(...a);
    if (!len) {
      return { value: a.map(() => 0), isValid: false };
    }
    return { value: a.map((x) => x / len), isValid: true };
  },
  dot: (a: number[], b: number[]): number => {
    const n = Math.min(a.length, b.length);
    let sum = 0;
    for (let i = 0; i < n; i += 1) {
      sum += a[i] * b[i];
    }
    return sum;
  },
  cross: (a: number[], b: number[]): number[] => crossVec3(a, b),
  rotate2D: (a: number[], angle: number): number[] => kernelRotate2D(a, angle),
  rotate3D: (a: number[], rotation: number[]): number[] => {
    // Spec formula: v' = v + 2*cross(q.xyz, cross(q.xyz, v) + q.w * v),
    // applied without normalizing the quaternion — transcribed from
    // interpreter.ts's "math/rotate3D" case.
    const qx = rotation[0] ?? 0;
    const qy = rotation[1] ?? 0;
    const qz = rotation[2] ?? 0;
    const qw = rotation[3] ?? 1;
    const cx = qy * (a[2] ?? 0) - qz * (a[1] ?? 0) + qw * (a[0] ?? 0);
    const cy = qz * (a[0] ?? 0) - qx * (a[2] ?? 0) + qw * (a[1] ?? 0);
    const cz = qx * (a[1] ?? 0) - qy * (a[0] ?? 0) + qw * (a[2] ?? 0);
    return [
      (a[0] ?? 0) + 2 * (qy * cz - qz * cy),
      (a[1] ?? 0) + 2 * (qz * cx - qx * cz),
      (a[2] ?? 0) + 2 * (qx * cy - qy * cx)
    ];
  },
  transform: (a: number[], b: number[]): number[] => {
    const matrix = a.length === 16 ? a : b;
    const vector = a.length === 16 ? b : a;
    const transformed = transformVec3(matrix, vector);
    return vector.length === 4 ? transformed : transformed.slice(0, 3);
  },
  slerp: (a: number[], b: number[], t: number): number[] => vectorSlerp(a, b, t),

  // --- matrix ---
  transpose: (a: number[]): number[] =>
    matDispatch(
      a,
      (mtx) => [mtx[0], mtx[2], mtx[1], mtx[3]],
      (mtx) => [mtx[0], mtx[3], mtx[6], mtx[1], mtx[4], mtx[7], mtx[2], mtx[5], mtx[8]],
      mat4Transpose
    ),
  determinant: (a: number[]): number => matDispatch(a, mat2Determinant, mat3Determinant, mat4Determinant),
  inverse: (a: number[]): { value: number[]; isValid: boolean } => matDispatch(a, mat2Invert, mat3Invert, mat4Invert),
  matMul: (a: number[], b: number[]): number[] =>
    matDispatch(
      a,
      (mtx) => mat2Mul(mtx, b),
      (mtx) => mat3Mul(mtx, b),
      (mtx) => mat4Mul(mtx, b)
    ),
  matCompose: (translation: number[], rotation: number[], scale: number[]): number[] => mat4Compose(translation, rotation, scale),
  matDecompose: (a: number[]): { translation: number[]; rotation: number[]; scale: number[]; isValid: boolean } => mat4Decompose(a),

  // --- quaternion ---
  quatConjugate: (a: number[]): number[] => [-a[0], -a[1], -a[2], a[3]],
  quatMul: (a: number[], b: number[]): number[] => quatMul(a, b),
  quatAngleBetween: (a: number[], b: number[]): number => quatAngleBetween(a, b),
  quatFromAxisAngle: (axis: number[], angle: number): number[] => quatFromAxisAngle(axis, angle),
  quatToAxisAngle: (a: number[]): { axis: number[]; angle: number } => quatToAxisAngle(a),
  quatFromDirections: (a: number[], b: number[]): number[] => quatFromDirections(a, b),
  quatFromUpForward: (up: number[], forward: number[]): number[] => quatFromUpForward(up, forward),
  // `order` is math/quatFromAngles's plain (non-configSockets) config field
  // — carried by IR's `op` expr `config` field (see model.ts/import.ts) since
  // it isn't a wired socket; the emitter passes it as a 4th literal arg.
  quatFromAngles: (x: number, y: number, z: number, order: string): number[] => {
    const angles: Record<string, number> = { x, y, z };
    const axes: Record<string, number[]> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
    let q = [0, 0, 0, 1];
    for (const axis of order.split("")) {
      q = quatMul(q, quatFromAxisAngle(axes[axis] ?? [0, 0, 0], angles[axis] ?? 0));
    }
    return q;
  },
  quatSlerp: (a: number[], b: number[], t: number): number[] => kernelQuatSlerp(a, b, t),

  // --- color ---
  rgbToOkLCh: (r: number, g: number, b: number): { l: number; c: number; h: number } => {
    const Lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const Mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const Sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const l = 0.2104542553 * Lp + 0.793617785 * Mp - 0.0040720468 * Sp;
    const aLab = 1.9779984951 * Lp - 2.428592205 * Mp + 0.4505937099 * Sp;
    const bLab = 0.0259040371 * Lp + 0.7827717662 * Mp - 0.808675766 * Sp;
    return { l, c: Math.sqrt(aLab * aLab + bLab * bLab), h: Math.atan2(bLab, aLab) };
  },
  rgbFromOkLCh: (l: number, c: number, h: number): { r: number; g: number; b: number } => {
    const aLab = c * Math.cos(h);
    const bLab = c * Math.sin(h);
    const Lp = (l + 0.3963377774 * aLab + 0.2158037573 * bLab) ** 3;
    const Mp = (l - 0.1055613458 * aLab - 0.0638541728 * bLab) ** 3;
    const Sp = (l - 0.0894841775 * aLab - 1.291485548 * bLab) ** 3;
    return {
      r: 4.0767416621 * Lp - 3.3077115913 * Mp + 0.2309699292 * Sp,
      g: -1.2684380046 * Lp + 2.6097574011 * Mp - 0.3413193965 * Sp,
      b: -0.0041960863 * Lp - 0.7034186147 * Mp + 1.707614701 * Sp
    };
  },

  // --- vector/matrix construction & extraction ---
  // Plain array literals/index reads with no computation of their own — see
  // the file header note. Kept as m.* wrapper calls (identity/spread) only
  // so the emitter's "every op call goes through m.*" rule stays uniform.
  combine2: (a: number, b: number): number[] => [a, b],
  combine3: (a: number, b: number, c: number): number[] => [a, b, c],
  combine4: (a: number, b: number, c: number, d: number): number[] => [a, b, c, d],
  combine2x2: (a: number, b: number, c: number, d: number): number[] => [a, b, c, d],
  combine3x3: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number): number[] => [
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    i
  ],
  combine4x4: (...values: number[]): number[] => values,
  extract2: (a: number[]): number[] => a,
  extract3: (a: number[]): number[] => a,
  extract4: (a: number[]): number[] => a,
  extract2x2: (a: number[]): number[] => a,
  extract3x3: (a: number[]): number[] => a,
  extract4x4: (a: number[]): number[] => a,

  // --- ref ---
  refEq: (a: string, b: string): boolean => a === b,

  // --- type conversions ---
  boolToInt: (a: boolean): number => (a ? 1 : 0),
  boolToFloat: (a: boolean): number => (a ? 1 : 0),
  intToBool: (a: number): boolean => a !== 0,
  intToFloat: (a: number): number => a,
  // false iff NaN or +/-0.
  floatToBool: (a: number): boolean => !Number.isNaN(a) && a !== 0,
  // 0 for NaN/+-Inf, else truncate + wrap to int32 (ToInt32 handles both).
  floatToInt: (a: number): number => a | 0
};

export type MathNamespace = typeof m;
