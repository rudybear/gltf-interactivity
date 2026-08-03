import { defineConfig, type Plugin } from "vite";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

// The corpus/interactive test assets (external/glTF-Test-Assets-Interactivity)
// live at the *repo* root (fetched by scripts/fetch-assets.mjs, gitignored —
// see /.gitignore), not inside apps/viewer/ — so they're outside Vite's
// project root and its default static-file serving doesn't reach them (a
// GET for an unmatched path falls through to the SPA index.html, not a 404 —
// confirmed empirically: without this plugin, `?src=/external/...glb`
// fetches back index.html's bytes instead of GLB bytes). This plugin serves
// repo-root external/ at the fixed URL prefix /external/ in both `vite`
// (dev, via configureServer) and `vite preview` (via configurePreviewServer)
// — the same two hooks scripts/render-verify.mjs's own dev-server bring-up
// relies on being consistent between.
function externalAssetsPlugin(): Plugin {
  const externalRoot = resolve(import.meta.dirname, "../../external");
  const middleware = (req: { url?: string }, res: { statusCode: number; end: (chunk?: string) => void }, next: () => void) => {
    const url = req.url ?? "";
    if (!url.startsWith("/external/")) {
      next();
      return;
    }
    const relative = decodeURIComponent(url.slice("/external/".length).split("?")[0] ?? "");
    const filePath = resolve(externalRoot, relative);
    if (!filePath.startsWith(externalRoot) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      next();
      return;
    }
    res.statusCode = 200;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createReadStream(filePath).pipe(res as any);
  };
  return {
    name: "gltfi-external-assets",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

export default defineConfig({
  plugins: [externalAssetsPlugin()],
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173,
    strictPort: false
  },
  build: {
    target: "es2022"
  }
});
