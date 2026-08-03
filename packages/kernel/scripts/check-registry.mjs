#!/usr/bin/env node
// Cross-checks packages/kernel/src/registry.ts (OP_REGISTRY) against the
// KHR_interactivity interpreter's own op dispatch
// (packages/runtime/src/interpreter.ts), which is conformance-tested and is
// the authority for which op names actually exist and what they do.
//
// Extracts every `case "x/y":` string from the interpreter source (covering
// both its value-op switch, evaluateValue, and its flow-op switch,
// executeNodeFlow) and diffs that set against OP_REGISTRY's keys in both
// directions:
//   - an interpreter case with no registry entry is a failure, unless it's
//     on the allowlist below (demonstrably non-core / viewer-only / dead code).
//   - a registry entry with no interpreter case is always a failure (the
//     registry must never claim ops the conformance-tested interpreter
//     doesn't implement).
//
// Run via `pnpm check:registry` (see root package.json). Requires the
// kernel package to be built first (`pnpm build`) since it imports the
// compiled OP_REGISTRY from dist/registry.js rather than re-parsing the
// registry source.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const kernelDist = path.resolve(here, "../dist/registry.js");
const interpreterSrc = path.resolve(here, "../../runtime/src/interpreter.ts");

if (!fs.existsSync(kernelDist)) {
  console.error(`check-registry: ${path.relative(process.cwd(), kernelDist)} is missing — run "pnpm build" first.`);
  process.exit(1);
}

const { OP_REGISTRY } = await import(kernelDist);

const source = fs.readFileSync(interpreterSrc, "utf8");
const caseRe = /case\s+"([a-zA-Z]+\/[a-zA-Z0-9]+)"\s*:/g;
const interpreterOps = new Set();
let match;
while ((match = caseRe.exec(source))) {
  interpreterOps.add(match[1]);
}

if (interpreterOps.size === 0) {
  console.error("check-registry: found zero `case \"x/y\":` strings in interpreter.ts — regex or path is broken.");
  process.exit(1);
}

// Interpreter dispatch cases that are intentionally NOT in OP_REGISTRY,
// each with a one-line justification. Every entry here must correspond to a
// real `case` in interpreter.ts (checked below) so the allowlist can't rot.
const ALLOWLIST = {
  "event/onPointerDown": "viewer-only convenience event (raw pointer x/y/position); not a KHR_interactivity or extension-defined op",
  "event/onPointerUp": "viewer-only convenience event (raw pointer x/y/position); not a KHR_interactivity or extension-defined op",
  "event/onPointerMove": "viewer-only convenience event (raw pointer x/y/position); not a KHR_interactivity or extension-defined op",
  "event/onHover": "viewer-only continuous hover-state convenience event (hoveredNodeIndex/hoverPoint); distinct from the real KHR_node_hoverability onHoverIn/onHoverOut events, which ARE registered",
  "math/matMul2x2": "vestigial duplicate dispatch: the conformance corpus's \"math/matMul2x2\" test scenario invokes the generic \"math/matMul\" op (which already dispatches on operand size) — this case string is never emitted by any real graph",
  "math/matMul3x3": "vestigial duplicate dispatch, see math/matMul2x2 — corpus scenario uses generic \"math/matMul\"",
  "math/transpose2x2": "vestigial duplicate dispatch: corpus scenario uses generic \"math/transpose\"",
  "math/transpose3x3": "vestigial duplicate dispatch: corpus scenario uses generic \"math/transpose\"",
  "math/determinant2x2": "vestigial duplicate dispatch: corpus scenario uses generic \"math/determinant\"",
  "math/determinant3x3": "vestigial duplicate dispatch: corpus scenario uses generic \"math/determinant\"",
  "math/inverse2x2": "vestigial duplicate dispatch: corpus scenario uses generic \"math/inverse\"",
  "math/inverse3x3": "vestigial duplicate dispatch: corpus scenario uses generic \"math/inverse\""
};

const allowlistNames = new Set(Object.keys(ALLOWLIST));
const staleAllowlistEntries = [...allowlistNames].filter((op) => !interpreterOps.has(op));

const registryOps = new Set(OP_REGISTRY.keys());

const missingFromRegistry = [...interpreterOps]
  .filter((op) => !registryOps.has(op) && !allowlistNames.has(op))
  .sort();

const missingFromInterpreter = [...registryOps]
  .filter((op) => !interpreterOps.has(op))
  .sort();

let ok = true;

console.log(`check-registry: ${interpreterOps.size} interpreter dispatch case names, ${registryOps.size} OP_REGISTRY entries, ${allowlistNames.size} allowlisted.`);

if (staleAllowlistEntries.length > 0) {
  ok = false;
  console.error("\nStale allowlist entries (no longer a `case` in interpreter.ts — remove from ALLOWLIST):");
  for (const op of staleAllowlistEntries) {
    console.error(`  - ${op}`);
  }
}

if (missingFromRegistry.length > 0) {
  ok = false;
  console.error("\nInterpreter cases with no OP_REGISTRY entry (add to registry.ts, or to ALLOWLIST with justification):");
  for (const op of missingFromRegistry) {
    console.error(`  - ${op}`);
  }
}

if (missingFromInterpreter.length > 0) {
  ok = false;
  console.error("\nOP_REGISTRY entries with no interpreter case (registry claims an op the interpreter doesn't implement):");
  for (const op of missingFromInterpreter) {
    console.error(`  - ${op}`);
  }
}

if (!ok) {
  console.error("\ncheck-registry: FAILED");
  process.exit(1);
}

console.log("check-registry: OK — OP_REGISTRY matches the interpreter's dispatch exactly (module allowlist).");
