# Animation sampling helpers, transcribed from packages/runtime-py/src/py/
# gltfi_runtime/animation.py (itself transcribed from packages/kernel/src/
# animation.ts). `host` is a Dictionary {"gltf": <decoded JSON Dictionary>,
# "glbBin": <PackedByteArray or null>}. All glTF-JSON indices (accessor/
# animation/node index, ...) are 0-based, matching both the glTF spec's own
# convention and GDScript's native Array indexing — no index-base conversion
# needed anywhere in this file (unlike the Lua backend's animation.lua).
extends RefCounted

const Kmath = preload("res://kmath.gd")

const _ACCESSOR_COMPONENT_COUNTS := {
	"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16
}


static func _finite(x: float) -> bool:
	return not (is_nan(x) or is_inf(x))


# Bytes per component for each glTF componentType.
const _COMPONENT_BYTES := {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}


# Reads one scalar component of `component_type` at `offset` (PackedByteArray
# decode_* are little-endian, as glTF mandates), applying the spec's
# normalization when requested: signed max(c / (2^(n-1)-1), -1), unsigned
# c / (2^n-1). Mirrors kernel animation.ts readComponent.
static func _read_component(bin: PackedByteArray, offset: int, component_type: int, normalized: bool) -> float:
	match component_type:
		5126:
			return bin.decode_float(offset)
		5120:
			var c8: int = bin.decode_s8(offset)
			return maxf(c8 / 127.0, -1.0) if normalized else float(c8)
		5121:
			var cu8: int = bin.decode_u8(offset)
			return cu8 / 255.0 if normalized else float(cu8)
		5122:
			var c16: int = bin.decode_s16(offset)
			return maxf(c16 / 32767.0, -1.0) if normalized else float(c16)
		5123:
			var cu16: int = bin.decode_u16(offset)
			return cu16 / 65535.0 if normalized else float(cu16)
	var cu32: int = bin.decode_u32(offset)  # 5125 (UNSIGNED_INT)
	return cu32 / 4294967295.0 if normalized else float(cu32)


static func _is_int_valued(v) -> bool:
	return (typeof(v) == TYPE_INT) or (typeof(v) == TYPE_FLOAT and _finite(v) and v == floor(v))


static func _opt_int(d: Dictionary, key: String) -> int:
	var v = d.get(key)
	return int(v) if v != null else 0


static func _view_at(buffer_views, index):
	if not (buffer_views is Array) or not _is_int_valued(index):
		return null
	var i: int = int(index)
	if i < 0 or i >= buffer_views.size() or not (buffer_views[i] is Dictionary):
		return null
	return buffer_views[i]


# Decodes an accessor per glTF 2.0 section 3.6.2: all six component types,
# `normalized`, bufferView.byteStride (interleaved data; stride defaults to the
# element size), accessor+bufferView byteOffset, sparse substitution (indices
# of 5121/5123/5125) and a missing bufferView (all zeros, which a sparse block
# may then patch). Returns {"data": PackedFloat32Array, "count": int,
# "comps": int} (element i, component j at data[i * comps + j]) or null when
# the data cannot be decoded (no binary chunk, unknown type, or ranges outside
# the chunk). Mirrors kernel animation.ts decodeAccessor.
static func decode_accessor(host: Dictionary, accessor_index):
	var gltf = host.get("gltf")
	var bin_ = host.get("glbBin")
	var accessors = gltf.get("accessors") if gltf is Dictionary else null
	if not (accessors is Array) or not _is_int_valued(accessor_index):
		return null
	var ai: int = int(accessor_index)
	var accessor = accessors[ai] if (ai >= 0 and ai < accessors.size()) else null
	if not (accessor is Dictionary) or not (bin_ is PackedByteArray):
		return null
	var bin: PackedByteArray = bin_
	var comps: int = _ACCESSOR_COMPONENT_COUNTS.get(accessor.get("type"), 0)
	var ctype = accessor.get("componentType")
	var component_type: int = int(ctype) if _is_int_valued(ctype) else 0
	var comp_bytes: int = _COMPONENT_BYTES.get(component_type, 0)
	var count_v = accessor.get("count")
	if comps == 0 or comp_bytes == 0 or not _is_int_valued(count_v) or count_v < 0:
		return null
	var count: int = int(count_v)
	var normalized: bool = accessor.get("normalized") == true
	var data := PackedFloat32Array()
	data.resize(count * comps)
	var buffer_views = gltf.get("bufferViews")
	if accessor.has("bufferView"):
		var view = _view_at(buffer_views, accessor["bufferView"])
		if view == null:
			return null
		var element_bytes: int = comps * comp_bytes
		var stride: int = int(view["byteStride"]) if view.get("byteStride") != null else element_bytes
		var base: int = _opt_int(view, "byteOffset") + _opt_int(accessor, "byteOffset")
		if count > 0 and base + (count - 1) * stride + element_bytes > bin.size():
			return null
		for i in range(count):
			var at: int = base + i * stride
			for j in range(comps):
				data[i * comps + j] = _read_component(bin, at + j * comp_bytes, component_type, normalized)
	var sparse = accessor.get("sparse")
	if sparse is Dictionary:
		var n_v = sparse.get("count")
		var sp_indices = sparse.get("indices")
		var sp_values = sparse.get("values")
		if not _is_int_valued(n_v) or n_v < 0 or not (sp_indices is Dictionary) or not (sp_values is Dictionary):
			return null
		var n: int = int(n_v)
		var idx_type_v = sp_indices.get("componentType")
		var idx_type: int = int(idx_type_v) if _is_int_valued(idx_type_v) else 0
		var idx_bytes: int = _COMPONENT_BYTES[idx_type] if (idx_type == 5121 or idx_type == 5123 or idx_type == 5125) else 0
		var idx_view = _view_at(buffer_views, sp_indices.get("bufferView"))
		var val_view = _view_at(buffer_views, sp_values.get("bufferView"))
		if idx_bytes == 0 or idx_view == null or val_view == null:
			return null
		var idx_base: int = _opt_int(idx_view, "byteOffset") + _opt_int(sp_indices, "byteOffset")
		var val_base: int = _opt_int(val_view, "byteOffset") + _opt_int(sp_values, "byteOffset")
		if idx_base + n * idx_bytes > bin.size() or val_base + n * comps * comp_bytes > bin.size():
			return null
		for s in range(n):
			var target: int = int(_read_component(bin, idx_base + s * idx_bytes, idx_type, false))
			if target >= count:
				return null
			for j in range(comps):
				data[target * comps + j] = _read_component(bin, val_base + (s * comps + j) * comp_bytes, component_type, normalized)
	return {"data": data, "count": count, "comps": comps}


