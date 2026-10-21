import { expect, test } from '@playwright/test';

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
      await expect(page.locator('a[href*="/seasons/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/constructors/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/sources"]').first()).toBeVisible();
    });

    test('constructor profile exposes season, driver and race provenance', async ({ page }) => {
      await page.goto(`/${locale}/constructors/1`);
      await expect(page.getByTestId('constructor-archive-portrait')).toBeVisible();
      await expect(page.getByTestId('constructor-driver-history')).toBeVisible();
      await expect(page.locator('a[href*="/drivers/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/seasons/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/sources"]').first()).toBeVisible();
    });

    test('circuit profile exposes recorded winner and decade exploration', async ({ page }) => {
      await page.goto(`/${locale}/circuits/1`);
      await expect(page.getByTestId('circuit-result-legends')).toBeVisible();
      await expect(page.getByTestId('circuit-era-journey')).toBeVisible();
      await expect(page.getByTestId('circuit-decade-history')).toBeVisible();
      await expect(page.locator('a[href*="/races/"]').first()).toBeVisible();
      await expect(page.locator('a[href*="/seasons/"]').first()).toBeVisible();
    });

    test('invalid identifiers never render fabricated profiles', async ({ page }) => {
      for (const entity of ['drivers', 'constructors', 'circuits']) {
        await page.goto(`/${locale}/${entity}/not-a-valid-id`);
        // Next.js may begin streaming before notFound() resolves: HTTP 200 is
        // possible even when the rendered route is the localized 404 state.
        // Assert the substantive safety property instead of transport status.
        await expect(page.getByTestId('driver-showcase')).toHaveCount(0);
        await expect(page.getByTestId('constructor-archive-portrait')).toHaveCount(0);
        await expect(page.getByTestId('circuit-result-legends')).toHaveCount(0);
      }
    });
  });
}
