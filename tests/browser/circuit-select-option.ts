import { expect, type Locator } from '@playwright/test';

// These helpers exercise the enhanced JS widget. Native server/no-JS controls
// have separate coverage; wait for enhancement before reading a transient DOM.
async function readyCircuitControl(control: Locator) {
  await expect(control).toBeVisible();
  await expect(control).toHaveAttribute('role', 'combobox');
}

export async function chooseCircuitOption(control: Locator, value: string) {
  await readyCircuitControl(control);
  await control.click();
  const list = control.page().getByRole('listbox');
  await expect(list).toBeVisible();
  await list.locator(`[role="option"][data-value="${value}"]`).click();
  await expect(list).toHaveCount(0);
}
export async function circuitOptionValues(control: Locator) {
  await readyCircuitControl(control);
  await control.click();
  const list = control.page().getByRole('listbox');
  await expect(list).toBeVisible();
  const options = list.getByRole('option');
  await expect(options.first()).toBeVisible();
  const values = await options.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-value')!));
  await list.press('Escape');
  await expect(list).toHaveCount(0);
  return values;
}
export async function circuitValue(control: Locator) {
  await readyCircuitControl(control);
  return control.getAttribute('data-value');
}
export async function expectCircuitValue(control: Locator, value: string) {
  await readyCircuitControl(control);
  await expect(control).toHaveAttribute('data-value', value);
}
