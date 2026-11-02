// Runs packages/runtime's own test suite against the BUILT npm/runtime/dist
// bundle instead of the TypeScript sources (`npm run test:dist` here, or
// `pnpm test:dist` at the root; run `npm run build` first). The tests import
// "../src/host.js" and "../src/interpreter.js", both of which the bundle
// exposes from its single entry.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, "dist/index.js");

export default defineConfig({
  root: path.resolve(here, "../.."),
  resolve: {
    alias: [
      { find: /^(\.\.\/src\/|\.\/)?(host|interpreter)\.js$/, replacement: dist },
      { find: /^@gltfi\/runtime$/, replacement: dist }
    ]
  },
  test: {
    include: ["packages/runtime/test/**/*.test.ts"]
  }
});
