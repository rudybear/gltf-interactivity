  return function(rt)
  local V = rt.vars({ { name = "TestResult_event_send_and_receive_Without_Parameters", decl = rt.bool(false) }, { name = "TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_", decl = rt.bool(false) }, { name = "TestResult_event_send_and_receive_Default_Event_Value__Int_", decl = rt.int(-1.0) }, { name = "TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_", decl = rt.bool(false) }, { name = "TestResult_event_send_and_receive_Default_Event_Value__Bool_", decl = rt.bool(false) }, { name = "TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_", decl = rt.bool(false) }, { name = "TestResult_event_send_and_receive_Default_Event_Value__Float_", decl = rt.float(-0.0142) }, { name = "TestResult_event_send_and_receive_With_Parameters__flow_received_", decl = rt.bool(false) }, { name = "TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int", decl = rt.bool(false) }, { name = "TestResult_event_send_and_receive_Rcv_Parameter_Int", decl = rt.int(-1.0) }, { name = "TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool", decl = rt.bool(false) }, { name = "TestResult_event_send_and_receive_Rcv_Parameter_Bool", decl = rt.bool(false) }, { name = "TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float", decl = rt.bool(false) }, { name = "TestResult_event_send_and_receive_Rcv_Parameter_Float", decl = rt.float(-0.0142) } })
  local E = rt.events({ { name = "_eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870", decl = { externalId = "_eventWithoutParametersb6d646f8-2845-4396-bf78-97c3d53c1870" } }, { name = "_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc", decl = { externalId = "_eventWithParameters40f08b1d-312c-4968-bed1-f3e2ab96dcbc", defaultBool = false, defaultInt = 1.0, defaultFloat = 1.0 } }, { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 1.5 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local delay1 = rt.delayState()
  local delay2 = rt.delayState()
  local delay3 = rt.delayState()
  local proc17, proc29, proc55, proc79, proc93, proc106
  proc17 = function()
    rt.log("<event/send and receive - Default Event Value (Int)>: Value is {0}, should be {1} ", { rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2], 1.0 })
    V.TestResult_event_send_and_receive_Default_Event_Value__Int_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2]
  end
  proc29 = function()
    rt.log("<event/send and receive - Default Event Value (Bool)>: Value is {0}, should be {1} ", { rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1], false })
    V.TestResult_event_send_and_receive_Default_Event_Value__Bool_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1]
  end
  proc55 = function()
    rt.log("<event/send and receive - Default Event Value (Float)>: Value is {0}, should be {1} ", { rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[3], 1.0 })
    V.TestResult_event_send_and_receive_Default_Event_Value__Float_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[3]
  end
  proc79 = function()
    rt.log("<event/send and receive - Rcv Parameter Int>: Value is {0}, should be {1} ", { rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2], 2.0 })
    V.TestResult_event_send_and_receive_Rcv_Parameter_Int = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2]
  end
  proc93 = function()
    rt.log("<event/send and receive - Rcv Parameter Bool>: Value is {0}, should be {1} ", { rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1], true })
    V.TestResult_event_send_and_receive_Rcv_Parameter_Bool = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1]
  end
  proc106 = function()
    rt.log("<event/send and receive - Rcv Parameter Float>: Value is {0}, should be {1} ", { rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[3], 2.0 })
    V.TestResult_event_send_and_receive_Rcv_Parameter_Float = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[3]
  end
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/6/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_event_send_and_receive_Without_Parameters then
          rt.log("ERROR! <event/send and receive - Without Parameters>: Flow not triggered! This should not happened!")
        end
      end
      if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ then
        rt.log("ERROR! <event/send and receive - Default Event Value (Int)>: Test Failed")
      end
      if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ then
        rt.log("ERROR! <event/send and receive - Default Event Value (Bool)>: Test Failed")
      end
      if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ then
        rt.log("ERROR! <event/send and receive - Default Event Value (Float)>: Test Failed")
      end
    end
    if rt.setDelay(delay1, 1.0, cont1).ok then
      rt.send(E._eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870)
      if m.eqInt(rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2], 1.0) then
        if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ = m.eqInt(rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2], 1.0)
          rt.log("<event/send and receive - Default Event Value (Int)>: Test Successful")
          proc17()
        end
      else
        proc17()
      end
      if rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1] == false then
        if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1] == false
          rt.log("<event/send and receive - Default Event Value (Bool)>: Test Successful")
          proc29()
        end
      else
        proc29()
      end
      if rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[3] == 1.0 then
        if rt.ptrSet("/nodes/29/translation", "float3", { 0.0, 0.0, 0.8 }) then
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[3] == 1.0
          rt.log("<event/send and receive - Default Event Value (Float)>: Test Successful")
          proc55()
        end
      else
        proc55()
      end
    end
  end)
  rt.onReceive(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, function(payload)
    if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
      if rt.ptrSet("/nodes/6/translation", "float3", { 0.0, 0.0, 0.0 }) then
        rt.log("<event/send and receive - Without Parameters>: Flow triggered")
        V.TestResult_event_send_and_receive_Without_Parameters = true
      end
    end
  end)
  rt.onReceive(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, function(payload)
    if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
      if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
        rt.log("<event/send and receive - With Parameters (flow received)>: Flow triggered")
        V.TestResult_event_send_and_receive_With_Parameters__flow_received_ = true
      end
    end
    if rt.ptrSet("/nodes/36/translation", "float3", { 0.0, 0.0, 0.0 }) then
      if m.eqInt(payload[2], 2.0) then
        if rt.ptrSet("/nodes/35/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/36/translation", "float3", { 0.0, 0.0, 0.0 }) then
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int = m.eqInt(payload[2], 2.0)
            rt.log("<event/send and receive - Rcv Parameter Int>: Test Successful")
            proc79()
          end
        end
      else
        proc79()
      end
    end
    if rt.ptrSet("/nodes/42/translation", "float3", { 0.0, 0.0, 0.0 }) then
      if payload[1] == true then
        if rt.ptrSet("/nodes/41/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/42/translation", "float3", { 0.0, 0.0, 0.0 }) then
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool = payload[1] == true
            rt.log("<event/send and receive - Rcv Parameter Bool>: Test Successful")
            proc93()
          end
        end
      else
        proc93()
      end
    end
    if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.0 }) then
      if payload[3] == 2.0 then
        if rt.ptrSet("/nodes/47/translation", "float3", { 0.0, 0.0, 0.8 }) then
          if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.0 }) then
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float = payload[3] == 2.0
            rt.log("<event/send and receive - Rcv Parameter Float>: Test Successful")
            proc106()
          end
        end
      else
        proc106()
      end
    end
  end)
  rt.onStart(function()
    local function cont1()
      if rt.ptrSet("/nodes/12/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_event_send_and_receive_With_Parameters__flow_received_ then
          rt.log("ERROR! <event/send and receive - With Parameters (flow received)>: Flow not triggered! This should not happened!")
        end
      end
      if rt.ptrSet("/nodes/36/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int then
          rt.log("ERROR! <event/send and receive - Rcv Parameter Int>: Test Failed")
        end
      end
      if rt.ptrSet("/nodes/42/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool then
          rt.log("ERROR! <event/send and receive - Rcv Parameter Bool>: Test Failed")
        end
      end
      if rt.ptrSet("/nodes/48/translation", "float3", { 0.0, 0.0, 0.0 }) then
        if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float then
          rt.log("ERROR! <event/send and receive - Rcv Parameter Float>: Test Failed")
        end
      end
    end
    if rt.setDelay(delay2, 1.0, cont1).ok then
      rt.send(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, { true, 2.0, 2.0, 0.0 })
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    local function cont1()
      if V.TestResult_event_send_and_receive_Without_Parameters and V.TestResult_event_send_and_receive_With_Parameters__flow_received_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float then
        rt.send(E.test_onSuccess)
      else
        rt.send(E.test_onFailed)
      end
    end
    rt.setDelay(delay3, 1.5, cont1)
  end)
end
