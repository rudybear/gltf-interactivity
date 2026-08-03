import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5: rt.float(0), TestResult_variable_interpolate_Flow__out_: rt.bool(false), TestResult_variable_interpolate_Flow__done_: rt.bool(false), TestResult_HasPassed_variable_interpolate_Value_at_50_: rt.bool(false), TestResult_variable_interpolate_Value_at_50_: rt.float(-0.0142), TestResult_HasPassed_variable_interpolate_Value_at_100_: rt.bool(false), TestResult_variable_interpolate_Value_at_100_: rt.float(-0.0142), varInterpolate_70d07005_5cf3_4096_aff1_64784e4f4a05: rt.float(0), TestResult_variable_interpolate__Err__flow__duration__1f: rt.bool(false), varInterpolate_e238c886_965c_4e31_8403_0fb87c761997: rt.float(0), TestResult_variable_interpolate__Err__flow__duration_infinite: rt.bool(false), varInterpolate_a863aca9_6cb6_4e45_8c24_98370c20b2a1: rt.float(0), TestResult_variable_interpolate__Err__flow__p1_NaN_: rt.bool(false), varInterpolate_fea34d13_336d_4b2e_89fd_2b31b1cce966: rt.float(0), TestResult_variable_interpolate__Err__flow__p2_NaN_: rt.bool(false) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 5 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const delay1 = rt.delayState();
  const delay2 = rt.delayState();
  const delay3 = rt.delayState();
  function proc59() {
    rt.log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", [V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 10]);
    V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5;
  }
  function proc30() {
    rt.log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0,1)", [V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 8.024034]);
    V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5;
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
          if (V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 === 10) {
            if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/24/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 === 10;
                rt.log("<variable/interpolate - Value at 100%>: Test Successful");
                proc59();
              }
            }
          } else {
            proc59();
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
          if (m.abs(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1) {
            if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1;
                rt.log("<variable/interpolate - Value at 50%>: Test Successful");
                proc30();
              }
            }
          } else {
            proc30();
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
    rt.send(E.test_onStart);
    function cont1() {
      if (V.TestResult_variable_interpolate_Flow__out_ && V.TestResult_HasPassed_variable_interpolate_Value_at_50_ && V.TestResult_variable_interpolate_Flow__done_ && V.TestResult_HasPassed_variable_interpolate_Value_at_100_ && V.TestResult_variable_interpolate__Err__flow__duration__1f && V.TestResult_variable_interpolate__Err__flow__duration_infinite && V.TestResult_variable_interpolate__Err__flow__p1_NaN_ && V.TestResult_variable_interpolate__Err__flow__p2_NaN_) {
        rt.send(E.test_onSuccess);
      } else {
        rt.send(E.test_onFailed);
      }
    }
    rt.setDelay(delay3, 5, cont1);
  });
});

