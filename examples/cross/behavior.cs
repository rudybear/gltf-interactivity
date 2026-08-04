using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public bool TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ { get => E.GetVarBool(0); set => E.SetVarBool(0, value); }
        public double[] TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ { get => E.GetVarVec(1); set => E.SetVarVec(1, value); }
        public bool TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public double[] TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ { get => E.GetVarVec(3); set => E.SetVarVec(3, value); }
        public bool TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public double[] TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ { get => E.GetVarVec(5); set => E.SetVarVec(5, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("bool", false, "TestResult_HasPassed_math/cross_[a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_math/cross_[a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_math/cross_[a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_math/cross_[a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_math/cross_[a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_math/cross_[a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        void proc10()
        {
            rt.Log("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { M.Cross(new double[] { 1.0, 0.0, 0.0 }, new double[] { 0.0, 1.0, 0.0 }), new double[] { 0.0, 0.0, 1.0 } });
            V.TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = M.Cross(new double[] { 1.0, 0.0, 0.0 }, new double[] { 0.0, 1.0, 0.0 });
        }
        void proc29()
        {
            rt.Log("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { M.Cross(new double[] { 2.0, 3.0, 4.0 }, new double[] { 5.0, 6.0, 7.0 }), new double[] { -3.0, 6.0, -3.0 } });
            V.TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = M.Cross(new double[] { 2.0, 3.0, 4.0 }, new double[] { 5.0, 6.0, 7.0 });
        }
        void proc43()
        {
            rt.Log("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Value is {0}, should be {1} ", new object[] { M.Cross(new double[] { 2.0, 4.0, 6.0 }, new double[] { 1.0, 2.0, 3.0 }), new double[] { 0.0, 0.0, 0.0 } });
            V.TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = M.Cross(new double[] { 2.0, 4.0, 6.0 }, new double[] { 1.0, 2.0, 3.0 });
        }
        void OnStart0()
        {
            var t1 = M.Cross(new double[] { 1.0, 0.0, 0.0 }, new double[] { 0.0, 1.0, 0.0 });
            if (M.Length(t1) > 0.9999 && M.Dot(M.Normalize(t1).Value, new double[] { 0.0, 0.0, 1.0 }) > 0.9999)
            {
                if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    var t2 = M.Cross(new double[] { 1.0, 0.0, 0.0 }, new double[] { 0.0, 1.0, 0.0 });
                    V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = M.Length(t2) > 0.9999 && M.Dot(M.Normalize(t2).Value, new double[] { 0.0, 0.0, 1.0 }) > 0.9999;
                    rt.Log("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Successful");
                    proc10();
                }
            }
            else
            {
                proc10();
            }
            if (!V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_)
            {
                rt.Log("ERROR! <math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Failed");
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            var t1 = M.Cross(new double[] { 2.0, 3.0, 4.0 }, new double[] { 5.0, 6.0, 7.0 });
            if (M.Length(t1) > 7.348369 && M.Dot(M.Normalize(t1).Value, new double[] { -0.408248276, 0.816496551, -0.408248276 }) > 0.9999)
            {
                if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    var t2 = M.Cross(new double[] { 2.0, 3.0, 4.0 }, new double[] { 5.0, 6.0, 7.0 });
                    V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = M.Length(t2) > 7.348369 && M.Dot(M.Normalize(t2).Value, new double[] { -0.408248276, 0.816496551, -0.408248276 }) > 0.9999;
                    rt.Log("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Successful");
                    proc29();
                }
            }
            else
            {
                proc29();
            }
            if (!V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_)
            {
                rt.Log("ERROR! <math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Failed");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            if (M.Eq(M.Cross(new double[] { 2.0, 4.0, 6.0 }, new double[] { 1.0, 2.0, 3.0 }), new double[] { 0.0, 0.0, 0.0 }))
            {
                if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = M.Eq(M.Cross(new double[] { 2.0, 4.0, 6.0 }, new double[] { 1.0, 2.0, 3.0 }), new double[] { 0.0, 0.0, 0.0 });
                    rt.Log("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Successful");
                    proc43();
                }
            }
            else
            {
                proc43();
            }
            if (!V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_)
            {
                rt.Log("ERROR! <math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Failed");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ && V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ && V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_)
            {
                rt.Send(Events.test_onSuccess);
            }
            else
            {
                rt.Send(Events.test_onFailed);
            }
        }
        rt.OnStart(OnStart3);
    }
}
