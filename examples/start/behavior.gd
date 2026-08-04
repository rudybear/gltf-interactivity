extends RefCounted

var m
var rt
var V
var E
var delay1
var delay2
var delay3

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b", rt.int_var(0), "FlowSequenceCount_cd624fe9-1c76-4daf-9ebc-5a4014c8fb9b"], ["TestResult_animation_start__out__fired_right_after__in_", rt.bool_var(false), "TestResult_animation/start_[out] fired right after [in]"], ["TestResult_HasPassed_animation_start_Position_at_50_", rt.bool_var(false), "TestResult_HasPassed_animation/start_Position at 50%"], ["TestResult_animation_start_Position_at_50_", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_animation/start_Position at 50%"], ["TestResult_animation_start_Flow__done_", rt.bool_var(false), "TestResult_animation/start_Flow [done]"], ["TestResult_HasPassed_animation_start_Position_at_100_", rt.bool_var(false), "TestResult_HasPassed_animation/start_Position at 100%"], ["TestResult_animation_start_Position_at_100_", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_animation/start_Position at 100%"], ["TestResult_animation_start__err__flow__speed__1_", rt.bool_var(false), "TestResult_animation/start_[err] flow (speed -1)"], ["TestResult_animation_start__err__flow__speed_0_", rt.bool_var(false), "TestResult_animation/start_[err] flow (speed 0)"], ["TestResult_animation_start__err__flow__speed_NaN_", rt.bool_var(false), "TestResult_animation/start_[err] flow (speed NaN)"], ["TestResult_animation_start__err__flow__speed__Inf_", rt.bool_var(false), "TestResult_animation/start_[err] flow (speed +Inf)"], ["TestResult_animation_start__err__flow__startTime_NaN_", rt.bool_var(false), "TestResult_animation/start_[err] flow (startTime NaN)"], ["TestResult_animation_start__err__flow__startTime__Inf_", rt.bool_var(false), "TestResult_animation/start_[err] flow (startTime +Inf)"], ["TestResult_animation_start__err__flow__endTime_NaN_", rt.bool_var(false), "TestResult_animation/start_[err] flow (endTime NaN)"], ["TestResult_animation_start__err__flow__invalid_ref_", rt.bool_var(false), "TestResult_animation/start_[err] flow (invalid ref)"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 3.5}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    delay1 = rt.delay_state()
    delay2 = rt.delay_state()
    delay3 = rt.delay_state()
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)
    rt.on_start(__on_start_6)
    rt.on_start(__on_start_7)
    rt.on_start(__on_start_8)
    rt.on_start(__on_start_9)

func proc87() -> void:
    rt.log_msg("<animation/start - Position at 100%>: Value is {0}, should be {1} (Proximity range: 0,01)", [rt.ptr_get("/nodes/3/translation", "float3")["value"], [-1.0, 2.0, 3.0]])
    V.TestResult_animation_start_Position_at_100_ = rt.ptr_get("/nodes/3/translation", "float3")["value"]

func proc35() -> void:
    rt.log_msg("<animation/start - Position at 50%>: Value is {0}, should be {1} (Proximity range: 0,3)", [rt.ptr_get("/nodes/3/translation", "float3")["value"], [-0.5, 1.0, 1.5]])
    V.TestResult_animation_start_Position_at_50_ = rt.ptr_get("/nodes/3/translation", "float3")["value"]

func __on_start_0() -> void:
    if rt.set_delay(delay2, 3.0, cont1)["ok"]:
        if rt.anim_start("/animations/0", 0.0, 2.0, 1.0, cont2)["ok"]:
            V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = m.addInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1)
            if not m.eqInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1):
                rt.log_msg("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: out")
                V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000
        V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = m.addInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1)
        if m.eqInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 2):
            if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<animation/start - [out] fired right after [in]>: Correct flow order triggered")
                V.TestResult_animation_start__out__fired_right_after__in_ = true
        else:
            rt.log_msg("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: 1")
            V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000
        rt.set_delay(delay1, 1.0, cont3)

