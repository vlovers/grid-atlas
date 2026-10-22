import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:3340', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    { command: 'node apps/api/test/browser-server.cjs', url: 'http://127.0.0.1:3339/api/health', reuseExistingServer: false, gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 } },
    { command: 'pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3340', url: 'http://127.0.0.1:3340', env: { API_BASE_URL: 'http://127.0.0.1:3339', SITE_URL: 'http://127.0.0.1:3340' }, reuseExistingServer: false },
    // The outage server correctly returns HTTP 500 for data-backed routes.
    // Readiness must check a static asset, independently of the unavailable API.
    { command: 'pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3341', url: 'http://127.0.0.1:3341/fonts/manrope-latin.woff2', env: { API_BASE_URL: 'http://127.0.0.1:3342', SITE_URL: 'http://127.0.0.1:3341' }, reuseExistingServer: false },
  ],
});
