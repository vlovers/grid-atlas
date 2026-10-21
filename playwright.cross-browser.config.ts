import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";
/** Optional local cross-engine acceptance; CI retains its existing Chromium gates. */
export default defineConfig({
  ...base,
  testMatch: ["interactive-history.spec.ts", "history-atlas.spec.ts", "editorial-release.spec.ts"],
  outputDir: process.env.CROSS_BROWSER_OUTPUT || "test-results/cross-browser",
  projects: [
    {
      name: "firefox-desktop",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "webkit-desktop",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    },
  ],
});
