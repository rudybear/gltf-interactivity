using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public double varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }
        public bool TestResult_variable_interpolate_Flow__out_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_variable_interpolate_Flow__done_ { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public bool TestResult_HasPassed_variable_interpolate_Value_at_50_ { get => E.GetVarBool(3); set => E.SetVarBool(3, value); }
        public double TestResult_variable_interpolate_Value_at_50_ { get => E.GetVarFloat(4); set => E.SetVarFloat(4, value); }
        public bool TestResult_HasPassed_variable_interpolate_Value_at_100_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public double TestResult_variable_interpolate_Value_at_100_ { get => E.GetVarFloat(6); set => E.SetVarFloat(6, value); }
        public double varInterpolate_9b751e06_4876_4626_899e_55af0fba4987 { get => E.GetVarFloat(7); set => E.SetVarFloat(7, value); }
        public bool TestResult_variable_interpolate__Err__flow__duration__1f { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public double varInterpolate_8b6755b6_f135_42d5_8a6c_a04af0b6053d { get => E.GetVarFloat(9); set => E.SetVarFloat(9, value); }
        public bool TestResult_variable_interpolate__Err__flow__duration_infinite { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public double varInterpolate_9ff6e551_9919_4526_83ef_e8c53fda1475 { get => E.GetVarFloat(11); set => E.SetVarFloat(11, value); }
        public bool TestResult_variable_interpolate__Err__flow__p1_NaN_ { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public double varInterpolate_5687b23c_c180_4e03_a078_d0eb6719fc74 { get => E.GetVarFloat(13); set => E.SetVarFloat(13, value); }
        public bool TestResult_variable_interpolate__Err__flow__p2_NaN_ { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
        public double[] varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5 { get => E.GetVarVec(15); set => E.SetVarVec(15, value); }
        public bool TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ { get => E.GetVarBool(16); set => E.SetVarBool(16, value); }
        public double[] TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_ { get => E.GetVarVec(17); set => E.SetVarVec(17, value); }
        public double varInterpolate_a1403e18_26f5_435c_89d7_636ddf904804 { get => E.GetVarFloat(18); set => E.SetVarFloat(18, value); }
        public bool TestResult_variable_interpolate__Err__flow__p1_x__0_1_ { get => E.GetVarBool(19); set => E.SetVarBool(19, value); }
        public double varInterpolate_47f0b085_4868_48c0_b9ad_ff903acae3b4 { get => E.GetVarFloat(20); set => E.SetVarFloat(20, value); }
        public bool TestResult_variable_interpolate__Err__flow__p2_x_1_1_ { get => E.GetVarBool(21); set => E.SetVarBool(21, value); }
        public double varInterpolate_87e57612_b9b9_454e_869d_cd948db1074f { get => E.GetVarFloat(22); set => E.SetVarFloat(22, value); }
        public bool TestResult_variable_interpolate__Err__flow__p1_y__Inf_ { get => E.GetVarBool(23); set => E.SetVarBool(23, value); }
        public double varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 { get => E.GetVarFloat(24); set => E.SetVarFloat(24, value); }
        public bool TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ { get => E.GetVarBool(25); set => E.SetVarBool(25, value); }
        public double TestResult_variable_interpolate_Ease_in_curve__value_at_50_ { get => E.GetVarFloat(26); set => E.SetVarFloat(26, value); }
        public double varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 { get => E.GetVarFloat(27); set => E.SetVarFloat(27, value); }
        public bool TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start { get => E.GetVarBool(28); set => E.SetVarBool(28, value); }
        public double TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start { get => E.GetVarFloat(29); set => E.SetVarFloat(29, value); }
        public bool TestResult_variable_interpolate_Overshoot_curve__no__err_ { get => E.GetVarBool(30); set => E.SetVarBool(30, value); }
        public double varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a { get => E.GetVarFloat(31); set => E.SetVarFloat(31, value); }
        public bool TestResult_variable_interpolate_Duration_0___done_ { get => E.GetVarBool(32); set => E.SetVarBool(32, value); }
        public bool TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ { get => E.GetVarBool(33); set => E.SetVarBool(33, value); }
        public double TestResult_variable_interpolate_Duration_0__value_on__done_ { get => E.GetVarFloat(34); set => E.SetVarFloat(34, value); }
        public double varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 { get => E.GetVarFloat(35); set => E.SetVarFloat(35, value); }
        public bool TestResult_variable_interpolate_Re_trigger__1st__done__not_fired { get => E.GetVarBool(36); set => E.SetVarBool(36, value); }
        public bool TestResult_variable_interpolate_Re_trigger__2nd__done_ { get => E.GetVarBool(37); set => E.SetVarBool(37, value); }
        public bool TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached { get => E.GetVarBool(38); set => E.SetVarBool(38, value); }
        public double TestResult_variable_interpolate_Re_trigger__2nd_target_reached { get => E.GetVarFloat(39); set => E.SetVarFloat(39, value); }
        public double varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 { get => E.GetVarFloat(40); set => E.SetVarFloat(40, value); }
        public bool TestResult_variable_interpolate_variable_set_stops_it___done__not_fired { get => E.GetVarBool(41); set => E.SetVarBool(41, value); }
        public bool TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value { get => E.GetVarBool(42); set => E.SetVarBool(42, value); }
        public double TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value { get => E.GetVarFloat(43); set => E.SetVarFloat(43, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("float", 0.0, "varInterpolate_0064f30e-ce33-4580-bb57-a280c45822a4");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_Flow [out]");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_Flow [done]");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Value at 50%");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Value at 50%");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Value at 100%");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Value at 100%");
        rt.DeclareVar("float", 0.0, "varInterpolate_9b751e06-4876-4626-899e-55af0fba4987");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (duration -1f");
        rt.DeclareVar("float", 0.0, "varInterpolate_8b6755b6-f135-42d5-8a6c-a04af0b6053d");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (duration infinite");
        rt.DeclareVar("float", 0.0, "varInterpolate_9ff6e551-9919-4526-83ef-e8c53fda1475");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p1 NaN)");
        rt.DeclareVar("float", 0.0, "varInterpolate_5687b23c-c180-4e03-a078-d0eb6719fc74");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p2 NaN)");
        rt.DeclareVar("float4", new double[] { 0.0, 0.0, 0.0, 1.0 }, "varInterpolateSlerp_06a5a84a-00fd-44f9-9de5-0f706d17d1f5");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_useSlerp on float4, value at 100%");
        rt.DeclareVar("float4", new double[] { -0.0142, -0.0142, -0.0142, 0.0 }, "TestResult_variable/interpolate_useSlerp on float4, value at 100%");
        rt.DeclareVar("float", 0.0, "varInterpolate_a1403e18-26f5-435c-89d7-636ddf904804");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p1.x -0.1)");
        rt.DeclareVar("float", 0.0, "varInterpolate_47f0b085-4868-48c0-b9ad-ff903acae3b4");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p2.x 1.1)");
        rt.DeclareVar("float", 0.0, "varInterpolate_87e57612-b9b9-454e-869d-cd948db1074f");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p1.y +Inf)");
        rt.DeclareVar("float", 0.0, "varInterpolateEaseIn_e018cbfe-d548-48ee-8721-56a41a3f7743");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Ease-in curve, value at 50%");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Ease-in curve, value at 50%");
        rt.DeclareVar("float", 0.0, "varInterpolateOvershoot_a125f62d-671f-4124-ada3-38b5cdc76c72");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Overshoot curve (p1.y -1), value below start");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Overshoot curve (p1.y -1), value below start");
        rt.DeclareVar("bool", true, "TestResult_variable/interpolate_Overshoot curve: no [err]");
        rt.DeclareVar("float", 0.0, "varInterpolateZeroDuration_75bfadf9-c026-4760-864d-17e316ea085a");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_Duration 0: [done]");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Duration 0: value on [done]");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Duration 0: value on [done]");
        rt.DeclareVar("float", 0.0, "varInterpolateRetrigger_5a15b933-9137-457a-83c2-8d36dbd37cc0");
        rt.DeclareVar("bool", true, "TestResult_variable/interpolate_Re-trigger: 1st [done] not fired");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_Re-trigger: 2nd [done]");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Re-trigger: 2nd target reached");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Re-trigger: 2nd target reached");
        rt.DeclareVar("float", 0.0, "varInterpolateSetStops_2bf85a04-65eb-4335-8f06-e46d379d4b76");
        rt.DeclareVar("bool", true, "TestResult_variable/interpolate_variable/set stops it: [done] not fired");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_variable/set stops it: keeps set value");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_variable/set stops it: keeps set value");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)5.0);
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
        void proc91()
        {
            rt.Log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", new object[] { V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 10.0 });
            V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4;
        }
        void proc26()
        {
            rt.Log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0.1)", new object[] { V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 8.024034 });
            V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4;
        }
        void proc143()
        {
            rt.Log("<variable/interpolate - useSlerp on float4, value at 100%>: Value is {0}, should be {1} (Proximity range: 0.0001)", new object[] { V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5, new double[] { 0.0, 0.707106769, 0.0, 0.707106769 } });
            V.TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_ = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5;
        }
        void proc187()
        {
            rt.Log("<variable/interpolate - Ease-in curve, value at 50%>: Value is {0}, should be {1} (Proximity range: 0.2)", new object[] { V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743, 3.15356827 });
            V.TestResult_variable_interpolate_Ease_in_curve__value_at_50_ = V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743;
        }
        void proc208()
        {
            rt.Log("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Value is {0}, should be {1} (Proximity range: 0.2)", new object[] { V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72, -2.07104039 });
            V.TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72;
        }
        void proc245()
        {
            rt.Log("<variable/interpolate - Duration 0: value on [done]>: Value is {0}, should be {1} ", new object[] { V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a, 3.0 });
            V.TestResult_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a;
        }
        void proc282()
        {
            rt.Log("<variable/interpolate - Re-trigger: 2nd target reached>: Value is {0}, should be {1} ", new object[] { V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0, 20.0 });
            V.TestResult_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0;
        }
        void proc303()
        {
            rt.Log("<variable/interpolate - variable/set stops it: keeps set value>: Value is {0}, should be {1} ", new object[] { V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76, 4.0 });
            V.TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76;
        }
        void OnStart0()
        {
            void Cont1()
            {
                if (!V.TestResult_variable_interpolate_Flow__out_)
                {
                    rt.Log("ERROR! <variable/interpolate - Flow [out]>: Flow not triggered! This should not happened!");
                }
                if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_variable_interpolate_Flow__done_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Flow [done]>: Flow not triggered! This should not happened!");
                    }
                }
                if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_Value_at_50_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Value at 50%>: Test Failed");
                    }
                }
                if (rt.PtrSet("/nodes/24/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_Value_at_100_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Value at 100%>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay2, 4.5, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/18/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("<variable/interpolate - Flow [done]>: Flow triggered");
                            V.TestResult_variable_interpolate_Flow__done_ = true;
                        }
                    }
                    if (rt.PtrSet("/nodes/24/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 == 10.0)
                        {
                            if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/24/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 == 10.0;
                                    rt.Log("<variable/interpolate - Value at 100%>: Test Successful");
                                    proc91();
                                }
                            }
                        }
                        else
                        {
                            proc91();
                        }
                    }
                }
                if (rt.VarInterp(0, 10.0, 4.0, new double[] { 0.25, 0.1 }, new double[] { 0.25, 1.0 }, false, Cont2))
                {
                    if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        rt.Log("<variable/interpolate - Flow [out]>: Flow triggered");
                        V.TestResult_variable_interpolate_Flow__out_ = true;
                    }
                }
                void Cont3()
                {
                    if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (M.Abs(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1)
                        {
                            if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = M.Abs(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1;
                                    rt.Log("<variable/interpolate - Value at 50%>: Test Successful");
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
                rt.SetDelay(delay1, 2.0, Cont3);
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            if (!rt.VarInterp(7, 14.0, -1.0, new double[] { 1.0, 1.0 }, new double[] { 1.0, 1.0 }, false, null))
            {
                if (rt.PtrSet("/nodes/29/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (duration -1f>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__duration__1f = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__duration__1f)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (duration -1f>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            if (!rt.VarInterp(9, 14.0, M.Inf(), new double[] { 1.0, 1.0 }, new double[] { 1.0, 1.0 }, false, null))
            {
                if (rt.PtrSet("/nodes/35/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (duration infinite>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__duration_infinite = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__duration_infinite)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (duration infinite>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            if (!rt.VarInterp(11, 14.0, 1.0, new double[] { double.NaN, double.NaN }, new double[] { 1.0, 1.0 }, false, null))
            {
                if (rt.PtrSet("/nodes/41/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (p1 NaN)>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__p1_NaN_ = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__p1_NaN_)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (p1 NaN)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            if (!rt.VarInterp(13, 14.0, 1.0, new double[] { 1.0, 1.0 }, new double[] { double.NaN, double.NaN }, false, null))
            {
                if (rt.PtrSet("/nodes/47/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (p2 NaN)>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__p2_NaN_ = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__p2_NaN_)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (p2 NaN)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart4);
        void OnStart5()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/54/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_)
                    {
                        rt.Log("ERROR! <variable/interpolate - useSlerp on float4, value at 100%>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay3, 1.5, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/54/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        var t1 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5;
                        if (M.Length(t1) > 0.9998999 && M.Abs(M.Dot(M.Normalize(t1).Value, new double[] { 0.0, 0.7071068, 0.0, 0.7071068 })) > 0.9999)
                        {
                            if (rt.PtrSet("/nodes/53/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/54/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    var t2 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5;
                                    V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ = M.Length(t2) > 0.9998999 && M.Abs(M.Dot(M.Normalize(t2).Value, new double[] { 0.0, 0.7071068, 0.0, 0.7071068 })) > 0.9999;
                                    rt.Log("<variable/interpolate - useSlerp on float4, value at 100%>: Test Successful");
                                    proc143();
                                }
                            }
                        }
                        else
                        {
                            proc143();
                        }
                    }
                }
                rt.VarInterp(15, new double[] { 0.0, 0.707106769, 0.0, 0.707106769 }, 1.0, new double[] { 0.25, 0.1 }, new double[] { 0.25, 1.0 }, true, Cont2);
            }
        }
        rt.OnStart(OnStart5);
        void OnStart6()
        {
            if (!rt.VarInterp(18, 14.0, 1.0, new double[] { -0.1, 0.5 }, new double[] { 1.0, 1.0 }, false, null))
            {
                if (rt.PtrSet("/nodes/77/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (p1.x -0.1)>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (p1.x -0.1)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart6);
        void OnStart7()
        {
            if (!rt.VarInterp(20, 14.0, 1.0, new double[] { 1.0, 1.0 }, new double[] { 1.1, 0.5 }, false, null))
            {
                if (rt.PtrSet("/nodes/83/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (p2.x 1.1)>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (p2.x 1.1)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart7);
        void OnStart8()
        {
            if (!rt.VarInterp(22, 14.0, 1.0, M.Combine2(0.5, M.Inf()), new double[] { 1.0, 1.0 }, false, null))
            {
                if (rt.PtrSet("/nodes/89/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<variable/interpolate - [Err] flow (p1.y +Inf)>: Flow triggered");
                    V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ = true;
                }
            }
            if (!V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_)
            {
                rt.Log("ERROR! <variable/interpolate - [Err] flow (p1.y +Inf)>: Flow not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart8);
        void OnStart9()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/60/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Ease-in curve, value at 50%>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay5, 4.5, Cont1))
            {
                rt.VarInterp(24, 10.0, 4.0, new double[] { 0.42, 0.0 }, new double[] { 1.0, 1.0 }, false, null);
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/60/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (M.Abs(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2)
                        {
                            if (rt.PtrSet("/nodes/59/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/60/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ = M.Abs(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2;
                                    rt.Log("<variable/interpolate - Ease-in curve, value at 50%>: Test Successful");
                                    proc187();
                                }
                            }
                        }
                        else
                        {
                            proc187();
                        }
                    }
                }
                rt.SetDelay(delay4, 2.0, Cont2);
            }
        }
        rt.OnStart(OnStart9);
        void OnStart10()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/66/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start)
                    {
                        rt.Log("ERROR! <variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Failed");
                    }
                }
                if (V.TestResult_variable_interpolate_Overshoot_curve__no__err_)
                {
                    rt.Log("<variable/interpolate - Overshoot curve: no [err]>: Test Successful");
                }
            }
            if (rt.SetDelay(delay7, 4.5, Cont1))
            {
                if (!rt.VarInterp(27, 10.0, 4.0, new double[] { 0.5, -1.0 }, new double[] { 0.5, 2.0 }, false, null))
                {
                    if (rt.PtrSet("/nodes/70/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        rt.Log("ERROR! <variable/interpolate - Overshoot curve: no [err]>: Flow triggered! This should not happened!");
                        V.TestResult_variable_interpolate_Overshoot_curve__no__err_ = false;
                    }
                }
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/66/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (M.Abs(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2)
                        {
                            if (rt.PtrSet("/nodes/65/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/66/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = M.Abs(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2;
                                    rt.Log("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Successful");
                                    proc208();
                                }
                            }
                        }
                        else
                        {
                            proc208();
                        }
                    }
                }
                rt.SetDelay(delay6, 0.76, Cont2);
            }
        }
        rt.OnStart(OnStart10);
        void OnStart11()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/96/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_variable_interpolate_Duration_0___done_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Duration 0: [done]>: Flow not triggered! This should not happened!");
                    }
                }
                if (rt.PtrSet("/nodes/102/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Duration 0: value on [done]>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay8, 1.0, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/95/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/96/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("<variable/interpolate - Duration 0: [done]>: Flow triggered");
                            V.TestResult_variable_interpolate_Duration_0___done_ = true;
                        }
                    }
                    if (rt.PtrSet("/nodes/102/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a == 3.0)
                        {
                            if (rt.PtrSet("/nodes/101/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/102/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a == 3.0;
                                    rt.Log("<variable/interpolate - Duration 0: value on [done]>: Test Successful");
                                    proc245();
                                }
                            }
                        }
                        else
                        {
                            proc245();
                        }
                    }
                }
                rt.VarInterp(31, 3.0, 0.0, new double[] { 0.25, 0.1 }, new double[] { 0.25, 1.0 }, false, Cont2);
            }
        }
        rt.OnStart(OnStart11);
        void OnStart12()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/108/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired)
                    {
                        rt.Log("<variable/interpolate - Re-trigger: 1st [done] not fired>: Test Successful");
                    }
                }
                if (rt.PtrSet("/nodes/114/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_variable_interpolate_Re_trigger__2nd__done_)
                    {
                        rt.Log("ERROR! <variable/interpolate - Re-trigger: 2nd [done]>: Flow not triggered! This should not happened!");
                    }
                }
                if (rt.PtrSet("/nodes/120/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached)
                    {
                        rt.Log("ERROR! <variable/interpolate - Re-trigger: 2nd target reached>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay9, 2.0, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/106/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/108/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("ERROR! <variable/interpolate - Re-trigger: 1st [done] not fired>: Flow triggered! This should not happened!");
                            V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired = false;
                        }
                    }
                }
                rt.VarInterp(35, 10.0, 1.0, new double[] { 0.25, 0.1 }, new double[] { 0.25, 1.0 }, false, Cont2);
                void Cont3()
                {
                    if (rt.PtrSet("/nodes/113/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/114/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("<variable/interpolate - Re-trigger: 2nd [done]>: Flow triggered");
                            V.TestResult_variable_interpolate_Re_trigger__2nd__done_ = true;
                        }
                    }
                    if (rt.PtrSet("/nodes/120/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 == 20.0)
                        {
                            if (rt.PtrSet("/nodes/119/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/120/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 == 20.0;
                                    rt.Log("<variable/interpolate - Re-trigger: 2nd target reached>: Test Successful");
                                    proc282();
                                }
                            }
                        }
                        else
                        {
                            proc282();
                        }
                    }
                }
                rt.VarInterp(35, 20.0, 1.0, new double[] { 0.25, 0.1 }, new double[] { 0.25, 1.0 }, false, Cont3);
            }
        }
        rt.OnStart(OnStart12);
        void OnStart13()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/126/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired)
                    {
                        rt.Log("<variable/interpolate - variable/set stops it: [done] not fired>: Test Successful");
                    }
                }
                if (rt.PtrSet("/nodes/132/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value)
                    {
                        rt.Log("ERROR! <variable/interpolate - variable/set stops it: keeps set value>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay11, 2.0, Cont1))
            {
                void Cont2()
                {
                    if (rt.PtrSet("/nodes/124/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/126/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            rt.Log("ERROR! <variable/interpolate - variable/set stops it: [done] not fired>: Flow triggered! This should not happened!");
                            V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired = false;
                        }
                    }
                }
                rt.VarInterp(40, 10.0, 1.0, new double[] { 0.25, 0.1 }, new double[] { 0.25, 1.0 }, false, Cont2);
                V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 = 4.0;
                void Cont3()
                {
                    if (rt.PtrSet("/nodes/132/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                    {
                        if (V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 == 4.0)
                        {
                            if (rt.PtrSet("/nodes/131/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/132/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 == 4.0;
                                    rt.Log("<variable/interpolate - variable/set stops it: keeps set value>: Test Successful");
                                    proc303();
                                }
                            }
                        }
                        else
                        {
                            proc303();
                        }
                    }
                }
                rt.SetDelay(delay10, 1.5, Cont3);
            }
        }
        rt.OnStart(OnStart13);
        void OnStart14()
        {
            rt.Send(Events.test_onStart);
            void Cont1()
            {
                if (V.TestResult_variable_interpolate_Flow__out_ && V.TestResult_HasPassed_variable_interpolate_Value_at_50_ && V.TestResult_variable_interpolate_Flow__done_ && V.TestResult_HasPassed_variable_interpolate_Value_at_100_ && V.TestResult_variable_interpolate__Err__flow__duration__1f && V.TestResult_variable_interpolate__Err__flow__duration_infinite && V.TestResult_variable_interpolate__Err__flow__p1_NaN_ && V.TestResult_variable_interpolate__Err__flow__p2_NaN_ && V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ && V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ && V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start && V.TestResult_variable_interpolate_Overshoot_curve__no__err_ && V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ && V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ && V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ && V.TestResult_variable_interpolate_Duration_0___done_ && V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ && V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired && V.TestResult_variable_interpolate_Re_trigger__2nd__done_ && V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached && V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired && V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value)
                {
                    rt.Send(Events.test_onSuccess);
                }
                else
                {
                    rt.Send(Events.test_onFailed);
                }
            }
            rt.SetDelay(delay12, 5.0, Cont1);
        }
        rt.OnStart(OnStart14);
    }
}
