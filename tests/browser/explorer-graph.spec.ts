import { test, expect } from '@playwright/test';

// Synthetic PostgreSQL archive fixture, not a historical claim.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: graphical Explorer links remain keyboard-operable with list fallback`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const diagram = page.getByRole('img', {
      name: locale === 'uk' ? /Граф зв’язків пілота/ : /Driver connections to/,
    });
    await expect(diagram).toBeVisible();
    const node = page.locator('svg a[href="' + `/${locale}/constructors/1` + '"]');
    await expect(node).toHaveCount(1);
    await node.focus();
    await expect(node).toBeFocused();
    await expect(page.getByRole('listitem').filter({
      has: page.getByRole('link', { name: 'alpha', exact: true }),
    })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/constructors/1$`));
  });
}
