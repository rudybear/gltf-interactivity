# The compiled-engine runtime surface, transcribed from
# packages/runtime-lib/src/engine.ts. `create_engine(setup)` builds a
# factory; calling the factory builds a FRESH `Engine` instance (own variable
# storage, own RNG state, own scheduler, own event-output registers).
#
# One class plays BOTH roles the TS/Lua backends split into two (a setup-time
# "rt" builder with snake_case methods, called once from the emitted module's
# `build(rt)`, and the harness-facing instance with start()/advance()/etc.) —
# nothing here needs to hide one surface from the other's caller, so a single
# `Engine` object is simplest. The emitted Python module (see @gltfi/emit-py)
# is exactly:
#
#   def build(rt: "Engine") -> None:
#       rt.vars([...]); rt.events([...]); ...; rt.on_start(fn); ...
#
# Beyond the math/type/ref op surface, this also hosts the async/stateful op
# runtime (flow/setDelay+cancelDelay, variable/interpolate, pointer/
# interpolate, animation/start+stop+stopAt, flow/doN+multiGate+waitAll+
# throttle) and event/stopPropagation dispatch — every one of these mirrors
# packages/runtime/src/interpreter.ts's per-op case exactly (see
# packages/runtime-lib/src/engine.ts, this file's direct TS oracle).
#
# Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
# onHoverOut) is intentionally NOT ported here, same as the Lua backend —
# the official conformance corpus this backend targets never exercises it.
import re

from . import animation as anim
from . import pointer as ptr
from .numeric import safe_trunc
from .scheduler import create_scheduler
from .state import do_n_advance, multi_gate_advance, throttle_advance, wait_all_advance

_DEFAULT_SEED = 123456789
_ANIM_REF_RE = re.compile(r"^/animations/(\d+)$")


def _finite_num(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool) and x == x and x != float("inf") and x != float("-inf")


def _finite_arr(arr) -> bool:
    return all(_finite_num(x) for x in arr)


def _is_finite_raw(value) -> bool:
    if isinstance(value, list):
        return _finite_arr(value)
    return _finite_num(value) if not isinstance(value, str) else True


def _raw_to_kernel_value(t: str, raw) -> dict:
    if t == "bool":
        return {"type": t, "data": [bool(raw)]}
    if t == "ref":
        return {"type": t, "data": ["" if raw is None else str(raw)]}
    if t in ("int", "float"):
        n = raw if isinstance(raw, (int, float)) and not isinstance(raw, bool) else 0
        return {"type": t, "data": [n]}
    return {"type": t, "data": list(raw) if isinstance(raw, list) else [raw if isinstance(raw, (int, float)) else 0]}


def _kernel_value_to_raw(t: str, value: dict):
    if t == "bool":
        return bool(value["data"][0])
    if t == "ref":
        d = value["data"][0]
        return "" if d is None else str(d)
    if t in ("int", "float"):
        return value["data"][0]
    return list(value["data"])


def _parse_animation_ref(gltf, ref):
    if not isinstance(ref, str):
        return None
    match = _ANIM_REF_RE.match(ref)
    if not match:
        return None
    index = int(match.group(1))
    animations = gltf.get("animations") if isinstance(gltf, dict) else None
    if animations is not None and 0 <= index < len(animations) and animations[index] is not None:
        return index
    return None


class _VarAccessor:
    """Named accessor returned per-entry by the dict-form `vars()` (see
    Engine.vars) — closes over its own numeric index exactly like engine.ts's
    VarAccessor, so emit-py's `V["<name>"].get()/.set(v)` calls need no index
    at all in the generated text."""

    __slots__ = ("_engine", "_index")

    def __init__(self, engine: "Engine", index: int):
        self._engine = engine
        self._index = index

    def get(self):
        return self._engine._var_raw[self._index]

    def set(self, value) -> None:
        self._engine._var_raw[self._index] = value


