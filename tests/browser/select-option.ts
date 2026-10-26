import { expect, type Locator } from '@playwright/test';

/** Exercise the visible widget; never manipulate Radix's hidden form control. */
export async function chooseOption(control: Locator, value: string) {
  await expect(control).toBeVisible();
  if (await control.evaluate(element => element.tagName === 'SELECT')) {
    await control.selectOption(value);
    return;
  }
  await control.click();
  const menu = control.page().getByRole('listbox');
  await expect(menu).toBeVisible();
  await menu.locator(`[role="option"][data-value="${value}"]`).click();
  await expect(menu).toHaveCount(0);
}
