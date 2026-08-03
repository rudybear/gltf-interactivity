-- Pure state-machine transitions for the KHR_interactivity stateful flow
-- nodes (doN, multiGate, waitAll, throttle). Transcribed from
-- packages/kernel/src/state.ts. Each function returns a single Lua table
-- (named fields) carrying both the next state and the decision the caller
-- acts on — mirrors the TS source's return-object shape. `usedIn`/
-- `activatedIn` are 1-based Lua arrays of booleans with no nil gaps (never
-- stored with holes anywhere in this runtime), so Lua's `#` length operator
-- is exactly the TS source's `.length` — no separate length bookkeeping
-- needed.

function state_doNAdvance(count, n)
  if count < n then
    return { fire = true, count = count + 1 }
  end
  return { fire = false, count = count }
end

-- `randomIndex(count)` returns a 0-based index in [0, count) — same
-- contract as the TS source's callback (see engine.lua's `rt.multiGate`).
function state_multiGateAdvance(usedIn, outputCount, isRandom, isLoop, randomIndex)
  local used = {}
  if #usedIn == outputCount then
    for i = 1, outputCount do used[i] = usedIn[i] end
  else
    for i = 1, outputCount do used[i] = false end
  end
  local index = -1
  if not isRandom then
    for i = 1, outputCount do
      if not used[i] then
        index = i - 1
        break
      end
    end
  else
    local available = {}
    for i = 1, outputCount do
      if not used[i] then available[#available + 1] = i - 1 end
    end
    if #available > 0 then
      index = available[randomIndex(#available) + 1]
    end
  end
  if index == -1 and isLoop then
    for i = 1, outputCount do used[i] = false end
    if isRandom then
      index = randomIndex(outputCount)
    else
      index = 0
    end
  end
  if index >= 0 then
    used[index + 1] = true
  end
  return { used = used, index = index }
end

-- `remainingIn` may be nil (unset) — the TS source's `remainingIn ?? inputFlows`.
-- `activated` is always padded out to `inputFlows` entries (filling any gap
-- with `false`) rather than copied at whatever length `activatedIn` happens
-- to be: the TS source instead lets a JS array grow sparsely (holes read
-- back as `undefined`, which `!activated[index]` treats as falsy) — padding
-- with explicit `false` up front is the Lua-table-safe way to get the same
-- observable behavior without ever creating a table with a nil gap (which
-- would make Lua's `#` operator on it undefined behavior on the next call).
function state_waitAllAdvance(activatedIn, remainingIn, inputFlows, index)
  local activated = {}
  for i = 1, inputFlows do
    local v = activatedIn[i]
    if v == nil then v = false end
    activated[i] = v
  end
  local remaining = remainingIn
  if remaining == nil then remaining = inputFlows end
  if index >= 0 and index < inputFlows then
    if not activated[index + 1] then
      activated[index + 1] = true
      remaining = remaining - 1
    end
  end
  return { activated = activated, remaining = remaining, completed = remaining <= 0 }
end

-- `lastTimeIn` may be nil (unset) — the TS source's `lastTimeIn ?? -Infinity`.
function state_throttleAdvance(lastTimeIn, duration, now)
  local last = lastTimeIn
  if last == nil then last = -math.huge end
  local elapsed = now - last
  if elapsed >= duration then
    return { fire = true, lastTime = now, remaining = 0 }
  end
  return { fire = false, lastTime = last, remaining = math.max(0, duration - elapsed) }
end
