import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: 'unified-archive.spec.ts',
  projects: [
    { name: 'chromium-unified', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-unified', use: { ...devices['Pixel 7'] } },
    { name: 'webkit-unified', use: { ...devices['Desktop Safari'] } },
  ],
});
