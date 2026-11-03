import { describe, expect, it } from "vitest";
import { parseModuleGd } from "../src/index.js";

// `[name]` pointer-template params take an int; `{name}` params take a ref.
// Feeding an int expression to a `{name}` param used to lower silently and
// the write was dropped at runtime with no diagnostic; it is now an error
// (GG131) with a "use [n] for integer indices" hint.
const SOURCE = `extends RefCounted

var m
var rt
var V
var E

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["i", rt.int_var(1)]])
    E = rt.events([])
    rt.on_start(__on_start_0)

func __on_start_0() -> void:
    rt.ptr_set("/nodes/[n]/scale", {"n": V.i}, "float3", [2.0, 2.0, 2.0])
`;

describe("pointer template param kinds (gd)", () => {
  it("`[n]` with an int expression parses cleanly", () => {
    const { diagnostics } = parseModuleGd(SOURCE);
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("`{n}` with an int expression is an error with an index hint", () => {
    const { diagnostics } = parseModuleGd(SOURCE.replace("[n]", "{n}"));
    const errs = diagnostics.filter((d) => d.severity === "error");
    expect(errs.map((d) => d.code)).toEqual(["GG131"]);
    expect(errs[0].message).toContain("use \"[n]\" for integer indices");
  });
});
