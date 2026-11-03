import gltfi_runtime.m as m

def build(rt: "gltfi_runtime.Engine") -> None:
    V = rt.vars({"TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_": rt.with_id("TestResult_HasPassed_math/cross_[a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)", rt.bool_(False)), "TestResult_math_cross__a___1__0__0___b___0__1__0_____0__0__1_": rt.with_id("TestResult_math/cross_[a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)", rt.float3(-0.0142, -0.0142, -0.0142)), "TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_": rt.with_id("TestResult_HasPassed_math/cross_[a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)", rt.bool_(False)), "TestResult_math_cross__a___2__3__4___b___5__6__7______3__6___3_": rt.with_id("TestResult_math/cross_[a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)", rt.float3(-0.0142, -0.0142, -0.0142)), "TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_": rt.with_id("TestResult_HasPassed_math/cross_[a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)", rt.bool_(False)), "TestResult_math_cross__a___2__4__6___b___1__2__3_____0__0__0_": rt.with_id("TestResult_math/cross_[a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)", rt.float3(-0.0142, -0.0142, -0.0142))})
    E = rt.events({"test_onStart": {"externalId": "test/onStart", "expectedDuration": 0.0}, "test_onSuccess": {"externalId": "test/onSuccess"}, "test_onFailed": {"externalId": "test/onFailed"}})
    def proc14() -> None:
        rt.log("<math/cross - [a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)>: Value is {0}, should be {1} (Proximity range: 0.0001)", [m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0]), [0.0, 0.0, 1.0]])
        V.TestResult_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ = m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
    def proc32() -> None:
        rt.log("<math/cross - [a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)>: Value is {0}, should be {1} (Proximity range: 0.0001)", [m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0]), [-3.0, 6.0, -3.0]])
        V.TestResult_math_cross__a___2__3__4___b___5__6__7______3__6___3_ = m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0])
    def proc50() -> None:
        rt.log("<math/cross - [a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)>: Value is {0}, should be {1} ", [m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0]), [0.0, 0.0, 0.0]])
        V.TestResult_math_cross__a___2__4__6___b___1__2__3_____0__0__0_ = m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0])
    def __on_start_0() -> None:
        t1 = m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
        if m.length(t1) > 0.9999 and m.dot(m.normalize(t1)["value"], [0.0, 0.0, 1.0]) > 0.9999:
            if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                t2 = m.cross([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
                V.TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ = m.length(t2) > 0.9999 and m.dot(m.normalize(t2)["value"], [0.0, 0.0, 1.0]) > 0.9999
                rt.log("<math/cross - [a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)>: Test Successful")
                proc14()
        else:
            proc14()
        if not V.TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_:
            rt.log("ERROR! <math/cross - [a] (1, 0, 0) [b] (0, 1, 0) = (0, 0, 1)>: Test Failed")
    rt.on_start(__on_start_0)
    def __on_start_1() -> None:
        t1 = m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0])
        if m.length(t1) > 7.348369 and m.dot(m.normalize(t1)["value"], [-0.408248276, 0.816496551, -0.408248276]) > 0.9999:
            if rt.ptr_set("/nodes/11/translation", "float3", [0.0, 0.0, 0.8]):
                t2 = m.cross([2.0, 3.0, 4.0], [5.0, 6.0, 7.0])
                V.TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_ = m.length(t2) > 7.348369 and m.dot(m.normalize(t2)["value"], [-0.408248276, 0.816496551, -0.408248276]) > 0.9999
                rt.log("<math/cross - [a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)>: Test Successful")
                proc32()
        else:
            proc32()
        if not V.TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_:
            rt.log("ERROR! <math/cross - [a] (2, 3, 4) [b] (5, 6, 7) = (-3, 6, -3)>: Test Failed")
    rt.on_start(__on_start_1)
    def __on_start_2() -> None:
        if m.eq(m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0]), [0.0, 0.0, 0.0]):
            if rt.ptr_set("/nodes/17/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_ = m.eq(m.cross([2.0, 4.0, 6.0], [1.0, 2.0, 3.0]), [0.0, 0.0, 0.0])
                rt.log("<math/cross - [a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)>: Test Successful")
                proc50()
        else:
            proc50()
        if not V.TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_:
            rt.log("ERROR! <math/cross - [a] (2, 4, 6) [b] (1, 2, 3) = (0, 0, 0)>: Test Failed")
    rt.on_start(__on_start_2)
    def __on_start_3() -> None:
        rt.send(E["test_onStart"])
        if V.TestResult_HasPassed_math_cross__a___1__0__0___b___0__1__0_____0__0__1_ and V.TestResult_HasPassed_math_cross__a___2__3__4___b___5__6__7______3__6___3_ and V.TestResult_HasPassed_math_cross__a___2__4__6___b___1__2__3_____0__0__0_:
            rt.send(E["test_onSuccess"])
        else:
            rt.send(E["test_onFailed"])
    rt.on_start(__on_start_3)
