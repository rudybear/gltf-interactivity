-- Pure math helpers, ported by transcription from packages/kernel/src/
-- math.ts (quaternion/matrix algebra, spherical interpolation, easing).
-- Vectors/matrices are 1-based Lua tables (t[1]..t[n]) here — Lua's native
-- convention — unlike the TS source's 0-based JS arrays; every literal
-- index below is the TS source's index + 1. Column-major, same as the TS
-- source.

function kmath_hypot(...)
  local args = { ... }
  local sum = 0
  for _, v in ipairs(args) do
    sum = sum + v * v
  end
  return math.sqrt(sum)
end

function kmath_quatNormalize(q)
  local len = kmath_hypot(q[1], q[2], q[3], q[4])
  if len == 0 then len = 1 end
  return { q[1] / len, q[2] / len, q[3] / len, q[4] / len }
end

function kmath_quatMul(a, b)
  local ax, ay, az, aw = a[1], a[2], a[3], a[4]
  local bx, by, bz, bw = b[1], b[2], b[3], b[4]
  return {
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz
  }
end

function kmath_vectorSlerp(a, b, t)
  local n = math.max(#a, #b)
  local la = 0
  for i = 1, #a do la = la + a[i] * a[i] end
  la = math.sqrt(la)
  local lb = 0
  for i = 1, #b do lb = lb + b[i] * b[i] end
  lb = math.sqrt(lb)
  if la == 0 or lb == 0 then
    local out = {}
    for i = 1, n do
      local ai = a[i] or 0
      local bi = b[i] or 0
      out[i] = ai + (bi - ai) * t
    end
    return out
  end
  local na, nb = {}, {}
  for i = 1, #a do na[i] = a[i] / la end
  for i = 1, #b do nb[i] = b[i] / lb end
  local mag = la + (lb - la) * t
  local d = 0
  for i = 1, #na do d = d + na[i] * (nb[i] or 0) end
  d = math.min(1, math.max(-1, d))
  if d > 1 - 1e-6 then
    local lerped = {}
    for i = 1, n do
      local nai = na[i] or 0
      local nbi = nb[i] or 0
      lerped[i] = nai + (nbi - nai) * t
    end
    local len = 0
    for i = 1, #lerped do len = len + lerped[i] * lerped[i] end
    len = math.sqrt(len)
    if len == 0 then len = 1 end
    local out = {}
    for i = 1, #lerped do out[i] = (lerped[i] / len) * mag end
    return out
  end
  local omega = math.acos(d)
  local sinOmega = math.sin(omega)
  local ka = math.sin(omega * (1 - t)) / sinOmega
  local kb = math.sin(omega * t) / sinOmega
  local out = {}
  for i = 1, n do
    out[i] = ((na[i] or 0) * ka + (nb[i] or 0) * kb) * mag
  end
  return out
end

function kmath_quatSlerp(a, b, t)
  local cosTheta = a[1] * b[1] + a[2] * b[2] + a[3] * b[3] + a[4] * b[4]
  local bx, by, bz, bw = b[1], b[2], b[3], b[4]
  if cosTheta < 0 then
    cosTheta = -cosTheta
    bx, by, bz, bw = -bx, -by, -bz, -bw
  end
  if cosTheta > 0.9995 then
    return kmath_quatNormalize({
      a[1] + t * (bx - a[1]),
      a[2] + t * (by - a[2]),
      a[3] + t * (bz - a[3]),
      a[4] + t * (bw - a[4])
    })
  end
  local angle = math.acos(math.max(-1, math.min(1, cosTheta)))
  local sinTheta = math.sin(angle)
  local w1 = math.sin((1 - t) * angle) / sinTheta
  local w2 = math.sin(t * angle) / sinTheta
  return {
    a[1] * w1 + bx * w2,
    a[2] * w1 + by * w2,
    a[3] * w1 + bz * w2,
    a[4] * w1 + bw * w2
  }
end

function kmath_mat4Identity()
  return { 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 }
end

function kmath_mat2Mul(a, b)
  return {
    a[1] * b[1] + a[3] * b[2],
    a[2] * b[1] + a[4] * b[2],
    a[1] * b[3] + a[3] * b[4],
    a[2] * b[3] + a[4] * b[4]
  }
end

function kmath_mat2Determinant(m)
  return m[1] * m[4] - m[2] * m[3]
end

function kmath_mat2Invert(m)
  local det = kmath_mat2Determinant(m)
  if det == 0 or det ~= det or det == math.huge or det == -math.huge then
    return { 0 / 0, 0 / 0, 0 / 0, 0 / 0 }, false
  end
  local inv = 1 / det
  return { m[4] * inv, -m[2] * inv, -m[3] * inv, m[1] * inv }, true
end

function kmath_mat3Mul(a, b)
  local out = { 0, 0, 0, 0, 0, 0, 0, 0, 0 }
  for i = 0, 2 do
    for j = 0, 2 do
      out[i + j * 3 + 1] =
        a[i + 1] * b[j * 3 + 1] +
        a[i + 3 + 1] * b[j * 3 + 1 + 1] +
        a[i + 6 + 1] * b[j * 3 + 2 + 1]
    end
  end
  return out
end

function kmath_mat3Determinant(m)
  return m[1] * (m[5] * m[9] - m[6] * m[8])
    - m[4] * (m[2] * m[9] - m[3] * m[8])
    + m[7] * (m[2] * m[6] - m[3] * m[5])
end

function kmath_mat3Invert(m)
  local det = kmath_mat3Determinant(m)
  if det == 0 or det ~= det or det == math.huge or det == -math.huge then
    return { 0 / 0, 0 / 0, 0 / 0, 0 / 0, 0 / 0, 0 / 0, 0 / 0, 0 / 0, 0 / 0 }, false
  end
  local inv = 1 / det
  return {
    (m[5] * m[9] - m[6] * m[8]) * inv,
    (m[3] * m[8] - m[2] * m[9]) * inv,
    (m[2] * m[6] - m[3] * m[5]) * inv,
    (m[6] * m[7] - m[4] * m[9]) * inv,
    (m[1] * m[9] - m[3] * m[7]) * inv,
    (m[3] * m[4] - m[1] * m[6]) * inv,
    (m[4] * m[8] - m[5] * m[7]) * inv,
    (m[2] * m[7] - m[1] * m[8]) * inv,
    (m[1] * m[5] - m[2] * m[4]) * inv
  }, true
end

function kmath_mat4Mul(a, b)
  local out = {}
  for i = 0, 15 do out[i + 1] = 0 end
  for i = 0, 3 do
    for j = 0, 3 do
      out[i + j * 4 + 1] =
        a[i + 1] * b[j * 4 + 1] +
        a[i + 4 + 1] * b[j * 4 + 1 + 1] +
        a[i + 8 + 1] * b[j * 4 + 2 + 1] +
        a[i + 12 + 1] * b[j * 4 + 3 + 1]
    end
  end
  return out
end

function kmath_mat4Transpose(m)
  return {
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
    m[4], m[8], m[12], m[16]
  }
end

function kmath_mat4Determinant(m)
  local a00, a01, a02, a03 = m[1], m[2], m[3], m[4]
  local a10, a11, a12, a13 = m[5], m[6], m[7], m[8]
  local a20, a21, a22, a23 = m[9], m[10], m[11], m[12]
  local a30, a31, a32, a33 = m[13], m[14], m[15], m[16]
  local b00 = a00 * a11 - a01 * a10
  local b01 = a00 * a12 - a02 * a10
  local b02 = a00 * a13 - a03 * a10
  local b03 = a01 * a12 - a02 * a11
  local b04 = a01 * a13 - a03 * a11
  local b05 = a02 * a13 - a03 * a12
  local b06 = a20 * a31 - a21 * a30
  local b07 = a20 * a32 - a22 * a30
  local b08 = a20 * a33 - a23 * a30
  local b09 = a21 * a32 - a22 * a31
  local b10 = a21 * a33 - a23 * a31
  local b11 = a22 * a33 - a23 * a32
  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
end

function kmath_mat4Invert(m)
  local out = {}
  for i = 1, 16 do out[i] = 0 end
  local a00, a01, a02, a03 = m[1], m[2], m[3], m[4]
  local a10, a11, a12, a13 = m[5], m[6], m[7], m[8]
  local a20, a21, a22, a23 = m[9], m[10], m[11], m[12]
  local a30, a31, a32, a33 = m[13], m[14], m[15], m[16]

  local b00 = a00 * a11 - a01 * a10
  local b01 = a00 * a12 - a02 * a10
  local b02 = a00 * a13 - a03 * a10
  local b03 = a01 * a12 - a02 * a11
  local b04 = a01 * a13 - a03 * a11
  local b05 = a02 * a13 - a03 * a12
  local b06 = a20 * a31 - a21 * a30
  local b07 = a20 * a32 - a22 * a30
  local b08 = a20 * a33 - a23 * a30
  local b09 = a21 * a32 - a22 * a31
  local b10 = a21 * a33 - a23 * a31
  local b11 = a22 * a33 - a23 * a32

  local det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
  -- Mirrors the TS source's `if (!det)` exactly: rejects 0 and NaN, but NOT
  -- Infinity (deliberately less strict than mat2Invert/mat3Invert's own
  -- `!det || !Number.isFinite(det)` checks above — this asymmetry is in the
  -- TS oracle itself, not a port bug).
  if det == 0 or det ~= det then
    return kmath_mat4Identity(), false
  end
  det = 1.0 / det

  out[1] = (a11 * b11 - a12 * b10 + a13 * b09) * det
  out[2] = (a02 * b10 - a01 * b11 - a03 * b09) * det
  out[3] = (a31 * b05 - a32 * b04 + a33 * b03) * det
  out[4] = (a22 * b04 - a21 * b05 - a23 * b03) * det
  out[5] = (a12 * b08 - a10 * b11 - a13 * b07) * det
  out[6] = (a00 * b11 - a02 * b08 + a03 * b07) * det
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det
  out[8] = (a20 * b05 - a22 * b02 + a23 * b01) * det
  out[9] = (a10 * b10 - a11 * b08 + a13 * b06) * det
  out[10] = (a01 * b08 - a00 * b10 - a03 * b06) * det
  out[11] = (a30 * b04 - a31 * b02 + a33 * b00) * det
  out[12] = (a21 * b02 - a20 * b04 - a23 * b00) * det
  out[13] = (a11 * b07 - a10 * b09 - a12 * b06) * det
  out[14] = (a00 * b09 - a01 * b07 + a02 * b06) * det
  out[15] = (a31 * b01 - a30 * b03 - a32 * b00) * det
  out[16] = (a20 * b03 - a21 * b01 + a22 * b00) * det

  return out, true
end

function kmath_mat4Compose(translation, rotation, scale)
  local tx, ty, tz = translation[1], translation[2], translation[3]
  local qx, qy, qz, qw = rotation[1], rotation[2], rotation[3], rotation[4]
  local sx, sy, sz = scale[1], scale[2], scale[3]
  local x2 = qx + qx
  local y2 = qy + qy
  local z2 = qz + qz
  local xx = qx * x2
  local xy = qx * y2
  local xz = qx * z2
  local yy = qy * y2
  local yz = qy * z2
  local zz = qz * z2
  local wx = qw * x2
  local wy = qw * y2
  local wz = qw * z2
  return {
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
  }
end

function kmath_mat4Decompose(mat)
  local translationOut = { mat[13], mat[14], mat[15] }
  local sx = kmath_hypot(mat[1], mat[2], mat[3])
  local sy = kmath_hypot(mat[5], mat[6], mat[7])
  local sz = kmath_hypot(mat[9], mat[10], mat[11])
  local function finite(x) return x == x and x ~= math.huge and x ~= -math.huge end
  if not finite(sx) or not finite(sy) or not finite(sz) or sx == 0 or sy == 0 or sz == 0 then
    return { translation = translationOut, rotation = { 0, 0, 0, 1 }, scale = { sx, sy, sz } }, false
  end
  local b00 = mat[1] / sx
  local b10 = mat[2] / sx
  local b20 = mat[3] / sx
  local b01 = mat[5] / sy
  local b11 = mat[6] / sy
  local b21 = mat[7] / sy
  local b02 = mat[9] / sz
  local b12 = mat[10] / sz
  local b22 = mat[11] / sz
  local det = b00 * (b11 * b22 - b12 * b21) - b01 * (b10 * b22 - b12 * b20) + b02 * (b10 * b21 - b11 * b20)
  local scale = { sx, sy, sz }
  if det < 0 then
    scale = { -sx, sy, sz }
    b00, b10, b20 = -b00, -b10, -b20
  end
  local trace = b00 + b11 + b22
  local rotation
  if trace > 0 then
    local s = math.sqrt(trace + 1) * 2
    rotation = { (b21 - b12) / s, (b02 - b20) / s, (b10 - b01) / s, 0.25 * s }
  elseif b00 > b11 and b00 > b22 then
    local s = math.sqrt(1 + b00 - b11 - b22) * 2
    rotation = { 0.25 * s, (b01 + b10) / s, (b02 + b20) / s, (b21 - b12) / s }
  elseif b11 > b22 then
    local s = math.sqrt(1 + b11 - b00 - b22) * 2
    rotation = { (b01 + b10) / s, 0.25 * s, (b12 + b21) / s, (b02 - b20) / s }
  else
    local s = math.sqrt(1 + b22 - b00 - b11) * 2
    rotation = { (b02 + b20) / s, (b12 + b21) / s, 0.25 * s, (b10 - b01) / s }
  end
  return { translation = translationOut, rotation = kmath_quatNormalize(rotation), scale = scale }, true
end

function kmath_transformVec3(mat, vec)
  local x = vec[1]
  local y = vec[2]
  local z = vec[3]
  local w = (#vec > 3) and vec[4] or 1
  return {
    mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w,
    mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w,
    mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w,
    mat[4] * x + mat[8] * y + mat[12] * z + mat[16] * w
  }
end

function kmath_quatFromAxisAngle(axis, angle)
  local x, y, z = axis[1], axis[2], axis[3]
  local len = kmath_hypot(x, y, z)
  if len == 0 then len = 1 end
  local half = angle / 2
  local s = math.sin(half) / len
  return kmath_quatNormalize({ x * s, y * s, z * s, math.cos(half) })
end

function kmath_quatToAxisAngle(quat)
  local q = kmath_quatNormalize(quat)
  local angle = 2 * math.acos(math.max(-1, math.min(1, q[4])))
  local s = math.sqrt(1 - q[4] * q[4])
  if s < 0.0001 then
    return { 1, 0, 0 }, angle
  end
  return { q[1] / s, q[2] / s, q[3] / s }, angle
end

function kmath_normalizeVec3(a)
  local len = kmath_hypot(a[1], a[2], a[3])
  if len == 0 then len = 1 end
  return { a[1] / len, a[2] / len, a[3] / len }
end

function kmath_crossVec3(a, b)
  return {
    a[2] * b[3] - a[3] * b[2],
    a[3] * b[1] - a[1] * b[3],
    a[1] * b[2] - a[2] * b[1]
  }
end

function kmath_quatFromDirections(a, b)
  local v1 = kmath_normalizeVec3(a)
  local v2 = kmath_normalizeVec3(b)
  local dot = v1[1] * v2[1] + v1[2] * v2[2] + v1[3] * v2[3]
  if dot < -0.999999 then
    local axis = (math.abs(v1[1]) > 0.1) and { 0, 1, 0 } or { 1, 0, 0 }
    local cross = kmath_crossVec3(v1, axis)
    return kmath_quatFromAxisAngle(cross, math.pi)
  end
  local cross = kmath_crossVec3(v1, v2)
  return kmath_quatNormalize({ cross[1], cross[2], cross[3], 1 + dot })
end

function kmath_quatFromUpForward(up, forward)
  local r = kmath_normalizeVec3(forward)
  local y = kmath_normalizeVec3(up)
  local s = kmath_crossVec3(y, r)
  local sLen = kmath_hypot(s[1], s[2], s[3])
  if sLen < 1e-5 then
    local axis = (math.abs(r[2]) < 0.9) and { 0, 1, 0 } or { 1, 0, 0 }
    s = kmath_crossVec3(axis, r)
  end
  s = kmath_normalizeVec3(s)
  local t = kmath_crossVec3(r, s)
  local m00, m01, m02 = s[1], t[1], r[1]
  local m10, m11, m12 = s[2], t[2], r[2]
  local m20, m21, m22 = s[3], t[3], r[3]
  local trace = m00 + m11 + m22
  local q
  if trace > 0 then
    local s2 = math.sqrt(trace + 1) * 2
    q = { (m21 - m12) / s2, (m02 - m20) / s2, (m10 - m01) / s2, 0.25 * s2 }
  elseif m00 > m11 and m00 > m22 then
    local s2 = math.sqrt(1 + m00 - m11 - m22) * 2
    q = { 0.25 * s2, (m01 + m10) / s2, (m02 + m20) / s2, (m21 - m12) / s2 }
  elseif m11 > m22 then
    local s2 = math.sqrt(1 + m11 - m00 - m22) * 2
    q = { (m01 + m10) / s2, 0.25 * s2, (m12 + m21) / s2, (m02 - m20) / s2 }
  else
    local s2 = math.sqrt(1 + m22 - m00 - m11) * 2
    q = { (m02 + m20) / s2, (m12 + m21) / s2, 0.25 * s2, (m10 - m01) / s2 }
  end
  return kmath_quatNormalize(q)
end

function kmath_quatAngleBetween(a, b)
  local qa = kmath_quatNormalize(a)
  local qb = kmath_quatNormalize(b)
  local dot = qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3] + qa[4] * qb[4]
  return math.acos(math.min(1, math.abs(dot))) * 2
end

function kmath_rotate2D(v, angle)
  local c = math.cos(angle)
  local s = math.sin(angle)
  return { v[1] * c - v[2] * s, v[1] * s + v[2] * c }
end

-- Cubic-bezier easing (CSS-style control points), solved by bisection.
function kmath_cubicBezierEase(t, p1, p2)
  if t <= 0 then return 0 end
  if t >= 1 then return 1 end
  local function sample(s, c1, c2)
    local u = 1 - s
    return 3 * u * u * s * c1 + 3 * u * s * s * c2 + s * s * s
  end
  local lo, hi = 0, 1
  for _ = 1, 48 do
    local mid = (lo + hi) / 2
    if sample(mid, p1[1], p2[1]) < t then
      lo = mid
    else
      hi = mid
    end
  end
  return sample((lo + hi) / 2, p1[2], p2[2])
end
