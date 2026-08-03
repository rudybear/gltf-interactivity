// Pure math helpers used by the KHR_interactivity op set: quaternion and
// matrix algebra, spherical interpolation, and easing. Environment-neutral,
// no dependency on the value model or runtime state.

export function quatNormalize(q: number[]): number[] {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

export function quatMul(a: number[], b: number[]): number[] {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  const bx = b[0], by = b[1], bz = b[2], bw = b[3];
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz
  ];
}

// Spherical interpolation of arbitrary vectors: slerp the normalized
// directions, linearly interpolate the magnitudes.
export function vectorSlerp(a: number[], b: number[], t: number): number[] {
  const la = Math.hypot(...a);
  const lb = Math.hypot(...b);
  if (!la || !lb) {
    return a.map((item, index) => item + ((b[index] ?? 0) - item) * t);
  }
  const na = a.map((item) => item / la);
  const nb = b.map((item) => item / lb);
  const mag = la + (lb - la) * t;
  let d = na.reduce((sum, item, index) => sum + item * nb[index], 0);
  d = Math.min(1, Math.max(-1, d));
  if (d > 1 - 1e-6) {
    const lerped = na.map((item, index) => item + (nb[index] - item) * t);
    const len = Math.hypot(...lerped) || 1;
    return lerped.map((item) => (item / len) * mag);
  }
  const omega = Math.acos(d);
  const sinOmega = Math.sin(omega);
  const ka = Math.sin(omega * (1 - t)) / sinOmega;
  const kb = Math.sin(omega * t) / sinOmega;
  return na.map((item, index) => (item * ka + nb[index] * kb) * mag);
}

export function quatSlerp(a: number[], b: number[], t: number): number[] {
  let cosTheta = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bx = b[0];
  let by = b[1];
  let bz = b[2];
  let bw = b[3];
  if (cosTheta < 0) {
    cosTheta = -cosTheta;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (cosTheta > 0.9995) {
    return quatNormalize([
      a[0] + t * (bx - a[0]),
      a[1] + t * (by - a[1]),
      a[2] + t * (bz - a[2]),
      a[3] + t * (bw - a[3])
    ]);
  }
  const angle = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const sinTheta = Math.sin(angle);
  const w1 = Math.sin((1 - t) * angle) / sinTheta;
  const w2 = Math.sin(t * angle) / sinTheta;
  return [
    a[0] * w1 + bx * w2,
    a[1] * w1 + by * w2,
    a[2] * w1 + bz * w2,
    a[3] * w1 + bw * w2
  ];
}
export function mat4Identity(): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

// 2x2/3x3 matrices are column-major, matching the 4x4 convention.
export function mat2Mul(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3]
  ];
}

export function mat2Determinant(m: number[]): number {
  return m[0] * m[3] - m[1] * m[2];
}

export function mat2Invert(m: number[]): { value: number[]; isValid: boolean } {
  const det = mat2Determinant(m);
  if (!det || !Number.isFinite(det)) {
    return { value: [NaN, NaN, NaN, NaN], isValid: false };
  }
  const inv = 1 / det;
  return { value: [m[3] * inv, -m[1] * inv, -m[2] * inv, m[0] * inv], isValid: true };
}

export function mat3Mul(a: number[], b: number[]): number[] {
  const out = new Array(9).fill(0);
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      out[i + j * 3] =
        a[i] * b[j * 3] +
        a[i + 3] * b[j * 3 + 1] +
        a[i + 6] * b[j * 3 + 2];
    }
  }
  return out;
}

export function mat3Determinant(m: number[]): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[3] * (m[1] * m[8] - m[2] * m[7]) +
    m[6] * (m[1] * m[5] - m[2] * m[4])
  );
}

export function mat3Invert(m: number[]): { value: number[]; isValid: boolean } {
  const det = mat3Determinant(m);
  if (!det || !Number.isFinite(det)) {
    return { value: new Array(9).fill(NaN), isValid: false };
  }
  const inv = 1 / det;
  return {
    value: [
      (m[4] * m[8] - m[5] * m[7]) * inv,
      (m[2] * m[7] - m[1] * m[8]) * inv,
      (m[1] * m[5] - m[2] * m[4]) * inv,
      (m[5] * m[6] - m[3] * m[8]) * inv,
      (m[0] * m[8] - m[2] * m[6]) * inv,
      (m[2] * m[3] - m[0] * m[5]) * inv,
      (m[3] * m[7] - m[4] * m[6]) * inv,
      (m[1] * m[6] - m[0] * m[7]) * inv,
      (m[0] * m[4] - m[1] * m[3]) * inv
    ],
    isValid: true
  };
}

