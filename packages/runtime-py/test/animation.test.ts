// Runs test_animation.py (python unittest port of kernel/test/animation.test.ts)
// against gltfi_runtime.animation.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PYTHON_SRC_DIR } from "../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("gltfi_runtime.animation (python unittest)", () => {
  it("passes test_animation.py", () => {
    const r = spawnSync(process.env.GLTFI_PYTHON ?? "python3", ["-m", "unittest", "test_animation", "-v"], {
      cwd: here,
      env: { ...process.env, PYTHONPATH: PYTHON_SRC_DIR }
    });
    expect(`${r.stdout}${r.stderr}`).toContain("OK");
    expect(r.status).toBe(0);
  });
});
