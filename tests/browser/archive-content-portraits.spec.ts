import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: season portrait is built from archive evidence`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950`);
    const story = page.getByTestId('season-archive-story');
    await expect(story).toBeVisible();
    await expect(story.locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(story).toContainText(locale === 'uk' ? 'результат' : 'result');
    await expect(story).toContainText(locale === 'uk' ? 'не є офіційним' : 'not an official');
  });

  test(`${locale}: circuit winning-driver coverage is source bounded`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const story = page.getByTestId('circuit-result-legends');
    await expect(story).toBeVisible();
    await expect(story).toContainText(locale === 'uk' ? 'першою позицією' : 'first-position');
    await expect(story).toContainText(locale === 'uk' ? 'не універсальний' : 'not an official');
  });
}
