// The KHR_interactivity conformance-corpus judge protocol, engine-agnostic.
// Ported verbatim from packages/runtime/src/interpreter.ts's
// evaluateGraphTests (see that function's own doc comment for the protocol
// this follows: run the whole graph once on load, tick to the asset-
// advertised expectedDuration + 0.25s at 1/60s steps, then judge each
// sub-test by the HasPassed boolean the graph computed itself). `EngineLike`
// (from @gltfi/runtime-lib) is the minimal surface both the interpreter (via
// interp-adapter.ts) and the compiled engine satisfy — this file has no
// knowledge of graph nodes, IR, or generated code at all.
import type { Value, ValueType } from "@gltfi/kernel";
import type { EngineLike } from "@gltfi/runtime-lib";

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

export function judgeTest(makeEngine: () => EngineLike, testJson: TestJson): TestResult {
  const failures: string[] = [];
  for (const test of testJson.tests) {
    const engine = makeEngine();
    // Per the corpus protocol, the whole graph runs on load: every
    // event/onStart node activates (the oracle's entryPoints list is only
    // a subset useful for driving sub-tests individually — evaluateGraphTests
    // ignores it too).
    engine.start();

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
