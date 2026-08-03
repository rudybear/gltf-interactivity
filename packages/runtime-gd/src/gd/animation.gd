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


# Decodes an accessor from the binary chunk as an Array of per-element
# (0-based) float Arrays. Only tightly-packed float32 data is supported
# (covers animation samplers). Returns null when unavailable.
static func read_accessor_elements(host: Dictionary, accessor_index):
	var gltf = host.get("gltf")
	var bin_ = host.get("glbBin")
	var accessors = gltf.get("accessors") if gltf is Dictionary else null
	var accessor = accessors[accessor_index] if (accessors is Array and accessor_index != null and accessor_index >= 0 and accessor_index < accessors.size()) else null
	if accessor == null or bin_ == null or accessor.get("componentType") != 5126:
		return null
	var component_count: int = _ACCESSOR_COMPONENT_COUNTS.get(accessor.get("type"), 1)
	var buffer_views = gltf.get("bufferViews")
	var view_index = accessor.get("bufferView", 0)
	if view_index == null:
		view_index = 0
	var view = buffer_views[view_index] if (buffer_views is Array and view_index >= 0 and view_index < buffer_views.size()) else null
	if view == null:
		return null
	var view_byte_offset = view.get("byteOffset", 0)
	if view_byte_offset == null:
		view_byte_offset = 0
	var accessor_byte_offset = accessor.get("byteOffset", 0)
	if accessor_byte_offset == null:
		accessor_byte_offset = 0
	var byte_offset: int = int(view_byte_offset) + int(accessor_byte_offset)
	var count: int = int(accessor.get("count", 0))
	var end: int = byte_offset + count * component_count * 4
	if end > bin_.size():
		return null
	var out := []
	for i in range(count):
		var element := []
		for j in range(component_count):
			var offset: int = byte_offset + (i * component_count + j) * 4
			element.append(bin_.decode_float(offset))
		out.append(element)
	return out


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


# Samples animation `animation_index` at virtual-timeline position `requested`
# and writes the resulting channel values straight into host["gltf"]'s node
# Dictionaries. `on_channel_write(pointer: String, value)` (a Callable, may be
# null) is called for each written channel. Returns null if the animation
# doesn't exist, else {"t":..., "wroteAny":...}.
static func apply_animation_at(host: Dictionary, animation_index: int, requested: float, on_channel_write: Callable):
	var gltf = host.get("gltf")
	var animations = gltf.get("animations") if gltf is Dictionary else null
	var animation = animations[animation_index] if (animations is Array and animation_index >= 0 and animation_index < animations.size()) else null
	if animation == null:
		return null
	var range_: Array = get_animation_time_range(host, animation_index)
	var max_time: float = range_[1]
	if is_nan(max_time):
		max_time = 0.0
	var t: float = effective_animation_time(requested, max_time)
	var wrote_any := false
	var samplers = animation.get("samplers")
	if not (samplers is Array):
		samplers = []
	var channels = animation.get("channels")
	if not (channels is Array):
		channels = []
	for channel in channels:
		var sampler_index = channel.get("sampler")
		var sampler = samplers[sampler_index] if (sampler_index != null and sampler_index >= 0 and sampler_index < samplers.size()) else null
		var target = channel.get("target")
		if sampler == null or target == null or target.get("node") == null:
			continue
		var times_raw = read_accessor_elements(host, sampler.get("input"))
		var values = read_accessor_elements(host, sampler.get("output"))
		if times_raw == null or values == null or times_raw.size() == 0:
			continue
		var times := []
		for item in times_raw:
			times.append(item[0])
		var interpolation = sampler.get("interpolation", "LINEAR")
		if interpolation == null:
			interpolation = "LINEAR"
		var stride: int = 3 if interpolation == "CUBICSPLINE" else 1
		var cubic_offset: int = 1 if stride == 3 else 0
		var sampled
		if t <= times[0]:
			sampled = values[0 * stride + cubic_offset]
		elif t >= times[times.size() - 1]:
			sampled = values[(times.size() - 1) * stride + cubic_offset]
		else:
			var k := 0
			while k + 1 < times.size() and times[k + 1] < t:
				k += 1
			var t0: float = times[k]
			var t1: float = times[k + 1]
			var u: float = (t - t0) / (t1 - t0) if t1 > t0 else 0.0
			var v0 = values[k * stride + cubic_offset]
			var v1 = values[(k + 1) * stride + cubic_offset]
			if interpolation == "STEP":
				sampled = v0
			elif target.get("path") == "rotation":
				sampled = Kmath.quatSlerp(v0, v1, u)
			else:
				var lerped := []
				for i in range(v0.size()):
					lerped.append(v0[i] + (v1[i] - v0[i]) * u)
				sampled = lerped
		var nodes = gltf.get("nodes")
		if not (nodes is Array):
			nodes = []
		var node_index: int = target.get("node")
		var node = nodes[node_index] if (node_index >= 0 and node_index < nodes.size()) else null
		if node == null:
			continue
		var path: String = target.get("path")
		if path == "weights":
			node["weights"] = sampled
		else:
			node[path] = sampled
		if on_channel_write.is_valid():
			on_channel_write.call("/nodes/%d/%s" % [node_index, path], sampled)
		wrote_any = true
	return {"t": t, "wroteAny": wrote_any}
