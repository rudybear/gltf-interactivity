# pointer/set_and_get

Object-model pointer read/write: sets and reads back a light's color/intensity/range/cone angles and a material's alphaCutoff/emissiveFactor/texture scale through `pointer/set` and `pointer/get`.

This directory holds the SAME KHR_interactivity behavior graph in four representations: `graph.json` (the raw glTF extension node graph, decompiled straight out of the official Khronos `pointer/set_and_get` conformance asset), and `behavior.ts` / `behavior.lua` / `behavior.py` — what `gltfi decompile` produces from that graph in each supported scripting language. All four are behaviorally equivalent, and any of the three scripts round-trips back to an equivalent graph via `gltfi compile` (see the repo root README's Examples section, and `examples/README.md`, for details). Regenerate with `pnpm gen:examples`; do not hand-edit these files.
