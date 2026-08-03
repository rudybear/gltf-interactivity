// Compiled-Lua-engine conformance runner: GLB -> importGraph -> emitModuleLua
// -> assemble one Lua chunk (runtime-lua sources + generated module + a thin
// bridge glue) -> wasmoon LuaEngine per test -> judgeTest via a synchronous
// EngineLike bridge over the Lua instance. Mirrors run-compiled.ts's overall
// shape (GLB -> IR -> emit -> load -> judge) but the "load" step is a Lua
// VM instead of an esbuild+dynamic-import bundle, and the bridge crosses
// the JS/Lua boundary using ONLY primitives (numbers/booleans/strings) —
// no JS<->Lua array/table marshalling at all, which sidesteps any 0/1-based
// or NaN/Infinity encoding risk at that boundary (see the header note on
// BRIDGE_* below for why).
//
// Performance: one `LuaFactory` (and hence one compiled wasmoon WASM
// module) for the whole run; each test gets a fresh `LuaEngine` (a cheap
// fresh `lua_newstate`, not a WASM re-instantiation) — see the module-level
// `cmodule` obtained once via `factory.getLuaModule()`.
import fs from "node:fs";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { checkModule, importGraph, type Graph as IrGraph } from "@gltfi/ir";
import { emitModuleLua, EmitError } from "@gltfi/emit-lua";
import { LUA_RUNTIME_SOURCE } from "@gltfi/runtime-lua";
import { LuaEngine, LuaFactory, type LuaWasm } from "wasmoon";
import type { EngineLike, SentEvent } from "@gltfi/runtime-lib";
import type { Value, ValueType } from "@gltfi/kernel";
import { loadTestAssets } from "./assets.js";
import { judgeTest, type TestJson } from "./protocol.js";

