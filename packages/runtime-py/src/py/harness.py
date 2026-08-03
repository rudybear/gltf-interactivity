#!/usr/bin/env python3
"""Persistent conformance-runner harness for the compiled Python backend.

Speaks line-delimited JSON over stdin/stdout (see packages/conformance/src/
run-compiled-py.ts, which spawns exactly ONE of these processes for the whole
run and drives it as an EngineLike over this protocol via a pair of named
pipes wired up as this process's actual stdin/stdout — see that file's header
for why: EngineLike's contract (judgeTest, protocol.ts) is fully synchronous,
so the Node side needs a genuinely BLOCKING round trip per command, which
plain child_process pipes don't support without that trick). One request per
line in, one response per line out, never buffered/batched.

Commands (one-line JSON objects on stdin):
  {"cmd":"load", "module_path":<str>, "gltf":<json|null>, "bin_b64":<str|null>}
  {"cmd":"reset"}
  {"cmd":"start"}
  {"cmd":"advance", "dt":<num>}
  {"cmd":"get_var", "i":<int>}
  {"cmd":"sent_events"}
  {"cmd":"event_defaults"}
  {"cmd":"eval_m", "fn":<str>, "args":[...]}   -- vitest math-parity spot checks only
  {"cmd":"ping"}

Every response is a one-line JSON object `{"ok": true, ...}` or, on ANY
exception (including a Python traceback raised from inside the dynamically
loaded compiled module itself — e.g. a bug in emit-py's output, or a
malformed graph), `{"ok": false, "error": "...", "traceback": "..."}` — the
caller surfaces that as a single test failure rather than the whole process
(and the other 144 tests' worth of run) going down with it.

Wire encoding: plain JSON has no way to represent NaN/Infinity/-Infinity, and
while Python's `json` module has a non-standard extension for it (emitting
bare `NaN`/`Infinity` tokens), Node's `JSON.parse` does not accept those
tokens, so relying on it would desync the two sides mid-run. Every numeric
leaf that might carry a non-finite KHR_interactivity value is instead encoded
as the STRING "NaN" / "Infinity" / "-Infinity" (enc_num/dec_num below);
finite numbers, bools, and ordinary strings cross the wire untouched. The
counterpart encode/decode lives in run-compiled-py.ts.
"""
import base64
import importlib.util
import json
import math
import os
import sys
import traceback

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if _THIS_DIR not in sys.path:
    sys.path.insert(0, _THIS_DIR)

import gltfi_runtime as rt_pkg  # noqa: E402  (path insert above must run first)


def enc_num(x):
    if isinstance(x, bool):
        return x
    if isinstance(x, float):
        if x != x:
            return "NaN"
        if x == math.inf:
            return "Infinity"
        if x == -math.inf:
            return "-Infinity"
        return x
    return x


def enc_list(xs):
    return [enc_num(x) for x in xs]


def dec_num(x):
    if isinstance(x, str):
        if x == "NaN":
            return float("nan")
        if x == "Infinity":
            return math.inf
        if x == "-Infinity":
            return -math.inf
    return x


def dec_any(x):
    if isinstance(x, list):
        return [dec_any(v) for v in x]
    return dec_num(x)


def enc_any(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, float):
        return enc_num(value)
    if isinstance(value, list):
        return [enc_any(v) for v in value]
    if isinstance(value, dict):
        return {k: enc_any(v) for k, v in value.items()}
    return value


class Harness:
    def __init__(self):
        self._factory = None
        self._gltf = None
        self._bin = None
        self._engine = None
        self._module_counter = 0

    def cmd_load(self, req):
        module_path = req["module_path"]
        self._gltf = req.get("gltf")
        bin_b64 = req.get("bin_b64")
        self._bin = base64.b64decode(bin_b64) if bin_b64 else None
        self._module_counter += 1
        module_name = f"_gltfi_compiled_{self._module_counter}"
        spec = importlib.util.spec_from_file_location(module_name, module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self._factory = rt_pkg.create_engine(module.build)
        self._engine = self._factory(gltf=self._gltf, glb_bin=self._bin, seed=123456789.0)
        return {"ok": True, "time": enc_num(self._engine.time)}

    def cmd_reset(self, req):
        if self._factory is None:
            raise RuntimeError("reset called before load")
        self._engine = self._factory(gltf=self._gltf, glb_bin=self._bin, seed=123456789.0)
        return {"ok": True, "time": enc_num(self._engine.time)}

    def cmd_start(self, req):
        self._engine.start()
        return {"ok": True, "time": enc_num(self._engine.time)}

    def cmd_advance(self, req):
        dt = dec_num(req["dt"])
        self._engine.advance(dt)
        return {"ok": True, "time": enc_num(self._engine.time)}

    def cmd_time(self, req):
        return {"ok": True, "time": enc_num(self._engine.time)}

    def cmd_variable_count(self, req):
        return {"ok": True, "count": self._engine.variable_count}

    def cmd_get_var(self, req):
        value = self._engine.get_variable_by_index(req["i"])
        return {"ok": True, "type": value["type"], "data": enc_list(value["data"])}

    def cmd_sent_events(self, req):
        out = []
        for sent in self._engine.sent_events:
            payload = sent["payload"]
            out.append({
                "eventIndex": sent["eventIndex"],
                "payload": enc_list([bool(payload[0]), payload[1], payload[2], payload[3]]),
            })
        return {"ok": True, "events": out}

    def cmd_event_defaults(self, req):
        return {"ok": True, "defaults": [None if d is None else enc_num(d) for d in self._engine.event_defaults]}

    # Vitest math-parity spot checks only — never used by the conformance
    # runner itself, which only exercises m.* indirectly through compiled
    # modules. Lets test/*.test.ts drive gltfi_runtime.m functions directly
    # through the same harness process/protocol used for real runs.
    def cmd_eval_m(self, req):
        fn = getattr(rt_pkg.m, req["fn"])
        args = [dec_any(a) for a in req.get("args", [])]
        return {"ok": True, "result": enc_any(fn(*args))}

    def cmd_ping(self, req):
        return {"ok": True}

    def handle(self, req):
        cmd = req.get("cmd")
        method = getattr(self, f"cmd_{cmd}", None)
        if method is None:
            return {"ok": False, "error": f"unknown command {cmd!r}"}
        return method(req)


def main():
    harness = Harness()
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = harness.handle(req)
        except Exception as exc:  # noqa: BLE001 - surface every failure to the caller, never crash the process
            resp = {"ok": False, "error": str(exc), "traceback": traceback.format_exc()}
        sys.stdout.write(json.dumps(resp) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
