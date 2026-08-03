# Pure math helpers, ported by transcription from packages/runtime-py/src/py/
# gltfi_runtime/kmath.py (itself transcribed from packages/kernel/src/math.ts
# — quaternion/matrix algebra, spherical interpolation, easing). Vectors/
# matrices are plain 0-based GDScript Arrays here, matching the TS/Python
# sources' 0-based convention exactly (no index-base conversion needed,
# unlike the Lua backend's 1-based tables). Column-major, same as the TS
# source. Multi-output helpers return a plain Dictionary keyed by output-
# socket name (mirrors math.ts's own object-literal return shape verbatim).
#
# Every function is `static func` — loaded once by harness.gd/m.gd via
# `const Kmath = preload("res://kmath.gd")` and called through that class
# reference, never instantiated.
extends RefCounted

const Numeric = preload("res://numeric.gd")


static func hypotN(args: Array) -> float:
	var sum := 0.0
	for x in args:
		sum += x * x
	return sqrt(sum)


static func quatNormalize(q: Array) -> Array:
	var len_: float = hypotN(q)
	if len_ == 0.0:
		len_ = 1.0
	return [q[0] / len_, q[1] / len_, q[2] / len_, q[3] / len_]


static func quatMul(a: Array, b: Array) -> Array:
	var ax = a[0]
	var ay = a[1]
	var az = a[2]
	var aw = a[3]
	var bx = b[0]
	var by = b[1]
	var bz = b[2]
	var bw = b[3]
	return [
		aw * bx + ax * bw + ay * bz - az * by,
		aw * by - ax * bz + ay * bw + az * bx,
		aw * bz + ax * by - ay * bx + az * bw,
		aw * bw - ax * bx - ay * by - az * bz,
	]


static func vectorSlerp(a: Array, b: Array, t: float) -> Array:
	var n: int = maxi(a.size(), b.size())
	var la: float = hypotN(a)
	var lb: float = hypotN(b)
	if la == 0.0 or lb == 0.0:
		var out0 := []
		for i in range(n):
			var ai = a[i] if i < a.size() else 0.0
			var bi = b[i] if i < b.size() else 0.0
			out0.append(ai + (bi - ai) * t)
		return out0
	var na := []
	for x in a:
		na.append(x / la)
	var nb := []
	for x in b:
		nb.append(x / lb)
	var mag: float = la + (lb - la) * t
	var d := 0.0
	for i in range(na.size()):
		var nbi = nb[i] if i < nb.size() else 0.0
		d += na[i] * nbi
	d = maxf(-1.0, minf(1.0, d))
	if d > 1.0 - 1e-6:
		var lerped := []
		for i in range(n):
			var nai = na[i] if i < na.size() else 0.0
			var nbi2 = nb[i] if i < nb.size() else 0.0
			lerped.append(nai + (nbi2 - nai) * t)
		var length_: float = hypotN(lerped)
		if length_ == 0.0:
			length_ = 1.0
		var out1 := []
		for x in lerped:
			out1.append((x / length_) * mag)
		return out1
	var omega: float = Numeric.safeAcos(d)
	var sin_omega := sin(omega)
	var ka := sin(omega * (1.0 - t)) / sin_omega
	var kb := sin(omega * t) / sin_omega
	var out2 := []
	for i in range(n):
		var nai2 = na[i] if i < na.size() else 0.0
		var nbi3 = nb[i] if i < nb.size() else 0.0
		out2.append((nai2 * ka + nbi3 * kb) * mag)
	return out2


static func quatSlerp(a: Array, b: Array, t: float) -> Array:
	var cos_theta: float = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
	var bx = b[0]
	var by = b[1]
	var bz = b[2]
	var bw = b[3]
	if cos_theta < 0.0:
		cos_theta = -cos_theta
		bx = -bx
		by = -by
		bz = -bz
		bw = -bw
	if cos_theta > 0.9995:
		return quatNormalize([
			a[0] + t * (bx - a[0]),
			a[1] + t * (by - a[1]),
			a[2] + t * (bz - a[2]),
			a[3] + t * (bw - a[3]),
		])
	var angle: float = Numeric.safeAcos(maxf(-1.0, minf(1.0, cos_theta)))
	var sin_theta := sin(angle)
	var w1 := sin((1.0 - t) * angle) / sin_theta
	var w2 := sin(t * angle) / sin_theta
	return [
		a[0] * w1 + bx * w2,
		a[1] * w1 + by * w2,
		a[2] * w1 + bz * w2,
		a[3] * w1 + bw * w2,
	]


static func mat4Identity() -> Array:
	return [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]


