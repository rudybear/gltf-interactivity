  return function(rt)
  local V = rt.vars({ { name = "FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b", decl = rt.int(0.0), id = "FlowSequenceCount_cd624fe9-1c76-4daf-9ebc-5a4014c8fb9b" }, { name = "TestResult_animation_start__out__fired_right_after__in_", decl = rt.bool(false), id = "TestResult_animation/start_[out] fired right after [in]" }, { name = "TestResult_HasPassed_animation_start_Position_at_50_", decl = rt.bool(false), id = "TestResult_HasPassed_animation/start_Position at 50%" }, { name = "TestResult_animation_start_Position_at_50_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_animation/start_Position at 50%" }, { name = "TestResult_animation_start_Flow__done_", decl = rt.bool(false), id = "TestResult_animation/start_Flow [done]" }, { name = "TestResult_HasPassed_animation_start_Position_at_100_", decl = rt.bool(false), id = "TestResult_HasPassed_animation/start_Position at 100%" }, { name = "TestResult_animation_start_Position_at_100_", decl = rt.float3(-0.0142, -0.0142, -0.0142), id = "TestResult_animation/start_Position at 100%" }, { name = "TestResult_animation_start__err__flow__speed__1_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (speed -1)" }, { name = "TestResult_animation_start__err__flow__speed_0_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (speed 0)" }, { name = "TestResult_animation_start__err__flow__speed_NaN_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (speed NaN)" }, { name = "TestResult_animation_start__err__flow__speed__Inf_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (speed +Inf)" }, { name = "TestResult_animation_start__err__flow__startTime_NaN_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (startTime NaN)" }, { name = "TestResult_animation_start__err__flow__startTime__Inf_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (startTime +Inf)" }, { name = "TestResult_animation_start__err__flow__endTime_NaN_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (endTime NaN)" }, { name = "TestResult_animation_start__err__flow__invalid_ref_", decl = rt.bool(false), id = "TestResult_animation/start_[err] flow (invalid ref)" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 3.5 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local delay1 = rt.delayState()
  local delay2 = rt.delayState()
  local delay3 = rt.delayState()
  local proc87, proc35
  proc87 = function()
    rt.log("<animation/start - Position at 100%>: Value is {0}, should be {1} (Proximity range: 0,01)", { rt.ptrGet("/nodes/3/translation", "float3").value, { -1.0, 2.0, 3.0 } })
    V.TestResult_animation_start_Position_at_100_ = rt.ptrGet("/nodes/3/translation", "float3").value
  end
  proc35 = function()
    rt.log("<animation/start - Position at 50%>: Value is {0}, should be {1} (Proximity range: 0,3)", { rt.ptrGet("/nodes/3/translation", "float3").value, { -0.5, 1.0, 1.5 } })
    V.TestResult_animation_start_Position_at_50_ = rt.ptrGet("/nodes/3/translation", "float3").value
  end
  rt.onStart(function()
    local function cont1()
      if not V.TestResult_animation_start__out__fired_right_after__in_ then
        rt.log("ERROR! <animation/start - [out] fired right after [in]>: Correct flow order not triggered! This should not happened!")
      end
      if rt.ptrSet("/nodes/13/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_animation_start_Position_at_50_ then
          rt.log("ERROR! <animation/start - Position at 50%>: Test Failed")
        end
      end
      if rt.ptrSet("/nodes/19/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_animation_start_Flow__done_ then
          rt.log("ERROR! <animation/start - Flow [done]>: Flow not triggered! This should not happened!")
        end
      end
      if rt.ptrSet("/nodes/25/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_animation_start_Position_at_100_ then
          rt.log("ERROR! <animation/start - Position at 100%>: Test Failed")
        end
      end
    end
    if rt.setDelay(delay2, 3.0, cont1).ok then
      local function cont2()
        if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/19/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("<animation/start - Flow [done]>: Flow triggered")
            V.TestResult_animation_start_Flow__done_ = true
          end
        end
        if rt.ptrSet("/nodes/25/translation", "float3", { 0.0, 0.0, 0.0 }) then
          local t1 = rt.ptrGet("/nodes/3/translation", "float3").value
          if m.length(t1) > 3.73165751 and m.dot(m.normalize(t1).value, { -0.267261237, 0.5345225, 0.8017837 }) > 0.99 then
            if rt.ptrSet("/nodes/24/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/25/translation", "float3", { 0.0, 0.0, 0.0 }) then
                local t2 = rt.ptrGet("/nodes/3/translation", "float3").value
                V.TestResult_HasPassed_animation_start_Position_at_100_ = m.length(t2) > 3.73165751 and m.dot(m.normalize(t2).value, { -0.267261237, 0.5345225, 0.8017837 }) > 0.99
                rt.log("<animation/start - Position at 100%>: Test Successful")
                proc87()
              end
            end
          else
            proc87()
          end
        end
      end
      if rt.animStart("/animations/0", 0.0, 2.0, 1.0, cont2).ok then
        V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = m.addInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1.0)
        if not m.eqInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1.0) then
          rt.log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: out")
          V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000.0
        end
      end
      V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = m.addInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 1.0)
      if m.eqInt(V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b, 2.0) then
        if rt.ptrSet("/nodes/6/translation", "float3", { 0.0, 0.0, 0.8 }) then
          rt.log("<animation/start - [out] fired right after [in]>: Correct flow order triggered")
          V.TestResult_animation_start__out__fired_right_after__in_ = true
        end
      else
        rt.log("ERROR! <animation/start - [out] fired right after [in]>: Incorrect flow order triggered! Expected Socket Id: 1")
        V.FlowSequenceCount_cd624fe9_1c76_4daf_9ebc_5a4014c8fb9b = -1000.0
      end
      local function cont3()
        if rt.ptrSet("/nodes/13/translation", "float3", { 0.0, 0.0, 0.0 }) then
          local t3 = rt.ptrGet("/nodes/3/translation", "float3").value
          if m.length(t3) > 1.57082868 and m.dot(m.normalize(t3).value, { -0.267261237, 0.5345225, 0.8017837 }) > 0.7 then
            if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/13/translation", "float3", { 0.0, 0.0, 0.0 }) then
                local t4 = rt.ptrGet("/nodes/3/translation", "float3").value
                V.TestResult_HasPassed_animation_start_Position_at_50_ = m.length(t4) > 1.57082868 and m.dot(m.normalize(t4).value, { -0.267261237, 0.5345225, 0.8017837 }) > 0.7
                rt.log("<animation/start - Position at 50%>: Test Successful")
                proc35()
              end
            end
          else
            proc35()
          end
        end
      end
      rt.setDelay(delay1, 1.0, cont3)
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", 0.0, 2.0, -1.0, nil).ok then
      if rt.ptrSet("/nodes/30/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (speed -1)>: Flow triggered")
        V.TestResult_animation_start__err__flow__speed__1_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__speed__1_ then
      rt.log("ERROR! <animation/start - [err] flow (speed -1)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", 0.0, 2.0, 0.0, nil).ok then
      if rt.ptrSet("/nodes/36/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (speed 0)>: Flow triggered")
        V.TestResult_animation_start__err__flow__speed_0_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__speed_0_ then
      rt.log("ERROR! <animation/start - [err] flow (speed 0)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", 0.0, 2.0, m.NaN(), nil).ok then
      if rt.ptrSet("/nodes/42/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (speed NaN)>: Flow triggered")
        V.TestResult_animation_start__err__flow__speed_NaN_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__speed_NaN_ then
      rt.log("ERROR! <animation/start - [err] flow (speed NaN)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", 0.0, 2.0, m.Inf(), nil).ok then
      if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (speed +Inf)>: Flow triggered")
        V.TestResult_animation_start__err__flow__speed__Inf_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__speed__Inf_ then
      rt.log("ERROR! <animation/start - [err] flow (speed +Inf)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", m.NaN(), 2.0, 1.0, nil).ok then
      if rt.ptrSet("/nodes/54/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (startTime NaN)>: Flow triggered")
        V.TestResult_animation_start__err__flow__startTime_NaN_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__startTime_NaN_ then
      rt.log("ERROR! <animation/start - [err] flow (startTime NaN)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", m.Inf(), 2.0, 1.0, nil).ok then
      if rt.ptrSet("/nodes/60/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (startTime +Inf)>: Flow triggered")
        V.TestResult_animation_start__err__flow__startTime__Inf_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__startTime__Inf_ then
      rt.log("ERROR! <animation/start - [err] flow (startTime +Inf)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/0", 0.0, m.NaN(), 1.0, nil).ok then
      if rt.ptrSet("/nodes/66/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (endTime NaN)>: Flow triggered")
        V.TestResult_animation_start__err__flow__endTime_NaN_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__endTime_NaN_ then
      rt.log("ERROR! <animation/start - [err] flow (endTime NaN)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.animStart("/animations/1000", 0.0, 2.0, 1.0, nil).ok then
      if rt.ptrSet("/nodes/72/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<animation/start - [err] flow (invalid ref)>: Flow triggered")
        V.TestResult_animation_start__err__flow__invalid_ref_ = true
      end
    end
    if not V.TestResult_animation_start__err__flow__invalid_ref_ then
      rt.log("ERROR! <animation/start - [err] flow (invalid ref)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    local function cont1()
      if V.TestResult_animation_start__out__fired_right_after__in_ and V.TestResult_HasPassed_animation_start_Position_at_50_ and V.TestResult_animation_start_Flow__done_ and V.TestResult_HasPassed_animation_start_Position_at_100_ and V.TestResult_animation_start__err__flow__speed__1_ and V.TestResult_animation_start__err__flow__speed_0_ and V.TestResult_animation_start__err__flow__speed_NaN_ and V.TestResult_animation_start__err__flow__speed__Inf_ and V.TestResult_animation_start__err__flow__startTime_NaN_ and V.TestResult_animation_start__err__flow__startTime__Inf_ and V.TestResult_animation_start__err__flow__endTime_NaN_ and V.TestResult_animation_start__err__flow__invalid_ref_ then
        rt.send(E.test_onSuccess)
      else
        rt.send(E.test_onFailed)
      end
    end
    rt.setDelay(delay3, 3.5, cont1)
  end)
end
