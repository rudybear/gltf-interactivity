// Pure state-machine transitions for the KHR_interactivity stateful flow
// nodes (doN, multiGate, waitAll, throttle). Transcribed from
// packages/runtime-py/src/py/gltfi_runtime/state.py (itself transcribed from
// packages/kernel/src/state.ts). Each function returns the next state
// together with the decision the caller acts on (mirrors the TS source's
// return-object shape, just as a tuple instead of a dict/object). 0-based
// lists throughout, matching the TS/Python sources exactly (no index-base
// conversion needed).
using System;
using System.Collections.Generic;

namespace GltfiRuntime;

public static class State
{
    public static (bool Fire, double Count) DoNAdvance(double count, double n)
    {
        if (count < n)
        {
            return (true, count + 1);
        }
        return (false, count);
    }

    // randomIndex(count) returns a 0-based index in [0, count) — same contract
    // as the Python/TS oracle's callback (see Engine.cs's MultiGate handling).
    public static (bool[] Used, int Index) MultiGateAdvance(
        IReadOnlyList<bool> usedIn, int outputCount, bool isRandom, bool isLoop, Func<int, int> randomIndex)
    {
        bool[] used;
        if (usedIn.Count == outputCount)
        {
            used = new bool[outputCount];
            for (var i = 0; i < outputCount; i++)
            {
                used[i] = usedIn[i];
            }
        }
        else
        {
            used = new bool[outputCount];
        }
        var index = -1;
        if (!isRandom)
        {
            for (var i = 0; i < outputCount; i++)
            {
                if (!used[i])
                {
                    index = i;
                    break;
                }
            }
        }
        else
        {
            var available = new List<int>();
            for (var i = 0; i < outputCount; i++)
            {
                if (!used[i])
                {
                    available.Add(i);
                }
            }
            if (available.Count > 0)
            {
                index = available[randomIndex(available.Count)];
            }
        }
        if (index == -1 && isLoop)
        {
            used = new bool[outputCount];
            index = isRandom ? randomIndex(outputCount) : 0;
        }
        if (index >= 0)
        {
            used[index] = true;
        }
        return (used, index);
    }

    // remainingIn may be null (unset) -- Python's `remaining_in: Optional[float]`
    // / the TS oracle's `remainingIn ?? inputFlows`.
    //
    // Unlike the TS oracle's `activatedIn.slice()` (safe there only because a
    // too-short JS array tolerates an out-of-bounds READ, returning
    // `undefined` -- falsy, so `!activated[index]` below still behaves
    // correctly even before any padding), and unlike a Python list (which
    // raises IndexError on out-of-bounds access, so state.py rebuilds a fresh
    // length-`inputFlows` list defensively), a too-short C# List<bool>/array
    // read via `[i]` would throw too. This always rebuilds a fresh
    // length-`inputFlows` array, copying whatever prefix of `activatedIn` is
    // available and padding the rest with false, exactly mirroring state.py's
    // documented fix.
    public static (bool[] Activated, double Remaining, bool Completed) WaitAllAdvance(
        IReadOnlyList<bool> activatedIn, double? remainingIn, int inputFlows, int index)
    {
        var activated = new bool[inputFlows];
        for (var i = 0; i < inputFlows; i++)
        {
            activated[i] = i < activatedIn.Count && activatedIn[i];
        }
        double remaining = remainingIn ?? inputFlows;
        if (index >= 0 && index < inputFlows)
        {
            if (!activated[index])
            {
                activated[index] = true;
                remaining = remaining - 1;
            }
        }
        return (activated, remaining, remaining <= 0);
    }

    // lastTimeIn may be null (unset) -- Python's `last_time_in: Optional[float]`
    // / the TS oracle's `lastTimeIn ?? -Infinity`.
    public static (bool Fire, double LastTime, double Remaining) ThrottleAdvance(
        double? lastTimeIn, double duration, double now)
    {
        double last = lastTimeIn ?? double.NegativeInfinity;
        double elapsed = now - last;
        if (elapsed >= duration)
        {
            return (true, now, 0);
        }
        return (false, last, Math.Max(0.0, duration - elapsed));
    }
}