static func mat2Mul(a: Array, b: Array) -> Array:
	return [
		a[0] * b[0] + a[2] * b[1],
		a[1] * b[0] + a[3] * b[1],
		a[0] * b[2] + a[2] * b[3],
		a[1] * b[2] + a[3] * b[3],
	]


static func mat2Determinant(m: Array) -> float:
	return m[0] * m[3] - m[1] * m[2]


static func mat2Invert(m: Array) -> Dictionary:
	var det: float = mat2Determinant(m)
	if det == 0.0 or is_nan(det) or is_inf(det):
		return {"value": [NAN, NAN, NAN, NAN], "isValid": false}
	var inv := 1.0 / det
	return {"value": [m[3] * inv, -m[1] * inv, -m[2] * inv, m[0] * inv], "isValid": true}


static func mat3Mul(a: Array, b: Array) -> Array:
	var out := [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
	for i in range(3):
		for j in range(3):
			out[i + j * 3] = a[i] * b[j * 3] + a[i + 3] * b[j * 3 + 1] + a[i + 6] * b[j * 3 + 2]
	return out


static func mat3Determinant(m: Array) -> float:
	return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[3] * (m[1] * m[8] - m[2] * m[7]) + m[6] * (m[1] * m[5] - m[2] * m[4])


static func mat3Invert(m: Array) -> Dictionary:
	var det: float = mat3Determinant(m)
	if det == 0.0 or is_nan(det) or is_inf(det):
		return {"value": [NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN], "isValid": false}
	var inv := 1.0 / det
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
		"isValid": true,
	}


static func mat4Mul(a: Array, b: Array) -> Array:
	var out := []
	out.resize(16)
	out.fill(0.0)
	for i in range(4):
		for j in range(4):
			out[i + j * 4] = (
				a[i] * b[j * 4] + a[i + 4] * b[j * 4 + 1] + a[i + 8] * b[j * 4 + 2] + a[i + 12] * b[j * 4 + 3]
			)
	return out


static func mat4Transpose(m: Array) -> Array:
	return [
		m[0], m[4], m[8], m[12],
		m[1], m[5], m[9], m[13],
		m[2], m[6], m[10], m[14],
		m[3], m[7], m[11], m[15],
	]


static func mat4Determinant(m: Array) -> float:
	var a00 = m[0]
	var a01 = m[1]
	var a02 = m[2]
	var a03 = m[3]
	var a10 = m[4]
	var a11 = m[5]
	var a12 = m[6]
	var a13 = m[7]
	var a20 = m[8]
	var a21 = m[9]
	var a22 = m[10]
	var a23 = m[11]
	var a30 = m[12]
	var a31 = m[13]
	var a32 = m[14]
	var a33 = m[15]
	var b00 = a00 * a11 - a01 * a10
	var b01 = a00 * a12 - a02 * a10
	var b02 = a00 * a13 - a03 * a10
	var b03 = a01 * a12 - a02 * a11
	var b04 = a01 * a13 - a03 * a11
	var b05 = a02 * a13 - a03 * a12
	var b06 = a20 * a31 - a21 * a30
	var b07 = a20 * a32 - a22 * a30
	var b08 = a20 * a33 - a23 * a30
	var b09 = a21 * a32 - a22 * a31
	var b10 = a21 * a33 - a23 * a31
	var b11 = a22 * a33 - a23 * a32
	return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06


static func mat4Invert(m: Array) -> Dictionary:
	var a00 = m[0]
	var a01 = m[1]
	var a02 = m[2]
	var a03 = m[3]
	var a10 = m[4]
	var a11 = m[5]
	var a12 = m[6]
	var a13 = m[7]
	var a20 = m[8]
	var a21 = m[9]
	var a22 = m[10]
	var a23 = m[11]
	var a30 = m[12]
	var a31 = m[13]
	var a32 = m[14]
	var a33 = m[15]

	var b00 = a00 * a11 - a01 * a10
	var b01 = a00 * a12 - a02 * a10
	var b02 = a00 * a13 - a03 * a10
	var b03 = a01 * a12 - a02 * a11
	var b04 = a01 * a13 - a03 * a11
	var b05 = a02 * a13 - a03 * a12
	var b06 = a20 * a31 - a21 * a30
	var b07 = a20 * a32 - a22 * a30
	var b08 = a20 * a33 - a23 * a30
	var b09 = a21 * a32 - a22 * a31
	var b10 = a21 * a33 - a23 * a31
	var b11 = a22 * a33 - a23 * a32

	var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
	# Mirrors the TS oracle's `if (!det)` exactly: rejects 0 and NaN, but NOT
	# Infinity — asymmetric with mat2Invert/mat3Invert above (also rejecting
	# non-finite determinants); that asymmetry lives in the TS oracle itself,
	# not a transcription bug (see kmath.py's identical note).
	if det == 0.0 or is_nan(det):
		return {"value": mat4Identity(), "isValid": false}
	det = 1.0 / det

	var out := []
	out.resize(16)
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
	return {"value": out, "isValid": true}


