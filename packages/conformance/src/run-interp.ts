// Interpreter conformance runner, rewired through the shared protocol.ts +
// interp-adapter.ts (see docs/design's M3 refactor: this file used to call
// @gltfi/runtime/node's evaluateTest directly; it now builds the same
// RuntimeGraph and drives it through judgeTest via the EngineLike adapter —
// the "All 145 tests passed." result is unchanged, which is the proof the
// refactor didn't alter interpreter behavior).
import fs from "node:fs";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { loadTestAssets } from "./assets.js";
import { interpEngineFromRuntime } from "./interp-adapter.js";
import { judgeTest, type TestJson } from "./protocol.js";

function main() {
  const assets = loadTestAssets();
  let failures = 0;
  for (const asset of assets) {
    let result;
    try {
      const testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
      result = judgeTest(() => interpEngineFromRuntime(createRuntimeFromGlbFile(asset.glbPath)), testJson);
    } catch (err) {
      result = { ok: false, failures: [`runner crash: ${err instanceof Error ? err.message : String(err)}`] };
    }
    if (!result.ok) {
      failures += 1;
      console.error(`FAIL ${asset.name}`);
      for (const issue of result.failures) {
        console.error(`  - ${issue}`);
      }
    } else {
      console.log(`PASS ${asset.name}`);
    }
  }
  if (failures > 0) {
    console.error(`${failures} tests failed.`);
    process.exit(1);
  }
  console.log(`All ${assets.length} tests passed.`);
}

main();
