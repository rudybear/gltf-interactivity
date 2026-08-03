import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"counter1": rt.int_(0), "TestResult_flow_doN__out__flow": rt.bool_(False), "TestResult_HasPassed_flow_doN__out__iteration__5_": rt.bool_(False), "TestResult_flow_doN__out__iteration__5_": rt.int_(-1), "TestResult_HasPassed_flow_doN__currentCount_": rt.bool_(False), "TestResult_flow_doN__currentCount_": rt.int_(-1), "counter2": rt.int_(0), "TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_": rt.bool_(False), "TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_": rt.int_(-1), "counter3": rt.int_(0), "TestResult_HasPassed_flow_doN_Max_Iteration_flow": rt.bool_(False), "TestResult_flow_doN_Max_Iteration_flow": rt.int_(-1)})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 0.0}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.doN1 = rt.do_n_state()
    S.doN2 = rt.do_n_state()
    S.doN3 = rt.do_n_state()
    def proc0() -> None:
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
                        proc19()
                else:
                    proc19()
                if m.eqInt(S.doN1["count"], 5):
                    if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                        V.TestResult_HasPassed_flow_doN__currentCount_ = m.eqInt(S.doN1["count"], 5)
                        rt.log("<flow/doN - [currentCount]>: Test Successful")
                        proc30()
                else:
                    proc30()
    def proc19() -> None:
        rt.log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", [V.counter1, 5])
        V.TestResult_flow_doN__out__iteration__5_ = V.counter1
    def proc30() -> None:
        rt.log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", [S.doN1["count"], 5])
        V.TestResult_flow_doN__currentCount_ = S.doN1["count"]
    def proc49() -> None:
        if rt.do_n(S.doN2, 2):
            V.counter2 = m.addInt(V.counter2, 1)
    def proc57() -> None:
        rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", [V.counter2, 4])
        V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2
    def proc66() -> None:
        if rt.do_n(S.doN3, 2):
            V.counter3 = m.addInt(V.counter3, 1)
    def proc74() -> None:
        rt.log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", [V.counter3, 2])
        V.TestResult_flow_doN_Max_Iteration_flow = V.counter3
    def __on_start_0() -> None:
        proc0()
        proc0()
        proc0()
        proc0()
        proc0()
        if not V.TestResult_flow_doN__out__flow:
            rt.log("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!")
        if not V.TestResult_HasPassed_flow_doN__out__iteration__5_:
            rt.log("ERROR! <flow/doN - [out] iteration (5)>: Test Failed")
        if not V.TestResult_HasPassed_flow_doN__currentCount_:
            rt.log("ERROR! <flow/doN - [currentCount]>: Test Failed")
    rt.on_start(__on_start_0)
    def __on_start_1() -> None:
        proc49()
        proc49()
        proc49()
        S.doN2["count"] = 0.0
        proc49()
        proc49()
        if m.eqInt(V.counter2, 4):
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = m.eqInt(V.counter2, 4)
                rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful")
                proc57()
        else:
            proc57()
        if not V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_:
            rt.log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed")
    rt.on_start(__on_start_1)
    def __on_start_2() -> None:
        proc66()
        proc66()
        proc66()
        proc66()
        proc66()
        if m.eqInt(V.counter3, 2):
            if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = m.eqInt(V.counter3, 2)
                rt.log("<flow/doN - Max Iteration flow>: Test Successful")
                proc74()
        else:
            proc74()
        if not V.TestResult_HasPassed_flow_doN_Max_Iteration_flow:
            rt.log("ERROR! <flow/doN - Max Iteration flow>: Test Failed")
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        rt.send(E["test_onStart"])
        if V.TestResult_flow_doN__out__flow and V.TestResult_HasPassed_flow_doN__out__iteration__5_ and V.TestResult_HasPassed_flow_doN__currentCount_ and V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ and V.TestResult_HasPassed_flow_doN_Max_Iteration_flow:
            rt.send(E["test_onSuccess"])
        else:
            rt.send(E["test_onFailed"])
    rt.on_start(__on_start_3)
