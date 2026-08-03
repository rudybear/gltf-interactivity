// Pure state-machine transitions for the KHR_interactivity stateful flow
// nodes (doN, multiGate, waitAll, throttle). Each function takes the node's
// current persisted state plus the triggering input and returns the next
// state together with the decision the caller needs to act on (which flow
// socket to fire, if any). No I/O, no node-state storage, no RNG calls of
// their own — randomness is injected via a callback so callers keep control
// of when/how their shared random stream advances.

export function doNAdvance(count: number, n: number): { fire: boolean; count: number } {
  if (count < n) {
    return { fire: true, count: count + 1 };
  }
  return { fire: false, count };
}

export function multiGateAdvance(
  usedIn: boolean[],
  outputCount: number,
  isRandom: boolean,
  isLoop: boolean,
  randomIndex: (count: number) => number
): { used: boolean[]; index: number } {
  let used = usedIn.length === outputCount ? usedIn.slice() : new Array(outputCount).fill(false);
  let index = -1;
  if (!isRandom) {
    index = used.findIndex((flag) => !flag);
  } else {
    const available = used.map((flag, idx) => (!flag ? idx : -1)).filter((idx) => idx >= 0);
    if (available.length > 0) {
      index = available[randomIndex(available.length)];
    }
  }
  if (index === -1 && isLoop) {
    used = new Array(outputCount).fill(false);
    index = isRandom ? randomIndex(outputCount) : 0;
  }
  if (index >= 0) {
    used[index] = true;
  }
  return { used, index };
}

export function waitAllAdvance(
  activatedIn: boolean[],
  remainingIn: number | undefined,
  inputFlows: number,
  index: number
): { activated: boolean[]; remaining: number; completed: boolean } {
  const activated = activatedIn.slice();
  let remaining = remainingIn ?? inputFlows;
  if (index >= 0 && index < inputFlows) {
    if (!activated[index]) {
      activated[index] = true;
      remaining = remaining - 1;
    }
  }
  return { activated, remaining, completed: remaining <= 0 };
}

export function throttleAdvance(
  lastTimeIn: number | undefined,
  duration: number,
  now: number
): { fire: boolean; lastTime: number; remaining: number } {
  const last = lastTimeIn ?? -Infinity;
  const elapsed = now - last;
  if (elapsed >= duration) {
    return { fire: true, lastTime: now, remaining: 0 };
  }
  return { fire: false, lastTime: last, remaining: Math.max(0, duration - elapsed) };
}
