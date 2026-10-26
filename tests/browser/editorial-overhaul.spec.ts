import { test, expect } from '@playwright/test';
import { chooseOption } from './select-option';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: compact catalogue and contextual cover preserve real actions`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByTestId('home-season-cover')).toBeVisible();
    await expect(page.getByTestId('career-signature')).toHaveCount(0);
    await page.goto(`/${locale}/drivers`);
    const cards = page.locator('.driver-grid > a');
    await expect(cards.first().locator('dl')).toBeVisible();
    await expect(page.getByTestId('archive-features').locator('svg')).toHaveCount(0);
    await cards.first().press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/drivers/[0-9]+$`));
  });

  test(`${locale}: grouped year options submit actual years and Escape restores focus`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${locale}/atlas?kind=driver&id=1&year=1950`);
    const year = page.locator('button[role="combobox"]').last();
    await year.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: '1950', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: '1951', exact: true })).toBeVisible();
    await page.getByRole('listbox').press('Escape');
    await expect(year).toBeFocused();
    await chooseOption(year, '1951');
    await year.locator('xpath=ancestor::form').getByRole('button', { name: locale === 'uk' ? /Відкрити/ : /Open/ }).click();
    await expect(page).toHaveURL(/year=1951/);
    await expect(page).not.toHaveURL(/object|__grid/);
    expect(errors).toEqual([]);
  });

  test(`${locale}: catalogue headings remain readable at narrow enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/${locale}/constructors`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(await page.locator('h1').evaluate(node => parseFloat(getComputedStyle(node).lineHeight) / parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThan(1.1);
  });
}
