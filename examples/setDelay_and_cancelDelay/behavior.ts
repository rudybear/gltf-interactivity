import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa: rt.float(0), TestResult_flow_setDelay_and_cancelDelay_Flow__done_: rt.bool(false), TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay: rt.bool(false), TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay: rt.float(-0.0142), counter1: rt.int(0), TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_: rt.bool(false), TestResult_flow_setDelay_and_cancelDelay_Flow__out_: rt.int(-1), TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_: rt.bool(false), TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_: rt.bool(true), TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered: rt.bool(false), TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered: rt.bool(true), TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_: rt.bool(false), TestResult_flow_setDelay_and_cancelDelay_Flow__err_: rt.bool(false), TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid: rt.bool(false), TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid: rt.bool(false) });
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
  function proc26() {
    const t1 = rt.tickTime();
    rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0,1)", [m.select(m.isNaN(t1), 0, t1) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa, 1]);
    const t2 = rt.tickTime();
    V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa;
  }
  function proc116() {
    rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { "delayRef": delay9.lastRef }, "ref").isValid, true]);
    V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { "delayRef": delay9.lastRef }, "ref").isValid;
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
      V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa = m.select(m.isNaN(t1), 0, t1);
      function cont2() {
        if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
            rt.log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered");
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true;
          }
        }
        if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
          const t2 = rt.tickTime();
          if (m.abs(m.select(m.isNaN(t2), 0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1) < 0.1) {
            if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
              if (rt.ptrSet("/nodes/18/translation", "float3", [0, 0, 0])) {
                const t3 = rt.tickTime();
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs(m.select(m.isNaN(t3), 0, t3) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1) < 0.1;
                rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful");
                proc26();
              }
            }
          } else {
            proc26();
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
        if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_) {
          rt.log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful");
        }
      }
    }
    if (rt.setDelay(delay4, 2, cont1).ok) {
      function cont2() {
        if (rt.ptrSet("/nodes/28/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/30/translation", "float3", [0, 0, 0])) {
            rt.log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!");
            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = true;
            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false;
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
        if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered) {
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
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = true;
            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false;
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
                proc116();
              }
            }
          } else {
            proc116();
          }
        }
      }
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    function cont1() {
      if (V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ && V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay && V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered && V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ && V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid) {
        rt.send(E.test_onSuccess);
      } else {
        rt.send(E.test_onFailed);
      }
    }
    rt.setDelay(delay11, 2.5, cont1);
  });
});

