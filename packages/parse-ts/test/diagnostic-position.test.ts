// Regression coverage for gltf-studio #31 finding 2: parseModule's
// Diagnostics now carry a structured source position (`line`/`column`/
// `span`) instead of forcing a downstream consumer (e.g. gltf-studio's
// script panel gutter markers) to regex "at <file>:<line>: `...`" out of
// the message text. The message text itself is unchanged (back-compat) —
// these fields are purely additive.
import { describe, expect, it } from "vitest";
import { parseModule } from "../src/index.js";

describe("parseModule - structured Diagnostic source position", () => {
  it("GI1xx (structural fail()) diagnostics carry line/column/span matching the message's embedded location", () => {
    // `debugger;` is valid TypeScript but not a recognized GIscript
    // statement shape, so this trips fail("GI110", stmt, ...) — see
    // src/index.ts's ModuleParser.lowerStatement default case.
    const code = [
      /* 1 */ 'import { createEngine, m } from "@gltfi/runtime-lib";',
      /* 2 */ "export default createEngine((rt) => {",
      /* 3 */ "  const V = rt.vars({});",
      /* 4 */ "  const E = rt.events({});",
      /* 5 */ "  rt.onStart(() => {",
      /* 6 */ "    debugger;",
      /* 7 */ "  });",
      /* 8 */ "});",
      ""
    ].join("\n");

    const { diagnostics } = parseModule(code);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(1);
    const [d] = errors;
    expect(d.code).toBe("GI110");

    // Structured fields, additive to the message.
    expect(d.line).toBe(6);
    expect(d.column).toBeGreaterThan(0);
    expect(d.span).toBeDefined();
    expect(d.span!.start).toBeLessThan(d.span!.end);
    expect(code.slice(d.span!.start, d.span!.end)).toBe("debugger;");

    // Back-compat: the message text still renders the same "file:line"
    // location it always has.
    expect(d.message).toContain(`:${d.line}:`);
  });

  it("GI001 (raw TypeScript diagnostic) errors carry line/column/span too", () => {
    const code = [
      /* 1 */ 'import { createEngine, m } from "@gltfi/runtime-lib";',
      /* 2 */ "export default createEngine((rt) => {",
      /* 3 */ "  const V = rt.vars({});",
      /* 4 */ "  const E = rt.events({});",
      /* 5 */ "  const bad: number = \"not a number\";",
      /* 6 */ "  rt.onStart(() => {});",
      /* 7 */ "});",
      ""
    ].join("\n");

    const { diagnostics } = parseModule(code);
    const errors = diagnostics.filter((d) => d.severity === "error" && d.code === "GI001");
    expect(errors.length).toBeGreaterThan(0);
    const [d] = errors;
    expect(d.line).toBe(5);
    expect(d.column).toBeGreaterThan(0);
    expect(d.span).toBeDefined();
    expect(d.span!.start).toBeLessThan(d.span!.end);
    expect(d.message).toContain("(line 5)");
  });

  it("a fail() diagnostic anchored on a real AST node carries a fully-populated position (line, column, and a non-empty span)", () => {
    // "GI100": there IS an `export default`, but its expression isn't a
    // createEngine(...) call — fail() is called with that expression's own
    // (real) node here (see src/index.ts's findEngineBody).
    const code = "export default 42;\n";
    const { diagnostics } = parseModule(code);
    const errors = diagnostics.filter((d) => d.severity === "error" && d.code === "GI100");
    expect(errors, JSON.stringify(errors)).toHaveLength(1);
    const [d] = errors;
    expect(d.line, JSON.stringify(d)).toBe(1);
    expect(d.column, JSON.stringify(d)).toBeGreaterThan(0);
    expect(d.span, JSON.stringify(d)).toBeDefined();
    expect(d.span!.start).toBeLessThan(d.span!.end);
  });

  it("leaves line/column/span undefined (not synthesized) when fail() has no AST node to anchor on", () => {
    // No `export default` at all: findEngineBody's fail("GI100", exportStmt,
    // ...) is called with `exportStmt` itself `undefined` in this case — the
    // resulting diagnostic has no position to report, and must say so
    // honestly (`undefined`) rather than defaulting to e.g. line 0/1.
    const code = "export const notAnEngine = 1;\n";
    const { diagnostics } = parseModule(code);
    const errors = diagnostics.filter((d) => d.severity === "error" && d.code === "GI100");
    expect(errors, JSON.stringify(errors)).toHaveLength(1);
    const [d] = errors;
    expect(d.line).toBeUndefined();
    expect(d.column).toBeUndefined();
    expect(d.span).toBeUndefined();
    // Message text is unaffected either way (no "at file:line" suffix when
    // fail() had no node) — back-compat.
    expect(d.message).toBe("expected exactly one `export default createEngine((rt) => {...})`");
  });
});
