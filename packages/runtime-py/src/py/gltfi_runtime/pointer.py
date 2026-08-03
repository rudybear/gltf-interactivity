# JSON Pointer Template resolver for compiled rt.ptr_get/rt.ptr_set calls.
# Transcribed from packages/runtime-lib/src/pointer.ts: plain property/array
# traversal, TRS defaults, node matrix/globalMatrix (get + set), morph-target
# weights (get + set), ref-typed sibling-collection reads, and the
# KHR_interactivity host-fed/runtime virtual pointers. 0-based throughout —
# glTF JSON documents decode to native Python dicts/lists via the stdlib
# `json` module, so there's no array-index-base conversion needed anywhere in
# this file (unlike the Lua backend's pointer.lua, which needs "+1" nearly
# everywhere it touches a decoded-JSON array).
import math
import re

from .kmath import mat4_compose, mat4_mul

_TILDE1 = re.compile("~1")
_TILDE0 = re.compile("~0")


def _decode_token(token: str) -> str:
    return token.replace("~1", "/").replace("~0", "~")


def _compute_local_matrix(node) -> list:
    if isinstance(node, dict) and isinstance(node.get("matrix"), list) and len(node["matrix"]) == 16:
        return [float(x) for x in node["matrix"]]
    t = [0.0, 0.0, 0.0]
    r = [0.0, 0.0, 0.0, 1.0]
    s = [1.0, 1.0, 1.0]
    if isinstance(node, dict):
        if isinstance(node.get("translation"), list):
            t = node["translation"]
        if isinstance(node.get("rotation"), list):
            r = node["rotation"]
        if isinstance(node.get("scale"), list):
            s = node["scale"]
    return mat4_compose(t, r, s)


def _find_parent(gltf, node_index: int) -> int:
    nodes = (gltf or {}).get("nodes") or []
    for i, node in enumerate(nodes):
        children = node.get("children") if isinstance(node, dict) else None
        if isinstance(children, list) and node_index in children:
            return i
    return -1


def _compute_global_matrix(gltf, node_index: int, cache: dict) -> list:
    cached = cache.get(node_index)
    if cached is not None:
        return cached
    nodes = (gltf or {}).get("nodes") or []
    local = _compute_local_matrix(nodes[node_index] if 0 <= node_index < len(nodes) else None)
    parent = _find_parent(gltf, node_index)
    global_ = mat4_mul(_compute_global_matrix(gltf, parent, cache), local) if parent >= 0 else local
    cache[node_index] = global_
    return global_


def _get_mesh_target_count(mesh) -> int:
    primitives = mesh.get("primitives") if isinstance(mesh, dict) else None
    if not isinstance(primitives, list) or len(primitives) == 0:
        return 0
    targets = primitives[0].get("targets") if isinstance(primitives[0], dict) else None
    return len(targets) if isinstance(targets, list) else 0


def _find_mesh_node_index(gltf, start_index: int):
    nodes = (gltf or {}).get("nodes")
    if not isinstance(nodes, list) or start_index < 0 or start_index >= len(nodes):
        return None
    visited = set()
    queue = [start_index]
    qi = 0
    while qi < len(queue):
        index = queue[qi]
        qi += 1
        if index is not None and index not in visited:
            visited.add(index)
            node = nodes[index] if 0 <= index < len(nodes) else None
            if isinstance(node, dict) and isinstance(node.get("mesh"), (int, float)) and not isinstance(node.get("mesh"), bool):
                return index
            children = node.get("children") if isinstance(node, dict) else None
            if isinstance(children, list):
                for c in children:
                    if isinstance(c, (int, float)) and not isinstance(c, bool):
                        queue.append(int(c))
    return None


