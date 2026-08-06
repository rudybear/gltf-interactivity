# Time/async scheduler for KHR_interactivity, transcribed from
# packages/runtime-py/src/py/gltfi_runtime/scheduler.py (itself transcribed
# from packages/kernel/src/scheduler.ts). Owns the delay table, the variable-
# and pointer-interpolation tables, the active-animation table, the current
# time and tick counters, and implements the exact phase ordering: animation
# playback, then pointer interpolations, then variable interpolations, then
# due delays, then per-tick handler activation.
#
# Unlike m.gd/kmath.gd/numeric.gd/state.gd/animation.gd/pointer.gd (pure
# namespaces of `static func`s), this one is a REAL instantiated class — it
# holds genuine per-engine mutable state — so `extends RefCounted` here means
# what it usually means: `Scheduler.new(effects)` (see engine.gd) creates a
# fresh instance per Engine, exactly like Python's `Scheduler(effects)`.
#
# `effects` is a Dictionary of the same five Callables as TS's
# SchedulerEffects<Cont>/Python's `effects` dict (fireFlow,
# applyAnimationSample, setPointer, setVariable, onTickPhase). `Cont` is a
# zero-arg Callable (an emitted proc/continuation method reference — see
# emit-gd's own header note on why every proc/continuation is a real
# INSTANCE METHOD of the compiled module class, never a lambda).
#
# Kernel Values are plain Dictionaries `{"type": "<ValueType>", "data": [...]}`
# — 0-based, matching the TS/Python sources exactly.
extends RefCounted

const Kmath = preload("res://kmath.gd")

var effects: Dictionary
var time: float = 0.0
var tick_count: int = 0
var last_tick_delta: float = NAN

var _next_delay_id: int = 0
var _delays: Array = []
var _active_refs: Dictionary = {}  # set-like: ref (String) -> true
var _variable_interps: Array = []
var _pointer_interps: Array = []
var _animations: Array = []


func _init(p_effects: Dictionary) -> void:
	effects = p_effects


static func _value_to_number_array(value: Dictionary) -> Array:
	if value["type"] == "bool":
		var out := []
		for x in value["data"]:
			out.append(1.0 if x else 0.0)
		return out
	return value["data"]


func allocate_delay_id() -> Dictionary:
	var id_ := _next_delay_id
	_next_delay_id += 1
	var ref := "delay:%d" % id_
	_active_refs[ref] = true
	return {"id": id_, "ref": ref}


func schedule_delay(id_: int, ref: String, duration: float, cont: Callable) -> void:
	_delays.append({"id": id_, "ref": ref, "time": time + duration, "cont": cont})


func cancel_delay(id_: int):
	for i in range(_delays.size()):
		var item = _delays[i]
		if item["id"] == id_:
			_delays.remove_at(i)
			_active_refs.erase(item["ref"])
			return item
	return null


func find_delay_by_ref(ref: String):
	for item in _delays:
		if item["ref"] == ref:
			return item
	return null


func is_delay_active(ref: String) -> bool:
	return _active_refs.has(ref)


func add_variable_interp(params: Dictionary) -> void:
	kill_variable_interp(params["variableIndex"])
	var entry: Dictionary = params.duplicate()
	entry["startTime"] = time
	_variable_interps.append(entry)


func kill_variable_interp(variable_index: int) -> void:
	var kept := []
	for item in _variable_interps:
		if item["variableIndex"] != variable_index:
			kept.append(item)
	_variable_interps = kept


func add_pointer_interp(params: Dictionary) -> void:
	kill_pointer_interp(params["pointer"])
	var entry: Dictionary = params.duplicate()
	entry["startTime"] = time
	_pointer_interps.append(entry)


func kill_pointer_interp(pointer: String) -> void:
	var kept := []
	for item in _pointer_interps:
		if item["pointer"] != pointer:
			kept.append(item)
	_pointer_interps = kept


func start_animation(params: Dictionary) -> void:
	var kept := []
	for s in _animations:
		if s["animationIndex"] != params["animationIndex"]:
			kept.append(s)
	kept.append({
		"animationIndex": params["animationIndex"],
		"startTime": params["startTime"],
		"endTime": params["endTime"],
		"stopTime": params["endTime"],
		"speed": params["speed"],
		"entryCreation": time,
		"endCont": params.get("endCont"),
		"stopCont": null,
	})
	_animations = kept


func stop_animation(animation_index: int) -> void:
	var kept := []
	for s in _animations:
		if s["animationIndex"] != animation_index:
			kept.append(s)
	_animations = kept


func stop_animation_at(animation_index: int, stop_time: float, stop_cont) -> bool:
	for entry in _animations:
		if entry["animationIndex"] == animation_index:
			entry["stopTime"] = stop_time
			entry["stopCont"] = stop_cont
			return true
	return false


func is_animation_playing(animation_index: int) -> bool:
	for s in _animations:
		if s["animationIndex"] == animation_index:
			return true
	return false


