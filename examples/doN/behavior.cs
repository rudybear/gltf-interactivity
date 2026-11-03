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
        public bool TestResult_flow_doN_N___0___out__never_fires { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public int DoN_n_71324c55_32db_4c84_9ec7_d85286364262 { get => E.GetVarInt(13); set => E.SetVarInt(13, value); }
        public int counter4 { get => E.GetVarInt(14); set => E.SetVarInt(14, value); }
        public bool TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ { get => E.GetVarBool(15); set => E.SetVarBool(15, value); }
        public int TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ { get => E.GetVarInt(16); set => E.SetVarInt(16, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 0, "805923c1-6da7-4eb4-b97d-dc82d6f949a7");
        rt.DeclareVar("bool", false, "TestResult_flow/doN_[out] flow");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[out] iteration (5)");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[out] iteration (5)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[currentCount]");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[currentCount]");
        rt.DeclareVar("int", 0, "eef46349-4ad9-4f55-9d70-fc4f2534d42b");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)");
        rt.DeclareVar("int", 0, "a9e7d29c-087b-4a8d-9729-2620a877b3f4");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_Max Iteration flow");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_Max Iteration flow");
        rt.DeclareVar("bool", true, "TestResult_flow/doN_N = 0: [out] never fires");
        rt.DeclareVar("int", 1, "DoN_n_71324c55-32db-4c84-9ec7-d85286364262");
        rt.DeclareVar("int", 0, "70877bda-82fa-4641-981d-f56d46487cca");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)");
        rt.DeclareVar("int", -1, "TestResult_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var doN1 = new DoNState();
        var doN2 = new DoNState();
        var doN3 = new DoNState();
        var doN4 = new DoNState();
        var doN5 = new DoNState();
        void proc6()
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
                            proc42();
                        }
                    }
                    else
                    {
                        proc42();
                    }
                    if ((int)doN1.Count == 5)
                    {
                        if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            V.TestResult_HasPassed_flow_doN__currentCount_ = (int)doN1.Count == 5;
                            rt.Log("<flow/doN - [currentCount]>: Test Successful");
                            proc48();
                        }
                    }
                    else
                    {
                        proc48();
                    }
                }
            }
        }
        void proc42()
        {
            rt.Log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", new object[] { V.counter1, 5 });
            V.TestResult_flow_doN__out__iteration__5_ = V.counter1;
        }
        void proc48()
        {
            rt.Log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", new object[] { (int)doN1.Count, 5 });
            V.TestResult_flow_doN__currentCount_ = (int)doN1.Count;
        }
        void proc59()
        {
            if (rt.DoN(doN2, 2))
            {
                V.counter2 = unchecked(V.counter2 + 1);
            }
        }
        void proc65()
        {
            rt.Log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", new object[] { V.counter2, 4 });
            V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2;
        }
        void proc76()
        {
            if (rt.DoN(doN3, 2))
            {
                V.counter3 = unchecked(V.counter3 + 1);
            }
        }
        void proc82()
        {
            rt.Log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", new object[] { V.counter3, 2 });
            V.TestResult_flow_doN_Max_Iteration_flow = V.counter3;
        }
        void proc88()
        {
            if (rt.DoN(doN4, 0))
            {
                if (rt.PtrSet("/nodes/34/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("ERROR! <flow/doN - N = 0: [out] never fires>: Flow triggered! This should not happened!");
                    V.TestResult_flow_doN_N___0___out__never_fires = false;
                }
            }
        }
        void proc102()
        {
            if (rt.DoN(doN5, V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262))
            {
                V.counter4 = unchecked(V.counter4 + 1);
            }
        }
        void OnStart0()
        {
            proc6();
            proc6();
            proc6();
            proc6();
            proc6();
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
            proc59();
            proc59();
            proc59();
            doN2.Count = 0.0;
            proc59();
            proc59();
            if (V.counter2 == 4)
            {
                if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2 == 4;
                    rt.Log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful");
                    proc65();
                }
            }
            else
            {
                proc65();
            }
            if (!V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_)
            {
                rt.Log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            proc76();
            proc76();
            proc76();
            proc76();
            proc76();
            if (V.counter3 == 2)
            {
                if (rt.PtrSet("/nodes/29/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = V.counter3 == 2;
                    rt.Log("<flow/doN - Max Iteration flow>: Test Successful");
                    proc82();
                }
            }
            else
            {
                proc82();
            }
            if (!V.TestResult_HasPassed_flow_doN_Max_Iteration_flow)
            {
                rt.Log("ERROR! <flow/doN - Max Iteration flow>: Test Failed");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            proc88();
            proc88();
            proc88();
            if (V.TestResult_flow_doN_N___0___out__never_fires)
            {
                rt.Log("<flow/doN - N = 0: [out] never fires>: Test Successful");
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            proc102();
            proc102();
            V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262 = 3;
            proc102();
            proc102();
            proc102();
            V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4 == 3;
            if (V.counter4 == 3)
            {
                if (rt.PtrSet("/nodes/41/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered correct amount");
                    V.TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4;
                }
            }
            else
            {
                rt.Log("ERROR! <flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered {0} times from 3. This should not happened!", new object[] { V.counter4 });
            }
        }
        rt.OnStart(OnStart4);
        void OnStart5()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_flow_doN__out__flow && V.TestResult_HasPassed_flow_doN__out__iteration__5_ && V.TestResult_HasPassed_flow_doN__currentCount_ && V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ && V.TestResult_HasPassed_flow_doN_Max_Iteration_flow && V.TestResult_flow_doN_N___0___out__never_fires && V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_)
            {
                rt.Send(Events.test_onSuccess);
            }
            else
            {
                rt.Send(Events.test_onFailed);
            }
        }
        rt.OnStart(OnStart5);
    }
}
