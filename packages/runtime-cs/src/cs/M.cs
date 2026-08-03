// Static C# math/type/ref namespace for compiled (emit-cs) output. Mirrors
// packages/runtime-lib/src/math.ts's `m` namespace exactly (same function
// NAMES, camelCase-preserved so @gltfi/kernel's fn-naming.ts reverse table —
// already shared by @gltfi/parse-ts/@gltfi/parse-lua — works unmodified for
// a future @gltfi/parse-cs too) and packages/runtime-py/src/py/gltfi_runtime/
// m.py's semantics (that file's own header documents every Python-vs-JS
// numeric-semantics gotcha this backend must also respect).
//
// Representation: scalar float = C# `double`; scalar int = C# `int`; scalar
// bool = C# `bool`; ref = C# `string`; vector/matrix = 0-based `double[]`.
// Every "F-family" op (abs/add/floor/sin/...) is overloaded ONCE per shape —
// `double Foo(double a)` and `double[] Foo(double[] a)` share the SAME
// method name (mirrors m.py's own single polymorphic `def foo(a)`, and keeps
// mFunctionName's naming table in emit-cs identical for float and vector
// call sites: only the INT-typed sibling gets a distinct "Foo"+"Int" name,
// exactly like the Python/Lua/TS backends). C#'s generic-F sockets always
// resolve every "F"-typed input of one op to the SAME concrete type (see
// packages/kernel/src/registry.ts's own "All generic sockets of one node
// must resolve to the SAME concrete type" comment) — so, unlike m.py's
// defensively-broadcasting _map2 (which has to tolerate mismatched-length
// inputs because Python's dynamic typing can't rule that out), every vector
// overload here assumes EQUAL-length inputs (guaranteed by construction) and
// loops accordingly — the one deliberate behavioral simplification versus
// the Python transcription, safe because it can never actually be exercised
// differently.
//
// A great deal of what needed an explicit "safe" wrapper in the Python
// backend is a native IEEE-754 operation in C# and needs none here — see
// Numeric.cs's own header for the full rationale (Math.Sqrt/Log/Asin/Acos/
// Sin/Cos/Tan/Floor/Ceiling/Truncate, and `/`/`%` on `double`, are already
// spec-conformant); this file leans on that throughout instead of
// reimplementing domain-guard logic. Two more full-width native-CLR wins
// specific to the int-bitwise family: `System.Numerics.BitOperations.
// LeadingZeroCount/TrailingZeroCount/PopCount(uint)` already match this
// spec's clz/ctz(0)=32/popcnt exactly, and C#'s native `<<`/`>>` on `int`
// already mask the shift count to the low 5 bits (`count & 0x1F`) per the
// language spec — for a POWER-OF-TWO modulus like 32 that is arithmetically
// identical to Python's/JS's `shift % 32` even for negative shift counts, so
// Asr/Lsl below are bare one-line native operators, unlike kmath.py's/
// numeric.py's manual masking-and-doubling loops.
using System;
using System.Numerics;

namespace GltfiRuntime;

public static class M
{
    // -------------------------------------------------------------------
    // internal helpers
    // -------------------------------------------------------------------

    private static double[] Map1(double[] a, Func<double, double> f)
    {
        var outArr = new double[a.Length];
        for (var i = 0; i < a.Length; i++)
        {
            outArr[i] = f(a[i]);
        }
        return outArr;
    }

    private static double[] Map2(double[] a, double[] b, Func<double, double, double> f)
    {
        var n = Math.Max(a.Length, b.Length);
        var outArr = new double[n];
        for (var i = 0; i < n; i++)
        {
            var x = i < a.Length ? a[i] : (a.Length == 1 ? a[0] : 0.0);
            var y = i < b.Length ? b[i] : (b.Length == 1 ? b[0] : 0.0);
            outArr[i] = f(x, y);
        }
        return outArr;
    }

    private static double FSign(double x)
    {
        if (double.IsNaN(x))
        {
            return x;
        }
        if (x > 0)
        {
            return 1.0;
        }
        if (x < 0)
        {
            return -1.0;
        }
        return x;
    }

    // --- constants ---
    public static double E() => Math.E;
    public static double Pi() => Math.PI;
    public static double Tau() => 2 * Math.PI;
    public static double Inf() => double.PositiveInfinity;
    public static double NaN() => double.NaN;

