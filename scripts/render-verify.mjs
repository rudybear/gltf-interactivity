// Renders corpus/interactive KHR_interactivity assets in the real viewer
// (Chrome + WebGPU, headless) in BOTH engine modes and asserts: the page
// renders (non-blank canvas screenshot), zero console errors, and an
// interactivity probe passes (window.__gltfi shows live engine state after
// simulated time). Linux-only (this repo's target platform) — Chrome binary
// comes from $CHROME_PATH, defaulting to /usr/bin/google-chrome, with
// google-chrome-stable/chromium as fallbacks.
//
// Usage: node scripts/render-verify.mjs [--filter <substring>] [--headful]
//
// KNOWN FAILURE MODE on this development sandbox (documented, not silently
// swallowed — see the task report for full detail): this machine has no
// /dev/dri render-node group membership for the running user, so Chrome's
// WebGPU falls back to a software (SwiftShader) GPU process. That process
// CAN obtain a WebGPU adapter+device and render a handful of frames, but
// Chrome's headless compositor then fails to sustain the canvas's WebGPU
// swap-chain ("Could not find SharedImageBackingFactory ... WebGPUSwap-
// BufferProvider" in --enable-logging=stderr output), which tears the
// GPUDevice down ("Device was destroyed.") roughly ~0.5-1s after the first
// scene upload and floods the page with unhandled `DOMException:
// OperationError: Instance dropped in popErrorScope` rejections thereafter.
// This is an environment/headless-GPU limitation, not a bug in the ported
// renderer: the interactivity engines themselves (pure CPU/JS, unaffected
// by GPU device loss) keep ticking correctly throughout, verified
// separately by packages/*/test's DOM-less engine-path tests. See the task
// report's "smoke results" section for what a run here actually produces,
// and rerun this script on a machine with real (or a properly configured
// software) GPU passthrough to see it green end-to-end.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const VIEWER_DIR = join(ROOT, "apps/viewer");
const OUT_DIR = join(ROOT, "reports/render");
const PORT = Number(process.env.SMOKE_PORT ?? 5987);

const args = process.argv.slice(2);
const filterIdx = args.indexOf("--filter");
const filter = filterIdx >= 0 ? args[filterIdx + 1].toLowerCase() : null;
const headful = args.includes("--headful");

function resolveChrome() {
  const candidates = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(
    Boolean
  );
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `No Chrome/Chromium binary found. Tried: ${candidates.join(", ")}. Set CHROME_PATH to an existing browser executable.`
  );
}

// Corpus assets picked to visibly exercise three distinct interactivity
// mechanisms the compiled AND interpreted engines both must get right — an
// animation-triggering test, a delayed-execution test, and a pointer/set
// visual-mutation test. All three are official Khronos conformance assets
// (external/glTF-Test-Assets-Interactivity/Tests/Interactivity), so both
// engines are already proven spec-conformant against them by `pnpm
// conf:interp`/`pnpm conf:compiled` (145/145) — this script is checking the
// *viewer* wiring (rendering + engine-host bubbling + the browser compiled-
// path bundle/import-map), not KHR_interactivity semantics again.
const ASSETS = [
  {
    name: "animation/start",
    url: "/external/glTF-Test-Assets-Interactivity/Tests/Interactivity/animation/start/glTF-Binary/start.glb"
  },
  {
    name: "flow/setDelay_and_cancelDelay",
    url: "/external/glTF-Test-Assets-Interactivity/Tests/Interactivity/flow/setDelay_and_cancelDelay/glTF-Binary/setDelay_and_cancelDelay.glb"
  },
  {
    name: "pointer/set_and_get",
    url: "/external/glTF-Test-Assets-Interactivity/Tests/Interactivity/pointer/set_and_get/glTF-Binary/set_and_get.glb"
  }
];
const ENGINES = ["interpreter", "compiled"];

async function serverResponds() {
  try {
    const res = await fetch(`http://localhost:${PORT}/`);
    return res.ok;
  } catch {
    return false;
  }
}

function runNode(scriptArgs, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(process.execPath, scriptArgs, { cwd, stdio: "inherit" });
    proc.on("exit", (code) => (code === 0 ? resolvePromise() : rejectPromise(new Error(`${scriptArgs.join(" ")} exited ${code}`))));
    proc.on("error", rejectPromise);
  });
}

