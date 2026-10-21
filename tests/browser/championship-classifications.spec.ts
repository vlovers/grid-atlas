import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: source standings are presented separately from race-result data`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950`);
    await expect(page.getByTestId('championship-drivers-season')).toBeVisible();
    await expect(page.getByTestId('championship-constructors-season')).toBeVisible();
    await expect(page.getByTestId('championship-drivers-season')).toContainText(
      locale === 'uk' ? 'класифікація' : 'source-reported');
  });

  test(`${locale}: driver and constructor show source classification history`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1`);
    await expect(page.getByTestId('championship-drivers-career')).toBeVisible();
    await page.goto(`/${locale}/constructors/1`);
    await expect(page.getByTestId('championship-constructors-career')).toBeVisible();
  });
}
