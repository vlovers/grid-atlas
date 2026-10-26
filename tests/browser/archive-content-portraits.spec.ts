import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: season cover uses separate source standings and one full calendar`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950`);
    await expect(page.getByTestId('season-cover')).toBeVisible();
    await expect(page.getByTestId('season-cover')).toContainText('F1DB');
    await expect(page.getByTestId('season-calendar').locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(page.getByTestId('season-archive-story')).toHaveCount(0);
  });

  test(`${locale}: constructor history portrait links source-backed drivers`, async ({ page }) => {
    await page.goto(`/${locale}/constructors/1`);
    const story = page.getByTestId('constructor-archive-portrait');
    await expect(story).toBeVisible();
    await expect(story).toContainText(locale === 'uk' ? 'протокол' : 'race-result');
    await expect(story).toContainText(locale === 'uk' ? 'не виводяться' : 'not inferred');
  });

  test(`${locale}: circuit winning-driver coverage is source bounded`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const story = page.getByTestId('circuit-result-legends');
    await expect(story).toBeVisible();
    await expect(story).toContainText(locale === 'uk' ? 'першою позицією' : 'first-position');
    await expect(story).toContainText(locale === 'uk' ? 'не універсальний' : 'not an official');
  });
}
