# @gltfi/runtime-lib

Dependency-free runtime for compiled `KHR_interactivity` behavior scripts, as produced by `gltfi decompile` / `gltfi extract` from [`gltf-interactivity`](https://www.npmjs.com/package/gltf-interactivity). Zero dependencies, ESM, side-effect free (tree-shakable), works in Node and browsers.

```ts
import { createEngine, m } from "@gltfi/runtime-lib";

// behavior.ts, as emitted by `gltfi decompile asset.glb`
export default createEngine((rt) => {
  const V = rt.vars({ counter: rt.int(0) });
  rt.onStart(() => {
    V.counter = (V.counter + 1) | 0;
    rt.log("counter is {0}", [V.counter]);
  });
});
```

Host side:

```ts
import behavior from "./behavior.js";

const engine = behavior({
  gltf,                       // optional: parsed glTF JSON (needed for pointer/animation ops)
  glbBin,                     // optional: GLB BIN chunk (enables animation sampling)
  seed: 123,                  // optional: math/random seed
  onPointerSet: (pointer, value) => { /* mirror writes into your scene */ }
});

engine.start();               // fires event/onStart handlers
engine.advance(1 / 60);       // advance time by dt seconds (ticks, delays, interpolations, animations)
```

The engine also exposes `getVariableByIndex`, `sentEvents`, `time`, and `fireSelect` / `fireHoverIn` / `fireHoverOut` for node selectability/hoverability.

In a browser, map the specifier with an import map: `{ "imports": { "@gltfi/runtime-lib": "/node_modules/@gltfi/runtime-lib/dist/index.js" } }`.

## License

MIT
