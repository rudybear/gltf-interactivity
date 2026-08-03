# Pure state-machine transitions for the KHR_interactivity stateful flow
# nodes (doN, multiGate, waitAll, throttle). Transcribed from
# packages/runtime-py/src/py/gltfi_runtime/state.py (itself transcribed from
# packages/kernel/src/state.ts). Each function returns a plain Dictionary
# carrying both the next state and the decision the caller (engine.gd) acts
# on. 0-based Arrays throughout, matching the TS/Python sources exactly.
extends RefCounted


static func doNAdvance(count: float, n: float) -> Dictionary:
	if count < n:
		return {"fire": true, "count": count + 1.0}
	return {"fire": false, "count": count}


# randomIndex is a Callable(int) -> int returning a 0-based index in
# [0, count) — same contract as the TS/Python source's callback (see
# engine.gd's `multi_gate`).
static func multiGateAdvance(used_in: Array, output_count: int, is_random: bool, is_loop: bool, random_index: Callable) -> Dictionary:
	var used: Array = used_in.duplicate() if used_in.size() == output_count else []
	if used.is_empty():
		for i in range(output_count):
			used.append(false)
	var index := -1
	if not is_random:
		for i in range(output_count):
			if not used[i]:
				index = i
				break
	else:
		var available := []
		for i in range(output_count):
			if not used[i]:
				available.append(i)
		if available.size() > 0:
			index = available[random_index.call(available.size())]
	if index == -1 and is_loop:
		used = []
		for i in range(output_count):
			used.append(false)
		index = random_index.call(output_count) if is_random else 0
	if index >= 0:
		used[index] = true
	return {"used": used, "index": index}


# remaining_in may be null (unset) — the TS/Python source's `remainingIn ??
# inputFlows`. Always rebuilds a fresh length-input_flows Array (padding with
# false for anything activated_in doesn't cover), same defensive padding
# state.py needed for out-of-bounds reads (GDScript Arrays raise/clamp on
# out-of-bounds access same as Python lists do, unlike JS's tolerant
# out-of-bounds-read-returns-undefined arrays).
static func waitAllAdvance(activated_in: Array, remaining_in, input_flows: int, index: int) -> Dictionary:
	var activated := []
	for i in range(input_flows):
		activated.append(bool(activated_in[i]) if i < activated_in.size() else false)
	var remaining: float = float(input_flows) if remaining_in == null else remaining_in
	if index >= 0 and index < input_flows:
		if not activated[index]:
			activated[index] = true
			remaining = remaining - 1.0
	return {"activated": activated, "remaining": remaining, "completed": remaining <= 0.0}


# last_time_in may be null (unset) — the TS/Python source's `lastTimeIn ??
# -Infinity`.
static func throttleAdvance(last_time_in, duration: float, now: float) -> Dictionary:
	var last: float = -INF if last_time_in == null else last_time_in
	var elapsed: float = now - last
	if elapsed >= duration:
		return {"fire": true, "lastTime": now, "remaining": 0.0}
	return {"fire": false, "lastTime": last, "remaining": maxf(0.0, duration - elapsed)}
