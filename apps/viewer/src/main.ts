import "./shared/ui.css";
import {
  applyAnimationFrame,
  buildRenderScene,
  loadGltf,
  loadGltfFromFiles,
  loadImageBitmaps,
  refreshInstanceMatrices,
  updateSkinMatrices,
  updateWorldMatrices,
  type GltfDocument,
  type RenderScene
} from "@gltfi/gltf";
import { initWebGpu } from "./shared/webgpu.js";
import { OrbitCamera } from "./renderer/camera.js";
import { mat4Invert, vec3Normalize, vec3TransformMat4, type Vec3 } from "./renderer/math.js";
import { Renderer } from "./renderer/renderer.js";
import { createEngineHost, type EngineHost, type EngineName } from "./engine-host.js";
import { pickNode, type Ray } from "./picking.js";

// --- URL params: ?engine=interpreter|compiled (default interpreter), ?src=<glb-url> ---
const urlParams = new URLSearchParams(window.location.search);
const engineParam: EngineName = urlParams.get("engine") === "compiled" ? "compiled" : "interpreter";
const srcParam = urlParams.get("src");

// --- DOM shell ---
const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root.");
}
app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">glTF Interactivity Viewer <span class="muted" id="engineBadge"></span></div>
      <div class="toolbar">
        <button class="primary" id="loadButton">Load glTF/glb</button>
        <button id="resetButton">Reset View</button>
        <span class="muted" id="interactivityStatus">Interactivity: idle</span>
      </div>
    </header>
    <section class="panel workspace">
      <div class="canvas-wrap">
        <canvas id="viewerCanvas"></canvas>
      </div>
    </section>
    <div class="side-column">
      <aside class="panel">
        <h2>Status</h2>
        <div class="list" id="statusList">
          <div class="card">
            <strong>Renderer</strong>
            <p id="rendererStatus">Waiting for WebGPU...</p>
          </div>
          <div class="card">
            <strong>Selection</strong>
            <p id="selectionStatus">Click a node to select it.</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
