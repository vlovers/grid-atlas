import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: driver career era rail uses sourced seasons and constructors`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1`);
    const rail = page.getByTestId('driver-era-rail');
    await expect(rail).toBeVisible();
    await expect(rail.locator(`a[href*="/${locale}/drivers/1?season="]`).first()).toBeVisible();
    await expect(rail.locator(`a[href^="/${locale}/constructors/"]`).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
