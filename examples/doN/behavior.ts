import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ counter1: rt.withId("805923c1-6da7-4eb4-b97d-dc82d6f949a7", rt.int(0)), TestResult_flow_doN__out__flow: rt.withId("TestResult_flow/doN_[out] flow", rt.bool(false)), TestResult_HasPassed_flow_doN__out__iteration__5_: rt.withId("TestResult_HasPassed_flow/doN_[out] iteration (5)", rt.bool(false)), TestResult_flow_doN__out__iteration__5_: rt.withId("TestResult_flow/doN_[out] iteration (5)", rt.int(-1)), TestResult_HasPassed_flow_doN__currentCount_: rt.withId("TestResult_HasPassed_flow/doN_[currentCount]", rt.bool(false)), TestResult_flow_doN__currentCount_: rt.withId("TestResult_flow/doN_[currentCount]", rt.int(-1)), counter2: rt.withId("eef46349-4ad9-4f55-9d70-fc4f2534d42b", rt.int(0)), TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_: rt.withId("TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)", rt.bool(false)), TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_: rt.withId("TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)", rt.int(-1)), counter3: rt.withId("a9e7d29c-087b-4a8d-9729-2620a877b3f4", rt.int(0)), TestResult_HasPassed_flow_doN_Max_Iteration_flow: rt.withId("TestResult_HasPassed_flow/doN_Max Iteration flow", rt.bool(false)), TestResult_flow_doN_Max_Iteration_flow: rt.withId("TestResult_flow/doN_Max Iteration flow", rt.int(-1)), TestResult_flow_doN_N___0___out__never_fires: rt.withId("TestResult_flow/doN_N = 0: [out] never fires", rt.bool(true)), DoN_n_71324c55_32db_4c84_9ec7_d85286364262: rt.withId("DoN_n_71324c55-32db-4c84-9ec7-d85286364262", rt.int(1)), counter4: rt.withId("70877bda-82fa-4641-981d-f56d46487cca", rt.int(0)), TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_: rt.withId("TestResult_HasPassed_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)", rt.bool(false)), TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_: rt.withId("TestResult_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)", rt.int(-1)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const doN1 = rt.doNState();
  const doN2 = rt.doNState();
  const doN3 = rt.doNState();
  const doN4 = rt.doNState();
  const doN5 = rt.doNState();
  function proc6() {
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
            proc42();
          }
        } else {
          proc42();
        }
        if (doN1.count === 5) {
          if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
            V.TestResult_HasPassed_flow_doN__currentCount_ = doN1.count === 5;
            rt.log("<flow/doN - [currentCount]>: Test Successful");
            proc48();
          }
        } else {
          proc48();
        }
      }
    }
  }
  function proc42() {
    rt.log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", [V.counter1, 5]);
    V.TestResult_flow_doN__out__iteration__5_ = V.counter1;
  }
  function proc48() {
    rt.log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", [doN1.count, 5]);
    V.TestResult_flow_doN__currentCount_ = doN1.count;
  }
  function proc59() {
    if (rt.doN(doN2, 2)) {
      V.counter2 = (V.counter2 + 1) | 0;
    }
  }
  function proc65() {
    rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", [V.counter2, 4]);
    V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2;
  }
  function proc76() {
    if (rt.doN(doN3, 2)) {
      V.counter3 = (V.counter3 + 1) | 0;
    }
  }
  function proc82() {
    rt.log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", [V.counter3, 2]);
    V.TestResult_flow_doN_Max_Iteration_flow = V.counter3;
  }
  function proc88() {
    if (rt.doN(doN4, 0)) {
      if (rt.ptrSet("/nodes/34/translation", "float3", [0, 0, 0.8])) {
        rt.log("ERROR! <flow/doN - N = 0: [out] never fires>: Flow triggered! This should not happened!");
        V.TestResult_flow_doN_N___0___out__never_fires = false;
      }
    }
  }
  function proc102() {
    if (rt.doN(doN5, V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262)) {
      V.counter4 = (V.counter4 + 1) | 0;
    }
  }
  rt.onStart(() => {
    proc6();
    proc6();
    proc6();
    proc6();
    proc6();
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
    proc59();
    proc59();
    proc59();
    doN2.count = 0;
    proc59();
    proc59();
    if (V.counter2 === 4) {
      if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2 === 4;
        rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful");
        proc65();
      }
    } else {
      proc65();
    }
    if (!V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_) {
      rt.log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed");
    }
  });
  rt.onStart(() => {
    proc76();
    proc76();
    proc76();
    proc76();
    proc76();
    if (V.counter3 === 2) {
      if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = V.counter3 === 2;
        rt.log("<flow/doN - Max Iteration flow>: Test Successful");
        proc82();
      }
    } else {
      proc82();
    }
    if (!V.TestResult_HasPassed_flow_doN_Max_Iteration_flow) {
      rt.log("ERROR! <flow/doN - Max Iteration flow>: Test Failed");
    }
  });
  rt.onStart(() => {
    proc88();
    proc88();
    proc88();
    if (V.TestResult_flow_doN_N___0___out__never_fires) {
      rt.log("<flow/doN - N = 0: [out] never fires>: Test Successful");
    }
  });
  rt.onStart(() => {
    proc102();
    proc102();
    V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262 = 3;
    proc102();
    proc102();
    proc102();
    V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4 === 3;
    if (V.counter4 === 3) {
      if (rt.ptrSet("/nodes/41/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered correct amount");
        V.TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4;
      }
    } else {
      rt.log("ERROR! <flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered {0} times from 3. This should not happened!", [V.counter4]);
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_flow_doN__out__flow && V.TestResult_HasPassed_flow_doN__out__iteration__5_ && V.TestResult_HasPassed_flow_doN__currentCount_ && V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ && V.TestResult_HasPassed_flow_doN_Max_Iteration_flow && V.TestResult_flow_doN_N___0___out__never_fires && V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

