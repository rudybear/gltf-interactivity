# Animation sampling helpers, transcribed from packages/kernel/src/
# animation.ts. `host` is a dict `{"gltf": <decoded JSON>, "glbBin": <bytes or
# None>}`. All glTF-JSON indices (accessor/animation/node index, ...) are
# 0-based, matching both the glTF spec's own convention and Python's native
# list indexing — no index-base conversion needed anywhere in this file
# (unlike the Lua backend's animation.lua, which needs a "+1" at nearly every
# line touching a decoded-JSON array).
import math
import struct

from .kmath import quat_slerp

_ACCESSOR_COMPONENT_COUNTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


def _finite(x: float) -> bool:
    return x == x and not math.isinf(x)


# Decodes an accessor from the binary chunk as a list of per-element
# (0-based) float lists. Only tightly-packed float32 data is supported
# (covers animation samplers). Returns None when unavailable.
def read_accessor_elements(host: dict, accessor_index: int):
    gltf = host.get("gltf")
    bin_ = host.get("glbBin")
    accessors = gltf.get("accessors") if gltf else None
    accessor = accessors[accessor_index] if accessors and 0 <= accessor_index < len(accessors) else None
    if not accessor or bin_ is None or accessor.get("componentType") != 5126:
        return None
    component_count = _ACCESSOR_COMPONENT_COUNTS.get(accessor.get("type"), 1)
    buffer_views = gltf.get("bufferViews")
    view_index = accessor.get("bufferView", 0) or 0
    view = buffer_views[view_index] if buffer_views and 0 <= view_index < len(buffer_views) else None
    if view is None:
        return None
    byte_offset = (view.get("byteOffset", 0) or 0) + (accessor.get("byteOffset", 0) or 0)
    count = accessor.get("count", 0)
    end = byte_offset + count * component_count * 4
    if end > len(bin_):
        return None
    out = []
    for i in range(count):
        element = []
        for j in range(component_count):
            offset = byte_offset + (i * component_count + j) * 4
            element.append(struct.unpack_from("<f", bin_, offset)[0])
        out.append(element)
    return out


def get_animation_time_range(host: dict, animation_index: int):
    gltf = host.get("gltf")
    animations = gltf.get("animations") if gltf else None
    animation = animations[animation_index] if animations and 0 <= animation_index < len(animations) else None
    if not animation:
        return float("nan"), float("nan")
    min_ = math.inf
    max_ = -math.inf
    used_samplers = set()
    for channel in animation.get("channels") or []:
        used_samplers.add(channel.get("sampler"))
    accessors = gltf.get("accessors") or []
    samplers = animation.get("samplers") or []
    for sampler_index in used_samplers:
        sampler = samplers[sampler_index] if sampler_index is not None and 0 <= sampler_index < len(samplers) else None
        input_index = sampler.get("input", -1) if sampler else -1
        input_accessor = accessors[input_index] if input_index is not None and 0 <= input_index < len(accessors) else None
        if input_accessor:
            in_min = input_accessor.get("min")
            in_max = input_accessor.get("max")
            if isinstance(in_min, list) and len(in_min) > 0:
                min_ = min(min_, in_min[0])
            if isinstance(in_max, list) and len(in_max) > 0:
                max_ = max(max_, in_max[0])
    if not _finite(min_) or not _finite(max_):
        return float("nan"), float("nan")
    return min_, max_


# Maps a requested timestamp on the infinite timeline to the effective
# timestamp within the animation data range [0, T] (KHR_interactivity §4.6).
def effective_animation_time(requested: float, max_time: float) -> float:
    if max_time == 0 or max_time != max_time:
        return 0.0
    if requested > 0:
        s = math.ceil((requested - max_time) / max_time)
    else:
        s = math.floor(requested / max_time)
    return requested - s * max_time


# Samples animation `animation_index` at virtual-timeline position `requested`
# and writes the resulting channel values straight into host["gltf"]'s node
# objects. `on_channel_write(pointer, value)` is called for each written
# channel. Returns None if the animation doesn't exist, else {"t":..., "wroteAny":...}.
def apply_animation_at(host: dict, animation_index: int, requested: float, on_channel_write=None):
    gltf = host.get("gltf")
    animations = gltf.get("animations") if gltf else None
    animation = animations[animation_index] if animations and 0 <= animation_index < len(animations) else None
    if not animation:
        return None
    _, max_time = get_animation_time_range(host, animation_index)
    if max_time != max_time:
        max_time = 0.0
    t = effective_animation_time(requested, max_time)
    wrote_any = False
    samplers = animation.get("samplers") or []
    for channel in animation.get("channels") or []:
        sampler_index = channel.get("sampler")
        sampler = samplers[sampler_index] if sampler_index is not None and 0 <= sampler_index < len(samplers) else None
        target = channel.get("target")
        if not sampler or not target or target.get("node") is None:
            continue
        times_raw = read_accessor_elements(host, sampler.get("input"))
        values = read_accessor_elements(host, sampler.get("output"))
        if not times_raw or not values or len(times_raw) == 0:
            continue
        times = [item[0] for item in times_raw]
        interpolation = sampler.get("interpolation", "LINEAR")
        stride = 3 if interpolation == "CUBICSPLINE" else 1
        cubic_offset = 1 if stride == 3 else 0
        if t <= times[0]:
            sampled = values[0 * stride + cubic_offset]
        elif t >= times[-1]:
            sampled = values[(len(times) - 1) * stride + cubic_offset]
        else:
            k = 0
            while k + 1 < len(times) and times[k + 1] < t:
                k += 1
            t0 = times[k]
            t1 = times[k + 1]
            u = (t - t0) / (t1 - t0) if t1 > t0 else 0.0
            v0 = values[k * stride + cubic_offset]
            v1 = values[(k + 1) * stride + cubic_offset]
            if interpolation == "STEP":
                sampled = v0
            elif target.get("path") == "rotation":
                sampled = quat_slerp(v0, v1, u)
            else:
                sampled = [v0[i] + (v1[i] - v0[i]) * u for i in range(len(v0))]
        nodes = gltf.get("nodes") or []
        node_index = target.get("node")
        node = nodes[node_index] if 0 <= node_index < len(nodes) else None
        if node is None:
            continue
        path = target.get("path")
        if path == "weights":
            node["weights"] = sampled
        else:
            node[path] = sampled
        if on_channel_write:
            on_channel_write(f"/nodes/{node_index}/{path}", sampled)
        wrote_any = True
    return {"t": t, "wroteAny": wrote_any}
