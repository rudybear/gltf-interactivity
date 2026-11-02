// Small helpers shared by the npm packaging scripts (pack-npm.mjs,
// build-npm-runtime.mjs): repo paths, fs utilities, and the workspace
// package lookup. No build logic lives here.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const pk = (name) => path.join(repo, "packages", name);
export const read = (p) => fs.readFileSync(p, "utf8");
export const readJson = (p) => JSON.parse(read(p));

export function die(msg, who = "npm") {
  console.error(`${who}: ${msg}`);
  process.exit(1);
}

export function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

// Recursive copy with a per-entry filter (relative path, isDirectory) -> bool.
export function copyTree(src, dst, keep = () => true, rel = "") {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    if (!keep(r, ent.isDirectory())) continue;
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyTree(s, d, keep, r);
    else fs.copyFileSync(s, d);
  }
}
