import { defineConfig, devices } from '@playwright/test';
/** Genuine archive preview must already be running. No synthetic fixture server. */
export default defineConfig({
  testDir: './tests/real-archive', testMatch: 'product-v3.spec.ts', workers: 2, timeout: 45_000,
  outputDir: 'test-results/product-v3',
  use: { baseURL: process.env.PREVIEW_URL || 'http://127.0.0.1:3481', reducedMotion: 'reduce', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium-v3', use: { ...devices['Desktop Chrome'], viewport: {width:1440,height:1000} } },
    { name: 'webkit-v3', use: { ...devices['Desktop Safari'], viewport: {width:1440,height:1000} } },
    { name: 'mobile-v3', use: { ...devices['Pixel 7'], viewport: {width:390,height:844} } },
  ],
});
