import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: driver season and race preserve return context`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1?season=1950`);
    const season = page.locator('a[href*="/seasons/1950?from="]').first();
    await expect(season).toBeVisible();
    await season.click();
    await expect(page.getByTestId('archive-return-context').getByRole('link')).toHaveAttribute('href', `/${locale}/drivers/1`);
    const race = page.locator('a[href*="/races/"][href*="from="]').first();
    await expect(race).toBeVisible();
    await race.click();
    const back = page.getByTestId('archive-return-context').getByRole('link');
    await expect(back).toHaveAttribute('href', `/${locale}/drivers/1`);
    await back.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/drivers/1$`));
  });

  test(`${locale}: unsafe return targets are ignored`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950?from=https%3A%2F%2Fevil.example`);
    await expect(page.getByTestId('archive-return-context')).toHaveCount(0);
    await page.goto(`/${locale}/races/1?from=%2F%2Fevil.example`);
    await expect(page.getByTestId('archive-return-context')).toHaveCount(0);
  });

  test(`${locale}: circuit race returns to circuit profile`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const race = page.locator('a[href*="/races/"][href*="from="]').first();
    await expect(race).toBeVisible();
    await race.click();
    await expect(page.getByTestId('archive-return-context').getByRole('link')).toHaveAttribute('href', `/${locale}/circuits/1`);
  });
}
