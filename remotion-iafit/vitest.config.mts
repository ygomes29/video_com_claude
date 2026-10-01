import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // The clipping lib uses the global `fetch`/`Request`/`Response` (Node 18+).
    globals: false,
  },
});