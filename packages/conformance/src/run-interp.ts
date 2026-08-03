import fs from "node:fs";
import path from "node:path";
import {
  createRuntime,
  evaluateTest,
  type TestEntry
} from "@gltfi/runtime";

const ROOT = process.env.INTERACTIVITY_TESTS_ROOT
  ?? path.resolve(import.meta.dirname, "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity");

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadIndex(fileName: string) {
  const filePath = path.join(ROOT, fileName);
  return readJson(filePath) as Array<{
    name: string;
    variants: { "glTF-Binary": string; "test-Json": string };
  }>;
}

function resolveVariantPath(entry: { name: string; variants: { "glTF-Binary": string; "test-Json": string } }) {
  const baseDir = path.join(ROOT, entry.name);
  const glbPath = path.join(baseDir, "glTF-Binary", entry.variants["glTF-Binary"]);
  const testPath = path.join(baseDir, "test-Json", entry.variants["test-Json"]);
  if (fs.existsSync(glbPath) && fs.existsSync(testPath)) {
    return { glbPath, testPath };
  }

  const altGlb = path.join(ROOT, entry.variants["glTF-Binary"]);
  const altTest = path.join(ROOT, entry.variants["test-Json"]);
  if (fs.existsSync(altGlb) && fs.existsSync(altTest)) {
    return { glbPath: altGlb, testPath: altTest };
  }

  throw new Error(`Missing files for ${entry.name}`);
}

function gatherTests() {
  const entries = [...loadIndex("test-index.json"), ...loadIndex("mathtests-index.json")];
  const tests: TestEntry[] = [];
  for (const entry of entries) {
    const { glbPath, testPath } = resolveVariantPath(entry);
    tests.push({ name: entry.name, glbPath, testPath });
  }
  return tests;
}

function main() {
  const tests = gatherTests();
  let failures = 0;
  for (const test of tests) {
    let result;
    try {
      result = evaluateTest(test);
    } catch (err) {
      result = { ok: false, failures: [`runner crash: ${err instanceof Error ? err.message : String(err)}`] };
    }
    if (!result.ok) {
      failures += 1;
      console.error(`FAIL ${test.name}`);
      for (const issue of result.failures) {
        console.error(`  - ${issue}`);
      }
    } else {
      console.log(`PASS ${test.name}`);
    }
  }
  if (failures > 0) {
    console.error(`${failures} tests failed.`);
    process.exit(1);
  }
  console.log(`All ${tests.length} tests passed.`);
}

main();
