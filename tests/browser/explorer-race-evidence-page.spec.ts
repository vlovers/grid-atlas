import { test, expect } from '@playwright/test';

// Browser data comes from owned synthetic PostgreSQL fixtures.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: selected driver graph edge opens observed race evidence and returns`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950&selected=1`);
    await page.getByRole('link', {
      name: locale === 'uk' ? /Переглянути гонки, що підтверджують зв’язок/ : /See races behind this connection/,
    }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/evidence/1/1\\?year=1950&from=driver&selected=1$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale === 'uk'
      ? 'Гонки, що підтверджують зв’язок' : 'Races behind this connection');
    await expect(page.getByRole('link', { name: /Synthetic shared-car race/ })).toHaveAttribute('href', `/${locale}/races/1`);
    const back = page.getByRole('link', { name: locale === 'uk' ? /Повернутися до графа/ : /Back to graph/ });
    await expect(back).toHaveAttribute('href', `/${locale}/explorer/drivers/1?year=1950&selected=1`);
    await back.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/1\\?year=1950&selected=1$`));
  });

  test(`${locale}: constructor graph uses same evidence pair but preserves return focus`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950&selected=1`);
    await page.getByRole('link', {
      name: locale === 'uk' ? /Переглянути гонки, що підтверджують зв’язок/ : /See races behind this connection/,
    }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/evidence/1/1\\?year=1950&from=constructor&selected=1$`));
    const back = page.getByRole('link', { name: locale === 'uk' ? /Повернутися до графа/ : /Back to graph/ });
    await expect(back).toHaveAttribute('href', `/${locale}/explorer/constructors/1?year=1950&selected=1`);
    await back.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/constructors/1\\?year=1950&selected=1$`));
  });

  test(`${locale}: selected alternate driver persists via evidence return`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950`);
    const alternate = page.getByRole('button', { name: 'driver-b' });
    await alternate.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/constructors/1\\?year=1950&selected=2$`));
    await expect(alternate).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('link', { name: locale === 'uk' ? /Переглянути гонки, що підтверджують зв’язок/ : /See races behind this connection/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/evidence/2/1\\?year=1950&from=constructor&selected=2$`));
    const back = page.getByRole('link', { name: locale === 'uk' ? /Повернутися до графа/ : /Back to graph/ });
    await expect(back).toHaveAttribute('href', `/${locale}/explorer/constructors/1?year=1950&selected=2`);
    await back.click();
    await expect(page.getByRole('button', { name: 'driver-b' })).toHaveAttribute('aria-pressed', 'true');
  });
  test(`${locale}: pair with no results shows explicit empty evidence`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/evidence/1/1?year=1951`);
    await expect(page.getByText(locale === 'uk'
      ? 'У вибраному сезоні немає записів для цієї пари.'
      : 'No recorded results for this pair in this season.')).toBeVisible();
  });
}
