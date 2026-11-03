// Runs test/animation_test.gd (the GDScript port of kernel's animation.test.ts:
// normalized SHORT rotation, byteStride, sparse incl. no-bufferView,
// CUBICSPLINE Hermite, weights, STEP, skipped channels, decode-count cache
// checks) under `godot --headless`. Skipped when no godot binary is available
// (CI does not run Godot; this is a local gate).
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GD_SRC_DIR } from "../src/index.js";

const GODOT_BIN = process.env.GLTFI_GODOT ?? "godot";
const HAS_GODOT = (() => {
  try {
    return spawnSync(GODOT_BIN, ["--version"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
})();

describe.runIf(HAS_GODOT)("GDScript animation decoding / sampling / cache", () => {
  it("animation_test.gd passes with no failures", () => {
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "animation_test.gd");
    const res = spawnSync(GODOT_BIN, ["--headless", "--no-header", "--path", GD_SRC_DIR, "--script", script], {
      encoding: "utf8",
      timeout: 120_000
    });
    const out = `${res.stdout}${res.stderr}`;
    expect(out).toMatch(/RESULT pass=\d+ fail=0/);
    expect(out).not.toMatch(/^FAIL /m);
    expect(res.status).toBe(0);
  });
});
