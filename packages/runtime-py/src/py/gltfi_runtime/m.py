# Raw-Python math/type/ref namespace for compiled (emit-py) output. Mirrors
# packages/runtime-lib/src/math.ts's `m` namespace exactly (component-wise F-
# family mapping with NaN propagation, int32 wrapping, div-by-0 -> +-Inf/NaN,
# ctz(0)=32, unsigned popcnt) — F = Python float (scalar) or a 0-based Python
# list (vector/matrix), same convention as the TS source (no index-base
# conversion needed, unlike the Lua backend's 1-based tables). Multi-output
# ops (normalize, inverse, matDecompose, quatToAxisAngle, rgbToOkLCh/
# rgbFromOkLCh) return a plain dict keyed by output-socket name — emit-py's
# emitOp does `m.foo(...)["value"]` / `["isValid"]` / etc, mirroring math.ts's
# own object-literal return shape verbatim.
#
# math/random is NOT here (needs per-engine-instance LCG state — see
# engine.py's `rt.random()`). math/combine*/extract* ARE here (as plain list-
# literal/identity wrappers) despite having no computation of their own — see
# the Lua backend's m.lua for why: kept as m.* calls purely so emit-py's
# "every op call goes through m.*" rule stays uniform.
#
# Python-specific correctness notes (see numeric.py's header for the full
# rationale): every division goes through numeric.safe_div/safe_fmod (Python
# raises ZeroDivisionError instead of returning +-Inf/NaN); every floor/ceil/
# round goes through numeric.safe_floor/safe_ceil/safe_round (Python raises on
# NaN/Infinity input); every sqrt/log/log2/log10/asin/acos/pow goes through
# numeric.safe_* (Python raises ValueError on out-of-domain FINITE input, and
# `**` silently returns a `complex` for a negative base with a fractional
# exponent instead of NaN); every min/max goes through numeric.fmin/fmax
# (Python's builtins are not order-independent-NaN-propagating like JS's
# Math.min/Math.max — `min(1, nan) == 1` but `min(nan, 1) == nan`).
import math

from . import kmath
from .numeric import (
    fmax,
    fmin,
    safe_acos,
    safe_asin,
    safe_ceil,
    safe_cos,
    safe_div,
    safe_floor,
    safe_fmod,
    safe_log,
    safe_log2,
    safe_log10,
    safe_pow,
    safe_round,
    safe_sin,
    safe_sqrt,
    safe_tan,
    safe_trunc,
    to_int32,
)

F = "float | list[float]"  # documentation-only alias (see IRType); no runtime effect.


def _arr(x):
    return x if isinstance(x, list) else [x]


def _scalarize(out: list):
    return out[0] if len(out) == 1 else out


def _broadcast(a: list, b: list):
    la, lb = len(a), len(b)
    if la == lb:
        return a, b
    if la == 1:
        return [a[0]] * lb, b
    if lb == 1:
        return a, [b[0]] * la
    return a, b


def _map1(a, f):
    if isinstance(a, list):
        return [f(x) for x in a]
    return f(a)


def _map2(a, b, f):
    left, right = _broadcast(_arr(a), _arr(b))
    out = []
    for i in range(len(left)):
        r = right[i] if i < len(right) else (right[0] if right else 0)
        out.append(f(left[i], r))
    return _scalarize(out)


def _eq_arrays(a, b) -> bool:
    left, right = _broadcast(_arr(a), _arr(b))
    for i in range(len(left)):
        r = right[i] if i < len(right) else (right[0] if right else None)
        if left[i] != r:
            return False
    return True


def _fsign(x: float) -> float:
    if x != x:
        return x
    if x > 0:
        return 1.0
    if x < 0:
        return -1.0
    return x


def _mat_dispatch(a: list, f2, f3, f4):
    n = len(a)
    if n == 4:
        return f2(a)
    if n == 9:
        return f3(a)
    return f4(a)


# --- constants ---
def E() -> float:
    return math.e


def Pi() -> float:
    return math.pi


def Tau() -> float:
    return 2 * math.pi


def Inf() -> float:
    return math.inf


def NaN() -> float:
    return float("nan")


# --- float arith (component-wise F, NaN-propagating) ---
def abs_(a):
    return _map1(a, abs)


def absInt(a: int) -> int:
    return to_int32(abs(a))


def sign(a):
    return _map1(a, _fsign)


def signInt(a: int) -> int:
    return to_int32(_fsign(a))


def trunc(a):
    return _map1(a, safe_trunc)


def floor(a):
    return _map1(a, safe_floor)


def ceil(a):
    return _map1(a, safe_ceil)


def round_(a):
    return _map1(a, safe_round)


