# Animation sampling helpers, transcribed from packages/kernel/src/
# animation.ts. `host` is a dict `{"gltf": <decoded JSON>, "glbBin": <bytes or
# None>}`. All glTF-JSON indices (accessor/animation/node index, ...) are
# 0-based, matching both the glTF spec's own convention and Python's native
# list indexing — no index-base conversion needed anywhere in this file
# (unlike the Lua backend's animation.lua, which needs a "+1" at nearly every
# line touching a decoded-JSON array).
import math
import struct

from .kmath import quat_normalize, quat_slerp

_ACCESSOR_COMPONENT_COUNTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


def _finite(x: float) -> bool:
    return x == x and not math.isinf(x)


_COMPONENT_BYTES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
_COMPONENT_FMT = {5120: "<b", 5121: "<B", 5122: "<h", 5123: "<H", 5125: "<I", 5126: "<f"}
_F32 = struct.Struct("<f")


def _f32(x: float) -> float:
    # Round a double to float32 (the TS side stores decoded data in a
    # Float32Array). Overflow to +-inf like JS instead of raising.
    try:
        return _F32.unpack(_F32.pack(x))[0]
    except OverflowError:
        return math.inf if x > 0 else -math.inf


def _read_component(bin_, offset: int, component_type: int, normalized: bool) -> float:
    c = struct.unpack_from(_COMPONENT_FMT[component_type], bin_, offset)[0]
    if component_type == 5126 or not normalized:
        return c
    if component_type == 5120:
        return max(c / 127, -1)
    if component_type == 5121:
        return c / 255
    if component_type == 5122:
        return max(c / 32767, -1)
    if component_type == 5123:
        return c / 65535
    return c / 4294967295


def _list_get(lst, i):
    if isinstance(lst, list) and isinstance(i, int) and not isinstance(i, bool) and 0 <= i < len(lst):
        return lst[i]
    return None


# Decodes an accessor per glTF 2.0 section 3.6.2 (mirror of kernel
# decodeAccessor): all six component types, `normalized`, bufferView
# byteStride, accessor+bufferView byteOffset, sparse substitution and a
# missing bufferView (zeros). Returns {"data": [float32-rounded flat list],
# "count": n, "comps": c} or None when undecodable.
def decode_accessor(host: dict, accessor_index: int):
    gltf = host.get("gltf")
    bin_ = host.get("glbBin")
    accessor = _list_get(gltf.get("accessors") if gltf else None, accessor_index)
    if not accessor or bin_ is None:
        return None
    comps = _ACCESSOR_COMPONENT_COUNTS.get(accessor.get("type"))
    comp_type = accessor.get("componentType")
    comp_bytes = _COMPONENT_BYTES.get(comp_type)
    count = accessor.get("count")
    if not comps or not comp_bytes or not isinstance(count, int) or isinstance(count, bool) or count < 0:
        return None
    normalized = accessor.get("normalized") is True
    blen = len(bin_)
    data = [0.0] * (count * comps)
    if accessor.get("bufferView") is not None:
        view = _list_get(gltf.get("bufferViews"), accessor.get("bufferView"))
        if not view:
            return None
        element_bytes = comps * comp_bytes
        stride = view.get("byteStride")
        if stride is None:
            stride = element_bytes
        base = (view.get("byteOffset") or 0) + (accessor.get("byteOffset") or 0)
        if count > 0 and base + (count - 1) * stride + element_bytes > blen:
            return None
        for i in range(count):
            at = base + i * stride
            for j in range(comps):
                data[i * comps + j] = _f32(_read_component(bin_, at + j * comp_bytes, comp_type, normalized))
    sparse = accessor.get("sparse")
    if sparse:
        n = sparse.get("count")
        indices = sparse.get("indices") or {}
        values = sparse.get("values") or {}
        idx_type = indices.get("componentType")
        idx_bytes = _COMPONENT_BYTES[idx_type] if idx_type in (5121, 5123, 5125) else 0
        idx_view = _list_get(gltf.get("bufferViews"), indices.get("bufferView"))
        val_view = _list_get(gltf.get("bufferViews"), values.get("bufferView"))
        if not isinstance(n, int) or isinstance(n, bool) or n < 0 or not idx_bytes or not idx_view or not val_view:
            return None
        idx_base = (idx_view.get("byteOffset") or 0) + (indices.get("byteOffset") or 0)
        val_base = (val_view.get("byteOffset") or 0) + (values.get("byteOffset") or 0)
        if idx_base + n * idx_bytes > blen or val_base + n * comps * comp_bytes > blen:
            return None
        for s in range(n):
            target = _read_component(bin_, idx_base + s * idx_bytes, idx_type, False)
            if target >= count:
                return None
            for j in range(comps):
                data[target * comps + j] = _f32(
                    _read_component(bin_, val_base + (s * comps + j) * comp_bytes, comp_type, normalized)
                )
    return {"data": data, "count": count, "comps": comps}


