// Deterministic identifier naming shared by import.ts: sanitize a preferred
// name into a valid-looking identifier, then de-duplicate collisions within
// a namespace by appending a stable numeric suffix (never reordering: first
// claimant keeps the bare name, so output is independent of iteration order
// as long as callers allocate in a fixed, deterministic order — which
// import.ts always does, node/declaration order).
export function sanitizeIdentifier(raw: string): string {
  let out = raw.replace(/[^A-Za-z0-9_]/g, "_");
  if (out.length === 0 || !/^[A-Za-z_]/.test(out)) {
    out = `_${out}`;
  }
  return out;
}

export class NameAllocator {
  private used = new Set<string>();

  alloc(preferred: string): string {
    const base = sanitizeIdentifier(preferred) || "_";
    if (!this.used.has(base)) {
      this.used.add(base);
      return base;
    }
    let suffix = 2;
    let candidate = `${base}_${suffix}`;
    while (this.used.has(candidate)) {
      suffix += 1;
      candidate = `${base}_${suffix}`;
    }
    this.used.add(candidate);
    return candidate;
  }

  has(name: string): boolean {
    return this.used.has(name);
  }
}
