# The compiled-engine runtime surface, transcribed from packages/runtime-py/
# src/py/gltfi_runtime/engine.py (itself transcribed from
# packages/runtime-lib/src/engine.ts). `Engine.new(gltf, glb_bin, seed,
# on_pointer_set)` builds a fresh engine instance (own variable storage, own
# RNG state, own scheduler, own event-output registers); harness.gd then
# calls the compiled module's own `build(rt)` method with this instance as
# `rt` — unlike Python's `create_engine(setup)` factory (which stashes the
# module's `build` function and re-invokes it on every `reset`), GDScript's
# per-test module is a real OBJECT (see emit-gd's header note: procs/
# handlers/continuations are all named INSTANCE METHODS of the compiled
# class, never lambdas, because GDScript lambdas capture locals BY VALUE at
# creation time and cannot forward-reference a not-yet-assigned local — see
# the task report's lambda-capture probe), so harness.gd just does
# `CompiledClass.new()` + `mod.m = MClass` + `mod.build(engine)` itself on
# both "load" and "reset" — there is no separate `create_engine`/factory
# indirection needed here at all.
#
# One class plays BOTH roles the TS/Lua backends split into two (a setup-time
# "rt" builder with snake_case methods, called once from the emitted
# module's `build(rt)`, and the harness-facing instance with
# start()/advance()/etc.) — same design as engine.py.
#
# Beyond the math/type/ref op surface (that's m.gd), this also hosts the
# async/stateful op runtime (flow/setDelay+cancelDelay, variable/interpolate,
# pointer/interpolate, animation/start+stop+stopAt, flow/doN+multiGate+
# waitAll+throttle) and event/stopPropagation dispatch — every one of these
# mirrors packages/runtime-lib/src/engine.ts's per-op case exactly (via
# engine.py, its closest-syntax sibling).
#
# Scope note: KHR_node_selectability/hoverability EXECUTION (actually
# firing onSelect/onHoverIn/onHoverOut) is intentionally NOT ported here,
# same as the Lua/Python/C# backends — the official conformance corpus this
# backend targets never exercises it, and this runtime has no DOM/pointer-
# input concept to drive it from. @gltfi/emit-gd DOES emit rt.on_select/
# on_hover_in/on_hover_out REGISTRATION calls (R4 #20-4 — authoring parity
# with emit-ts), so no-op-tolerant stubs exist below purely so emitted
# modules load and run; they never fire.
extends RefCounted

const Pointer = preload("res://pointer.gd")
const AnimMod = preload("res://animation.gd")
const Numeric = preload("res://numeric.gd")
const Scheduler = preload("res://scheduler.gd")
const VarStore = preload("res://varstore.gd")
const State = preload("res://state.gd")

const _DEFAULT_SEED: float = 123456789.0

var _anim_ref_regex: RegEx

var var_types: Array = []
var var_raw: Array = []
var _event_decls: Array = []
var _on_start_handlers: Array = []
var _on_tick_handlers: Array = []
var _on_receive_handlers: Dictionary = {}  # event_index(int) -> Array[Callable]
var _sent_events: Array = []
var _event_out_registers: Dictionary = {}
var _last_payload_by_index: Dictionary = {}
var _gltf
var _glb_bin
var _random_state: int
var _stopped_events: Dictionary = {}  # set-like
var _delay_owners: Dictionary = {}
var _animation_playheads: Dictionary = {}
var _on_pointer_set: Callable

var _pointer_host: Dictionary
var _accessor_host: Dictionary
var _scheduler: RefCounted


func _init(gltf = null, glb_bin = null, seed: float = _DEFAULT_SEED, on_pointer_set: Callable = Callable()) -> void:
	_anim_ref_regex = RegEx.new()
	_anim_ref_regex.compile("^/animations/(\\d+)$")
	_gltf = gltf
	_glb_bin = glb_bin
	_random_state = int(seed)
	_on_pointer_set = on_pointer_set

	_pointer_host = {
		"gltf": _gltf,
		"isDelayActive": is_delay_active,
		"isAnimationPlaying": is_animation_playing,
		"getAnimationPlayhead": get_animation_playhead,
		"activeCameraPosition": null,
		"activeCameraRotation": null,
		"onPointerSet": (_on_pointer_set if _on_pointer_set.is_valid() else null),
	}
	_accessor_host = {"gltf": _gltf, "glbBin": _glb_bin}

	var effects := {
		"fireFlow": _effect_fire_flow,
		"applyAnimationSample": _apply_animation_sample,
		"setPointer": _effect_set_pointer,
		"setVariable": _effect_set_variable,
		"onTickPhase": _on_tick_phase,
	}
	_scheduler = Scheduler.new(effects)


