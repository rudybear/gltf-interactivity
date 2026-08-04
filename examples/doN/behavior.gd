extends RefCounted

var m
var rt
var V
var E
var doN1
var doN2
var doN3

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["counter1", rt.int_var(0)], ["TestResult_flow_doN__out__flow", rt.bool_var(false)], ["TestResult_HasPassed_flow_doN__out__iteration__5_", rt.bool_var(false)], ["TestResult_flow_doN__out__iteration__5_", rt.int_var(-1)], ["TestResult_HasPassed_flow_doN__currentCount_", rt.bool_var(false)], ["TestResult_flow_doN__currentCount_", rt.int_var(-1)], ["counter2", rt.int_var(0)], ["TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", rt.bool_var(false)], ["TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", rt.int_var(-1)], ["counter3", rt.int_var(0)], ["TestResult_HasPassed_flow_doN_Max_Iteration_flow", rt.bool_var(false)], ["TestResult_flow_doN_Max_Iteration_flow", rt.int_var(-1)]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    doN1 = rt.don_state()
    doN2 = rt.don_state()
    doN3 = rt.don_state()
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)

func proc0() -> void:
    if rt.don(doN1, 5):
        V.counter1 = m.addInt(V.counter1, 1)
        if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/doN - [out] flow>: Flow triggered")
            V.TestResult_flow_doN__out__flow = true
        if m.eqInt(V.counter1, 5):
            if m.eqInt(V.counter1, 5):
                if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_flow_doN__out__iteration__5_ = m.eqInt(V.counter1, 5)
                    rt.log_msg("<flow/doN - [out] iteration (5)>: Test Successful")
                    proc19()
            else:
                proc19()
            if m.eqInt(doN1["count"], 5):
                if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_flow_doN__currentCount_ = m.eqInt(doN1["count"], 5)
                    rt.log_msg("<flow/doN - [currentCount]>: Test Successful")
                    proc30()
            else:
                proc30()

func proc19() -> void:
    rt.log_msg("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", [V.counter1, 5])
    V.TestResult_flow_doN__out__iteration__5_ = V.counter1

func proc30() -> void:
    rt.log_msg("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", [doN1["count"], 5])
    V.TestResult_flow_doN__currentCount_ = doN1["count"]

func proc49() -> void:
    if rt.don(doN2, 2):
        V.counter2 = m.addInt(V.counter2, 1)

func proc57() -> void:
    rt.log_msg("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", [V.counter2, 4])
    V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2

func proc66() -> void:
    if rt.don(doN3, 2):
        V.counter3 = m.addInt(V.counter3, 1)

func proc74() -> void:
    rt.log_msg("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", [V.counter3, 2])
    V.TestResult_flow_doN_Max_Iteration_flow = V.counter3

func __on_start_0() -> void:
    proc0()
    proc0()
    proc0()
    proc0()
    proc0()
    if not V.TestResult_flow_doN__out__flow:
        rt.log_msg("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!")
    if not V.TestResult_HasPassed_flow_doN__out__iteration__5_:
        rt.log_msg("ERROR! <flow/doN - [out] iteration (5)>: Test Failed")
    if not V.TestResult_HasPassed_flow_doN__currentCount_:
        rt.log_msg("ERROR! <flow/doN - [currentCount]>: Test Failed")

func __on_start_1() -> void:
    proc49()
    proc49()
    proc49()
    doN2["count"] = 0.0
    proc49()
    proc49()
    if m.eqInt(V.counter2, 4):
        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = m.eqInt(V.counter2, 4)
            rt.log_msg("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful")
            proc57()
    else:
        proc57()
    if not V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_:
        rt.log_msg("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed")

func __on_start_2() -> void:
    proc66()
    proc66()
    proc66()
    proc66()
    proc66()
    if m.eqInt(V.counter3, 2):
        if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = m.eqInt(V.counter3, 2)
            rt.log_msg("<flow/doN - Max Iteration flow>: Test Successful")
            proc74()
    else:
        proc74()
    if not V.TestResult_HasPassed_flow_doN_Max_Iteration_flow:
        rt.log_msg("ERROR! <flow/doN - Max Iteration flow>: Test Failed")

func __on_start_3() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_flow_doN__out__flow and V.TestResult_HasPassed_flow_doN__out__iteration__5_ and V.TestResult_HasPassed_flow_doN__currentCount_ and V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ and V.TestResult_HasPassed_flow_doN_Max_Iteration_flow:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

