// Regression coverage for gltf-studio #31 finding 1: RUNTIME_LIB_DTS (the
// ambient .d.ts for @gltfi/runtime-lib's rt/m surface, used to feed Monaco
// autocomplete downstream) must be reachable without importing this
// package's internal dist/runtime-lib-dts.js path directly — both via the
// public entry re-export and via the dedicated "./runtime-lib-dts" exports
// subpath declared in package.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RUNTIME_LIB_DTS } from "../src/index.js";
import { RUNTIME_LIB_DTS as RUNTIME_LIB_DTS_DIRECT } from "../src/runtime-lib-dts.js";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("RUNTIME_LIB_DTS public reachability", () => {
  it("is re-exported from the package's public entry (index.ts), identical to the internal module's export", () => {
    expect(typeof RUNTIME_LIB_DTS).toBe("string");
    expect(RUNTIME_LIB_DTS.length).toBeGreaterThan(0);
    expect(RUNTIME_LIB_DTS).toContain('declare module "@gltfi/runtime-lib"');
    expect(RUNTIME_LIB_DTS).toBe(RUNTIME_LIB_DTS_DIRECT);
  });

  it('package.json declares an "exports" map with "." and "./runtime-lib-dts" subpaths, and every referenced dist file exists after build', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf8"));
    expect(pkg.exports).toBeDefined();
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["./runtime-lib-dts"]).toBeDefined();

    for (const subpath of [".", "./runtime-lib-dts"]) {
      const entry = pkg.exports[subpath];
      for (const condition of ["types", "default"]) {
        const rel = entry[condition];
        expect(rel, `exports["${subpath}"].${condition}`).toBeTruthy();
        const abs = path.join(PKG_ROOT, rel);
        expect(fs.existsSync(abs), `${abs} should exist (run \`pnpm build\` first)`).toBe(true);
      }
    }
  });
});
