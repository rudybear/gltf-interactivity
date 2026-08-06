// Time/async scheduler for KHR_interactivity, transcribed from
// packages/runtime-py/src/py/gltfi_runtime/scheduler.py (itself transcribed
// from packages/kernel/src/scheduler.ts). Owns the delay table, the
// variable- and pointer-interpolation tables, the active-animation table,
// the current time/tick counters, and implements the exact 5-phase advance()
// ordering: animation playback, then pointer interpolations, then variable
// interpolations, then due delays, then per-tick handler activation.
//
// `SchedulerEffects` is the C# analog of scheduler.py's `effects` dict (the
// same 5 callbacks as TS's SchedulerEffects<Cont>). `Cont` is a plain
// zero-arg `Action`. Kernel values that flow through variable interpolation
// are `KernelValue` (Type + boxed Data array — bool/double/string elements,
// mirroring the shared `{"type":...,"data":[...]}` shape every other
// backend uses); pointer interpolation instead works directly in `double[]`
// since a pointer's resolved value is always numeric/vector, never bool/ref.
using System;
using System.Collections.Generic;
using System.Linq;

namespace GltfiRuntime;

public sealed class KernelValue
{
    public readonly string Type;
    public readonly object[] Data; // each element: bool, double, or string

    public KernelValue(string type, object[] data)
    {
        Type = type;
        Data = data;
    }
}

public sealed class SchedulerEffects
{
    public required Action<Action> FireFlow;
    public required Action<int, double> ApplyAnimationSample;
    public required Action<string, object> SetPointer; // value: double or double[]
    public required Action<int, KernelValue> SetVariable;
    public required Action OnTickPhase;
}

public sealed class DelayHandle
{
    public required int Id;
    public required string Ref;
}

public sealed class DelayEntry
{
    public required int Id;
    public required string Ref;
    public required double Time;
    public required Action Cont;
}

public sealed class VariableInterpEntry
{
    public required int VariableIndex;
    public required double Duration;
    public required KernelValue StartValue;
    public required KernelValue EndValue;
    public required double[] P1;
    public required double[] P2;
    public required bool UseSlerp;
    public Action? DoneCont;
    public double StartTime;
}

public sealed class PointerInterpEntry
{
    public required string Pointer;
    public required double Duration;
    public required double[] StartValue;
    public required double[] EndValue;
    public required double[] P1;
    public required double[] P2;
    public required bool IsQuaternion;
    public Action? DoneCont;
    public double StartTime;
}

public sealed class AnimationEntry
{
    public required int AnimationIndex;
    public required double StartTime;
    public required double EndTime;
    public double StopTime;
    public required double Speed;
    public required double EntryCreation;
    public Action? EndCont;
    public Action? StopCont;
}

public sealed class Scheduler
{
    private readonly SchedulerEffects _effects;

    public double Time;
    public int TickCount;
    public double LastTickDelta = double.NaN;

    private int _nextDelayId;
    private readonly List<DelayEntry> _delays = new();
    private readonly HashSet<string> _activeRefs = new();
    private readonly List<VariableInterpEntry> _variableInterps = new();
    private readonly List<PointerInterpEntry> _pointerInterps = new();
    private readonly List<AnimationEntry> _animations = new();

    public Scheduler(SchedulerEffects effects)
    {
        _effects = effects;
    }

    public DelayHandle AllocateDelayId()
    {
        var id = _nextDelayId;
        _nextDelayId += 1;
        var reference = $"delay:{id}";
        _activeRefs.Add(reference);
        return new DelayHandle { Id = id, Ref = reference };
    }

    public void ScheduleDelay(int id, string reference, double duration, Action cont)
    {
        _delays.Add(new DelayEntry { Id = id, Ref = reference, Time = Time + duration, Cont = cont });
    }

    public DelayEntry? CancelDelay(int id)
    {
        for (var i = 0; i < _delays.Count; i++)
        {
            if (_delays[i].Id == id)
            {
                var item = _delays[i];
                _delays.RemoveAt(i);
                _activeRefs.Remove(item.Ref);
                return item;
            }
        }
        return null;
    }

    public DelayEntry? FindDelayByRef(string reference)
    {
        foreach (var item in _delays)
        {
            if (item.Ref == reference)
            {
                return item;
            }
        }
        return null;
    }

    public bool IsDelayActive(string reference) => _activeRefs.Contains(reference);