function parseArgs(argv: string[]): { filter?: string } {
  const out: { filter?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--filter") {
      out.filter = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

// Embeds arbitrary bytes as a Lua double-quoted string literal using
// decimal (`\ddd`) escapes for every byte — the only encoding that's
// exactly as safe for a raw GLB binary chunk (arbitrary byte values 0-255)
// as it is for UTF-8 JSON text (this always emits the UTF-8 ENCODING's
// bytes, one `\ddd` per byte, never the JS string's UTF-16 code units, so
// non-ASCII glTF names round-trip correctly too). Larger than a quoted
// literal would need to be (4 source chars per byte) but simple, and these
// GLB conformance assets are small (a few KB).
function bytesToLuaLiteral(bytes: Uint8Array): string {
  let out = '"';
  for (let i = 0; i < bytes.length; i += 1) {
    out += `\\${String(bytes[i]).padStart(3, "0")}`;
  }
  return `${out}"`;
}

const VALUE_TYPE_COMPONENT_COUNT: Record<ValueType, number> = {
  bool: 1, int: 1, float: 1, ref: 1,
  float2: 2, float3: 3, float4: 4,
  float2x2: 4, float3x3: 9, float4x4: 16
};

// Builds the full Lua chunk for one GLB asset: runtime-lua sources, the
// emitted module (wrapped so its own top-level `return function(rt) ... end`
// returns the setup function to an IIFE instead of returning from the whole
// chunk), the gltf document + GLB BIN chunk embedded as escaped Lua string
// literals (see bytesToLuaLiteral), one `CreateEngine(...)(...)` call, and
// a handful of BRIDGE_* global functions — every one of them returns (or is
// called with) only a Lua number/boolean/string, which wasmoon marshals
// natively (IEEE-754 doubles both sides, so NaN/Infinity need no special
// casing) — never a table, so there's no array/index-base ambiguity to get
// wrong at this specific boundary (unlike the many 0-based/1-based
// conversions inside runtime-lua itself).
function buildScript(code: string, gltf: unknown, glbBin: DataView | null): string {
  const gltfJsonBytes = Buffer.from(JSON.stringify(gltf ?? null), "utf8");
  const glbBinBytes = glbBin ? new Uint8Array(glbBin.buffer, glbBin.byteOffset, glbBin.byteLength) : new Uint8Array(0);
  return [
    LUA_RUNTIME_SOURCE,
    "local MODULE_SETUP = (function()",
    code,
    "end)()",
    `local GLTF_JSON_TEXT = ${bytesToLuaLiteral(gltfJsonBytes)}`,
    `local GLBBIN_TEXT = ${bytesToLuaLiteral(glbBinBytes)}`,
    "local GLTF = nil",
    "if #GLTF_JSON_TEXT > 0 then GLTF = json_decode(GLTF_JSON_TEXT) end",
    "local GLBBIN = nil",
    "if #GLBBIN_TEXT > 0 then GLBBIN = GLBBIN_TEXT end",
    "ENGINE = CreateEngine(MODULE_SETUP)({ gltf = GLTF, glbBin = GLBBIN, seed = 123456789.0 })",
    "function BRIDGE_START() ENGINE.start() end",
    "function BRIDGE_ADVANCE(dt) ENGINE.advance(dt) end",
    "function BRIDGE_TIME() return ENGINE.time() end",
    "function BRIDGE_VARIABLE_COUNT() return ENGINE.variableCount() end",
    "function BRIDGE_VARIABLE_TYPE(i) return ENGINE.getVariableByIndex(i).type end",
    "function BRIDGE_VARIABLE_COMPONENT(i, j) return ENGINE.getVariableByIndex(i).data[j + 1] end",
    "function BRIDGE_EVENT_COUNT() return ENGINE.eventCount() end",
    "function BRIDGE_EVENT_DEFAULT(i) return ENGINE.eventDefaults()[i + 1] end",
    "function BRIDGE_SENT_EVENT_COUNT() return #ENGINE.sentEvents() end",
    "function BRIDGE_SENT_EVENT_INDEX(k) return ENGINE.sentEvents()[k + 1].eventIndex end",
    "function BRIDGE_SENT_EVENT_FIELD(k, field) return ENGINE.sentEvents()[k + 1].payload[field + 1] end"
  ].join("\n");
}

// Wraps one fresh Lua engine instance's BRIDGE_* globals as an EngineLike —
// judgeTest (protocol.ts) is written entirely against this interface and
// has no idea it's talking to Lua.
function bridgeEngineLike(lua: LuaEngine): EngineLike {
  const start = lua.global.get("BRIDGE_START") as () => void;
  const advanceFn = lua.global.get("BRIDGE_ADVANCE") as (dt: number) => void;
  const timeFn = lua.global.get("BRIDGE_TIME") as () => number;
  const variableCountFn = lua.global.get("BRIDGE_VARIABLE_COUNT") as () => number;
  const variableTypeFn = lua.global.get("BRIDGE_VARIABLE_TYPE") as (i: number) => ValueType;
  const variableComponentFn = lua.global.get("BRIDGE_VARIABLE_COMPONENT") as (i: number, j: number) => unknown;
  const eventCountFn = lua.global.get("BRIDGE_EVENT_COUNT") as () => number;
  const eventDefaultFn = lua.global.get("BRIDGE_EVENT_DEFAULT") as (i: number) => number | null;
  const sentEventCountFn = lua.global.get("BRIDGE_SENT_EVENT_COUNT") as () => number;
  const sentEventIndexFn = lua.global.get("BRIDGE_SENT_EVENT_INDEX") as (k: number) => number;
  const sentEventFieldFn = lua.global.get("BRIDGE_SENT_EVENT_FIELD") as (k: number, field: number) => unknown;

  return {
    start() {
      start();
    },
    advance(dt: number) {
      advanceFn(dt);
    },
    getVariableByIndex(index: number): Value {
      const type = variableTypeFn(index);
      const count = VALUE_TYPE_COMPONENT_COUNT[type] ?? 1;
      if (type === "bool") {
        const data: boolean[] = [];
        for (let j = 0; j < count; j += 1) data.push(Boolean(variableComponentFn(index, j)));
        return { type, data };
      }
      if (type === "ref") {
        return { type, data: [String(variableComponentFn(index, 0) ?? "")] };
      }
      const data: number[] = [];
      for (let j = 0; j < count; j += 1) data.push(Number(variableComponentFn(index, j)));
      return { type, data };
    },
    get variableCount() {
      return variableCountFn();
    },
    get sentEvents(): readonly SentEvent[] {
      const n = sentEventCountFn();
      const out: SentEvent[] = [];
      for (let k = 0; k < n; k += 1) {
        out.push({
          eventIndex: sentEventIndexFn(k),
          payload: [
            Boolean(sentEventFieldFn(k, 0)),
            Number(sentEventFieldFn(k, 1)),
            Number(sentEventFieldFn(k, 2)),
            Number(sentEventFieldFn(k, 3))
          ]
        });
      }
      return out;
    },
    get time() {
      return timeFn();
    },
    get eventDefaults(): readonly (number | undefined)[] {
      const n = eventCountFn();
      const out: (number | undefined)[] = [];
      for (let i = 0; i < n; i += 1) {
        const v = eventDefaultFn(i);
        out.push(v === null || v === undefined ? undefined : Number(v));
      }
      return out;
    }
  };
}

type RunOutcome = { ok: true } | { ok: false; kind: "SKIP" | "FAIL"; reason: string };

async function runOne(cmodule: LuaWasm, asset: { name: string; glbPath: string; testPath: string }): Promise<RunOutcome> {
  let script: string;
  let testJson: TestJson;
  try {
    const probe = createRuntimeFromGlbFile(asset.glbPath);
    const { module, diagnostics } = importGraph(probe.graph as unknown as IrGraph);
    const importErrors = diagnostics.filter((d) => d.severity === "error");
    if (importErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `import errors: ${JSON.stringify(importErrors)}` };
    }
    const checkErrors = checkModule(module).filter((d) => d.severity === "error");
    if (checkErrors.length > 0) {
      return { ok: false, kind: "SKIP", reason: `check errors: ${JSON.stringify(checkErrors)}` };
    }
    const { code } = emitModuleLua(module);
    script = buildScript(code, probe.gltf, probe.glbBin);
    testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
  } catch (err) {
    const reason = err instanceof EmitError ? err.message : err instanceof Error ? (err.stack ?? err.message) : String(err);
    return { ok: false, kind: err instanceof EmitError ? "SKIP" : "FAIL", reason };
  }

  const createdEngines: LuaEngine[] = [];
  try {
    const result = judgeTest(() => {
      const lua = new LuaEngine(cmodule);
      createdEngines.push(lua);
      lua.doStringSync(script);
      return bridgeEngineLike(lua);
    }, testJson);
    if (!result.ok) {
      return { ok: false, kind: "FAIL", reason: result.failures.join("\n  - ") };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, kind: "FAIL", reason: err instanceof Error ? (err.stack ?? err.message) : String(err) };
  } finally {
    // Fresh lua_newstate per test is cheap (see this file's header note),
    // but still needs closing — 145 assets' worth of leaked Lua states
    // would otherwise pile up in the one shared wasmoon WASM heap.
    for (const lua of createdEngines) {
      lua.global.close();
    }
  }
}

async function main() {
  const { filter } = parseArgs(process.argv.slice(2));
  const assets = loadTestAssets(undefined, filter);
  const factory = new LuaFactory();
  const cmodule = await factory.getLuaModule();
  let failures = 0;
  let skips = 0;
  for (const asset of assets) {
    const outcome = await runOne(cmodule, asset);
    if (outcome.ok) {
      console.log(`PASS ${asset.name}`);
      continue;
    }
    if (outcome.kind === "SKIP") {
      skips += 1;
      console.error(`SKIP ${asset.name}`);
      console.error(`  - ${outcome.reason}`);
    } else {
      failures += 1;
      console.error(`FAIL ${asset.name}`);
      console.error(`  - ${outcome.reason}`);
    }
  }
  console.log(`${assets.length} tests, ${assets.length - failures - skips} passed, ${failures} failed, ${skips} skipped.`);
  if (failures > 0 || skips > 0) {
    process.exit(1);
  }
  console.log(`All ${assets.length} tests passed.`);
}

main();
