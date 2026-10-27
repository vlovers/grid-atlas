import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: season journey links real rounds in chronological order`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950`);
    const journey = page.getByTestId('season-calendar');
    await expect(journey).toBeVisible();
    const links = journey.locator('a[href*="/races/"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId('season-visual-journey')).toHaveCount(0);
    await expect(journey).toContainText(locale === 'uk' ? 'Календар Гран-прі' : 'Grand Prix calendar');
    const first = await links.first().getAttribute('href');
    expect(first).toContain(`/${locale}/races/`);
    await links.first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/races/[0-9]+`));
    await expect(page.getByTestId('race-visual-journey')).toBeVisible();
  });

  test(`${locale}: circuit journey links archival race results`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const journey = page.getByTestId('circuit-visual-journey');
    await expect(journey).toBeVisible();
    await expect(journey.locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(journey).toContainText(locale === 'uk' ? 'Гран-прі крізь роки' : 'Grands Prix across the years');
  });

  test(`${locale}: race journey links season and circuit without claiming an official winner`, async ({ page }) => {
    await page.goto(`/${locale}/races/1`);
    const journey = page.getByTestId('race-visual-journey');
    await expect(journey).toBeVisible();
    await expect(journey.locator('a[href*="/seasons/"]').first()).toBeVisible();
    await expect(journey.locator('a[href*="/circuits/"]').first()).toBeVisible();
    await expect(journey).toContainText(locale === 'uk' ? 'Перша позиція у протоколі' : 'First-position result entry');
  });
}
