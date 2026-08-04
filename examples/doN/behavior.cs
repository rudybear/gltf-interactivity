using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public int counter1 { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
        public bool TestResult_flow_doN__out__flow { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool TestResult_HasPassed_flow_doN__out__iteration__5_ { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public int TestResult_flow_doN__out__iteration__5_ { get => E.GetVarInt(3); set => E.SetVarInt(3, value); }
        public bool TestResult_HasPassed_flow_doN__currentCount_ { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public int TestResult_flow_doN__currentCount_ { get => E.GetVarInt(5); set => E.SetVarInt(5, value); }
        public int counter2 { get => E.GetVarInt(6); set => E.SetVarInt(6, value); }
        public bool TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public int TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ { get => E.GetVarInt(8); set => E.SetVarInt(8, value); }
        public int counter3 { get => E.GetVarInt(9); set => E.SetVarInt(9, value); }
        public bool TestResult_HasPassed_flow_doN_Max_Iteration_flow { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public int TestResult_flow_doN_Max_Iteration_flow { get => E.GetVarInt(11); set => E.SetVarInt(11, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 0, "467a7f10-2a70-49b0-ac90-a045449a37e9");
        rt.DeclareVar("bool", false, "TestResult_flow/doN_[out] flow");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[out] iteration (5)");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[out] iteration (5)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[currentCount]");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[currentCount]");
        rt.DeclareVar("int", 0, "8043697e-0ae2-4500-a1c9-9d9ff12a4a79");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)");
        rt.DeclareVar("int", 0, "983a7860-0d44-41f1-abea-9a2ed508a47a");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_Max Iteration flow");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_Max Iteration flow");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var doN1 = new DoNState();
        var doN2 = new DoNState();
        var doN3 = new DoNState();
        void proc0()
        {
            if (rt.DoN(doN1, 5))
            {
                V.counter1 = unchecked(V.counter1 + 1);
                if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/doN - [out] flow>: Flow triggered");
                    V.TestResult_flow_doN__out__flow = true;
                }
                if (V.counter1 == 5)
                {
                    if (V.counter1 == 5)
                    {
                        if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            V.TestResult_HasPassed_flow_doN__out__iteration__5_ = V.counter1 == 5;
                            rt.Log("<flow/doN - [out] iteration (5)>: Test Successful");
                            proc19();
                        }
                    }
                    else
                    {
                        proc19();
                    }
                    if ((int)doN1.Count == 5)
                    {
                        if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            V.TestResult_HasPassed_flow_doN__currentCount_ = (int)doN1.Count == 5;
                            rt.Log("<flow/doN - [currentCount]>: Test Successful");
                            proc30();
                        }
                    }
                    else
                    {
                        proc30();
                    }
                }
            }
        }
        void proc19()
        {
            rt.Log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", new object[] { V.counter1, 5 });
            V.TestResult_flow_doN__out__iteration__5_ = V.counter1;
        }
        void proc30()
        {
            rt.Log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", new object[] { (int)doN1.Count, 5 });
            V.TestResult_flow_doN__currentCount_ = (int)doN1.Count;
        }
        void proc49()
        {
            if (rt.DoN(doN2, 2))
            {
                V.counter2 = unchecked(V.counter2 + 1);
            }
        }
        void proc57()
        {
            rt.Log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", new object[] { V.counter2, 4 });
            V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2;
        }
        void proc66()
        {
            if (rt.DoN(doN3, 2))
            {
                V.counter3 = unchecked(V.counter3 + 1);
            }
        }
        void proc74()
        {
            rt.Log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", new object[] { V.counter3, 2 });
            V.TestResult_flow_doN_Max_Iteration_flow = V.counter3;
        }
        void OnStart0()
        {
            proc0();
            proc0();
            proc0();
            proc0();
            proc0();
            if (!V.TestResult_flow_doN__out__flow)
            {
                rt.Log("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!");
            }
            if (!V.TestResult_HasPassed_flow_doN__out__iteration__5_)
            {
                rt.Log("ERROR! <flow/doN - [out] iteration (5)>: Test Failed");
            }
            if (!V.TestResult_HasPassed_flow_doN__currentCount_)
            {
                rt.Log("ERROR! <flow/doN - [currentCount]>: Test Failed");
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            proc49();
            proc49();
            proc49();
            doN2.Count = 0.0;
            proc49();
            proc49();
            if (V.counter2 == 4)
            {
                if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2 == 4;
                    rt.Log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful");
                    proc57();
                }
            }
            else
            {
                proc57();
            }
            if (!V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_)
            {
                rt.Log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            proc66();
            proc66();
            proc66();
            proc66();
            proc66();
            if (V.counter3 == 2)
            {
                if (rt.PtrSet("/nodes/29/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = V.counter3 == 2;
                    rt.Log("<flow/doN - Max Iteration flow>: Test Successful");
                    proc74();
                }
            }
            else
            {
                proc74();
            }
            if (!V.TestResult_HasPassed_flow_doN_Max_Iteration_flow)
            {
                rt.Log("ERROR! <flow/doN - Max Iteration flow>: Test Failed");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_flow_doN__out__flow && V.TestResult_HasPassed_flow_doN__out__iteration__5_ && V.TestResult_HasPassed_flow_doN__currentCount_ && V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ && V.TestResult_HasPassed_flow_doN_Max_Iteration_flow)
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