    // --- float arith (component-wise, NaN-propagating) ---
    public static double Abs(double a) => Math.Abs(a);
    public static double[] Abs(double[] a) => Map1(a, Math.Abs);
    public static int AbsInt(int a) => Numeric.ToInt32(Math.Abs((double)a));

    public static double Sign(double a) => FSign(a);
    public static double[] Sign(double[] a) => Map1(a, FSign);
    public static int SignInt(int a) => (int)FSign(a);

    public static double Trunc(double a) => Numeric.SafeTrunc(a);
    public static double[] Trunc(double[] a) => Map1(a, Numeric.SafeTrunc);
    public static double Floor(double a) => Numeric.SafeFloor(a);
    public static double[] Floor(double[] a) => Map1(a, Numeric.SafeFloor);
    public static double Ceil(double a) => Numeric.SafeCeil(a);
    public static double[] Ceil(double[] a) => Map1(a, Numeric.SafeCeil);
    public static double Round(double a) => Numeric.SafeRound(a);
    public static double[] Round(double[] a) => Map1(a, Numeric.SafeRound);
    public static double Fract(double a) => a - Numeric.SafeFloor(a);
    public static double[] Fract(double[] a) => Map1(a, x => x - Numeric.SafeFloor(x));

    public static double Neg(double a) => -a;
    public static double[] Neg(double[] a) => Map1(a, x => -x);
    public static int NegInt(int a) => Numeric.ToInt32(-(double)a);

    public static double Saturate(double a) => Numeric.FMax(Numeric.FMin(a, 1), 0);
    public static double[] Saturate(double[] a) => Map1(a, x => Numeric.FMax(Numeric.FMin(x, 1), 0));

    public static double Add(double a, double b) => a + b;
    public static double[] Add(double[] a, double[] b) => Map2(a, b, (x, y) => x + y);
    public static int AddInt(int a, int b) => unchecked(a + b);

    public static double Sub(double a, double b) => a - b;
    public static double[] Sub(double[] a, double[] b) => Map2(a, b, (x, y) => x - y);
    public static int SubInt(int a, int b) => unchecked(a - b);

    public static double Mul(double a, double b) => a * b;
    public static double[] Mul(double[] a, double[] b) => Map2(a, b, (x, y) => x * y);
    public static int MulInt(int a, int b) => unchecked(a * b);

    public static double Div(double a, double b) => Numeric.SafeDiv(a, b);
    public static double[] Div(double[] a, double[] b) => Map2(a, b, Numeric.SafeDiv);
    public static int DivInt(int a, int b) => Numeric.ToInt32(Numeric.SafeDiv(a, b));

    public static double Rem(double a, double b) => Numeric.SafeFMod(a, b);
    public static double[] Rem(double[] a, double[] b) => Map2(a, b, Numeric.SafeFMod);
    public static int RemInt(int a, int b) => Numeric.ToInt32(Numeric.SafeFMod(a, b));

    public static double Min(double a, double b) => Numeric.FMin(a, b);
    public static double[] Min(double[] a, double[] b) => Map2(a, b, Numeric.FMin);
    public static int MinInt(int a, int b) => Math.Min(a, b);

    public static double Max(double a, double b) => Numeric.FMax(a, b);
    public static double[] Max(double[] a, double[] b) => Map2(a, b, Numeric.FMax);
    public static int MaxInt(int a, int b) => Math.Max(a, b);

    public static double Clamp(double a, double b, double c) => Numeric.FMax(b, Numeric.FMin(c, a));
    public static double[] Clamp(double[] a, double[] b, double[] c)
    {
        var n = a.Length;
        var outArr = new double[n];
        for (var i = 0; i < n; i++)
        {
            var lo = i < b.Length ? b[i] : b[0];
            var hi = i < c.Length ? c[i] : c[0];
            outArr[i] = Numeric.FMax(lo, Numeric.FMin(hi, a[i]));
        }
        return outArr;
    }
    public static int ClampInt(int a, int b, int c) => Math.Max(b, Math.Min(c, a));

