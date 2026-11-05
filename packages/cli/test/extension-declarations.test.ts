// exportGraph must emit `extension` on declarations of extension-owned ops
// (event/onSelect -> KHR_node_selectability, event/onHoverIn/Out ->
// KHR_node_hoverability) so our own validator raises no GV127 warning, and the
// glTF container writer must list those extensions in `extensionsUsed`.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { exportGraph } from "@gltfi/ir";
import { parseModule } from "@gltfi/parse-ts";
import { InteractivityRuntime } from "@gltfi/runtime";
import { validateExtension } from "@gltfi/kernel";
import { extensionsNeededByGraph, spliceGraph, type Container } from "@gltfi/gltf";

const SCRIPT = `
import { createEngine } from "@gltfi/runtime-lib";
export default createEngine((rt) => {
  const V = rt.vars({ sel: rt.float(0), hin: rt.float(0), hout: rt.float(0) });
  rt.onSelect(0, false, (params) => { V.sel = 1; });
  rt.onHoverIn(0, (params) => { V.hin = 1; });
  rt.onHoverOut(0, (params) => { V.hout = 1; });
});
`;

function compile() {
  const parsed = parseModule(SCRIPT);
  expect(parsed.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return exportGraph(parsed.module).graph;
}

const WANT = ["KHR_interactivity", "KHR_node_hoverability", "KHR_node_selectability"];

describe("extension-owned op declarations", () => {
  it("exportGraph emits `extension` and the graph validates with zero diagnostics (no GV127)", () => {
    const graph = compile();
    const byOp = Object.fromEntries(graph.declarations.map((d) => [d.op, d.extension]));
    expect(byOp["event/onSelect"]).toBe("KHR_node_selectability");
    expect(byOp["event/onHoverIn"]).toBe("KHR_node_hoverability");
    expect(byOp["event/onHoverOut"]).toBe("KHR_node_hoverability");
    expect(graph.declarations.filter((d) => d.op === "event/onSelect")).toHaveLength(1);
    const r = validateExtension({ graphs: [graph] });
    expect(r.diagnostics.map((d) => d.code)).toEqual([]);
  });

  it("container writer lists the declared extensions in extensionsUsed (splice and reserialize paths)", () => {
    const graph = compile();
    expect([...extensionsNeededByGraph(graph)].sort()).toEqual(WANT);
    const bare: Container = { kind: "gltf", jsonText: '{"asset":{"version":"2.0"}}', json: { asset: { version: "2.0" } } };
    expect([...(spliceGraph(bare, 0, graph).container.json.extensionsUsed as string[])].sort()).toEqual(WANT);
    const text = '{"asset":{"version":"2.0"},"extensionsUsed":["KHR_interactivity"],"extensions":{"KHR_interactivity":{"graphs":[{}]}}}';
    const spliced = spliceGraph({ kind: "gltf", jsonText: text, json: JSON.parse(text) }, 0, graph);
    expect(spliced.report.mode).toBe("splice");
    expect([...(spliced.container.json.extensionsUsed as string[])].sort()).toEqual(WANT);
  });

  it("the interpreter still fires select/hover handlers from the exported graph", () => {
    const graph = compile();
    const rt = new InteractivityRuntime(graph as never, { nodes: [{}] });
    rt.setSelection(0, [0, 0, 0]);
    rt.setHover(0, [0, 0, 0]);
    expect(rt.getVariable(0)?.data).toEqual([1]);
    expect(rt.getVariable(1)?.data).toEqual([1]);
    rt.setHover(-1, [0, 0, 0]);
    expect(rt.getVariable(2)?.data).toEqual([1]);
  });

  it("no example script yields GV127", () => {
    const root = path.resolve(__dirname, "../../../examples");
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === "node_modules") continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith(".ts")) files.push(p);
      }
    };
    walk(root);
    let checked = 0;
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      if (!src.includes("createEngine")) continue;
      const parsed = parseModule(src);
      if (parsed.diagnostics.some((d) => d.severity === "error")) continue;
      const codes = validateExtension({ graphs: [exportGraph(parsed.module).graph] }).diagnostics.map((d) => d.code);
      expect(codes, f).not.toContain("GV127");
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
