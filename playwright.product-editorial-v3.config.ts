import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/real-archive', testMatch:'product-editorial-v3.spec.ts',workers:2,timeout:60_000,
  outputDir:'test-results/product-editorial-v3',
  use:{baseURL:process.env.PREVIEW_URL||'http://127.0.0.1:3483',reducedMotion:'reduce',screenshot:'only-on-failure',trace:'retain-on-failure'},
  projects:[
    {name:'chromium-editorial',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
    {name:'webkit-editorial',use:{...devices['Desktop Safari'],viewport:{width:1024,height:1000}}},
    {name:'mobile-editorial',use:{...devices['Pixel 7'],viewport:{width:390,height:844}}},
  ],
});
