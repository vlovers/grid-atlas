import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: pinned historical circuit outline is rendered as a local SVG`, async ({ page, request }) => {
    const response = await request.get('/circuit-layouts/avus-1.svg');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/image\/svg\+xml/);
    const source = await response.text();
    expect(source).toContain('<svg');
    expect(source).toContain('<path');

    await page.goto(`/${locale}/circuits/7`);
    const experience = page.getByTestId('circuit-experience');
    await expect(experience).toBeVisible();
    const select = experience.getByTestId('circuit-layout-select');
    // AVUS is a historic layout; explicitly select it rather than assuming the default.
    const options = await select.locator('option').evaluateAll(nodes => nodes.map(n => ({ value: (n as HTMLOptionElement).value, text: n.textContent ?? '' })));
    const avus = options.find(o => /avus-1/i.test(o.text));
    if (avus) await select.selectOption(avus.value);
    const outline = page.getByTestId('circuit-track-visual').locator('img');
    await expect(outline).toHaveAttribute('src', /\/circuit-layouts\/avus-1\.svg$/);
    await expect.poll(() => outline.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  });
}
