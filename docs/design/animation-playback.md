# Animation playback under KHR_interactivity

How the `animation/start`, `animation/stop` and `animation/stopAt` operations
work per the KHR_interactivity specification, how this repo implements them,
and the one integration rule every host/renderer has to follow: **when a
behavior graph is present, the graph owns every animation clip — nothing else
may play them.**

Spec references are to the Khronos `KHR_interactivity` specification
(`extensions/2.0/Khronos/KHR_interactivity/Specification.adoc`, CC-BY-4.0);
quoted passages are verbatim from it. Implementation references are to this
repo.

---

## 1. The rule: no autoplay

> When a glTF asset contains a behavior graph, all glTF animations are assumed
> to be controlled by the graph so they **MUST NOT** play automatically.
> — *General Concepts*

Plain glTF viewers commonly autoplay `animations[0]` (or every clip) on load.
As soon as an asset carries `extensions.KHR_interactivity`, that behavior is
forbidden. Clips only move when the graph starts them, and only for as long as
the graph says.

**Why it matters for integrators.** This runtime does not hand a clip to the
host's animation system. It samples the clip's accessors itself
(`packages/kernel/src/animation.ts`) and, on every time advance, writes the
sampled values as ordinary object-model pointer writes:
`/nodes/{n}/translation`, `/rotation`, `/scale`, `/weights`. A host that *also*
drives the same clip with its own player — a three.js `AnimationMixer`, a
viewer's default-clip autoplay, an engine's animation component — writes the
same node transforms every frame and the two fight. The symptom is motion that
stutters, snaps or desyncs, and `pointer/get` reads that return whichever writer
won last.

Where the repo enforces this today:

| Place | Guard |
| --- | --- |
| `apps/viewer/src/main.ts` (~line 350) | Autoplays the document's default clip only when no interactivity engine host is attached. |
| `gltf-interactivity-three` adapter | Never creates an `AnimationMixer`; its README calls this out on the WhackAMole model (21 graph-driven clips). |
| `gltf-studio` render engine | No mixer; play mode consumes the runtime's pointer writes only. |

If you build a new host: route every clip through the runtime's pointer
writes and disable your own clip playback for any asset that carries a
behavior graph. There is no partial mode.

---

## 2. The infinite virtual timeline

Core glTF defines a clip only over its keyframe range. KHR_interactivity
extends that so any timestamp on an unbounded timeline maps to a defined
position inside the clip data.

> 1. Let *T* be the maximum value of all animation sampler input accessors of
>    the animation. Then, the stored animation data defines the animated
>    property values for all *effective input timestamps* in the [0, T] range.
> 2. Let *r* be a scalar value on a timeline infinite in both directions, from
>    negative infinity to positive infinity.
> 3. If *T* is not equal to zero, let *s* be the current iteration number:
>    *s* = ⌈(r − T) / T⌉ if r > 0, ⌊r / T⌋ if r ≤ 0.
> 4. The corresponding *effective input timestamp* is
>    *t* = r − s·T if T ≠ 0, otherwise 0.
> — *Animation Control Operations → Animation Start*

Two vocabulary terms follow from this and show up everywhere below:

- **requested timestamp `r`** — where the graph says the clip is, on the
  infinite timeline. Exposed as the `virtualPlayhead` pointer.
- **effective timestamp `t`** — where inside `[0, T]` the data is actually
  sampled. Exposed as the `playhead` pointer.

Worked examples with a 2-second clip (`T = 2`):

| `r` | `s` | `t` | Meaning |
| --- | --- | --- | --- |
| 0.5 | 0 | 0.5 | first pass |
| 2.0 | 0 | 2.0 | end of first pass — `t` reaches `T` exactly, never wraps to 0 early |
| 2.5 | 1 | 0.5 | second pass has begun |
| 4.0 | 1 | 2.0 | end of second pass |
| −0.5 | −1 | 1.5 | half a second "before zero" is 1.5 s into the clip (reverse wrap) |
| −2.0 | −1 | 0.0 | one full pass backward |

