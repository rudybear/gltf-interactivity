extends RefCounted

var m
var rt
var V
var E
var delay1
var delay2
var delay3
var delay4
var delay5
var delay6
var delay7
var delay8
var delay9
var delay10
var delay11
var delay12
var delay13
var delay14
var delay15
var delay16
var delay17
var delay18
var delay19
var delay20
var delay21
var delay22
var delay23

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6", rt.float_var(0.0), "startTime_ca9af277-a001-44a7-bbd2-b3e9d2eafea6"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__done_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Flow [done]"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", rt.float_var(-0.0142), "TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay"], ["counter1", rt.int_var(0), "d90d4f49-c9e3-4a3e-9f10-06247568422b"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__out_", rt.int_var(-1), "TestResult_flow/setDelay and cancelDelay_Flow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_", rt.bool_var(true), "TestResult_flow/setDelay and cancelDelay_setDelay [cancel]"], ["TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered", rt.bool_var(true), "TestResult_flow/setDelay and cancelDelay_cancelDelay triggered"], ["TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__err_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Flow [err]"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid"], ["TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Flow [err]\n(NaN)"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Flow [err]\n(+Inf)"], ["FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362", rt.int_var(0), "FlowSequenceCount_b8e69ef5-14a6-4dbe-b4e1-3335901db362"], ["TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Concurrent delays\n[done] in time order"], ["counter2", rt.int_var(0), "c3ceb65a-83b0-4b71-9344-d81263979ab7"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x"], ["TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x", rt.int_var(-1), "TestResult_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null"], ["TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null"], ["TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays", rt.bool_var(true), "TestResult_flow/setDelay and cancelDelay_[cancel] cancels all\npending delays"], ["TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_cancelDelay null ref\nFlow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_cancelDelay fired ref\nFlow [out]"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 2.5}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    delay1 = rt.delay_state()
    delay2 = rt.delay_state()
    delay3 = rt.delay_state()
    delay4 = rt.delay_state()
    delay5 = rt.delay_state()
    delay6 = rt.delay_state()
    delay7 = rt.delay_state()
    delay8 = rt.delay_state()
    delay9 = rt.delay_state()
    delay10 = rt.delay_state()
    delay11 = rt.delay_state()
    delay12 = rt.delay_state()
    delay13 = rt.delay_state()
    delay14 = rt.delay_state()
    delay15 = rt.delay_state()
    delay16 = rt.delay_state()
    delay17 = rt.delay_state()
    delay18 = rt.delay_state()
    delay19 = rt.delay_state()
    delay20 = rt.delay_state()
    delay21 = rt.delay_state()
    delay22 = rt.delay_state()
    delay23 = rt.delay_state()
    rt.on_start(__on_start_0)
    rt.on_tick(__on_tick_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)
    rt.on_start(__on_start_6)
    rt.on_start(__on_start_7)
    rt.on_start(__on_start_8)
    rt.on_start(__on_start_9)
    rt.on_start(__on_start_10)
    rt.on_start(__on_start_11)
    rt.on_start(__on_start_12)
    rt.on_start(__on_start_13)

func proc45() -> void:
    var t1 = rt.tick_time()
    rt.log_msg("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0.1)", [m.select(m.isNaN(t1), 0.0, t1) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6, 1.0])
    var t2 = rt.tick_time()
    V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6

func proc131() -> void:
    rt.log_msg("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"], true])
    V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"]

func proc182() -> void:
    rt.set_delay(delay17, 0.3, cont1)

func cont1() -> void:
    V.counter2 = m.addInt(V.counter2, 1)

func proc197() -> void:
    rt.set_delay(delay19, 0.3, cont2)

