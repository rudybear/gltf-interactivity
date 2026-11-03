-- Animation sampling helpers, transcribed from packages/kernel/src/
-- animation.ts. `host` is a Lua table `{ gltf = <decoded JSON>, glbBin =
-- <binary Lua string or nil> }`. All glTF-JSON indices (accessor index,
-- animation index, node index, ...) arrive here 0-based (that's the glTF
-- spec's own convention, baked into the document itself) — every place
-- below that indexes into a decoded-JSON array adds 1 for Lua's 1-based
-- tables; byte offsets into the binary chunk stay 0-based arithmetic (raw
-- byte math, not a Lua array index) until the final `string.unpack` call,
-- whose own position argument is 1-based (Lua string-library convention),
-- hence the `+ 1` there specifically.

local ACCESSOR_COMPONENT_COUNTS = { SCALAR = 1, VEC2 = 2, VEC3 = 3, VEC4 = 4, MAT2 = 4, MAT3 = 9, MAT4 = 16 }

-- Bytes per component for each glTF componentType.
local ANIM_COMPONENT_BYTES = { [5120] = 1, [5121] = 1, [5122] = 2, [5123] = 2, [5125] = 4, [5126] = 4 }

-- Rounds a Lua double to float32 (the TS decoder stores into a Float32Array).
local function anim_f32(x)
  return (string.unpack("<f", string.pack("<f", x)))
end

-- Reads one scalar component of `componentType` at 0-based byte `offset`
-- (little-endian), applying the spec's normalization when requested:
-- signed max(c / (2^(n-1)-1), -1), unsigned c / (2^n-1). Mirrors
-- kernel animation.ts readComponent. Result is float32-rounded.
local function anim_readComponent(bin, offset, componentType, normalized)
  local pos = offset + 1
  if componentType == 5126 then
    return (string.unpack("<f", bin, pos))
  elseif componentType == 5120 then
    local c = string.unpack("<i1", bin, pos)
    if normalized then return anim_f32(math.max(c / 127, -1)) end
    return c + 0.0
  elseif componentType == 5121 then
    local c = string.unpack("<I1", bin, pos)
    if normalized then return anim_f32(c / 255) end
    return c + 0.0
  elseif componentType == 5122 then
    local c = string.unpack("<i2", bin, pos)
    if normalized then return anim_f32(math.max(c / 32767, -1)) end
    return c + 0.0
  elseif componentType == 5123 then
    local c = string.unpack("<I2", bin, pos)
    if normalized then return anim_f32(c / 65535) end
    return c + 0.0
  else
    local c = string.unpack("<I4", bin, pos)
    if normalized then return anim_f32(c / 4294967295) end
    return anim_f32(c + 0.0)
  end
end

-- Decodes an accessor per glTF 2.0 section 3.6.2 (mirrors kernel
-- animation.ts decodeAccessor): all six component types, `normalized`,
-- bufferView.byteStride (interleaved), accessor+bufferView byteOffset,
-- sparse substitution (indices 5121/5123/5125) and a missing bufferView
-- (zeros that a sparse block may patch). Returns
-- `{ data = <flat 1-based float32 list>, count = n, comps = c }` or nil when
-- undecodable (no binary chunk, unknown type, ranges outside the chunk).
function anim_decodeAccessor(host, accessorIndex)
  local accessors = host.gltf and host.gltf.accessors
  local accessor = accessors and accessors[accessorIndex + 1]
  local bin = host.glbBin
  if not accessor or not bin then return nil end
  local comps = ACCESSOR_COMPONENT_COUNTS[accessor.type]
  local compBytes = ANIM_COMPONENT_BYTES[accessor.componentType]
  local count = accessor.count
  if not comps or not compBytes or type(count) ~= "number" or count < 0 or math.floor(count) ~= count then
    return nil
  end
  local normalized = accessor.normalized == true
  local data = {}
  for i = 1, count * comps do data[i] = 0.0 end
  local bufferViews = host.gltf.bufferViews
  if accessor.bufferView ~= nil then
    local view = bufferViews and bufferViews[accessor.bufferView + 1]
    if not view then return nil end
    local elementBytes = comps * compBytes
    local stride = view.byteStride or elementBytes
    local base = (view.byteOffset or 0) + (accessor.byteOffset or 0)
    if count > 0 and base + (count - 1) * stride + elementBytes > #bin then return nil end
    for i = 0, count - 1 do
      local at = base + i * stride
      for j = 0, comps - 1 do
        data[i * comps + j + 1] = anim_readComponent(bin, at + j * compBytes, accessor.componentType, normalized)
      end
    end
  end
  local sparse = accessor.sparse
  if sparse then
    local n = sparse.count
    local indices = sparse.indices
    local values = sparse.values
    local idxType = indices and indices.componentType
    local idxBytes = (idxType == 5121 or idxType == 5123 or idxType == 5125) and ANIM_COMPONENT_BYTES[idxType] or 0
    local idxView = bufferViews and indices and indices.bufferView ~= nil and bufferViews[indices.bufferView + 1]
    local valView = bufferViews and values and values.bufferView ~= nil and bufferViews[values.bufferView + 1]
    if type(n) ~= "number" or n < 0 or math.floor(n) ~= n or idxBytes == 0 or not idxView or not valView then
      return nil
    end
    local idxBase = (idxView.byteOffset or 0) + (indices.byteOffset or 0)
    local valBase = (valView.byteOffset or 0) + (values.byteOffset or 0)
    if idxBase + n * idxBytes > #bin or valBase + n * comps * compBytes > #bin then return nil end
    for sIdx = 0, n - 1 do
      local target = anim_readComponent(bin, idxBase + sIdx * idxBytes, idxType, false)
      if target >= count then return nil end
      target = math.floor(target)
      for j = 0, comps - 1 do
        data[target * comps + j + 1] = anim_readComponent(bin, valBase + (sIdx * comps + j) * compBytes, accessor.componentType, normalized)
      end
    end
  end
  return { data = data, count = count, comps = comps }
end

-- Compat wrapper: per-element 1-based number lists, or nil when undecodable.
-- Uncached (the sampler uses the cached flat path below).
function anim_readAccessorElements(host, accessorIndex)
  local decoded = anim_decodeAccessor(host, accessorIndex)
  if not decoded then return nil end
  local out = {}
  for i = 0, decoded.count - 1 do
    local element = {}
    for j = 1, decoded.comps do element[j] = decoded.data[i * decoded.comps + j] end
    out[i + 1] = element
  end
  return out
end

-- Per-document cache (mirrors kernel animation.ts): decoded accessors and
-- per-animation channel plans are built once and kept in a weak-keyed table
-- keyed by the host's glTF table. An entry also remembers the binary chunk
-- and the accessors/animations/bufferViews table identities and is rebuilt
-- when any differs; anim_invalidateAnimationCache(gltf) drops it explicitly.
local anim_docCaches = setmetatable({}, { __mode = "k" })

local function anim_getDocCache(host)
  local gltf = host.gltf
  if type(gltf) ~= "table" then return nil end
  local cache = anim_docCaches[gltf]
  if not cache
    or cache.bin ~= host.glbBin
    or cache.accessors ~= gltf.accessors
    or cache.animations ~= gltf.animations
    or cache.bufferViews ~= gltf.bufferViews then
    cache = {
      bin = host.glbBin,
      accessors = gltf.accessors,
      animations = gltf.animations,
      bufferViews = gltf.bufferViews,
      decoded = {},
      plans = {},
      decodes = cache and cache.decodes or 0,
      hits = cache and cache.hits or 0
    }
    anim_docCaches[gltf] = cache
  end
  return cache
end

function anim_invalidateAnimationCache(gltf)
  anim_docCaches[gltf] = nil
end

-- Diagnostics for tests: accessor decodes vs. cache hits for this document.
function anim_getAnimationCacheStats(host)
  local cache = anim_getDocCache(host)
  if not cache then return 0, 0 end
  return cache.decodes, cache.hits
end

-- `decoded` maps accessorIndex -> decoded table, or false for "undecodable".
local function anim_cachedAccessor(host, cache, index)
  local entry = cache.decoded[index]
  if entry ~= nil then
    cache.hits = cache.hits + 1
    return entry or nil
  end
  cache.decodes = cache.decodes + 1
  local decoded = anim_decodeAccessor(host, index)
  cache.decoded[index] = decoded or false
  return decoded
end

-- Builds the sampling plan for one channel, or nil when its data is unusable.
local function anim_buildChannelPlan(host, cache, animation, channel)
  local sampler = animation.samplers[channel.sampler + 1]
  local target = channel.target
  if type(target.path) ~= "string" then return nil end
  local input = anim_cachedAccessor(host, cache, sampler.input)
  local output = anim_cachedAccessor(host, cache, sampler.output)
  if not input or not output or input.count == 0 or input.comps ~= 1 then return nil end
  local interpolation = sampler.interpolation or "LINEAR"
  local cubic = interpolation == "CUBICSPLINE"
  local valueCount = input.count * (cubic and 3 or 1)
  local outLen = #output.data
  if outLen == 0 or outLen % valueCount ~= 0 then return nil end
  return {
    times = input.data,
    n = input.count,
    values = output.data,
    width = outLen // valueCount,
    cubic = cubic,
    step = interpolation == "STEP",
    path = target.path,
    node = target.node,
    pointer = "/nodes/" .. math.floor(target.node) .. "/" .. target.path,
    lastKey = 0
  }
end

function anim_getAnimationTimeRange(host, animationIndex)
  local animations = host.gltf and host.gltf.animations
  local animation = animations and animations[animationIndex + 1]
  if not animation then
    return 0 / 0, 0 / 0
  end
  local min = math.huge
  local max = -math.huge
  local seen = {}
  for _, channel in ipairs(animation.channels or {}) do
    seen[channel.sampler] = true
  end
  for samplerIndex, _ in pairs(seen) do
    local sampler = (animation.samplers or {})[samplerIndex + 1]
    local input = sampler and (host.gltf.accessors or {})[(sampler.input or -1) + 1]
    if input then
      if type(input.min) == "table" and input.min[1] ~= nil then
        min = math.min(min, input.min[1])
      end
      if type(input.max) == "table" and input.max[1] ~= nil then
        max = math.max(max, input.max[1])
      end
    end
  end
  local function finite(x) return x == x and x ~= math.huge and x ~= -math.huge end
  if not finite(min) or not finite(max) then
    return 0 / 0, 0 / 0
  end
  return min, max
end

-- Maps a requested timestamp on the infinite timeline to the effective
-- timestamp within the animation data range [0, T] (KHR_interactivity §4.6).
function anim_effectiveAnimationTime(requested, maxTime)
  if maxTime == 0 or maxTime ~= maxTime then
    return 0
  end
  local s
  if requested > 0 then
    s = math.ceil((requested - maxTime) / maxTime)
  else
    s = math.floor(requested / maxTime)
  end
  return requested - s * maxTime
end

local function anim_getAnimationPlan(host, cache, animationIndex, animation)
  local plan = cache.plans[animationIndex]
  if plan then return plan end
  local _, max = anim_getAnimationTimeRange(host, animationIndex)
  local maxTime = 0
  if max == max and max ~= math.huge and max ~= -math.huge then maxTime = max end
  plan = { maxTime = maxTime, channels = {}, skipped = 0 }
  for _, channel in ipairs(animation.channels or {}) do
    local sampler = animation.samplers and animation.samplers[channel.sampler + 1]
    if sampler and channel.target and channel.target.node ~= nil then
      local channelPlan = anim_buildChannelPlan(host, cache, animation, channel)
      if channelPlan then
        plan.channels[#plan.channels + 1] = channelPlan
      else
        plan.skipped = plan.skipped + 1
      end
    end
  end
  cache.plans[animationIndex] = plan
  return plan
end

-- Finds 0-based k with times[k] <= t < times[k+1] (t strictly inside the
-- range). Playback is mostly monotonic, so try the last-used key and its
-- successor before falling back to binary search.
local function anim_findKey(plan, t)
  local times = plan.times
  local n = plan.n
  local last = plan.lastKey
  if last + 1 < n and times[last + 1] <= t and t < times[last + 2] then
    return last
  end
  if last + 2 < n and times[last + 2] <= t and t < times[last + 3] then
    plan.lastKey = last + 1
    return last + 1
  end
  local lo, hi = 0, n - 1
  while hi - lo > 1 do
    local mid = (lo + hi) // 2
    if times[mid + 1] <= t then lo = mid else hi = mid end
  end
  plan.lastKey = lo
  return lo
end

local function anim_readValue(plan, slot)
  local out = {}
  local base = slot * plan.width
  for j = 1, plan.width do out[j] = plan.values[base + j] end
  return out
end

local function anim_sampleChannel(plan, t)
  local n = plan.n
  local cubic = plan.cubic
  -- CUBICSPLINE keyframes are [inTangent, value, outTangent]; the value of
  -- key k sits at slot k*3+1.
  local function valueSlot(key) if cubic then return key * 3 + 1 end return key end
  if n == 1 or t <= plan.times[1] then return anim_readValue(plan, valueSlot(0)) end
  if t >= plan.times[n] then return anim_readValue(plan, valueSlot(n - 1)) end
  local k = anim_findKey(plan, t)
  local t0 = plan.times[k + 1]
  local dt = plan.times[k + 2] - t0
  local u = (dt > 0) and ((t - t0) / dt) or 0
  if plan.step then return anim_readValue(plan, k) end
  local w = plan.width
  local values = plan.values
  if cubic then
    -- Cubic Hermite (glTF 2.0 Appendix C): tangents scaled by the keyframe
    -- interval dt; rotations re-normalized afterwards.
    local u2 = u * u
    local u3 = u2 * u
    local h00 = 2 * u3 - 3 * u2 + 1
    local h10 = u3 - 2 * u2 + u
    local h01 = -2 * u3 + 3 * u2
    local h11 = u3 - u2
    local v0 = valueSlot(k) * w
    local b0 = (k * 3 + 2) * w
    local v1 = valueSlot(k + 1) * w
    local a1 = (k + 1) * 3 * w
    local out = {}
    for j = 1, w do
      out[j] = h00 * values[v0 + j] + h10 * dt * values[b0 + j] + h01 * values[v1 + j] + h11 * dt * values[a1 + j]
    end
    if plan.path == "rotation" then return kmath_quatNormalize(out) end
    return out
  end
  if plan.path == "rotation" then
    return kmath_quatSlerp(anim_readValue(plan, k), anim_readValue(plan, k + 1), u)
  end
  local out = {}
  local a = k * w
  local b = a + w
  for j = 1, w do
    local x = values[a + j]
    out[j] = x + (values[b + j] - x) * u
  end
  return out
end

-- Samples animation `animationIndex` at virtual-timeline position
-- `requested` and writes the resulting channel values straight into
-- `host.gltf`'s node objects. `onChannelWrite(pointer, value)` is called for
-- each written channel. Returns nil if the animation doesn't exist, else a
-- table `{ t = <effective sample time>, wroteAny = <bool>, skippedChannels = n }`.
-- Accessor decoding and channel setup happen once per document (see the
-- cache above); a tick only does keyframe lookup + interpolation.
function anim_applyAnimationAt(host, animationIndex, requested, onChannelWrite)
  local animations = host.gltf and host.gltf.animations
  local animation = animations and animations[animationIndex + 1]
  if not animation then return nil end
  local cache = anim_getDocCache(host)
  if not cache then return nil end
  local plan = anim_getAnimationPlan(host, cache, animationIndex, animation)
  local t = anim_effectiveAnimationTime(requested, plan.maxTime)
  local wroteAny = false
  local nodes = host.gltf.nodes or {}
  for _, channel in ipairs(plan.channels) do
    local node = nodes[channel.node + 1]
    if node then
      local sampled = anim_sampleChannel(channel, t)
      node[channel.path] = sampled
      if onChannelWrite then onChannelWrite(channel.pointer, sampled) end
      wroteAny = true
    end
  end
  return { t = t, wroteAny = wroteAny, skippedChannels = plan.skipped }
end
