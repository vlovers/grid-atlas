import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: calendar is a single complete, keyboard-operable list`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/1950`);
    const calendar = page.getByTestId('season-calendar');
    await expect(calendar).toHaveCount(1);
    const links = calendar.locator('h3 a');
    expect(await links.count()).toBeGreaterThan(0);
    await expect(page.getByTestId('season-journey')).toHaveCount(0);
    await expect(page.getByTestId('season-visual-journey')).toHaveCount(0);
    await expect(page.getByTestId('season-stories')).toHaveCount(0);
    await links.first().press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/races/[0-9]+`));
  });

  test(`${locale}: empty photographs use one compact disclosure and preserve their rights gate`, async ({ page }) => {
    await page.goto(`/${locale}/constructors/1`);
    const media = page.getByTestId('media-collection');
    await expect(media).not.toHaveAttribute('open');
    expect(await media.evaluate(node => node.getBoundingClientRect().height)).toBeLessThan(100);
    await media.locator('summary').press('Enter');
    await expect(page.getByTestId('editorial-empty-media')).toBeVisible();
    await expect(media.locator('img')).toHaveCount(0);
    await expect(media.locator('a[href$="/sources"]')).toBeVisible();
  });
}
