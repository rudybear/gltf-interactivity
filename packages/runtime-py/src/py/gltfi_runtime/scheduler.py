# Time/async scheduler for KHR_interactivity, transcribed from
# packages/kernel/src/scheduler.ts. Owns the delay table, the variable- and
# pointer-interpolation tables, the active-animation table, the current time
# and tick counters, and implements the exact phase ordering: animation
# playback, then pointer interpolations, then variable interpolations, then
# due delays, then per-tick handler activation.
#
# `effects` is a dict of the same five callbacks as TS's
# SchedulerEffects<Cont> (fireFlow, applyAnimationSample, setPointer,
# setVariable, onTickPhase). `Cont` is a plain zero-arg Python callable.
#
# Kernel Values are plain dicts `{"type": "<ValueType>", "data": [...]}` —
# 0-based, matching the TS source exactly.
import math

from .kmath import cubic_bezier_ease, quat_slerp


def _value_to_number_array(value: dict) -> list:
    if value["type"] == "bool":
        return [1 if x else 0 for x in value["data"]]
    return value["data"]


class Scheduler:
    def __init__(self, effects: dict):
        self.effects = effects
        self.time = 0.0
        self.tick_count = 0
        self.last_tick_delta = float("nan")

        self._next_delay_id = 0
        self._delays = []
        self._active_refs = set()
        self._variable_interps = []
        self._pointer_interps = []
        self._animations = []

    def allocate_delay_id(self) -> dict:
        id_ = self._next_delay_id
        self._next_delay_id += 1
        ref = f"delay:{id_}"
        self._active_refs.add(ref)
        return {"id": id_, "ref": ref}

    def schedule_delay(self, id_: int, ref: str, duration: float, cont) -> None:
        self._delays.append({"id": id_, "ref": ref, "time": self.time + duration, "cont": cont})

    def add_delay(self, duration: float, cont) -> dict:
        handle = self.allocate_delay_id()
        self.schedule_delay(handle["id"], handle["ref"], duration, cont)
        return handle

    def cancel_delay(self, id_: int):
        for i, item in enumerate(self._delays):
            if item["id"] == id_:
                del self._delays[i]
                self._active_refs.discard(item["ref"])
                return item
        return None

    def find_delay_by_id(self, id_: int):
        for item in self._delays:
            if item["id"] == id_:
                return item
        return None

    def find_delay_by_ref(self, ref: str):
        for item in self._delays:
            if item["ref"] == ref:
                return item
        return None

    def is_delay_active(self, ref: str) -> bool:
        return ref in self._active_refs

    def add_variable_interp(self, params: dict) -> None:
        self.kill_variable_interp(params["variableIndex"])
        entry = dict(params)
        entry["startTime"] = self.time
        self._variable_interps.append(entry)

    def kill_variable_interp(self, variable_index: int) -> None:
        self._variable_interps = [item for item in self._variable_interps if item["variableIndex"] != variable_index]

    def add_pointer_interp(self, params: dict) -> None:
        self.kill_pointer_interp(params["pointer"])
        entry = dict(params)
        entry["startTime"] = self.time
        self._pointer_interps.append(entry)

    def kill_pointer_interp(self, pointer: str) -> None:
        self._pointer_interps = [item for item in self._pointer_interps if item["pointer"] != pointer]

    def start_animation(self, params: dict) -> None:
        self._animations = [s for s in self._animations if s["animationIndex"] != params["animationIndex"]]
        self._animations.append({
            "animationIndex": params["animationIndex"],
            "startTime": params["startTime"],
            "endTime": params["endTime"],
            "stopTime": params["endTime"],
            "speed": params["speed"],
            "entryCreation": self.time,
            "endCont": params.get("endCont"),
            "stopCont": None,
        })

    def stop_animation(self, animation_index: int) -> None:
        self._animations = [s for s in self._animations if s["animationIndex"] != animation_index]

    def stop_animation_at(self, animation_index: int, stop_time: float, stop_cont=None) -> bool:
        for entry in self._animations:
            if entry["animationIndex"] == animation_index:
                entry["stopTime"] = stop_time
                entry["stopCont"] = stop_cont
                return True
        return False

    def is_animation_playing(self, animation_index: int) -> bool:
        return any(s["animationIndex"] == animation_index for s in self._animations)

    @property
    def delay_count(self) -> int:
        return len(self._delays)

    @property
    def pointer_interp_count(self) -> int:
        return len(self._pointer_interps)

    def advance(self, delta: float) -> None:
        effects = self.effects
        self.time += delta

        # Phase 1: animation playback. Collect-then-fire.
        finished_animations = []
        kept_animations = []
        for state in self._animations:
            animation_index = state["animationIndex"]
            start_time = state["startTime"]
            end_time = state["endTime"]
            stop_time = state["stopTime"]
            speed = state["speed"]
            entry_creation = state["entryCreation"]
            end_cont = state.get("endCont")
            stop_cont = state.get("stopCont")
            keep = True
            if start_time == end_time:
                effects["applyAnimationSample"](animation_index, start_time)
                if end_cont is not None:
                    finished_animations.append(end_cont)
                keep = False
            else:
                elapsed = max(0.0, self.time - entry_creation)
                scaled = -elapsed * speed if start_time > end_time else elapsed * speed
                current = start_time + scaled
                forward = start_time < end_time
                if forward:
                    stop_hit = current >= stop_time and stop_time >= start_time and stop_time < end_time
                else:
                    stop_hit = current <= stop_time and stop_time <= start_time and stop_time > end_time
                if stop_hit:
                    effects["applyAnimationSample"](animation_index, stop_time)
                    if stop_cont is not None:
                        finished_animations.append(stop_cont)
                    keep = False
                else:
                    end_hit = current >= end_time if forward else current <= end_time
                    if end_hit:
                        effects["applyAnimationSample"](animation_index, end_time)
                        if end_cont is not None:
                            finished_animations.append(end_cont)
                        keep = False
                    else:
                        effects["applyAnimationSample"](animation_index, current)
            if keep:
                kept_animations.append(state)
        self._animations = kept_animations
        for cont in finished_animations:
            effects["fireFlow"](cont)

        # Phase 2: object-model pointer interpolations. Same collect-then-fire.
        finished_pointer_interps = []
        kept_pointer_interps = []
        for interp in self._pointer_interps:
            t = (self.time - interp["startTime"]) / interp["duration"] if interp["duration"] > 0 else math.inf
            keep = True
            if t <= 0:
                pass
            elif t != t or t >= 1:
                end_value = interp["endValue"]
                target = end_value[0] if len(end_value) == 1 else end_value
                effects["setPointer"](interp["pointer"], target)
                if interp.get("doneCont") is not None:
                    finished_pointer_interps.append(interp["doneCont"])
                keep = False
            else:
                q = cubic_bezier_ease(t, interp["p1"], interp["p2"])
                if interp["isQuaternion"]:
                    value = quat_slerp(interp["startValue"], interp["endValue"], q)
                else:
                    start_value = interp["startValue"]
                    end_value = interp["endValue"]
                    value = [start_value[idx] + (end_value[idx] - start_value[idx]) * q for idx in range(len(start_value))]
                written = value[0] if len(value) == 1 else value
                effects["setPointer"](interp["pointer"], written)
            if keep:
                kept_pointer_interps.append(interp)
        self._pointer_interps = kept_pointer_interps
        for cont in finished_pointer_interps:
            effects["fireFlow"](cont)

        # Phase 3: variable interpolations. Done flow fires *inline*, mid-
        # pass — copied verbatim from the source oracle's mid-iteration
        # array-mutation quirk: a done handler that itself starts a new
        # interpolation appends to THIS SAME list (self._variable_interps,
        # not yet reassigned) at an index beyond `n` (captured below, before
        # the loop starts), so this pass never visits it, and once
        # self._variable_interps is reassigned to the freshly-built `kept`
        # list after the loop, that appended entry (which only ever existed
        # at a tail index of the OLD list) is gone, not deferred to next
        # tick — mirrors JS's Array#filter capturing the array length once.
        original_variable_interps = self._variable_interps
        n = len(original_variable_interps)
        kept_variable_interps = []
        for idx in range(n):
            interp = original_variable_interps[idx]
            t = min(1.0, (self.time - interp["startTime"]) / interp["duration"])
            ease = cubic_bezier_ease(t, interp["p1"], interp["p2"])
            if interp["useSlerp"] and interp["startValue"]["type"] == "float4" and interp["endValue"]["type"] == "float4":
                q = quat_slerp(_value_to_number_array(interp["startValue"]), _value_to_number_array(interp["endValue"]), ease)
                effects["setVariable"](interp["variableIndex"], {"type": "float4", "data": q})
            else:
                start_arr = _value_to_number_array(interp["startValue"])
                end_arr = _value_to_number_array(interp["endValue"])
                out = [start_arr[i2] + (end_arr[i2] - start_arr[i2]) * ease for i2 in range(len(start_arr))]
                effects["setVariable"](interp["variableIndex"], {"type": interp["endValue"]["type"], "data": out})
            if t >= 1:
                if interp.get("doneCont") is not None:
                    effects["fireFlow"](interp["doneCont"])
            else:
                kept_variable_interps.append(interp)
        self._variable_interps = kept_variable_interps

        # Phase 4: due delays. Two passes before any flow fires.
        ready = [item for item in self._delays if item["time"] <= self.time]
        self._delays = [item for item in self._delays if item["time"] > self.time]
        for item in ready:
            self._active_refs.discard(item["ref"])
            effects["fireFlow"](item["cont"])

        # Phase 5: per-tick handler activation, with tick bookkeeping updated
        # around it.
        if delta > 0:
            self.last_tick_delta = float("nan") if self.tick_count == 0 else delta
            effects["onTickPhase"]()
            self.tick_count += 1


def create_scheduler(effects: dict) -> Scheduler:
    return Scheduler(effects)
