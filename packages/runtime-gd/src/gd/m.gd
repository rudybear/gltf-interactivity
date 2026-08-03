# Raw-GDScript math/type/ref namespace for compiled (emit-gd) output. Mirrors
# packages/runtime-lib/src/math.ts's `m` namespace exactly (component-wise F-
# family mapping with NaN propagation, int32 wrapping, div-by-0 -> +-Inf/NaN,
# ctz(0)=32, unsigned popcnt), and is transcribed most directly from
# packages/runtime-py/src/py/gltfi_runtime/m.py (closest-syntax sibling) —
# see that file's own header for the exact per-op rationale; ONLY the notes
# below where GDScript's own built-ins genuinely diverge from Python's (and
# therefore from the JS/TS oracle) are repeated here.
#
# F = float (scalar) or a 0-based Array (vector/matrix), same convention as
# the TS/Python sources (no index-base conversion needed, unlike the Lua
# backend's 1-based tables). Multi-output ops (normalize, inverse,
# matDecompose, quatToAxisAngle, rgbToOkLCh/rgbFromOkLCh) return a plain
# Dictionary keyed by output-socket name.
#
# Every function here is `static func` — this script is loaded ONCE by
# harness.gd (a real res://-relative `load()`, safe because m.gd itself always
# lives at a fixed disk path — see engine.gd's header note for why the
# dynamically-compiled per-test module can never do that itself) and the
# resulting GDScript *class* reference (not an instance) is injected as the
# compiled module's own `m` field before `build(rt)` runs, so every `m.foo(...)`
# call in emitted code is a plain static-method call through that class ref —
# confirmed empirically to work (see the task report's GDScript.new()+
# static-call probe).
#
# GDScript-vs-Python correctness notes (every one of these was verified with a
# real `godot --headless` probe before writing this file — see the task
# report's "native-vs-m.*" table for the full list):
#  - Native GDScript float `/` and `fmod()` ALREADY match JS/IEEE-754 exactly
#    (1.0/0.0 == INF, 0.0/0.0 == NAN, fmod(5.0,0.0) == NAN, fmod(inf,1.0) ==
#    NAN, fmod(5.0, inf) == 5.0) — UNLIKE Python (which raises
#    ZeroDivisionError/ValueError natively), so div/rem need no exception
#    workaround here, just a bare `/`/`fmod()`. floor/ceil/round/trunc/sin/
#    cos/tan/sqrt/log/log2/log10 are similarly already NaN/Infinity-safe
#    natively (Python's math.* raises on most of these; GDScript's don't).
#  - GDScript's round() is ALREADY sign(x)*round(abs(x)) (round-half-AWAY-
#    from-zero, e.g. round(-2.5) == -3), i.e. already matches math.ts's own
#    `round: (a) => Math.sign(x) * Math.round(Math.abs(x))` trick directly —
#    no wrapper needed (unlike a hypothetical native-JS-Math.round port,
#    which rounds half devToward +Infinity and would need the same sign*abs
#    trick Python's safe_round uses).
#  - `asin`/`acos` DO diverge: GDScript's builtins silently CLAMP an
#    out-of-domain argument to [-1,1] instead of returning NaN (`asin(2.0)`
#    returns pi/2, `acos(2.0)` returns 0 — confirmed by probe) — JS's
#    Math.asin/Math.acos return NaN for |x|>1. safeAsin/safeAcos below fix
#    this with an explicit domain check.
#  - `pow()` DOES diverge at the `abs(base) == 1` + infinite-exponent corner:
#    GDScript's `pow(1.0, INF)` and `pow(-1.0, INF)` both return `1.0`;
#    ECMAScript's Number::exponentiate (what Math.pow/`**` follow, and what
#    math.ts's `pow` op must match) mandates NaN for BOTH of those — confirmed
#    by probe. safePow below ports numeric.py's safe_pow logic wholesale
#    (branch-for-branch) rather than patching just this one corner, since
#    several of its other branches (0**negative-odd sign-of-zero, Infinity
#    bases, `a<0` with a non-integer exponent) are cheap insurance against
#    other GDScript/native divergences nobody has explicitly probed.
#  - Int arithmetic: GDScript's `int` is 64-bit (not Python's arbitrary-
#    precision, but still wider than the spec's int32), so every int-typed
#    result still needs explicit wrapping back into int32 range — toInt32
#    below (same ECMAScript ToInt32 formula Python's to_int32 uses).
#  - Int division/modulo BY A LITERAL/VARIABLE ZERO DIVISOR: unlike float `/`,
#    GDScript's INTEGER `/` and `%` operators raise a fatal "Division by
#    zero" SCRIPT ERROR that does not `quit()` the SceneTree and hangs the
#    whole headless process (confirmed by probe: an uncaught script error
#    inside `_initialize` just leaves the main loop spinning forever with
#    nothing scheduled to stop it) — there is no GDScript try/except to catch
#    it either. divInt/remInt below NEVER use the native `/`/`%` int
#    operators; they always route through float division/fmod first (which
#    is exception-free, per the note above) and truncate back through
#    toInt32 afterward, exactly like Python's divInt/remInt route through
#    safe_div/safe_fmod.
extends RefCounted

