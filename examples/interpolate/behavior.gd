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
    V = rt.vars([["varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5", rt.float_var(0.0), "varInterpolate_14f3dfe8-bfe3-4e24-b44c-4d23611e2ac5"], ["TestResult_variable_interpolate_Flow__out_", rt.bool_var(false), "TestResult_variable/interpolate_Flow [out]"], ["TestResult_variable_interpolate_Flow__done_", rt.bool_var(false), "TestResult_variable/interpolate_Flow [done]"], ["TestResult_HasPassed_variable_interpolate_Value_at_50_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Value at 50%"], ["TestResult_variable_interpolate_Value_at_50_", rt.float_var(-0.0142), "TestResult_variable/interpolate_Value at 50%"], ["TestResult_HasPassed_variable_interpolate_Value_at_100_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Value at 100%"], ["TestResult_variable_interpolate_Value_at_100_", rt.float_var(-0.0142), "TestResult_variable/interpolate_Value at 100%"], ["varInterpolate_70d07005_5cf3_4096_aff1_64784e4f4a05", rt.float_var(0.0), "varInterpolate_70d07005-5cf3-4096-aff1-64784e4f4a05"], ["TestResult_variable_interpolate__Err__flow__duration__1f", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (duration -1f"], ["varInterpolate_e238c886_965c_4e31_8403_0fb87c761997", rt.float_var(0.0), "varInterpolate_e238c886-965c-4e31-8403-0fb87c761997"], ["TestResult_variable_interpolate__Err__flow__duration_infinite", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (duration infinite"], ["varInterpolate_a863aca9_6cb6_4e45_8c24_98370c20b2a1", rt.float_var(0.0), "varInterpolate_a863aca9-6cb6-4e45-8c24-98370c20b2a1"], ["TestResult_variable_interpolate__Err__flow__p1_NaN_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p1 NaN)"], ["varInterpolate_fea34d13_336d_4b2e_89fd_2b31b1cce966", rt.float_var(0.0), "varInterpolate_fea34d13-336d-4b2e-89fd-2b31b1cce966"], ["TestResult_variable_interpolate__Err__flow__p2_NaN_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p2 NaN)"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 5.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    delay1 = rt.delay_state()
    delay2 = rt.delay_state()
    delay3 = rt.delay_state()
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)

func proc59() -> void:
    rt.log_msg("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", [V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 10.0])
    V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5

func proc30() -> void:
    rt.log_msg("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0,1)", [V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 8.024034])
    V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5

func __on_start_0() -> void:
    if rt.set_delay(delay2, 4.5, cont1)["ok"]:
        if rt.var_interp(0, 10.0, 4.0, [0.25, 0.1], [0.25, 1.0], false, cont2)["ok"]:
            if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("<variable/interpolate - Flow [out]>: Flow triggered")
                V.TestResult_variable_interpolate_Flow__out_ = true
        rt.set_delay(delay1, 2.0, cont3)

func cont1() -> void:
    if not V.TestResult_variable_interpolate_Flow__out_:
        rt.log_msg("ERROR! <variable/interpolate - Flow [out]>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_variable_interpolate_Flow__done_:
            rt.log_msg("ERROR! <variable/interpolate - Flow [done]>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_Value_at_50_:
            rt.log_msg("ERROR! <variable/interpolate - Value at 50%>: Test Failed")
    if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_Value_at_100_:
            rt.log_msg("ERROR! <variable/interpolate - Value at 100%>: Test Failed")

func cont2() -> void:
    if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/18/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<variable/interpolate - Flow [done]>: Flow triggered")
            V.TestResult_variable_interpolate_Flow__done_ = true
    if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
        if V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0:
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0
                    rt.log_msg("<variable/interpolate - Value at 100%>: Test Successful")
                    proc59()
        else:
            proc59()

func cont3() -> void:
    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
        if m.abs_(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1:
            if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs_(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1
                    rt.log_msg("<variable/interpolate - Value at 50%>: Test Successful")
                    proc30()
        else:
            proc30()

func __on_start_1() -> void:
    if not rt.var_interp(7, 14.0, -1.0, [1.0, 1.0], [1.0, 1.0], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (duration -1f>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__duration__1f = true
    if not V.TestResult_variable_interpolate__Err__flow__duration__1f:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (duration -1f>: Flow not triggered! This should not happened!")

func __on_start_2() -> void:
    if not rt.var_interp(9, 14.0, m.Inf(), [1.0, 1.0], [1.0, 1.0], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/35/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (duration infinite>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__duration_infinite = true
    if not V.TestResult_variable_interpolate__Err__flow__duration_infinite:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (duration infinite>: Flow not triggered! This should not happened!")

func __on_start_3() -> void:
    if not rt.var_interp(11, 14.0, 1.0, [NAN, NAN], [1.0, 1.0], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (p1 NaN)>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__p1_NaN_ = true
    if not V.TestResult_variable_interpolate__Err__flow__p1_NaN_:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (p1 NaN)>: Flow not triggered! This should not happened!")

func __on_start_4() -> void:
    if not rt.var_interp(13, 14.0, 1.0, [1.0, 1.0], [NAN, NAN], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (p2 NaN)>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__p2_NaN_ = true
    if not V.TestResult_variable_interpolate__Err__flow__p2_NaN_:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (p2 NaN)>: Flow not triggered! This should not happened!")

func __on_start_5() -> void:
    rt.send(E["test_onStart"])
    rt.set_delay(delay3, 5.0, cont4)

func cont4() -> void:
    if V.TestResult_variable_interpolate_Flow__out_ and V.TestResult_HasPassed_variable_interpolate_Value_at_50_ and V.TestResult_variable_interpolate_Flow__done_ and V.TestResult_HasPassed_variable_interpolate_Value_at_100_ and V.TestResult_variable_interpolate__Err__flow__duration__1f and V.TestResult_variable_interpolate__Err__flow__duration_infinite and V.TestResult_variable_interpolate__Err__flow__p1_NaN_ and V.TestResult_variable_interpolate__Err__flow__p2_NaN_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

