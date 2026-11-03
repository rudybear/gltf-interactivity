import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4": rt.with_id("varInterpolate_0064f30e-ce33-4580-bb57-a280c45822a4", rt.float_(0.0)), "TestResult_variable_interpolate_Flow__out_": rt.with_id("TestResult_variable/interpolate_Flow [out]", rt.bool_(False)), "TestResult_variable_interpolate_Flow__done_": rt.with_id("TestResult_variable/interpolate_Flow [done]", rt.bool_(False)), "TestResult_HasPassed_variable_interpolate_Value_at_50_": rt.with_id("TestResult_HasPassed_variable/interpolate_Value at 50%", rt.bool_(False)), "TestResult_variable_interpolate_Value_at_50_": rt.with_id("TestResult_variable/interpolate_Value at 50%", rt.float_(-0.0142)), "TestResult_HasPassed_variable_interpolate_Value_at_100_": rt.with_id("TestResult_HasPassed_variable/interpolate_Value at 100%", rt.bool_(False)), "TestResult_variable_interpolate_Value_at_100_": rt.with_id("TestResult_variable/interpolate_Value at 100%", rt.float_(-0.0142)), "varInterpolate_9b751e06_4876_4626_899e_55af0fba4987": rt.with_id("varInterpolate_9b751e06-4876-4626-899e-55af0fba4987", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__duration__1f": rt.with_id("TestResult_variable/interpolate_[Err] flow (duration -1f", rt.bool_(False)), "varInterpolate_8b6755b6_f135_42d5_8a6c_a04af0b6053d": rt.with_id("varInterpolate_8b6755b6-f135-42d5-8a6c-a04af0b6053d", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__duration_infinite": rt.with_id("TestResult_variable/interpolate_[Err] flow (duration infinite", rt.bool_(False)), "varInterpolate_9ff6e551_9919_4526_83ef_e8c53fda1475": rt.with_id("varInterpolate_9ff6e551-9919-4526-83ef-e8c53fda1475", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__p1_NaN_": rt.with_id("TestResult_variable/interpolate_[Err] flow (p1 NaN)", rt.bool_(False)), "varInterpolate_5687b23c_c180_4e03_a078_d0eb6719fc74": rt.with_id("varInterpolate_5687b23c-c180-4e03-a078-d0eb6719fc74", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__p2_NaN_": rt.with_id("TestResult_variable/interpolate_[Err] flow (p2 NaN)", rt.bool_(False)), "varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5": rt.with_id("varInterpolateSlerp_06a5a84a-00fd-44f9-9de5-0f706d17d1f5", rt.float4(0.0, 0.0, 0.0, 1.0)), "TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_": rt.with_id("TestResult_HasPassed_variable/interpolate_useSlerp on float4, value at 100%", rt.bool_(False)), "TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_": rt.with_id("TestResult_variable/interpolate_useSlerp on float4, value at 100%", rt.float4(-0.0142, -0.0142, -0.0142, 0.0)), "varInterpolate_a1403e18_26f5_435c_89d7_636ddf904804": rt.with_id("varInterpolate_a1403e18-26f5-435c-89d7-636ddf904804", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__p1_x__0_1_": rt.with_id("TestResult_variable/interpolate_[Err] flow (p1.x -0.1)", rt.bool_(False)), "varInterpolate_47f0b085_4868_48c0_b9ad_ff903acae3b4": rt.with_id("varInterpolate_47f0b085-4868-48c0-b9ad-ff903acae3b4", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__p2_x_1_1_": rt.with_id("TestResult_variable/interpolate_[Err] flow (p2.x 1.1)", rt.bool_(False)), "varInterpolate_87e57612_b9b9_454e_869d_cd948db1074f": rt.with_id("varInterpolate_87e57612-b9b9-454e-869d-cd948db1074f", rt.float_(0.0)), "TestResult_variable_interpolate__Err__flow__p1_y__Inf_": rt.with_id("TestResult_variable/interpolate_[Err] flow (p1.y +Inf)", rt.bool_(False)), "varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743": rt.with_id("varInterpolateEaseIn_e018cbfe-d548-48ee-8721-56a41a3f7743", rt.float_(0.0)), "TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_": rt.with_id("TestResult_HasPassed_variable/interpolate_Ease-in curve, value at 50%", rt.bool_(False)), "TestResult_variable_interpolate_Ease_in_curve__value_at_50_": rt.with_id("TestResult_variable/interpolate_Ease-in curve, value at 50%", rt.float_(-0.0142)), "varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72": rt.with_id("varInterpolateOvershoot_a125f62d-671f-4124-ada3-38b5cdc76c72", rt.float_(0.0)), "TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start": rt.with_id("TestResult_HasPassed_variable/interpolate_Overshoot curve (p1.y -1), value below start", rt.bool_(False)), "TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start": rt.with_id("TestResult_variable/interpolate_Overshoot curve (p1.y -1), value below start", rt.float_(-0.0142)), "TestResult_variable_interpolate_Overshoot_curve__no__err_": rt.with_id("TestResult_variable/interpolate_Overshoot curve: no [err]", rt.bool_(True)), "varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a": rt.with_id("varInterpolateZeroDuration_75bfadf9-c026-4760-864d-17e316ea085a", rt.float_(0.0)), "TestResult_variable_interpolate_Duration_0___done_": rt.with_id("TestResult_variable/interpolate_Duration 0: [done]", rt.bool_(False)), "TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_": rt.with_id("TestResult_HasPassed_variable/interpolate_Duration 0: value on [done]", rt.bool_(False)), "TestResult_variable_interpolate_Duration_0__value_on__done_": rt.with_id("TestResult_variable/interpolate_Duration 0: value on [done]", rt.float_(-0.0142)), "varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0": rt.with_id("varInterpolateRetrigger_5a15b933-9137-457a-83c2-8d36dbd37cc0", rt.float_(0.0)), "TestResult_variable_interpolate_Re_trigger__1st__done__not_fired": rt.with_id("TestResult_variable/interpolate_Re-trigger: 1st [done] not fired", rt.bool_(True)), "TestResult_variable_interpolate_Re_trigger__2nd__done_": rt.with_id("TestResult_variable/interpolate_Re-trigger: 2nd [done]", rt.bool_(False)), "TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached": rt.with_id("TestResult_HasPassed_variable/interpolate_Re-trigger: 2nd target reached", rt.bool_(False)), "TestResult_variable_interpolate_Re_trigger__2nd_target_reached": rt.with_id("TestResult_variable/interpolate_Re-trigger: 2nd target reached", rt.float_(-0.0142)), "varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76": rt.with_id("varInterpolateSetStops_2bf85a04-65eb-4335-8f06-e46d379d4b76", rt.float_(0.0)), "TestResult_variable_interpolate_variable_set_stops_it___done__not_fired": rt.with_id("TestResult_variable/interpolate_variable/set stops it: [done] not fired", rt.bool_(True)), "TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value": rt.with_id("TestResult_HasPassed_variable/interpolate_variable/set stops it: keeps set value", rt.bool_(False)), "TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value": rt.with_id("TestResult_variable/interpolate_variable/set stops it: keeps set value", rt.float_(-0.0142))})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 5.0}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
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
    S.delay12 = rt.delay_state()
    def proc91() -> None:
        rt.log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", [V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 10.0])
        V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4
    def proc26() -> None:
        rt.log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0.1)", [V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 8.024034])
        V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4
    def proc143() -> None:
        rt.log("<variable/interpolate - useSlerp on float4, value at 100%>: Value is {0}, should be {1} (Proximity range: 0.0001)", [V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5, [0.0, 0.707106769, 0.0, 0.707106769]])
        V.TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_ = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5
    def proc187() -> None:
        rt.log("<variable/interpolate - Ease-in curve, value at 50%>: Value is {0}, should be {1} (Proximity range: 0.2)", [V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743, 3.15356827])
        V.TestResult_variable_interpolate_Ease_in_curve__value_at_50_ = V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743
    def proc208() -> None:
        rt.log("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Value is {0}, should be {1} (Proximity range: 0.2)", [V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72, -2.07104039])
        V.TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72
    def proc245() -> None:
        rt.log("<variable/interpolate - Duration 0: value on [done]>: Value is {0}, should be {1} ", [V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a, 3.0])
        V.TestResult_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a
    def proc282() -> None:
        rt.log("<variable/interpolate - Re-trigger: 2nd target reached>: Value is {0}, should be {1} ", [V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0, 20.0])
        V.TestResult_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0
    def proc303() -> None:
        rt.log("<variable/interpolate - variable/set stops it: keeps set value>: Value is {0}, should be {1} ", [V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76, 4.0])
        V.TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76
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
                    if V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 == 10.0:
                        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/24/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 == 10.0
                                rt.log("<variable/interpolate - Value at 100%>: Test Successful")
                                proc91()
                    else:
                        proc91()
            if rt.var_interp(0, 10.0, 4.0, [0.25, 0.1], [0.25, 1.0], False, cont2)["ok"]:
                if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                    rt.log("<variable/interpolate - Flow [out]>: Flow triggered")
                    V.TestResult_variable_interpolate_Flow__out_ = True
            def cont3() -> None:
                if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                    if m.abs_(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1:
                        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs_(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1
                                rt.log("<variable/interpolate - Value at 50%>: Test Successful")
                                proc26()
                    else:
                        proc26()
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
        def cont1() -> None:
            if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_:
                    rt.log("ERROR! <variable/interpolate - useSlerp on float4, value at 100%>: Test Failed")
        if rt.set_delay(S.delay3, 1.5, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.0]):
                    t1 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5
                    if m.length(t1) > 0.9998999 and m.abs_(m.dot(m.normalize(t1)["value"], [0.0, 0.7071068, 0.0, 0.7071068])) > 0.9999:
                        if rt.ptr_set("/nodes/53/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.0]):
                                t2 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5
                                V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ = m.length(t2) > 0.9998999 and m.abs_(m.dot(m.normalize(t2)["value"], [0.0, 0.7071068, 0.0, 0.7071068])) > 0.9999
                                rt.log("<variable/interpolate - useSlerp on float4, value at 100%>: Test Successful")
                                proc143()
                    else:
                        proc143()
            rt.var_interp(15, [0.0, 0.707106769, 0.0, 0.707106769], 1.0, [0.25, 0.1], [0.25, 1.0], True, cont2)
    rt.on_start(__on_start_5)
    def __on_start_6() -> None:
        if not rt.var_interp(18, 14.0, 1.0, [-0.1, 0.5], [1.0, 1.0], False, None)["ok"]:
            if rt.ptr_set("/nodes/77/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (p1.x -0.1)>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ = True
        if not V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_:
            rt.log("ERROR! <variable/interpolate - [Err] flow (p1.x -0.1)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_6)
    def __on_start_7() -> None:
        if not rt.var_interp(20, 14.0, 1.0, [1.0, 1.0], [1.1, 0.5], False, None)["ok"]:
            if rt.ptr_set("/nodes/83/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (p2.x 1.1)>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ = True
        if not V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_:
            rt.log("ERROR! <variable/interpolate - [Err] flow (p2.x 1.1)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_7)
    def __on_start_8() -> None:
        if not rt.var_interp(22, 14.0, 1.0, m.combine2(0.5, m.Inf()), [1.0, 1.0], False, None)["ok"]:
            if rt.ptr_set("/nodes/89/translation", "float3", [0.0, 0.0, 0.8]):
                rt.log("<variable/interpolate - [Err] flow (p1.y +Inf)>: Flow triggered")
                V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ = True
        if not V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_:
            rt.log("ERROR! <variable/interpolate - [Err] flow (p1.y +Inf)>: Flow not triggered! This should not happened!")
    rt.on_start(__on_start_8)
    def __on_start_9() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_:
                    rt.log("ERROR! <variable/interpolate - Ease-in curve, value at 50%>: Test Failed")
        if rt.set_delay(S.delay5, 4.5, cont1)["ok"]:
            rt.var_interp(24, 10.0, 4.0, [0.42, 0.0], [1.0, 1.0], False, None)
            def cont2() -> None:
                if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.0]):
                    if m.abs_(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2:
                        if rt.ptr_set("/nodes/59/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/60/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ = m.abs_(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2
                                rt.log("<variable/interpolate - Ease-in curve, value at 50%>: Test Successful")
                                proc187()
                    else:
                        proc187()
            rt.set_delay(S.delay4, 2.0, cont2)
    rt.on_start(__on_start_9)
    def __on_start_10() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start:
                    rt.log("ERROR! <variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Failed")
            if V.TestResult_variable_interpolate_Overshoot_curve__no__err_:
                rt.log("<variable/interpolate - Overshoot curve: no [err]>: Test Successful")
        if rt.set_delay(S.delay7, 4.5, cont1)["ok"]:
            if not rt.var_interp(27, 10.0, 4.0, [0.5, -1.0], [0.5, 2.0], False, None)["ok"]:
                if rt.ptr_set("/nodes/70/translation", "float3", [0.0, 0.0, 0.8]):
                    rt.log("ERROR! <variable/interpolate - Overshoot curve: no [err]>: Flow triggered! This should not happened!")
                    V.TestResult_variable_interpolate_Overshoot_curve__no__err_ = False
            def cont2() -> None:
                if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                    if m.abs_(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2:
                        if rt.ptr_set("/nodes/65/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/66/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = m.abs_(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2
                                rt.log("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Successful")
                                proc208()
                    else:
                        proc208()
            rt.set_delay(S.delay6, 0.76, cont2)
    rt.on_start(__on_start_10)
    def __on_start_11() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_variable_interpolate_Duration_0___done_:
                    rt.log("ERROR! <variable/interpolate - Duration 0: [done]>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/102/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_:
                    rt.log("ERROR! <variable/interpolate - Duration 0: value on [done]>: Test Failed")
        if rt.set_delay(S.delay8, 1.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/95/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/96/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<variable/interpolate - Duration 0: [done]>: Flow triggered")
                        V.TestResult_variable_interpolate_Duration_0___done_ = True
                if rt.ptr_set("/nodes/102/translation", "float3", [0.0, 0.0, 0.0]):
                    if V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a == 3.0:
                        if rt.ptr_set("/nodes/101/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/102/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a == 3.0
                                rt.log("<variable/interpolate - Duration 0: value on [done]>: Test Successful")
                                proc245()
                    else:
                        proc245()
            rt.var_interp(31, 3.0, 0.0, [0.25, 0.1], [0.25, 1.0], False, cont2)
    rt.on_start(__on_start_11)
    def __on_start_12() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/108/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired:
                    rt.log("<variable/interpolate - Re-trigger: 1st [done] not fired>: Test Successful")
            if rt.ptr_set("/nodes/114/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_variable_interpolate_Re_trigger__2nd__done_:
                    rt.log("ERROR! <variable/interpolate - Re-trigger: 2nd [done]>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/120/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached:
                    rt.log("ERROR! <variable/interpolate - Re-trigger: 2nd target reached>: Test Failed")
        if rt.set_delay(S.delay9, 2.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/106/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/108/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("ERROR! <variable/interpolate - Re-trigger: 1st [done] not fired>: Flow triggered! This should not happened!")
                        V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired = False
            rt.var_interp(35, 10.0, 1.0, [0.25, 0.1], [0.25, 1.0], False, cont2)
            def cont3() -> None:
                if rt.ptr_set("/nodes/113/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/114/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("<variable/interpolate - Re-trigger: 2nd [done]>: Flow triggered")
                        V.TestResult_variable_interpolate_Re_trigger__2nd__done_ = True
                if rt.ptr_set("/nodes/120/translation", "float3", [0.0, 0.0, 0.0]):
                    if V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 == 20.0:
                        if rt.ptr_set("/nodes/119/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/120/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 == 20.0
                                rt.log("<variable/interpolate - Re-trigger: 2nd target reached>: Test Successful")
                                proc282()
                    else:
                        proc282()
            rt.var_interp(35, 20.0, 1.0, [0.25, 0.1], [0.25, 1.0], False, cont3)
    rt.on_start(__on_start_12)
    def __on_start_13() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/126/translation", "float3", [0.0, 0.0, 0.0]):
                if V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired:
                    rt.log("<variable/interpolate - variable/set stops it: [done] not fired>: Test Successful")
            if rt.ptr_set("/nodes/132/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value:
                    rt.log("ERROR! <variable/interpolate - variable/set stops it: keeps set value>: Test Failed")
        if rt.set_delay(S.delay11, 2.0, cont1)["ok"]:
            def cont2() -> None:
                if rt.ptr_set("/nodes/124/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/126/translation", "float3", [0.0, 0.0, 0.0]):
                        rt.log("ERROR! <variable/interpolate - variable/set stops it: [done] not fired>: Flow triggered! This should not happened!")
                        V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired = False
            rt.var_interp(40, 10.0, 1.0, [0.25, 0.1], [0.25, 1.0], False, cont2)
            V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 = 4.0
            def cont3() -> None:
                if rt.ptr_set("/nodes/132/translation", "float3", [0.0, 0.0, 0.0]):
                    if V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 == 4.0:
                        if rt.ptr_set("/nodes/131/translation", "float3", [0.0, 0.0, 0.8]):
                            if rt.ptr_set("/nodes/132/translation", "float3", [0.0, 0.0, 0.0]):
                                V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 == 4.0
                                rt.log("<variable/interpolate - variable/set stops it: keeps set value>: Test Successful")
                                proc303()
                    else:
                        proc303()
            rt.set_delay(S.delay10, 1.5, cont3)
    rt.on_start(__on_start_13)
    def __on_start_14() -> None:
        rt.send(E["test_onStart"])
        def cont1() -> None:
            if V.TestResult_variable_interpolate_Flow__out_ and V.TestResult_HasPassed_variable_interpolate_Value_at_50_ and V.TestResult_variable_interpolate_Flow__done_ and V.TestResult_HasPassed_variable_interpolate_Value_at_100_ and V.TestResult_variable_interpolate__Err__flow__duration__1f and V.TestResult_variable_interpolate__Err__flow__duration_infinite and V.TestResult_variable_interpolate__Err__flow__p1_NaN_ and V.TestResult_variable_interpolate__Err__flow__p2_NaN_ and V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ and V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ and V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start and V.TestResult_variable_interpolate_Overshoot_curve__no__err_ and V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ and V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ and V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ and V.TestResult_variable_interpolate_Duration_0___done_ and V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ and V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired and V.TestResult_variable_interpolate_Re_trigger__2nd__done_ and V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached and V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired and V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value:
                rt.send(E["test_onSuccess"])
            else:
                rt.send(E["test_onFailed"])
        rt.set_delay(S.delay12, 5.0, cont1)
    rt.on_start(__on_start_14)