    public void AddVariableInterp(VariableInterpEntry entry)
    {
        KillVariableInterp(entry.VariableIndex);
        entry.StartTime = Time;
        _variableInterps.Add(entry);
    }

    public void KillVariableInterp(int variableIndex)
    {
        _variableInterps.RemoveAll(v => v.VariableIndex == variableIndex);
    }

    public void AddPointerInterp(PointerInterpEntry entry)
    {
        KillPointerInterp(entry.Pointer);
        entry.StartTime = Time;
        _pointerInterps.Add(entry);
    }

    public void KillPointerInterp(string pointer)
    {
        _pointerInterps.RemoveAll(p => p.Pointer == pointer);
    }

    public void StartAnimation(AnimationEntry entry)
    {
        _animations.RemoveAll(a => a.AnimationIndex == entry.AnimationIndex);
        _animations.Add(entry);
    }

    public void StopAnimation(int animationIndex)
    {
        _animations.RemoveAll(a => a.AnimationIndex == animationIndex);
    }

    public bool StopAnimationAt(int animationIndex, double stopTime, Action? stopCont)
    {
        foreach (var entry in _animations)
        {
            if (entry.AnimationIndex == animationIndex)
            {
                entry.StopTime = stopTime;
                entry.StopCont = stopCont;
                return true;
            }
        }
        return false;
    }

    public bool IsAnimationPlaying(int animationIndex)
    {
        foreach (var a in _animations)
        {
            if (a.AnimationIndex == animationIndex)
            {
                return true;
            }
        }
        return false;
    }

    public int DelayCount => _delays.Count;
    public int PointerInterpCount => _pointerInterps.Count;

    private static double[] ValueToNumberArray(KernelValue v)
    {
        var outArr = new double[v.Data.Length];
        for (var i = 0; i < v.Data.Length; i++)
        {
            outArr[i] = v.Type == "bool" ? ((bool)v.Data[i] ? 1.0 : 0.0) : Convert.ToDouble(v.Data[i]);
        }
        return outArr;
    }

