import { test, expect } from '@playwright/test';

// Synthetic PostgreSQL archive fixture, not a historical claim.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: keyboard graph selection reveals accurate inspector and profile link`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    await expect(page.getByRole('img', {
      name: locale === 'uk' ? /Граф зв’язків пілота/ : /Driver connections to/,
    })).toBeVisible();
    const node = page.locator('svg a[href="#explorer-inspector"]');
    await expect(node).toHaveCount(1);
    await node.focus();
    await expect(node).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#explorer-inspector$/);
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector).toBeVisible();
    await expect(inspector.getByRole('heading')).toContainText('alpha');
    await expect(inspector.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(inspector.locator('p').filter({ hasText: /1950/ }).first()).toBeVisible();
    await expect(inspector.getByText('1', { exact: true })).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'alpha' })).toHaveAttribute('aria-pressed', 'true');
    const profile = inspector.getByRole('link', {
      name: locale === 'uk' ? /Відкрити профіль конструктора/ : /Open constructor profile/,
    });
    await expect(profile).toHaveAttribute('href', `/${locale}/constructors/1`);
    await profile.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/constructors/1$`));
  });

  test(`${locale}: list selection uses same inspector as map`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const entry = page.getByRole('button', { name: 'alpha' });
    await entry.click();
    await expect(entry).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    })).toContainText('driver-a');
  });
}
