# Pure math helpers, ported by transcription from packages/kernel/src/
# math.ts (quaternion/matrix algebra, spherical interpolation, easing).
# Vectors/matrices are plain 0-based Python lists here, matching the TS
# source's 0-based JS arrays exactly (no index-base conversion needed,
# unlike the Lua backend's 1-based tables). Column-major, same as the TS
# source. Multi-output helpers return a plain dict keyed by output-socket
# name (mirrors math.ts's own object-literal return shape verbatim).
import math

from .numeric import fmax, fmin, safe_acos, safe_sqrt


def hypot(*args: float) -> float:
    return math.hypot(*args)


def quat_normalize(q: list) -> list:
    len_ = hypot(q[0], q[1], q[2], q[3])
    if len_ == 0:
        len_ = 1
    return [q[0] / len_, q[1] / len_, q[2] / len_, q[3] / len_]


def quat_mul(a: list, b: list) -> list:
    ax, ay, az, aw = a[0], a[1], a[2], a[3]
    bx, by, bz, bw = b[0], b[1], b[2], b[3]
    return [
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ]


def vector_slerp(a: list, b: list, t: float) -> list:
    n = max(len(a), len(b))
    la = hypot(*a)
    lb = hypot(*b)
    if not la or not lb:
        out = []
        for i in range(n):
            ai = a[i] if i < len(a) else 0
            bi = b[i] if i < len(b) else 0
            out.append(ai + (bi - ai) * t)
        return out
    na = [x / la for x in a]
    nb = [x / lb for x in b]
    mag = la + (lb - la) * t
    d = 0.0
    for i in range(len(na)):
        d += na[i] * (nb[i] if i < len(nb) else 0)
    d = fmax(-1, fmin(1, d))
    if d > 1 - 1e-6:
        lerped = []
        for i in range(n):
            nai = na[i] if i < len(na) else 0
            nbi = nb[i] if i < len(nb) else 0
            lerped.append(nai + (nbi - nai) * t)
        length = hypot(*lerped)
        if length == 0:
            length = 1
        return [(x / length) * mag for x in lerped]
    omega = safe_acos(d)
    sin_omega = math.sin(omega)
    ka = math.sin(omega * (1 - t)) / sin_omega
    kb = math.sin(omega * t) / sin_omega
    out = []
    for i in range(n):
        nai = na[i] if i < len(na) else 0
        nbi = nb[i] if i < len(nb) else 0
        out.append((nai * ka + nbi * kb) * mag)
    return out


def quat_slerp(a: list, b: list, t: float) -> list:
    cos_theta = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
    bx, by, bz, bw = b[0], b[1], b[2], b[3]
    if cos_theta < 0:
        cos_theta = -cos_theta
        bx, by, bz, bw = -bx, -by, -bz, -bw
    if cos_theta > 0.9995:
        return quat_normalize([
            a[0] + t * (bx - a[0]),
            a[1] + t * (by - a[1]),
            a[2] + t * (bz - a[2]),
            a[3] + t * (bw - a[3]),
        ])
    angle = safe_acos(fmax(-1, fmin(1, cos_theta)))
    sin_theta = math.sin(angle)
    w1 = math.sin((1 - t) * angle) / sin_theta
    w2 = math.sin(t * angle) / sin_theta
    return [
        a[0] * w1 + bx * w2,
        a[1] * w1 + by * w2,
        a[2] * w1 + bz * w2,
        a[3] * w1 + bw * w2,
    ]


def mat4_identity() -> list:
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]


def mat2_mul(a: list, b: list) -> list:
    return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
    ]


def mat2_determinant(m: list) -> float:
    return m[0] * m[3] - m[1] * m[2]


def mat2_invert(m: list) -> dict:
    det = mat2_determinant(m)
    if det == 0 or det != det or math.isinf(det):
        return {"value": [float("nan")] * 4, "isValid": False}
    inv = 1 / det
    return {"value": [m[3] * inv, -m[1] * inv, -m[2] * inv, m[0] * inv], "isValid": True}