# A pointer addressing a property whose value is an index into a sibling
# top-level collection resolves (when read with type "ref") to a reference to
# that collection element.
_REF_COLLECTIONS = {
    "mesh": "meshes", "camera": "cameras", "skin": "skins", "material": "materials",
    "scene": "scenes", "node": "nodes", "children": "nodes", "parent": "nodes",
    "nodes": "nodes", "joints": "nodes", "skeleton": "nodes", "animations": "animations",
    "meshes": "meshes", "cameras": "cameras", "skins": "skins", "materials": "materials",
    "scenes": "scenes", "lights": "lights",
}


def _resolve_pointer_ref(gltf, resolved: str) -> dict:
    tokens = [_decode_token(t) for t in resolved.split("/") if t != ""]
    if len(tokens) == 0:
        return {"value": "", "isValid": False}
    last = tokens[-1]
    is_index = last.isdigit()
    prop_token = tokens[-2] if is_index else last
    collection = _REF_COLLECTIONS.get(prop_token)
    if not collection:
        return {"value": "", "isValid": False}
    parent_tokens = tokens[: -2 if is_index else -1]
    current = gltf
    for token in parent_tokens:
        if current is None:
            return {"value": "", "isValid": False}
        # Mirrors the TS oracle's naive `current[token]`, which works
        # uniformly for both JS objects AND arrays (a numeric-string key
        # indexes an array exactly like a real index). A Python dict has no
        # such dual behavior — `current.get(token)` only ever works for
        # dicts, so a parent segment that is itself a glTF array index
        # (e.g. the "0" in "/meshes/0/primitives/0/material", stepping into
        # the top-level `meshes` LIST) needs an explicit list-indexing branch
        # or it silently resolves to None here, breaking every ref pointer
        # nested more than one property level deep.
        if isinstance(current, list):
            idx = int(token) if token.lstrip("-").isdigit() else None
            current = current[idx] if idx is not None and 0 <= idx < len(current) else None
        elif isinstance(current, dict):
            current = current.get(token)
        else:
            current = None
    if current is None:
        return {"value": "", "isValid": False}
    if is_index:
        sub = current.get(prop_token) if isinstance(current, dict) else None
        raw = sub[int(last)] if isinstance(sub, list) and 0 <= int(last) < len(sub) else None
    else:
        raw = current.get(prop_token) if isinstance(current, dict) else None
    if is_index and raw is not None and isinstance(raw, (dict, list)):
        return {"value": "/" + "/".join(tokens), "isValid": True}
    if not isinstance(raw, (int, float)) or isinstance(raw, bool):
        return {"value": "", "isValid": True}
    return {"value": f"/{collection}/{int(math.floor(raw))}", "isValid": True}


def _resolve_weights_length(gltf, node_index, mesh_index) -> dict:
    if node_index is not None:
        mesh_node_index = _find_mesh_node_index(gltf, node_index)
        nodes = (gltf or {}).get("nodes") or []
        mesh_node = nodes[mesh_node_index] if mesh_node_index is not None else None
        meshes = (gltf or {}).get("meshes") or []
        mesh = None
        if isinstance(mesh_node, dict) and isinstance(mesh_node.get("mesh"), (int, float)) and not isinstance(mesh_node.get("mesh"), bool):
            mi = int(mesh_node["mesh"])
            mesh = meshes[mi] if 0 <= mi < len(meshes) else None
        if not mesh:
            return {"value": 0, "isValid": False}
        target_count = _get_mesh_target_count(mesh)
        if isinstance(mesh_node.get("weights"), list):
            return {"value": len(mesh_node["weights"]), "isValid": True}
        if isinstance(mesh.get("weights"), list):
            return {"value": len(mesh["weights"]), "isValid": True}
        return {"value": target_count, "isValid": True}
    if mesh_index is not None:
        meshes = (gltf or {}).get("meshes") or []
        mesh = meshes[mesh_index] if 0 <= mesh_index < len(meshes) else None
        if not mesh:
            return {"value": 0, "isValid": False}
        target_count = _get_mesh_target_count(mesh)
        if isinstance(mesh.get("weights"), list):
            return {"value": len(mesh["weights"]), "isValid": True}
        return {"value": target_count, "isValid": True}
    return {"value": 0, "isValid": False}


