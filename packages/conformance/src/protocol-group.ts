// Multi-engine sibling of protocol.ts's judgeTest, for corpus tests whose
// sub-tests only make sense with SEVERAL assets loaded in one session
// (Tests/Interactivity/InterGlb/: RefEcho_FileA.glb + RefEcho_FileB.glb
// communicating through public custom events). The caller builds the engines
// (already joined to one shared event bus, see @gltfi/kernel's EventBus);
// this file knows nothing about buses or graphs.
//
// Protocol (README "How to load and run"): load everything first, start every
// engine (event/onStart in each), then advance all engines in lockstep to
// max(expectedDuration over every engine) + 0.25s, then judge each member's
// sub-tests by its own HasPassed variable, exactly like judgeTest does.
import type { EngineLike } from "@gltfi/runtime-lib";
import type { TestJson, TestResult } from "./protocol.js";

export type GroupMember = { name: string; engine: EngineLike; testJson: TestJson };

function durationOf(engine: EngineLike): number {
  let duration = 0;
  for (const sent of engine.sentEvents) {
    if (Number.isFinite(sent.payload[3])) {
      duration = Math.max(duration, sent.payload[3]);
    }
  }
  for (const d of engine.eventDefaults) {
    if (d !== undefined && Number.isFinite(d)) {
      duration = Math.max(duration, d);
    }
  }
  return duration;
}

export function judgeGroup(build: () => GroupMember[]): TestResult {
  const members = build();
  for (const member of members) {
    member.engine.start();
  }
  const deadline = Math.max(0, ...members.map((m) => durationOf(m.engine))) + 0.25;
  const step = 1 / 60;
  while (Math.min(...members.map((m) => m.engine.time)) < deadline) {
    for (const member of members) {
      member.engine.advance(step);
    }
  }
  const failures: string[] = [];
  for (const member of members) {
    for (const test of member.testJson.tests) {
      for (const subTest of test.subTests) {
        const passedVar = member.engine.getVariableByIndex(subTest.successResultVarId);
        if (!(passedVar && Boolean((passedVar.data as unknown[])[0]))) {
          const value = member.engine.getVariableByIndex(subTest.resultVarId);
          failures.push(
            `${member.name} :: ${test.name} :: ${subTest.name} expected ${JSON.stringify(subTest.expectedResultValue)} got ${JSON.stringify(value?.data ?? null)}`
          );
        }
      }
    }
  }
  return { ok: failures.length === 0, failures };
}

export function countSubTests(members: GroupMember[]): number {
  return members.reduce((n, m) => n + m.testJson.tests.reduce((k, t) => k + t.subTests.length, 0), 0);
}
