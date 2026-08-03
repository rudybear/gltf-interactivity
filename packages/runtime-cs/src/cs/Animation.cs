// Animation sampling helpers, transcribed from packages/runtime-py/src/py/
// gltfi_runtime/animation.py (itself transcribed from packages/kernel/src/
// animation.ts). The glTF document is represented here as a mutable
// System.Text.Json.Nodes.JsonNode tree (JsonObject/JsonArray/JsonValue) --
// the C# analog of Python's json.loads-decoded dict/list (mutable, aliasing-
// free writes) or JS's parsed object, NOT the read-only JsonDocument/
// JsonElement pair. All glTF-JSON indices (accessor/animation/node index,
// ...) are 0-based, matching both the glTF spec's own convention and every
// other backend in this monorepo -- no index-base conversion needed
// anywhere in this file.
using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Text.Json.Nodes;

namespace GltfiRuntime;

public static class Animation
{
    private static readonly Dictionary<string, int> AccessorComponentCounts = new()
    {
        ["SCALAR"] = 1,
        ["VEC2"] = 2,
        ["VEC3"] = 3,
        ["VEC4"] = 4,
        ["MAT2"] = 4,
        ["MAT3"] = 9,
        ["MAT4"] = 16,
    };

    // Mirrors Python's `obj.get(key, default) or default`-style numeric
    // reads used throughout animation.py for byteOffset/count/etc: a
    // missing key OR an explicit JSON null both fall back to `def` (in both
    // cases JsonUtil.GetChild returns a null reference, so TryGetNumber
    // fails and we take the fallback) -- only a present, well-typed numeric
    // value is used verbatim.
    private static double GetNumberOrDefault(JsonNode? node, string key, double def)
    {
        return JsonUtil.TryGetNumber(JsonUtil.GetChild(node, key), out var v) ? v : def;
    }

    // Decodes an accessor from the binary chunk as a list of per-element
    // (0-based) double[] -- mirrors read_accessor_elements in animation.py.
    // Only tightly-packed float32 data is supported (componentType 5126).
    // Returns null when unavailable (accessor missing, no bin, wrong
    // componentType, bufferView missing, or the computed byte range exceeds
    // glbBin's length) -- mirrors every one of animation.py's None-return
    // guards.
    public static double[][]? ReadAccessorElements(JsonNode? gltf, byte[]? glbBin, int accessorIndex)
    {
        var accessorsArr = JsonUtil.GetChild(gltf, "accessors") as JsonArray;
        JsonNode? accessorNode = accessorsArr != null && accessorIndex >= 0 && accessorIndex < accessorsArr.Count
            ? accessorsArr[accessorIndex]
            : null;
        var accessor = accessorNode as JsonObject;
        if (accessor == null || glbBin == null)
        {
            return null;
        }
        if (!JsonUtil.TryGetNumber(JsonUtil.GetChild(accessor, "componentType"), out var componentType) || componentType != 5126)
        {
            return null;
        }
        var typeStr = JsonUtil.AsString(JsonUtil.GetChild(accessor, "type"));
        int componentCount = typeStr != null && AccessorComponentCounts.TryGetValue(typeStr, out var cc) ? cc : 1;

        var bufferViewsArr = JsonUtil.GetChild(gltf, "bufferViews") as JsonArray;
        int viewIndex = JsonUtil.AsIndex(JsonUtil.GetChild(accessor, "bufferView")) ?? 0;
        JsonNode? viewNode = bufferViewsArr != null && viewIndex >= 0 && viewIndex < bufferViewsArr.Count
            ? bufferViewsArr[viewIndex]
            : null;
        var view = viewNode as JsonObject;
        if (view == null)
        {
            return null;
        }

        int byteOffset = (int)(GetNumberOrDefault(view, "byteOffset", 0) + GetNumberOrDefault(accessor, "byteOffset", 0));
        int count = (int)GetNumberOrDefault(accessor, "count", 0);
        long end = (long)byteOffset + (long)count * componentCount * 4;
        if (end > glbBin.Length)
        {
            return null;
        }

        var span = new ReadOnlySpan<byte>(glbBin);
        var outArr = new double[count][];
        for (var i = 0; i < count; i++)
        {
            var element = new double[componentCount];
            for (var j = 0; j < componentCount; j++)
            {
                int offset = byteOffset + (i * componentCount + j) * 4;
                element[j] = BinaryPrimitives.ReadSingleLittleEndian(span.Slice(offset, 4));
            }
            outArr[i] = element;
        }
        return outArr;
    }

