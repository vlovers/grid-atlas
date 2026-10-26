import { defineConfig } from '@playwright/test';
import real from './playwright.real-archive.config';
/** Final acceptance retains the genuine archive API/web processes and adds integration journeys. */
export default defineConfig({ ...real, testMatch: ['encyclopedia.spec.ts', 'product-editorial-v3.spec.ts', 'product-final.spec.ts'], outputDir:'test-results/product-final' });
