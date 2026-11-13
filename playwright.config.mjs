import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/links",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/external-links.json" }],
  ],
  use: {
    browserName: "chromium",
    channel: "chromium",
    // Some vendor sites reject the default HeadlessChrome user agent.
    userAgent: devices["Desktop Chrome"].userAgent,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "external", testMatch: "external.spec.mjs" }],
});
