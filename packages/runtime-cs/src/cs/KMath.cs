// Pure math helpers, ported by transcription from packages/runtime-py/src/py/
// gltfi_runtime/kmath.py (itself a transcription of packages/kernel/src/
// math.ts — the ultimate oracle; see that file's header for the
// quaternion/matrix algebra, spherical interpolation, and easing it
// implements). Vectors/matrices are 0-based double[] arrays, matching both
// oracles' 0-based indexing exactly (no index-base conversion needed, unlike
// this repo's Lua backend). Column-major, same as the TS source. Multi-output
// helpers return C# named ValueTuples (mirrors math.ts's own object-literal
// return shape / kmath.py's dict return shape).
using System;

namespace GltfiRuntime;

public static class KMath
{
    public static double Hypot(params double[] args)
    {
        double sum = 0.0;
        for (int i = 0; i < args.Length; i++)
        {
            sum += args[i] * args[i];
        }
        return Math.Sqrt(sum);
    }

    public static double[] QuatNormalize(double[] q)
    {
        double len_ = Hypot(q[0], q[1], q[2], q[3]);
        if (len_ == 0)
        {
            len_ = 1;
        }
        return new double[] { q[0] / len_, q[1] / len_, q[2] / len_, q[3] / len_ };
    }

    public static double[] QuatMul(double[] a, double[] b)
    {
        double ax = a[0], ay = a[1], az = a[2], aw = a[3];
        double bx = b[0], by = b[1], bz = b[2], bw = b[3];
        return new double[]
        {
            aw * bx + ax * bw + ay * bz - az * by,
            aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw,
            aw * bw - ax * bx - ay * by - az * bz,
        };
    }

    public static double[] VectorSlerp(double[] a, double[] b, double t)
    {
        int n = Math.Max(a.Length, b.Length);
        double la = Hypot(a);
        double lb = Hypot(b);
        if (la == 0 || lb == 0)
        {
            double[] outv = new double[n];
            for (int i = 0; i < n; i++)
            {
                double ai = i < a.Length ? a[i] : 0;
                double bi = i < b.Length ? b[i] : 0;
                outv[i] = ai + (bi - ai) * t;
            }
            return outv;
        }
        double[] na = new double[a.Length];
        for (int i = 0; i < a.Length; i++)
        {
            na[i] = a[i] / la;
        }
        double[] nb = new double[b.Length];
        for (int i = 0; i < b.Length; i++)
        {
            nb[i] = b[i] / lb;
        }
        double mag = la + (lb - la) * t;
        double d = 0.0;
        for (int i = 0; i < na.Length; i++)
        {
            d += na[i] * (i < nb.Length ? nb[i] : 0);
        }
        d = Numeric.FMax(-1, Numeric.FMin(1, d));
        if (d > 1 - 1e-6)
        {
            double[] lerped = new double[n];
            for (int i = 0; i < n; i++)
            {
                double nai = i < na.Length ? na[i] : 0;
                double nbi = i < nb.Length ? nb[i] : 0;
                lerped[i] = nai + (nbi - nai) * t;
            }
            double length = Hypot(lerped);
            if (length == 0)
            {
                length = 1;
            }
            double[] result = new double[lerped.Length];
            for (int i = 0; i < lerped.Length; i++)
            {
                result[i] = (lerped[i] / length) * mag;
            }
            return result;
        }
        double omega = Numeric.SafeAcos(d);
        double sinOmega = Math.Sin(omega);
        double ka = Math.Sin(omega * (1 - t)) / sinOmega;
        double kb = Math.Sin(omega * t) / sinOmega;
        double[] outArr = new double[n];
        for (int i = 0; i < n; i++)
        {
            double nai = i < na.Length ? na[i] : 0;
            double nbi = i < nb.Length ? nb[i] : 0;
            outArr[i] = (nai * ka + nbi * kb) * mag;
        }
        return outArr;
    }

