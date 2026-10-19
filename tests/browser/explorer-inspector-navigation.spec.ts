import { test, expect } from '@playwright/test';

// Synthetic archive only. Native navigation works before React hydration.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: inspector next and previous traverse canonical constructor result neighbors`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950`);
    const navigation = page.getByRole('navigation', {
      name: locale === 'uk' ? 'Перемикання зв’язків' : 'Browse connections',
    });
    await expect(navigation).toContainText('1 / 2');
    const next = navigation.getByRole('link', { name: locale === 'uk' ? /Наступний/ : /Next/ });
    await expect(next).toHaveAttribute('href',
      `/${locale}/explorer/constructors/1?year=1950&selected=2#explorer-inspector`);
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/constructors/1\\?year=1950&selected=2#explorer-inspector$`));
    const selectedNavigation = page.getByRole('navigation', {
      name: locale === 'uk' ? 'Перемикання зв’язків' : 'Browse connections',
    });
    await expect(selectedNavigation).toContainText('2 / 2');
    await expect(page.getByRole('button', { name: 'driver-b' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    }).getByRole('heading')).toContainText('driver-b');
    await expect(selectedNavigation.getByText(locale === 'uk' ? /Наступний/ : /Next/)).toHaveAttribute('aria-disabled', 'true');
    await selectedNavigation.getByRole('link', { name: locale === 'uk' ? /Попередній/ : /Previous/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/constructors/1\\?year=1950&selected=1#explorer-inspector$`));
    await expect(page.getByRole('button', { name: 'driver-a' })).toHaveAttribute('aria-pressed', 'true');
  });

  test(`${locale}: single-link driver inspector has no enabled adjacent navigation`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const navigation = page.getByRole('navigation', {
      name: locale === 'uk' ? 'Перемикання зв’язків' : 'Browse connections',
    });
    await expect(navigation).toContainText('1 / 1');
    await expect(navigation.getByRole('link')).toHaveCount(0);
    await expect(navigation.locator('[aria-disabled="true"]')).toHaveCount(2);
  });
}