    // Mirrors get_animation_time_range: returns (NaN, NaN) if the animation
    // doesn't exist or the computed range isn't finite.
    public static (double Min, double Max) GetAnimationTimeRange(JsonNode? gltf, int animationIndex)
    {
        var animationsArr = JsonUtil.GetChild(gltf, "animations") as JsonArray;
        JsonNode? animNode = animationsArr != null && animationIndex >= 0 && animationIndex < animationsArr.Count
            ? animationsArr[animationIndex]
            : null;
        var animation = animNode as JsonObject;
        if (animation == null)
        {
            return (double.NaN, double.NaN);
        }

        double min = double.PositiveInfinity;
        double max = double.NegativeInfinity;

        var usedSamplers = new HashSet<int?>();
        var channelsArr = JsonUtil.GetChild(animation, "channels") as JsonArray;
        if (channelsArr != null)
        {
            foreach (var chNode in channelsArr)
            {
                var chObj = chNode as JsonObject;
                usedSamplers.Add(chObj != null ? JsonUtil.AsIndex(JsonUtil.GetChild(chObj, "sampler")) : null);
            }
        }

        var accessorsArr = JsonUtil.GetChild(gltf, "accessors") as JsonArray;
        var samplersArr = JsonUtil.GetChild(animation, "samplers") as JsonArray;

        foreach (var samplerIndex in usedSamplers)
        {
            JsonObject? sampler = samplerIndex.HasValue && samplersArr != null
                && samplerIndex.Value >= 0 && samplerIndex.Value < samplersArr.Count
                ? samplersArr[samplerIndex.Value] as JsonObject
                : null;
            int inputIndex = sampler != null ? JsonUtil.AsIndex(JsonUtil.GetChild(sampler, "input")) ?? -1 : -1;
            JsonObject? inputAccessor = accessorsArr != null && inputIndex >= 0 && inputIndex < accessorsArr.Count
                ? accessorsArr[inputIndex] as JsonObject
                : null;
            if (inputAccessor == null)
            {
                continue;
            }
            if (JsonUtil.GetChild(inputAccessor, "min") is JsonArray minArr && minArr.Count > 0
                && JsonUtil.TryGetNumber(minArr[0], out var mn))
            {
                min = Math.Min(min, mn);
            }
            if (JsonUtil.GetChild(inputAccessor, "max") is JsonArray maxArr && maxArr.Count > 0
                && JsonUtil.TryGetNumber(maxArr[0], out var mx))
            {
                max = Math.Max(max, mx);
            }
        }

        if (double.IsNaN(min) || double.IsInfinity(min) || double.IsNaN(max) || double.IsInfinity(max))
        {
            return (double.NaN, double.NaN);
        }
        return (min, max);
    }

    // Maps a requested timestamp on the infinite timeline to the effective
    // timestamp within the animation data range [0, T] (KHR_interactivity
    // section 4.6). Mirrors effective_animation_time exactly.
    public static double EffectiveAnimationTime(double requested, double maxTime)
    {
        if (maxTime == 0 || double.IsNaN(maxTime))
        {
            return 0.0;
        }
        double s = requested > 0 ? Math.Ceiling((requested - maxTime) / maxTime) : Math.Floor(requested / maxTime);
        return requested - s * maxTime;
    }