export function mat4Mul(a: number[], b: number[]): number[] {
  const out = new Array(16).fill(0);
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      out[i + j * 4] =
        a[i] * b[j * 4] +
        a[i + 4] * b[j * 4 + 1] +
        a[i + 8] * b[j * 4 + 2] +
        a[i + 12] * b[j * 4 + 3];
    }
  }
  return out;
}

export function mat4Transpose(m: number[]): number[] {
  return [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15]
  ];
}

export function mat4Determinant(m: number[]): number {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}

export function mat4Invert(m: number[]): { value: number[]; isValid: boolean } {
  const out = new Array(16).fill(0);
  const a00 = m[0];
  const a01 = m[1];
  const a02 = m[2];
  const a03 = m[3];
  const a10 = m[4];
  const a11 = m[5];
  const a12 = m[6];
  const a13 = m[7];
  const a20 = m[8];
  const a21 = m[9];
  const a22 = m[10];
  const a23 = m[11];
  const a30 = m[12];
  const a31 = m[13];
  const a32 = m[14];
  const a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return { value: mat4Identity(), isValid: false };
  }
  det = 1.0 / det;

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

  return { value: out, isValid: true };
}

export function mat4Compose(translation: number[], rotation: number[], scale: number[]): number[] {
  const [tx, ty, tz] = translation;
  const [qx, qy, qz, qw] = rotation;
  const [sx, sy, sz] = scale;
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx,
    (xy + wz) * sx,
    (xz - wy) * sx,
    0,
    (xy - wz) * sy,
    (1 - (xx + zz)) * sy,
    (yz + wx) * sy,
    0,
    (xz + wy) * sz,
    (yz - wx) * sz,
    (1 - (xx + yy)) * sz,
    0,
    tx,
    ty,
    tz,
    1
  ];
}

export function mat4Decompose(mat: number[]): { translation: number[]; rotation: number[]; scale: number[]; isValid: boolean } {
  // Per spec: the bottom row is ignored, translation is always emitted, and
  // degenerate scales (NaN/infinite/zero column lengths) are emitted as-is
  // with an identity rotation.
  const translationOut = [mat[12], mat[13], mat[14]];
  const sx = Math.hypot(mat[0], mat[1], mat[2]);
  const sy = Math.hypot(mat[4], mat[5], mat[6]);
  const sz = Math.hypot(mat[8], mat[9], mat[10]);
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz) || sx === 0 || sy === 0 || sz === 0) {
    return { translation: translationOut, rotation: [0, 0, 0, 1], scale: [sx, sy, sz], isValid: false };
  }
  let b00 = mat[0] / sx;
  let b10 = mat[1] / sx;
  let b20 = mat[2] / sx;
  let b01 = mat[4] / sy;
  let b11 = mat[5] / sy;
  let b21 = mat[6] / sy;
  let b02 = mat[8] / sz;
  let b12 = mat[9] / sz;
  let b22 = mat[10] / sz;
  const det = b00 * (b11 * b22 - b12 * b21) - b01 * (b10 * b22 - b12 * b20) + b02 * (b10 * b21 - b11 * b20);
  const translation = translationOut;
  let scale = [sx, sy, sz];
  if (det < 0) {
    scale = [-sx, sy, sz];
    b00 = -b00;
    b10 = -b10;
    b20 = -b20;
  }
  const trace = b00 + b11 + b22;
  let rotation: number[];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    rotation = [(b21 - b12) / s, (b02 - b20) / s, (b10 - b01) / s, 0.25 * s];
  } else if (b00 > b11 && b00 > b22) {
    const s = Math.sqrt(1 + b00 - b11 - b22) * 2;
    rotation = [0.25 * s, (b01 + b10) / s, (b02 + b20) / s, (b21 - b12) / s];
  } else if (b11 > b22) {
    const s = Math.sqrt(1 + b11 - b00 - b22) * 2;
    rotation = [(b01 + b10) / s, 0.25 * s, (b12 + b21) / s, (b02 - b20) / s];
  } else {
    const s = Math.sqrt(1 + b22 - b00 - b11) * 2;
    rotation = [(b02 + b20) / s, (b12 + b21) / s, 0.25 * s, (b10 - b01) / s];
  }
  return { translation, rotation: quatNormalize(rotation), scale, isValid: true };
}

