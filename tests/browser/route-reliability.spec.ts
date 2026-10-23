import { test, expect } from '@playwright/test';
import uk from '../../apps/web/messages/uk.json';
import en from '../../apps/web/messages/en.json';

for (const [locale, messages] of [['uk', uk], ['en', en]] as const) {
  test(`${locale}: all five archive detail routes work directly and through internal links`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/drivers/1', '/constructors/1', '/circuits/1', '/races/1', '/seasons/1950']) {
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.getByRole('heading', { name: messages.UI.errorTitle })).toHaveCount(0);
      const link = page.locator(`main a[href^="/${locale}/"]`).filter({ hasText: /.+/ }).first();
      const href = await link.getAttribute('href');
      await link.click();
      await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.getByRole('heading', { name: messages.UI.errorTitle })).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test(`${locale}: optional editorial outage leaves a working profile and an explicit status`, async ({ page }) => {
    expect((await page.goto(`/${locale}/drivers/2`))?.status()).toBe(200);
    await expect(page.getByTestId('driver-showcase')).toBeVisible();
    await expect(page.getByTestId('editorial-unavailable')).toBeVisible();
    await expect(page.getByRole('heading', { name: messages.UI.errorTitle })).toHaveCount(0);
    await expect(page.locator('main a[href*="/races/"]').first()).toBeAttached();
  });

  test(`${locale}: infrastructure outages remain errors for every detail type`, async ({ page }) => {
    for (const route of ['/drivers/1', '/constructors/1', '/circuits/1', '/races/1', '/seasons/1950']) {
      await page.goto(`http://127.0.0.1:3341/${locale}${route}`);
      await expect(page.getByRole('heading', { name: messages.UI.errorTitle })).toBeVisible();
      await expect(page.getByRole('button', { name: messages.UI.retry })).toBeVisible();
      await expect(page.getByRole('heading', { name: messages.UI.notFoundTitle })).toHaveCount(0);
    }
  });
}
