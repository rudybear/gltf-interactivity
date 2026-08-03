  return function(rt)
  local V = rt.vars({ { name = "varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5", decl = rt.float(0.0) }, { name = "TestResult_variable_interpolate_Flow__out_", decl = rt.bool(false) }, { name = "TestResult_variable_interpolate_Flow__done_", decl = rt.bool(false) }, { name = "TestResult_HasPassed_variable_interpolate_Value_at_50_", decl = rt.bool(false) }, { name = "TestResult_variable_interpolate_Value_at_50_", decl = rt.float(-0.0142) }, { name = "TestResult_HasPassed_variable_interpolate_Value_at_100_", decl = rt.bool(false) }, { name = "TestResult_variable_interpolate_Value_at_100_", decl = rt.float(-0.0142) }, { name = "varInterpolate_70d07005_5cf3_4096_aff1_64784e4f4a05", decl = rt.float(0.0) }, { name = "TestResult_variable_interpolate__Err__flow__duration__1f", decl = rt.bool(false) }, { name = "varInterpolate_e238c886_965c_4e31_8403_0fb87c761997", decl = rt.float(0.0) }, { name = "TestResult_variable_interpolate__Err__flow__duration_infinite", decl = rt.bool(false) }, { name = "varInterpolate_a863aca9_6cb6_4e45_8c24_98370c20b2a1", decl = rt.float(0.0) }, { name = "TestResult_variable_interpolate__Err__flow__p1_NaN_", decl = rt.bool(false) }, { name = "varInterpolate_fea34d13_336d_4b2e_89fd_2b31b1cce966", decl = rt.float(0.0) }, { name = "TestResult_variable_interpolate__Err__flow__p2_NaN_", decl = rt.bool(false) } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 5.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local delay1 = rt.delayState()
  local delay2 = rt.delayState()
  local delay3 = rt.delayState()
  local proc59, proc30
  proc59 = function()
    rt.log("<variable/interpolate - Value at 100%>: Value is {0}, should be {1} ", { V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 10.0 })
    V.TestResult_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5
  end
  proc30 = function()
    rt.log("<variable/interpolate - Value at 50%>: Value is {0}, should be {1} (Proximity range: 0,1)", { V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5, 8.024034 })
    V.TestResult_variable_interpolate_Value_at_50_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5
  end
  rt.onStart(function()
    local function cont1()
      if not V.TestResult_variable_interpolate_Flow__out_ then
        rt.log("ERROR! <variable/interpolate - Flow [out]>: Flow not triggered! This should not happened!")
      end
      if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_variable_interpolate_Flow__done_ then
          rt.log("ERROR! <variable/interpolate - Flow [done]>: Flow not triggered! This should not happened!")
        end
      end
      if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_variable_interpolate_Value_at_50_ then
          rt.log("ERROR! <variable/interpolate - Value at 50%>: Test Failed")
        end
      end
      if rt.ptrSet("/nodes/24/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_variable_interpolate_Value_at_100_ then
          rt.log("ERROR! <variable/interpolate - Value at 100%>: Test Failed")
        end
      end
    end
    if rt.setDelay(delay2, 4.5, cont1).ok then
      local function cont2()
        if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("<variable/interpolate - Flow [done]>: Flow triggered")
            V.TestResult_variable_interpolate_Flow__done_ = true
          end
        end
        if rt.ptrSet("/nodes/24/translation", "float3", { 0.0, 0.0, 0.0 }) then
          if V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0 then
            if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/24/translation", "float3", { 0.0, 0.0, 0.0 }) then
                V.TestResult_HasPassed_variable_interpolate_Value_at_100_ = V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 == 10.0
                rt.log("<variable/interpolate - Value at 100%>: Test Successful")
                proc59()
              end
            end
          else
            proc59()
          end
        end
      end
      if rt.varInterp(0, 10.0, 4.0, { 0.25, 0.1 }, { 0.25, 1.0 }, false, cont2).ok then
        if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
          rt.log("<variable/interpolate - Flow [out]>: Flow triggered")
          V.TestResult_variable_interpolate_Flow__out_ = true
        end
      end
      local function cont3()
        if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
          if m.abs(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1 then
            if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
                V.TestResult_HasPassed_variable_interpolate_Value_at_50_ = m.abs(V.varInterpolate_14f3dfe8_bfe3_4e24_b44c_4d23611e2ac5 - 8.024034) < 0.1
                rt.log("<variable/interpolate - Value at 50%>: Test Successful")
                proc30()
              end
            end
          else
            proc30()
          end
        end
      end
      rt.setDelay(delay1, 2.0, cont3)
    end
  end)
  rt.onStart(function()
    if not rt.varInterp(7, 14.0, -1.0, { 1.0, 1.0 }, { 1.0, 1.0 }, false, nil).ok then
      if rt.ptrSet("/nodes/29/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<variable/interpolate - [Err] flow (duration -1f>: Flow triggered")
        V.TestResult_variable_interpolate__Err__flow__duration__1f = true
      end
    end
    if not V.TestResult_variable_interpolate__Err__flow__duration__1f then
      rt.log("ERROR! <variable/interpolate - [Err] flow (duration -1f>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.varInterp(9, 14.0, m.Inf(), { 1.0, 1.0 }, { 1.0, 1.0 }, false, nil).ok then
      if rt.ptrSet("/nodes/35/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<variable/interpolate - [Err] flow (duration infinite>: Flow triggered")
        V.TestResult_variable_interpolate__Err__flow__duration_infinite = true
      end
    end
    if not V.TestResult_variable_interpolate__Err__flow__duration_infinite then
      rt.log("ERROR! <variable/interpolate - [Err] flow (duration infinite>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.varInterp(11, 14.0, 1.0, { (0/0), (0/0) }, { 1.0, 1.0 }, false, nil).ok then
      if rt.ptrSet("/nodes/41/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<variable/interpolate - [Err] flow (p1 NaN)>: Flow triggered")
        V.TestResult_variable_interpolate__Err__flow__p1_NaN_ = true
      end
    end
    if not V.TestResult_variable_interpolate__Err__flow__p1_NaN_ then
      rt.log("ERROR! <variable/interpolate - [Err] flow (p1 NaN)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.varInterp(13, 14.0, 1.0, { 1.0, 1.0 }, { (0/0), (0/0) }, false, nil).ok then
      if rt.ptrSet("/nodes/47/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<variable/interpolate - [Err] flow (p2 NaN)>: Flow triggered")
        V.TestResult_variable_interpolate__Err__flow__p2_NaN_ = true
      end
    end
    if not V.TestResult_variable_interpolate__Err__flow__p2_NaN_ then
      rt.log("ERROR! <variable/interpolate - [Err] flow (p2 NaN)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    local function cont1()
      if V.TestResult_variable_interpolate_Flow__out_ and V.TestResult_HasPassed_variable_interpolate_Value_at_50_ and V.TestResult_variable_interpolate_Flow__done_ and V.TestResult_HasPassed_variable_interpolate_Value_at_100_ and V.TestResult_variable_interpolate__Err__flow__duration__1f and V.TestResult_variable_interpolate__Err__flow__duration_infinite and V.TestResult_variable_interpolate__Err__flow__p1_NaN_ and V.TestResult_variable_interpolate__Err__flow__p2_NaN_ then
        rt.send(E.test_onSuccess)
      else
        rt.send(E.test_onFailed)
      end
    end
    rt.setDelay(delay3, 5.0, cont1)
  end)
end
