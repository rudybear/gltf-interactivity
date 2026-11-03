extends RefCounted

var m
var rt
var V
var E
var delay1
var delay2
var delay3
var delay4
var delay5
var delay6
var delay7
var delay8
var delay9
var delay10
var delay11
var delay12

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4", rt.float_var(0.0), "varInterpolate_0064f30e-ce33-4580-bb57-a280c45822a4"], ["TestResult_variable_interpolate_Flow__out_", rt.bool_var(false), "TestResult_variable/interpolate_Flow [out]"], ["TestResult_variable_interpolate_Flow__done_", rt.bool_var(false), "TestResult_variable/interpolate_Flow [done]"], ["TestResult_HasPassed_variable_interpolate_Value_at_50_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Value at 50%"], ["TestResult_variable_interpolate_Value_at_50_", rt.float_var(-0.0142), "TestResult_variable/interpolate_Value at 50%"], ["TestResult_HasPassed_variable_interpolate_Value_at_100_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Value at 100%"], ["TestResult_variable_interpolate_Value_at_100_", rt.float_var(-0.0142), "TestResult_variable/interpolate_Value at 100%"], ["varInterpolate_9b751e06_4876_4626_899e_55af0fba4987", rt.float_var(0.0), "varInterpolate_9b751e06-4876-4626-899e-55af0fba4987"], ["TestResult_variable_interpolate__Err__flow__duration__1f", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (duration -1f"], ["varInterpolate_8b6755b6_f135_42d5_8a6c_a04af0b6053d", rt.float_var(0.0), "varInterpolate_8b6755b6-f135-42d5-8a6c-a04af0b6053d"], ["TestResult_variable_interpolate__Err__flow__duration_infinite", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (duration infinite"], ["varInterpolate_9ff6e551_9919_4526_83ef_e8c53fda1475", rt.float_var(0.0), "varInterpolate_9ff6e551-9919-4526-83ef-e8c53fda1475"], ["TestResult_variable_interpolate__Err__flow__p1_NaN_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p1 NaN)"], ["varInterpolate_5687b23c_c180_4e03_a078_d0eb6719fc74", rt.float_var(0.0), "varInterpolate_5687b23c-c180-4e03-a078-d0eb6719fc74"], ["TestResult_variable_interpolate__Err__flow__p2_NaN_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p2 NaN)"], ["varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5", rt.float4(0.0, 0.0, 0.0, 1.0), "varInterpolateSlerp_06a5a84a-00fd-44f9-9de5-0f706d17d1f5"], ["TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_useSlerp on float4, value at 100%"], ["TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_", rt.float4(-0.0142, -0.0142, -0.0142, 0.0), "TestResult_variable/interpolate_useSlerp on float4, value at 100%"], ["varInterpolate_a1403e18_26f5_435c_89d7_636ddf904804", rt.float_var(0.0), "varInterpolate_a1403e18-26f5-435c-89d7-636ddf904804"], ["TestResult_variable_interpolate__Err__flow__p1_x__0_1_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p1.x -0.1)"], ["varInterpolate_47f0b085_4868_48c0_b9ad_ff903acae3b4", rt.float_var(0.0), "varInterpolate_47f0b085-4868-48c0-b9ad-ff903acae3b4"], ["TestResult_variable_interpolate__Err__flow__p2_x_1_1_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p2.x 1.1)"], ["varInterpolate_87e57612_b9b9_454e_869d_cd948db1074f", rt.float_var(0.0), "varInterpolate_87e57612-b9b9-454e-869d-cd948db1074f"], ["TestResult_variable_interpolate__Err__flow__p1_y__Inf_", rt.bool_var(false), "TestResult_variable/interpolate_[Err] flow (p1.y +Inf)"], ["varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743", rt.float_var(0.0), "varInterpolateEaseIn_e018cbfe-d548-48ee-8721-56a41a3f7743"], ["TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Ease-in curve, value at 50%"], ["TestResult_variable_interpolate_Ease_in_curve__value_at_50_", rt.float_var(-0.0142), "TestResult_variable/interpolate_Ease-in curve, value at 50%"], ["varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72", rt.float_var(0.0), "varInterpolateOvershoot_a125f62d-671f-4124-ada3-38b5cdc76c72"], ["TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Overshoot curve (p1.y -1), value below start"], ["TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start", rt.float_var(-0.0142), "TestResult_variable/interpolate_Overshoot curve (p1.y -1), value below start"], ["TestResult_variable_interpolate_Overshoot_curve__no__err_", rt.bool_var(true), "TestResult_variable/interpolate_Overshoot curve: no [err]"], ["varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a", rt.float_var(0.0), "varInterpolateZeroDuration_75bfadf9-c026-4760-864d-17e316ea085a"], ["TestResult_variable_interpolate_Duration_0___done_", rt.bool_var(false), "TestResult_variable/interpolate_Duration 0: [done]"], ["TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Duration 0: value on [done]"], ["TestResult_variable_interpolate_Duration_0__value_on__done_", rt.float_var(-0.0142), "TestResult_variable/interpolate_Duration 0: value on [done]"], ["varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0", rt.float_var(0.0), "varInterpolateRetrigger_5a15b933-9137-457a-83c2-8d36dbd37cc0"], ["TestResult_variable_interpolate_Re_trigger__1st__done__not_fired", rt.bool_var(true), "TestResult_variable/interpolate_Re-trigger: 1st [done] not fired"], ["TestResult_variable_interpolate_Re_trigger__2nd__done_", rt.bool_var(false), "TestResult_variable/interpolate_Re-trigger: 2nd [done]"], ["TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_Re-trigger: 2nd target reached"], ["TestResult_variable_interpolate_Re_trigger__2nd_target_reached", rt.float_var(-0.0142), "TestResult_variable/interpolate_Re-trigger: 2nd target reached"], ["varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76", rt.float_var(0.0), "varInterpolateSetStops_2bf85a04-65eb-4335-8f06-e46d379d4b76"], ["TestResult_variable_interpolate_variable_set_stops_it___done__not_fired", rt.bool_var(true), "TestResult_variable/interpolate_variable/set stops it: [done] not fired"], ["TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value", rt.bool_var(false), "TestResult_HasPassed_variable/interpolate_variable/set stops it: keeps set value"], ["TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value", rt.float_var(-0.0142), "TestResult_variable/interpolate_variable/set stops it: keeps set value"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 5.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    delay1 = rt.delay_state()
    delay2 = rt.delay_state()
    delay3 = rt.delay_state()
    delay4 = rt.delay_state()
    delay5 = rt.delay_state()
    delay6 = rt.delay_state()
    delay7 = rt.delay_state()
    delay8 = rt.delay_state()
    delay9 = rt.delay_state()
    delay10 = rt.delay_state()
    delay11 = rt.delay_state()
    delay12 = rt.delay_state()
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
    rt.on_start(__on_start_10)
    rt.on_start(__on_start_11)
    rt.on_start(__on_start_12)
    rt.on_start(__on_start_13)
    rt.on_start(__on_start_14)

