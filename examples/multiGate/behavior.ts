import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243: rt.withId("FlowSequenceCount_00e3d061-1e6e-42ae-8585-73ffa25c2243", rt.int(0)), TestResult_flow_multiGate_Order__008__004__001_____001__004__008_: rt.withId("TestResult_flow/multiGate_Order (008, 004, 001) > (001, 004, 008)", rt.bool(false)), FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754: rt.withId("FlowSequenceCount_70dfdacb-3908-4f39-88cf-51ca722c5754", rt.int(0)), TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_: rt.withId("TestResult_flow/multiGate_isRandom \"yes\" uses default configuration (in order)", rt.bool(false)), FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4: rt.withId("FlowTrigger_fabf81e4-f41c-49ee-896c-05e0f948a7a4", rt.bool(false)), FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d: rt.withId("FlowTrigger_cb1a4da7-dd9f-497e-99d8-0c003e9adf0d", rt.bool(false)), FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91: rt.withId("FlowTrigger_bbb368cd-759a-4962-a85f-fa4f39798b91", rt.bool(false)), FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5: rt.withId("FlowTrigger_02640624-2ae5-4514-833f-8e1da52f49a5", rt.bool(false)), TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_: rt.withId("TestResult_flow/multiGate_Random (Check if all out flows are triggered once)", rt.bool(false)), FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c: rt.withId("FlowTrigger_f245bad9-9eb7-4cbd-81d7-54d6d997bd4c", rt.bool(false)), FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df: rt.withId("FlowTrigger_b55a8dcb-98bd-4eb6-af81-1d6262dca1df", rt.bool(false)), FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7: rt.withId("FlowTrigger_8e7b8f6a-e2c3-484f-b86f-6ad8859c05f7", rt.bool(false)), FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e: rt.withId("FlowTrigger_83f90829-64c3-4720-b88f-8781f3fbb60e", rt.bool(false)), TestResult_flow_multiGate_Loop: rt.withId("TestResult_flow/multiGate_Loop", rt.bool(false)), counter1: rt.withId("18f3cfd3-47c6-4a0b-b403-80b897bea0b4", rt.int(0)), FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5: rt.withId("FlowTrigger_d685c2d7-92cb-48cf-a155-7e2f80df5ba5", rt.bool(false)), FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d: rt.withId("FlowTrigger_5aab630a-967a-4a34-b13c-7002bc38358d", rt.bool(false)), FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77: rt.withId("FlowTrigger_da7cea26-162c-4bce-9adf-bece75dced77", rt.bool(false)), TestResult_flow_multiGate_Reset_Loop: rt.withId("TestResult_flow/multiGate_Reset Loop", rt.bool(false)), counter2: rt.withId("25e7ec66-c341-4c71-9dd2-27bd33f6d77a", rt.int(0)), TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation: rt.withId("TestResult_HasPassed_flow/multiGate_[lastIndex] -1 before activation", rt.bool(false)), TestResult_flow_multiGate__lastIndex___1_before_activation: rt.withId("TestResult_flow/multiGate_[lastIndex] -1 before activation", rt.int(-1)), TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations: rt.withId("TestResult_HasPassed_flow/multiGate_[lastIndex] 1 after two activations", rt.bool(false)), TestResult_flow_multiGate__lastIndex__1_after_two_activations: rt.withId("TestResult_flow/multiGate_[lastIndex] 1 after two activations", rt.int(-1)), TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used: rt.withId("TestResult_HasPassed_flow/multiGate_[lastIndex] stays 2 when all outputs are used", rt.bool(false)), TestResult_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used: rt.withId("TestResult_flow/multiGate_[lastIndex] stays 2 when all outputs are used", rt.int(-1)), TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_: rt.withId("TestResult_HasPassed_flow/multiGate_[lastIndex] -1 after [reset]", rt.bool(false)), TestResult_flow_multiGate__lastIndex___1_after__reset_: rt.withId("TestResult_flow/multiGate_[lastIndex] -1 after [reset]", rt.int(-1)), counter3: rt.withId("8e0cbf66-7cf5-4332-88e5-f9f8c3e7de0f", rt.int(0)), TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_: rt.withId("TestResult_HasPassed_flow/multiGate_No loop: 4th [in] fires nothing (3x total)", rt.bool(false)), TestResult_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_: rt.withId("TestResult_flow/multiGate_No loop: 4th [in] fires nothing (3x total)", rt.int(-1)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const gate1 = rt.multiGateState();
  const gate2 = rt.multiGateState();
  const gate3 = rt.multiGateState();
  const gate4 = rt.multiGateState();
  const gate5 = rt.multiGateState();
  const gate6 = rt.multiGateState();
  function proc11() {
    switch (rt.multiGate(gate1, 3, false, false).index) {
      case 0: {
        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = (V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 + 1) | 0;
        if (!(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 === 1)) {
          rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 001");
          V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000;
        }
        break;
      }
      case 1: {
        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = (V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 + 1) | 0;
        if (!(V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 === 2)) {
          rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 004");
          V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000;
        }
        break;
      }
      case 2: {
        V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = (V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 + 1) | 0;
        if (V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 === 3) {
          if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
            rt.log("<flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order triggered");
            V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ = true;
          }
        } else {
          rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Incorrect flow order triggered! Expected Socket Id: 008");
          V.FlowSequenceCount_00e3d061_1e6e_42ae_8585_73ffa25c2243 = -1000;
        }
        break;
      }
    }
  }
  function proc38() {
    switch (rt.multiGate(gate2, 3, false, false).index) {
      case 0: {
        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = (V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 + 1) | 0;
        if (!(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 === 1)) {
          rt.log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 001");
          V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000;
        }
        break;
      }
      case 1: {
        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = (V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 + 1) | 0;
        if (!(V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 === 2)) {
          rt.log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 002");
          V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000;
        }
        break;
      }
      case 2: {
        V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = (V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 + 1) | 0;
        if (V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 === 3) {
          if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
            rt.log("<flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Correct flow order triggered");
            V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ = true;
          }
        } else {
          rt.log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Incorrect flow order triggered! Expected Socket Id: 003");
          V.FlowSequenceCount_70dfdacb_3908_4f39_88cf_51ca722c5754 = -1000;
        }
        break;
      }
    }
  }
  function proc85() {
    switch (rt.multiGate(gate3, 4, true, false).index) {
      case 0: {
        V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 = true;
        proc90();
        break;
      }
      case 1: {
        V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d = true;
        proc90();
        break;
      }
      case 2: {
        V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 = true;
        proc90();
        break;
      }
      case 3: {
        V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 = true;
        proc90();
        break;
      }
    }
  }
  function proc90() {
    if (V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5 && (V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91 && (V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d && (V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4 && true)))) {
      if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - Random (Check if all out flows are triggered once)>: All Flows triggered (Number: 4)");
        V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ = true;
      }
    }
  }
  function proc112() {
    switch (rt.multiGate(gate4, 3, false, true).index) {
      case 0: {
        V.counter1 = (V.counter1 + 1) | 0;
        if (2 === V.counter1) {
          V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e = true;
          proc129();
        } else {
          V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c = true;
          proc129();
        }
        break;
      }
      case 1: {
        V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df = true;
        proc129();
        break;
      }
      case 2: {
        V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 = true;
        proc129();
        break;
      }
    }
  }
  function proc129() {
    if (V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e && (V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7 && (V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df && (V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c && true)))) {
      if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - Loop>: All Flows triggered (Number: 4)");
        V.TestResult_flow_multiGate_Loop = true;
      }
    }
  }
  function proc143() {
    switch (rt.multiGate(gate5, 3, false, true).index) {
      case 0: {
        V.counter2 = (V.counter2 + 1) | 0;
        if (2 === V.counter2) {
          V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 = true;
          proc158();
        } else {
          V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 = true;
          proc158();
        }
        break;
      }
      case 1: {
        V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d = true;
        proc158();
        break;
      }
      case 2: {
        break;
      }
    }
  }
  function proc158() {
    if (V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77 && (V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d && (V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5 && true))) {
      if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - Reset Loop>: All Flows triggered (Number: 3)");
        V.TestResult_flow_multiGate_Reset_Loop = true;
      }
    }
  }
  function proc184() {
    rt.log("<flow/multiGate - [lastIndex] -1 before activation>: Value is {0}, should be {1} ", [gate6.lastIndex, -1]);
    V.TestResult_flow_multiGate__lastIndex___1_before_activation = gate6.lastIndex;
  }
  function proc178() {
    switch (rt.multiGate(gate6, 3, false, false).index) {
      case 0: {
        proc209();
        break;
      }
      case 1: {
        proc209();
        break;
      }
      case 2: {
        proc209();
        break;
      }
    }
  }
  function proc209() {
    V.counter3 = (V.counter3 + 1) | 0;
  }
  function proc191() {
    rt.log("<flow/multiGate - [lastIndex] 1 after two activations>: Value is {0}, should be {1} ", [gate6.lastIndex, 1]);
    V.TestResult_flow_multiGate__lastIndex__1_after_two_activations = gate6.lastIndex;
  }
  function proc198() {
    rt.log("<flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Value is {0}, should be {1} ", [gate6.lastIndex, 2]);
    V.TestResult_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used = gate6.lastIndex;
  }
  function proc205() {
    rt.log("<flow/multiGate - [lastIndex] -1 after [reset]>: Value is {0}, should be {1} ", [gate6.lastIndex, -1]);
    V.TestResult_flow_multiGate__lastIndex___1_after__reset_ = gate6.lastIndex;
  }
  rt.onStart(() => {
    proc11();
    proc11();
    proc11();
    if (!V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_) {
      rt.log("ERROR! <flow/multiGate - Order (008, 004, 001) > (001, 004, 008)>: Correct flow order not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    proc38();
    proc38();
    proc38();
    if (!V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_) {
      rt.log("ERROR! <flow/multiGate - isRandom \"yes\" uses default configuration (in order)>: Correct flow order not triggered! This should not happened!");
    }
  });
  rt.onStart(() => {
    proc85();
    proc85();
    proc85();
    proc85();
    if (!V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_) {
      rt.log("ERROR! <flow/multiGate - Random (Check if all out flows are triggered once)>: Not all flows got triggered! This should not happened!");
      rt.log("   State 0 {0}", [V.FlowTrigger_fabf81e4_f41c_49ee_896c_05e0f948a7a4]);
      rt.log("   State 1 {0}", [V.FlowTrigger_cb1a4da7_dd9f_497e_99d8_0c003e9adf0d]);
      rt.log("   State 2 {0}", [V.FlowTrigger_bbb368cd_759a_4962_a85f_fa4f39798b91]);
      rt.log("   State 3 {0}", [V.FlowTrigger_02640624_2ae5_4514_833f_8e1da52f49a5]);
    }
  });
  rt.onStart(() => {
    proc112();
    proc112();
    proc112();
    proc112();
    if (!V.TestResult_flow_multiGate_Loop) {
      rt.log("ERROR! <flow/multiGate - Loop>: Not all flows got triggered! This should not happened!");
      rt.log("   State 0 Flow0:  {0}", [V.FlowTrigger_f245bad9_9eb7_4cbd_81d7_54d6d997bd4c]);
      rt.log("   State 1 Flow1:  {0}", [V.FlowTrigger_b55a8dcb_98bd_4eb6_af81_1d6262dca1df]);
      rt.log("   State 2 Flow2:  {0}", [V.FlowTrigger_8e7b8f6a_e2c3_484f_b86f_6ad8859c05f7]);
      rt.log("   State 3 Flow0 (2.):  {0}", [V.FlowTrigger_83f90829_64c3_4720_b88f_8781f3fbb60e]);
    }
  });
  rt.onStart(() => {
    proc143();
    proc143();
    gate5.used = [];
    gate5.lastIndex = -1;
    proc143();
    if (!V.TestResult_flow_multiGate_Reset_Loop) {
      rt.log("ERROR! <flow/multiGate - Reset Loop>: Not all flows got triggered! This should not happened!");
      rt.log("   State 0 {0}", [V.FlowTrigger_d685c2d7_92cb_48cf_a155_7e2f80df5ba5]);
      rt.log("   State 1 {0}", [V.FlowTrigger_5aab630a_967a_4a34_b13c_7002bc38358d]);
      rt.log("   State 2 {0}", [V.FlowTrigger_da7cea26_162c_4bce_9adf_bece75dced77]);
    }
  });
  rt.onStart(() => {
    if (gate6.lastIndex === -1) {
      if (rt.ptrSet("/nodes/41/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation = gate6.lastIndex === -1;
        rt.log("<flow/multiGate - [lastIndex] -1 before activation>: Test Successful");
        proc184();
      }
    } else {
      proc184();
    }
    proc178();
    proc178();
    if (gate6.lastIndex === 1) {
      if (rt.ptrSet("/nodes/47/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations = gate6.lastIndex === 1;
        rt.log("<flow/multiGate - [lastIndex] 1 after two activations>: Test Successful");
        proc191();
      }
    } else {
      proc191();
    }
    proc178();
    proc178();
    if (gate6.lastIndex === 2) {
      if (rt.ptrSet("/nodes/53/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used = gate6.lastIndex === 2;
        rt.log("<flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Test Successful");
        proc198();
      }
    } else {
      proc198();
    }
    gate6.used = [];
    gate6.lastIndex = -1;
    if (gate6.lastIndex === -1) {
      if (rt.ptrSet("/nodes/59/translation", "float3", [0, 0, 0.8])) {
        V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_ = gate6.lastIndex === -1;
        rt.log("<flow/multiGate - [lastIndex] -1 after [reset]>: Test Successful");
        proc205();
      }
    } else {
      proc205();
    }
    if (!V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation) {
      rt.log("ERROR! <flow/multiGate - [lastIndex] -1 before activation>: Test Failed");
    }
    if (!V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations) {
      rt.log("ERROR! <flow/multiGate - [lastIndex] 1 after two activations>: Test Failed");
    }
    if (!V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used) {
      rt.log("ERROR! <flow/multiGate - [lastIndex] stays 2 when all outputs are used>: Test Failed");
    }
    if (!V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_) {
      rt.log("ERROR! <flow/multiGate - [lastIndex] -1 after [reset]>: Test Failed");
    }
    V.TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ = V.counter3 === 3;
    if (V.counter3 === 3) {
      if (rt.ptrSet("/nodes/35/translation", "float3", [0, 0, 0.8])) {
        rt.log("<flow/multiGate - No loop: 4th [in] fires nothing (3x total)>: Flow got triggered correct amount");
        V.TestResult_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ = V.counter3;
      }
    } else {
      rt.log("ERROR! <flow/multiGate - No loop: 4th [in] fires nothing (3x total)>: Flow got triggered {0} times from 3. This should not happened!", [V.counter3]);
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_flow_multiGate_Loop && V.TestResult_flow_multiGate_Random__Check_if_all_out_flows_are_triggered_once_ && V.TestResult_flow_multiGate_Order__008__004__001_____001__004__008_ && V.TestResult_flow_multiGate_Reset_Loop && V.TestResult_flow_multiGate_isRandom__yes__uses_default_configuration__in_order_ && V.TestResult_HasPassed_flow_multiGate_No_loop__4th__in__fires_nothing__3x_total_ && V.TestResult_HasPassed_flow_multiGate__lastIndex___1_before_activation && V.TestResult_HasPassed_flow_multiGate__lastIndex__1_after_two_activations && V.TestResult_HasPassed_flow_multiGate__lastIndex__stays_2_when_all_outputs_are_used && V.TestResult_HasPassed_flow_multiGate__lastIndex___1_after__reset_) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