# -- internal effects --------------------------------------------------

func _step_random() -> int:
	_random_state = (1664525 * _random_state + 1013904223) & 0xFFFFFFFF
	return _random_state


func _effect_fire_flow(cont) -> void:
	if cont != null:
		cont.call()


func _apply_animation_sample(animation_index, requested_time) -> void:
	var result = AnimMod.apply_animation_at(_accessor_host, animation_index, requested_time, _on_animation_channel_write)
	if result == null:
		return
	_animation_playheads[animation_index] = {"playhead": result["t"], "virtualPlayhead": requested_time}


func _on_animation_channel_write(pointer: String, value) -> void:
	if _on_pointer_set.is_valid():
		_on_pointer_set.call(pointer, value)


func _effect_set_pointer(pointer: String, value) -> void:
	Pointer.write_pointer_raw(_gltf, pointer, value)
	if _on_pointer_set.is_valid():
		_on_pointer_set.call(pointer, value)


func _effect_set_variable(variable_index: int, value: Dictionary) -> void:
	var t: String = var_types[variable_index] if variable_index < var_types.size() else value["type"]
	var_raw[variable_index] = _kernel_value_to_raw(t, value)


func _on_tick_phase() -> void:
	for handler in _on_tick_handlers:
		var tst: float = 0.0 if _scheduler.tick_count == 0 else _scheduler.time
		handler.call(tst, _scheduler.last_tick_delta)


func is_delay_active(ref: String) -> bool:
	return _scheduler.is_delay_active(ref)


func is_animation_playing(index: int) -> bool:
	return _scheduler.is_animation_playing(index)


func get_animation_playhead(index) -> Dictionary:
	return _animation_playheads.get(index, {"playhead": 0.0, "virtualPlayhead": 0.0})


# -- raw<->kernel-value conversions --------------------------------------

static func _finite_num(x) -> bool:
	return (typeof(x) == TYPE_FLOAT or typeof(x) == TYPE_INT) and not is_nan(x) and not is_inf(x)


static func _finite_arr(arr: Array) -> bool:
	for x in arr:
		if not _finite_num(x):
			return false
	return true


static func _is_finite_raw(value) -> bool:
	if value is Array:
		return _finite_arr(value)
	if value is String:
		return true
	return _finite_num(value)


static func _raw_to_kernel_value(t: String, raw) -> Dictionary:
	if t == "bool":
		return {"type": t, "data": [bool(raw)]}
	if t == "ref":
		return {"type": t, "data": [("" if raw == null else str(raw))]}
	if t == "int" or t == "float":
		var n = raw if (typeof(raw) == TYPE_FLOAT or typeof(raw) == TYPE_INT) else 0
		return {"type": t, "data": [n]}
	if raw is Array:
		return {"type": t, "data": raw.duplicate()}
	return {"type": t, "data": [raw if (typeof(raw) == TYPE_FLOAT or typeof(raw) == TYPE_INT) else 0]}


static func _kernel_value_to_raw(t: String, value: Dictionary):
	if t == "bool":
		return bool(value["data"][0])
	if t == "ref":
		var d = value["data"][0]
		return "" if d == null else str(d)
	if t == "int" or t == "float":
		return value["data"][0]
	return (value["data"] as Array).duplicate()


func _parse_animation_ref(gltf, ref):
	if not (ref is String):
		return null
	var m := _anim_ref_regex.search(ref)
	if m == null:
		return null
	var index := int(m.get_string(1))
	var animations = gltf.get("animations") if gltf is Dictionary else null
	if animations is Array and index >= 0 and index < animations.size() and animations[index] != null:
		return index
	return null


# -- builder ("rt.*") API, snake_case, called only from the compiled
# module's `build(rt)` method -------------------------------------------

