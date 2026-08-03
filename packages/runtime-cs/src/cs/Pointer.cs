// JSON Pointer Template resolver for compiled Engine.PtrGet/Engine.PtrSet
// calls. Transcribed from packages/runtime-py/src/py/gltfi_runtime/
// pointer.py (itself transcribed from packages/runtime-lib/src/pointer.ts):
// plain property/array traversal, TRS defaults, node matrix/globalMatrix
// (get + set), morph-target weights (get + set), ref-typed sibling-
// collection reads, and the KHR_interactivity host-fed/runtime virtual
// pointers. 0-based throughout. The glTF document is represented as a
// mutable System.Text.Json.Nodes.JsonNode? tree (JsonObject/JsonArray/
// JsonValue) — see JsonUtil.cs's own header for why this representation
// was chosen (the C# analog of Python's json.loads-decoded dict/list, or
// JS's parsed object: mutable, so ptr_set/animation channel writes can
// mutate it in place).
using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;

namespace GltfiRuntime;

public sealed class PointerHost
{
    public JsonNode? Gltf;
    public Func<string, bool>? IsDelayActive;
    public Func<int, bool>? IsAnimationPlaying;
    public Func<int, (double Playhead, double VirtualPlayhead)>? GetAnimationPlayhead;
    public double[]? ActiveCameraPosition;
    public double[]? ActiveCameraRotation;
    public Action<string, object>? OnPointerSet;
}

public readonly struct PtrResult
{
    public readonly object? Value;
    public readonly bool IsValid;
    public PtrResult(object? value, bool isValid)
    {
        Value = value;
        IsValid = isValid;
    }
}

public static class Pointer
{
    private static string DecodeToken(string token) => token.Replace("~1", "/").Replace("~0", "~");