def _is_number(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _resolve_pointer_value(gltf, resolved: str) -> dict:
    tokens = [_decode_token(t) for t in resolved.split("/") if t != ""]
    current = gltf
    node_index = None
    mesh_index = None
    nodes_top = (gltf or {}).get("nodes") if isinstance(gltf, dict) else None
    meshes_top = (gltf or {}).get("meshes") if isinstance(gltf, dict) else None
    for i, token in enumerate(tokens):
        if current is None:
            return {"value": None, "isValid": False}
        if token.endswith(".length"):
            base = token[: -len(".length")]
            if base == "weights":
                return _resolve_weights_length(gltf, node_index, mesh_index)
            if not isinstance(current, dict) or base not in current:
                return {"value": 0, "isValid": False}
            next_ = current[base]
            is_arr = isinstance(next_, list)
            return {"value": len(next_) if is_arr else 0, "isValid": is_arr}
        if (token == "matrix" or token == "globalMatrix") and node_index is not None:
            if token == "matrix":
                return {"value": _compute_local_matrix(nodes_top[node_index] if nodes_top else None), "isValid": True}
            return {"value": _compute_global_matrix(gltf, node_index, {}), "isValid": True}
        if token == "[]":
            return {"value": None, "isValid": False}

        if node_index is not None and nodes_top is not None and current is nodes_top[node_index] and (not isinstance(current, dict) or token not in current):
            if token == "translation":
                return {"value": [0.0, 0.0, 0.0], "isValid": True}
            if token == "rotation":
                return {"value": [0.0, 0.0, 0.0, 1.0], "isValid": True}
            if token == "scale":
                return {"value": [1.0, 1.0, 1.0], "isValid": True}

        weights_handled = False
        if token == "weights":
            next_token = tokens[i + 1] if i + 1 < len(tokens) else None
            has_index = next_token is not None and next_token.lstrip("-").isdigit()
            if not has_index:
                return {"value": None, "isValid": False}
            if node_index is not None:
                mesh_node_index = _find_mesh_node_index(gltf, node_index)
                mesh_node = nodes_top[mesh_node_index] if mesh_node_index is not None else None
                mesh = None
                if isinstance(mesh_node, dict) and _is_number(mesh_node.get("mesh")):
                    mi = int(mesh_node["mesh"])
                    mesh = meshes_top[mi] if meshes_top and 0 <= mi < len(meshes_top) else None
                if not mesh:
                    return {"value": None, "isValid": False}
                target_count = _get_mesh_target_count(mesh)
                if isinstance(mesh_node.get("weights"), list):
                    current = mesh_node["weights"]
                    weights_handled = True
                elif isinstance(mesh.get("weights"), list):
                    current = mesh["weights"]
                    weights_handled = True
                elif target_count > 0:
                    current = [0.5] * target_count
                    weights_handled = True
                else:
                    return {"value": None, "isValid": False}
            elif mesh_index is not None:
                mesh = meshes_top[mesh_index] if meshes_top and 0 <= mesh_index < len(meshes_top) else None
                if not mesh:
                    return {"value": None, "isValid": False}
                target_count = _get_mesh_target_count(mesh)
                if isinstance(mesh.get("weights"), list):
                    current = mesh["weights"]
                    weights_handled = True
                elif target_count > 0:
                    current = [0.5] * target_count
                    weights_handled = True
                else:
                    current = [0.0]
                    weights_handled = True

        if not weights_handled:
            if token.lstrip("-").isdigit() and isinstance(current, list):
                index = int(token)
                if index < 0 or index >= len(current):
                    return {"value": None, "isValid": False}
                next_ = current[index]
                if next_ is not None:
                    if nodes_top is not None and 0 <= index < len(nodes_top) and next_ is nodes_top[index]:
                        node_index = index
                    if meshes_top is not None and 0 <= index < len(meshes_top) and next_ is meshes_top[index]:
                        mesh_index = index
                current = next_
            else:
                current = current.get(token) if isinstance(current, dict) else None
    return {"value": current, "isValid": current is not None}


def _set_pointer_value(gltf, resolved: str, value) -> bool:
    tokens = [_decode_token(t) for t in resolved.split("/") if t != ""]
    current = gltf
    parent = None
    parent_key = None
    node_index = None
    mesh_index = None
    nodes_top = (gltf or {}).get("nodes") if isinstance(gltf, dict) else None
    meshes_top = (gltf or {}).get("meshes") if isinstance(gltf, dict) else None
    for i, token in enumerate(tokens):
        is_last = i == len(tokens) - 1
        if token.endswith(".length") or token == "globalMatrix":
            return False
        if token == "matrix" and is_last and node_index is not None:
            gltf["nodes"][node_index]["matrix"] = value
            return True
        next_token = tokens[i + 1] if i + 1 < len(tokens) else None
        next_is_index = next_token is not None and next_token.lstrip("-").isdigit()

        if token == "weights":
            if not next_is_index:
                return False
            if node_index is not None:
                mesh_node_index = _find_mesh_node_index(gltf, node_index)
                mesh_node = nodes_top[mesh_node_index] if mesh_node_index is not None else None
                mesh = None
                if isinstance(mesh_node, dict) and _is_number(mesh_node.get("mesh")):
                    mi = int(mesh_node["mesh"])
                    mesh = meshes_top[mi] if meshes_top and 0 <= mi < len(meshes_top) else None
                if not mesh:
                    return False
                target_count = _get_mesh_target_count(mesh)
                if target_count == 0:
                    return False
                if not isinstance(mesh_node.get("weights"), list):
                    mesh_node["weights"] = list(mesh["weights"]) if isinstance(mesh.get("weights"), list) else [0.5] * target_count
                next_weights = []
                for k in range(target_count):
                    item = mesh_node["weights"][k] if k < len(mesh_node["weights"]) else None
                    num = item if _is_number(item) else None
                    next_weights.append(float(num) if num is not None and num == num and not math.isinf(num) else 0.0)
                mesh_node["weights"] = next_weights
                current = mesh_node["weights"]
            elif mesh_index is not None:
                mesh = meshes_top[mesh_index] if meshes_top and 0 <= mesh_index < len(meshes_top) else None
                if not mesh:
                    return False
                target_count = _get_mesh_target_count(mesh)
                if target_count == 0:
                    return False
                if not isinstance(mesh.get("weights"), list):
                    mesh["weights"] = [0.5] * target_count
                next_weights = []
                for k in range(target_count):
                    item = mesh["weights"][k] if k < len(mesh["weights"]) else None
                    num = item if _is_number(item) else None
                    next_weights.append(float(num) if num is not None and num == num and not math.isinf(num) else 0.0)
                mesh["weights"] = next_weights
                current = mesh["weights"]
            else:
                return False
        else:
            if token.lstrip("-").isdigit():
                index = int(token)
                if not isinstance(current, list):
                    next_ = []
                    if parent is not None and parent_key is not None:
                        parent[parent_key] = next_
                    current = next_
                if is_last:
                    while len(current) <= index:
                        current.append(None)
                    current[index] = value
                else:
                    while len(current) <= index:
                        current.append(None)
                    if current[index] is None:
                        current[index] = {}
                    parent = current
                    parent_key = index
                    current = current[index]
                    if nodes_top is not None and 0 <= index < len(nodes_top) and current is nodes_top[index]:
                        node_index = index
                    if meshes_top is not None and 0 <= index < len(meshes_top) and current is meshes_top[index]:
                        mesh_index = index
            else:
                if not isinstance(current, dict):
                    next_ = {}
                    if parent is not None and parent_key is not None:
                        parent[parent_key] = next_
                    current = next_
                if is_last:
                    current[token] = value
                else:
                    if current.get(token) is None:
                        current[token] = [] if next_is_index else {}
                    parent = current
                    parent_key = token
                    current = current[token]
    return True


# JS-like Number-to-String conversion for an int-kind pointer template
# param's substituted value. NOT plain `str(v)`: an int-typed value that
# happens to arrive as a Python FLOAT holding a whole number (e.g. `0.0`)
# stringifies with a trailing ".0" (`str(0.0) == "0.0"`), which then fails
# every downstream digit-only pointer-token check in this file and silently
# breaks the whole pointer resolution — the exact same failure mode the Lua
# backend's pointer.lua documents needing `string.format("%.0f", v)` for
# (there: Lua's forced-float-literal numeral convention triggers it; here:
# Python's int/float distinction can independently produce a bare float
# wherever a value happens to flow through one before reaching a pointer
# call — e.g. hand-authored diagnostic/test code, or any future emitter path
# that doesn't preserve the int/float distinction as strictly as emit-py's
# constLiteral currently does). JS's `String(0.0) === "0"` has no such
# footgun (JS has only one numeric type), which is why the TS oracle this
# mirrors gets away with a plain `String(v)`.
def _js_like_str(v) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float):
        if v != v:
            return "NaN"
        if v == math.inf:
            return "Infinity"
        if v == -math.inf:
            return "-Infinity"
        if v == int(v) and abs(v) < 1e16:
            return str(int(v))
        return repr(v)
    return str(v)


