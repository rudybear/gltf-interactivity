# flow/doN

A counted loop: `flow/doN` fires its `[out]` flow N times, tracks the running iteration count, and exposes a `[reset]` flow that rewinds the counter.

This directory holds the SAME KHR_interactivity behavior graph in six representations: `graph.json` (the raw glTF extension node graph, decompiled straight out of the official Khronos `flow/doN` conformance asset), and `behavior.ts` / `behavior.lua` / `behavior.py` / `behavior.cs` / `behavior.gd` — what the repo's emitters produce from that graph in each supported scripting language. All six are behaviorally equivalent, and each script round-trips back to an equivalent graph (see the repo root README's Examples section, and `examples/README.md`, for details). Regenerate with `pnpm gen:examples`; do not hand-edit these files.
