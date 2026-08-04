extends RefCounted

var m
var rt
var V
var E
var delay1
var delay2
var delay3

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["TestResult_event_send_and_receive_Without_Parameters", rt.bool_var(false), "TestResult_event/send and receive_Without Parameters"], ["TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_", rt.bool_var(false), "TestResult_HasPassed_event/send and receive_Default Event Value (Int)"], ["TestResult_event_send_and_receive_Default_Event_Value__Int_", rt.int_var(-1), "TestResult_event/send and receive_Default Event Value (Int)"], ["TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_", rt.bool_var(false), "TestResult_HasPassed_event/send and receive_Default Event Value (Bool)"], ["TestResult_event_send_and_receive_Default_Event_Value__Bool_", rt.bool_var(false), "TestResult_event/send and receive_Default Event Value (Bool)"], ["TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_", rt.bool_var(false), "TestResult_HasPassed_event/send and receive_Default Event Value (Float)"], ["TestResult_event_send_and_receive_Default_Event_Value__Float_", rt.float_var(-0.0142), "TestResult_event/send and receive_Default Event Value (Float)"], ["TestResult_event_send_and_receive_With_Parameters__flow_received_", rt.bool_var(false), "TestResult_event/send and receive_With Parameters (flow received)"], ["TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int", rt.bool_var(false), "TestResult_HasPassed_event/send and receive_Rcv Parameter Int"], ["TestResult_event_send_and_receive_Rcv_Parameter_Int", rt.int_var(-1), "TestResult_event/send and receive_Rcv Parameter Int"], ["TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool", rt.bool_var(false), "TestResult_HasPassed_event/send and receive_Rcv Parameter Bool"], ["TestResult_event_send_and_receive_Rcv_Parameter_Bool", rt.bool_var(false), "TestResult_event/send and receive_Rcv Parameter Bool"], ["TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float", rt.bool_var(false), "TestResult_HasPassed_event/send and receive_Rcv Parameter Float"], ["TestResult_event_send_and_receive_Rcv_Parameter_Float", rt.float_var(-0.0142), "TestResult_event/send and receive_Rcv Parameter Float"]])
    E = rt.events([["_eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870", {"externalId": "_eventWithoutParametersb6d646f8-2845-4396-bf78-97c3d53c1870"}], ["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc", {"externalId": "_eventWithParameters40f08b1d-312c-4968-bed1-f3e2ab96dcbc", "defaultBool": false, "defaultInt": 1, "defaultFloat": 1.0}], ["test_onStart", {"externalId": "test/onStart", "expectedDuration": 1.5}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    delay1 = rt.delay_state()
    delay2 = rt.delay_state()
    delay3 = rt.delay_state()
    rt.on_start(__on_start_0)
    rt.on_receive(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"], __on_receive_1)
    rt.on_receive(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"], __on_receive_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)

func proc17() -> void:
    rt.log_msg("<event/send and receive - Default Event Value (Int)>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[1], 1])
    V.TestResult_event_send_and_receive_Default_Event_Value__Int_ = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[1]

func proc29() -> void:
    rt.log_msg("<event/send and receive - Default Event Value (Bool)>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[0], false])
    V.TestResult_event_send_and_receive_Default_Event_Value__Bool_ = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[0]

func proc55() -> void:
    rt.log_msg("<event/send and receive - Default Event Value (Float)>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[2], 1.0])
    V.TestResult_event_send_and_receive_Default_Event_Value__Float_ = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[2]

func proc79() -> void:
    rt.log_msg("<event/send and receive - Rcv Parameter Int>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[1], 2])
    V.TestResult_event_send_and_receive_Rcv_Parameter_Int = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[1]

func proc93() -> void:
    rt.log_msg("<event/send and receive - Rcv Parameter Bool>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[0], true])
    V.TestResult_event_send_and_receive_Rcv_Parameter_Bool = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[0]

func proc106() -> void:
    rt.log_msg("<event/send and receive - Rcv Parameter Float>: Value is {0}, should be {1} ", [rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[2], 2.0])
    V.TestResult_event_send_and_receive_Rcv_Parameter_Float = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[2]

func __on_start_0() -> void:
    if rt.set_delay(delay1, 1.0, cont1)["ok"]:
        rt.send(E["_eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870"])
        if m.eqInt(rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[1], 1):
            if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ = m.eqInt(rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[1], 1)
                rt.log_msg("<event/send and receive - Default Event Value (Int)>: Test Successful")
                proc17()
        else:
            proc17()
        if rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[0] == false:
            if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[0] == false
                rt.log_msg("<event/send and receive - Default Event Value (Bool)>: Test Successful")
                proc29()
        else:
            proc29()
        if rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[2] == 1.0:
            if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ = rt.event_payload(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"])[2] == 1.0
                rt.log_msg("<event/send and receive - Default Event Value (Float)>: Test Successful")
                proc55()
        else:
            proc55()

func cont1() -> void:
    if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_event_send_and_receive_Without_Parameters:
            rt.log_msg("ERROR! <event/send and receive - Without Parameters>: Flow not triggered! This should not happened!")
    if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_:
        rt.log_msg("ERROR! <event/send and receive - Default Event Value (Int)>: Test Failed")
    if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_:
        rt.log_msg("ERROR! <event/send and receive - Default Event Value (Bool)>: Test Failed")
    if not V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_:
        rt.log_msg("ERROR! <event/send and receive - Default Event Value (Float)>: Test Failed")

func __on_receive_1(payload: Array) -> void:
    if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/6/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<event/send and receive - Without Parameters>: Flow triggered")
            V.TestResult_event_send_and_receive_Without_Parameters = true

func __on_receive_2(payload: Array) -> void:
    if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
        if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
            rt.log_msg("<event/send and receive - With Parameters (flow received)>: Flow triggered")
            V.TestResult_event_send_and_receive_With_Parameters__flow_received_ = true
    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
        if m.eqInt(payload[1], 2):
            if rt.ptr_set("/nodes/35/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int = m.eqInt(payload[1], 2)
                    rt.log_msg("<event/send and receive - Rcv Parameter Int>: Test Successful")
                    proc79()
        else:
            proc79()
    if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.0]):
        if payload[0] == true:
            if rt.ptr_set("/nodes/41/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool = payload[0] == true
                    rt.log_msg("<event/send and receive - Rcv Parameter Bool>: Test Successful")
                    proc93()
        else:
            proc93()
    if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
        if payload[2] == 2.0:
            if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
                    V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float = payload[2] == 2.0
                    rt.log_msg("<event/send and receive - Rcv Parameter Float>: Test Successful")
                    proc106()
        else:
            proc106()

func __on_start_3() -> void:
    if rt.set_delay(delay2, 1.0, cont2)["ok"]:
        rt.send(E["_eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc"], [true, 2, 2.0, 0.0])

func cont2() -> void:
    if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_event_send_and_receive_With_Parameters__flow_received_:
            rt.log_msg("ERROR! <event/send and receive - With Parameters (flow received)>: Flow not triggered! This should not happened!")
    if rt.ptr_set("/nodes/36/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int:
            rt.log_msg("ERROR! <event/send and receive - Rcv Parameter Int>: Test Failed")
    if rt.ptr_set("/nodes/42/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool:
            rt.log_msg("ERROR! <event/send and receive - Rcv Parameter Bool>: Test Failed")
    if rt.ptr_set("/nodes/48/translation", "float3", [0.0, 0.0, 0.0]):
        if not V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float:
            rt.log_msg("ERROR! <event/send and receive - Rcv Parameter Float>: Test Failed")

func __on_start_4() -> void:
    rt.send(E["test_onStart"])
    rt.set_delay(delay3, 1.5, cont3)

func cont3() -> void:
    if V.TestResult_event_send_and_receive_Without_Parameters and V.TestResult_event_send_and_receive_With_Parameters__flow_received_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ and V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool and V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

