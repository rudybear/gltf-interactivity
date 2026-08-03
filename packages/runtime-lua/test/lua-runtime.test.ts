// Parity spot-checks for the pure-Lua KHR_interactivity runtime (src/lua/
// *.lua, exported as source text via lua-sources.ts — see that file's own
// header). Each check loads the full runtime-lua source into a fresh
// wasmoon Lua state and calls into it exactly the way
// packages/conformance/src/run-compiled-lua.ts does (a synchronous
// `LuaEngine.doStringSync` load, then plain-primitive function calls via
// `lua.global.get`) — these are NOT full conformance runs (that's
// conf:lua's job), just fast, targeted checks on the numeric-semantics
// corners the task called out as gotchas: int32 wrap, ctz/popcnt edges, the
// math/random LCG sequence, and NaN comparisons — plus one small
// end-to-end engine smoke test exercising rt.vars/rt.onStart/rt.setVar/
// rt.ptrGet/rt.ptrSet against a tiny synthetic glTF document.
import { describe, expect, it, beforeAll, afterEach } from "vitest";
import { LuaEngine, LuaFactory, type LuaWasm } from "wasmoon";
import { LUA_RUNTIME_SOURCE } from "../src/lua-sources.js";

let cmodule: LuaWasm;
const openEngines: LuaEngine[] = [];

beforeAll(async () => {
  const factory = new LuaFactory();
  cmodule = await factory.getLuaModule();
});

afterEach(() => {
  for (const lua of openEngines.splice(0)) {
    lua.global.close();
  }
});

function freshLua(): LuaEngine {
  const lua = new LuaEngine(cmodule);
  openEngines.push(lua);
  lua.doStringSync(LUA_RUNTIME_SOURCE);
  return lua;
}

describe("m.lua numeric-semantics parity", () => {
  it("wraps int32 arithmetic the same way ECMAScript's `x | 0` does", () => {
    const lua = freshLua();
    expect(lua.doStringSync("return m.toInt32(2147483648)")).toBe(-2147483648);
    expect(lua.doStringSync("return m.toInt32(-2147483649)")).toBe(2147483647);
    expect(lua.doStringSync("return m.toInt32(0/0)")).toBe(0);
    expect(lua.doStringSync("return m.toInt32(1/0)")).toBe(0);
    expect(lua.doStringSync("return m.addInt(2147483647, 1)")).toBe(-2147483648);
    expect(lua.doStringSync("return m.mulInt(65536, 65536)")).toBe(0);
    expect(lua.doStringSync("return m.divInt(5, 0)")).toBe(0);
    expect(lua.doStringSync("return m.remInt(5, 0)")).toBe(0);
  });

  it("matches JS's masked/sign-extending shift semantics (lsl/asr), not Lua's native 64-bit logical shift", () => {
    const lua = freshLua();
    // JS: (20 << 32) === 20 (shift count masked to 5 bits: 32 & 31 === 0).
    expect(lua.doStringSync("return m.lsl(20, 32)")).toBe(20);
    expect(lua.doStringSync("return m.lsl(20, 33)")).toBe(40);
    // JS: -7 >> 1 === -4 (arithmetic/sign-propagating shift).
    expect(lua.doStringSync("return m.asr(-7, 1)")).toBe(-4);
    expect(lua.doStringSync("return m.asr(-8, 1)")).toBe(-4);
  });

  it("matches ctz(0)=32 and unsigned popcnt exactly", () => {
    const lua = freshLua();
    expect(lua.doStringSync("return m.ctz(0)")).toBe(32);
    expect(lua.doStringSync("return m.ctz(8)")).toBe(3);
    expect(lua.doStringSync("return m.clz(1)")).toBe(31);
    expect(lua.doStringSync("return m.popcnt(-1)")).toBe(32);
    expect(lua.doStringSync("return m.popcnt(7)")).toBe(3);
  });

  it("propagates NaN through comparisons the same way JS does (NaN never equals anything, including itself)", () => {
    const lua = freshLua();
    expect(lua.doStringSync("return m.eq(0/0, 0/0)")).toBe(false);
    expect(lua.doStringSync("return m.isNaN(0/0)")).toBe(true);
    expect(lua.doStringSync("return m.eq({0/0, 1.0}, {0/0, 1.0})")).toBe(false);
  });

  it("draws the exact same LCG sequence as the TS oracle's default seed", () => {
    const lua = freshLua();
    lua.doStringSync("RS = 123456789\nfunction STEP() RS = (1664525 * RS + 1013904223) % 4294967296 return RS end");
    const step = lua.global.get("STEP") as () => number;
    const luaSeq = [step(), step(), step(), step(), step()];

    let jsState = 123456789;
    const jsSeq: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      jsState = (1664525 * jsState + 1013904223) >>> 0;
      jsSeq.push(jsState);
    }
    expect(luaSeq).toEqual(jsSeq);
  });
});

describe("engine.lua end-to-end smoke test", () => {
  it("runs a hand-written setup function against a synthetic glTF document (rt.vars/onStart/setVar/ptrGet/ptrSet)", () => {
    const lua = freshLua();
    const gltf = { nodes: [{ translation: [0, 0, 0] }] };
    const gltfBytes = Buffer.from(JSON.stringify(gltf), "utf8");
    let literal = '"';
    for (const b of gltfBytes) literal += `\\${String(b).padStart(3, "0")}`;
    literal += '"';

    lua.doStringSync(`
      local MODULE_SETUP = function(rt)
        rt.vars({ { type = "float", initial = 0.0 } })
        rt.onStart(function()
          rt.setVar(0, 42.0)
          rt.ptrSet("/nodes/[nodeIndex]/translation", { nodeIndex = 0.0 }, "float3", { 1.0, 2.0, 3.0 })
        end)
      end
      local GLTF = json_decode(${literal})
      ENGINE = CreateEngine(MODULE_SETUP)({ gltf = GLTF, seed = 123456789.0 })
      function BRIDGE_START() ENGINE.start() end
      function BRIDGE_VAR() return ENGINE.getVariableByIndex(0).data[1] end
      function BRIDGE_TRANSLATION(j) return GLTF.nodes[1].translation[j + 1] end
    `);
    (lua.global.get("BRIDGE_START") as () => void)();
    expect((lua.global.get("BRIDGE_VAR") as () => number)()).toBe(42);
    const translation = lua.global.get("BRIDGE_TRANSLATION") as (j: number) => number;
    expect([translation(0), translation(1), translation(2)]).toEqual([1, 2, 3]);
  });
});
