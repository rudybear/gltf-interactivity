extends RefCounted

var m
var rt
var V
var E
var for1
var for2

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38", rt.float_var(-1.0), "LastRandomNumberbddbf9eb-0219-4ecf-949c-f01dcb0d0e38"], ["TestResult_math_random_Random__new_number_in_new_flow_", rt.bool_var(false), "TestResult_math/random_Random (new number in new flow)"], ["TestResult_HasPassed_math_random_Random__same_number_in_current_flow_", rt.bool_var(false), "TestResult_HasPassed_math/random_Random (same number in current flow)"], ["TestResult_math_random_Random__same_number_in_current_flow_", rt.float_var(-0.0142), "TestResult_math/random_Random (same number in current flow)"], ["counter1", rt.int_var(0), "6c89dba7-e578-4ac6-a7a1-f316d1f49b17"], ["TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_", rt.bool_var(false), "TestResult_HasPassed_math/random_Monte Carlo 1k(random number distribution)"], ["TestResult_math_random_Monte_Carlo_1k_random_number_distribution_", rt.float_var(-0.0142), "TestResult_math/random_Monte Carlo 1k(random number distribution)"], ["counter2", rt.int_var(0), "b0a7e119-0a71-4d4a-b9f5-9ea717673aa0"], ["TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_", rt.bool_var(false), "TestResult_HasPassed_math/random_Monte Carlo 10k(random number distribution)"], ["TestResult_math_random_Monte_Carlo_10k_random_number_distribution_", rt.float_var(-0.0142), "TestResult_math/random_Monte Carlo 10k(random number distribution)"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    for1 = 0
    for2 = 0
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)

func proc21() -> void:
    var t1 = rt.random()
    rt.log_msg("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", [t1 - t1, 0.0])
    var t2 = rt.random()
    V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2

func proc51() -> void:
    rt.log_msg("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,4)", [m.div(m.intToFloat(V.counter1), 1000.0) * 4.0, 3.141592653589793])
    V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = m.div(m.intToFloat(V.counter1), 1000.0) * 4.0

func proc89() -> void:
    rt.log_msg("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0,1)", [m.div(m.intToFloat(V.counter2), 10000.0) * 4.0, 3.141592653589793])
    V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = m.div(m.intToFloat(V.counter2), 10000.0) * 4.0

func __on_start_0() -> void:
    V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38 = rt.random()
    rt.log_msg("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", [rt.random(), V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38])
    if not rt.random() == V.LastRandomNumberbddbf9eb_0219_4ecf_949c_f01dcb0d0e38:
        if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
            rt.log_msg("<math/random - Random (new number in new flow)>: Test Successful")
            V.TestResult_math_random_Random__new_number_in_new_flow_ = true
    if not V.TestResult_math_random_Random__new_number_in_new_flow_:
        rt.log_msg("ERROR! <math/random - Random (new number in new flow)>: Test Failed")

func __on_start_1() -> void:
    var t1 = rt.random()
    if t1 - t1 == 0.0:
        if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
            var t2 = rt.random()
            V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ = t2 - t2 == 0.0
            rt.log_msg("<math/random - Random (same number in current flow)>: Test Successful")
            proc21()
    else:
        proc21()
    if not V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_:
        rt.log_msg("ERROR! <math/random - Random (same number in current flow)>: Test Failed")

func __on_start_2() -> void:
    for1 = 0
    while for1 < (1000):
        if m.length(m.sub(m.mul(m.combine2(rt.random(), rt.random()), [2.0, 2.0]), [1.0, 1.0])) < 1.0:
            V.counter1 = m.addInt(V.counter1, 1)
        for1 = for1 + 1
    rt.log_msg("Monte Carlo 1k(random number distribution) Inside Circle: {0} / {1}", [V.counter1, 1000])
    if m.abs_(m.div(m.intToFloat(V.counter1), 1000.0) * 4.0 - 3.141592653589793) < 0.4:
        if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ = m.abs_(m.div(m.intToFloat(V.counter1), 1000.0) * 4.0 - 3.141592653589793) < 0.4
            rt.log_msg("<math/random - Monte Carlo 1k(random number distribution)>: Test Successful")
            proc51()
    else:
        proc51()
    if not V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_:
        rt.log_msg("ERROR! <math/random - Monte Carlo 1k(random number distribution)>: Test Failed")

func __on_start_3() -> void:
    for2 = 0
    while for2 < (10000):
        if m.length(m.sub(m.mul(m.combine2(rt.random(), rt.random()), [2.0, 2.0]), [1.0, 1.0])) < 1.0:
            V.counter2 = m.addInt(V.counter2, 1)
        for2 = for2 + 1
    rt.log_msg("Monte Carlo 10k(random number distribution) Inside Circle: {0} / {1}", [V.counter2, 10000])
    if m.abs_(m.div(m.intToFloat(V.counter2), 10000.0) * 4.0 - 3.141592653589793) < 0.1:
        if rt.ptr_set("/nodes/23/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ = m.abs_(m.div(m.intToFloat(V.counter2), 10000.0) * 4.0 - 3.141592653589793) < 0.1
            rt.log_msg("<math/random - Monte Carlo 10k(random number distribution)>: Test Successful")
            proc89()
    else:
        proc89()
    if not V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_:
        rt.log_msg("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed")

func __on_start_4() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_math_random_Random__new_number_in_new_flow_ and V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ and V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ and V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

