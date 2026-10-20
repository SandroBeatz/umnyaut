import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * Phone-viewport journeys against the production build (`pnpm build` first). Chromium with the iPhone 13
 * viewport (390 × 844) keeps CI light; the 660 px first-screen budget is asserted in the tests. The rooms-and-estimate
 * scenarios (P17.15) also run on a desktop viewport, where the room editor is a dialog instead of a sheet.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    timezoneId: "Europe/Moscow",
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop",
      testMatch: "scenarios.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health/`,
    env: { APP_ENV: "preview" },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