# Compat wrapper: list of per-element float lists, or None.
def read_accessor_elements(host: dict, accessor_index: int):
    d = decode_accessor(host, accessor_index)
    if d is None:
        return None
    c = d["comps"]
    return [d["data"][i * c:(i + 1) * c] for i in range(d["count"])]


# ---------------------------------------------------------------------------
# Per-document cache (mirror of kernel's WeakMap). Python dicts cannot be
# weakly referenced, so a small id()-keyed table holds a strong reference to
# the gltf (making id reuse impossible while the entry lives) and evicts the
# oldest entries beyond _MAX_CACHED_DOCS. An entry is rebuilt when the binary
# chunk or the accessors/animations/bufferViews list identities differ.
_MAX_CACHED_DOCS = 8
_doc_caches: dict = {}


def _get_doc_cache(host: dict):
    gltf = host.get("gltf")
    if not isinstance(gltf, dict):
        return None
    key = id(gltf)
    cache = _doc_caches.get(key)
    bin_ = host.get("glbBin")
    if (
        cache is None
        or cache["gltf"] is not gltf
        or cache["bin"] is not bin_
        or cache["accessors"] is not gltf.get("accessors")
        or cache["animations"] is not gltf.get("animations")
        or cache["bufferViews"] is not gltf.get("bufferViews")
    ):
        cache = {
            "gltf": gltf,
            "bin": bin_,
            "accessors": gltf.get("accessors"),
            "animations": gltf.get("animations"),
            "bufferViews": gltf.get("bufferViews"),
            "decoded": {},
            "plans": {},
            "decodes": cache["decodes"] if cache else 0,
            "hits": cache["hits"] if cache else 0,
        }
        _doc_caches.pop(key, None)
        _doc_caches[key] = cache
        while len(_doc_caches) > _MAX_CACHED_DOCS:
            _doc_caches.pop(next(iter(_doc_caches)))
    return cache


def invalidate_animation_cache(gltf) -> None:
    _doc_caches.pop(id(gltf), None)


def get_animation_cache_stats(host: dict) -> dict:
    cache = _get_doc_cache(host)
    return {"decodes": cache["decodes"] if cache else 0, "hits": cache["hits"] if cache else 0}


def _cached_accessor(host: dict, cache: dict, index):
    if index in cache["decoded"]:
        cache["hits"] += 1
        return cache["decoded"][index]
    cache["decodes"] += 1
    decoded = decode_accessor(host, index)
    cache["decoded"][index] = decoded
    return decoded


def _build_channel_plan(host: dict, cache: dict, animation: dict, channel: dict):
    sampler = _list_get(animation.get("samplers"), channel.get("sampler"))
    target = channel["target"]
    if not isinstance(target.get("path"), str):
        return None
    inp = _cached_accessor(host, cache, sampler.get("input"))
    out = _cached_accessor(host, cache, sampler.get("output"))
    if not inp or not out or inp["count"] == 0 or inp["comps"] != 1:
        return None
    interpolation = sampler.get("interpolation") or "LINEAR"
    cubic = interpolation == "CUBICSPLINE"
    value_count = inp["count"] * (3 if cubic else 1)
    n = len(out["data"])
    if n == 0 or n % value_count != 0:
        return None
    return {
        "times": inp["data"],
        "values": out["data"],
        "width": n // value_count,
        "cubic": cubic,
        "step": interpolation == "STEP",
        "path": target["path"],
        "node": target["node"],
        "pointer": f"/nodes/{target['node']}/{target['path']}",
        "lastKey": 0,
    }


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