class Engine:
    def __init__(self, setup, gltf=None, glb_bin=None, seed: float = _DEFAULT_SEED, on_pointer_set=None):
        self._var_types: list = []
        self._var_raw: list = []
        self._event_decls: list = []
        self._on_start_handlers: list = []
        self._on_tick_handlers: list = []
        self._on_receive_handlers: dict = {}
        self._sent_events: list = []
        self._event_out_registers: dict = {}
        self._last_payload_by_index: dict = {}
        self._gltf = gltf
        self._glb_bin = glb_bin
        self._random_state = int(seed)
        self._stopped_events: set = set()
        self._delay_owners: dict = {}
        self._animation_playheads: dict = {}
        self._on_pointer_set = on_pointer_set

        self._pointer_host = {
            "gltf": self._gltf,
            "isDelayActive": lambda ref: self._scheduler.is_delay_active(ref),
            "isAnimationPlaying": lambda index: self._scheduler.is_animation_playing(index),
            "getAnimationPlayhead": lambda index: self._animation_playheads.get(
                index, {"playhead": 0.0, "virtualPlayhead": 0.0}
            ),
            "activeCameraPosition": None,
            "activeCameraRotation": None,
            "onPointerSet": self._on_pointer_set,
        }
        self._accessor_host = {"gltf": self._gltf, "glbBin": self._glb_bin}

        effects = {
            "fireFlow": lambda cont: cont(),
            "applyAnimationSample": self._apply_animation_sample,
            "setPointer": self._effect_set_pointer,
            "setVariable": self._effect_set_variable,
            "onTickPhase": self._on_tick_phase,
        }
        self._scheduler = create_scheduler(effects)

        setup(self)

    # -- internal effects --------------------------------------------------

    def _step_random(self) -> int:
        self._random_state = (1664525 * self._random_state + 1013904223) & 0xFFFFFFFF
        return self._random_state

    def _apply_animation_sample(self, animation_index, requested_time) -> None:
        def on_write(pointer, value):
            if self._on_pointer_set:
                self._on_pointer_set(pointer, value)

        result = anim.apply_animation_at(self._accessor_host, animation_index, requested_time, on_write)
        if result is None:
            return
        self._animation_playheads[animation_index] = {"playhead": result["t"], "virtualPlayhead": requested_time}

    def _effect_set_pointer(self, pointer, value) -> None:
        ptr.write_pointer_raw(self._gltf, pointer, value)
        if self._on_pointer_set:
            self._on_pointer_set(pointer, value)

    def _effect_set_variable(self, variable_index, value) -> None:
        t = self._var_types[variable_index] if variable_index < len(self._var_types) else value["type"]
        self._var_raw[variable_index] = _kernel_value_to_raw(t, value)

    def _on_tick_phase(self) -> None:
        for handler in self._on_tick_handlers:
            tst = 0.0 if self._scheduler.tick_count == 0 else self._scheduler.time
            handler(tst, self._scheduler.last_tick_delta)

    # -- builder ("rt.*") API, snake_case, called only from setup() --------

    # Additive dict-shaped `rt.vars(...)` form (see docs/design/ir-and-
    # transpiler.md's IR->Python section and @gltfi/emit-py's emitVars doc
    # comment): `rt.vars({"counter1": rt.int_(0), ...})` — dict insertion
    # order IS the variable index order in Python 3.7+ (the load-bearing
    # contract this relies on, same as the array form's element order).
    # Returns a plain dict of named accessors, one per key
    # (`V["counter1"].get()`/`.set(v)` — subscript, not attribute, access:
    # unlike Lua/TS identifiers, a variable's display name is never
    # guaranteed usable as a Python attribute name verbatim, so this always
    # goes through a dict rather than dynamic attributes); the OLD array
    # form (list of bare `{"type":...,"initial":...}` dicts, still used by
    # hand-written callers — see packages/runtime-py/test/harness.test.ts)
    # returns None.
    def vars(self, decls):
        if isinstance(decls, dict):
            accessors = {}
            for name, decl in decls.items():
                idx = len(self._var_types)
                self._var_types.append(decl["type"])
                self._var_raw.append(decl["initial"])
                accessors[name] = _VarAccessor(self, idx)
            return accessors
        for decl in decls:
            self._var_types.append(decl["type"])
            self._var_raw.append(decl["initial"])
        return None

    def get_var(self, index: int):
        return self._var_raw[index]

    def set_var(self, index: int, value) -> None:
        self._var_raw[index] = value

    # Additive dict-shaped `rt.events(...)` form — same insertion-order-is-
    # index-order contract as vars() above. Returns a plain name->index dict
    # (a bare `int`, exactly what send()/on_receive()'s first parameter
    # already accepts).
    def events(self, decls):
        if isinstance(decls, dict):
            out = {}
            for name, decl in decls.items():
                idx = len(self._event_decls)
                self._event_decls.append(decl)
                out[name] = idx
            return out
        self._event_decls.extend(decls)
        return None

    # Variable-declaration-shorthand helpers, usable as `rt.vars({"counter1":
    # rt.int_(0), ...})` values — each just builds the same
    # `{"type":...,"initial":...}` dict the array form's elements always
    # were. Named with a trailing underscore (`int_`, `float_`, `bool_`,
    # `ref_`) since `int`/`float`/`bool` are Python builtins — mirrors
    # emit-py's own PY_RENAME convention for m.* function names, applied
    # here too for the same reason. Defaults match engine.ts's identical
    # helpers.
    def int_(self, x: int = 0) -> dict:
        return {"type": "int", "initial": int(x)}

    def bool_(self, x: bool = False) -> dict:
        return {"type": "bool", "initial": bool(x)}

    def float_(self, x: float = 0.0) -> dict:
        return {"type": "float", "initial": float(x)}

    def float2(self, x: float = 0.0, y: float = 0.0) -> dict:
        return {"type": "float2", "initial": [x, y]}

    def float3(self, x: float = 0.0, y: float = 0.0, z: float = 0.0) -> dict:
        return {"type": "float3", "initial": [x, y, z]}

    def float4(self, x: float = 0.0, y: float = 0.0, z: float = 0.0, w: float = 0.0) -> dict:
        return {"type": "float4", "initial": [x, y, z, w]}

    def float2x2(self, *values: float) -> dict:
        return {"type": "float2x2", "initial": list(values) if values else [1.0, 0.0, 0.0, 1.0]}

    def float3x3(self, *values: float) -> dict:
        return {"type": "float3x3", "initial": list(values) if values else [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]}

    def float4x4(self, *values: float) -> dict:
        return {
            "type": "float4x4",
            "initial": list(values)
            if values
            else [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
        }

    def ref_(self, pointer: str = "") -> dict:
        return {"type": "ref", "initial": pointer}

    # State-slot factories — plain dicts with the exact shape @gltfi/emit-py
    # used to write out literally (see emitStateSlots' previous inline
    # `{"count": 0.0}`/etc — kept byte-for-byte identical here, just
    # centralized).
    def do_n_state(self) -> dict:
        return {"count": 0.0}

    def multi_gate_state(self) -> dict:
        return {"lastIndex": -1.0, "used": []}

    def wait_all_state(self) -> dict:
        return {"activated": []}

    def throttle_state(self) -> dict:
        return {"remaining": float("nan")}

    def delay_state(self) -> dict:
        return {"lastId": -1.0, "lastRef": "", "ids": []}

    def on_start(self, fn) -> None:
        self._on_start_handlers.append(fn)

    def on_tick(self, fn) -> None:
        self._on_tick_handlers.append(fn)

    def on_receive(self, event_index: int, fn) -> None:
        self._on_receive_handlers.setdefault(event_index, []).append(fn)

    # Combined signature covering three call shapes (mirrors engine.ts's
    # send exactly): the OLD `(event_index, external_id, payload)`
    # (external_id is IGNORED — it's looked up from this engine's own
    # eventDecls table instead, fully redundant with event_index/the
    # `E["<name>"]` ref that names it), the additive `(event_index,
    # payload)`, and `(event_index)` alone when every payload value equals
    # the event's own declared default (see emit-py's emitEvent doc
    # comment) — no second argument at all in that case. Distinguished by
    # VALUE shape (a list is always a payload; a str or None never is), not
    # position.
    def send(self, event_index: int, second_arg=None, third_arg=None) -> None:
        decl = self._event_decls[event_index] if event_index < len(self._event_decls) else None
        if isinstance(second_arg, list):
            payload = second_arg
        elif isinstance(third_arg, list):
            payload = third_arg
        else:
            payload = [
                (decl or {}).get("defaultBool", False),
                (decl or {}).get("defaultInt", 0),
                (decl or {}).get("defaultFloat", 0.0),
                (decl or {}).get("expectedDuration", 0.0),
            ]
        external_id = (decl or {}).get("externalId")
        self._sent_events.append({"eventIndex": event_index, "externalId": external_id, "payload": payload})
        self._last_payload_by_index[event_index] = payload
        event_ref = f"event:custom:{event_index}"
        self._stopped_events.discard(event_ref)
        for handler in list(self._on_receive_handlers.get(event_index, [])):
            if event_ref in self._stopped_events:
                break
            handler(payload)
        self._stopped_events.discard(event_ref)

    def log(self, template, args=None) -> None:
        pass  # debug/log has no effect on pass/fail; intentionally a no-op.

    def stop_propagation(self, event_ref, stop_immediate) -> None:
        if stop_immediate and event_ref:
            self._stopped_events.add(event_ref)

    def event_out(self, node_key, socket, value) -> None:
        self._event_out_registers[f"{node_key}:{socket}"] = value

    def event_out_read(self, node_key, socket):
        return self._event_out_registers.get(f"{node_key}:{socket}")

    def event_payload(self, event_index: int) -> list:
        sent = self._last_payload_by_index.get(event_index)
        if sent:
            return sent
        decl = self._event_decls[event_index] if event_index < len(self._event_decls) else None
        b = (decl or {}).get("defaultBool", False)
        i = (decl or {}).get("defaultInt", 0)
        f = (decl or {}).get("defaultFloat", 0)
        d = (decl or {}).get("expectedDuration", 0)
        return [b, i, f, d]

    def tick_time(self) -> float:
        return 0.0 if self._scheduler.tick_count == 0 else self._scheduler.time

    def tick_delta(self) -> float:
        return self._scheduler.last_tick_delta

    def random(self) -> float:
        return self._step_random() / 4294967295

    # Combined signature covering both the dict-args form (unchanged) and an
    # additive args-less form for when every pointer-template parameter is a
    # compile-time constant (see emit-py's pointerCall — it inlines constant
    # template args straight into the path string, so there's nothing left
    # to pass in an args dict at all): `args_or_type` is either the args
    # dict (3-arg form omitted) or, when it's a `str`, IS the type signature
    # and the args dict was omitted entirely.
    def ptr_get(self, pointer: str, args_or_type, t: str = None) -> dict:
        if isinstance(args_or_type, str):
            return ptr.ptr_get(self._pointer_host, pointer, {}, args_or_type)
        return ptr.ptr_get(self._pointer_host, pointer, args_or_type, t)

    def ptr_set(self, pointer: str, args_or_type, type_or_value, value=None) -> bool:
        if isinstance(args_or_type, str):
            return ptr.ptr_set(self._pointer_host, pointer, {}, args_or_type, type_or_value)
        return ptr.ptr_set(self._pointer_host, pointer, args_or_type, type_or_value, value)

    # -- async ops (flow/setDelay, variable/interpolate, pointer/interpolate,
    # animation/start|stop|stopAt) ------------------------------------------

    def set_delay(self, slot: dict, duration: float, done=None) -> dict:
        if not _finite_num(duration) or duration < 0:
            return {"ok": False}
        handle = self._scheduler.allocate_delay_id()
        slot["lastId"] = handle["id"]
        slot["lastRef"] = handle["ref"]
        slot["ids"].append(handle["id"])
        self._delay_owners[handle["id"]] = slot
        if done:
            hid = handle["id"]

            def on_fire():
                slot["ids"] = [i for i in slot["ids"] if i != hid]
                self._delay_owners.pop(hid, None)
                done()

            self._scheduler.schedule_delay(handle["id"], handle["ref"], duration, on_fire)
        return {"ok": True}

    def cancel_delay(self, ref) -> None:
        if not isinstance(ref, str) or not ref:
            return
        found = self._scheduler.find_delay_by_ref(ref)
        if not found:
            return
        self._scheduler.cancel_delay(found["id"])
        owner = self._delay_owners.pop(found["id"], None)
        if owner:
            owner["ids"] = [i for i in owner["ids"] if i != found["id"]]

    def cancel_delay_slot(self, slot: dict) -> None:
        for id_ in slot["ids"]:
            self._scheduler.cancel_delay(id_)
            self._delay_owners.pop(id_, None)
        slot["ids"] = []
        slot["lastId"] = -1
        slot["lastRef"] = ""

    def var_interp(self, var_id: int, value, duration: float, p1: list, p2: list, use_slerp: bool, done=None) -> dict:
        t = self._var_types[var_id] if var_id < len(self._var_types) else "float"
        end_kernel = _raw_to_kernel_value(t, value)
        is_valid = (
            _finite_num(duration) and duration > 0 and _is_finite_raw(value) and _finite_arr(p1) and _finite_arr(p2)
        )
        if not is_valid:
            return {"ok": False}
        start_kernel = _raw_to_kernel_value(t, self._var_raw[var_id])
        self._scheduler.add_variable_interp({
            "variableIndex": var_id,
            "duration": duration,
            "startValue": start_kernel,
            "endValue": end_kernel,
            "p1": [p1[0] if len(p1) > 0 else 0, p1[1] if len(p1) > 1 else 0],
            "p2": [p2[0] if len(p2) > 0 else 0, p2[1] if len(p2) > 1 else 0],
            "useSlerp": use_slerp,
            "doneCont": done,
        })
        return {"ok": True}

    # Combined signature — see ptr_get/ptr_set's identical dispatch above for
    # the args-less form this also accepts (every following positional
    # parameter shifts left by one when `args_or_type` is a `str`, i.e. IS
    # the type signature).
    def ptr_interp(
        self, pointer: str, args_or_type, type_or_value, value_or_duration=None, duration_or_p1=None, p1_or_p2=None, p2_or_done=None, done_maybe=None
    ) -> dict:
        if isinstance(args_or_type, str):
            args, t, value, duration, p1, p2, done = {}, args_or_type, type_or_value, value_or_duration, duration_or_p1, p1_or_p2, p2_or_done
        else:
            args, t, value, duration, p1, p2, done = args_or_type, type_or_value, value_or_duration, duration_or_p1, p1_or_p2, p2_or_done, done_maybe
        prep = ptr.ptr_interp_prepare(self._pointer_host, pointer, args, t)
        if not prep:
            return {"ok": False}
        if not _finite_num(duration) or duration < 0:
            return {"ok": False}
        p10 = p1[0] if len(p1) > 0 else 0
        p20 = p2[0] if len(p2) > 0 else 0
        if not _finite_arr(p1) or not _finite_arr(p2) or p10 < 0 or p10 > 1 or p20 < 0 or p20 > 1:
            return {"ok": False}
        if isinstance(value, list):
            target = [float(x) for x in value]
        else:
            target = [float(value)]
        self._scheduler.add_pointer_interp({
            "pointer": prep["resolved"],
            "duration": duration,
            "startValue": prep["startValue"],
            "endValue": target,
            "p1": [p10, p1[1] if len(p1) > 1 else 0],
            "p2": [p20, p2[1] if len(p2) > 1 else 0],
            "isQuaternion": prep["resolved"].endswith("/rotation"),
            "doneCont": done,
        })
        return {"ok": True}

    def anim_start(self, animation_ref, start_time: float, end_time: float, speed: float, done=None) -> dict:
        index = _parse_animation_ref(self._gltf, animation_ref)
        if index is None or not _finite_num(start_time) or end_time != end_time or not _finite_num(speed) or speed <= 0:
            return {"ok": False}
        self._scheduler.start_animation(
            {"animationIndex": index, "startTime": start_time, "endTime": end_time, "speed": speed, "endCont": done}
        )
        return {"ok": True}

    def anim_stop(self, animation_ref) -> dict:
        index = _parse_animation_ref(self._gltf, animation_ref)
        if index is None:
            return {"ok": False}
        self._scheduler.stop_animation(index)
        return {"ok": True}

    def anim_stop_at(self, animation_ref, stop_time: float, done=None) -> dict:
        index = _parse_animation_ref(self._gltf, animation_ref)
        if index is None or stop_time != stop_time:
            return {"ok": False}
        self._scheduler.stop_animation_at(index, stop_time, done)
        return {"ok": True}

    # -- stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle)

    # Returns the fire decision directly (not `{"fire": ...}`) — the only
    # non-additive shape change in this surface (mirrors engine.ts's
    # identical change exactly): every real call site checks this exactly
    # once (`if rt.do_n(...):`), so there was never a reason to name an
    # intermediate result — see emit-py's emitStateful, which now inlines
    # the call straight into the `if`.
    def do_n(self, slot: dict, n: float) -> bool:
        decision = do_n_advance(slot["count"], safe_trunc(n))
        slot["count"] = decision["count"]
        return decision["fire"]

    def multi_gate(self, slot: dict, output_count: int, is_random: bool, is_loop: bool) -> dict:
        def random_index(count: int) -> int:
            if count <= 0:
                return 0
            return self._step_random() % count

        decision = multi_gate_advance(slot["used"], output_count, is_random, is_loop, random_index)
        slot["used"] = decision["used"]
        if decision["index"] >= 0:
            slot["lastIndex"] = decision["index"]
        return {"index": decision["index"]}

    def wait_all(self, slot: dict, input_flows: int, index: int) -> dict:
        decision = wait_all_advance(slot["activated"], slot.get("remaining"), input_flows, index)
        slot["activated"] = decision["activated"]
        slot["remaining"] = decision["remaining"]
        return {"completed": decision["completed"]}

    def throttle(self, slot: dict, duration: float) -> dict:
        if not _finite_num(duration) or duration < 0:
            return {"invalid": True, "fire": False}
        decision = throttle_advance(slot.get("lastTime"), duration, self._scheduler.time)
        slot["lastTime"] = decision["lastTime"]
        slot["remaining"] = decision["remaining"]
        return {"invalid": False, "fire": decision["fire"]}

    # -- instance (harness-facing) API --------------------------------------

    def start(self) -> None:
        for handler in self._on_start_handlers:
            handler()

    def advance(self, dt: float) -> None:
        self._scheduler.advance(dt)

    def get_variable_by_index(self, index: int) -> dict:
        t = self._var_types[index] if index < len(self._var_types) else "float"
        return _raw_to_kernel_value(t, self._var_raw[index])

    @property
    def variable_count(self) -> int:
        return len(self._var_types)

    @property
    def sent_events(self) -> list:
        return self._sent_events

    @property
    def time(self) -> float:
        return self._scheduler.time

    @property
    def event_defaults(self) -> list:
        return [d.get("expectedDuration") for d in self._event_decls]


def create_engine(setup):
    def factory(gltf=None, glb_bin=None, seed: float = _DEFAULT_SEED, on_pointer_set=None) -> Engine:
        return Engine(setup, gltf=gltf, glb_bin=glb_bin, seed=seed, on_pointer_set=on_pointer_set)

    return factory
