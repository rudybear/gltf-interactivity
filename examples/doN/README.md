# flow/doN

A counted loop: `flow/doN` fires its `[out]` flow N times, tracks the running iteration count, and exposes a `[reset]` flow that rewinds the counter.

This directory holds the SAME KHR_interactivity behavior graph in four representations: `graph.json` (the raw glTF extension node graph, decompiled straight out of the official Khronos `flow/doN` conformance asset), and `behavior.ts` / `behavior.lua` / `behavior.py` — what `gltfi decompile` produces from that graph in each supported scripting language. All four are behaviorally equivalent, and any of the three scripts round-trips back to an equivalent graph via `gltfi compile` (see the repo root README's Examples section, and `examples/README.md`, for details). Regenerate with `pnpm gen:examples`; do not hand-edit these files.
