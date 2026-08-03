# Op registry design (@gltfi/kernel/src/registry.ts)

The registry is the single machine-readable description of every KHR_interactivity operation.
Consumers: IR validation (`@gltfi/ir`), overload resolution in both transpiler directions,
emit/parse socket naming, and the graph validator (`@gltfi/verify`). The interpreter may
assert against it but keeps its own dispatch.

## Schema

```ts
type TypeSig = "bool"|"int"|"float"|"float2"|"float3"|"float4"|"float2x2"|"float3x3"|"float4x4"|"ref"|"custom";
// Generic placeholders used in overload rows:
//   F  = float | float2 | float3 | float4 | float2x2 | float3x3 | float4x4  (component-wise float family)
//   V  = float2 | float3 | float4                                            (vectors)
//   M  = float2x2 | float3x3 | float4x4                                      (matrices)
//   T  = any value type (incl. ref/custom)
// All generic sockets of one node must resolve to the SAME concrete type.

interface OpSpec {
  op: string;                            // e.g. "math/add"
  category: "math"|"type"|"ref"|"flow"|"variable"|"pointer"|"animation"|"event"|"debug";
  overloads: Array<{                     // one row per distinct signature
    inputs:  Array<{ name: string; type: TypeSig | Generic }>;
    outputs: Array<{ name: string; type: TypeSig | Generic }>;
  }>;
  // Sockets whose existence/names derive from configuration (switch cases, variable ids,
  // pointer template params, event payload, waitAll count, log message params):
  configSockets?: "switchCases"|"variableSet"|"pointerTemplate"|"eventPayload"|"waitAllFlows"|"logMessage";
  config?: Array<{ name: string; type: "bool"|"int"|"int[]"|"string";
                   required: boolean;    // ops with NO default config (variable/*, pointer/*,
                                         // event/send, event/receive): invalid config ⇒ graph rejected;
                                         // otherwise invalid config ⇒ fall back to default
                   default?: unknown }>;
  inputFlows?: string[];                 // e.g. ["in","reset"], ["in","cancel"]; waitAll: dynamic "0".."N-1"+["reset"]
  outputFlows?: string[];                // e.g. ["out"], ["out","err","done"], switch: dynamic cases+["default"]
  schedule?: Record<string, "once"|"perIteration"|"perCheck">;  // non-default input eval schedules
                                         // (flow/for: startIndex once, endIndex perIteration;
                                         //  flow/while: condition perCheck)
  purity: "pureClosed"                   // output depends only on inputs (CSE-safe globally)
        | "readsState"                   // reads variables/pointers/node state (site-local CSE only)
        | "volatile"                     // math/random (never merge across sites)
        | "flow";                        // has flow sockets (not a value op)
  stateKind?: "doN"|"multiGate"|"waitAll"|"throttle"|"for"|"delay";
  extension?: string;                    // KHR_node_selectability / KHR_node_hoverability events
}
```

## Catalog (from Specification.adoc; ~113 core op names + 3 extension events)

Counts per category and required op names. Signature details for each op are transcribed
from the interpreter's dispatch (`packages/runtime/src/interpreter.ts`) which is
conformance-tested; on any doubt the interpreter's behavior wins over this doc.

- **math constants (5)**: E, Pi, Tau, Inf, NaN — `() → float value`.
- **math float arith (19, component-wise on F, NaN-propagating)**: abs, sign, trunc, floor,
  ceil, round, fract, neg, add, sub, mul, div, rem, min, max, clamp, saturate, mix
  (socket names a/b/c), smoothStep. abs/sign/neg/add/sub/mul/div/rem/min/max/clamp also
  have **int overloads**; int div truncates toward zero, div/rem by 0 → 0, wrap on overflow.
- **math comparison (5)**: eq (bool/int/F incl. matrices, per-component AND → bool),
  lt/le/gt/ge (scalar float AND scalar int overloads only) → bool. NaN ⇒ false.
- **math special (5)**: isNaN, isInf (float→bool); select (bool condition, T a, T b → T);
  switch (config int[] cases; int selection + T per-case + T default → T);
  random (() → float, **volatile**).
