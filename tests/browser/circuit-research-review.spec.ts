import { fork, type ChildProcess } from 'node:child_process';
import { test, expect } from '@playwright/test';

let server: ChildProcess;
let reviewUrl: string;

test.beforeAll(async () => {
  server = fork('scripts/preview-circuit-v3.mjs', ['--acknowledge-unreviewed-draft', '--port', '0'], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  reviewUrl = await new Promise<string>((resolve, reject) => {
    server.once('message', message => resolve((message as { url: string }).url));
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Private preview exited: ${code}`)));
  });
});
test.afterAll(() => { server?.kill('SIGTERM'); });

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: all 78 private circuit reviews preserve source and numbering boundaries`, async ({ page, request }, testInfo) => {
    const url = reviewUrl.replace(/\/en$/, `/${locale}`);
    const response = await page.goto(url);
    expect(response?.headers()['cache-control']).toBe('no-store');
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('[data-circuit-review]')).toHaveCount(78);
    await expect(page.locator('[data-candidate-position]')).toHaveCount(1015);
    await expect(page.locator('[data-route-section]')).toHaveCount(68);
    await expect(page.locator('[data-historical-study]')).toHaveCount(66);
    // The ten period supplements do not add ten F1 circuit identities.
    await expect(page.locator('[data-period-supplement]')).toHaveCount(10);
    await expect(page.locator('[data-period-supplement-section]')).toHaveCount(20);
    const supplements = ['bremgarten', 'bugatti', 'caesars-palace', 'jacarepagua', 'monsanto',
      'mont-tremblant', 'nivelles', 'pedralbes', 'phoenix', 'riverside'];
    for (const id of supplements) {
      const target = '#period-supplement-' + id;
      const link = page.locator('nav a[href="' + target + '"]');
      await expect(link).toHaveCount(1);
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(target + '
    await expect(page.locator('button, form, input')).toHaveCount(0);
    await expect(page.getByText(locale === 'en' ? 'UNPUBLISHED DRAFT · NOT APPROVED' : 'НЕОПУБЛІКОВАНА ЧЕРНЕТКА · НЕ СХВАЛЕНО', { exact: true })).toBeVisible();
    const integrity = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
      const missing = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash);
      const invalidSources = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')].filter(link => link.protocol !== 'https:').map(link => link.href);
      return { duplicateIds: ids.length - new Set(ids).size, missing, invalidSources };
    });
    expect(integrity).toEqual({ duplicateIds: 0, missing: [], invalidSources: [] });
    for (const id of ['ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring']) {
      const link = page.locator(`a[href="#study-${id}"]`).first();
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`#study-${id}$`));
      const route = page.locator(`#study-${id}`);
      await expect(route.locator('h3').first()).toBeInViewport();
      await expect(route).toContainText(locale === 'en' ? 'Apex numbering has not been verified' : 'Нумерацію апексів не підтверджено');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    const dallas = page.locator('#study-dallas');
    await dallas.locator('details').filter({ has: page.locator('[data-historical-study]') }).locator('summary').press('Enter');
    await expect(dallas.locator('[data-historical-study]').first()).toBeVisible();
    await expect(dallas).toContainText(locale === 'en' ? 'Evidence gap' : 'Прогалина в доказах');
    await dallas.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`private-dallas-${locale}.png`) });
    for (const id of ['bugatti', 'mont-tremblant', 'brands-hatch', 'austin', 'bahrain']) {
      const section = page.locator(`[data-circuit-review="${id}"]`);
      await expect(section.locator('[data-candidate-position]').first()).toBeAttached();
      if (['bugatti', 'mont-tremblant', 'brands-hatch'].includes(id)) {
        await expect(section.locator('[data-candidate-position]').first()).toContainText(locale === 'en' ? 'Study ' : 'Позиція ');
      }
    }
    await page.locator('a[href="#bugatti"]').first().click();
    await expect(page.locator('#bugatti')).toContainText(locale === 'en' ? '1967 race record has 8' : 'у записі гонки 1967 року — 8');
    await page.screenshot({ path: testInfo.outputPath(`private-bugatti-${locale}.png`) });
    expect((await request.get(new URL('/en', url).href)).status()).toBe(404);
    expect((await request.post(url)).status()).toBe(404);
  });
}
));
      const section = page.locator('[data-period-supplement][id="period-supplement-' + id + '"]');
      await expect(section.locator('h3')).toBeInViewport();
      await expect(section.locator('[data-period-supplement-section]')).toHaveCount(2);
      await expect(section).toContainText(locale === 'en'
        ? 'Period-layout research. Apex numbering'
        : 'Дослідження історичної конфігурації. Нумерація апексів');
      await expect(section.locator('img, svg')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await expect(page.locator('button, form, input')).toHaveCount(0);
    await expect(page.getByText(locale === 'en' ? 'UNPUBLISHED DRAFT · NOT APPROVED' : 'НЕОПУБЛІКОВАНА ЧЕРНЕТКА · НЕ СХВАЛЕНО', { exact: true })).toBeVisible();
    const integrity = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
      const missing = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash);
      const invalidSources = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')].filter(link => link.protocol !== 'https:').map(link => link.href);
      return { duplicateIds: ids.length - new Set(ids).size, missing, invalidSources };
    });
    expect(integrity).toEqual({ duplicateIds: 0, missing: [], invalidSources: [] });
    for (const id of ['ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring']) {
      const link = page.locator(`a[href="#study-${id}"]`).first();
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`#study-${id}$`));
      const route = page.locator(`#study-${id}`);
      await expect(route.locator('h3').first()).toBeInViewport();
      await expect(route).toContainText(locale === 'en' ? 'Apex numbering has not been verified' : 'Нумерацію апексів не підтверджено');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    const dallas = page.locator('#study-dallas');
    await dallas.locator('details').filter({ has: page.locator('[data-historical-study]') }).locator('summary').press('Enter');
    await expect(dallas.locator('[data-historical-study]').first()).toBeVisible();
    await expect(dallas).toContainText(locale === 'en' ? 'Evidence gap' : 'Прогалина в доказах');
    await dallas.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`private-dallas-${locale}.png`) });
    for (const id of ['bugatti', 'mont-tremblant', 'brands-hatch', 'austin', 'bahrain']) {
      const section = page.locator(`[data-circuit-review="${id}"]`);
      await expect(section.locator('[data-candidate-position]').first()).toBeAttached();
      if (['bugatti', 'mont-tremblant', 'brands-hatch'].includes(id)) {
        await expect(section.locator('[data-candidate-position]').first()).toContainText(locale === 'en' ? 'Study ' : 'Позиція ');
      }
    }
    await page.locator('a[href="#bugatti"]').first().click();
    await expect(page.locator('#bugatti')).toContainText(locale === 'en' ? '1967 race record has 8' : 'у записі гонки 1967 року — 8');
    await page.screenshot({ path: testInfo.outputPath(`private-bugatti-${locale}.png`) });
    expect((await request.get(new URL('/en', url).href)).status()).toBe(404);
    expect((await request.post(url)).status()).toBe(404);
  });
}
