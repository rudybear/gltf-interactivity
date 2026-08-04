using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public double startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Flow__done_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public double TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay { get => E.GetVarFloat(3); set => E.SetVarFloat(3, value); }
        public int counter1 { get => E.GetVarInt(4); set => E.SetVarInt(4, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public int TestResult_flow_setDelay_and_cancelDelay_Flow__out_ { get => E.GetVarInt(6); set => E.SetVarInt(6, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered { get => E.GetVarBool(9); set => E.SetVarBool(9, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ { get => E.GetVarBool(11); set => E.SetVarBool(11, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Flow__err_ { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid { get => E.GetVarBool(13); set => E.SetVarBool(13, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("float", 0.0);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("float", -0.0142);
        rt.DeclareVar("int", 0);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("int", -1);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", true);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", true);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)2.5);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var delay1 = new DelayState();
        var delay2 = new DelayState();
        var delay3 = new DelayState();
        var delay4 = new DelayState();
        var delay5 = new DelayState();
        var delay6 = new DelayState();
        var delay7 = new DelayState();
        var delay8 = new DelayState();
        var delay9 = new DelayState();
        var delay10 = new DelayState();
        var delay11 = new DelayState();
        void proc26()
        {
            var t1 = rt.TickTime();
            rt.Log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0,1)", new object[] { M.Select(M.IsNaN(t1), 0.0, t1) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa, 1.0 });
            var t2 = rt.TickTime();
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = M.Select(M.IsNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa;
        }
        void proc116()
        {
            rt.Log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", new object[] { rt.PtrGet("/extensions/KHR_interactivity/delays/{delayRef}", "ref", new Dictionary<string, object> { ["delayRef"] = (string)delay9.LastRef }).IsValid, true });
            V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.PtrGet("/extensions/KHR_interactivity/delays/{delayRef}", "ref", new Dictionary<string, object> { ["delayRef"] = (string)delay9.LastRef }).IsValid;
        }
        void OnStart0()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_)
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Flow [done]>: Flow not triggered! This should not happened!");
                    }
                }
                if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay)
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Failed");
                    }
                }
                if (rt.PtrSet("/nodes/6/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1 == 1;
                    if (V.counter1 == 1)
                    {
                        if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            if (rt.PtrSet("/nodes/6/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                            {
                                rt.Log("<flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered correct amount");
                                V.TestResult_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1;
                            }
                        }
                    }
                    else
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered {0} times from 1. This should not happened!", new object[] { V.counter1 });
                    }
                }
            }
            if (rt.SetDelay(delay2, 2.0, Cont1))
            {
                var t1 = rt.TickTime();
                V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa = M.Select(M.IsNaN(t1), 0.0, t1);
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered");
                            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true;
                        }
                    }
                    if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        var t2 = rt.TickTime();
                        if (M.Abs(M.Select(M.IsNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1)
                        {
                            if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    var t3 = rt.TickTime();
                                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = M.Abs(M.Select(M.IsNaN(t3), 0.0, t3) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1;
                                    rt.Log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful");
                                    proc26();
                                }
                            }
                        }
                        else
                        {
                            proc26();
                        }
                    }
                }
                if (rt.SetDelay(delay1, 1.0, Cont2))
                {
                    V.counter1 = unchecked(V.counter1 + 1);
                }
            }
        }
        rt.OnStart(OnStart0);
        void OnTick1(double timeSinceStart, double timeSinceLastTick)
        {
        }
        rt.OnTick(OnTick1);
        void OnStart2()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/30/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_)
                    {
                        rt.Log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful");
                    }
                }
            }
            if (rt.SetDelay(delay4, 2.0, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/28/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/30/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!");
                            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = true;
                            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false;
                        }
                    }
                }
                rt.SetDelay(delay3, 1.0, Cont2);
                rt.CancelDelaySlot(delay3);
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/36/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered)
                    {
                        rt.Log("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful");
                    }
                }
                if (!V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_)
                {
                    rt.Log("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!");
                }
            }
            if (rt.SetDelay(delay6, 2.0, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/34/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/36/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!");
                            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = true;
                            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false;
                        }
                    }
                }
                rt.SetDelay(delay5, 1.0, Cont2);
                rt.CancelDelay((string)delay5.LastRef);
                if (rt.PtrSet("/nodes/41/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow triggered");
                    V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ = true;
                }
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            void Cont1()
            {
                if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_)
                {
                    rt.Log("ERROR! <flow/setDelay and cancelDelay - Flow [err]>: Flow not triggered! This should not happened!");
                }
            }
            if (rt.SetDelay(delay8, 2.0, Cont1))
            {
                if (!rt.SetDelay(delay7, -1.0, null))
                {
                    if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        rt.Log("<flow/setDelay and cancelDelay - Flow [err]>: Flow triggered");
                        V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ = true;
                    }
                }
            }
        }
        rt.OnStart(OnStart4);
        void OnStart5()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid)
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - lastDelayref isValid>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay10, 0.5, Cont1))
            {
                if (rt.SetDelay(delay9, 2.0, null))
                {
                    if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (rt.PtrGet("/extensions/KHR_interactivity/delays/{delayRef}", "ref", new Dictionary<string, object> { ["delayRef"] = (string)delay9.LastRef }).IsValid == true)
                        {
                            if (rt.PtrSet("/nodes/47/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.PtrGet("/extensions/KHR_interactivity/delays/{delayRef}", "ref", new Dictionary<string, object> { ["delayRef"] = (string)delay9.LastRef }).IsValid == true;
                                    rt.Log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Test Successful");
                                    proc116();
                                }
                            }
                        }
                        else
                        {
                            proc116();
                        }
                    }
                }
            }
        }
        rt.OnStart(OnStart5);
        void OnStart6()
        {
            rt.Send(Events.test_onStart);
            void Cont1()
            {
                if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ && V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid)
                {
                    rt.Send(Events.test_onSuccess);
                }
                else
                {
                    rt.Send(Events.test_onFailed);
                }
            }
            rt.SetDelay(delay11, 2.5, Cont1);
        }
        rt.OnStart(OnStart6);
    }
}
