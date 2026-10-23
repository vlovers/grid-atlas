import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: race constructor field links to sourced drivers and constructors`, async ({ page }) => {
    await page.goto(`/${locale}/races/1`);
    const field = page.getByTestId('race-constructor-field');
    await expect(field).toBeVisible();
    await expect(field.getByRole('heading', { level: 2 })).toBeVisible();
    const cards = field.locator('article');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first().locator(`a[href^="/${locale}/constructors/"]`)).toBeVisible();
    await expect(cards.first().locator(`a[href^="/${locale}/drivers/"]`).first()).toBeVisible();
    await expect(field).toContainText(locale === 'uk' ? 'не більше 100' : 'maximum 100');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
