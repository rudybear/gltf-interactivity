-- Time/async scheduler for KHR_interactivity, transcribed from
-- packages/kernel/src/scheduler.ts. Owns the delay table, the variable- and
-- pointer-interpolation tables, the active-animation table, the current
-- time and tick counters, and implements the exact phase ordering: animation
-- playback, then pointer interpolations, then variable interpolations, then
-- due delays, then per-tick handler activation.
--
-- `effects` is a Lua table with the same five callbacks as TS's
-- SchedulerEffects<Cont> (fireFlow, applyAnimationSample, setPointer,
-- setVariable, onTickPhase) — see engine.lua's construction of it. `Cont`
-- is a plain Lua function (`function() ... end`), called via
-- `effects.fireFlow(cont)`.
--
-- Kernel `Value`s are Lua tables `{ type = "<ValueType>", data = <1-based
-- array or scalar-in-a-1-elem-array> }`, matching engine.lua's
-- raw<->kernel-Value boundary conversion.

local function scheduler_valueToNumberArray(value)
  if value.type == "bool" then
    local out = {}
    for i = 1, #value.data do
      if value.data[i] then out[i] = 1 else out[i] = 0 end
    end
    return out
  end
  return value.data
end

function scheduler_create(effects)
  local sched = {}
  sched.time = 0
  sched.tickCount = 0
  sched.lastTickDelta = 0 / 0

  local nextDelayId = 0
  local delays = {}
  local activeRefs = {}
  local variableInterps = {}
  local pointerInterps = {}
  local animations = {}

  function sched.allocateDelayId()
    local id = nextDelayId
    nextDelayId = nextDelayId + 1
    local ref = "delay:" .. id
    activeRefs[ref] = true
    return { id = id, ref = ref }
  end

  function sched.scheduleDelay(id, ref, duration, cont)
    delays[#delays + 1] = { id = id, ref = ref, time = sched.time + duration, cont = cont }
  end

  function sched.addDelay(duration, cont)
    local handle = sched.allocateDelayId()
    sched.scheduleDelay(handle.id, handle.ref, duration, cont)
    return handle
  end

  function sched.cancelDelay(id)
    for i = 1, #delays do
      if delays[i].id == id then
        local found = delays[i]
        table.remove(delays, i)
        activeRefs[found.ref] = nil
        return found
      end
    end
    return nil
  end

  function sched.findDelayById(id)
    for i = 1, #delays do
      if delays[i].id == id then return delays[i] end
    end
    return nil
  end

  function sched.findDelayByRef(ref)
    for i = 1, #delays do
      if delays[i].ref == ref then return delays[i] end
    end
    return nil
  end

  function sched.isDelayActive(ref)
    return activeRefs[ref] == true
  end

  function sched.addVariableInterp(params)
    sched.killVariableInterp(params.variableIndex)
    params.startTime = sched.time
    variableInterps[#variableInterps + 1] = params
  end

  function sched.killVariableInterp(variableIndex)
    local kept = {}
    for _, item in ipairs(variableInterps) do
      if item.variableIndex ~= variableIndex then kept[#kept + 1] = item end
    end
    variableInterps = kept
  end

  function sched.addPointerInterp(params)
    sched.killPointerInterp(params.pointer)
    params.startTime = sched.time
    pointerInterps[#pointerInterps + 1] = params
  end

  function sched.killPointerInterp(pointer)
    local kept = {}
    for _, item in ipairs(pointerInterps) do
      if item.pointer ~= pointer then kept[#kept + 1] = item end
    end
    pointerInterps = kept
  end

  function sched.startAnimation(params)
    local kept = {}
    for _, state in ipairs(animations) do
      if state.animationIndex ~= params.animationIndex then kept[#kept + 1] = state end
    end
    kept[#kept + 1] = {
      animationIndex = params.animationIndex,
      startTime = params.startTime,
      endTime = params.endTime,
      stopTime = params.endTime,
      speed = params.speed,
      entryCreation = sched.time,
      endCont = params.endCont,
      stopCont = nil
    }
    animations = kept
  end

  function sched.stopAnimation(animationIndex)
    local kept = {}
    for _, state in ipairs(animations) do
      if state.animationIndex ~= animationIndex then kept[#kept + 1] = state end
    end
    animations = kept
  end

  function sched.stopAnimationAt(animationIndex, stopTime, stopCont)
    for _, entry in ipairs(animations) do
      if entry.animationIndex == animationIndex then
        entry.stopTime = stopTime
        entry.stopCont = stopCont
        return true
      end
    end
    return false
  end

  function sched.isAnimationPlaying(animationIndex)
    for _, state in ipairs(animations) do
      if state.animationIndex == animationIndex then return true end
    end
    return false
  end

  function sched.delayCount()
    return #delays
  end

  function sched.pointerInterpCount()
    return #pointerInterps
  end

  function sched.advance(delta)
    sched.time = sched.time + delta

    -- Phase 1: animation playback. Collect-then-fire: flows fire after the
    -- whole table has been advanced once.
    local finishedAnimations = {}
    local keptAnimations = {}
    for _, state in ipairs(animations) do
      local animationIndex, startTime, endTime, stopTime, speed, entryCreation, endCont, stopCont =
        state.animationIndex, state.startTime, state.endTime, state.stopTime, state.speed, state.entryCreation, state.endCont, state.stopCont
      local keep = true
      if startTime == endTime then
        effects.applyAnimationSample(animationIndex, startTime)
        if endCont ~= nil then finishedAnimations[#finishedAnimations + 1] = endCont end
        keep = false
      else
        local elapsed = math.max(0, sched.time - entryCreation)
        local scaled
        if startTime > endTime then scaled = -elapsed * speed else scaled = elapsed * speed end
        local current = startTime + scaled
        local forward = startTime < endTime
        local stopHit
        if forward then
          stopHit = current >= stopTime and stopTime >= startTime and stopTime < endTime
        else
          stopHit = current <= stopTime and stopTime <= startTime and stopTime > endTime
        end
        if stopHit then
          effects.applyAnimationSample(animationIndex, stopTime)
          if stopCont ~= nil then finishedAnimations[#finishedAnimations + 1] = stopCont end
          keep = false
        else
          local endHit
          if forward then endHit = current >= endTime else endHit = current <= endTime end
          if endHit then
            effects.applyAnimationSample(animationIndex, endTime)
            if endCont ~= nil then finishedAnimations[#finishedAnimations + 1] = endCont end
            keep = false
          else
            effects.applyAnimationSample(animationIndex, current)
          end
        end
      end
      if keep then keptAnimations[#keptAnimations + 1] = state end
    end
    animations = keptAnimations
    for _, cont in ipairs(finishedAnimations) do effects.fireFlow(cont) end

    -- Phase 2: object-model pointer interpolations. Same collect-then-fire
    -- shape as animations.
    local finishedPointerInterps = {}
    local keptPointerInterps = {}
    for _, interp in ipairs(pointerInterps) do
      local t
      if interp.duration > 0 then t = (sched.time - interp.startTime) / interp.duration else t = math.huge end
      local keep = true
      if t <= 0 then
        -- unchanged, keep waiting
      elseif t ~= t or t >= 1 then
        local target
        if #interp.endValue == 1 then target = interp.endValue[1] else target = interp.endValue end
        effects.setPointer(interp.pointer, target)
        if interp.doneCont ~= nil then finishedPointerInterps[#finishedPointerInterps + 1] = interp.doneCont end
        keep = false
      else
        local q = kmath_cubicBezierEase(t, interp.p1, interp.p2)
        local value
        if interp.isQuaternion then
          value = kmath_quatSlerp(interp.startValue, interp.endValue, q)
        else
          value = {}
          for idx = 1, #interp.startValue do
            value[idx] = interp.startValue[idx] + (interp.endValue[idx] - interp.startValue[idx]) * q
          end
        end
        local written
        if #value == 1 then written = value[1] else written = value end
        effects.setPointer(interp.pointer, written)
      end
      if keep then keptPointerInterps[#keptPointerInterps + 1] = interp end
    end
    pointerInterps = keptPointerInterps
    for _, cont in ipairs(finishedPointerInterps) do effects.fireFlow(cont) end

    -- Phase 3: variable interpolations. Unlike the two phases above, the
    -- done flow fires *inline*, mid-pass — copied verbatim from the TS
    -- source's mid-iteration array-mutation quirk: a done handler that
    -- itself starts a new interpolation pushes onto the SAME table
    -- (`variableInterps`, not yet reassigned) this pass is reading, at an
    -- index beyond `n` (captured below, before the loop starts) — so this
    -- pass never visits it, and once `variableInterps` is reassigned to
    -- the freshly-built `kept` list after the loop, that pushed entry
    -- (which only ever existed at a tail index of the OLD table) is gone,
    -- not deferred to next tick. This mirrors JS's Array#filter, which
    -- captures the array length once at the start and builds an entirely
    -- new result array — a push during the callback lands past that
    -- captured length and is silently absent from the result.
    local originalVariableInterps = variableInterps
    local n = #originalVariableInterps
    local keptVariableInterps = {}
    for idx = 1, n do
      local interp = originalVariableInterps[idx]
      local t = math.min(1, (sched.time - interp.startTime) / interp.duration)
      local ease = kmath_cubicBezierEase(t, interp.p1, interp.p2)
      if interp.useSlerp and interp.startValue.type == "float4" and interp.endValue.type == "float4" then
        local q = kmath_quatSlerp(scheduler_valueToNumberArray(interp.startValue), scheduler_valueToNumberArray(interp.endValue), ease)
        effects.setVariable(interp.variableIndex, { type = "float4", data = q })
      else
        local startArr = scheduler_valueToNumberArray(interp.startValue)
        local endArr = scheduler_valueToNumberArray(interp.endValue)
        local out = {}
        for i2 = 1, #startArr do out[i2] = startArr[i2] + (endArr[i2] - startArr[i2]) * ease end
        effects.setVariable(interp.variableIndex, { type = interp.endValue.type, data = out })
      end
      if t >= 1 then
        if interp.doneCont ~= nil then effects.fireFlow(interp.doneCont) end
      else
        keptVariableInterps[#keptVariableInterps + 1] = interp
      end
    end
    variableInterps = keptVariableInterps

    -- Phase 4: due delays. Two passes (collect "ready", then drop from the
    -- table) before any flow fires, same collect-then-fire shape as
    -- animations/pointer interpolations.
    local ready = {}
    local keptDelays = {}
    for _, item in ipairs(delays) do
      if item.time <= sched.time then ready[#ready + 1] = item else keptDelays[#keptDelays + 1] = item end
    end
    delays = keptDelays
    for _, item in ipairs(ready) do
      activeRefs[item.ref] = nil
      effects.fireFlow(item.cont)
    end

    -- Phase 5: per-tick handler activation, with tick bookkeeping updated
    -- around it.
    if delta > 0 then
      if sched.tickCount == 0 then sched.lastTickDelta = 0 / 0 else sched.lastTickDelta = delta end
      effects.onTickPhase()
      sched.tickCount = sched.tickCount + 1
    end
  end

  return sched
end
