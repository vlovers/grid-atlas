import { test, expect } from '@playwright/test';
import uk from '../../apps/web/messages/uk.json';
import en from '../../apps/web/messages/en.json';

for (const [locale, messages] of [['uk', uk], ['en', en]] as const) {
  test.describe(locale, () => {
    const t = messages.UI;
    const path = (value: string) => `/${locale}${value}`;

    test('search preserves locale/query across pages and resets page on submit', async ({ page }) => {
      await page.goto(path('/drivers?q=Synthetic'));
      await expect(page.locator('.driver-grid > a')).toHaveCount(100);
      await page.getByRole('link', { name: `${t.next} →`, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/drivers\\?q=Synthetic&page=2`));
      await expect(page.locator('.driver-grid > a')).toHaveCount(5);
      await page.getByLabel(t.searchLabel).fill('driver-a');
      await page.getByRole('button', { name: t.search, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/drivers\\?q=driver-a$`));
      await expect(page.locator('.driver-grid > a')).toHaveCount(1);
      await page.locator('.driver-grid > a').click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('driver-a');
      await expect(page).toHaveURL(new RegExp(`/${locale}/drivers/1$`));
    });

    test('empty search is clear and can be reset', async ({ page }) => {
      await page.goto(path('/constructors?q=no-match'));
      await expect(page.getByText(t.noMatches, { exact: true })).toBeVisible();
      await page.getByRole('link', { name: t.resetSearch }).click();
      await expect(page.locator('.driver-grid > a')).toHaveCount(2);
      await expect(page).toHaveURL(new RegExp(`/${locale}/constructors$`));
    });

    test('circuit, race, profile and source identities stay unchanged', async ({ page }) => {
      await page.goto(path('/circuits?q=circuit-fixture'));
      await page.locator('.driver-grid > a').click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('100%_ Test Circuit');
      await page.getByRole('link', { name: /Synthetic shared-car race/ }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synthetic shared-car race');
      await expect(page.getByText(t.sharedCar, { exact: true })).toHaveCount(2);
      await expect(page.getByRole('link', { name: 'driver-a ↗' })).toHaveAttribute('href', path('/drivers/1'));
      await expect(page.getByRole('link', { name: 'alpha ↗', exact: true }).first()).toHaveAttribute('href', path('/constructors/1'));
      await page.getByRole('link', { name: `← ${t.seasonTitle.replace('{year}', '1950')}` }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.seasonTitle.replace('{year}', '1950'));
    });

    test('missing profiles and unknown paths retain localized fallback and retry', async ({ page }) => {
      for (const value of ['/drivers/999999', '/constructors/999999', '/entrants/999999', '/circuits/999999', '/races/999999', '/seasons/2199', '/unknown', '/missing.txt']) {
        const response = await page.goto(path(value));
        // Next preserves 200 once streaming has started; missing pages must still
        // opt out of indexing in both streamed and non-streamed responses.
        expect([200, 404]).toContain(response?.status());
        await expect(page.getByRole('heading', { name: t.notFoundTitle })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('meta[name="robots"][content~="noindex"]').first()).toBeAttached();
      }
      await page.goto(`http://127.0.0.1:3341${path('/drivers')}`);
      await expect(page.getByRole('heading', { name: t.errorTitle })).toBeVisible();
      await expect(page.getByRole('button', { name: t.retry })).toBeVisible();
    });

    test('source page preserves registered release, checksum and attribution', async ({ page }) => {
      await page.goto(path(''));
      await page.getByRole('link', { name: `${t.sourceLink} ↗` }).click();
      await expect(page.getByRole('heading', { name: /SYNTHETIC.*vfixture/ })).toBeVisible();
      await expect(page.getByText('a'.repeat(64), { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    });

    test('lineage evidence, keyboard selection and zoom are localized', async ({ page }) => {
      await page.goto(path('/lineage'));
      await page.getByRole('button', { name: t.map, exact: true }).click();
      await page.getByRole('button', { name: `alpha → beta, ${t.renamed_to}` }).first().focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('complementary', { name: t.transitionDetails })).toBeVisible();
      await expect(page.getByRole('link', { name: 'verified fixture ↗' })).toHaveAttribute('href', 'https://example.org/constructor/verified');
      await page.getByRole('button', { name: t.zoomIn }).click();
      await expect(page.getByText(t.zoom.replace('{percent}', '125'), { exact: true })).toBeVisible();
      expect(await page.locator('svg rect').first().evaluate(node => getComputedStyle(node).fill)).toBe('rgb(20, 27, 34)');
      expect(Number(await page.locator('svg line').first().getAttribute('x2'))).toBeLessThan(Number(await page.locator('svg rect').nth(1).getAttribute('x')));
    });

    test('navigation and metadata are localized with no Russian interface copy', async ({ page }) => {
      for (const value of ['', '/drivers', '/constructors', '/circuits/1', '/races/1', '/sources', '/lineage']) {
        await page.goto(path(value));
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        expect(await page.locator('body').innerText()).not.toMatch(/[ыэъёЫЭЪЁ]/u);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), value).toBeLessThanOrEqual(1);
        const internal = await page.locator('a[href^="/"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
        expect(internal.every(href => /^\/(uk|en)(\/|\?|$)/.test(href ?? ''))).toBe(true);
      }
      await page.goto(path('/drivers'));
      await expect(page).toHaveTitle(`${t.driversTitle} | GRID ATLAS`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', t.metadataDescription);
      await expect(page.getByRole('navigation', { name: t.mainNavigation }).getByRole('link', { name: t.circuitsTitle })).toBeVisible();
    });
  });
}
