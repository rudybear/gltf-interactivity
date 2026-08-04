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

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa", rt.float_var(0.0), "startTime_d2ce0a9f-f380-4188-b9c2-b65f1fcb0caa"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__done_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Flow [done]"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", rt.float_var(-0.0142), "TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay"], ["counter1", rt.int_var(0), "7f97a35a-b8a7-4a57-88e6-76f9f19dfa4d"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__out_", rt.int_var(-1), "TestResult_flow/setDelay and cancelDelay_Flow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_setDelay [cancel]"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_", rt.bool_var(true), "TestResult_HasPassed_flow/setDelay and cancelDelay_setDelay [cancel]"], ["TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_cancelDelay triggered"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered", rt.bool_var(true), "TestResult_HasPassed_flow/setDelay and cancelDelay_cancelDelay triggered"], ["TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]"], ["TestResult_flow_setDelay_and_cancelDelay_Flow__err_", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_Flow [err]"], ["TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", rt.bool_var(false), "TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid"], ["TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", rt.bool_var(false), "TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid"]])
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
    rt.on_start(__on_start_0)
    rt.on_tick(__on_tick_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)
    rt.on_start(__on_start_6)

func proc26() -> void:
    var t1 = rt.tick_time()
    rt.log_msg("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0,1)", [m.select(m.isNaN(t1), 0.0, t1) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa, 1.0])
    var t2 = rt.tick_time()
    V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa

func proc116() -> void:
    rt.log_msg("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"], true])
    V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"]

func __on_start_0() -> void:
    if rt.set_delay(delay2, 2.0, cont1)["ok"]:
        var t1 = rt.tick_time()
        V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa = m.select(m.isNaN(t1), 0.0, t1)
        if rt.set_delay(delay1, 1.0, cont2)["ok"]:
            V.counter1 = m.addInt(V.counter1, 1)

func cont1() -> void:
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

func cont2() -> void:
    if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true
    if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
        var t2 = rt.tick_time()
        if m.abs_(m.select(m.isNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1:
            if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                    var t3 = rt.tick_time()
                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs_(m.select(m.isNaN(t3), 0.0, t3) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1
                    rt.log_msg("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful")
                    proc26()
        else:
            proc26()

func __on_tick_1(time_since_start: float, time_since_last_tick: float) -> void:
    pass

func __on_start_2() -> void:
    if rt.set_delay(delay4, 2.0, cont3)["ok"]:
        rt.set_delay(delay3, 1.0, cont4)
        rt.cancel_delay_slot(delay3)

func cont3() -> void:
    if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_:
            rt.log_msg("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful")

func cont4() -> void:
    if rt.ptr_set("/nodes/28/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = true
            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false

func __on_start_3() -> void:
    if rt.set_delay(delay6, 2.0, cont5)["ok"]:
        rt.set_delay(delay5, 1.0, cont6)
        rt.cancel_delay(delay5["lastRef"])
        if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ = true

func cont5() -> void:
    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered:
            rt.log_msg("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful")
    if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!")

func cont6() -> void:
    if rt.ptr_set("/nodes/34/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = true
            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false

func __on_start_4() -> void:
    if rt.set_delay(delay8, 2.0, cont7)["ok"]:
        if not rt.set_delay(delay7, -1.0, Callable())["ok"]:
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<flow/setDelay and cancelDelay - Flow [err]>: Flow triggered")
                V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ = true

func cont7() -> void:
    if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_:
        rt.log_msg("ERROR! <flow/setDelay and cancelDelay - Flow [err]>: Flow not triggered! This should not happened!")

func __on_start_5() -> void:
    if rt.set_delay(delay10, 0.5, cont8)["ok"]:
        if rt.set_delay(delay9, 2.0, Callable())["ok"]:
            if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                if rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"] == true:
                    if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                        if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": delay9["lastRef"]}, "ref")["isValid"] == true
                            rt.log_msg("<flow/setDelay and cancelDelay - lastDelayref isValid>: Test Successful")
                            proc116()
                else:
                    proc116()

func cont8() -> void:
    if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid:
            rt.log_msg("ERROR! <flow/setDelay and cancelDelay - lastDelayref isValid>: Test Failed")

func __on_start_6() -> void:
    rt.send(E["test_onStart"])
    rt.set_delay(delay11, 2.5, cont9)

func cont9() -> void:
    if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