func cont1() -> void:
    if not V.TestResult_animation_start__out__fired_right_after__in_:
        rt.log_msg("ERROR! <animation/start - [out] fired right after [in]>: Correct flow order not triggered! This should not happened!")
    if rt.ptr_set("/nodes/13/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_animation_start_Position_at_50_:
            rt.log_msg("ERROR! <animation/start - Position at 50%>: Test Failed")
    if rt.ptr_set("/nodes/19/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_animation_start_Flow__done_:
            rt.log_msg("ERROR! <animation/start - Flow [done]>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/25/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_animation_start_Position_at_100_:
            rt.log_msg("ERROR! <animation/start - Position at 100%>: Test Failed")

func cont2() -> void:
    if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/19/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<animation/start - Flow [done]>: Flow triggered")
            V.TestResult_animation_start_Flow__done_ = true
    if rt.ptr_set("/nodes/25/translation", "float3", [0.0, 0.0, 0.0]):
        var t1 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
        if m.length(t1) > 3.73165751 and m.dot(m.normalize(t1)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.99:
            if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/25/translation", "float3", [0.0, 0.0, 0.0]):
                    var t2 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
                    V.TestResult_HasPassed_animation_start_Position_at_100_ = m.length(t2) > 3.73165751 and m.dot(m.normalize(t2)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.99
                    rt.log_msg("<animation/start - Position at 100%>: Test Successful")
                    proc87()
        else:
            proc87()

func cont3() -> void:
    if rt.ptr_set("/nodes/13/translation", "float3", [0.0, 0.0, 0.0]):
        var t3 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
        if m.length(t3) > 1.57082868 and m.dot(m.normalize(t3)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.7:
            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/13/translation", "float3", [0.0, 0.0, 0.0]):
                    var t4 = rt.ptr_get("/nodes/3/translation", "float3")["value"]
                    V.TestResult_HasPassed_animation_start_Position_at_50_ = m.length(t4) > 1.57082868 and m.dot(m.normalize(t4)["value"], [-0.267261237, 0.5345225, 0.8017837]) > 0.7
                    rt.log_msg("<animation/start - Position at 50%>: Test Successful")
                    proc35()
        else:
            proc35()

func __on_start_1() -> void:
    if not rt.anim_start("/animations/0", 0.0, 2.0, -1.0, Callable())["ok"]:
        if rt.ptr_set("/nodes/30/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (speed -1)>: Flow triggered")
            V.TestResult_animation_start__err__flow__speed__1_ = true
    if not V.TestResult_animation_start__err__flow__speed__1_:
        rt.log_msg("ERROR! <animation/start - [err] flow (speed -1)>: Flow not triggered! This should not happened!")

func __on_start_2() -> void:
    if not rt.anim_start("/animations/0", 0.0, 2.0, 0.0, Callable())["ok"]:
        if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (speed 0)>: Flow triggered")
            V.TestResult_animation_start__err__flow__speed_0_ = true
    if not V.TestResult_animation_start__err__flow__speed_0_:
        rt.log_msg("ERROR! <animation/start - [err] flow (speed 0)>: Flow not triggered! This should not happened!")

func __on_start_3() -> void:
    if not rt.anim_start("/animations/0", 0.0, 2.0, m.NaN(), Callable())["ok"]:
        if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (speed NaN)>: Flow triggered")
            V.TestResult_animation_start__err__flow__speed_NaN_ = true
    if not V.TestResult_animation_start__err__flow__speed_NaN_:
        rt.log_msg("ERROR! <animation/start - [err] flow (speed NaN)>: Flow not triggered! This should not happened!")

func __on_start_4() -> void:
    if not rt.anim_start("/animations/0", 0.0, 2.0, m.Inf(), Callable())["ok"]:
        if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (speed +Inf)>: Flow triggered")
            V.TestResult_animation_start__err__flow__speed__Inf_ = true
    if not V.TestResult_animation_start__err__flow__speed__Inf_:
        rt.log_msg("ERROR! <animation/start - [err] flow (speed +Inf)>: Flow not triggered! This should not happened!")

func __on_start_5() -> void:
    if not rt.anim_start("/animations/0", m.NaN(), 2.0, 1.0, Callable())["ok"]:
        if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (startTime NaN)>: Flow triggered")
            V.TestResult_animation_start__err__flow__startTime_NaN_ = true
    if not V.TestResult_animation_start__err__flow__startTime_NaN_:
        rt.log_msg("ERROR! <animation/start - [err] flow (startTime NaN)>: Flow not triggered! This should not happened!")

func __on_start_6() -> void:
    if not rt.anim_start("/animations/0", m.Inf(), 2.0, 1.0, Callable())["ok"]:
        if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (startTime +Inf)>: Flow triggered")
            V.TestResult_animation_start__err__flow__startTime__Inf_ = true
    if not V.TestResult_animation_start__err__flow__startTime__Inf_:
        rt.log_msg("ERROR! <animation/start - [err] flow (startTime +Inf)>: Flow not triggered! This should not happened!")

func __on_start_7() -> void:
    if not rt.anim_start("/animations/0", 0.0, m.NaN(), 1.0, Callable())["ok"]:
        if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (endTime NaN)>: Flow triggered")
            V.TestResult_animation_start__err__flow__endTime_NaN_ = true
    if not V.TestResult_animation_start__err__flow__endTime_NaN_:
        rt.log_msg("ERROR! <animation/start - [err] flow (endTime NaN)>: Flow not triggered! This should not happened!")

func __on_start_8() -> void:
    if not rt.anim_start("/animations/1000", 0.0, 2.0, 1.0, Callable())["ok"]:
        if rt.ptr_set("/nodes/72/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<animation/start - [err] flow (invalid ref)>: Flow triggered")
            V.TestResult_animation_start__err__flow__invalid_ref_ = true
    if not V.TestResult_animation_start__err__flow__invalid_ref_:
        rt.log_msg("ERROR! <animation/start - [err] flow (invalid ref)>: Flow not triggered! This should not happened!")

func __on_start_9() -> void:
    rt.send(E["test_onStart"])
    rt.set_delay(delay3, 3.5, cont4)

func cont4() -> void:
    if V.TestResult_animation_start__out__fired_right_after__in_ and V.TestResult_HasPassed_animation_start_Position_at_50_ and V.TestResult_animation_start_Flow__done_ and V.TestResult_HasPassed_animation_start_Position_at_100_ and V.TestResult_animation_start__err__flow__speed__1_ and V.TestResult_animation_start__err__flow__speed_0_ and V.TestResult_animation_start__err__flow__speed_NaN_ and V.TestResult_animation_start__err__flow__speed__Inf_ and V.TestResult_animation_start__err__flow__startTime_NaN_ and V.TestResult_animation_start__err__flow__startTime__Inf_ and V.TestResult_animation_start__err__flow__endTime_NaN_ and V.TestResult_animation_start__err__flow__invalid_ref_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