def fract(a):
    return _map1(a, lambda x: x - safe_floor(x))


def neg(a):
    return _map1(a, lambda x: -x)


def negInt(a: int) -> int:
    return to_int32(-a)


def saturate(a):
    return _map1(a, lambda x: fmax(fmin(x, 1), 0))


def add(a, b):
    return _map2(a, b, lambda x, y: x + y)


def addInt(a: int, b: int) -> int:
    return to_int32(a + b)


def sub(a, b):
    return _map2(a, b, lambda x, y: x - y)


def subInt(a: int, b: int) -> int:
    return to_int32(a - b)


def mul(a, b):
    return _map2(a, b, lambda x, y: x * y)


def mulInt(a: int, b: int) -> int:
    return to_int32(a * b)


def div(a, b):
    return _map2(a, b, safe_div)


def divInt(a: int, b: int) -> int:
    return to_int32(safe_div(float(a), float(b)))


def rem(a, b):
    return _map2(a, b, safe_fmod)


def remInt(a: int, b: int) -> int:
    return to_int32(safe_fmod(float(a), float(b)))


def min_(a, b):
    return _map2(a, b, fmin)


def minInt(a: int, b: int) -> int:
    return to_int32(min(a, b))


def max_(a, b):
    return _map2(a, b, fmax)


def maxInt(a: int, b: int) -> int:
    return to_int32(max(a, b))


def clamp(a, b, c):
    av = _arr(a)
    low, high = _broadcast(_arr(b), _arr(c))
    out = []
    for i in range(len(av)):
        lo = low[i] if i < len(low) else low[0]
        hi = high[i] if i < len(high) else high[0]
        out.append(fmax(lo, fmin(hi, av[i])))
    return _scalarize(out)


def clampInt(a: int, b: int, c: int) -> int:
    return to_int32(max(b, min(c, a)))


def mix(a, b, c):
    av = _arr(a)
    bv = _arr(b)
    t = _arr(c)[0] if _arr(c) else 0
    return _scalarize([av[i] + (bv[i] - av[i]) * t for i in range(len(av))])


def smoothStep(a, b, c):
    av = _arr(a)
    bv = _arr(b)
    cv = _arr(c)
    out = []
    for i in range(len(cv)):
        avv = av[i] if i < len(av) else av[0]
        bvv = bv[i] if i < len(bv) else bv[0]
        t = fmin(1, fmax(0, safe_div(cv[i] - fmin(avv, bvv), abs(bvv - avv))))
        out.append(t * t * (3 - 2 * t))
    return _scalarize(out)


# --- comparison ---
def eq(a, b) -> bool:
    return _eq_arrays(a, b)


def eqInt(a: int, b: int) -> bool:
    return a == b


def eqBool(a: bool, b: bool) -> bool:
    return a == b


def lt(a, b) -> bool:
    return a < b


def le(a, b) -> bool:
    return a <= b


def gt(a, b) -> bool:
    return a > b


def ge(a, b) -> bool:
    return a >= b


# --- special ---
def isNaN(a) -> bool:
    return any(x != x for x in _arr(a))


def isInf(a) -> bool:
    return any((x != x) or math.isinf(x) for x in _arr(a))


def select(condition: bool, a, b):
    return a if condition else b


def switchCase(selection, cases: list, values: list, dflt):
    for i in range(len(cases)):
        if cases[i] == selection:
            return values[i]
    return dflt


# --- trig / hyperbolic / exp ---
def rad(a):
    return _map1(a, lambda x: (x * math.pi) / 180)


def deg(a):
    return _map1(a, lambda x: (x * 180) / math.pi)


def sin(a):
    return _map1(a, safe_sin)


def cos(a):
    return _map1(a, safe_cos)


def tan(a):
    return _map1(a, safe_tan)


def asin(a):
    return _map1(a, safe_asin)


def acos(a):
    return _map1(a, safe_acos)


def atan(a):
    return _map1(a, math.atan)


def atan2(a, b):
    return _map2(a, b, math.atan2)


def sinh(a):
    return _map1(a, lambda x: (math.exp(x) - math.exp(-x)) / 2)


def cosh(a):
    return _map1(a, lambda x: (math.exp(x) + math.exp(-x)) / 2)


def tanh(a):
    def f(x: float) -> float:
        if x == math.inf:
            return 1.0
        if x == -math.inf:
            return -1.0
        e2x = math.exp(2 * x)
        return (e2x - 1) / (e2x + 1)

    return _map1(a, f)


def asinh(a):
    return _map1(a, lambda x: safe_log(x + safe_sqrt(x * x + 1)))


def acosh(a):
    return _map1(a, lambda x: safe_log(x + safe_sqrt(x * x - 1)))