    public void Advance(double delta)
    {
        Time += delta;

        // Phase 1: animation playback. Collect-then-fire.
        var finishedAnimations = new List<Action>();
        var keptAnimations = new List<AnimationEntry>();
        foreach (var state in _animations)
        {
            var keep = true;
            if (state.StartTime == state.EndTime)
            {
                _effects.ApplyAnimationSample(state.AnimationIndex, state.StartTime);
                if (state.EndCont != null)
                {
                    finishedAnimations.Add(state.EndCont);
                }
                keep = false;
            }
            else
            {
                var elapsed = Math.Max(0.0, Time - state.EntryCreation);
                var scaled = state.StartTime > state.EndTime ? -elapsed * state.Speed : elapsed * state.Speed;
                var current = state.StartTime + scaled;
                var forward = state.StartTime < state.EndTime;
                var stopHit = forward
                    ? current >= state.StopTime && state.StopTime >= state.StartTime && state.StopTime < state.EndTime
                    : current <= state.StopTime && state.StopTime <= state.StartTime && state.StopTime > state.EndTime;
                if (stopHit)
                {
                    _effects.ApplyAnimationSample(state.AnimationIndex, state.StopTime);
                    if (state.StopCont != null)
                    {
                        finishedAnimations.Add(state.StopCont);
                    }
                    keep = false;
                }
                else
                {
                    var endHit = forward ? current >= state.EndTime : current <= state.EndTime;
                    if (endHit)
                    {
                        _effects.ApplyAnimationSample(state.AnimationIndex, state.EndTime);
                        if (state.EndCont != null)
                        {
                            finishedAnimations.Add(state.EndCont);
                        }
                        keep = false;
                    }
                    else
                    {
                        _effects.ApplyAnimationSample(state.AnimationIndex, current);
                    }
                }
            }
            if (keep)
            {
                keptAnimations.Add(state);
            }
        }
        _animations.Clear();
        _animations.AddRange(keptAnimations);
        foreach (var cont in finishedAnimations)
        {
            _effects.FireFlow(cont);
        }

        // Phase 2: object-model pointer interpolations. Same collect-then-fire.
        var finishedPointerInterps = new List<Action>();
        var keptPointerInterps = new List<PointerInterpEntry>();
        foreach (var interp in _pointerInterps)
        {
            var t = interp.Duration > 0 ? (Time - interp.StartTime) / interp.Duration : double.PositiveInfinity;
            var keep = true;
            if (t <= 0)
            {
                // no-op this tick, keep waiting.
            }
            else if (double.IsNaN(t) || t >= 1)
            {
                var endValue = interp.EndValue;
                object target = endValue.Length == 1 ? endValue[0] : endValue;
                _effects.SetPointer(interp.Pointer, target);
                if (interp.DoneCont != null)
                {
                    finishedPointerInterps.Add(interp.DoneCont);
                }
                keep = false;
            }
            else
            {
                var q = KMath.CubicBezierEase(t, interp.P1, interp.P2);
                double[] value;
                if (interp.IsQuaternion)
                {
                    value = KMath.QuatSlerp(interp.StartValue, interp.EndValue, q);
                }
                else
                {
                    value = new double[interp.StartValue.Length];
                    for (var idx = 0; idx < value.Length; idx++)
                    {
                        value[idx] = interp.StartValue[idx] + (interp.EndValue[idx] - interp.StartValue[idx]) * q;
                    }
                }
                object written = value.Length == 1 ? value[0] : value;
                _effects.SetPointer(interp.Pointer, written);
            }
            if (keep)
            {
                keptPointerInterps.Add(interp);
            }
        }
        _pointerInterps.Clear();
        _pointerInterps.AddRange(keptPointerInterps);
        foreach (var cont in finishedPointerInterps)
        {
            _effects.FireFlow(cont);
        }

        // Phase 3: variable interpolations. Done flow fires *inline*, mid-
        // pass — copied verbatim from the shared oracle's mid-iteration
        // array-mutation quirk (see scheduler.py's own comment): a done
        // handler that itself starts a new interpolation appends to
        // `_variableInterps` at an index beyond the SNAPSHOT this loop
        // iterates (`original`, captured once before the loop starts), so
        // it's invisible to this pass and NOT deferred to next tick either
        // once `_variableInterps` is reassigned to the freshly-built `kept`
        // list afterward — mirrors JS's Array#filter capturing the array
        // length once.
        var original = _variableInterps.ToArray();
        var kept = new List<VariableInterpEntry>();
        foreach (var interp in original)
        {
            var t = Math.Min(1.0, (Time - interp.StartTime) / interp.Duration);
            var ease = KMath.CubicBezierEase(t, interp.P1, interp.P2);
            if (interp.UseSlerp && interp.StartValue.Type == "float4" && interp.EndValue.Type == "float4")
            {
                var q = KMath.QuatSlerp(ValueToNumberArray(interp.StartValue), ValueToNumberArray(interp.EndValue), ease);
                _effects.SetVariable(interp.VariableIndex, new KernelValue("float4", q.Cast<object>().ToArray()));
            }
            else
            {
                var startArr = ValueToNumberArray(interp.StartValue);
                var endArr = ValueToNumberArray(interp.EndValue);
                var outData = new object[startArr.Length];
                for (var idx = 0; idx < startArr.Length; idx++)
                {
                    outData[idx] = startArr[idx] + (endArr[idx] - startArr[idx]) * ease;
                }
                _effects.SetVariable(interp.VariableIndex, new KernelValue(interp.EndValue.Type, outData));
            }
            if (t >= 1)
            {
                if (interp.DoneCont != null)
                {
                    _effects.FireFlow(interp.DoneCont);
                }
            }
            else
            {
                kept.Add(interp);
            }
        }
        _variableInterps.Clear();
        _variableInterps.AddRange(kept);

        // Phase 4: due delays. Two passes before any flow fires.
        var ready = new List<DelayEntry>();
        var remainingDelays = new List<DelayEntry>();
        foreach (var item in _delays)
        {
            if (item.Time <= Time)
            {
                ready.Add(item);
            }
            else
            {
                remainingDelays.Add(item);
            }
        }
        _delays.Clear();
        _delays.AddRange(remainingDelays);
        foreach (var item in ready)
        {
            _activeRefs.Remove(item.Ref);
            _effects.FireFlow(item.Cont);
        }

        // Phase 5: per-tick handler activation, with tick bookkeeping
        // updated around it.
        if (delta > 0)
        {
            LastTickDelta = TickCount == 0 ? double.NaN : delta;
            _effects.OnTickPhase();
            TickCount += 1;
        }
    }
}
