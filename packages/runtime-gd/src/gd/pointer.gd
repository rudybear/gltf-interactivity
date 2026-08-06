# JSON Pointer Template resolver for compiled rt.ptr_get/rt.ptr_set calls.
# Transcribed from packages/runtime-py/src/py/gltfi_runtime/pointer.py (itself
# transcribed from packages/runtime-lib/src/pointer.ts): plain property/array
# traversal, TRS defaults, node matrix/globalMatrix (get + set), morph-target
# weights (get + set), ref-typed sibling-collection reads, and the
# KHR_interactivity host-fed/runtime virtual pointers. 0-based throughout,
# same as pointer.py — glTF JSON documents decode to native GDScript
# Dictionary/Array via JSON.parse_string, so there's no array-index-base
# conversion needed anywhere in this file (unlike the Lua backend's
# pointer.lua, which needs "+1" nearly everywhere it touches a decoded-JSON
# array). GDScript Dictionary/Array stand in for Python's dict/list
# throughout; String for str; null for None.
extends RefCounted

const Kmath = preload("res://kmath.gd")
const AnimMod = preload("res://animation.gd")


static func _decode_token(token: String) -> String:
	return token.replace("~1", "/").replace("~0", "~")


static func _compute_local_matrix(node) -> Array:
	if node is Dictionary and node.get("matrix") is Array and node["matrix"].size() == 16:
		var out := []
		for x in node["matrix"]:
			out.append(float(x))
		return out
	var t = [0.0, 0.0, 0.0]
	var r = [0.0, 0.0, 0.0, 1.0]
	var s = [1.0, 1.0, 1.0]
	if node is Dictionary:
		if node.get("translation") is Array:
			t = node["translation"]
		if node.get("rotation") is Array:
			r = node["rotation"]
		if node.get("scale") is Array:
			s = node["scale"]
	return Kmath.mat4Compose(t, r, s)


static func _find_parent(gltf, node_index: int) -> int:
	var nodes = (gltf if gltf is Dictionary else {}).get("nodes", []) if gltf != null else []
	if not (nodes is Array):
		nodes = []
	for i in range(nodes.size()):
		var node = nodes[i]
		var children = node.get("children") if node is Dictionary else null
		if children is Array:
			# NOT `children.has(node_index)`: GDScript's `Array.has()`/
			# `Dictionary.has()` do STRICT type-and-value matching, not
			# numeric equality — `[4.0].has(4)` is FALSE even though
			# `4.0 == 4` is true (confirmed empirically; this was a real bug
			# caught by the conformance suite's Extras/Matrix_Updates asset:
			# every "children" array here is JSON-sourced, hence ALWAYS
			# floats, while `node_index` is a genuine GDScript int, so
			# `.has()` silently never matched and every multi-level
			# globalMatrix walk silently stopped at the first parent). A
			# manual loop with `==` (which DOES compare int/float
			# numerically) is the correct, general fix.
			for c in children:
				if c == node_index:
					return i
	return -1


static func _compute_global_matrix(gltf, node_index: int, cache: Dictionary) -> Array:
	var cached = cache.get(node_index)
	if cached != null:
		return cached
	var nodes = (gltf if gltf is Dictionary else {}).get("nodes", []) if gltf != null else []
	if not (nodes is Array):
		nodes = []
	var local = _compute_local_matrix(nodes[node_index] if node_index >= 0 and node_index < nodes.size() else null)
	var parent = _find_parent(gltf, node_index)
	var global_matrix = Kmath.mat4Mul(_compute_global_matrix(gltf, parent, cache), local) if parent >= 0 else local
	cache[node_index] = global_matrix
	return global_matrix


static func _get_mesh_target_count(mesh) -> int:
	var primitives = mesh.get("primitives") if mesh is Dictionary else null
	if not (primitives is Array) or primitives.size() == 0:
		return 0
	var targets = primitives[0].get("targets") if primitives[0] is Dictionary else null
	return targets.size() if targets is Array else 0


