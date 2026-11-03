// Cross-asset custom-event bus. Several independently loaded KHR_interactivity
// graphs (one per glTF asset, interpreted or compiled) can join one bus; a
// custom event whose external `id` is public is forwarded from the sending
// graph to every OTHER joined graph that listens for the same id.
//
// What the KHR_interactivity spec says (Custom Events, Events JSON syntax):
// an event definition has an optional string `id` "recognized by the
// execution environment"; no `id` means "internal to the graph"; "semantics of
// custom events are application-specific". The spec does NOT define
// cross-asset forwarding, the public/private split, delivery timing, or how
// `ref` values cross asset boundaries. Those rules come from the corpus's
// Tests/Interactivity/InterGlb/README.md and are documented here as this
// implementation's (README-derived) choices:
//
//  - Visibility: an event id starting with "_" is PRIVATE and never leaves its
//    graph; any other id is PUBLIC (isPublicEventId). Events without an id
//    are internal and are never published at all.
//  - Matching: by id, then by value sockets. The target must declare every
//    socket it listens on with the same type signature in the sender's
//    payload (extra sender sockets are ignored, sockets the sender omits do
//    not exist). A target with no event/receive node for the id is skipped.
//  - Timing: delivery is synchronous, in the same tick as the event/send
//    (the README timeline has everything at t ~ 0). The sender's own local
//    receivers run first (unchanged behavior), then remote ones.
//  - Ordering: remote deliveries are queued FIFO and drained by the outermost
//    publish, so an event sent from inside a remote receive handler is
//    delivered after the handler returns (breadth-first, no deep recursion).
//    Targets for one event are visited in JOIN order, the sender excluded.
//  - Refs: `ref` payload values are opaque and forwarded verbatim (a
//    JSON-pointer string); the receiver sees the identical value, so echoing
//    it back compares equal under ref/eq. A pointer is NOT re-targeted to the
//    receiving asset: if it is dereferenced there it resolves against the
//    receiver's own document (the spec defines no cross-asset identity).
//
// Pure data structure: no I/O, no globals, ES2020-safe.
import type { Value } from "./value.js";

export function isPublicEventId(id: string | undefined): id is string {
  return typeof id === "string" && id.length > 0 && id.charAt(0) !== "_";
}

// A graph (interpreter runtime or compiled engine) taking part in a bus.
export interface EventBusMember {
  // Diagnostic label only.
  readonly name?: string;
  // The value sockets (id -> type signature) this member listens on for event
  // `id`, or undefined when it has no event/receive for that id.
  listeningSockets(id: string): Record<string, string> | undefined;
  // Deliver one event occurrence (values keyed by socket id).
  receive(id: string, values: Record<string, Value>): void;
}

type Pending = { source: EventBusMember; id: string; values: Record<string, Value> };

export class EventBus {
  private members: EventBusMember[] = [];
  private queue: Pending[] = [];
  private draining = false;

  get size(): number {
    return this.members.length;
  }

  // Join (idempotent). Returns a function that leaves the bus.
  join(member: EventBusMember): () => void {
    if (this.members.indexOf(member) < 0) {
      this.members.push(member);
    }
    return () => this.leave(member);
  }

  // Leave (idempotent). Events already queued for a member that left are dropped.
  leave(member: EventBusMember): void {
    const index = this.members.indexOf(member);
    if (index >= 0) {
      this.members.splice(index, 1);
    }
  }

  // Called by a member when its graph sends a custom event. Private/unknown
  // ids are ignored. Returns after all (transitively triggered) deliveries.
  publish(source: EventBusMember, id: string | undefined, values: Record<string, Value>): void {
    if (!isPublicEventId(id) || this.members.indexOf(source) < 0) {
      return;
    }
    this.queue.push({ source, id, values });
    if (this.draining) {
      return;
    }
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift() as Pending;
        // Snapshot: a handler may join/leave while we iterate.
        for (const target of this.members.slice()) {
          if (target === item.source || this.members.indexOf(target) < 0) {
            continue;
          }
          const sockets = target.listeningSockets(item.id);
          if (!sockets || !compatible(sockets, item.values)) {
            continue;
          }
          target.receive(item.id, item.values);
        }
      }
    } finally {
      this.queue.length = 0;
      this.draining = false;
    }
  }
}

function compatible(sockets: Record<string, string>, values: Record<string, Value>): boolean {
  for (const key of Object.keys(sockets)) {
    const sent = values[key];
    if (!sent || sent.type !== sockets[key]) {
      return false;
    }
  }
  return true;
}
