  return function(rt)
  local V = rt.vars({ { name = "TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_", decl = rt.bool(false), id = "TestResult_HasPassed_math/cross_[a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)" }, { name = "TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_math/cross_[a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)" }, { name = "TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_", decl = rt.bool(false), id = "TestResult_HasPassed_math/cross_[a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)" }, { name = "TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_math/cross_[a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)" }, { name = "TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_", decl = rt.bool(false), id = "TestResult_HasPassed_math/cross_[a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)" }, { name = "TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_math/cross_[a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local proc10, proc29, proc43
  proc10 = function()
    rt.log("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", { m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 }), { 0.0, 0.0, 1.0 } })
    V.TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 })
  end
  proc29 = function()
    rt.log("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", { m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 }), { -3.0, 6.0, -3.0 } })
    V.TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 })
  end
  proc43 = function()
    rt.log("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Value is {0}, should be {1} ", { m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 }), { 0.0, 0.0, 0.0 } })
    V.TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 })
  end
  rt.onStart(function()
    local t1 = m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 })
    if m.length(t1) > 0.9999 and m.dot(m.normalize(t1).value, { 0.0, 0.0, 1.0 }) > 0.9999 then
      if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
        local t2 = m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 })
        V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = m.length(t2) > 0.9999 and m.dot(m.normalize(t2).value, { 0.0, 0.0, 1.0 }) > 0.9999
        rt.log("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Successful")
        proc10()
      end
    else
      proc10()
    end
    if not V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ then
      rt.log("ERROR! <math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Failed")
    end
  end)
  rt.onStart(function()
    local t1 = m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 })
    if m.length(t1) > 7.348369 and m.dot(m.normalize(t1).value, { -0.408248276, 0.816496551, -0.408248276 }) > 0.9999 then
      if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
        local t2 = m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 })
        V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = m.length(t2) > 7.348369 and m.dot(m.normalize(t2).value, { -0.408248276, 0.816496551, -0.408248276 }) > 0.9999
        rt.log("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Successful")
        proc29()
      end
    else
      proc29()
    end
    if not V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ then
      rt.log("ERROR! <math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Failed")
    end
  end)
  rt.onStart(function()
    if m.eq(m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 }), { 0.0, 0.0, 0.0 }) then
      if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = m.eq(m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 }), { 0.0, 0.0, 0.0 })
        rt.log("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Successful")
        proc43()
      end
    else
      proc43()
    end
    if not V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ then
      rt.log("ERROR! <math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Failed")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ and V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ and V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