# Substitutes evaluated template parameters into a "/nodes/[nodeIndex]/mesh"
# -style pointer template. Returns None on failure.
def _build_effective_pointer(pointer: str, args: dict):
    out = []
    for segment in pointer.split("/"):
        if segment.startswith("[") and segment.endswith("]") and len(segment) > 2:
            key = segment[1:-1]
            v = args.get(key, 0)
            out.append(_js_like_str(v) if v is not None else "0")
            continue
        if segment.startswith("{") and segment.endswith("}") and len(segment) > 2:
            key = segment[1:-1]
            raw = args.get(key)
            ref = "" if raw is None else str(raw)
            if not ref:
                return None
            if ref.startswith("delay:") or ref.startswith("event:"):
                out.append(ref)
                continue
            slash = ref.rfind("/")
            if slash < 0:
                return None
            prefix = ref[:slash]
            idx = ref[slash + 1:]
            if "/".join(out) != prefix or not idx.isdigit():
                return None
            out.append(idx)
            continue
        out.append(segment)
    return "/".join(out)


def _extract_pointer_params(pointer: str) -> list:
    params = []
    for segment in pointer.split("/"):
        if segment.startswith("[") and segment.endswith("]") and len(segment) > 2:
            params.append({"name": segment[1:-1], "kind": "int"})
        elif segment.startswith("{") and segment.endswith("}") and len(segment) > 2:
            params.append({"name": segment[1:-1], "kind": "ref"})
    return params


