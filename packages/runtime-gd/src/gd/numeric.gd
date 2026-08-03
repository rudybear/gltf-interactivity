# Numeric primitives shared by kmath.gd, m.gd and engine.gd — a LEAF file
# (no preloads of its own) so both m.gd and kmath.gd can depend on it without
# a preload cycle (m.gd needs Kmath for vector/matrix ops; kmath.gd needs
# safeAcos for slerp/quat work — routing that one shared need through this
# separate leaf file, instead of kmath.gd depending on m.gd directly, is what
# keeps the dependency graph acyclic). Transcribed from packages/runtime-py/
# src/py/gltfi_runtime/numeric.py, trimmed to what GDScript's own built-ins
# DON'T already give us for free — see that file's header for the full
# Python-specific rationale, and m.gd's header for exactly which GDScript
# built-ins were empirically verified (via real `godot --headless` probes) to
# already match JS/IEEE-754 semantics with NO wrapper needed at all (native
# float `/`, `fmod()`, `floor()`, `ceil()`, `round()`, `sqrt()`, `log()`,
# `sin()`/`cos()`/`tan()`, all already NaN/Infinity-safe) — only toInt32
# (ECMAScript ToInt32, since GDScript's `int` is 64-bit, not int32), fmin/
# fmax (order-independent NaN propagation, matching JS's Math.min/Math.max —
# GDScript's own `minf`/`maxf` were NOT probed and are not assumed safe here),
# safeTrunc (used by engine.gd's do_n, mirrors Python's safe_trunc), and
# safeAsin/safeAcos/safePow (the three genuine GDScript-vs-JS divergences
# found by probing: asin/acos silently CLAMP out-of-domain input instead of
# returning NaN, and pow(+-1, +-INF) returns 1 instead of NaN) are real here.
extends RefCounted


static func toInt32(x: float) -> int:
	if is_nan(x) or is_inf(x):
		return 0
	var n := int(x)  # GDScript int(float) truncates toward zero, like Python's math.trunc.
	return int(((n & 0xFFFFFFFF) ^ 0x80000000) - 0x80000000)


static func int32Wrap(n: int) -> int:
	return int(((n & 0xFFFFFFFF) ^ 0x80000000) - 0x80000000)


static func fmin(a: float, b: float) -> float:
	if is_nan(a) or is_nan(b):
		return NAN
	return a if a < b else b


static func fmax(a: float, b: float) -> float:
	if is_nan(a) or is_nan(b):
		return NAN
	return a if a > b else b


static func safeTrunc(x: float) -> float:
	if is_nan(x) or is_inf(x):
		return x
	return float(int(x))


static func safeAsin(x: float) -> float:
	if is_nan(x) or x < -1.0 or x > 1.0:
		return NAN
	return asin(x)


static func safeAcos(x: float) -> float:
	if is_nan(x) or x < -1.0 or x > 1.0:
		return NAN
	return acos(x)


static func _isIntValued(x: float) -> bool:
	return not is_inf(x) and x == floor(x)


static func _isOddInt(x: float) -> bool:
	return _isIntValued(x) and (int(x) % 2 != 0)


# Ports numeric.py's safe_pow branch-for-branch (not just the one probed
# `abs(base)==1, infinite exponent` divergence) — see m.gd's header note.
static func safePow(a: float, b: float) -> float:
	if is_nan(a) or is_nan(b):
		return NAN
	if b == 0.0:
		return 1.0
	var a_neg_zero: bool = a == 0.0 and signf(a) < 0.0
	if a == 0.0:
		if b < 0.0:
			return -INF if (a_neg_zero and _isOddInt(b)) else INF
		return -0.0 if (a_neg_zero and _isOddInt(b)) else 0.0
	if is_inf(a):
		if b < 0.0:
			return 0.0
		if a < 0.0:
			return -INF if _isOddInt(b) else INF
		return INF
	if is_inf(b):
		var aa := absf(a)
		if aa == 1.0:
			return NAN
		return INF if (aa > 1.0) == (b > 0.0) else 0.0
	if a < 0.0 and not _isIntValued(b):
		return NAN
	return pow(a, b)
