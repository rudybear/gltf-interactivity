  return function(rt)
  local V = rt.vars({ { name = "LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8", decl = rt.float(-1.0), id = "LastRandomNumbera7efddb9-d1d0-45cb-aef6-1a1d5ebd10d8" }, { name = "TestResult_math_random_Random__new_number_in_new_flow_", decl = rt.bool(false), id = "TestResult_math/random_Random (new number in new flow)" }, { name = "TestResult_HasPassed_math_random_Random__same_number_in_current_flow_", decl = rt.bool(false), id = "TestResult_HasPassed_math/random_Random (same number in current flow)" }, { name = "TestResult_math_random_Random__same_number_in_current_flow_", decl = rt.float(-0.0142), id = "TestResult_math/random_Random (same number in current flow)" }, { name = "counter1", decl = rt.int(0.0), id = "3f3281e0-4104-46fd-8360-3e53d0fadcab" }, { name = "TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_", decl = rt.bool(false), id = "TestResult_HasPassed_math/random_Monte Carlo 1k(random number distribution)" }, { name = "TestResult_math_random_Monte_Carlo_1k_random_number_distribution_", decl = rt.float(-0.0142), id = "TestResult_math/random_Monte Carlo 1k(random number distribution)" }, { name = "counter2", decl = rt.int(0.0), id = "ec1fd5a3-a361-47c6-87df-da2b9a247159" }, { name = "TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_", decl = rt.bool(false), id = "TestResult_HasPassed_math/random_Monte Carlo 10k(random number distribution)" }, { name = "TestResult_math_random_Monte_Carlo_10k_random_number_distribution_", decl = rt.float(-0.0142), id = "TestResult_math/random_Monte Carlo 10k(random number distribution)" }, { name = "PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f", decl = rt.float(-1.0), id = "PreviousLoopRandomNumberf06f2b1e-c899-48ec-85d0-0bbcfad5089f" }, { name = "counter3", decl = rt.int(0.0), id = "836512be-531d-443c-a803-5fd2837d9689" }, { name = "TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_", decl = rt.bool(false), id = "TestResult_HasPassed_math/random_Random (new number in each flow/for iteration, 10x)" }, { name = "TestResult_math_random_Random__new_number_in_each_flow_for_iteration__10x_", decl = rt.int(-1.0), id = "TestResult_math/random_Random (new number in each flow/for iteration, 10x)" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local for1 = 0.0
  local for2 = 0.0
  local for3 = 0.0
  local proc24, proc110, proc122, proc91
  proc24 = function()
    local t1 = rt.random()
    rt.log("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", { t1 - t1, 0.0 })
    local t2 = rt.random()
    V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2
  end
  proc110 = function()
    rt.log("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0.4)", { m.div(m.intToFloat(V.counter1), 1000.0) * 4.0, 3.141592653589793 })
    V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = m.div(m.intToFloat(V.counter1), 1000.0) * 4.0
  end
  proc122 = function()
    rt.log("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0.1)", { m.div(m.intToFloat(V.counter2), 10000.0) * 4.0, 3.141592653589793 })
    V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = m.div(m.intToFloat(V.counter2), 10000.0) * 4.0
  end
  proc91 = function()
    rt.log("<math/random - Random (new number in each flow/for iteration, 10x)>: Value is {0}, should be {1} ", { V.counter3, 10.0 })
    V.TestResult_math_random_Random__new_number_in_each_flow_for_iteration__10x_ = V.counter3
  end
  rt.onStart(function()
    V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8 = rt.random()
    rt.log("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", { rt.random(), V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8 })
    if not (rt.random() == V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8) then
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
        proc24()
      end
    else
      proc24()
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
        proc110()
      end
    else
      proc110()
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
        proc122()
      end
    else
      proc122()
    end
    if not V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ then
      rt.log("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed")
    end
  end)
  rt.onStart(function()
    for3 = 0.0
    while for3 < (10.0) do
      if not (rt.random() == V.PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f) then
        V.counter3 = m.addInt(V.counter3, 1.0)
      end
      V.PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f = rt.random()
      for3 = for3 + 1.0
    end
    if m.eqInt(V.counter3, 10.0) then
      if rt.ptrSet("/nodes/29/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_ = m.eqInt(V.counter3, 10.0)
        rt.log("<math/random - Random (new number in each flow/for iteration, 10x)>: Test Successful")
        proc91()
      end
    else
      proc91()
    end
    if not V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_ then
      rt.log("ERROR! <math/random - Random (new number in each flow/for iteration, 10x)>: Test Failed")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_math_random_Random__new_number_in_new_flow_ and V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ and V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ and V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ and V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_ then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