_VALUE_TYPE_LENGTHS = {"float2": 2, "float3": 3, "float4": 4, "float2x2": 4, "float3x3": 9, "float4x4": 16}


def _value_matches_type(value, t: str) -> bool:
    if t == "bool":
        return isinstance(value, bool)
    if t == "int":
        return _is_number(value) and value == value and not math.isinf(value) and math.floor(value) == value
    if t == "float":
        return _is_number(value) and value == value and not math.isinf(value)
    expected = _VALUE_TYPE_LENGTHS.get(t)
    if expected is not None:
        if not isinstance(value, list) or len(value) != expected:
            return False
        return all(_is_number(v) and v == v and not math.isinf(v) for v in value)
    return False


def _default_raw(t: str):
    return {
        "bool": False, "int": 0, "float": 0,
        "float2": [0.0, 0.0], "float3": [0.0, 0.0, 0.0], "float4": [0.0, 0.0, 0.0, 0.0],
        "float2x2": [1.0, 0.0, 0.0, 1.0],
        "float3x3": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0],
        "float4x4": [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
        "ref": "",
    }.get(t)


# Extensions this runtime implements; used by the asset/extensions/{name}/
# enabled capability pointer (KHR_interactivity §4.2.1).
_SUPPORTED_EXTENSIONS = {
    "KHR_interactivity", "KHR_node_visibility", "KHR_node_selectability",
    "KHR_node_hoverability", "KHR_animation_pointer", "KHR_lights_punctual",
}