Note the asymmetry in the ceiling/floor split: for `r > 0` the mapping is
half-open on the *left* (`(0, T]`), so the last frame of a forward pass lands
on `t = T`; for `r ≤ 0` it is half-open on the *right* (`[0, T)`). This is
what lets a forward `endTime = T` play the final keyframe and a reverse
`endTime = 0` play the first one.

The implementation is `effectiveAnimationTime(requested, maxTime)` in
`packages/kernel/src/animation.ts`, used by every backend. `T` comes from
`getAnimationTimeRange`, which follows the spec's rule of reading the `max` of
the input accessors of *used* samplers only.

**Consequences the spec spells out as authoring tips:**

- Read `/animations/{n}/extensions/KHR_interactivity/maxTime` to get `T`
  at runtime and pass it as `endTime` to play to completion without knowing
  the duration statically.
- `endTime = +Infinity` loops forever forward. `endTime = −Infinity` loops
  forever in reverse. There is no separate "loop" flag; looping *is* an
  unbounded end time on the virtual timeline.
- `startTime > endTime` plays backward. Speed is always positive; direction
  comes from the order of the two times.

---

## 3. The animation state table

Playback is not stored in the `animation/start` node. The spec defines one
graph-wide *animation state dynamic array*; each entry holds:

- the animation reference
- start time, end time, **stop time**, speed
- an *entry creation* timestamp (system time when the entry was added)
- an *end completion* pointer — the `done` flow of the `animation/start`
  node that created the entry
- a *stop completion* pointer — the `done` flow of whichever
  `animation/stopAt` node last scheduled a stop (initially null)

There is at most one entry per animation, and that single fact drives most of
the "surprising" semantics below. The maximum table size is
implementation-specific; this runtime advertises it as
`/extensions/KHR_interactivity/maxActiveAnimations` = 32
(`packages/runtime/src/interpreter.ts`, `packages/runtime-lib/src/pointer.ts`).

This runtime's table lives in the shared kernel scheduler
(`packages/kernel/src/scheduler.ts`, `startAnimation` / `stopAnimation` /
`stopAnimationAt`) and is advanced as **phase 1** of every time step, before
pointer interpolations, variable interpolations, delays and tick handlers.

---

## 4. `animation/start`

Sockets: input flow `in`; input values `ref animation`, `float startTime`,
`float endTime`, `float speed`; output flows `out`, `err`, `done`.

When `in` fires, in order:

1. Evaluate all inputs.
2. `animation` is not a valid glTF animation reference → `err`, stop.
3. `startTime` or `endTime` is NaN, or `startTime` is ±Infinity → `err`, stop.
   (An *infinite end time* is allowed; that is how looping works.)
4. `speed` is NaN, infinite, or ≤ 0 → `err`, stop. Negative speed is an
   error, not reverse playback.
5. Table full, or the clip is invalid as determined by the implementation →
   `err`, stop.
6. **If the table already has an entry for this animation, remove it. The
   previously set `done` flows MUST NOT be activated.** Restarting a clip is
   silent: neither the old entry's end-completion nor its stop-completion
   `done` ever fires.
7. Add a new entry. Stop time is initialised **equal to end time** and the
   stop-completion pointer to null.
8. Activate `out`.

So `out` fires synchronously on the same activation, and `done` fires later —
possibly never, if the clip loops or is stopped or restarted first.

