import { fork, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';

const test = base.extend<object, { reviewURL: string }>({
  reviewURL: [async ({ browserName }, provide) => {
    expect(browserName).toBe('chromium');
    let child: ChildProcess | undefined;
    try {
      const url = await new Promise<string>((ready, reject) => {
        child = fork(resolve(__dirname, '../../scripts/preview-story-review.mjs'), ['--acknowledge-unreviewed-draft', '--port', '0'],
          { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
        child.once('error', reject);
        child.once('exit', code => reject(new Error(`Local review exited: ${code}`)));
        child.once('message', (message: { url: string }) => ready(message.url));
      });
      await provide(url);
    } finally {
      if (child && child.exitCode === null) {
        const closed = new Promise<void>(done => child!.once('exit', () => done()));
        child.kill('SIGTERM'); await closed;
      }
    }
  }, { scope: 'worker' }],
});

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: opt-in local research review remains visibly unapproved and separate from public routes`, async ({ page, reviewURL, request }) => {
    const url = reviewURL.replace(/\/en$/, `/${locale}`);
    const remote: string[] = [];
    page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') remote.push(r.url()); });
    await page.goto(url);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByText(locale === 'uk' ? 'НЕОПУБЛІКОВАНА ДОСЛІДНИЦЬКА ЧЕРНЕТКА · НЕ СХВАЛЕНО' : 'UNPUBLISHED RESEARCH DRAFT · NOT APPROVED', { exact: true })).toBeVisible();
    await expect(page.locator('section[id^="review-"]')).toHaveCount(6);
    await expect(page.locator('a[href*="/drivers/"]')).toHaveCount(0);
    await expect(page.locator('img')).toHaveCount(0);
    await expect(page.locator('button,input,form')).toHaveCount(0);
    expect(remote).toEqual([]);
    await page.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(page.locator('details')).toHaveAttribute('open', '');
    expect((await request.get(new URL('/sitemap.xml', url).href)).status()).toBe(404);
    expect((await request.get(new URL('/review/wrong/en', url).href)).status()).toBe(404);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
