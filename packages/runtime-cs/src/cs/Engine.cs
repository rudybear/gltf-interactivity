// The compiled-engine runtime surface, transcribed from
// packages/runtime-py/src/py/gltfi_runtime/engine.py (itself transcribed
// from packages/runtime-lib/src/engine.ts). One `Engine` instance plays both
// roles the TS/Lua backends split into two: a setup-time builder (called
// once from the generated module's `static void Build(Engine rt)`) and the
// harness-facing instance (Start()/Advance()/etc). The generated module's
// shape (see @gltfi/emit-cs) is:
//
//   namespace GltfiCompiled;
//   public static class Module
//   {
//       public sealed class Vars { ... typed properties over rt.GetVarX/SetVarX ... }
//       public static class Events { public const int Explode = 0; ... }
//       public static void Build(Engine rt)
//       {
//           rt.DeclareVar("int", 0); ...
//           rt.DeclareEvent(null, false, 0, 0.0, null); ...
//           var V = new Vars(rt);
//           var doN1 = new DoNState();
//           void Proc5() { ... }
//           void OnStart0() { ... }
//           rt.OnStart(OnStart0);
//       }
//   }
//
// Beyond the math/type/ref op surface (M.cs/KMath.cs/Numeric.cs), this hosts
// the async/stateful op runtime (flow/setDelay+cancelDelay, variable/
// interpolate, pointer/interpolate, animation/start+stop+stopAt, flow/doN+
// multiGate+waitAll+throttle) and event/stopPropagation dispatch — every one
// of these mirrors packages/runtime/src/interpreter.ts's per-op case exactly
// (via engine.py, this file's direct transcription oracle).
//
// Unlike Python's necessarily-dynamic single combined-signature dispatch
// (`ptr_get(pointer, args_or_type, t=None)` juggling which positional slot
// holds what), C#'s optional/named parameters give a strictly cleaner
// surface here: `PtrGet(pointer, type, args: null)` with `args` defaulting
// to an empty dict — no positional-shape sniffing needed anywhere in this
// file.
//
// Scope note: KHR_node_selectability/hoverability (onSelect/onHoverIn/
// onHoverOut) is intentionally NOT ported here, matching every other backend
// in this monorepo (viewer-only, never exercised by the conformance corpus).
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace GltfiRuntime;

// -- state-slot storage types (mirrors engine.py's plain-dict state-slot
// factories: do_n_state/multi_gate_state/wait_all_state/throttle_state/
// delay_state) --------------------------------------------------------------

public sealed class DoNState
{
    public double Count;
}

public sealed class MultiGateState
{
    public double LastIndex = -1.0;
    public bool[] Used = Array.Empty<bool>();
}

public sealed class WaitAllState
{
    public bool[] Activated = Array.Empty<bool>();
    public double? Remaining;
}

public sealed class ThrottleState
{
    public double? LastTime;
    public double Remaining = double.NaN;
}

public sealed class DelayState
{
    public int LastId = -1;
    public string LastRef = "";
    public List<int> Ids = new();
}

public readonly struct ThrottleResult
{
    public readonly bool Invalid;
    public readonly bool Fire;
    public ThrottleResult(bool invalid, bool fire)
    {
        Invalid = invalid;
        Fire = fire;
    }
}

public readonly struct EventPayload
{
    public readonly bool BoolParameter;
    public readonly int IntParameter;
    public readonly double FloatParameter;
    public readonly double ExpectedDuration;

    public EventPayload(bool boolParameter, int intParameter, double floatParameter, double expectedDuration)
    {
        BoolParameter = boolParameter;
        IntParameter = intParameter;
        FloatParameter = floatParameter;
        ExpectedDuration = expectedDuration;
    }
}

public readonly struct SentEvent
{
    public readonly int EventIndex;
    public readonly string? ExternalId;
    public readonly EventPayload Payload;
    public SentEvent(int eventIndex, string? externalId, EventPayload payload)
    {
        EventIndex = eventIndex;
        ExternalId = externalId;
        Payload = payload;
    }
}

