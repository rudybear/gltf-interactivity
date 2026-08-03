# Pure state-machine transitions for the KHR_interactivity stateful flow
# nodes (doN, multiGate, waitAll, throttle). Transcribed from
# packages/kernel/src/state.ts. Each function returns a plain dict carrying
# both the next state and the decision the caller acts on (mirrors the TS
# source's return-object shape verbatim). 0-based lists throughout, matching
# the TS source exactly (no index-base conversion needed).
from typing import Callable, List, Optional


def do_n_advance(count: float, n: float) -> dict:
    if count < n:
        return {"fire": True, "count": count + 1}
    return {"fire": False, "count": count}


# randomIndex(count) returns a 0-based index in [0, count) — same contract as
# the TS source's callback (see engine.py's rt.multi_gate).
def multi_gate_advance(
    used_in: List[bool], output_count: int, is_random: bool, is_loop: bool, random_index: Callable[[int], int]
) -> dict:
    used = list(used_in) if len(used_in) == output_count else [False] * output_count
    index = -1
    if not is_random:
        for i in range(output_count):
            if not used[i]:
                index = i
                break
    else:
        available = [i for i in range(output_count) if not used[i]]
        if len(available) > 0:
            index = available[random_index(len(available))]
    if index == -1 and is_loop:
        used = [False] * output_count
        index = random_index(output_count) if is_random else 0
    if index >= 0:
        used[index] = True
    return {"used": used, "index": index}


# remaining_in may be None (unset) — the TS source's `remainingIn ?? inputFlows`.
#
# Unlike the TS oracle's `activatedIn.slice()` (safe there only because a
# too-short JS array tolerates an out-of-bounds READ, returning `undefined` —
# falsy, so `!activated[index]` below still behaves correctly even before
# any padding), a Python list raises IndexError on out-of-bounds access. This
# always rebuilds a fresh length-`input_flows` list (Lua's ported state.lua
# already needed the identical padding fix, for the same reason: Lua tables
# don't tolerate access patterns that would leave `#activated` undefined
# either), copying whatever prefix of `activated_in` is available and
# padding the rest with False.
def wait_all_advance(activated_in: List[bool], remaining_in: Optional[float], input_flows: int, index: int) -> dict:
    activated = [bool(activated_in[i]) if i < len(activated_in) else False for i in range(input_flows)]
    remaining = input_flows if remaining_in is None else remaining_in
    if 0 <= index < input_flows:
        if not activated[index]:
            activated[index] = True
            remaining = remaining - 1
    return {"activated": activated, "remaining": remaining, "completed": remaining <= 0}


# last_time_in may be None (unset) — the TS source's `lastTimeIn ?? -Infinity`.
def throttle_advance(last_time_in: Optional[float], duration: float, now: float) -> dict:
    last = float("-inf") if last_time_in is None else last_time_in
    elapsed = now - last
    if elapsed >= duration:
        return {"fire": True, "lastTime": now, "remaining": 0}
    return {"fire": False, "lastTime": last, "remaining": max(0.0, duration - elapsed)}