def mat3_mul(a: list, b: list) -> list:
    out = [0.0] * 9
    for i in range(3):
        for j in range(3):
            out[i + j * 3] = a[i] * b[j * 3] + a[i + 3] * b[j * 3 + 1] + a[i + 6] * b[j * 3 + 2]
    return out


def mat3_determinant(m: list) -> float:
    return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[3] * (m[1] * m[8] - m[2] * m[7]) + m[6] * (m[1] * m[5] - m[2] * m[4])


def mat3_invert(m: list) -> dict:
    det = mat3_determinant(m)
    if det == 0 or det != det or math.isinf(det):
        return {"value": [float("nan")] * 9, "isValid": False}
    inv = 1 / det
    return {
        "value": [
            (m[4] * m[8] - m[5] * m[7]) * inv,
            (m[2] * m[7] - m[1] * m[8]) * inv,
            (m[1] * m[5] - m[2] * m[4]) * inv,
            (m[5] * m[6] - m[3] * m[8]) * inv,
            (m[0] * m[8] - m[2] * m[6]) * inv,
            (m[2] * m[3] - m[0] * m[5]) * inv,
            (m[3] * m[7] - m[4] * m[6]) * inv,
            (m[1] * m[6] - m[0] * m[7]) * inv,
            (m[0] * m[4] - m[1] * m[3]) * inv,
        ],
        "isValid": True,
    }


def mat4_mul(a: list, b: list) -> list:
    out = [0.0] * 16
    for i in range(4):
        for j in range(4):
            out[i + j * 4] = (
                a[i] * b[j * 4] + a[i + 4] * b[j * 4 + 1] + a[i + 8] * b[j * 4 + 2] + a[i + 12] * b[j * 4 + 3]
            )
    return out


def mat4_transpose(m: list) -> list:
    return [
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15],
    ]


def mat4_determinant(m: list) -> float:
    a00, a01, a02, a03 = m[0], m[1], m[2], m[3]
    a10, a11, a12, a13 = m[4], m[5], m[6], m[7]
    a20, a21, a22, a23 = m[8], m[9], m[10], m[11]
    a30, a31, a32, a33 = m[12], m[13], m[14], m[15]
    b00 = a00 * a11 - a01 * a10
    b01 = a00 * a12 - a02 * a10
    b02 = a00 * a13 - a03 * a10
    b03 = a01 * a12 - a02 * a11
    b04 = a01 * a13 - a03 * a11
    b05 = a02 * a13 - a03 * a12
    b06 = a20 * a31 - a21 * a30
    b07 = a20 * a32 - a22 * a30
    b08 = a20 * a33 - a23 * a30
    b09 = a21 * a32 - a22 * a31
    b10 = a21 * a33 - a23 * a31
    b11 = a22 * a33 - a23 * a32
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06


def mat4_invert(m: list) -> dict:
    a00, a01, a02, a03 = m[0], m[1], m[2], m[3]
    a10, a11, a12, a13 = m[4], m[5], m[6], m[7]
    a20, a21, a22, a23 = m[8], m[9], m[10], m[11]
    a30, a31, a32, a33 = m[12], m[13], m[14], m[15]

    b00 = a00 * a11 - a01 * a10
    b01 = a00 * a12 - a02 * a10
    b02 = a00 * a13 - a03 * a10
    b03 = a01 * a12 - a02 * a11
    b04 = a01 * a13 - a03 * a11
    b05 = a02 * a13 - a03 * a12
    b06 = a20 * a31 - a21 * a30
    b07 = a20 * a32 - a22 * a30
    b08 = a20 * a33 - a23 * a30
    b09 = a21 * a32 - a22 * a31
    b10 = a21 * a33 - a23 * a31
    b11 = a22 * a33 - a23 * a32

    det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
    # Mirrors the TS source's `if (!det)` exactly: rejects 0 and NaN, but NOT
    # Infinity — asymmetric with mat2Invert/mat3Invert above (which also
    # reject non-finite determinants); that asymmetry lives in the TS oracle
    # itself, not a transcription bug.
    if det == 0 or det != det:
        return {"value": mat4_identity(), "isValid": False}
    det = 1.0 / det

    out = [0.0] * 16
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det
    return {"value": out, "isValid": True}