const Kmath = preload("res://kmath.gd")
const Numeric = preload("res://numeric.gd")


static func _arr(x):
	return x if x is Array else [x]


static func _scalarize(out: Array):
	return out[0] if out.size() == 1 else out


static func _broadcast(a: Array, b: Array) -> Array:
	var la := a.size()
	var lb := b.size()
	if la == lb:
		return [a, b]
	if la == 1:
		var aa := []
		for i in range(lb):
			aa.append(a[0])
		return [aa, b]
	if lb == 1:
		var bb := []
		for i in range(la):
			bb.append(b[0])
		return [a, bb]
	return [a, b]


static func _map1(a, f: Callable):
	if a is Array:
		var out := []
		for x in a:
			out.append(f.call(x))
		return out
	return f.call(a)


static func _map2(a, b, f: Callable):
	var bc: Array = _broadcast(_arr(a), _arr(b))
	var left: Array = bc[0]
	var right: Array = bc[1]
	var out := []
	for i in range(left.size()):
		var r = right[i] if i < right.size() else (right[0] if right.size() > 0 else 0)
		out.append(f.call(left[i], r))
	return _scalarize(out)


static func _eq_arrays(a, b) -> bool:
	var bc: Array = _broadcast(_arr(a), _arr(b))
	var left: Array = bc[0]
	var right: Array = bc[1]
	for i in range(left.size()):
		var r = right[i] if i < right.size() else (right[0] if right.size() > 0 else null)
		if left[i] != r:
			return false
	return true


static func _fsign(x: float) -> float:
	if is_nan(x):
		return x
	if x > 0:
		return 1.0
	if x < 0:
		return -1.0
	return x


static func _mat_dispatch(a: Array, f2: Callable, f3: Callable, f4: Callable):
	var n := a.size()
	if n == 4:
		return f2.call(a)
	if n == 9:
		return f3.call(a)
	return f4.call(a)


# --- numeric safety helpers (ECMAScript ToInt32 + the two real GDScript
# divergences noted above) ---

# Thin delegates to numeric.gd (see that file's header for why the actual
# logic lives there, as a dependency-free leaf, rather than here) — kept as
# same-named local wrappers so every call site below (`toInt32(...)`,
# `safeDiv(...)`, etc.) reads exactly like the original single-file draft and
# like Python's m.py, which imports these unqualified from `.numeric` too.
static func toInt32(x: float) -> int:
	return Numeric.toInt32(x)


static func _int32Wrap(n: int) -> int:
	return Numeric.int32Wrap(n)


static func safeDiv(x: float, y: float) -> float:
	return x / y  # native GDScript float division already matches IEEE-754/JS exactly.


static func safeFmod(x: float, y: float) -> float:
	return fmod(x, y)  # native fmod() already matches JS's `%` exactly (see header note).


static func safeAsin(x: float) -> float:
	return Numeric.safeAsin(x)


static func safeAcos(x: float) -> float:
	return Numeric.safeAcos(x)


static func safePow(a: float, b: float) -> float:
	return Numeric.safePow(a, b)


# --- constants ---
static func E() -> float:
	return 2.718281828459045


static func Pi() -> float:
	return PI


static func Tau() -> float:
	return TAU


static func Inf() -> float:
	return INF


static func NaN() -> float:
	return NAN


