import { test, expect } from '@playwright/test';

// All values come from synthetic PostgreSQL result fixtures, not verified biography.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: evidence inspector explains counts and limitations from returned result records`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950&selected=2`);
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector.getByRole('heading', { level: 2 })).toContainText('driver-b');
    const context = inspector.getByLabel(locale === 'uk'
      ? 'Пояснення даних результатів' : 'Understanding result records');
    await expect(context).toBeVisible();
    await expect(context.getByRole('heading', { level: 3 })).toHaveText(locale === 'uk'
      ? 'Що означає цей зв’язок?' : 'What does this connection mean?');
    await expect(context).toContainText('1950');
    await expect(context).toContainText('driver-b');
    await expect(context).toContainText('alpha');
    await expect(context).toContainText(locale === 'uk' ? 'запис' : 'record');
    await expect(inspector.getByRole('link', {
      name: locale === 'uk' ? /Переглянути гонки/ : /See races behind this connection/,
    })).toHaveAttribute('href',
      `/${locale}/explorer/evidence/2/1?year=1950&from=constructor&selected=2`);
  });
  test(`${locale}: driver inspector avoids presenting imported result counts as official starts`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const context = page.getByLabel(locale === 'uk'
      ? 'Пояснення даних результатів' : 'Understanding result records');
    await expect(context).toContainText(locale === 'uk' ? 'гонк' : 'races');
    await expect(context).toContainText(locale === 'uk' ? 'перемож' : 'winning');
    await expect(page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    })).toContainText(locale === 'uk'
      ? 'не доказ офіційних стартів' : 'not evidence of official starts');
  });
}