static func _find_mesh_node_index(gltf, start_index: int):
	var nodes = (gltf if gltf is Dictionary else {}).get("nodes") if gltf != null else null
	if not (nodes is Array) or start_index < 0 or start_index >= nodes.size():
		return null
	var visited := {}
	var queue = [start_index]
	var qi := 0
	while qi < queue.size():
		var index = queue[qi]
		qi += 1
		if index != null and not visited.has(index):
			visited[index] = true
			var node = nodes[index] if index >= 0 and index < nodes.size() else null
			if node is Dictionary and _is_number(node.get("mesh")):
				return index
			var children = node.get("children") if node is Dictionary else null
			if children is Array:
				for c in children:
					if _is_number(c):
						queue.append(int(c))
	return null


# A pointer addressing a property whose value is an index into a sibling
# top-level collection resolves (when read with type "ref") to a reference to
# that collection element.
const _REF_COLLECTIONS := {
	"mesh": "meshes", "camera": "cameras", "skin": "skins", "material": "materials",
	"scene": "scenes", "node": "nodes", "children": "nodes", "parent": "nodes",
	"nodes": "nodes", "joints": "nodes", "skeleton": "nodes", "animations": "animations",
	"meshes": "meshes", "cameras": "cameras", "skins": "skins", "materials": "materials",
	"scenes": "scenes", "lights": "lights",
}


static func _resolve_pointer_ref(gltf, resolved: String) -> Dictionary:
	var tokens := []
	for t in resolved.split("/"):
		if t != "":
			tokens.append(_decode_token(t))
	if tokens.size() == 0:
		return {"value": "", "isValid": false}
	var last = tokens[tokens.size() - 1]
	var is_index = last.is_valid_int() and not last.begins_with("-")
	# Python's `tokens[-2]` raises (crashes) here if is_index is true but
	# tokens has fewer than 2 elements (a single bare-digit pointer, e.g.
	# resolved == "/5" -- not producible by any real KHR_interactivity
	# pointer template, whose segments always carry a real property name
	# before an index). GDScript has no catchable equivalent (an out-of-
	# range Array `[]` read is a fatal SCRIPT ERROR that hangs the headless
	# runtime rather than raising), so this guard fails gracefully instead
	# of hanging for that unreachable-in-practice case.
	if is_index and tokens.size() < 2:
		return {"value": "", "isValid": false}
	var prop_token = tokens[-2] if is_index else last
	if not _REF_COLLECTIONS.has(prop_token):
		return {"value": "", "isValid": false}
	var collection = _REF_COLLECTIONS[prop_token]
	var parent_tokens = tokens.slice(0, -2) if is_index else tokens.slice(0, -1)
	var current = gltf
	for token in parent_tokens:
		if current == null:
			return {"value": "", "isValid": false}
		# Mirrors the TS oracle's naive `current[token]`, which works
		# uniformly for both JS objects AND arrays (a numeric-string key
		# indexes an array exactly like a real index). A GDScript Dictionary
		# has no such dual behavior -- `current.get(token)` only ever works
		# for Dictionaries, so a parent segment that is itself a glTF array
		# index (e.g. the "0" in "/meshes/0/primitives/0/material", stepping
		# into the top-level `meshes` ARRAY) needs an explicit Array-indexing
		# branch or it silently resolves to null here, breaking every ref
		# pointer nested more than one property level deep.
		if current is Array:
			var idx = int(token) if token.is_valid_int() else null
			current = current[idx] if idx != null and idx >= 0 and idx < current.size() else null
		elif current is Dictionary:
			current = current.get(token)
		else:
			current = null
	if current == null:
		return {"value": "", "isValid": false}
	var raw
	if is_index:
		var sub = current.get(prop_token) if current is Dictionary else null
		var last_i := int(last)
		raw = sub[last_i] if sub is Array and last_i >= 0 and last_i < sub.size() else null
	else:
		raw = current.get(prop_token) if current is Dictionary else null
	if is_index and raw != null and (raw is Dictionary or raw is Array):
		return {"value": "/" + "/".join(tokens), "isValid": true}
	if not _is_number(raw):
		return {"value": "", "isValid": true}
	return {"value": "/" + collection + "/" + str(int(floor(raw))), "isValid": true}


