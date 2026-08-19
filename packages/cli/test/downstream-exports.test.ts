// Cross-package regression coverage for gltf-studio #31 finding 1: a real
// downstream consumer resolving "@gltfi/parse-ts" and
// "@gltfi/parse-ts/runtime-lib-dts" by PACKAGE NAME (real Node module
// resolution through node_modules, not a relative src import) must be able
// to reach RUNTIME_LIB_DTS both ways. @gltfi/cli is a genuine, ordinary
// dependent of @gltfi/parse-ts (see package.json), so it's a faithful stand-
// in for gltf-studio's own resolution — unlike a test living inside
// packages/parse-ts itself, which can only ever import its own source
// relatively and would not catch an "exports" map misconfiguration.
import { describe, expect, it } from "vitest";

describe("@gltfi/parse-ts downstream package-name resolution", () => {
  it("RUNTIME_LIB_DTS resolves from the public entry \"@gltfi/parse-ts\"", async () => {
    const mod = await import("@gltfi/parse-ts");
    expect(typeof mod.RUNTIME_LIB_DTS).toBe("string");
    expect(mod.RUNTIME_LIB_DTS).toContain('declare module "@gltfi/runtime-lib"');
  });

  it('RUNTIME_LIB_DTS resolves from the dedicated "@gltfi/parse-ts/runtime-lib-dts" exports subpath, with identical content to the public entry', async () => {
    const [fromIndex, fromSubpath] = await Promise.all([import("@gltfi/parse-ts"), import("@gltfi/parse-ts/runtime-lib-dts")]);
    expect(typeof fromSubpath.RUNTIME_LIB_DTS).toBe("string");
    expect(fromSubpath.RUNTIME_LIB_DTS).toBe(fromIndex.RUNTIME_LIB_DTS);
  });
});
