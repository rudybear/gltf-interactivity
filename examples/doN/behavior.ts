import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ counter1: rt.withId("467a7f10-2a70-49b0-ac90-a045449a37e9", rt.int(0)), TestResult_flow_doN__out__flow: rt.withId("TestResult_flow/doN_[out] flow", rt.bool(false)), TestResult_HasPassed_flow_doN__out__iteration__5_: rt.withId("TestResult_HasPassed_flow/doN_[out] iteration (5)", rt.bool(false)), TestResult_flow_doN__out__iteration__5_: rt.withId("TestResult_flow/doN_[out] iteration (5)", rt.int(-1)), TestResult_HasPassed_flow_doN__currentCount_: rt.withId("TestResult_HasPassed_flow/doN_[currentCount]", rt.bool(false)), TestResult_flow_doN__currentCount_: rt.withId("TestResult_flow/doN_[currentCount]", rt.int(-1)), counter2: rt.withId("8043697e-0ae2-4500-a1c9-9d9ff12a4a79", rt.int(0)), TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_: rt.withId("TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)", rt.bool(false)), TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_: rt.withId("TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)", rt.int(-1)), counter3: rt.withId("983a7860-0d44-41f1-abea-9a2ed508a47a", rt.int(0)), TestResult_HasPassed_flow_doN_Max_Iteration_flow: rt.withId("TestResult_HasPassed_flow/doN_Max Iteration flow", rt.bool(false)), TestResult_flow_doN_Max_Iteration_flow: rt.withId("TestResult_flow/doN_Max Iteration flow", rt.int(-1)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const doN1 = rt.doNState();
  const doN2 = rt.doNState();
  const doN3 = rt.doNState();
  function proc0() {
    if (rt.doN(doN1, 5)) {
      V.counter1 = (V.counter1 + 1) | 0;
      if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/doN - [out] flow>: Flow triggered");
        V.TestResult_flow_doN__out__flow = true;
      }
      if (V.counter1 === 5) {
        if (V.counter1 === 5) {
          if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
            V.TestResult_HasPassed_flow_doN__out__iteration__5_ = V.counter1 === 5;
            rt.log("<flow/doN - [out] iteration (5)>: Test Successful");
            proc19();
          }
        } else {
          proc19();
        }
        if (doN1.count === 5) {
          if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
            V.TestResult_HasPassed_flow_doN__currentCount_ = doN1.count === 5;
            rt.log("<flow/doN - [currentCount]>: Test Successful");
            proc30();
          }
        } else {
          proc30();
        }
      }
    }
  }
  function proc19() {
    rt.log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", [V.counter1, 5]);
    V.TestResult_flow_doN__out__iteration__5_ = V.counter1;
  }
  function proc30() {
    rt.log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", [doN1.count, 5]);
    V.TestResult_flow_doN__currentCount_ = doN1.count;
  }
  function proc49() {
    if (rt.doN(doN2, 2)) {
      V.counter2 = (V.counter2 + 1) | 0;
    }
  }
  function proc57() {
    rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", [V.counter2, 4]);
    V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2;
  }
  function proc66() {
    if (rt.doN(doN3, 2)) {
      V.counter3 = (V.counter3 + 1) | 0;
    }
  }
  function proc74() {
    rt.log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", [V.counter3, 2]);
    V.TestResult_flow_doN_Max_Iteration_flow = V.counter3;
  }
  rt.onStart(() => {
    proc0();
    proc0();
    proc0();
    proc0();
    proc0();
    if (!V.TestResult_flow_doN__out__flow) {
      rt.log("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!");
    }
    if (!V.TestResult_HasPassed_flow_doN__out__iteration__5_) {
      rt.log("ERROR! <flow/doN - [out] iteration (5)>: Test Failed");
    }
    if (!V.TestResult_HasPassed_flow_doN__currentCount_) {
      rt.log("ERROR! <flow/doN - [currentCount]>: Test Failed");
    }
  });
  rt.onStart(() => {
    proc49();
    proc49();
    proc49();
    doN2.count = 0;
    proc49();
    proc49();
    if (V.counter2 === 4) {
      if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2 === 4;
        rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful");
        proc57();
      }
    } else {
      proc57();
    }
    if (!V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_) {
      rt.log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed");
    }
  });
  rt.onStart(() => {
    proc66();
    proc66();
    proc66();
    proc66();
    proc66();
    if (V.counter3 === 2) {
      if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = V.counter3 === 2;
        rt.log("<flow/doN - Max Iteration flow>: Test Successful");
        proc74();
      }
    } else {
      proc74();
    }
    if (!V.TestResult_HasPassed_flow_doN_Max_Iteration_flow) {
      rt.log("ERROR! <flow/doN - Max Iteration flow>: Test Failed");
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_flow_doN__out__flow && V.TestResult_HasPassed_flow_doN__out__iteration__5_ && V.TestResult_HasPassed_flow_doN__currentCount_ && V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ && V.TestResult_HasPassed_flow_doN_Max_Iteration_flow) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

