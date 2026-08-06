import { configDefaults, defineConfig } from "vitest/config";

// `.claude/**` holds agent worktrees (full repo copies without installed
// deps or build output); without this exclude, a root `vitest run` crawls
// into them and reports phantom failures from those stale copies.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, ".claude/**", "external/**"]
  }
});
