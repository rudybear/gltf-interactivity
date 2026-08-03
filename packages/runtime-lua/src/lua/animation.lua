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

-- Decodes an accessor from the binary chunk as an array of per-element
-- Lua-array (1-based) number lists. Only tightly-packed float32 data is
-- supported (covers animation samplers). Returns nil when unavailable.
function anim_readAccessorElements(host, accessorIndex)
  local accessors = host.gltf and host.gltf.accessors
  local accessor = accessors and accessors[accessorIndex + 1]
  local bin = host.glbBin
  if not accessor or not bin or accessor.componentType ~= 5126 then
    return nil
  end
  local componentCount = ACCESSOR_COMPONENT_COUNTS[accessor.type] or 1
  local bufferViews = host.gltf.bufferViews
  local view = bufferViews and bufferViews[(accessor.bufferView or 0) + 1]
  if not view then
    return nil
  end
  local byteOffset = (view.byteOffset or 0) + (accessor.byteOffset or 0)
  local count = accessor.count
  local finish = byteOffset + count * componentCount * 4
  if finish > #bin then
    return nil
  end
  local out = {}
  for i = 0, count - 1 do
    local element = {}
    for j = 0, componentCount - 1 do
      local byte = byteOffset + (i * componentCount + j) * 4
      element[j + 1] = string.unpack("<f", bin, byte + 1)
    end
    out[i + 1] = element
  end
  return out
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

-- Samples animation `animationIndex` at virtual-timeline position
-- `requested` and writes the resulting channel values straight into
-- `host.gltf`'s node objects. `onChannelWrite(pointer, value)` is called for
-- each written channel. Returns nil if the animation doesn't exist, else a
-- table `{ t = <effective sample time>, wroteAny = <bool> }`.
function anim_applyAnimationAt(host, animationIndex, requested, onChannelWrite)
  local animations = host.gltf and host.gltf.animations
  local animation = animations and animations[animationIndex + 1]
  if not animation then
    return nil
  end
  local _, maxTime = anim_getAnimationTimeRange(host, animationIndex)
  if maxTime ~= maxTime then maxTime = 0 end
  local t = anim_effectiveAnimationTime(requested, maxTime)
  local wroteAny = false
  for _, channel in ipairs(animation.channels or {}) do
    local sampler = (animation.samplers or {})[channel.sampler + 1]
    local target = channel.target
    if sampler and target and target.node ~= nil then
      local times = anim_readAccessorElements(host, sampler.input)
      local values = anim_readAccessorElements(host, sampler.output)
      if times and values and #times > 0 then
        local timesScalar = {}
        for i = 1, #times do timesScalar[i] = times[i][1] end
        local interpolation = sampler.interpolation or "LINEAR"
        local stride = (interpolation == "CUBICSPLINE") and 3 or 1
        local cubicOffset = (stride == 3) and 1 or 0
        local sampled
        if t <= timesScalar[1] then
          sampled = values[0 * stride + cubicOffset + 1]
        elseif t >= timesScalar[#timesScalar] then
          sampled = values[(#timesScalar - 1) * stride + cubicOffset + 1]
        else
          local k = 0
          while k + 2 <= #timesScalar and timesScalar[k + 2] < t do
            k = k + 1
          end
          local t0 = timesScalar[k + 1]
          local t1 = timesScalar[k + 2]
          local u = (t1 > t0) and ((t - t0) / (t1 - t0)) or 0
          local v0 = values[k * stride + cubicOffset + 1]
          local v1 = values[(k + 1) * stride + cubicOffset + 1]
          if interpolation == "STEP" then
            sampled = v0
          elseif target.path == "rotation" then
            sampled = kmath_quatSlerp(v0, v1, u)
          else
            sampled = {}
            for i = 1, #v0 do sampled[i] = v0[i] + (v1[i] - v0[i]) * u end
          end
        end
        local node = (host.gltf.nodes or {})[target.node + 1]
        if node then
          if target.path == "weights" then
            node.weights = sampled
          else
            node[target.path] = sampled
          end
          if onChannelWrite then
            onChannelWrite("/nodes/" .. target.node .. "/" .. target.path, sampled)
          end
          wroteAny = true
        end
      end
    end
  end
  return { t = t, wroteAny = wroteAny }
end
