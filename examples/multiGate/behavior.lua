  return function(rt)
  local V = rt.vars({ { name = "FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407", decl = rt.int(0.0) }, { name = "TestResult_flow_multiGate_Order__008__004__001_____001__004__008_", decl = rt.bool(false) }, { name = "FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2", decl = rt.bool(false) }, { name = "FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042", decl = rt.bool(false) }, { name = "FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a", decl = rt.bool(false) }, { name = "FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d", decl = rt.bool(false) }, { name = "TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_", decl = rt.bool(false) }, { name = "FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2", decl = rt.bool(false) }, { name = "FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0", decl = rt.bool(false) }, { name = "FlowTrigger_297e5062_e703_428c_900c_4402a65231c8", decl = rt.bool(false) }, { name = "FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219", decl = rt.bool(false) }, { name = "TestResult_flow_multiGate_Loop", decl = rt.bool(false) }, { name = "counter1", decl = rt.int(0.0) }, { name = "FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f", decl = rt.bool(false) }, { name = "FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05", decl = rt.bool(false) }, { name = "FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1", decl = rt.bool(false) }, { name = "TestResult_flow_multiGate_Reset_Loop", decl = rt.bool(false) }, { name = "counter2", decl = rt.int(0.0) } })
  local E = rt.events({ { name = "test_onStart", decl = { externalId = "test/onStart", expectedDuration = 0.0 } }, { name = "test_onSuccess", decl = { externalId = "test/onSuccess" } }, { name = "test_onFailed", decl = { externalId = "test/onFailed" } } })
  local gate1 = rt.multiGateState()
  local gate2 = rt.multiGateState()
  local gate3 = rt.multiGateState()
  local gate4 = rt.multiGateState()
  local proc1, proc28, proc39, proc56, proc67, proc97, proc106
  proc1 = function()
    local ok1 = rt.multiGate(gate1, 3.0, false, false)
    if ok1.index == 0.0 then
      V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1.0)
      if not m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1.0) then
        rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001")
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000.0
      end
    elseif ok1.index == 1.0 then
      V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1.0)
      if not m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 2.0) then
        rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004")
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000.0
      end
    elseif ok1.index == 2.0 then
      V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = m.addInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 1.0)
      if m.eqInt(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407, 3.0) then
        if rt.ptrSet("/nodes/17/translation", "float3", { 0.0, 0.0, 0.8 }) then
          rt.log("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered")
          V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = true
        end
      else
        rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008")
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000.0
      end
    end
  end
  proc28 = function()
    local ok1 = rt.multiGate(gate2, 4.0, true, false)
    if ok1.index == 0.0 then
      V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 = true
      proc39()
    elseif ok1.index == 1.0 then
      V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 = true
      proc39()
    elseif ok1.index == 2.0 then
      V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a = true
      proc39()
    elseif ok1.index == 3.0 then
      V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d = true
      proc39()
    end
  end
  proc39 = function()
    if V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d and (V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a and (V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 and (V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 and true))) then
      if rt.ptrSet("/nodes/11/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)")
        V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true
      end
    end
  end
  proc56 = function()
    local ok1 = rt.multiGate(gate3, 3.0, false, true)
    if ok1.index == 0.0 then
      V.counter1 = m.addInt(V.counter1, 1.0)
      if m.eqInt(2.0, V.counter1) then
        V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 = true
        proc67()
      else
        V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 = true
        proc67()
      end
    elseif ok1.index == 1.0 then
      V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 = true
      proc67()
    elseif ok1.index == 2.0 then
      V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 = true
      proc67()
    end
  end
  proc67 = function()
    if V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 and (V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 and (V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 and (V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 and true))) then
      if rt.ptrSet("/nodes/5/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/multiGate - Loop>: All Flows triggered (Number: 4)")
        V.TestResult_flow_multiGate_Loop = true
      end
    end
  end
  proc97 = function()
    local ok1 = rt.multiGate(gate4, 3.0, false, true)
    if ok1.index == 0.0 then
      V.counter2 = m.addInt(V.counter2, 1.0)
      if m.eqInt(2.0, V.counter2) then
        V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 = true
        proc106()
      else
        V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f = true
        proc106()
      end
    elseif ok1.index == 1.0 then
      V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 = true
      proc106()
    elseif ok1.index == 2.0 then
    end
  end
  proc106 = function()
    if V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 and (V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 and (V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f and true)) then
      if rt.ptrSet("/nodes/23/translation", "float3", { 0.0, 0.0, 0.8 }) then
        rt.log("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)")
        V.TestResult_flow_multiGate_Reset_Loop = true
      end
    end
  end
  rt.onStart(function()
    proc1()
    proc1()
    proc1()
    if not V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ then
      rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!")
    end
  end)
  rt.onStart(function()
    proc28()
    proc28()
    proc28()
    proc28()
    if not V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ then
      rt.log("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!")
      rt.log("   State 0 {0}", { V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 })
      rt.log("   State 1 {0}", { V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 })
      rt.log("   State 2 {0}", { V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a })
      rt.log("   State 3 {0}", { V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d })
    end
  end)
  rt.onStart(function()
    proc56()
    proc56()
    proc56()
    proc56()
    if not V.TestResult_flow_multiGate_Loop then
      rt.log("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!")
      rt.log("   State 0 Flow0:  {0}", { V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 })
      rt.log("   State 1 Flow1:  {0}", { V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 })
      rt.log("   State 2 Flow2:  {0}", { V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 })
      rt.log("   State 3 Flow0 (2.):  {0}", { V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 })
    end
  end)
  rt.onStart(function()
    proc97()
    proc97()
    gate4.used = {}
    gate4.lastIndex = -1.0
    proc97()
    if not V.TestResult_flow_multiGate_Reset_Loop then
      rt.log("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!")
      rt.log("   State 0 {0}", { V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f })
      rt.log("   State 1 {0}", { V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 })
      rt.log("   State 2 {0}", { V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 })
    end
  end)
  rt.onStart(function()
    rt.send(E.test_onStart)
    if V.TestResult_flow_multiGate_Loop and V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ and V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ and V.TestResult_flow_multiGate_Reset_Loop then
      rt.send(E.test_onSuccess)
    else
      rt.send(E.test_onFailed)
    end
  end)
end
