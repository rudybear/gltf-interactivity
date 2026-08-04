using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public int FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
        public bool TestResult_animation_start__out__fired_right_after__in_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_HasPassed_animation_start_Position_at_50_ { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public double[] TestResult_animation_start_Position_at_50_ { get => E.GetVarVec(3); set => E.SetVarVec(3, value); }
        public bool TestResult_animation_start_Flow__done_ { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public bool TestResult_HasPassed_animation_start_Position_at_100_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public double[] TestResult_animation_start_Position_at_100_ { get => E.GetVarVec(6); set => E.SetVarVec(6, value); }
        public bool TestResult_animation_start__err__flow__speed__1_ { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public bool TestResult_animation_start__err__flow__speed_0_ { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public bool TestResult_animation_start__err__flow__speed_NaN_ { get => E.GetVarBool(9); set => E.SetVarBool(9, value); }
        public bool TestResult_animation_start__err__flow__speed__Inf_ { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public bool TestResult_animation_start__err__flow__startTime_NaN_ { get => E.GetVarBool(11); set => E.SetVarBool(11, value); }
        public bool TestResult_animation_start__err__flow__startTime__Inf_ { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public bool TestResult_animation_start__err__flow__endTime_NaN_ { get => E.GetVarBool(13); set => E.SetVarBool(13, value); }
        public bool TestResult_animation_start__err__flow__invalid_ref_ { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 0);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 });
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 });
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)3.5);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var delay1 = new DelayState();
        var delay2 = new DelayState();
        var delay3 = new DelayState();
        void proc87()
        {
            rt.Log("<animation/start - Position at 100%>: Value is {0}, should be {1} (Proximity range: 0,01)", new object[] { (double[])rt.PtrGet("/nodes/3/translation", "float3").Value, new double[] { -1.0, 2.0, 3.0 } });
            V.TestResult_animation_start_Position_at_100_ = (double[])rt.PtrGet("/nodes/3/translation", "float3").Value;
        }
        void proc35()
        {
            rt.Log("<animation/start - Position at 50%>: Value is {0}, should be {1} (Proximity range: 0,3)", new object[] { (double[])rt.PtrGet("/nodes/3/translation", "float3").Value, new double[] { -0.5, 1.0, 1.5 } });
            V.TestResult_animation_start_Position_at_50_ = (double[])rt.PtrGet("/nodes/3/translation", "float3").Value;
        }
        void OnStart0()
        {
            void Cont1()
            {
                if (!V.TestResult_animation_start__out__fired_right_after__in_)
                {
                    rt.Log("ERROR! <animation/start - [out] fired right after [in]>: Correct flow order not triggered! This should not happened!");
                }
                if (rt.PtrSet("/nodes/13/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_animation_start_Position_at_50_)
                    {
                        rt.Log("ERROR! <animation/start - Position at 50%>: Test Failed");
                    }
                }
                if (rt.PtrSet("/nodes/19/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_animation_start_Flow__done_)
                    {
                        rt.Log("ERROR! <animation/start - Flow [done]>: Flow not triggered! This should not happened!");
                    }
                }
                if (rt.PtrSet("/nodes/25/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_animation_start_Position_at_100_)
                    {
                        rt.Log("ERROR! <animation/start - Position at 100%>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay2, 3.0, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/19/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("<animation/start - Flow [done]>: Flow triggered");
                            V.TestResult_animation_start_Flow__done_ = true;
                        }
                    }
                    if (rt.PtrSet("/nodes/25/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        var t1 = (double[])rt.PtrGet("/nodes/3/translation", "float3").Value;
                        if (M.Length(t1) > 3.73165751 && M.Dot(M.Normalize(t1).Value, new double[] { -0.267261237, 0.5345225, 0.8017837 }) > 0.99)
                        {
                            if (rt.PtrSet("/nodes/24/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/25/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    var t2 = (double[])rt.PtrGet("/nodes/3/translation", "float3").Value;
                                    V.TestResult_HasPassed_animation_start_Position_at_100_ = M.Length(t2) > 3.73165751 && M.Dot(M.Normalize(t2).Value, new double[] { -0.267261237, 0.5345225, 0.8017837 }) > 0.99;
                                    rt.Log("<animation/start - Position at 100%>: Test Successful");
                                    proc87();
                                }
                            }
                        }
                        else
                        {
                            proc87();
                        }
                    }
                }
                if (rt.AnimStart("/animations/0", 0.0, 2.0, 1.0, Cont2))
                {
                    V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = unchecked(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b + 1);
                    if (!(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b == 1))
                    {
                        rt.Log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: out");
                        V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000;
                    }
                }
                V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = unchecked(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b + 1);
                if (V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b == 2)
                {
                    if (rt.PtrSet("/nodes/6/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        rt.Log("<animation/start - [out] fired right after [in]>: Correct flow order triggered");
                        V.TestResult_animation_start__out__fired_right_after__in_ = true;
                    }
                }
                else
                {
                    rt.Log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: 1");
                    V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000;
                }
                void Cont3()
                {
                    if (rt.PtrSet("/nodes/13/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        var t3 = (double[])rt.PtrGet("/nodes/3/translation", "float3").Value;
                        if (M.Length(t3) > 1.57082868 && M.Dot(M.Normalize(t3).Value, new double[] { -0.267261237, 0.5345225, 0.8017837 }) > 0.7)
                        {
                            if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/13/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    var t4 = (double[])rt.PtrGet("/nodes/3/translation", "float3").Value;
                                    V.TestResult_HasPassed_animation_start_Position_at_50_ = M.Length(t4) > 1.57082868 && M.Dot(M.Normalize(t4).Value, new double[] { -0.267261237, 0.5345225, 0.8017837 }) > 0.7;
                                    rt.Log("<animation/start - Position at 50%>: Test Successful");
                                    proc35();
                                }
                            }
                        }
                        else
                        {
                            proc35();
                        }
                    }
                }
                rt.SetDelay(delay1, 1.0, Cont3);
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            if (!rt.AnimStart("/animations/0", 0.0, 2.0, -1.0, null))
            {
                if (rt.PtrSet("/nodes/30/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (speed -1)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__speed__1_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__speed__1_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (speed -1)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            if (!rt.AnimStart("/animations/0", 0.0, 2.0, 0.0, null))
            {
                if (rt.PtrSet("/nodes/36/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (speed 0)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__speed_0_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__speed_0_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (speed 0)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            if (!rt.AnimStart("/animations/0", 0.0, 2.0, M.NaN(), null))
            {
                if (rt.PtrSet("/nodes/42/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (speed NaN)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__speed_NaN_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__speed_NaN_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (speed NaN)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            if (!rt.AnimStart("/animations/0", 0.0, 2.0, M.Inf(), null))
            {
                if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (speed +Inf)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__speed__Inf_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__speed__Inf_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (speed +Inf)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart4);
        void OnStart5()
        {
            if (!rt.AnimStart("/animations/0", M.NaN(), 2.0, 1.0, null))
            {
                if (rt.PtrSet("/nodes/54/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (startTime NaN)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__startTime_NaN_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__startTime_NaN_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (startTime NaN)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart5);
        void OnStart6()
        {
            if (!rt.AnimStart("/animations/0", M.Inf(), 2.0, 1.0, null))
            {
                if (rt.PtrSet("/nodes/60/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (startTime +Inf)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__startTime__Inf_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__startTime__Inf_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (startTime +Inf)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart6);
        void OnStart7()
        {
            if (!rt.AnimStart("/animations/0", 0.0, M.NaN(), 1.0, null))
            {
                if (rt.PtrSet("/nodes/66/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (endTime NaN)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__endTime_NaN_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__endTime_NaN_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (endTime NaN)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart7);
        void OnStart8()
        {
            if (!rt.AnimStart("/animations/1000", 0.0, 2.0, 1.0, null))
            {
                if (rt.PtrSet("/nodes/72/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<animation/start - [err] flow (invalid ref)>: Flow triggered");
                    V.TestResult_animation_start__err__flow__invalid_ref_ = true;
                }
            }
            if (!V.TestResult_animation_start__err__flow__invalid_ref_)
            {
                rt.Log("ERROR! <animation/start - [err] flow (invalid ref)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart8);
        void OnStart9()
        {
            rt.Send(Events.test_onStart);
            void Cont1()
            {
                if (V.TestResult_animation_start__out__fired_right_after__in_ && V.TestResult_HasPassed_animation_start_Position_at_50_ && V.TestResult_animation_start_Flow__done_ && V.TestResult_HasPassed_animation_start_Position_at_100_ && V.TestResult_animation_start__err__flow__speed__1_ && V.TestResult_animation_start__err__flow__speed_0_ && V.TestResult_animation_start__err__flow__speed_NaN_ && V.TestResult_animation_start__err__flow__speed__Inf_ && V.TestResult_animation_start__err__flow__startTime_NaN_ && V.TestResult_animation_start__err__flow__startTime__Inf_ && V.TestResult_animation_start__err__flow__endTime_NaN_ && V.TestResult_animation_start__err__flow__invalid_ref_)
                {
                    rt.Send(Events.test_onSuccess);
                }
                else
                {
                    rt.Send(Events.test_onFailed);
                }
            }
            rt.SetDelay(delay3, 3.5, Cont1);
        }
        rt.OnStart(OnStart9);
    }
}
