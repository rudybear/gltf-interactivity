#!/usr/bin/env node
// Codegen: inlines packages/runtime-lua/src/lua/*.lua into
// packages/runtime-lua/src/lua-sources.ts as string constants, so the
// package's TS build (tsc, which only knows how to compile .ts) can export
// the Lua source text without a bundler-level asset loader. Run as this
// package's "prebuild" step (wired into the repo root "build" script — see
// root package.json) before `tsc -b`.
//
// Concatenation order matters: later files reference globals defined by
// earlier ones (json -> kmath -> m -> state -> scheduler -> animation ->
// pointer -> engine). LUA_RUNTIME_SOURCE is the full concatenation, in this
// order, that run-compiled-lua.ts loads into a fresh Lua state before the
// emitted module chunk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const luaDir = path.join(pkgRoot, "src/lua");
const outFile = path.join(pkgRoot, "src/lua-sources.ts");

const ORDER = ["json.lua", "kmath.lua", "m.lua", "state.lua", "scheduler.lua", "animation.lua", "pointer.lua", "engine.lua"];

function toConstName(fileName) {
  return fileName.replace(/\.lua$/, "").toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_LUA";
}

const missing = ORDER.filter((f) => !fs.existsSync(path.join(luaDir, f)));
if (missing.length > 0) {
  throw new Error(`build-lua-sources: missing expected .lua files: ${missing.join(", ")}`);
}

const parts = [];
const exportsList = [];
for (const file of ORDER) {
  const text = fs.readFileSync(path.join(luaDir, file), "utf8");
  const constName = toConstName(file);
  parts.push(`export const ${constName}: string = ${JSON.stringify(text)};`);
  exportsList.push(constName);
}

const header =
  "// GENERATED FILE — do not edit by hand. Produced by scripts/build-lua-sources.mjs\n" +
  "// from src/lua/*.lua. Re-run `node scripts/build-lua-sources.mjs` (or `pnpm build`,\n" +
  "// which wires this in as a prebuild step) after editing any .lua source.\n";

const bundle = `export const LUA_RUNTIME_SOURCE: string = [${exportsList.join(", ")}].join("\\n");\n`;

fs.writeFileSync(outFile, `${header}\n${parts.join("\n\n")}\n\n${bundle}`);
console.log(`build-lua-sources: wrote ${outFile} (${ORDER.length} files, ${exportsList.join(", ")})`);
