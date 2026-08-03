-- Minimal JSON decoder (decode-only — this runtime never serializes the
-- gltf document back out to JS; see run-compiled-lua.ts's bridge, which
-- reads engine state back through primitive-valued bridge functions, never
-- by re-encoding JSON). Objects and arrays both decode to plain Lua tables;
-- arrays are 1-based sequential-integer-keyed tables (this is "the
-- boundary" the architecture note refers to — everywhere else in this
-- runtime, arrays/vectors are 1-based Lua tables, matching Lua convention;
-- the raw glTF JSON text handed in from JS is 0-based-array notation only
-- until this decoder runs). JSON `null` decodes to Lua `nil` (dropped from
-- the table) — acceptable here because glTF documents don't use JSON null
-- for anything this runtime's conformance corpus exercises.
function json_decode(text)
  local pos = 1
  local len = #text

  local function skip_ws()
    while pos <= len do
      local c = text:sub(pos, pos)
      if c == " " or c == "\t" or c == "\n" or c == "\r" then
        pos = pos + 1
      else
        break
      end
    end
  end

  local parse_value -- forward decl

  local function parse_error(msg)
    error("json_decode: " .. msg .. " at byte " .. pos)
  end

  local function parse_string()
    -- text:sub(pos,pos) == '"'
    pos = pos + 1
    local out = {}
    while true do
      if pos > len then parse_error("unterminated string") end
      local c = text:sub(pos, pos)
      if c == '"' then
        pos = pos + 1
        break
      elseif c == "\\" then
        local n = text:sub(pos + 1, pos + 1)
        if n == "n" then out[#out + 1] = "\n"
        elseif n == "t" then out[#out + 1] = "\t"
        elseif n == "r" then out[#out + 1] = "\r"
        elseif n == "b" then out[#out + 1] = "\b"
        elseif n == "f" then out[#out + 1] = "\f"
        elseif n == '"' then out[#out + 1] = '"'
        elseif n == "\\" then out[#out + 1] = "\\"
        elseif n == "/" then out[#out + 1] = "/"
        elseif n == "u" then
          local hex = text:sub(pos + 2, pos + 5)
          local code = tonumber(hex, 16) or 0
          if code < 0x80 then
            out[#out + 1] = string.char(code)
          elseif code < 0x800 then
            out[#out + 1] = string.char(0xC0 + math.floor(code / 0x40), 0x80 + (code % 0x40))
          else
            out[#out + 1] = string.char(
              0xE0 + math.floor(code / 0x1000),
              0x80 + (math.floor(code / 0x40) % 0x40),
              0x80 + (code % 0x40)
            )
          end
          pos = pos + 4
        else
          out[#out + 1] = n
        end
        pos = pos + 2
      else
        out[#out + 1] = c
        pos = pos + 1
      end
    end
    return table.concat(out)
  end

  local function parse_number()
    local start = pos
    if text:sub(pos, pos) == "-" then pos = pos + 1 end
    while pos <= len and text:sub(pos, pos):match("%d") do pos = pos + 1 end
    if text:sub(pos, pos) == "." then
      pos = pos + 1
      while pos <= len and text:sub(pos, pos):match("%d") do pos = pos + 1 end
    end
    local c = text:sub(pos, pos)
    if c == "e" or c == "E" then
      pos = pos + 1
      local sc = text:sub(pos, pos)
      if sc == "+" or sc == "-" then pos = pos + 1 end
      while pos <= len and text:sub(pos, pos):match("%d") do pos = pos + 1 end
    end
    return tonumber(text:sub(start, pos - 1))
  end

  local function parse_object()
    pos = pos + 1 -- '{'
    local obj = {}
    skip_ws()
    if text:sub(pos, pos) == "}" then
      pos = pos + 1
      return obj
    end
    while true do
      skip_ws()
      if text:sub(pos, pos) ~= '"' then parse_error("expected string key") end
      local key = parse_string()
      skip_ws()
      if text:sub(pos, pos) ~= ":" then parse_error("expected ':'") end
      pos = pos + 1
      skip_ws()
      local value = parse_value()
      if value ~= nil then
        obj[key] = value
      end
      skip_ws()
      local c = text:sub(pos, pos)
      if c == "," then
        pos = pos + 1
      elseif c == "}" then
        pos = pos + 1
        break
      else
        parse_error("expected ',' or '}'")
      end
    end
    return obj
  end

  local function parse_array()
    pos = pos + 1 -- '['
    local arr = {}
    local n = 0
    skip_ws()
    if text:sub(pos, pos) == "]" then
      pos = pos + 1
      return arr
    end
    while true do
      skip_ws()
      local value = parse_value()
      n = n + 1
      arr[n] = value
      skip_ws()
      local c = text:sub(pos, pos)
      if c == "," then
        pos = pos + 1
      elseif c == "]" then
        pos = pos + 1
        break
      else
        parse_error("expected ',' or ']'")
      end
    end
    return arr
  end

  parse_value = function()
    skip_ws()
    local c = text:sub(pos, pos)
    if c == "{" then
      return parse_object()
    elseif c == "[" then
      return parse_array()
    elseif c == '"' then
      return parse_string()
    elseif c == "t" then
      pos = pos + 4
      return true
    elseif c == "f" then
      pos = pos + 5
      return false
    elseif c == "n" then
      pos = pos + 4
      return nil
    else
      return parse_number()
    end
  end

  skip_ws()
  if pos > len then
    return nil
  end
  return parse_value()
end