# --- float arith (component-wise F, NaN-propagating) ---
static func abs_(a):
	return _map1(a, absf)


static func absInt(a: int) -> int:
	return toInt32(absi(a))


static func sign(a):
	return _map1(a, _fsign)


static func signInt(a: int) -> int:
	return toInt32(_fsign(a))


static func trunc(a):
	return _map1(a, func(x): return x if (is_nan(x) or is_inf(x)) else float(int(x)))


static func floor_(a):
	return _map1(a, func(x): return floor(x))


static func ceil_(a):
	return _map1(a, func(x): return ceil(x))


static func round_(a):
	return _map1(a, func(x): return round(x))


static func fract(a):
	return _map1(a, func(x): return x - floor(x))


static func neg(a):
	return _map1(a, func(x): return -x)


static func negInt(a: int) -> int:
	return toInt32(-a)


static func saturate(a):
	return _map1(a, func(x): return maxf(minf(x, 1.0), 0.0))


static func add(a, b):
	return _map2(a, b, func(x, y): return x + y)


static func addInt(a: int, b: int) -> int:
	return _int32Wrap(a + b)


static func sub(a, b):
	return _map2(a, b, func(x, y): return x - y)


static func subInt(a: int, b: int) -> int:
	return _int32Wrap(a - b)


static func mul(a, b):
	return _map2(a, b, func(x, y): return x * y)


static func mulInt(a: int, b: int) -> int:
	return _int32Wrap(a * b)


static func div(a, b):
	return _map2(a, b, safeDiv)


static func divInt(a: int, b: int) -> int:
	return toInt32(safeDiv(float(a), float(b)))


static func rem(a, b):
	return _map2(a, b, safeFmod)


static func remInt(a: int, b: int) -> int:
	return toInt32(safeFmod(float(a), float(b)))


static func min_(a, b):
	return _map2(a, b, func(x, y): return NAN if (is_nan(x) or is_nan(y)) else minf(x, y))


static func minInt(a: int, b: int) -> int:
	return toInt32(mini(a, b))


static func max_(a, b):
	return _map2(a, b, func(x, y): return NAN if (is_nan(x) or is_nan(y)) else maxf(x, y))


static func maxInt(a: int, b: int) -> int:
	return toInt32(maxi(a, b))


static func clamp(a, b, c):
	var av: Array = _arr(a)
	var bc: Array = _broadcast(_arr(b), _arr(c))
	var low: Array = bc[0]
	var high: Array = bc[1]
	var out := []
	for i in range(av.size()):
		var lo = low[i] if i < low.size() else low[0]
		var hi = high[i] if i < high.size() else high[0]
		var lov: float = lo
		var hiv: float = hi
		var x: float = av[i]
		out.append(maxf(lov, minf(hiv, x)) if not (is_nan(lov) or is_nan(hiv) or is_nan(x)) else NAN)
	return _scalarize(out)


static func clampInt(a: int, b: int, c: int) -> int:
	return toInt32(maxi(b, mini(c, a)))


static func mix(a, b, c):
	var av: Array = _arr(a)
	var bv: Array = _arr(b)
	var tArr: Array = _arr(c)
	var t = tArr[0] if tArr.size() > 0 else 0
	var out := []
	for i in range(av.size()):
		out.append(av[i] + (bv[i] - av[i]) * t)
	return _scalarize(out)


static func smoothStep(a, b, c):
	var av: Array = _arr(a)
	var bv: Array = _arr(b)
	var cv: Array = _arr(c)
	var out := []
	for i in range(cv.size()):
		var avv = av[i] if i < av.size() else av[0]
		var bvv = bv[i] if i < bv.size() else bv[0]
		var t = minf(1.0, maxf(0.0, safeDiv(cv[i] - minf(avv, bvv), absf(bvv - avv))))
		out.append(t * t * (3.0 - 2.0 * t))
	return _scalarize(out)


# --- comparison ---
static func eq(a, b) -> bool:
	return _eq_arrays(a, b)


static func eqInt(a: int, b: int) -> bool:
	return a == b


static func eqBool(a: bool, b: bool) -> bool:
	return a == b


static func lt(a: float, b: float) -> bool:
	return a < b


static func le(a: float, b: float) -> bool:
	return a <= b


static func gt(a: float, b: float) -> bool:
	return a > b