def mat4_compose(translation: list, rotation: list, scale: list) -> list:
    tx, ty, tz = translation[0], translation[1], translation[2]
    qx, qy, qz, qw = rotation[0], rotation[1], rotation[2], rotation[3]
    sx, sy, sz = scale[0], scale[1], scale[2]
    x2 = qx + qx
    y2 = qy + qy
    z2 = qz + qz
    xx = qx * x2
    xy = qx * y2
    xz = qx * z2
    yy = qy * y2
    yz = qy * z2
    zz = qz * z2
    wx = qw * x2
    wy = qw * y2
    wz = qw * z2
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
        1,
    ]


def mat4_decompose(mat: list) -> dict:
    translation_out = [mat[12], mat[13], mat[14]]
    sx = hypot(mat[0], mat[1], mat[2])
    sy = hypot(mat[4], mat[5], mat[6])
    sz = hypot(mat[8], mat[9], mat[10])

    def finite(x: float) -> bool:
        return x == x and not math.isinf(x)

    if not finite(sx) or not finite(sy) or not finite(sz) or sx == 0 or sy == 0 or sz == 0:
        return {"translation": translation_out, "rotation": [0, 0, 0, 1], "scale": [sx, sy, sz], "isValid": False}
    b00 = mat[0] / sx
    b10 = mat[1] / sx
    b20 = mat[2] / sx
    b01 = mat[4] / sy
    b11 = mat[5] / sy
    b21 = mat[6] / sy
    b02 = mat[8] / sz
    b12 = mat[9] / sz
    b22 = mat[10] / sz
    det = b00 * (b11 * b22 - b12 * b21) - b01 * (b10 * b22 - b12 * b20) + b02 * (b10 * b21 - b11 * b20)
    scale = [sx, sy, sz]
    if det < 0:
        scale = [-sx, sy, sz]
        b00, b10, b20 = -b00, -b10, -b20
    trace = b00 + b11 + b22
    if trace > 0:
        s = safe_sqrt(trace + 1) * 2
        rotation = [(b21 - b12) / s, (b02 - b20) / s, (b10 - b01) / s, 0.25 * s]
    elif b00 > b11 and b00 > b22:
        s = safe_sqrt(1 + b00 - b11 - b22) * 2
        rotation = [0.25 * s, (b01 + b10) / s, (b02 + b20) / s, (b21 - b12) / s]
    elif b11 > b22:
        s = safe_sqrt(1 + b11 - b00 - b22) * 2
        rotation = [(b01 + b10) / s, 0.25 * s, (b12 + b21) / s, (b02 - b20) / s]
    else:
        s = safe_sqrt(1 + b22 - b00 - b11) * 2
        rotation = [(b02 + b20) / s, (b12 + b21) / s, 0.25 * s, (b10 - b01) / s]
    return {"translation": translation_out, "rotation": quat_normalize(rotation), "scale": scale, "isValid": True}


def transform_vec3(mat: list, vec: list) -> list:
    x = vec[0]
    y = vec[1]
    z = vec[2]
    w = vec[3] if len(vec) > 3 else 1
    return [
        mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w,
        mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w,
        mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w,
        mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w,
    ]


def quat_from_axis_angle(axis: list, angle: float) -> list:
    x, y, z = axis[0], axis[1], axis[2]
    len_ = hypot(x, y, z)
    if len_ == 0:
        len_ = 1
    half = angle / 2
    s = math.sin(half) / len_
    return quat_normalize([x * s, y * s, z * s, math.cos(half)])