# Compat wrapper: decodes an accessor as an Array of per-element float Arrays,
# or null when it cannot be decoded. Uncached.
static func read_accessor_elements(host: Dictionary, accessor_index):
	var decoded = decode_accessor(host, accessor_index)
	if decoded == null:
		return null
	var out := []
	var comps: int = decoded["comps"]
	var data: PackedFloat32Array = decoded["data"]
	for i in range(decoded["count"]):
		var element := []
		for j in range(comps):
			element.append(data[i * comps + j])
		out.append(element)
	return out


# ---------------------------------------------------------------------------
# Per-document cache. Decoding accessors and scanning keyframes every tick was
# the hot spot, so decoded accessors and per-animation channel plans are built
# once and kept in host["_animCache"] (the engine owns ONE persistent host
# Dictionary for its lifetime, the GDScript analogue of the TS WeakMap keyed by
# the gltf object). The entry remembers the binary chunk and the accessors/
# animations/bufferViews array identities and is rebuilt when any differs;
# callers mutating those in place can call invalidate_animation_cache.
# ---------------------------------------------------------------------------

static func _get_doc_cache(host: Dictionary):
	var gltf = host.get("gltf")
	if not (gltf is Dictionary):
		return null
	var cache = host.get("_animCache")
	var bin_ = host.get("glbBin")
	if cache == null \
			or not is_same(cache["bin"], bin_) \
			or not is_same(cache["accessors"], gltf.get("accessors")) \
			or not is_same(cache["animations"], gltf.get("animations")) \
			or not is_same(cache["bufferViews"], gltf.get("bufferViews")):
		cache = {
			"bin": bin_,
			"accessors": gltf.get("accessors"),
			"animations": gltf.get("animations"),
			"bufferViews": gltf.get("bufferViews"),
			"decoded": {},
			"plans": {},
			"decodes": cache["decodes"] if cache != null else 0,
			"hits": cache["hits"] if cache != null else 0,
		}
		host["_animCache"] = cache
	return cache


static func invalidate_animation_cache(host: Dictionary) -> void:
	host.erase("_animCache")


# Diagnostics for tests: how many accessor decodes ran vs. were served from the
# cache for this host's document.
static func get_animation_cache_stats(host: Dictionary) -> Dictionary:
	var cache = _get_doc_cache(host)
	if cache == null:
		return {"decodes": 0, "hits": 0}
	return {"decodes": cache["decodes"], "hits": cache["hits"]}


static func _cached_accessor(host: Dictionary, cache: Dictionary, index):
	var key: int = int(index) if _is_int_valued(index) else -1
	if cache["decoded"].has(key):
		cache["hits"] += 1
		return cache["decoded"][key]
	cache["decodes"] += 1
	var decoded = decode_accessor(host, index)
	cache["decoded"][key] = decoded
	return decoded