// DefaultBool/DefaultInt/DefaultFloat are nullable (unlike the doc's naive
// "always concrete" shape) so a value's mere DECLARED-ness on the source
// event survives round-tripping through @gltfi/emit-cs's generated
// `Build()` -> a Roslyn-parsed `Module.Events`/`DeclareEvent` call ->
// @gltfi/parse-cs -- see emit-cs's own `emitEventDecls` doc comment for the
// full rationale (mirrors @gltfi/emit-py's/@gltfi/emit-lua's own
// conditional-field emission for the exact same reason). Every READ site
// below (`EventPayloadOf`) already falls back to false/0/0.0 via `??`
// regardless of whether these are nullable or not, so this is purely an
// additive precision gain with no behavior change for a value that WAS
// declared.
internal sealed class EventDecl
{
    public string? ExternalId;
    public bool? DefaultBool;
    public int? DefaultInt;
    public double? DefaultFloat;
    public double? ExpectedDuration;
}

public sealed class Engine
{
    private static readonly IReadOnlyDictionary<string, object> EmptyArgs = new Dictionary<string, object>();
    private static readonly Regex AnimRefRe = new(@"^/animations/(\d+)$");

    private readonly List<string> _varTypes = new();
    private readonly List<object> _varRaw = new();
    private readonly List<EventDecl> _eventDecls = new();
    private readonly List<Action> _onStartHandlers = new();
    private readonly List<Action<double, double>> _onTickHandlers = new();
    private readonly List<List<Action<EventPayload>>> _onReceiveHandlers = new();
    private readonly List<SentEvent> _sentEvents = new();
    private readonly Dictionary<string, object> _eventOutRegisters = new();
    private readonly Dictionary<int, EventPayload> _lastPayloadByIndex = new();
    private readonly HashSet<string> _stoppedEvents = new();
    private readonly Dictionary<int, DelayState> _delayOwners = new();
    private readonly Dictionary<int, (double Playhead, double VirtualPlayhead)> _animationPlayheads = new();

    private readonly JsonNode? _gltf;
    private readonly byte[]? _glbBin;
    private uint _randomState;
    private readonly PointerHost _pointerHost;
    private readonly Scheduler _scheduler;
    private Action<string, object>? _onPointerSetHook;

    public Engine(JsonNode? gltf, byte[]? glbBin, double seed = 123456789.0)
    {
        _gltf = gltf;
        _glbBin = glbBin;
        _randomState = unchecked((uint)(long)seed);

        _pointerHost = new PointerHost
        {
            Gltf = gltf,
            IsDelayActive = r => _scheduler.IsDelayActive(r),
            IsAnimationPlaying = i => _scheduler.IsAnimationPlaying(i),
            GetAnimationPlayhead = i => _animationPlayheads.TryGetValue(i, out var v) ? v : (0.0, 0.0),
            ActiveCameraPosition = null,
            ActiveCameraRotation = null,
            OnPointerSet = (p, v) => _onPointerSetHook?.Invoke(p, v)
        };

        _scheduler = new Scheduler(new SchedulerEffects
        {
            FireFlow = cont => cont(),
            ApplyAnimationSample = ApplyAnimationSample,
            SetPointer = EffectSetPointer,
            SetVariable = EffectSetVariable,
            OnTickPhase = OnTickPhase
        });
    }

    // -- internal effects ----------------------------------------------------

    private uint StepRandom()
    {
        _randomState = unchecked(1664525u * _randomState + 1013904223u);
        return _randomState;
    }

    private void ApplyAnimationSample(int animationIndex, double requestedTime)
    {
        var result = Animation.ApplyAnimationAt(_gltf, _glbBin, animationIndex, requestedTime,
            (pointer, value) => _onPointerSetHook?.Invoke(pointer, value));
        if (result == null)
        {
            return;
        }
        _animationPlayheads[animationIndex] = (result.Value.T, requestedTime);
    }

