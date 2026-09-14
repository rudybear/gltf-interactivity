# KHR_interactivity — animation control: issues for Khronos

Feedback on the **Animation Control Operations** and **Animation State**
sections of the KHR_interactivity specification
(`extensions/2.0/Khronos/KHR_interactivity/Specification.adoc`,
KhronosGroup/glTF `main` @ `c18432787e6d`, read 2026-09-14). Quoted text is
verbatim. Each item is written to be filed as one issue: what the text says,
why it is a problem, a concrete case, and a proposed resolution. Ordered by
severity: textual defects first, then underspecification, then design gaps.

As of 2026-09-14 no open or closed issue in KhronosGroup/glTF or
KhronosGroup/glTF-Test-Assets-Interactivity covers any of these.

---

## A. Defects in the text

### A1. The wrap period *T* and the `maxTime` property are defined inconsistently

**Where.** *Animation Start*, timeline mapping step 1; *Animation State*,
`maxTime`.

**Text.** Step 1: "Let *T* be the maximum value of all animation sampler input
accessors of the animation." `maxTime`: "The values **MUST** be derived from
the `min` and `max` properties of the used sampler input accessors. Unused
animation samplers, i.e., samplers not referenced by the animation channels,
**MUST** be ignored."

**Problem.** For an animation that carries a sampler no channel references
(valid glTF; the validator only warns), the two definitions disagree whenever
the unused sampler's input runs longer than the used ones. The looping period
is then longer than `maxTime`, and the Authoring Tip "By setting the
`endTime` input value socket to that value, the graph can play the animation
to completion" no longer plays to completion: the clip holds its last keyframe
for the difference, and the effective-timestamp wrap happens at the wrong
point on every iteration.

**Example.** Channels reference sampler 0 (input max 2.0 s). Sampler 1 is
unreferenced (input max 5.0 s). `maxTime` = 2.0, *T* = 5.0. `start(0, +Inf)`
loops with period 5 s, holding for 3 s each cycle. `start(0, maxTime)` ends
at *t* = 2.0 as intended, but `playhead` is specified to be "less than or
equal to `maxTime`" while the mapping permits values up to 5.0.

**Proposed resolution.** Define *T* once, in terms of used samplers only, and
have both the mapping and `maxTime` reference that single definition. State
that *T* equals `maxTime`.

---

### A2. `done` flows are activated inside the state-array iteration

**Where.** *Animation Start*, "On each asset animation update, for each entry
in the *animation state dynamic array*", steps 1, 5 and 6.

**Text.** Each of those steps reads "remove the current animation state entry
from the array; activate the `done` output flow referenced by the … pointer;
skip the next steps." — inside the per-entry loop.

**Problem.** A `done` handler is ordinary graph code and may call
`animation/start`, `animation/stop` or `animation/stopAt` on other clips,
mutating the very array being iterated. The text does not say whether a clip
started from a `done` handler is advanced in the same update, whether a clip
stopped from one is still advanced, or in what order entries are visited.
Since iteration order also determines which of two overlapping writers lands
last, the observable pose can differ between conforming implementations.

**Example.** Clip A's `done` starts clip B. Some implementations sample B
at *t* = 0 in the same update (B was appended and the loop reached it),
others on the next update. Clip A's `done` stops clip C, which sits later in
the array: C either receives one more sample or none.

**Proposed resolution.** Specify collect-then-fire: advance every entry,
collect completed entries, then activate their `done` flows in entry-creation
order after the loop. State that entries added during `done` activation are
first advanced on the next update.

---

### A3. "Asset animation update" is not placed in the execution model

**Where.** *Animation Start*, "On each asset animation update". Also the
overlap example: "using a `pointer/set` operation on that property would make
it well-defined until the next animation update."

**Problem.** The specification defines when `event/onTick` fires, when
delays expire and when `pointer/interpolate` updates happen only relative to
each other through the tick model, but never says where the animation update
sits among them or relative to rendering. Whether a `pointer/set` issued
from an `event/onTick` handler is visible in the rendered frame, or is
overwritten by that frame's animation sample, is therefore undefined. The
example text presupposes a distinct "animation update" moment without
defining it.

**Example.** Clip animates `/nodes/0/translation`. An `event/onTick` handler
writes the same pointer. Implementation X updates animations before ticks:
the handler's value renders. Implementation Y updates after: the clip's value
renders. Both conform.

**Proposed resolution.** Add the animation update to the ordered list of
per-frame phases (proposed: animation update → property interpolations →
delays → `event/onTick`), and state that all writes in one update are visible
to the frame rendered after it.

---

