// Regression coverage for #20-3 (GI190): a WARNING-only lint over
// parseModule's fully-lowered proc/handler bodies, catching the "temp reuse
// after write" trap — see lintTempReuseAfterWrite's own doc comment in
// src/index.ts for the exact rule and its deliberately conservative scope.
// In graph semantics a `let` temp is a value edge, re-evaluated against a
// variable's CURRENT state on every read; a TS reader's intuition that a
// `let` freezes its right-hand side is wrong once the underlying variable
// is written and the temp is read again afterward.
import { describe, expect, it } from "vitest";
import { parseModule } from "../src/index.js";

function wrap(stmts: string): string {
  return `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ x: rt.float(1), y: rt.float(1), result: rt.float(0) });
  const E = rt.events({});
  rt.onStart(() => {
    ${stmts}
  });
});
`;
}

function warnings(code: string) {
  const { diagnostics } = parseModule(code);
  expect(diagnostics.filter((d) => d.severity === "error"), code).toEqual([]);
  return diagnostics.filter((d) => d.code === "GI190");
}

describe("parseModule - GI190 temp-reuse-after-write lint", () => {
  it("warns when a temp is read after a write to a variable its initializer depends on", () => {
    const code = wrap(`
      const t1 = V.x + 1;
      V.x = 5;
      V.result = t1;
    `);
    const w = warnings(code);
    expect(w).toHaveLength(1);
    expect(w[0].message).toContain('temp "t1"');
    expect(w[0].message).toContain("re-evaluated");
  });

  it("warns when the dependency is transitive (through an earlier temp)", () => {
    const code = wrap(`
      const t1 = V.x;
      const t2 = t1 + 1;
      V.x = 5;
      V.result = t2;
    `);
    const w = warnings(code);
    expect(w.map((d) => d.message).join("\n")).toContain('temp "t2"');
  });

  it("does NOT warn when the temp is only read BEFORE the write", () => {
    const code = wrap(`
      const t1 = V.x + 1;
      V.result = t1;
      V.x = 5;
    `);
    expect(warnings(code)).toEqual([]);
  });

  it("does NOT warn when the temp's initializer reads no variable at all", () => {
    const code = wrap(`
      const t1 = 1 + 2;
      V.x = 5;
      V.result = t1;
    `);
    expect(warnings(code)).toEqual([]);
  });

  it("does NOT warn when the write is to a DIFFERENT variable than the one the temp depends on", () => {
    const code = wrap(`
      const t1 = V.x + 1;
      V.y = 5;
      V.result = t1;
    `);
    expect(warnings(code)).toEqual([]);
  });

  it("warns only ONCE even if the tainted temp is read multiple times", () => {
    const code = wrap(`
      const t1 = V.x + 1;
      V.x = 5;
      V.result = t1;
      V.y = t1;
    `);
    expect(warnings(code)).toHaveLength(1);
  });

  it("a write in EITHER branch of an if taints reads after the if (conservative union)", () => {
    const code = wrap(`
      const t1 = V.x + 1;
      if (V.y > 0) {
        V.x = 5;
      }
      V.result = t1;
    `);
    const w = warnings(code);
    expect(w).toHaveLength(1);
  });

  it("does NOT warn when the read happens inside the SAME if-branch as the write, before it", () => {
    const code = wrap(`
      const t1 = V.x + 1;
      if (V.y > 0) {
        V.result = t1;
        V.x = 5;
      } else {
        V.result = 0;
      }
    `);
    expect(warnings(code)).toEqual([]);
  });

  it("no cross-proc analysis: a callProc between the write and the read is opaque (does not suppress or add warnings by itself)", () => {
    const code = `
import { createEngine, m } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ x: rt.float(1), result: rt.float(0) });
  const E = rt.events({});
  function helper() {
    V.result = 0;
  }
  rt.onStart(() => {
    const t1 = V.x + 1;
    V.x = 5;
    helper();
    V.result = t1;
  });
});
`;
    const w = warnings(code);
    expect(w).toHaveLength(1);
    expect(w[0].message).toContain('temp "t1"');
  });
});
