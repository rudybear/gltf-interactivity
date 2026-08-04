import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407": rt.with_id("FlowSequenceCount_4d6b2ece-854e-472a-9d32-d729ba95f407", rt.int_(0)), "TestResult_flow_multiGate_Order__008__004__001_____001__004__008_": rt.with_id("TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)", rt.bool_(False)), "FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2": rt.with_id("FlowTrigger_0ec4af14-ea93-46ce-a5df-16695404c8c2", rt.bool_(False)), "FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042": rt.with_id("FlowTrigger_e50be4f0-c137-4700-8e07-8d76acae1042", rt.bool_(False)), "FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a": rt.with_id("FlowTrigger_214d4c1f-d9df-4042-9dfe-90f62dbadc6a", rt.bool_(False)), "FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d": rt.with_id("FlowTrigger_64736706-47da-49a6-9ca3-7d3fc77ace9d", rt.bool_(False)), "TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_": rt.with_id("TestResult_flow/multiGate_Random (Check if all out flows are triggered once)", rt.bool_(False)), "FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2": rt.with_id("FlowTrigger_4c420572-b7d8-474c-a58d-921b377c23d2", rt.bool_(False)), "FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0": rt.with_id("FlowTrigger_d3646c48-544d-4c39-9110-2290be5657b0", rt.bool_(False)), "FlowTrigger_297e5062_e703_428c_900c_4402a65231c8": rt.with_id("FlowTrigger_297e5062-e703-428c-900c-4402a65231c8", rt.bool_(False)), "FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219": rt.with_id("FlowTrigger_38d0d0c7-12a7-4c24-b82d-b4854f458219", rt.bool_(False)), "TestResult_flow_multiGate_Loop": rt.with_id("TestResult_flow/multiGate_Loop", rt.bool_(False)), "counter1": rt.with_id("fc8156be-fcdf-4726-a2ee-dbee68f9fad2", rt.int_(0)), "FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f": rt.with_id("FlowTrigger_91501428-bbec-4faa-adae-49be2fe8505f", rt.bool_(False)), "FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05": rt.with_id("FlowTrigger_8ec17845-2ef2-4ce8-ad0c-a390ed07fd05", rt.bool_(False)), "FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1": rt.with_id("FlowTrigger_791b5d4b-dece-46a5-9a82-2dd77c35d2a1", rt.bool_(False)), "TestResult_flow_multiGate_Reset_Loop": rt.with_id("TestResult_flow/multiGate_Reset Loop", rt.bool_(False)), "counter2": rt.with_id("bdad9aec-b708-4dae-9ffb-a66e18aab67d", rt.int_(0))})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 0.0}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.gate1 = rt.multi_gate_state()
    S.gate2 = rt.multi_gate_state()
    S.gate3 = rt.multi_gate_state()
    S.gate4 = rt.multi_gate_state()
    def proc1() -> None:
        ok1 = rt.multi_gate(S.gate1, 3, False, False)
        if ok1["index"] == 0:
            V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1)
            if not m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1):
                rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001")
                V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000
        elif ok1["index"] == 1:
            V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1)
            if not m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 2):
                rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004")
                V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000
        elif ok1["index"] == 2:
            V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1)
            if m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 3):
                if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                    rt.log("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered")
                    V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = True
            else:
                rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008")
                V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000
    def proc28() -> None:
        ok1 = rt.multi_gate(S.gate2, 4, True, False)
        if ok1["index"] == 0:
            V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 = True
            proc39()
        elif ok1["index"] == 1:
            V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 = True
            proc39()
        elif ok1["index"] == 2:
            V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a = True
            proc39()
        elif ok1["index"] == 3:
            V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d = True
            proc39()
    def proc39() -> None:
        if V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d and (V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a and (V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 and (V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 and True))):
            if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)")
                V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = True
    def proc56() -> None:
        ok1 = rt.multi_gate(S.gate3, 3, False, True)
        if ok1["index"] == 0:
            V.counter1 = m.addInt(V.counter1, 1)
            if m.eqInt(2, V.counter1):
                V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 = True
                proc67()
            else:
                V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 = True
                proc67()
        elif ok1["index"] == 1:
            V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 = True
            proc67()
        elif ok1["index"] == 2:
            V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 = True
            proc67()
    def proc67() -> None:
        if V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 and (V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 and (V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 and (V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 and True))):
            if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/multiGate - Loop>: All Flows triggered (Number: 4)")
                V.TestResult_flow_multiGate_Loop = True
    def proc97() -> None:
        ok1 = rt.multi_gate(S.gate4, 3, False, True)
        if ok1["index"] == 0:
            V.counter2 = m.addInt(V.counter2, 1)
            if m.eqInt(2, V.counter2):
                V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 = True
                proc106()
            else:
                V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f = True
                proc106()
        elif ok1["index"] == 1:
            V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 = True
            proc106()
        elif ok1["index"] == 2:
            pass
    def proc106() -> None:
        if V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 and (V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 and (V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f and True)):
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)")
                V.TestResult_flow_multiGate_Reset_Loop = True
    def __on_start_0() -> None:
        proc1()
        proc1()
        proc1()
        if not V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_:
            rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!")
    rt.on_start(__on_start_0)
    def __on_start_1() -> None:
        proc28()
        proc28()
        proc28()
        proc28()
        if not V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_:
            rt.log("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!")
            rt.log("   State 0 {0}", [V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2])
            rt.log("   State 1 {0}", [V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042])
            rt.log("   State 2 {0}", [V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a])
            rt.log("   State 3 {0}", [V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d])
    rt.on_start(__on_start_1)
    def __on_start_2() -> None:
        proc56()
        proc56()
        proc56()
        proc56()
        if not V.TestResult_flow_multiGate_Loop:
            rt.log("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!")
            rt.log("   State 0 Flow0:  {0}", [V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2])
            rt.log("   State 1 Flow1:  {0}", [V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0])
            rt.log("   State 2 Flow2:  {0}", [V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8])
            rt.log("   State 3 Flow0 (2.):  {0}", [V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219])
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        proc97()
        proc97()
        S.gate4["used"] = []
        S.gate4["lastIndex"] = -1.0
        proc97()
        if not V.TestResult_flow_multiGate_Reset_Loop:
            rt.log("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!")
            rt.log("   State 0 {0}", [V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f])
            rt.log("   State 1 {0}", [V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05])
            rt.log("   State 2 {0}", [V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1])
    rt.on_start(__on_start_3)
    def __on_start_4() -> None:
        rt.send(E["test_onStart"])
        if V.TestResult_flow_multiGate_Loop and V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ and V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ and V.TestResult_flow_multiGate_Reset_Loop:
            rt.send(E["test_onSuccess"])
        else:
            rt.send(E["test_onFailed"])
    rt.on_start(__on_start_4)
