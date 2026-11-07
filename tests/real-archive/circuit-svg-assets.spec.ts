import { chooseCircuitOption, circuitOptionValues, circuitValue, expectCircuitValue } from '../browser/circuit-select-option';
import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: actual archive identity does not turn available SVG files into approved reader imagery`, async ({ page, request }) => {
    const response = await request.get('http://127.0.0.1:3350/api/circuits?q=interlagos');
    const item = (await response.json()).data.find((row: { external_id: string }) => row.external_id === 'interlagos');
    expect(item).toBeTruthy();
    await page.goto(`/${locale}/circuits/${item.id}`);
    await expect(page.getByTestId('circuit-record-cover')).toBeVisible();
    await expect(page.getByTestId('circuit-dossier').locator('img')).toHaveCount(0);
    await expect(page.getByTestId('circuit-diagram-unavailable')).toBeVisible();
    await expect(page.getByTestId('circuit-biography')).toContainText('1973');
    const layouts = (await (await request.get(`http://127.0.0.1:3350/api/circuits/${item.id}/layouts`)).json()).data;
    const selected = page.getByTestId('circuit-selected-event');
    const layoutId = await selected.getAttribute('data-layout-id');
    expect(layouts.some((layout: { external_layout_id: string }) => layout.external_layout_id === layoutId)).toBe(true);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test(`${locale}: year journey keeps exact event/layout identity while unapproved drawings stay hidden`, async ({ page, request }) => {
    const response = await request.get('http://127.0.0.1:3350/api/circuits?q=interlagos');
    const item = (await response.json()).data.find((row: { external_id: string }) => row.external_id === 'interlagos');
    await page.goto(`/${locale}/circuits/${item.id}`);
    const picker = page.getByTestId('circuit-year-select');
    const choices = (await circuitOptionValues(picker)).filter(Boolean);
    expect(choices.length).toBeGreaterThan(1);
    const layout = page.getByTestId('circuit-layout-select');
    for (const year of [choices[0], choices.at(-1)!]) {
      await chooseCircuitOption(picker, year);
      await expectCircuitValue(picker, year);
      await expect(page.getByTestId('circuit-event-data')).toHaveAttribute('open', '');
      await expect(page.getByTestId('circuit-event-data').locator('tbody tr').first().getByRole('rowheader')).toHaveText(year);
      await expect(page.getByTestId('circuit-track-visual').locator('img')).toHaveCount(0);
    }
    const lastLayout = await circuitValue(layout);
    expect(lastLayout).toBeTruthy();
    await page.getByRole('button', { name: locale === 'en' ? 'Show all years' : 'Показати всі роки' }).click();
    await expectCircuitValue(picker, '');
    await chooseCircuitOption(layout, lastLayout!);
    await expectCircuitValue(picker, '');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
