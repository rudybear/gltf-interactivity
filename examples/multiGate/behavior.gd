extends RefCounted

var m
var rt
var V
var E
var gate1
var gate2
var gate3
var gate4
var gate5
var gate6

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243", rt.int_var(0), "FlowSequenceCount_00e3d061-1e6e-42ae-8585-73ffa25c2243"], ["TestResult_flow_multiGate_Order__008__004__001_____001__004__008_", rt.bool_var(false), "TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)"], ["FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754", rt.int_var(0), "FlowSequenceCount_70dfdacb-3908-4f39-88cf-51ca722c5754"], ["TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_", rt.bool_var(false), "TestResult_flow/multiGate_isRandom \"yes\" uses default configuration (in order)"], ["FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4", rt.bool_var(false), "FlowTrigger_fabf81e4-f41c-49ee-896c-05e0f948a7a4"], ["FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d", rt.bool_var(false), "FlowTrigger_cb1a4da7-dd9f-497e-99d8-0c003e9adf0d"], ["FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91", rt.bool_var(false), "FlowTrigger_bbb368cd-759a-4962-a85f-fa4f39798b91"], ["FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5", rt.bool_var(false), "FlowTrigger_02640624-2ae5-4514-833f-8e1da52f49a5"], ["TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_", rt.bool_var(false), "TestResult_flow/multiGate_Random (Check if all out flows are triggered once)"], ["FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c", rt.bool_var(false), "FlowTrigger_f245bad9-9eb7-4cbd-81d7-54d6d997bd4c"], ["FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df", rt.bool_var(false), "FlowTrigger_b55a8dcb-98bd-4eb6-af81-1d6262dca1df"], ["FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7", rt.bool_var(false), "FlowTrigger_8e7b8f6a-e2c3-484f-b86f-6ad8859c05f7"], ["FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e", rt.bool_var(false), "FlowTrigger_83f90829-64c3-4720-b88f-8781f3fbb60e"], ["TestResult_flow_multiGate_Loop", rt.bool_var(false), "TestResult_flow/multiGate_Loop"], ["counter1", rt.int_var(0), "18f3cfd3-47c6-4a0b-b403-80b897bea0b4"], ["FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5", rt.bool_var(false), "FlowTrigger_d685c2d7-92cb-48cf-a155-7e2f80df5ba5"], ["FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d", rt.bool_var(false), "FlowTrigger_5aab630a-967a-4a34-b13c-7002bc38358d"], ["FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77", rt.bool_var(false), "FlowTrigger_da7cea26-162c-4bce-9adf-bece75dced77"], ["TestResult_flow_multiGate_Reset_Loop", rt.bool_var(false), "TestResult_flow/multiGate_Reset Loop"], ["counter2", rt.int_var(0), "25e7ec66-c341-4c71-9dd2-27bd33f6d77a"], ["TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation", rt.bool_var(false), "TestResult_HasPassed_flow/multiGate_[lastIndex] -1 before activation"], ["TestResult_flow_multiGate__lastIndex___1_before_activation", rt.int_var(-1), "TestResult_flow/multiGate_[lastIndex] -1 before activation"], ["TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations", rt.bool_var(false), "TestResult_HasPassed_flow/multiGate_[lastIndex] 1 after two activations"], ["TestResult_flow_multiGate__lastIndex__1_after_two_activations", rt.int_var(-1), "TestResult_flow/multiGate_[lastIndex] 1 after two activations"], ["TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used", rt.bool_var(false), "TestResult_HasPassed_flow/multiGate_[lastIndex] stays 2 when all outputs are used"], ["TestResult_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used", rt.int_var(-1), "TestResult_flow/multiGate_[lastIndex] stays 2 when all outputs are used"], ["TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_", rt.bool_var(false), "TestResult_HasPassed_flow/multiGate_[lastIndex] -1 after [reset]"], ["TestResult_flow_multiGate__lastIndex___1_after__reset_", rt.int_var(-1), "TestResult_flow/multiGate_[lastIndex] -1 after [reset]"], ["counter3", rt.int_var(0), "8e0cbf66-7cf5-4332-88e5-f9f8c3e7de0f"], ["TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_", rt.bool_var(false), "TestResult_HasPassed_flow/multiGate_No loop: 4th [in] fires nothing (3x total)"], ["TestResult_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_", rt.int_var(-1), "TestResult_flow/multiGate_No loop: 4th [in] fires nothing (3x total)"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    gate1 = rt.multi_gate_state()
    gate2 = rt.multi_gate_state()
    gate3 = rt.multi_gate_state()
    gate4 = rt.multi_gate_state()
    gate5 = rt.multi_gate_state()
    gate6 = rt.multi_gate_state()
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)
    rt.on_start(__on_start_6)

