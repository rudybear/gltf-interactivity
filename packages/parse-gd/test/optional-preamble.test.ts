import { describe, expect, it } from "vitest";
import { parseModuleGd } from "../src/index.js";

// The vars/events preamble is optional: a module declaring neither parses to
// an empty-variables/empty-events module (previously GX101/GX102 errors).
const SOURCE = `extends RefCounted

var m
var rt

func build(_rt) -> void:
    rt = _rt
    rt.on_start(__on_start_0)

func __on_start_0() -> void:
    rt.log_msg("hi")
`;

describe("optional vars/events preamble (gd)", () => {
  it("accepts a module with neither vars nor events", () => {
    const { module, diagnostics } = parseModuleGd(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(module.variables).toEqual([]);
    expect(module.events).toEqual([]);
    expect(module.handlers).toHaveLength(1);
  });
});