static func _resolve_weights_length(gltf, node_index, mesh_index) -> Dictionary:
	if node_index != null:
		var mesh_node_index = _find_mesh_node_index(gltf, node_index)
		var nodes = (gltf if gltf is Dictionary else {}).get("nodes", []) if gltf != null else []
		if not (nodes is Array):
			nodes = []
		var mesh_node = nodes[mesh_node_index] if mesh_node_index != null else null
		var meshes = (gltf if gltf is Dictionary else {}).get("meshes", []) if gltf != null else []
		if not (meshes is Array):
			meshes = []
		var mesh = null
		if mesh_node is Dictionary and _is_number(mesh_node.get("mesh")):
			var mi := int(mesh_node["mesh"])
			mesh = meshes[mi] if mi >= 0 and mi < meshes.size() else null
		if not mesh:
			return {"value": 0, "isValid": false}
		var target_count = _get_mesh_target_count(mesh)
		if mesh_node.get("weights") is Array:
			return {"value": mesh_node["weights"].size(), "isValid": true}
		if mesh.get("weights") is Array:
			return {"value": mesh["weights"].size(), "isValid": true}
		return {"value": target_count, "isValid": true}
	if mesh_index != null:
		var meshes2 = (gltf if gltf is Dictionary else {}).get("meshes", []) if gltf != null else []
		if not (meshes2 is Array):
			meshes2 = []
		var mesh2 = meshes2[mesh_index] if mesh_index >= 0 and mesh_index < meshes2.size() else null
		if not mesh2:
			return {"value": 0, "isValid": false}
		var target_count2 = _get_mesh_target_count(mesh2)
		if mesh2.get("weights") is Array:
			return {"value": mesh2["weights"].size(), "isValid": true}
		return {"value": target_count2, "isValid": true}
	return {"value": 0, "isValid": false}


static func _is_number(v) -> bool:
	return typeof(v) == TYPE_FLOAT or typeof(v) == TYPE_INT


