import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4: rt.withId("varInterpolate_0064f30e-ce33-4580-bb57-a280c45822a4", rt.float(0)), TestResult_variable_interpolate_Flow__out_: rt.withId("TestResult_variable/interpolate_Flow [out]", rt.bool(false)), TestResult_variable_interpolate_Flow__done_: rt.withId("TestResult_variable/interpolate_Flow [done]", rt.bool(false)), TestResult_HasPassed_variable_interpolate_Value_at_50_: rt.withId("TestResult_HasPassed_variable/interpolate_Value at 50%", rt.bool(false)), TestResult_variable_interpolate_Value_at_50_: rt.withId("TestResult_variable/interpolate_Value at 50%", rt.float(-0.0142)), TestResult_HasPassed_variable_interpolate_Value_at_100_: rt.withId("TestResult_HasPassed_variable/interpolate_Value at 100%", rt.bool(false)), TestResult_variable_interpolate_Value_at_100_: rt.withId("TestResult_variable/interpolate_Value at 100%", rt.float(-0.0142)), varInterpolate_9b751e06_4876_4626_899e_55af0fba4987: rt.withId("varInterpolate_9b751e06-4876-4626-899e-55af0fba4987", rt.float(0)), TestResult_variable_interpolate__Err__flow__duration__1f: rt.withId("TestResult_variable/interpolate_[Err] flow (duration -1f", rt.bool(false)), varInterpolate_8b6755b6_f135_42d5_8a6c_a04af0b6053d: rt.withId("varInterpolate_8b6755b6-f135-42d5-8a6c-a04af0b6053d", rt.float(0)), TestResult_variable_interpolate__Err__flow__duration_infinite: rt.withId("TestResult_variable/interpolate_[Err] flow (duration infinite", rt.bool(false)), varInterpolate_9ff6e551_9919_4526_83ef_e8c53fda1475: rt.withId("varInterpolate_9ff6e551-9919-4526-83ef-e8c53fda1475", rt.float(0)), TestResult_variable_interpolate__Err__flow__p1_NaN_: rt.withId("TestResult_variable/interpolate_[Err] flow (p1 NaN)", rt.bool(false)), varInterpolate_5687b23c_c180_4e03_a078_d0eb6719fc74: rt.withId("varInterpolate_5687b23c-c180-4e03-a078-d0eb6719fc74", rt.float(0)), TestResult_variable_interpolate__Err__flow__p2_NaN_: rt.withId("TestResult_variable/interpolate_[Err] flow (p2 NaN)", rt.bool(false)), varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5: rt.withId("varInterpolateSlerp_06a5a84a-00fd-44f9-9de5-0f706d17d1f5", rt.float4(0, 0, 0, 1)), TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_: rt.withId("TestResult_HasPassed_variable/interpolate_useSlerp on float4, value at 100%", rt.bool(false)), TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_: rt.withId("TestResult_variable/interpolate_useSlerp on float4, value at 100%", rt.float4(-0.0142, -0.0142, -0.0142, 0)), varInterpolate_a1403e18_26f5_435c_89d7_636ddf904804: rt.withId("varInterpolate_a1403e18-26f5-435c-89d7-636ddf904804", rt.float(0)), TestResult_variable_interpolate__Err__flow__p1_x__0_1_: rt.withId("TestResult_variable/interpolate_[Err] flow (p1.x -0.1)", rt.bool(false)), varInterpolate_47f0b085_4868_48c0_b9ad_ff903acae3b4: rt.withId("varInterpolate_47f0b085-4868-48c0-b9ad-ff903acae3b4", rt.float(0)), TestResult_variable_interpolate__Err__flow__p2_x_1_1_: rt.withId("TestResult_variable/interpolate_[Err] flow (p2.x 1.1)", rt.bool(false)), varInterpolate_87e57612_b9b9_454e_869d_cd948db1074f: rt.withId("varInterpolate_87e57612-b9b9-454e-869d-cd948db1074f", rt.float(0)), TestResult_variable_interpolate__Err__flow__p1_y__Inf_: rt.withId("TestResult_variable/interpolate_[Err] flow (p1.y +Inf)", rt.bool(false)), varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743: rt.withId("varInterpolateEaseIn_e018cbfe-d548-48ee-8721-56a41a3f7743", rt.float(0)), TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_: rt.withId("TestResult_HasPassed_variable/interpolate_Ease-in curve, value at 50%", rt.bool(false)), TestResult_variable_interpolate_Ease_in_curve__value_at_50_: rt.withId("TestResult_variable/interpolate_Ease-in curve, value at 50%", rt.float(-0.0142)), varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72: rt.withId("varInterpolateOvershoot_a125f62d-671f-4124-ada3-38b5cdc76c72", rt.float(0)), TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start: rt.withId("TestResult_HasPassed_variable/interpolate_Overshoot curve (p1.y -1), value below start", rt.bool(false)), TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start: rt.withId("TestResult_variable/interpolate_Overshoot curve (p1.y -1), value below start", rt.float(-0.0142)), TestResult_variable_interpolate_Overshoot_curve__no__err_: rt.withId("TestResult_variable/interpolate_Overshoot curve: no [err]", rt.bool(true)), varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a: rt.withId("varInterpolateZeroDuration_75bfadf9-c026-4760-864d-17e316ea085a", rt.float(0)), TestResult_variable_interpolate_Duration_0___done_: rt.withId("TestResult_variable/interpolate_Duration 0: [done]", rt.bool(false)), TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_: rt.withId("TestResult_HasPassed_variable/interpolate_Duration 0: value on [done]", rt.bool(false)), TestResult_variable_interpolate_Duration_0__value_on__done_: rt.withId("TestResult_variable/interpolate_Duration 0: value on [done]", rt.float(-0.0142)), varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0: rt.withId("varInterpolateRetrigger_5a15b933-9137-457a-83c2-8d36dbd37cc0", rt.float(0)), TestResult_variable_interpolate_Re_trigger__1st__done__not_fired: rt.withId("TestResult_variable/interpolate_Re-trigger: 1st [done] not fired", rt.bool(true)), TestResult_variable_interpolate_Re_trigger__2nd__done_: rt.withId("TestResult_variable/interpolate_Re-trigger: 2nd [done]", rt.bool(false)), TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached: rt.withId("TestResult_HasPassed_variable/interpolate_Re-trigger: 2nd target reached", rt.bool(false)), TestResult_variable_interpolate_Re_trigger__2nd_target_reached: rt.withId("TestResult_variable/interpolate_Re-trigger: 2nd target reached", rt.float(-0.0142)), varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76: rt.withId("varInterpolateSetStops_2bf85a04-65eb-4335-8f06-e46d379d4b76", rt.float(0)), TestResult_variable_interpolate_variable_set_stops_it___done__not_fired: rt.withId("TestResult_variable/interpolate_variable/set stops it: [done] not fired", rt.bool(true)), TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value: rt.withId("TestResult_HasPassed_variable/interpolate_variable/set stops it: keeps set value", rt.bool(false)), TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value: rt.withId("TestResult_variable/interpolate_variable/set stops it: keeps set value", rt.float(-0.0142)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 5 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const delay1 = rt.delayState();
  const delay2 = rt.delayState();
  const delay3 = rt.delayState();
  const delay4 = rt.delayState();
  const delay5 = rt.delayState();
  const delay6 = rt.delayState();
  const delay7 = rt.delayState();
  const delay8 = rt.delayState();
  const delay9 = rt.delayState();
  const delay10 = rt.delayState();
  const delay11 = rt.delayState();
  const delay12 = rt.delayState();
  function proc91() {
    rt.log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", [V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 10]);
    V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4;
  }
  function proc26() {
    rt.log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0.1)", [V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4, 8.024034]);
    V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4;
  }
  function proc143() {
    rt.log("<variable/interpolate - useSlerp on float4, value at 100%>: Value is {0}, should be {1} (Proximity range: 0.0001)", [V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5, [0, 0.707106769, 0, 0.707106769]]);
    V.TestResult_variable_interpolate_useSlerp_on_float4__value_at_100_ = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5;
  }
  function proc187() {
    rt.log("<variable/interpolate - Ease-in curve, value at 50%>: Value is {0}, should be {1} (Proximity range: 0.2)", [V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743, 3.15356827]);
    V.TestResult_variable_interpolate_Ease_in_curve__value_at_50_ = V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743;
  }
  function proc208() {
    rt.log("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Value is {0}, should be {1} (Proximity range: 0.2)", [V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72, -2.07104039]);
    V.TestResult_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72;
  }
  function proc245() {
    rt.log("<variable/interpolate - Duration 0: value on [done]>: Value is {0}, should be {1} ", [V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a, 3]);
    V.TestResult_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a;
  }
  function proc282() {
    rt.log("<variable/interpolate - Re-trigger: 2nd target reached>: Value is {0}, should be {1} ", [V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0, 20]);
    V.TestResult_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0;
  }
  function proc303() {
    rt.log("<variable/interpolate - variable/set stops it: keeps set value>: Value is {0}, should be {1} ", [V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76, 4]);
    V.TestResult_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76;
  }
  rt.onStart(() => {
    function cont1() {
      if (!V.TestResult_variable_interpolate_Flow__out_) {
        rt.log("ERROR! <variable/interpolate - Flow [out]>: Flow not triggered! This should not happened!");
      }
      if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_variable_interpolate_Flow__done_) {
          rt.log("ERROR! <variable/interpolate - Flow [done]>: Flow not triggered! This should not happened!");
        }
      }
      if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_Value_at_50_) {
          rt.log("ERROR! <variable/interpolate - Value at 50%>: Test Failed");
        }
      }
      if (rt.ptrSet("/nodes/24/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_Value_at_100_) {
          rt.log("ERROR! <variable/interpolate - Value at 100%>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay2, 4.5, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
            rt.log("<variable/interpolate - Flow [done]>: Flow triggered");
            V.TestResult_variable_interpolate_Flow__done_ = true;
          }
        }
        if (rt.ptrSet("/nodes/24/translation", "float3", [0, 0, 0])) {
          if (V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 === 10) {
            if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/24/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 === 10;
                rt.log("<variable/interpolate - Value at 100%>: Test Successful");
                proc91();
              }
            }
          } else {
            proc91();
          }
        }
      }
      if (rt.varInterp(0, 10, 4, [0.25, 0.1], [0.25, 1], false, cont2).ok) {
        if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
          rt.log("<variable/interpolate - Flow [out]>: Flow triggered");
          V.TestResult_variable_interpolate_Flow__out_ = true;
        }
      }
      function cont3() {
        if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
          if (m.abs(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1) {
            if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs(V.varInterpolate_0064f30e_ce33_4580_bb57_a280c45822a4 - 8.024034) < 0.1;
                rt.log("<variable/interpolate - Value at 50%>: Test Successful");
                proc26();
              }
            }
          } else {
            proc26();
          }
        }
      }
      rt.setDelay(delay1, 2, cont3);
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(7, 14, -1, [1, 1], [1, 1], false, undefined).ok) {
      if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (duration -1f>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__duration__1f = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__duration__1f) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (duration -1f>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(9, 14, m.Inf(), [1, 1], [1, 1], false, undefined).ok) {
      if (rt.ptrSet("/nodes/35/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (duration infinite>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__duration_infinite = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__duration_infinite) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (duration infinite>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(11, 14, 1, [NaN, NaN], [1, 1], false, undefined).ok) {
      if (rt.ptrSet("/nodes/41/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (p1 NaN)>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__p1_NaN_ = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__p1_NaN_) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (p1 NaN)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(13, 14, 1, [1, 1], [NaN, NaN], false, undefined).ok) {
      if (rt.ptrSet("/nodes/47/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (p2 NaN)>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__p2_NaN_ = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__p2_NaN_) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (p2 NaN)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/54/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_) {
          rt.log("ERROR! <variable/interpolate - useSlerp on float4, value at 100%>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay3, 1.5, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/54/translation", "float3", [0, 0, 0])) {
          const t1 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5;
          if (m.length(t1) > 0.9998999 && m.abs(m.dot(m.normalize(t1).value, [0, 0.7071068, 0, 0.7071068])) > 0.9999) {
            if (rt.ptrSet("/nodes/53/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/54/translation", "float3", [0, 0, 0])) {
                const t2 = V.varInterpolateSlerp_06a5a84a_00fd_44f9_9de5_0f706d17d1f5;
                V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ = m.length(t2) > 0.9998999 && m.abs(m.dot(m.normalize(t2).value, [0, 0.7071068, 0, 0.7071068])) > 0.9999;
                rt.log("<variable/interpolate - useSlerp on float4, value at 100%>: Test Successful");
                proc143();
              }
            }
          } else {
            proc143();
          }
        }
      }
      rt.varInterp(15, [0, 0.707106769, 0, 0.707106769], 1, [0.25, 0.1], [0.25, 1], true, cont2);
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(18, 14, 1, [-0.1, 0.5], [1, 1], false, undefined).ok) {
      if (rt.ptrSet("/nodes/77/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (p1.x -0.1)>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (p1.x -0.1)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(20, 14, 1, [1, 1], [1.1, 0.5], false, undefined).ok) {
      if (rt.ptrSet("/nodes/83/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (p2.x 1.1)>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (p2.x 1.1)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.varInterp(22, 14, 1, m.combine2(0.5, m.Inf()), [1, 1], false, undefined).ok) {
      if (rt.ptrSet("/nodes/89/translation", "float3", [0, 0, 0.8])) {
        rt.log("<variable/interpolate - [Err] flow (p1.y +Inf)>: Flow triggered");
        V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ = true;
      }
    }
    if (!V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_) {
      rt.log("ERROR! <variable/interpolate - [Err] flow (p1.y +Inf)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/60/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_) {
          rt.log("ERROR! <variable/interpolate - Ease-in curve, value at 50%>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay5, 4.5, cont1).ok) {
      rt.varInterp(24, 10, 4, [0.42, 0], [1, 1], false, undefined);
      function cont2() {
        if (rt.ptrSet("/nodes/60/translation", "float3", [0, 0, 0])) {
          if (m.abs(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2) {
            if (rt.ptrSet("/nodes/59/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/60/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ = m.abs(V.varInterpolateEaseIn_e018cbfe_d548_48ee_8721_56a41a3f7743 - 3.15356827) < 0.2;
                rt.log("<variable/interpolate - Ease-in curve, value at 50%>: Test Successful");
                proc187();
              }
            }
          } else {
            proc187();
          }
        }
      }
      rt.setDelay(delay4, 2, cont2);
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/66/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start) {
          rt.log("ERROR! <variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Failed");
        }
      }
      if (V.TestResult_variable_interpolate_Overshoot_curve__no__err_) {
        rt.log("<variable/interpolate - Overshoot curve: no [err]>: Test Successful");
      }
    }
    if (rt.setDelay(delay7, 4.5, cont1).ok) {
      if (!rt.varInterp(27, 10, 4, [0.5, -1], [0.5, 2], false, undefined).ok) {
        if (rt.ptrSet("/nodes/70/translation", "float3", [0, 0, 0.8])) {
          rt.log("ERROR! <variable/interpolate - Overshoot curve: no [err]>: Flow triggered! This should not happened!");
          V.TestResult_variable_interpolate_Overshoot_curve__no__err_ = false;
        }
      }
      function cont2() {
        if (rt.ptrSet("/nodes/66/translation", "float3", [0, 0, 0])) {
          if (m.abs(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2) {
            if (rt.ptrSet("/nodes/65/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/66/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start = m.abs(V.varInterpolateOvershoot_a125f62d_671f_4124_ada3_38b5cdc76c72 - -2.07104039) < 0.2;
                rt.log("<variable/interpolate - Overshoot curve (p1.y -1), value below start>: Test Successful");
                proc208();
              }
            }
          } else {
            proc208();
          }
        }
      }
      rt.setDelay(delay6, 0.76, cont2);
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/96/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_variable_interpolate_Duration_0___done_) {
          rt.log("ERROR! <variable/interpolate - Duration 0: [done]>: Flow not triggered! This should not happened!");
        }
      }
      if (rt.ptrSet("/nodes/102/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_) {
          rt.log("ERROR! <variable/interpolate - Duration 0: value on [done]>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay8, 1, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/95/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/96/translation", "float3", [0, 0, 0])) {
            rt.log("<variable/interpolate - Duration 0: [done]>: Flow triggered");
            V.TestResult_variable_interpolate_Duration_0___done_ = true;
          }
        }
        if (rt.ptrSet("/nodes/102/translation", "float3", [0, 0, 0])) {
          if (V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a === 3) {
            if (rt.ptrSet("/nodes/101/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/102/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ = V.varInterpolateZeroDuration_75bfadf9_c026_4760_864d_17e316ea085a === 3;
                rt.log("<variable/interpolate - Duration 0: value on [done]>: Test Successful");
                proc245();
              }
            }
          } else {
            proc245();
          }
        }
      }
      rt.varInterp(31, 3, 0, [0.25, 0.1], [0.25, 1], false, cont2);
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/108/translation", "float3", [0, 0, 0])) {
        if (V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired) {
          rt.log("<variable/interpolate - Re-trigger: 1st [done] not fired>: Test Successful");
        }
      }
      if (rt.ptrSet("/nodes/114/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_variable_interpolate_Re_trigger__2nd__done_) {
          rt.log("ERROR! <variable/interpolate - Re-trigger: 2nd [done]>: Flow not triggered! This should not happened!");
        }
      }
      if (rt.ptrSet("/nodes/120/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached) {
          rt.log("ERROR! <variable/interpolate - Re-trigger: 2nd target reached>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay9, 2, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/106/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/108/translation", "float3", [0, 0, 0])) {
            rt.log("ERROR! <variable/interpolate - Re-trigger: 1st [done] not fired>: Flow triggered! This should not happened!");
            V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired = false;
          }
        }
      }
      rt.varInterp(35, 10, 1, [0.25, 0.1], [0.25, 1], false, cont2);
      function cont3() {
        if (rt.ptrSet("/nodes/113/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/114/translation", "float3", [0, 0, 0])) {
            rt.log("<variable/interpolate - Re-trigger: 2nd [done]>: Flow triggered");
            V.TestResult_variable_interpolate_Re_trigger__2nd__done_ = true;
          }
        }
        if (rt.ptrSet("/nodes/120/translation", "float3", [0, 0, 0])) {
          if (V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 === 20) {
            if (rt.ptrSet("/nodes/119/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/120/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached = V.varInterpolateRetrigger_5a15b933_9137_457a_83c2_8d36dbd37cc0 === 20;
                rt.log("<variable/interpolate - Re-trigger: 2nd target reached>: Test Successful");
                proc282();
              }
            }
          } else {
            proc282();
          }
        }
      }
      rt.varInterp(35, 20, 1, [0.25, 0.1], [0.25, 1], false, cont3);
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/126/translation", "float3", [0, 0, 0])) {
        if (V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired) {
          rt.log("<variable/interpolate - variable/set stops it: [done] not fired>: Test Successful");
        }
      }
      if (rt.ptrSet("/nodes/132/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value) {
          rt.log("ERROR! <variable/interpolate - variable/set stops it: keeps set value>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay11, 2, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/124/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/126/translation", "float3", [0, 0, 0])) {
            rt.log("ERROR! <variable/interpolate - variable/set stops it: [done] not fired>: Flow triggered! This should not happened!");
            V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired = false;
          }
        }
      }
      rt.varInterp(40, 10, 1, [0.25, 0.1], [0.25, 1], false, cont2);
      V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 = 4;
      function cont3() {
        if (rt.ptrSet("/nodes/132/translation", "float3", [0, 0, 0])) {
          if (V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 === 4) {
            if (rt.ptrSet("/nodes/131/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/132/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value = V.varInterpolateSetStops_2bf85a04_65eb_4335_8f06_e46d379d4b76 === 4;
                rt.log("<variable/interpolate - variable/set stops it: keeps set value>: Test Successful");
                proc303();
              }
            }
          } else {
            proc303();
          }
        }
      }
      rt.setDelay(delay10, 1.5, cont3);
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    function cont1() {
      if (V.TestResult_variable_interpolate_Flow__out_ && V.TestResult_HasPassed_variable_interpolate_Value_at_50_ && V.TestResult_variable_interpolate_Flow__done_ && V.TestResult_HasPassed_variable_interpolate_Value_at_100_ && V.TestResult_variable_interpolate__Err__flow__duration__1f && V.TestResult_variable_interpolate__Err__flow__duration_infinite && V.TestResult_variable_interpolate__Err__flow__p1_NaN_ && V.TestResult_variable_interpolate__Err__flow__p2_NaN_ && V.TestResult_HasPassed_variable_interpolate_useSlerp_on_float4__value_at_100_ && V.TestResult_HasPassed_variable_interpolate_Ease_in_curve__value_at_50_ && V.TestResult_HasPassed_variable_interpolate_Overshoot_curve__p1_y__1___value_below_start && V.TestResult_variable_interpolate_Overshoot_curve__no__err_ && V.TestResult_variable_interpolate__Err__flow__p1_x__0_1_ && V.TestResult_variable_interpolate__Err__flow__p2_x_1_1_ && V.TestResult_variable_interpolate__Err__flow__p1_y__Inf_ && V.TestResult_variable_interpolate_Duration_0___done_ && V.TestResult_HasPassed_variable_interpolate_Duration_0__value_on__done_ && V.TestResult_variable_interpolate_Re_trigger__1st__done__not_fired && V.TestResult_variable_interpolate_Re_trigger__2nd__done_ && V.TestResult_HasPassed_variable_interpolate_Re_trigger__2nd_target_reached && V.TestResult_variable_interpolate_variable_set_stops_it___done__not_fired && V.TestResult_HasPassed_variable_interpolate_variable_set_stops_it__keeps_set_value) {
        rt.send(E.test_onSuccess);
      } else {
        rt.send(E.test_onFailed);
      }
    }
    rt.setDelay(delay12, 5, cont1);
  });
});

