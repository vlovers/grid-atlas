import { defineConfig, devices } from '@playwright/test';

/** Standalone verification; the same spec also runs in the existing web CI suite. */
export default defineConfig({
  testDir: '../../../../../../tests/browser',
  testMatch: 'discovery.spec.ts',
  outputDir: '../../../../../../test-results/discovery',
  fullyParallel: true,
  workers: 2,
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
