# Python port of packages/kernel/test/animation.test.ts (+ animation-fixtures.ts)
# for gltfi_runtime.animation. Run: PYTHONPATH=../src/py python3 -m unittest test_animation
# (animation.test.ts in this folder runs it under vitest).
import math
import struct
import unittest

from gltfi_runtime import animation as anim


class BinBuilder:
    def __init__(self):
        self.bytes = bytearray()
        self.gltf = {"nodes": [{}], "accessors": [], "bufferViews": [], "animations": []}

    def _push(self, data: bytes) -> int:
        while len(self.bytes) % 4:
            self.bytes.append(0)
        offset = len(self.bytes)
        self.bytes.extend(data)
        return offset

    @staticmethod
    def f32(values):
        return struct.pack("<%df" % len(values), *values)

    @staticmethod
    def ints(values, size, signed):
        fmt = {(1, True): "b", (1, False): "B", (2, True): "h", (2, False): "H", (4, False): "I", (4, True): "i"}[(size, signed)]
        return struct.pack("<%d%s" % (len(values), fmt), *values)

    def buffer_view(self, data: bytes, byte_stride=None) -> int:
        view = {"buffer": 0, "byteOffset": self._push(data), "byteLength": len(data)}
        if byte_stride:
            view["byteStride"] = byte_stride
        self.gltf["bufferViews"].append(view)
        return len(self.gltf["bufferViews"]) - 1

    def accessor(self, **d) -> int:
        self.gltf["accessors"].append(d)
        return len(self.gltf["accessors"]) - 1

    def floats(self, type_, values, comps) -> int:
        d = {"bufferView": self.buffer_view(self.f32(values)), "componentType": 5126, "count": len(values) // comps, "type": type_}
        if type_ == "SCALAR" and values:
            d["min"] = [min(values)]
            d["max"] = [max(values)]
        return self.accessor(**d)

    def animation(self, channels) -> int:
        samplers = []
        for c in channels:
            s = {"input": c["input"], "output": c["output"]}
            if c.get("interpolation"):
                s["interpolation"] = c["interpolation"]
            samplers.append(s)
        self.gltf["animations"].append({
            "samplers": samplers,
            "channels": [{"sampler": i, "target": {"node": c.get("node", 0), "path": c["path"]}} for i, c in enumerate(channels)],
        })
        return len(self.gltf["animations"]) - 1

    def build(self):
        self.gltf["buffers"] = [{"byteLength": len(self.bytes)}]
        return self.gltf, bytes(self.bytes)


def cubic_translation_fixture():
    b = BinBuilder()
    inp = b.floats("SCALAR", [0, 2], 1)
    out = b.floats("VEC3", [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 10, 10, 10, 0, 0, 0], 3)
    b.animation([{"input": inp, "output": out, "interpolation": "CUBICSPLINE", "path": "translation"}])
    return b.build()


def cubic_rotation_fixture():
    b = BinBuilder()
    inp = b.floats("SCALAR", [0, 1], 1)
    s = math.sqrt(0.5)
    out = b.floats("VEC4", [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.8, 0, 0, 0, 0, 0.4, 0, 0, s, s, 0, 0, 0, 0], 4)
    b.animation([{"input": inp, "output": out, "interpolation": "CUBICSPLINE", "path": "rotation"}])
    return b.build()


def sample(fx, t, node=0, index=0):
    gltf, bin_ = fx
    assert anim.apply_animation_at({"gltf": gltf, "glbBin": bin_}, index, t) is not None
    return gltf["nodes"][node]


class DecodeAccessor(unittest.TestCase):
    def test_normalization(self):
        b = BinBuilder()
        s16 = b.accessor(bufferView=b.buffer_view(b.ints([-32768, -32767, 0, 32767], 2, True)), componentType=5122, normalized=True, count=4, type="SCALAR")
        u8 = b.accessor(bufferView=b.buffer_view(b.ints([0, 255], 1, False)), componentType=5121, normalized=True, count=2, type="SCALAR")
        s8 = b.accessor(bufferView=b.buffer_view(b.ints([-128, 127], 1, True)), componentType=5120, normalized=True, count=2, type="SCALAR")
        u16 = b.accessor(bufferView=b.buffer_view(b.ints([65535], 2, False)), componentType=5123, count=1, type="SCALAR")
        gltf, bin_ = b.build()
        host = {"gltf": gltf, "glbBin": bin_}
        self.assertEqual(anim.decode_accessor(host, s16)["data"], [-1, -1, 0, 1])
        self.assertEqual(anim.decode_accessor(host, u8)["data"], [0, 1])
        self.assertEqual(anim.decode_accessor(host, s8)["data"], [-1, 1])
        self.assertEqual(anim.decode_accessor(host, u16)["data"], [65535])

    def test_out_of_range_and_compat(self):
        b = BinBuilder()
        ok = b.floats("VEC2", [1, 2, 3, 4], 2)
        bad = b.accessor(bufferView=0, componentType=5126, count=100, type="VEC2")
        gltf, bin_ = b.build()
        host = {"gltf": gltf, "glbBin": bin_}
        self.assertIsNone(anim.decode_accessor(host, bad))
        self.assertIsNone(anim.decode_accessor({"gltf": gltf, "glbBin": None}, ok))
        self.assertEqual(anim.read_accessor_elements(host, ok), [[1, 2], [3, 4]])


class Sampling(unittest.TestCase):
    def test_normalized_short_rotation(self):
        b = BinBuilder()
        inp = b.floats("SCALAR", [0, 1], 1)
        q = round(math.sqrt(0.5) * 32767)
        out = b.accessor(bufferView=b.buffer_view(b.ints([0, 0, 0, 32767, 0, 0, q, q], 2, True)), componentType=5122, normalized=True, count=2, type="VEC4")
        b.animation([{"input": inp, "output": out, "path": "rotation"}])
        node = sample(b.build(), 0.5)
        half = math.pi / 8
        self.assertAlmostEqual(node["rotation"][2], math.sin(half), places=4)
        self.assertAlmostEqual(node["rotation"][3], math.cos(half), places=4)
        self.assertAlmostEqual(math.hypot(*node["rotation"]), 1, places=5)

    def test_interleaved_byte_stride(self):
        b = BinBuilder()
        inp = b.floats("SCALAR", [0, 1], 1)
        rows = [[1, 2, 3, 1, 1, 1, 99], [3, 4, 5, 3, 5, 7, 99]]
        view = b.buffer_view(b.f32([x for r in rows for x in r]), 28)
        trs = b.accessor(bufferView=view, byteOffset=0, componentType=5126, count=2, type="VEC3")
        scl = b.accessor(bufferView=view, byteOffset=12, componentType=5126, count=2, type="VEC3")
        b.animation([{"input": inp, "output": trs, "path": "translation"}, {"input": inp, "output": scl, "path": "scale"}])
        node = sample(b.build(), 0.5)
        self.assertEqual(node["translation"], [2, 3, 4])
        self.assertEqual(node["scale"], [2, 3, 4])

    def test_sparse(self):
        b = BinBuilder()
        inp = b.floats("SCALAR", [0, 1, 2], 1)
        zero_base = b.accessor(
            componentType=5126, count=3, type="VEC3",
            sparse={"count": 1, "indices": {"bufferView": b.buffer_view(b.ints([1], 1, False)), "componentType": 5121},
                    "values": {"bufferView": b.buffer_view(b.f32([10, 20, 30]))}})
        patched = b.accessor(
            bufferView=b.buffer_view(b.f32([1, 1, 1, 2, 2, 2, 3, 3, 3])), componentType=5126, count=3, type="VEC3",
            sparse={"count": 2, "indices": {"bufferView": b.buffer_view(b.ints([0, 2], 2, False)), "componentType": 5123},
                    "values": {"bufferView": b.buffer_view(b.f32([7, 7, 7, 9, 9, 9]))}})
        b.animation([{"input": inp, "output": zero_base, "path": "translation"}, {"input": inp, "output": patched, "path": "scale"}])
        fx = b.build()
        self.assertEqual(anim.decode_accessor({"gltf": fx[0], "glbBin": fx[1]}, zero_base)["data"], [0, 0, 0, 10, 20, 30, 0, 0, 0])
        at05 = sample(fx, 0.5)
        self.assertEqual(at05["translation"], [5, 10, 15])
        self.assertEqual(at05["scale"], [4.5, 4.5, 4.5])
        at15 = sample(fx, 1.5)
        self.assertEqual(at15["translation"], [5, 10, 15])
        self.assertEqual(at15["scale"], [5.5, 5.5, 5.5])

    def test_cubic_translation(self):
        fx = cubic_translation_fixture()
        for c in sample(fx, 1)["translation"]:
            self.assertAlmostEqual(c, 4.25, places=5)
        self.assertEqual(sample(fx, 2)["translation"], [10, 10, 10])
        self.assertEqual(sample(fx, 0)["translation"], [0, 0, 0])
        q = sample(fx, 0.5)["translation"]
        self.assertAlmostEqual(q[0], 0.140625 * 2 * 1 + 0.15625 * 10 - 0.046875 * 2 * 4, places=5)
        self.assertAlmostEqual(q[2], 0.140625 * 2 * 3 + 0.15625 * 10 - 0.046875 * 2 * 6, places=5)

    def test_cubic_rotation_normalized(self):
        fx = cubic_rotation_fixture()
        s = math.sqrt(0.5)
        z = 0.125 * 0.8 + 0.5 * s
        w = 0.5 + 0.5 * s - 0.125 * 0.4
        n = math.hypot(z, w)
        node = sample(fx, 0.5)
        self.assertAlmostEqual(math.hypot(*node["rotation"]), 1, places=6)
        self.assertGreater(abs(n - 1), 0.01)
        self.assertAlmostEqual(node["rotation"][2], z / n, places=5)
        self.assertAlmostEqual(node["rotation"][3], w / n, places=5)

    def test_weights(self):
        b = BinBuilder()
        inp = b.floats("SCALAR", [0, 1], 1)
        linear = b.floats("SCALAR", [0, 1, 1, 0], 1)
        cubic = b.floats("SCALAR", [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], 1)
        b.animation([{"input": inp, "output": linear, "path": "weights"}])
        b.animation([{"input": inp, "output": cubic, "interpolation": "CUBICSPLINE", "path": "weights"}])
        gltf, bin_ = b.build()
        host = {"gltf": gltf, "glbBin": bin_}
        anim.apply_animation_at(host, 0, 0.25)
        self.assertEqual(gltf["nodes"][0]["weights"], [0.25, 0.75])
        anim.apply_animation_at(host, 1, 0.5)
        self.assertAlmostEqual(gltf["nodes"][0]["weights"][0], 0.5, places=6)
        self.assertAlmostEqual(gltf["nodes"][0]["weights"][1], 0.5, places=6)

    def test_step_and_single_key(self):
        b = BinBuilder()
        inp = b.floats("SCALAR", [1, 2, 3], 1)
        out = b.floats("VEC3", [1, 1, 1, 2, 2, 2, 3, 3, 3], 3)
        one = b.floats("SCALAR", [0.5], 1)
        one_out = b.floats("VEC3", [4, 5, 6], 3)
        b.animation([{"input": inp, "output": out, "interpolation": "STEP", "path": "translation"}])
        b.animation([{"input": one, "output": one_out, "path": "translation"}])
        gltf, bin_ = b.build()
        host = {"gltf": gltf, "glbBin": bin_}
        anim.apply_animation_at(host, 0, 2)
        self.assertEqual(gltf["nodes"][0]["translation"], [2, 2, 2])
        anim.apply_animation_at(host, 0, 2.9)
        self.assertEqual(gltf["nodes"][0]["translation"], [2, 2, 2])
        anim.apply_animation_at(host, 1, 0.3)
        self.assertEqual(gltf["nodes"][0]["translation"], [4, 5, 6])

    def test_skipped_channels(self):
        b = BinBuilder()
        inp = b.floats("SCALAR", [0, 1], 1)
        bad = b.accessor(bufferView=0, componentType=5126, count=50, type="VEC3")
        b.animation([{"input": inp, "output": bad, "path": "translation"}])
        gltf, bin_ = b.build()
        r = anim.apply_animation_at({"gltf": gltf, "glbBin": bin_}, 0, 0.5)
        self.assertEqual((r["wroteAny"], r["skippedChannels"]), (False, 1))


class Cache(unittest.TestCase):
    def test_decode_once(self):
        gltf, bin_ = cubic_translation_fixture()
        anim.apply_animation_at({"gltf": gltf, "glbBin": bin_}, 0, 0.1)
        first = anim.get_animation_cache_stats({"gltf": gltf, "glbBin": bin_})
        self.assertEqual(first["decodes"], 2)
        for i in range(1000):
            anim.apply_animation_at({"gltf": gltf, "glbBin": bin_}, 0, (i % 20) / 10)
        self.assertEqual(anim.get_animation_cache_stats({"gltf": gltf, "glbBin": bin_})["decodes"], 2)

    def test_invalidate_and_swapped_bin(self):
        gltf, bin_ = cubic_translation_fixture()
        host = {"gltf": gltf, "glbBin": bin_}
        anim.apply_animation_at(host, 0, 1)
        anim.invalidate_animation_cache(gltf)
        anim.apply_animation_at(host, 0, 1)
        self.assertEqual(anim.get_animation_cache_stats(host)["decodes"], 2)
        other = {"gltf": gltf, "glbBin": bytearray(bin_)}  # distinct object => cache rebuilt
        anim.apply_animation_at(other, 0, 1)
        self.assertEqual(anim.get_animation_cache_stats(other)["decodes"], 4)

    def test_monotonic_vs_random(self):
        b = BinBuilder()
        times = [i * 0.1 for i in range(50)]
        inp = b.floats("SCALAR", times, 1)
        out = b.floats("VEC3", [v for t in times for v in (t, t * 2, -t)], 3)
        b.animation([{"input": inp, "output": out, "path": "translation"}])
        gltf, bin_ = b.build()
        host = {"gltf": gltf, "glbBin": bin_}
        for t in [0.05, 0.15, 0.25, 3.33, 0.01, 4.85, 2.5, 2.51, 1.0]:
            anim.apply_animation_at(host, 0, t)
            self.assertAlmostEqual(gltf["nodes"][0]["translation"][0], t, places=5)
            self.assertAlmostEqual(gltf["nodes"][0]["translation"][1], t * 2, places=5)


if __name__ == "__main__":
    unittest.main()
