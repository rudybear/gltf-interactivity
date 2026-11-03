// Builds @gltfi/runtime (npm/runtime): the reference KHR_interactivity
// interpreter + host for browser glTF viewers, with @gltfi/kernel inlined.
//
//   dist/index.js   ONE self-contained ESM file (no imports, no chunks).
//                   Unminified, names unmangled, ES2020 syntax, no sourcemap
//                   — the consumer's old rollup-based bundler re-bundles and
//                   commits it, so it must be readable and parse everywhere.
//   dist/node.js    node:fs GLB helpers; imports the main entry as "./index.js"
//                   (not a second copy) so `instanceof InteractivityRuntime`
//                   holds across both entries.
//   dist/*.d.ts     public types, with the kernel's .d.ts copied to
//                   dist/kernel/ and `@gltfi/kernel` specifiers made relative.
//
// JS is bundled straight from packages/{runtime,kernel}/src (esbuild resolves
// the `.js` specifiers to `.ts`), so it does not depend on tsc's JS output;
// only the .d.ts files do, hence the `tsc -b packages/runtime` step below.
//
// Usage: `npm run build` in npm/runtime (builds in place + copies LICENSE), or
// imported by scripts/pack-npm.mjs, which builds into a staging dir.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { repo, pk, read, die as die_, resetDir, copyTree } from "./npm-shared.mjs";

const die = (msg) => die_(msg, "build-npm-runtime");

async function buildJs(dist) {
  const common = {
    outdir: dist,
    bundle: true,
    splitting: false,
    format: "esm",
    platform: "neutral",
    // ES2020: esbuild lowers TS class fields (`private dirty = false`) to
    // constructor assignments, which old parsers need (native fields are ES2022).
    target: "es2020",
    minify: false,
    sourcemap: false,
    metafile: true,
    logLevel: "warning",
    // Pin esbuild's working dir so the `// packages/...` source-path comments
    // in the unminified bundle (and so its bytes) don't depend on whether the
    // build ran from npm/runtime (`npm run build`) or the repo root (pack:npm).
    absWorkingDir: repo
  };
  const main = await build({
    ...common,
    entryPoints: { index: path.join(pk("runtime"), "src/index.ts") },
    alias: { "@gltfi/kernel": path.join(pk("kernel"), "src/index.ts") }
  });
  // node.ts re-exports the interpreter/host modules; point those at the
  // main bundle instead of inlining a second copy.
  const toMainEntry = {
    name: "to-main-entry",
    setup(b) {
      b.onResolve({ filter: /^\.\/(interpreter|host|event-bus)\.js$/ }, () => ({ path: "./index.js", external: true }));
    }
  };
  const node = await build({
    ...common,
    entryPoints: { node: path.join(pk("runtime"), "src/node.ts") },
    external: ["node:fs"],
    plugins: [toMainEntry]
  });

  // index.js must be fully self-contained; node.js may import only node:fs
  // and ./index.js.
  for (const [file, meta] of Object.entries(main.metafile.outputs)) {
    if (meta.imports.length) die(`${file} has imports: ${meta.imports.map((i) => i.path).join(", ")}`);
  }
  for (const [file, meta] of Object.entries(node.metafile.outputs)) {
    for (const imp of meta.imports) {
      if (imp.path !== "./index.js" && imp.path !== "node:fs") die(`${file} imports unexpected "${imp.path}"`);
    }
  }
}

// Copies the runtime + kernel declarations and rewrites `@gltfi/kernel`
// (the only workspace import in runtime's public .d.ts, including
  // `import("@gltfi/kernel/dist/x.js")` deep forms tsc emits) to a relative path.
function buildTypes(dist) {
  const tsc = path.join(repo, "node_modules/.bin/tsc");
  const r = spawnSync(tsc, ["-b", path.join(pk("runtime"))], { cwd: repo, encoding: "utf8" });
  if (r.status !== 0) die(`tsc -b packages/runtime failed:\n${r.stdout}${r.stderr}`);
  const dts = (rel, isDir) => isDir || (rel.endsWith(".d.ts") && !rel.endsWith(".test.d.ts"));
  copyTree(path.join(pk("runtime"), "dist"), dist, dts);
  copyTree(path.join(pk("kernel"), "dist"), path.join(dist, "kernel"), dts);

  const rewrite = (file, kernelPrefix) => {
    const text = read(file);
    const next = text.replace(/(from\s+|import\s*\(\s*)(["'])@gltfi\/kernel(?:\/dist\/([^"']+))?\2/g, (_m, pre, q, sub) => `${pre}${q}${kernelPrefix}kernel/${sub ?? "index.js"}${q}`);
    if (/(from\s+|import\s*\(\s*)["']@gltfi\//.test(next)) die(`unrewritten @gltfi specifier left in ${file}`);
    fs.writeFileSync(file, next);
  };
  // Runtime d.ts sit directly in dist/; kernel's own files only import siblings.
  for (const f of fs.readdirSync(dist)) if (f.endsWith(".d.ts")) rewrite(path.join(dist, f), "./");
  for (const f of fs.readdirSync(path.join(dist, "kernel"))) rewrite(path.join(dist, "kernel", f), "./");
}

export async function buildRuntimeDist(dist) {
  resetDir(dist);
  await buildJs(dist);
  buildTypes(dist);
  const size = fs.statSync(path.join(dist, "index.js")).size;
  console.log(`@gltfi/runtime: dist/index.js ${(size / 1024).toFixed(1)} KB, ${fs.readdirSync(dist).join(", ")}`);
}

// CLI: build in place in npm/runtime.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const pkgDir = path.join(repo, "npm/runtime");
  await buildRuntimeDist(path.join(pkgDir, "dist"));
  fs.copyFileSync(path.join(repo, "LICENSE"), path.join(pkgDir, "LICENSE"));
}
