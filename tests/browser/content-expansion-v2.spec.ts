import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: circuit history connects verified race evidence`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const journey = page.getByTestId('circuit-era-journey');
    await expect(journey).toBeVisible();
    expect(await journey.locator('ol li').count()).toBeGreaterThan(0);
    await expect(journey.locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(journey).toContainText(locale === 'uk' ? 'конфігурацію' : 'layout');
  });

  test(`${locale}: constructor eras expose recorded seasons without title claims`, async ({ page }) => {
    await page.goto(`/${locale}/constructors/1`);
    const eras = page.getByTestId('constructor-key-eras');
    await expect(eras).toBeVisible();
    await expect(eras.locator('a[href*="/seasons/"]').first()).toBeVisible();
    await expect(eras).toContainText(locale === 'uk' ? 'не рейтинг' : 'not official championship');
  });

  test(`${locale}: season and race pages expose evidence journeys`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950`);
    const season = page.getByTestId('season-calendar');
    await expect(season).toBeVisible();
    await expect(season.locator('a[href*="/races/"]').first()).toBeVisible();
    await page.goto(`/${locale}/races/1`);
    const race = page.getByTestId('race-evidence-journey');
    await expect(race).toBeVisible();
    await expect(race.locator('a[href*="/seasons/"]').first()).toBeVisible();
    await expect(race.locator('a[href*="/drivers/"]').first()).toBeVisible();
  });
}