    // c (interpolation factor) is DECLARED scalar "float" in registry.ts's
    // math/mix overload (a,b:F, c:float), but packages/runtime/src/
    // interpreter.ts's actual case "math/mix" (the conformance-tested
    // authority) reads c via plain `valueToNumberArray(c)[0] ?? 0` with NO
    // type restriction — i.e. a real graph CAN wire a vector-producing node
    // into "c" and only its first component is used as the interpolation
    // factor (m.py's own `mix` mirrors this exact tolerance: `t = _arr(c)[0]
    // if _arr(c) else 0`). So all four (a/b scalar-or-vector) x (c scalar-
    // or-vector) combinations are real, reachable overloads here, not just
    // the two the registry's literal declaration would suggest.
    public static double Mix(double a, double b, double c) => a + (b - a) * c;
    public static double[] Mix(double[] a, double[] b, double c)
    {
        var outArr = new double[a.Length];
        for (var i = 0; i < a.Length; i++)
        {
            var bv = i < b.Length ? b[i] : b[0];
            outArr[i] = a[i] + (bv - a[i]) * c;
        }
        return outArr;
    }
    public static double[] Mix(double[] a, double[] b, double[] c) => Mix(a, b, c.Length > 0 ? c[0] : 0.0);
    public static double Mix(double a, double b, double[] c) => Mix(a, b, c.Length > 0 ? c[0] : 0.0);

    public static double SmoothStep(double a, double b, double c)
    {
        var t = Numeric.FMin(1, Numeric.FMax(0, Numeric.SafeDiv(c - Numeric.FMin(a, b), Math.Abs(b - a))));
        return t * t * (3 - 2 * t);
    }
    public static double[] SmoothStep(double[] a, double[] b, double[] c)
    {
        var n = c.Length;
        var outArr = new double[n];
        for (var i = 0; i < n; i++)
        {
            var av = i < a.Length ? a[i] : a[0];
            var bv = i < b.Length ? b[i] : b[0];
            var t = Numeric.FMin(1, Numeric.FMax(0, Numeric.SafeDiv(c[i] - Numeric.FMin(av, bv), Math.Abs(bv - av))));
            outArr[i] = t * t * (3 - 2 * t);
        }
        return outArr;
    }

    // --- comparison (float/bool/int scalar eq/lt/le/gt/ge are natively
    // substituted by emit-cs — see that file's nativeOpInfo — so these are
    // reached only for vector/matrix eq, or a direct hand-written caller.)
    public static bool Eq(double a, double b) => a == b;
    public static bool Eq(double[] a, double[] b)
    {
        var n = Math.Max(a.Length, b.Length);
        for (var i = 0; i < n; i++)
        {
            var x = i < a.Length ? a[i] : (a.Length == 1 ? a[0] : double.NaN);
            var y = i < b.Length ? b[i] : (b.Length == 1 ? b[0] : double.NaN);
            if (x != y)
            {
                return false;
            }
        }
        return true;
    }
    public static bool EqInt(int a, int b) => a == b;
    public static bool EqBool(bool a, bool b) => a == b;

    public static bool Lt(double a, double b) => a < b;
    public static bool Le(double a, double b) => a <= b;
    public static bool Gt(double a, double b) => a > b;
    public static bool Ge(double a, double b) => a >= b;

    // --- special ---
    public static bool IsNaN(double a) => double.IsNaN(a);
    public static bool IsNaN(double[] a)
    {
        foreach (var x in a)
        {
            if (double.IsNaN(x))
            {
                return true;
            }
        }
        return false;
    }

    // Mirrors m.py's isInf exactly: NaN counts as "inf-like" too (matches
    // the shared TS/Python oracle's own behavior — not a transcription bug).
    public static bool IsInf(double a) => double.IsNaN(a) || double.IsInfinity(a);
    public static bool IsInf(double[] a)
    {
        foreach (var x in a)
        {
            if (double.IsNaN(x) || double.IsInfinity(x))
            {
                return true;
            }
        }
        return false;
    }

    public static T Select<T>(bool condition, T a, T b) => condition ? a : b;

    public static T SwitchCase<T>(int selection, int[] cases, T[] values, T dflt)
    {
        for (var i = 0; i < cases.Length; i++)
        {
            if (cases[i] == selection)
            {
                return values[i];
            }
        }
        return dflt;
    }

    // --- trig / hyperbolic / exp ---
    public static double Rad(double a) => a * Math.PI / 180;
    public static double[] Rad(double[] a) => Map1(a, x => x * Math.PI / 180);
    public static double Deg(double a) => a * 180 / Math.PI;
    public static double[] Deg(double[] a) => Map1(a, x => x * 180 / Math.PI);

