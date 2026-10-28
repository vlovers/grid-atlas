/** Reproducible screenshots: real imported public fallbacks vs explicitly synthetic component/desk evidence. */
import { chromium, webkit, expect } from '@playwright/test';
import { fork } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const web = process.env.PREVIEW_URL || 'http://127.0.0.1:3362';
const api = process.env.PREVIEW_API || 'http://127.0.0.1:3361';
const output = process.env.CAPTURE_DIR || 'docs/media/batch-290-screenshots';
const data = async path => {
  const response = await fetch(api + path);
  if (!response.ok) throw Error(`API ${path}: ${response.status}`);
  return (await response.json()).data;
};
const entities = await Promise.all([['drivers', 'michael-schumacher'], ['constructors', 'mclaren'], ['circuits', 'silverstone']].map(async ([kind, id]) => {
  const matches = (await data(`/api/${kind}?q=${id}&limit=10`)).filter(row => row.external_id === id);
  if (matches.length !== 1) throw Error('Pinned archive subject must resolve exactly: ' + id);
  return { kind, id: matches[0].id, external_id: id };
}));
await mkdir(output, { recursive: true });
let preview;
const previewURL = await new Promise((accept, reject) => {
  preview = fork(resolve('apps/web/src/components/media/preview/server.cjs'), { env: { ...process.env, PORT: '0', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  preview.on('error', reject);
  preview.once('exit', code => reject(Error('Preview exited: ' + code)));
  preview.once('message', message => accept(message.url));
});
const evidence = [];
try {
  for (const [engine, launcher] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await launcher.launch();
    try {
      for (const locale of ['en', 'uk']) for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 375, 812]]) {
        const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        const errors = [], remote = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', request => { if (new URL(request.url()).hostname !== '127.0.0.1') remote.push(request.url()); });
        await page.addInitScript(() => { window.__mediaCLS = null; try { if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) return; window.__mediaCLS = 0; new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__mediaCLS += entry.value; }).observe({ type: 'layout-shift', buffered: true }); } catch { /* WebKit may not expose Layout Instability API. */ } });
        for (const entity of entities) {
          const response = await page.goto(`${web}/${locale}/${entity.kind}/${entity.id}`);
          expect(response.status()).toBe(200);
          await expect(page.locator('main h1').first()).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator('img[src^="/media/"]')).toHaveCount(0);
          await expect(page.getByTestId('media-collection')).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          const metric = await page.evaluate(() => ({ cls: window.__mediaCLS, transferBytes: performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0) }));
          if (engine === 'chromium') await page.screenshot({ path: `${output}/public-${entity.kind}-${locale}-${device}.jpg`, type: 'jpeg', quality: 86 });
          await page.setViewportSize({ width: 320, height: 800 });
          await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          evidence.push({ engine, locale, device, external_id: entity.external_id, public_photographs: 0, ...metric });
          await page.setViewportSize({ width, height });
          await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
        }
        expect((await page.goto(`${web}/${locale}/batch`)).status()).toBe(404);
        if (engine === 'chromium') {
          await page.goto(`${previewURL}/${locale}/batch`);
          await expect(page.getByTestId('media-review-workbench').locator('article')).toHaveCount(12);
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: `${output}/research-desk-${locale}-${device}.jpg`, type: 'jpeg', quality: 86 });
          await page.getByTestId('media-review-workbench').locator('article').first().scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${output}/research-contact-sheet-${locale}-${device}.jpg`, type: 'jpeg', quality: 86 });
          await page.getByTestId('media-review-workbench').locator('article').first().locator('summary').click();
          await page.getByTestId('media-review-workbench').locator('article').first().locator('details').scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${output}/research-evidence-${locale}-${device}.jpg`, type: 'jpeg', quality: 86 });
          await page.goto(`${previewURL}/${locale}?test=gallery-multiple`);
          const gallery = page.getByTestId('media-collection');
          await gallery.scrollIntoViewIfNeeded();
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: `${output}/synthetic-gallery-${locale}-${device}.jpg`, type: 'jpeg', quality: 86 });
          await gallery.getByRole('button', { name: /(?:View image|Переглянути зображення)/ }).first().click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await page.screenshot({ path: `${output}/synthetic-viewer-${locale}-${device}.jpg`, type: 'jpeg', quality: 86 });
        }
        expect(errors).toEqual([]); expect(remote).toEqual([]);
        await page.close();
      }
    } finally { await browser.close(); }
  }
  await writeFile(`${output}/smoke.json`, JSON.stringify({ kind: 'local_imported_archive_smoke_not_release_approval', entities, photographic_approvals: 0, evidence }, null, 2) + '\n');
  console.log(`PASS: ${evidence.length} real-import route/browser/locale/viewport combinations; production review route 404; 32 labeled screenshots.`);
} finally {
  if (preview && preview.exitCode === null) { const closed = new Promise(accept => preview.once('exit', accept)); preview.kill('SIGTERM'); await closed; }
}