static func ge(a: float, b: float) -> bool:
	return a >= b


# --- special ---
static func isNaN(a) -> bool:
	for x in _arr(a):
		if is_nan(x):
			return true
	return false


static func isInf(a) -> bool:
	for x in _arr(a):
		if is_nan(x) or is_inf(x):
			return true
	return false


static func select(condition: bool, a, b):
	return a if condition else b


static func switchCase(selection, cases: Array, values: Array, dflt):
	for i in range(cases.size()):
		if cases[i] == selection:
			return values[i]
	return dflt


# --- trig / hyperbolic / exp ---
static func rad(a):
	return _map1(a, func(x): return (x * PI) / 180.0)


static func deg(a):
	return _map1(a, func(x): return (x * 180.0) / PI)


static func sin_(a):
	return _map1(a, func(x): return sin(x))


static func cos_(a):
	return _map1(a, func(x): return cos(x))


static func tan_(a):
	return _map1(a, func(x): return tan(x))


static func asin_(a):
	return _map1(a, safeAsin)


static func acos_(a):
	return _map1(a, safeAcos)


static func atan_(a):
	return _map1(a, func(x): return atan(x))


static func atan2_(a, b):
	return _map2(a, b, func(x, y): return atan2(x, y))


static func sinh_(a):
	return _map1(a, func(x): return (exp(x) - exp(-x)) / 2.0)


static func cosh_(a):
	return _map1(a, func(x): return (exp(x) + exp(-x)) / 2.0)


static func tanh_(a):
	return _map1(a, func(x):
		if x == INF:
			return 1.0
		if x == -INF:
			return -1.0
		var e2x = exp(2.0 * x)
		return (e2x - 1.0) / (e2x + 1.0))


static func asinh(a):
	return _map1(a, func(x): return log(x + sqrt(x * x + 1.0)))


static func acosh(a):
	return _map1(a, func(x): return log(x + sqrt(x * x - 1.0)))


static func atanh(a):
	return _map1(a, func(x): return 0.5 * log(safeDiv(1.0 + x, 1.0 - x)))


static func pow_(a, b):
	return _map2(a, b, safePow)


static func exp_(a):
	return _map1(a, func(x): return exp(x))


static func log_(a):
	return _map1(a, func(x): return log(x))


static func log2_(a):
	return _map1(a, func(x): return log(x) / log(2.0))


static func log10_(a):
	return _map1(a, func(x): return log(x) / log(10.0))


static func sqrt_(a):
	return _map1(a, func(x): return sqrt(x))


static func cbrt(a):
	return _map1(a, func(x): return -pow(-x, 1.0 / 3.0) if x < 0.0 else pow(x, 1.0 / 3.0))


# --- bool / int bitwise ---
static func and_(a: bool, b: bool) -> bool:
	return a and b


static func andInt(a: int, b: int) -> int:
	return _int32Wrap(_int32Wrap(a) & _int32Wrap(b))


static func or_(a: bool, b: bool) -> bool:
	return a or b


static func orInt(a: int, b: int) -> int:
	return _int32Wrap(_int32Wrap(a) | _int32Wrap(b))


static func not_(a: bool) -> bool:
	return not a


static func notInt(a: int) -> int:
	return _int32Wrap(~_int32Wrap(a))


static func xor(a: bool, b: bool) -> bool:
	return a != b


static func xorInt(a: int, b: int) -> int:
	return _int32Wrap(_int32Wrap(a) ^ _int32Wrap(b))


static func asr(a: int, b: int) -> int:
	var av := toInt32(a)
	var shift := toInt32(b) % 32
	if shift < 0:
		shift += 32
	if shift == 0:
		return av
	return toInt32(floor(float(av) / pow(2.0, float(shift))))


static func lsl(a: int, b: int) -> int:
	var shift := toInt32(b) % 32
	if shift < 0:
		shift += 32
	return toInt32(float(toInt32(a)) * pow(2.0, float(shift)))


static func clz(a: int) -> int:
	var v := toInt32(a)
	var uv: int = v + 4294967296 if v < 0 else v
	if uv == 0:
		return 32
	var count := 0
	while uv < 2147483648:
		uv *= 2
		count += 1
	return count


