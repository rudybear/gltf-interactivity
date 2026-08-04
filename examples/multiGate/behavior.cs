using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public int FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 { get => E.GetVarInt(0); set => E.SetVarInt(0, value); }
        public bool TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public bool FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public bool FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 { get => E.GetVarBool(3); set => E.SetVarBool(3, value); }
        public bool FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public bool FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public bool TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ { get => E.GetVarBool(6); set => E.SetVarBool(6, value); }
        public bool FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public bool FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public bool FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 { get => E.GetVarBool(9); set => E.SetVarBool(9, value); }
        public bool FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public bool TestResult_flow_multiGate_Loop { get => E.GetVarBool(11); set => E.SetVarBool(11, value); }
        public int counter1 { get => E.GetVarInt(12); set => E.SetVarInt(12, value); }
        public bool FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f { get => E.GetVarBool(13); set => E.SetVarBool(13, value); }
        public bool FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
        public bool FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 { get => E.GetVarBool(15); set => E.SetVarBool(15, value); }
        public bool TestResult_flow_multiGate_Reset_Loop { get => E.GetVarBool(16); set => E.SetVarBool(16, value); }
        public int counter2 { get => E.GetVarInt(17); set => E.SetVarInt(17, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("int", 0, "FlowSequenceCount_4d6b2ece-854e-472a-9d32-d729ba95f407");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)");
        rt.DeclareVar("bool", false, "FlowTrigger_0ec4af14-ea93-46ce-a5df-16695404c8c2");
        rt.DeclareVar("bool", false, "FlowTrigger_e50be4f0-c137-4700-8e07-8d76acae1042");
        rt.DeclareVar("bool", false, "FlowTrigger_214d4c1f-d9df-4042-9dfe-90f62dbadc6a");
        rt.DeclareVar("bool", false, "FlowTrigger_64736706-47da-49a6-9ca3-7d3fc77ace9d");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Random (Check if all out flows are triggered once)");
        rt.DeclareVar("bool", false, "FlowTrigger_4c420572-b7d8-474c-a58d-921b377c23d2");
        rt.DeclareVar("bool", false, "FlowTrigger_d3646c48-544d-4c39-9110-2290be5657b0");
        rt.DeclareVar("bool", false, "FlowTrigger_297e5062-e703-428c-900c-4402a65231c8");
        rt.DeclareVar("bool", false, "FlowTrigger_38d0d0c7-12a7-4c24-b82d-b4854f458219");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Loop");
        rt.DeclareVar("int", 0, "fc8156be-fcdf-4726-a2ee-dbee68f9fad2");
        rt.DeclareVar("bool", false, "FlowTrigger_91501428-bbec-4faa-adae-49be2fe8505f");
        rt.DeclareVar("bool", false, "FlowTrigger_8ec17845-2ef2-4ce8-ad0c-a390ed07fd05");
        rt.DeclareVar("bool", false, "FlowTrigger_791b5d4b-dece-46a5-9a82-2dd77c35d2a1");
        rt.DeclareVar("bool", false, "TestResult_flow/multiGate_Reset Loop");
        rt.DeclareVar("int", 0, "bdad9aec-b708-4dae-9ffb-a66e18aab67d");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var gate1 = new MultiGateState();
        var gate2 = new MultiGateState();
        var gate3 = new MultiGateState();
        var gate4 = new MultiGateState();
        void proc1()
        {
            switch (rt.MultiGate(gate1, 3, false, false))
            {
                case 0:
                {
                    V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = unchecked(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 + 1);
                    if (!(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 == 1))
                    {
                        rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001");
                        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000;
                    }
                    break;
                }
                case 1:
                {
                    V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = unchecked(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 + 1);
                    if (!(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 == 2))
                    {
                        rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004");
                        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000;
                    }
                    break;
                }
                case 2:
                {
                    V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = unchecked(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 + 1);
                    if (V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 == 3)
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
                        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000;
                    }
                    break;
                }
            }
        }
        void proc28()
        {
            switch (rt.MultiGate(gate2, 4, true, false))
            {
                case 0:
                {
                    V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 = true;
                    proc39();
                    break;
                }
                case 1:
                {
                    V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 = true;
                    proc39();
                    break;
                }
                case 2:
                {
                    V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a = true;
                    proc39();
                    break;
                }
                case 3:
                {
                    V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d = true;
                    proc39();
                    break;
                }
            }
        }
        void proc39()
        {
            if (V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d && (V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a && (V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 && (V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 && true))))
            {
                if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)");
                    V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true;
                }
            }
        }
        void proc56()
        {
            switch (rt.MultiGate(gate3, 3, false, true))
            {
                case 0:
                {
                    V.counter1 = unchecked(V.counter1 + 1);
                    if (2 == V.counter1)
                    {
                        V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 = true;
                        proc67();
                    }
                    else
                    {
                        V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 = true;
                        proc67();
                    }
                    break;
                }
                case 1:
                {
                    V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 = true;
                    proc67();
                    break;
                }
                case 2:
                {
                    V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 = true;
                    proc67();
                    break;
                }
            }
        }
        void proc67()
        {
            if (V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 && (V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 && (V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 && (V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 && true))))
            {
                if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - Loop>: All Flows triggered (Number: 4)");
                    V.TestResult_flow_multiGate_Loop = true;
                }
            }
        }
        void proc97()
        {
            switch (rt.MultiGate(gate4, 3, false, true))
            {
                case 0:
                {
                    V.counter2 = unchecked(V.counter2 + 1);
                    if (2 == V.counter2)
                    {
                        V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 = true;
                        proc106();
                    }
                    else
                    {
                        V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f = true;
                        proc106();
                    }
                    break;
                }
                case 1:
                {
                    V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 = true;
                    proc106();
                    break;
                }
                case 2:
                {
                    break;
                }
            }
        }
        void proc106()
        {
            if (V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 && (V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 && (V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f && true)))
            {
                if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                {
                    rt.Log("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)");
                    V.TestResult_flow_multiGate_Reset_Loop = true;
                }
            }
        }
        void OnStart0()
        {
            proc1();
            proc1();
            proc1();
            if (!V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_)
            {
                rt.Log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!");
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            proc28();
            proc28();
            proc28();
            proc28();
            if (!V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_)
            {
                rt.Log("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!");
                rt.Log("   State 0 {0}", new object[] { V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 });
                rt.Log("   State 1 {0}", new object[] { V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 });
                rt.Log("   State 2 {0}", new object[] { V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a });
                rt.Log("   State 3 {0}", new object[] { V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d });
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            proc56();
            proc56();
            proc56();
            proc56();
            if (!V.TestResult_flow_multiGate_Loop)
            {
                rt.Log("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!");
                rt.Log("   State 0 Flow0:  {0}", new object[] { V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 });
                rt.Log("   State 1 Flow1:  {0}", new object[] { V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 });
                rt.Log("   State 2 Flow2:  {0}", new object[] { V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 });
                rt.Log("   State 3 Flow0 (2.):  {0}", new object[] { V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 });
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            proc97();
            proc97();
            gate4.Used = System.Array.Empty<bool>();
            gate4.LastIndex = -1.0;
            proc97();
            if (!V.TestResult_flow_multiGate_Reset_Loop)
            {
                rt.Log("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!");
                rt.Log("   State 0 {0}", new object[] { V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f });
                rt.Log("   State 1 {0}", new object[] { V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 });
                rt.Log("   State 2 {0}", new object[] { V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 });
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_flow_multiGate_Loop && V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ && V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ && V.TestResult_flow_multiGate_Reset_Loop)
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
