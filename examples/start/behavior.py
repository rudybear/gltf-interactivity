import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b": rt.int_(0), "TestResult_animation_start__out__fired_right_after__in_": rt.bool_(False), "TestResult_HasPassed_animation_start_Position_at_50_": rt.bool_(False), "TestResult_animation_start_Position_at_50_": rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_animation_start_Flow__done_": rt.bool_(False), "TestResult_HasPassed_animation_start_Position_at_100_": rt.bool_(False), "TestResult_animation_start_Position_at_100_": rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_animation_start__err__flow__speed__1_": rt.bool_(False), "TestResult_animation_start__err__flow__speed_0_": rt.bool_(False), "TestResult_animation_start__err__flow__speed_NaN_": rt.bool_(False), "TestResult_animation_start__err__flow__speed__Inf_": rt.bool_(False), "TestResult_animation_start__err__flow__startTime_NaN_": rt.bool_(False), "TestResult_animation_start__err__flow__startTime__Inf_": rt.bool_(False), "TestResult_animation_start__err__flow__endTime_NaN_": rt.bool_(False), "TestResult_animation_start__err__flow__invalid_ref_": rt.bool_(False)})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 3.5}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.delay1 = rt.delay_state()
    S.delay2 = rt.delay_state()
    S.delay3 = rt.delay_state()
    def proc87() -> None:
        rt.log("<animation/start - Position at 100%>: Value is {0}, should be {1} (Proximity range: 0,01)", [rt.ptr_get("/nodes/3/translation", "float3")["value"], [-1.0, 2.0, 3.0]])
        V.TestResult_animation_start_Position_at_100_ = rt.ptr_get("/nodes/3/translation", "float3")["value"]
    def proc35() -> None:
        rt.log("<animation/start - Position at 50%>: Value is {0}, should be {1} (Proximity range: 0,3)", [rt.ptr_get("/nodes/3/translation", "float3")["value"], [-0.5, 1.0, 1.5]])
        V.TestResult_animation_start_Position_at_50_ = rt.ptr_get("/nodes/3/translation", "float3")["value"]
    def __on_start_0() -> None:
        def cont1() -> None:
            if not V.TestResult_animation_start__out__fired_right_after__in_:
                rt.log("ERROR! <animation/start - [out] fired right after [in]>: Correct flow order not triggered! This should not happened!")
            if rt.ptr_set("/nodes/13/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_animation_start_Position_at_50_:
                    rt.log("ERROR! <animation/start - Position at 50%>: Test Failed")
            if rt.ptr_set("/nodes/19/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_animation_start_Flow__done_:
                    rt.log("ERROR! <animation/start - Flow [done]>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/25/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_animation_start_Position_at_100_:
                    rt.log("ERROR! <animation/start - Position at 100%>: Test Failed")
        if rt.set_delay(S.delay2, 3.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/19/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<animation/start - Flow [done]>: Flow triggered")
                        V.TestResult_animation_start_Flow__done_ = True
                if rt.ptr_set("/nodes/25/translation", "float3", [0.0, 0.0, 0.0]):
                    t1 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
                    if m.length(t1) > 3.73165751 and m.dot(m.normalize(t1)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.99:
                        if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/25/translation", "float3", [0.0, 0.0, 0.0]):
                                t2 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
                                V.TestResult_HasPassed_animation_start_Position_at_100_ = m.length(t2) > 3.73165751 and m.dot(m.normalize(t2)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.99
                                rt.log("<animation/start - Position at 100%>: Test Successful")
                                proc87()
                    else:
                        proc87()
            if rt.anim_start("/animations/0", 0.0, 2.0, 1.0, cont2)["ok"]:
                V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = m.addInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1)
                if not m.eqInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1):
                    rt.log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: out")
                    V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000
            V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = m.addInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1)
            if m.eqInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 2):
                if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.8]):
                    rt.log("<animation/start - [out] fired right after [in]>: Correct flow order triggered")
                    V.TestResult_animation_start__out__fired_right_after__in_ = True
            else:
                rt.log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: 1")
                V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000
            def cont3() -> None:
                if rt.ptr_set("/nodes/13/translation", "float3", [0.0, 0.0, 0.0]):
                    t3 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
                    if m.length(t3) > 1.57082868 and m.dot(m.normalize(t3)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.7:
                        if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/13/translation", "float3", [0.0, 0.0, 0.0]):
                                t4 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
                                V.TestResult_HasPassed_animation_start_Position_at_50_ = m.length(t4) > 1.57082868 and m.dot(m.normalize(t4)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.7
                                rt.log("<animation/start - Position at 50%>: Test Successful")
                                proc35()
                    else:
                        proc35()
            rt.set_delay(S.delay1, 1.0, cont3)
    rt.on_start(__on_start_0)
    def __on_start_1() -> None:
        if not rt.anim_start("/animations/0", 0.0, 2.0, -1.0, None)["ok"]:
            if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (speed -1)>: Flow triggered")
                V.TestResult_animation_start__err__flow__speed__1_ = True
        if not V.TestResult_animation_start__err__flow__speed__1_:
            rt.log("ERROR! <animation/start - [err] flow (speed -1)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_1)
    def __on_start_2() -> None:
        if not rt.anim_start("/animations/0", 0.0, 2.0, 0.0, None)["ok"]:
            if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (speed 0)>: Flow triggered")
                V.TestResult_animation_start__err__flow__speed_0_ = True
        if not V.TestResult_animation_start__err__flow__speed_0_:
            rt.log("ERROR! <animation/start - [err] flow (speed 0)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        if not rt.anim_start("/animations/0", 0.0, 2.0, m.NaN(), None)["ok"]:
            if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (speed NaN)>: Flow triggered")
                V.TestResult_animation_start__err__flow__speed_NaN_ = True
        if not V.TestResult_animation_start__err__flow__speed_NaN_:
            rt.log("ERROR! <animation/start - [err] flow (speed NaN)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_3)
    def __on_start_4() -> None:
        if not rt.anim_start("/animations/0", 0.0, 2.0, m.Inf(), None)["ok"]:
            if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (speed +Inf)>: Flow triggered")
                V.TestResult_animation_start__err__flow__speed__Inf_ = True
        if not V.TestResult_animation_start__err__flow__speed__Inf_:
            rt.log("ERROR! <animation/start - [err] flow (speed +Inf)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_4)
    def __on_start_5() -> None:
        if not rt.anim_start("/animations/0", m.NaN(), 2.0, 1.0, None)["ok"]:
            if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (startTime NaN)>: Flow triggered")
                V.TestResult_animation_start__err__flow__startTime_NaN_ = True
        if not V.TestResult_animation_start__err__flow__startTime_NaN_:
            rt.log("ERROR! <animation/start - [err] flow (startTime NaN)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_5)
    def __on_start_6() -> None:
        if not rt.anim_start("/animations/0", m.Inf(), 2.0, 1.0, None)["ok"]:
            if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (startTime +Inf)>: Flow triggered")
                V.TestResult_animation_start__err__flow__startTime__Inf_ = True
        if not V.TestResult_animation_start__err__flow__startTime__Inf_:
            rt.log("ERROR! <animation/start - [err] flow (startTime +Inf)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_6)
    def __on_start_7() -> None:
        if not rt.anim_start("/animations/0", 0.0, m.NaN(), 1.0, None)["ok"]:
            if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (endTime NaN)>: Flow triggered")
                V.TestResult_animation_start__err__flow__endTime_NaN_ = True
        if not V.TestResult_animation_start__err__flow__endTime_NaN_:
            rt.log("ERROR! <animation/start - [err] flow (endTime NaN)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_7)
    def __on_start_8() -> None:
        if not rt.anim_start("/animations/1000", 0.0, 2.0, 1.0, None)["ok"]:
            if rt.ptr_set("/nodes/72/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<animation/start - [err] flow (invalid ref)>: Flow triggered")
                V.TestResult_animation_start__err__flow__invalid_ref_ = True
        if not V.TestResult_animation_start__err__flow__invalid_ref_:
            rt.log("ERROR! <animation/start - [err] flow (invalid ref)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_8)
    def __on_start_9() -> None:
        rt.send(E["test_onStart"])
        def cont1() -> None:
            if V.TestResult_animation_start__out__fired_right_after__in_ and V.TestResult_HasPassed_animation_start_Position_at_50_ and V.TestResult_animation_start_Flow__done_ and V.TestResult_HasPassed_animation_start_Position_at_100_ and V.TestResult_animation_start__err__flow__speed__1_ and V.TestResult_animation_start__err__flow__speed_0_ and V.TestResult_animation_start__err__flow__speed_NaN_ and V.TestResult_animation_start__err__flow__speed__Inf_ and V.TestResult_animation_start__err__flow__startTime_NaN_ and V.TestResult_animation_start__err__flow__startTime__Inf_ and V.TestResult_animation_start__err__flow__endTime_NaN_ and V.TestResult_animation_start__err__flow__invalid_ref_:
                rt.send(E["test_onSuccess"])
            else:
                rt.send(E["test_onFailed"])
        rt.set_delay(S.delay3, 3.5, cont1)
    rt.on_start(__on_start_9)
