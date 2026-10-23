import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: circuit metadata describes the available historical layouts`, async ({ page }) => {
    const description = locale === 'en' ? 'historical circuit layouts' : 'історичні конфігурації трас';
    for (const route of ['/circuits', '/circuits/1']) {
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', new RegExp(description));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://127.0.0.1:3340/${locale}${route}`);
      const html = await response!.text();
      expect(html).toContain(description);
      expect(html).not.toMatch(/Individual layout histories are not yet represented|Історію окремих конфігурацій поки не представлено/);
    }
  });
}