def _get_animation_plan(host: dict, cache: dict, animation_index: int, animation: dict):
    plan = cache["plans"].get(animation_index)
    if plan is not None:
        return plan
    _, max_ = get_animation_time_range(host, animation_index)
    plan = {"maxTime": max_ if _finite(max_) else 0.0, "channels": [], "skipped": 0}
    for channel in animation.get("channels") or []:
        sampler = _list_get(animation.get("samplers"), channel.get("sampler"))
        target = channel.get("target")
        if not sampler or not target or target.get("node") is None:
            continue
        cp = _build_channel_plan(host, cache, animation, channel)
        if cp:
            plan["channels"].append(cp)
        else:
            plan["skipped"] += 1
    cache["plans"][animation_index] = plan
    return plan


# Finds k with times[k] <= t < times[k+1]; last-key fast path then binary search.
def _find_key(plan: dict, t: float) -> int:
    times = plan["times"]
    n = len(times)
    last = plan["lastKey"]
    if last + 1 < n and times[last] <= t < times[last + 1]:
        return last
    if last + 2 < n and times[last + 1] <= t < times[last + 2]:
        plan["lastKey"] = last + 1
        return last + 1
    lo = 0
    hi = n - 1
    while hi - lo > 1:
        mid = (lo + hi) >> 1
        if times[mid] <= t:
            lo = mid
        else:
            hi = mid
    plan["lastKey"] = lo
    return lo


def _read_value(plan: dict, slot: int) -> list:
    w = plan["width"]
    base = slot * w
    return plan["values"][base:base + w]


def _sample_channel(plan: dict, t: float) -> list:
    times = plan["times"]
    n = len(times)
    cubic = plan["cubic"]
    if n == 1 or t <= times[0]:
        return _read_value(plan, 1 if cubic else 0)
    if t >= times[n - 1]:
        return _read_value(plan, (n - 1) * 3 + 1 if cubic else n - 1)
    k = _find_key(plan, t)
    t0 = times[k]
    dt = times[k + 1] - t0
    u = (t - t0) / dt if dt > 0 else 0.0
    if plan["step"]:
        return _read_value(plan, k * 3 + 1 if cubic else k)
    values = plan["values"]
    w = plan["width"]
    if cubic:
        u2 = u * u
        u3 = u2 * u
        h00 = 2 * u3 - 3 * u2 + 1
        h10 = u3 - 2 * u2 + u
        h01 = -2 * u3 + 3 * u2
        h11 = u3 - u2
        v0 = (k * 3 + 1) * w
        b0 = (k * 3 + 2) * w
        v1 = ((k + 1) * 3 + 1) * w
        a1 = (k + 1) * 3 * w
        out = [
            h00 * values[v0 + j] + h10 * dt * values[b0 + j] + h01 * values[v1 + j] + h11 * dt * values[a1 + j]
            for j in range(w)
        ]
        return quat_normalize(out) if plan["path"] == "rotation" else out
    if plan["path"] == "rotation":
        return quat_slerp(_read_value(plan, k), _read_value(plan, k + 1), u)
    a = k * w
    b = a + w
    return [values[a + j] + (values[b + j] - values[a + j]) * u for j in range(w)]


# Samples animation `animation_index` at virtual-timeline position `requested`
# and writes the channel values into host["gltf"]'s node objects, calling
# `on_channel_write(pointer, value)` per channel. Returns None if the
# animation doesn't exist, else {"t", "wroteAny", "skippedChannels"}.
# Decoding/plan building happens once per document (see the cache above).
def apply_animation_at(host: dict, animation_index: int, requested: float, on_channel_write=None):
    gltf = host.get("gltf")
    animation = _list_get(gltf.get("animations") if gltf else None, animation_index)
    if not animation:
        return None
    cache = _get_doc_cache(host)
    if cache is None:
        return None
    plan = _get_animation_plan(host, cache, animation_index, animation)
    t = effective_animation_time(requested, plan["maxTime"])
    wrote_any = False
    nodes = gltf.get("nodes") or []
    for ch in plan["channels"]:
        node = _list_get(nodes, ch["node"])
        if node is None:
            continue
        sampled = _sample_channel(ch, t)
        node[ch["path"]] = sampled
        if on_channel_write:
            on_channel_write(ch["pointer"], sampled)
        wrote_any = True
    return {"t": t, "wroteAny": wrote_any, "skippedChannels": plan["skipped"]}
