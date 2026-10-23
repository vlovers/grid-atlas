import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: real profile visuals retain pinned counts, metadata and responsive access`, async ({ page, request }) => {
    const api = 'http://127.0.0.1:3350/api';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [kind, external] of [['drivers', 'ayrton-senna'], ['constructors', 'mclaren'], ['circuits', 'silverstone']]) {
      const matches = (await (await request.get(`${api}/${kind}?q=${external}&limit=10`)).json()).data;
      const identity = matches.find((row: { external_id: string }) => row.external_id === external);
      expect(identity).toBeTruthy();
      const route = `/${locale}/${kind}/${identity.id}`;
      const response = await page.goto(`${route}?season=1988`);
      expect(response?.status()).toBe(200);
      const profile = (await (await request.get(`${api}/${kind}/${identity.id}`)).json()).data[0];
      await expect(page.locator('main h1')).toHaveText(profile.name);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://127.0.0.1:3351${route}`);
      for (const language of ['en', 'uk']) await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute('href', `http://127.0.0.1:3351/${language}/${kind}/${identity.id}`);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      if (kind === 'circuits') expect(description).toContain(locale === 'en' ? 'historical circuit layouts' : 'історичні конфігурації трас');
      if (kind !== 'circuits') {
        const seasons = (await (await request.get(`${api}/${kind}/${identity.id}/seasons`)).json()).data;
        const desc = await page.getByTestId('profile-record-graphic').locator('desc').textContent();
        for (const season of seasons) expect(desc).toContain(`${season.year}: ${kind === 'drivers' ? season.starts : season.races}`);
      } else {
        const table = page.getByTestId('circuit-history-table');
        await expect(table.locator('tbody tr')).toHaveCount(25);
        await expect(page.getByTestId('story-header').locator('img')).toHaveAttribute('src', /\/circuit-layouts\/silverstone-[0-9]+\.svg$/);
      }
      for (const width of [1440, 834, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${kind} ${width}`).toBeLessThanOrEqual(1);
        const nav = page.getByTestId('profile-section-nav');
        for (const link of await nav.getByRole('link').all()) {
          const box = await link.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${kind} 200% text`).toBeLessThanOrEqual(1);
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
      expect(await page.locator('main img[src^="https:"]').count()).toBe(0);
    }
    expect(errors).toEqual([]);
  });
}

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: real empty and long archive identities keep working section links`, async ({ page, request }) => {
    const api = 'http://127.0.0.1:3350/api';
    for (const [kind, external] of [['drivers', 'adderly-fong'], ['constructors', 'first'], ['drivers', 'lewis-hamilton'], ['constructors', 'ferrari'], ['circuits', 'monaco']]) {
      const matches = (await (await request.get(`${api}/${kind}?q=${external}&limit=20`)).json()).data;
      const identity = matches.find((row: { external_id: string }) => row.external_id === external);
      expect(identity).toBeTruthy();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/${kind}/${identity.id}`);
      await expect(page.locator('main h1')).toHaveCount(1);
      const nav = page.getByTestId('profile-section-nav');
      for (const link of await nav.getByRole('link').all()) await expect(page.locator((await link.getAttribute('href'))!)).toHaveCount(1);
      if (external === 'first' || external === 'adderly-fong') await expect(page.getByTestId('profile-record-graphic')).toHaveCount(0);
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), external).toBeLessThanOrEqual(1);
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
      await page.emulateMedia({ forcedColors: 'none' });
    }
  });
}
