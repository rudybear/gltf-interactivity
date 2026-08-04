  return function(rt)
  local V = rt.vars({ { name = "startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa", decl = rt.float(0.0), id = "startTime_d2ce0a9f-f380-4188-b9c2-b65f1fcb0caa" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__done_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Flow [done]" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [done] \nin correct delay" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay", decl = rt.float(-0.0142), id = "TestResult_flow/setDelay and cancelDelay_Flow [done] \nin correct delay" }, { name = "counter1", decl = rt.int(0.0), id = "7f97a35a-b8a7-4a57-88e6-76f9f19dfa4d" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_Flow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__out_", decl = rt.int(-1.0), id = "TestResult_flow/setDelay and cancelDelay_Flow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_setDelay [cancel]" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_", decl = rt.bool(true), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_setDelay [cancel]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_cancelDelay triggered" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered", decl = rt.bool(true), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_cancelDelay triggered" }, { name = "TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_cancelDelay \nFlow [out]" }, { name = "TestResult_flow_setDelay_and_cancelDelay_Flow__err_", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_Flow [err]" }, { name = "TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", decl = rt.bool(false), id = "TestResult_HasPassed_flow/setDelay and cancelDelay_lastDelay\nref isValid" }, { name = "TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid", decl = rt.bool(false), id = "TestResult_flow/setDelay and cancelDelay_lastDelay\nref isValid" } })
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
  local proc26, proc116
  proc26 = function()
    local t1 = rt.tickTime()
    rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Value is {0}, should be {1} (Proximity range: 0,1)", { m.select(m.isNaN(t1), 0.0, t1) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa, 1.0 })
    local t2 = rt.tickTime()
    V.TestResult_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.select(m.isNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa
  end
  proc116 = function()
    rt.log("<flow/setDelay and cancelDelay - lastDelayref isValid>: Value is {0}, should be {1} ", { rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef = delay9.lastRef }, "ref").isValid, true })
    V.TestResult_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid = rt.ptrGet("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef = delay9.lastRef }, "ref").isValid
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
      V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa = m.select(m.isNaN(t1), 0.0, t1)
      local function cont2()
        if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("<flow/setDelay and cancelDelay - Flow [done]>: Flow triggered")
            V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ = true
          end
        end
        if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
          local t2 = rt.tickTime()
          if m.abs(m.select(m.isNaN(t2), 0.0, t2) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1 then
            if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
              if rt.ptrSet("/nodes/18/translation", "float3", { 0.0, 0.0, 0.0 }) then
                local t3 = rt.tickTime()
                V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay = m.abs(m.select(m.isNaN(t3), 0.0, t3) - V.startTime_d2ce0a9f_f380_4188_b9c2_b65f1fcb0caa - 1.0) < 0.1
                rt.log("<flow/setDelay and cancelDelay - Flow [done] in correct delay>: Test Successful")
                proc26()
              end
            end
          else
            proc26()
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
        if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ then
          rt.log("<flow/setDelay and cancelDelay - setDelay [cancel]>: Test Successful")
        end
      end
    end
    if rt.setDelay(delay4, 2.0, cont1).ok then
      local function cont2()
        if rt.ptrSet("/nodes/28/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/30/translation", "float3", { 0.0, 0.0, 0.0 }) then
            rt.log("ERROR! <flow/setDelay and cancelDelay - setDelay [cancel]>: Flow triggered! This should not happened!")
            V.TestResult_flow_setDelay_and_cancelDelay_setDelay__cancel_ = true
            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ = false
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
        if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered then
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
            V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay_triggered = true
            V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered = false
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
                proc116()
              end
            end
          else
            proc116()
          end
        end
      end
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    local function cont1()
      if V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__out_ and V.TestResult_flow_setDelay_and_cancelDelay_Flow__done_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_Flow__done___in_correct_delay and V.TestResult_flow_setDelay_and_cancelDelay_Flow__err_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_setDelay__cancel_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_cancelDelay_triggered and V.TestResult_flow_setDelay_and_cancelDelay_cancelDelay__Flow__out_ and V.TestResult_HasPassed_flow_setDelay_and_cancelDelay_lastDelay_ref_isValid then
        rt.send(E.test_onSuccess)
      else
        rt.send(E.test_onFailed)
      end
    end
    rt.setDelay(delay11, 2.5, cont1)
  end)
end
