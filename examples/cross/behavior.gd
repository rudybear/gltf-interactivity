extends RefCounted

var m
var rt
var V
var E

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_", rt.bool_var(false)], ["TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_", rt.float3(-0.0142, -0.0142, -0.0142)], ["TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_", rt.bool_var(false)], ["TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_", rt.float3(-0.0142, -0.0142, -0.0142)], ["TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_", rt.bool_var(false)], ["TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_", rt.float3(-0.0142, -0.0142, -0.0142)]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)

func proc10() -> void:
    rt.log_msg("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", [m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0]), [0.0, 0.0, 1.0]])
    V.TestResult_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])

func proc29() -> void:
    rt.log_msg("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Value is {0}, should be {1} (Proximity range: 0,0001)", [m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0]), [-3.0, 6.0, -3.0]])
    V.TestResult_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0])

func proc43() -> void:
    rt.log_msg("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Value is {0}, should be {1} ", [m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0]), [0.0, 0.0, 0.0]])
    V.TestResult_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0])

func __on_start_0() -> void:
    var t1 = m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
    if m.length(t1) > 0.9999 and m.dot(m.normalize(t1)["value"], [0.0, 0.0, 1.0]) > 0.9999:
        if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
            var t2 = m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
            V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ = m.length(t2) > 0.9999 and m.dot(m.normalize(t2)["value"], [0.0, 0.0, 1.0]) > 0.9999
            rt.log_msg("<math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Successful")
            proc10()
    else:
        proc10()
    if not V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_:
        rt.log_msg("ERROR! <math/cross - [a] (1.00, 0.00, 0.00) [b] (0.00, 1.00, 0.00) = (0.00, 0.00, 1.00)>: Test Failed")

func __on_start_1() -> void:
    var t1 = m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0])
    if m.length(t1) > 7.348369 and m.dot(m.normalize(t1)["value"], [-0.408248276, 0.816496551, -0.408248276]) > 0.9999:
        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
            var t2 = m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0])
            V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ = m.length(t2) > 7.348369 and m.dot(m.normalize(t2)["value"], [-0.408248276, 0.816496551, -0.408248276]) > 0.9999
            rt.log_msg("<math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Successful")
            proc29()
    else:
        proc29()
    if not V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_:
        rt.log_msg("ERROR! <math/cross - [a] (2.00, 3.00, 4.00) [b] (5.00, 6.00, 7.00) = (-3.00, 6.00, -3.00)>: Test Failed")

func __on_start_2() -> void:
    if m.eq(m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0]), [0.0, 0.0, 0.0]):
        if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_ = m.eq(m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0]), [0.0, 0.0, 0.0])
            rt.log_msg("<math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Successful")
            proc43()
    else:
        proc43()
    if not V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_:
        rt.log_msg("ERROR! <math/cross - [a] (2.00, 4.00, 6.00) [b] (1.00, 2.00, 3.00) = (0.00, 0.00, 0.00)>: Test Failed")

func __on_start_3() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_HasPassed_math_cross__a___1_00__0_00__0_00___b___0_00__1_00__0_00_____0_00__0_00__1_00_ and V.TestResult_HasPassed_math_cross__a___2_00__3_00__4_00___b___5_00__6_00__7_00______3_00__6_00___3_00_ and V.TestResult_HasPassed_math_cross__a___2_00__4_00__6_00___b___1_00__2_00__3_00_____0_00__0_00__0_00_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

