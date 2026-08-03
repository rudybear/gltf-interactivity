# Examples

These are generated from the official Khronos `glTF-Test-Assets-Interactivity` conformance corpus by `pnpm gen:examples` (see `scripts/gen-examples.mjs`) — nothing here is hand-written. For each test case, the four files in its directory are the **same** `KHR_interactivity` behavior graph, just in different clothes:

- `graph.json` — the raw glTF extension node graph (`extensions.KHR_interactivity`), taken straight from the corpus asset.
- `behavior.ts`, `behavior.lua`, `behavior.py` — that same graph decompiled into TypeScript, Luau, and typed Python by `@gltfi/emit-ts`, `@gltfi/emit-lua`, and `@gltfi/emit-py` respectively — exactly what `gltfi decompile` writes for each language.

All four representations are behaviorally equivalent, and any of the three scripts round-trips back to an equivalent graph with `gltfi compile`:

```bash
gltfi compile examples/doN/behavior.ts -o /tmp/doN.gltf
```

Regenerate everything with `pnpm gen:examples`. The output is deterministic (no timestamps, no non-graph-derived randomness) — running it twice in a row produces zero diff, so it's safe to run any time the corpus checkout or emitters change.

## Index

| Example | Test | What it exercises |
|---|---|---|
| [`doN/`](doN/) | `flow/doN` | A counted loop: fires its `[out]` flow N times, tracks the running iteration count, exposes a `[reset]` flow. |
| [`setDelay_and_cancelDelay/`](setDelay_and_cancelDelay/) | `flow/setDelay_and_cancelDelay` | Schedules a delayed flow via a resolvable delay-ref pointer, then cancels it before it fires. |
| [`multiGate/`](multiGate/) | `flow/multiGate` | Fans one input flow out to a set of output flows, each firing exactly once, with a reset. |
| [`random/`](random/) | `math/random` | Pseudo-random floats and their distribution across repeated runs, including a Monte-Carlo π estimate. |
| [`cross/`](cross/) | `math/cross` | 3D vector cross product, cross-checked against dot/length/normalize. |
| [`interpolate/`](interpolate/) | `variable/interpolate` | Eases a variable toward a target value over a duration, with NaN/negative-duration error flows. |
| [`set_and_get/`](set_and_get/) | `pointer/set_and_get` | Object-model pointer read/write on a light and a material through `pointer/set`/`pointer/get`. |
| [`send_and_receive/`](send_and_receive/) | `event/send_and_receive` | A custom event carrying typed parameters, sent and received in the same graph. |
| [`start/`](start/) | `animation/start` | Plays an AnimationClip, sampling node position mid-clip and at completion, plus argument-validation error flows. |

## A closer look: the `doN` counter loop, in all three languages

`flow/doN` fires its output flow a fixed number of times and reports how many times it actually ran. Here's the same loop body — increment a variable each time `doN` fires — as emitted by each backend (excerpted from `doN/behavior.{ts,lua,py}`; each file has three of these, one per `doN` node in the test):

**TypeScript** (`behavior.ts`):

```ts
function proc49() {
  if (rt.doN(doN2, 2)) {
    V.counter2 = (V.counter2 + 1) | 0;
  }
}
```

**Lua** (`behavior.lua`):

```lua
proc49 = function()
  if rt.doN(doN2, 2.0) then
    V.counter2 = m.addInt(V.counter2, 1.0)
  end
end
```

**Python** (`behavior.py`):

```python
def proc49() -> None:
    if rt.do_n(S.doN2, 2):
        V.counter2 = m.addInt(V.counter2, 1)
```

Same graph, same node, same semantics — `rt.doN(state, 2)` returns true (and advances the internal counter) exactly twice before returning false, so `counter2` ends up at `2`. The surface differences are exactly what you'd expect from each language: TypeScript's `+ 1) | 0` int-truncation idiom vs. an explicit `m.addInt` helper in Lua/Python (Lua/Python don't have a native int-truncating `+`), and each language's own state-object/module-attribute access style (`doN2` upvalue vs. `S.doN2` namespace attribute vs. TS closure variable).