func proc91() -> void:
    rt.log_msg("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", [V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 10.0])
    V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4

func proc26() -> void:
    rt.log_msg("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0.1)", [V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 8.024034])
    V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4

func proc143() -> void:
    rt.log_msg("<variable/interpolate - useSlerp on float4, value at 100%>: Value is {0}, should be {1} (Proximity range: 0.0001)", [V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5, [0.0, 0.707106769, 0.0, 0.707106769]])
    V.TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_ = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5

func proc187() -> void:
    rt.log_msg("<variable/interpolate - Ease-in curve, value at 50%>: Value is {0}, should be {1} (Proximity range: 0.2)", [V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743, 3.15356827])
    V.TestResult_variable_interpolate_Ease_in_curve__value_at_50_ = V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743

func proc208() -> void:
    rt.log_msg("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Value is {0}, should be {1} (Proximity range: 0.2)", [V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72, -2.07104039])
    V.TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72

func proc245() -> void:
    rt.log_msg("<variable/interpolate - Duration 0: value on [done]>: Value is {0}, should be {1} ", [V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a, 3.0])
    V.TestResult_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a

func proc282() -> void:
    rt.log_msg("<variable/interpolate - Re-trigger: 2nd target reached>: Value is {0}, should be {1} ", [V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0, 20.0])
    V.TestResult_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0

func proc303() -> void:
    rt.log_msg("<variable/interpolate - variable/set stops it: keeps set value>: Value is {0}, should be {1} ", [V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76, 4.0])
    V.TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76

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
        if V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 == 10.0:
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 == 10.0
                    rt.log_msg("<variable/interpolate - Value at 100%>: Test Successful")
                    proc91()
        else:
            proc91()