    public static double[] QuatSlerp(double[] a, double[] b, double t)
    {
        double cosTheta = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
        double bx = b[0], by = b[1], bz = b[2], bw = b[3];
        if (cosTheta < 0)
        {
            cosTheta = -cosTheta;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        if (cosTheta > 0.9995)
        {
            return QuatNormalize(new double[]
            {
                a[0] + t * (bx - a[0]),
                a[1] + t * (by - a[1]),
                a[2] + t * (bz - a[2]),
                a[3] + t * (bw - a[3]),
            });
        }
        double angle = Numeric.SafeAcos(Numeric.FMax(-1, Numeric.FMin(1, cosTheta)));
        double sinTheta = Math.Sin(angle);
        double w1 = Math.Sin((1 - t) * angle) / sinTheta;
        double w2 = Math.Sin(t * angle) / sinTheta;
        return new double[]
        {
            a[0] * w1 + bx * w2,
            a[1] * w1 + by * w2,
            a[2] * w1 + bz * w2,
            a[3] * w1 + bw * w2,
        };
    }

    public static double[] Mat4Identity()
    {
        return new double[] { 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 };
    }

    public static double[] Mat2Mul(double[] a, double[] b)
    {
        return new double[]
        {
            a[0] * b[0] + a[2] * b[1],
            a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3],
            a[1] * b[2] + a[3] * b[3],
        };
    }

    public static double Mat2Determinant(double[] m)
    {
        return m[0] * m[3] - m[1] * m[2];
    }

    public static (double[] Value, bool IsValid) Mat2Invert(double[] m)
    {
        double det = Mat2Determinant(m);
        if (det == 0 || double.IsNaN(det) || double.IsInfinity(det))
        {
            return (new double[] { double.NaN, double.NaN, double.NaN, double.NaN }, false);
        }
        double inv = 1 / det;
        return (new double[] { m[3] * inv, -m[1] * inv, -m[2] * inv, m[0] * inv }, true);
    }

