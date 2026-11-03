# GDScript animation tests, mirroring packages/kernel/test/animation.test.ts
# (+ animation-fixtures.ts) against src/gd/animation.gd. Run headless:
#   godot --headless --path packages/runtime-gd/src/gd --script <this file>
# Prints one "ok"/"FAIL" line per check and "RESULT pass=N fail=M"; exits 1 on
# any failure. Driven from vitest by animation.test.ts.
extends SceneTree

const Anim = preload("res://animation.gd")

var _pass := 0
var _fail := 0


# --- fixture builder (port of BinBuilder) ----------------------------------

class Bin:
	var bytes := PackedByteArray()
	var gltf := {"nodes": [{}], "accessors": [], "bufferViews": [], "animations": []}

	func _push(data: PackedByteArray) -> int:
		while bytes.size() % 4 != 0:
			bytes.append(0)
		var offset := bytes.size()
		bytes.append_array(data)
		return offset

	static func f32_bytes(values: Array) -> PackedByteArray:
		var b := PackedByteArray()
		b.resize(values.size() * 4)
		for i in range(values.size()):
			b.encode_float(i * 4, values[i])
		return b

	static func int_bytes(values: Array, size: int, signed: bool) -> PackedByteArray:
		var b := PackedByteArray()
		b.resize(values.size() * size)
		for i in range(values.size()):
			var v: int = values[i]
			if size == 1:
				if signed:
					b.encode_s8(i, v)
				else:
					b.encode_u8(i, v)
			elif size == 2:
				if signed:
					b.encode_s16(i * 2, v)
				else:
					b.encode_u16(i * 2, v)
			else:
				b.encode_u32(i * 4, v)
		return b

	func buffer_view(data: PackedByteArray, byte_stride: int = 0) -> int:
		var view := {"buffer": 0, "byteOffset": _push(data), "byteLength": data.size()}
		if byte_stride > 0:
			view["byteStride"] = byte_stride
		gltf["bufferViews"].append(view)
		return gltf["bufferViews"].size() - 1

	func accessor(def: Dictionary) -> int:
		gltf["accessors"].append(def)
		return gltf["accessors"].size() - 1

	func floats(type: String, values: Array, comps: int) -> int:
		var def := {
			"bufferView": buffer_view(f32_bytes(values)),
			"componentType": 5126,
			"count": values.size() / comps,
			"type": type,
		}
		if type == "SCALAR" and values.size() > 0:
			def["min"] = [values.min()]
			def["max"] = [values.max()]
		return accessor(def)

	# channels: Array of {input, output, path, interpolation?, node?}
	func animation(channels: Array) -> int:
		var samplers := []
		var chans := []
		for i in range(channels.size()):
			var c: Dictionary = channels[i]
			var s := {"input": c["input"], "output": c["output"]}
			if c.has("interpolation"):
				s["interpolation"] = c["interpolation"]
			samplers.append(s)
			chans.append({"sampler": i, "target": {"node": c.get("node", 0), "path": c["path"]}})
		gltf["animations"].append({"samplers": samplers, "channels": chans})
		return gltf["animations"].size() - 1

	func host() -> Dictionary:
		gltf["buffers"] = [{"byteLength": bytes.size()}]
		return {"gltf": gltf, "glbBin": bytes}


func cubic_translation_fixture() -> Dictionary:
	# CUBICSPLINE translation over [0, 2]. Key0: in=0 v=0 out=(1,2,3); key1: in=(4,5,6) v=(10,10,10) out=0.
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 2], 1)
	var output := b.floats("VEC3", [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 10, 10, 10, 0, 0, 0], 3)
	b.animation([{"input": input, "output": output, "interpolation": "CUBICSPLINE", "path": "translation"}])
	return b.host()


func cubic_rotation_fixture() -> Dictionary:
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 1], 1)
	var s := sqrt(0.5)
	var output := b.floats("VEC4", [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.8, 0, 0, 0, 0, 0.4, 0, 0, s, s, 0, 0, 0, 0], 4)
	b.animation([{"input": input, "output": output, "interpolation": "CUBICSPLINE", "path": "rotation"}])
	return b.host()


# --- assertions --------------------------------------------------------------

func check(name: String, cond: bool, detail: String = "") -> void:
	if cond:
		_pass += 1
		print("ok   ", name)
	else:
		_fail += 1
		print("FAIL ", name, " ", detail)


func near(a: float, b: float, eps: float = 1e-4) -> bool:
	return absf(a - b) <= eps


