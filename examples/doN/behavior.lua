  return function(rt)
  local V = rt.vars({ { name = "counter1", decl = rt.int(0.0), id = "467a7f10-2a70-49b0-ac90-a045449a37e9" }, { name = "TestResult_flow_doN__out__flow", decl = rt.bool(false), id = "TestResult_flow/doN_[out] flow" }, { name = "TestResult_HasPassed_flow_doN__out__iteration__5_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[out] iteration (5)" }, { name = "TestResult_flow_doN__out__iteration__5_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[out] iteration (5)" }, { name = "TestResult_HasPassed_flow_doN__currentCount_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[currentCount]" }, { name = "TestResult_flow_doN__currentCount_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[currentCount]" }, { name = "counter2", decl = rt.int(0.0), id = "8043697e-0ae2-4500-a1c9-9d9ff12a4a79" }, { name = "TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)" }, { name = "TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)" }, { name = "counter3", decl = rt.int(0.0), id = "983a7860-0d44-41f1-abea-9a2ed508a47a" }, { name = "TestResult_HasPassed_flow_doN_Max_Iteration_flow", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_Max Iteration flow" }, { name = "TestResult_flow_doN_Max_Iteration_flow", decl = rt.int(-1.0), id = "TestResult_flow/doN_Max Iteration flow" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local doN1 = rt.doNState()
  local doN2 = rt.doNState()
  local doN3 = rt.doNState()
  local proc0, proc19, proc30, proc49, proc57, proc66, proc74
  proc0 = function()
    if rt.doN(doN1, 5.0) then
      V.counter1 = m.addInt(V.counter1, 1.0)
      if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/doN - [out] flow>: Flow triggered")
        V.TestResult_flow_doN__out__flow = true
      end
      if m.eqInt(V.counter1, 5.0) then
        if m.eqInt(V.counter1, 5.0) then
          if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
            V.TestResult_HasPassed_flow_doN__out__iteration__5_ = m.eqInt(V.counter1, 5.0)
            rt.log("<flow/doN - [out] iteration (5)>: Test Successful")
            proc19()
          end
        else
          proc19()
        end
        if m.eqInt(doN1.count, 5.0) then
          if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
            V.TestResult_HasPassed_flow_doN__currentCount_ = m.eqInt(doN1.count, 5.0)
            rt.log("<flow/doN - [currentCount]>: Test Successful")
            proc30()
          end
        else
          proc30()
        end
      end
    end
  end
  proc19 = function()
    rt.log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", { V.counter1, 5.0 })
    V.TestResult_flow_doN__out__iteration__5_ = V.counter1
  end
  proc30 = function()
    rt.log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", { doN1.count, 5.0 })
    V.TestResult_flow_doN__currentCount_ = doN1.count
  end
  proc49 = function()
    if rt.doN(doN2, 2.0) then
      V.counter2 = m.addInt(V.counter2, 1.0)
    end
  end
  proc57 = function()
    rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", { V.counter2, 4.0 })
    V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2
  end
  proc66 = function()
    if rt.doN(doN3, 2.0) then
      V.counter3 = m.addInt(V.counter3, 1.0)
    end
  end
  proc74 = function()
    rt.log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", { V.counter3, 2.0 })
    V.TestResult_flow_doN_Max_Iteration_flow = V.counter3
  end
  rt.onStart(function()
    proc0()
    proc0()
    proc0()
    proc0()
    proc0()
    if not V.TestResult_flow_doN__out__flow then
      rt.log("ERROR! <flow/doN - [out] flow>: Flow not triggered! This should not happened!")
    end
    if not V.TestResult_HasPassed_flow_doN__out__iteration__5_ then
      rt.log("ERROR! <flow/doN - [out] iteration (5)>: Test Failed")
    end
    if not V.TestResult_HasPassed_flow_doN__currentCount_ then
      rt.log("ERROR! <flow/doN - [currentCount]>: Test Failed")
    end
  end)
  rt.onStart(function()
    proc49()
    proc49()
    proc49()
    doN2.count = 0.0
    proc49()
    proc49()
    if m.eqInt(V.counter2, 4.0) then
      if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = m.eqInt(V.counter2, 4.0)
        rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful")
        proc57()
      end
    else
      proc57()
    end
    if not V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ then
      rt.log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed")
    end
  end)
  rt.onStart(function()
    proc66()
    proc66()
    proc66()
    proc66()
    proc66()
    if m.eqInt(V.counter3, 2.0) then
      if rt.ptrSet("/nodes/29/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = m.eqInt(V.counter3, 2.0)
        rt.log("<flow/doN - Max Iteration flow>: Test Successful")
        proc74()
      end
    else
      proc74()
    end
    if not V.TestResult_HasPassed_flow_doN_Max_Iteration_flow then
      rt.log("ERROR! <flow/doN - Max Iteration flow>: Test Failed")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_flow_doN__out__flow and V.TestResult_HasPassed_flow_doN__out__iteration__5_ and V.TestResult_HasPassed_flow_doN__currentCount_ and V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ and V.TestResult_HasPassed_flow_doN_Max_Iteration_flow then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
