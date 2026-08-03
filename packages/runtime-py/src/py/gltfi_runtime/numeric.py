# Numeric primitives every other module in this package leans on to match
# ECMAScript/Lua-backend semantics exactly, despite Python's math library
# (and its builtins) disagreeing with JS in several load-bearing ways. See
# the task report for the full list; summary of what's handled here:
#
#  - Python's `min`/`max` builtins are NOT NaN-propagating like JS's
#    Math.min/Math.max: `min(1, nan) == 1` but `min(nan, 1) == nan` (order-
#    dependent, since CPython's implementation just does a plain `<`/`>`
#    comparison against the running best-so-far, and every comparison
#    against NaN is False). JS's Math.min/Math.max always return NaN if
#    EITHER argument is NaN, order-independent. fmin/fmax below fix this.
#  - `x / y` for Python floats raises ZeroDivisionError when y == 0 instead
#    of returning +-Infinity/NaN like JS/Lua. safe_div fixes this, matching
#    IEEE-754 (and JS's) sign-of-zero-aware semantics.
#  - `math.fmod` raises ValueError ("math domain error") when the divisor is
#    0 or the dividend is infinite, instead of returning NaN like C's fmod
#    (which is what JS's `%` operator is specified to match). safe_fmod
#    fixes this.
#  - Python's floor division `//` always rounds toward -infinity (for BOTH
#    operands' signs); KHR_interactivity's int division truncates toward
#    zero (matches JS's `(a / b) | 0` and Lua's `math.floor`-then-correct
#    approach) — handled by to_int32 always being fed a value already
#    produced via true division (`/`, never `//`), not by this module
#    directly, but noted here since it's the same family of gotcha.
#  - `math.trunc`/`math.floor`/`math.ceil`/`round` all raise (ValueError for
#    NaN, OverflowError for +-Infinity) instead of returning NaN/Infinity
#    like JS's Math.floor/Math.ceil/Math.round. safe_floor/safe_ceil/
#    safe_round fix this (used by m.py's `floor`/`ceil`/`round` ops).
#  - `math.sqrt`/`math.log`/`math.log2`/`math.log10`/`math.asin`/`math.acos`
#    all raise ValueError ("math domain error") for out-of-domain FINITE
#    inputs (negative sqrt/log, |x|>1 for asin/acos) instead of returning
#    NaN like JS's Math.sqrt/Math.log/Math.asin/Math.acos. safe_sqrt/
#    safe_log/safe_log2/safe_log10/safe_asin/safe_acos fix this.
#  - `math.sin`/`math.cos`/`math.tan` raise ValueError for +-Infinity input
#    (NaN input is fine, propagates through natively) instead of returning
#    NaN like JS's Math.sin/Math.cos/Math.tan. safe_sin/safe_cos/safe_tan
#    fix this.
#  - The `**` operator, given a negative float base and a non-integer float
#    exponent, does NOT raise and does NOT return NaN: it silently returns a
#    Python `complex` number (e.g. `(-8.0) ** (1/3)` is a complex value with
#    a nonzero imaginary part) — a silent-wrong-type bug magnet, unlike JS's
#    Math.pow(-8, 1/3), which is NaN. safe_pow fixes this (also handles the
#    0**negative ZeroDivisionError and the sign-of-zero edge cases JS's
#    Number::exponentiate spec covers).
#  - Python ints are arbitrary-precision (bignum): every int-typed
#    KHR_interactivity arithmetic result must be wrapped back into signed
#    int32 range after the underlying operation — to_int32 (spec formula:
#    `((x & 0xFFFFFFFF) ^ 0x80000000) - 0x80000000`, applied to
#    `math.trunc(x)`, with NaN/+-Infinity inputs mapped to 0 first, mirroring
#    ECMAScript's ToInt32 abstract operation exactly).
import math

NAN = float("nan")
INF = math.inf
NEG_INF = -math.inf


def is_nan(x: float) -> bool:
    return x != x


def fmin(a: float, b: float) -> float:
    if a != a or b != b:
        return NAN
    return a if a < b else b


def fmax(a: float, b: float) -> float:
    if a != a or b != b:
        return NAN
    return a if a > b else b


