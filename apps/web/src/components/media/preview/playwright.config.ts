import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../../../../../../tests/browser', testMatch: 'media.spec.ts',
  outputDir: '../../../../../../test-results/media', fullyParallel: true, workers: 2,
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