# Builds the sampling plan for one channel, or null when its data is unusable
# (counted in the plan's "skipped").
static func _build_channel_plan(host: Dictionary, cache: Dictionary, sampler: Dictionary, target: Dictionary):
	if not (target.get("path") is String):
		return null
	var input = _cached_accessor(host, cache, sampler.get("input"))
	var output = _cached_accessor(host, cache, sampler.get("output"))
	if input == null or output == null or input["count"] == 0 or input["comps"] != 1:
		return null
	var interpolation = sampler.get("interpolation")
	if interpolation == null:
		interpolation = "LINEAR"
	var cubic: bool = interpolation == "CUBICSPLINE"
	# Output holds keys * (cubic ? 3 : 1) values; each has `width` components
	# (weights outputs are SCALAR accessors holding keys * perKey * targets).
	var value_count: int = input["count"] * (3 if cubic else 1)
	var out_len: int = (output["data"] as PackedFloat32Array).size()
	if out_len == 0 or out_len % value_count != 0:
		return null
	var node_index: int = int(target["node"])
	return {
		"times": input["data"],
		"values": output["data"],
		"width": out_len / value_count,
		"cubic": cubic,
		"step": interpolation == "STEP",
		"path": target["path"],
		"node": node_index,
		"pointer": "/nodes/%d/%s" % [node_index, target["path"]],
		"lastKey": 0,
	}


# Returns [minTime, maxTime] (a 2-element Array — GDScript has no tuple
# type). [NaN, NaN] on failure, mirroring Python's `(nan, nan)` return.
static func get_animation_time_range(host: Dictionary, animation_index: int) -> Array:
	var gltf = host.get("gltf")
	var animations = gltf.get("animations") if gltf is Dictionary else null
	var animation = animations[animation_index] if (animations is Array and animation_index >= 0 and animation_index < animations.size()) else null
	if animation == null:
		return [NAN, NAN]
	var min_ := INF
	var max_ := -INF
	var used_samplers := {}
	var channels = animation.get("channels")
	if channels is Array:
		for channel in channels:
			used_samplers[channel.get("sampler")] = true
	var accessors = gltf.get("accessors")
	if not (accessors is Array):
		accessors = []
	var samplers = animation.get("samplers")
	if not (samplers is Array):
		samplers = []
	for sampler_index in used_samplers.keys():
		var sampler = samplers[sampler_index] if (sampler_index != null and sampler_index >= 0 and sampler_index < samplers.size()) else null
		var input_index = sampler.get("input", -1) if sampler != null else -1
		var input_accessor = accessors[input_index] if (input_index != null and input_index >= 0 and input_index < accessors.size()) else null
		if input_accessor != null:
			var in_min = input_accessor.get("min")
			var in_max = input_accessor.get("max")
			if in_min is Array and in_min.size() > 0:
				min_ = minf(min_, in_min[0])
			if in_max is Array and in_max.size() > 0:
				max_ = maxf(max_, in_max[0])
	if not _finite(min_) or not _finite(max_):
		return [NAN, NAN]
	return [min_, max_]


# Maps a requested timestamp on the infinite timeline to the effective
# timestamp within the animation data range [0, T] (KHR_interactivity §4.6).
static func effective_animation_time(requested: float, max_time: float) -> float:
	if max_time == 0.0 or is_nan(max_time):
		return 0.0
	var s: float
	if requested > 0.0:
		s = ceil((requested - max_time) / max_time)
	else:
		s = floor(requested / max_time)
	return requested - s * max_time


static func _get_animation_plan(host: Dictionary, cache: Dictionary, animation_index: int, animation: Dictionary) -> Dictionary:
	if cache["plans"].has(animation_index):
		return cache["plans"][animation_index]
	var max_ = get_animation_time_range(host, animation_index)[1]
	var plan := {"maxTime": max_ if _finite(max_) else 0.0, "channels": [], "skipped": 0}
	var samplers = animation.get("samplers")
	if not (samplers is Array):
		samplers = []
	var channels = animation.get("channels")
	if not (channels is Array):
		channels = []
	for channel in channels:
		var sampler_index = channel.get("sampler")
		var sampler = samplers[int(sampler_index)] if (_is_int_valued(sampler_index) and int(sampler_index) >= 0 and int(sampler_index) < samplers.size()) else null
		var target = channel.get("target")
		# structurally invalid channel: ignored, not a data failure
		if not (sampler is Dictionary) or not (target is Dictionary) or target.get("node") == null:
			continue
		var channel_plan = _build_channel_plan(host, cache, sampler, target)
		if channel_plan != null:
			plan["channels"].append(channel_plan)
		else:
			plan["skipped"] += 1
	cache["plans"][animation_index] = plan
	return plan


