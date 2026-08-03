# glTF Interactivity ↔ Script

A bidirectional transpiler between glTF KHR_interactivity behavior graphs and constrained scripting-language subsets (TypeScript first, then Luau and typed Python), with a spec-conformant interpreter, a compiled-code engine, and a WebGPU viewer. Everything gated on the official Khronos test suite (KhronosGroup/glTF-Test-Assets-Interactivity).

## Status

Early bootstrap. Conformance gates:

| Gate | V1 Interpreter | V2 Compiled | V3 Roundtrip |
|------|---|---|---|
| Status | Pending | Pending | Pending |

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