static func ctz(a: int) -> int:
	var v := toInt32(a)
	if v == 0:
		return 32
	var uv: int = v + 4294967296 if v < 0 else v
	var count := 0
	while uv % 2 == 0:
		uv = int(uv / 2)
		count += 1
	return count


static func popcnt(a: int) -> int:
	var v := toInt32(a)
	var uv: int = v + 4294967296 if v < 0 else v
	var count := 0
	while uv != 0:
		count += uv & 1
		uv = uv >> 1
	return count


# --- vector ---
static func length(a: Array) -> float:
	return Kmath.hypotN(a)


static func normalize(a: Array) -> Dictionary:
	for x in a:
		if is_nan(x) or is_inf(x):
			var zeros := []
			for i in range(a.size()):
				zeros.append(0.0)
			return {"value": zeros, "isValid": false}
	var len_: float = Kmath.hypotN(a)
	if len_ == 0.0:
		var zeros2 := []
		for i in range(a.size()):
			zeros2.append(0.0)
		return {"value": zeros2, "isValid": false}
	var out := []
	for x in a:
		out.append(x / len_)
	return {"value": out, "isValid": true}


static func dot(a: Array, b: Array) -> float:
	var n: int = mini(a.size(), b.size())
	var total := 0.0
	for i in range(n):
		total += a[i] * b[i]
	return total


static func cross(a: Array, b: Array) -> Array:
	return Kmath.crossVec3(a, b)


static func rotate2D(a: Array, angle: float) -> Array:
	return Kmath.rotate2d(a, angle)


static func rotate3D(a: Array, rotation: Array) -> Array:
	var qx = rotation[0] if rotation.size() > 0 else 0.0
	var qy = rotation[1] if rotation.size() > 1 else 0.0
	var qz = rotation[2] if rotation.size() > 2 else 0.0
	var qw = rotation[3] if rotation.size() > 3 else 1.0
	var ax = a[0] if a.size() > 0 else 0.0
	var ay = a[1] if a.size() > 1 else 0.0
	var az = a[2] if a.size() > 2 else 0.0
	var cx = qy * az - qz * ay + qw * ax
	var cy = qz * ax - qx * az + qw * ay
	var cz = qx * ay - qy * ax + qw * az
	return [
		ax + 2.0 * (qy * cz - qz * cy),
		ay + 2.0 * (qz * cx - qx * cz),
		az + 2.0 * (qx * cy - qy * cx),
	]


static func transform(a: Array, b: Array) -> Array:
	var matrix: Array = a if a.size() == 16 else b
	var vector: Array = b if a.size() == 16 else a
	var transformed: Array = Kmath.transformVec3(matrix, vector)
	return transformed if vector.size() == 4 else [transformed[0], transformed[1], transformed[2]]


static func slerp(a: Array, b: Array, t: float) -> Array:
	return Kmath.vectorSlerp(a, b, t)


# --- matrix ---
static func transpose(a: Array) -> Array:
	return _mat_dispatch(
		a,
		func(mtx: Array): return [mtx[0], mtx[2], mtx[1], mtx[3]],
		func(mtx: Array): return [mtx[0], mtx[3], mtx[6], mtx[1], mtx[4], mtx[7], mtx[2], mtx[5], mtx[8]],
		Kmath.mat4Transpose
	)


static func determinant(a: Array) -> float:
	return _mat_dispatch(a, Kmath.mat2Determinant, Kmath.mat3Determinant, Kmath.mat4Determinant)


static func inverse(a: Array) -> Dictionary:
	return _mat_dispatch(a, Kmath.mat2Invert, Kmath.mat3Invert, Kmath.mat4Invert)


static func matMul(a: Array, b: Array) -> Array:
	return _mat_dispatch(
		a,
		func(mtx: Array): return Kmath.mat2Mul(mtx, b),
		func(mtx: Array): return Kmath.mat3Mul(mtx, b),
		func(mtx: Array): return Kmath.mat4Mul(mtx, b)
	)


static func matCompose(translation: Array, rotation: Array, scale: Array) -> Array:
	return Kmath.mat4Compose(translation, rotation, scale)


static func matDecompose(a: Array) -> Dictionary:
	return Kmath.mat4Decompose(a)


# --- quaternion ---
static func quatConjugate(a: Array) -> Array:
	return [-a[0], -a[1], -a[2], a[3]]


