// Per-language emit/parse table for `gltfi extract`/`gltfi apply` (see
// main.ts's cmdExtract/cmdApply and the R3 plan's A4). Every entry is loaded
// via a DYNAMIC `import()` inside `loadLang`, not a static top-of-file
// import: `@gltfi/parse-cs` lazily spawns a persistent `dotnet` subprocess
// harness the first time `parseModuleCs` is called (see that package's
// session.ts), and `@gltfi/parse-py` does the same with a `python3`
// subprocess — neither should ever start just because the CLI process
// loaded, only when a script of that specific language is actually parsed.
// A static import of all five parse-*/emit-* packages up front would defeat
// that laziness (ESM module evaluation happens at import time, not call
// time) and make every `gltfi extract`/`apply` invocation pay dotnet's
// process-spawn latency even for a plain TypeScript script.
import path from "node:path";
import type { Diagnostic, IRModule } from "@gltfi/ir";

export type LangId = "ts" | "lua" | "py" | "cs" | "gd";

// File extension each language's extract/apply pair uses — also the table
// `langFromPath` inverts to infer `apply`'s language from the script's
// extension when `--lang` isn't passed.
export const LANG_EXTENSIONS: Record<LangId, string> = {
  ts: ".ts",
  lua: ".lua",
  py: ".py",
  cs: ".cs",
  gd: ".gd"
};

export const LANG_IDS = Object.keys(LANG_EXTENSIONS) as LangId[];

export type LangEmitResult = { code: string; names: { variables: string[]; events: string[]; stateSlots: string[]; procs: string[] } };
export type LangParseResult = { module: IRModule; diagnostics: Diagnostic[] };

export type LangModule = {
  id: LangId;
  ext: string;
  emitModule: (module: IRModule) => LangEmitResult;
  parseModule: (code: string) => LangParseResult;
  // Present only for languages backed by a lazily-spawned persistent
  // subprocess (py, cs — see the header note above). Callers that invoke
  // `parseModule` MUST call `close()` afterward (in a `finally`) so the
  // one-shot CLI process exits promptly instead of hanging on a lingering
  // child (mirrors packages/conformance/src/run-roundtrip-{py,cs}.ts's own
  // `closeParser()` convention).
  close?: () => void;
};

// Swaps a file path's extension for the language it names, or undefined if
// the extension doesn't match any entry in LANG_EXTENSIONS. Case-insensitive
// (".TS", ".Lua", etc. all resolve) since filesystems commonly preserve
// whatever case a user typed.
export function langFromPath(file: string): LangId | undefined {
  const ext = path.extname(file).toLowerCase();
  for (const id of LANG_IDS) {
    if (LANG_EXTENSIONS[id] === ext) {
      return id;
    }
  }
  return undefined;
}

export async function loadLang(id: LangId): Promise<LangModule> {
  switch (id) {
    case "ts": {
      const [emit, parse] = await Promise.all([import("@gltfi/emit-ts"), import("@gltfi/parse-ts")]);
      return {
        id,
        ext: LANG_EXTENSIONS.ts,
        emitModule: (module) => emit.emitModule(module, { flavor: "ts" }),
        parseModule: (code) => parse.parseModule(code)
      };
    }
    case "lua": {
      const [emit, parse] = await Promise.all([import("@gltfi/emit-lua"), import("@gltfi/parse-lua")]);
      return {
        id,
        ext: LANG_EXTENSIONS.lua,
        emitModule: (module) => emit.emitModuleLua(module),
        parseModule: (code) => parse.parseModuleLua(code)
      };
    }
    case "py": {
      const [emit, parse] = await Promise.all([import("@gltfi/emit-py"), import("@gltfi/parse-py")]);
      return {
        id,
        ext: LANG_EXTENSIONS.py,
        emitModule: (module) => emit.emitModulePy(module),
        parseModule: (code) => parse.parseModulePy(code),
        close: () => parse.closeParser()
      };
    }
    case "cs": {
      const [emit, parse] = await Promise.all([import("@gltfi/emit-cs"), import("@gltfi/parse-cs")]);
      return {
        id,
        ext: LANG_EXTENSIONS.cs,
        emitModule: (module) => emit.emitModuleCs(module),
        parseModule: (code) => parse.parseModuleCs(code),
        close: () => parse.closeParser()
      };
    }
    case "gd": {
      const [emit, parse] = await Promise.all([import("@gltfi/emit-gd"), import("@gltfi/parse-gd")]);
      return {
        id,
        ext: LANG_EXTENSIONS.gd,
        emitModule: (module) => emit.emitModuleGd(module),
        parseModule: (code) => parse.parseModuleGd(code)
      };
    }
  }
}