func arr_near(a: Array, b: Array, eps: float = 1e-4) -> bool:
	if a.size() != b.size():
		return false
	for i in range(a.size()):
		if not near(a[i], b[i], eps):
			return false
	return true


func sample(host: Dictionary, t: float, anim: int = 0) -> Dictionary:
	var r = Anim.apply_animation_at(host, anim, t, Callable())
	check("apply_animation_at returns non-null", r != null)
	return host["gltf"]["nodes"][0]


# --- tests -------------------------------------------------------------------

func test_decode_normalization() -> void:
	var b := Bin.new()
	var s16 := b.accessor({"bufferView": b.buffer_view(Bin.int_bytes([-32768, -32767, 0, 32767], 2, true)), "componentType": 5122, "normalized": true, "count": 4, "type": "SCALAR"})
	var u8 := b.accessor({"bufferView": b.buffer_view(Bin.int_bytes([0, 255], 1, false)), "componentType": 5121, "normalized": true, "count": 2, "type": "SCALAR"})
	var s8 := b.accessor({"bufferView": b.buffer_view(Bin.int_bytes([-128, 127], 1, true)), "componentType": 5120, "normalized": true, "count": 2, "type": "SCALAR"})
	var u16raw := b.accessor({"bufferView": b.buffer_view(Bin.int_bytes([65535], 2, false)), "componentType": 5123, "count": 1, "type": "SCALAR"})
	var host := b.host()
	check("decode s16 normalized (incl -32768 clamp)", Array(Anim.decode_accessor(host, s16)["data"]) == [-1.0, -1.0, 0.0, 1.0])
	check("decode u8 normalized", Array(Anim.decode_accessor(host, u8)["data"]) == [0.0, 1.0])
	check("decode s8 normalized", Array(Anim.decode_accessor(host, s8)["data"]) == [-1.0, 1.0])
	check("decode u16 raw", Array(Anim.decode_accessor(host, u16raw)["data"]) == [65535.0])


func test_decode_failures() -> void:
	var b := Bin.new()
	var ok := b.floats("VEC2", [1, 2, 3, 4], 2)
	var bad := b.accessor({"bufferView": 0, "componentType": 5126, "count": 100, "type": "VEC2"})
	var host := b.host()
	check("out-of-range accessor decodes to null", Anim.decode_accessor(host, bad) == null)
	check("no binary chunk decodes to null", Anim.decode_accessor({"gltf": host["gltf"], "glbBin": null}, ok) == null)
	check("read_accessor_elements compat", Anim.read_accessor_elements(host, ok) == [[1.0, 2.0], [3.0, 4.0]])


func test_normalized_short_rotation() -> void:
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 1], 1)
	var q := int(round(sqrt(0.5) * 32767))
	var output := b.accessor({"bufferView": b.buffer_view(Bin.int_bytes([0, 0, 0, 32767, 0, 0, q, q], 2, true)), "componentType": 5122, "normalized": true, "count": 2, "type": "VEC4"})
	b.animation([{"input": input, "output": output, "path": "rotation"}])
	var node := sample(b.host(), 0.5)
	var half := PI / 8.0
	check("normalized SHORT rotation z", near(node["rotation"][2], sin(half)), str(node["rotation"]))
	check("normalized SHORT rotation w", near(node["rotation"][3], cos(half)), str(node["rotation"]))
	var r: Array = node["rotation"]
	check("normalized SHORT rotation unit length", near(sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2] + r[3] * r[3]), 1.0, 1e-5))


func test_interleaved_stride() -> void:
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 1], 1)
	var rows := [1, 2, 3, 1, 1, 1, 99, 3, 4, 5, 3, 5, 7, 99]
	var view := b.buffer_view(Bin.f32_bytes(rows), 28)
	var trs := b.accessor({"bufferView": view, "byteOffset": 0, "componentType": 5126, "count": 2, "type": "VEC3"})
	var scl := b.accessor({"bufferView": view, "byteOffset": 12, "componentType": 5126, "count": 2, "type": "VEC3"})
	b.animation([{"input": input, "output": trs, "path": "translation"}, {"input": input, "output": scl, "path": "scale"}])
	var node := sample(b.host(), 0.5)
	check("byteStride translation", node["translation"] == [2.0, 3.0, 4.0], str(node["translation"]))
	check("byteStride scale", node["scale"] == [2.0, 3.0, 4.0], str(node["scale"]))


