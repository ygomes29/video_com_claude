import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // The clipping lib uses the global `fetch`/`Request`/`Response` (Node 18+).
    globals: false,
  },
  resolve: {
    alias: {
      // `server-only` is a Next.js build-time guard (throws in client bundles).
      // Vitest runs in Node without Next's aliasing, so point it at an empty
      // stub to keep unit tests green. The production build uses the real pkg.
      "server-only": fileURLToPath(
        new URL("./vitest-stub-server-only.ts", import.meta.url),
      ),
    },
  },
});