static func _resolve_pointer_value(gltf, resolved: String) -> Dictionary:
	var tokens := []
	for t in resolved.split("/"):
		if t != "":
			tokens.append(_decode_token(t))
	var current = gltf
	var node_index = null
	var mesh_index = null
	var nodes_top = (gltf.get("nodes") if gltf is Dictionary else null)
	var meshes_top = (gltf.get("meshes") if gltf is Dictionary else null)
	for i in range(tokens.size()):
		var token = tokens[i]
		if current == null:
			return {"value": null, "isValid": false}
		if token.ends_with(".length"):
			var base = token.substr(0, token.length() - ".length".length())
			if base == "weights":
				return _resolve_weights_length(gltf, node_index, mesh_index)
			if not (current is Dictionary) or not current.has(base):
				return {"value": 0, "isValid": false}
			var next_ = current[base]
			var is_arr = next_ is Array
			return {"value": next_.size() if is_arr else 0, "isValid": is_arr}
		if (token == "matrix" or token == "globalMatrix") and node_index != null:
			if token == "matrix":
				return {"value": _compute_local_matrix(nodes_top[node_index] if nodes_top != null else null), "isValid": true}
			return {"value": _compute_global_matrix(gltf, node_index, {}), "isValid": true}
		if token == "[]":
			return {"value": null, "isValid": false}

		if node_index != null and nodes_top != null and is_same(current, nodes_top[node_index]) and (not (current is Dictionary) or not current.has(token)):
			if token == "translation":
				return {"value": [0.0, 0.0, 0.0], "isValid": true}
			if token == "rotation":
				return {"value": [0.0, 0.0, 0.0, 1.0], "isValid": true}
			if token == "scale":
				return {"value": [1.0, 1.0, 1.0], "isValid": true}

		var weights_handled = false
		if token == "weights":
			var next_token = tokens[i + 1] if i + 1 < tokens.size() else null
			var has_index = next_token != null and next_token.is_valid_int()
			if not has_index:
				return {"value": null, "isValid": false}
			if node_index != null:
				var mesh_node_index = _find_mesh_node_index(gltf, node_index)
				var mesh_node = nodes_top[mesh_node_index] if mesh_node_index != null else null
				var mesh = null
				if mesh_node is Dictionary and _is_number(mesh_node.get("mesh")):
					var mi := int(mesh_node["mesh"])
					mesh = meshes_top[mi] if meshes_top != null and mi >= 0 and mi < meshes_top.size() else null
				if not mesh:
					return {"value": null, "isValid": false}
				var target_count = _get_mesh_target_count(mesh)
				if mesh_node.get("weights") is Array:
					current = mesh_node["weights"]
					weights_handled = true
				elif mesh.get("weights") is Array:
					current = mesh["weights"]
					weights_handled = true
				elif target_count > 0:
					var arr := []
					for _k in range(target_count):
						arr.append(0.5)
					current = arr
					weights_handled = true
				else:
					return {"value": null, "isValid": false}
			elif mesh_index != null:
				var mesh2 = meshes_top[mesh_index] if meshes_top != null and mesh_index >= 0 and mesh_index < meshes_top.size() else null
				if not mesh2:
					return {"value": null, "isValid": false}
				var target_count2 = _get_mesh_target_count(mesh2)
				if mesh2.get("weights") is Array:
					current = mesh2["weights"]
					weights_handled = true
				elif target_count2 > 0:
					var arr2 := []
					for _k in range(target_count2):
						arr2.append(0.5)
					current = arr2
					weights_handled = true
				else:
					current = [0.0]
					weights_handled = true

		if not weights_handled:
			if token.is_valid_int() and current is Array:
				var index := int(token)
				if index < 0 or index >= current.size():
					return {"value": null, "isValid": false}
				var next_v = current[index]
				if next_v != null:
					if nodes_top != null and index >= 0 and index < nodes_top.size() and is_same(next_v, nodes_top[index]):
						node_index = index
					if meshes_top != null and index >= 0 and index < meshes_top.size() and is_same(next_v, meshes_top[index]):
						mesh_index = index
				current = next_v
			else:
				current = current.get(token) if current is Dictionary else null
	return {"value": current, "isValid": current != null}