func test_sparse() -> void:
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 1, 2], 1)
	var zero_base := b.accessor({
		"componentType": 5126, "count": 3, "type": "VEC3",
		"sparse": {
			"count": 1,
			"indices": {"bufferView": b.buffer_view(Bin.int_bytes([1], 1, false)), "componentType": 5121},
			"values": {"bufferView": b.buffer_view(Bin.f32_bytes([10, 20, 30]))},
		},
	})
	var patched := b.accessor({
		"bufferView": b.buffer_view(Bin.f32_bytes([1, 1, 1, 2, 2, 2, 3, 3, 3])),
		"componentType": 5126, "count": 3, "type": "VEC3",
		"sparse": {
			"count": 2,
			"indices": {"bufferView": b.buffer_view(Bin.int_bytes([0, 2], 2, false)), "componentType": 5123},
			"values": {"bufferView": b.buffer_view(Bin.f32_bytes([7, 7, 7, 9, 9, 9]))},
		},
	})
	b.animation([{"input": input, "output": zero_base, "path": "translation"}, {"input": input, "output": patched, "path": "scale"}])
	var host := b.host()
	check("sparse no-bufferView base decodes zeros + patch", Array(Anim.decode_accessor(host, zero_base)["data"]) == [0.0, 0.0, 0.0, 10.0, 20.0, 30.0, 0.0, 0.0, 0.0])
	var at05 := sample(host, 0.5)
	check("sparse translation @0.5", at05["translation"] == [5.0, 10.0, 15.0], str(at05["translation"]))
	check("sparse scale @0.5 (lerp 7,2)", at05["scale"] == [4.5, 4.5, 4.5], str(at05["scale"]))
	var at15 := sample(host, 1.5)
	check("sparse translation @1.5", at15["translation"] == [5.0, 10.0, 15.0], str(at15["translation"]))
	check("sparse scale @1.5 (lerp 2,9)", at15["scale"] == [5.5, 5.5, 5.5], str(at15["scale"]))


func test_cubic_translation() -> void:
	# dt=2, u=0.5: 0.5*v0 + 0.125*dt*out0 + 0.5*v1 - 0.125*dt*in1 = (4.25, 4.25, 4.25)
	var host := cubic_translation_fixture()
	var mid := sample(host, 1.0)["translation"] as Array
	check("CUBICSPLINE translation (4.25,4.25,4.25)", arr_near(mid, [4.25, 4.25, 4.25], 1e-5), str(mid))
	check("CUBICSPLINE clamp end uses value, not tangent", sample(host, 2.0)["translation"] == [10.0, 10.0, 10.0])
	# t=2.0 wraps (effective time is requested - ceil((requested - T) / T) * T) -> key 0 value at t=0 too.
	check("CUBICSPLINE start value", sample(host, 0.0)["translation"] == [0.0, 0.0, 0.0])
	var q := sample(host, 0.5)["translation"] as Array
	check("CUBICSPLINE u=0.25 x", near(q[0], 0.140625 * 2 * 1 + 0.15625 * 10 - 0.046875 * 2 * 4, 1e-5), str(q))
	check("CUBICSPLINE u=0.25 z", near(q[2], 0.140625 * 2 * 3 + 0.15625 * 10 - 0.046875 * 2 * 6, 1e-5), str(q))


func test_cubic_rotation() -> void:
	var host := cubic_rotation_fixture()
	var s := sqrt(0.5)
	var z := 0.125 * 0.8 + 0.5 * s
	var w := 0.5 + 0.5 * s - 0.125 * 0.4
	var n := sqrt(z * z + w * w)
	var r := sample(host, 0.5)["rotation"] as Array
	check("CUBICSPLINE rotation unit length", near(sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2] + r[3] * r[3]), 1.0, 1e-6), str(r))
	check("normalization actually mattered", absf(n - 1.0) > 0.01)
	check("CUBICSPLINE rotation z", near(r[2], z / n), str(r))
	check("CUBICSPLINE rotation w", near(r[3], w / n), str(r))


func test_weights() -> void:
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 1], 1)
	var linear := b.floats("SCALAR", [0, 1, 1, 0], 1)
	var cubic := b.floats("SCALAR", [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], 1)
	b.animation([{"input": input, "output": linear, "path": "weights"}])
	b.animation([{"input": input, "output": cubic, "interpolation": "CUBICSPLINE", "path": "weights"}])
	var host := b.host()
	Anim.apply_animation_at(host, 0, 0.25, Callable())
	check("weights LINEAR", host["gltf"]["nodes"][0]["weights"] == [0.25, 0.75], str(host["gltf"]["nodes"][0]["weights"]))
	Anim.apply_animation_at(host, 1, 0.5, Callable())
	var w: Array = host["gltf"]["nodes"][0]["weights"]
	check("weights CUBICSPLINE", w.size() == 2 and near(w[0], 0.5, 1e-6) and near(w[1], 0.5, 1e-6), str(w))


