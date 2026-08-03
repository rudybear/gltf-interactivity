# glTF Interactivity ↔ Script

A bidirectional transpiler between glTF KHR_interactivity behavior graphs and constrained scripting-language subsets (TypeScript first, then Luau and typed Python), with a spec-conformant interpreter, a compiled-code engine, and a WebGPU viewer. Everything gated on the official Khronos test suite (KhronosGroup/glTF-Test-Assets-Interactivity).

## Status

All core conformance gates pass against the official Khronos test assets (145 tests / 647 sub-tests):

| Gate | Pipeline | Status |
|------|----------|--------|
| V1 Interpreter | graph → interpreter | **145/145** |
| V2 Compiled | graph → TypeScript → execute | **145/145** |
| V3 Roundtrip | graph → TypeScript → parse → graph′ → interpreter | **145/145** |

The WebGPU viewer (`pnpm dev`) hosts both engines — `?engine=interpreter` (default) or `?engine=compiled` — with click-select and hover bubbling. `pnpm smoke` runs a headless render check (needs a real GPU; software WebGPU in sandboxes can't sustain the swap-chain). Planned: Luau and typed-Python backends over the same IR.

## Quickstart

```bash
pnpm install
pnpm fetch:assets
pnpm build
pnpm conf:interp
```

## Packages

- **@gltfi/kernel**: Core types and utilities
- **@gltfi/gltf**: glTF format handling
- **@gltfi/runtime**: Spec-conformant interpreter runtime
- **@gltfi/ir**: Intermediate representation for behavior graphs
- **@gltfi/emit-ts**: Emit TypeScript code from IR
- **@gltfi/parse-ts**: Parse TypeScript to IR
- **@gltfi/runtime-lib**: Runtime support library
- **@gltfi/verify**: IR verification and validation
- **@gltfi/conformance**: Conformance test suite
- **@gltfi/cli**: Command-line interface
- **@gltfi/viewer**: WebGPU viewer (private)

## License

MIT
