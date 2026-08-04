using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public double varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }
        public bool TestResult_variable_interpolate_Flow__out_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_variable_interpolate_Flow__done_ { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public bool TestResult_HasPassed_variable_interpolate_Value_at_50_ { get => E.GetVarBool(3); set => E.SetVarBool(3, value); }
        public double TestResult_variable_interpolate_Value_at_50_ { get => E.GetVarFloat(4); set => E.SetVarFloat(4, value); }
        public bool TestResult_HasPassed_variable_interpolate_Value_at_100_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public double TestResult_variable_interpolate_Value_at_100_ { get => E.GetVarFloat(6); set => E.SetVarFloat(6, value); }
        public double varInterpolate_70d07005_5cf3_4096_aff1_64784e4f4a05 { get => E.GetVarFloat(7); set => E.SetVarFloat(7, value); }
        public bool TestResult_variable_interpolate__Err__flow__duration__1f { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public double varInterpolate_e238c886_965c_4e31_8403_0fb87c761997 { get => E.GetVarFloat(9); set => E.SetVarFloat(9, value); }
        public bool TestResult_variable_interpolate__Err__flow__duration_infinite { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public double varInterpolate_a863aca9_6cb6_4e45_8c24_98370c20b2a1 { get => E.GetVarFloat(11); set => E.SetVarFloat(11, value); }
        public bool TestResult_variable_interpolate__Err__flow__p1_NaN_ { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public double varInterpolate_fea34d13_336d_4b2e_89fd_2b31b1cce966 { get => E.GetVarFloat(13); set => E.SetVarFloat(13, value); }
        public bool TestResult_variable_interpolate__Err__flow__p2_NaN_ { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("float", 0.0, "varInterpolate_14f3dfe8-bfe3-4e24-b44c-4d23611e2ac5");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_Flow [out]");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_Flow [done]");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Value at 50%");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Value at 50%");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_variable/interpolate_Value at 100%");
        rt.DeclareVar("float", -0.0142, "TestResult_variable/interpolate_Value at 100%");
        rt.DeclareVar("float", 0.0, "varInterpolate_70d07005-5cf3-4096-aff1-64784e4f4a05");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (duration -1f");
        rt.DeclareVar("float", 0.0, "varInterpolate_e238c886-965c-4e31-8403-0fb87c761997");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (duration infinite");
        rt.DeclareVar("float", 0.0, "varInterpolate_a863aca9-6cb6-4e45-8c24-98370c20b2a1");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p1 NaN)");
        rt.DeclareVar("float", 0.0, "varInterpolate_fea34d13-336d-4b2e-89fd-2b31b1cce966");
        rt.DeclareVar("bool", false, "TestResult_variable/interpolate_[Err] flow (p2 NaN)");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)5.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var delay1 = new DelayState();
        var delay2 = new DelayState();
        var delay3 = new DelayState();
        void proc59()
        {
            rt.Log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", new object[] { V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 10.0 });
            V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5;
        }
        void proc30()
        {
            rt.Log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0,1)", new object[] { V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 8.024034 });
            V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5;
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
                        if (V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0)
                        {
                            if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/24/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0;
                                    rt.Log("<variable/interpolate - Value at 100%>: Test Successful");
                                    proc59();
                                }
                            }
                        }
                        else
                        {
                            proc59();
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
                        if (M.Abs(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1)
                        {
                            if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                            {
                                if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                                {
                                    V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = M.Abs(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1;
                                    rt.Log("<variable/interpolate - Value at 50%>: Test Successful");
                                    proc30();
                                }
                            }
                        }
                        else
                        {
                            proc30();
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
            rt.Send(Events.test_onStart);
            void Cont1()
            {
                if (V.TestResult_variable_interpolate_Flow__out_ && V.TestResult_HasPassed_variable_interpolate_Value_at_50_ && V.TestResult_variable_interpolate_Flow__done_ && V.TestResult_HasPassed_variable_interpolate_Value_at_100_ && V.TestResult_variable_interpolate__Err__flow__duration__1f && V.TestResult_variable_interpolate__Err__flow__duration_infinite && V.TestResult_variable_interpolate__Err__flow__p1_NaN_ && V.TestResult_variable_interpolate__Err__flow__p2_NaN_)
                {
                    rt.Send(Events.test_onSuccess);
                }
                else
                {
                    rt.Send(Events.test_onFailed);
                }
            }
            rt.SetDelay(delay3, 5.0, Cont1);
        }
        rt.OnStart(OnStart5);
    }
}
