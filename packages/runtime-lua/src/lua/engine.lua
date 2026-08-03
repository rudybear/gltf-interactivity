-- The compiled-engine runtime surface, transcribed from
-- packages/runtime-lib/src/engine.ts. `CreateEngine(setup)` builds a
-- factory; calling the factory builds a FRESH engine instance (own variable
-- storage, own RNG state, own scheduler, own event-output registers). The
-- emitted Lua module (see @gltfi/emit-lua) is exactly:
--
--   return function(rt) ... rt.vars(...); rt.onStart(function() ... end); ... end
--
-- Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
-- onHoverOut + fireSelect/fireHoverIn/fireHoverOut) is intentionally NOT
-- ported here — the official conformance corpus this Lua backend targets
-- (test-index.json/mathtests-index.json, driven via run-compiled-lua.ts)
-- never exercises it (same fact noted in engine.ts's own header: it's a
-- viewer-parity extra beyond the corpus, added there for apps/viewer, which
-- has no Lua counterpart). `rt.onStart`/`rt.onTick`/`rt.onReceive` and every
-- stateful/async op and the full math/type/ref op set — the corpus's
-- actual surface — are implemented in full below.

local ENGINE_DEFAULT_SEED = 123456789

local function engine_finiteNum(x)
  return type(x) == "number" and x == x and x ~= math.huge and x ~= -math.huge
end

local function engine_finiteArr(arr)
  for i = 1, #arr do
    if not engine_finiteNum(arr[i]) then return false end
  end
  return true
end

local function engine_isFiniteRaw(value)
  if type(value) == "number" then return engine_finiteNum(value) end
  if type(value) == "table" then return engine_finiteArr(value) end
  return true
end

local function engine_rawToKernelValue(t, raw)
  if t == "bool" then
    return { type = t, data = { raw and true or false } }
  end
  if t == "ref" then
    local s = raw
    if s == nil then s = "" end
    return { type = t, data = { tostring(s) } }
  end
  if t == "int" or t == "float" then
    local n = raw
    if type(n) ~= "number" then n = tonumber(n) or 0 end
    return { type = t, data = { n } }
  end
  local out = {}
  if type(raw) == "table" then
    for i = 1, #raw do out[i] = raw[i] end
  else
    out[1] = tonumber(raw) or 0
  end
  return { type = t, data = out }
end

local function engine_kernelValueToRaw(t, value)
  if t == "bool" then return value.data[1] and true or false end
  if t == "ref" then
    local s = value.data[1]
    if s == nil then return "" end
    return tostring(s)
  end
  if t == "int" or t == "float" then return value.data[1] end
  local out = {}
  for i = 1, #value.data do out[i] = value.data[i] end
  return out
end

-- Mirrors interpreter.ts's parseAnimationRef: a ref-typed value is only a
-- valid animation reference when it's literally "/animations/<n>" and that
-- animation exists in the document. Returns a 0-based animation index.
local function engine_parseAnimationRef(gltf, ref)
  if type(ref) ~= "string" then return nil end
  local idxStr = ref:match("^/animations/(%d+)$")
  if not idxStr then return nil end
  local index = tonumber(idxStr)
  if gltf and gltf.animations and gltf.animations[index + 1] then return index end
  return nil
end