func cont2() -> void:
    if rt.ptr_set("/nodes/76/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/78/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays = false

func proc204() -> void:
    rt.log_msg("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Value is {0}, should be {1} ", [m.refEq(delay19["lastRef"], ""), true])
    V.TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(delay19["lastRef"], "")

func __on_start_0() -> void:
    if rt.set_delay(delay2, 2.0, cont3)["ok"]:
        var t1 = rt.tick_time()
        V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 = m.select(m.isNaN(t1), 0.0, t1)
        if rt.set_delay(delay1, 1.0, cont4)["ok"]:
            V.counter1 = m.addInt(V.counter1, 1)

func cont3() -> void:
    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [done]>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Failed")
    if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ = m.eqInt(V.counter1, 1)
        if m.eqInt(V.counter1, 1):
            if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
                    rt.log_msg("<flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered correct amount")
                    V.TestResult_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1
        else:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered {0} times from 1. This should not happened!", [V.counter1])

func cont4() -> void:
    if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true
    if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
        var t2 = rt.tick_time()
        if m.abs_(m.select(m.isNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1:
            if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                    var t3 = rt.tick_time()
                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs_(m.select(m.isNaN(t3), 0.0, t3) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1
                    rt.log_msg("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful")
                    proc45()
        else:
            proc45()

func __on_tick_1(time_since_start: float, time_since_last_tick: float) -> void:
    pass

func __on_start_2() -> void:
    if rt.set_delay(delay4, 2.0, cont5)["ok"]:
        rt.set_delay(delay3, 1.0, cont6)
        rt.cancel_delay_slot(delay3)

func cont5() -> void:
    if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_:
            rt.log_msg("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful")

func cont6() -> void:
    if rt.ptr_set("/nodes/28/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false

func __on_start_3() -> void:
    if rt.set_delay(delay6, 2.0, cont7)["ok"]:
        rt.set_delay(delay5, 1.0, cont8)
        rt.cancel_delay(delay5["lastRef"])
        if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ = true

func cont7() -> void:
    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered:
            rt.log_msg("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful")
    if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!")

func cont8() -> void:
    if rt.ptr_set("/nodes/34/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false

func __on_start_4() -> void:
    if rt.set_delay(delay8, 2.0, cont9)["ok"]:
        if not rt.set_delay(delay7, -1.0, Callable())["ok"]:
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<flow/setDelay and cancelDelay - Flow [err]>: Flow triggered")
                V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ = true

func cont9() -> void:
    if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [err]>: Flow not triggered! This should not happened!")

func __on_start_5() -> void:
    if rt.set_delay(delay10, 0.5, cont10)["ok"]:
        if rt.set_delay(delay9, 2.0, Callable())["ok"]:
            if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                if rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"] == true:
                    if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                        if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"] == true
                            rt.log_msg("<flow/setDelay and cancelDelay - lastDelayref isValid>: Test Successful")
                            proc131()
                else:
                    proc131()

func cont10() -> void:
    if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - lastDelayref isValid>: Test Failed")

func __on_start_6() -> void:
    if not rt.set_delay(delay11, m.NaN(), Callable())["ok"]:
        if rt.ptr_set("/nodes/53/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ = true
    if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow not triggered! This should not happened!")

func __on_start_7() -> void:
    if not rt.set_delay(delay12, m.Inf(), Callable())["ok"]:
        if rt.ptr_set("/nodes/59/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ = true
    if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow not triggered! This should not happened!")

func __on_start_8() -> void:
    if rt.set_delay(delay16, 1.5, cont11)["ok"]:
        rt.set_delay(delay13, 0.6, cont12)
        rt.set_delay(delay14, 0.2, cont13)
        rt.set_delay(delay15, 0.4, cont14)

func cont11() -> void:
    if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order not triggered! This should not happened!")

func cont12() -> void:
    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1)
    if m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 3):
        if rt.ptr_set("/nodes/65/translation", "float3", [0.0, 0.0, 0.8]):
            if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                rt.log_msg("<flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order triggered")
                V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order = true
    else:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000

func cont13() -> void:
    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1)
    if not m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1):
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000

func cont14() -> void:
    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1)
    if not m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 2):
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000

func __on_start_9() -> void:
    if rt.set_delay(delay18, 1.0, cont15)["ok"]:
        proc182()
        proc182()
        proc182()

func cont15() -> void:
    if rt.ptr_set("/nodes/72/translation", "float3", [0.0, 0.0, 0.0]):
        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = m.eqInt(V.counter2, 3)
        if m.eqInt(V.counter2, 3):
            if rt.ptr_set("/nodes/71/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/72/translation", "float3", [0.0, 0.0, 0.0]):
                    rt.log_msg("<flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered correct amount")
                    V.TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2
        else:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered {0} times from 3. This should not happened!", [V.counter2])

func __on_start_10() -> void:
    if rt.set_delay(delay20, 1.0, cont16)["ok"]:
        proc197()
        proc197()
        proc197()
        rt.cancel_delay_slot(delay19)
        if m.refEq(delay19["lastRef"], "") == true:
            if rt.ptr_set("/nodes/83/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(delay19["lastRef"], "") == true
                rt.log_msg("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Successful")
                proc204()
        else:
            proc204()

func cont16() -> void:
    if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Failed")
    if rt.ptr_set("/nodes/78/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays:
            rt.log_msg("<flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Test Successful")

func __on_start_11() -> void:
    rt.cancel_delay("")
    if rt.ptr_set("/nodes/89/translation", "float3", [0.0, 0.0, 0.8]):
        rt.log_msg("<flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow triggered")
        V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ = true
    if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow not triggered! This should not happened!")

func __on_start_12() -> void:
    if rt.set_delay(delay22, 1.0, cont17)["ok"]:
        rt.set_delay(delay21, 0.1, cont18)

func cont17() -> void:
    if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow not triggered! This should not happened!")

func cont18() -> void:
    rt.cancel_delay(delay21["lastRef"])
    if rt.ptr_set("/nodes/95/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ = true

func __on_start_13() -> void:
    rt.send(E["test_onStart"])
    rt.set_delay(delay23, 2.5, cont19)

func cont19() -> void:
    if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ and V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ and V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x and V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