# Runtime limits reported through /extensions/KHR_interactivity/limits/* (§4.2.2).
_RUNTIME_LIMITS = {
    "maxActiveAnimations": 32, "maxActiveDelays": 64,
    "maxActivePropertyInterpolations": 64, "maxActiveVariableInterpolations": 64,
}

_ANIM_PROPS = {"isPlaying", "minTime", "maxTime", "playhead", "virtualPlayhead"}

_EXT_ENABLED_RE = re.compile(r"^/extensions/KHR_interactivity/asset/extensions/([^/]+)/enabled$")
_LIMIT_RE = re.compile(r"^/extensions/KHR_interactivity/limits/([^/]+)$")
_ANIM_RE = re.compile(r"^/animations/(\d+)/extensions/KHR_interactivity/(.+)$")


def _resolve_virtual_pointer(host, resolved: str, t: str):
    if resolved == "/extensions/KHR_interactivity/activeCamera/position":
        if t != "float3":
            return {"value": _default_raw(t), "isValid": False}
        return {"value": host.get("activeCameraPosition") or [float("nan")] * 3, "isValid": True}
    if resolved == "/extensions/KHR_interactivity/activeCamera/rotation":
        if t != "float4":
            return {"value": _default_raw(t), "isValid": False}
        return {"value": host.get("activeCameraRotation") or [float("nan")] * 4, "isValid": True}
    if resolved in ("/extensions/KHR_interactivity/asset/majorVersion", "/extensions/KHR_interactivity/asset/minorVersion"):
        if t != "int":
            return {"value": _default_raw(t), "isValid": False}
        return {"value": 2 if resolved.endswith("majorVersion") else 0, "isValid": True}
    m = _EXT_ENABLED_RE.match(resolved)
    if m:
        if t != "bool":
            return {"value": _default_raw(t), "isValid": False}
        name = m.group(1)
        used = (host.get("gltf") or {}).get("extensionsUsed")
        is_used = isinstance(used, list) and name in used
        enabled = bool(name in _SUPPORTED_EXTENSIONS and (name == "KHR_interactivity" or is_used))
        return {"value": enabled, "isValid": True}
    m = _LIMIT_RE.match(resolved)
    if m:
        limit = _RUNTIME_LIMITS.get(m.group(1))
        if limit is None or t != "int":
            return {"value": _default_raw(t), "isValid": False}
        return {"value": limit, "isValid": True}
    m = _ANIM_RE.match(resolved)
    if m and m.group(2) in _ANIM_PROPS:
        index = int(m.group(1))
        prop = m.group(2)
        animations = (host.get("gltf") or {}).get("animations") or []
        animation = animations[index] if 0 <= index < len(animations) else None
        if not animation:
            return {"value": _default_raw(t), "isValid": False}
        if prop == "isPlaying":
            if t != "bool":
                return {"value": _default_raw(t), "isValid": False}
            return {"value": host["isAnimationPlaying"](index), "isValid": True}
        if t != "float":
            return {"value": _default_raw(t), "isValid": False}
        if prop in ("minTime", "maxTime"):
            from .animation import get_animation_time_range

            min_v, max_v = get_animation_time_range({"gltf": host.get("gltf")}, index)
            return {"value": min_v if prop == "minTime" else max_v, "isValid": True}
        state = host["getAnimationPlayhead"](index)
        return {"value": state["playhead"] if prop == "playhead" else state["virtualPlayhead"], "isValid": True}
    return None


