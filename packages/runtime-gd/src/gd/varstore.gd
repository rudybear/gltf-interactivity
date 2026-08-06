# Backs the compiled module's `V.counter1` / `V.counter1 = v` sugar (see
# engine.gd's `vars()` builder method and emit-gd's own header note) via
# GDScript's `_get`/`_set` virtual-property-access hooks on a RefCounted
# subclass — confirmed empirically to work for arbitrary dynamic names (see
# the task report's `_get`/`_set` probe) — mirroring Python's `_VarStore`
# (engine.py) via `__getattr__`/`__setattr__`, one level simpler here since
# GDScript's hooks are already scoped to "only called when normal
# member-lookup misses" (same guarantee Python's `__getattr__` gives, but
# GDScript's `_set` is ALSO only consulted when there's no real declared
# member of that name, so there's no `object.__setattr__` dance needed the
# way Python's version required to bootstrap its own two backing fields).
extends RefCounted

var _engine: RefCounted
var _name_to_index: Dictionary


func _init(engine: RefCounted, name_to_index: Dictionary) -> void:
	_engine = engine
	_name_to_index = name_to_index


func _get(property: StringName):
	if not _name_to_index.has(property):
		return null
	return _engine.var_raw[_name_to_index[property]]


func _set(property: StringName, value) -> bool:
	if not _name_to_index.has(property):
		return false
	var idx: int = _name_to_index[property]
	_engine.var_raw[idx] = value
	# Spec variable/set step 2a: every compiled variable/set lowers to
	# `V.<name> = value` and must kill any in-flight variable/interpolate
	# targeting this index -- its done flow never fires. The scheduler's OWN
	# interpolation-tick writes go through `_effect_set_variable` instead
	# (straight to `var_raw`, never through this `_set` hook), so they can
	# never self-kill.
	_engine._scheduler.kill_variable_interp(idx)
	return true
