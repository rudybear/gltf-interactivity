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

    // ---- accessor decoding (kernel animation.ts decodeAccessor) -------------

    private static int ComponentBytes(int componentType) => componentType switch
    {
        5120 or 5121 => 1,
        5122 or 5123 => 2,
        5125 or 5126 => 4,
        _ => 0
    };

    // A decoded accessor: `Count` elements of `Comps` components flattened
    // into one float32 array (element i, component j at Data[i * Comps + j]).
    // Integer data is already de-normalized when the accessor says
    // `normalized`. float32 storage mirrors the TS Float32Array exactly.
    public sealed class DecodedAccessor
    {
        public float[] Data = Array.Empty<float>();
        public int Count;
        public int Comps;
    }

    // Reads one scalar component little-endian, applying the spec's
    // normalization when requested: signed max(c / (2^(n-1)-1), -1),
    // unsigned c / (2^n-1).
    private static double ReadComponent(ReadOnlySpan<byte> bin, long offset, int componentType, bool normalized)
    {
        var o = (int)offset;
        switch (componentType)
        {
            case 5126:
                return BinaryPrimitives.ReadSingleLittleEndian(bin.Slice(o, 4));
            case 5120:
            {
                double c = (sbyte)bin[o];
                return normalized ? Math.Max(c / 127.0, -1.0) : c;
            }
            case 5121:
            {
                double c = bin[o];
                return normalized ? c / 255.0 : c;
            }
            case 5122:
            {
                double c = BinaryPrimitives.ReadInt16LittleEndian(bin.Slice(o, 2));
                return normalized ? Math.Max(c / 32767.0, -1.0) : c;
            }
            case 5123:
            {
                double c = BinaryPrimitives.ReadUInt16LittleEndian(bin.Slice(o, 2));
                return normalized ? c / 65535.0 : c;
            }
            default:
            {
                double c = BinaryPrimitives.ReadUInt32LittleEndian(bin.Slice(o, 4));
                return normalized ? c / 4294967295.0 : c;
            }
        }
    }

    private static JsonObject? ArrayObj(JsonNode? gltf, string key, int index)
    {
        var arr = JsonUtil.GetChild(gltf, key) as JsonArray;
        return arr != null && index >= 0 && index < arr.Count ? arr[index] as JsonObject : null;
    }

    // glTF 2.0 3.6.2: all six component types, `normalized`, byteStride
    // (interleaved), accessor+bufferView byteOffset, sparse substitution
    // (index types 5121/5123/5125) and a missing bufferView (zeros, which a
    // sparse block may then patch). Returns null when undecodable (no bin,
    // unknown type, out-of-range) -- callers skip such data deterministically.
    public static DecodedAccessor? DecodeAccessor(JsonNode? gltf, byte[]? glbBin, int accessorIndex)
    {
        var accessor = ArrayObj(gltf, "accessors", accessorIndex);
        if (accessor == null || glbBin == null)
        {
            return null;
        }
        var typeStr = JsonUtil.AsString(JsonUtil.GetChild(accessor, "type"));
        if (typeStr == null || !AccessorComponentCounts.TryGetValue(typeStr, out var comps))
        {
            return null;
        }
        if (!JsonUtil.TryGetNumber(JsonUtil.GetChild(accessor, "componentType"), out var ctD))
        {
            return null;
        }
        var componentType = (int)ctD;
        var compBytes = ComponentBytes(componentType);
        if (compBytes == 0)
        {
            return null;
        }
        if (!JsonUtil.TryGetNumber(JsonUtil.GetChild(accessor, "count"), out var countD) || countD != Math.Floor(countD) || countD < 0 || countD > int.MaxValue / 64)
        {
            return null;
        }
        var count = (int)countD;
        var normalized = JsonUtil.GetChild(accessor, "normalized") is JsonValue nv && nv.TryGetValue<bool>(out var nb) && nb;
        var data = new float[(long)count * comps];
        var bin = new ReadOnlySpan<byte>(glbBin);
        if (JsonUtil.GetChild(accessor, "bufferView") != null)
        {
            var viewIdx = JsonUtil.AsIndex(JsonUtil.GetChild(accessor, "bufferView"));
            var view = viewIdx.HasValue ? ArrayObj(gltf, "bufferViews", viewIdx.Value) : null;
            if (view == null)
            {
                return null;
            }
            long elementBytes = (long)comps * compBytes;
            long stride = (long)GetNumberOrDefault(view, "byteStride", elementBytes);
            long baseOff = (long)GetNumberOrDefault(view, "byteOffset", 0) + (long)GetNumberOrDefault(accessor, "byteOffset", 0);
            if (count > 0 && baseOff + (long)(count - 1) * stride + elementBytes > bin.Length)
            {
                return null;
            }
            for (var i = 0; i < count; i++)
            {
                long at = baseOff + (long)i * stride;
                for (var j = 0; j < comps; j++)
                {
                    data[i * comps + j] = (float)ReadComponent(bin, at + (long)j * compBytes, componentType, normalized);
                }
            }
        }
        if (JsonUtil.GetChild(accessor, "sparse") is JsonObject sparse)
        {
            if (!JsonUtil.TryGetNumber(JsonUtil.GetChild(sparse, "count"), out var nD) || nD != Math.Floor(nD) || nD < 0)
            {
                return null;
            }
            var n = (int)nD;
            var indices = JsonUtil.GetChild(sparse, "indices") as JsonObject;
            var values = JsonUtil.GetChild(sparse, "values") as JsonObject;
            var idxType = indices != null && JsonUtil.TryGetNumber(JsonUtil.GetChild(indices, "componentType"), out var itD) ? (int)itD : 0;
            var idxBytes = idxType is 5121 or 5123 or 5125 ? ComponentBytes(idxType) : 0;
            var idxViewIdx = indices != null ? JsonUtil.AsIndex(JsonUtil.GetChild(indices, "bufferView")) : null;
            var valViewIdx = values != null ? JsonUtil.AsIndex(JsonUtil.GetChild(values, "bufferView")) : null;
            var idxView = idxViewIdx.HasValue ? ArrayObj(gltf, "bufferViews", idxViewIdx.Value) : null;
            var valView = valViewIdx.HasValue ? ArrayObj(gltf, "bufferViews", valViewIdx.Value) : null;
            if (idxBytes == 0 || idxView == null || valView == null)
            {
                return null;
            }
            long idxBase = (long)GetNumberOrDefault(idxView, "byteOffset", 0) + (long)GetNumberOrDefault(indices, "byteOffset", 0);
            long valBase = (long)GetNumberOrDefault(valView, "byteOffset", 0) + (long)GetNumberOrDefault(values, "byteOffset", 0);
            if (idxBase + (long)n * idxBytes > bin.Length || valBase + (long)n * comps * compBytes > bin.Length)
            {
                return null;
            }
            for (var si = 0; si < n; si++)
            {
                var target = ReadComponent(bin, idxBase + (long)si * idxBytes, idxType, false);
                if (target >= count)
                {
                    return null;
                }
                for (var j = 0; j < comps; j++)
                {
                    data[(long)target * comps + j] = (float)ReadComponent(bin, valBase + ((long)si * comps + j) * compBytes, componentType, normalized);
                }
            }
        }
        return new DecodedAccessor { Data = data, Count = count, Comps = comps };
    }

    // Compat wrapper: per-element double[] arrays, or null when undecodable.
    // Uncached -- the animation sampler uses the cached flat path.
    public static double[][]? ReadAccessorElements(JsonNode? gltf, byte[]? glbBin, int accessorIndex)
    {
        var d = DecodeAccessor(gltf, glbBin, accessorIndex);
        if (d == null)
        {
            return null;
        }
        var outArr = new double[d.Count][];
        for (var i = 0; i < d.Count; i++)
        {
            var e = new double[d.Comps];
            for (var j = 0; j < d.Comps; j++)
            {
                e[j] = d.Data[i * d.Comps + j];
            }
            outArr[i] = e;
        }
        return outArr;
    }

    // ---- per-document cache (kernel animation.ts getDocCache) ---------------
    // Decoded accessors and per-animation channel plans are built once and
    // kept in a ConditionalWeakTable keyed by the glTF JSON root object, so
    // entries die with the document. An entry also remembers the binary
    // chunk and the accessors/animations/bufferViews node identities and is
    // rebuilt when any differs; InvalidateAnimationCache drops it explicitly.

    private sealed class ChannelPlan
    {
        public float[] Times = Array.Empty<float>();
        public float[] Values = Array.Empty<float>();
        public int Width;
        public bool Cubic;
        public bool Step;
        public string Path = "";
        public int Node;
        public string Pointer = "";
        public int LastKey;
    }

    private sealed class AnimationPlan
    {
        public double MaxTime;
        public List<ChannelPlan> Channels = new();
        public int Skipped;
    }

    private sealed class DocCache
    {
        public byte[]? Bin;
        public JsonNode? Accessors;
        public JsonNode? Animations;
        public JsonNode? BufferViews;
        public Dictionary<int, DecodedAccessor?> Decoded = new();
        public Dictionary<int, AnimationPlan> Plans = new();
        public int Decodes;
        public int Hits;
    }

    private static readonly System.Runtime.CompilerServices.ConditionalWeakTable<JsonNode, DocCache> DocCaches = new();

    private static DocCache? GetDocCache(JsonNode? gltf, byte[]? glbBin)
    {
        if (gltf is not JsonObject root)
        {
            return null;
        }
        var acc = root["accessors"];
        var anims = root["animations"];
        var views = root["bufferViews"];
        if (DocCaches.TryGetValue(root, out var cache)
            && ReferenceEquals(cache.Bin, glbBin) && ReferenceEquals(cache.Accessors, acc)
            && ReferenceEquals(cache.Animations, anims) && ReferenceEquals(cache.BufferViews, views))
        {
            return cache;
        }
        var fresh = new DocCache
        {
            Bin = glbBin,
            Accessors = acc,
            Animations = anims,
            BufferViews = views,
            Decodes = cache?.Decodes ?? 0,
            Hits = cache?.Hits ?? 0
        };
        DocCaches.Remove(root);
        DocCaches.Add(root, fresh);
        return fresh;
    }

    public static void InvalidateAnimationCache(JsonNode? gltf)
    {
        if (gltf != null)
        {
            DocCaches.Remove(gltf);
        }
    }

    // Diagnostics for tests: accessor decodes run vs. served from cache.
    public static (int Decodes, int Hits) GetAnimationCacheStats(JsonNode? gltf, byte[]? glbBin)
    {
        var c = GetDocCache(gltf, glbBin);
        return (c?.Decodes ?? 0, c?.Hits ?? 0);
    }

    private static DecodedAccessor? CachedAccessor(JsonNode? gltf, byte[]? glbBin, DocCache cache, int index)
    {
        if (cache.Decoded.TryGetValue(index, out var hit))
        {
            cache.Hits++;
            return hit;
        }
        cache.Decodes++;
        var decoded = DecodeAccessor(gltf, glbBin, index);
        cache.Decoded[index] = decoded;
        return decoded;
    }

    private static ChannelPlan? BuildChannelPlan(JsonNode? gltf, byte[]? glbBin, DocCache cache, JsonObject sampler, JsonObject target)
    {
        var path = JsonUtil.AsString(JsonUtil.GetChild(target, "path"));
        if (path == null)
        {
            return null;
        }
        var inIdx = JsonUtil.AsIndex(JsonUtil.GetChild(sampler, "input")) ?? -1;
        var outIdx = JsonUtil.AsIndex(JsonUtil.GetChild(sampler, "output")) ?? -1;
        var input = CachedAccessor(gltf, glbBin, cache, inIdx);
        var output = CachedAccessor(gltf, glbBin, cache, outIdx);
        if (input == null || output == null || input.Count == 0 || input.Comps != 1)
        {
            return null;
        }
        var interpolation = JsonUtil.AsString(JsonUtil.GetChild(sampler, "interpolation")) ?? "LINEAR";
        var cubic = interpolation == "CUBICSPLINE";
        // Output holds keys * (cubic ? 3 : 1) values of `width` components
        // (weights outputs are SCALAR accessors of keys * perKey * targets).
        long valueCount = (long)input.Count * (cubic ? 3 : 1);
        if (output.Data.Length == 0 || output.Data.Length % valueCount != 0)
        {
            return null;
        }
        var nodeIdx = JsonUtil.AsIndex(JsonUtil.GetChild(target, "node")) ?? 0;
        return new ChannelPlan
        {
            Times = input.Data,
            Values = output.Data,
            Width = (int)(output.Data.Length / valueCount),
            Cubic = cubic,
            Step = interpolation == "STEP",
            Path = path,
            Node = nodeIdx,
            Pointer = $"/nodes/{nodeIdx}/{path}",
            LastKey = 0
        };
    }

    private static AnimationPlan GetAnimationPlan(JsonNode? gltf, byte[]? glbBin, DocCache cache, int animationIndex, JsonObject animation)
    {
        if (cache.Plans.TryGetValue(animationIndex, out var cached))
        {
            return cached;
        }
        var (_, max) = GetAnimationTimeRange(gltf, animationIndex);
        var plan = new AnimationPlan { MaxTime = double.IsNaN(max) || double.IsInfinity(max) ? 0.0 : max };
        var samplers = JsonUtil.GetChild(animation, "samplers") as JsonArray;
        if (JsonUtil.GetChild(animation, "channels") is JsonArray channels)
        {
            foreach (var chNode in channels)
            {
                var ch = chNode as JsonObject;
                var si = ch != null ? JsonUtil.AsIndex(JsonUtil.GetChild(ch, "sampler")) : null;
                var sampler = si.HasValue && samplers != null && si.Value >= 0 && si.Value < samplers.Count ? samplers[si.Value] as JsonObject : null;
                var target = ch != null ? JsonUtil.GetChild(ch, "target") as JsonObject : null;
                if (sampler == null || target == null || JsonUtil.AsIndex(JsonUtil.GetChild(target, "node")) == null)
                {
                    continue; // structurally invalid channel: ignored, not a data failure
                }
                var cp = BuildChannelPlan(gltf, glbBin, cache, sampler, target);
                if (cp != null)
                {
                    plan.Channels.Add(cp);
                }
                else
                {
                    plan.Skipped++;
                }
            }
        }
        cache.Plans[animationIndex] = plan;
        return plan;
    }

    // Finds k with times[k] <= t < times[k+1] (t strictly inside the range).
    // Playback is mostly monotonic: try the last key and its successor
    // before falling back to binary search.
    private static int FindKey(ChannelPlan plan, double t)
    {
        var times = plan.Times;
        int n = times.Length;
        int last = plan.LastKey;
        if (last + 1 < n && times[last] <= t && t < times[last + 1])
        {
            return last;
        }
        if (last + 2 < n && times[last + 1] <= t && t < times[last + 2])
        {
            plan.LastKey = last + 1;
            return last + 1;
        }
        int lo = 0, hi = n - 1;
        while (hi - lo > 1)
        {
            int mid = (lo + hi) >> 1;
            if (times[mid] <= t)
            {
                lo = mid;
            }
            else
            {
                hi = mid;
            }
        }
        plan.LastKey = lo;
        return lo;
    }

    private static double[] ReadValue(ChannelPlan plan, int slot)
    {
        var o = new double[plan.Width];
        int b = slot * plan.Width;
        for (var j = 0; j < plan.Width; j++)
        {
            o[j] = plan.Values[b + j];
        }
        return o;
    }

    private static double[] SampleChannel(ChannelPlan plan, double t)
    {
        int n = plan.Times.Length;
        int ValueSlot(int key) => plan.Cubic ? key * 3 + 1 : key;
        if (n == 1 || t <= plan.Times[0])
        {
            return ReadValue(plan, ValueSlot(0));
        }
        if (t >= plan.Times[n - 1])
        {
            return ReadValue(plan, ValueSlot(n - 1));
        }
        int k = FindKey(plan, t);
        double t0 = plan.Times[k];
        double dt = (double)plan.Times[k + 1] - t0;
        double u = dt > 0 ? (t - t0) / dt : 0.0;
        if (plan.Step)
        {
            return ReadValue(plan, k);
        }
        if (plan.Cubic)
        {
            // Cubic Hermite (glTF 2.0 Appendix C); tangents scaled by dt;
            // rotations re-normalized afterwards.
            int w = plan.Width;
            double u2 = u * u, u3 = u2 * u;
            double h00 = 2 * u3 - 3 * u2 + 1;
            double h10 = u3 - 2 * u2 + u;
            double h01 = -2 * u3 + 3 * u2;
            double h11 = u3 - u2;
            int v0 = ValueSlot(k) * w;
            int b0 = (k * 3 + 2) * w;
            int v1 = ValueSlot(k + 1) * w;
            int a1 = (k + 1) * 3 * w;
            var o = new double[w];
            for (var j = 0; j < w; j++)
            {
                o[j] = h00 * plan.Values[v0 + j] + h10 * dt * plan.Values[b0 + j] + h01 * plan.Values[v1 + j] + h11 * dt * plan.Values[a1 + j];
            }
            return plan.Path == "rotation" ? KMath.QuatNormalize(o) : o;
        }
        if (plan.Path == "rotation")
        {
            return KMath.QuatSlerp(ReadValue(plan, k), ReadValue(plan, k + 1), u);
        }
        var res = new double[plan.Width];
        int a = k * plan.Width;
        int bb = a + plan.Width;
        for (var j = 0; j < plan.Width; j++)
        {
            double x = plan.Values[a + j];
            res[j] = x + (plan.Values[bb + j] - x) * u;
        }
        return res;
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
    // null if the animation doesn't exist; SkippedChannels counts channels
    // whose accessor data was undecodable. Accessor decoding and channel
    // setup happen once per document (cache above); a tick only does
    // keyframe lookup + interpolation. Mirrors kernel applyAnimationAt.
    public static (double T, bool WroteAny, int SkippedChannels)? ApplyAnimationAt(
        JsonNode? gltf, byte[]? glbBin, int animationIndex, double requested,
        Action<string, double[]>? onChannelWrite)
    {
        var animation = ArrayObj(gltf, "animations", animationIndex);
        if (animation == null)
        {
            return null;
        }
        var cache = GetDocCache(gltf, glbBin);
        if (cache == null)
        {
            return null;
        }
        var plan = GetAnimationPlan(gltf, glbBin, cache, animationIndex, animation);
        double t = EffectiveAnimationTime(requested, plan.MaxTime);
        bool wroteAny = false;
        foreach (var channel in plan.Channels)
        {
            var node = ArrayObj(gltf, "nodes", channel.Node);
            if (node == null)
            {
                continue;
            }
            var sampled = SampleChannel(channel, t);
            node[channel.Path] = JsonUtil.ToArray(sampled);
            onChannelWrite?.Invoke(channel.Pointer, sampled);
            wroteAny = true;
        }
        return (t, wroteAny, plan.Skipped);
    }
}
