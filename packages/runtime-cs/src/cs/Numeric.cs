// Numeric primitives matching ECMAScript/Lua-backend semantics exactly.
// Ported by transcription from packages/runtime-py/src/py/gltfi_runtime/
// numeric.py (that file's own header documents, function-by-function, every
// way Python's math library disagrees with JS — the reason runtime-py needed
// this module at all). C#'s System.Math is, by contrast, IEEE-754-754
// compliant end-to-end: Math.Sqrt/Log/Log2/Log10/Asin/Acos/Sin/Cos/Tan/Floor/
// Ceiling/Truncate all already return NaN/+-Infinity for out-of-domain or
// non-finite input instead of throwing (verified against the documented
// .NET behavior for each — e.g. Math.Log(0) is NegativeInfinity, Math.Log(-1)
// is NaN, Math.Asin(2) is NaN, Math.Sin(double.PositiveInfinity) is NaN), and
// `/` and `%` on `double` already implement IEEE div-by-zero -> +-Inf/NaN and
// C-fmod-with-NaN-propagating-zero-divisor semantics natively. So most of
// this file's "Safe*" wrappers exist purely for call-site/readability parity
// with the Python/Lua backends' identical-named helpers (every m.* caller
// still routes through Numeric.SafeFoo, not raw Math.Foo, so a future
// contributor scanning this backend sees the same shape as the other two) —
// only ToInt32, SafeRound, and SafePow have any real logic of their own; see
// each one's comment for why.
using System;

namespace GltfiRuntime;

public static class Numeric
{
    public static bool IsNaN(double x) => double.IsNaN(x);

    // Order-independent NaN-propagating min/max (JS's Math.min/Math.max) —
    // .NET's own Math.Min/Math.Max are ALSO order-independent NaN-propagating
    // already (unlike Python's builtin min/max, which is why numeric.py
    // needed this at all) but named to match the Python/Lua backends' call
    // sites 1:1.
    public static double FMin(double a, double b) => Math.Min(a, b);
    public static double FMax(double a, double b) => Math.Max(a, b);
    public static double FClamp(double lo, double hi, double x) => FMax(lo, FMin(hi, x));

    // ECMAScript's ToInt32 abstract operation: NaN/+-Infinity -> 0, else
    // truncate toward zero then wrap into signed 32-bit range. `double`
    // arithmetic (not a `long` cast) handles the truncated magnitude even
    // when it exceeds Int64's range (e.g. 1e20): `t % 4294967296.0` is exact
    // (both operands, and the mathematical result, are exactly representable
    // as `double` — the result's magnitude is always < 2^32 < 2^53) whether
    // or not `t` itself fits in a `long`.
    public static int ToInt32(double x)
    {
        if (double.IsNaN(x) || double.IsInfinity(x))
        {
            return 0;
        }
        double t = Math.Truncate(x);
        double m = t % 4294967296.0;
        if (m < 0)
        {
            m += 4294967296.0;
        }
        uint u = (uint)m;
        return unchecked((int)u);
    }

    public static double SafeDiv(double x, double y) => x / y;
    public static double SafeFMod(double x, double y) => x % y;
    public static double SafeFloor(double x) => Math.Floor(x);
    public static double SafeCeil(double x) => Math.Ceiling(x);
    public static double SafeTrunc(double x) => Math.Truncate(x);

    // Matches JS's Math.round: round-half-up in MAGNITUDE (sign *
    // floor(|x| + 0.5)), NOT .NET's Math.Round (banker's rounding by
    // default) or plain floor semantics — the one Numeric.* wrapper besides
    // ToInt32/SafePow that needs real logic, not just a passthrough.
    public static double SafeRound(double x)
    {
        if (double.IsNaN(x) || double.IsInfinity(x))
        {
            return x;
        }
        double sign = x >= 0 ? 1.0 : -1.0;
        return sign * Math.Floor(Math.Abs(x) + 0.5);
    }

    public static double SafeSqrt(double x) => Math.Sqrt(x);
    public static double SafeLog(double x) => Math.Log(x);
    public static double SafeLog2(double x) => Math.Log2(x);
    public static double SafeLog10(double x) => Math.Log10(x);
    public static double SafeAsin(double x) => Math.Asin(x);
    public static double SafeAcos(double x) => Math.Acos(x);
    public static double SafeSin(double x) => Math.Sin(x);
    public static double SafeCos(double x) => Math.Cos(x);
    public static double SafeTan(double x) => Math.Tan(x);

    private static bool IsIntValued(double x) => !double.IsInfinity(x) && x == Math.Floor(x);
    private static bool IsOddInt(double x) => IsIntValued(x) && ((long)x % 2 != 0);

    // Matches ECMAScript's Number::exponentiate exactly (transcribed from
    // numeric.py's safe_pow, itself transcribed from the same spec) — NOT
    // .NET's native Math.Pow, which is IEEE-754/C99 `pow` and genuinely
    // disagrees with the JS spec at a couple of edge cases the spec
    // deliberately special-cases (e.g. `pow(+-1, +-Infinity)` is NaN per
    // ECMA-262 but 1 per C99/.NET's Math.Pow). Every special case below
    // mirrors safe_pow's own branch order 1:1; only the final fallback
    // (`Math.Pow(a, b)`) differs from Python's version, which needed a
    // try/except AND a `complex`-result check — neither applies in C#:
    // Math.Pow never throws, and (unlike Python's `**`) never silently
    // returns a complex number for a negative base with fractional exponent
    // (it returns NaN directly, matching JS already), so the a<0-and-
    // non-integer-exponent case is fully handled by the explicit guard
    // above the fallback, not by inspecting the fallback's result type.
    public static double SafePow(double a, double b)
    {
        if (double.IsNaN(a) || double.IsNaN(b))
        {
            return double.NaN;
        }
        if (b == 0.0)
        {
            return 1.0;
        }
        bool aNegZero = a == 0.0 && double.IsNegative(a);
        if (a == 0.0)
        {
            if (b < 0)
            {
                return (aNegZero && IsOddInt(b)) ? double.NegativeInfinity : double.PositiveInfinity;
            }
            return (aNegZero && IsOddInt(b)) ? -0.0 : 0.0;
        }
        if (double.IsInfinity(a))
        {
            if (b < 0)
            {
                return 0.0;
            }
            if (a < 0)
            {
                return IsOddInt(b) ? double.NegativeInfinity : double.PositiveInfinity;
            }
            return double.PositiveInfinity;
        }
        if (double.IsInfinity(b))
        {
            double aa = Math.Abs(a);
            if (aa == 1.0)
            {
                return double.NaN;
            }
            return (aa > 1.0) == (b > 0) ? double.PositiveInfinity : 0.0;
        }
        if (a < 0 && !IsIntValued(b))
        {
            return double.NaN;
        }
        return Math.Pow(a, b);
    }
}