    private void EffectSetPointer(string pointer, object value)
    {
        Pointer.WritePointerRaw(_gltf, pointer, value);
        _onPointerSetHook?.Invoke(pointer, value);
    }

    private void EffectSetVariable(int variableIndex, KernelValue value)
    {
        var t = variableIndex < _varTypes.Count ? _varTypes[variableIndex] : value.Type;
        _varRaw[variableIndex] = KernelValueToRaw(t, value);
    }

    private void OnTickPhase()
    {
        foreach (var handler in _onTickHandlers.ToArray())
        {
            var tst = _scheduler.TickCount == 0 ? 0.0 : _scheduler.Time;
            handler(tst, _scheduler.LastTickDelta);
        }
    }

    // -- raw <-> kernel value conversion --------------------------------------
    // KernelValue.Data always holds boxed `bool` (bool type), boxed `double`
    // (int/float/vector/matrix types — int raw storage is boxed CLR `int`,
    // converted to `double` here), or boxed `string` (ref type).

    private static KernelValue RawToKernelValue(string t, object raw)
    {
        switch (t)
        {
            case "bool":
                return new KernelValue("bool", new object[] { raw is bool b && b });
            case "ref":
                return new KernelValue("ref", new object[] { raw as string ?? "" });
            case "int":
                return new KernelValue("int", new object[] { raw is int i ? (double)i : 0.0 });
            case "float":
                return new KernelValue("float", new object[] { raw is double d ? d : 0.0 });
            default:
                var arr = raw as double[] ?? Array.Empty<double>();
                return new KernelValue(t, arr.Cast<object>().ToArray());
        }
    }

    private static object KernelValueToRaw(string t, KernelValue v)
    {
        switch (t)
        {
            case "bool":
                return v.Data.Length > 0 && v.Data[0] is bool b && b;
            case "ref":
                return v.Data.Length > 0 ? (v.Data[0] as string ?? "") : "";
            case "int":
                return v.Data.Length > 0 ? unchecked((int)Convert.ToDouble(v.Data[0])) : 0;
            case "float":
                return v.Data.Length > 0 ? Convert.ToDouble(v.Data[0]) : 0.0;
            default:
                return v.Data.Select(Convert.ToDouble).ToArray();
        }
    }

    // -- builder ("rt.*") API, called only from the generated Build() --------

    public void DeclareVar(string type, object initial)
    {
        _varTypes.Add(type);
        _varRaw.Add(initial);
    }

    public void DeclareEvent(string? externalId, bool? defaultBool, int? defaultInt, double? defaultFloat, double? expectedDuration)
    {
        _eventDecls.Add(new EventDecl
        {
            ExternalId = externalId,
            DefaultBool = defaultBool,
            DefaultInt = defaultInt,
            DefaultFloat = defaultFloat,
            ExpectedDuration = expectedDuration
        });
    }

    public int GetVarInt(int idx) => (int)_varRaw[idx];
    public void SetVarInt(int idx, int v) => _varRaw[idx] = v;
    public double GetVarFloat(int idx) => (double)_varRaw[idx];
    public void SetVarFloat(int idx, double v) => _varRaw[idx] = v;
    public bool GetVarBool(int idx) => (bool)_varRaw[idx];
    public void SetVarBool(int idx, bool v) => _varRaw[idx] = v;
    public string GetVarRef(int idx) => (string)_varRaw[idx];
    public void SetVarRef(int idx, string v) => _varRaw[idx] = v;
    public double[] GetVarVec(int idx) => (double[])_varRaw[idx];
    public void SetVarVec(int idx, double[] v) => _varRaw[idx] = v;

    public void OnStart(Action fn) => _onStartHandlers.Add(fn);
    public void OnTick(Action<double, double> fn) => _onTickHandlers.Add(fn);

    public void OnReceive(int eventIndex, Action<EventPayload> fn)
    {
        while (_onReceiveHandlers.Count <= eventIndex)
        {
            _onReceiveHandlers.Add(new List<Action<EventPayload>>());
        }
        _onReceiveHandlers[eventIndex].Add(fn);
    }

