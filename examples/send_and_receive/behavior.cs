using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public bool TestResult_event_send_and_receive_Without_Parameters { get => E.GetVarBool(0); set => E.SetVarBool(0, value); }
        public bool TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ { get => E.GetVarBool(1); set => E.SetVarBool(1, value); }
        public int TestResult_event_send_and_receive_Default_Event_Value__Int_ { get => E.GetVarInt(2); set => E.SetVarInt(2, value); }
        public bool TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ { get => E.GetVarBool(3); set => E.SetVarBool(3, value); }
        public bool TestResult_event_send_and_receive_Default_Event_Value__Bool_ { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public bool TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ { get => E.GetVarBool(5); set => E.SetVarBool(5, value); }
        public double TestResult_event_send_and_receive_Default_Event_Value__Float_ { get => E.GetVarFloat(6); set => E.SetVarFloat(6, value); }
        public bool TestResult_event_send_and_receive_With_Parameters__flow_received_ { get => E.GetVarBool(7); set => E.SetVarBool(7, value); }
        public bool TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public int TestResult_event_send_and_receive_Rcv_Parameter_Int { get => E.GetVarInt(9); set => E.SetVarInt(9, value); }
        public bool TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public bool TestResult_event_send_and_receive_Rcv_Parameter_Bool { get => E.GetVarBool(11); set => E.SetVarBool(11, value); }
        public bool TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public double TestResult_event_send_and_receive_Rcv_Parameter_Float { get => E.GetVarFloat(13); set => E.SetVarFloat(13, value); }
    }

    public static class Events
    {
        public const int _eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870 = 0;
        public const int _eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc = 1;
        public const int test_onStart = 2;
        public const int test_onSuccess = 3;
        public const int test_onFailed = 4;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("bool", false, "TestResult_event/send and receive_Without Parameters");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_event/send and receive_Default Event Value (Int)");
        rt.DeclareVar("int", -1, "TestResult_event/send and receive_Default Event Value (Int)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_event/send and receive_Default Event Value (Bool)");
        rt.DeclareVar("bool", false, "TestResult_event/send and receive_Default Event Value (Bool)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_event/send and receive_Default Event Value (Float)");
        rt.DeclareVar("float", -0.0142, "TestResult_event/send and receive_Default Event Value (Float)");
        rt.DeclareVar("bool", false, "TestResult_event/send and receive_With Parameters (flow received)");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_event/send and receive_Rcv Parameter Int");
        rt.DeclareVar("int", -1, "TestResult_event/send and receive_Rcv Parameter Int");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_event/send and receive_Rcv Parameter Bool");
        rt.DeclareVar("bool", false, "TestResult_event/send and receive_Rcv Parameter Bool");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_event/send and receive_Rcv Parameter Float");
        rt.DeclareVar("float", -0.0142, "TestResult_event/send and receive_Rcv Parameter Float");
        rt.DeclareEvent("_eventWithoutParametersb6d646f8-2845-4396-bf78-97c3d53c1870", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("_eventWithParameters40f08b1d-312c-4968-bed1-f3e2ab96dcbc", (bool?)false, (int?)1, (double?)1.0, (double?)null);
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)1.5);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        var delay1 = new DelayState();
        var delay2 = new DelayState();
        var delay3 = new DelayState();
        void proc17()
        {
            rt.Log("<event/send and receive - Default Event Value (Int)>: Value is {0}, should be {1} ", new object[] { rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).IntParameter, 1 });
            V.TestResult_event_send_and_receive_Default_Event_Value__Int_ = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).IntParameter;
        }
        void proc29()
        {
            rt.Log("<event/send and receive - Default Event Value (Bool)>: Value is {0}, should be {1} ", new object[] { rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).BoolParameter, false });
            V.TestResult_event_send_and_receive_Default_Event_Value__Bool_ = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).BoolParameter;
        }
        void proc55()
        {
            rt.Log("<event/send and receive - Default Event Value (Float)>: Value is {0}, should be {1} ", new object[] { rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).FloatParameter, 1.0 });
            V.TestResult_event_send_and_receive_Default_Event_Value__Float_ = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).FloatParameter;
        }
        void proc79()
        {
            rt.Log("<event/send and receive - Rcv Parameter Int>: Value is {0}, should be {1} ", new object[] { rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).IntParameter, 2 });
            V.TestResult_event_send_and_receive_Rcv_Parameter_Int = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).IntParameter;
        }
        void proc93()
        {
            rt.Log("<event/send and receive - Rcv Parameter Bool>: Value is {0}, should be {1} ", new object[] { rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).BoolParameter, true });
            V.TestResult_event_send_and_receive_Rcv_Parameter_Bool = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).BoolParameter;
        }
        void proc106()
        {
            rt.Log("<event/send and receive - Rcv Parameter Float>: Value is {0}, should be {1} ", new object[] { rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).FloatParameter, 2.0 });
            V.TestResult_event_send_and_receive_Rcv_Parameter_Float = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).FloatParameter;
        }
        void OnStart0()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/6/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_event_send_and_receive_Without_Parameters)
                    {
                        rt.Log("ERROR! <event/send and receive - Without Parameters>: Flow not triggered! This should not happened!");
                    }
                }
                if (!V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_)
                {
                    rt.Log("ERROR! <event/send and receive - Default Event Value (Int)>: Test Failed");
                }
                if (!V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_)
                {
                    rt.Log("ERROR! <event/send and receive - Default Event Value (Bool)>: Test Failed");
                }
                if (!V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_)
                {
                    rt.Log("ERROR! <event/send and receive - Default Event Value (Float)>: Test Failed");
                }
            }
            if (rt.SetDelay(delay1, 1.0, Cont1))
            {
                rt.Send(Events._eventWithoutParametersb6d646f8_2845_4396_bf78_97c3d53c1870);
                if (rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).IntParameter == 1)
                {
                    if (rt.PtrSet("/nodes/17/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).IntParameter == 1;
                        rt.Log("<event/send and receive - Default Event Value (Int)>: Test Successful");
                        proc17();
                    }
                }
                else
                {
                    proc17();
                }
                if (rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).BoolParameter == false)
                {
                    if (rt.PtrSet("/nodes/23/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).BoolParameter == false;
                        rt.Log("<event/send and receive - Default Event Value (Bool)>: Test Successful");
                        proc29();
                    }
                }
                else
                {
                    proc29();
                }
                if (rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).FloatParameter == 1.0)
                {
                    if (rt.PtrSet("/nodes/29/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ = rt.EventPayloadOf(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc).FloatParameter == 1.0;
                        rt.Log("<event/send and receive - Default Event Value (Float)>: Test Successful");
                        proc55();
                    }
                }
                else
                {
                    proc55();
                }
            }
        }
        rt.OnStart(OnStart0);
        void OnReceive1(EventPayload payload)
        {
            if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
            {
                if (rt.PtrSet("/nodes/6/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    rt.Log("<event/send and receive - Without Parameters>: Flow triggered");
                    V.TestResult_event_send_and_receive_Without_Parameters = true;
                }
            }
        }
        rt.OnReceive(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, OnReceive1);
        void OnReceive2(EventPayload payload)
        {
            if (rt.PtrSet("/nodes/11/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
            {
                if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    rt.Log("<event/send and receive - With Parameters (flow received)>: Flow triggered");
                    V.TestResult_event_send_and_receive_With_Parameters__flow_received_ = true;
                }
            }
            if (rt.PtrSet("/nodes/36/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
            {
                if (payload.IntParameter == 2)
                {
                    if (rt.PtrSet("/nodes/35/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/36/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int = payload.IntParameter == 2;
                            rt.Log("<event/send and receive - Rcv Parameter Int>: Test Successful");
                            proc79();
                        }
                    }
                }
                else
                {
                    proc79();
                }
            }
            if (rt.PtrSet("/nodes/42/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
            {
                if (payload.BoolParameter == true)
                {
                    if (rt.PtrSet("/nodes/41/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/42/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool = payload.BoolParameter == true;
                            rt.Log("<event/send and receive - Rcv Parameter Bool>: Test Successful");
                            proc93();
                        }
                    }
                }
                else
                {
                    proc93();
                }
            }
            if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
            {
                if (payload.FloatParameter == 2.0)
                {
                    if (rt.PtrSet("/nodes/47/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                        {
                            V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float = payload.FloatParameter == 2.0;
                            rt.Log("<event/send and receive - Rcv Parameter Float>: Test Successful");
                            proc106();
                        }
                    }
                }
                else
                {
                    proc106();
                }
            }
        }
        rt.OnReceive(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, OnReceive2);
        void OnStart3()
        {
            void Cont1()
            {
                if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_event_send_and_receive_With_Parameters__flow_received_)
                    {
                        rt.Log("ERROR! <event/send and receive - With Parameters (flow received)>: Flow not triggered! This should not happened!");
                    }
                }
                if (rt.PtrSet("/nodes/36/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int)
                    {
                        rt.Log("ERROR! <event/send and receive - Rcv Parameter Int>: Test Failed");
                    }
                }
                if (rt.PtrSet("/nodes/42/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool)
                    {
                        rt.Log("ERROR! <event/send and receive - Rcv Parameter Bool>: Test Failed");
                    }
                }
                if (rt.PtrSet("/nodes/48/translation", "float3", new double[] { 0.0, 0.0, 0.0 }))
                {
                    if (!V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float)
                    {
                        rt.Log("ERROR! <event/send and receive - Rcv Parameter Float>: Test Failed");
                    }
                }
            }
            if (rt.SetDelay(delay2, 1.0, Cont1))
            {
                rt.Send(Events._eventWithParameters40f08b1d_312c_4968_bed1_f3e2ab96dcbc, new EventPayload(true, 2, 2.0, 0.0));
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            rt.Send(Events.test_onStart);
            void Cont1()
            {
                if (V.TestResult_event_send_and_receive_Without_Parameters && V.TestResult_event_send_and_receive_With_Parameters__flow_received_ && V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Int_ && V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Bool_ && V.TestResult_HasPassed_event_send_and_receive_Default_Event_Value__Float_ && V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Int && V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Bool && V.TestResult_HasPassed_event_send_and_receive_Rcv_Parameter_Float)
                {
                    rt.Send(Events.test_onSuccess);
                }
                else
                {
                    rt.Send(Events.test_onFailed);
                }
            }
            rt.SetDelay(delay3, 1.5, Cont1);
        }
        rt.OnStart(OnStart4);
    }
}
