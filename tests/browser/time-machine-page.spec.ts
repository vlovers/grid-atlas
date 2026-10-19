import { test, expect } from '@playwright/test';

// Synthetic PostgreSQL fixtures only; this suite makes no historical claims.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: driver Time Machine shows removed association and exact graph link`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/compare/drivers/1?fromYear=1950&toYear=1951`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(locale === 'uk' ? 'Машина часу' : 'Time Machine');
    const removed = page.getByRole('region', { name: locale === 'uk' ? 'Лише в першому сезоні' : 'Removed' });
    await expect(removed).toContainText('alpha');
    await expect(removed).toContainText('1950');
    await expect(removed).toContainText(locale === 'uk' ? 'Немає записів' : 'No imported records');
    await expect(removed.getByRole('link', { name: /1950/ })).toHaveAttribute('href',
      `/${locale}/explorer/drivers/1?year=1950&selected=1`);
    await expect(page.getByRole('region', { name: locale === 'uk' ? 'Лише в другому сезоні' : 'Added' }))
      .toContainText(locale === 'uk' ? 'Немає записаних зв’язків' : 'No recorded associations');
    await removed.getByRole('link', { name: /1950/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/1\\?year=1950&selected=1$`));
  });

  test(`${locale}: constructor Time Machine is reciprocal and errors on equal years`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/compare/constructors/1?fromYear=1950&toYear=1951`);
    const removed = page.getByRole('region', { name: locale === 'uk' ? 'Лише в першому сезоні' : 'Removed' });
    await expect(removed).toContainText('driver-a');
    await expect(removed).toContainText('driver-b');
    await expect(removed.getByRole('link', { name: /1950/ })).toHaveCount(2);
    await page.goto(`/${locale}/explorer/compare/constructors/1?fromYear=1950&toYear=1950`);
    await expect(page.getByRole('alert')).toContainText(locale === 'uk'
      ? 'Виберіть два різні роки' : 'Choose two different years');
  });

  test(`${locale}: Explorer offers Time Machine entry point`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const compare = page.getByRole('link', { name: locale === 'uk' ? /Порівняти два сезони/ : /Compare two seasons/ });
    await expect(compare).toHaveAttribute('href',
      `/${locale}/explorer/compare/drivers/1?fromYear=1950&toYear=1951`);
    await compare.click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(locale === 'uk' ? 'Машина часу' : 'Time Machine');
  });
}