static func _set_pointer_value(gltf, resolved: String, value) -> bool:
	var tokens := []
	for t in resolved.split("/"):
		if t != "":
			tokens.append(_decode_token(t))
	var current = gltf
	var parent = null
	var parent_key = null
	var node_index = null
	var mesh_index = null
	var nodes_top = (gltf.get("nodes") if gltf is Dictionary else null)
	var meshes_top = (gltf.get("meshes") if gltf is Dictionary else null)
	for i in range(tokens.size()):
		var token = tokens[i]
		var is_last = i == tokens.size() - 1
		if token.ends_with(".length") or token == "globalMatrix":
			return false
		if token == "matrix" and is_last and node_index != null:
			gltf["nodes"][node_index]["matrix"] = value
			return true
		var next_token = tokens[i + 1] if i + 1 < tokens.size() else null
		var next_is_index = next_token != null and next_token.is_valid_int()

		if token == "weights":
			if not next_is_index:
				return false
			if node_index != null:
				var mesh_node_index = _find_mesh_node_index(gltf, node_index)
				var mesh_node = nodes_top[mesh_node_index] if mesh_node_index != null else null
				var mesh = null
				if mesh_node is Dictionary and _is_number(mesh_node.get("mesh")):
					var mi := int(mesh_node["mesh"])
					mesh = meshes_top[mi] if meshes_top != null and mi >= 0 and mi < meshes_top.size() else null
				if not mesh:
					return false
				var target_count = _get_mesh_target_count(mesh)
				if target_count == 0:
					return false
				if not (mesh_node.get("weights") is Array):
					if mesh.get("weights") is Array:
						mesh_node["weights"] = mesh["weights"].duplicate()
					else:
						var filler := []
						for _k in range(target_count):
							filler.append(0.5)
						mesh_node["weights"] = filler
				var next_weights := []
				for k in range(target_count):
					var item = mesh_node["weights"][k] if k < mesh_node["weights"].size() else null
					var num = item if _is_number(item) else null
					next_weights.append(float(num) if num != null and not is_nan(num) and not is_inf(num) else 0.0)
				mesh_node["weights"] = next_weights
				current = mesh_node["weights"]
			elif mesh_index != null:
				var mesh2 = meshes_top[mesh_index] if meshes_top != null and mesh_index >= 0 and mesh_index < meshes_top.size() else null
				if not mesh2:
					return false
				var target_count2 = _get_mesh_target_count(mesh2)
				if target_count2 == 0:
					return false
				if not (mesh2.get("weights") is Array):
					var filler2 := []
					for _k in range(target_count2):
						filler2.append(0.5)
					mesh2["weights"] = filler2
				var next_weights2 := []
				for k in range(target_count2):
					var item2 = mesh2["weights"][k] if k < mesh2["weights"].size() else null
					var num2 = item2 if _is_number(item2) else null
					next_weights2.append(float(num2) if num2 != null and not is_nan(num2) and not is_inf(num2) else 0.0)
				mesh2["weights"] = next_weights2
				current = mesh2["weights"]
			else:
				return false
		else:
			if token.is_valid_int():
				var index := int(token)
				if not (current is Array):
					var next_ = []
					if parent != null and parent_key != null:
						parent[parent_key] = next_
					current = next_
				if is_last:
					while current.size() <= index:
						current.append(null)
					current[index] = value
				else:
					while current.size() <= index:
						current.append(null)
					if current[index] == null:
						current[index] = {}
					parent = current
					parent_key = index
					current = current[index]
					if nodes_top != null and index >= 0 and index < nodes_top.size() and is_same(current, nodes_top[index]):
						node_index = index
					if meshes_top != null and index >= 0 and index < meshes_top.size() and is_same(current, meshes_top[index]):
						mesh_index = index
			else:
				if not (current is Dictionary):
					var next_d = {}
					if parent != null and parent_key != null:
						parent[parent_key] = next_d
					current = next_d
				if is_last:
					current[token] = value
				else:
					if current.get(token) == null:
						current[token] = [] if next_is_index else {}
					parent = current
					parent_key = token
					current = current[token]
	return true


# JS-like Number-to-String conversion for an int-kind pointer template
# param's substituted value. NOT plain `str(v)`: an int-typed value that
# happens to arrive as a whole-number FLOAT (e.g. `0.0`) stringifies with a
# trailing ".0" (`str(0.0) == "0.0"`), which then fails every downstream
# digit-only pointer-token check in this file and silently breaks the whole
# pointer resolution -- the exact same failure mode the Lua backend's
# pointer.lua documents needing `string.format("%.0f", v)` for (there: Lua's
# forced-float-literal numeral convention triggers it; here: GDScript's
# JSON.parse_string always yielding float can independently produce a bare
# float wherever a value happens to flow through one before reaching a
# pointer call). JS's `String(0.0) === "0"` has no such footgun (JS has only
# one numeric type), which is why the TS oracle this mirrors gets away with a
# plain `String(v)`.
static func _js_like_str(v) -> String:
	if typeof(v) == TYPE_BOOL:
		return "true" if v else "false"
	if typeof(v) == TYPE_FLOAT:
		if is_nan(v):
			return "NaN"
		if v == INF:
			return "Infinity"
		if v == -INF:
			return "-Infinity"
		if v == floor(v) and abs(v) < 1e16:
			return str(int(v))
		return String.num(v, -1)
	return str(v)


