// F10: the UserInteractions/* corpus category (event/onSelect,
// event/onHoverIn/onHoverOut) has no official, automated runner anywhere in
// this monorepo before this test — test-index.json/mathtests-index.json
// structurally exclude the category (see discoverUserInteractionTests's own
// doc comment in assets.ts), and neither `run-interp`/`run-compiled` drive
// it. This exercises the new judgeInteractionTest against BOTH corpus
// assets (eventOnSelect, eventOnHover) using the interpreter
// (InteractivityRuntime, via asEngineLike()) as the engine — the same
// engine apps/viewer's own reference host drives selection/hover through
// (see packages/runtime/src/host.ts's setSelection/setHover).
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { createInteractivityRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { discoverUserInteractionTests } from "../src/assets.js";
import { judgeInteractionTest, type TestJson } from "../src/protocol.js";

const assets = discoverUserInteractionTests();

describe("UserInteractions/* corpus category (F10)", () => {
  it("discovers both known UserInteractions assets from the corpus's on-disk layout", () => {
    expect(assets.map((a) => a.name).sort()).toEqual(["UserInteractions/eventOnHover", "UserInteractions/eventOnSelect"]);
  });

  it.each(assets)("$name passes judgeInteractionTest against the interpreter engine", (asset) => {
    const testJson = JSON.parse(fs.readFileSync(asset.testPath, "utf8")) as TestJson;
    // Sanity-check the fixture actually exercises the interaction-injection
    // path this test is for — if the corpus ever restructures this away,
    // this test should fail loudly rather than silently judge an empty
    // requiredInteractions array as a pass.
    expect(testJson.tests.some((t) => (t.requiredInteractions?.length ?? 0) > 0)).toBe(true);

    const result = judgeInteractionTest(
      () => createInteractivityRuntimeFromGlbFile(asset.glbPath).asEngineLike(),
      testJson
    );
    expect(result.ok, `judgeInteractionTest FAILed on ${asset.name}:\n  - ${result.failures.join("\n  - ")}`).toBe(true);
  });

  it("a mustFire-only run (no gesture injected) fails eventOnSelect's positive-case sub-test", () => {
    // Negative control: without judgeInteractionTest's gesture injection,
    // the positive-case ("must fire") sub-test can never pass — confirms
    // this test suite is actually exercising the injection path, not
    // passing for some unrelated reason (e.g. a lenient oracle).
    const asset = assets.find((a) => a.name === "UserInteractions/eventOnSelect");
    expect(asset).toBeDefined();
    const testJson = JSON.parse(fs.readFileSync(asset!.testPath, "utf8")) as TestJson;
    const bare = { ...testJson, tests: testJson.tests.map((t) => ({ ...t, requiredInteractions: [] })) };
    const result = judgeInteractionTest(
      () => createInteractivityRuntimeFromGlbFile(asset!.glbPath).asEngineLike(),
      bare
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("onSelect: flow fired"))).toBe(true);
  });
});
