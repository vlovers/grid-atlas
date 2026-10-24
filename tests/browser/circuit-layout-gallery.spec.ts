import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: circuit layout gallery only displays sourced local diagrams`, async ({ page }) => {
    const external: string[] = [];
    page.on('request', request => {
      if (!/^(localhost|127\.0\.0\.1)$/.test(new URL(request.url()).hostname)) external.push(request.url());
    });
    await page.goto(`/${locale}/circuits/1`);
    const gallery = page.getByTestId('circuit-artwork-gallery');
    if (await gallery.count()) {
      const figures = gallery.locator('figure');
      expect(await figures.count()).toBeGreaterThan(0);
      const paths = await figures.locator('img').evaluateAll(images => images.map(img => img.getAttribute('src')));
      expect(paths.every(path => /^\/circuit-layouts\/[a-z0-9-]+\.svg$/.test(path ?? ''))).toBe(true);
      await expect(figures.first().locator('a[href^="https://github.com/f1db/f1db/"]')).toHaveCount(1);
      await expect(figures.first().locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(1);
      await expect(figures.first().locator('img')).toHaveAttribute('alt', /.+/);
    }
    expect(external).toEqual([]);
  });
}