static func quatMul(a: Array, b: Array) -> Array:
	return Kmath.quatMul(a, b)


static func quatAngleBetween(a: Array, b: Array) -> float:
	return Kmath.quatAngleBetween(a, b)


static func quatFromAxisAngle(axis: Array, angle: float) -> Array:
	return Kmath.quatFromAxisAngle(axis, angle)


static func quatToAxisAngle(a: Array) -> Dictionary:
	return Kmath.quatToAxisAngle(a)


static func quatFromDirections(a: Array, b: Array) -> Array:
	return Kmath.quatFromDirections(a, b)


static func quatFromUpForward(up: Array, forward: Array) -> Array:
	return Kmath.quatFromUpForward(up, forward)


static func quatFromAngles(x: float, y: float, z: float, order: String) -> Array:
	var angles := {"x": x, "y": y, "z": z}
	var axes := {"x": [1.0, 0.0, 0.0], "y": [0.0, 1.0, 0.0], "z": [0.0, 0.0, 1.0]}
	var q := [0.0, 0.0, 0.0, 1.0]
	for i in range(order.length()):
		var axis: String = order[i]
		var ax: Array = axes.get(axis, [0.0, 0.0, 0.0])
		var ang: float = angles.get(axis, 0.0)
		q = Kmath.quatMul(q, Kmath.quatFromAxisAngle(ax, ang))
	return q


static func quatSlerp(a: Array, b: Array, t: float) -> Array:
	return Kmath.quatSlerp(a, b, t)


# --- color ---
static func rgbToOkLCh(r: float, g: float, b: float) -> Dictionary:
	var lp: float = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
	var mp: float = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
	var sp: float = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
	var l: float = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp
	var a_lab: float = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp
	var b_lab: float = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
	return {"l": l, "c": sqrt(a_lab * a_lab + b_lab * b_lab), "h": atan2(b_lab, a_lab)}


static func rgbFromOkLCh(l: float, c: float, h: float) -> Dictionary:
	var a_lab := c * cos(h)
	var b_lab := c * sin(h)
	var lp: float = safePow(l + 0.3963377774 * a_lab + 0.2158037573 * b_lab, 3.0)
	var mp: float = safePow(l - 0.1055613458 * a_lab - 0.0638541728 * b_lab, 3.0)
	var sp: float = safePow(l - 0.0894841775 * a_lab - 1.291485548 * b_lab, 3.0)
	return {
		"r": 4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
		"g": -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
		"b": -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp,
	}


# --- vector/matrix construction & extraction ---
static func combine2(a: float, b: float) -> Array:
	return [a, b]


static func combine3(a: float, b: float, c: float) -> Array:
	return [a, b, c]


static func combine4(a: float, b: float, c: float, d: float) -> Array:
	return [a, b, c, d]


static func combine2x2(a: float, b: float, c: float, d: float) -> Array:
	return [a, b, c, d]


static func combine3x3(a: float, b: float, c: float, d: float, e: float, f: float, g: float, h: float, i: float) -> Array:
	return [a, b, c, d, e, f, g, h, i]


static func combine4x4(a1: float, a2: float, a3: float, a4: float, a5: float, a6: float, a7: float, a8: float, a9: float, a10: float, a11: float, a12: float, a13: float, a14: float, a15: float, a16: float) -> Array:
	return [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16]


static func extract2(a: Array) -> Array:
	return a


static func extract3(a: Array) -> Array:
	return a


static func extract4(a: Array) -> Array:
	return a


static func extract2x2(a: Array) -> Array:
	return a


static func extract3x3(a: Array) -> Array:
	return a


static func extract4x4(a: Array) -> Array:
	return a


# --- ref ---
static func refEq(a: String, b: String) -> bool:
	return a == b


# --- type conversions ---
static func boolToInt(a: bool) -> int:
	return 1 if a else 0


static func boolToFloat(a: bool) -> float:
	return 1.0 if a else 0.0


static func intToBool(a: int) -> bool:
	return a != 0


static func intToFloat(a: int) -> float:
	return float(a)


static func floatToBool(a: float) -> bool:
	return (not is_nan(a)) and a != 0.0


static func floatToInt(a: float) -> int:
	return toInt32(a)
