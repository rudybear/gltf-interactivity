import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407: rt.withId("FlowSequenceCount_4d6b2ece-854e-472a-9d32-d729ba95f407", rt.int(0)), TestResult_flow_multiGate_Order__008__004__001_____001__004__008_: rt.withId("TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)", rt.bool(false)), FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2: rt.withId("FlowTrigger_0ec4af14-ea93-46ce-a5df-16695404c8c2", rt.bool(false)), FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042: rt.withId("FlowTrigger_e50be4f0-c137-4700-8e07-8d76acae1042", rt.bool(false)), FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a: rt.withId("FlowTrigger_214d4c1f-d9df-4042-9dfe-90f62dbadc6a", rt.bool(false)), FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d: rt.withId("FlowTrigger_64736706-47da-49a6-9ca3-7d3fc77ace9d", rt.bool(false)), TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_: rt.withId("TestResult_flow/multiGate_Random (Check if all out flows are triggered once)", rt.bool(false)), FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2: rt.withId("FlowTrigger_4c420572-b7d8-474c-a58d-921b377c23d2", rt.bool(false)), FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0: rt.withId("FlowTrigger_d3646c48-544d-4c39-9110-2290be5657b0", rt.bool(false)), FlowTrigger_297e5062_e703_428c_900c_4402a65231c8: rt.withId("FlowTrigger_297e5062-e703-428c-900c-4402a65231c8", rt.bool(false)), FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219: rt.withId("FlowTrigger_38d0d0c7-12a7-4c24-b82d-b4854f458219", rt.bool(false)), TestResult_flow_multiGate_Loop: rt.withId("TestResult_flow/multiGate_Loop", rt.bool(false)), counter1: rt.withId("fc8156be-fcdf-4726-a2ee-dbee68f9fad2", rt.int(0)), FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f: rt.withId("FlowTrigger_91501428-bbec-4faa-adae-49be2fe8505f", rt.bool(false)), FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05: rt.withId("FlowTrigger_8ec17845-2ef2-4ce8-ad0c-a390ed07fd05", rt.bool(false)), FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1: rt.withId("FlowTrigger_791b5d4b-dece-46a5-9a82-2dd77c35d2a1", rt.bool(false)), TestResult_flow_multiGate_Reset_Loop: rt.withId("TestResult_flow/multiGate_Reset Loop", rt.bool(false)), counter2: rt.withId("bdad9aec-b708-4dae-9ffb-a66e18aab67d", rt.int(0)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const gate1 = rt.multiGateState();
  const gate2 = rt.multiGateState();
  const gate3 = rt.multiGateState();
  const gate4 = rt.multiGateState();
  function proc1() {
    switch (rt.multiGate(gate1, 3, false, false).index) {
      case 0: {
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = (V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 + 1) | 0;
        if (!(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 === 1)) {
          rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001");
          V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000;
        }
        break;
      }
      case 1: {
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = (V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 + 1) | 0;
        if (!(V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 === 2)) {
          rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004");
          V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000;
        }
        break;
      }
      case 2: {
        V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = (V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 + 1) | 0;
        if (V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 === 3) {
          if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
            rt.log("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered");
            V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = true;
          }
        } else {
          rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008");
          V.FlowSequenceCount_4d6b2ece_854e_472a_9d32_d729ba95f407 = -1000;
        }
        break;
      }
    }
  }
  function proc28() {
    switch (rt.multiGate(gate2, 4, true, false).index) {
      case 0: {
        V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 = true;
        proc39();
        break;
      }
      case 1: {
        V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 = true;
        proc39();
        break;
      }
      case 2: {
        V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a = true;
        proc39();
        break;
      }
      case 3: {
        V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d = true;
        proc39();
        break;
      }
    }
  }
  function proc39() {
    if (V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d && (V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a && (V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042 && (V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2 && true)))) {
      if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)");
        V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true;
      }
    }
  }
  function proc56() {
    switch (rt.multiGate(gate3, 3, false, true).index) {
      case 0: {
        V.counter1 = (V.counter1 + 1) | 0;
        if (2 === V.counter1) {
          V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 = true;
          proc67();
        } else {
          V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 = true;
          proc67();
        }
        break;
      }
      case 1: {
        V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 = true;
        proc67();
        break;
      }
      case 2: {
        V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 = true;
        proc67();
        break;
      }
    }
  }
  function proc67() {
    if (V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219 && (V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8 && (V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0 && (V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2 && true)))) {
      if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - Loop>: All Flows triggered (Number: 4)");
        V.TestResult_flow_multiGate_Loop = true;
      }
    }
  }
  function proc97() {
    switch (rt.multiGate(gate4, 3, false, true).index) {
      case 0: {
        V.counter2 = (V.counter2 + 1) | 0;
        if (2 === V.counter2) {
          V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 = true;
          proc106();
        } else {
          V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f = true;
          proc106();
        }
        break;
      }
      case 1: {
        V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 = true;
        proc106();
        break;
      }
      case 2: {
        break;
      }
    }
  }
  function proc106() {
    if (V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1 && (V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05 && (V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f && true))) {
      if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)");
        V.TestResult_flow_multiGate_Reset_Loop = true;
      }
    }
  }
  rt.onStart(() => {
    proc1();
    proc1();
    proc1();
    if (!V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_) {
      rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    proc28();
    proc28();
    proc28();
    proc28();
    if (!V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_) {
      rt.log("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!");
      rt.log("   State 0 {0}", [V.FlowTrigger_0ec4af14_ea93_46ce_a5df_16695404c8c2]);
      rt.log("   State 1 {0}", [V.FlowTrigger_e50be4f0_c137_4700_8e07_8d76acae1042]);
      rt.log("   State 2 {0}", [V.FlowTrigger_214d4c1f_d9df_4042_9dfe_90f62dbadc6a]);
      rt.log("   State 3 {0}", [V.FlowTrigger_64736706_47da_49a6_9ca3_7d3fc77ace9d]);
    }
  });
  rt.onStart(() => {
    proc56();
    proc56();
    proc56();
    proc56();
    if (!V.TestResult_flow_multiGate_Loop) {
      rt.log("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!");
      rt.log("   State 0 Flow0:  {0}", [V.FlowTrigger_4c420572_b7d8_474c_a58d_921b377c23d2]);
      rt.log("   State 1 Flow1:  {0}", [V.FlowTrigger_d3646c48_544d_4c39_9110_2290be5657b0]);
      rt.log("   State 2 Flow2:  {0}", [V.FlowTrigger_297e5062_e703_428c_900c_4402a65231c8]);
      rt.log("   State 3 Flow0 (2.):  {0}", [V.FlowTrigger_38d0d0c7_12a7_4c24_b82d_b4854f458219]);
    }
  });
  rt.onStart(() => {
    proc97();
    proc97();
    gate4.used = [];
    gate4.lastIndex = -1;
    proc97();
    if (!V.TestResult_flow_multiGate_Reset_Loop) {
      rt.log("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!");
      rt.log("   State 0 {0}", [V.FlowTrigger_91501428_bbec_4faa_adae_49be2fe8505f]);
      rt.log("   State 1 {0}", [V.FlowTrigger_8ec17845_2ef2_4ce8_ad0c_a390ed07fd05]);
      rt.log("   State 2 {0}", [V.FlowTrigger_791b5d4b_dece_46a5_9a82_2dd77c35d2a1]);
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_flow_multiGate_Loop && V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ && V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ && V.TestResult_flow_multiGate_Reset_Loop) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

