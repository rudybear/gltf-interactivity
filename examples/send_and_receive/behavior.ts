import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ TestResult_event_send_and_receive_Without_Parameters: rt.bool(false), TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_: rt.bool(false), TestResult_event_send_and_receive_Default_Event_Value__Int_: rt.int(-1), TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_: rt.bool(false), TestResult_event_send_and_receive_Default_Event_Value__Bool_: rt.bool(false), TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_: rt.bool(false), TestResult_event_send_and_receive_Default_Event_Value__Float_: rt.float(-0.0142), TestResult_event_send_and_receive_With_Parameters__flow_received_: rt.bool(false), TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int: rt.bool(false), TestResult_event_send_and_receive_Rcv_Parameter_Int: rt.int(-1), TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool: rt.bool(false), TestResult_event_send_and_receive_Rcv_Parameter_Bool: rt.bool(false), TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float: rt.bool(false), TestResult_event_send_and_receive_Rcv_Parameter_Float: rt.float(-0.0142) });
  const E = rt.events({ _eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870: { externalId: "_eventWithoutParametersb6d646f8-2845-4396-bf78-97c3d53c1870" }, _eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc: { externalId: "_eventWithParameters40f08b1d-312c-4968-bed1-f3e2ab96dcbc", defaultBool: false, defaultInt: 1, defaultFloat: 1 }, test_onStart: { externalId: "test/onStart", expectedDuration: 1.5 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const delay1 = rt.delayState();
  const delay2 = rt.delayState();
  const delay3 = rt.delayState();
  function proc17() {
    rt.log("<event/send and receive - Default Event Value (Int)>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1], 1]);
    V.TestResult_event_send_and_receive_Default_Event_Value__Int_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1];
  }
  function proc29() {
    rt.log("<event/send and receive - Default Event Value (Bool)>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[0], false]);
    V.TestResult_event_send_and_receive_Default_Event_Value__Bool_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[0];
  }
  function proc55() {
    rt.log("<event/send and receive - Default Event Value (Float)>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2], 1]);
    V.TestResult_event_send_and_receive_Default_Event_Value__Float_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2];
  }
  function proc79() {
    rt.log("<event/send and receive - Rcv Parameter Int>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1], 2]);
    V.TestResult_event_send_and_receive_Rcv_Parameter_Int = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1];
  }
  function proc93() {
    rt.log("<event/send and receive - Rcv Parameter Bool>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[0], true]);
    V.TestResult_event_send_and_receive_Rcv_Parameter_Bool = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[0];
  }
  function proc106() {
    rt.log("<event/send and receive - Rcv Parameter Float>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2], 2]);
    V.TestResult_event_send_and_receive_Rcv_Parameter_Float = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2];
  }
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/6/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_event_send_and_receive_Without_Parameters) {
          rt.log("ERROR! <event/send and receive - Without Parameters>: Flow not triggered! This should not happened!");
        }
      }
      if (!V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_) {
        rt.log("ERROR! <event/send and receive - Default Event Value (Int)>: Test Failed");
      }
      if (!V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_) {
        rt.log("ERROR! <event/send and receive - Default Event Value (Bool)>: Test Failed");
      }
      if (!V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_) {
        rt.log("ERROR! <event/send and receive - Default Event Value (Float)>: Test Failed");
      }
    }
    if (rt.setDelay(delay1, 1, cont1).ok) {
      rt.send(E._eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870);
      if (rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1] === 1) {
        if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[1] === 1;
          rt.log("<event/send and receive - Default Event Value (Int)>: Test Successful");
          proc17();
        }
      } else {
        proc17();
      }
      if (rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[0] === false) {
        if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[0] === false;
          rt.log("<event/send and receive - Default Event Value (Bool)>: Test Successful");
          proc29();
        }
      } else {
        proc29();
      }
      if (rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2] === 1) {
        if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ = rt.eventPayload(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc)[2] === 1;
          rt.log("<event/send and receive - Default Event Value (Float)>: Test Successful");
          proc55();
        }
      } else {
        proc55();
      }
    }
  });
  rt.onReceive(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, (payload) => {
    if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
      if (rt.ptrSet("/nodes/6/translation", "float3", [0, 0, 0])) {
        rt.log("<event/send and receive - Without Parameters>: Flow triggered");
        V.TestResult_event_send_and_receive_Without_Parameters = true;
      }
    }
  });
  rt.onReceive(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, (payload) => {
    if (rt.ptrSet("/nodes/11/translation", "float3", [0, 0, 0.8])) {
      if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
        rt.log("<event/send and receive - With Parameters (flow received)>: Flow triggered");
        V.TestResult_event_send_and_receive_With_Parameters__flow_received_ = true;
      }
    }
    if (rt.ptrSet("/nodes/36/translation", "float3", [0, 0, 0])) {
      if (payload[1] === 2) {
        if (rt.ptrSet("/nodes/35/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/36/translation", "float3", [0, 0, 0])) {
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int = payload[1] === 2;
            rt.log("<event/send and receive - Rcv Parameter Int>: Test Successful");
            proc79();
          }
        }
      } else {
        proc79();
      }
    }
    if (rt.ptrSet("/nodes/42/translation", "float3", [0, 0, 0])) {
      if (payload[0] === true) {
        if (rt.ptrSet("/nodes/41/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/42/translation", "float3", [0, 0, 0])) {
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool = payload[0] === true;
            rt.log("<event/send and receive - Rcv Parameter Bool>: Test Successful");
            proc93();
          }
        }
      } else {
        proc93();
      }
    }
    if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
      if (payload[2] === 2) {
        if (rt.ptrSet("/nodes/47/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float = payload[2] === 2;
            rt.log("<event/send and receive - Rcv Parameter Float>: Test Successful");
            proc106();
          }
        }
      } else {
        proc106();
      }
    }
  });
  rt.onStart(() => {
    function cont1() {
      if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_event_send_and_receive_With_Parameters__flow_received_) {
          rt.log("ERROR! <event/send and receive - With Parameters (flow received)>: Flow not triggered! This should not happened!");
        }
      }
      if (rt.ptrSet("/nodes/36/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int) {
          rt.log("ERROR! <event/send and receive - Rcv Parameter Int>: Test Failed");
        }
      }
      if (rt.ptrSet("/nodes/42/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool) {
          rt.log("ERROR! <event/send and receive - Rcv Parameter Bool>: Test Failed");
        }
      }
      if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
        if (!V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float) {
          rt.log("ERROR! <event/send and receive - Rcv Parameter Float>: Test Failed");
        }
      }
    }
    if (rt.setDelay(delay2, 1, cont1).ok) {
      rt.send(E._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, [true, 2, 2, 0]);
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    function cont1() {
      if (V.TestResult_event_send_and_receive_Without_Parameters && V.TestResult_event_send_and_receive_With_Parameters__flow_received_ && V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ && V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ && V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ && V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int && V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool && V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float) {
        rt.send(E.test_onSuccess);
      } else {
        rt.send(E.test_onFailed);
      }
    }
    rt.setDelay(delay3, 1.5, cont1);
  });
});

