import { circuitOptionValues } from './circuit-select-option';
import { test, expect } from '@playwright/test';

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: pinned historic SVG assets and archive circuit images are delivered locally`, async ({ page, request }) => {
    // Static asset check is independent of the small browser API fixture.
    const response = await request.get('/circuit-layouts/avus-1.svg');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/image\/svg\+xml/);
    const source = await response.text();
    expect(source).toContain('<svg');
    expect(source).toContain('<path');

    // Circuit 1 is present in the browser fixture; circuit 7 is not.
    await page.goto(`/${locale}/circuits/1`);
    const experience = page.getByTestId('circuit-experience');
    await expect(experience).toBeVisible();
    const select = experience.getByTestId('circuit-layout-select');
    expect((await circuitOptionValues(select)).filter(Boolean).length).toBeGreaterThan(0);
    const outline = experience.getByTestId('circuit-track-visual').locator('img');
    // The fixture may not contain a published outline for its historical layout.
    // If it does, the browser must decode the image from the same origin.
    if (await outline.count()) {
      await expect(outline).toHaveAttribute('src', /^\/circuit-layouts\/[a-z0-9-]+\.svg$/);
      await expect.poll(() => outline.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    } else {
      await expect(experience.getByTestId('circuit-track-visual')).toContainText(
        locale === 'uk' ? 'недоступний' : 'available');
    }
  });
}
