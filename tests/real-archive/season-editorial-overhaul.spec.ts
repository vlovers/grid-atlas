import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: season stories open existing published editions and calendar appears once`, async ({ page }) => {
    for (const year of [1988, 2008]) {
      await page.goto(`/${locale}/seasons/${year}`);
      const calendar = page.getByTestId('season-calendar');
      await expect(calendar).toHaveCount(1);
      await expect(page.getByTestId('season-visual-journey')).toHaveCount(0);
      await expect(page.getByTestId('season-journey')).toHaveCount(0);
      const stories = page.getByTestId('season-stories');
      const article = stories.locator('h3 a').first();
      await expect(article).toHaveAttribute('href', new RegExp(`^/${locale}/stories/moments/`));
      await article.press('Enter');
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${locale}/stories/moments/`));
    }
  });

  test(`${locale}: pinned 2026 remains provisional and never becomes a completed retrospective`, async ({ page }) => {
    await page.goto(`/${locale}/seasons/2026`);
    const cover = page.getByTestId('season-cover');
    await expect(cover).toContainText(locale === 'uk' ? 'Попередній залік' : 'Provisional standings');
    await expect(page.getByRole('note')).toContainText(locale === 'uk' ? 'ще не завершено' : 'incomplete');
    await expect(page.getByTestId('season-stories')).toHaveCount(0);
    await expect(page.getByTestId('season-calendar')).toBeVisible();
  });
}
