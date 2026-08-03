// Small shared helpers for working with the mutable glTF document
// representation this runtime uses throughout: System.Text.Json.Nodes.JsonNode
// (JsonObject/JsonArray/JsonValue) parsed once per Engine instance from the
// test harness's JSON payload. JsonNode (unlike the read-only JsonDocument/
// JsonElement pair) supports in-place mutation, which is what Pointer.cs's
// ptr_set / Animation.cs's channel-sample writes need — the C# analog of
// Python's mutable dict/list decoded by `json.loads` (pointer.py, animation.py)
// or JS's parsed object (the TS oracle). 0-based array indices throughout,
// matching every other backend.
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace GltfiRuntime;

public static class JsonUtil
{
    // True for a JSON node holding a numeric leaf (JsonValue wrapping any
    // numeric CLR type) — mirrors Python's `isinstance(v, (int, float)) and
    // not isinstance(v, bool)` / the TS oracle's `typeof v === "number"`.
    // Booleans are represented as JsonValue<bool>, which is NOT numeric, so no
    // separate bool-exclusion check is needed the way Python's guard needs one
    // (Python's bool IS an int subclass; C#'s JsonValue<bool> is not a numeric
    // JsonValue at all).
    public static bool IsNumber(JsonNode? node)
    {
        if (node is not JsonValue v)
        {
            return false;
        }
        try
        {
            return v.GetValueKind() == JsonValueKind.Number;
        }
        catch
        {
            return false;
        }
    }

    public static bool TryGetNumber(JsonNode? node, out double value)
    {
        if (IsNumber(node))
        {
            value = node!.GetValue<double>();
            return true;
        }
        value = 0;
        return false;
    }

    public static bool IsBool(JsonNode? node)
    {
        return node is JsonValue v && v.GetValueKind() == JsonValueKind.True || node is JsonValue v2 && v2.GetValueKind() == JsonValueKind.False;
    }

    public static bool IsString(JsonNode? node)
    {
        return node is JsonValue v && v.GetValueKind() == JsonValueKind.String;
    }

    public static string? AsString(JsonNode? node)
    {
        return IsString(node) ? node!.GetValue<string>() : null;
    }

    // Reads an integer-valued numeric node (finite, whole) as an `int`, else
    // null — used everywhere a glTF property is itself an array index
    // ("mesh", "camera", "sampler", ...).
    public static int? AsIndex(JsonNode? node)
    {
        if (!TryGetNumber(node, out var d) || double.IsNaN(d) || double.IsInfinity(d))
        {
            return null;
        }
        return (int)Math.Floor(d);
    }

    public static JsonArray ToArray(IReadOnlyList<double> values)
    {
        var arr = new JsonArray();
        foreach (var v in values)
        {
            arr.Add(JsonValue.Create(v));
        }
        return arr;
    }

    // Reads a JsonArray of numbers into a double[]; returns null if `node` is
    // not an array of exclusively finite/any numbers (NaN/Infinity ARE
    // accepted as "numbers" here — glTF documents never legitimately contain
    // them, but callers that need finiteness check separately, mirroring the
    // Python/TS oracles' own separate `_finite_arr` checks).
    public static double[]? ReadNumberArray(JsonNode? node)
    {
        if (node is not JsonArray arr)
        {
            return null;
        }
        var outArr = new double[arr.Count];
        for (var i = 0; i < arr.Count; i++)
        {
            if (!TryGetNumber(arr[i], out var d))
            {
                return null;
            }
            outArr[i] = d;
        }
        return outArr;
    }

    // Child lookup that works uniformly whether `current` is a JsonObject
    // (property lookup) or a JsonArray (numeric-string index lookup) —
    // mirrors the TS oracle's naive `current[token]`, which works for both
    // JS objects and arrays alike (see pointer.py's own identical comment on
    // its `_resolve_pointer_ref`/`_resolve_pointer_value`).
    public static JsonNode? GetChild(JsonNode? current, string token)
    {
        if (current is JsonObject obj)
        {
            return obj.TryGetPropertyValue(token, out var v) ? v : null;
        }
        if (current is JsonArray arr && IsDigits(token))
        {
            var idx = int.Parse(token);
            return idx >= 0 && idx < arr.Count ? arr[idx] : null;
        }
        return null;
    }

    public static bool IsDigits(string s)
    {
        if (s.Length == 0)
        {
            return false;
        }
        foreach (var ch in s)
        {
            if (ch < '0' || ch > '9')
            {
                return false;
            }
        }
        return true;
    }

    // Deep-clones a JsonNode — needed whenever a value that might already be
    // attached to the document tree (or came from a `JsonArray.Add`-adjacent
    // spot) must be written to a second location: a JsonNode instance can
    // only ever have ONE parent at a time (unlike a Python/JS value, which
    // can be aliased freely), so every write site in Pointer.cs/Animation.cs
    // that isn't building a brand new node from scratch clones first.
    public static JsonNode? Clone(JsonNode? node)
    {
        return node?.DeepClone();
    }
}