# `rt.vars([["counter1", rt.int_var(0)], ...])` — Array-of-pairs form (NOT a
# Dictionary: GDScript Dictionaries DO preserve insertion order in practice,
# but the pair-Array form sidesteps ever needing to rely on that, and
# matches this backend's own target design). Array element order IS the
# variable index order. Returns a VarStore bound to every declared name
# (`V.counter1`/`V.counter1 = v` — plain dynamic property access via
# varstore.gd's `_get`/`_set`).
func vars(decls: Array) -> RefCounted:
	var name_to_index := {}
	for pair in decls:
		var name: String = pair[0]
		var decl: Dictionary = pair[1]
		var idx := var_types.size()
		var_types.append(decl["type"])
		var_raw.append(decl["initial"])
		name_to_index[name] = idx
	return VarStore.new(self, name_to_index)


func get_var(index: int):
	return var_raw[index]


func set_var(index: int, value) -> void:
	var_raw[index] = value


# `rt.events([["Explode", {...}], ...])` — same Array-of-pairs, insertion-
# order-is-index-order contract as vars() above. Returns a plain Dictionary
# name->index (an int), directly usable as `E["Explode"]` in emitted code
# (GDScript Dictionaries support bracket subscript access natively, so no
# VarStore-style `_get`/`_set` wrapper is needed here).
func events(decls: Array) -> Dictionary:
	var out := {}
	for pair in decls:
		var name: String = pair[0]
		var decl: Dictionary = pair[1]
		var idx := _event_decls.size()
		_event_decls.append(decl)
		out[name] = idx
	return out


# Variable-declaration-shorthand helpers, usable as `rt.vars([["counter1",
# rt.int_var(0)], ...])` values. Named `*_var` for the scalar types (`int`/
# `bool`/`float` are reserved GDScript type keywords, illegal as method
# names — matches emit-py's `PY_RENAME`-style convention, applied here for a
# different but analogous reason). Defaults match engine.ts's/engine.py's
# identical helpers.
func int_var(x: int = 0) -> Dictionary:
	return {"type": "int", "initial": x}


func bool_var(x: bool = false) -> Dictionary:
	return {"type": "bool", "initial": x}


func float_var(x: float = 0.0) -> Dictionary:
	return {"type": "float", "initial": x}


func ref_var(x: String = "") -> Dictionary:
	return {"type": "ref", "initial": x}


func float2(x: float = 0.0, y: float = 0.0) -> Dictionary:
	return {"type": "float2", "initial": [x, y]}


func float3(x: float = 0.0, y: float = 0.0, z: float = 0.0) -> Dictionary:
	return {"type": "float3", "initial": [x, y, z]}


func float4(x: float = 0.0, y: float = 0.0, z: float = 0.0, w: float = 0.0) -> Dictionary:
	return {"type": "float4", "initial": [x, y, z, w]}


func float2x2(a: float = 1.0, b: float = 0.0, c: float = 0.0, d: float = 1.0) -> Dictionary:
	return {"type": "float2x2", "initial": [a, b, c, d]}


func float3x3(v0: float = 1.0, v1: float = 0.0, v2: float = 0.0, v3: float = 0.0, v4: float = 1.0, v5: float = 0.0, v6: float = 0.0, v7: float = 0.0, v8: float = 1.0) -> Dictionary:
	return {"type": "float3x3", "initial": [v0, v1, v2, v3, v4, v5, v6, v7, v8]}


# 16 individual scalar params (NOT a single Array param) — GDScript has no
# Python-style `*values: float` variadic parameter, so this matches
# float2x2's/float3x3's fixed-arity convention instead; emit-gd always calls
# this with all 16 args explicit (the compiled module knows the initial
# value at emit time), the defaults (identity matrix) exist purely for
# parity with engine.py's own no-args-means-identity convention.
func float4x4(v0: float = 1.0, v1: float = 0.0, v2: float = 0.0, v3: float = 0.0, v4: float = 0.0, v5: float = 1.0, v6: float = 0.0, v7: float = 0.0, v8: float = 0.0, v9: float = 0.0, v10: float = 1.0, v11: float = 0.0, v12: float = 0.0, v13: float = 0.0, v14: float = 0.0, v15: float = 1.0) -> Dictionary:
	return {"type": "float4x4", "initial": [v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15]}


# State-slot factories — plain Dictionaries with the exact shape the emitter
# used to write out literally (kept centralized here, matching engine.py's
# do_n_state/multi_gate_state/wait_all_state/throttle_state/delay_state).
func don_state() -> Dictionary:
	return {"count": 0.0}


func multi_gate_state() -> Dictionary:
	return {"lastIndex": -1.0, "used": []}


