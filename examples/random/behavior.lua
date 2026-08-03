  return function(rt)
  local V = rt.vars({ { name = "LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38", decl = rt.float(-1.0) }, { name = "TestResult_math_random_Random__new_number_in_new_flow_", decl = rt.bool(false) }, { name = "TestResult_HasPassed_math_random_Random__same_number_in_current_flow_", decl = rt.bool(false) }, { name = "TestResult_math_random_Random__same_number_in_current_flow_", decl = rt.float(-0.0142) }, { name = "counter1", decl = rt.int(0.0) }, { name = "TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_", decl = rt.bool(false) }, { name = "TestResult_math_random_Monte_Carlo_1k_random_number_distribution_", decl = rt.float(-0.0142) }, { name = "counter2", decl = rt.int(0.0) }, { name = "TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_", decl = rt.bool(false) }, { name = "TestResult_math_random_Monte_Carlo_10k_random_number_distribution_", decl = rt.float(-0.0142) } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local for1 = 0.0
  local for2 = 0.0
  local proc21, proc51, proc89
  proc21 = function()
    local t1 = rt.random()
    rt.log("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", { t1 - t1, 0.0 })
    local t2 = rt.random()
    V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2
  end
  proc51 = function()
    rt.log("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,4)", { m.div(m.intToFloat(V.counter1), 1000.0) * 4.0, 3.141592653589793 })
    V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = m.div(m.intToFloat(V.counter1), 1000.0) * 4.0
  end
  proc89 = function()
    rt.log("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,1)", { m.div(m.intToFloat(V.counter2), 10000.0) * 4.0, 3.141592653589793 })
    V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = m.div(m.intToFloat(V.counter2), 10000.0) * 4.0
  end
  rt.onStart(function()
    V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 = rt.random()
    rt.log("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", { rt.random(), V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 })
    if not (rt.random() == V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38) then
      if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<math/random - Random (new number in new flow)>: Test Successful")
        V.TestResult_math_random_Random__new_number_in_new_flow_ = true
      end
    end
    if not V.TestResult_math_random_Random__new_number_in_new_flow_ then
      rt.log("ERROR! <math/random - Random (new number in new flow)>: Test Failed")
    end
  end)
  rt.onStart(function()
    local t1 = rt.random()
    if t1 - t1 == 0.0 then
      if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
        local t2 = rt.random()
        V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ = t2 - t2 == 0.0
        rt.log("<math/random - Random (same number in current flow)>: Test Successful")
        proc21()
      end
    else
      proc21()
    end
    if not V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ then
      rt.log("ERROR! <math/random - Random (same number in current flow)>: Test Failed")
    end
  end)
  rt.onStart(function()
    for1 = 0.0
    while for1 < (1000.0) do
      if m.length(m.sub(m.mul(m.combine2(rt.random(), rt.random()), { 2.0, 2.0 }), { 1.0, 1.0 })) < 1.0 then
        V.counter1 = m.addInt(V.counter1, 1.0)
      end
      for1 = for1 + 1.0
    end
    rt.log("Monte Carlo 1k(random number distribution) Inside Circle: {0} / {1}", { V.counter1, 1000.0 })
    if m.abs(m.div(m.intToFloat(V.counter1), 1000.0) * 4.0 - 3.141592653589793) < 0.4 then
      if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ = m.abs(m.div(m.intToFloat(V.counter1), 1000.0) * 4.0 - 3.141592653589793) < 0.4
        rt.log("<math/random - Monte Carlo 1k(random number distribution)>: Test Successful")
        proc51()
      end
    else
      proc51()
    end
    if not V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ then
      rt.log("ERROR! <math/random - Monte Carlo 1k(random number distribution)>: Test Failed")
    end
  end)
  rt.onStart(function()
    for2 = 0.0
    while for2 < (10000.0) do
      if m.length(m.sub(m.mul(m.combine2(rt.random(), rt.random()), { 2.0, 2.0 }), { 1.0, 1.0 })) < 1.0 then
        V.counter2 = m.addInt(V.counter2, 1.0)
      end
      for2 = for2 + 1.0
    end
    rt.log("Monte Carlo 10k(random number distribution) Inside Circle: {0} / {1}", { V.counter2, 10000.0 })
    if m.abs(m.div(m.intToFloat(V.counter2), 10000.0) * 4.0 - 3.141592653589793) < 0.1 then
      if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ = m.abs(m.div(m.intToFloat(V.counter2), 10000.0) * 4.0 - 3.141592653589793) < 0.1
        rt.log("<math/random - Monte Carlo 10k(random number distribution)>: Test Successful")
        proc89()
      end
    else
      proc89()
    end
    if not V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ then
      rt.log("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_math_random_Random__new_number_in_new_flow_ and V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ and V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ and V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