    public static double[] Mat3Mul(double[] a, double[] b)
    {
        double[] outv = new double[9];
        for (int i = 0; i < 3; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                outv[i + j * 3] = a[i] * b[j * 3] + a[i + 3] * b[j * 3 + 1] + a[i + 6] * b[j * 3 + 2];
            }
        }
        return outv;
    }

    public static double Mat3Determinant(double[] m)
    {
        return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[3] * (m[1] * m[8] - m[2] * m[7]) + m[6] * (m[1] * m[5] - m[2] * m[4]);
    }

    public static (double[] Value, bool IsValid) Mat3Invert(double[] m)
    {
        double det = Mat3Determinant(m);
        if (det == 0 || double.IsNaN(det) || double.IsInfinity(det))
        {
            double[] nan9 = new double[9];
            for (int i = 0; i < 9; i++)
            {
                nan9[i] = double.NaN;
            }
            return (nan9, false);
        }
        double inv = 1 / det;
        double[] value = new double[]
        {
            (m[4] * m[8] - m[5] * m[7]) * inv,
            (m[2] * m[7] - m[1] * m[8]) * inv,
            (m[1] * m[5] - m[2] * m[4]) * inv,
            (m[5] * m[6] - m[3] * m[8]) * inv,
            (m[0] * m[8] - m[2] * m[6]) * inv,
            (m[2] * m[3] - m[0] * m[5]) * inv,
            (m[3] * m[7] - m[4] * m[6]) * inv,
            (m[1] * m[6] - m[0] * m[7]) * inv,
            (m[0] * m[4] - m[1] * m[3]) * inv,
        };
        return (value, true);
    }

    public static double[] Mat4Mul(double[] a, double[] b)
    {
        double[] outv = new double[16];
        for (int i = 0; i < 4; i++)
        {
            for (int j = 0; j < 4; j++)
            {
                outv[i + j * 4] =
                    a[i] * b[j * 4] + a[i + 4] * b[j * 4 + 1] + a[i + 8] * b[j * 4 + 2] + a[i + 12] * b[j * 4 + 3];
            }
        }
        return outv;
    }

    public static double[] Mat4Transpose(double[] m)
    {
        return new double[]
        {
            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15],
        };
    }

    public static double Mat4Determinant(double[] m)
    {
        double a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
        double a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
        double a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
        double a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
        double b00 = a00 * a11 - a01 * a10;
        double b01 = a00 * a12 - a02 * a10;
        double b02 = a00 * a13 - a03 * a10;
        double b03 = a01 * a12 - a02 * a11;
        double b04 = a01 * a13 - a03 * a11;
        double b05 = a02 * a13 - a03 * a12;
        double b06 = a20 * a31 - a21 * a30;
        double b07 = a20 * a32 - a22 * a30;
        double b08 = a20 * a33 - a23 * a30;
        double b09 = a21 * a32 - a22 * a31;
        double b10 = a21 * a33 - a23 * a31;
        double b11 = a22 * a33 - a23 * a32;
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }

    public static (double[] Value, bool IsValid) Mat4Invert(double[] m)
    {
        double a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
        double a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
        double a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
        double a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

        double b00 = a00 * a11 - a01 * a10;
        double b01 = a00 * a12 - a02 * a10;
        double b02 = a00 * a13 - a03 * a10;
        double b03 = a01 * a12 - a02 * a11;
        double b04 = a01 * a13 - a03 * a11;
        double b05 = a02 * a13 - a03 * a12;
        double b06 = a20 * a31 - a21 * a30;
        double b07 = a20 * a32 - a22 * a30;
        double b08 = a20 * a33 - a23 * a30;
        double b09 = a21 * a32 - a22 * a31;
        double b10 = a21 * a33 - a23 * a31;
        double b11 = a22 * a33 - a23 * a32;

        double det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        // Mirrors the TS source's `if (!det)` exactly: rejects 0 and NaN, but NOT
        // Infinity — asymmetric with Mat2Invert/Mat3Invert above (which also
        // reject non-finite determinants); that asymmetry lives in the TS oracle
        // itself, not a transcription bug.
        if (det == 0 || double.IsNaN(det))
        {
            return (Mat4Identity(), false);
        }
        det = 1.0 / det;

        double[] outv = new double[16];
        outv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        outv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        outv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        outv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        outv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        outv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        outv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        outv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        outv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        outv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        outv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        outv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        outv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        outv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        outv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        outv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
        return (outv, true);
    }

    public static double[] Mat4Compose(double[] translation, double[] rotation, double[] scale)
    {
        double tx = translation[0], ty = translation[1], tz = translation[2];
        double qx = rotation[0], qy = rotation[1], qz = rotation[2], qw = rotation[3];
        double sx = scale[0], sy = scale[1], sz = scale[2];
        double x2 = qx + qx;
        double y2 = qy + qy;
        double z2 = qz + qz;
        double xx = qx * x2;
        double xy = qx * y2;
        double xz = qx * z2;
        double yy = qy * y2;
        double yz = qy * z2;
        double zz = qz * z2;
        double wx = qw * x2;
        double wy = qw * y2;
        double wz = qw * z2;
        return new double[]
        {
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
            1,
        };
    }

    private static bool Finite(double x)
    {
        return !double.IsNaN(x) && !double.IsInfinity(x);
    }

    public static (double[] Translation, double[] Rotation, double[] Scale, bool IsValid) Mat4Decompose(double[] mat)
    {
        double[] translationOut = new double[] { mat[12], mat[13], mat[14] };
        double sx = Hypot(mat[0], mat[1], mat[2]);
        double sy = Hypot(mat[4], mat[5], mat[6]);
        double sz = Hypot(mat[8], mat[9], mat[10]);

        if (!Finite(sx) || !Finite(sy) || !Finite(sz) || sx == 0 || sy == 0 || sz == 0)
        {
            return (translationOut, new double[] { 0, 0, 0, 1 }, new double[] { sx, sy, sz }, false);
        }
        double b00 = mat[0] / sx;
        double b10 = mat[1] / sx;
        double b20 = mat[2] / sx;
        double b01 = mat[4] / sy;
        double b11 = mat[5] / sy;
        double b21 = mat[6] / sy;
        double b02 = mat[8] / sz;
        double b12 = mat[9] / sz;
        double b22 = mat[10] / sz;
        double det = b00 * (b11 * b22 - b12 * b21) - b01 * (b10 * b22 - b12 * b20) + b02 * (b10 * b21 - b11 * b20);
        double[] scale = new double[] { sx, sy, sz };
        if (det < 0)
        {
            scale = new double[] { -sx, sy, sz };
            b00 = -b00;
            b10 = -b10;
            b20 = -b20;
        }
        double trace = b00 + b11 + b22;
        double[] rotation;
        if (trace > 0)
        {
            double s = Numeric.SafeSqrt(trace + 1) * 2;
            rotation = new double[] { (b21 - b12) / s, (b02 - b20) / s, (b10 - b01) / s, 0.25 * s };
        }
        else if (b00 > b11 && b00 > b22)
        {
            double s = Numeric.SafeSqrt(1 + b00 - b11 - b22) * 2;
            rotation = new double[] { 0.25 * s, (b01 + b10) / s, (b02 + b20) / s, (b21 - b12) / s };
        }
        else if (b11 > b22)
        {
            double s = Numeric.SafeSqrt(1 + b11 - b00 - b22) * 2;
            rotation = new double[] { (b01 + b10) / s, 0.25 * s, (b12 + b21) / s, (b02 - b20) / s };
        }
        else
        {
            double s = Numeric.SafeSqrt(1 + b22 - b00 - b11) * 2;
            rotation = new double[] { (b02 + b20) / s, (b12 + b21) / s, 0.25 * s, (b10 - b01) / s };
        }
        return (translationOut, QuatNormalize(rotation), scale, true);
    }

    public static double[] TransformVec3(double[] mat, double[] vec)
    {
        double x = vec[0];
        double y = vec[1];
        double z = vec[2];
        double w = vec.Length > 3 ? vec[3] : 1;
        return new double[]
        {
            mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w,
            mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w,
            mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w,
            mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w,
        };
    }

    public static double[] QuatFromAxisAngle(double[] axis, double angle)
    {
        double x = axis[0], y = axis[1], z = axis[2];
        double len_ = Hypot(x, y, z);
        if (len_ == 0)
        {
            len_ = 1;
        }
        double half = angle / 2;
        double s = Math.Sin(half) / len_;
        return QuatNormalize(new double[] { x * s, y * s, z * s, Math.Cos(half) });
    }

    public static (double[] Axis, double Angle) QuatToAxisAngle(double[] quat)
    {
        double[] q = QuatNormalize(quat);
        double angle = 2 * Numeric.SafeAcos(Numeric.FMax(-1, Numeric.FMin(1, q[3])));
        double s = Numeric.SafeSqrt(1 - q[3] * q[3]);
        if (s < 0.0001)
        {
            return (new double[] { 1, 0, 0 }, angle);
        }
        return (new double[] { q[0] / s, q[1] / s, q[2] / s }, angle);
    }

    public static double[] NormalizeVec3(double[] a)
    {
        double len_ = Hypot(a[0], a[1], a[2]);
        if (len_ == 0)
        {
            len_ = 1;
        }
        return new double[] { a[0] / len_, a[1] / len_, a[2] / len_ };
    }

    public static double[] CrossVec3(double[] a, double[] b)
    {
        return new double[]
        {
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        };
    }

    public static double[] QuatFromDirections(double[] a, double[] b)
    {
        double[] v1 = NormalizeVec3(a);
        double[] v2 = NormalizeVec3(b);
        double dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
        if (dot < -0.999999)
        {
            double[] axis = Math.Abs(v1[0]) > 0.1 ? new double[] { 0, 1, 0 } : new double[] { 1, 0, 0 };
            double[] cross = CrossVec3(v1, axis);
            return QuatFromAxisAngle(cross, Math.PI);
        }
        double[] cross2 = CrossVec3(v1, v2);
        return QuatNormalize(new double[] { cross2[0], cross2[1], cross2[2], 1 + dot });
    }

    public static double[] QuatFromUpForward(double[] up, double[] forward)
    {
        double[] r = NormalizeVec3(forward);
        double[] y = NormalizeVec3(up);
        double[] s = CrossVec3(y, r);
        double sLen = Hypot(s[0], s[1], s[2]);
        if (sLen < 1e-5)
        {
            double[] axis = Math.Abs(r[1]) < 0.9 ? new double[] { 0, 1, 0 } : new double[] { 1, 0, 0 };
            s = CrossVec3(axis, r);
        }
        s = NormalizeVec3(s);
        double[] t = CrossVec3(r, s);
        double m00 = s[0], m01 = t[0], m02 = r[0];
        double m10 = s[1], m11 = t[1], m12 = r[1];
        double m20 = s[2], m21 = t[2], m22 = r[2];
        double trace = m00 + m11 + m22;
        double[] q;
        if (trace > 0)
        {
            double s2 = Numeric.SafeSqrt(trace + 1) * 2;
            q = new double[] { (m21 - m12) / s2, (m02 - m20) / s2, (m10 - m01) / s2, 0.25 * s2 };
        }
        else if (m00 > m11 && m00 > m22)
        {
            double s2 = Numeric.SafeSqrt(1 + m00 - m11 - m22) * 2;
            q = new double[] { 0.25 * s2, (m01 + m10) / s2, (m02 + m20) / s2, (m21 - m12) / s2 };
        }
        else if (m11 > m22)
        {
            double s2 = Numeric.SafeSqrt(1 + m11 - m00 - m22) * 2;
            q = new double[] { (m01 + m10) / s2, 0.25 * s2, (m12 + m21) / s2, (m02 - m20) / s2 };
        }
        else
        {
            double s2 = Numeric.SafeSqrt(1 + m22 - m00 - m11) * 2;
            q = new double[] { (m02 + m20) / s2, (m12 + m21) / s2, 0.25 * s2, (m10 - m01) / s2 };
        }
        return QuatNormalize(q);
    }

    public static double QuatAngleBetween(double[] a, double[] b)
    {
        double[] qa = QuatNormalize(a);
        double[] qb = QuatNormalize(b);
        double dot = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3];
        return Numeric.SafeAcos(Numeric.FMin(1, Math.Abs(dot))) * 2;
    }

    public static double[] Rotate2D(double[] v, double angle)
    {
        double c = Math.Cos(angle);
        double s = Math.Sin(angle);
        return new double[] { v[0] * c - v[1] * s, v[0] * s + v[1] * c };
    }

    private static double CubicBezierSample(double s, double c1, double c2)
    {
        double u = 1 - s;
        return 3 * u * u * s * c1 + 3 * u * s * s * c2 + s * s * s;
    }

    public static double CubicBezierEase(double t, double[] p1, double[] p2)
    {
        if (t <= 0)
        {
            return 0.0;
        }
        if (t >= 1)
        {
            return 1.0;
        }

        double lo = 0.0, hi = 1.0;
        for (int i = 0; i < 48; i++)
        {
            double mid = (lo + hi) / 2;
            if (CubicBezierSample(mid, p1[0], p2[0]) < t)
            {
                lo = mid;
            }
            else
            {
                hi = mid;
            }
        }
        return CubicBezierSample((lo + hi) / 2, p1[1], p2[1]);
    }
}
