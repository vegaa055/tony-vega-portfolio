import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL, E2E_PORT, e2eServerEnv } from "./e2e/env";

/**
 * End-to-end tests against a production build, with its own database.
 * Run with `npm run test:e2e`. See e2e/env.ts for the test settings.
 */
export default defineConfig({
  testDir: "./e2e",
  // The tests share one database and change its content, so they run one at
  // a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      // A small touch-screen phone at 320px, the narrowest width WCAG expects
      // pages to reflow to.
      name: "phone",
      use: { ...devices["Pixel 7"], viewport: { width: 320, height: 720 } },
      dependencies: ["setup"],
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    // A fresh test database, a production build, then the server. The build
    // can take several minutes on a slow disk.
    command: `npx tsx scripts/e2e/prepare.ts && npx next build && npx next start --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    env: e2eServerEnv,
    timeout: 15 * 60_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
  },
});
