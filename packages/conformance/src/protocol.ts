// The KHR_interactivity conformance-corpus judge protocol, engine-agnostic.
// Ported verbatim from packages/runtime/src/interpreter.ts's
// evaluateGraphTests (see that function's own doc comment for the protocol
// this follows: run the whole graph once on load, tick to the asset-
// advertised expectedDuration + 0.25s at 1/60s steps, then judge each
// sub-test by the HasPassed boolean the graph computed itself). `EngineLike`
// (from @gltfi/runtime-lib) is the minimal surface both the interpreter (via
// interp-adapter.ts) and the compiled engine satisfy — this file has no
// knowledge of graph nodes, IR, or generated code at all.
import { mat4Compose, mat4Mul, type Value, type ValueType } from "@gltfi/kernel";
export { CONFORMANCE_ACTIVE_CAMERA } from "@gltfi/kernel";
import type { EngineInteractive, EngineLike } from "@gltfi/runtime-lib";

// F10: the `requiredInteractions` entry shape the `UserInteractions/*`
// corpus category's own oracle JSON carries (see
// Tests/Interactivity/UserInteractions/README.md's "How to run these
// automatically" section — this type mirrors that section's field
// reference table exactly). Absent on every other corpus test's entries.
export type RequiredInteraction = {
  type: "hover" | "select";
  expectation: "mustFire" | "mustNotFire";
  targetNodeId: number;
  targetNodeName?: string;
  notes?: string;
};

export type TestJson = {
  glbFileName: string;
  name: string;
  tests: Array<{
    name: string;
    entryPoints: Array<{ name: string; nodeId: number; delayedExecutionTime?: number }>;
    subTests: Array<{
      name: string;
      resultVarId: number;
      successResultVarId: number;
      resultVarType: ValueType;
      expectedResultValue: Array<number | boolean>;
    }>;
    // UserInteractions/* only — see RequiredInteraction and
    // judgeInteractionTest below.
    requiredInteractions?: RequiredInteraction[];
  }>;
};

export type TestResult = { ok: boolean; failures: string[] };

// Not used by judgeTest's own pass/fail decision (see the note below) but
// ported alongside it — interpreter.ts exports the equivalent function for
// other tooling (debug/host code), so this keeps that surface available to
// compiled-path consumers too.
export function compareValues(expected: Array<number | boolean>, actual: Value, type: ValueType, epsilon = 1e-4): boolean {
  if (type === "ref" || actual.type === "ref") {
    const data = actual.data as string[];
    return expected.every((item, index) => String(item) === String(data[index] ?? data[0] ?? ""));
  }
  if (type === "bool") {
    const data = actual.data as boolean[];
    return expected.every((item, index) => Boolean(item) === Boolean(data[index] ?? data[0]));
  }
  const data = actual.data as number[];
  return expected.every((item, index) => {
    const expectedValue = item;
    const actualValue = data[index] ?? data[0];
    if (typeof expectedValue === "number" && Number.isNaN(expectedValue)) {
      return Number.isNaN(actualValue);
    }
    if (expectedValue === Infinity || expectedValue === -Infinity) {
      return actualValue === expectedValue;
    }
    return Math.abs(Number(expectedValue) - actualValue) <= epsilon;
  });
}

type OneTest = TestJson["tests"][number];

// Shared core of judgeTest/judgeInteractionTest below: build a fresh engine,
// start it (optionally letting the caller inject something — a
// UserInteractions gesture — right after start() and before the graph is
// ticked forward), advance to the asset-advertised deadline, then judge
// every sub-test by the HasPassed boolean the graph computed itself.
function runJudge<E extends EngineLike>(
  makeEngine: () => E,
  testJson: TestJson,
  afterStart: (engine: E, test: OneTest) => void
): TestResult {
  const failures: string[] = [];
  for (const test of testJson.tests) {
    const engine = makeEngine();
    // Per the corpus protocol, the whole graph runs on load: every
    // event/onStart node activates (the oracle's entryPoints list is only
    // a subset useful for driving sub-tests individually — evaluateGraphTests
    // ignores it too).
    engine.start();
    afterStart(engine, test);

    // Duration = max over every sent event's expectedDuration payload
    // field, UNION every declared event's default expectedDuration —
    // mirrors interpreter.ts's evaluateGraphTests exactly (it folds in
    // *all* graph.events defaults unconditionally, not only ones actually
    // sent; see engine.ts's EngineLike.eventDefaults doc comment for why).
    let duration = 0;
    for (const sent of engine.sentEvents) {
      const d = sent.payload[3];
      if (Number.isFinite(d)) {
        duration = Math.max(duration, d);
      }
    }
    for (const d of engine.eventDefaults) {
      if (d !== undefined && Number.isFinite(d)) {
        duration = Math.max(duration, d);
      }
    }

    const deadline = duration + 0.25;
    const step = 1 / 60;
    while (engine.time < deadline) {
      engine.advance(step);
    }

    for (const subTest of test.subTests) {
      const passedVar = engine.getVariableByIndex(subTest.successResultVarId);
      const passed = passedVar ? Boolean((passedVar.data as unknown[])[0]) : false;
      if (!passed) {
        const value = engine.getVariableByIndex(subTest.resultVarId);
        failures.push(
          `${test.name} :: ${subTest.name} expected ${JSON.stringify(subTest.expectedResultValue)} got ${JSON.stringify(value?.data ?? null)}`
        );
      }
    }
  }
  return { ok: failures.length === 0, failures };
}