function CreateEngine(setup)
  return function(options)
    options = options or {}
    local varTypes = {}
    local varRaw = {}
    local eventDecls = {}
    local onStartHandlers = {}
    local onTickHandlers = {}
    local onReceiveHandlers = {}
    local sentEvents = {}
    local eventOutRegisters = {}
    local lastPayloadByIndex = {}
    local gltf = options.gltf
    local glbBin = options.glbBin
    local randomState = options.seed or ENGINE_DEFAULT_SEED
    local stoppedEvents = {}
    local delayOwners = {}
    local animationPlayheads = {}
    local scheduler -- forward declaration; assigned below, used by closures created before that point

    local function stepRandom()
      randomState = (1664525 * randomState + 1013904223) % 4294967296
      return randomState
    end

    local pointerHost = {
      gltf = gltf,
      isDelayActive = function(ref) return scheduler.isDelayActive(ref) end,
      isAnimationPlaying = function(index) return scheduler.isAnimationPlaying(index) end,
      getAnimationPlayhead = function(index)
        return animationPlayheads[index] or { playhead = 0, virtualPlayhead = 0 }
      end,
      activeCameraPosition = nil,
      activeCameraRotation = nil,
      onPointerSet = options.onPointerSet
    }
    local accessorHost = { gltf = gltf, glbBin = glbBin }

    local effects = {
      fireFlow = function(cont) cont() end,
      applyAnimationSample = function(animationIndex, requestedTime)
        local result = anim_applyAnimationAt(accessorHost, animationIndex, requestedTime, function(pointer, value)
          if options.onPointerSet then options.onPointerSet(pointer, value) end
        end)
        if result == nil then return end
        animationPlayheads[animationIndex] = { playhead = result.t, virtualPlayhead = requestedTime }
      end,
      setPointer = function(pointer, value)
        ptr_writePointerRaw(gltf, pointer, value)
        if options.onPointerSet then options.onPointerSet(pointer, value) end
      end,
      setVariable = function(variableIndex, value)
        local t = varTypes[variableIndex + 1]
        if t == nil then t = value.type end
        varRaw[variableIndex + 1] = engine_kernelValueToRaw(t, value)
      end,
      onTickPhase = function()
        for _, handler in ipairs(onTickHandlers) do
          local tst
          if scheduler.tickCount == 0 then tst = 0 else tst = scheduler.time end
          handler(tst, scheduler.lastTickDelta)
        end
      end
    }
    scheduler = scheduler_create(effects)

    local rt = {}

    -- Additive object-shaped `rt.vars(...)` form (see @gltfi/emit-lua's
    -- header note and docs/design/ir-and-transpiler.md's IR->Lua section):
    -- an ARRAY (element order == variable index order, same load-bearing
    -- contract the plain array form below always had) of `{ name = ...,
    -- decl = rt.int(0)/rt.bool(false)/... }` entries — an object keyed by
    -- name would NOT preserve declaration order (Lua table literals have no
    -- guaranteed key-iteration order), so the name lives ALONGSIDE each
    -- array element instead of being decls' own key. Returns a table `V`
    -- with a metatable binding EVERY declared name straight to that
    -- variable's own store slot via `__index`/`__newindex` (a single pair of
    -- closures shared by every name, keyed by a name->index lookup table
    -- built here — not one closure pair per entry like the old
    -- `V.counter1.get()`/`.set(v)` accessor-object shape), so emitted code
    -- reads/writes it exactly like a normal field: `V.counter1`/
    -- `V.counter1 = v`. The OLD plain form (array of bare `{type=,initial=}`
    -- decls, still used by hand-written callers — see
    -- packages/runtime-lua/test/lua-runtime.test.ts) returns nil, same as
    -- before; distinguished by whether the first element itself has a
    -- `name` field.
    function rt.vars(decls)
      if decls[1] ~= nil and decls[1].name ~= nil then
        local nameToIndex = {}
        for _, entry in ipairs(decls) do
          local idx = #varTypes
          varTypes[idx + 1] = entry.decl.type
          varRaw[idx + 1] = entry.decl.initial
          nameToIndex[entry.name] = idx
        end
        local V = setmetatable({}, {
          __index = function(_, name)
            local idx = nameToIndex[name]
            if idx == nil then return nil end
            return varRaw[idx + 1]
          end,
          __newindex = function(_, name, value)
            local idx = nameToIndex[name]
            if idx == nil then
              error("rt.vars: unknown variable \"" .. tostring(name) .. "\"")
            end
            varRaw[idx + 1] = value
          end
        })
        return V
      end
      for _, decl in ipairs(decls) do
        varTypes[#varTypes + 1] = decl.type
        varRaw[#varRaw + 1] = decl.initial
      end
      return nil
    end
    function rt.getVar(index) return varRaw[index + 1] end
    function rt.setVar(index, value) varRaw[index + 1] = value end
    -- Additive object-shaped `rt.events(...)` form — same array-of-named-
    -- entries shape/rationale as rt.vars above. Returns a plain name->index
    -- map (a bare number, exactly what rt.send/rt.onReceive's first
    -- parameter already accepts).
    function rt.events(decls)
      if decls[1] ~= nil and decls[1].name ~= nil then
        local E = {}
        for _, entry in ipairs(decls) do
          local idx = #eventDecls
          eventDecls[idx + 1] = entry.decl
          E[entry.name] = idx
        end
        return E
      end
      for _, d in ipairs(decls) do eventDecls[#eventDecls + 1] = d end
      return nil
    end
    -- Variable-declaration-shorthand helpers, usable as `rt.vars({ { name =
    -- "counter1", decl = rt.int(0.0) }, ... })` entries' `decl` field — each
    -- just builds the same `{type=,initial=}` shape the plain array form's
    -- elements always were. Mirrors engine.ts's int/bool/float/.../ref
    -- helpers name-for-name and default-for-default.
    function rt.int(x)
      if x == nil then x = 0.0 end
      return { type = "int", initial = m.trunc(x) }
    end
    function rt.bool(x)
      if x == nil then x = false end
      return { type = "bool", initial = x and true or false }
    end
    function rt.float(x)
      if x == nil then x = 0.0 end
      return { type = "float", initial = x }
    end
    function rt.float2(x, y)
      return { type = "float2", initial = { x or 0.0, y or 0.0 } }
    end
    function rt.float3(x, y, z)
      return { type = "float3", initial = { x or 0.0, y or 0.0, z or 0.0 } }
    end
    function rt.float4(x, y, z, w)
      return { type = "float4", initial = { x or 0.0, y or 0.0, z or 0.0, w or 0.0 } }
    end
    function rt.float2x2(...)
      local values = { ... }
      if #values == 0 then values = { 1.0, 0.0, 0.0, 1.0 } end
      return { type = "float2x2", initial = values }
    end
    function rt.float3x3(...)
      local values = { ... }
      if #values == 0 then values = { 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0 } end
      return { type = "float3x3", initial = values }
    end
    function rt.float4x4(...)
      local values = { ... }
      if #values == 0 then
        values = { 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 }
      end
      return { type = "float4x4", initial = values }
    end
    function rt.ref(pointer)
      if pointer == nil then pointer = "" end
      return { type = "ref", initial = pointer }
    end
    -- State-slot factories — plain table literals with the exact shape
    -- @gltfi/emit-lua used to write out literally (see emitStateSlots'
    -- previous inline `{ count = 0.0 }`/etc — kept byte-for-byte identical
    -- here, just centralized).
    function rt.doNState() return { count = 0.0 } end
    function rt.multiGateState() return { lastIndex = -1.0, used = {} } end
    function rt.waitAllState() return { activated = {} } end
    function rt.throttleState() return { remaining = (0/0) } end
    function rt.delayState() return { lastId = -1.0, lastRef = "", ids = {} } end
    function rt.onStart(fn) onStartHandlers[#onStartHandlers + 1] = fn end
    function rt.onTick(fn) onTickHandlers[#onTickHandlers + 1] = fn end
    function rt.onReceive(eventIndex, fn)
      local list = onReceiveHandlers[eventIndex]
      if not list then
        list = {}
        onReceiveHandlers[eventIndex] = list
      end
      list[#list + 1] = fn
    end
    -- Combined signature covering three call shapes (mirrors engine.ts's
    -- send exactly): the OLD `(eventIndex, externalId, payload)` (externalId
    -- is IGNORED — it's looked up from this engine's own eventDecls table
    -- instead, fully redundant with eventIndex/the `E.<name>` ref that names
    -- it), the additive `(eventIndex, payload)`, and `(eventIndex)` alone
    -- when every payload value equals the event's own declared default (see
    -- @gltfi/emit-lua's emitEvent doc comment) — no second argument at all
    -- in that case. Distinguished by VALUE shape, not position: a table
    -- (`secondArg`/`thirdArg`) is always a payload; a string or nil never is.
    function rt.send(eventIndex, secondArg, thirdArg)
      local decl = eventDecls[eventIndex + 1]
      local payload
      if type(secondArg) == "table" then
        payload = secondArg
      elseif type(thirdArg) == "table" then
        payload = thirdArg
      else
        local b, i, f, d = false, 0.0, 0.0, 0.0
        if decl then
          if decl.defaultBool ~= nil then b = decl.defaultBool end
          if decl.defaultInt ~= nil then i = decl.defaultInt end
          if decl.defaultFloat ~= nil then f = decl.defaultFloat end
          if decl.expectedDuration ~= nil then d = decl.expectedDuration end
        end
        payload = { b, i, f, d }
      end
      local externalId = decl and decl.externalId
      sentEvents[#sentEvents + 1] = { eventIndex = eventIndex, externalId = externalId, payload = payload }
      lastPayloadByIndex[eventIndex] = payload
      local eventRef = "event:custom:" .. eventIndex
      stoppedEvents[eventRef] = nil
      local list = onReceiveHandlers[eventIndex]
      if list then
        for _, handler in ipairs(list) do
          if stoppedEvents[eventRef] then break end
          handler(payload)
        end
      end
      stoppedEvents[eventRef] = nil
    end
    function rt.log(_template, _args)
      -- debug/log has no effect on pass/fail; intentionally a no-op.
    end
    function rt.stopPropagation(eventRef, stopImmediate)
      if stopImmediate and eventRef ~= nil and eventRef ~= "" then
        stoppedEvents[eventRef] = true
      end
    end
    function rt.eventOut(nodeKey, socket, value)
      eventOutRegisters[nodeKey .. ":" .. socket] = value
    end
    function rt.eventOutRead(nodeKey, socket)
      return eventOutRegisters[nodeKey .. ":" .. socket]
    end
    function rt.eventPayload(eventIndex)
      local sent = lastPayloadByIndex[eventIndex]
      if sent then return sent end
      local decl = eventDecls[eventIndex + 1]
      local b, i, f, d = false, 0, 0, 0
      if decl then
        if decl.defaultBool ~= nil then b = decl.defaultBool end
        if decl.defaultInt ~= nil then i = decl.defaultInt end
        if decl.defaultFloat ~= nil then f = decl.defaultFloat end
        if decl.expectedDuration ~= nil then d = decl.expectedDuration end
      end
      return { b, i, f, d }
    end
    function rt.tickTime()
      if scheduler.tickCount == 0 then return 0 end
      return scheduler.time
    end
    function rt.tickDelta() return scheduler.lastTickDelta end
    function rt.random() return stepRandom() / 4294967295 end
    -- Combined signature covering both the object-args form (unchanged) and
    -- an additive args-less form for when every pointer-template parameter
    -- is a compile-time constant (see @gltfi/emit-lua's pointerCall — it
    -- inlines constant template args straight into the path string, so
    -- there's nothing left to pass in an args table at all): `argsOrType`
    -- is either the args table (3-arg form omitted) or, when it's a string,
    -- IS the type signature and the args table was omitted entirely.
    -- Mirrors engine.ts's identical ptrGet/ptrSet/ptrInterp dispatch.
    function rt.ptrGet(pointer, argsOrType, t)
      if type(argsOrType) == "string" then
        local value, isValid = ptr_ptrGet(pointerHost, pointer, {}, argsOrType)
        return { value = value, isValid = isValid }
      end
      local value, isValid = ptr_ptrGet(pointerHost, pointer, argsOrType, t)
      return { value = value, isValid = isValid }
    end
    function rt.ptrSet(pointer, argsOrType, typeOrValue, value)
      if type(argsOrType) == "string" then
        return ptr_ptrSet(pointerHost, pointer, {}, argsOrType, typeOrValue)
      end
      return ptr_ptrSet(pointerHost, pointer, argsOrType, typeOrValue, value)
    end

    -- -- async ops --------------------------------------------------

    function rt.setDelay(slot, duration, done)
      if not engine_finiteNum(duration) or duration < 0 then
        return { ok = false }
      end
      local handle = scheduler.allocateDelayId()
      slot.lastId = handle.id
      slot.lastRef = handle.ref
      slot.ids[#slot.ids + 1] = handle.id
      delayOwners[handle.id] = slot
      if done then
        scheduler.scheduleDelay(handle.id, handle.ref, duration, function()
          local kept = {}
          for _, id in ipairs(slot.ids) do
            if id ~= handle.id then kept[#kept + 1] = id end
          end
          slot.ids = kept
          delayOwners[handle.id] = nil
          done()
        end)
      end
      return { ok = true }
    end
    function rt.cancelDelay(ref)
      if type(ref) ~= "string" or ref == "" then return end
      local found = scheduler.findDelayByRef(ref)
      if not found then return end
      scheduler.cancelDelay(found.id)
      local owner = delayOwners[found.id]
      delayOwners[found.id] = nil
      if owner then
        local kept = {}
        for _, id in ipairs(owner.ids) do
          if id ~= found.id then kept[#kept + 1] = id end
        end
        owner.ids = kept
      end
    end
    function rt.cancelDelaySlot(slot)
      for _, id in ipairs(slot.ids) do
        scheduler.cancelDelay(id)
        delayOwners[id] = nil
      end
      slot.ids = {}
      slot.lastId = -1
      slot.lastRef = ""
    end
    function rt.varInterp(varId, value, duration, p1, p2, useSlerp, done)
      local t = varTypes[varId + 1]
      if t == nil then t = "float" end
      local endKernel = engine_rawToKernelValue(t, value)
      local isValid = engine_finiteNum(duration) and duration > 0 and engine_isFiniteRaw(value) and engine_finiteArr(p1) and engine_finiteArr(p2)
      if not isValid then return { ok = false } end
      local startKernel = engine_rawToKernelValue(t, varRaw[varId + 1])
      scheduler.addVariableInterp({
        variableIndex = varId,
        duration = duration,
        startValue = startKernel,
        endValue = endKernel,
        p1 = { p1[1] or 0, p1[2] or 0 },
        p2 = { p2[1] or 0, p2[2] or 0 },
        useSlerp = useSlerp,
        doneCont = done
      })
      return { ok = true }
    end
    -- Combined signature — see rt.ptrGet/rt.ptrSet's identical dispatch
    -- above for the args-less form this also accepts (every following
    -- parameter shifts left by one when `argsOrType` is a string, i.e. IS
    -- the type signature).
    function rt.ptrInterp(pointer, argsOrType, typeOrValue, valueOrDuration, durationOrP1, p1OrP2, p2OrDone, doneMaybe)
      local args, t, value, duration, p1, p2, done
      if type(argsOrType) == "string" then
        args, t, value, duration, p1, p2, done = {}, argsOrType, typeOrValue, valueOrDuration, durationOrP1, p1OrP2, p2OrDone
      else
        args, t, value, duration, p1, p2, done = argsOrType, typeOrValue, valueOrDuration, durationOrP1, p1OrP2, p2OrDone, doneMaybe
      end
      local prep = ptr_ptrInterpPrepare(pointerHost, pointer, args, t)
      if not prep then return { ok = false } end
      if not engine_finiteNum(duration) or duration < 0 then return { ok = false } end
      local p10 = p1[1] or 0
      local p20 = p2[1] or 0
      if not engine_finiteArr(p1) or not engine_finiteArr(p2) or p10 < 0 or p10 > 1 or p20 < 0 or p20 > 1 then
        return { ok = false }
      end
      local target
      if type(value) == "table" then
        target = {}
        for i = 1, #value do target[i] = value[i] + 0.0 end
      else
        target = { (tonumber(value) or 0) + 0.0 }
      end
      scheduler.addPointerInterp({
        pointer = prep.resolved,
        duration = duration,
        startValue = prep.startValue,
        endValue = target,
        p1 = { p1[1] or 0, p1[2] or 0 },
        p2 = { p2[1] or 0, p2[2] or 0 },
        isQuaternion = prep.resolved:match("/rotation$") ~= nil,
        doneCont = done
      })
      return { ok = true }
    end
    function rt.animStart(animationRef, startTime, endTime, speed, done)
      local index = engine_parseAnimationRef(gltf, animationRef)
      if index == nil or not engine_finiteNum(startTime) or endTime ~= endTime or not engine_finiteNum(speed) or speed <= 0 then
        return { ok = false }
      end
      scheduler.startAnimation({ animationIndex = index, startTime = startTime, endTime = endTime, speed = speed, endCont = done })
      return { ok = true }
    end
    function rt.animStop(animationRef)
      local index = engine_parseAnimationRef(gltf, animationRef)
      if index == nil then return { ok = false } end
      scheduler.stopAnimation(index)
      return { ok = true }
    end
    function rt.animStopAt(animationRef, stopTime, done)
      local index = engine_parseAnimationRef(gltf, animationRef)
      if index == nil or stopTime ~= stopTime then return { ok = false } end
      scheduler.stopAnimationAt(index, stopTime, done)
      return { ok = true }
    end

    -- -- stateful ops -------------------------------------------------

    -- Returns the fire decision directly (not `{fire=...}`) — the only
    -- non-additive shape change in this surface (mirrors engine.ts's
    -- identical change exactly, including its doc comment's rationale):
    -- every real call site checks this exactly once (`if rt.doN(...) then
    -- ... end`), so there was never a reason to name an intermediate
    -- result — see @gltfi/emit-lua's emitStateful, which now inlines the
    -- call straight into the `if`.
    function rt.doN(slot, n)
      local decision = state_doNAdvance(slot.count, m.trunc(n))
      slot.count = decision.count
      return decision.fire
    end
    function rt.multiGate(slot, outputCount, isRandom, isLoop)
      -- `count <= 0` guard: a degenerate flow/multiGate with zero wired
      -- outputs (isRandom+isLoop both true) would otherwise divide by a
      -- Lua float 0.0, landing on NaN — harmless as a NUMBER in Lua, but a
      -- Lua table index of NaN is a hard runtime error ("table index is
      -- NaN"), unlike JS, where `arr[NaN] = true` silently sets a string-
      -- keyed property and never crashes (see state_multiGateAdvance's own
      -- `used[index + 1] = true`). Matches the TS oracle's own
      -- silently-inert behavior for this degenerate config without
      -- crashing.
      local decision = state_multiGateAdvance(slot.used, outputCount, isRandom, isLoop, function(count)
        if count <= 0 then return 0 end
        return stepRandom() % count
      end)
      slot.used = decision.used
      if decision.index >= 0 then slot.lastIndex = decision.index end
      return { index = decision.index }
    end
    function rt.waitAll(slot, inputFlows, index)
      local decision = state_waitAllAdvance(slot.activated, slot.remaining, inputFlows, index)
      slot.activated = decision.activated
      slot.remaining = decision.remaining
      return { completed = decision.completed }
    end
    function rt.throttle(slot, duration)
      if not engine_finiteNum(duration) or duration < 0 then
        return { invalid = true, fire = false }
      end
      local decision = state_throttleAdvance(slot.lastTime, duration, scheduler.time)
      slot.lastTime = decision.lastTime
      slot.remaining = decision.remaining
      return { invalid = false, fire = decision.fire }
    end

    setup(rt)

    local instance = {}
    function instance.start()
      for _, handler in ipairs(onStartHandlers) do handler() end
    end
    function instance.advance(dt)
      scheduler.advance(dt)
    end
    function instance.getVariableByIndex(index)
      local t = varTypes[index + 1]
      if t == nil then t = "float" end
      return engine_rawToKernelValue(t, varRaw[index + 1])
    end
    function instance.variableCount()
      return #varTypes
    end
    function instance.sentEvents()
      return sentEvents
    end
    function instance.time()
      return scheduler.time
    end
    function instance.eventCount()
      return #eventDecls
    end
    function instance.eventDefaults()
      local out = {}
      for i = 1, #eventDecls do out[i] = eventDecls[i].expectedDuration end
      return out
    end
    return instance
  end
end