func wait_all_state() -> Dictionary:
	return {"activated": []}


func throttle_state() -> Dictionary:
	return {"remaining": NAN}


func delay_state() -> Dictionary:
	return {"lastId": -1.0, "lastRef": "", "ids": []}


func on_start(fn: Callable) -> void:
	_on_start_handlers.append(fn)


func on_tick(fn: Callable) -> void:
	_on_tick_handlers.append(fn)


func on_receive(event_index: int, fn: Callable) -> void:
	if not _on_receive_handlers.has(event_index):
		_on_receive_handlers[event_index] = []
	_on_receive_handlers[event_index].append(fn)


# KHR_node_selectability/hoverability registration stubs — this backend
# never FIRES select/hover (see this file's own "Scope note" header: no
# DOM/pointer-input concept exists here, and the conformance corpus this
# backend targets never exercises UserInteractions), but @gltfi/emit-gd now
# emits rt.on_select/on_hover_in/on_hover_out registrations (R4 #20-4 —
# GDScript backend authoring parity with emit-ts), so these must exist
# purely so an emitted module LOADS without a missing-method error. The
# handler Callable is intentionally discarded (not stored anywhere) —
# registering it would have no observable effect since nothing ever calls
# it.
func on_select(_node_index: int, _stop_propagation: bool, _fn: Callable) -> void:
	pass


func on_hover_in(_node_index: int, _fn: Callable) -> void:
	pass


func on_hover_out(_node_index: int, _fn: Callable) -> void:
	pass


# Combined signature covering the additive `(event_index, payload)` and
# `(event_index)`-alone (defaults) forms — see emit-gd's emitEvent doc
# comment (mirrors emit-py's exactly, minus the OLD 3-arg externalId form,
# which this backend's emitter never generates).
func send(event_index: int, payload: Variant = null) -> void:
	var decl: Dictionary = _event_decls[event_index] if event_index < _event_decls.size() else {}
	var pl: Array
	if payload is Array:
		pl = payload
	else:
		pl = [
			decl.get("defaultBool", false),
			decl.get("defaultInt", 0),
			decl.get("defaultFloat", 0.0),
			decl.get("expectedDuration", 0.0),
		]
	var external_id = decl.get("externalId")
	_sent_events.append({"eventIndex": event_index, "externalId": external_id, "payload": pl})
	_last_payload_by_index[event_index] = pl
	var event_ref := "event:custom:%d" % event_index
	_stopped_events.erase(event_ref)
	var handlers: Array = _on_receive_handlers.get(event_index, []).duplicate()
	for handler in handlers:
		if _stopped_events.has(event_ref):
			break
		handler.call(pl)
	_stopped_events.erase(event_ref)


func log_msg(template: String, args: Array = []) -> void:
	pass  # debug/log has no effect on pass/fail; intentionally a no-op.


func stop_propagation(event_ref: String, stop_immediate: bool) -> void:
	if stop_immediate and event_ref != "":
		_stopped_events[event_ref] = true


func event_out(node_key, socket: String, value) -> void:
	_event_out_registers["%s:%s" % [node_key, socket]] = value


func event_out_read(node_key, socket: String):
	return _event_out_registers.get("%s:%s" % [node_key, socket])


func event_payload(event_index: int) -> Array:
	var sent = _last_payload_by_index.get(event_index)
	if sent:
		return sent
	var decl: Dictionary = _event_decls[event_index] if event_index < _event_decls.size() else {}
	return [decl.get("defaultBool", false), decl.get("defaultInt", 0), decl.get("defaultFloat", 0.0), decl.get("expectedDuration", 0.0)]


func tick_time() -> float:
	return 0.0 if _scheduler.tick_count == 0 else _scheduler.time


func tick_delta() -> float:
	return _scheduler.last_tick_delta


func random() -> float:
	return float(_step_random()) / 4294967295.0


# Combined signature covering both the Dictionary-args form and an additive
# args-less form for when every pointer-template parameter is a compile-time
# constant (see emit-gd's pointerCall — it inlines constant template args
# straight into the path string, so there's nothing left to pass at all):
# `args_or_type` is either the args Dictionary (3-arg form omitted) or, when
# it's a String, IS the type signature and the args Dictionary was omitted
# entirely.
func ptr_get(pointer: String, args_or_type, t: String = "") -> Dictionary:
	if args_or_type is String:
		return Pointer.ptr_get(_pointer_host, pointer, {}, args_or_type)
	return Pointer.ptr_get(_pointer_host, pointer, args_or_type, t)


