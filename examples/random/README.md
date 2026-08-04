# math/random

`math/random` draws pseudo-random floats and checks their distribution across repeated flow-graph runs, including a Monte-Carlo estimate of π.

This directory holds the SAME KHR_interactivity behavior graph in six representations: `graph.json` (the raw glTF extension node graph, decompiled straight out of the official Khronos `math/random` conformance asset), and `behavior.ts` / `behavior.lua` / `behavior.py` / `behavior.cs` / `behavior.gd` — what the repo's emitters produce from that graph in each supported scripting language. All six are behaviorally equivalent, and each script round-trips back to an equivalent graph (see the repo root README's Examples section, and `examples/README.md`, for details). Regenerate with `pnpm gen:examples`; do not hand-edit these files.