    private EventPayload DefaultPayload(int eventIndex)
    {
        var decl = eventIndex < _eventDecls.Count ? _eventDecls[eventIndex] : null;
        return new EventPayload(decl?.DefaultBool ?? false, decl?.DefaultInt ?? 0, decl?.DefaultFloat ?? 0.0, decl?.ExpectedDuration ?? 0.0);
    }

    // `payload` omitted (null) sends the event's own declared defaults —
    // mirrors emit-cs's emitEvent, which omits the argument entirely when
    // every payload value is a compile-time constant matching those
    // defaults (see @gltfi/emit-cs's matchesEventDefaults).
    public void Send(int eventIndex, EventPayload? payload = null)
    {
        var decl = eventIndex < _eventDecls.Count ? _eventDecls[eventIndex] : null;
        var p = payload ?? DefaultPayload(eventIndex);
        _sentEvents.Add(new SentEvent(eventIndex, decl?.ExternalId, p));
        _lastPayloadByIndex[eventIndex] = p;
        var eventRef = $"event:custom:{eventIndex}";
        _stoppedEvents.Remove(eventRef);
        if (eventIndex < _onReceiveHandlers.Count)
        {
            foreach (var handler in _onReceiveHandlers[eventIndex].ToArray())
            {
                if (_stoppedEvents.Contains(eventRef))
                {
                    break;
                }
                handler(p);
            }
        }
        _stoppedEvents.Remove(eventRef);
    }

    public void Log(string template, object[]? args = null)
    {
        // debug/log has no effect on pass/fail; intentionally a no-op.
    }

    public void StopPropagation(string eventRef, bool stopImmediate)
    {
        if (stopImmediate && !string.IsNullOrEmpty(eventRef))
        {
            _stoppedEvents.Add(eventRef);
        }
    }

    public void EventOut(int nodeKey, string socket, object value) => _eventOutRegisters[$"{nodeKey}:{socket}"] = value;

    public object? EventOutRead(int nodeKey, string socket) => _eventOutRegisters.TryGetValue($"{nodeKey}:{socket}", out var v) ? v : null;

    public EventPayload EventPayloadOf(int eventIndex) => _lastPayloadByIndex.TryGetValue(eventIndex, out var p) ? p : DefaultPayload(eventIndex);

    public double TickTime() => _scheduler.TickCount == 0 ? 0.0 : _scheduler.Time;
    public double TickDelta() => _scheduler.LastTickDelta;

    // NOTE: divisor is 2^32-1 (0xFFFFFFFF), matching engine.py's/the TS
    // oracle's own `state / 4294967295` exactly (NOT 2^32) — verified
    // against runtime-py's own harness.test.ts LCG-parity assertion.
    public double Random() => StepRandom() / 4294967295.0;

    public PtrResult PtrGet(string pointer, string type, IReadOnlyDictionary<string, object>? args = null) =>
        Pointer.PtrGet(_pointerHost, pointer, args ?? EmptyArgs, type);

    public bool PtrSet(string pointer, string type, object value, IReadOnlyDictionary<string, object>? args = null) =>
        Pointer.PtrSet(_pointerHost, pointer, args ?? EmptyArgs, type, value);

    // -- async ops (flow/setDelay, variable/interpolate, pointer/interpolate,
    // animation/start|stop|stopAt) --------------------------------------------

    public bool SetDelay(DelayState slot, double duration, Action? done)
    {
        if (double.IsNaN(duration) || double.IsInfinity(duration) || duration < 0)
        {
            return false;
        }
        var handle = _scheduler.AllocateDelayId();
        slot.LastId = handle.Id;
        slot.LastRef = handle.Ref;
        slot.Ids.Add(handle.Id);
        _delayOwners[handle.Id] = slot;
        if (done != null)
        {
            var hid = handle.Id;
            void OnFire()
            {
                slot.Ids.RemoveAll(x => x == hid);
                _delayOwners.Remove(hid);
                done();
            }
            _scheduler.ScheduleDelay(handle.Id, handle.Ref, duration, OnFire);
        }
        return true;
    }

