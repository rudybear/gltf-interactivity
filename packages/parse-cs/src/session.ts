// Lazily-spawned, persistent `dotnet gltfi-harness-cs.dll` session used ONLY
// to fetch the `{"cmd":"ast", source}` command's own JSON tree (see
// @gltfi/runtime-cs's Harness.cs's header/`CmdAst` doc comments). Mirrors
// packages/parse-py/src/session.ts's `AstSession` almost verbatim (same
// rationale, same "spawn once on first call, reuse forever, `closeSession()`
// lets a caller tear it down explicitly" lazy-singleton shape) but built on
// top of @gltfi/runtime-cs's shared `CsHarnessSession` transport (the same
// FIFO-bridge class packages/conformance/src/run-compiled-cs.ts's own
// session now also uses — see that package's index.ts header for the full
// "why two named pipes opened O_RDWR" rationale) instead of hand-rolling a
// second copy of it, since @gltfi/parse-cs needs the exact same "find
// `dotnet`, build the harness if the source tree changed, then talk to ONE
// persistent process" dance run-compiled-cs.ts already has.
import { CsHarnessSession, ensureHarnessBuilt, findDotnetBin } from "@gltfi/runtime-cs";

let singleton: CsHarnessSession | undefined;

// Fetches Harness.cs's `AstNodeToJson`-produced tree for `source` from the
// shared (lazily-spawned) harness process. Throws (surfacing the harness's
// own error message — a genuine Roslyn syntax error included, same as any
// other harness command) rather than returning a diagnostic itself;
// @gltfi/parse-cs's own `parseModuleCs` is what turns that into a GC001
// diagnostic.
export function fetchAst(source: string): Record<string, unknown> {
  if (!singleton) {
    const dotnetBin = findDotnetBin();
    ensureHarnessBuilt(dotnetBin);
    singleton = new CsHarnessSession(dotnetBin);
  }
  return singleton.request({ cmd: "ast", source }).ast as Record<string, unknown>;
}

// Shuts down the shared harness process (if one was ever spawned) so a
// caller (the round-trip runner's `main()`, a vitest `afterAll`) can exit
// promptly instead of leaving a lingering child process/open fds around.
export function closeSession(): void {
  singleton?.dispose();
  singleton = undefined;
}