def atanh(a):
    return _map1(a, lambda x: 0.5 * safe_log(safe_div(1 + x, 1 - x)))


def pow_(a, b):
    return _map2(a, b, safe_pow)


def exp(a):
    return _map1(a, math.exp)


def log(a):
    return _map1(a, safe_log)


def log2(a):
    return _map1(a, safe_log2)


def log10(a):
    return _map1(a, safe_log10)


def sqrt(a):
    return _map1(a, safe_sqrt)


def cbrt(a):
    def f(x: float) -> float:
        if x < 0:
            return -((-x) ** (1 / 3))
        return x ** (1 / 3)

    return _map1(a, f)


# --- bool / int bitwise ---
def and_(a: bool, b: bool) -> bool:
    return a and b


def andInt(a: int, b: int) -> int:
    return to_int32(to_int32(a) & to_int32(b))


def or_(a: bool, b: bool) -> bool:
    return a or b


def orInt(a: int, b: int) -> int:
    return to_int32(to_int32(a) | to_int32(b))


def not_(a: bool) -> bool:
    return not a


def notInt(a: int) -> int:
    return to_int32(~to_int32(a))


def xor(a: bool, b: bool) -> bool:
    return a != b


def xorInt(a: int, b: int) -> int:
    return to_int32(to_int32(a) ^ to_int32(b))


def asr(a: int, b: int) -> int:
    av = to_int32(a)
    shift = to_int32(b) % 32
    if shift == 0:
        return av
    return to_int32(math.floor(av / (2 ** shift)))


def lsl(a: int, b: int) -> int:
    shift = to_int32(b) % 32
    return to_int32(to_int32(a) * (2 ** shift))


def clz(a: int) -> int:
    v = to_int32(a)
    if v < 0:
        v += 4294967296
    if v == 0:
        return 32
    count = 0
    while v < 2147483648:
        v *= 2
        count += 1
    return count


def ctz(a: int) -> int:
    v = to_int32(a)
    if v == 0:
        return 32
    if v < 0:
        v += 4294967296
    count = 0
    while v % 2 == 0:
        v //= 2
        count += 1
    return count


def popcnt(a: int) -> int:
    v = to_int32(a)
    if v < 0:
        v += 4294967296
    count = 0
    while v != 0:
        count += v & 1
        v >>= 1
    return count


# --- vector ---
def length(a: list) -> float:
    return kmath.hypot(*a)


def normalize(a: list) -> dict:
    if any((x != x) or math.isinf(x) for x in a):
        return {"value": [0.0] * len(a), "isValid": False}
    len_ = kmath.hypot(*a)
    if len_ == 0:
        return {"value": [0.0] * len(a), "isValid": False}
    return {"value": [x / len_ for x in a], "isValid": True}


def dot(a: list, b: list) -> float:
    n = min(len(a), len(b))
    total = 0.0
    for i in range(n):
        total += a[i] * b[i]
    return total


def cross(a: list, b: list) -> list:
    return kmath.cross_vec3(a, b)


def rotate2D(a: list, angle: float) -> list:
    return kmath.rotate_2d(a, angle)


def rotate3D(a: list, rotation: list) -> list:
    qx = rotation[0] if len(rotation) > 0 else 0
    qy = rotation[1] if len(rotation) > 1 else 0
    qz = rotation[2] if len(rotation) > 2 else 0
    qw = rotation[3] if len(rotation) > 3 else 1
    ax = a[0] if len(a) > 0 else 0
    ay = a[1] if len(a) > 1 else 0
    az = a[2] if len(a) > 2 else 0
    cx = qy * az - qz * ay + qw * ax
    cy = qz * ax - qx * az + qw * ay
    cz = qx * ay - qy * ax + qw * az
    return [
        ax + 2 * (qy * cz - qz * cy),
        ay + 2 * (qz * cx - qx * cz),
        az + 2 * (qx * cy - qy * cx),
    ]


def transform(a: list, b: list) -> list:
    matrix = a if len(a) == 16 else b
    vector = b if len(a) == 16 else a
    transformed = kmath.transform_vec3(matrix, vector)
    return transformed if len(vector) == 4 else transformed[:3]


def slerp(a: list, b: list, t: float) -> list:
    return kmath.vector_slerp(a, b, t)


# --- matrix ---
def transpose(a: list) -> list:
    return _mat_dispatch(
        a,
        lambda mtx: [mtx[0], mtx[2], mtx[1], mtx[3]],
        lambda mtx: [mtx[0], mtx[3], mtx[6], mtx[1], mtx[4], mtx[7], mtx[2], mtx[5], mtx[8]],
        kmath.mat4_transpose,
    )


