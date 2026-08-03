#!/usr/bin/env node

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);
const assetsPath = join(repoRoot, "external", "glTF-Test-Assets-Interactivity");

if (existsSync(assetsPath)) {
  console.log("assets already present");
  process.exit(0);
}

const result = spawnSync(
  "git",
  [
    "clone",
    "--depth",
    "1",
    "https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity",
    assetsPath,
  ],
  {
    stdio: "inherit",
  }
);

if (result.status !== 0) {
  process.exit(1);
}
