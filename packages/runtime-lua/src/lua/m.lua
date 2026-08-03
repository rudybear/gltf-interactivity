-- Raw-Lua math/type/ref namespace for the compiled (emit-lua) output.
-- Transcribed from packages/runtime-lib/src/math.ts (which itself mirrors
-- packages/runtime/src/interpreter.ts's evaluateNode switch exactly) —
-- component-wise F-family mapping with NaN propagation, int32 wrapping,
-- div-by-0 -> 0, ctz(0)=32, unsigned popcnt. F = Lua number (scalar) or a
-- 1-based Lua table (vector/matrix) — same F union math.ts uses, just
-- Lua's native array convention instead of JS's 0-based one (see kmath.lua's
-- header note; every index literal below is +1 vs the TS source).
--
-- Multi-output ops (normalize, inverse, matDecompose, quatToAxisAngle,
-- rgbToOkLCh/rgbFromOkLCh) return a single Lua table keyed by output-socket
-- name (value/isValid, translation/rotation/scale/isValid, axis/angle,
-- l/c/h, r/g/b) — emit-lua's emitOp does `m.foo(...).value` / `.isValid` /
-- etc, a straight dot-property read exactly like emit-ts's TS output, so
-- the *shape* m.* returns must match, even though Lua has native multiple
-- return values (which wouldn't support that dot-access syntax).
--
-- math/random is NOT here (needs per-engine-instance LCG state — see
-- engine.lua's `rt.random()`). math/combine*/extract* are also not here —
-- with vectors as plain 1-based tables, combine is exactly a table literal
-- and extract is exactly the identity; emit-lua emits those directly.

m = {}

-- Mirrors ECMAScript's ToInt32 exactly: NaN/+-Infinity -> 0; else
-- sign(x)*floor(abs(x)), reduced modulo 2^32 into the signed int32 range.
-- Lua 5.4's `%` on floats is floored modulo (a - floor(a/b)*b), so
-- `posInt % 4294967296` already lands in [0, 2^32) regardless of sign —
-- exactly ECMAScript's "modulo 2^32" step — and 2^32 fits exactly in a
-- double (well under 2^53), so this is exact, not an approximation.
function m.toInt32(x)
  if x ~= x or x == math.huge or x == -math.huge then
    return 0
  end
  local sign = 1
  if x < 0 then sign = -1 end
  local posInt = sign * math.floor(math.abs(x))
  local n = posInt % 4294967296
  if n >= 2147483648 then
    n = n - 4294967296
  end
  return n
end
local i32 = m.toInt32

local function isTable(x)
  return type(x) == "table"
end

local function arr(x)
  if isTable(x) then return x end
  return { x }
end

local function scalarize(out)
  if #out == 1 then return out[1] end
  return out
end

-- Mirrors @gltfi/kernel's value.ts `broadcast` exactly.
local function broadcast(a, b)
  local la, lb = #a, #b
  if la == lb then return a, b end
  if la == 1 then
    local bb = {}
    for i = 1, lb do bb[i] = a[1] end
    return bb, b
  end
  if lb == 1 then
    local aa = {}
    for i = 1, la do aa[i] = b[1] end
    return a, aa
  end
  return a, b
end

local function map1(a, f)
  if isTable(a) then
    local out = {}
    for i = 1, #a do out[i] = f(a[i]) end
    return out
  end
  return f(a)
end

local function map2(a, b, f)
  local left, right = broadcast(arr(a), arr(b))
  local out = {}
  for i = 1, #left do
    local r = right[i]
    if r == nil then r = right[1] end
    if r == nil then r = 0 end
    out[i] = f(left[i], r)
  end
  return scalarize(out)
end

local function eqArrays(a, b)
  local left, right = broadcast(arr(a), arr(b))
  for i = 1, #left do
    local r = right[i]
    if r == nil then r = right[1] end
    if left[i] ~= r then return false end
  end
  return true
end

local function matDispatch(a, f2, f3, f4)
  local n = #a
  if n == 4 then return f2(a) end
  if n == 9 then return f3(a) end
  return f4(a)
end

-- Lua has no builtin sign(); matches Math.sign (NaN -> NaN, 0/-0 -> itself).
local function fsign(x)
  if x ~= x then return x end
  if x > 0 then return 1 end
  if x < 0 then return -1 end
  return x
end

local function ftrunc(x)
  if x >= 0 then return math.floor(x) end
  return math.ceil(x)
end

-- --- constants ---
m.E = function() return math.exp(1) end
m.Pi = function() return math.pi end
m.Tau = function() return 2 * math.pi end
m.Inf = function() return math.huge end
m.NaN = function() return 0 / 0 end

-- --- float arith (component-wise F, NaN-propagating) ---
m.abs = function(a) return map1(a, math.abs) end
m.absInt = function(a) return i32(math.abs(a)) end
m.sign = function(a) return map1(a, fsign) end
m.signInt = function(a) return i32(fsign(a)) end
m.trunc = function(a) return map1(a, ftrunc) end
m.floor = function(a) return map1(a, math.floor) end
m.ceil = function(a) return map1(a, math.ceil) end
m.round = function(a) return map1(a, function(x) return fsign(x) * math.floor(math.abs(x) + 0.5) end) end
m.fract = function(a) return map1(a, function(x) return x - math.floor(x) end) end
m.neg = function(a) return map1(a, function(x) return -x end) end
m.negInt = function(a) return i32(-a) end
m.saturate = function(a) return map1(a, function(x) return math.min(math.max(x, 0), 1) end) end
m.add = function(a, b) return map2(a, b, function(x, y) return x + y end) end
m.addInt = function(a, b) return i32(a + b) end
m.sub = function(a, b) return map2(a, b, function(x, y) return x - y end) end
m.subInt = function(a, b) return i32(a - b) end
m.mul = function(a, b) return map2(a, b, function(x, y) return x * y end) end
m.mulInt = function(a, b) return i32(a * b) end
m.div = function(a, b) return map2(a, b, function(x, y) return x / y end) end
m.divInt = function(a, b) return i32(a / b) end
-- `+ 0.0` forces both operands to Lua's FLOAT subtype before calling
-- math.fmod: Lua 5.4's fmod, given two INTEGER-subtype operands with a
-- zero divisor, raises a hard Lua error ("bad argument #2 to 'fmod'
-- (zero)") instead of returning anything — unlike the float path, which
-- returns NaN, matching JS's `x % 0 === NaN` (and unlike `m.toInt32`
-- elsewhere in this file, whose own math.floor-based arithmetic can
-- legitimately narrow a whole-valued float back to Lua's integer
-- subtype — see its header note — so an "Int"-suffixed op's operands here
-- are NOT guaranteed to already be floats).
m.rem = function(a, b) return map2(a, b, function(x, y) return math.fmod(x + 0.0, y + 0.0) end) end
m.remInt = function(a, b) return i32(math.fmod(a + 0.0, b + 0.0)) end
m.min = function(a, b) return map2(a, b, function(x, y) return math.min(x, y) end) end
m.minInt = function(a, b) return i32(math.min(a, b)) end
m.max = function(a, b) return map2(a, b, function(x, y) return math.max(x, y) end) end
m.maxInt = function(a, b) return i32(math.max(a, b)) end
m.clamp = function(a, b, c)
  local av = arr(a)
  local low, high = broadcast(arr(b), arr(c))
  local out = {}
  for i = 1, #av do
    local lo = low[i] or low[1]
    local hi = high[i] or high[1]
    out[i] = math.max(lo, math.min(hi, av[i]))
  end
  return scalarize(out)
end
m.clampInt = function(a, b, c) return i32(math.max(b, math.min(c, a))) end
m.mix = function(a, b, c)
  local av = arr(a)
  local bv = arr(b)
  local t = arr(c)[1] or 0
  local out = {}
  for i = 1, #av do
    out[i] = av[i] + (bv[i] - av[i]) * t
  end
  return scalarize(out)
end
m.smoothStep = function(a, b, c)
  local av = arr(a)
  local bv = arr(b)
  local cv = arr(c)
  local out = {}
  for i = 1, #cv do
    local avv = av[i] or av[1]
    local bvv = bv[i] or bv[1]
    local t = math.min(1, math.max(0, (cv[i] - math.min(avv, bvv)) / math.abs(bvv - avv)))
    out[i] = t * t * (3 - 2 * t)
  end
  return scalarize(out)
end

-- --- comparison ---
m.eq = function(a, b) return eqArrays(a, b) end
m.eqInt = function(a, b) return a == b end
m.eqBool = function(a, b) return a == b end
m.lt = function(a, b) return a < b end
m.le = function(a, b) return a <= b end
m.gt = function(a, b) return a > b end
m.ge = function(a, b) return a >= b end

-- --- special ---
m.isNaN = function(a)
  local av = arr(a)
  for i = 1, #av do
    if av[i] ~= av[i] then return true end
  end
  return false
end
m.isInf = function(a)
  local av = arr(a)
  for i = 1, #av do
    local x = av[i]
    if x == math.huge or x == -math.huge or x ~= x then return true end
  end
  return false
end
m.select = function(condition, a, b)
  if condition then return a end
  return b
end
m.switchCase = function(selection, cases, values, dflt)
  for i = 1, #cases do
    if cases[i] == selection then return values[i] end
  end
  return dflt
end

-- --- trig / hyperbolic / exp ---
m.rad = function(a) return map1(a, function(x) return (x * math.pi) / 180 end) end
m.deg = function(a) return map1(a, function(x) return (x * 180) / math.pi end) end
m.sin = function(a) return map1(a, math.sin) end
m.cos = function(a) return map1(a, math.cos) end
m.tan = function(a) return map1(a, math.tan) end
m.asin = function(a) return map1(a, math.asin) end
m.acos = function(a) return map1(a, math.acos) end
m.atan = function(a) return map1(a, math.atan) end
m.atan2 = function(a, b) return map2(a, b, function(x, y) return math.atan(x, y) end) end
m.sinh = function(a) return map1(a, function(x) return (math.exp(x) - math.exp(-x)) / 2 end) end
m.cosh = function(a) return map1(a, function(x) return (math.exp(x) + math.exp(-x)) / 2 end) end
m.tanh = function(a) return map1(a, function(x)
  if x == math.huge then return 1 end
  if x == -math.huge then return -1 end
  local e2x = math.exp(2 * x)
  return (e2x - 1) / (e2x + 1)
end) end
m.asinh = function(a) return map1(a, function(x) return math.log(x + math.sqrt(x * x + 1)) end) end
m.acosh = function(a) return map1(a, function(x) return math.log(x + math.sqrt(x * x - 1)) end) end
m.atanh = function(a) return map1(a, function(x) return 0.5 * math.log((1 + x) / (1 - x)) end) end
m.pow = function(a, b) return map2(a, b, function(x, y) return x ^ y end) end
m.exp = function(a) return map1(a, math.exp) end
m.log = function(a) return map1(a, math.log) end
m.log2 = function(a) return map1(a, function(x) return math.log(x, 2) end) end
m.log10 = function(a) return map1(a, function(x) return math.log(x, 10) end) end
m.sqrt = function(a) return map1(a, math.sqrt) end
m.cbrt = function(a) return map1(a, function(x)
  if x < 0 then return -((-x) ^ (1 / 3)) end
  return x ^ (1 / 3)
end) end

-- --- bool / int bitwise ---
m.and_ = function(a, b) return a and b end
m["and"] = m.and_
m.andInt = function(a, b) return i32(i32(a) & i32(b)) end
m.or_ = function(a, b) return a or b end
m["or"] = m.or_
m.orInt = function(a, b) return i32(i32(a) | i32(b)) end
m.not_ = function(a) return not a end
m["not"] = m.not_
m.notInt = function(a) return i32(~i32(a)) end
m.xor = function(a, b) return a ~= b end
m.xorInt = function(a, b) return i32(i32(a) ~ i32(b)) end
-- Deliberately NOT implemented via Lua's native `>>`/`<<`: those operate on
-- Lua 5.4's 64-bit integers with an UNMASKED shift count (shifting by >=64
-- always yields 0) and `>>` is a LOGICAL (zero-filling) shift — neither
-- matches JS's `>>`/`<<`, which mask the shift count to 5 bits (`b & 31`)
-- and, for `>>`, sign-EXTEND. Implemented instead as pure arithmetic on the
-- already-32-bit-range `i32(a)` value: a left shift by n is exactly
-- multiply-by-2^n then wrap to int32 (`i32`, same as `addInt`/`mulInt`
-- etc.); an arithmetic right shift by n is exactly floor-divide-by-2^n
-- (floor division rounds toward -infinity, which is precisely what
-- sign-propagation means for two's-complement numbers — e.g. -7 >> 1 = -4,
-- and floor(-7/2) = floor(-3.5) = -4).
m.asr = function(a, b)
  local av = i32(a)
  local shift = i32(b) % 32
  if shift == 0 then return av end
  return i32(math.floor(av / (2 ^ shift)))
end
m.lsl = function(a, b)
  local shift = i32(b) % 32
  return i32(i32(a) * (2 ^ shift))
end
m.clz = function(a)
  local v = i32(a)
  if v < 0 then v = v + 4294967296 end
  if v == 0 then return 32 end
  local count = 0
  while v < 2147483648 do
    v = v * 2
    count = count + 1
  end
  return count
end
m.ctz = function(a)
  local v = i32(a)
  if v == 0 then return 32 end
  if v < 0 then v = v + 4294967296 end
  local count = 0
  while v % 2 == 0 do
    v = v // 2
    count = count + 1
  end
  return count
end
m.popcnt = function(a)
  local v = i32(a)
  if v < 0 then v = v + 4294967296 end
  local count = 0
  while v ~= 0 do
    count = count + (v % 2)
    v = v // 2
  end
  return count
end

-- --- vector ---
m.length = function(a) return kmath_hypot(table.unpack(a)) end
m.normalize = function(a)
  for i = 1, #a do
    if a[i] ~= a[i] or a[i] == math.huge or a[i] == -math.huge then
      local zero = {}
      for j = 1, #a do zero[j] = 0 end
      return { value = zero, isValid = false }
    end
  end
  local len = kmath_hypot(table.unpack(a))
  if len == 0 then
    local zero = {}
    for j = 1, #a do zero[j] = 0 end
    return { value = zero, isValid = false }
  end
  local out = {}
  for i = 1, #a do out[i] = a[i] / len end
  return { value = out, isValid = true }
end
m.dot = function(a, b)
  local n = math.min(#a, #b)
  local sum = 0
  for i = 1, n do sum = sum + a[i] * b[i] end
  return sum
end
m.cross = function(a, b) return kmath_crossVec3(a, b) end
m.rotate2D = function(a, angle) return kmath_rotate2D(a, angle) end
m.rotate3D = function(a, rotation)
  local qx = rotation[1] or 0
  local qy = rotation[2] or 0
  local qz = rotation[3] or 0
  local qw = rotation[4] or 1
  local ax = a[1] or 0
  local ay = a[2] or 0
  local az = a[3] or 0
  local cx = qy * az - qz * ay + qw * ax
  local cy = qz * ax - qx * az + qw * ay
  local cz = qx * ay - qy * ax + qw * az
  return {
    ax + 2 * (qy * cz - qz * cy),
    ay + 2 * (qz * cx - qx * cz),
    az + 2 * (qx * cy - qy * cx)
  }
end
m.transform = function(a, b)
  local matrix = a
  local vector = b
  if #a ~= 16 then
    matrix = b
    vector = a
  end
  local transformed = kmath_transformVec3(matrix, vector)
  if #vector == 4 then return transformed end
  return { transformed[1], transformed[2], transformed[3] }
end
m.slerp = function(a, b, t) return kmath_vectorSlerp(a, b, t) end

-- --- matrix ---
m.transpose = function(a)
  return matDispatch(
    a,
    function(mtx) return { mtx[1], mtx[3], mtx[2], mtx[4] } end,
    function(mtx) return { mtx[1], mtx[4], mtx[7], mtx[2], mtx[5], mtx[8], mtx[3], mtx[6], mtx[9] } end,
    kmath_mat4Transpose
  )
end
m.determinant = function(a) return matDispatch(a, kmath_mat2Determinant, kmath_mat3Determinant, kmath_mat4Determinant) end
m.inverse = function(a)
  local value, isValid = matDispatch(a, kmath_mat2Invert, kmath_mat3Invert, kmath_mat4Invert)
  return { value = value, isValid = isValid }
end
m.matMul = function(a, b)
  return matDispatch(
    a,
    function(mtx) return kmath_mat2Mul(mtx, b) end,
    function(mtx) return kmath_mat3Mul(mtx, b) end,
    function(mtx) return kmath_mat4Mul(mtx, b) end
  )
end
m.matCompose = function(translation, rotation, scale) return kmath_mat4Compose(translation, rotation, scale) end
m.matDecompose = function(a)
  local res, isValid = kmath_mat4Decompose(a)
  return { translation = res.translation, rotation = res.rotation, scale = res.scale, isValid = isValid }
end

-- --- quaternion ---
m.quatConjugate = function(a) return { -a[1], -a[2], -a[3], a[4] } end
m.quatMul = function(a, b) return kmath_quatMul(a, b) end
m.quatAngleBetween = function(a, b) return kmath_quatAngleBetween(a, b) end
m.quatFromAxisAngle = function(axis, angle) return kmath_quatFromAxisAngle(axis, angle) end
m.quatToAxisAngle = function(a)
  local axis, angle = kmath_quatToAxisAngle(a)
  return { axis = axis, angle = angle }
end
m.quatFromDirections = function(a, b) return kmath_quatFromDirections(a, b) end
m.quatFromUpForward = function(up, forward) return kmath_quatFromUpForward(up, forward) end
-- `order` is math/quatFromAngles's plain config field (4th literal arg from emit-lua).
m.quatFromAngles = function(x, y, z, order)
  local angles = { x = x, y = y, z = z }
  local axes = { x = { 1, 0, 0 }, y = { 0, 1, 0 }, z = { 0, 0, 1 } }
  local q = { 0, 0, 0, 1 }
  for i = 1, #order do
    local axis = order:sub(i, i)
    q = kmath_quatMul(q, kmath_quatFromAxisAngle(axes[axis] or { 0, 0, 0 }, angles[axis] or 0))
  end
  return q
end
m.quatSlerp = function(a, b, t) return kmath_quatSlerp(a, b, t) end

-- --- color ---
m.rgbToOkLCh = function(r, g, b)
  local function cbrt(x)
    if x < 0 then return -((-x) ^ (1 / 3)) end
    return x ^ (1 / 3)
  end
  local Lp = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  local Mp = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  local Sp = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  local l = 0.2104542553 * Lp + 0.793617785 * Mp - 0.0040720468 * Sp
  local aLab = 1.9779984951 * Lp - 2.428592205 * Mp + 0.4505937099 * Sp
  local bLab = 0.0259040371 * Lp + 0.7827717662 * Mp - 0.808675766 * Sp
  return { l = l, c = math.sqrt(aLab * aLab + bLab * bLab), h = math.atan(bLab, aLab) }
end
m.rgbFromOkLCh = function(l, c, h)
  local aLab = c * math.cos(h)
  local bLab = c * math.sin(h)
  local Lp = (l + 0.3963377774 * aLab + 0.2158037573 * bLab) ^ 3
  local Mp = (l - 0.1055613458 * aLab - 0.0638541728 * bLab) ^ 3
  local Sp = (l - 0.0894841775 * aLab - 1.291485548 * bLab) ^ 3
  return {
    r = 4.0767416621 * Lp - 3.3077115913 * Mp + 0.2309699292 * Sp,
    g = -1.2684380046 * Lp + 2.6097574011 * Mp - 0.3413193965 * Sp,
    b = -0.0041960863 * Lp - 0.7034186147 * Mp + 1.707614701 * Sp
  }
end

-- --- vector/matrix construction & extraction ---
-- Plain table literals/index reads with no computation of their own — kept
-- as m.* wrapper calls only so the emitter's "every op call goes through
-- m.*" rule stays uniform (see math.ts's own header note).
m.combine2 = function(a, b) return { a, b } end
m.combine3 = function(a, b, c) return { a, b, c } end
m.combine4 = function(a, b, c, d) return { a, b, c, d } end
m.combine2x2 = function(a, b, c, d) return { a, b, c, d } end
m.combine3x3 = function(a, b, c, d, e, f, g, h, i) return { a, b, c, d, e, f, g, h, i } end
m.combine4x4 = function(...) return { ... } end
m.extract2 = function(a) return a end
m.extract3 = function(a) return a end
m.extract4 = function(a) return a end
m.extract2x2 = function(a) return a end
m.extract3x3 = function(a) return a end
m.extract4x4 = function(a) return a end

-- --- ref ---
m.refEq = function(a, b) return a == b end

-- --- type conversions ---
m.boolToInt = function(a)
  if a then return 1 end
  return 0
end
m.boolToFloat = function(a)
  if a then return 1 end
  return 0
end
m.intToBool = function(a) return a ~= 0 end
m.intToFloat = function(a) return a end
-- false iff NaN or +/-0.
m.floatToBool = function(a) return a == a and a ~= 0 end
-- 0 for NaN/+-Inf, else truncate + wrap to int32 (toInt32 handles both).
m.floatToInt = function(a) return i32(a) end