def ptr_get(host: dict, pointer: str, args: dict, t: str) -> dict:
    if not host.get("gltf"):
        return {"value": _default_raw(t), "isValid": False}
    params = _extract_pointer_params(pointer)
    for p in params:
        if p["kind"] == "int":
            raw = args.get(p["name"])
            num = raw if _is_number(raw) else None
            if num is None or num != num or math.isinf(num) or num < 0:
                return {"value": _default_raw(t), "isValid": False}
    # Runtime reference validation pointers resolve against runtime state, not
    # the glTF asset (KHR_interactivity Delay/Event References).
    if re.match(r"^/extensions/KHR_interactivity/delays/\{[^}]+\}$", pointer):
        ref = str(next(iter(args.values()), "")) if args else ""
        if t == "ref" and host["isDelayActive"](ref):
            return {"value": ref, "isValid": True}
        return {"value": _default_raw(t), "isValid": False}
    if re.match(r"^/extensions/KHR_interactivity/events/\{[^}]+\}$", pointer):
        ref = str(next(iter(args.values()), "")) if args else ""
        if t == "ref" and ref.startswith("event:"):
            return {"value": ref, "isValid": True}
        return {"value": _default_raw(t), "isValid": False}
    resolved = _build_effective_pointer(pointer, args)
    if resolved is None:
        return {"value": _default_raw(t), "isValid": False}
    virtual = _resolve_virtual_pointer(host, resolved, t)
    if virtual is not None:
        return virtual
    if t == "ref":
        return _resolve_pointer_ref(host.get("gltf"), resolved)
    result = _resolve_pointer_value(host.get("gltf"), resolved)
    if not result["isValid"] or not _value_matches_type(result["value"], t):
        return {"value": _default_raw(t), "isValid": False}
    return {"value": result["value"], "isValid": True}


def ptr_set(host: dict, pointer: str, args: dict, t: str, value) -> bool:
    if not host.get("gltf"):
        return False
    if not _value_matches_type(value, t):
        return False
    params = _extract_pointer_params(pointer)
    for p in params:
        if p["kind"] == "int":
            raw = args.get(p["name"])
            num = raw if _is_number(raw) else None
            if num is None or num != num or math.isinf(num) or num < 0:
                return False
        else:
            s = args.get(p["name"])
            if not s:
                return False
    resolved = _build_effective_pointer(pointer, args)
    if resolved is None:
        return False
    ok = _set_pointer_value(host["gltf"], resolved, value)
    if ok and host.get("onPointerSet"):
        host["onPointerSet"](resolved, value)
    return ok


# Writes an already-resolved (no template substitution needed) pointer path
# straight into the document — used by the scheduler's setPointer effect.
def write_pointer_raw(gltf, resolved_pointer: str, value) -> bool:
    return _set_pointer_value(gltf, resolved_pointer, value)


# Resolves + validates a pointer/interpolate target exactly like
# interpreter.ts's handlePointerInterpolate. Returns None on failure.
def ptr_interp_prepare(host: dict, pointer: str, args: dict, t: str):
    if not host.get("gltf"):
        return None
    params = _extract_pointer_params(pointer)
    for p in params:
        if p["kind"] == "int":
            raw = args.get(p["name"])
            num = raw if _is_number(raw) else None
            if num is None or num != num or math.isinf(num) or num < 0:
                return None
        else:
            s = args.get(p["name"])
            if not s:
                return None
    resolved = _build_effective_pointer(pointer, args)
    if resolved is None:
        return None
    result = _resolve_pointer_value(host.get("gltf"), resolved)
    if not result["isValid"] or not _value_matches_type(result["value"], t):
        return None
    value = result["value"]
    start_value = [float(x) for x in value] if isinstance(value, list) else [float(value)]
    return {"resolved": resolved, "startValue": start_value}
