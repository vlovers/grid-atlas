import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: pinned historic circuit illustration is visible and attributed`, async ({ page, request }) => {
    const response = await request.get('http://127.0.0.1:3350/api/circuits?q=monza');
    const body = await response.json();
    const item = body.data.find((row: {external_id:string}) => row.external_id === 'monza');
    expect(item).toBeTruthy();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/circuits/${item.id}`);
    const cover = page.getByTestId('circuit-cover');
    await expect(cover.getByRole('img')).toBeVisible();
    const layouts = (await (await request.get(`http://127.0.0.1:3350/api/circuits/${item.id}/layouts`)).json()).data;
    const layoutId = (await cover.getByRole('img').getAttribute('src'))!.split('/').at(-1)!.replace('.svg', '');
    expect(layouts.some((layout: { external_layout_id: string }) => layout.external_layout_id === layoutId)).toBe(true);
    await expect(cover.getByRole('link', { name: /Jules Roy/ })).toHaveAttribute('href', /github.com\/f1db\/f1db/);
    await expect(cover.getByRole('link', { name: 'CC-BY-4.0 ↗' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    const track = page.getByTestId('circuit-track-visual');
    await expect(track).toBeVisible();
    const art = track.getByRole('img');
    await expect(art).toBeVisible();
    await expect(art).toHaveAttribute('src', /\/circuit-layouts\/[a-z0-9-]+\.svg/);
    await expect(track.getByRole('link', { name: /Jules Roy/ })).toHaveAttribute('href', /github.com\/f1db\/f1db/);
    await expect(track.getByRole('link', { name: locale === 'uk' ? /Ліцензія/ : /License/ })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    const select = page.getByTestId('circuit-layout-select');
    await expect(select.locator('option').count()).resolves.toBeGreaterThan(1);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: year journey updates historical layout and can be overridden manually`, async ({ page, request }) => {
    const response = await request.get('http://127.0.0.1:3350/api/circuits?q=monza');
    const body = await response.json();
    const item = body.data.find((row: {external_id:string}) => row.external_id === 'monza');
    expect(item).toBeTruthy();
    await page.goto(`/${locale}/circuits/${item.id}`);
    const picker = page.getByTestId('circuit-year-select');
    const choices = await picker.locator('option:not([value=""])').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
    expect(choices.length).toBeGreaterThan(1);
    await picker.selectOption(choices[0]);
    await expect(page.getByTestId('circuit-year-explorer')).toContainText(choices[0]);
    const records = page.getByTestId('circuit-event-data');
    const eventRows = records.locator('tbody tr');
    await expect(records).toHaveAttribute('open', '');
    await expect(records.locator(':scope > summary')).toContainText(` · ${choices[0]}`);
    await expect(eventRows.first().getByRole('rowheader')).toHaveText(choices[0]);
    const layout = page.getByTestId('circuit-layout-select');
    const firstLayout = await layout.inputValue();
    const firstSrc = await page.getByTestId('circuit-track-visual').getByRole('img').getAttribute('src');
    const nextYear = page.getByRole('button', {name:locale === 'en' ? 'Next season' : 'Наступний сезон'});
    const previousYear = page.getByRole('button', {name:locale === 'en' ? 'Previous season' : 'Попередній сезон'});
    await expect(previousYear).toBeDisabled();
    await nextYear.click();
    await expect(picker).toHaveValue(choices[1]);
    await previousYear.click();
    await expect(picker).toHaveValue(choices[0]);
    await picker.selectOption(choices[choices.length - 1]);
    await expect(nextYear).toBeDisabled();
    await expect(page.getByTestId('circuit-year-explorer')).toContainText(choices[choices.length - 1]);
    await expect(eventRows.first().getByRole('rowheader')).toHaveText(choices[choices.length - 1]);
    const lastLayout = await layout.inputValue();
    const lastSrc = await page.getByTestId('circuit-track-visual').getByRole('img').getAttribute('src');
    expect(firstLayout).toBeTruthy();
    expect(lastLayout).toBeTruthy();
    expect(firstSrc).toContain('/circuit-layouts/');
    expect(lastSrc).toContain('/circuit-layouts/');
    // The same track geometry can cover different years; do not require every year to change its SVG.
    await page.getByRole('button', {name:locale === 'en' ? 'Show all years' : 'Показати всі роки'}).click();
    await expect(picker).toHaveValue('');
    await layout.selectOption(firstLayout);
    await expect(picker).toHaveValue('');
    await expect(page.getByTestId('circuit-track-visual').getByRole('img')).toHaveAttribute('src', firstSrc!);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({width:375,height:812});
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
