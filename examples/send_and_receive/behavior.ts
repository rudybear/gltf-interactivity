import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ TestResult_event_send_and_receive_Without_Parameters: rt.withId("TestResult_event/send and receive_Without Parameters", rt.bool(false)), TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_: rt.withId("TestResult_HasPassed_event/send and receive_Default Event Value (Int)", rt.bool(false)), TestResult_event_send_and_receive_Default_Event_Value__Int_: rt.withId("TestResult_event/send and receive_Default Event Value (Int)", rt.int(-1)), TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_: rt.withId("TestResult_HasPassed_event/send and receive_Default Event Value (Bool)", rt.bool(false)), TestResult_event_send_and_receive_Default_Event_Value__Bool_: rt.withId("TestResult_event/send and receive_Default Event Value (Bool)", rt.bool(false)), TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_: rt.withId("TestResult_HasPassed_event/send and receive_Default Event Value (Float)", rt.bool(false)), TestResult_event_send_and_receive_Default_Event_Value__Float_: rt.withId("TestResult_event/send and receive_Default Event Value (Float)", rt.float(-0.0142)), TestResult_event_send_and_receive_With_Parameters__flow_received_: rt.withId("TestResult_event/send and receive_With Parameters (flow received)", rt.bool(false)), TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int: rt.withId("TestResult_HasPassed_event/send and receive_Rcv Parameter Int", rt.bool(false)), TestResult_event_send_and_receive_Rcv_Parameter_Int: rt.withId("TestResult_event/send and receive_Rcv Parameter Int", rt.int(-1)), TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool: rt.withId("TestResult_HasPassed_event/send and receive_Rcv Parameter Bool", rt.bool(false)), TestResult_event_send_and_receive_Rcv_Parameter_Bool: rt.withId("TestResult_event/send and receive_Rcv Parameter Bool", rt.bool(false)), TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float: rt.withId("TestResult_HasPassed_event/send and receive_Rcv Parameter Float", rt.bool(false)), TestResult_event_send_and_receive_Rcv_Parameter_Float: rt.withId("TestResult_event/send and receive_Rcv Parameter Float", rt.float(-0.0142)) });
  const E = rt.events({ _eventWithoutParametersc4e07561_c3c3_45c9_9e77_6f018199c43d: { externalId: "_eventWithoutParametersc4e07561-c3c3-45c9-9e77-6f018199c43d" }, _eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8: { externalId: "_eventWithParametersd3cacc96-a187-4d39-8e70-60056ba442f8", defaultBool: false, defaultInt: 1, defaultFloat: 1 }, test_onStart: { externalId: "test/onStart", expectedDuration: 1.5 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  const delay1 = rt.delayState();
  const delay2 = rt.delayState();
  const delay3 = rt.delayState();
  function proc46() {
    rt.log("<event/send and receive - Default Event Value (Int)>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[1], 1]);
    V.TestResult_event_send_and_receive_Default_Event_Value__Int_ = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[1];
  }
  function proc52() {
    rt.log("<event/send and receive - Default Event Value (Bool)>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[0], false]);
    V.TestResult_event_send_and_receive_Default_Event_Value__Bool_ = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[0];
  }
  function proc58() {
    rt.log("<event/send and receive - Default Event Value (Float)>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[2], 1]);
    V.TestResult_event_send_and_receive_Default_Event_Value__Float_ = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[2];
  }
  function proc94() {
    rt.log("<event/send and receive - Rcv Parameter Int>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[1], 2]);
    V.TestResult_event_send_and_receive_Rcv_Parameter_Int = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[1];
  }
  function proc102() {
    rt.log("<event/send and receive - Rcv Parameter Bool>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[0], true]);
    V.TestResult_event_send_and_receive_Rcv_Parameter_Bool = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[0];
  }
  function proc110() {
    rt.log("<event/send and receive - Rcv Parameter Float>: Value is {0}, should be {1} ", [rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[2], 2]);
    V.TestResult_event_send_and_receive_Rcv_Parameter_Float = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[2];
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
      rt.send(E._eventWithoutParametersc4e07561_c3c3_45c9_9e77_6f018199c43d);
      if (rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[1] === 1) {
        if (rt.ptrSet("/nodes/17/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[1] === 1;
          rt.log("<event/send and receive - Default Event Value (Int)>: Test Successful");
          proc46();
        }
      } else {
        proc46();
      }
      if (rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[0] === false) {
        if (rt.ptrSet("/nodes/23/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[0] === false;
          rt.log("<event/send and receive - Default Event Value (Bool)>: Test Successful");
          proc52();
        }
      } else {
        proc52();
      }
      if (rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[2] === 1) {
        if (rt.ptrSet("/nodes/29/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ = rt.eventPayload(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8)[2] === 1;
          rt.log("<event/send and receive - Default Event Value (Float)>: Test Successful");
          proc58();
        }
      } else {
        proc58();
      }
    }
  });
  rt.onReceive(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8, (payload) => {
    if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
      if (rt.ptrSet("/nodes/6/translation", "float3", [0, 0, 0])) {
        rt.log("<event/send and receive - Without Parameters>: Flow triggered");
        V.TestResult_event_send_and_receive_Without_Parameters = true;
      }
    }
  });
  rt.onReceive(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8, (payload) => {
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
            proc94();
          }
        }
      } else {
        proc94();
      }
    }
    if (rt.ptrSet("/nodes/42/translation", "float3", [0, 0, 0])) {
      if (payload[0] === true) {
        if (rt.ptrSet("/nodes/41/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/42/translation", "float3", [0, 0, 0])) {
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool = payload[0] === true;
            rt.log("<event/send and receive - Rcv Parameter Bool>: Test Successful");
            proc102();
          }
        }
      } else {
        proc102();
      }
    }
    if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
      if (payload[2] === 2) {
        if (rt.ptrSet("/nodes/47/translation", "float3", [0, 0, 0.8])) {
          if (rt.ptrSet("/nodes/48/translation", "float3", [0, 0, 0])) {
            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float = payload[2] === 2;
            rt.log("<event/send and receive - Rcv Parameter Float>: Test Successful");
            proc110();
          }
        }
      } else {
        proc110();
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
      rt.send(E._eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8, [true, 2, 2, 0]);
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

