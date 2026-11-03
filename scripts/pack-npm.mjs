// Stages and packs the three npm tarballs this repo publishes (never publishes —
// run `npm publish` by hand from build/npm/<pkg> or on the .tgz).
//
//   gltf-interactivity   the `gltfi` CLI + tooling libraries (ir, gltf, verify,
//                        runtime, emit-*, parse-*), esbuild-bundled with code
//                        splitting. ts-morph / luaparse are optional peers; @gltfi/runtime is a dependency (both external).
//   @gltfi/runtime-lib   the dependency-free runtime compiled engines import
//                        (kernel inlined).
//   @gltfi/runtime       the reference interpreter + host for browser viewers
//                        (kernel inlined, one unminified ES2020 file; built
//                        by scripts/build-npm-runtime.mjs).
//
// The workspace packages are NOT restructured: checked-in templates live in
// npm/<pkg>/{package.json,README.md}; this script copies them into
// build/npm/<pkg>/ beside generated dist/ (JS) and types/ (.d.ts copied from
// each workspace package's dist with `@gltfi/*` specifiers rewritten to
// relative paths), then runs `npm pack`.
//
// Usage: pnpm pack:npm   (= pnpm build && node scripts/pack-npm.mjs)
import { build } from "esbuild";
import { builtinModules } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { repo, pk, read, readJson, die as die_, resetDir, copyTree } from "./npm-shared.mjs";
import { buildRuntimeDist } from "./build-npm-runtime.mjs";

const out = path.join(repo, "build/npm");
const die = (msg) => die_(msg, "pack-npm");

const isBuiltin = (spec) => spec.startsWith("node:") || builtinModules.includes(spec);
const pkgNameOf = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);

// ---------------------------------------------------------------- types
// Copies packages/<pkg>/dist/**/*.d.ts to <stage>/types/<pkg>/, rewriting
// "@gltfi/<x>" and "@gltfi/<x>/<sub>" specifiers (static, `export ... from`,
// and `import("...")` types) to relative paths into the same types/ tree.
// Returns the set of workspace packages referenced, so callers can pull in
// the transitive closure.
function typeTarget(pkgName, sub) {
  const dist = path.join(pk(pkgName), "dist");
  if (!sub) return "index.js";
  const manifest = readJson(path.join(pk(pkgName), "package.json"));
  const ex = manifest.exports?.[`./${sub}`];
  const t = typeof ex === "string" ? ex : ex?.types;
  if (t) return path.relative("./dist", t).replace(/\.d\.ts$/, ".js");
  // Deep import like "@gltfi/kernel/dist/value.js".
  if (sub.startsWith("dist/") && fs.existsSync(path.join(dist, sub.slice(5).replace(/\.js$/, ".d.ts")))) return sub.slice(5);
  die(`cannot map type specifier @gltfi/${pkgName}/${sub}`);
}

function copyTypes(stage, pkgNames) {
  const done = new Set();
  const queue = [...pkgNames];
  while (queue.length) {
    const name = queue.pop();
    if (done.has(name)) continue;
    done.add(name);
    const distDir = path.join(pk(name), "dist");
    const dstRoot = path.join(stage, "types", name);
    copyTree(distDir, dstRoot, (rel, isDir) => isDir || (rel.endsWith(".d.ts") && !rel.endsWith(".test.d.ts")));
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, ent.name);
        if (ent.isDirectory()) { walk(f); continue; }
        let text = read(f);
        const fromDir = path.dirname(f);
        text = text.replace(/(from\s+|import\s*\(\s*)(["'])@gltfi\/([^/"']+)(?:\/([^"']+))?\2/g, (_m, pre, q, dep, sub) => {
          queue.push(dep);
          const target = path.join(stage, "types", dep, typeTarget(dep, sub));
          let rel = path.relative(fromDir, target).split(path.sep).join("/");
          if (!rel.startsWith(".")) rel = `./${rel}`;
          return `${pre}${q}${rel}${q}`;
        });
        // (runtime-lib-dts.d.ts legitimately holds "@gltfi/runtime-lib" inside a string literal.)
        if (/(from\s+|import\s*\(\s*)["']@gltfi\//.test(text)) die(`unrewritten @gltfi specifier left in ${f}`);
        fs.writeFileSync(f, text);
      }
    };
    walk(dstRoot);
  }
  return done;
}

function pack(stage, label) {
  const r = spawnSync("npm", ["pack", "--pack-destination", out, "--json"], { cwd: stage, encoding: "utf8" });
  if (r.status !== 0) die(`npm pack failed in ${stage}:\n${r.stderr}${r.stdout}`);
  const info = JSON.parse(r.stdout)[0];
  console.log(`${label}: ${info.filename}  packed ${(info.size / 1024).toFixed(1)} KB, unpacked ${(info.unpackedSize / 1024).toFixed(1)} KB, ${info.entryCount} files`);
  return info;
}