static func mat4Compose(translation: Array, rotation: Array, scale: Array) -> Array:
	var tx = translation[0]
	var ty = translation[1]
	var tz = translation[2]
	var qx = rotation[0]
	var qy = rotation[1]
	var qz = rotation[2]
	var qw = rotation[3]
	var sx = scale[0]
	var sy = scale[1]
	var sz = scale[2]
	var x2 = qx + qx
	var y2 = qy + qy
	var z2 = qz + qz
	var xx = qx * x2
	var xy = qx * y2
	var xz = qx * z2
	var yy = qy * y2
	var yz = qy * z2
	var zz = qz * z2
	var wx = qw * x2
	var wy = qw * y2
	var wz = qw * z2
	return [
		(1.0 - (yy + zz)) * sx,
		(xy + wz) * sx,
		(xz - wy) * sx,
		0.0,
		(xy - wz) * sy,
		(1.0 - (xx + zz)) * sy,
		(yz + wx) * sy,
		0.0,
		(xz + wy) * sz,
		(yz - wx) * sz,
		(1.0 - (xx + yy)) * sz,
		0.0,
		tx,
		ty,
		tz,
		1.0,
	]


static func _finite(x: float) -> bool:
	return not (is_nan(x) or is_inf(x))


static func mat4Decompose(mat: Array) -> Dictionary:
	var translation_out := [mat[12], mat[13], mat[14]]
	var sx: float = hypotN([mat[0], mat[1], mat[2]])
	var sy: float = hypotN([mat[4], mat[5], mat[6]])
	var sz: float = hypotN([mat[8], mat[9], mat[10]])

	if not _finite(sx) or not _finite(sy) or not _finite(sz) or sx == 0.0 or sy == 0.0 or sz == 0.0:
		return {"translation": translation_out, "rotation": [0.0, 0.0, 0.0, 1.0], "scale": [sx, sy, sz], "isValid": false}
	var b00 = mat[0] / sx
	var b10 = mat[1] / sx
	var b20 = mat[2] / sx
	var b01 = mat[4] / sy
	var b11 = mat[5] / sy
	var b21 = mat[6] / sy
	var b02 = mat[8] / sz
	var b12 = mat[9] / sz
	var b22 = mat[10] / sz
	var det: float = b00 * (b11 * b22 - b12 * b21) - b01 * (b10 * b22 - b12 * b20) + b02 * (b10 * b21 - b11 * b20)
	var scale := [sx, sy, sz]
	if det < 0.0:
		scale = [-sx, sy, sz]
		b00 = -b00
		b10 = -b10
		b20 = -b20
	var trace: float = b00 + b11 + b22
	var rotation := []
	if trace > 0.0:
		var s: float = sqrt(trace + 1.0) * 2.0
		rotation = [(b21 - b12) / s, (b02 - b20) / s, (b10 - b01) / s, 0.25 * s]
	elif b00 > b11 and b00 > b22:
		var s: float = sqrt(1.0 + b00 - b11 - b22) * 2.0
		rotation = [0.25 * s, (b01 + b10) / s, (b02 + b20) / s, (b21 - b12) / s]
	elif b11 > b22:
		var s: float = sqrt(1.0 + b11 - b00 - b22) * 2.0
		rotation = [(b01 + b10) / s, 0.25 * s, (b12 + b21) / s, (b02 - b20) / s]
	else:
		var s: float = sqrt(1.0 + b22 - b00 - b11) * 2.0
		rotation = [(b02 + b20) / s, (b12 + b21) / s, 0.25 * s, (b10 - b01) / s]
	return {"translation": translation_out, "rotation": quatNormalize(rotation), "scale": scale, "isValid": true}


static func transformVec3(mat: Array, vec: Array) -> Array:
	var x = vec[0]
	var y = vec[1]
	var z = vec[2]
	var w = vec[3] if vec.size() > 3 else 1.0
	return [
		mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w,
		mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w,
		mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w,
		mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w,
	]


