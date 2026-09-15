import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests for plain logic: validation, Markdown, uploads, formatting.
// Pages and flows are covered by the Playwright tests in e2e/.
export default defineConfig({
  resolve: {
    // Resolve "@/..." imports the same way TypeScript does.
    tsconfigPaths: true,
    alias: {
      // "server-only" throws outside Next.js's server bundles. Unit tests run
      // in Node, where every module is effectively server code.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