def quat_to_axis_angle(quat: list) -> dict:
    q = quat_normalize(quat)
    angle = 2 * safe_acos(fmax(-1, fmin(1, q[3])))
    s = safe_sqrt(1 - q[3] * q[3])
    if s < 0.0001:
        return {"axis": [1, 0, 0], "angle": angle}
    return {"axis": [q[0] / s, q[1] / s, q[2] / s], "angle": angle}


def normalize_vec3(a: list) -> list:
    len_ = hypot(a[0], a[1], a[2])
    if len_ == 0:
        len_ = 1
    return [a[0] / len_, a[1] / len_, a[2] / len_]


def cross_vec3(a: list, b: list) -> list:
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]


def quat_from_directions(a: list, b: list) -> list:
    v1 = normalize_vec3(a)
    v2 = normalize_vec3(b)
    dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
    if dot < -0.999999:
        axis = [0, 1, 0] if abs(v1[0]) > 0.1 else [1, 0, 0]
        cross = cross_vec3(v1, axis)
        return quat_from_axis_angle(cross, math.pi)
    cross = cross_vec3(v1, v2)
    return quat_normalize([cross[0], cross[1], cross[2], 1 + dot])


def quat_from_up_forward(up: list, forward: list) -> list:
    r = normalize_vec3(forward)
    y = normalize_vec3(up)
    s = cross_vec3(y, r)
    s_len = hypot(s[0], s[1], s[2])
    if s_len < 1e-5:
        axis = [0, 1, 0] if abs(r[1]) < 0.9 else [1, 0, 0]
        s = cross_vec3(axis, r)
    s = normalize_vec3(s)
    t = cross_vec3(r, s)
    m00, m01, m02 = s[0], t[0], r[0]
    m10, m11, m12 = s[1], t[1], r[1]
    m20, m21, m22 = s[2], t[2], r[2]
    trace = m00 + m11 + m22
    if trace > 0:
        s2 = safe_sqrt(trace + 1) * 2
        q = [(m21 - m12) / s2, (m02 - m20) / s2, (m10 - m01) / s2, 0.25 * s2]
    elif m00 > m11 and m00 > m22:
        s2 = safe_sqrt(1 + m00 - m11 - m22) * 2
        q = [0.25 * s2, (m01 + m10) / s2, (m02 + m20) / s2, (m21 - m12) / s2]
    elif m11 > m22:
        s2 = safe_sqrt(1 + m11 - m00 - m22) * 2
        q = [(m01 + m10) / s2, 0.25 * s2, (m12 + m21) / s2, (m02 - m20) / s2]
    else:
        s2 = safe_sqrt(1 + m22 - m00 - m11) * 2
        q = [(m02 + m20) / s2, (m12 + m21) / s2, 0.25 * s2, (m10 - m01) / s2]
    return quat_normalize(q)


def quat_angle_between(a: list, b: list) -> float:
    qa = quat_normalize(a)
    qb = quat_normalize(b)
    dot = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3]
    return safe_acos(fmin(1, abs(dot))) * 2


def rotate_2d(v: list, angle: float) -> list:
    c = math.cos(angle)
    s = math.sin(angle)
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]


def cubic_bezier_ease(t: float, p1: list, p2: list) -> float:
    if t <= 0:
        return 0.0
    if t >= 1:
        return 1.0

    def sample(s: float, c1: float, c2: float) -> float:
        u = 1 - s
        return 3 * u * u * s * c1 + 3 * u * s * s * c2 + s * s * s

    lo, hi = 0.0, 1.0
    for _ in range(48):
        mid = (lo + hi) / 2
        if sample(mid, p1[0], p2[0]) < t:
            lo = mid
        else:
            hi = mid
    return sample((lo + hi) / 2, p1[1], p2[1])