async function startVite() {
  if (await serverResponds()) {
    console.log(`reusing dev server already on :${PORT}`);
    return null;
  }
  // Regenerate the @gltfi/runtime-lib browser bundle the compiled-engine
  // path's import map points at — normally a predev/prebuild pnpm hook (see
  // apps/viewer/package.json), done explicitly here since we spawn vite's
  // binary directly rather than through `pnpm run dev`.
  await runNode(["scripts/bundle-runtime-lib.mjs"], VIEWER_DIR);
  const vite = join(VIEWER_DIR, "node_modules/.bin/vite");
  const proc = spawn(vite, ["--port", String(PORT), "--strictPort"], {
    cwd: VIEWER_DIR,
    stdio: ["ignore", "pipe", "pipe"]
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", (chunk) => process.stderr.write(chunk));
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await serverResponds()) {
      return proc;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  proc.kill();
  throw new Error("vite dev server did not come up within 30s");
}

async function main() {
  const chrome = resolveChrome();
  console.log(`Using Chrome: ${chrome}`);
  await mkdir(OUT_DIR, { recursive: true });
  const vite = await startVite();
  console.log(`vite up on :${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: headful ? false : true,
    args: ["--window-size=1280,800", "--enable-unsafe-webgpu"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Only a cheap existence check here (no live requestAdapter() call): the
  // viewer's own initWebGpu() (called unconditionally by main.ts on every
  // page load) is the sole thing that actually requests an adapter+device —
  // an independent second requestAdapter() call from this script raced
  // against it and destabilized the software (SwiftShader) GPU process on
  // this sandbox during development, so real adapter-availability is judged
  // from each asset run's own load/render outcome below instead.
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  const hasGpuApi = await page.evaluate(() => "gpu" in navigator);
  if (!hasGpuApi) {
    console.error("navigator.gpu is not present in this browser at all — cannot run the smoke suite.");
    await browser.close();
    vite?.kill();
    process.exit(2);
  }

  // Empty-canvas baseline for the blank-screenshot heuristic (same idea as
  // the reference script this was adapted from: a capture within 2% of the
  // empty canvas's own JPEG size is "blank").
  await new Promise((r) => setTimeout(r, 600));
  const baselineCanvas = await page.$("#viewerCanvas");
  const baselineJpeg = await baselineCanvas.screenshot({ type: "jpeg", quality: 70 });
  const blankThreshold = baselineJpeg.length * 1.02;
  console.log(`blank baseline: ${baselineJpeg.length} bytes`);

  const assets = ASSETS.filter((a) => !filter || a.name.toLowerCase().includes(filter));
  const results = [];

  for (const asset of assets) {
    for (const engine of ENGINES) {
      const record = {
        asset: asset.name,
        engine,
        status: "ok",
        loadError: null,
        consoleErrors: [],
        blank: false,
        probe: null,
        screenshot: null
      };
      const consoleErrors = [];
      const onConsole = (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text().slice(0, 300));
        }
      };
      const onPageError = (err) => consoleErrors.push(String(err).slice(0, 300));
      page.on("console", onConsole);
      page.on("pageerror", onPageError);

      try {
        const url = `http://localhost:${PORT}/?engine=${engine}&src=${encodeURIComponent(asset.url)}`;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => window.__lastLoad !== undefined, { timeout: 30000 });
        const lastLoad = await page.evaluate(() => window.__lastLoad);
        if (!lastLoad || lastLoad.status !== "ok") {
          record.status = "load-error";
          record.loadError = lastLoad?.error ?? "unknown load failure";
        } else {
          // Let the interactivity engine tick for a bit (simulated time via
          // real wall-clock RAF frames) before probing/screenshotting.
          await new Promise((r) => setTimeout(r, 1500));
          record.probe = await page.evaluate(() => {
            const g = window.__gltfi;
            if (!g) {
              return null;
            }
            return { engine: g.engine, time: g.time, dirtyCount: g.dirtyCount, variableCount: g.variableCount };
          });
          const shotPath = join(OUT_DIR, `${asset.name.replace(/[/\\]/g, "_")}-${engine}.png`);
          const canvasEl = await page.$("#viewerCanvas");
          await canvasEl.screenshot({ path: shotPath });
          record.screenshot = shotPath;
          const jpeg = await canvasEl.screenshot({ type: "jpeg", quality: 70 });
          record.blank = jpeg.length <= blankThreshold;
          if (record.blank) {
            record.status = "blank";
          } else if (!record.probe || record.probe.engine !== engine || !(record.probe.time > 0.5)) {
            record.status = "probe-failed";
          }
        }
      } catch (err) {
        record.status = "timeout";
        record.loadError = err instanceof Error ? err.message.slice(0, 300) : String(err);
      }

      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      record.consoleErrors = consoleErrors;
      if (consoleErrors.length > 0 && record.status === "ok") {
        record.status = "console-error";
      }

      results.push(record);
      const tag = record.status === "ok" ? "PASS" : record.status.toUpperCase();
      console.log(`${tag.padEnd(14)} ${asset.name} [${engine}]`);
      if (record.status !== "ok") {
        console.log(`  probe=${JSON.stringify(record.probe)} loadError=${record.loadError ?? "-"} consoleErrors=${consoleErrors.length}`);
        consoleErrors.slice(0, 3).forEach((e) => console.log(`    - ${e}`));
      }
    }
  }

  await browser.close();
  vite?.kill();

  await writeFile(join(OUT_DIR, "report.json"), JSON.stringify(results, null, 2));
  const failures = results.filter((r) => r.status !== "ok");
  console.log(`\n${results.length} runs, ${results.length - failures.length} passed, ${failures.length} failed.`);
  console.log(`Report: ${join(OUT_DIR, "report.json")}`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
