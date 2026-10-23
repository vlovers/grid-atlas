import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  for (const width of [390, 1024, 1440] as const) {
    test(`${locale}: career chart at ${width}px is readable and links to recorded seasons`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/drivers/1?season=1950`);
      const chart = page.getByTestId('driver-season-chart');
      await expect(chart).toBeVisible();
      await expect(chart.getByRole('heading')).toHaveText(locale === 'uk' ? 'Ритм кар’єри' : 'The rhythm of a career');
      const links = chart.locator('ol a');
      expect(await links.count()).toBeGreaterThan(0);
      const years = await links.evaluateAll(nodes => nodes.map(n => Number(n.querySelector('strong')?.textContent)));
      expect(years).toEqual([...years].sort((a, b) => a - b));
      for (const link of await links.all()) {
        const year = await link.locator('strong').innerText();
        await expect(link).toHaveAttribute('href', new RegExp(`^/${locale}/drivers/1\\?season=${year}#driver-career$`));
        await expect(link).toHaveAttribute('aria-label', /[0-9]/);
      }
      await expect(chart.locator('a[aria-current="true"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }
  test(`${locale}: chart remains usable without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto(`http://127.0.0.1:3340/${locale}/drivers/1?season=1950`);
      const chart = page.getByTestId('driver-season-chart');
      await expect(chart).toBeVisible();
      await expect(chart.locator('ol a').first()).toHaveAttribute('href', /season=1950#driver-career$/);
    } finally { await context.close(); }
  });
}
