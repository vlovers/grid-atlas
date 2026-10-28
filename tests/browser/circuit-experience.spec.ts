import { chooseCircuitOption, circuitOptionValues, expectCircuitValue } from './circuit-select-option';
import { test, expect } from '@playwright/test';

for (const locale of ['uk','en'] as const) {
  test(`${locale}: circuit experience can select sourced historic layout and inspect events`, async ({page}) => {
    await page.goto(`/${locale}/circuits/1`);
    const experience=page.getByTestId('circuit-experience');
    await expect(experience).toBeVisible();
    await expect(experience.getByTestId('circuit-layout-facts')).toBeVisible();
    const select=experience.getByTestId('circuit-layout-select');
    await chooseCircuitOption(select, '');
    await experience.getByTestId('circuit-event-data').locator(':scope > summary').press('Enter');
    await expect(experience.getByTestId('circuit-event-data').locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(experience.getByTestId('circuit-event-data').locator('details').first()).toContainText('f1db');
    await expect(experience.getByTestId('circuit-era-rail')).toHaveCount(0);
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: historical layout comparison updates the selected sourced layout`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const experience = page.getByTestId('circuit-experience');
    const comparison = experience.getByTestId('circuit-layout-comparison');
    const layoutSelect = experience.getByTestId('circuit-layout-select');
    const optionCount = (await circuitOptionValues(layoutSelect)).length;

    if (optionCount <= 2) {
      await expect(comparison).toHaveCount(0);
      return;
    }

    await expect(comparison).toBeVisible();
    await comparison.locator(':scope > summary').press('Enter');
    const rows = comparison.locator('tbody tr');
    await expect(rows).toHaveCount(optionCount - 1);
    const target = rows.last();
    const targetName = (await target.getByRole('button').innerText()).trim();
    await target.getByRole('button').click();
    await expect(target.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await expect(layoutSelect).toContainText(targetName);
    await expect(experience.getByTestId('circuit-layout-facts')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: one season picker opens exact event evidence without a second chronology`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const experience = page.getByTestId('circuit-experience');
    const picker = experience.getByTestId('circuit-year-select');
    const years = (await circuitOptionValues(picker)).filter(Boolean);
    expect(years.length).toBeGreaterThan(0);
    await chooseCircuitOption(picker, years[0]);
    await expectCircuitValue(picker, years[0]);
    await expect(experience.getByTestId('circuit-event-data')).toHaveAttribute('open', '');
    await expect(experience.locator('a[href*="/races/"]').first()).toBeVisible();
    await expect(experience.getByTestId('circuit-era-rail')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: synthetic circuit never borrows a real F1DB cover outline`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const header = page.getByTestId('editorial-hero');
    await expect(header).toBeVisible();
    // Browser fixture uses fixture-original/fixture-current, absent from the licensed manifest.
    // An unrelated historical SVG must not appear merely to fill the cover.
    await expect(header.locator('img')).toHaveCount(0);
    await expect(header.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: circuit photo archive stays honest beside historical layouts`, async ({ page }) => {
    await page.goto(`/${locale}/circuits/1`);
    const collection = page.getByTestId('media-collection');
    await expect(collection.locator('img')).toHaveCount(0);
    await page.locator('a[href="#circuit-photos"]').click();
    await collection.locator('summary').press('Enter');
    await expect(collection.getByTestId('editorial-empty-media')).toBeVisible();
    await expect(page.getByTestId('circuit-experience')).toBeVisible();
  });
}