### A4. Animation writes versus `pointer/interpolate` on the same property

**Where.** *Pointer Interpolate* (defines that `pointer/set` on an
interpolating property terminates the interpolation); *Animation Start*
(defines "undefined" only for two *animations* on one property).

**Problem.** No rule covers an animation channel and an in-flight
`pointer/interpolate` targeting the same property, in either order. The
`pointer/set` rule does not obviously extend, because an animation write is
not a `pointer/set` activation, and the animation "undefined" rule is scoped
to "two or more active animations".

**Example.** `pointer/interpolate` on `/nodes/0/translation` over 2 s; at
1 s the graph starts a clip animating the same node. Is the interpolation
terminated (and does its `done` fire)? Is the property undefined? Does the
last writer in the frame win?

**Proposed resolution.** Either extend the `pointer/set` termination rule to
animation writes (animation starting on a property terminates any
interpolation on it, and `pointer/interpolate` starting on an animated
property is an `err`), or extend the "undefined" rule to cover animation
plus interpolation.

---

## B. Underspecification

### B1. Playback is defined against "system time", disconnected from graph time

**Where.** *Animation Start*, state entry fields ("*entry creation* timestamp
value associated with the system time") and update step 2 ("the non-negative
difference between *entry creation* timestamp and the current system time;
this step assumes that the current system time is not behind the *entry
creation* timestamp").

**Problem.** `event/onTick` exposes `timeSinceStart` and
`timeSinceLastTick`, a graph-execution clock. Animations are defined against
a different, undefined "system time". Consequences: (a) a host that
suspends, throttles or time-scales graph execution has no conforming way to
suspend clips — on resume, a wall-clock reading jumps the clip ahead while
`timeSinceLastTick` reports the suspended interval or not, at the host's
discretion; (b) clip position and tick time can drift apart within one
graph; (c) behavior on clock regression is explicitly assumed away rather
than defined; (d) deterministic replay is impossible to specify.

**Proposed resolution.** Define animation time in terms of the same clock
that drives `timeSinceStart`, and state that whatever advances that clock
advances animations by the same amount. Define clock regression as clamping
elapsed time to zero (which is what "non-negative difference" already
implies) and say so explicitly.

---

### B2. `KHR_animation_pointer` channels are not addressed

**Where.** Entire animation section.

**Problem.** Animations whose channels target arbitrary object-model
properties through `KHR_animation_pointer` are valid glTF and increasingly
common. The specification never says whether such channels participate in
the animation state array, the `playhead`/`virtualPlayhead` properties, the
"undefined when overlapping" rule, or the `pointer/set`/`pointer/interpolate`
interaction rules — all of which are the same conflicts as A4 but now on
material and camera properties.

**Proposed resolution.** State that all channels of an animation, regardless
of target mechanism, are governed identically, and add
`KHR_animation_pointer` to the interaction rules resolved under A4.

---

### B3. "Invalid as determined by the implementation" gates the `err` flow

**Where.** *Animation Start*, activation step 5: "or if the referenced glTF
animation is invalid as determined by the implementation, activate the
`err` output flow".

**Problem.** Validity is left to each implementation. The same asset can take
the `out` path on one runtime and `err` on another, which contradicts the
section's otherwise fully deterministic error rules.

**Proposed resolution.** Define validity by reference to the core
specification ("invalid as defined in the core glTF 2.0 specification", the
phrase already used for `minTime`/`maxTime`), and reserve implementation
discretion for resource limits only (already covered by
`maxActiveAnimations`).

---

### B4. Rest pose when animations must not autoplay

**Where.** *Graphs*: "When a glTF asset contains a behavior graph, all glTF
animations are assumed to be controlled by the graph so they **MUST NOT**
play automatically."

**Problem.** The rule says clips do not play, but not what is displayed
before the graph starts one. Viewers differ: static node TRS, or the first
keyframe of the first animation. Both are defensible readings.

**Proposed resolution.** State that the initial pose is the nodes' own
`translation`/`rotation`/`scale`/`weights` (or `matrix`) as stored, and
that `playhead` = 0 does not imply a sampled frame.

---

### B5. Scope of the no-autoplay rule and mixed-support behavior

**Where.** *Graphs*, same sentence as B4.

**Problem.** (a) The rule keys on the presence of *a behavior graph*, not on
whether any graph references animations; an asset with an empty graph, or a
graph used only for selection highlighting, still forbids autoplay of clips
the author may have intended to play. (b) When `KHR_interactivity` is listed
in `extensionsUsed` but not `extensionsRequired`, a viewer without support
autoplays and a viewer with support does not; the same file presents
different content. The specification gives authors no guidance.

**Proposed resolution.** Either narrow the rule to assets where a graph
references at least one animation, or add an Implementation Note directing
authors of assets that depend on the rule to list the extension in
`extensionsRequired`, and stating the expected behavior for the optional case.

---

### B6. `animation/stopAt` boundary cases are silent

**Where.** *Animation Stop At*; *Animation Start* update step 5.

**Problem.** Three inputs that are almost certainly authoring mistakes route
to `out` and then behave unexpectedly:

- `stopTime` equal to `endTime`: the stop check requires *stop time* strictly
  less than *end time*, so it never fires; the clip ends through the end
  check and the `animation/start` node's `done` fires, not the `stopAt`
  node's.
- `stopTime` already passed: on the next update "*current timestamp* is
  greater than or equal to the *stop time*" holds, the pose is sampled at
  `stopTime`, i.e. rewound, and `done` fires.
- `stopTime` before `startTime` (forward) or after it (reverse): never
  fires; `out` still activates; no `done` ever.

**Proposed resolution.** Route a `stopTime` outside the half-open interval
between `startTime` and `endTime` to `err`, or state the three outcomes
explicitly as intended.

---

## C. Design gaps

### C1. Overlapping animations on one property are "undefined"

**Where.** *Animation Start*: "If two or more active animations target the
same glTF property, it becomes undefined and remains undefined as long as the
number of active animations affecting it is greater than one."

**Problem.** There is no priority, no last-started-wins, no weighting. A
crossfade between two clips, or an additive layer on top of a base clip — the
basic operations of character animation — cannot be expressed portably. The
only portable content is clips with pairwise disjoint channel sets.

**Proposed resolution.** Minimum: define last-started-wins so overlapping
content is at least deterministic. Better: add a `float weight` input to
`animation/start` with normalized blending across active entries.

---

### C2. No pause, resume, seek or speed change

**Where.** *Animation Control Operations* as a whole.

**Problem.** The only mutation of a running clip is `stopAt`. Changing speed
or jumping requires `animation/stop` plus `animation/start`, which by rule
discards the pending `done` flows. Reconstructing a resume requires reading
`virtualPlayhead`, which is defined as "the last requested timestamp", i.e.
the previous update's position, so a restart mid-frame loses or gains up to
one frame of time.

**Proposed resolution.** Add `animation/pause`/`animation/resume` (or a
`float speed` write on the state entry with 0 meaning paused), and specify
that `virtualPlayhead` reads return the position at the current graph time,
not the last update.

---

### C3. Silent no-ops and dropped completions

**Where.** *Animation Start* step 6 ("the previously set `done` flows
**MUST NOT** be activated"); *Animation Stop* step 3; *Animation Stop At*
step 4 (no branch for "no entry").

**Problem.** A restart discards pending `done` flows with no notification;
`animation/stop` and `animation/stopAt` on a clip that is not playing
activate `out` and do nothing. A graph waiting on a `done` that was
discarded waits forever, and nothing in the graph can observe that it was
discarded other than polling `isPlaying`.

**Proposed resolution.** Add a `cancelled` output flow to `animation/start`
and `animation/stopAt` (mirroring the `done`/`err` shape), activated when
the entry is removed by any means other than reaching its own completion.
Alternatively, route `stop`/`stopAt` on a non-playing clip to `err`.

---

### C4. `maxActiveAnimations` has no required minimum

**Where.** *Implementation-Specific Runtime Limits*.

**Problem.** A conforming implementation may advertise 1. Content cannot
target a floor; the Khronos showcase asset *WhackAMole* alone runs 21 clips
concurrently. The extension already defines the property, so a floor is
cheap to add.

**Proposed resolution.** Require `maxActiveAnimations` ≥ the number of
animations in the asset, or a fixed minimum (e.g. 32).

---

### C5. The virtual timeline anchors at 0, not `minTime`

**Where.** *Animation Start*, timeline mapping ("the stored animation data
defines the animated property values for all *effective input timestamps* in
the [0, *T*] range"); *Animation State*, `minTime` Authoring Tip.

**Problem.** A clip whose first keyframe sits at *m* > 0 holds for *m* seconds
at the start of *every* loop iteration when `endTime` is infinite, because
the wrap returns to 0, not to *m*. The Authoring Tip acknowledges the lead-in
for a single play but there is no way to loop the keyframed range
[`minTime`, `maxTime`] with one `animation/start`.

**Proposed resolution.** Add an optional `float loopStart` (default 0) to
`animation/start`, or define the wrap over [`minTime`, `maxTime`] when
`minTime` > 0.
