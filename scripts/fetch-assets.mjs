#!/usr/bin/env node

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);
const assetsPath = join(repoRoot, "external", "glTF-Test-Assets-Interactivity");

// Pinned corpus revision. The upstream repo is re-exported in place (sub-tests
// added, values re-encoded, new test files), so an unpinned clone silently
// changes what the gates measure. Bump deliberately, together with the code
// and expected counts (e.g. "145 tests") that depend on it.
const ASSETS_REPO = "https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity";
const ASSETS_REV = "f99d9b6cac73513282fc4fa8bbcc6b3a94ad8283";

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(1);
  }
}

if (existsSync(assetsPath)) {
  console.log("assets already present");
  process.exit(0);
}

git(["init", "-q", assetsPath]);
git(["remote", "add", "origin", ASSETS_REPO], assetsPath);
git(["fetch", "-q", "--depth", "1", "origin", ASSETS_REV], assetsPath);
git(["checkout", "-q", "FETCH_HEAD"], assetsPath);
