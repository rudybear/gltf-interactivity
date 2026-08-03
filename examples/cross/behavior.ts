import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_: rt.bool(false), TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_: rt.float3(-0.0142, -0.0142, -0.0142), TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_: rt.bool(false), TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_: rt.float3(-0.0142, -0.0142, -0.0142), TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_: rt.bool(false), TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_: rt.float3(-0.0142, -0.0142, -0.0142) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  function proc10() {
    rt.log("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", [m.cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]]);
    V.TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = m.cross([1, 0, 0], [0, 1, 0]);
  }
  function proc29() {
    rt.log("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", [m.cross([2, 3, 4], [5, 6, 7]), [-3, 6, -3]]);
    V.TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = m.cross([2, 3, 4], [5, 6, 7]);
  }
  function proc43() {
    rt.log("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Value is {0}, should be {1} ", [m.cross([2, 4, 6], [1, 2, 3]), [0, 0, 0]]);
    V.TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = m.cross([2, 4, 6], [1, 2, 3]);
  }
  rt.onStart(() => {
    const t1 = m.cross([1, 0, 0], [0, 1, 0]);
    if (m.length(t1) > 0.9999 && m.dot(m.normalize(t1).value, [0, 0, 1]) > 0.9999) {
      if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
        const t2 = m.cross([1, 0, 0], [0, 1, 0]);
        V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = m.length(t2) > 0.9999 && m.dot(m.normalize(t2).value, [0, 0, 1]) > 0.9999;
        rt.log("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Successful");
        proc10();
      }
    } else {
      proc10();
    }
    if (!V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_) {
      rt.log("ERROR! <math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Failed");
    }
  });
  rt.onStart(() => {
    const t1 = m.cross([2, 3, 4], [5, 6, 7]);
    if (m.length(t1) > 7.348369 && m.dot(m.normalize(t1).value, [-0.408248276, 0.816496551, -0.408248276]) > 0.9999) {
      if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
        const t2 = m.cross([2, 3, 4], [5, 6, 7]);
        V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = m.length(t2) > 7.348369 && m.dot(m.normalize(t2).value, [-0.408248276, 0.816496551, -0.408248276]) > 0.9999;
        rt.log("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Successful");
        proc29();
      }
    } else {
      proc29();
    }
    if (!V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_) {
      rt.log("ERROR! <math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (m.eq(m.cross([2, 4, 6], [1, 2, 3]), [0, 0, 0])) {
      if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = m.eq(m.cross([2, 4, 6], [1, 2, 3]), [0, 0, 0]);
        rt.log("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Successful");
        proc43();
      }
    } else {
      proc43();
    }
    if (!V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_) {
      rt.log("ERROR! <math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Failed");
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ && V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ && V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

