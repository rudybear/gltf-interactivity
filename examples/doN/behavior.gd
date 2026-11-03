extends RefCounted

var m
var rt
var V
var E
var doN1
var doN2
var doN3
var doN4
var doN5

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["counter1", rt.int_var(0), "805923c1-6da7-4eb4-b97d-dc82d6f949a7"], ["TestResult_flow_doN__out__flow", rt.bool_var(false), "TestResult_flow/doN_[out] flow"], ["TestResult_HasPassed_flow_doN__out__iteration__5_", rt.bool_var(false), "TestResult_HasPassed_flow/doN_[out] iteration (5)"], ["TestResult_flow_doN__out__iteration__5_", rt.int_var(-1), "TestResult_flow/doN_[out] iteration (5)"], ["TestResult_HasPassed_flow_doN__currentCount_", rt.bool_var(false), "TestResult_HasPassed_flow/doN_[currentCount]"], ["TestResult_flow_doN__currentCount_", rt.int_var(-1), "TestResult_flow/doN_[currentCount]"], ["counter2", rt.int_var(0), "eef46349-4ad9-4f55-9d70-fc4f2534d42b"], ["TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", rt.bool_var(false), "TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)"], ["TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", rt.int_var(-1), "TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)"], ["counter3", rt.int_var(0), "a9e7d29c-087b-4a8d-9729-2620a877b3f4"], ["TestResult_HasPassed_flow_doN_Max_Iteration_flow", rt.bool_var(false), "TestResult_HasPassed_flow/doN_Max Iteration flow"], ["TestResult_flow_doN_Max_Iteration_flow", rt.int_var(-1), "TestResult_flow/doN_Max Iteration flow"], ["TestResult_flow_doN_N___0___out__never_fires", rt.bool_var(true), "TestResult_flow/doN_N = 0: [out] never fires"], ["DoN_n_71324c55_32db_4c84_9ec7_d85286364262", rt.int_var(1), "DoN_n_71324c55-32db-4c84-9ec7-d85286364262"], ["counter4", rt.int_var(0), "70877bda-82fa-4641-981d-f56d46487cca"], ["TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_", rt.bool_var(false), "TestResult_HasPassed_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)"], ["TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_", rt.int_var(-1), "TestResult_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    doN1 = rt.don_state()
    doN2 = rt.don_state()
    doN3 = rt.don_state()
    doN4 = rt.don_state()
    doN5 = rt.don_state()
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)

func proc6() -> void:
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
                    proc42()
            else:
                proc42()
            if m.eqInt(doN1["count"], 5):
                if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_flow_doN__currentCount_ = m.eqInt(doN1["count"], 5)
                    rt.log_msg("<flow/doN - [currentCount]>: Test Successful")
                    proc48()
            else:
                proc48()

func proc42() -> void:
    rt.log_msg("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", [V.counter1, 5])
    V.TestResult_flow_doN__out__iteration__5_ = V.counter1

func proc48() -> void:
    rt.log_msg("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", [doN1["count"], 5])
    V.TestResult_flow_doN__currentCount_ = doN1["count"]

func proc59() -> void:
    if rt.don(doN2, 2):
        V.counter2 = m.addInt(V.counter2, 1)

func proc65() -> void:
    rt.log_msg("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", [V.counter2, 4])
    V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2

func proc76() -> void:
    if rt.don(doN3, 2):
        V.counter3 = m.addInt(V.counter3, 1)

func proc82() -> void:
    rt.log_msg("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", [V.counter3, 2])
    V.TestResult_flow_doN_Max_Iteration_flow = V.counter3

func proc88() -> void:
    if rt.don(doN4, 0):
        if rt.ptr_set("/nodes/34/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("ERROR! <flow/doN - N = 0: [out] never fires>: Flow triggered! This should not happened!")
            V.TestResult_flow_doN_N___0___out__never_fires = false

func proc102() -> void:
    if rt.don(doN5, V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262):
        V.counter4 = m.addInt(V.counter4, 1)

func __on_start_0() -> void:
    proc6()
    proc6()
    proc6()
    proc6()
    proc6()
    if not V.TestResult_flow_doN__out__flow:
        rt.log_msg("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!")
    if not V.TestResult_HasPassed_flow_doN__out__iteration__5_:
        rt.log_msg("ERROR! <flow/doN - [out] iteration (5)>: Test Failed")
    if not V.TestResult_HasPassed_flow_doN__currentCount_:
        rt.log_msg("ERROR! <flow/doN - [currentCount]>: Test Failed")

func __on_start_1() -> void:
    proc59()
    proc59()
    proc59()
    doN2["count"] = 0.0
    proc59()
    proc59()
    if m.eqInt(V.counter2, 4):
        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = m.eqInt(V.counter2, 4)
            rt.log_msg("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful")
            proc65()
    else:
        proc65()
    if not V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_:
        rt.log_msg("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed")

func __on_start_2() -> void:
    proc76()
    proc76()
    proc76()
    proc76()
    proc76()
    if m.eqInt(V.counter3, 2):
        if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = m.eqInt(V.counter3, 2)
            rt.log_msg("<flow/doN - Max Iteration flow>: Test Successful")
            proc82()
    else:
        proc82()
    if not V.TestResult_HasPassed_flow_doN_Max_Iteration_flow:
        rt.log_msg("ERROR! <flow/doN - Max Iteration flow>: Test Failed")

func __on_start_3() -> void:
    proc88()
    proc88()
    proc88()
    if V.TestResult_flow_doN_N___0___out__never_fires:
        rt.log_msg("<flow/doN - N = 0: [out] never fires>: Test Successful")

func __on_start_4() -> void:
    proc102()
    proc102()
    V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262 = 3
    proc102()
    proc102()
    proc102()
    V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = m.eqInt(V.counter4, 3)
    if m.eqInt(V.counter4, 3):
        if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered correct amount")
            V.TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4
    else:
        rt.log_msg("ERROR! <flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered {0} times from 3. This should not happened!", [V.counter4])

func __on_start_5() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_flow_doN__out__flow and V.TestResult_HasPassed_flow_doN__out__iteration__5_ and V.TestResult_HasPassed_flow_doN__currentCount_ and V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ and V.TestResult_HasPassed_flow_doN_Max_Iteration_flow and V.TestResult_flow_doN_N___0___out__never_fires and V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

