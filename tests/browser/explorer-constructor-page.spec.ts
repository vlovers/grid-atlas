import { test, expect } from '@playwright/test';

// Synthetic test archive: no historical claims.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: constructor profile to two drivers, select and navigate`, async ({ page }) => {
    await page.goto(`/${locale}/constructors/1`);
    const entry = page.getByRole('link', { name: /Explorer/ });
    await expect(entry).toHaveAttribute('href', `/${locale}/explorer/constructors/1?year=1950`);
    await entry.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/constructors/1\\?year=1950$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('alpha');
    await expect(page.locator('svg a[href="#explorer-inspector"]')).toHaveCount(2);
    await page.getByRole('button', { name: 'driver-b' }).click();
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector.getByRole('heading')).toContainText('driver-b');
    await expect(inspector.getByRole('link', {
      name: locale === 'uk' ? /Відкрити профіль пілота/ : /Open driver profile/,
    })).toHaveAttribute('href', `/${locale}/drivers/2`);
    await page.getByRole('spinbutton', { name: locale === 'uk' ? 'Сезон' : 'Season' }).fill('1951');
    await page.getByRole('button', { name: locale === 'uk' ? 'Показати' : 'Explore' }).click();
    await expect(page.getByText(locale === 'uk'
      ? 'У цьому сезоні немає записаних результатів для конструктора.'
      : 'No recorded results for this constructor in this season.')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('button', { name: 'driver-a' })).toBeVisible();
  });
}
