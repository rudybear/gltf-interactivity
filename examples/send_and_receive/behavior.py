import gltfi_runtime.m as m
from types import SimpleNamespace

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"TestResult_event_send_and_receive_Without_Parameters": rt.with_id("TestResult_event/send and receive_Without Parameters", rt.bool_(False)), "TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_": rt.with_id("TestResult_HasPassed_event/send and receive_Default Event Value (Int)", rt.bool_(False)), "TestResult_event_send_and_receive_Default_Event_Value__Int_": rt.with_id("TestResult_event/send and receive_Default Event Value (Int)", rt.int_(-1)), "TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_": rt.with_id("TestResult_HasPassed_event/send and receive_Default Event Value (Bool)", rt.bool_(False)), "TestResult_event_send_and_receive_Default_Event_Value__Bool_": rt.with_id("TestResult_event/send and receive_Default Event Value (Bool)", rt.bool_(False)), "TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_": rt.with_id("TestResult_HasPassed_event/send and receive_Default Event Value (Float)", rt.bool_(False)), "TestResult_event_send_and_receive_Default_Event_Value__Float_": rt.with_id("TestResult_event/send and receive_Default Event Value (Float)", rt.float_(-0.0142)), "TestResult_event_send_and_receive_With_Parameters__flow_received_": rt.with_id("TestResult_event/send and receive_With Parameters (flow received)", rt.bool_(False)), "TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int": rt.with_id("TestResult_HasPassed_event/send and receive_Rcv Parameter Int", rt.bool_(False)), "TestResult_event_send_and_receive_Rcv_Parameter_Int": rt.with_id("TestResult_event/send and receive_Rcv Parameter Int", rt.int_(-1)), "TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool": rt.with_id("TestResult_HasPassed_event/send and receive_Rcv Parameter Bool", rt.bool_(False)), "TestResult_event_send_and_receive_Rcv_Parameter_Bool": rt.with_id("TestResult_event/send and receive_Rcv Parameter Bool", rt.bool_(False)), "TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float": rt.with_id("TestResult_HasPassed_event/send and receive_Rcv Parameter Float", rt.bool_(False)), "TestResult_event_send_and_receive_Rcv_Parameter_Float": rt.with_id("TestResult_event/send and receive_Rcv Parameter Float", rt.float_(-0.0142))})
    E = rt.events({"_eventWithoutParametersc4e07561_c3c3_45c9_9e77_6f018199c43d": {"externalId": "_eventWithoutParametersc4e07561-c3c3-45c9-9e77-6f018199c43d"}, "_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8": {"externalId": "_eventWithParametersd3cacc96-a187-4d39-8e70-60056ba442f8", "defaultBool": False, "defaultInt": 1, "defaultFloat": 1.0}, "test_onStart": {"externalId": "test/onStart", "expectedDuration": 1.5}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    S = SimpleNamespace()
    S.delay1 = rt.delay_state()
    S.delay2 = rt.delay_state()
    S.delay3 = rt.delay_state()
    def proc46() -> None:
        rt.log("<event/send and receive - Default Event Value (Int)>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[1], 1])
        V.TestResult_event_send_and_receive_Default_Event_Value__Int_ = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[1]
    def proc52() -> None:
        rt.log("<event/send and receive - Default Event Value (Bool)>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[0], False])
        V.TestResult_event_send_and_receive_Default_Event_Value__Bool_ = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[0]
    def proc58() -> None:
        rt.log("<event/send and receive - Default Event Value (Float)>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[2], 1.0])
        V.TestResult_event_send_and_receive_Default_Event_Value__Float_ = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[2]
    def proc94() -> None:
        rt.log("<event/send and receive - Rcv Parameter Int>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[1], 2])
        V.TestResult_event_send_and_receive_Rcv_Parameter_Int = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[1]
    def proc102() -> None:
        rt.log("<event/send and receive - Rcv Parameter Bool>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[0], True])
        V.TestResult_event_send_and_receive_Rcv_Parameter_Bool = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[0]
    def proc110() -> None:
        rt.log("<event/send and receive - Rcv Parameter Float>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[2], 2.0])
        V.TestResult_event_send_and_receive_Rcv_Parameter_Float = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[2]
    def __on_start_0() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_event_send_and_receive_Without_Parameters:
                    rt.log("ERROR! <event/send and receive - Without Parameters>: Flow not triggered! This should not happened!")
            if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_:
                rt.log("ERROR! <event/send and receive - Default Event Value (Int)>: Test Failed")
            if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_:
                rt.log("ERROR! <event/send and receive - Default Event Value (Bool)>: Test Failed")
            if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_:
                rt.log("ERROR! <event/send and receive - Default Event Value (Float)>: Test Failed")
        if rt.set_delay(S.delay1, 1.0, cont1)["ok"]:
            rt.send(E["_eventWithoutParametersc4e07561_c3c3_45c9_9e77_6f018199c43d"])
            if m.eqInt(rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[1], 1):
                if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ = m.eqInt(rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[1], 1)
                    rt.log("<event/send and receive - Default Event Value (Int)>: Test Successful")
                    proc46()
            else:
                proc46()
            if rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[0] == False:
                if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[0] == False
                    rt.log("<event/send and receive - Default Event Value (Bool)>: Test Successful")
                    proc52()
            else:
                proc52()
            if rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[2] == 1.0:
                if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
                    V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ = rt.event_payload(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"])[2] == 1.0
                    rt.log("<event/send and receive - Default Event Value (Float)>: Test Successful")
                    proc58()
            else:
                proc58()
    rt.on_start(__on_start_0)
    def __on_receive_1(payload: list) -> None:
        if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
            if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
                rt.log("<event/send and receive - Without Parameters>: Flow triggered")
                V.TestResult_event_send_and_receive_Without_Parameters = True
    rt.on_receive(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"], __on_receive_1)
    def __on_receive_2(payload: list) -> None:
        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                rt.log("<event/send and receive - With Parameters (flow received)>: Flow triggered")
                V.TestResult_event_send_and_receive_With_Parameters__flow_received_ = True
        if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
            if m.eqInt(payload[1], 2):
                if rt.ptr_set("/nodes/35/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                        V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int = m.eqInt(payload[1], 2)
                        rt.log("<event/send and receive - Rcv Parameter Int>: Test Successful")
                        proc94()
            else:
                proc94()
        if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.0]):
            if payload[0] == True:
                if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.0]):
                        V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool = payload[0] == True
                        rt.log("<event/send and receive - Rcv Parameter Bool>: Test Successful")
                        proc102()
            else:
                proc102()
        if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
            if payload[2] == 2.0:
                if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                    if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                        V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float = payload[2] == 2.0
                        rt.log("<event/send and receive - Rcv Parameter Float>: Test Successful")
                        proc110()
            else:
                proc110()
    rt.on_receive(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"], __on_receive_2)
    def __on_start_3() -> None:
        def cont1() -> None:
            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_event_send_and_receive_With_Parameters__flow_received_:
                    rt.log("ERROR! <event/send and receive - With Parameters (flow received)>: Flow not triggered! This should not happened!")
            if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int:
                    rt.log("ERROR! <event/send and receive - Rcv Parameter Int>: Test Failed")
            if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool:
                    rt.log("ERROR! <event/send and receive - Rcv Parameter Bool>: Test Failed")
            if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float:
                    rt.log("ERROR! <event/send and receive - Rcv Parameter Float>: Test Failed")
        if rt.set_delay(S.delay2, 1.0, cont1)["ok"]:
            rt.send(E["_eventWithParametersd3cacc96_a187_4d39_8e70_60056ba442f8"], [True, 2, 2.0, 0.0])
    rt.on_start(__on_start_3)
    def __on_start_4() -> None:
        rt.send(E["test_onStart"])
        def cont1() -> None:
            if V.TestResult_event_send_and_receive_Without_Parameters and V.TestResult_event_send_and_receive_With_Parameters__flow_received_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float:
                rt.send(E["test_onSuccess"])
            else:
                rt.send(E["test_onFailed"])
        rt.set_delay(S.delay3, 1.5, cont1)
    rt.on_start(__on_start_4)
