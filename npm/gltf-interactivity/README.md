# gltf-interactivity

Transpiler between [`KHR_interactivity`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_interactivity) glTF behavior graphs and ordinary code. Decompile a graph into TypeScript, Lua, Python, C# or GDScript, edit it like a program, and compile or splice it back into the asset. Also ships a verifier and a reference interpreter.

Requires Node >= 22.

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
| ts, lua, gd | none | none (pure JS; no extra tools) |
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
| `./runtime`, `./runtime/node` | reference interpreter (the `node` entry adds GLB file loading) |
| `./emit/{ts,lua,py,cs,gd}` | IR to source |
| `./parse/{ts,lua,py,cs,gd}` | source to IR |

Runtime dependencies: `ts-morph` (TypeScript parsing) and `luaparse` (Lua parsing).

Compiled engines (the output of `decompile`) import their runtime from [`@gltfi/runtime-lib`](https://www.npmjs.com/package/@gltfi/runtime-lib).

## License

MIT
