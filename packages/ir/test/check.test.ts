// Regression coverage for gltf-studio #31 finding 2: checkModule's
// Diagnostics now carry a structured `nodeIndex` (the originating
// KHR_interactivity graph node index, read back out of
// IRModule.meta.sourceNodeIds — see check.ts's ownerNodeIndex/model.ts's
// Diagnostic doc comment) instead of forcing a downstream consumer (e.g.
// gltf-studio's script panel) to regex the message text for a location.
import { describe, expect, it } from "vitest";
import { checkModule, type IRExpr, type IRModule } from "../src/index.js";

function baseModule(overrides: Partial<IRModule>): IRModule {
  return {
    variables: [],
    events: [],
    stateSlots: [],
    handlers: [],
    procs: [],
    meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: {} },
    ...overrides
  };
}

describe("checkModule - structured Diagnostic.nodeIndex", () => {
  it("populates nodeIndex from meta.sourceNodeIds['handler:<i>'] for a handler-body error (GIC022 out-of-range varGet)", () => {
    const badVarGet: IRExpr = { k: "varGet", varId: 99 };
    const module = baseModule({
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "let", temp: "t0", type: "float", expr: badVarGet }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: { "handler:0": 42 } }
    });

    const diagnostics = checkModule(module);
    const errs = diagnostics.filter((d) => d.severity === "error");
    expect(errs).toHaveLength(1);
    expect(errs[0].code).toBe("GIC022");
    expect(errs[0].nodeIndex).toBe(42);
    // Message text is unchanged/back-compat — no location text was ever
    // embedded in it for IR-level diagnostics (unlike @gltfi/parse-ts's
    // text-based ones), so nodeIndex is purely additive here.
    expect(errs[0].message).toContain("varGet references out-of-range varId 99");
  });

  it("prefers a temp's own sourceNodeIds['temp:<id>'] entry (more precise) over the owning handler's root node", () => {
    const module = baseModule({
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          // References temp "t0" before any `let` binds it in this body.
          body: { k: "setVar", varId: 0, expr: { k: "temp", id: "t0" } }
        }
      ],
      variables: [{ name: "v0", type: "float", initial: { type: "float", data: [0] } }],
      meta: {
        nameMaps: { variables: [], events: [], stateSlots: [], procs: [] },
        sourceNodeIds: { "handler:0": 5, "temp:t0": 99 }
      }
    });

    const diagnostics = checkModule(module);
    const errs = diagnostics.filter((d) => d.code === "GIC001");
    expect(errs).toHaveLength(1);
    expect(errs[0].nodeIndex).toBe(99);
  });

  it("falls back to the owning handler's node when no more specific sourceNodeIds entry exists", () => {
    const module = baseModule({
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "emitEvent", eventId: 7, args: [] }
        }
      ],
      meta: { nameMaps: { variables: [], events: [], stateSlots: [], procs: [] }, sourceNodeIds: { "handler:0": 11 } }
    });

    const diagnostics = checkModule(module);
    const errs = diagnostics.filter((d) => d.code === "GIC031");
    expect(errs).toHaveLength(1);
    expect(errs[0].nodeIndex).toBe(11);
  });

  it("leaves nodeIndex undefined (not e.g. null or 0) when the module carries no sourceNodeIds entry for the owner", () => {
    const module = baseModule({
      handlers: [
        {
          kind: "onStart",
          params: [{ name: "event", type: "ref" }],
          body: { k: "emitEvent", eventId: 7, args: [] }
        }
      ]
    });

    const diagnostics = checkModule(module);
    const errs = diagnostics.filter((d) => d.code === "GIC031");
    expect(errs).toHaveLength(1);
    expect(errs[0].nodeIndex).toBeUndefined();
  });
});
