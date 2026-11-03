import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8: rt.withId("LastRandomNumbera7efddb9-d1d0-45cb-aef6-1a1d5ebd10d8", rt.float(-1)), TestResult_math_random_Random__new_number_in_new_flow_: rt.withId("TestResult_math/random_Random (new number in new flow)", rt.bool(false)), TestResult_HasPassed_math_random_Random__same_number_in_current_flow_: rt.withId("TestResult_HasPassed_math/random_Random (same number in current flow)", rt.bool(false)), TestResult_math_random_Random__same_number_in_current_flow_: rt.withId("TestResult_math/random_Random (same number in current flow)", rt.float(-0.0142)), counter1: rt.withId("3f3281e0-4104-46fd-8360-3e53d0fadcab", rt.int(0)), TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_: rt.withId("TestResult_HasPassed_math/random_Monte Carlo 1k(random number distribution)", rt.bool(false)), TestResult_math_random_Monte_Carlo_1k_random_number_distribution_: rt.withId("TestResult_math/random_Monte Carlo 1k(random number distribution)", rt.float(-0.0142)), counter2: rt.withId("ec1fd5a3-a361-47c6-87df-da2b9a247159", rt.int(0)), TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_: rt.withId("TestResult_HasPassed_math/random_Monte Carlo 10k(random number distribution)", rt.bool(false)), TestResult_math_random_Monte_Carlo_10k_random_number_distribution_: rt.withId("TestResult_math/random_Monte Carlo 10k(random number distribution)", rt.float(-0.0142)), PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f: rt.withId("PreviousLoopRandomNumberf06f2b1e-c899-48ec-85d0-0bbcfad5089f", rt.float(-1)), counter3: rt.withId("836512be-531d-443c-a803-5fd2837d9689", rt.int(0)), TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_: rt.withId("TestResult_HasPassed_math/random_Random (new number in each flow/for iteration, 10x)", rt.bool(false)), TestResult_math_random_Random__new_number_in_each_flow_for_iteration__10x_: rt.withId("TestResult_math/random_Random (new number in each flow/for iteration, 10x)", rt.int(-1)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  let for1 = 0;
  let for2 = 0;
  let for3 = 0;
  function proc24() {
    const t1 = rt.random();
    rt.log("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", [t1 - t1, 0]);
    const t2 = rt.random();
    V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2;
  }
  function proc110() {
    rt.log("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0.4)", [m.intToFloat(V.counter1) / 1000 * 4, 3.141592653589793]);
    V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = m.intToFloat(V.counter1) / 1000 * 4;
  }
  function proc122() {
    rt.log("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0.1)", [m.intToFloat(V.counter2) / 10000 * 4, 3.141592653589793]);
    V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = m.intToFloat(V.counter2) / 10000 * 4;
  }
  function proc91() {
    rt.log("<math/random - Random (new number in each flow/for iteration, 10x)>: Value is {0}, should be {1} ", [V.counter3, 10]);
    V.TestResult_math_random_Random__new_number_in_each_flow_for_iteration__10x_ = V.counter3;
  }
  rt.onStart(() => {
    V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8 = rt.random();
    rt.log("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", [rt.random(), V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8]);
    if (!(rt.random() === V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8)) {
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
        proc24();
      }
    } else {
      proc24();
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
        proc110();
      }
    } else {
      proc110();
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
        proc122();
      }
    } else {
      proc122();
    }
    if (!V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_) {
      rt.log("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed");
    }
  });
  rt.onStart(() => {
    for3 = 0;
    while (for3 < (10)) {
      if (!(rt.random() === V.PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f)) {
        V.counter3 = (V.counter3 + 1) | 0;
      }
      V.PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f = rt.random();
      for3 = for3 + 1;
    }
    if (V.counter3 === 10) {
      if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_ = V.counter3 === 10;
        rt.log("<math/random - Random (new number in each flow/for iteration, 10x)>: Test Successful");
        proc91();
      }
    } else {
      proc91();
    }
    if (!V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_) {
      rt.log("ERROR! <math/random - Random (new number in each flow/for iteration, 10x)>: Test Failed");
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_math_random_Random__new_number_in_new_flow_ && V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ && V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ && V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ && V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