# Finds k with times[k] <= t < times[k+1] (t strictly inside the range).
# Playback is mostly monotonic, so try the last-used key and its successor
# before falling back to binary search.
static func _find_key(plan: Dictionary, t: float) -> int:
	var times: PackedFloat32Array = plan["times"]
	var n: int = times.size()
	var last: int = plan["lastKey"]
	if last + 1 < n and times[last] <= t and t < times[last + 1]:
		return last
	if last + 2 < n and times[last + 1] <= t and t < times[last + 2]:
		plan["lastKey"] = last + 1
		return last + 1
	var lo := 0
	var hi := n - 1
	while hi - lo > 1:
		var mid: int = (lo + hi) >> 1
		if times[mid] <= t:
			lo = mid
		else:
			hi = mid
	plan["lastKey"] = lo
	return lo


# Reads value slot `slot` (index in units of `width`) into a new Array.
static func _read_value(plan: Dictionary, slot: int) -> Array:
	var width: int = plan["width"]
	var values: PackedFloat32Array = plan["values"]
	var out := []
	var base: int = slot * width
	for j in range(width):
		out.append(values[base + j])
	return out


static func _sample_channel(plan: Dictionary, t: float) -> Array:
	var times: PackedFloat32Array = plan["times"]
	var n: int = times.size()
	var cubic: bool = plan["cubic"]
	# CUBICSPLINE keyframes are [inTangent, value, outTangent]; the value of
	# key k sits at slot k*3+1.
	if n == 1 or t <= times[0]:
		return _read_value(plan, 1 if cubic else 0)
	if t >= times[n - 1]:
		return _read_value(plan, (n - 1) * 3 + 1 if cubic else n - 1)
	var k: int = _find_key(plan, t)
	var t0: float = times[k]
	var dt: float = times[k + 1] - t0
	var u: float = (t - t0) / dt if dt > 0.0 else 0.0
	if plan["step"]:
		return _read_value(plan, k)
	var w: int = plan["width"]
	var values: PackedFloat32Array = plan["values"]
	if cubic:
		# Cubic Hermite (glTF 2.0 Appendix C): tangents are scaled by the
		# keyframe interval dt; rotations are re-normalized afterwards.
		var u2: float = u * u
		var u3: float = u2 * u
		var h00: float = 2.0 * u3 - 3.0 * u2 + 1.0
		var h10: float = u3 - 2.0 * u2 + u
		var h01: float = -2.0 * u3 + 3.0 * u2
		var h11: float = u3 - u2
		var v0: int = (k * 3 + 1) * w
		var b0: int = (k * 3 + 2) * w  # outTangent of k
		var v1: int = ((k + 1) * 3 + 1) * w
		var a1: int = (k + 1) * 3 * w  # inTangent of k+1
		var out := []
		for j in range(w):
			out.append(h00 * values[v0 + j] + h10 * dt * values[b0 + j] + h01 * values[v1 + j] + h11 * dt * values[a1 + j])
		return Kmath.quatNormalize(out) if plan["path"] == "rotation" else out
	if plan["path"] == "rotation":
		return Kmath.quatSlerp(_read_value(plan, k), _read_value(plan, k + 1), u)
	var out2 := []
	var a: int = k * w
	var b: int = a + w
	for j in range(w):
		var x: float = values[a + j]
		out2.append(x + (values[b + j] - x) * u)
	return out2


# Samples animation `animation_index` at virtual-timeline position `requested`
# and writes the resulting channel values straight into host["gltf"]'s node
# Dictionaries. `on_channel_write(pointer: String, value)` (a Callable, may be
# invalid) is called for each written channel. Returns null if the animation
# doesn't exist, else {"t", "wroteAny", "skippedChannels"}. Accessor decoding
# and channel setup happen once per document (see the cache above); a tick only
# does keyframe lookup + interpolation.
static func apply_animation_at(host: Dictionary, animation_index: int, requested: float, on_channel_write: Callable):
	var gltf = host.get("gltf")
	var animations = gltf.get("animations") if gltf is Dictionary else null
	var animation = animations[animation_index] if (animations is Array and animation_index >= 0 and animation_index < animations.size()) else null
	if animation == null:
		return null
	var cache = _get_doc_cache(host)
	if cache == null:
		return null
	var plan: Dictionary = _get_animation_plan(host, cache, animation_index, animation)
	var t: float = effective_animation_time(requested, plan["maxTime"])
	var wrote_any := false
	var nodes = gltf.get("nodes")
	if not (nodes is Array):
		nodes = []
	for channel in plan["channels"]:
		var node_index: int = channel["node"]
		var node = nodes[node_index] if (node_index >= 0 and node_index < nodes.size()) else null
		if not (node is Dictionary):
			continue
		var sampled: Array = _sample_channel(channel, t)
		node[channel["path"]] = sampled
		if on_channel_write.is_valid():
			on_channel_write.call(channel["pointer"], sampled)
		wrote_any = true
	return {"t": t, "wroteAny": wrote_any, "skippedChannels": plan["skipped"]}