func cont3() -> void:
    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
        if m.abs_(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1:
            if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs_(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1
                    rt.log_msg("<variable/interpolate - Value at 50%>: Test Successful")
                    proc26()
        else:
            proc26()

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
    if rt.set_delay(delay3, 1.5, cont4)["ok"]:
        rt.var_interp(15, [0.0, 0.707106769, 0.0, 0.707106769], 1.0, [0.25, 0.1], [0.25, 1.0], true, cont5)

func cont4() -> void:
    if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_:
            rt.log_msg("ERROR! <variable/interpolate - useSlerp on float4, value at 100%>: Test Failed")

func cont5() -> void:
    if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.0]):
        var t1 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5
        if m.length(t1) > 0.9998999 and m.abs_(m.dot(m.normalize(t1)["value"], [0.0, 0.7071068, 0.0, 0.7071068])) > 0.9999:
            if rt.ptr_set("/nodes/53/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.0]):
                    var t2 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5
                    V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ = m.length(t2) > 0.9998999 and m.abs_(m.dot(m.normalize(t2)["value"], [0.0, 0.7071068, 0.0, 0.7071068])) > 0.9999
                    rt.log_msg("<variable/interpolate - useSlerp on float4, value at 100%>: Test Successful")
                    proc143()
        else:
            proc143()

func __on_start_6() -> void:
    if not rt.var_interp(18, 14.0, 1.0, [-0.1, 0.5], [1.0, 1.0], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/77/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (p1.x -0.1)>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ = true
    if not V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (p1.x -0.1)>: Flow not triggered! This should not happened!")

func __on_start_7() -> void:
    if not rt.var_interp(20, 14.0, 1.0, [1.0, 1.0], [1.1, 0.5], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/83/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (p2.x 1.1)>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ = true
    if not V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (p2.x 1.1)>: Flow not triggered! This should not happened!")

func __on_start_8() -> void:
    if not rt.var_interp(22, 14.0, 1.0, m.combine2(0.5, m.Inf()), [1.0, 1.0], false, Callable())["ok"]:
        if rt.ptr_set("/nodes/89/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<variable/interpolate - [Err] flow (p1.y +Inf)>: Flow triggered")
            V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ = true
    if not V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_:
        rt.log_msg("ERROR! <variable/interpolate - [Err] flow (p1.y +Inf)>: Flow not triggered! This should not happened!")

func __on_start_9() -> void:
    if rt.set_delay(delay5, 4.5, cont6)["ok"]:
        rt.var_interp(24, 10.0, 4.0, [0.42, 0.0], [1.0, 1.0], false, Callable())
        rt.set_delay(delay4, 2.0, cont7)

func cont6() -> void:
    if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_:
            rt.log_msg("ERROR! <variable/interpolate - Ease-in curve, value at 50%>: Test Failed")

func cont7() -> void:
    if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.0]):
        if m.abs_(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2:
            if rt.ptr_set("/nodes/59/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ = m.abs_(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2
                    rt.log_msg("<variable/interpolate - Ease-in curve, value at 50%>: Test Successful")
                    proc187()
        else:
            proc187()

func __on_start_10() -> void:
    if rt.set_delay(delay7, 4.5, cont8)["ok"]:
        if not rt.var_interp(27, 10.0, 4.0, [0.5, -1.0], [0.5, 2.0], false, Callable())["ok"]:
            if rt.ptr_set("/nodes/70/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log_msg("ERROR! <variable/interpolate - Overshoot curve: no [err]>: Flow triggered! This should not happened!")
                V.TestResult_variable_interpolate_Overshoot_curve__no__err_ = false
        rt.set_delay(delay6, 0.76, cont9)

func cont8() -> void:
    if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start:
            rt.log_msg("ERROR! <variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Failed")
    if V.TestResult_variable_interpolate_Overshoot_curve__no__err_:
        rt.log_msg("<variable/interpolate - Overshoot curve: no [err]>: Test Successful")

func cont9() -> void:
    if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
        if m.abs_(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2:
            if rt.ptr_set("/nodes/65/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = m.abs_(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2
                    rt.log_msg("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Successful")
                    proc208()
        else:
            proc208()

func __on_start_11() -> void:
    if rt.set_delay(delay8, 1.0, cont10)["ok"]:
        rt.var_interp(31, 3.0, 0.0, [0.25, 0.1], [0.25, 1.0], false, cont11)

func cont10() -> void:
    if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_variable_interpolate_Duration_0___done_:
            rt.log_msg("ERROR! <variable/interpolate - Duration 0: [done]>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/102/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_:
            rt.log_msg("ERROR! <variable/interpolate - Duration 0: value on [done]>: Test Failed")

func cont11() -> void:
    if rt.ptr_set("/nodes/95/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<variable/interpolate - Duration 0: [done]>: Flow triggered")
            V.TestResult_variable_interpolate_Duration_0___done_ = true
    if rt.ptr_set("/nodes/102/translation", "float3", [0.0, 0.0, 0.0]):
        if V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a == 3.0:
            if rt.ptr_set("/nodes/101/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/102/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a == 3.0
                    rt.log_msg("<variable/interpolate - Duration 0: value on [done]>: Test Successful")
                    proc245()
        else:
            proc245()

func __on_start_12() -> void:
    if rt.set_delay(delay9, 2.0, cont12)["ok"]:
        rt.var_interp(35, 10.0, 1.0, [0.25, 0.1], [0.25, 1.0], false, cont13)
        rt.var_interp(35, 20.0, 1.0, [0.25, 0.1], [0.25, 1.0], false, cont14)

func cont12() -> void:
    if rt.ptr_set("/nodes/108/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired:
            rt.log_msg("<variable/interpolate - Re-trigger: 1st [done] not fired>: Test Successful")
    if rt.ptr_set("/nodes/114/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_variable_interpolate_Re_trigger__2nd__done_:
            rt.log_msg("ERROR! <variable/interpolate - Re-trigger: 2nd [done]>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/120/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached:
            rt.log_msg("ERROR! <variable/interpolate - Re-trigger: 2nd target reached>: Test Failed")

func cont13() -> void:
    if rt.ptr_set("/nodes/106/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/108/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <variable/interpolate - Re-trigger: 1st [done] not fired>: Flow triggered! This should not happened!")
            V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired = false

func cont14() -> void:
    if rt.ptr_set("/nodes/113/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/114/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<variable/interpolate - Re-trigger: 2nd [done]>: Flow triggered")
            V.TestResult_variable_interpolate_Re_trigger__2nd__done_ = true
    if rt.ptr_set("/nodes/120/translation", "float3", [0.0, 0.0, 0.0]):
        if V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 == 20.0:
            if rt.ptr_set("/nodes/119/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/120/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 == 20.0
                    rt.log_msg("<variable/interpolate - Re-trigger: 2nd target reached>: Test Successful")
                    proc282()
        else:
            proc282()

func __on_start_13() -> void:
    if rt.set_delay(delay11, 2.0, cont15)["ok"]:
        rt.var_interp(40, 10.0, 1.0, [0.25, 0.1], [0.25, 1.0], false, cont16)
        V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 = 4.0
        rt.set_delay(delay10, 1.5, cont17)

func cont15() -> void:
    if rt.ptr_set("/nodes/126/translation", "float3", [0.0, 0.0, 0.0]):
        if V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired:
            rt.log_msg("<variable/interpolate - variable/set stops it: [done] not fired>: Test Successful")
    if rt.ptr_set("/nodes/132/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value:
            rt.log_msg("ERROR! <variable/interpolate - variable/set stops it: keeps set value>: Test Failed")

func cont16() -> void:
    if rt.ptr_set("/nodes/124/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/126/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("ERROR! <variable/interpolate - variable/set stops it: [done] not fired>: Flow triggered! This should not happened!")
            V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired = false

func cont17() -> void:
    if rt.ptr_set("/nodes/132/translation", "float3", [0.0, 0.0, 0.0]):
        if V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 == 4.0:
            if rt.ptr_set("/nodes/131/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/132/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 == 4.0
                    rt.log_msg("<variable/interpolate - variable/set stops it: keeps set value>: Test Successful")
                    proc303()
        else:
            proc303()

func __on_start_14() -> void:
    rt.send(E["test_onStart"])
    rt.set_delay(delay12, 5.0, cont18)

func cont18() -> void:
    if V.TestResult_variable_interpolate_Flow__out_ and V.TestResult_HasPassed_variable_interpolate_Value_at_50_ and V.TestResult_variable_interpolate_Flow__done_ and V.TestResult_HasPassed_variable_interpolate_Value_at_100_ and V.TestResult_variable_interpolate__Err__flow__duration__1f and V.TestResult_variable_interpolate__Err__flow__duration_infinite and V.TestResult_variable_interpolate__Err__flow__p1_NaN_ and V.TestResult_variable_interpolate__Err__flow__p2_NaN_ and V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ and V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ and V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start and V.TestResult_variable_interpolate_Overshoot_curve__no__err_ and V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ and V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ and V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ and V.TestResult_variable_interpolate_Duration_0___done_ and V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ and V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired and V.TestResult_variable_interpolate_Re_trigger__2nd__done_ and V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached and V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired and V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

