using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public int FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
        public bool TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public int FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 { get => E.GetVarInt(2); set => E.SetVarInt(2, value); }
        public bool TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ { get => E.GetVarBool(3); set => E.SetVarBool(3, value); }
        public bool FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public bool FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public bool FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 { get => E.GetVarBool(6); set => E.SetVarBool(6, value); }
        public bool FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public bool TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public bool FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c { get => E.GetVarBool(9); set => E.SetVarBool(9, value); }
        public bool FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public bool FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 { get => E.GetVarBool(11); set => E.SetVarBool(11, value); }
        public bool FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public bool TestResult_flow_multiGate_Loop { get => E.GetVarBool(13); set => E.SetVarBool(13, value); }
        public int counter1 { get => E.GetVarInt(14); set => E.SetVarInt(14, value); }
        public bool FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 { get => E.GetVarBool(15); set => E.SetVarBool(15, value); }
        public bool FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d { get => E.GetVarBool(16); set => E.SetVarBool(16, value); }
        public bool FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 { get => E.GetVarBool(17); set => E.SetVarBool(17, value); }
        public bool TestResult_flow_multiGate_Reset_Loop { get => E.GetVarBool(18); set => E.SetVarBool(18, value); }
        public int counter2 { get => E.GetVarInt(19); set => E.SetVarInt(19, value); }
        public bool TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation { get => E.GetVarBool(20); set => E.SetVarBool(20, value); }
        public int TestResult_flow_multiGate__lastIndex___1_before_activation { get => E.GetVarInt(21); set => E.SetVarInt(21, value); }
        public bool TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations { get => E.GetVarBool(22); set => E.SetVarBool(22, value); }
        public int TestResult_flow_multiGate__lastIndex__1_after_two_activations { get => E.GetVarInt(23); set => E.SetVarInt(23, value); }
        public bool TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used { get => E.GetVarBool(24); set => E.SetVarBool(24, value); }
        public int TestResult_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used { get => E.GetVarInt(25); set => E.SetVarInt(25, value); }
        public bool TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_ { get => E.GetVarBool(26); set => E.SetVarBool(26, value); }
        public int TestResult_flow_multiGate__lastIndex___1_after__reset_ { get => E.GetVarInt(27); set => E.SetVarInt(27, value); }
        public int counter3 { get => E.GetVarInt(28); set => E.SetVarInt(28, value); }
        public bool TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ { get => E.GetVarBool(29); set => E.SetVarBool(29, value); }
        public int TestResult_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ { get => E.GetVarInt(30); set => E.SetVarInt(30, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 0, "FlowSequenceCount_00e3d061-1e6e-42ae-8585-73ffa25c2243");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)");
        rt.DeclareVar("int", 0, "FlowSequenceCount_70dfdacb-3908-4f39-88cf-51ca722c5754");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_isRandom \"yes\" uses default configuration (in order)");
        rt.DeclareVar("bool", false, "FlowTrigger_fabf81e4-f41c-49ee-896c-05e0f948a7a4");
        rt.DeclareVar("bool", false, "FlowTrigger_cb1a4da7-dd9f-497e-99d8-0c003e9adf0d");
        rt.DeclareVar("bool", false, "FlowTrigger_bbb368cd-759a-4962-a85f-fa4f39798b91");
        rt.DeclareVar("bool", false, "FlowTrigger_02640624-2ae5-4514-833f-8e1da52f49a5");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Random (Check if all out flows are triggered once)");
        rt.DeclareVar("bool", false, "FlowTrigger_f245bad9-9eb7-4cbd-81d7-54d6d997bd4c");
        rt.DeclareVar("bool", false, "FlowTrigger_b55a8dcb-98bd-4eb6-af81-1d6262dca1df");
        rt.DeclareVar("bool", false, "FlowTrigger_8e7b8f6a-e2c3-484f-b86f-6ad8859c05f7");
        rt.DeclareVar("bool", false, "FlowTrigger_83f90829-64c3-4720-b88f-8781f3fbb60e");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Loop");
        rt.DeclareVar("int", 0, "18f3cfd3-47c6-4a0b-b403-80b897bea0b4");
        rt.DeclareVar("bool", false, "FlowTrigger_d685c2d7-92cb-48cf-a155-7e2f80df5ba5");
        rt.DeclareVar("bool", false, "FlowTrigger_5aab630a-967a-4a34-b13c-7002bc38358d");
        rt.DeclareVar("bool", false, "FlowTrigger_da7cea26-162c-4bce-9adf-bece75dced77");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Reset Loop");
        rt.DeclareVar("int", 0, "25e7ec66-c341-4c71-9dd2-27bd33f6d77a");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/multiGate_[lastIndex] -1 before activation");
        rt.DeclareVar("int", -1, "TestResult_flow/multiGate_[lastIndex] -1 before activation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/multiGate_[lastIndex] 1 after two activations");
        rt.DeclareVar("int", -1, "TestResult_flow/multiGate_[lastIndex] 1 after two activations");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/multiGate_[lastIndex] stays 2 when all outputs are used");
        rt.DeclareVar("int", -1, "TestResult_flow/multiGate_[lastIndex] stays 2 when all outputs are used");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/multiGate_[lastIndex] -1 after [reset]");
        rt.DeclareVar("int", -1, "TestResult_flow/multiGate_[lastIndex] -1 after [reset]");
        rt.DeclareVar("int", 0, "8e0cbf66-7cf5-4332-88e5-f9f8c3e7de0f");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_flow/multiGate_No loop: 4th [in] fires nothing (3x total)");
        rt.DeclareVar("int", -1, "TestResult_flow/multiGate_No loop: 4th [in] fires nothing (3x total)");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var gate1 = new MultiGateState();
        var gate2 = new MultiGateState();
        var gate3 = new MultiGateState();
        var gate4 = new MultiGateState();
        var gate5 = new MultiGateState();
        var gate6 = new MultiGateState();
        void proc11()
        {
            switch (rt.MultiGate(gate1, 3, false, false))
            {
                case 0:
                {
                    V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = unchecked(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 + 1);
                    if (!(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 == 1))
                    {
                        rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001");
                        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000;
                    }
                    break;
                }
                case 1:
                {
                    V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = unchecked(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 + 1);
                    if (!(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 == 2))
                    {
                        rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004");
                        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000;
                    }
                    break;
                }
                case 2:
                {
                    V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = unchecked(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 + 1);
                    if (V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 == 3)
                    {
                        if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            rt.Log("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered");
                            V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = true;
                        }
                    }
                    else
                    {
                        rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008");
                        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000;
                    }
                    break;
                }
            }
        }
        void proc38()
        {
            switch (rt.MultiGate(gate2, 3, false, false))
            {
                case 0:
                {
                    V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = unchecked(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 + 1);
                    if (!(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 == 1))
                    {
                        rt.Log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 001");
                        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000;
                    }
                    break;
                }
                case 1:
                {
                    V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = unchecked(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 + 1);
                    if (!(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 == 2))
                    {
                        rt.Log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 002");
                        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000;
                    }
                    break;
                }
                case 2:
                {
                    V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = unchecked(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 + 1);
                    if (V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 == 3)
                    {
                        if (rt.PtrSet("/nodes/29/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                        {
                            rt.Log("<flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Correct flow order triggered");
                            V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ = true;
                        }
                    }
                    else
                    {
                        rt.Log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 003");
                        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000;
                    }
                    break;
                }
            }
        }
        void proc85()
        {
            switch (rt.MultiGate(gate3, 4, true, false))
            {
                case 0:
                {
                    V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 = true;
                    proc90();
                    break;
                }
                case 1:
                {
                    V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d = true;
                    proc90();
                    break;
                }
                case 2:
                {
                    V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 = true;
                    proc90();
                    break;
                }
                case 3:
                {
                    V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 = true;
                    proc90();
                    break;
                }
            }
        }
        void proc90()
        {
            if (V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 && (V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 && (V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d && (V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 && true))))
            {
                if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)");
                    V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true;
                }
            }
        }
        void proc112()
        {
            switch (rt.MultiGate(gate4, 3, false, true))
            {
                case 0:
                {
                    V.counter1 = unchecked(V.counter1 + 1);
                    if (2 == V.counter1)
                    {
                        V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e = true;
                        proc129();
                    }
                    else
                    {
                        V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c = true;
                        proc129();
                    }
                    break;
                }
                case 1:
                {
                    V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df = true;
                    proc129();
                    break;
                }
                case 2:
                {
                    V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 = true;
                    proc129();
                    break;
                }
            }
        }
        void proc129()
        {
            if (V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e && (V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 && (V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df && (V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c && true))))
            {
                if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - Loop>: All Flows triggered (Number: 4)");
                    V.TestResult_flow_multiGate_Loop = true;
                }
            }
        }
        void proc143()
        {
            switch (rt.MultiGate(gate5, 3, false, true))
            {
                case 0:
                {
                    V.counter2 = unchecked(V.counter2 + 1);
                    if (2 == V.counter2)
                    {
                        V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 = true;
                        proc158();
                    }
                    else
                    {
                        V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 = true;
                        proc158();
                    }
                    break;
                }
                case 1:
                {
                    V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d = true;
                    proc158();
                    break;
                }
                case 2:
                {
                    break;
                }
            }
        }
        void proc158()
        {
            if (V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 && (V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d && (V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 && true)))
            {
                if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)");
                    V.TestResult_flow_multiGate_Reset_Loop = true;
                }
            }
        }
        void proc184()
        {
            rt.Log("<flow/multiGate - [lastIndex] -1 before activation>: Value is {0}, should be {1} ", new object[] { (int)gate6.LastIndex, -1 });
            V.TestResult_flow_multiGate__lastIndex___1_before_activation = (int)gate6.LastIndex;
        }
        void proc178()
        {
            switch (rt.MultiGate(gate6, 3, false, false))
            {
                case 0:
                {
                    proc209();
                    break;
                }
                case 1:
                {
                    proc209();
                    break;
                }
                case 2:
                {
                    proc209();
                    break;
                }
            }
        }
        void proc209()
        {
            V.counter3 = unchecked(V.counter3 + 1);
        }
        void proc191()
        {
            rt.Log("<flow/multiGate - [lastIndex] 1 after two activations>: Value is {0}, should be {1} ", new object[] { (int)gate6.LastIndex, 1 });
            V.TestResult_flow_multiGate__lastIndex__1_after_two_activations = (int)gate6.LastIndex;
        }
        void proc198()
        {
            rt.Log("<flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Value is {0}, should be {1} ", new object[] { (int)gate6.LastIndex, 2 });
            V.TestResult_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used = (int)gate6.LastIndex;
        }
        void proc205()
        {
            rt.Log("<flow/multiGate - [lastIndex] -1 after [reset]>: Value is {0}, should be {1} ", new object[] { (int)gate6.LastIndex, -1 });
            V.TestResult_flow_multiGate__lastIndex___1_after__reset_ = (int)gate6.LastIndex;
        }
        void OnStart0()
        {
            proc11();
            proc11();
            proc11();
            if (!V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_)
            {
                rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            proc38();
            proc38();
            proc38();
            if (!V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_)
            {
                rt.Log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Correct flow order not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            proc85();
            proc85();
            proc85();
            proc85();
            if (!V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_)
            {
                rt.Log("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!");
                rt.Log("   State 0 {0}", new object[] { V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 });
                rt.Log("   State 1 {0}", new object[] { V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d });
                rt.Log("   State 2 {0}", new object[] { V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 });
                rt.Log("   State 3 {0}", new object[] { V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 });
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            proc112();
            proc112();
            proc112();
            proc112();
            if (!V.TestResult_flow_multiGate_Loop)
            {
                rt.Log("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!");
                rt.Log("   State 0 Flow0:  {0}", new object[] { V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c });
                rt.Log("   State 1 Flow1:  {0}", new object[] { V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df });
                rt.Log("   State 2 Flow2:  {0}", new object[] { V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 });
                rt.Log("   State 3 Flow0 (2.):  {0}", new object[] { V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e });
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            proc143();
            proc143();
            gate5.Used = System.Array.Empty<bool>();
            gate5.LastIndex = -1.0;
            proc143();
            if (!V.TestResult_flow_multiGate_Reset_Loop)
            {
                rt.Log("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!");
                rt.Log("   State 0 {0}", new object[] { V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 });
                rt.Log("   State 1 {0}", new object[] { V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d });
                rt.Log("   State 2 {0}", new object[] { V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 });
            }
        }
        rt.OnStart(OnStart4);
        void OnStart5()
        {
            if ((int)gate6.LastIndex == -1)
            {
                if (rt.PtrSet("/nodes/41/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation = (int)gate6.LastIndex == -1;
                    rt.Log("<flow/multiGate - [lastIndex] -1 before activation>: Test Successful");
                    proc184();
                }
            }
            else
            {
                proc184();
            }
            proc178();
            proc178();
            if ((int)gate6.LastIndex == 1)
            {
                if (rt.PtrSet("/nodes/47/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations = (int)gate6.LastIndex == 1;
                    rt.Log("<flow/multiGate - [lastIndex] 1 after two activations>: Test Successful");
                    proc191();
                }
            }
            else
            {
                proc191();
            }
            proc178();
            proc178();
            if ((int)gate6.LastIndex == 2)
            {
                if (rt.PtrSet("/nodes/53/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used = (int)gate6.LastIndex == 2;
                    rt.Log("<flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Test Successful");
                    proc198();
                }
            }
            else
            {
                proc198();
            }
            gate6.Used = System.Array.Empty<bool>();
            gate6.LastIndex = -1.0;
            if ((int)gate6.LastIndex == -1)
            {
                if (rt.PtrSet("/nodes/59/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_ = (int)gate6.LastIndex == -1;
                    rt.Log("<flow/multiGate - [lastIndex] -1 after [reset]>: Test Successful");
                    proc205();
                }
            }
            else
            {
                proc205();
            }
            if (!V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation)
            {
                rt.Log("ERROR! <flow/multiGate - [lastIndex] -1 before activation>: Test Failed");
            }
            if (!V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations)
            {
                rt.Log("ERROR! <flow/multiGate - [lastIndex] 1 after two activations>: Test Failed");
            }
            if (!V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used)
            {
                rt.Log("ERROR! <flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Test Failed");
            }
            if (!V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_)
            {
                rt.Log("ERROR! <flow/multiGate - [lastIndex] -1 after [reset]>: Test Failed");
            }
            V.TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ = V.counter3 == 3;
            if (V.counter3 == 3)
            {
                if (rt.PtrSet("/nodes/35/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - No loop: 4th [in] fires nothing (3x total)>: Flow got triggered correct amount");
                    V.TestResult_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ = V.counter3;
                }
            }
            else
            {
                rt.Log("ERROR! <flow/multiGate - No loop: 4th [in] fires nothing (3x total)>: Flow got triggered {0} times from 3. This should not happened!", new object[] { V.counter3 });
            }
        }
        rt.OnStart(OnStart5);
        void OnStart6()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_flow_multiGate_Loop && V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ && V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ && V.TestResult_flow_multiGate_Reset_Loop && V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ && V.TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ && V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation && V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations && V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used && V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_)
            {
                rt.Send(Events.test_onSuccess);
            }
            else
            {
                rt.Send(Events.test_onFailed);
            }
        }
        rt.OnStart(OnStart6);
    }
}