# Substitutes evaluated template parameters into a "/nodes/[nodeIndex]/mesh"
# -style pointer template. Returns null on failure.
static func _build_effective_pointer(pointer: String, args: Dictionary):
	var out := []
	for segment in pointer.split("/"):
		if segment.begins_with("[") and segment.ends_with("]") and segment.length() > 2:
			var key = segment.substr(1, segment.length() - 2)
			var v = args.get(key, 0)
			out.append(_js_like_str(v) if v != null else "0")
			continue
		if segment.begins_with("{") and segment.ends_with("}") and segment.length() > 2:
			var key2 = segment.substr(1, segment.length() - 2)
			var raw = args.get(key2)
			var ref = "" if raw == null else str(raw)
			if ref == "":
				return null
			if ref.begins_with("delay:") or ref.begins_with("event:"):
				out.append(ref)
				continue
			var slash = ref.rfind("/")
			if slash < 0:
				return null
			var prefix = ref.substr(0, slash)
			var idx = ref.substr(slash + 1)
			if "/".join(out) != prefix or not (idx.is_valid_int() and not idx.begins_with("-")):
				return null
			out.append(idx)
			continue
		out.append(segment)
	return "/".join(out)


static func _extract_pointer_params(pointer: String) -> Array:
	var params := []
	for segment in pointer.split("/"):
		if segment.begins_with("[") and segment.ends_with("]") and segment.length() > 2:
			params.append({"name": segment.substr(1, segment.length() - 2), "kind": "int"})
		elif segment.begins_with("{") and segment.ends_with("}") and segment.length() > 2:
			params.append({"name": segment.substr(1, segment.length() - 2), "kind": "ref"})
	return params


const _VALUE_TYPE_LENGTHS := {"float2": 2, "float3": 3, "float4": 4, "float2x2": 4, "float3x3": 9, "float4x4": 16}


static func _value_matches_type(value, t: String) -> bool:
	if t == "bool":
		return typeof(value) == TYPE_BOOL
	if t == "int":
		return _is_number(value) and not is_nan(value) and not is_inf(value) and floor(value) == value
	if t == "float":
		return _is_number(value) and not is_nan(value) and not is_inf(value)
	if _VALUE_TYPE_LENGTHS.has(t):
		var expected = _VALUE_TYPE_LENGTHS[t]
		if not (value is Array) or value.size() != expected:
			return false
		for v in value:
			if not (_is_number(v) and not is_nan(v) and not is_inf(v)):
				return false
		return true
	return false


static func _default_raw(t: String):
	var defaults := {
		"bool": false, "int": 0, "float": 0,
		"float2": [0.0, 0.0], "float3": [0.0, 0.0, 0.0], "float4": [0.0, 0.0, 0.0, 0.0],
		"float2x2": [1.0, 0.0, 0.0, 1.0],
		"float3x3": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0],
		"float4x4": [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
		"ref": "",
	}
	return defaults.get(t)


# Extensions this runtime implements; used by the asset/extensions/{name}/
# enabled capability pointer (KHR_interactivity §4.2.1).
const _SUPPORTED_EXTENSIONS := {
	"KHR_interactivity": true, "KHR_node_visibility": true, "KHR_node_selectability": true,
	"KHR_node_hoverability": true, "KHR_animation_pointer": true, "KHR_lights_punctual": true,
}

# Runtime limits reported through /extensions/KHR_interactivity/limits/* (§4.2.2).
const _RUNTIME_LIMITS := {
	"maxActiveAnimations": 32, "maxActiveDelays": 64,
	"maxActivePropertyInterpolations": 64, "maxActiveVariableInterpolations": 64,
}

const _ANIM_PROPS := {"isPlaying": true, "minTime": true, "maxTime": true, "playhead": true, "virtualPlayhead": true}


