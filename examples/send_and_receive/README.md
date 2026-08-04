# event/send_and_receive

A custom event carrying typed parameters (int/bool/float), sent with `event/send` and received with `event/receive` in the same graph, including default-value fallbacks.

This directory holds the SAME KHR_interactivity behavior graph in six representations: `graph.json` (the raw glTF extension node graph, decompiled straight out of the official Khronos `event/send_and_receive` conformance asset), and `behavior.ts` / `behavior.lua` / `behavior.py` / `behavior.cs` / `behavior.gd` — what the repo's emitters produce from that graph in each supported scripting language. All six are behaviorally equivalent, and each script round-trips back to an equivalent graph (see the repo root README's Examples section, and `examples/README.md`, for details). Regenerate with `pnpm gen:examples`; do not hand-edit these files.
