import { test, expect } from '@playwright/test';

// Synthetic archive fixtures; visual styling must not change result semantics.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: graph viewport remains keyboard-scrollable with a full list`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950`);
    const viewport = page.getByRole('region', {
      name: locale === 'uk' ? 'Прокручувана карта зв’язків' : 'Scrollable connection map',
    });
    await expect(viewport).toBeVisible();
    await viewport.focus();
    await expect(viewport).toBeFocused();
    await expect(page.locator('svg a[href="#explorer-inspector"]')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'driver-a' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'driver-b' })).toBeVisible();
  });

  test(`${locale}: reduced motion removes orbit animation without hiding connections`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    // SVG class is CSS-module generated; target the orbit by its static radius.
    const ring = page.locator('svg circle[r="114"]');
    await expect(ring).toBeVisible();
    expect(await ring.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await expect(page.locator('svg a[href="#explorer-inspector"]')).toHaveCount(1);
  });
}
