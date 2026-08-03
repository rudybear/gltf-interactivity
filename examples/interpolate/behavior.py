import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5": rt.float_(0.0), "TestResult_variable_interpolate_Flow__out_": rt.bool_(False), "TestResult_variable_interpolate_Flow__done_": rt.bool_(False), "TestResult_HasPassed_variable_interpolate_Value_at_50_": rt.bool_(False), "TestResult_variable_interpolate_Value_at_50_": rt.float_(-0.0142), "TestResult_HasPassed_variable_interpolate_Value_at_100_": rt.bool_(False), "TestResult_variable_interpolate_Value_at_100_": rt.float_(-0.0142), "varInterpolate_70d07005_5cf3_4096_aff1_64784e4f4a05": rt.float_(0.0), "TestResult_variable_interpolate__Err__flow__duration__1f": rt.bool_(False), "varInterpolate_e238c886_965c_4e31_8403_0fb87c761997": rt.float_(0.0), "TestResult_variable_interpolate__Err__flow__duration_infinite": rt.bool_(False), "varInterpolate_a863aca9_6cb6_4e45_8c24_98370c20b2a1": rt.float_(0.0), "TestResult_variable_interpolate__Err__flow__p1_NaN_": rt.bool_(False), "varInterpolate_fea34d13_336d_4b2e_89fd_2b31b1cce966": rt.float_(0.0), "TestResult_variable_interpolate__Err__flow__p2_NaN_": rt.bool_(False)})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 5.0}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.delay1 = rt.delay_state()
    S.delay2 = rt.delay_state()
    S.delay3 = rt.delay_state()
    def proc59() -> None:
        rt.log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", [V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 10.0])
        V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5
    def proc30() -> None:
        rt.log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0,1)", [V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 8.024034])
        V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5
    def __on_start_0() -> None:
        def cont1() -> None:
            if not V.TestResult_variable_interpolate_Flow__out_:
                rt.log("ERROR! <variable/interpolate - Flow [out]>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_variable_interpolate_Flow__done_:
                    rt.log("ERROR! <variable/interpolate - Flow [done]>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_Value_at_50_:
                    rt.log("ERROR! <variable/interpolate - Value at 50%>: Test Failed")
            if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_Value_at_100_:
                    rt.log("ERROR! <variable/interpolate - Value at 100%>: Test Failed")
        if rt.set_delay(S.delay2, 4.5, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<variable/interpolate - Flow [done]>: Flow triggered")
                        V.TestResult_variable_interpolate_Flow__done_ = True
                if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
                    if V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0:
                        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0
                                rt.log("<variable/interpolate - Value at 100%>: Test Successful")
                                proc59()
                    else:
                        proc59()
            if rt.var_interp(0, 10.0, 4.0, [0.25, 0.1], [0.25, 1.0], False, cont2)["ok"]:
                if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                    rt.log("<variable/interpolate - Flow [out]>: Flow triggered")
                    V.TestResult_variable_interpolate_Flow__out_ = True
            def cont3() -> None:
                if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                    if m.abs_(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1:
                        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs_(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1
                                rt.log("<variable/interpolate - Value at 50%>: Test Successful")
                                proc30()
                    else:
                        proc30()
            rt.set_delay(S.delay1, 2.0, cont3)
    rt.on_start(__on_start_0)
    def __on_start_1() -> None:
        if not rt.var_interp(7, 14.0, -1.0, [1.0, 1.0], [1.0, 1.0], False, None)["ok"]:
            if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (duration -1f>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__duration__1f = True
        if not V.TestResult_variable_interpolate__Err__flow__duration__1f:
            rt.log("ERROR! <variable/interpolate - [Err] flow (duration -1f>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_1)
    def __on_start_2() -> None:
        if not rt.var_interp(9, 14.0, m.Inf(), [1.0, 1.0], [1.0, 1.0], False, None)["ok"]:
            if rt.ptr_set("/nodes/35/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (duration infinite>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__duration_infinite = True
        if not V.TestResult_variable_interpolate__Err__flow__duration_infinite:
            rt.log("ERROR! <variable/interpolate - [Err] flow (duration infinite>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        if not rt.var_interp(11, 14.0, 1.0, [float("nan"), float("nan")], [1.0, 1.0], False, None)["ok"]:
            if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (p1 NaN)>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__p1_NaN_ = True
        if not V.TestResult_variable_interpolate__Err__flow__p1_NaN_:
            rt.log("ERROR! <variable/interpolate - [Err] flow (p1 NaN)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_3)
    def __on_start_4() -> None:
        if not rt.var_interp(13, 14.0, 1.0, [1.0, 1.0], [float("nan"), float("nan")], False, None)["ok"]:
            if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (p2 NaN)>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__p2_NaN_ = True
        if not V.TestResult_variable_interpolate__Err__flow__p2_NaN_:
            rt.log("ERROR! <variable/interpolate - [Err] flow (p2 NaN)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_4)
    def __on_start_5() -> None:
        rt.send(E["test_onStart"])
        def cont1() -> None:
            if V.TestResult_variable_interpolate_Flow__out_ and V.TestResult_HasPassed_variable_interpolate_Value_at_50_ and V.TestResult_variable_interpolate_Flow__done_ and V.TestResult_HasPassed_variable_interpolate_Value_at_100_ and V.TestResult_variable_interpolate__Err__flow__duration__1f and V.TestResult_variable_interpolate__Err__flow__duration_infinite and V.TestResult_variable_interpolate__Err__flow__p1_NaN_ and V.TestResult_variable_interpolate__Err__flow__p2_NaN_:
                rt.send(E["test_onSuccess"])
            else:
                rt.send(E["test_onFailed"])
        rt.set_delay(S.delay3, 5.0, cont1)
    rt.on_start(__on_start_5)
