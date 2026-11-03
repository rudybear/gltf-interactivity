import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6": rt.with_id("startTime_ca9af277-a001-44a7-bbd2-b3e9d2eafea6", rt.float_(0.0)), "TestResult_flow_setDelay_and_cancelDelay_Flow__done_": rt.with_id("TestResult_flow/setDelay and cancelDelay_Flow [done]", rt.bool_(False)), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay": rt.with_id("TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay": rt.with_id("TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay", rt.float_(-0.0142)), "counter1": rt.with_id("d90d4f49-c9e3-4a3e-9f10-06247568422b", rt.int_(0)), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_": rt.with_id("TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_Flow__out_": rt.with_id("TestResult_flow/setDelay and cancelDelay_Flow [out]", rt.int_(-1)), "TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_": rt.with_id("TestResult_flow/setDelay and cancelDelay_setDelay [cancel]", rt.bool_(True)), "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered": rt.with_id("TestResult_flow/setDelay and cancelDelay_cancelDelay triggered", rt.bool_(True)), "TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_": rt.with_id("TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_Flow__err_": rt.with_id("TestResult_flow/setDelay and cancelDelay_Flow [err]", rt.bool_(False)), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid": rt.with_id("TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid": rt.with_id("TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_": rt.with_id("TestResult_flow/setDelay and cancelDelay_Flow [err]\n(NaN)", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_": rt.with_id("TestResult_flow/setDelay and cancelDelay_Flow [err]\n(+Inf)", rt.bool_(False)), "FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362": rt.with_id("FlowSequenceCount_b8e69ef5-14a6-4dbe-b4e1-3335901db362", rt.int_(0)), "TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order": rt.with_id("TestResult_flow/setDelay and cancelDelay_Concurrent delays\n[done] in time order", rt.bool_(False)), "counter2": rt.with_id("c3ceb65a-83b0-4b71-9344-d81263979ab7", rt.int_(0)), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x": rt.with_id("TestResult_HasPassed_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x": rt.with_id("TestResult_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x", rt.int_(-1)), "TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null": rt.with_id("TestResult_HasPassed_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null": rt.with_id("TestResult_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays": rt.with_id("TestResult_flow/setDelay and cancelDelay_[cancel] cancels all\npending delays", rt.bool_(True)), "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_": rt.with_id("TestResult_flow/setDelay and cancelDelay_cancelDelay null ref\nFlow [out]", rt.bool_(False)), "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_": rt.with_id("TestResult_flow/setDelay and cancelDelay_cancelDelay fired ref\nFlow [out]", rt.bool_(False))})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 2.5}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.delay1 = rt.delay_state()
    S.delay2 = rt.delay_state()
    S.delay3 = rt.delay_state()
    S.delay4 = rt.delay_state()
    S.delay5 = rt.delay_state()
    S.delay6 = rt.delay_state()
    S.delay7 = rt.delay_state()
    S.delay8 = rt.delay_state()
    S.delay9 = rt.delay_state()
    S.delay10 = rt.delay_state()
    S.delay11 = rt.delay_state()
    S.delay12 = rt.delay_state()
    S.delay13 = rt.delay_state()
    S.delay14 = rt.delay_state()
    S.delay15 = rt.delay_state()
    S.delay16 = rt.delay_state()
    S.delay17 = rt.delay_state()
    S.delay18 = rt.delay_state()
    S.delay19 = rt.delay_state()
    S.delay20 = rt.delay_state()
    S.delay21 = rt.delay_state()
    S.delay22 = rt.delay_state()
    S.delay23 = rt.delay_state()
    def proc45() -> None:
        t1 = rt.tick_time()
        rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0.1)", [m.select(m.isNaN(t1), 0.0, t1) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6, 1.0])
        t2 = rt.tick_time()
        V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6
    def proc131() -> None:
        rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": S.delay9["lastRef"]}, "ref")["isValid"], True])
        V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": S.delay9["lastRef"]}, "ref")["isValid"]
    def proc182() -> None:
        def cont1() -> None:
            V.counter2 = m.addInt(V.counter2, 1)
        rt.set_delay(S.delay17, 0.3, cont1)
    def proc197() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/76/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/78/translation", "float3", [0.0, 0.0, 0.0]):
                    rt.log("ERROR! <flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Flow triggered! This should not happened!")
                    V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays = False
        rt.set_delay(S.delay19, 0.3, cont1)
    def proc204() -> None:
        rt.log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Value is {0}, should be {1} ", [m.refEq(S.delay19["lastRef"], ""), True])
        V.TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(S.delay19["lastRef"], "")
    def __on_start_0() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [done]>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Failed")
            if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ = m.eqInt(V.counter1, 1)
                if m.eqInt(V.counter1, 1):
                    if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                        if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
                            rt.log("<flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered correct amount")
                            V.TestResult_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1
                else:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered {0} times from 1. This should not happened!", [V.counter1])
        if rt.set_delay(S.delay2, 2.0, cont1)["ok"]:
            t1 = rt.tick_time()
            V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 = m.select(m.isNaN(t1), 0.0, t1)
            def cont2() -> None:
                if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered")
                        V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = True
                if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                    t2 = rt.tick_time()
                    if m.abs_(m.select(m.isNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1:
                        if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                                t3 = rt.tick_time()
                                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs_(m.select(m.isNaN(t3), 0.0, t3) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1
                                rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful")
                                proc45()
                    else:
                        proc45()
            if rt.set_delay(S.delay1, 1.0, cont2)["ok"]:
                V.counter1 = m.addInt(V.counter1, 1)
    rt.on_start(__on_start_0)
    def __on_tick_1(time_since_start: float, time_since_last_tick: float) -> None:
        pass
    rt.on_tick(__on_tick_1)
    def __on_start_2() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_:
                    rt.log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful")
        if rt.set_delay(S.delay4, 2.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/28/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!")
                        V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = False
            rt.set_delay(S.delay3, 1.0, cont2)
            rt.cancel_delay_slot(S.delay3)
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered:
                    rt.log("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful")
            if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_:
                rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!")
        if rt.set_delay(S.delay6, 2.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/34/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!")
                        V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = False
            rt.set_delay(S.delay5, 1.0, cont2)
            rt.cancel_delay(S.delay5["lastRef"])
            if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow triggered")
                V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ = True
    rt.on_start(__on_start_3)
    def __on_start_4() -> None:
        def cont1() -> None:
            if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_:
                rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err]>: Flow not triggered! This should not happened!")
        if rt.set_delay(S.delay8, 2.0, cont1)["ok"]:
            if not rt.set_delay(S.delay7, -1.0, None)["ok"]:
                if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                    rt.log("<flow/setDelay and cancelDelay - Flow [err]>: Flow triggered")
                    V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ = True
    rt.on_start(__on_start_4)
    def __on_start_5() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - lastDelayref isValid>: Test Failed")
        if rt.set_delay(S.delay10, 0.5, cont1)["ok"]:
            if rt.set_delay(S.delay9, 2.0, None)["ok"]:
                if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                    if rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": S.delay9["lastRef"]}, "ref")["isValid"] == True:
                        if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": S.delay9["lastRef"]}, "ref")["isValid"] == True
                                rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Test Successful")
                                proc131()
                    else:
                        proc131()
    rt.on_start(__on_start_5)
    def __on_start_6() -> None:
        if not rt.set_delay(S.delay11, m.NaN(), None)["ok"]:
            if rt.ptr_set("/nodes/53/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow triggered")
                V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ = True
        if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_:
            rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_6)
    def __on_start_7() -> None:
        if not rt.set_delay(S.delay12, m.Inf(), None)["ok"]:
            if rt.ptr_set("/nodes/59/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow triggered")
                V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ = True
        if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_:
            rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_7)
    def __on_start_8() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order not triggered! This should not happened!")
        if rt.set_delay(S.delay16, 1.5, cont1)["ok"]:
            def cont2() -> None:
                V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1)
                if m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 3):
                    if rt.ptr_set("/nodes/65/translation", "float3", [0.0, 0.0, 0.8]):
                        if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                            rt.log("<flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order triggered")
                            V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order = True
                else:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
                    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000
            rt.set_delay(S.delay13, 0.6, cont2)
            def cont3() -> None:
                V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1)
                if not m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1):
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
                    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000
            rt.set_delay(S.delay14, 0.2, cont3)
            def cont4() -> None:
                V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1)
                if not m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 2):
                    rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
                    V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000
            rt.set_delay(S.delay15, 0.4, cont4)
    rt.on_start(__on_start_8)
    def __on_start_9() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/72/translation", "float3", [0.0, 0.0, 0.0]):
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = m.eqInt(V.counter2, 3)
                if m.eqInt(V.counter2, 3):
                    if rt.ptr_set("/nodes/71/translation", "float3", [0.0, 0.0, 0.8]):
                        if rt.ptr_set("/nodes/72/translation", "float3", [0.0, 0.0, 0.0]):
                            rt.log("<flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered correct amount")
                            V.TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2
                else:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered {0} times from 3. This should not happened!", [V.counter2])
        if rt.set_delay(S.delay18, 1.0, cont1)["ok"]:
            proc182()
            proc182()
            proc182()
    rt.on_start(__on_start_9)
    def __on_start_10() -> None:
        def cont1() -> None:
            if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null:
                rt.log("ERROR! <flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Failed")
            if rt.ptr_set("/nodes/78/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays:
                    rt.log("<flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Test Successful")
        if rt.set_delay(S.delay20, 1.0, cont1)["ok"]:
            proc197()
            proc197()
            proc197()
            rt.cancel_delay_slot(S.delay19)
            if m.refEq(S.delay19["lastRef"], "") == True:
                if rt.ptr_set("/nodes/83/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(S.delay19["lastRef"], "") == True
                    rt.log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Successful")
                    proc204()
            else:
                proc204()
    rt.on_start(__on_start_10)
    def __on_start_11() -> None:
        rt.cancel_delay("")
        if rt.ptr_set("/nodes/89/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log("<flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ = True
        if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_:
            rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_11)
    def __on_start_12() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_:
                    rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow not triggered! This should not happened!")
        if rt.set_delay(S.delay22, 1.0, cont1)["ok"]:
            def cont2() -> None:
                rt.cancel_delay(S.delay21["lastRef"])
                if rt.ptr_set("/nodes/95/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow triggered")
                        V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ = True
            rt.set_delay(S.delay21, 0.1, cont2)
    rt.on_start(__on_start_12)
    def __on_start_13() -> None:
        rt.send(E["test_onStart"])
        def cont1() -> None:
            if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ and V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ and V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x and V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_:
                rt.send(E["test_onSuccess"])
            else:
                rt.send(E["test_onFailed"])
        rt.set_delay(S.delay23, 2.5, cont1)
    rt.on_start(__on_start_13)