func ptr_set(pointer: String, args_or_type, type_or_value, value = null) -> bool:
	if args_or_type is String:
		return Pointer.ptr_set(_pointer_host, pointer, {}, args_or_type, type_or_value)
	return Pointer.ptr_set(_pointer_host, pointer, args_or_type, type_or_value, value)


# -- async ops (flow/setDelay, variable/interpolate, pointer/interpolate,
# animation/start|stop|stopAt) ------------------------------------------

func set_delay(slot: Dictionary, duration: float, done: Callable = Callable()) -> Dictionary:
	if not _finite_num(duration) or duration < 0.0:
		return {"ok": false}
	var handle: Dictionary = _scheduler.allocate_delay_id()
	slot["lastId"] = handle["id"]
	slot["lastRef"] = handle["ref"]
	(slot["ids"] as Array).append(handle["id"])
	_delay_owners[handle["id"]] = slot
	if done.is_valid():
		var hid = handle["id"]
		var on_fire := func():
			var kept := []
			for i in slot["ids"]:
				if i != hid:
					kept.append(i)
			slot["ids"] = kept
			_delay_owners.erase(hid)
			done.call()
		_scheduler.schedule_delay(handle["id"], handle["ref"], duration, on_fire)
	return {"ok": true}


func cancel_delay(ref) -> void:
	if not (ref is String) or ref == "":
		return
	var found = _scheduler.find_delay_by_ref(ref)
	if found == null:
		return
	_scheduler.cancel_delay(found["id"])
	var owner = _delay_owners.get(found["id"])
	_delay_owners.erase(found["id"])
	if owner != null:
		var kept := []
		for i in owner["ids"]:
			if i != found["id"]:
				kept.append(i)
		owner["ids"] = kept


func cancel_delay_slot(slot: Dictionary) -> void:
	for id_ in slot["ids"]:
		_scheduler.cancel_delay(id_)
		_delay_owners.erase(id_)
	slot["ids"] = []
	slot["lastId"] = -1.0
	slot["lastRef"] = ""


func var_interp(var_id: int, value, duration: float, p1: Array, p2: Array, use_slerp: bool, done: Callable = Callable()) -> Dictionary:
	var t: String = var_types[var_id] if var_id < var_types.size() else "float"
	var end_kernel: Dictionary = _raw_to_kernel_value(t, value)
	var is_valid: bool = _finite_num(duration) and duration > 0.0 and _is_finite_raw(value) and _finite_arr(p1) and _finite_arr(p2)
	if not is_valid:
		return {"ok": false}
	var start_kernel: Dictionary = _raw_to_kernel_value(t, var_raw[var_id])
	_scheduler.add_variable_interp({
		"variableIndex": var_id,
		"duration": duration,
		"startValue": start_kernel,
		"endValue": end_kernel,
		"p1": [p1[0] if p1.size() > 0 else 0.0, p1[1] if p1.size() > 1 else 0.0],
		"p2": [p2[0] if p2.size() > 0 else 0.0, p2[1] if p2.size() > 1 else 0.0],
		"useSlerp": use_slerp,
		"doneCont": done if done.is_valid() else null,
	})
	return {"ok": true}


