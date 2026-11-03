import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"counter1": rt.with_id("805923c1-6da7-4eb4-b97d-dc82d6f949a7", rt.int_(0)), "TestResult_flow_doN__out__flow": rt.with_id("TestResult_flow/doN_[out] flow", rt.bool_(False)), "TestResult_HasPassed_flow_doN__out__iteration__5_": rt.with_id("TestResult_HasPassed_flow/doN_[out] iteration (5)", rt.bool_(False)), "TestResult_flow_doN__out__iteration__5_": rt.with_id("TestResult_flow/doN_[out] iteration (5)", rt.int_(-1)), "TestResult_HasPassed_flow_doN__currentCount_": rt.with_id("TestResult_HasPassed_flow/doN_[currentCount]", rt.bool_(False)), "TestResult_flow_doN__currentCount_": rt.with_id("TestResult_flow/doN_[currentCount]", rt.int_(-1)), "counter2": rt.with_id("eef46349-4ad9-4f55-9d70-fc4f2534d42b", rt.int_(0)), "TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_": rt.with_id("TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)", rt.bool_(False)), "TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_": rt.with_id("TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)", rt.int_(-1)), "counter3": rt.with_id("a9e7d29c-087b-4a8d-9729-2620a877b3f4", rt.int_(0)), "TestResult_HasPassed_flow_doN_Max_Iteration_flow": rt.with_id("TestResult_HasPassed_flow/doN_Max Iteration flow", rt.bool_(False)), "TestResult_flow_doN_Max_Iteration_flow": rt.with_id("TestResult_flow/doN_Max Iteration flow", rt.int_(-1)), "TestResult_flow_doN_N___0___out__never_fires": rt.with_id("TestResult_flow/doN_N = 0: [out] never fires", rt.bool_(True)), "DoN_n_71324c55_32db_4c84_9ec7_d85286364262": rt.with_id("DoN_n_71324c55-32db-4c84-9ec7-d85286364262", rt.int_(1)), "counter4": rt.with_id("70877bda-82fa-4641-981d-f56d46487cca", rt.int_(0)), "TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_": rt.with_id("TestResult_HasPassed_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)", rt.bool_(False)), "TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_": rt.with_id("TestResult_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)", rt.int_(-1))})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 0.0}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.doN1 = rt.do_n_state()
    S.doN2 = rt.do_n_state()
    S.doN3 = rt.do_n_state()
    S.doN4 = rt.do_n_state()
    S.doN5 = rt.do_n_state()
    def proc6() -> None:
        if rt.do_n(S.doN1, 5):
            V.counter1 = m.addInt(V.counter1, 1)
            if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/doN - [out] flow>: Flow triggered")
                V.TestResult_flow_doN__out__flow = True
            if m.eqInt(V.counter1, 5):
                if m.eqInt(V.counter1, 5):
                    if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                        V.TestResult_HasPassed_flow_doN__out__iteration__5_ = m.eqInt(V.counter1, 5)
                        rt.log("<flow/doN - [out] iteration (5)>: Test Successful")
                        proc42()
                else:
                    proc42()
                if m.eqInt(S.doN1["count"], 5):
                    if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                        V.TestResult_HasPassed_flow_doN__currentCount_ = m.eqInt(S.doN1["count"], 5)
                        rt.log("<flow/doN - [currentCount]>: Test Successful")
                        proc48()
                else:
                    proc48()
    def proc42() -> None:
        rt.log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", [V.counter1, 5])
        V.TestResult_flow_doN__out__iteration__5_ = V.counter1
    def proc48() -> None:
        rt.log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", [S.doN1["count"], 5])
        V.TestResult_flow_doN__currentCount_ = S.doN1["count"]
    def proc59() -> None:
        if rt.do_n(S.doN2, 2):
            V.counter2 = m.addInt(V.counter2, 1)
    def proc65() -> None:
        rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", [V.counter2, 4])
        V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2
    def proc76() -> None:
        if rt.do_n(S.doN3, 2):
            V.counter3 = m.addInt(V.counter3, 1)
    def proc82() -> None:
        rt.log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", [V.counter3, 2])
        V.TestResult_flow_doN_Max_Iteration_flow = V.counter3
    def proc88() -> None:
        if rt.do_n(S.doN4, 0):
            if rt.ptr_set("/nodes/34/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("ERROR! <flow/doN - N = 0: [out] never fires>: Flow triggered! This should not happened!")
                V.TestResult_flow_doN_N___0___out__never_fires = False
    def proc102() -> None:
        if rt.do_n(S.doN5, V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262):
            V.counter4 = m.addInt(V.counter4, 1)
    def __on_start_0() -> None:
        proc6()
        proc6()
        proc6()
        proc6()
        proc6()
        if not V.TestResult_flow_doN__out__flow:
            rt.log("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!")
        if not V.TestResult_HasPassed_flow_doN__out__iteration__5_:
            rt.log("ERROR! <flow/doN - [out] iteration (5)>: Test Failed")
        if not V.TestResult_HasPassed_flow_doN__currentCount_:
            rt.log("ERROR! <flow/doN - [currentCount]>: Test Failed")
    rt.on_start(__on_start_0)
    def __on_start_1() -> None:
        proc59()
        proc59()
        proc59()
        S.doN2["count"] = 0.0
        proc59()
        proc59()
        if m.eqInt(V.counter2, 4):
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = m.eqInt(V.counter2, 4)
                rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful")
                proc65()
        else:
            proc65()
        if not V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_:
            rt.log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed")
    rt.on_start(__on_start_1)
    def __on_start_2() -> None:
        proc76()
        proc76()
        proc76()
        proc76()
        proc76()
        if m.eqInt(V.counter3, 2):
            if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = m.eqInt(V.counter3, 2)
                rt.log("<flow/doN - Max Iteration flow>: Test Successful")
                proc82()
        else:
            proc82()
        if not V.TestResult_HasPassed_flow_doN_Max_Iteration_flow:
            rt.log("ERROR! <flow/doN - Max Iteration flow>: Test Failed")
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        proc88()
        proc88()
        proc88()
        if V.TestResult_flow_doN_N___0___out__never_fires:
            rt.log("<flow/doN - N = 0: [out] never fires>: Test Successful")
    rt.on_start(__on_start_3)
    def __on_start_4() -> None:
        proc102()
        proc102()
        V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262 = 3
        proc102()
        proc102()
        proc102()
        V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = m.eqInt(V.counter4, 3)
        if m.eqInt(V.counter4, 3):
            if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered correct amount")
                V.TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4
        else:
            rt.log("ERROR! <flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered {0} times from 3. This should not happened!", [V.counter4])
    rt.on_start(__on_start_4)
    def __on_start_5() -> None:
        rt.send(E["test_onStart"])
        if V.TestResult_flow_doN__out__flow and V.TestResult_HasPassed_flow_doN__out__iteration__5_ and V.TestResult_HasPassed_flow_doN__currentCount_ and V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ and V.TestResult_HasPassed_flow_doN_Max_Iteration_flow and V.TestResult_flow_doN_N___0___out__never_fires and V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_:
            rt.send(E["test_onSuccess"])
        else:
            rt.send(E["test_onFailed"])
    rt.on_start(__on_start_5)