static func quatFromAxisAngle(axis: Array, angle: float) -> Array:
	var x = axis[0]
	var y = axis[1]
	var z = axis[2]
	var len_: float = hypotN([x, y, z])
	if len_ == 0.0:
		len_ = 1.0
	var half := angle / 2.0
	var s := sin(half) / len_
	return quatNormalize([x * s, y * s, z * s, cos(half)])


static func quatToAxisAngle(quat: Array) -> Dictionary:
	var q: Array = quatNormalize(quat)
	var angle: float = 2.0 * Numeric.safeAcos(maxf(-1.0, minf(1.0, q[3])))
	var s: float = sqrt(1.0 - q[3] * q[3])
	if s < 0.0001:
		return {"axis": [1.0, 0.0, 0.0], "angle": angle}
	return {"axis": [q[0] / s, q[1] / s, q[2] / s], "angle": angle}


static func normalizeVec3(a: Array) -> Array:
	var len_: float = hypotN([a[0], a[1], a[2]])
	if len_ == 0.0:
		len_ = 1.0
	return [a[0] / len_, a[1] / len_, a[2] / len_]


static func crossVec3(a: Array, b: Array) -> Array:
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0],
	]


static func quatFromDirections(a: Array, b: Array) -> Array:
	var v1: Array = normalizeVec3(a)
	var v2: Array = normalizeVec3(b)
	var dot: float = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
	if dot < -0.999999:
		var axis: Array = [0.0, 1.0, 0.0] if absf(v1[0]) > 0.1 else [1.0, 0.0, 0.0]
		var cross: Array = crossVec3(v1, axis)
		return quatFromAxisAngle(cross, PI)
	var cross2: Array = crossVec3(v1, v2)
	return quatNormalize([cross2[0], cross2[1], cross2[2], 1.0 + dot])


static func quatFromUpForward(up: Array, forward: Array) -> Array:
	var r: Array = normalizeVec3(forward)
	var y: Array = normalizeVec3(up)
	var s: Array = crossVec3(y, r)
	var s_len: float = hypotN(s)
	if s_len < 1e-5:
		var axis: Array = [0.0, 1.0, 0.0] if absf(r[1]) < 0.9 else [1.0, 0.0, 0.0]
		s = crossVec3(axis, r)
	s = normalizeVec3(s)
	var t: Array = crossVec3(r, s)
	var m00 = s[0]
	var m01 = t[0]
	var m02 = r[0]
	var m10 = s[1]
	var m11 = t[1]
	var m12 = r[1]
	var m20 = s[2]
	var m21 = t[2]
	var m22 = r[2]
	var trace: float = m00 + m11 + m22
	var q := []
	if trace > 0.0:
		var s2: float = sqrt(trace + 1.0) * 2.0
		q = [(m21 - m12) / s2, (m02 - m20) / s2, (m10 - m01) / s2, 0.25 * s2]
	elif m00 > m11 and m00 > m22:
		var s2: float = sqrt(1.0 + m00 - m11 - m22) * 2.0
		q = [0.25 * s2, (m01 + m10) / s2, (m02 + m20) / s2, (m21 - m12) / s2]
	elif m11 > m22:
		var s2: float = sqrt(1.0 + m11 - m00 - m22) * 2.0
		q = [(m01 + m10) / s2, 0.25 * s2, (m12 + m21) / s2, (m02 - m20) / s2]
	else:
		var s2: float = sqrt(1.0 + m22 - m00 - m11) * 2.0
		q = [(m02 + m20) / s2, (m12 + m21) / s2, 0.25 * s2, (m10 - m01) / s2]
	return quatNormalize(q)


static func quatAngleBetween(a: Array, b: Array) -> float:
	var qa: Array = quatNormalize(a)
	var qb: Array = quatNormalize(b)
	var dot: float = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3]
	return Numeric.safeAcos(minf(1.0, absf(dot))) * 2.0


static func rotate2d(v: Array, angle: float) -> Array:
	var c := cos(angle)
	var s := sin(angle)
	return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]


static func cubicBezierEase(t: float, p1: Array, p2: Array) -> float:
	if t <= 0.0:
		return 0.0
	if t >= 1.0:
		return 1.0

	var lo := 0.0
	var hi := 1.0
	for i in range(48):
		var mid := (lo + hi) / 2.0
		if _bezierSample(mid, p1[0], p2[0]) < t:
			lo = mid
		else:
			hi = mid
	return _bezierSample((lo + hi) / 2.0, p1[1], p2[1])


static func _bezierSample(s: float, c1: float, c2: float) -> float:
	var u := 1.0 - s
	return 3.0 * u * u * s * c1 + 3.0 * u * s * s * c2 + s * s * s
