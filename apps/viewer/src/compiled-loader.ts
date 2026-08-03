// Turns a loaded glTF document's KHR_interactivity graph into a running
// compiled engine, entirely in-browser: resolveGraph (from @gltfi/runtime —
// same graph-resolution helper the Node conformance runner uses) ->
// importGraph (@gltfi/ir) -> checkModule -> emitModule(flavor:"js")
// (@gltfi/emit-ts) -> a `blob:` module URL -> dynamic import() -> the
// module's default-exported EngineFactory -> factory(options) -> a running
// engine. Mirrors packages/conformance/src/run-compiled.ts's pipeline
// exactly, minus the esbuild bundle step (that runner needs esbuild because
// it emits flavor:"ts" and runs under Node; here flavor:"js" already strips
// the handful of type annotations emit-ts ever produces — see emit-ts's
// EmitOptions doc comment — so the Blob's source is directly executable
// ECMAScript with zero transpile step needed).
import { resolveGraph, type Graph as InterpGraph } from "@gltfi/runtime";
import { importGraph, checkModule, type Graph as IrGraph } from "@gltfi/ir";
import { emitModule, EmitError } from "@gltfi/emit-ts";
import type { EngineFactory, EngineInteractive } from "@gltfi/runtime-lib";

export class CompiledLoadError extends Error {}

export type CompiledLoadResult = {
  engine: EngineInteractive;
  // Kept around for diagnostics/debugging (e.g. a "view generated source"
  // panel) — not required for the engine to run.
  code: string;
};

export async function loadCompiledEngine(
  gltfJson: unknown,
  glbBin: ArrayBuffer | Uint8Array | null,
  onPointerSet: (pointer: string, value: number[] | boolean[] | number | boolean) => void
): Promise<CompiledLoadResult> {
  // @gltfi/runtime's Graph and @gltfi/ir's Graph are two independently
  // declared but structurally identical types (see
  // packages/conformance/src/run-compiled.ts's own cast for precedent) — no
  // KHR_interactivity-graph-shape conversion actually happens here, just a
  // type-system formality.
  const graph: InterpGraph = resolveGraph(gltfJson);
  const { module, diagnostics } = importGraph(graph as unknown as IrGraph);
  const importErrors = diagnostics.filter((d) => d.severity === "error");
  if (importErrors.length > 0) {
    throw new CompiledLoadError(`graph -> IR import errors: ${JSON.stringify(importErrors)}`);
  }
  const checkErrors = checkModule(module).filter((d) => d.severity === "error");
  if (checkErrors.length > 0) {
    throw new CompiledLoadError(`IR check errors: ${JSON.stringify(checkErrors)}`);
  }
  let code: string;
  try {
    code = emitModule(module, { flavor: "js" }).code;
  } catch (err) {
    const message = err instanceof EmitError ? err.message : err instanceof Error ? err.message : String(err);
    throw new CompiledLoadError(`emit-ts could not compile this graph to JS: ${message}`);
  }
  const blobUrl = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  try {
    // @vite-ignore: this specifier is a runtime-computed blob: URL, never a
    // static string Vite could analyze/pre-bundle — the comment just
    // silences Vite's (harmless but noisy) dynamic-import warning.
    const mod = (await import(/* @vite-ignore */ blobUrl)) as { default?: EngineFactory };
    if (typeof mod.default !== "function") {
      throw new CompiledLoadError("compiled module has no default-exported EngineFactory");
    }
    const engine = mod.default({ gltf: gltfJson, glbBin: glbBin ?? undefined, onPointerSet });
    return { engine, code };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