func proc11() -> void:
    var ok1 = rt.multi_gate(gate1, 3, false, false)
    if ok1["index"] == 0:
        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = m.addInt(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243, 1)
        if not m.eqInt(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243, 1):
            rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001")
            V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000
    elif ok1["index"] == 1:
        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = m.addInt(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243, 1)
        if not m.eqInt(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243, 2):
            rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004")
            V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000
    elif ok1["index"] == 2:
        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = m.addInt(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243, 1)
        if m.eqInt(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243, 3):
            if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered")
                V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = true
        else:
            rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008")
            V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000

func proc38() -> void:
    var ok1 = rt.multi_gate(gate2, 3, false, false)
    if ok1["index"] == 0:
        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = m.addInt(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754, 1)
        if not m.eqInt(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754, 1):
            rt.log_msg("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 001")
            V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000
    elif ok1["index"] == 1:
        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = m.addInt(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754, 1)
        if not m.eqInt(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754, 2):
            rt.log_msg("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 002")
            V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000
    elif ok1["index"] == 2:
        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = m.addInt(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754, 1)
        if m.eqInt(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754, 3):
            if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Correct flow order triggered")
                V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ = true
        else:
            rt.log_msg("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 003")
            V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000

func proc85() -> void:
    var ok1 = rt.multi_gate(gate3, 4, true, false)
    if ok1["index"] == 0:
        V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 = true
        proc90()
    elif ok1["index"] == 1:
        V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d = true
        proc90()
    elif ok1["index"] == 2:
        V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 = true
        proc90()
    elif ok1["index"] == 3:
        V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 = true
        proc90()

func proc90() -> void:
    if V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 and (V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 and (V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d and (V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 and true))):
        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)")
            V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true

func proc112() -> void:
    var ok1 = rt.multi_gate(gate4, 3, false, true)
    if ok1["index"] == 0:
        V.counter1 = m.addInt(V.counter1, 1)
        if m.eqInt(2, V.counter1):
            V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e = true
            proc129()
        else:
            V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c = true
            proc129()
    elif ok1["index"] == 1:
        V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df = true
        proc129()
    elif ok1["index"] == 2:
        V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 = true
        proc129()

func proc129() -> void:
    if V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e and (V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 and (V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df and (V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c and true))):
        if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - Loop>: All Flows triggered (Number: 4)")
            V.TestResult_flow_multiGate_Loop = true

func proc143() -> void:
    var ok1 = rt.multi_gate(gate5, 3, false, true)
    if ok1["index"] == 0:
        V.counter2 = m.addInt(V.counter2, 1)
        if m.eqInt(2, V.counter2):
            V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 = true
            proc158()
        else:
            V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 = true
            proc158()
    elif ok1["index"] == 1:
        V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d = true
        proc158()
    elif ok1["index"] == 2:
        pass

func proc158() -> void:
    if V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 and (V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d and (V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 and true)):
        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)")
            V.TestResult_flow_multiGate_Reset_Loop = true

func proc184() -> void:
    rt.log_msg("<flow/multiGate - [lastIndex] -1 before activation>: Value is {0}, should be {1} ", [gate6["lastIndex"], -1])
    V.TestResult_flow_multiGate__lastIndex___1_before_activation = gate6["lastIndex"]

func proc178() -> void:
    var ok1 = rt.multi_gate(gate6, 3, false, false)
    if ok1["index"] == 0:
        proc209()
    elif ok1["index"] == 1:
        proc209()
    elif ok1["index"] == 2:
        proc209()

func proc209() -> void:
    V.counter3 = m.addInt(V.counter3, 1)

func proc191() -> void:
    rt.log_msg("<flow/multiGate - [lastIndex] 1 after two activations>: Value is {0}, should be {1} ", [gate6["lastIndex"], 1])
    V.TestResult_flow_multiGate__lastIndex__1_after_two_activations = gate6["lastIndex"]

func proc198() -> void:
    rt.log_msg("<flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Value is {0}, should be {1} ", [gate6["lastIndex"], 2])
    V.TestResult_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used = gate6["lastIndex"]

