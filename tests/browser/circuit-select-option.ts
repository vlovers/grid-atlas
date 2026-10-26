import { expect, type Locator } from '@playwright/test';

export async function chooseCircuitOption(control: Locator, value: string) {
  await expect(control).toBeVisible();
  if (await control.evaluate(node => node.tagName === 'SELECT')) { await control.selectOption(value); return; }
  await control.click();
  const list = control.page().getByRole('listbox');
  await expect(list).toBeVisible();
  await list.locator(`[role="option"][data-value="${value}"]`).click();
  await expect(list).toHaveCount(0);
}
export async function circuitOptionValues(control: Locator) {
  if (await control.evaluate(node => node.tagName === 'SELECT')) return control.locator('option').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
  await control.click();
  const list = control.page().getByRole('listbox');
  const values = await list.getByRole('option').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-value')!));
  await list.press('Escape');
  return values;
}
export async function circuitValue(control: Locator) {
  return await control.evaluate(node => node.tagName === 'SELECT') ? control.inputValue() : control.getAttribute('data-value');
}
export async function expectCircuitValue(control: Locator, value: string) {
  if (await control.evaluate(node => node.tagName === 'SELECT')) await expect(control).toHaveValue(value);
  else await expect(control).toHaveAttribute('data-value', value);
}
