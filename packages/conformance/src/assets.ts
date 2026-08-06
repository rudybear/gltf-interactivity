// Shared corpus-index / variant-resolution code for both conformance
// runners (run-interp.ts, run-compiled.ts): loads test-index.json +
// mathtests-index.json and resolves each entry's GLB/test-oracle-JSON paths
// on disk. Split out of run-interp.ts's original inline copy so both
// runners (and any future one) share one implementation.
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_ROOT = path.resolve(
  import.meta.dirname,
  "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity"
);

export type TestAsset = { name: string; glbPath: string; testPath: string };

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadIndex(root: string, fileName: string) {
  return readJson(path.join(root, fileName)) as Array<{
    name: string;
    variants: { "glTF-Binary": string; "test-Json": string };
  }>;
}

function resolveVariantPath(
  root: string,
  entry: { name: string; variants: { "glTF-Binary": string; "test-Json": string } }
): { glbPath: string; testPath: string } {
  const baseDir = path.join(root, entry.name);
  const glbPath = path.join(baseDir, "glTF-Binary", entry.variants["glTF-Binary"]);
  const testPath = path.join(baseDir, "test-Json", entry.variants["test-Json"]);
  if (fs.existsSync(glbPath) && fs.existsSync(testPath)) {
    return { glbPath, testPath };
  }

  const altGlb = path.join(root, entry.variants["glTF-Binary"]);
  const altTest = path.join(root, entry.variants["test-Json"]);
  if (fs.existsSync(altGlb) && fs.existsSync(altTest)) {
    return { glbPath: altGlb, testPath: altTest };
  }

  throw new Error(`Missing files for ${entry.name}`);
}

// `filterPrefix` matches the acceptance corpus's dotted test names
// (e.g. "math/", "type/", "ref/") — a plain `startsWith` against
// `entry.name`, same convention run-compiled.ts's `--filter` uses.
export function loadTestAssets(root: string = DEFAULT_ROOT, filterPrefix?: string): TestAsset[] {
  const entries = [...loadIndex(root, "test-index.json"), ...loadIndex(root, "mathtests-index.json")];
  const filtered = filterPrefix ? entries.filter((e) => e.name.startsWith(filterPrefix)) : entries;
  return filtered.map((entry) => {
    const { glbPath, testPath } = resolveVariantPath(root, entry);
    return { name: entry.name, glbPath, testPath };
  });
}

// F10: `UserInteractions/*` (event/onSelect, event/onHoverIn/onHoverOut) is
// structurally absent from BOTH test-index.json and mathtests-index.json —
// confirmed by grepping both files in the corpus checkout, neither lists a
// `UserInteractions/...` entry — so loadTestAssets above can never surface
// this category no matter what `filterPrefix` is passed. This enumerates it
// directly from the corpus's own on-disk layout instead
// (`UserInteractions/<name>/glTF-Binary/<name>.glb` +
// `UserInteractions/<name>/test-Json/<name>.json`, the exact same two-file
// shape every other category uses, just not index-listed) — a read-only
// directory walk, never touching the corpus checkout itself. See
// `Tests/Interactivity/UserInteractions/README.md` for why this category
// needs its own judge (`@gltfi/conformance/protocol`'s
// judgeInteractionTest) rather than plain `judgeTest`.
export function discoverUserInteractionTests(root: string = DEFAULT_ROOT): TestAsset[] {
  const categoryDir = path.join(root, "UserInteractions");
  if (!fs.existsSync(categoryDir)) {
    return [];
  }
  const names = fs
    .readdirSync(categoryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const assets: TestAsset[] = [];
  for (const name of names) {
    const glbPath = path.join(categoryDir, name, "glTF-Binary", `${name}.glb`);
    const testPath = path.join(categoryDir, name, "test-Json", `${name}.json`);
    if (fs.existsSync(glbPath) && fs.existsSync(testPath)) {
      assets.push({ name: `UserInteractions/${name}`, glbPath, testPath });
    }
  }
  return assets;
}