    public void CancelDelay(string reference)
    {
        if (string.IsNullOrEmpty(reference))
        {
            return;
        }
        var found = _scheduler.FindDelayByRef(reference);
        if (found == null)
        {
            return;
        }
        _scheduler.CancelDelay(found.Id);
        if (_delayOwners.Remove(found.Id, out var owner))
        {
            owner.Ids.RemoveAll(x => x == found.Id);
        }
    }

    public void CancelDelaySlot(DelayState slot)
    {
        foreach (var id in slot.Ids)
        {
            _scheduler.CancelDelay(id);
            _delayOwners.Remove(id);
        }
        slot.Ids = new List<int>();
        slot.LastId = -1;
        slot.LastRef = "";
    }

    private static bool FiniteArr(double[] arr)
    {
        foreach (var x in arr)
        {
            if (double.IsNaN(x) || double.IsInfinity(x))
            {
                return false;
            }
        }
        return true;
    }

    private static bool IsFiniteRaw(object value)
    {
        return value switch
        {
            double[] arr => FiniteArr(arr),
            double d => !double.IsNaN(d) && !double.IsInfinity(d),
            _ => true
        };
    }

    public bool VarInterp(int varId, object value, double duration, double[] p1, double[] p2, bool useSlerp, Action? done)
    {
        var t = varId < _varTypes.Count ? _varTypes[varId] : "float";
        var endKernel = RawToKernelValue(t, value);
        var isValid = !double.IsNaN(duration) && !double.IsInfinity(duration) && duration > 0
            && IsFiniteRaw(value) && FiniteArr(p1) && FiniteArr(p2);
        if (!isValid)
        {
            return false;
        }
        var startKernel = RawToKernelValue(t, _varRaw[varId]);
        _scheduler.AddVariableInterp(new VariableInterpEntry
        {
            VariableIndex = varId,
            Duration = duration,
            StartValue = startKernel,
            EndValue = endKernel,
            P1 = new[] { p1.Length > 0 ? p1[0] : 0, p1.Length > 1 ? p1[1] : 0 },
            P2 = new[] { p2.Length > 0 ? p2[0] : 0, p2.Length > 1 ? p2[1] : 0 },
            UseSlerp = useSlerp,
            DoneCont = done
        });
        return true;
    }

    public bool PtrInterp(string pointer, string type, object value, double duration, double[] p1, double[] p2, Action? done, IReadOnlyDictionary<string, object>? args = null)
    {
        var prep = Pointer.PtrInterpPrepare(_pointerHost, pointer, args ?? EmptyArgs, type);
        if (prep == null)
        {
            return false;
        }
        if (double.IsNaN(duration) || double.IsInfinity(duration) || duration < 0)
        {
            return false;
        }
        var p10 = p1.Length > 0 ? p1[0] : 0;
        var p20 = p2.Length > 0 ? p2[0] : 0;
        if (!FiniteArr(p1) || !FiniteArr(p2) || p10 < 0 || p10 > 1 || p20 < 0 || p20 > 1)
        {
            return false;
        }
        double[] target = value switch
        {
            double[] arr => arr,
            double d => new[] { d },
            bool b => new[] { b ? 1.0 : 0.0 },
            _ => new double[] { 0.0 }
        };
        var resolved = prep.Value.Resolved;
        _scheduler.AddPointerInterp(new PointerInterpEntry
        {
            Pointer = resolved,
            Duration = duration,
            StartValue = prep.Value.StartValue,
            EndValue = target,
            P1 = new[] { p10, p1.Length > 1 ? p1[1] : 0 },
            P2 = new[] { p20, p2.Length > 1 ? p2[1] : 0 },
            IsQuaternion = resolved.EndsWith("/rotation"),
            DoneCont = done
        });
        return true;
    }