def fclamp(lo: float, hi: float, x: float) -> float:
    return fmax(lo, fmin(hi, x))


def to_int32(x: float) -> int:
    if x != x or math.isinf(x):
        return 0
    n = math.trunc(x)
    return ((n & 0xFFFFFFFF) ^ 0x80000000) - 0x80000000


def safe_div(x: float, y: float) -> float:
    if y != 0.0:
        return x / y
    if x != x or x == 0.0:
        return NAN
    sign = math.copysign(1.0, x) * math.copysign(1.0, y)
    return INF if sign > 0 else NEG_INF


def safe_fmod(x: float, y: float) -> float:
    if y == 0.0 or x != x or y != y or math.isinf(x):
        return NAN
    if math.isinf(y):
        return x
    return math.fmod(x, y)


def safe_floor(x: float) -> float:
    if x != x or math.isinf(x):
        return x
    return float(math.floor(x))


def safe_ceil(x: float) -> float:
    if x != x or math.isinf(x):
        return x
    return float(math.ceil(x))


def safe_trunc(x: float) -> float:
    if x != x or math.isinf(x):
        return x
    return float(math.trunc(x))


def safe_round(x: float) -> float:
    # Matches JS's Math.round: round-half-up in magnitude (sign * floor(|x| + 0.5)),
    # NOT Python's builtin round() (banker's rounding) or math.floor semantics.
    if x != x or math.isinf(x):
        return x
    sign = 1.0 if x >= 0 else -1.0
    return sign * math.floor(abs(x) + 0.5)


def safe_sqrt(x: float) -> float:
    if x != x:
        return NAN
    if x < 0:
        return NAN
    return math.sqrt(x)


def safe_log(x: float) -> float:
    if x != x:
        return NAN
    if x < 0:
        return NAN
    if x == 0:
        return NEG_INF
    return math.log(x)


def safe_log2(x: float) -> float:
    if x != x:
        return NAN
    if x < 0:
        return NAN
    if x == 0:
        return NEG_INF
    return math.log2(x)


def safe_log10(x: float) -> float:
    if x != x:
        return NAN
    if x < 0:
        return NAN
    if x == 0:
        return NEG_INF
    return math.log10(x)


def safe_asin(x: float) -> float:
    if x != x or x < -1 or x > 1:
        return NAN
    return math.asin(x)


def safe_acos(x: float) -> float:
    if x != x or x < -1 or x > 1:
        return NAN
    return math.acos(x)


def safe_sin(x: float) -> float:
    if x != x:
        return NAN
    if math.isinf(x):
        return NAN
    return math.sin(x)


def safe_cos(x: float) -> float:
    if x != x:
        return NAN
    if math.isinf(x):
        return NAN
    return math.cos(x)


def safe_tan(x: float) -> float:
    if x != x:
        return NAN
    if math.isinf(x):
        return NAN
    return math.tan(x)


def _is_int_valued(x: float) -> bool:
    return not math.isinf(x) and x == math.floor(x)


def _is_odd_int(x: float) -> bool:
    return _is_int_valued(x) and (int(x) % 2 != 0)


def safe_pow(a: float, b: float) -> float:
    if a != a or b != b:
        return NAN
    if b == 0.0:
        return 1.0
    a_neg_zero = a == 0.0 and math.copysign(1.0, a) < 0
    if a == 0.0:
        if b < 0:
            return NEG_INF if (a_neg_zero and _is_odd_int(b)) else INF
        return -0.0 if (a_neg_zero and _is_odd_int(b)) else 0.0
    if math.isinf(a):
        if b < 0:
            return 0.0
        if a < 0:
            return NEG_INF if _is_odd_int(b) else INF
        return INF
    if math.isinf(b):
        aa = abs(a)
        if aa == 1.0:
            return NAN
        return INF if (aa > 1.0) == (b > 0) else 0.0
    if a < 0 and not _is_int_valued(b):
        return NAN
    try:
        result = a ** b
    except (OverflowError, ZeroDivisionError):
        return INF
    if isinstance(result, complex):
        return NAN
    return float(result)
