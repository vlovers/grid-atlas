import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: reusable driver showcase merges same-race milestones and preserves shared-car evidence`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1`);
    const profile = page.getByTestId('driver-showcase');
    await expect(profile.getByRole('heading', { level: 1 })).toHaveText('driver-a');
    await expect(profile.locator('#driver-moments > ol > li')).toHaveCount(1);
    await expect(profile.locator('#driver-moments')).toContainText(locale === 'uk' ? 'Спільний автомобіль' : 'Shared car');
    await expect(profile.locator('#driver-moments h3 a')).toHaveAttribute('href', `/${locale}/races/1?from=%2Fdrivers%2F1`);
    await expect(profile.locator('a[href*="/time-machine?"]')).toHaveCount(0);
    await expect(profile.locator('details[open]')).toHaveCount(0);
    await expect(profile.getByText(locale === 'uk' ? 'Біографія очікує на публікацію' : 'Biography awaiting publication', { exact: true })).toBeVisible();
    await profile.locator('#driver-seasons > summary').press('Enter');
    await expect(profile.getByRole('table').first()).toBeVisible();
    await expect(profile.locator('#driver-seasons tbody tr')).toHaveCount(1);
    await page.goto(`/${locale}/drivers/1?season=2199&season=1950`);
    await expect(profile.locator('nav a[aria-current="true"]')).toHaveText('1950');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test(`${locale}: an unrelated driver without results has no invented season, team, race or championship`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/3`);
    const profile = page.getByTestId('driver-showcase');
    await expect(profile.getByRole('heading', { level: 1 })).toHaveText('Synthetic Driver 001');
    await expect(profile.locator('#driver-moments > ol > li')).toHaveCount(0);
    await expect(profile.locator('#driver-teams > ol > li')).toHaveCount(0);
    await expect(profile.locator('a[href*="/time-machine?"]')).toHaveCount(0);
    await expect(profile.locator('a[href*="/races/"]')).toHaveCount(0);
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