static func _resolve_virtual_pointer(host: Dictionary, resolved: String, t: String):
	if resolved == "/extensions/KHR_interactivity/activeCamera/position":
		if t != "float3":
			return {"value": _default_raw(t), "isValid": false}
		var pos = host.get("activeCameraPosition")
		return {"value": pos if pos else [NAN, NAN, NAN], "isValid": true}
	if resolved == "/extensions/KHR_interactivity/activeCamera/rotation":
		if t != "float4":
			return {"value": _default_raw(t), "isValid": false}
		var rot = host.get("activeCameraRotation")
		return {"value": rot if rot else [NAN, NAN, NAN, NAN], "isValid": true}
	if resolved == "/extensions/KHR_interactivity/asset/majorVersion" or resolved == "/extensions/KHR_interactivity/asset/minorVersion":
		if t != "int":
			return {"value": _default_raw(t), "isValid": false}
		return {"value": 2 if resolved.ends_with("majorVersion") else 0, "isValid": true}

	var ext_re := RegEx.new()
	ext_re.compile("^/extensions/KHR_interactivity/asset/extensions/([^/]+)/enabled$")
	var m := ext_re.search(resolved)
	if m:
		if t != "bool":
			return {"value": _default_raw(t), "isValid": false}
		var name = m.get_string(1)
		var gltf_doc = host.get("gltf")
		var used = (gltf_doc.get("extensionsUsed") if gltf_doc is Dictionary else null)
		var is_used = used is Array and used.has(name)
		var enabled = _SUPPORTED_EXTENSIONS.has(name) and (name == "KHR_interactivity" or is_used)
		return {"value": enabled, "isValid": true}

	var limit_re := RegEx.new()
	limit_re.compile("^/extensions/KHR_interactivity/limits/([^/]+)$")
	var lm := limit_re.search(resolved)
	if lm:
		var limit = _RUNTIME_LIMITS.get(lm.get_string(1))
		if limit == null or t != "int":
			return {"value": _default_raw(t), "isValid": false}
		return {"value": limit, "isValid": true}

	var anim_re := RegEx.new()
	anim_re.compile("^/animations/(\\d+)/extensions/KHR_interactivity/(.+)$")
	var am := anim_re.search(resolved)
	if am and _ANIM_PROPS.has(am.get_string(2)):
		var index := int(am.get_string(1))
		var prop = am.get_string(2)
		var gltf_doc2 = host.get("gltf")
		var animations = (gltf_doc2.get("animations") if gltf_doc2 is Dictionary else null)
		if not (animations is Array):
			animations = []
		var animation = animations[index] if index >= 0 and index < animations.size() else null
		if not animation:
			return {"value": _default_raw(t), "isValid": false}
		if prop == "isPlaying":
			if t != "bool":
				return {"value": _default_raw(t), "isValid": false}
			return {"value": host["isAnimationPlaying"].call(index), "isValid": true}
		if t != "float":
			return {"value": _default_raw(t), "isValid": false}
		if prop == "minTime" or prop == "maxTime":
			var range_res = AnimMod.get_animation_time_range({"gltf": host.get("gltf")}, index)
			var min_v = range_res[0]
			var max_v = range_res[1]
			return {"value": min_v if prop == "minTime" else max_v, "isValid": true}
		var state = host["getAnimationPlayhead"].call(index)
		return {"value": state["playhead"] if prop == "playhead" else state["virtualPlayhead"], "isValid": true}
	return null