**Per-update advance** (spec's "on each asset animation update", the
scheduler's phase 1), for each entry:

1. `startTime == endTime` → sample at `startTime`, remove the entry, fire the
   end-completion `done`. A zero-length play is a one-shot pose and
   completes on the first update.
2. `elapsed = max(0, now − entryCreation)`.
3. `scaled = elapsed × speed`, negated when `startTime > endTime`.
4. `current = startTime + scaled`.
5. **Stop check.** Forward: `current ≥ stopTime` *and* `startTime ≤ stopTime < endTime`.
   Reverse: `current ≤ stopTime` *and* `endTime < stopTime ≤ startTime`.
   If hit → sample at `stopTime` exactly, remove the entry, fire the
   **stop-completion** `done` (the `stopAt` node's), skip the rest.
6. **End check.** Forward: `current ≥ endTime`. Reverse: `current ≤ endTime`.
   If hit → sample at `endTime` exactly, remove the entry, fire the
   **end-completion** `done` (the `start` node's).
7. Otherwise sample at `current` and keep the entry.

Points worth noticing:

- The clip is sampled at the *exact* stop or end time on the frame the
  boundary is crossed, never overshooting. The conformance test
  `animation/start` asserts the node position at 100% for exactly this
  reason.
- Because stop time starts equal to end time and the stop check requires
  `stopTime < endTime` (strictly), a fresh entry can only ever finish via the
  end check. A later `stopAt` with a time outside `[startTime, endTime)`
  simply never triggers; the clip runs to its end and the *start* node's
  `done` fires.
- Playback position is `startTime + (now − entryCreation) × speed`, i.e.
  derived from the scheduler clock at each update rather than accumulated
  per-frame. In this repo "now" is the kernel scheduler's own time, advanced
  only by `advance(delta)`, so pausing a host simply stops advancing it and
  the clip freezes in place (this is how gltf-studio's play-mode pause
  works); the spec itself has no pause operation.
- Done flows are collected during the pass and fired *after* the whole table
  has been advanced (`scheduler.ts` "collect-then-fire"), so a `done` handler
  that immediately restarts the same clip cannot corrupt the current pass.

**Overlapping writers.** The spec is explicit that two active animations
targeting the same property make it *undefined* until only one remains:

> If two or more active animations target the same glTF property, it becomes
> undefined and remains undefined as long as the number of active animations
> affecting it is greater than one.

A `pointer/set` on that property makes it well-defined again until the next
animation update. This is the same conflict as §1, just between two clips
instead of a clip and an external mixer.

---

## 5. `animation/stop`

Sockets: input flow `in`; input value `ref animation`; output flows `out`,
`err`. There is no `done`.

1. Evaluate inputs.
2. Invalid reference → `err`, stop.
3. If the table has an entry for this animation, remove it. **The animated
   properties MUST keep their current values and the previously associated
   `done` flows MUST NOT be activated.**
4. Activate `out`.

So a stop is immediate, leaves the pose wherever the last update put it
(conformance test `animation/stop`: "position frozen at ~50%", "start `done`
not fired"), and is idempotent — stopping a clip that is not playing is not an
error.

---

## 6. `animation/stopAt`

Sockets: input flow `in`; input values `ref animation`, `float stopTime`;
output flows `out`, `err`, `done`.

1. Evaluate inputs.
2. Invalid reference → `err`, stop.
3. `stopTime` is NaN → `err`, stop. (Infinite stop times are accepted; they
   just never satisfy the stop check.)
4. If the table has an entry for this animation, overwrite its
   stop-completion pointer with *this* node's `done` and its stop time with
   `stopTime`.
5. Activate `out`.

Notes:

- `stopAt` on a clip that is not playing still fires `out` (not `err`) and
  does nothing else. Its `done` will never fire.
- Each `stopAt` *replaces* the previous one. Only the most recent `stopAt`
  node's `done` can fire; an earlier `stopAt`'s `done` is silently dropped.
- `stopTime` is on the virtual timeline, like `startTime`/`endTime`. To stop
  a looping clip on its third pass at 0.5 s, use `2·T + 0.5`.
- When the stop hits, it is the *stop* node's `done` that fires, not the
  `start` node's (conformance test `animation/stopAt`: "start `done` not
  fired").

---

## 7. Runtime-readable animation state

Five read-only virtual properties per animation
(`/animations/{n}/extensions/KHR_interactivity/…`):

| Pointer | Type | Meaning |
| --- | --- | --- |
| `isPlaying` | bool | true while the table has an entry for the clip |
| `minTime` | float | first keyframe timestamp — `min` of used sampler input accessors |
| `maxTime` | float | last keyframe timestamp `T` — `max` of used sampler input accessors |
| `playhead` | float | last *effective* timestamp `t`; always within `[0, maxTime]` |
| `virtualPlayhead` | float | last *requested* timestamp `r` on the infinite timeline |

Spec rules that apply: unused samplers are ignored for `minTime`/`maxTime`;
an invalid animation returns NaN for all four floats; before the first start
both playheads read 0; after a stop they retain their last value until the
clip is restarted.

The spec's authoring tip for `minTime`: core glTF snaps to the first keyframe
for timestamps between 0 and the first keyframe, so a clip whose data starts
at, say, 0.4 s has a 0.4 s "dead" lead-in. Starting from `minTime` skips it.

Implemented in `resolveVirtualPointer` (`packages/runtime/src/interpreter.ts`)
and its compiled-engine twin in `packages/runtime-lib/src/pointer.ts`; the
pointer families are registered in `packages/kernel/src/pointer-path.ts`.

---

## 8. What this repo does not do (fidelity gaps, not spec disagreements)

These are limits of the sampling code in `packages/kernel/src/animation.ts`
and its Lua/Python/C#/GDScript transcriptions. They pass the official
conformance corpus, which only exercises float32 LINEAR/STEP data, but they are
not full glTF animation support:

- **Only tightly packed float32 accessors** (`componentType 5126`, no
  `byteStride`) are decoded. Any other accessor makes the channel silently
  skip; the playhead and `done` flows still advance as if it had played.
- **CUBICSPLINE is degraded to LINEAR.** The sampler's in/out tangents are
  ignored; the middle (value) element of each keyframe triple is linearly
  interpolated. Rotations use slerp, other paths lerp, STEP holds.
- **No sparse accessors, no normalized integer quantisation**, no
  `KHR_animation_pointer` channels — only the core `translation` /
  `rotation` / `scale` / `weights` targets.
- **Without a GLB binary chunk** (`glbBin: null`), no channel is written at
  all. Timeline bookkeeping, `isPlaying`, both playheads and `done` flows all
  still behave correctly, so graphs can be executed for logic even when the
  geometry is not loaded.
- Overlapping active clips on one property are written last-wins in channel
  order, which is a valid choice under the spec's "undefined" rule but not a
  blend.

---

## 9. Quick reference

```
start(anim, s, e, v)   err if: bad ref | s,e NaN | s = ±Inf | v NaN/Inf/≤0 | table full
                       replaces any existing entry silently (old done flows never fire)
                       stopTime := e, stopDone := null
                       out fires now; done fires when current reaches e
stop(anim)             err if bad ref; removes entry; pose frozen; no done ever
stopAt(anim, x)        err if bad ref | x NaN; sets stopTime := x, stopDone := this
                       done fires when current reaches x, only if s ≤ x < e (fwd) / e < x ≤ s (rev)
timeline               t = r − s·T,  s = ⌈(r−T)/T⌉ (r>0) | ⌊r/T⌋ (r≤0);  T = maxTime
loop forward           e = +Infinity        loop reverse   e = −Infinity
play backward          s > e (speed stays positive)
host rule              graph present ⇒ never autoplay, never run your own mixer on these clips
```

---

## 10. Gaps in the specification itself

Independent of this runtime. Each item is something the spec text leaves
undefined, defines inconsistently, or defines in a way that hurts portable
content. Section names refer to the Khronos `Specification.adoc`.

**Clock and timing**

1. **"Asset animation update" is never placed in time.** The advance
   procedure runs "on each asset animation update", but nothing says where
   that falls relative to `event/onTick`, `pointer/interpolate` updates,
   delay expiry, or rendering. A `pointer/set` in a tick handler and the
   animation write for the same property in the same frame have no defined
   winner. The example text ("a `pointer/set` … would make it well-defined
   until the next animation update") assumes a distinct update point without
   defining it. Runtimes pick an order; graphs cannot rely on one. (This
   repo: animations first, then pointer/variable interpolations, delays,
   tick.)
2. **Playback runs on "system time", not graph time.** Elapsed time is the
   difference between an entry's creation timestamp and "the current system
   time". `event/onTick` exposes `timeSinceStart`/`timeSinceLastTick`, a
   separate clock. Nothing ties the two together, so a host that pauses,
   throttles, or time-scales the graph has no spec-sanctioned way to pause
   clips: on wall-clock semantics a resumed clip jumps ahead. The spec also
   says the procedure "assumes that the current system time is not behind"
   the creation timestamp, and leaves clock regression undefined.
3. **Done flows are activated inline while iterating the state array.** The
   procedure removes the entry and activates `done` inside the "for each
   entry" loop. A `done` handler may start or stop other clips, mutating the
   array mid-iteration. Iteration order is also unspecified. Both the order
   in which several `done` flows fire in one update and whether a newly
   started clip is advanced in the same update are therefore undefined.
   (This repo collects and fires after the pass.)

**Conflicts and blending**

4. **Two clips on one property make it "undefined".** No priority, no
   last-started-wins, no blending. Crossfades and additive layers, the bread
   and butter of character animation, are impossible to express portably.
   The only safe content is clips with disjoint channel sets.
5. **Animation versus `pointer/interpolate` is not addressed at all.** The
   spec defines that `pointer/set` kills an in-flight interpolation on the
   same property, but says nothing about an animation channel and a
   `pointer/interpolate` targeting the same property, in either direction.
6. **No interface to the host's animation system.** "Apply the glTF
   animation state at timestamp *t* to the asset" is the whole definition.
   Combined with the no-autoplay rule, the practical consequence is that a
   runtime has to sample clips itself and every host must disable its own
   player for these clips. Nothing in the spec says this; every integrator
   discovers it (§1 of this document).
7. **`KHR_animation_pointer` channels are never mentioned.** Whether a clip
   animating, say, a material factor through that extension participates in
   the state table, the playheads, or the "undefined when overlapping" rule
   is unstated.

**Definitional inconsistencies**

8. **`T` and `maxTime` are defined differently.** The timeline mapping
   defines `T` as "the maximum value of all animation sampler input
   accessors of the animation". The `maxTime` property "MUST be derived from
   … the used sampler input accessors. Unused animation samplers … MUST be
   ignored." For a clip carrying an unreferenced sampler that is longer than
   the used ones, the wrap period and `maxTime` disagree, and the authoring
   tip "set `endTime` to `maxTime` to play to completion" is wrong.
9. **The timeline starts at 0, not at `minTime`.** The effective range is
   `[0, T]`, so a clip whose first keyframe sits at 0.4 s carries a 0.4 s
   hold at the start of *every* loop iteration when `endTime = +Infinity`.
   The spec acknowledges the lead-in with a tip about `minTime`, but offers
   no way to loop `[minTime, maxTime]` with a single `start`.
10. **"Invalid as determined by the implementation" gates `err`.** Step 5 of
    `animation/start` lets each runtime decide what an invalid clip is. The
    same asset can succeed on one runtime and route to `err` on another.
11. **`maxActiveAnimations` has no required minimum.** A runtime advertising
    1 is conformant. Content with many simultaneous clips (the WhackAMole
    showcase model uses 21) has no guarantee and no fallback beyond `err`.

**Control surface holes**

12. **No pause, resume, seek, or speed change.** The only mutation of a
    running clip is `stopAt`. Changing speed means restart, which resets the
    creation timestamp and silently drops the pending `done`. Resuming
    "from where it was" requires reading `virtualPlayhead` (the *last
    update's* position, not the current one) and restarting from it, losing
    up to a frame.
13. **`stopAt` edge cases are legal but surprising.** A `stopTime` equal to
    `endTime` never satisfies the strict `stopTime < endTime` check, so the
    *start* node's `done` fires, not the `stopAt` node's. A `stopTime`
    already passed satisfies `current ≥ stopTime` on the next update and
    rewinds the pose backward to `stopTime` before firing. A `stopTime` before
    `startTime` is silently ignored, with `out` still firing. None of these
    routes to `err`.
14. **Silent no-ops everywhere.** `stop` and `stopAt` on a clip that is not
    playing fire `out`; a restart drops the old `done` flows with no
    notification. There is no "cancelled" signal for any of them; the only
    way to know is to poll `isPlaying`.

**Portability**

15. **The no-autoplay rule is keyed on the presence of a graph, not on
    animation usage.** An asset with an empty graph, or a graph that never
    touches animations, still forbids autoplay. And an asset that lists the
    extension in `extensionsUsed` but not `extensionsRequired` autoplays in a
    viewer that ignores the extension and stays still in one that honors it.
    The same file shows different content depending on viewer support.
16. **The initial pose is not stated.** "MUST NOT play automatically" does
    not say whether the displayed rest pose is the nodes' static TRS or frame
    0 of some clip; viewers commonly differ on exactly this.
