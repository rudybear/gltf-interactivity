  return function(rt)
  local V = rt.vars({ { name = "counter1", decl = rt.int(0.0), id = "805923c1-6da7-4eb4-b97d-dc82d6f949a7" }, { name = "TestResult_flow_doN__out__flow", decl = rt.bool(false), id = "TestResult_flow/doN_[out] flow" }, { name = "TestResult_HasPassed_flow_doN__out__iteration__5_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[out] iteration (5)" }, { name = "TestResult_flow_doN__out__iteration__5_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[out] iteration (5)" }, { name = "TestResult_HasPassed_flow_doN__currentCount_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[currentCount]" }, { name = "TestResult_flow_doN__currentCount_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[currentCount]" }, { name = "counter2", decl = rt.int(0.0), id = "eef46349-4ad9-4f55-9d70-fc4f2534d42b" }, { name = "TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)" }, { name = "TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[reset] flow (N = 2, out/out/out/reset/out/out)" }, { name = "counter3", decl = rt.int(0.0), id = "a9e7d29c-087b-4a8d-9729-2620a877b3f4" }, { name = "TestResult_HasPassed_flow_doN_Max_Iteration_flow", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_Max Iteration flow" }, { name = "TestResult_flow_doN_Max_Iteration_flow", decl = rt.int(-1.0), id = "TestResult_flow/doN_Max Iteration flow" }, { name = "TestResult_flow_doN_N___0___out__never_fires", decl = rt.bool(true), id = "TestResult_flow/doN_N = 0: [out] never fires" }, { name = "DoN_n_71324c55_32db_4c84_9ec7_d85286364262", decl = rt.int(1.0), id = "DoN_n_71324c55-32db-4c84-9ec7-d85286364262" }, { name = "counter4", decl = rt.int(0.0), id = "70877bda-82fa-4641-981d-f56d46487cca" }, { name = "TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)" }, { name = "TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_", decl = rt.int(-1.0), id = "TestResult_flow/doN_[n] re-evaluated (raised 1 -> 3 at runtime, 3x)" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local doN1 = rt.doNState()
  local doN2 = rt.doNState()
  local doN3 = rt.doNState()
  local doN4 = rt.doNState()
  local doN5 = rt.doNState()
  local proc6, proc42, proc48, proc59, proc65, proc76, proc82, proc88, proc102
  proc6 = function()
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
            proc42()
          end
        else
          proc42()
        end
        if m.eqInt(doN1.count, 5.0) then
          if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
            V.TestResult_HasPassed_flow_doN__currentCount_ = m.eqInt(doN1.count, 5.0)
            rt.log("<flow/doN - [currentCount]>: Test Successful")
            proc48()
          end
        else
          proc48()
        end
      end
    end
  end
  proc42 = function()
    rt.log("<flow/doN - [out] iteration (5)>: Value is {0}, should be {1} ", { V.counter1, 5.0 })
    V.TestResult_flow_doN__out__iteration__5_ = V.counter1
  end
  proc48 = function()
    rt.log("<flow/doN - [currentCount]>: Value is {0}, should be {1} ", { doN1.count, 5.0 })
    V.TestResult_flow_doN__currentCount_ = doN1.count
  end
  proc59 = function()
    if rt.doN(doN2, 2.0) then
      V.counter2 = m.addInt(V.counter2, 1.0)
    end
  end
  proc65 = function()
    rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Value is {0}, should be {1} ", { V.counter2, 4.0 })
    V.TestResult_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = V.counter2
  end
  proc76 = function()
    if rt.doN(doN3, 2.0) then
      V.counter3 = m.addInt(V.counter3, 1.0)
    end
  end
  proc82 = function()
    rt.log("<flow/doN - Max Iteration flow>: Value is {0}, should be {1} ", { V.counter3, 2.0 })
    V.TestResult_flow_doN_Max_Iteration_flow = V.counter3
  end
  proc88 = function()
    if rt.doN(doN4, 0.0) then
      if rt.ptrSet("/nodes/34/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("ERROR! <flow/doN - N = 0: [out] never fires>: Flow triggered! This should not happened!")
        V.TestResult_flow_doN_N___0___out__never_fires = false
      end
    end
  end
  proc102 = function()
    if rt.doN(doN5, V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262) then
      V.counter4 = m.addInt(V.counter4, 1.0)
    end
  end
  rt.onStart(function()
    proc6()
    proc6()
    proc6()
    proc6()
    proc6()
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
    proc59()
    proc59()
    proc59()
    doN2.count = 0.0
    proc59()
    proc59()
    if m.eqInt(V.counter2, 4.0) then
      if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ = m.eqInt(V.counter2, 4.0)
        rt.log("<flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Successful")
        proc65()
      end
    else
      proc65()
    end
    if not V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ then
      rt.log("ERROR! <flow/doN - [reset] flow (N = 2, out/out/out/reset/out/out)>: Test Failed")
    end
  end)
  rt.onStart(function()
    proc76()
    proc76()
    proc76()
    proc76()
    proc76()
    if m.eqInt(V.counter3, 2.0) then
      if rt.ptrSet("/nodes/29/translation", "float3", { 0.0, 0.0, 0.8 }) then
        V.TestResult_HasPassed_flow_doN_Max_Iteration_flow = m.eqInt(V.counter3, 2.0)
        rt.log("<flow/doN - Max Iteration flow>: Test Successful")
        proc82()
      end
    else
      proc82()
    end
    if not V.TestResult_HasPassed_flow_doN_Max_Iteration_flow then
      rt.log("ERROR! <flow/doN - Max Iteration flow>: Test Failed")
    end
  end)
  rt.onStart(function()
    proc88()
    proc88()
    proc88()
    if V.TestResult_flow_doN_N___0___out__never_fires then
      rt.log("<flow/doN - N = 0: [out] never fires>: Test Successful")
    end
  end)
  rt.onStart(function()
    proc102()
    proc102()
    V.DoN_n_71324c55_32db_4c84_9ec7_d85286364262 = 3.0
    proc102()
    proc102()
    proc102()
    V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = m.eqInt(V.counter4, 3.0)
    if m.eqInt(V.counter4, 3.0) then
      if rt.ptrSet("/nodes/41/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered correct amount")
        V.TestResult_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ = V.counter4
      end
    else
      rt.log("ERROR! <flow/doN - [n] re-evaluated (raised 1 -> 3 at runtime, 3x)>: Flow got triggered {0} times from 3. This should not happened!", { V.counter4 })
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_flow_doN__out__flow and V.TestResult_HasPassed_flow_doN__out__iteration__5_ and V.TestResult_HasPassed_flow_doN__currentCount_ and V.TestResult_HasPassed_flow_doN__reset__flow__N___2__out_out_out_reset_out_out_ and V.TestResult_HasPassed_flow_doN_Max_Iteration_flow and V.TestResult_flow_doN_N___0___out__never_fires and V.TestResult_HasPassed_flow_doN__n__re_evaluated__raised_1____3_at_runtime__3x_ then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