    public static double Sin(double a) => Numeric.SafeSin(a);
    public static double[] Sin(double[] a) => Map1(a, Numeric.SafeSin);
    public static double Cos(double a) => Numeric.SafeCos(a);
    public static double[] Cos(double[] a) => Map1(a, Numeric.SafeCos);
    public static double Tan(double a) => Numeric.SafeTan(a);
    public static double[] Tan(double[] a) => Map1(a, Numeric.SafeTan);
    public static double Asin(double a) => Numeric.SafeAsin(a);
    public static double[] Asin(double[] a) => Map1(a, Numeric.SafeAsin);
    public static double Acos(double a) => Numeric.SafeAcos(a);
    public static double[] Acos(double[] a) => Map1(a, Numeric.SafeAcos);
    public static double Atan(double a) => Math.Atan(a);
    public static double[] Atan(double[] a) => Map1(a, Math.Atan);
    public static double Atan2(double a, double b) => Math.Atan2(a, b);
    public static double[] Atan2(double[] a, double[] b) => Map2(a, b, Math.Atan2);

    public static double Sinh(double a) => (Math.Exp(a) - Math.Exp(-a)) / 2;
    public static double[] Sinh(double[] a) => Map1(a, x => (Math.Exp(x) - Math.Exp(-x)) / 2);
    public static double Cosh(double a) => (Math.Exp(a) + Math.Exp(-a)) / 2;
    public static double[] Cosh(double[] a) => Map1(a, x => (Math.Exp(x) + Math.Exp(-x)) / 2);

    private static double TanhScalar(double x)
    {
        if (double.IsPositiveInfinity(x))
        {
            return 1.0;
        }
        if (double.IsNegativeInfinity(x))
        {
            return -1.0;
        }
        var e2x = Math.Exp(2 * x);
        return (e2x - 1) / (e2x + 1);
    }
    public static double Tanh(double a) => TanhScalar(a);
    public static double[] Tanh(double[] a) => Map1(a, TanhScalar);

    public static double Asinh(double a) => Numeric.SafeLog(a + Numeric.SafeSqrt(a * a + 1));
    public static double[] Asinh(double[] a) => Map1(a, x => Numeric.SafeLog(x + Numeric.SafeSqrt(x * x + 1)));
    public static double Acosh(double a) => Numeric.SafeLog(a + Numeric.SafeSqrt(a * a - 1));
    public static double[] Acosh(double[] a) => Map1(a, x => Numeric.SafeLog(x + Numeric.SafeSqrt(x * x - 1)));
    public static double Atanh(double a) => 0.5 * Numeric.SafeLog(Numeric.SafeDiv(1 + a, 1 - a));
    public static double[] Atanh(double[] a) => Map1(a, x => 0.5 * Numeric.SafeLog(Numeric.SafeDiv(1 + x, 1 - x)));

    public static double Pow(double a, double b) => Numeric.SafePow(a, b);
    public static double[] Pow(double[] a, double[] b) => Map2(a, b, Numeric.SafePow);

    public static double Exp(double a) => Math.Exp(a);
    public static double[] Exp(double[] a) => Map1(a, Math.Exp);
    public static double Log(double a) => Numeric.SafeLog(a);
    public static double[] Log(double[] a) => Map1(a, Numeric.SafeLog);
    public static double Log2(double a) => Numeric.SafeLog2(a);
    public static double[] Log2(double[] a) => Map1(a, Numeric.SafeLog2);
    public static double Log10(double a) => Numeric.SafeLog10(a);
    public static double[] Log10(double[] a) => Map1(a, Numeric.SafeLog10);
    public static double Sqrt(double a) => Numeric.SafeSqrt(a);
    public static double[] Sqrt(double[] a) => Map1(a, Numeric.SafeSqrt);

    private static double CbrtScalar(double x) => x < 0 ? -Math.Pow(-x, 1.0 / 3.0) : Math.Pow(x, 1.0 / 3.0);
    public static double Cbrt(double a) => CbrtScalar(a);
    public static double[] Cbrt(double[] a) => Map1(a, CbrtScalar);

    // --- bool / int bitwise ---
    public static bool And(bool a, bool b) => a && b;
    public static int AndInt(int a, int b) => a & b;
    public static bool Or(bool a, bool b) => a || b;
    public static int OrInt(int a, int b) => a | b;
    public static bool Not(bool a) => !a;
    public static int NotInt(int a) => ~a;
    public static bool Xor(bool a, bool b) => a != b;
    public static int XorInt(int a, int b) => a ^ b;

