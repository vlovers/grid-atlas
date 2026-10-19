import { expect, test } from '@playwright/test';

// Synthetic archive: permalinks preserve identity, year, locale and focus.
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: permalink opens selected alternate constructor-to-driver association`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/constructors/1?year=1950&selected=2`);
    const inspector = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    });
    await expect(inspector.getByRole('heading')).toContainText('driver-b');
    const permalink = inspector.getByRole('link', {
      name: locale === 'uk' ? /Постійне посилання на цей зв’язок/ : /Open a link to this connection/,
    });
    await expect(permalink).toHaveAttribute('href',
      `/${locale}/explorer/constructors/1?year=1950&selected=2#explorer-inspector`);
    await permalink.click();
    await expect(page).toHaveURL(new RegExp(
      `/${locale}/explorer/constructors/1\\?year=1950&selected=2#explorer-inspector$`));
    await expect(page.getByRole('button', { name: 'driver-b' })).toHaveAttribute('aria-pressed', 'true');
  });
  test(`${locale}: driver permalink uses driver focus rather than linked constructor`, async ({ page }) => {
    await page.goto(`/${locale}/explorer/drivers/1?year=1950`);
    const permalink = page.getByRole('complementary', {
      name: locale === 'uk' ? 'Деталі зв’язку' : 'Connection details',
    }).getByRole('link', {
      name: locale === 'uk' ? /Постійне посилання на цей зв’язок/ : /Open a link to this connection/,
    });
    await expect(permalink).toHaveAttribute('href',
      `/${locale}/explorer/drivers/1?year=1950&selected=1#explorer-inspector`);
  });
}
