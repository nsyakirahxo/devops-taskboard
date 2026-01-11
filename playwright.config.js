// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright configuration for Delete Task E2E testing
 */
module.exports = defineConfig({
  testDir: "./tests/frontend",
  testMatch: "**/*.e2e.spec.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "coverage/frontend/playwright-report" }],
    ["list"],
  ],
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node index.js",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
