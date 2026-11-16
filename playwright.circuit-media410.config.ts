import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', testMatch: 'circuit-media-intake.spec.ts', outputDir: 'test-results/circuit-media410',
  workers: 2, retries: 0, use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' }, projects: [
    { name: 'desktop410', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile410', use: { ...devices['Pixel 7'] } },
    { name: 'webkit410', use: { ...devices['Desktop Safari'] } },
  ] });