export function transformVec3(mat: number[], vec: number[]): number[] {
  const x = vec[0];
  const y = vec[1];
  const z = vec[2];
  const w = vec.length > 3 ? vec[3] : 1;
  return [
    mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w,
    mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w,
    mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w,
    mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w
  ];
}

export function quatFromAxisAngle(axis: number[], angle: number): number[] {
  const [x, y, z] = axis;
  const len = Math.hypot(x, y, z) || 1;
  const half = angle / 2;
  const s = Math.sin(half) / len;
  return quatNormalize([x * s, y * s, z * s, Math.cos(half)]);
}

export function quatToAxisAngle(quat: number[]): { axis: number[]; angle: number } {
  const q = quatNormalize(quat);
  const angle = 2 * Math.acos(Math.max(-1, Math.min(1, q[3])));
  const s = Math.sqrt(1 - q[3] * q[3]);
  if (s < 0.0001) {
    return { axis: [1, 0, 0], angle };
  }
  return { axis: [q[0] / s, q[1] / s, q[2] / s], angle };
}

export function quatFromDirections(a: number[], b: number[]): number[] {
  const v1 = normalizeVec3(a);
  const v2 = normalizeVec3(b);
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  if (dot < -0.999999) {
    const axis = Math.abs(v1[0]) > 0.1 ? [0, 1, 0] : [1, 0, 0];
    const cross = crossVec3(v1, axis);
    return quatFromAxisAngle(cross, Math.PI);
  }
  const cross = crossVec3(v1, v2);
  return quatNormalize([cross[0], cross[1], cross[2], 1 + dot]);
}

export function quatFromUpForward(up: number[], forward: number[]): number[] {
  const r = normalizeVec3(forward);
  const y = normalizeVec3(up);
  let s = crossVec3(y, r);
  const sLen = Math.hypot(s[0], s[1], s[2]);
  if (sLen < 1e-5) {
    const axis = Math.abs(r[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    s = crossVec3(axis, r);
  }
  s = normalizeVec3(s);
  const t = crossVec3(r, s);
  const m00 = s[0], m01 = t[0], m02 = r[0];
  const m10 = s[1], m11 = t[1], m12 = r[1];
  const m20 = s[2], m21 = t[2], m22 = r[2];
  const trace = m00 + m11 + m22;
  let q: number[];
  if (trace > 0) {
    const s2 = Math.sqrt(trace + 1) * 2;
    q = [(m21 - m12) / s2, (m02 - m20) / s2, (m10 - m01) / s2, 0.25 * s2];
  } else if (m00 > m11 && m00 > m22) {
    const s2 = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = [0.25 * s2, (m01 + m10) / s2, (m02 + m20) / s2, (m21 - m12) / s2];
  } else if (m11 > m22) {
    const s2 = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = [(m01 + m10) / s2, 0.25 * s2, (m12 + m21) / s2, (m02 - m20) / s2];
  } else {
    const s2 = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = [(m02 + m20) / s2, (m12 + m21) / s2, 0.25 * s2, (m10 - m01) / s2];
  }
  return quatNormalize(q);
}

export function quatAngleBetween(a: number[], b: number[]): number {
  const qa = quatNormalize(a);
  const qb = quatNormalize(b);
  const dot = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3];
  return Math.acos(Math.min(1, Math.abs(dot))) * 2;
}

export function normalizeVec3(a: number[]): number[] {
  const len = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / len, a[1] / len, a[2] / len];
}

export function crossVec3(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

export function rotate2D(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

// Cubic-bezier easing (CSS-style control points), solved by bisection on the
// parametric x(s) curve to find s such that x(s) = t, then evaluating y(s).
export function cubicBezierEase(t: number, p1: [number, number], p2: [number, number]): number {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  const sample = (s: number, c1: number, c2: number) => {
    const u = 1 - s;
    return 3 * u * u * s * c1 + 3 * u * s * s * c2 + s * s * s;
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    if (sample(mid, p1[0], p2[0]) < t) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return sample((lo + hi) / 2, p1[1], p2[1]);
}
