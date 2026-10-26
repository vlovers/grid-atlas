import { defineConfig, devices } from '@playwright/test';

/** Separate from synthetic fixtures: this suite reads the genuine pinned import only. */
export default defineConfig({
  testDir: './tests/real-archive',
  outputDir: 'test-results/real-archive',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:3351',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-real', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-real', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @grid-atlas/api start',
      url: 'http://127.0.0.1:3350/api/health',
      env: { HOST: '127.0.0.1', PORT: '3350' },
      reuseExistingServer: false,
      timeout: 40_000,
    },
    {
      command: 'pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3351',
      url: 'http://127.0.0.1:3351/uk',
      env: {
        API_BASE_URL: 'http://127.0.0.1:3350',
        SITE_URL: 'http://127.0.0.1:3351',
      },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
