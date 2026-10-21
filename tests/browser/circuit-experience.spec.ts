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
