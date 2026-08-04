using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public double LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 { get => E.GetVarFloat(0); set => E.SetVarFloat(0, value); }
        public bool TestResult_math_random_Random__new_number_in_new_flow_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public double TestResult_math_random_Random__same_number_in_current_flow_ { get => E.GetVarFloat(3); set => E.SetVarFloat(3, value); }
        public int counter1 { get => E.GetVarInt(4); set => E.SetVarInt(4, value); }
        public bool TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public double TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ { get => E.GetVarFloat(6); set => E.SetVarFloat(6, value); }
        public int counter2 { get => E.GetVarInt(7); set => E.SetVarInt(7, value); }
        public bool TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public double TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ { get => E.GetVarFloat(9); set => E.SetVarFloat(9, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("float", -1.0);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("float", -0.0142);
        rt.DeclareVar("int", 0);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("float", -0.0142);
        rt.DeclareVar("int", 0);
        rt.DeclareVar("bool", false);
        rt.DeclareVar("float", -0.0142);
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        int for1 = 0;
        int for2 = 0;
        void proc21()
        {
            var t1 = rt.Random();
            rt.Log("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", new object[] { t1 - t1, 0.0 });
            var t2 = rt.Random();
            V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2;
        }
        void proc51()
        {
            rt.Log("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,4)", new object[] { M.IntToFloat(V.counter1) / 1000.0 * 4.0, 3.141592653589793 });
            V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = M.IntToFloat(V.counter1) / 1000.0 * 4.0;
        }
        void proc89()
        {
            rt.Log("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,1)", new object[] { M.IntToFloat(V.counter2) / 10000.0 * 4.0, 3.141592653589793 });
            V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = M.IntToFloat(V.counter2) / 10000.0 * 4.0;
        }
        void OnStart0()
        {
            V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 = rt.Random();
            rt.Log("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", new object[] { rt.Random(), V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 });
            if (!(rt.Random() == V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38))
            {
                if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<math/random - Random (new number in new flow)>: Test Successful");
                    V.TestResult_math_random_Random__new_number_in_new_flow_ = true;
                }
            }
            if (!V.TestResult_math_random_Random__new_number_in_new_flow_)
            {
                rt.Log("ERROR! <math/random - Random (new number in new flow)>: Test Failed");
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            var t1 = rt.Random();
            if (t1 - t1 == 0.0)
            {
                if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    var t2 = rt.Random();
                    V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ = t2 - t2 == 0.0;
                    rt.Log("<math/random - Random (same number in current flow)>: Test Successful");
                    proc21();
                }
            }
            else
            {
                proc21();
            }
            if (!V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_)
            {
                rt.Log("ERROR! <math/random - Random (same number in current flow)>: Test Failed");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            for1 = 0;
            while (for1 < (1000))
            {
                if (M.Length(M.Sub(M.Mul(M.Combine2(rt.Random(), rt.Random()), new double[] { 2.0, 2.0 }), new double[] { 1.0, 1.0 })) < 1.0)
                {
                    V.counter1 = unchecked(V.counter1 + 1);
                }
                for1 = for1 + 1;
            }
            rt.Log("Monte Carlo 1k(random number distribution) Inside Circle: {0} / {1}", new object[] { V.counter1, 1000 });
            if (M.Abs(M.IntToFloat(V.counter1) / 1000.0 * 4.0 - 3.141592653589793) < 0.4)
            {
                if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ = M.Abs(M.IntToFloat(V.counter1) / 1000.0 * 4.0 - 3.141592653589793) < 0.4;
                    rt.Log("<math/random - Monte Carlo 1k(random number distribution)>: Test Successful");
                    proc51();
                }
            }
            else
            {
                proc51();
            }
            if (!V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_)
            {
                rt.Log("ERROR! <math/random - Monte Carlo 1k(random number distribution)>: Test Failed");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            for2 = 0;
            while (for2 < (10000))
            {
                if (M.Length(M.Sub(M.Mul(M.Combine2(rt.Random(), rt.Random()), new double[] { 2.0, 2.0 }), new double[] { 1.0, 1.0 })) < 1.0)
                {
                    V.counter2 = unchecked(V.counter2 + 1);
                }
                for2 = for2 + 1;
            }
            rt.Log("Monte Carlo 10k(random number distribution) Inside Circle: {0} / {1}", new object[] { V.counter2, 10000 });
            if (M.Abs(M.IntToFloat(V.counter2) / 10000.0 * 4.0 - 3.141592653589793) < 0.1)
            {
                if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ = M.Abs(M.IntToFloat(V.counter2) / 10000.0 * 4.0 - 3.141592653589793) < 0.1;
                    rt.Log("<math/random - Monte Carlo 10k(random number distribution)>: Test Successful");
                    proc89();
                }
            }
            else
            {
                proc89();
            }
            if (!V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_)
            {
                rt.Log("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed");
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_math_random_Random__new_number_in_new_flow_ && V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ && V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ && V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_)
            {
                rt.Send(Events.test_onSuccess);
            }
            else
            {
                rt.Send(Events.test_onFailed);
            }
        }
        rt.OnStart(OnStart4);
    }
}
