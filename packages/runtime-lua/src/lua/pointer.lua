-- JSON Pointer Template resolver for compiled `rt.ptrGet`/`rt.ptrSet` calls.
-- Transcribed from packages/runtime-lib/src/pointer.ts (itself a port of
-- packages/runtime/src/interpreter.ts's pointer machinery): plain
-- property/array traversal, TRS defaults, node matrix/globalMatrix (get +
-- set), morph-target weights (get + set), ref-typed sibling-collection
-- reads, and the KHR_interactivity host-fed/runtime virtual pointers.
--
-- Every function here is a plain global (no Lua module system — this file
-- is concatenated into one chunk with the rest of runtime-lua; see
-- run-compiled-lua.ts) prefixed `ptr_` to avoid colliding with the other
-- runtime-lua files' globals.
--
-- Indexing note: glTF JSON array indices are 0-based (the glTF spec's own
-- convention, baked into pointer strings like "/nodes/3"); every place
-- below that turns such an index into a Lua table access adds 1. Lua
-- doesn't distinguish "array" from "object" tables the way JS's
-- Array.isArray does — this runtime uses `type(x) == "table"` as the
-- equivalent test everywhere, which is exact for every field this pointer
-- resolver touches (weights/children/matrix/translation/min/max/etc. are
-- always either a genuine JSON array or absent in valid glTF — never a
-- plain object — so there's no realistic ambiguity for the conformance
-- corpus this runtime targets).

local function ptr_decodeToken(token)
  return token:gsub("~1", "/"):gsub("~0", "~")
end

-- Unlike Lua's `string.gmatch("[^/]+")` (which silently drops empty
-- segments), this keeps them — needed for buildEffectivePointer/
-- extractPointerParams, which must see the pointer template's leading ""
-- segment (from a leading "/") the same way TS's plain `.split("/")` does.
local function ptr_splitKeepEmpty(s)
  local out = {}
  local start = 1
  while true do
    local i = s:find("/", start, true)
    if not i then
      out[#out + 1] = s:sub(start)
      break
    end
    out[#out + 1] = s:sub(start, i - 1)
    start = i + 1
  end
  return out
end

-- Like ptr_splitKeepEmpty but drops empty segments (TS's
-- `.split("/").filter(Boolean)`), for resolved-pointer token walks.
local function ptr_splitTokens(s)
  local out = {}
  for tok in s:gmatch("[^/]+") do
    out[#out + 1] = ptr_decodeToken(tok)
  end
  return out
end

local function ptr_computeLocalMatrix(node)
  if type(node) == "table" and type(node.matrix) == "table" and #node.matrix == 16 then
    local out = {}
    for i = 1, 16 do out[i] = node.matrix[i] + 0.0 end
    return out
  end
  local t = { 0, 0, 0 }
  local r = { 0, 0, 0, 1 }
  local s = { 1, 1, 1 }
  if type(node) == "table" then
    if type(node.translation) == "table" then t = node.translation end
    if type(node.rotation) == "table" then r = node.rotation end
    if type(node.scale) == "table" then s = node.scale end
  end
  return kmath_mat4Compose(t, r, s)
end

-- nodeIndex is 0-based.
local function ptr_findParent(gltf, nodeIndex)
  local nodes = (gltf and gltf.nodes) or {}
  for i = 1, #nodes do
    local children = nodes[i] and nodes[i].children
    if type(children) == "table" then
      for _, c in ipairs(children) do
        if c == nodeIndex then return i - 1 end
      end
    end
  end
  return -1
end

local function ptr_computeGlobalMatrix(gltf, nodeIndex, cache)
  local cached = cache[nodeIndex]
  if cached then return cached end
  local nodes = gltf and gltf.nodes
  local localMatrix = ptr_computeLocalMatrix(nodes and nodes[nodeIndex + 1])
  local parent = ptr_findParent(gltf, nodeIndex)
  local global
  if parent >= 0 then
    global = kmath_mat4Mul(ptr_computeGlobalMatrix(gltf, parent, cache), localMatrix)
  else
    global = localMatrix
  end
  cache[nodeIndex] = global
  return global
end

local function ptr_getMeshTargetCount(mesh)
  local primitives = mesh and mesh.primitives
  if type(primitives) ~= "table" or #primitives == 0 then return 0 end
  local targets = primitives[1].targets
  if type(targets) == "table" then return #targets end
  return 0
end

-- startIndex is 0-based; returns a 0-based node index or nil.
local function ptr_findMeshNodeIndex(gltf, startIndex)
  local nodes = gltf and gltf.nodes
  if type(nodes) ~= "table" or startIndex < 0 or startIndex >= #nodes then return nil end
  local visited = {}
  local queue = { startIndex }
  local qi = 1
  while qi <= #queue do
    local index = queue[qi]
    qi = qi + 1
    if index ~= nil and not visited[index] then
      visited[index] = true
      local node = nodes[index + 1]
      if node and type(node.mesh) == "number" then
        return index
      end
      local children = node and node.children
      if type(children) == "table" then
        for _, c in ipairs(children) do
          if type(c) == "number" then
            queue[#queue + 1] = c
          end
        end
      end
    end
  end
  return nil
end

-- A pointer addressing a property whose value is an index into a sibling
-- top-level collection resolves (when read with type "ref") to a reference
-- to that collection element.
local PTR_REF_COLLECTIONS = {
  mesh = "meshes", camera = "cameras", skin = "skins", material = "materials",
  scene = "scenes", node = "nodes", children = "nodes", parent = "nodes",
  nodes = "nodes", joints = "nodes", skeleton = "nodes", animations = "animations",
  meshes = "meshes", cameras = "cameras", skins = "skins", materials = "materials",
  scenes = "scenes", lights = "lights"
}

local function ptr_resolvePointerRef(gltf, resolved)
  local tokens = ptr_splitTokens(resolved)
  if #tokens == 0 then return "", false end
  local last = tokens[#tokens]
  local isIndex = last:match("^%d+$") ~= nil
  local propToken
  if isIndex then propToken = tokens[#tokens - 1] else propToken = last end
  local collection = PTR_REF_COLLECTIONS[propToken]
  if not collection then return "", false end
  local parentCount
  if isIndex then parentCount = #tokens - 2 else parentCount = #tokens - 1 end
  local current = gltf
  for i = 1, parentCount do
    if current == nil then return "", false end
    -- A parent token may itself be a 0-based glTF array index (e.g. the
    -- "0" in "/meshes/0/primitives/0/material") — step into it as a Lua
    -- 1-based table access, not a literal string-keyed lookup (which would
    -- silently miss and return nil for every such token, exactly the bug
    -- this comment is here to prevent regressing back to).
    local n = tokens[i]:match("^%d+$") and tonumber(tokens[i]) or nil
    if n ~= nil and type(current) == "table" then
      current = current[n + 1]
    else
      current = current[tokens[i]]
    end
  end
  if current == nil then return "", false end
  local raw
  if isIndex then
    local sub = current[propToken]
    if type(sub) == "table" then raw = sub[tonumber(last) + 1] end
  else
    raw = current[propToken]
  end
  if isIndex and raw ~= nil and type(raw) == "table" then
    return "/" .. table.concat(tokens, "/"), true
  end
  if type(raw) ~= "number" then
    return "", true
  end
  return "/" .. collection .. "/" .. tostring(math.floor(raw)), true
end

-- nodeIndex/meshIndex are 0-based-or-nil.
local function ptr_resolveWeightsLength(gltf, nodeIndex, meshIndex)
  if nodeIndex ~= nil then
    local meshNodeIndex = ptr_findMeshNodeIndex(gltf, nodeIndex)
    local meshNode = meshNodeIndex ~= nil and gltf.nodes[meshNodeIndex + 1] or nil
    local mesh = nil
    if meshNode and type(meshNode.mesh) == "number" then mesh = gltf.meshes[meshNode.mesh + 1] end
    if not mesh then return 0, false end
    local targetCount = ptr_getMeshTargetCount(mesh)
    if meshNode and type(meshNode.weights) == "table" then return #meshNode.weights, true end
    if type(mesh.weights) == "table" then return #mesh.weights, true end
    return targetCount, true
  end
  if meshIndex ~= nil then
    local mesh = gltf.meshes[meshIndex + 1]
    if not mesh then return 0, false end
    local targetCount = ptr_getMeshTargetCount(mesh)
    if type(mesh.weights) == "table" then return #mesh.weights, true end
    return targetCount, true
  end
  return 0, false
end

-- Returns (value, isValid). `value` may be nil (see the "invalid" callers
-- below, which all treat a nil value as isValid=false regardless).
local function ptr_resolvePointerValue(gltf, resolved)
  local tokens = ptr_splitTokens(resolved)
  local current = gltf
  local nodeIndex = nil
  local meshIndex = nil
  for i = 1, #tokens do
    local token = tokens[i]
    if current == nil then return nil, false end

    if token:match("%.length$") then
      local base = token:sub(1, #token - 7)
      if base == "weights" then
        return ptr_resolveWeightsLength(gltf, nodeIndex, meshIndex)
      end
      if current[base] == nil then return 0, false end
      local next_ = current[base]
      local isArr = type(next_) == "table"
      if isArr then return #next_, true end
      return 0, false
    elseif (token == "matrix" or token == "globalMatrix") and nodeIndex ~= nil then
      if token == "matrix" then
        return ptr_computeLocalMatrix(gltf.nodes[nodeIndex + 1]), true
      end
      return ptr_computeGlobalMatrix(gltf, nodeIndex, {}), true
    elseif token == "[]" then
      return nil, false
    else
      if nodeIndex ~= nil and current == gltf.nodes[nodeIndex + 1] and current[token] == nil then
        if token == "translation" then return { 0, 0, 0 }, true end
        if token == "rotation" then return { 0, 0, 0, 1 }, true end
        if token == "scale" then return { 1, 1, 1 }, true end
      end

      local weightsHandled = false
      if token == "weights" then
        local nextToken = tokens[i + 1]
        local hasIndex = nextToken ~= nil and tonumber(nextToken) ~= nil
        if not hasIndex then return nil, false end
        if nodeIndex ~= nil then
          local meshNodeIndex = ptr_findMeshNodeIndex(gltf, nodeIndex)
          local meshNode = meshNodeIndex ~= nil and gltf.nodes[meshNodeIndex + 1] or nil
          local mesh = nil
          if meshNode and type(meshNode.mesh) == "number" then mesh = gltf.meshes[meshNode.mesh + 1] end
          if not mesh then return nil, false end
          local targetCount = ptr_getMeshTargetCount(mesh)
          if meshNode and type(meshNode.weights) == "table" then
            current = meshNode.weights
            weightsHandled = true
          elseif type(mesh.weights) == "table" then
            current = mesh.weights
            weightsHandled = true
          elseif targetCount > 0 then
            local w = {}
            for k = 1, targetCount do w[k] = 0.5 end
            current = w
            weightsHandled = true
          else
            return nil, false
          end
        elseif meshIndex ~= nil then
          local mesh = gltf.meshes[meshIndex + 1]
          if not mesh then return nil, false end
          local targetCount = ptr_getMeshTargetCount(mesh)
          if type(mesh.weights) == "table" then
            current = mesh.weights
            weightsHandled = true
          elseif targetCount > 0 then
            local w = {}
            for k = 1, targetCount do w[k] = 0.5 end
            current = w
            weightsHandled = true
          else
            current = { 0 }
            weightsHandled = true
          end
        end
      end

      if not weightsHandled then
        local index = tonumber(token)
        if index ~= nil and type(current) == "table" then
          if index < 0 or index >= #current then return nil, false end
          local next_ = current[index + 1]
          if next_ ~= nil then
            if type(gltf.nodes) == "table" and next_ == gltf.nodes[index + 1] then nodeIndex = index end
            if type(gltf.meshes) == "table" and next_ == gltf.meshes[index + 1] then meshIndex = index end
          end
          current = next_
        else
          if type(current) == "table" then
            current = current[token]
          else
            current = nil
          end
        end
      end
    end
  end
  return current, current ~= nil
end

local function ptr_setPointerValue(gltf, resolved, value)
  local tokens = ptr_splitTokens(resolved)
  local current = gltf
  local parent = nil
  local parentKey = nil
  local parentIsIndex = false
  local nodeIndex = nil
  local meshIndex = nil
  for i = 1, #tokens do
    local token = tokens[i]
    local isLast = (i == #tokens)
    if token:match("%.length$") or token == "globalMatrix" then
      return false
    end
    if token == "matrix" and isLast and nodeIndex ~= nil then
      gltf.nodes[nodeIndex + 1].matrix = value
      return true
    end
    local nextToken = tokens[i + 1]
    local nextIsIndex = nextToken ~= nil and tonumber(nextToken) ~= nil

    if token == "weights" then
      if not nextIsIndex then return false end
      if nodeIndex ~= nil then
        local meshNodeIndex = ptr_findMeshNodeIndex(gltf, nodeIndex)
        local meshNode = meshNodeIndex ~= nil and gltf.nodes[meshNodeIndex + 1] or nil
        local mesh = nil
        if meshNode and type(meshNode.mesh) == "number" then mesh = gltf.meshes[meshNode.mesh + 1] end
        if not mesh then return false end
        local targetCount = ptr_getMeshTargetCount(mesh)
        if targetCount == 0 then return false end
        if type(meshNode.weights) ~= "table" then
          if type(mesh.weights) == "table" then
            local copy = {}
            for k = 1, #mesh.weights do copy[k] = mesh.weights[k] end
            meshNode.weights = copy
          else
            local fill = {}
            for k = 1, targetCount do fill[k] = 0.5 end
            meshNode.weights = fill
          end
        end
        local nextWeights = {}
        for k = 1, targetCount do
          local num = tonumber(meshNode.weights[k])
          if num ~= nil and num == num and num ~= math.huge and num ~= -math.huge then
            nextWeights[k] = num
          else
            nextWeights[k] = 0
          end
        end
        meshNode.weights = nextWeights
        current = meshNode.weights
      elseif meshIndex ~= nil then
        local mesh = gltf.meshes[meshIndex + 1]
        if not mesh then return false end
        local targetCount = ptr_getMeshTargetCount(mesh)
        if targetCount == 0 then return false end
        if type(mesh.weights) ~= "table" then
          local fill = {}
          for k = 1, targetCount do fill[k] = 0.5 end
          mesh.weights = fill
        end
        local nextWeights = {}
        for k = 1, targetCount do
          local num = tonumber(mesh.weights[k])
          if num ~= nil and num == num and num ~= math.huge and num ~= -math.huge then
            nextWeights[k] = num
          else
            nextWeights[k] = 0
          end
        end
        mesh.weights = nextWeights
        current = mesh.weights
      else
        return false
      end
    else
      local index = tonumber(token)
      if index ~= nil then
        if type(current) ~= "table" then
          local next_ = {}
          if parent ~= nil and parentKey ~= nil then
            if parentIsIndex then parent[parentKey + 1] = next_ else parent[parentKey] = next_ end
          end
          current = next_
        end
        if isLast then
          current[index + 1] = value
        else
          if current[index + 1] == nil then current[index + 1] = {} end
          parent = current
          parentKey = index
          parentIsIndex = true
          current = current[index + 1]
          if type(gltf.nodes) == "table" and current == gltf.nodes[index + 1] then nodeIndex = index end
          if type(gltf.meshes) == "table" and current == gltf.meshes[index + 1] then meshIndex = index end
        end
      else
        if type(current) ~= "table" then
          local next_ = {}
          if parent ~= nil and parentKey ~= nil then
            if parentIsIndex then parent[parentKey + 1] = next_ else parent[parentKey] = next_ end
          end
          current = next_
        end
        if isLast then
          current[token] = value
        else
          if current[token] == nil then current[token] = {} end
          parent = current
          parentKey = token
          parentIsIndex = false
          current = current[token]
        end
      end
    end
  end
  return true
end

-- Substitutes evaluated template parameters into a "/nodes/[nodeIndex]/mesh"
-- -style pointer template. Returns nil on failure (an empty/invalid ref
-- param, or a ref param that doesn't chain onto the path built so far).
local function ptr_buildEffectivePointer(pointer, args)
  local segments = ptr_splitKeepEmpty(pointer)
  local out = {}
  for _, segment in ipairs(segments) do
    local first = segment:sub(1, 1)
    local last = segment:sub(-1)
    if first == "[" and last == "]" and #segment > 2 then
      local key = segment:sub(2, -2)
      local v = args[key]
      if v == nil then v = 0 end
      -- NOT plain `tostring(v)`: an "[intParam]" value arriving as Lua's
      -- FLOAT subtype (e.g. a literal graph constant — emit-lua forces
      -- every numeric literal to float, never integer, see its
      -- floatLiteral doc comment) stringifies with a trailing ".0"
      -- (`tostring(45.0) == "45.0"`), which then fails every downstream
      -- `"^%d+$"`-style digit-only pattern check in this file and
      -- effectively breaks the whole pointer (silently resolving to
      -- nothing, not merely a cosmetic difference). `%.0f` always yields
      -- clean digits for a finite integral value regardless of which of
      -- Lua's two number subtypes it happens to be.
      out[#out + 1] = string.format("%.0f", v)
    elseif first == "{" and last == "}" and #segment > 2 then
      local key = segment:sub(2, -2)
      local v = args[key]
      local ref
      if v == nil then ref = "" else ref = tostring(v) end
      if ref == "" then return nil end
      if ref:sub(1, 6) == "delay:" or ref:sub(1, 6) == "event:" then
        out[#out + 1] = ref
      else
        local slash = nil
        for pos = #ref, 1, -1 do
          if ref:sub(pos, pos) == "/" then
            slash = pos
            break
          end
        end
        if not slash then return nil end
        local prefix = ref:sub(1, slash - 1)
        local idx = ref:sub(slash + 1)
        if table.concat(out, "/") ~= prefix or idx:match("^%d+$") == nil then
          return nil
        end
        out[#out + 1] = idx
      end
    else
      out[#out + 1] = segment
    end
  end
  return table.concat(out, "/")
end

local function ptr_extractPointerParams(pointer)
  local params = {}
  local segments = ptr_splitKeepEmpty(pointer)
  for _, segment in ipairs(segments) do
    local first = segment:sub(1, 1)
    local last = segment:sub(-1)
    if first == "[" and last == "]" and #segment > 2 then
      params[#params + 1] = { name = segment:sub(2, -2), kind = "int" }
    elseif first == "{" and last == "}" and #segment > 2 then
      params[#params + 1] = { name = segment:sub(2, -2), kind = "ref" }
    end
  end
  return params
end

local PTR_VALUE_TYPE_LENGTHS = { float2 = 2, float3 = 3, float4 = 4, float2x2 = 4, float3x3 = 9, float4x4 = 16 }

local function ptr_valueMatchesType(value, t)
  if t == "bool" then return type(value) == "boolean" end
  if t == "int" then
    return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge and math.floor(value) == value
  end
  if t == "float" then
    return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
  end
  local expected = PTR_VALUE_TYPE_LENGTHS[t]
  if expected ~= nil then
    if type(value) ~= "table" or #value ~= expected then return false end
    for i = 1, expected do
      local v = value[i]
      if type(v) ~= "number" or v ~= v or v == math.huge or v == -math.huge then return false end
    end
    return true
  end
  return false
end

local function ptr_defaultRaw(t)
  if t == "bool" then return false end
  if t == "int" or t == "float" then return 0 end
  if t == "float2" then return { 0, 0 } end
  if t == "float3" then return { 0, 0, 0 } end
  if t == "float4" then return { 0, 0, 0, 0 } end
  if t == "float2x2" then return { 1, 0, 0, 1 } end
  if t == "float3x3" then return { 1, 0, 0, 0, 1, 0, 0, 0, 1 } end
  if t == "float4x4" then return { 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 } end
  if t == "ref" then return "" end
  return nil
end

-- Extensions this runtime implements; used by the asset/extensions/{name}/
-- enabled capability pointer (KHR_interactivity §4.2.1).
local PTR_SUPPORTED_EXTENSIONS = {
  KHR_interactivity = true, KHR_node_visibility = true, KHR_node_selectability = true,
  KHR_node_hoverability = true, KHR_animation_pointer = true, KHR_lights_punctual = true
}

-- Runtime limits reported through /extensions/KHR_interactivity/limits/* (§4.2.2).
local PTR_RUNTIME_LIMITS = {
  maxActiveAnimations = 32, maxActiveDelays = 64,
  maxActivePropertyInterpolations = 64, maxActiveVariableInterpolations = 64
}

local PTR_ANIM_PROPS = { isPlaying = true, minTime = true, maxTime = true, playhead = true, virtualPlayhead = true }

-- Returns (value, isValid) when `resolved` is a recognized virtual pointer,
-- or plain `nil` (single value) when it isn't — callers must check the
-- FIRST return value for nil-ness to distinguish "not virtual, keep going"
-- from a matched-but-invalid result (whose value is always a real
-- defaultRaw(t), never nil).
local function ptr_resolveVirtualPointer(host, resolved, t)
  if resolved == "/extensions/KHR_interactivity/activeCamera/position" then
    if t ~= "float3" then return ptr_defaultRaw(t), false end
    return host.activeCameraPosition or { 0 / 0, 0 / 0, 0 / 0 }, true
  end
  if resolved == "/extensions/KHR_interactivity/activeCamera/rotation" then
    if t ~= "float4" then return ptr_defaultRaw(t), false end
    return host.activeCameraRotation or { 0 / 0, 0 / 0, 0 / 0, 0 / 0 }, true
  end
  if resolved == "/extensions/KHR_interactivity/asset/majorVersion" or resolved == "/extensions/KHR_interactivity/asset/minorVersion" then
    if t ~= "int" then return ptr_defaultRaw(t), false end
    if resolved:match("majorVersion$") then return 2, true end
    return 0, true
  end
  local extName = resolved:match("^/extensions/KHR_interactivity/asset/extensions/([^/]+)/enabled$")
  if extName then
    if t ~= "bool" then return ptr_defaultRaw(t), false end
    local used = host.gltf and host.gltf.extensionsUsed
    local isUsed = false
    if type(used) == "table" then
      for _, u in ipairs(used) do
        if u == extName then isUsed = true break end
      end
    end
    local enabled = false
    if PTR_SUPPORTED_EXTENSIONS[extName] and (extName == "KHR_interactivity" or isUsed) then
      enabled = true
    end
    return enabled, true
  end
  local limitName = resolved:match("^/extensions/KHR_interactivity/limits/([^/]+)$")
  if limitName then
    local limit = PTR_RUNTIME_LIMITS[limitName]
    if limit == nil or t ~= "int" then return ptr_defaultRaw(t), false end
    return limit, true
  end
  local animIndexStr, prop = resolved:match("^/animations/(%d+)/extensions/KHR_interactivity/(.+)$")
  if animIndexStr and PTR_ANIM_PROPS[prop] then
    local index = tonumber(animIndexStr)
    local animation = host.gltf and host.gltf.animations and host.gltf.animations[index + 1]
    if not animation then return ptr_defaultRaw(t), false end
    if prop == "isPlaying" then
      if t ~= "bool" then return ptr_defaultRaw(t), false end
      return host.isAnimationPlaying(index), true
    end
    if t ~= "float" then return ptr_defaultRaw(t), false end
    if prop == "minTime" or prop == "maxTime" then
      local minV, maxV = anim_getAnimationTimeRange(host, index)
      if prop == "minTime" then return minV, true end
      return maxV, true
    end
    local state = host.getAnimationPlayhead(index)
    if prop == "playhead" then return state.playhead, true end
    return state.virtualPlayhead, true
  end
  return nil
end

function ptr_ptrGet(host, pointer, args, t)
  if not host.gltf then
    return ptr_defaultRaw(t), false
  end
  local params = ptr_extractPointerParams(pointer)
  for _, p in ipairs(params) do
    if p.kind == "int" then
      local num = tonumber(args[p.name])
      if num == nil or num ~= num or num == math.huge or num == -math.huge or num < 0 then
        return ptr_defaultRaw(t), false
      end
    end
  end
  -- Runtime reference validation pointers resolve against runtime state,
  -- not the glTF asset (KHR_interactivity Delay/Event References).
  if pointer:match("^/extensions/KHR_interactivity/delays/{[^}]+}$") then
    local ref = ""
    for _, v in pairs(args) do ref = tostring(v) break end
    if t == "ref" and host.isDelayActive(ref) then
      return ref, true
    end
    return ptr_defaultRaw(t), false
  end
  if pointer:match("^/extensions/KHR_interactivity/events/{[^}]+}$") then
    local ref = ""
    for _, v in pairs(args) do ref = tostring(v) break end
    if t == "ref" and ref:sub(1, 6) == "event:" then
      return ref, true
    end
    return ptr_defaultRaw(t), false
  end
  local resolved = ptr_buildEffectivePointer(pointer, args)
  if resolved == nil then
    return ptr_defaultRaw(t), false
  end
  local vv, vIsValid = ptr_resolveVirtualPointer(host, resolved, t)
  if vv ~= nil then
    return vv, vIsValid
  end
  if t == "ref" then
    return ptr_resolvePointerRef(host.gltf, resolved)
  end
  local value, isValid = ptr_resolvePointerValue(host.gltf, resolved)
  if not isValid or not ptr_valueMatchesType(value, t) then
    return ptr_defaultRaw(t), false
  end
  return value, true
end

function ptr_ptrSet(host, pointer, args, t, value)
  if not host.gltf then return false end
  if not ptr_valueMatchesType(value, t) then return false end
  local params = ptr_extractPointerParams(pointer)
  for _, p in ipairs(params) do
    if p.kind == "int" then
      local num = tonumber(args[p.name])
      if num == nil or num ~= num or num == math.huge or num == -math.huge or num < 0 then
        return false
      end
    else
      local s = args[p.name]
      if s == nil or tostring(s) == "" then return false end
    end
  end
  local resolved = ptr_buildEffectivePointer(pointer, args)
  if resolved == nil then return false end
  local ok = ptr_setPointerValue(host.gltf, resolved, value)
  if ok then
    -- Spec pointer/set step 5: kill any in-flight pointer/interpolate
    -- targeting this same fully-resolved pointer string — the same one
    -- ptr_ptrInterpPrepare keys its scheduler table entries on — so its
    -- done flow never fires. Not called on a failed/rejected set, or by
    -- ptr_writePointerRaw (the scheduler's OWN interpolation-tick writes,
    -- which must never self-kill).
    if host.killPointerInterp then host.killPointerInterp(resolved) end
    if host.onPointerSet then host.onPointerSet(resolved, value) end
  end
  return ok
end

-- Writes an already-resolved (no template substitution needed) pointer path
-- straight into the document — used by the scheduler's `setPointer` effect.
function ptr_writePointerRaw(gltf, resolvedPointer, value)
  return ptr_setPointerValue(gltf, resolvedPointer, value)
end

-- Resolves + validates a pointer/interpolate target exactly like
-- interpreter.ts's handlePointerInterpolate: build the effective pointer,
-- reject invalid/negative int params or empty ref params, then read+
-- validate the CURRENT value against the configured type (virtual pointers
-- are never interpolation targets). Returns nil on failure.
function ptr_ptrInterpPrepare(host, pointer, args, t)
  if not host.gltf then return nil end
  local params = ptr_extractPointerParams(pointer)
  for _, p in ipairs(params) do
    if p.kind == "int" then
      local num = tonumber(args[p.name])
      if num == nil or num ~= num or num == math.huge or num == -math.huge or num < 0 then
        return nil
      end
    else
      local s = args[p.name]
      if s == nil or tostring(s) == "" then return nil end
    end
  end
  local resolved = ptr_buildEffectivePointer(pointer, args)
  if resolved == nil then return nil end
  local value, isValid = ptr_resolvePointerValue(host.gltf, resolved)
  if not isValid or not ptr_valueMatchesType(value, t) then return nil end
  local startValue
  if type(value) == "table" then
    startValue = {}
    for i = 1, #value do startValue[i] = value[i] + 0.0 end
  else
    startValue = { value + 0.0 }
  end
  return { resolved = resolved, startValue = startValue }
end
