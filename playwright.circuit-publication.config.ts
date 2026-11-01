import { defineConfig, devices } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const token = process.env.CIRCUIT_BROWSER_CONTROL_TOKEN ?? randomUUID();
process.env.CIRCUIT_BROWSER_CONTROL_TOKEN = token;
export default defineConfig({
  testDir: './tests/circuit-publication', outputDir: 'test-results/circuit-publication',
  fullyParallel: false, workers: 1, retries: 0,
  use: { baseURL: 'http://127.0.0.1:3346', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    { command: 'node apps/api/test/circuit-reader-browser-server.cjs', url: 'http://127.0.0.1:3345/__fixture',
      env: { CIRCUIT_BROWSER_CONTROL_TOKEN: token }, reuseExistingServer: false, gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 } },
    { command: 'pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3346', url: 'http://127.0.0.1:3346/fonts/manrope-latin.woff2',
      env: { API_BASE_URL: 'http://127.0.0.1:3345', CIRCUIT_EDITORIAL_UI_ENABLED: '1' }, reuseExistingServer: false },
    { command: 'pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3347', url: 'http://127.0.0.1:3347/fonts/manrope-latin.woff2',
      env: { API_BASE_URL: 'http://127.0.0.1:3345', CIRCUIT_EDITORIAL_UI_ENABLED: '0' }, reuseExistingServer: false },
  ],
});