`;

const loadButton = document.querySelector<HTMLButtonElement>("#loadButton")!;
const resetButton = document.querySelector<HTMLButtonElement>("#resetButton")!;
const canvas = document.querySelector<HTMLCanvasElement>("#viewerCanvas")!;
const rendererStatus = document.querySelector<HTMLParagraphElement>("#rendererStatus")!;
const interactivityStatus = document.querySelector<HTMLSpanElement>("#interactivityStatus")!;
const selectionStatus = document.querySelector<HTMLParagraphElement>("#selectionStatus")!;
const engineBadge = document.querySelector<HTMLSpanElement>("#engineBadge")!;

if (!loadButton || !resetButton || !canvas || !rendererStatus || !interactivityStatus || !selectionStatus || !engineBadge) {
  throw new Error("Missing viewer UI elements.");
}

engineBadge.textContent = `[engine: ${engineParam}]`;

canvas.width = 1280;
canvas.height = 720;

const camera = new OrbitCamera();
camera.setAspect(canvas.width / canvas.height);
camera.setDistance(4);

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".gltf,.glb,.bin";
fileInput.multiple = true;
fileInput.style.display = "none";
document.body.appendChild(fileInput);

let renderer: Renderer | null = null;
let pendingScene: RenderScene | null = null;
let pendingImages: Array<ImageBitmap | null> | null = null;
let engineHost: EngineHost | null = null;
let animationTime = 0;
let lastFrameTime = performance.now();
let hoveredNodeIndex = -1;
let selectedNodeIndex = -1;
let dirtyCount = 0;

// --- window.__gltfi: the smoke-test probe (see scripts/render-verify.mjs).
// Exposes just enough engine-agnostic state (current engine name, a live
// variable reader, elapsed interactivity time, and a monotonic dirty-tick
// counter) for a headless harness to assert "the interactivity engine is
// actually alive and doing something", without caring which engine backs it.
const gltfiProbe = {
  get engine(): EngineName {
    return (engineHost?.name ?? engineParam) as EngineName;
  },
  get time(): number {
    return engineHost?.time ?? 0;
  },
  get dirtyCount(): number {
    return dirtyCount;
  },
  getVariable(index: number): unknown {
    return engineHost ? engineHost.getVariable(index) : null;
  },
  get variableCount(): number {
    return engineHost?.variableCount ?? 0;
  },
  get selectedNodeIndex(): number {
    return selectedNodeIndex;
  },
  get hoveredNodeIndex(): number {
    return hoveredNodeIndex;
  }
};
(window as unknown as { __gltfi: typeof gltfiProbe }).__gltfi = gltfiProbe;

// --- model loading ---

async function loadModel(doc: GltfDocument, label: string): Promise<void> {
  rendererStatus.textContent = `Loading ${label}...`;
  try {
    const scene = await buildRenderScene(doc);
    const images = await loadImageBitmaps(doc);
    pendingScene = scene;
    pendingImages = images;
    hoveredNodeIndex = -1;
    selectedNodeIndex = -1;
    animationTime = 0;

    if (scene.bounds) {
      camera.setTarget(scene.bounds.center);
      camera.setDistance(Math.max(scene.bounds.radius * 2.5, 0.5));
    }
    if (renderer) {
      renderer.setScene(scene, images);
    }

    const binary = doc.binaryChunk ? new Uint8Array(doc.binaryChunk) : null;
    const extensions = doc.json.extensions as Record<string, unknown> | undefined;
    const hasInteractivity = Boolean(extensions?.KHR_interactivity);
    engineHost = hasInteractivity ? await createEngineHost(engineParam, doc.json, binary, scene) : null;
    engineHost?.start();
    interactivityStatus.textContent = hasInteractivity ? `Interactivity: ${engineParam} running` : "Interactivity: none";
    rendererStatus.textContent = `Loaded ${label} (${scene.nodes.length} nodes, ${scene.primitives.length} primitives).`;
    (window as unknown as { __lastLoad: unknown }).__lastLoad = { status: "ok", label, interactivity: hasInteractivity };
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    rendererStatus.textContent = `Load error: ${message}`;
    console.error("[gltfi] failed to load model:", err);
    (window as unknown as { __lastLoad: unknown }).__lastLoad = { status: "error", error: message };
  }
}

async function loadModelFiles(files: File[]): Promise<void> {
  const doc = await loadGltfFromFiles(files);
  await loadModel(doc, files[0]?.name ?? "files");
}

async function loadModelFromUrl(url: string): Promise<void> {
  const doc = await loadGltf(url);
  await loadModel(doc, url);
}

loadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files && fileInput.files.length > 0) {
    void loadModelFiles(Array.from(fileInput.files));
  }
});
resetButton.addEventListener("click", () => {
  if (pendingScene?.bounds) {
    camera.setTarget(pendingScene.bounds.center);
    camera.setDistance(Math.max(pendingScene.bounds.radius * 2.5, 0.5));
  }
});

// Automation/e2e hook (see scripts/render-verify.mjs): resets __lastLoad to
// undefined *before* the async load starts so a `waitForFunction(() =>
// window.__lastLoad !== undefined)`-style poll works across repeated loads
// in the same page, not just the first.
(window as unknown as { __loadModel: (url: string) => Promise<void> }).__loadModel = async (url: string) => {
  (window as unknown as { __lastLoad: unknown }).__lastLoad = undefined;
  await loadModelFromUrl(url);
};
(window as unknown as { __rendererDiagnostics: () => unknown }).__rendererDiagnostics = () => renderer?.getDiagnostics() ?? null;

// --- WebGPU bring-up ---

initWebGpu(canvas)
  .then((ctx) => {
    renderer = new Renderer(ctx);
    renderer.setViewProjectionProvider(() => ({ viewProj: camera.getViewProjection(), cameraPos: camera.getEyePosition() }));
    renderer.start();
    rendererStatus.textContent = "WebGPU ready.";
    if (pendingScene && pendingImages) {
      renderer.setScene(pendingScene, pendingImages);
    }
    resizeCanvas();
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    rendererStatus.textContent = `WebGPU unavailable: ${message}`;
    console.error("[gltfi] WebGPU init failed:", err);
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(12,14,18,0.92);color:#e8e8ea;z-index:1000;text-align:center;" +
      "font:15px/1.6 system-ui,sans-serif;padding:2rem;";
    overlay.innerHTML =
      `<div style="max-width:34rem"><h2 style="margin:0 0 .5rem">WebGPU is not available in this browser</h2>` +
      `<p style="opacity:.85">${message}</p>` +
      `<p>This viewer renders with raw WebGPU. Options:</p>` +
      `<ul style="text-align:left;display:inline-block;margin:0"><li>Open this page in <b>Chrome / Chromium</b></li>` +
      `<li>Firefox users: use the <b>three.js demo</b> (gltf-interactivity-three, <code>pnpm demo</code>) — it falls back to WebGL2 automatically</li></ul></div>`;
    document.body.appendChild(overlay);
  });

function resizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round((rect.width || canvas.clientWidth || 1280) * dpr));
  const height = Math.max(1, Math.round((rect.height || canvas.clientHeight || 720) * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  camera.setAspect(canvas.width / Math.max(1, canvas.height));
  renderer?.resize();
}
window.addEventListener("resize", resizeCanvas);
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(resizeCanvas).observe(canvas);
}

// --- camera orbit controls + click-select / hover picking ---