function stageCommon(name) {
  const stage = path.join(out, name);
  resetDir(stage);
  const tpl = path.join(repo, "npm", name);
  fs.copyFileSync(path.join(tpl, "package.json"), path.join(stage, "package.json"));
  fs.copyFileSync(path.join(tpl, "README.md"), path.join(stage, "README.md"));
  fs.copyFileSync(path.join(tpl, "CHANGELOG.md"), path.join(stage, "CHANGELOG.md"));
  fs.copyFileSync(path.join(repo, "LICENSE"), path.join(stage, "LICENSE"));
  return stage;
}

// -------------------------------------------------- gltf-interactivity
async function packTooling() {
  const stage = stageCommon("gltf-interactivity");
  const manifestPath = path.join(stage, "package.json");
  const manifest = readJson(manifestPath);

  // Flat entry names on purpose: every output (entries + shared chunks) sits
  // directly in dist/, so `import.meta.dirname + "../src/{cs,py,gd}"` in the
  // runtime-{cs,py,gd} packages resolves to <stage>/src/* wherever the code
  // lands.
  const entryDefs = {
    cli: path.join(pk("cli"), "dist/main.js"),
    ir: path.join(pk("ir"), "dist/index.js"),
    gltf: path.join(pk("gltf"), "dist/index.js"),
    verify: path.join(pk("verify"), "dist/index.js")
  };
  for (const l of ["ts", "lua", "py", "cs", "gd"]) {
    entryDefs[`emit-${l}`] = path.join(pk(`emit-${l}`), "dist/index.js");
    entryDefs[`parse-${l}`] = path.join(pk(`parse-${l}`), "dist/index.js");
  }
  // "." re-exports ir + gltf + verify (checked collision-free; see the
  // type check below and the README).
  const rootEntry = path.join(out, "_entry-index.js");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    rootEntry,
    ["ir", "gltf", "verify"].map((p) => `export * from ${JSON.stringify(path.join(pk(p), "dist/index.js"))};`).join("\n") + "\n"
  );
  entryDefs.index = rootEntry;

  // The interpreter is NOT bundled: "./runtime" and "./runtime/node" are thin
  // re-exports of the real dependency @gltfi/runtime, and every other entry
  // (CLI, conformance interp-adapter) imports it externally too, so there is
  // exactly one interpreter implementation.
  const external = ["typescript", "ts-morph", "luaparse", "wasmoon"];
  const runtimeExternal = {
    name: "gltfi-runtime-external",
    setup(b) {
      b.onResolve({ filter: /^@gltfi\/runtime(\/node)?$/ }, (a) => ({ path: a.path, external: true }));
    }
  };
  const result = await build({
    entryPoints: entryDefs,
    outdir: path.join(stage, "dist"),
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "node",
    target: "node22",
    minify: true,
    sourcemap: false,
    metafile: true,
    external,
    plugins: [runtimeExternal],
    logLevel: "warning"
  });
  fs.rmSync(rootEntry);
  fs.writeFileSync(path.join(stage, "dist/runtime.js"), 'export * from "@gltfi/runtime";\n');
  fs.writeFileSync(path.join(stage, "dist/runtime-node.js"), 'export * from "@gltfi/runtime/node";\n');

  // Which externals does the final bundle really import? (node builtins are fine)
  const used = new Set();
  const wasmoonReach = [];
  const importedBy = {}; // external pkg -> output files importing it
  for (const [file, meta] of Object.entries(result.metafile.outputs)) {
    for (const imp of meta.imports) {
      if (!imp.external || isBuiltin(imp.path)) continue;
      const n = pkgNameOf(imp.path);
      used.add(n);
      (importedBy[n] ??= []).push(path.basename(file));
      if (n === "wasmoon") wasmoonReach.push(file);
    }
  }
  if (used.has("wasmoon")) die(`wasmoon is reachable from the bundle: ${wasmoonReach.join(", ")}`);
  if (used.has("typescript")) die(`bundle imports "typescript" directly (${importedBy.typescript.join(", ")}); treat it like ts-morph (optional peer) first`);
  // One interpreter: no workspace runtime source may be inlined.
  const inlinedRuntime = Object.keys(result.metafile.inputs).filter((i) => /packages\/runtime\/(src|dist)\//.test(i));
  if (inlinedRuntime.length) die(`packages/runtime is inlined into the bundle: ${inlinedRuntime.slice(0, 3).join(", ")}`);
  // Static reachability: only the parse-ts / parse-lua entries may import the optional peers
  // (a shared chunk or the CLI entry importing them would load them at module evaluation).
  const OPTIONAL_PEERS = ["ts-morph", "luaparse"];
  const allowedImporter = { "ts-morph": /^parse-ts\.js$/, luaparse: /^parse-lua\.js$/ };
  for (const peer of OPTIONAL_PEERS) {
    for (const f of importedBy[peer] ?? []) {
      if (!allowedImporter[peer].test(f)) die(`optional peer ${peer} is imported by ${f}; only its parse-* entry may (shared chunk leak)`);
    }
  }
  const peerVersions = {
    "ts-morph": readJson(path.join(pk("parse-ts"), "package.json")).dependencies["ts-morph"],
    luaparse: readJson(path.join(pk("parse-lua"), "package.json")).dependencies.luaparse
  };
  for (const name of used) if (name !== "@gltfi/runtime" && !peerVersions[name]) die(`bundle imports external "${name}" with no known version (add it to pack-npm.mjs)`);
  const runtimeVersion = readJson(path.join(repo, "npm/runtime/package.json")).version;
  manifest.dependencies = { "@gltfi/runtime": `^${runtimeVersion}` };
  manifest.peerDependencies = Object.fromEntries(OPTIONAL_PEERS.map((n) => [n, peerVersions[n]]));
  manifest.peerDependenciesMeta = Object.fromEntries(OPTIONAL_PEERS.map((n) => [n, { optional: true }]));
  console.log(`gltf-interactivity: external imports: ${JSON.stringify(importedBy)}`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  // The CLI keeps its shebang (esbuild preserves a leading one); make it executable.
  const cli = path.join(stage, "dist/cli.js");
  if (!read(cli).startsWith("#!")) die("dist/cli.js lost its shebang");
  fs.chmodSync(cli, 0o755);

  // Runtime asset dirs the bundled runtime-{cs,py,gd} code resolves at ../src/*.
  const bundled = Object.keys(result.metafile.inputs);
  const touches = (pkg) => bundled.some((i) => i.includes(`packages/${pkg}/`));
  copyTree(path.join(pk("runtime-cs"), "src/cs"), path.join(stage, "src/cs"), (rel) => !/^(bin|obj)(\/|$)/.test(rel));
  copyTree(path.join(pk("runtime-py"), "src/py"), path.join(stage, "src/py"), (rel) => !rel.split("/").includes("__pycache__"));
  if (touches("runtime-gd")) copyTree(path.join(pk("runtime-gd"), "src/gd"), path.join(stage, "src/gd"));
  const bundleText = fs.readdirSync(path.join(stage, "dist")).map((f) => read(path.join(stage, "dist", f))).join("\n");
  for (const [pkg, dir] of [["runtime-cs", "cs"], ["runtime-py", "py"], ["runtime-gd", "gd"]]) {
    const has = fs.existsSync(path.join(stage, "src", dir));
    const refs = bundleText.includes(`../src/${dir}`);
    if (refs && !has) die(`bundle references ../src/${dir} but it was not staged`);
    console.log(`  asset dir src/${dir}: ${has ? "staged" : "not needed"} (${pkg} ${touches(pkg) ? "in bundle" : "not in bundle"})`);
  }

  // Types.
  const typePkgs = ["ir", "gltf", "verify", "runtime", "kernel", "emit-ts", "emit-lua", "emit-py", "emit-cs", "emit-gd", "parse-ts", "parse-lua", "parse-py", "parse-cs", "parse-gd"];
  const copied = copyTypes(stage, typePkgs);
  console.log(`  types copied for: ${[...copied].sort().join(", ")}`);
  // "./runtime" types re-export the dependency's own types.
  fs.writeFileSync(path.join(stage, "types/runtime/index.d.ts"), 'export * from "@gltfi/runtime";\n');
  fs.writeFileSync(path.join(stage, "types/runtime/node.d.ts"), 'export * from "@gltfi/runtime/node";\n');
  fs.writeFileSync(
    path.join(stage, "types/index.d.ts"),
    ["ir", "gltf", "verify"].map((p) => `export * from "./${p}/index.js";`).join("\n") + "\n"
  );

  return pack(stage, "gltf-interactivity");
}

// ------------------------------------------------------- runtime-lib
async function packRuntimeLib() {
  const stage = stageCommon("runtime-lib");
  const result = await build({
    entryPoints: { index: path.join(pk("runtime-lib"), "dist/index.js") },
    outdir: path.join(stage, "dist"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    mainFields: ["module", "main"], // "neutral" ignores `main` by default; needed to inline @gltfi/kernel
    target: "es2022",
    minify: true,
    sourcemap: false,
    metafile: true,
    logLevel: "warning"
  });
  for (const meta of Object.values(result.metafile.outputs)) {
    if (meta.imports.length) die(`runtime-lib bundle has imports: ${meta.imports.map((i) => i.path).join(", ")}`);
  }
  if (readJson(path.join(stage, "package.json")).dependencies) die("runtime-lib manifest must have no dependencies");
  copyTypes(stage, ["runtime-lib"]);
  return pack(stage, "@gltfi/runtime-lib");
}

// ------------------------------------------------------------ runtime
// Staging copy of npm/runtime (the package also builds in place there, via
// its own `npm run build`); both use the same buildRuntimeDist.
async function packRuntime() {
  const stage = stageCommon("runtime");
  await buildRuntimeDist(path.join(stage, "dist"));
  return pack(stage, "@gltfi/runtime");
}

fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith(".tgz")) fs.rmSync(path.join(out, f));
await packTooling();
await packRuntimeLib();
await packRuntime();
