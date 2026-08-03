// Bundles @gltfi/runtime-lib (+ its @gltfi/kernel workspace dependency) into
// one self-contained, dependency-free ESM file the viewer serves as a static
// asset. This is the target of the browser import map entry
// `"@gltfi/runtime-lib": "/gltfi-runtime-lib.mjs"` declared in index.html: a
// compiled-engine module built at runtime (see src/compiled-loader.ts) is
// loaded from a `blob:` URL via dynamic import(), and its own
// `import { createEngine, m } from "@gltfi/runtime-lib";` statement resolves
// against the *document's* import map regardless of the blob module's own
// origin — that's the whole reason an import map (rather than, say, a
// relative import) is needed here at all.
//
// Runs as `predev`/`prebuild` (see package.json) so both `vite` (dev server)
// and `vite build` + `vite preview` always see a fresh bundle: dev serves
// everything under public/ verbatim at the site root, and build copies
// public/ into dist/ verbatim — same path, `/gltfi-runtime-lib.mjs`, either
// way, so no dev-vs-preview divergence.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const entry = resolve(repoRoot, "packages/runtime-lib/dist/index.js");
const outfile = resolve(here, "../public/gltfi-runtime-lib.mjs");

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  // @gltfi/runtime-lib + @gltfi/kernel are pure TS/JS with zero third-party
  // deps (see both packages' package.json) — nothing external to mark, but
  // being explicit costs nothing and guards against a future dependency
  // silently trying to bundle in something browser-unsafe.
  external: [],
  sourcemap: true,
  logLevel: "info"
});

console.log(`[bundle-runtime-lib] wrote ${outfile}`);
