  return function(rt)
  local V = rt.vars({ { name = "TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_", decl = rt.bool(false), id = "TestResult_HasPassed_math/cross_[a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)" }, { name = "TestResult_math_cross__a___1__0__0___b___0__1__0_____0__0__1_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_math/cross_[a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)" }, { name = "TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_", decl = rt.bool(false), id = "TestResult_HasPassed_math/cross_[a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)" }, { name = "TestResult_math_cross__a___2__3__4___b___5__6__7______3__6___3_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_math/cross_[a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)" }, { name = "TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_", decl = rt.bool(false), id = "TestResult_HasPassed_math/cross_[a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)" }, { name = "TestResult_math_cross__a___2__4__6___b___1__2__3_____0__0__0_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_math/cross_[a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local proc14, proc32, proc50
  proc14 = function()
    rt.log("<math/cross - [a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)>: Value is {0}, should be {1} (Proximity range: 0.0001)", { m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 }), { 0.0, 0.0, 1.0 } })
    V.TestResult_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ = m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 })
  end
  proc32 = function()
    rt.log("<math/cross - [a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)>: Value is {0}, should be {1} (Proximity range: 0.0001)", { m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 }), { -3.0, 6.0, -3.0 } })
    V.TestResult_math_cross__a___2__3__4___b___5__6__7______3__6___3_ = m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 })
  end
  proc50 = function()
    rt.log("<math/cross - [a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)>: Value is {0}, should be {1} ", { m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 }), { 0.0, 0.0, 0.0 } })
    V.TestResult_math_cross__a___2__4__6___b___1__2__3_____0__0__0_ = m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 })
  end
  rt.onStart(function()
    local t1 = m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 })
    if m.length(t1) > 0.9999 and m.dot(m.normalize(t1).value, { 0.0, 0.0, 1.0 }) > 0.9999 then
      if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
        local t2 = m.cross({ 1.0, 0.0, 0.0 }, { 0.0, 1.0, 0.0 })
        V.TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ = m.length(t2) > 0.9999 and m.dot(m.normalize(t2).value, { 0.0, 0.0, 1.0 }) > 0.9999
        rt.log("<math/cross - [a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)>: Test Successful")
        proc14()
      end
    else
      proc14()
    end
    if not V.TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ then
      rt.log("ERROR! <math/cross - [a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)>: Test Failed")
    end
  end)
  rt.onStart(function()
    local t1 = m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 })
    if m.length(t1) > 7.348369 and m.dot(m.normalize(t1).value, { -0.408248276, 0.816496551, -0.408248276 }) > 0.9999 then
      if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
        local t2 = m.cross({ 2.0, 3.0, 4.0 }, { 5.0, 6.0, 7.0 })
        V.TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_ = m.length(t2) > 7.348369 and m.dot(m.normalize(t2).value, { -0.408248276, 0.816496551, -0.408248276 }) > 0.9999
        rt.log("<math/cross - [a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)>: Test Successful")
        proc32()
      end
    else
      proc32()
    end
    if not V.TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_ then
      rt.log("ERROR! <math/cross - [a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)>: Test Failed")
    end
  end)
  rt.onStart(function()
    if m.eq(m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 }), { 0.0, 0.0, 0.0 }) then
      if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_ = m.eq(m.cross({ 2.0, 4.0, 6.0 }, { 1.0, 2.0, 3.0 }), { 0.0, 0.0, 0.0 })
        rt.log("<math/cross - [a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)>: Test Successful")
        proc50()
      end
    else
      proc50()
    end
    if not V.TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_ then
      rt.log("ERROR! <math/cross - [a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)>: Test Failed")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ and V.TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_ and V.TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_ then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
