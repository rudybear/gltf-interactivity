import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa": rt.float_(0.0), "TestResult_flow_setDelay_and_cancelDelay_Flow__done_": rt.bool_(False), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay": rt.bool_(False), "TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay": rt.float_(-0.0142), "counter1": rt.int_(0), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_": rt.bool_(False), "TestResult_flow_setDelay_and_cancelDelay_Flow__out_": rt.int_(-1), "TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_": rt.bool_(False), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_": rt.bool_(True), "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered": rt.bool_(False), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered": rt.bool_(True), "TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_": rt.bool_(False), "TestResult_flow_setDelay_and_cancelDelay_Flow__err_": rt.bool_(False), "TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid": rt.bool_(False), "TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid": rt.bool_(False)})
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
    def proc26() -> None:
        t1 = rt.tick_time()
        rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0,1)", [m.select(m.isNaN(t1), 0.0, t1) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa, 1.0])
        t2 = rt.tick_time()
        V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa
    def proc116() -> None:
        rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": S.delay9["lastRef"]}, "ref")["isValid"], True])
        V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptr_get("/extensions/KHR_interactivity/delays/{delayRef}", {"delayRef": S.delay9["lastRef"]}, "ref")["isValid"]
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
            V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa = m.select(m.isNaN(t1), 0.0, t1)
            def cont2() -> None:
                if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered")
                        V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = True
                if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                    t2 = rt.tick_time()
                    if m.abs_(m.select(m.isNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1:
                        if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                                t3 = rt.tick_time()
                                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs_(m.select(m.isNaN(t3), 0.0, t3) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1
                                rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful")
                                proc26()
                    else:
                        proc26()
            if rt.set_delay(S.delay1, 1.0, cont2)["ok"]:
                V.counter1 = m.addInt(V.counter1, 1)
    rt.on_start(__on_start_0)
    def __on_tick_1(time_since_start: float, time_since_last_tick: float) -> None:
        pass
    rt.on_tick(__on_tick_1)
    def __on_start_2() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_:
                    rt.log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful")
        if rt.set_delay(S.delay4, 2.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/28/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!")
                        V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = True
                        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ = False
            rt.set_delay(S.delay3, 1.0, cont2)
            rt.cancel_delay_slot(S.delay3)
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered:
                    rt.log("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful")
            if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_:
                rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!")
        if rt.set_delay(S.delay6, 2.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/34/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!")
                        V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = True
                        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered = False
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
                                proc116()
                    else:
                        proc116()
    rt.on_start(__on_start_5)
    def __on_start_6() -> None:
        rt.send(E["test_onStart"])
        def cont1() -> None:
            if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid:
                rt.send(E["test_onSuccess"])
            else:
                rt.send(E["test_onFailed"])
        rt.set_delay(S.delay11, 2.5, cont1)
    rt.on_start(__on_start_6)