function screenToRay(clientX: number, clientY: number): Ray {
  const rect = canvas.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
  const ndcY = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
  const origin = camera.getEyePosition();
  const inv = mat4Invert(camera.getViewProjection());
  if (!inv) {
    return { origin, dir: [0, 0, -1] };
  }
  const far: Vec3 = vec3TransformMat4(inv, [ndcX, ndcY, 1]);
  const dir = vec3Normalize([far[0] - origin[0], far[1] - origin[1], far[2] - origin[2]]);
  return { origin, dir };
}

function updateHover(clientX: number, clientY: number): void {
  if (!pendingScene) {
    return;
  }
  const ray = screenToRay(clientX, clientY);
  const hit = pickNode(pendingScene, ray, "hover");
  const nodeIndex = hit ? hit.nodeIndex : -1;
  if (nodeIndex === hoveredNodeIndex) {
    return;
  }
  hoveredNodeIndex = nodeIndex;
  // fireHoverIn is the full bidirectional transition on both engines (fires
  // onHoverOut for whatever was previously hovered too) — see
  // engine-host.ts's InterpreterEngineHost/CompiledEngineHost doc comments —
  // so a single call handles "moved onto a new node" AND "moved onto
  // nothing" (nodeIndex -1) alike.
  engineHost?.fireHoverIn(nodeIndex, hit ? { point: hit.point } : undefined);
}

function handleSelect(clientX: number, clientY: number): void {
  if (!pendingScene) {
    return;
  }
  const ray = screenToRay(clientX, clientY);
  const hit = pickNode(pendingScene, ray, "select");
  selectedNodeIndex = hit ? hit.nodeIndex : -1;
  selectionStatus.textContent = hit ? `Selected node ${hit.nodeIndex}.` : "No selectable node under cursor.";
  if (hit) {
    engineHost?.fireSelect(hit.nodeIndex, { point: hit.point, rayOrigin: ray.origin });
  }
}

let dragStart: { x: number; y: number } | null = null;
let isDragging = false;

canvas.addEventListener("pointerdown", (event) => {
  camera.onPointerDown(event.clientX, event.clientY);
  dragStart = { x: event.clientX, y: event.clientY };
  isDragging = true;
});
canvas.addEventListener("pointermove", (event) => {
  if (isDragging && event.buttons === 1) {
    camera.onPointerMove(event.clientX, event.clientY);
  }
  updateHover(event.clientX, event.clientY);
});
window.addEventListener("pointerup", (event) => {
  camera.onPointerUp();
  if (isDragging && dragStart) {
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.hypot(dx, dy) < 4) {
      handleSelect(event.clientX, event.clientY);
    }
  }
  isDragging = false;
  dragStart = null;
});
canvas.addEventListener(
  "wheel",
  (event) => {
    camera.onWheel(event.deltaY);
    event.preventDefault();
  },
  { passive: false }
);
canvas.addEventListener("pointerleave", () => {
  if (hoveredNodeIndex >= 0) {
    engineHost?.fireHoverOut(hoveredNodeIndex);
    hoveredNodeIndex = -1;
  }
});

// --- per-frame tick: interactivity + scene-graph refresh (actual GPU
// drawing happens inside renderer's own internal RAF loop, started by
// renderer.start() above — this loop only decides whether a redraw needs
// fresh vertex/instance/material/skin data). ---

function animationLoop(time: number): void {
  requestAnimationFrame(animationLoop);
  const dt = Math.min(Math.max((time - lastFrameTime) / 1000, 0), 0.25);
  lastFrameTime = time;

  let needsRefresh = false;
  // Only auto-play the glTF document's own default animation when there is
  // no KHR_interactivity graph driving playback itself (animation/start|
  // stop|stopAt) — running both at once would fight over the same node TRS
  // channels every frame.
  if (!engineHost && pendingScene && pendingScene.animations.length > 0) {
    animationTime += dt;
    applyAnimationFrame(pendingScene, animationTime, 0);
    needsRefresh = true;
  }

  let interactivityDirty = false;
  if (engineHost) {
    engineHost.tick(dt);
    if (engineHost.consumeDirtyPointers()) {
      interactivityDirty = true;
    }
    interactivityStatus.textContent = `Interactivity: ${engineHost.name} t=${engineHost.time.toFixed(2)}s`;
  }

  if ((needsRefresh || interactivityDirty) && pendingScene) {
    dirtyCount += 1;
    updateWorldMatrices(pendingScene.nodes, pendingScene.json);
    refreshInstanceMatrices(pendingScene);
    updateSkinMatrices(pendingScene.primitives, pendingScene.nodes, pendingScene.skins);
    if (renderer) {
      renderer.updateInstanceBuffers(pendingScene.primitives);
      renderer.updateMaterialUniforms(pendingScene.materials);
      renderer.updateSkinBuffers(pendingScene.primitives);
    }
  }
}
requestAnimationFrame(animationLoop);

// --- file input + ?src= URL param bring-up ---

if (srcParam) {
  void (window as unknown as { __loadModel: (url: string) => Promise<void> }).__loadModel(srcParam);
}