export function judgeTest(makeEngine: () => EngineLike, testJson: TestJson): TestResult {
  return runJudge(makeEngine, testJson, () => {});
}

// F10: the official interaction-injection hook for the `UserInteractions/*`
// corpus category (`event/onSelect`, `event/onHoverIn`/`onHoverOut`) —
// structurally excluded from both test-index.json/mathtests-index.json (see
// discoverUserInteractionTests in assets.ts), and un-runnable through
// judgeTest alone because their positive-case sub-tests depend on a gesture
// that must be synthesized from the outside (see
// Tests/Interactivity/UserInteractions/README.md's own "these tests differ
// from all other test cases" callout). This follows that README's own
// suggested automated flow exactly: start the graph, THEN synthesize every
// `mustFire` requiredInteractions entry (a "mustNotFire" entry needs no
// action at all — the corresponding sub-test is instant-pass unless the
// forbidden event fires some other way), THEN advance to the deadline like
// any other test.
//
// Requires an `EngineInteractive` (not just a bare `EngineLike`) since
// synthesizing a gesture needs fireSelect/fireHoverIn/fireHoverOut —
// @gltfi/runtime's `InteractivityRuntime.asEngineLike()` and
// @gltfi/runtime-lib's compiled `EngineInteractive` both implement this.
// `point`/`rayOrigin` are fixed, finite, arbitrary-but-valid gesture
// geometry — good enough for every UserInteractions sub-test in the corpus
// today, none of which asserts a *specific* point/ray value, only that
// `selectionRayOrigin` (event/onSelect's own output) comes out finite (a
// real host always has a real ray/point behind a gesture; the interpreter's
// own no-ray default is NaN-per-component specifically to distinguish "no
// gesture happened" from "one did", so a synthesized gesture must supply a
// real one instead of relying on that default).
//
// `options.nodeWorldPosition` (the target node's world-space position, see
// worldPositionOfNode below) makes the synthesized gesture land ON the target
// node: the corpus's eventOnSelect test asserts "selectionPoint on target
// cube", so a fixed origin point no longer passes. Without it the point is
// the world origin.
export function judgeInteractionTest(
  makeEngine: () => EngineInteractive,
  testJson: TestJson,
  options: { nodeWorldPosition?: (nodeIndex: number) => [number, number, number] } = {}
): TestResult {
  const rayOrigin: [number, number, number] = [0, 0, 5];
  return runJudge(makeEngine, testJson, (engine, test) => {
    for (const interaction of test.requiredInteractions ?? []) {
      if (interaction.expectation !== "mustFire") {
        continue;
      }
      const point: [number, number, number] = options.nodeWorldPosition?.(interaction.targetNodeId) ?? [0, 0, 0];
      if (interaction.type === "select") {
        engine.fireSelect(interaction.targetNodeId, point, rayOrigin);
      } else if (interaction.type === "hover") {
        // Both directions, per the README: "move onto it, then off it
        // again" — event/onHoverIn AND event/onHoverOut must both fire.
        engine.fireHoverIn(interaction.targetNodeId, point);
        engine.fireHoverOut(interaction.targetNodeId);
      }
    }
  });
}

// World-space position (translation of the global matrix) of glTF node
// `nodeIndex`, composed from the parent chain's local TRS/matrix. Used to aim
// synthesized select/hover gestures at a node (judgeInteractionTest).
export function worldPositionOfNode(gltf: { nodes?: Array<Record<string, unknown>> }, nodeIndex: number): [number, number, number] {
  const nodes = gltf.nodes ?? [];
  const parentOf = new Map<number, number>();
  nodes.forEach((node, index) => {
    for (const child of (node.children as number[] | undefined) ?? []) {
      parentOf.set(child, index);
    }
  });
  const local = (node: Record<string, unknown> | undefined): number[] => {
    if (Array.isArray(node?.matrix) && node.matrix.length === 16) {
      return (node.matrix as number[]).map(Number);
    }
    return mat4Compose(
      (node?.translation as number[] | undefined) ?? [0, 0, 0],
      (node?.rotation as number[] | undefined) ?? [0, 0, 0, 1],
      (node?.scale as number[] | undefined) ?? [1, 1, 1]
    );
  };
  let matrix = local(nodes[nodeIndex]);
  for (let cursor = parentOf.get(nodeIndex); cursor !== undefined; cursor = parentOf.get(cursor)) {
    matrix = mat4Mul(local(nodes[cursor]), matrix);
  }
  return [matrix[12], matrix[13], matrix[14]];
}