    // Samples animation `animationIndex` at virtual-timeline position
    // `requested`, writes the resulting channel values into `gltf`'s node
    // objects, and invokes `onChannelWrite` per written channel. Returns
    // null if the animation doesn't exist. Mirrors apply_animation_at.
    public static (double T, bool WroteAny)? ApplyAnimationAt(
        JsonNode? gltf, byte[]? glbBin, int animationIndex, double requested,
        Action<string, double[]>? onChannelWrite)
    {
        var animationsArr = JsonUtil.GetChild(gltf, "animations") as JsonArray;
        JsonNode? animNode = animationsArr != null && animationIndex >= 0 && animationIndex < animationsArr.Count
            ? animationsArr[animationIndex]
            : null;
        var animation = animNode as JsonObject;
        if (animation == null)
        {
            return null;
        }

        var (_, maxTimeRaw) = GetAnimationTimeRange(gltf, animationIndex);
        double maxTime = double.IsNaN(maxTimeRaw) ? 0.0 : maxTimeRaw;
        double t = EffectiveAnimationTime(requested, maxTime);
        bool wroteAny = false;

        var samplersArr = JsonUtil.GetChild(animation, "samplers") as JsonArray;
        var channelsArr = JsonUtil.GetChild(animation, "channels") as JsonArray;
        var nodesArr = JsonUtil.GetChild(gltf, "nodes") as JsonArray;

        if (channelsArr != null)
        {
            foreach (var chNode in channelsArr)
            {
                var channel = chNode as JsonObject;
                if (channel == null)
                {
                    continue;
                }
                int? samplerIndex = JsonUtil.AsIndex(JsonUtil.GetChild(channel, "sampler"));
                JsonObject? sampler = samplerIndex.HasValue && samplersArr != null
                    && samplerIndex.Value >= 0 && samplerIndex.Value < samplersArr.Count
                    ? samplersArr[samplerIndex.Value] as JsonObject
                    : null;
                var target = JsonUtil.GetChild(channel, "target") as JsonObject;
                int? nodeIndex = target != null ? JsonUtil.AsIndex(JsonUtil.GetChild(target, "node")) : null;
                if (sampler == null || target == null || nodeIndex == null)
                {
                    continue;
                }
                // target.get("path") is read once here and reused below (for
                // both the rotation-slerp check and the final node-property
                // write), matching animation.py's `target.get("path")` value
                // being stable across both uses. A missing/non-string "path"
                // is defensively skipped here (JsonObject property names
                // can't be null, unlike a Python dict key) rather than
                // mirroring animation.py's literal `node[None] = sampled`
                // (a real-but-meaningless Python dict entry that can't occur
                // for spec-conformant glTF, since "path" is a required
                // channel.target property) -- see report for this judgment
                // call.
                string? path = JsonUtil.AsString(JsonUtil.GetChild(target, "path"));
                if (path == null)
                {
                    continue;
                }

                int inputAccIndex = JsonUtil.AsIndex(JsonUtil.GetChild(sampler, "input")) ?? -1;
                int outputAccIndex = JsonUtil.AsIndex(JsonUtil.GetChild(sampler, "output")) ?? -1;
                var timesRaw = ReadAccessorElements(gltf, glbBin, inputAccIndex);
                var values = ReadAccessorElements(gltf, glbBin, outputAccIndex);
                if (timesRaw == null || values == null || timesRaw.Length == 0)
                {
                    continue;
                }
                var times = new double[timesRaw.Length];
                for (var i = 0; i < timesRaw.Length; i++)
                {
                    // Defensive: a well-formed time accessor is always
                    // SCALAR (component count 1) so `item[0]` never fails in
                    // animation.py's Python source; guarded here anyway
                    // rather than mirroring that implicit assumption, since
                    // the brief calls for no exception to propagate for a
                    // malformed document.
                    times[i] = timesRaw[i].Length > 0 ? timesRaw[i][0] : 0.0;
                }

                string interpolation = JsonUtil.AsString(JsonUtil.GetChild(sampler, "interpolation")) ?? "LINEAR";
                int stride = interpolation == "CUBICSPLINE" ? 3 : 1;
                int cubicOffset = stride == 3 ? 1 : 0;

                double[] sampled;
                if (t <= times[0])
                {
                    sampled = values[0 * stride + cubicOffset];
                }
                else if (t >= times[times.Length - 1])
                {
                    sampled = values[(times.Length - 1) * stride + cubicOffset];
                }
                else
                {
                    var k = 0;
                    while (k + 1 < times.Length && times[k + 1] < t)
                    {
                        k += 1;
                    }
                    double t0 = times[k];
                    double t1 = times[k + 1];
                    double u = t1 > t0 ? (t - t0) / (t1 - t0) : 0.0;
                    var v0 = values[k * stride + cubicOffset];
                    var v1 = values[(k + 1) * stride + cubicOffset];
                    if (interpolation == "STEP")
                    {
                        sampled = v0;
                    }
                    else if (path == "rotation")
                    {
                        sampled = KMath.QuatSlerp(v0, v1, u);
                    }
                    else
                    {
                        sampled = new double[v0.Length];
                        for (var i = 0; i < v0.Length; i++)
                        {
                            sampled[i] = v0[i] + (v1[i] - v0[i]) * u;
                        }
                    }
                }

                int nodeIdx = nodeIndex.Value;
                JsonObject? node = nodesArr != null && nodeIdx >= 0 && nodeIdx < nodesArr.Count
                    ? nodesArr[nodeIdx] as JsonObject
                    : null;
                if (node == null)
                {
                    continue;
                }

                if (path == "weights")
                {
                    node["weights"] = JsonUtil.ToArray(sampled);
                }
                else
                {
                    node[path] = JsonUtil.ToArray(sampled);
                }
                onChannelWrite?.Invoke($"/nodes/{nodeIdx}/{path}", sampled);
                wroteAny = true;
            }
        }

        return (t, wroteAny);
    }
}
