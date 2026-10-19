import { test, expect } from '@playwright/test';

// Owned synthetic archive; reciprocal links express imported result associations only.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: constructor focus pivots to chosen driver and back without losing season`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950&selected=2`);
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector.getByRole('heading')).toContainText('driver-b');
    const pivot = inspector.getByRole('link', {
      name: locale === 'uk' ? /Дослідити зв’язки цього пілота/ : /Explore this driver’s connections/,
    });
    await expect(pivot).toHaveAttribute('href',
      `/${locale}/explorer/drivers/2?year=1950&selected=1#explorer-inspector`);
    await pivot.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/2\\?year=1950&selected=1#explorer-inspector$`));
    const reverse = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(reverse.getByRole('heading')).toContainText('alpha');
    await expect(reverse.getByRole('link', {
      name: locale === 'uk' ? /Дослідити зв’язки цього конструктора/ : /Explore this constructor’s connections/,
    })).toHaveAttribute('href',
      `/${locale}/explorer/constructors/1?year=1950&selected=2#explorer-inspector`);
    await reverse.getByRole('link', {
      name: locale === 'uk' ? /Дослідити зв’язки цього конструктора/ : /Explore this constructor’s connections/,
    }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/constructors/1\\?year=1950&selected=2#explorer-inspector$`));
    await expect(page.getByRole('button', { name: 'driver-b' })).toHaveAttribute('aria-pressed', 'true');
  });

  test(`${locale}: driver focus offers reciprocal constructor Explorer and observed evidence separately`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector.getByRole('link', {
      name: locale === 'uk' ? /Дослідити зв’язки цього конструктора/ : /Explore this constructor’s connections/,
    })).toHaveAttribute('href',
      `/${locale}/explorer/constructors/1?year=1950&selected=1#explorer-inspector`);
    await expect(inspector.getByRole('link', {
      name: locale === 'uk' ? /Переглянути гонки/ : /See races behind this connection/,
    })).toHaveAttribute('href',
      `/${locale}/explorer/evidence/1/1?year=1950&from=driver&selected=1`);
  });
}