    // C#'s native `<<`/`>>` on `int` already mask the shift count to the
    // low-order 5 bits (`count & 0x1F`) per the language spec, and `>>` on a
    // signed `int` is already arithmetic (sign-propagating) — both exactly
    // matching the spec's asr/lsl, including for negative shift counts
    // (masking a two's-complement bit pattern to 5 bits is arithmetically
    // identical to a true non-negative `mod 32` for any input, since 32 is a
    // power of two). No manual masking/doubling loop needed, unlike
    // kmath.py's/m.py's Python transcription.
    public static int Asr(int a, int b) => a >> b;
    public static int Lsl(int a, int b) => a << b;

    public static int Clz(int a) => BitOperations.LeadingZeroCount(unchecked((uint)a));
    public static int Ctz(int a) => BitOperations.TrailingZeroCount(unchecked((uint)a));
    public static int Popcnt(int a) => BitOperations.PopCount(unchecked((uint)a));

    // --- vector ---
    public static double Length(double[] a) => KMath.Hypot(a);

    public static (double[] Value, bool IsValid) Normalize(double[] a)
    {
        foreach (var x in a)
        {
            if (double.IsNaN(x) || double.IsInfinity(x))
            {
                return (new double[a.Length], false);
            }
        }
        var len = KMath.Hypot(a);
        if (len == 0)
        {
            return (new double[a.Length], false);
        }
        var outArr = new double[a.Length];
        for (var i = 0; i < a.Length; i++)
        {
            outArr[i] = a[i] / len;
        }
        return (outArr, true);
    }

    public static double Dot(double[] a, double[] b)
    {
        var n = Math.Min(a.Length, b.Length);
        double total = 0.0;
        for (var i = 0; i < n; i++)
        {
            total += a[i] * b[i];
        }
        return total;
    }

    public static double[] Cross(double[] a, double[] b) => KMath.CrossVec3(a, b);
    public static double[] Rotate2D(double[] a, double angle) => KMath.Rotate2D(a, angle);

    public static double[] Rotate3D(double[] a, double[] rotation)
    {
        var qx = rotation.Length > 0 ? rotation[0] : 0;
        var qy = rotation.Length > 1 ? rotation[1] : 0;
        var qz = rotation.Length > 2 ? rotation[2] : 0;
        var qw = rotation.Length > 3 ? rotation[3] : 1;
        var ax = a.Length > 0 ? a[0] : 0;
        var ay = a.Length > 1 ? a[1] : 0;
        var az = a.Length > 2 ? a[2] : 0;
        var cx = qy * az - qz * ay + qw * ax;
        var cy = qz * ax - qx * az + qw * ay;
        var cz = qx * ay - qy * ax + qw * az;
        return new[]
        {
            ax + 2 * (qy * cz - qz * cy),
            ay + 2 * (qz * cx - qx * cz),
            az + 2 * (qx * cy - qy * cx)
        };
    }

    public static double[] Transform(double[] a, double[] b)
    {
        var matrix = a.Length == 16 ? a : b;
        var vector = a.Length == 16 ? b : a;
        var transformed = KMath.TransformVec3(matrix, vector);
        return vector.Length == 4 ? transformed : new[] { transformed[0], transformed[1], transformed[2] };
    }

    public static double[] Slerp(double[] a, double[] b, double t) => KMath.VectorSlerp(a, b, t);

    // --- matrix ---
    private static T MatDispatch<T>(double[] a, Func<double[], T> f2, Func<double[], T> f3, Func<double[], T> f4)
    {
        return a.Length switch
        {
            4 => f2(a),
            9 => f3(a),
            _ => f4(a)
        };
    }