def determinant(a: list) -> float:
    return _mat_dispatch(a, kmath.mat2_determinant, kmath.mat3_determinant, kmath.mat4_determinant)


def inverse(a: list) -> dict:
    return _mat_dispatch(a, kmath.mat2_invert, kmath.mat3_invert, kmath.mat4_invert)


def matMul(a: list, b: list) -> list:
    return _mat_dispatch(
        a,
        lambda mtx: kmath.mat2_mul(mtx, b),
        lambda mtx: kmath.mat3_mul(mtx, b),
        lambda mtx: kmath.mat4_mul(mtx, b),
    )


def matCompose(translation: list, rotation: list, scale: list) -> list:
    return kmath.mat4_compose(translation, rotation, scale)


def matDecompose(a: list) -> dict:
    return kmath.mat4_decompose(a)


# --- quaternion ---
def quatConjugate(a: list) -> list:
    return [-a[0], -a[1], -a[2], a[3]]


def quatMul(a: list, b: list) -> list:
    return kmath.quat_mul(a, b)


def quatAngleBetween(a: list, b: list) -> float:
    return kmath.quat_angle_between(a, b)


def quatFromAxisAngle(axis: list, angle: float) -> list:
    return kmath.quat_from_axis_angle(axis, angle)


def quatToAxisAngle(a: list) -> dict:
    return kmath.quat_to_axis_angle(a)


def quatFromDirections(a: list, b: list) -> list:
    return kmath.quat_from_directions(a, b)


def quatFromUpForward(up: list, forward: list) -> list:
    return kmath.quat_from_up_forward(up, forward)


def quatFromAngles(x: float, y: float, z: float, order: str) -> list:
    angles = {"x": x, "y": y, "z": z}
    axes = {"x": [1, 0, 0], "y": [0, 1, 0], "z": [0, 0, 1]}
    q = [0, 0, 0, 1]
    for axis in order:
        q = kmath.quat_mul(q, kmath.quat_from_axis_angle(axes.get(axis, [0, 0, 0]), angles.get(axis, 0)))
    return q


def quatSlerp(a: list, b: list, t: float) -> list:
    return kmath.quat_slerp(a, b, t)


# --- color ---
def rgbToOkLCh(r: float, g: float, b: float) -> dict:
    def cbrt_(x: float) -> float:
        if x < 0:
            return -((-x) ** (1 / 3))
        return x ** (1 / 3)

    lp = cbrt_(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    mp = cbrt_(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    sp = cbrt_(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp
    a_lab = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp
    b_lab = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
    return {"l": l, "c": math.sqrt(a_lab * a_lab + b_lab * b_lab), "h": math.atan2(b_lab, a_lab)}


def rgbFromOkLCh(l: float, c: float, h: float) -> dict:
    a_lab = c * math.cos(h)
    b_lab = c * math.sin(h)
    lp = safe_pow(l + 0.3963377774 * a_lab + 0.2158037573 * b_lab, 3.0)
    mp = safe_pow(l - 0.1055613458 * a_lab - 0.0638541728 * b_lab, 3.0)
    sp = safe_pow(l - 0.0894841775 * a_lab - 1.291485548 * b_lab, 3.0)
    return {
        "r": 4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
        "g": -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
        "b": -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp,
    }


# --- vector/matrix construction & extraction ---
def combine2(a: float, b: float) -> list:
    return [a, b]


def combine3(a: float, b: float, c: float) -> list:
    return [a, b, c]


def combine4(a: float, b: float, c: float, d: float) -> list:
    return [a, b, c, d]


def combine2x2(a: float, b: float, c: float, d: float) -> list:
    return [a, b, c, d]


def combine3x3(a, b, c, d, e, f, g, h, i) -> list:
    return [a, b, c, d, e, f, g, h, i]


def combine4x4(*values: float) -> list:
    return list(values)


def extract2(a: list) -> list:
    return a


def extract3(a: list) -> list:
    return a


def extract4(a: list) -> list:
    return a


def extract2x2(a: list) -> list:
    return a


def extract3x3(a: list) -> list:
    return a


def extract4x4(a: list) -> list:
    return a


# --- ref ---
def refEq(a: str, b: str) -> bool:
    return a == b


# --- type conversions ---
def boolToInt(a: bool) -> int:
    return 1 if a else 0


def boolToFloat(a: bool) -> float:
    return 1.0 if a else 0.0


def intToBool(a: int) -> bool:
    return a != 0


def intToFloat(a: int) -> float:
    return float(a)


def floatToBool(a: float) -> bool:
    return a == a and a != 0


def floatToInt(a: float) -> int:
    return to_int32(a)