func test_step_and_single_key() -> void:
	var b := Bin.new()
	var input := b.floats("SCALAR", [1, 2, 3], 1)
	var out := b.floats("VEC3", [1, 1, 1, 2, 2, 2, 3, 3, 3], 3)
	var one := b.floats("SCALAR", [0.5], 1)
	var one_out := b.floats("VEC3", [4, 5, 6], 3)
	b.animation([{"input": input, "output": out, "interpolation": "STEP", "path": "translation"}])
	b.animation([{"input": one, "output": one_out, "path": "translation"}])
	var host := b.host()
	Anim.apply_animation_at(host, 0, 2.0, Callable())
	check("STEP on key", host["gltf"]["nodes"][0]["translation"] == [2.0, 2.0, 2.0])
	Anim.apply_animation_at(host, 0, 2.9, Callable())
	check("STEP between keys holds", host["gltf"]["nodes"][0]["translation"] == [2.0, 2.0, 2.0])
	Anim.apply_animation_at(host, 1, 0.3, Callable())
	check("single keyframe clamps", host["gltf"]["nodes"][0]["translation"] == [4.0, 5.0, 6.0])


func test_skipped_channels() -> void:
	var b := Bin.new()
	var input := b.floats("SCALAR", [0, 1], 1)
	var bad := b.accessor({"bufferView": 0, "componentType": 5126, "count": 50, "type": "VEC3"})
	b.animation([{"input": input, "output": bad, "path": "translation"}])
	var r = Anim.apply_animation_at(b.host(), 0, 0.5, Callable())
	check("undecodable channel reported", r != null and r["wroteAny"] == false and r["skippedChannels"] == 1, str(r))


func test_cache() -> void:
	var host := cubic_translation_fixture()
	Anim.apply_animation_at(host, 0, 0.1, Callable())
	var first: Dictionary = Anim.get_animation_cache_stats(host)
	check("first tick decodes input + output", first["decodes"] == 2, str(first))
	for i in range(1000):
		Anim.apply_animation_at(host, 0, (i % 20) / 10.0, Callable())
	check("1000 later ticks are cache-only", Anim.get_animation_cache_stats(host)["decodes"] == first["decodes"], str(Anim.get_animation_cache_stats(host)))
	Anim.invalidate_animation_cache(host)
	Anim.apply_animation_at(host, 0, 1.0, Callable())
	check("invalidate forces a re-decode", Anim.get_animation_cache_stats(host)["decodes"] == 2, str(Anim.get_animation_cache_stats(host)))
	# A swapped binary chunk (new array identity) forces a re-decode too.
	var swapped := {"gltf": host["gltf"], "glbBin": (host["glbBin"] as PackedByteArray).duplicate()}
	swapped["_animCache"] = host["_animCache"]
	Anim.apply_animation_at(swapped, 0, 1.0, Callable())
	check("swapped bin forces a re-decode", Anim.get_animation_cache_stats(swapped)["decodes"] == 4, str(Anim.get_animation_cache_stats(swapped)))


func test_monotonic_vs_random() -> void:
	var b := Bin.new()
	var times := []
	for i in range(50):
		times.append(i * 0.1)
	var input := b.floats("SCALAR", times, 1)
	var vals := []
	for t in times:
		vals.append_array([t, t * 2.0, -t])
	var out := b.floats("VEC3", vals, 3)
	b.animation([{"input": input, "output": out, "path": "translation"}])
	var host := b.host()
	var ok := true
	for t in [0.05, 0.15, 0.25, 3.33, 0.01, 4.85, 2.5, 2.51, 1.0]:
		Anim.apply_animation_at(host, 0, t, Callable())
		var tr: Array = host["gltf"]["nodes"][0]["translation"]
		if not (near(tr[0], t, 1e-4) and near(tr[1], t * 2.0, 1e-4)):
			ok = false
			print("  mismatch at t=", t, " got ", tr)
	check("last-key fast path agrees with binary search", ok)


func _initialize() -> void:
	test_decode_normalization()
	test_decode_failures()
	test_normalized_short_rotation()
	test_interleaved_stride()
	test_sparse()
	test_cubic_translation()
	test_cubic_rotation()
	test_weights()
	test_step_and_single_key()
	test_skipped_channels()
	test_cache()
	test_monotonic_vs_random()
	print("RESULT pass=%d fail=%d" % [_pass, _fail])
	quit(1 if _fail > 0 else 0)
