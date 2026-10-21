import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: pinned historic circuit illustration is visible and attributed`, async ({ page, request }) => {
    const response = await request.get('http://127.0.0.1:3350/api/circuits?q=monza');
    const body = await response.json();
    const item = body.data.find((row: {external_id:string}) => row.external_id === 'monza');
    expect(item).toBeTruthy();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/circuits/${item.id}`);
    const track = page.getByTestId('circuit-track-visual');
    await expect(track).toBeVisible();
    const art = track.getByRole('img');
    await expect(art).toBeVisible();
    await expect(art).toHaveAttribute('src', /\/circuit-layouts\/[a-z0-9-]+\.svg/);
    await expect(track.getByRole('link', { name: /Jules Roy/ })).toHaveAttribute('href', /github.com\/f1db\/f1db/);
    await expect(track.getByRole('link', { name: /License/ })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    const select = page.getByTestId('circuit-layout-select');
    await expect(select.locator('option').count()).resolves.toBeGreaterThan(1);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
