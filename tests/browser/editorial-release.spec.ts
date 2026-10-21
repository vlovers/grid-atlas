import { fork, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';
const test = base.extend<object, { releaseReviewURL: string }>({
  releaseReviewURL: [async ({ browserName }, provide) => {
    expect(['chromium', 'webkit', 'firefox']).toContain(browserName);
    let child: ChildProcess | undefined;
    try {
      const url = await new Promise<string>((ready, reject) => {
        child = fork(resolve(__dirname, '../../scripts/preview-editorial-release.mjs'), ['--acknowledge-unreviewed-draft', '--port', '0'], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
        child.once('error', reject); child.once('exit', code => reject(new Error(`Review exited ${code}`)));
        child.once('message', (message: { url: string }) => ready(message.url));
      });
      await provide(url);
    } finally { if (child && child.exitCode === null) { const closed = new Promise<void>(done => child!.once('exit', () => done())); child.kill('SIGTERM'); await closed; } }
  }, { scope: 'worker' }],
});
for (const locale of ['uk', 'en'] as const) {
  const uk = locale === 'uk';
  test(`${locale}: stories keep missing canonical records distinct from invented content`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/${locale}/stories`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(uk ? 'Історії пілотів' : 'Driver stories');
    await expect(page.locator('main article')).toHaveCount(5);
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(page.locator('main a[href*="/stories/ayrton-senna"]')).toHaveCount(0);
    await page.goto(`/${locale}/stories/ayrton-senna`);
    await expect(page.getByRole('heading', { name: uk ? 'Записи недоступні' : 'Records unavailable', exact: true })).toBeVisible();
    await expect(page.getByTestId('published-chapters')).toHaveCount(0);
    await page.goto(`/${locale}/stories/unknown-driver`);
    await expect(page.getByRole('heading', { name: uk ? 'Історію не знайдено' : 'Story not found', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
  test(`${locale}: editorial source disclosure is keyboard accessible and locale gates stay separate`, async ({ page, request }) => {
    const catalogue = await (await request.get('http://127.0.0.1:3339/api/drivers?q=synthetic-105')).json();
    const driver = catalogue.data.find((d: { external_id: string }) => d.external_id === 'synthetic-105');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/drivers/${driver.id}`);
    const chapters = page.getByTestId('published-chapters');
    if (uk) {
      await expect(chapters).toHaveCount(0);
      await expect(page.locator('main')).not.toContainText('Synthetic approved fixture');
    } else {
      await expect(chapters).toContainText('Synthetic browser claim, not a historical assertion.');
      const summary = chapters.locator('details details > summary');
      await expect(summary).toBeVisible();
      await summary.focus();
      await expect(summary).toBeFocused();
      await summary.press('Enter');
      await expect(chapters.locator('details details')).toHaveAttribute('open', '');
      await expect(chapters.getByRole('link', { name: 'Synthetic source', exact: true })).toHaveAttribute('href', 'https://example.org/browser-editorial-source');
      await expect(chapters).toContainText('Synthetic fixture paragraph 1');
      await expect(chapters).toContainText('2026-10-21');
    }
    await expect(page.locator('body')).not.toContainText('PRIVATE UK DRAFT SHOULD NEVER APPEAR');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  });
  test(`${locale}: stories expose a recoverable outage, not an empty import`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:3341/${locale}/stories`);
    await expect(page.locator('main [role=alert]')).toContainText(uk ? 'Історії тимчасово недоступні' : 'Stories are temporarily unavailable');
    await expect(page.getByRole('button', { name: uk ? 'Повторити' : 'Try again', exact: true })).toBeVisible();
  });
}

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: five-driver local review keeps every chapter cited and cannot publish`, async ({ page, request, releaseReviewURL }) => {
    const url = releaseReviewURL.replace(/\/en$/, `/${locale}`), remote: string[] = [];
    page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') remote.push(r.url()); });
    await page.goto(url);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.warning')).toContainText(locale === 'uk' ? 'НЕ СХВАЛЕНО' : 'NOT APPROVED');
    await expect(page.locator('article')).toHaveCount(5);
    await expect(page.locator('button,input,form,img')).toHaveCount(0);
    const chapter = page.locator('#max-verstappen > details').nth(1);
    await chapter.locator(':scope > summary').press('Enter');
    await expect(chapter).toHaveAttribute('open', '');
    await expect(chapter.locator('a').first()).toHaveAttribute('href', 'https://www.formula1.com/en/results/2016/drivers/MAXVER01/max-verstappen');
    expect((await request.get(new URL('/sitemap.xml', url).href)).status()).toBe(404);
    expect((await request.get(new URL('/review/wrong/en', url).href)).status()).toBe(404);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(remote).toEqual([]);
  });
}
