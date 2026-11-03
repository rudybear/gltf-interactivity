extends RefCounted

var m
var rt
var V
var E
var for1
var for2
var for3

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8", rt.float_var(-1.0), "LastRandomNumbera7efddb9-d1d0-45cb-aef6-1a1d5ebd10d8"], ["TestResult_math_random_Random__new_number_in_new_flow_", rt.bool_var(false), "TestResult_math/random_Random (new number in new flow)"], ["TestResult_HasPassed_math_random_Random__same_number_in_current_flow_", rt.bool_var(false), "TestResult_HasPassed_math/random_Random (same number in current flow)"], ["TestResult_math_random_Random__same_number_in_current_flow_", rt.float_var(-0.0142), "TestResult_math/random_Random (same number in current flow)"], ["counter1", rt.int_var(0), "3f3281e0-4104-46fd-8360-3e53d0fadcab"], ["TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_", rt.bool_var(false), "TestResult_HasPassed_math/random_Monte Carlo 1k(random number distribution)"], ["TestResult_math_random_Monte_Carlo_1k_random_number_distribution_", rt.float_var(-0.0142), "TestResult_math/random_Monte Carlo 1k(random number distribution)"], ["counter2", rt.int_var(0), "ec1fd5a3-a361-47c6-87df-da2b9a247159"], ["TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_", rt.bool_var(false), "TestResult_HasPassed_math/random_Monte Carlo 10k(random number distribution)"], ["TestResult_math_random_Monte_Carlo_10k_random_number_distribution_", rt.float_var(-0.0142), "TestResult_math/random_Monte Carlo 10k(random number distribution)"], ["PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f", rt.float_var(-1.0), "PreviousLoopRandomNumberf06f2b1e-c899-48ec-85d0-0bbcfad5089f"], ["counter3", rt.int_var(0), "836512be-531d-443c-a803-5fd2837d9689"], ["TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_", rt.bool_var(false), "TestResult_HasPassed_math/random_Random (new number in each flow/for iteration, 10x)"], ["TestResult_math_random_Random__new_number_in_each_flow_for_iteration__10x_", rt.int_var(-1), "TestResult_math/random_Random (new number in each flow/for iteration, 10x)"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    for1 = 0
    for2 = 0
    for3 = 0
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)

func proc24() -> void:
    var t1 = rt.random()
    rt.log_msg("<math/random - Random (same number in current flow)>: Value is {0}, should be {1} ", [t1 - t1, 0.0])
    var t2 = rt.random()
    V.TestResult_math_random_Random__same_number_in_current_flow_ = t2 - t2

func proc110() -> void:
    rt.log_msg("<math/random - Monte Carlo 1k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0.4)", [m.div(m.intToFloat(V.counter1), 1000.0) * 4.0, 3.141592653589793])
    V.TestResult_math_random_Monte_Carlo_1k_random_number_distribution_ = m.div(m.intToFloat(V.counter1), 1000.0) * 4.0

func proc122() -> void:
    rt.log_msg("<math/random - Monte Carlo 10k(random number distribution)>: Value is {0}, should be {1} (Proximity range: 0.1)", [m.div(m.intToFloat(V.counter2), 10000.0) * 4.0, 3.141592653589793])
    V.TestResult_math_random_Monte_Carlo_10k_random_number_distribution_ = m.div(m.intToFloat(V.counter2), 10000.0) * 4.0

func proc91() -> void:
    rt.log_msg("<math/random - Random (new number in each flow/for iteration, 10x)>: Value is {0}, should be {1} ", [V.counter3, 10])
    V.TestResult_math_random_Random__new_number_in_each_flow_for_iteration__10x_ = V.counter3

func __on_start_0() -> void:
    V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8 = rt.random()
    rt.log_msg("<math/random - Random (new number in new flow)>: Value A is {0} and Value B is {1}. Should be not-equal.", [rt.random(), V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8])
    if not rt.random() == V.LastRandomNumbera7efddb9_d1d0_45cb_aef6_1a1d5ebd10d8:
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
            proc24()
    else:
        proc24()
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
            proc110()
    else:
        proc110()
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
            proc122()
    else:
        proc122()
    if not V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_:
        rt.log_msg("ERROR! <math/random - Monte Carlo 10k(random number distribution)>: Test Failed")

func __on_start_4() -> void:
    for3 = 0
    while for3 < (10):
        if not rt.random() == V.PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f:
            V.counter3 = m.addInt(V.counter3, 1)
        V.PreviousLoopRandomNumberf06f2b1e_c899_48ec_85d0_0bbcfad5089f = rt.random()
        for3 = for3 + 1
    if m.eqInt(V.counter3, 10):
        if rt.ptr_set("/nodes/29/translation", "float3", [0.0, 0.0, 0.8]):
            V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_ = m.eqInt(V.counter3, 10)
            rt.log_msg("<math/random - Random (new number in each flow/for iteration, 10x)>: Test Successful")
            proc91()
    else:
        proc91()
    if not V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_:
        rt.log_msg("ERROR! <math/random - Random (new number in each flow/for iteration, 10x)>: Test Failed")

func __on_start_5() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_math_random_Random__new_number_in_new_flow_ and V.TestResult_HasPassed_math_random_Random__same_number_in_current_flow_ and V.TestResult_HasPassed_math_random_Monte_Carlo_1k_random_number_distribution_ and V.TestResult_HasPassed_math_random_Monte_Carlo_10k_random_number_distribution_ and V.TestResult_HasPassed_math_random_Random__new_number_in_each_flow_for_iteration__10x_:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