    public static double[] Transpose(double[] a) => MatDispatch(
        a,
        m => new[] { m[0], m[2], m[1], m[3] },
        m => new[] { m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8] },
        KMath.Mat4Transpose);

    public static double Determinant(double[] a) => MatDispatch(a, KMath.Mat2Determinant, KMath.Mat3Determinant, KMath.Mat4Determinant);

    public static (double[] Value, bool IsValid) Inverse(double[] a) => MatDispatch(a, KMath.Mat2Invert, KMath.Mat3Invert, KMath.Mat4Invert);

    public static double[] MatMul(double[] a, double[] b) => MatDispatch(
        a,
        m => KMath.Mat2Mul(m, b),
        m => KMath.Mat3Mul(m, b),
        m => KMath.Mat4Mul(m, b));

    public static double[] MatCompose(double[] translation, double[] rotation, double[] scale) => KMath.Mat4Compose(translation, rotation, scale);

    public static (double[] Translation, double[] Rotation, double[] Scale, bool IsValid) MatDecompose(double[] a) => KMath.Mat4Decompose(a);

    // --- quaternion ---
    public static double[] QuatConjugate(double[] a) => new[] { -a[0], -a[1], -a[2], a[3] };
    public static double[] QuatMul(double[] a, double[] b) => KMath.QuatMul(a, b);
    public static double QuatAngleBetween(double[] a, double[] b) => KMath.QuatAngleBetween(a, b);
    public static double[] QuatFromAxisAngle(double[] axis, double angle) => KMath.QuatFromAxisAngle(axis, angle);
    public static (double[] Axis, double Angle) QuatToAxisAngle(double[] a) => KMath.QuatToAxisAngle(a);
    public static double[] QuatFromDirections(double[] a, double[] b) => KMath.QuatFromDirections(a, b);
    public static double[] QuatFromUpForward(double[] up, double[] forward) => KMath.QuatFromUpForward(up, forward);

    public static double[] QuatFromAngles(double x, double y, double z, string order)
    {
        var angles = new System.Collections.Generic.Dictionary<char, double> { ['x'] = x, ['y'] = y, ['z'] = z };
        var axes = new System.Collections.Generic.Dictionary<char, double[]>
        {
            ['x'] = new double[] { 1, 0, 0 },
            ['y'] = new double[] { 0, 1, 0 },
            ['z'] = new double[] { 0, 0, 1 }
        };
        double[] q = { 0, 0, 0, 1 };
        foreach (var axis in order)
        {
            var ax = axes.TryGetValue(axis, out var av) ? av : new double[] { 0, 0, 0 };
            var an = angles.TryGetValue(axis, out var an2) ? an2 : 0.0;
            q = KMath.QuatMul(q, KMath.QuatFromAxisAngle(ax, an));
        }
        return q;
    }

    public static double[] QuatSlerp(double[] a, double[] b, double t) => KMath.QuatSlerp(a, b, t);

    // --- color ---
    public static (double L, double C, double H) RgbToOkLCh(double r, double g, double b)
    {
        double Cbrt_(double x) => x < 0 ? -Math.Pow(-x, 1.0 / 3.0) : Math.Pow(x, 1.0 / 3.0);
        var lp = Cbrt_(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        var mp = Cbrt_(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        var sp = Cbrt_(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        var l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
        var aLab = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
        var bLab = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
        return (l, Math.Sqrt(aLab * aLab + bLab * bLab), Math.Atan2(bLab, aLab));
    }

    public static (double R, double G, double B) RgbFromOkLCh(double l, double c, double h)
    {
        var aLab = c * Math.Cos(h);
        var bLab = c * Math.Sin(h);
        var lp = Numeric.SafePow(l + 0.3963377774 * aLab + 0.2158037573 * bLab, 3.0);
        var mp = Numeric.SafePow(l - 0.1055613458 * aLab - 0.0638541728 * bLab, 3.0);
        var sp = Numeric.SafePow(l - 0.0894841775 * aLab - 1.291485548 * bLab, 3.0);
        return (
            4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
            -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
            -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp);
    }

    // --- vector/matrix construction & extraction ---
    public static double[] Combine2(double a, double b) => new[] { a, b };
    public static double[] Combine3(double a, double b, double c) => new[] { a, b, c };
    public static double[] Combine4(double a, double b, double c, double d) => new[] { a, b, c, d };
    public static double[] Combine2x2(double a, double b, double c, double d) => new[] { a, b, c, d };
    public static double[] Combine3x3(double a, double b, double c, double d, double e, double f, double g, double h, double i) =>
        new[] { a, b, c, d, e, f, g, h, i };
    public static double[] Combine4x4(params double[] values) => values;

    public static double[] Extract2(double[] a) => a;
    public static double[] Extract3(double[] a) => a;
    public static double[] Extract4(double[] a) => a;
    public static double[] Extract2x2(double[] a) => a;
    public static double[] Extract3x3(double[] a) => a;
    public static double[] Extract4x4(double[] a) => a;

    // --- ref ---
    public static bool RefEq(string a, string b) => a == b;

    // --- type conversions ---
    public static int BoolToInt(bool a) => a ? 1 : 0;
    public static double BoolToFloat(bool a) => a ? 1.0 : 0.0;
    public static bool IntToBool(int a) => a != 0;
    public static double IntToFloat(int a) => a;
    public static bool FloatToBool(double a) => !double.IsNaN(a) && a != 0;
    public static int FloatToInt(double a) => Numeric.ToInt32(a);
}