func proc205() -> void:
    rt.log_msg("<flow/multiGate - [lastIndex] -1 after [reset]>: Value is {0}, should be {1} ", [gate6["lastIndex"], -1])
    V.TestResult_flow_multiGate__lastIndex___1_after__reset_ = gate6["lastIndex"]

func __on_start_0() -> void:
    proc11()
    proc11()
    proc11()
    if not V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_:
        rt.log_msg("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!")

func __on_start_1() -> void:
    proc38()
    proc38()
    proc38()
    if not V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_:
        rt.log_msg("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Correct flow order not triggered! This should not happened!")

func __on_start_2() -> void:
    proc85()
    proc85()
    proc85()
    proc85()
    if not V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_:
        rt.log_msg("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!")
        rt.log_msg("   State 0 {0}", [V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4])
        rt.log_msg("   State 1 {0}", [V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d])
        rt.log_msg("   State 2 {0}", [V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91])
        rt.log_msg("   State 3 {0}", [V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5])

func __on_start_3() -> void:
    proc112()
    proc112()
    proc112()
    proc112()
    if not V.TestResult_flow_multiGate_Loop:
        rt.log_msg("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!")
        rt.log_msg("   State 0 Flow0:  {0}", [V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c])
        rt.log_msg("   State 1 Flow1:  {0}", [V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df])
        rt.log_msg("   State 2 Flow2:  {0}", [V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7])
        rt.log_msg("   State 3 Flow0 (2.):  {0}", [V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e])

func __on_start_4() -> void:
    proc143()
    proc143()
    gate5["used"] = []
    gate5["lastIndex"] = -1.0
    proc143()
    if not V.TestResult_flow_multiGate_Reset_Loop:
        rt.log_msg("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!")
        rt.log_msg("   State 0 {0}", [V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5])
        rt.log_msg("   State 1 {0}", [V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d])
        rt.log_msg("   State 2 {0}", [V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77])

func __on_start_5() -> void:
    if m.eqInt(gate6["lastIndex"], -1):
        if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation = m.eqInt(gate6["lastIndex"], -1)
            rt.log_msg("<flow/multiGate - [lastIndex] -1 before activation>: Test Successful")
            proc184()
    else:
        proc184()
    proc178()
    proc178()
    if m.eqInt(gate6["lastIndex"], 1):
        if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations = m.eqInt(gate6["lastIndex"], 1)
            rt.log_msg("<flow/multiGate - [lastIndex] 1 after two activations>: Test Successful")
            proc191()
    else:
        proc191()
    proc178()
    proc178()
    if m.eqInt(gate6["lastIndex"], 2):
        if rt.ptr_set("/nodes/53/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used = m.eqInt(gate6["lastIndex"], 2)
            rt.log_msg("<flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Test Successful")
            proc198()
    else:
        proc198()
    gate6["used"] = []
    gate6["lastIndex"] = -1.0
    if m.eqInt(gate6["lastIndex"], -1):
        if rt.ptr_set("/nodes/59/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_ = m.eqInt(gate6["lastIndex"], -1)
            rt.log_msg("<flow/multiGate - [lastIndex] -1 after [reset]>: Test Successful")
            proc205()
    else:
        proc205()
    if not V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation:
        rt.log_msg("ERROR! <flow/multiGate - [lastIndex] -1 before activation>: Test Failed")
    if not V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations:
        rt.log_msg("ERROR! <flow/multiGate - [lastIndex] 1 after two activations>: Test Failed")
    if not V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used:
        rt.log_msg("ERROR! <flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Test Failed")
    if not V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_:
        rt.log_msg("ERROR! <flow/multiGate - [lastIndex] -1 after [reset]>: Test Failed")
    V.TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ = m.eqInt(V.counter3, 3)
    if m.eqInt(V.counter3, 3):
        if rt.ptr_set("/nodes/35/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/multiGate - No loop: 4th [in] fires nothing (3x total)>: Flow got triggered correct amount")
            V.TestResult_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ = V.counter3
    else:
        rt.log_msg("ERROR! <flow/multiGate - No loop: 4th [in] fires nothing (3x total)>: Flow got triggered {0} times from 3. This should not happened!", [V.counter3])

func __on_start_6() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_flow_multiGate_Loop and V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ and V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ and V.TestResult_flow_multiGate_Reset_Loop and V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ and V.TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ and V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation and V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations and V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used and V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

