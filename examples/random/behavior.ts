import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38: rt.withId("LastRandomNumberbddbf9eb-0219-4ecf-949c-f01dcb0d0e38", rt.float(-1)), TestResult_math_random_Random__new_number_in_new_flow_: rt.withId("TestResult_math/random_Random (new number in new flow)", rt.bool(false)), TestResult_HasPassed_math_random_Random__same_number_in_current_flow_: rt.withId("TestResult_HasPassed_math/random_Random (same number in current flow)", rt.bool(false)), TestResult_math_random_Random__same_number_in_current_flow_: rt.withId("TestResult_math/random_Random (same number in current flow)", rt.float(-0.0142)), counter1: rt.withId("6c89dba7-e578-4ac6-a7a1-f316d1f49b17", rt.int(0)), TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_: rt.withId("TestResult_HasPassed_math/random_Monte Carlo 1k(random number distribution)", rt.bool(false)), TestResult_math_random_Monte_Carlo_1k_random_number_distribution_: rt.withId("TestResult_math/random_Monte Carlo 1k(random number distribution)", rt.float(-0.0142)), counter2: rt.withId("b0a7e119-0a71-4d4a-b9f5-9ea717673aa0", rt.int(0)), TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_: rt.withId("TestResult_HasPassed_math/random_Monte Carlo 10k(random number distribution)", rt.bool(false)), TestResult_math_random_Monte_Carlo_10k_random_number_distribution_: rt.withId("TestResult_math/random_Monte Carlo 10k(random number distribution)", rt.float(-0.0142)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  let for1 = 0;
  let for2 = 0;
  function proc21() {
    const t1 = rt.random();
    rt.log("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", [t1 - t1, 0]);
    const t2 = rt.random();
    V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2;
  }
  function proc51() {
    rt.log("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,4)", [m.intToFloat(V.counter1) / 1000 * 4, 3.141592653589793]);
    V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = m.intToFloat(V.counter1) / 1000 * 4;
  }
  function proc89() {
    rt.log("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,1)", [m.intToFloat(V.counter2) / 10000 * 4, 3.141592653589793]);
    V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = m.intToFloat(V.counter2) / 10000 * 4;
  }
  rt.onStart(() => {
    V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 = rt.random();
    rt.log("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", [rt.random(), V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38]);
    if (!(rt.random() === V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38)) {
      if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
        rt.log("<math/random - Random (new number in new flow)>: Test Successful");
        V.TestResult_math_random_Random__new_number_in_new_flow_ = true;
      }
    }
    if (!V.TestResult_math_random_Random__new_number_in_new_flow_) {
      rt.log("ERROR! <math/random - Random (new number in new flow)>: Test Failed");
    }
  });
  rt.onStart(() => {
    const t1 = rt.random();
    if (t1 - t1 === 0) {
      if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
        const t2 = rt.random();
        V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ = t2 - t2 === 0;
        rt.log("<math/random - Random (same number in current flow)>: Test Successful");
        proc21();
      }
    } else {
      proc21();
    }
    if (!V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_) {
      rt.log("ERROR! <math/random - Random (same number in current flow)>: Test Failed");
    }
  });
  rt.onStart(() => {
    for1 = 0;
    while (for1 < (1000)) {
      if (m.length(m.sub(m.mul(m.combine2(rt.random(), rt.random()), [2, 2]), [1, 1])) < 1) {
        V.counter1 = (V.counter1 + 1) | 0;
      }
      for1 = for1 + 1;
    }
    rt.log("Monte Carlo 1k(random number distribution) Inside Circle: {0} / {1}", [V.counter1, 1000]);
    if (m.abs(m.intToFloat(V.counter1) / 1000 * 4 - 3.141592653589793) < 0.4) {
      if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ = m.abs(m.intToFloat(V.counter1) / 1000 * 4 - 3.141592653589793) < 0.4;
        rt.log("<math/random - Monte Carlo 1k(random number distribution)>: Test Successful");
        proc51();
      }
    } else {
      proc51();
    }
    if (!V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_) {
      rt.log("ERROR! <math/random - Monte Carlo 1k(random number distribution)>: Test Failed");
    }
  });
  rt.onStart(() => {
    for2 = 0;
    while (for2 < (10000)) {
      if (m.length(m.sub(m.mul(m.combine2(rt.random(), rt.random()), [2, 2]), [1, 1])) < 1) {
        V.counter2 = (V.counter2 + 1) | 0;
      }
      for2 = for2 + 1;
    }
    rt.log("Monte Carlo 10k(random number distribution) Inside Circle: {0} / {1}", [V.counter2, 10000]);
    if (m.abs(m.intToFloat(V.counter2) / 10000 * 4 - 3.141592653589793) < 0.1) {
      if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ = m.abs(m.intToFloat(V.counter2) / 10000 * 4 - 3.141592653589793) < 0.1;
        rt.log("<math/random - Monte Carlo 10k(random number distribution)>: Test Successful");
        proc89();
      }
    } else {
      proc89();
    }
    if (!V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_) {
      rt.log("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed");
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_math_random_Random__new_number_in_new_flow_ && V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ && V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ && V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

