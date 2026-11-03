// A self-rescheduling GIscript proc exports a spec-valid graph (no flow
// back-edge: the re-entry is a private custom event) and still loops at runtime.
import { describe, expect, it } from "vitest";
import { exportGraph } from "@gltfi/ir";
import { validateGraphObject } from "@gltfi/kernel";
import { InteractivityRuntime } from "@gltfi/runtime";
import { parseModule } from "../src/index.js";

const SOURCE = `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ n: rt.withId("n", rt.float(0)) });
  rt.events({});
  const d = rt.delayState();
  function tickLoop() {
    V.n = V.n + 1;
    rt.setDelay(d, 0.25, tickLoop);
  }
  rt.onStart(() => {
    tickLoop();
  });
});
`;

describe("self-rescheduling proc", () => {
  it("exports a valid graph and keeps looping", () => {
    const parsed = parseModule(SOURCE, "loop.ts");
    expect(parsed.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const { graph, diagnostics } = exportGraph(parsed.module);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const v = validateGraphObject(graph);
    expect(v.ok, JSON.stringify(v).slice(0, 500)).toBe(true);

    const runtime = new InteractivityRuntime(graph as never, {});
    runtime.start();
    for (let i = 0; i < 4; i += 1) {
      runtime.tick(0.26);
    }
    const n = Number((runtime.getVariableByIndex(0) as { data?: number[] }).data?.[0] ?? (runtime.getVariableByIndex(0) as unknown));
    expect(n).toBeGreaterThanOrEqual(4);
  });
});
