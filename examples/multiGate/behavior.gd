extends RefCounted

var m
var rt
var V
var E
var gate1
var gate2
var gate3
var gate4

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407", rt.int_var(0), "FlowSequenceCount_4d6b2ece-854e-472a-9d32-d729ba95f407"], ["TestResult_flow_multiGate_Order__008__004__001_____001__004__008_", rt.bool_var(false), "TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)"], ["FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2", rt.bool_var(false), "FlowTrigger_0ec4af14-ea93-46ce-a5df-16695404c8c2"], ["FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042", rt.bool_var(false), "FlowTrigger_e50be4f0-c137-4700-8e07-8d76acae1042"], ["FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a", rt.bool_var(false), "FlowTrigger_214d4c1f-d9df-4042-9dfe-90f62dbadc6a"], ["FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d", rt.bool_var(false), "FlowTrigger_64736706-47da-49a6-9ca3-7d3fc77ace9d"], ["TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_", rt.bool_var(false), "TestResult_flow/multiGate_Random (Check if all out flows are triggered once)"], ["FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2", rt.bool_var(false), "FlowTrigger_4c420572-b7d8-474c-a58d-921b377c23d2"], ["FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0", rt.bool_var(false), "FlowTrigger_d3646c48-544d-4c39-9110-2290be5657b0"], ["FlowTrigger_297e5062_e703_428c_900c_4402a65231c8", rt.bool_var(false), "FlowTrigger_297e5062-e703-428c-900c-4402a65231c8"], ["FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219", rt.bool_var(false), "FlowTrigger_38d0d0c7-12a7-4c24-b82d-b4854f458219"], ["TestResult_flow_multiGate_Loop", rt.bool_var(false), "TestResult_flow/multiGate_Loop"], ["counter1", rt.int_var(0), "fc8156be-fcdf-4726-a2ee-dbee68f9fad2"], ["FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f", rt.bool_var(false), "FlowTrigger_91501428-bbec-4faa-adae-49be2fe8505f"], ["FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05", rt.bool_var(false), "FlowTrigger_8ec17845-2ef2-4ce8-ad0c-a390ed07fd05"], ["FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1", rt.bool_var(false), "FlowTrigger_791b5d4b-dece-46a5-9a82-2dd77c35d2a1"], ["TestResult_flow_multiGate_Reset_Loop", rt.bool_var(false), "TestResult_flow/multiGate_Reset Loop"], ["counter2", rt.int_var(0), "bdad9aec-b708-4dae-9ffb-a66e18aab67d"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    gate1 = rt.multi_gate_state()
    gate2 = rt.multi_gate_state()
    gate3 = rt.multi_gate_state()
    gate4 = rt.multi_gate_state()
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)

func proc1() -> void:
    var ok1 = rt.multi_gate(gate1, 3, false, false)
    if ok1["index"] == 0:
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1)
        if not m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1):
            rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001")
            V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000
    elif ok1["index"] == 1:
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1)
        if not m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 2):
            rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004")
            V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000
    elif ok1["index"] == 2:
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1)
        if m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 3):
            if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered")
                V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = true
        else:
            rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008")
            V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000

func proc28() -> void:
    var ok1 = rt.multi_gate(gate2, 4, true, false)
    if ok1["index"] == 0:
        V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 = true
        proc39()
    elif ok1["index"] == 1:
        V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 = true
        proc39()
    elif ok1["index"] == 2:
        V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a = true
        proc39()
    elif ok1["index"] == 3:
        V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d = true
        proc39()

func proc39() -> void:
    if V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d and (V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a and (V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 and (V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 and true))):
        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)")
            V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true

func proc56() -> void:
    var ok1 = rt.multi_gate(gate3, 3, false, true)
    if ok1["index"] == 0:
        V.counter1 = m.addInt(V.counter1, 1)
        if m.eqInt(2, V.counter1):
            V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 = true
            proc67()
        else:
            V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 = true
            proc67()
    elif ok1["index"] == 1:
        V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 = true
        proc67()
    elif ok1["index"] == 2:
        V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 = true
        proc67()

func proc67() -> void:
    if V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 and (V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 and (V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 and (V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 and true))):
        if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - Loop>: All Flows triggered (Number: 4)")
            V.TestResult_flow_multiGate_Loop = true

func proc97() -> void:
    var ok1 = rt.multi_gate(gate4, 3, false, true)
    if ok1["index"] == 0:
        V.counter2 = m.addInt(V.counter2, 1)
        if m.eqInt(2, V.counter2):
            V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 = true
            proc106()
        else:
            V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f = true
            proc106()
    elif ok1["index"] == 1:
        V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 = true
        proc106()
    elif ok1["index"] == 2:
        pass

func proc106() -> void:
    if V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 and (V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 and (V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f and true)):
        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)")
            V.TestResult_flow_multiGate_Reset_Loop = true

func __on_start_0() -> void:
    proc1()
    proc1()
    proc1()
    if not V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_:
        rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!")

func __on_start_1() -> void:
    proc28()
    proc28()
    proc28()
    proc28()
    if not V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_:
        rt.log_msg("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!")
        rt.log_msg("   State 0 {0}", [V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2])
        rt.log_msg("   State 1 {0}", [V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042])
        rt.log_msg("   State 2 {0}", [V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a])
        rt.log_msg("   State 3 {0}", [V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d])

func __on_start_2() -> void:
    proc56()
    proc56()
    proc56()
    proc56()
    if not V.TestResult_flow_multiGate_Loop:
        rt.log_msg("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!")
        rt.log_msg("   State 0 Flow0:  {0}", [V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2])
        rt.log_msg("   State 1 Flow1:  {0}", [V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0])
        rt.log_msg("   State 2 Flow2:  {0}", [V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8])
        rt.log_msg("   State 3 Flow0 (2.):  {0}", [V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219])

func __on_start_3() -> void:
    proc97()
    proc97()
    gate4["used"] = []
    gate4["lastIndex"] = -1.0
    proc97()
    if not V.TestResult_flow_multiGate_Reset_Loop:
        rt.log_msg("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!")
        rt.log_msg("   State 0 {0}", [V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f])
        rt.log_msg("   State 1 {0}", [V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05])
        rt.log_msg("   State 2 {0}", [V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1])

func __on_start_4() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_flow_multiGate_Loop and V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ and V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ and V.TestResult_flow_multiGate_Reset_Loop:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

