  return function(rt)
  local V = rt.vars({ { name = "startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6", decl = rt.float(0.0), id = "startTime_ca9af277-a001-44a7-bbd2-b3e9d2eafea6" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__done_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Flow [done]" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", decl = rt.float(-0.0142), id = "TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay" }, { name = "counter1", decl = rt.int(0.0), id = "d90d4f49-c9e3-4a3e-9f10-06247568422b" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__out_", decl = rt.int(-1.0), id = "TestResult_flow/setDelay and cancelDelay_Flow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_", decl = rt.bool(true), id = "TestResult_flow/setDelay and cancelDelay_setDelay [cancel]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered", decl = rt.bool(true), id = "TestResult_flow/setDelay and cancelDelay_cancelDelay triggered" }, { name = "TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__err_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Flow [err]" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid" }, { name = "TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Flow [err]\n(NaN)" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Flow [err]\n(+Inf)" }, { name = "FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362", decl = rt.int(0.0), id = "FlowSequenceCount_b8e69ef5-14a6-4dbe-b4e1-3335901db362" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Concurrent delays\n[done] in time order" }, { name = "counter2", decl = rt.int(0.0), id = "c3ceb65a-83b0-4b71-9344-d81263979ab7" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x" }, { name = "TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x", decl = rt.int(-1.0), id = "TestResult_flow/setDelay and cancelDelay_One node, 3 pending\n[done] 3x" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null" }, { name = "TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_[cancel] sets\nlastDelay null" }, { name = "TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays", decl = rt.bool(true), id = "TestResult_flow/setDelay and cancelDelay_[cancel] cancels all\npending delays" }, { name = "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_cancelDelay null ref\nFlow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_cancelDelay fired ref\nFlow [out]" } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 2.5 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local delay1 = rt.delayState()
  local delay2 = rt.delayState()
  local delay3 = rt.delayState()
  local delay4 = rt.delayState()
  local delay5 = rt.delayState()
  local delay6 = rt.delayState()
  local delay7 = rt.delayState()
  local delay8 = rt.delayState()
  local delay9 = rt.delayState()
  local delay10 = rt.delayState()
  local delay11 = rt.delayState()
  local delay12 = rt.delayState()
  local delay13 = rt.delayState()
  local delay14 = rt.delayState()
  local delay15 = rt.delayState()
  local delay16 = rt.delayState()
  local delay17 = rt.delayState()
  local delay18 = rt.delayState()
  local delay19 = rt.delayState()
  local delay20 = rt.delayState()
  local delay21 = rt.delayState()
  local delay22 = rt.delayState()
  local delay23 = rt.delayState()
  local proc45, proc131, proc182, proc197, proc204
  proc45 = function()
    local t1 = rt.tickTime()
    rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0.1)", { m.select(m.isNaN(t1), 0.0, t1) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6, 1.0 })
    local t2 = rt.tickTime()
    V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6
  end
  proc131 = function()
    rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", { rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef = delay9.lastRef }, "ref").isValid, true })
    V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef = delay9.lastRef }, "ref").isValid
  end
  proc182 = function()
    local function cont1()
      V.counter2 = m.addInt(V.counter2, 1.0)
    end
    rt.setDelay(delay17, 0.3, cont1)
  end
  proc197 = function()
    local function cont1()
      if rt.ptrSet("/nodes/76/translation", "float3", { 0.0, 0.0, 0.8 }) then
        if rt.ptrSet("/nodes/78/translation", "float3", { 0.0, 0.0, 0.0 }) then
          rt.log("ERROR! <flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Flow triggered! This should not happened!")
          V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays = false
        end
      end
    end
    rt.setDelay(delay19, 0.3, cont1)
  end
  proc204 = function()
    rt.log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Value is {0}, should be {1} ", { m.refEq(delay19.lastRef, ""), true })
    V.TestResult_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(delay19.lastRef, "")
  end
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ then
          rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [done]>: Flow not triggered! This should not happened!")
        end
      end
      if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay then
          rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Failed")
        end
      end
      if rt.ptrSet("/nodes/6/translation", "float3", { 0.0, 0.0, 0.0 }) then
        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ = m.eqInt(V.counter1, 1.0)
        if m.eqInt(V.counter1, 1.0) then
          if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
            if rt.ptrSet("/nodes/6/translation", "float3", { 0.0, 0.0, 0.0 }) then
              rt.log("<flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered correct amount")
              V.TestResult_flow_setDelay_and_cancelDelay_Flow__out_ = V.counter1
            end
          end
        else
          rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [out]>: Flow got triggered {0} times from 1. This should not happened!", { V.counter1 })
        end
      end
    end
    if rt.setDelay(delay2, 2.0, cont1).ok then
      local t1 = rt.tickTime()
      V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 = m.select(m.isNaN(t1), 0.0, t1)
      local function cont2()
        if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true
          end
        end
        if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
          local t2 = rt.tickTime()
          if m.abs(m.select(m.isNaN(t2), 0.0, t2) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1 then
            if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
                local t3 = rt.tickTime()
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs(m.select(m.isNaN(t3), 0.0, t3) - V.startTime_ca9af277_a001_44a7_bbd2_b3e9d2eafea6 - 1.0) < 0.1
                rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful")
                proc45()
              end
            end
          else
            proc45()
          end
        end
      end
      if rt.setDelay(delay1, 1.0, cont2).ok then
        V.counter1 = m.addInt(V.counter1, 1.0)
      end
    end
  end)
  rt.onTick(function(timeSinceStart, timeSinceLastTick)
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/30/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ then
          rt.log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful")
        end
      end
    end
    if rt.setDelay(delay4, 2.0, cont1).ok then
      local function cont2()
        if rt.ptrSet("/nodes/28/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/30/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false
          end
        end
      end
      rt.setDelay(delay3, 1.0, cont2)
      rt.cancelDelaySlot(delay3)
    end
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/36/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered then
          rt.log("<flow/setDelay and cancelDelay - cancelDelay triggered>: Test Successful")
        end
      end
      if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ then
        rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow not triggered! This should not happened!")
      end
    end
    if rt.setDelay(delay6, 2.0, cont1).ok then
      local function cont2()
        if rt.ptrSet("/nodes/34/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/36/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay triggered>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false
          end
        end
      end
      rt.setDelay(delay5, 1.0, cont2)
      rt.cancelDelay(delay5.lastRef)
      if rt.ptrSet("/nodes/41/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/setDelay and cancelDelay - cancelDelay Flow [out]>: Flow triggered")
        V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ = true
      end
    end
  end)
  rt.onStart(function()
    local function cont1()
      if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ then
        rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err]>: Flow not triggered! This should not happened!")
      end
    end
    if rt.setDelay(delay8, 2.0, cont1).ok then
      if not rt.setDelay(delay7, -1.0, nil).ok then
        if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
          rt.log("<flow/setDelay and cancelDelay - Flow [err]>: Flow triggered")
          V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ = true
        end
      end
    end
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid then
          rt.log("ERROR! <flow/setDelay and cancelDelay - lastDelayref isValid>: Test Failed")
        end
      end
    end
    if rt.setDelay(delay10, 0.5, cont1).ok then
      if rt.setDelay(delay9, 2.0, nil).ok then
        if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.0 }) then
          if rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef = delay9.lastRef }, "ref").isValid == true then
            if rt.ptrSet("/nodes/47/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.0 }) then
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef = delay9.lastRef }, "ref").isValid == true
                rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Test Successful")
                proc131()
              end
            end
          else
            proc131()
          end
        end
      end
    end
  end)
  rt.onStart(function()
    if not rt.setDelay(delay11, m.NaN(), nil).ok then
      if rt.ptrSet("/nodes/53/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow triggered")
        V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ = true
      end
    end
    if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ then
      rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err](NaN)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    if not rt.setDelay(delay12, m.Inf(), nil).ok then
      if rt.ptrSet("/nodes/59/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow triggered")
        V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ = true
      end
    end
    if not V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ then
      rt.log("ERROR! <flow/setDelay and cancelDelay - Flow [err](+Inf)>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/66/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order then
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order not triggered! This should not happened!")
        end
      end
    end
    if rt.setDelay(delay16, 1.5, cont1).ok then
      local function cont2()
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1.0)
        if m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 3.0) then
          if rt.ptrSet("/nodes/65/translation", "float3", { 0.0, 0.0, 0.8 }) then
            if rt.ptrSet("/nodes/66/translation", "float3", { 0.0, 0.0, 0.0 }) then
              rt.log("<flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Correct flow order triggered")
              V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order = true
            end
          end
        else
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
          V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000.0
        end
      end
      rt.setDelay(delay13, 0.6, cont2)
      local function cont3()
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1.0)
        if not m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1.0) then
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
          V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000.0
        end
      end
      rt.setDelay(delay14, 0.2, cont3)
      local function cont4()
        V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = m.addInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 1.0)
        if not m.eqInt(V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362, 2.0) then
          rt.log("ERROR! <flow/setDelay and cancelDelay - Concurrent delays[done] in time order>: Incorrect flow order triggered! Expected Socket Id: done")
          V.FlowSequenceCount_b8e69ef5_14a6_4dbe_b4e1_3335901db362 = -1000.0
        end
      end
      rt.setDelay(delay15, 0.4, cont4)
    end
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/72/translation", "float3", { 0.0, 0.0, 0.0 }) then
        V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = m.eqInt(V.counter2, 3.0)
        if m.eqInt(V.counter2, 3.0) then
          if rt.ptrSet("/nodes/71/translation", "float3", { 0.0, 0.0, 0.8 }) then
            if rt.ptrSet("/nodes/72/translation", "float3", { 0.0, 0.0, 0.0 }) then
              rt.log("<flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered correct amount")
              V.TestResult_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x = V.counter2
            end
          end
        else
          rt.log("ERROR! <flow/setDelay and cancelDelay - One node, 3 pending[done] 3x>: Flow got triggered {0} times from 3. This should not happened!", { V.counter2 })
        end
      end
    end
    if rt.setDelay(delay18, 1.0, cont1).ok then
      proc182()
      proc182()
      proc182()
    end
  end)
  rt.onStart(function()
    local function cont1()
      if not V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null then
        rt.log("ERROR! <flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Failed")
      end
      if rt.ptrSet("/nodes/78/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays then
          rt.log("<flow/setDelay and cancelDelay - [cancel] cancels allpending delays>: Test Successful")
        end
      end
    end
    if rt.setDelay(delay20, 1.0, cont1).ok then
      proc197()
      proc197()
      proc197()
      rt.cancelDelaySlot(delay19)
      if m.refEq(delay19.lastRef, "") == true then
        if rt.ptrSet("/nodes/83/translation", "float3", { 0.0, 0.0, 0.8 }) then
          V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null = m.refEq(delay19.lastRef, "") == true
          rt.log("<flow/setDelay and cancelDelay - [cancel] setslastDelay null>: Test Successful")
          proc204()
        end
      else
        proc204()
      end
    end
  end)
  rt.onStart(function()
    rt.cancelDelay("")
    if rt.ptrSet("/nodes/89/translation", "float3", { 0.0, 0.0, 0.8 }) then
      rt.log("<flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow triggered")
      V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ = true
    end
    if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ then
      rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay null refFlow [out]>: Flow not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/96/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ then
          rt.log("ERROR! <flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow not triggered! This should not happened!")
        end
      end
    end
    if rt.setDelay(delay22, 1.0, cont1).ok then
      local function cont2()
        rt.cancelDelay(delay21.lastRef)
        if rt.ptrSet("/nodes/95/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/96/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("<flow/setDelay and cancelDelay - cancelDelay fired refFlow [out]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ = true
          end
        end
      end
      rt.setDelay(delay21, 0.1, cont2)
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    local function cont1()
      if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ and V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err___NaN_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err____Inf_ and V.TestResult_flow_setDelay_and_cancelDelay_Concurrent_delays__done__in_time_order and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_One_node__3_pending__done__3x and V.TestResult_flow_setDelay_and_cancelDelay__cancel__cancels_all_pending_delays and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay__cancel__sets_lastDelay_null and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_null_ref_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_fired_ref_Flow__out_ then
        rt.send(E.test_onSuccess)
      else
        rt.send(E.test_onFailed)
      end
    end
    rt.setDelay(delay23, 2.5, cont1)
  end)
end
