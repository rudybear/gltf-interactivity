# gltf-interactivity

Transpiler between [`KHR_interactivity`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_interactivity) glTF behavior graphs and ordinary code. Decompile a graph into TypeScript, Lua, Python, C# or GDScript, edit it like a program, and compile or splice it back into the asset. Also ships a verifier and a reference interpreter.

Requires Node >= 22.

## Install

```
npm i gltf-interactivity                  # runtime, ir, gltf, verify, emit/*, parse/{py,cs,gd}
npm i gltf-interactivity ts-morph         # + TypeScript parsing (parse/ts; CLI compile/apply/roundtrip with ts)
npm i gltf-interactivity luaparse         # + Lua parsing (parse/lua; CLI --lang lua apply/roundtrip)
```

`ts-morph` (^23) and `luaparse` (^0.3.1) are *optional peer dependencies*: they are only needed to parse TypeScript / Lua, so installing the package for the runtime, IR or verifier does not pull in a TypeScript compiler. `gltfi decompile` / `extract` need neither. If a parser peer is missing, the CLI prints `this command needs the optional peer dependency ts-morph` and exits 1. When importing `gltf-interactivity/parse/ts` or `gltf-interactivity/parse/lua` as a library without the peer installed, the import itself fails with `ERR_MODULE_NOT_FOUND` for that package; no other entry point loads them.

The `./runtime` entries re-export [`@gltfi/runtime`](https://www.npmjs.com/package/@gltfi/runtime), which is a regular dependency (the CLI uses it too, so there is a single interpreter implementation).

## CLI

```
npm install -g gltf-interactivity     # or: npx gltfi ...

gltfi decompile <in.glb|in.gltf> [-o out.ts] [--js] [--graph N]
gltfi compile <in.ts> [-o out.gltf|out.glb] [--merge-into base.glb]
gltfi extract <in.glb|in.gltf> [-o out] [--lang ts|lua|py|cs|gd] [--graph N] [--force]
gltfi apply <asset.glb|asset.gltf> <script> [--graph N] [--lang ts|lua|py|cs|gd] [--dry-run] [--backup]
gltfi roundtrip <in.glb|in.gltf> [--graph N]
gltfi verify-equal <a.gltf|a.glb> <b.gltf|b.glb> [--graph-a N] [--graph-b N]
```

`extract` / `apply` is the byte-preserving edit workflow: `gltfi extract asset.glb` writes a script beside the asset; after editing it, `gltfi apply asset.glb asset.ts` splices the edited graph back in, leaving every byte outside `extensions.KHR_interactivity.graphs[N]` untouched.

The `gltfi conform` subcommand (Khronos conformance runners) is only available from a repository checkout; it needs the Khronos test assets.

### Toolchain requirements

| Language | Emit | Parse (`apply`, `roundtrip`) |
|---|---|---|
| ts, lua, gd | none | none beyond the optional peers `ts-morph` (ts) / `luaparse` (lua); gd is pure JS |
| py | none | `python3` on PATH |
| cs | none | .NET 8 SDK (`dotnet` on PATH); the C# AST harness is built into the package's `src/cs/bin` on first use, so that directory must be writable |

## Library

Everything is ESM, with types.

```ts
import { importGraph, exportGraph, checkModule } from "gltf-interactivity/ir";
import { emitModule } from "gltf-interactivity/emit/ts";
import { parseModule } from "gltf-interactivity/parse/ts";
import { validateGraph } from "gltf-interactivity/verify";
import { parseContainer, writeGlb } from "gltf-interactivity/gltf";
import { createRuntime } from "gltf-interactivity/runtime";
```

| Subpath | Contents |
|---|---|
| `.` | re-exports `ir`, `gltf` and `verify` |
| `./ir`, `./gltf`, `./verify` | graph IR + import/export, glTF/GLB container + splice, graph validation |
| `./runtime`, `./runtime/node` | re-exports of `@gltfi/runtime` / `@gltfi/runtime/node` (reference interpreter; `node` adds GLB file loading) |
| `./emit/{ts,lua,py,cs,gd}` | IR to source |
| `./parse/{ts,lua,py,cs,gd}` | source to IR (`ts` needs the `ts-morph` peer, `lua` the `luaparse` peer) |

Dependency: `@gltfi/runtime`. Optional peers: `ts-morph`, `luaparse`.

Compiled engines (the output of `decompile`) import their runtime from [`@gltfi/runtime-lib`](https://www.npmjs.com/package/@gltfi/runtime-lib).

## License

MIT
