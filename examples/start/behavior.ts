import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b: rt.int(0), TestResult_animation_start__out__fired_right_after__in_: rt.bool(false), TestResult_HasPassed_animation_start_Position_at_50_: rt.bool(false), TestResult_animation_start_Position_at_50_: rt.float3(-0.0142, -0.0142, -0.0142), TestResult_animation_start_Flow__done_: rt.bool(false), TestResult_HasPassed_animation_start_Position_at_100_: rt.bool(false), TestResult_animation_start_Position_at_100_: rt.float3(-0.0142, -0.0142, -0.0142), TestResult_animation_start__err__flow__speed__1_: rt.bool(false), TestResult_animation_start__err__flow__speed_0_: rt.bool(false), TestResult_animation_start__err__flow__speed_NaN_: rt.bool(false), TestResult_animation_start__err__flow__speed__Inf_: rt.bool(false), TestResult_animation_start__err__flow__startTime_NaN_: rt.bool(false), TestResult_animation_start__err__flow__startTime__Inf_: rt.bool(false), TestResult_animation_start__err__flow__endTime_NaN_: rt.bool(false), TestResult_animation_start__err__flow__invalid_ref_: rt.bool(false) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 3.5 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const delay1 = rt.delayState();
  const delay2 = rt.delayState();
  const delay3 = rt.delayState();
  function proc87() {
    rt.log("<animation/start - Position at 100%>: Value is {0}, should be {1} (Proximity range: 0,01)", [rt.ptrGet("/nodes/3/translation", "float3").value, [-1, 2, 3]]);
    V.TestResult_animation_start_Position_at_100_ = rt.ptrGet("/nodes/3/translation", "float3").value;
  }
  function proc35() {
    rt.log("<animation/start - Position at 50%>: Value is {0}, should be {1} (Proximity range: 0,3)", [rt.ptrGet("/nodes/3/translation", "float3").value, [-0.5, 1, 1.5]]);
    V.TestResult_animation_start_Position_at_50_ = rt.ptrGet("/nodes/3/translation", "float3").value;
  }
  rt.onStart(() => {
    function cont1() {
      if (!V.TestResult_animation_start__out__fired_right_after__in_) {
        rt.log("ERROR! <animation/start - [out] fired right after [in]>: Correct flow order not triggered! This should not happened!");
      }
      if (rt.ptrSet("/nodes/13/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_animation_start_Position_at_50_) {
          rt.log("ERROR! <animation/start - Position at 50%>: Test Failed");
        }
      }
      if (rt.ptrSet("/nodes/19/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_animation_start_Flow__done_) {
          rt.log("ERROR! <animation/start - Flow [done]>: Flow not triggered! This should not happened!");
        }
      }
      if (rt.ptrSet("/nodes/25/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_animation_start_Position_at_100_) {
          rt.log("ERROR! <animation/start - Position at 100%>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay2, 3, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/19/translation", "float3", [0, 0, 0])) {
            rt.log("<animation/start - Flow [done]>: Flow triggered");
            V.TestResult_animation_start_Flow__done_ = true;
          }
        }
        if (rt.ptrSet("/nodes/25/translation", "float3", [0, 0, 0])) {
          const t1 = rt.ptrGet("/nodes/3/translation", "float3").value;
          if (m.length(t1) > 3.73165751 && m.dot(m.normalize(t1).value, [-0.267261237, 0.5345225, 0.8017837]) > 0.99) {
            if (rt.ptrSet("/nodes/24/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/25/translation", "float3", [0, 0, 0])) {
                const t2 = rt.ptrGet("/nodes/3/translation", "float3").value;
                V.TestResult_HasPassed_animation_start_Position_at_100_ = m.length(t2) > 3.73165751 && m.dot(m.normalize(t2).value, [-0.267261237, 0.5345225, 0.8017837]) > 0.99;
                rt.log("<animation/start - Position at 100%>: Test Successful");
                proc87();
              }
            }
          } else {
            proc87();
          }
        }
      }
      if (rt.animStart("/animations/0", 0, 2, 1, cont2).ok) {
        V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = (V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b + 1) | 0;
        if (!(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b === 1)) {
          rt.log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: out");
          V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000;
        }
      }
      V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = (V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b + 1) | 0;
      if (V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b === 2) {
        if (rt.ptrSet("/nodes/6/translation", "float3", [0, 0, 0.8])) {
          rt.log("<animation/start - [out] fired right after [in]>: Correct flow order triggered");
          V.TestResult_animation_start__out__fired_right_after__in_ = true;
        }
      } else {
        rt.log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: 1");
        V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000;
      }
      function cont3() {
        if (rt.ptrSet("/nodes/13/translation", "float3", [0, 0, 0])) {
          const t3 = rt.ptrGet("/nodes/3/translation", "float3").value;
          if (m.length(t3) > 1.57082868 && m.dot(m.normalize(t3).value, [-0.267261237, 0.5345225, 0.8017837]) > 0.7) {
            if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/13/translation", "float3", [0, 0, 0])) {
                const t4 = rt.ptrGet("/nodes/3/translation", "float3").value;
                V.TestResult_HasPassed_animation_start_Position_at_50_ = m.length(t4) > 1.57082868 && m.dot(m.normalize(t4).value, [-0.267261237, 0.5345225, 0.8017837]) > 0.7;
                rt.log("<animation/start - Position at 50%>: Test Successful");
                proc35();
              }
            }
          } else {
            proc35();
          }
        }
      }
      rt.setDelay(delay1, 1, cont3);
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", 0, 2, -1, undefined).ok) {
      if (rt.ptrSet("/nodes/30/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (speed -1)>: Flow triggered");
        V.TestResult_animation_start__err__flow__speed__1_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__speed__1_) {
      rt.log("ERROR! <animation/start - [err] flow (speed -1)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", 0, 2, 0, undefined).ok) {
      if (rt.ptrSet("/nodes/36/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (speed 0)>: Flow triggered");
        V.TestResult_animation_start__err__flow__speed_0_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__speed_0_) {
      rt.log("ERROR! <animation/start - [err] flow (speed 0)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", 0, 2, m.NaN(), undefined).ok) {
      if (rt.ptrSet("/nodes/42/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (speed NaN)>: Flow triggered");
        V.TestResult_animation_start__err__flow__speed_NaN_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__speed_NaN_) {
      rt.log("ERROR! <animation/start - [err] flow (speed NaN)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", 0, 2, m.Inf(), undefined).ok) {
      if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (speed +Inf)>: Flow triggered");
        V.TestResult_animation_start__err__flow__speed__Inf_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__speed__Inf_) {
      rt.log("ERROR! <animation/start - [err] flow (speed +Inf)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", m.NaN(), 2, 1, undefined).ok) {
      if (rt.ptrSet("/nodes/54/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (startTime NaN)>: Flow triggered");
        V.TestResult_animation_start__err__flow__startTime_NaN_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__startTime_NaN_) {
      rt.log("ERROR! <animation/start - [err] flow (startTime NaN)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", m.Inf(), 2, 1, undefined).ok) {
      if (rt.ptrSet("/nodes/60/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (startTime +Inf)>: Flow triggered");
        V.TestResult_animation_start__err__flow__startTime__Inf_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__startTime__Inf_) {
      rt.log("ERROR! <animation/start - [err] flow (startTime +Inf)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/0", 0, m.NaN(), 1, undefined).ok) {
      if (rt.ptrSet("/nodes/66/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (endTime NaN)>: Flow triggered");
        V.TestResult_animation_start__err__flow__endTime_NaN_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__endTime_NaN_) {
      rt.log("ERROR! <animation/start - [err] flow (endTime NaN)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.animStart("/animations/1000", 0, 2, 1, undefined).ok) {
      if (rt.ptrSet("/nodes/72/translation", "float3", [0, 0, 0.8])) {
        rt.log("<animation/start - [err] flow (invalid ref)>: Flow triggered");
        V.TestResult_animation_start__err__flow__invalid_ref_ = true;
      }
    }
    if (!V.TestResult_animation_start__err__flow__invalid_ref_) {
      rt.log("ERROR! <animation/start - [err] flow (invalid ref)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    function cont1() {
      if (V.TestResult_animation_start__out__fired_right_after__in_ && V.TestResult_HasPassed_animation_start_Position_at_50_ && V.TestResult_animation_start_Flow__done_ && V.TestResult_HasPassed_animation_start_Position_at_100_ && V.TestResult_animation_start__err__flow__speed__1_ && V.TestResult_animation_start__err__flow__speed_0_ && V.TestResult_animation_start__err__flow__speed_NaN_ && V.TestResult_animation_start__err__flow__speed__Inf_ && V.TestResult_animation_start__err__flow__startTime_NaN_ && V.TestResult_animation_start__err__flow__startTime__Inf_ && V.TestResult_animation_start__err__flow__endTime_NaN_ && V.TestResult_animation_start__err__flow__invalid_ref_) {
        rt.send(E.test_onSuccess);
      } else {
        rt.send(E.test_onFailed);
      }
    }
    rt.setDelay(delay3, 3.5, cont1);
  });
});