# Combined signature — see ptr_get/ptr_set's identical dispatch above for
# the args-less form this also accepts.
func ptr_interp(pointer: String, args_or_type, type_or_value, value_or_duration = null, duration_or_p1 = null, p1_or_p2 = null, p2_or_done = null, done_maybe: Callable = Callable()) -> Dictionary:
	var args: Dictionary
	var t: String
	var value
	var duration: float
	var p1: Array
	var p2: Array
	var done: Callable
	if args_or_type is String:
		args = {}
		t = args_or_type
		value = type_or_value
		duration = value_or_duration
		p1 = duration_or_p1
		p2 = p1_or_p2
		done = p2_or_done if p2_or_done is Callable else Callable()
	else:
		args = args_or_type
		t = type_or_value
		value = value_or_duration
		duration = duration_or_p1
		p1 = p1_or_p2
		p2 = p2_or_done
		done = done_maybe
	var prep = Pointer.ptr_interp_prepare(_pointer_host, pointer, args, t)
	if prep == null:
		return {"ok": false}
	if not _finite_num(duration) or duration < 0.0:
		return {"ok": false}
	var p10: float = p1[0] if p1.size() > 0 else 0.0
	var p20: float = p2[0] if p2.size() > 0 else 0.0
	if not _finite_arr(p1) or not _finite_arr(p2) or p10 < 0.0 or p10 > 1.0 or p20 < 0.0 or p20 > 1.0:
		return {"ok": false}
	var target: Array
	if value is Array:
		target = []
		for x in value:
			target.append(float(x))
	else:
		target = [float(value)]
	_scheduler.add_pointer_interp({
		"pointer": prep["resolved"],
		"duration": duration,
		"startValue": prep["startValue"],
		"endValue": target,
		"p1": [p10, p1[1] if p1.size() > 1 else 0.0],
		"p2": [p20, p2[1] if p2.size() > 1 else 0.0],
		"isQuaternion": (prep["resolved"] as String).ends_with("/rotation"),
		"doneCont": done if done.is_valid() else null,
	})
	return {"ok": true}


func anim_start(animation_ref, start_time: float, end_time: float, speed: float, done: Callable = Callable()) -> Dictionary:
	var index = _parse_animation_ref(_gltf, animation_ref)
	if index == null or not _finite_num(start_time) or is_nan(end_time) or not _finite_num(speed) or speed <= 0.0:
		return {"ok": false}
	_scheduler.start_animation({
		"animationIndex": index, "startTime": start_time, "endTime": end_time, "speed": speed,
		"endCont": done if done.is_valid() else null,
	})
	return {"ok": true}


func anim_stop(animation_ref) -> Dictionary:
	var index = _parse_animation_ref(_gltf, animation_ref)
	if index == null:
		return {"ok": false}
	_scheduler.stop_animation(index)
	return {"ok": true}


func anim_stop_at(animation_ref, stop_time: float, done: Callable = Callable()) -> Dictionary:
	var index = _parse_animation_ref(_gltf, animation_ref)
	if index == null or is_nan(stop_time):
		return {"ok": false}
	_scheduler.stop_animation_at(index, stop_time, done if done.is_valid() else null)
	return {"ok": true}


# -- stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle) --

func don(slot: Dictionary, n: float) -> bool:
	var decision: Dictionary = State.doNAdvance(slot["count"], Numeric.safeTrunc(n))
	slot["count"] = decision["count"]
	return decision["fire"]


func multi_gate(slot: Dictionary, output_count: int, is_random: bool, is_loop: bool) -> Dictionary:
	var decision: Dictionary = State.multiGateAdvance(slot["used"], output_count, is_random, is_loop, _random_index)
	slot["used"] = decision["used"]
	if decision["index"] >= 0:
		slot["lastIndex"] = decision["index"]
	return {"index": decision["index"]}


func _random_index(count: int) -> int:
	if count <= 0:
		return 0
	return _step_random() % count


func wait_all(slot: Dictionary, input_flows: int, index: int) -> Dictionary:
	var decision: Dictionary = State.waitAllAdvance(slot["activated"], slot.get("remaining"), input_flows, index)
	slot["activated"] = decision["activated"]
	slot["remaining"] = decision["remaining"]
	return {"completed": decision["completed"]}


func throttle(slot: Dictionary, duration: float) -> Dictionary:
	if not _finite_num(duration) or duration < 0.0:
		return {"invalid": true, "fire": false}
	var decision: Dictionary = State.throttleAdvance(slot.get("lastTime"), duration, _scheduler.time)
	slot["lastTime"] = decision["lastTime"]
	slot["remaining"] = decision["remaining"]
	return {"invalid": false, "fire": decision["fire"]}


# -- instance (harness-facing) API --------------------------------------

func start() -> void:
	for handler in _on_start_handlers:
		handler.call()


func advance(dt: float) -> void:
	_scheduler.advance(dt)


func get_variable_by_index(index: int) -> Dictionary:
	var t: String = var_types[index] if index < var_types.size() else "float"
	return _raw_to_kernel_value(t, var_raw[index])


var variable_count: int:
	get:
		return var_types.size()

var sent_events: Array:
	get:
		return _sent_events

var time: float:
	get:
		return _scheduler.time

var event_defaults: Array:
	get:
		var out := []
		for d in _event_decls:
			out.append(d.get("expectedDuration"))
		return out