- **math trig (9)**: rad, deg, sin, cos, tan, asin, acos, atan (F→F component-wise), atan2 (a,b).
- **math hyperbolic (6)**: sinh, cosh, tanh, asinh, acosh, atanh.
- **math exp (7)**: pow (a,b), exp, log, log2, log10, sqrt, cbrt.
- **math vector (8)**: length (V→float), normalize (V→V), dot (V,V→float), cross (float3),
  rotate2D (float2,float→float2), rotate3D (float3,float4→float3), transform (V by matching M),
  slerp (V,V,float→V).
- **math matrix (6)**: transpose (M→M), determinant (M→float), inverse (M→M),
  matMul (M,M→M), matCompose (float3 translation, float4 rotation, float3 scale → float4x4),
  matDecompose (float4x4 → translation/rotation/scale).
- **math quaternion (9)**: quatConjugate, quatMul, quatAngleBetween (→float),
  quatFromAxisAngle (float3,float→float4), quatToAxisAngle (float4→axis float3 + angle float),
  quatFromDirections (float3,float3→float4), quatFromUpForward, quatFromAngles, quatSlerp.
- **math int bitwise (9)**: not/and/or/xor (int overloads shared with bool overloads),
  asr (a,b), lsl (a,b), clz, ctz, popcnt. **ctz(0) = 32; popcnt counts over the 32-bit
  two's-complement pattern (unsigned loop)** — spec-tested edge cases.
- **math bool (5)**: eq, not, and, or, xor (bool overloads).
- **math color (2)**: rgbToOkLCh, rgbFromOkLCh (float3↔float3).
- **ref (1)**: ref/eq (ref,ref→bool).
- **type (6)**: boolToInt, boolToFloat, intToBool, intToFloat, floatToBool
  (false iff NaN or ±0), floatToInt (0 for NaN/±Inf, else truncate + wrap to int32 = `a|0`).
- **flow (11)**: sequence (dynamic ordered out sockets, UTF-16 sort), branch (condition;
  true/false), switch (config cases; selection), while (condition perCheck; loopBody/completed),
  for (config initialIndex; startIndex once/endIndex perIteration; loopBody/completed;
  out value int index; stateKind for), doN (in/reset; int n; out; int currentCount),
  multiGate (config isRandom,isLoop; in/reset; dynamic outs; int lastIndex),
  waitAll (config int inputFlows ≤64; flows "0".."N-1"+reset; out/completed; int remainingInputs),
  throttle (in/reset; float duration; out/err; float lastRemainingTime),
  setDelay (in/cancel; float duration; out/err/done; ref lastDelay; stateKind delay),
  cancelDelay (in; ref delay; out).
- **variable (3)**: get (config int variable; → T value), set (config int[] variables;
  one input socket per variable named by decimal index; in/out),
  interpolate (config int variable, bool useSlerp; T value, float duration, float2 p1/p2;
  in/out/err/done; T must not be bool/int; useSlerp only float4).
- **pointer (3)**: get (config string pointer, int type; template params int `[seg]` /
  ref `{seg}` as input sockets; → T value, bool isValid), set (+ T value input; in/out/err),
  interpolate (+ float duration, float2 p1/p2; in/out/err/done; T not bool/int).
- **animation (3)**: start (ref animation, float startTime/endTime/speed; in/out/err/done),
  stop (ref animation; in/out/err), stopAt (ref animation, float stopTime; in/out/err/done).
- **event (5)**: onStart (out; ref event), onTick (out; float timeSinceStart,
  float timeSinceLastTick, ref event), receive (config int event; out; payload sockets + ref event),
  send (config int event; in/out; payload input sockets), stopPropagation (in; bool stopImmediate,
  ref event; out).
- **debug (1)**: log (config int severity, string message with `{param}` placeholders → typed
  input sockets; in/out).
- **extension events (3)**: event/onSelect (KHR_node_selectability; config int nodeIndex,
  bool stopPropagation; out; ref selectedNode, int controllerIndex, float3 selectionPoint,
  float3 selectionRayOrigin, ref event), event/onHoverIn / event/onHoverOut
  (KHR_node_hoverability; config int nodeIndex; out; ref hoveredNode, int controllerIndex, ref event).

## Validation script

`packages/kernel/scripts/check-registry.mjs` (dev-only): cross-check that every `case "x/y":`
string in the interpreter's two dispatch switches has a registry entry and vice versa
(viewer-only pointer events exempted via allowlist). Run in CI alongside unit tests.