func advance(delta: float) -> void:
	time += delta

	# Phase 1: animation playback. Collect-then-fire.
	var finished_animations := []
	var kept_animations := []
	for state in _animations:
		var animation_index = state["animationIndex"]
		var start_time: float = state["startTime"]
		var end_time: float = state["endTime"]
		var stop_time: float = state["stopTime"]
		var speed: float = state["speed"]
		var entry_creation: float = state["entryCreation"]
		var end_cont = state.get("endCont")
		var stop_cont = state.get("stopCont")
		var keep := true
		if start_time == end_time:
			effects["applyAnimationSample"].call(animation_index, start_time)
			if end_cont != null:
				finished_animations.append(end_cont)
			keep = false
		else:
			var elapsed: float = maxf(0.0, time - entry_creation)
			var scaled: float = (-elapsed * speed) if start_time > end_time else (elapsed * speed)
			var current: float = start_time + scaled
			var forward: bool = start_time < end_time
			var stop_hit: bool
			if forward:
				stop_hit = current >= stop_time and stop_time >= start_time and stop_time < end_time
			else:
				stop_hit = current <= stop_time and stop_time <= start_time and stop_time > end_time
			if stop_hit:
				effects["applyAnimationSample"].call(animation_index, stop_time)
				if stop_cont != null:
					finished_animations.append(stop_cont)
				keep = false
			else:
				var end_hit: bool = (current >= end_time) if forward else (current <= end_time)
				if end_hit:
					effects["applyAnimationSample"].call(animation_index, end_time)
					if end_cont != null:
						finished_animations.append(end_cont)
					keep = false
				else:
					effects["applyAnimationSample"].call(animation_index, current)
		if keep:
			kept_animations.append(state)
	_animations = kept_animations
	for cont in finished_animations:
		effects["fireFlow"].call(cont)

	# Phase 2: object-model pointer interpolations. Same collect-then-fire.
	var finished_pointer_interps := []
	var kept_pointer_interps := []
	for interp in _pointer_interps:
		var t: float = ((time - interp["startTime"]) / interp["duration"]) if interp["duration"] > 0.0 else INF
		var keep := true
		if t <= 0.0:
			pass
		elif is_nan(t) or t >= 1.0:
			var end_value: Array = interp["endValue"]
			var target = end_value[0] if end_value.size() == 1 else end_value
			effects["setPointer"].call(interp["pointer"], target)
			if interp.get("doneCont") != null:
				finished_pointer_interps.append(interp["doneCont"])
			keep = false
		else:
			var q: float = Kmath.cubicBezierEase(t, interp["p1"], interp["p2"])
			var value
			if interp["isQuaternion"]:
				value = Kmath.quatSlerp(interp["startValue"], interp["endValue"], q)
			else:
				var start_value: Array = interp["startValue"]
				var end_value2: Array = interp["endValue"]
				var out := []
				for idx in range(start_value.size()):
					out.append(start_value[idx] + (end_value2[idx] - start_value[idx]) * q)
				value = out
			var written = value[0] if value.size() == 1 else value
			effects["setPointer"].call(interp["pointer"], written)
		if keep:
			kept_pointer_interps.append(interp)
	_pointer_interps = kept_pointer_interps
	for cont in finished_pointer_interps:
		effects["fireFlow"].call(cont)

	# Phase 3: variable interpolations. Done flow fires *inline*, mid-pass —
	# copied verbatim from the source oracle's mid-iteration array-mutation
	# quirk: a done handler that itself starts a new interpolation appends to
	# THIS SAME array (_variable_interps, not yet reassigned) at an index
	# beyond `n` (captured below, before the loop starts), so this pass never
	# visits it, and once _variable_interps is reassigned to the freshly-
	# built `kept` array after the loop, that appended entry (which only ever
	# existed at a tail index of the OLD array) is gone, not deferred to next
	# tick — mirrors JS's Array#filter capturing the array length once (and
	# scheduler.py's identical note).
	var original_variable_interps: Array = _variable_interps
	var n: int = original_variable_interps.size()
	var kept_variable_interps := []
	for idx in range(n):
		var interp = original_variable_interps[idx]
		var t: float = minf(1.0, (time - interp["startTime"]) / interp["duration"])
		var ease: float = Kmath.cubicBezierEase(t, interp["p1"], interp["p2"])
		if interp["useSlerp"] and interp["startValue"]["type"] == "float4" and interp["endValue"]["type"] == "float4":
			var q: Array = Kmath.quatSlerp(_value_to_number_array(interp["startValue"]), _value_to_number_array(interp["endValue"]), ease)
			effects["setVariable"].call(interp["variableIndex"], {"type": "float4", "data": q})
		else:
			var start_arr: Array = _value_to_number_array(interp["startValue"])
			var end_arr: Array = _value_to_number_array(interp["endValue"])
			var out := []
			for i2 in range(start_arr.size()):
				out.append(start_arr[i2] + (end_arr[i2] - start_arr[i2]) * ease)
			effects["setVariable"].call(interp["variableIndex"], {"type": interp["endValue"]["type"], "data": out})
		if t >= 1.0:
			if interp.get("doneCont") != null:
				effects["fireFlow"].call(interp["doneCont"])
		else:
			kept_variable_interps.append(interp)
	_variable_interps = kept_variable_interps

	# Phase 4: due delays. Two passes before any flow fires.
	var ready := []
	var still_pending := []
	for item in _delays:
		if item["time"] <= time:
			ready.append(item)
		else:
			still_pending.append(item)
	_delays = still_pending
	for item in ready:
		_active_refs.erase(item["ref"])
		effects["fireFlow"].call(item["cont"])

	# Phase 5: per-tick handler activation, with tick bookkeeping updated
	# around it.
	if delta > 0.0:
		last_tick_delta = NAN if tick_count == 0 else delta
		effects["onTickPhase"].call()
		tick_count += 1
