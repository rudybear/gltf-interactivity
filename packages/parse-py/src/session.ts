// Lazily-spawned, persistent `python3 harness.py` session used ONLY to fetch
// `ast.parse(code)`'s own tree as JSON (the `{"cmd":"ast", code}` command
// added to @gltfi/runtime-py's harness.py — see that file's header/cmd_ast
// doc comments). Mirrors packages/conformance/src/run-compiled-py.ts's
// `PySession` almost verbatim (same FIFO-pair trick, same rationale — see
// that file's header comment for the full explanation of why two on-disk
// named pipes opened O_RDWR are needed to get a genuinely BLOCKING request/
// response round trip out of Node's fundamentally-async child_process pipes)
// but trimmed to the one command this package actually needs, and — unlike
// run-compiled-py.ts, which owns exactly one session for a whole conformance
// run and disposes it in a `finally` — this one is a lazily-created module-
// level SINGLETON (spawned on the first `parseModulePy` call, reused by every
// subsequent call) since @gltfi/parse-py's public API is a plain synchronous
// function with no run-scoped setup/teardown of its own; `closeParser()`
// lets a caller (the round-trip runner, a vitest `afterAll`) shut it down
// explicitly so the process exits promptly instead of waiting for GC.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { HARNESS_PATH, PYTHON_SRC_DIR } from "@gltfi/runtime-py";

class AstSession {
  private readonly reqWriteFd: number;
  private readonly respReadFd: number;
  private readonly child: ChildProcess;
  private readonly tmpDir: string;
  private buf: Buffer = Buffer.alloc(0);

  constructor(pythonBin: string) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltfi-parse-py-fifo-"));
    const reqPath = path.join(this.tmpDir, "req.fifo");
    const respPath = path.join(this.tmpDir, "resp.fifo");
    execFileSync("mkfifo", [reqPath]);
    execFileSync("mkfifo", [respPath]);

    // Opened O_RDWR ("r+") specifically so this open call can never block —
    // see this file's header note. Handed to the child as its stdin/stdout,
    // then closed here once the child owns its own copies.
    const spawnReqFd = fs.openSync(reqPath, "r+");
    const spawnRespFd = fs.openSync(respPath, "r+");
    this.child = spawn(pythonBin, [HARNESS_PATH], {
      stdio: [spawnReqFd, spawnRespFd, "inherit"],
      env: { ...process.env, PYTHONPATH: PYTHON_SRC_DIR }
    });
    fs.closeSync(spawnReqFd);
    fs.closeSync(spawnRespFd);

    // Fresh fds for OUR OWN use — distinct opens from the ones just handed
    // to the child and closed above, all pointing at the same two FIFO
    // paths on disk.
    this.reqWriteFd = fs.openSync(reqPath, "r+");
    this.respReadFd = fs.openSync(respPath, "r+");
  }

  private readLine(): string {
    const chunk = Buffer.alloc(1 << 16);
    for (;;) {
      const idx = this.buf.indexOf(10);
      if (idx !== -1) {
        const line = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        return line;
      }
      const n = fs.readSync(this.respReadFd, chunk, 0, chunk.length, null);
      if (n === 0) {
        throw new Error("python ast harness process closed its output unexpectedly (it may have crashed — check stderr above)");
      }
      this.buf = Buffer.concat([this.buf, chunk.subarray(0, n)]);
    }
  }

  request(req: Record<string, unknown>): Record<string, unknown> {
    fs.writeSync(this.reqWriteFd, Buffer.from(`${JSON.stringify(req)}\n`, "utf8"));
    const resp = JSON.parse(this.readLine()) as Record<string, unknown>;
    if (!resp.ok) {
      const reason = typeof resp.traceback === "string" ? `${String(resp.error)}\n${resp.traceback}` : String(resp.error);
      throw new Error(reason);
    }
    return resp;
  }

  dispose(): void {
    try {
      fs.closeSync(this.reqWriteFd);
    } catch {
      /* already closed */
    }
    try {
      fs.closeSync(this.respReadFd);
    } catch {
      /* already closed */
    }
    this.child.kill();
    try {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

let singleton: AstSession | undefined;

// Fetches `ast.parse(code, type_comments=False)`'s own tree from the shared
// (lazily-spawned) harness process, as the plain JSON shape harness.py's
// `ast_to_dict`/`enc_any` produce (see that file's cmd_ast doc comment).
// Throws (surfacing the Python traceback — a genuine SyntaxError included,
// same as any other harness command) rather than returning a diagnostic
// itself; @gltfi/parse-py's own `parseModulePy` is what turns that into a
// GP001 diagnostic.
export function fetchAst(code: string): Record<string, unknown> {
  if (!singleton) {
    singleton = new AstSession(process.env.GLTFI_PYTHON ?? "python3");
  }
  return singleton.request({ cmd: "ast", code }).ast as Record<string, unknown>;
}

// Shuts down the shared harness process (if one was ever spawned) so a
// caller (the round-trip runner's `main()`, a vitest `afterAll`) can exit
// promptly instead of leaving a lingering child process/open fds around.
export function closeSession(): void {
  singleton?.dispose();
  singleton = undefined;
}
