import { test, expect } from '@playwright/test';

/** Regression coverage for the bilingual highlights introduced across all archive dossiers. */
for (const locale of ['uk', 'en'] as const) {
  for (const route of ['/drivers/1', '/constructors/1', '/circuits/1']) {
    test(`${locale} ${route}: archive highlights preserve navigation and accessibility`, async ({ page }) => {
      await page.goto(`/${locale}${route}`);
      const highlights = page.getByTestId('archive-highlights');
      if (!(await highlights.count())) {
        // Some archive fixtures have no qualifying historical milestones.
        return;
      }
      await expect(highlights).toHaveCount(1);
      await expect(highlights.locator('h2')).toHaveCount(1);
      const cards = highlights.locator('article');
      expect(await cards.count()).toBeGreaterThan(0);
      const links = cards.locator('a[href]');
      const hrefs = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      expect(hrefs.every(href => href?.startsWith(`/${locale}/`))).toBe(true);
      for (const href of hrefs) {
        expect(href).toMatch(new RegExp(`^/${locale}/(?:drivers|constructors|circuits|races)/[^?#]+(?:\\?[^#]*)?(?:#.*)?import { test, expect } from '@playwright/test';

/** Regression coverage for the bilingual highlights introduced across all archive dossiers. */
for (const locale of ['uk', 'en'] as const) {
  for (const route of ['/drivers/1', '/constructors/1', '/circuits/1']) {
    test(`${locale} ${route}: archive highlights preserve navigation and accessibility`, async ({ page }) => {
      await page.goto(`/${locale}${route}`);
      const highlights = page.getByTestId('archive-highlights');
      if (!(await highlights.count())) {
        // Some archive fixtures have no qualifying historical milestones.
        return;
      }
      await expect(highlights).toHaveCount(1);
      await expect(highlights.locator('h2')).toHaveCount(1);
      const cards = highlights.locator('article');
      expect(await cards.count()).toBeGreaterThan(0);
      const links = cards.locator('a[href]');
      const hrefs = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      expect(hrefs.every(href => href?.startsWith(`/${locale}/`))).toBe(true);
      for (const href of hrefs) {
        expect(href).toMatch());
      }
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await expect(highlights).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }
}
