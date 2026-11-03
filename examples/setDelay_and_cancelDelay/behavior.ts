import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6: rt.withId("startTime_ca9af277-a001-44a7-bbd2-b3e9d2eafea6", rt.float(0)), TestResult_flow_setDelay_and_cancelDelay_Flow__done_: rt.withId("TestResult_flow/setDelay and cancelDelay_Flow [done]", rt.bool(false)), TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay: rt.withId("TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay: rt.withId("TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay", rt.float(-0.0142)), counter1: rt.withId("d90d4f49-c9e3-4a3e-9f10-06247568422b", rt.int(0)), TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_: rt.withId("TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_Flow__out_: rt.withId("TestResult_flow/setDelay and cancelDelay_Flow [out]", rt.int(-1)), TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_: rt.withId("TestResult_flow/setDelay and cancelDelay_setDelay [cancel]", rt.bool(true)), TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered: rt.withId("TestResult_flow/setDelay and cancelDelay_cancelDelay triggered", rt.bool(true)), TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_: rt.withId("TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_Flow__err_: rt.withId("TestResult_flow/setDelay and cancelDelay_Flow [err]", rt.bool(false)), TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid: rt.withId("TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid: rt.withId("TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_: rt.withId("TestResult_flow/setDelay and cancelDelay_Flow [err]\n(NaN)", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_: rt.withId("TestResult_flow/setDelay and cancelDelay_Flow [err]\n(+Inf)", rt.bool(false)), FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362: rt.withId("FlowSequenceCount_b8e69ef5-14a6-4dbe-b4e1-3335901db362", rt.int(0)), TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order: rt.withId("TestResult_flow/setDelay and cancelDelay_Concurrent delays\n[done] in time order", rt.bool(false)), counter2: rt.withId("c3ceb65a-83b0-4b71-9344-d81263979ab7", rt.int(0)), TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x: rt.withId("TestResult_HasPassed_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x: rt.withId("TestResult_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x", rt.int(-1)), TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null: rt.withId("TestResult_HasPassed_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null: rt.withId("TestResult_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays: rt.withId("TestResult_flow/setDelay and cancelDelay_[cancel] cancels all\npending delays", rt.bool(true)), TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_: rt.withId("TestResult_flow/setDelay and cancelDelay_cancelDelay null ref\nFlow [out]", rt.bool(false)), TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_: rt.withId("TestResult_flow/setDelay and cancelDelay_cancelDelay fired ref\nFlow [out]", rt.bool(false)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 2.5 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
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
  const delay13 = rt.delayState();
  const delay14 = rt.delayState();
  const delay15 = rt.delayState();
  const delay16 = rt.delayState();
  const delay17 = rt.delayState();
  const delay18 = rt.delayState();
  const delay19 = rt.delayState();
  const delay20 = rt.delayState();
  const delay21 = rt.delayState();
  const delay22 = rt.delayState();
  const delay23 = rt.delayState();
  function proc45() {
    const t1 = rt.tickTime();
    rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0.1)", [m.select(m.isNaN(t1), 0, t1) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6, 1]);
    const t2 = rt.tickTime();
    V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6;
  }
  function proc131() {
    rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { "delayRef": delay9.lastRef }, "ref").isValid, true]);
    V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { "delayRef": delay9.lastRef }, "ref").isValid;
  }
  function proc182() {
    function cont1() {
      V.counter2 = (V.counter2 + 1) | 0;
    }
    rt.setDelay(delay17, 0.3, cont1);
  }
  function proc197() {
    function cont1() {
      if (rt.ptrSet("/nodes/76/translation", "float3", [0, 0, 0.8])) {
        if (rt.ptrSet("/nodes/78/translation", "float3", [0, 0, 0])) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Flow triggered! This should not happened!");
          V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays = false;
        }
      }
    }
    rt.setDelay(delay19, 0.3, cont1);
  }
  function proc204() {
    rt.log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Value is {0}, should be {1} ", [m.refEq(delay19.lastRef, ""), true]);
    V.TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(delay19.lastRef, "");
  }
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [done]>: Flow not triggered! This should not happened!");
        }
      }
      if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Failed");
        }
      }
      if (rt.ptrSet("/nodes/6/translation", "float3", [0, 0, 0])) {
        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1 === 1;
        if (V.counter1 === 1) {
          if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
            if (rt.ptrSet("/nodes/6/translation", "float3", [0, 0, 0])) {
              rt.log("<flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered correct amount");
              V.TestResult_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1;
            }
          }
        } else {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered {0} times from 1. This should not happened!", [V.counter1]);
        }
      }
    }
    if (rt.setDelay(delay2, 2, cont1).ok) {
      const t1 = rt.tickTime();
      V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 = m.select(m.isNaN(t1), 0, t1);
      function cont2() {
        if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
            rt.log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered");
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true;
          }
        }
        if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
          const t2 = rt.tickTime();
          if (m.abs(m.select(m.isNaN(t2), 0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1) < 0.1) {
            if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
                const t3 = rt.tickTime();
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs(m.select(m.isNaN(t3), 0, t3) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1) < 0.1;
                rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful");
                proc45();
              }
            }
          } else {
            proc45();
          }
        }
      }
      if (rt.setDelay(delay1, 1, cont2).ok) {
        V.counter1 = (V.counter1 + 1) | 0;
      }
    }
  });
  rt.onTick((timeSinceStart, timeSinceLastTick) => {
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/30/translation", "float3", [0, 0, 0])) {
        if (V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_) {
          rt.log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful");
        }
      }
    }
    if (rt.setDelay(delay4, 2, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/28/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/30/translation", "float3", [0, 0, 0])) {
            rt.log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!");
            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false;
          }
        }
      }
      rt.setDelay(delay3, 1, cont2);
      rt.cancelDelaySlot(delay3);
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/36/translation", "float3", [0, 0, 0])) {
        if (V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered) {
          rt.log("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful");
        }
      }
      if (!V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_) {
        rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!");
      }
    }
    if (rt.setDelay(delay6, 2, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/34/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/36/translation", "float3", [0, 0, 0])) {
            rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!");
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false;
          }
        }
      }
      rt.setDelay(delay5, 1, cont2);
      rt.cancelDelay(delay5.lastRef);
      if (rt.ptrSet("/nodes/41/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow triggered");
        V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ = true;
      }
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_) {
        rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err]>: Flow not triggered! This should not happened!");
      }
    }
    if (rt.setDelay(delay8, 2, cont1).ok) {
      if (!rt.setDelay(delay7, -1, undefined).ok) {
        if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
          rt.log("<flow/setDelay and cancelDelay - Flow [err]>: Flow triggered");
          V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ = true;
        }
      }
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - lastDelayref isValid>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay10, 0.5, cont1).ok) {
      if (rt.setDelay(delay9, 2, undefined).ok) {
        if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
          if (rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { "delayRef": delay9.lastRef }, "ref").isValid === true) {
            if (rt.ptrSet("/nodes/47/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { "delayRef": delay9.lastRef }, "ref").isValid === true;
                rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Test Successful");
                proc131();
              }
            }
          } else {
            proc131();
          }
        }
      }
    }
  });
  rt.onStart(() => {
    if (!rt.setDelay(delay11, m.NaN(), undefined).ok) {
      if (rt.ptrSet("/nodes/53/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow triggered");
        V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ = true;
      }
    }
    if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_) {
      rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    if (!rt.setDelay(delay12, m.Inf(), undefined).ok) {
      if (rt.ptrSet("/nodes/59/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow triggered");
        V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ = true;
      }
    }
    if (!V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_) {
      rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/66/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order not triggered! This should not happened!");
        }
      }
    }
    if (rt.setDelay(delay16, 1.5, cont1).ok) {
      function cont2() {
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = (V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 + 1) | 0;
        if (V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 === 3) {
          if (rt.ptrSet("/nodes/65/translation", "float3", [0, 0, 0.8])) {
            if (rt.ptrSet("/nodes/66/translation", "float3", [0, 0, 0])) {
              rt.log("<flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order triggered");
              V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order = true;
            }
          }
        } else {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done");
          V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000;
        }
      }
      rt.setDelay(delay13, 0.6, cont2);
      function cont3() {
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = (V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 + 1) | 0;
        if (!(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 === 1)) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done");
          V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000;
        }
      }
      rt.setDelay(delay14, 0.2, cont3);
      function cont4() {
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = (V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 + 1) | 0;
        if (!(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 === 2)) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done");
          V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000;
        }
      }
      rt.setDelay(delay15, 0.4, cont4);
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/72/translation", "float3", [0, 0, 0])) {
        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2 === 3;
        if (V.counter2 === 3) {
          if (rt.ptrSet("/nodes/71/translation", "float3", [0, 0, 0.8])) {
            if (rt.ptrSet("/nodes/72/translation", "float3", [0, 0, 0])) {
              rt.log("<flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered correct amount");
              V.TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2;
            }
          }
        } else {
          rt.log("ERROR! <flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered {0} times from 3. This should not happened!", [V.counter2]);
        }
      }
    }
    if (rt.setDelay(delay18, 1, cont1).ok) {
      proc182();
      proc182();
      proc182();
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (!V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null) {
        rt.log("ERROR! <flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Failed");
      }
      if (rt.ptrSet("/nodes/78/translation", "float3", [0, 0, 0])) {
        if (V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays) {
          rt.log("<flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Test Successful");
        }
      }
    }
    if (rt.setDelay(delay20, 1, cont1).ok) {
      proc197();
      proc197();
      proc197();
      rt.cancelDelaySlot(delay19);
      if (m.refEq(delay19.lastRef, "") === true) {
        if (rt.ptrSet("/nodes/83/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(delay19.lastRef, "") === true;
          rt.log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Successful");
          proc204();
        }
      } else {
        proc204();
      }
    }
  });
  rt.onStart(() => {
    rt.cancelDelay("");
    if (rt.ptrSet("/nodes/89/translation", "float3", [0, 0, 0.8])) {
      rt.log("<flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow triggered");
      V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ = true;
    }
    if (!V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_) {
      rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/96/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_) {
          rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow not triggered! This should not happened!");
        }
      }
    }
    if (rt.setDelay(delay22, 1, cont1).ok) {
      function cont2() {
        rt.cancelDelay(delay21.lastRef);
        if (rt.ptrSet("/nodes/95/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/96/translation", "float3", [0, 0, 0])) {
            rt.log("<flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow triggered");
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ = true;
          }
        }
      }
      rt.setDelay(delay21, 0.1, cont2);
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    function cont1() {
      if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ && V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ && V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ && V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x && V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_) {
        rt.send(E.test_onSuccess);
      } else {
        rt.send(E.test_onFailed);
      }
    }
    rt.setDelay(delay23, 2.5, cont1);
  });
});

