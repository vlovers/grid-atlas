import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2] || 'before';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3483';
const dir = 'docs/design/product-editorial-v3';
await mkdir(`${dir}/screenshots`, { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  for (const locale of ['en', 'uk']) {
    for (const width of [1440, 1024, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
      for (const [name, path] of [
        ['atlas', 'atlas?kind=driver&id=3'],
        ['time-machine', 'time-machine?kind=driver&id=72&from=2025&to=2026'],
        ['comparison', 'time-machine?kind=driver&id=72&from=1987&to=1988'],
        ['lineage', 'lineage'], ['stories', 'stories'],
      ]) {
        const errors = [];
        const onError = error => errors.push(error.message);
        page.on('pageerror', onError);
        const response = await page.goto(`${base}/${locale}/${path}`);
        await page.getByRole('heading', { level: 1 }).waitFor();
        if (name === 'time-machine' || name === 'comparison') await page.getByLabel(locale === 'uk' ? 'Раніший сезон' : 'Earlier season', { exact: true }).waitFor();
        if (name === 'stories') await page.locator('[data-testid="story-landing"], [data-testid="stories-index"], main h1').last().waitFor();
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        if (name === 'atlas') await page.getByTestId('atlas-canvas').waitFor();
        await page.screenshot({ path: `${dir}/screenshots/${phase}-${name}-${locale}-${width}.jpg`, type: 'jpeg', quality: 82, fullPage: false });
        report.push({ name, locale, width, status: response.status(), errors, ...await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          h1: document.querySelector('h1')?.textContent,
          fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => ({ family: f.family, weight: f.weight })),
          height: document.documentElement.scrollHeight,
        })) });
        page.off('pageerror', onError);
      }
      await page.close();
    }
  }
} finally { await browser.close(); }
await writeFile(`${dir}/${phase}-capture.json`, JSON.stringify(report, null, 2) + '\n');
console.log(`${report.length} captures; ${report.filter(r => r.overflow).length} overflows; ${report.filter(r => r.errors.length).length} pages with errors`);
