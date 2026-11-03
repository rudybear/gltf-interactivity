import fs from "node:fs";
import path from "node:path";
import { createRuntimeFromGlbFile } from "@gltfi/runtime/node";
import { importGraph, exportGraph, checkModule } from "@gltfi/ir";
import { emitModule } from "@gltfi/emit-ts";
import { parseModule } from "@gltfi/parse-ts";
const T = "external/glTF-Test-Assets-Interactivity/Tests/Interactivity/";
const n = process.argv[2];
const b = path.basename(n);
try {
  const probe = createRuntimeFromGlbFile(T + n + "/glTF-Binary/" + b + ".glb");
  const { module } = importGraph(probe.graph);
  const { code } = emitModule(module);
  if (process.argv[3] === "code") console.log(code);
  const { module: m2, diagnostics } = parseModule(code);
  console.log(diagnostics.filter((d) => d.severity === "error"));
  const { graph } = exportGraph(m2);
  const v = await import("@gltfi/verify");
  console.log(v.validateGraph(graph).ok);
  console.log(v.equivalentGraphs(probe.graph, graph).equivalent);
} catch (e) {
  console.log(e.stack);
}