    private int? ParseAnimationRef(string? reference)
    {
        if (reference == null)
        {
            return null;
        }
        var m = AnimRefRe.Match(reference);
        if (!m.Success)
        {
            return null;
        }
        var index = int.Parse(m.Groups[1].Value);
        var animations = (_gltf as JsonObject)?["animations"] as JsonArray;
        if (animations != null && index >= 0 && index < animations.Count && animations[index] != null)
        {
            return index;
        }
        return null;
    }

    public bool AnimStart(string animationRef, double startTime, double endTime, double speed, Action? done)
    {
        var index = ParseAnimationRef(animationRef);
        if (index == null || double.IsNaN(startTime) || double.IsInfinity(startTime) || double.IsNaN(endTime) ||
            double.IsNaN(speed) || double.IsInfinity(speed) || speed <= 0)
        {
            return false;
        }
        _scheduler.StartAnimation(new AnimationEntry
        {
            AnimationIndex = index.Value,
            StartTime = startTime,
            EndTime = endTime,
            StopTime = endTime,
            Speed = speed,
            EntryCreation = _scheduler.Time,
            EndCont = done
        });
        return true;
    }

    public bool AnimStop(string animationRef)
    {
        var index = ParseAnimationRef(animationRef);
        if (index == null)
        {
            return false;
        }
        _scheduler.StopAnimation(index.Value);
        return true;
    }

    // Mirrors engine.py's anim_stop_at exactly: the underlying
    // Scheduler.StopAnimationAt's own found/not-found result is discarded —
    // this reports `true` unconditionally once index/stopTime validate,
    // even if no matching animation entry currently exists.
    public bool AnimStopAt(string animationRef, double stopTime, Action? done)
    {
        var index = ParseAnimationRef(animationRef);
        if (index == null || double.IsNaN(stopTime))
        {
            return false;
        }
        _scheduler.StopAnimationAt(index.Value, stopTime, done);
        return true;
    }

    // -- stateful ops (flow/doN, flow/multiGate, flow/waitAll, flow/throttle) -

    public bool DoN(DoNState slot, double n)
    {
        var (fire, count) = State.DoNAdvance(slot.Count, Numeric.SafeTrunc(n));
        slot.Count = count;
        return fire;
    }

    public int MultiGate(MultiGateState slot, int outputCount, bool isRandom, bool isLoop)
    {
        int RandomIndex(int count) => count <= 0 ? 0 : (int)(StepRandom() % (uint)count);
        var (used, index) = State.MultiGateAdvance(slot.Used, outputCount, isRandom, isLoop, RandomIndex);
        slot.Used = used;
        if (index >= 0)
        {
            slot.LastIndex = index;
        }
        return index;
    }

    public bool WaitAll(WaitAllState slot, int inputFlows, int index)
    {
        var (activated, remaining, completed) = State.WaitAllAdvance(slot.Activated, slot.Remaining, inputFlows, index);
        slot.Activated = activated;
        slot.Remaining = remaining;
        return completed;
    }

    public ThrottleResult Throttle(ThrottleState slot, double duration)
    {
        if (double.IsNaN(duration) || double.IsInfinity(duration) || duration < 0)
        {
            return new ThrottleResult(true, false);
        }
        var (fire, lastTime, remaining) = State.ThrottleAdvance(slot.LastTime, duration, _scheduler.Time);
        slot.LastTime = lastTime;
        slot.Remaining = remaining;
        return new ThrottleResult(false, fire);
    }

    // -- instance (harness-facing) API ----------------------------------------

    public void Start()
    {
        foreach (var handler in _onStartHandlers.ToArray())
        {
            handler();
        }
    }

    public void Advance(double dt) => _scheduler.Advance(dt);

    public KernelValue GetVariableByIndex(int index) => RawToKernelValue(index < _varTypes.Count ? _varTypes[index] : "float", _varRaw[index]);

    public int VariableCount => _varTypes.Count;

    public IReadOnlyList<SentEvent> SentEvents => _sentEvents;

    public double Time => _scheduler.Time;

    public IReadOnlyList<double?> EventDefaults => _eventDecls.Select(d => d.ExpectedDuration).ToList();
}