    private static double[] ComputeLocalMatrix(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            var m = JsonUtil.ReadNumberArray(obj["matrix"]);
            if (m != null && m.Length == 16)
            {
                return m;
            }
            var t = JsonUtil.ReadNumberArray(obj["translation"]) ?? new double[] { 0, 0, 0 };
            var r = JsonUtil.ReadNumberArray(obj["rotation"]) ?? new double[] { 0, 0, 0, 1 };
            var s = JsonUtil.ReadNumberArray(obj["scale"]) ?? new double[] { 1, 1, 1 };
            return KMath.Mat4Compose(t, r, s);
        }
        return KMath.Mat4Compose(new double[] { 0, 0, 0 }, new double[] { 0, 0, 0, 1 }, new double[] { 1, 1, 1 });
    }

    private static int FindParent(JsonNode? gltf, int nodeIndex)
    {
        var nodes = (gltf as JsonObject)?["nodes"] as JsonArray;
        if (nodes == null)
        {
            return -1;
        }
        for (var i = 0; i < nodes.Count; i++)
        {
            if (nodes[i] is JsonObject nodeObj && nodeObj["children"] is JsonArray children)
            {
                foreach (var c in children)
                {
                    var idx = JsonUtil.AsIndex(c);
                    if (idx == nodeIndex)
                    {
                        return i;
                    }
                }
            }
        }
        return -1;
    }

    private static double[] ComputeGlobalMatrix(JsonNode? gltf, int nodeIndex, Dictionary<int, double[]> cache)
    {
        if (cache.TryGetValue(nodeIndex, out var cached))
        {
            return cached;
        }
        var nodes = (gltf as JsonObject)?["nodes"] as JsonArray;
        JsonNode? nodeNode = nodes != null && nodeIndex >= 0 && nodeIndex < nodes.Count ? nodes[nodeIndex] : null;
        var local = ComputeLocalMatrix(nodeNode);
        var parent = FindParent(gltf, nodeIndex);
        var global = parent >= 0 ? KMath.Mat4Mul(ComputeGlobalMatrix(gltf, parent, cache), local) : local;
        cache[nodeIndex] = global;
        return global;
    }

    private static int GetMeshTargetCount(JsonObject? mesh)
    {
        if (mesh?["primitives"] is not JsonArray primitives || primitives.Count == 0)
        {
            return 0;
        }
        return primitives[0] is JsonObject prim0 && prim0["targets"] is JsonArray targets ? targets.Count : 0;
    }

    private static int? FindMeshNodeIndex(JsonNode? gltf, int startIndex)
    {
        var nodes = (gltf as JsonObject)?["nodes"] as JsonArray;
        if (nodes == null || startIndex < 0 || startIndex >= nodes.Count)
        {
            return null;
        }
        var visited = new HashSet<int>();
        var queue = new Queue<int>();
        queue.Enqueue(startIndex);
        while (queue.Count > 0)
        {
            var index = queue.Dequeue();
            if (visited.Contains(index))
            {
                continue;
            }
            visited.Add(index);
            var node = index >= 0 && index < nodes.Count ? nodes[index] as JsonObject : null;
            if (node != null && JsonUtil.IsNumber(node["mesh"]))
            {
                return index;
            }
            if (node?["children"] is JsonArray children)
            {
                foreach (var c in children)
                {
                    var idx = JsonUtil.AsIndex(c);
                    if (idx != null)
                    {
                        queue.Enqueue(idx.Value);
                    }
                }
            }
        }
        return null;
    }

    // A pointer addressing a property whose value is an index into a sibling
    // top-level collection resolves (when read with type "ref") to a
    // reference to that collection element.
    private static readonly Dictionary<string, string> RefCollections = new()
    {
        ["mesh"] = "meshes", ["camera"] = "cameras", ["skin"] = "skins", ["material"] = "materials",
        ["scene"] = "scenes", ["node"] = "nodes", ["children"] = "nodes", ["parent"] = "nodes",
        ["nodes"] = "nodes", ["joints"] = "nodes", ["skeleton"] = "nodes", ["animations"] = "animations",
        ["meshes"] = "meshes", ["cameras"] = "cameras", ["skins"] = "skins", ["materials"] = "materials",
        ["scenes"] = "scenes", ["lights"] = "lights"
    };

    private static PtrResult ResolvePointerRef(JsonNode? gltf, string resolved)
    {
        var tokens = SplitTokens(resolved);
        if (tokens.Count == 0)
        {
            return new PtrResult("", false);
        }
        var last = tokens[^1];
        var isIndex = JsonUtil.IsDigits(last);
        var propToken = isIndex ? tokens[^2] : last;
        if (!RefCollections.TryGetValue(propToken, out var collection))
        {
            return new PtrResult("", false);
        }
        var parentTokenCount = isIndex ? tokens.Count - 2 : tokens.Count - 1;
        JsonNode? current = gltf;
        for (var i = 0; i < parentTokenCount; i++)
        {
            if (current == null)
            {
                return new PtrResult("", false);
            }
            current = JsonUtil.GetChild(current, tokens[i]);
        }
        if (current == null)
        {
            return new PtrResult("", false);
        }
        JsonNode? raw;
        if (isIndex)
        {
            var sub = current is JsonObject co ? co[propToken] : null;
            var idx = int.Parse(last);
            raw = sub is JsonArray subArr && idx >= 0 && idx < subArr.Count ? subArr[idx] : null;
        }
        else
        {
            raw = current is JsonObject co2 ? co2[propToken] : null;
        }
        if (isIndex && raw is JsonObject or JsonArray)
        {
            return new PtrResult("/" + string.Join("/", tokens), true);
        }
        if (!JsonUtil.TryGetNumber(raw, out var num))
        {
            return new PtrResult("", true);
        }
        return new PtrResult($"/{collection}/{(int)Math.Floor(num)}", true);
    }

    private static PtrResult ResolveWeightsLength(JsonNode? gltf, int? nodeIndex, int? meshIndex)
    {
        var nodesTop = (gltf as JsonObject)?["nodes"] as JsonArray;
        var meshesTop = (gltf as JsonObject)?["meshes"] as JsonArray;
        if (nodeIndex != null)
        {
            var meshNodeIndex = FindMeshNodeIndex(gltf, nodeIndex.Value);
            var meshNode = meshNodeIndex != null && nodesTop != null && meshNodeIndex.Value < nodesTop.Count ? nodesTop[meshNodeIndex.Value] as JsonObject : null;
            JsonObject? mesh = null;
            if (meshNode != null && JsonUtil.AsIndex(meshNode["mesh"]) is int mi && meshesTop != null && mi >= 0 && mi < meshesTop.Count)
            {
                mesh = meshesTop[mi] as JsonObject;
            }
            if (mesh == null)
            {
                return new PtrResult(0.0, false);
            }
            var targetCount = GetMeshTargetCount(mesh);
            if (meshNode?["weights"] is JsonArray w1)
            {
                return new PtrResult((double)w1.Count, true);
            }
            if (mesh["weights"] is JsonArray w2)
            {
                return new PtrResult((double)w2.Count, true);
            }
            return new PtrResult((double)targetCount, true);
        }
        if (meshIndex != null)
        {
            var mesh = meshesTop != null && meshIndex.Value >= 0 && meshIndex.Value < meshesTop.Count ? meshesTop[meshIndex.Value] as JsonObject : null;
            if (mesh == null)
            {
                return new PtrResult(0.0, false);
            }
            var targetCount = GetMeshTargetCount(mesh);
            if (mesh["weights"] is JsonArray w)
            {
                return new PtrResult((double)w.Count, true);
            }
            return new PtrResult((double)targetCount, true);
        }
        return new PtrResult(0.0, false);
    }

    private static List<string> SplitTokens(string resolved)
    {
        var parts = resolved.Split('/');
        var outList = new List<string>();
        foreach (var p in parts)
        {
            if (p.Length != 0)
            {
                outList.Add(DecodeToken(p));
            }
        }
        return outList;
    }

    // Result.Value is one of: null, double, double[], JsonArray (matrix
    // arrays are always returned as double[] here) — resolved BEFORE type
    // validation (`_value_matches_type` in the Python oracle); PtrGet below
    // performs that check afterward.
    private static PtrResult ResolvePointerValue(JsonNode? gltf, string resolved)
    {
        var tokens = SplitTokens(resolved);
        JsonNode? current = gltf;
        int? nodeIndex = null;
        int? meshIndex = null;
        var nodesTop = (gltf as JsonObject)?["nodes"] as JsonArray;
        var meshesTop = (gltf as JsonObject)?["meshes"] as JsonArray;

        for (var i = 0; i < tokens.Count; i++)
        {
            var token = tokens[i];
            if (current == null)
            {
                return new PtrResult(null, false);
            }
            if (token.EndsWith(".length"))
            {
                var baseName = token[..^".length".Length];
                if (baseName == "weights")
                {
                    return ResolveWeightsLength(gltf, nodeIndex, meshIndex);
                }
                if (current is not JsonObject curObj || !curObj.ContainsKey(baseName))
                {
                    return new PtrResult(0.0, false);
                }
                var next = curObj[baseName];
                var isArr = next is JsonArray;
                return new PtrResult(isArr ? (double)((JsonArray)next!).Count : 0.0, isArr);
            }
            if ((token == "matrix" || token == "globalMatrix") && nodeIndex != null)
            {
                if (token == "matrix")
                {
                    var nodeNode = nodesTop != null && nodeIndex.Value < nodesTop.Count ? nodesTop[nodeIndex.Value] : null;
                    return new PtrResult(ComputeLocalMatrix(nodeNode), true);
                }
                return new PtrResult(ComputeGlobalMatrix(gltf, nodeIndex.Value, new Dictionary<int, double[]>()), true);
            }
            if (token == "[]")
            {
                return new PtrResult(null, false);
            }

            if (nodeIndex != null && nodesTop != null && nodeIndex.Value < nodesTop.Count && ReferenceEquals(current, nodesTop[nodeIndex.Value])
                && (current is not JsonObject curObj2 || !curObj2.ContainsKey(token)))
            {
                if (token == "translation")
                {
                    return new PtrResult(new double[] { 0.0, 0.0, 0.0 }, true);
                }
                if (token == "rotation")
                {
                    return new PtrResult(new double[] { 0.0, 0.0, 0.0, 1.0 }, true);
                }
                if (token == "scale")
                {
                    return new PtrResult(new double[] { 1.0, 1.0, 1.0 }, true);
                }
            }

            var weightsHandled = false;
            if (token == "weights")
            {
                var nextToken = i + 1 < tokens.Count ? tokens[i + 1] : null;
                var hasIndex = nextToken != null && JsonUtil.IsDigits(nextToken.TrimStart('-'));
                if (!hasIndex)
                {
                    return new PtrResult(null, false);
                }
                if (nodeIndex != null)
                {
                    var meshNodeIndex = FindMeshNodeIndex(gltf, nodeIndex.Value);
                    var meshNode = meshNodeIndex != null && nodesTop != null && meshNodeIndex.Value < nodesTop.Count ? nodesTop[meshNodeIndex.Value] as JsonObject : null;
                    JsonObject? mesh = null;
                    if (meshNode != null && JsonUtil.AsIndex(meshNode["mesh"]) is int mi && meshesTop != null && mi >= 0 && mi < meshesTop.Count)
                    {
                        mesh = meshesTop[mi] as JsonObject;
                    }
                    if (mesh == null)
                    {
                        return new PtrResult(null, false);
                    }
                    var targetCount = GetMeshTargetCount(mesh);
                    if (meshNode?["weights"] is JsonArray)
                    {
                        current = meshNode["weights"];
                        weightsHandled = true;
                    }
                    else if (mesh["weights"] is JsonArray)
                    {
                        current = mesh["weights"];
                        weightsHandled = true;
                    }
                    else if (targetCount > 0)
                    {
                        current = JsonUtil.ToArray(Fill(targetCount, 0.5));
                        weightsHandled = true;
                    }
                    else
                    {
                        return new PtrResult(null, false);
                    }
                }
                else if (meshIndex != null)
                {
                    var mesh = meshesTop != null && meshIndex.Value >= 0 && meshIndex.Value < meshesTop.Count ? meshesTop[meshIndex.Value] as JsonObject : null;
                    if (mesh == null)
                    {
                        return new PtrResult(null, false);
                    }
                    var targetCount = GetMeshTargetCount(mesh);
                    if (mesh["weights"] is JsonArray)
                    {
                        current = mesh["weights"];
                        weightsHandled = true;
                    }
                    else if (targetCount > 0)
                    {
                        current = JsonUtil.ToArray(Fill(targetCount, 0.5));
                        weightsHandled = true;
                    }
                    else
                    {
                        current = JsonUtil.ToArray(new double[] { 0.0 });
                        weightsHandled = true;
                    }
                }
            }

            if (!weightsHandled)
            {
                if (JsonUtil.IsDigits(token.TrimStart('-')) && current is JsonArray curArr)
                {
                    var index = int.Parse(token);
                    if (index < 0 || index >= curArr.Count)
                    {
                        return new PtrResult(null, false);
                    }
                    var next = curArr[index];
                    if (next != null)
                    {
                        if (nodesTop != null && index >= 0 && index < nodesTop.Count && ReferenceEquals(next, nodesTop[index]))
                        {
                            nodeIndex = index;
                        }
                        if (meshesTop != null && index >= 0 && index < meshesTop.Count && ReferenceEquals(next, meshesTop[index]))
                        {
                            meshIndex = index;
                        }
                    }
                    current = next;
                }
                else
                {
                    current = current is JsonObject co ? (co.ContainsKey(token) ? co[token] : null) : null;
                }
            }
        }

        return ExtractLeaf(current);
    }

    private static double[] Fill(int count, double value)
    {
        var arr = new double[count];
        for (var i = 0; i < count; i++)
        {
            arr[i] = value;
        }
        return arr;
    }

    // Converts a terminal JsonNode into the plain-CLR-value shape PtrGet's
    // caller expects: bool, double, double[] (for a JsonArray of numbers),
    // string, or null. Mirrors what a Python dict/list/scalar leaf already
    // IS natively (no conversion needed there) / what a JS value already is.
    private static PtrResult ExtractLeaf(JsonNode? current)
    {
        if (current == null)
        {
            return new PtrResult(null, false);
        }
        if (JsonUtil.IsBool(current))
        {
            return new PtrResult(current.GetValue<bool>(), true);
        }
        if (JsonUtil.TryGetNumber(current, out var num))
        {
            return new PtrResult(num, true);
        }
        if (JsonUtil.IsString(current))
        {
            return new PtrResult(current.GetValue<string>(), true);
        }
        if (current is JsonArray arr)
        {
            var nums = JsonUtil.ReadNumberArray(arr);
            return nums != null ? new PtrResult(nums, true) : new PtrResult(null, false);
        }
        // JsonObject or anything else: not a leaf value type this runtime
        // ever reads/writes as a KHR_interactivity value.
        return new PtrResult(null, false);
    }

    // ---------------------------------------------------------------------
    // Writing.
    // ---------------------------------------------------------------------

    private static bool SetPointerValue(JsonNode? gltf, string resolved, object value)
    {
        if (gltf is not JsonObject) { /* still proceed like Python (gltf may be any dict-shaped node) */ }
        var tokens = SplitTokens(resolved);
        JsonNode? current = gltf;
        JsonNode? parent = null;
        object? parentKey = null; // string (object key) or int (array index)
        int? nodeIndex = null;
        int? meshIndex = null;
        var nodesTop = (gltf as JsonObject)?["nodes"] as JsonArray;
        var meshesTop = (gltf as JsonObject)?["meshes"] as JsonArray;

        for (var i = 0; i < tokens.Count; i++)
        {
            var token = tokens[i];
            var isLast = i == tokens.Count - 1;
            if (token.EndsWith(".length") || token == "globalMatrix")
            {
                return false;
            }
            if (token == "matrix" && isLast && nodeIndex != null && nodesTop != null && nodesTop[nodeIndex.Value] is JsonObject matNodeObj)
            {
                matNodeObj["matrix"] = ToJsonValue(value);
                return true;
            }
            var nextToken = i + 1 < tokens.Count ? tokens[i + 1] : null;
            var nextIsIndex = nextToken != null && JsonUtil.IsDigits(nextToken.TrimStart('-'));

            if (token == "weights")
            {
                if (!nextIsIndex)
                {
                    return false;
                }
                if (nodeIndex != null)
                {
                    var meshNodeIndex = FindMeshNodeIndex(gltf, nodeIndex.Value);
                    var meshNode = meshNodeIndex != null && nodesTop != null && meshNodeIndex.Value < nodesTop.Count ? nodesTop[meshNodeIndex.Value] as JsonObject : null;
                    JsonObject? mesh = null;
                    if (meshNode != null && JsonUtil.AsIndex(meshNode["mesh"]) is int mi && meshesTop != null && mi >= 0 && mi < meshesTop.Count)
                    {
                        mesh = meshesTop[mi] as JsonObject;
                    }
                    if (mesh == null)
                    {
                        return false;
                    }
                    var targetCount = GetMeshTargetCount(mesh);
                    if (targetCount == 0)
                    {
                        return false;
                    }
                    if (meshNode!["weights"] is not JsonArray)
                    {
                        var baseArr = mesh["weights"] is JsonArray mw ? JsonUtil.ReadNumberArray(mw)! : Fill(targetCount, 0.5);
                        meshNode["weights"] = JsonUtil.ToArray(baseArr);
                    }
                    var srcArr = (JsonArray)meshNode["weights"]!;
                    var nextWeights = new double[targetCount];
                    for (var k = 0; k < targetCount; k++)
                    {
                        var num = k < srcArr.Count && JsonUtil.TryGetNumber(srcArr[k], out var nv) ? (double?)nv : null;
                        nextWeights[k] = num != null && !double.IsNaN(num.Value) && !double.IsInfinity(num.Value) ? num.Value : 0.0;
                    }
                    meshNode["weights"] = JsonUtil.ToArray(nextWeights);
                    current = meshNode["weights"];
                }
                else if (meshIndex != null)
                {
                    var mesh = meshesTop != null && meshIndex.Value >= 0 && meshIndex.Value < meshesTop.Count ? meshesTop[meshIndex.Value] as JsonObject : null;
                    if (mesh == null)
                    {
                        return false;
                    }
                    var targetCount = GetMeshTargetCount(mesh);
                    if (targetCount == 0)
                    {
                        return false;
                    }
                    if (mesh["weights"] is not JsonArray)
                    {
                        mesh["weights"] = JsonUtil.ToArray(Fill(targetCount, 0.5));
                    }
                    var srcArr = (JsonArray)mesh["weights"]!;
                    var nextWeights = new double[targetCount];
                    for (var k = 0; k < targetCount; k++)
                    {
                        var num = k < srcArr.Count && JsonUtil.TryGetNumber(srcArr[k], out var nv) ? (double?)nv : null;
                        nextWeights[k] = num != null && !double.IsNaN(num.Value) && !double.IsInfinity(num.Value) ? num.Value : 0.0;
                    }
                    mesh["weights"] = JsonUtil.ToArray(nextWeights);
                    current = mesh["weights"];
                }
                else
                {
                    return false;
                }
            }
            else
            {
                if (JsonUtil.IsDigits(token.TrimStart('-')))
                {
                    var index = int.Parse(token);
                    if (current is not JsonArray)
                    {
                        var freshArr = new JsonArray();
                        AssignIntoParent(parent, parentKey, freshArr);
                        current = freshArr;
                    }
                    var curArr = (JsonArray)current!;
                    if (isLast)
                    {
                        while (curArr.Count <= index)
                        {
                            curArr.Add(null);
                        }
                        curArr[index] = ToJsonValue(value);
                    }
                    else
                    {
                        while (curArr.Count <= index)
                        {
                            curArr.Add(null);
                        }
                        if (curArr[index] == null)
                        {
                            curArr[index] = new JsonObject();
                        }
                        parent = curArr;
                        parentKey = index;
                        current = curArr[index];
                        if (nodesTop != null && index >= 0 && index < nodesTop.Count && ReferenceEquals(current, nodesTop[index]))
                        {
                            nodeIndex = index;
                        }
                        if (meshesTop != null && index >= 0 && index < meshesTop.Count && ReferenceEquals(current, meshesTop[index]))
                        {
                            meshIndex = index;
                        }
                    }
                }
                else
                {
                    if (current is not JsonObject)
                    {
                        var freshObj = new JsonObject();
                        AssignIntoParent(parent, parentKey, freshObj);
                        current = freshObj;
                    }
                    var curObj = (JsonObject)current!;
                    if (isLast)
                    {
                        curObj[token] = ToJsonValue(value);
                    }
                    else
                    {
                        if (!curObj.ContainsKey(token) || curObj[token] == null)
                        {
                            curObj[token] = nextIsIndex ? new JsonArray() : new JsonObject();
                        }
                        parent = curObj;
                        parentKey = token;
                        current = curObj[token];
                    }
                }
            }
        }
        return true;
    }

    private static void AssignIntoParent(JsonNode? parent, object? parentKey, JsonNode value)
    {
        if (parent is JsonArray parentArr && parentKey is int idx)
        {
            parentArr[idx] = value;
        }
        else if (parent is JsonObject parentObj && parentKey is string key)
        {
            parentObj[key] = value;
        }
    }

    // Builds the JsonNode form of a plain CLR value (bool/double/double[]/
    // string) for assignment into the tree.
    private static JsonNode? ToJsonValue(object? value)
    {
        return value switch
        {
            null => null,
            bool b => JsonValue.Create(b),
            double d => JsonValue.Create(d),
            int i => JsonValue.Create((double)i),
            string s => JsonValue.Create(s),
            double[] arr => JsonUtil.ToArray(arr),
            _ => null
        };
    }

    // JS-like Number-to-String conversion for an int-kind pointer template
    // param's substituted value — see pointer.py's `_js_like_str` doc
    // comment for the full rationale (an int-typed value that happens to
    // arrive as a whole-number FLOAT must stringify WITHOUT a trailing
    // ".0", or every downstream digit-only pointer-token check silently
    // breaks). `value` here is always a `double` (this backend's pointer
    // template int params are always fed as doubles — see Engine.cs) or a
    // `string`/`bool`, mirroring the Python oracle's dynamic dispatch.
    private static string JsLikeStr(object v)
    {
        if (v is bool b)
        {
            return b ? "true" : "false";
        }
        if (v is double d)
        {
            if (double.IsNaN(d))
            {
                return "NaN";
            }
            if (double.IsPositiveInfinity(d))
            {
                return "Infinity";
            }
            if (double.IsNegativeInfinity(d))
            {
                return "-Infinity";
            }
            if (d == Math.Truncate(d) && Math.Abs(d) < 1e16)
            {
                return ((long)d).ToString();
            }
            return d.ToString("R", System.Globalization.CultureInfo.InvariantCulture);
        }
        return v?.ToString() ?? "";
    }

    // Substitutes evaluated template parameters into a
    // "/nodes/[nodeIndex]/mesh"-style pointer template. Returns null on
    // failure. `args` values are `double` (int-kind params) or `string`
    // (ref-kind params).
    private static string? BuildEffectivePointer(string pointer, IReadOnlyDictionary<string, object> args)
    {
        var segments = pointer.Split('/');
        var outParts = new List<string>();
        foreach (var segment in segments)
        {
            if (segment.Length > 2 && segment[0] == '[' && segment[^1] == ']')
            {
                var key = segment[1..^1];
                if (args.TryGetValue(key, out var v) && v != null)
                {
                    outParts.Add(JsLikeStr(v));
                }
                else
                {
                    outParts.Add("0");
                }
                continue;
            }
            if (segment.Length > 2 && segment[0] == '{' && segment[^1] == '}')
            {
                var key = segment[1..^1];
                var raw = args.TryGetValue(key, out var rv) ? rv : null;
                var refStr = raw?.ToString() ?? "";
                if (refStr.Length == 0)
                {
                    return null;
                }
                if (refStr.StartsWith("delay:") || refStr.StartsWith("event:"))
                {
                    outParts.Add(refStr);
                    continue;
                }
                var slash = refStr.LastIndexOf('/');
                if (slash < 0)
                {
                    return null;
                }
                var prefix = refStr[..slash];
                var idx = refStr[(slash + 1)..];
                if (string.Join("/", outParts) != prefix || !JsonUtil.IsDigits(idx))
                {
                    return null;
                }
                outParts.Add(idx);
                continue;
            }
            outParts.Add(segment);
        }
        return string.Join("/", outParts);
    }

    public readonly struct PtrParam
    {
        public readonly string Name;
        public readonly bool IsRef; // false = int-kind
        public PtrParam(string name, bool isRef)
        {
            Name = name;
            IsRef = isRef;
        }
    }

    public static List<PtrParam> ExtractPointerParams(string pointer)
    {
        var result = new List<PtrParam>();
        foreach (var segment in pointer.Split('/'))
        {
            if (segment.Length > 2 && segment[0] == '[' && segment[^1] == ']')
            {
                result.Add(new PtrParam(segment[1..^1], false));
            }
            else if (segment.Length > 2 && segment[0] == '{' && segment[^1] == '}')
            {
                result.Add(new PtrParam(segment[1..^1], true));
            }
        }
        return result;
    }

    private static readonly Dictionary<string, int> ValueTypeLengths = new()
    {
        ["float2"] = 2, ["float3"] = 3, ["float4"] = 4, ["float2x2"] = 4, ["float3x3"] = 9, ["float4x4"] = 16
    };

    private static bool ValueMatchesType(object? value, string t)
    {
        if (t == "bool")
        {
            return value is bool;
        }
        if (t == "int")
        {
            return value is double d && !double.IsNaN(d) && !double.IsInfinity(d) && Math.Floor(d) == d;
        }
        if (t == "float")
        {
            return value is double d2 && !double.IsNaN(d2) && !double.IsInfinity(d2);
        }
        if (t == "ref")
        {
            return value is string;
        }
        if (ValueTypeLengths.TryGetValue(t, out var expected))
        {
            if (value is not double[] arr || arr.Length != expected)
            {
                return false;
            }
            foreach (var x in arr)
            {
                if (double.IsNaN(x) || double.IsInfinity(x))
                {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    public static object DefaultRaw(string t)
    {
        return t switch
        {
            "bool" => false,
            "int" => 0.0,
            "float" => 0.0,
            "float2" => new double[] { 0.0, 0.0 },
            "float3" => new double[] { 0.0, 0.0, 0.0 },
            "float4" => new double[] { 0.0, 0.0, 0.0, 0.0 },
            "float2x2" => new double[] { 1.0, 0.0, 0.0, 1.0 },
            "float3x3" => new double[] { 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0 },
            "float4x4" => new double[] { 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 },
            "ref" => "",
            _ => 0.0
        };
    }

    // Extensions this runtime implements; used by the asset/extensions/
    // {name}/enabled capability pointer (KHR_interactivity S4.2.1).
    private static readonly HashSet<string> SupportedExtensions = new()
    {
        "KHR_interactivity", "KHR_node_visibility", "KHR_node_selectability",
        "KHR_node_hoverability", "KHR_animation_pointer", "KHR_lights_punctual"
    };

    // Runtime limits reported through /extensions/KHR_interactivity/limits/* (S4.2.2).
    private static readonly Dictionary<string, int> RuntimeLimits = new()
    {
        ["maxActiveAnimations"] = 32, ["maxActiveDelays"] = 64,
        ["maxActivePropertyInterpolations"] = 64, ["maxActiveVariableInterpolations"] = 64
    };

    private static readonly HashSet<string> AnimProps = new() { "isPlaying", "minTime", "maxTime", "playhead", "virtualPlayhead" };

    private static readonly System.Text.RegularExpressions.Regex ExtEnabledRe =
        new(@"^/extensions/KHR_interactivity/asset/extensions/([^/]+)/enabled$");
    private static readonly System.Text.RegularExpressions.Regex LimitRe =
        new(@"^/extensions/KHR_interactivity/limits/([^/]+)$");
    private static readonly System.Text.RegularExpressions.Regex AnimRe =
        new(@"^/animations/(\d+)/extensions/KHR_interactivity/(.+)$");
    private static readonly System.Text.RegularExpressions.Regex DelayRefRe =
        new(@"^/extensions/KHR_interactivity/delays/\{[^}]+\}$");
    private static readonly System.Text.RegularExpressions.Regex EventRefRe =
        new(@"^/extensions/KHR_interactivity/events/\{[^}]+\}$");

    private static PtrResult? ResolveVirtualPointer(PointerHost host, string resolved, string t)
    {
        if (resolved == "/extensions/KHR_interactivity/activeCamera/position")
        {
            if (t != "float3")
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            return new PtrResult(host.ActiveCameraPosition ?? new[] { double.NaN, double.NaN, double.NaN }, true);
        }
        if (resolved == "/extensions/KHR_interactivity/activeCamera/rotation")
        {
            if (t != "float4")
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            return new PtrResult(host.ActiveCameraRotation ?? new[] { double.NaN, double.NaN, double.NaN, double.NaN }, true);
        }
        if (resolved is "/extensions/KHR_interactivity/asset/majorVersion" or "/extensions/KHR_interactivity/asset/minorVersion")
        {
            if (t != "int")
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            return new PtrResult(resolved.EndsWith("majorVersion") ? 2.0 : 0.0, true);
        }
        var m = ExtEnabledRe.Match(resolved);
        if (m.Success)
        {
            if (t != "bool")
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            var name = m.Groups[1].Value;
            var used = (host.Gltf as JsonObject)?["extensionsUsed"] as JsonArray;
            var isUsed = false;
            if (used != null)
            {
                foreach (var u in used)
                {
                    if (JsonUtil.AsString(u) == name)
                    {
                        isUsed = true;
                        break;
                    }
                }
            }
            var enabled = SupportedExtensions.Contains(name) && (name == "KHR_interactivity" || isUsed);
            return new PtrResult(enabled, true);
        }
        m = LimitRe.Match(resolved);
        if (m.Success)
        {
            if (!RuntimeLimits.TryGetValue(m.Groups[1].Value, out var limit) || t != "int")
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            return new PtrResult((double)limit, true);
        }
        m = AnimRe.Match(resolved);
        if (m.Success && AnimProps.Contains(m.Groups[2].Value))
        {
            var index = int.Parse(m.Groups[1].Value);
            var prop = m.Groups[2].Value;
            var animations = (host.Gltf as JsonObject)?["animations"] as JsonArray;
            var animation = animations != null && index >= 0 && index < animations.Count ? animations[index] : null;
            if (animation == null)
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            if (prop == "isPlaying")
            {
                if (t != "bool")
                {
                    return new PtrResult(DefaultRaw(t), false);
                }
                return new PtrResult(host.IsAnimationPlaying?.Invoke(index) ?? false, true);
            }
            if (t != "float")
            {
                return new PtrResult(DefaultRaw(t), false);
            }
            if (prop == "minTime" || prop == "maxTime")
            {
                var (min, max) = Animation.GetAnimationTimeRange(host.Gltf, index);
                return new PtrResult(prop == "minTime" ? min : max, true);
            }
            var state = host.GetAnimationPlayhead?.Invoke(index) ?? (0.0, 0.0);
            return new PtrResult(prop == "playhead" ? state.Playhead : state.VirtualPlayhead, true);
        }
        return null;
    }

    public static PtrResult PtrGet(PointerHost host, string pointer, IReadOnlyDictionary<string, object> args, string t)
    {
        if (host.Gltf == null)
        {
            return new PtrResult(DefaultRaw(t), false);
        }
        var parms = ExtractPointerParams(pointer);
        foreach (var p in parms)
        {
            if (!p.IsRef)
            {
                if (!args.TryGetValue(p.Name, out var raw) || raw is not double num || double.IsNaN(num) || double.IsInfinity(num) || num < 0)
                {
                    return new PtrResult(DefaultRaw(t), false);
                }
            }
        }
        if (DelayRefRe.IsMatch(pointer))
        {
            var refVal = args.Count > 0 ? (FirstArgValue(args)?.ToString() ?? "") : "";
            if (t == "ref" && (host.IsDelayActive?.Invoke(refVal) ?? false))
            {
                return new PtrResult(refVal, true);
            }
            return new PtrResult(DefaultRaw(t), false);
        }
        if (EventRefRe.IsMatch(pointer))
        {
            var refVal = args.Count > 0 ? (FirstArgValue(args)?.ToString() ?? "") : "";
            if (t == "ref" && refVal.StartsWith("event:"))
            {
                return new PtrResult(refVal, true);
            }
            return new PtrResult(DefaultRaw(t), false);
        }
        var resolved = BuildEffectivePointer(pointer, args);
        if (resolved == null)
        {
            return new PtrResult(DefaultRaw(t), false);
        }
        var virt = ResolveVirtualPointer(host, resolved, t);
        if (virt != null)
        {
            return virt.Value;
        }
        if (t == "ref")
        {
            return ResolvePointerRef(host.Gltf, resolved);
        }
        var result = ResolvePointerValue(host.Gltf, resolved);
        if (!result.IsValid || !ValueMatchesType(result.Value, t))
        {
            return new PtrResult(DefaultRaw(t), false);
        }
        return new PtrResult(result.Value, true);
    }

    private static object? FirstArgValue(IReadOnlyDictionary<string, object> args)
    {
        foreach (var kv in args)
        {
            return kv.Value;
        }
        return null;
    }

    public static bool PtrSet(PointerHost host, string pointer, IReadOnlyDictionary<string, object> args, string t, object value)
    {
        if (host.Gltf == null)
        {
            return false;
        }
        if (!ValueMatchesType(value, t))
        {
            return false;
        }
        var parms = ExtractPointerParams(pointer);
        foreach (var p in parms)
        {
            if (!p.IsRef)
            {
                if (!args.TryGetValue(p.Name, out var raw) || raw is not double num || double.IsNaN(num) || double.IsInfinity(num) || num < 0)
                {
                    return false;
                }
            }
            else
            {
                if (!args.TryGetValue(p.Name, out var s) || s is not string str || str.Length == 0)
                {
                    return false;
                }
            }
        }
        var resolved = BuildEffectivePointer(pointer, args);
        if (resolved == null)
        {
            return false;
        }
        var ok = SetPointerValue(host.Gltf, resolved, value);
        if (ok)
        {
            host.OnPointerSet?.Invoke(resolved, value);
        }
        return ok;
    }

    // Writes an already-resolved (no template substitution needed) pointer
    // path straight into the document — used by the scheduler's setPointer
    // effect.
    public static bool WritePointerRaw(JsonNode? gltf, string resolvedPointer, object value) => SetPointerValue(gltf, resolvedPointer, value);

    public readonly struct PtrInterpPrep
    {
        public readonly string Resolved;
        public readonly double[] StartValue;
        public PtrInterpPrep(string resolved, double[] startValue)
        {
            Resolved = resolved;
            StartValue = startValue;
        }
    }

    // Resolves + validates a pointer/interpolate target. Returns null on failure.
    public static PtrInterpPrep? PtrInterpPrepare(PointerHost host, string pointer, IReadOnlyDictionary<string, object> args, string t)
    {
        if (host.Gltf == null)
        {
            return null;
        }
        var parms = ExtractPointerParams(pointer);
        foreach (var p in parms)
        {
            if (!p.IsRef)
            {
                if (!args.TryGetValue(p.Name, out var raw) || raw is not double num || double.IsNaN(num) || double.IsInfinity(num) || num < 0)
                {
                    return null;
                }
            }
            else
            {
                if (!args.TryGetValue(p.Name, out var s) || s is not string str || str.Length == 0)
                {
                    return null;
                }
            }
        }
        var resolved = BuildEffectivePointer(pointer, args);
        if (resolved == null)
        {
            return null;
        }
        var result = ResolvePointerValue(host.Gltf, resolved);
        if (!result.IsValid || !ValueMatchesType(result.Value, t))
        {
            return null;
        }
        double[] startValue = result.Value switch
        {
            double[] arr => arr,
            double d => new[] { d },
            bool b => new[] { b ? 1.0 : 0.0 },
            _ => new double[] { 0.0 }
        };
        return new PtrInterpPrep(resolved, startValue);
    }
}