static func ptr_get(host: Dictionary, pointer: String, args: Dictionary, t: String) -> Dictionary:
	if not host.get("gltf"):
		return {"value": _default_raw(t), "isValid": false}
	var params = _extract_pointer_params(pointer)
	for p in params:
		if p["kind"] == "int":
			var raw = args.get(p["name"])
			var num = raw if _is_number(raw) else null
			if num == null or is_nan(num) or is_inf(num) or num < 0:
				return {"value": _default_raw(t), "isValid": false}
	# Runtime reference validation pointers resolve against runtime state, not
	# the glTF asset (KHR_interactivity Delay/Event References).
	var delay_re := RegEx.new()
	delay_re.compile("^/extensions/KHR_interactivity/delays/\\{[^}]+\\}$")
	if delay_re.search(pointer):
		var ref = str(args.values()[0]) if args.size() > 0 else ""
		if t == "ref" and host["isDelayActive"].call(ref):
			return {"value": ref, "isValid": true}
		return {"value": _default_raw(t), "isValid": false}
	var event_re := RegEx.new()
	event_re.compile("^/extensions/KHR_interactivity/events/\\{[^}]+\\}$")
	if event_re.search(pointer):
		var ref2 = str(args.values()[0]) if args.size() > 0 else ""
		if t == "ref" and ref2.begins_with("event:"):
			return {"value": ref2, "isValid": true}
		return {"value": _default_raw(t), "isValid": false}
	var resolved = _build_effective_pointer(pointer, args)
	if resolved == null:
		return {"value": _default_raw(t), "isValid": false}
	var virtual = _resolve_virtual_pointer(host, resolved, t)
	if virtual != null:
		return virtual
	if t == "ref":
		return _resolve_pointer_ref(host.get("gltf"), resolved)
	var result = _resolve_pointer_value(host.get("gltf"), resolved)
	if not result["isValid"] or not _value_matches_type(result["value"], t):
		return {"value": _default_raw(t), "isValid": false}
	return {"value": result["value"], "isValid": true}


static func ptr_set(host: Dictionary, pointer: String, args: Dictionary, t: String, value) -> bool:
	if not host.get("gltf"):
		return false
	if not _value_matches_type(value, t):
		return false
	var params = _extract_pointer_params(pointer)
	for p in params:
		if p["kind"] == "int":
			var raw = args.get(p["name"])
			var num = raw if _is_number(raw) else null
			if num == null or is_nan(num) or is_inf(num) or num < 0:
				return false
		else:
			var s = args.get(p["name"])
			if not s:
				return false
	var resolved = _build_effective_pointer(pointer, args)
	if resolved == null:
		return false
	var ok = _set_pointer_value(host["gltf"], resolved, value)
	if ok:
		# Spec pointer/set step 5: kill any in-flight pointer/interpolate
		# targeting this same fully-resolved pointer string -- the same one
		# ptr_interp_prepare keys its scheduler table entries on -- so its
		# done flow never fires. Not called on a failed/rejected set, or by
		# write_pointer_raw (the scheduler's OWN interpolation-tick writes,
		# which must never self-kill).
		if host.get("killPointerInterp"):
			host["killPointerInterp"].call(resolved)
		if host.get("onPointerSet"):
			host["onPointerSet"].call(resolved, value)
	return ok


# Writes an already-resolved (no template substitution needed) pointer path
# straight into the document -- used by the scheduler's setPointer effect.
static func write_pointer_raw(gltf, resolved_pointer: String, value) -> bool:
	return _set_pointer_value(gltf, resolved_pointer, value)


# Resolves + validates a pointer/interpolate target exactly like
# interpreter.ts's handlePointerInterpolate. Returns null on failure.
static func ptr_interp_prepare(host: Dictionary, pointer: String, args: Dictionary, t: String):
	if not host.get("gltf"):
		return null
	var params = _extract_pointer_params(pointer)
	for p in params:
		if p["kind"] == "int":
			var raw = args.get(p["name"])
			var num = raw if _is_number(raw) else null
			if num == null or is_nan(num) or is_inf(num) or num < 0:
				return null
		else:
			var s = args.get(p["name"])
			if not s:
				return null
	var resolved = _build_effective_pointer(pointer, args)
	if resolved == null:
		return null
	var result = _resolve_pointer_value(host.get("gltf"), resolved)
	if not result["isValid"] or not _value_matches_type(result["value"], t):
		return null
	var value = result["value"]
	var start_value := []
	if value is Array:
		for x in value:
			start_value.append(float(x))
	else:
		start_value.append(float(value))
	return {"resolved": resolved, "startValue": start_value}
