using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public double startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Flow__done_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public double TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay { get => E.GetVarFloat(3); set => E.SetVarFloat(3, value); }
        public int counter1 { get => E.GetVarInt(4); set => E.SetVarInt(4, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public int TestResult_flow_setDelay_and_cancelDelay_Flow__out_ { get => E.GetVarInt(6); set => E.SetVarInt(6, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ { get => E.GetVarBool(9); set => E.SetVarBool(9, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Flow__err_ { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid { get => E.GetVarBool(11); set => E.SetVarBool(11, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ { get => E.GetVarBool(13); set => E.SetVarBool(13, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
        public int FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 { get => E.GetVarInt(15); set => E.SetVarInt(15, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order { get => E.GetVarBool(16); set => E.SetVarBool(16, value); }
        public int counter2 { get => E.GetVarInt(17); set => E.SetVarInt(17, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x { get => E.GetVarBool(18); set => E.SetVarBool(18, value); }
        public int TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x { get => E.GetVarInt(19); set => E.SetVarInt(19, value); }
        public bool TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null { get => E.GetVarBool(20); set => E.SetVarBool(20, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null { get => E.GetVarBool(21); set => E.SetVarBool(21, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays { get => E.GetVarBool(22); set => E.SetVarBool(22, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ { get => E.GetVarBool(23); set => E.SetVarBool(23, value); }
        public bool TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ { get => E.GetVarBool(24); set => E.SetVarBool(24, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("float", 0.0, "startTime_ca9af277-a001-44a7-bbd2-b3e9d2eafea6");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_Flow [done]");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay");
        rt.DeclareVar("float", -0.0142, "TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay");
        rt.DeclareVar("int", 0, "d90d4f49-c9e3-4a3e-9f10-06247568422b");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]");
        rt.DeclareVar("int", -1, "TestResult_flow/setDelay and cancelDelay_Flow [out]");
        rt.DeclareVar("bool", true, "TestResult_flow/setDelay and cancelDelay_setDelay [cancel]");
        rt.DeclareVar("bool", true, "TestResult_flow/setDelay and cancelDelay_cancelDelay triggered");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_Flow [err]");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_Flow [err]\n(NaN)");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_Flow [err]\n(+Inf)");
        rt.DeclareVar("int", 0, "FlowSequenceCount_b8e69ef5-14a6-4dbe-b4e1-3335901db362");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_Concurrent delays\n[done] in time order");
        rt.DeclareVar("int", 0, "c3ceb65a-83b0-4b71-9344-d81263979ab7");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x");
        rt.DeclareVar("int", -1, "TestResult_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null");
        rt.DeclareVar("bool", true, "TestResult_flow/setDelay and cancelDelay_[cancel] cancels all\npending delays");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_cancelDelay null ref\nFlow [out]");
        rt.DeclareVar("bool", false, "TestResult_flow/setDelay and cancelDelay_cancelDelay fired ref\nFlow [out]");
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
        var delay12 = new DelayState();
        var delay13 = new DelayState();
        var delay14 = new DelayState();
        var delay15 = new DelayState();
        var delay16 = new DelayState();
        var delay17 = new DelayState();
        var delay18 = new DelayState();
        var delay19 = new DelayState();
        var delay20 = new DelayState();
        var delay21 = new DelayState();
        var delay22 = new DelayState();
        var delay23 = new DelayState();
        void proc45()
        {
            var t1 = rt.TickTime();
            rt.Log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0.1)", new object[] { M.Select(M.IsNaN(t1), 0.0, t1) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6, 1.0 });
            var t2 = rt.TickTime();
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = M.Select(M.IsNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6;
        }
        void proc131()
        {
            rt.Log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", new object[] { rt.PtrGet("/extensions/KHR_interactivity/delays/{delayRef}", "ref", new Dictionary<string, object> { ["delayRef"] = (string)delay9.LastRef }).IsValid, true });
            V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.PtrGet("/extensions/KHR_interactivity/delays/{delayRef}", "ref", new Dictionary<string, object> { ["delayRef"] = (string)delay9.LastRef }).IsValid;
        }
        void proc182()
        {
            void Cont1()
            {
                V.counter2 = unchecked(V.counter2 + 1);
            }
            rt.SetDelay(delay17, 0.3, Cont1);
        }
        void proc197()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/76/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    if (rt.PtrSet("/nodes/78/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Flow triggered! This should not happened!");
                        V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays = false;
                    }
                }
            }
            rt.SetDelay(delay19, 0.3, Cont1);
        }
        void proc204()
        {
            rt.Log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Value is {0}, should be {1} ", new object[] { M.RefEq((string)delay19.LastRef, ""), true });
            V.TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = M.RefEq((string)delay19.LastRef, "");
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
                V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 = M.Select(M.IsNaN(t1), 0.0, t1);
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
                        if (M.Abs(M.Select(M.IsNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1)
                        {
                            if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    var t3 = rt.TickTime();
                                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = M.Abs(M.Select(M.IsNaN(t3), 0.0, t3) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1;
                                    rt.Log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful");
                                    proc45();
                                }
                            }
                        }
                        else
                        {
                            proc45();
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
                    if (V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_)
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
                            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false;
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
                    if (V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered)
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
                            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false;
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
                                    proc131();
                                }
                            }
                        }
                        else
                        {
                            proc131();
                        }
                    }
                }
            }
        }
        rt.OnStart(OnStart5);
        void OnStart6()
        {
            if (!rt.SetDelay(delay11, M.NaN(), null))
            {
                if (rt.PtrSet("/nodes/53/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow triggered");
                    V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ = true;
                }
            }
            if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_)
            {
                rt.Log("ERROR! <flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart6);
        void OnStart7()
        {
            if (!rt.SetDelay(delay12, M.Inf(), null))
            {
                if (rt.PtrSet("/nodes/59/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow triggered");
                    V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ = true;
                }
            }
            if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_)
            {
                rt.Log("ERROR! <flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart7);
        void OnStart8()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/66/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order)
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order not triggered! This should not happened!");
                    }
                }
            }
            if (rt.SetDelay(delay16, 1.5, Cont1))
            {
                void Cont2()
                {
                    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = unchecked(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 + 1);
                    if (V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 == 3)
                    {
                        if (rt.PtrSet("/nodes/65/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            if (rt.PtrSet("/nodes/66/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                            {
                                rt.Log("<flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order triggered");
                                V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order = true;
                            }
                        }
                    }
                    else
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done");
                        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000;
                    }
                }
                rt.SetDelay(delay13, 0.6, Cont2);
                void Cont3()
                {
                    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = unchecked(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 + 1);
                    if (!(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 == 1))
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done");
                        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000;
                    }
                }
                rt.SetDelay(delay14, 0.2, Cont3);
                void Cont4()
                {
                    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = unchecked(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 + 1);
                    if (!(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 == 2))
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done");
                        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000;
                    }
                }
                rt.SetDelay(delay15, 0.4, Cont4);
            }
        }
        rt.OnStart(OnStart8);
        void OnStart9()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/72/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2 == 3;
                    if (V.counter2 == 3)
                    {
                        if (rt.PtrSet("/nodes/71/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            if (rt.PtrSet("/nodes/72/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                            {
                                rt.Log("<flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered correct amount");
                                V.TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2;
                            }
                        }
                    }
                    else
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered {0} times from 3. This should not happened!", new object[] { V.counter2 });
                    }
                }
            }
            if (rt.SetDelay(delay18, 1.0, Cont1))
            {
                proc182();
                proc182();
                proc182();
            }
        }
        rt.OnStart(OnStart9);
        void OnStart10()
        {
            void Cont1()
            {
                if (!V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null)
                {
                    rt.Log("ERROR! <flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Failed");
                }
                if (rt.PtrSet("/nodes/78/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays)
                    {
                        rt.Log("<flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Test Successful");
                    }
                }
            }
            if (rt.SetDelay(delay20, 1.0, Cont1))
            {
                proc197();
                proc197();
                proc197();
                rt.CancelDelaySlot(delay19);
                if (M.RefEq((string)delay19.LastRef, "") == true)
                {
                    if (rt.PtrSet("/nodes/83/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = M.RefEq((string)delay19.LastRef, "") == true;
                        rt.Log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Successful");
                        proc204();
                    }
                }
                else
                {
                    proc204();
                }
            }
        }
        rt.OnStart(OnStart10);
        void OnStart11()
        {
            rt.CancelDelay("");
            if (rt.PtrSet("/nodes/89/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
            {
                rt.Log("<flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow triggered");
                V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ = true;
            }
            if (!V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_)
            {
                rt.Log("ERROR! <flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart11);
        void OnStart12()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/96/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_)
                    {
                        rt.Log("ERROR! <flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow not triggered! This should not happened!");
                    }
                }
            }
            if (rt.SetDelay(delay22, 1.0, Cont1))
            {
                void Cont2()
                {
                    rt.CancelDelay((string)delay21.LastRef);
                    if (rt.PtrSet("/nodes/95/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/96/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("<flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow triggered");
                            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ = true;
                        }
                    }
                }
                rt.SetDelay(delay21, 0.1, Cont2);
            }
        }
        rt.OnStart(OnStart12);
        void OnStart13()
        {
            rt.Send(Events.test_onStart);
            void Cont1()
            {
                if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ && V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ && V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ && V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x && V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_)
                {
                    rt.Send(Events.test_onSuccess);
                }
                else
                {
                    rt.Send(Events.test_onFailed);
                }
            }
            rt.SetDelay(delay23, 2.5, Cont1);
        }
        rt.OnStart(OnStart13);
    }
}
