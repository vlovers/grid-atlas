import { test, expect } from '@playwright/test';

// Synthetic PostgreSQL fixture; not a claim about historical Formula 1 data.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: driver to observed constructor and season/back navigation`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1`);
    const explore = page.getByRole('link', {
      name: locale === 'uk' ? /Дослідити зв’язки за сезоном/ : /Explore season connections/,
    });
    await expect(explore).toHaveAttribute('href', `/${locale}/explorer/drivers/1?year=1950`);
    await explore.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/1\\?year=1950$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('driver-a');
    await expect(page.getByRole('link', { name: 'alpha', exact: true })).toHaveAttribute('href', `/${locale}/constructors/1`);
    await page.getByRole('spinbutton', { name: locale === 'uk' ? 'Сезон' : 'Season' }).fill('1951');
    await page.getByRole('button', { name: locale === 'uk' ? 'Показати' : 'Explore' }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/1\\?year=1951$`));
    await expect(page.getByText(locale === 'uk'
      ? 'У цьому сезоні немає записаних результатів для пілота.'
      : 'No recorded results for this driver in this season.')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/1\\?year=1950$`));
    await expect(page.getByRole('link', { name: 'alpha', exact: true })).toBeVisible();
  });
}
