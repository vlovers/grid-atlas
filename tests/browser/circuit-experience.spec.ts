import { test, expect } from '@playwright/test';

for (const locale of ['uk','en'] as const) {
  test(`${locale}: circuit experience can select sourced historic layout and inspect events`, async ({page}) => {
    await page.goto(`/${locale}/circuits/1`);
    const experience=page.getByTestId('circuit-experience');
    await expect(experience).toBeVisible();
    await expect(experience.getByTestId('circuit-layout-facts')).toBeVisible();
    const select=experience.getByTestId('circuit-layout-select');
    await select.selectOption({index:0});
    await expect(experience.locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(experience.locator('details').first()).toContainText('f1db');
    await expect(experience).toContainText(locale==='uk'?'не географічна':'not a geographic');
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: historical layout comparison updates the selected sourced layout`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const experience = page.getByTestId('circuit-experience');
    const comparison = experience.getByTestId('circuit-layout-comparison');
    const layoutSelect = experience.getByTestId('circuit-layout-select');
    const options = layoutSelect.locator('option');
    const optionCount = await options.count();

    if (optionCount <= 2) {
      await expect(comparison).toHaveCount(0);
      return;
    }

    await expect(comparison).toBeVisible();
    const rows = comparison.locator('tbody tr');
    await expect(rows).toHaveCount(optionCount - 1);
    const target = rows.last();
    const targetName = (await target.getByRole('button').innerText()).trim();
    await target.getByRole('button').click();
    await expect(target.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await expect(layoutSelect.locator('option:checked')).toContainText(targetName);
    await expect(experience.getByTestId('circuit-layout-facts')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: circuit era rail links recorded seasons to event evidence`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const experience = page.getByTestId('circuit-experience');
    const rail = experience.getByTestId('circuit-era-rail');
    const years = rail.getByRole('button');
    await expect(rail).toBeVisible();
    expect(await years.count()).toBeGreaterThan(0);
    const year = years.first();
    const yearLabel = (await year.locator('strong').innerText()).trim();
    await year.click();
    await expect(year).toHaveAttribute('aria-pressed', 'true');
    await expect(experience.getByTestId('circuit-year-select')).toHaveValue(yearLabel);
    await expect(experience.locator('a[href*="/races/"]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
