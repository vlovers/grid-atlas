import { expect, test } from '@playwright/test';
import uk from '../../apps/web/messages/uk.json';
import en from '../../apps/web/messages/en.json';

/**
 * Entity encyclopedia acceptance coverage.
 * No editorial manuscript or published-article dependency: every profile is
 * required to work directly from the pinned historical archive.
 */
for (const locale of ['uk', 'en'] as const) {
  test.describe(`${locale}: complete encyclopedia entity journeys`, () => {
    test('driver profile exposes archive evidence and structured career navigation', async ({ page }) => {
      await page.goto(`/${locale}/drivers/1`);
      await expect(page.getByTestId('driver-showcase')).toBeVisible();
      await expect(page.getByTestId('driver-archive-overview')).toBeVisible();
      await expect(page.getByTestId('identity-facts')).toContainText('Synthetic driver full name');
      await expect(page.getByTestId('identity-facts').getByRole('definition')).toContainText(['0']);
      await expect(page.locator('a[href*="/seasons/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/constructors/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/sources"]').first()).toBeVisible();
    });

    test('constructor profile exposes season, driver and race provenance', async ({ page }) => {
      await page.goto(`/${locale}/constructors/1`);
      await expect(page.getByTestId('constructor-archive-portrait')).toBeVisible();
      await expect(page.getByTestId('constructor-driver-history')).toBeVisible();
      await expect(page.getByTestId('identity-facts')).toContainText('Synthetic Country');
      await expect(page.locator('a[href*="/drivers/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/seasons/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/sources"]').first()).toBeVisible();
    });

    test('circuit profile exposes recorded winner and decade exploration', async ({ page }) => {
      await page.goto(`/${locale}/circuits/1`);
      await expect(page.getByTestId('circuit-result-legends')).toBeVisible();
      await expect(page.getByTestId('circuit-era-journey')).toBeVisible();
      await expect(page.getByTestId('circuit-decade-history')).toBeVisible();
      await expect(page.getByTestId('identity-facts')).toContainText('Synthetic City');
      await expect(page.locator('a[href*="/races/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/seasons/"]').first()).toBeVisible();
    });

    test('invalid identifiers never render fabricated profiles', async ({ page }) => {
      for (const entity of ['drivers', 'constructors', 'circuits']) {
        const response = await page.goto(`/${locale}/${entity}/not-a-valid-id`);
        // Next.js may begin streaming before notFound() resolves: HTTP 200 is
        // possible even when the rendered route is the localized 404 state.
        // Assert the substantive safety property instead of transport status.
        expect([200, 404]).toContain(response?.status());
        await expect(page.getByRole('heading', { name: (locale === 'uk' ? uk : en).UI.notFoundTitle })).toBeVisible();
        await expect(page.locator('meta[name="robots"][content~="noindex"]').first()).toBeAttached();
        await expect(page.getByTestId('driver-showcase')).toHaveCount(0);
        await expect(page.getByTestId('constructor-archive-portrait')).toHaveCount(0);
        await expect(page.getByTestId('circuit-result-legends')).toHaveCount(0);
      }
    });

    test('known identities without result evidence retain useful empty profiles', async ({ page }) => {
      for (const path of ['drivers/3', 'constructors/2', 'circuits/2']) {
        await page.goto(`/${locale}/${path}`);
        await expect(page.getByTestId('identity-facts')).toBeVisible();
        await expect(page.getByTestId('identity-facts')).toContainText(locale === 'uk'
          ? 'Додаткові поля ідентичності ще не імпортовано.' : 'Additional identity fields have not been imported.');
        await expect(page.locator('meta[name="robots"][content~="noindex"]')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
    });
  });
}
