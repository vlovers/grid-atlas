import { chooseCircuitOption, expectCircuitValue } from './circuit-select-option';
import { test, expect } from '@playwright/test';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: profile sections, data graphics and tables remain accessible at tablet and 200% text`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const kind of ['drivers', 'constructors', 'circuits']) {
      await page.setViewportSize({ width: 834, height: 1112 });
      await page.goto(`/${locale}/${kind}/1`);
      await expect(page.locator('main h1')).toHaveCount(1);
      const levels = await page.locator('main :is(h1,h2,h3,h4,h5)').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => Number(node.tagName.slice(1))));
      for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
      const nav = page.getByTestId('profile-section-nav');
      for (const link of await nav.getByRole('link').all()) {
        const target = await link.getAttribute('href');
        expect(target).toMatch(/^#[a-z-]+$/);
        await expect(page.locator(target!)).toHaveCount(1);
      }
      if (kind !== 'circuits') await expect(page.getByTestId('profile-record-graphic')).toBeVisible();
      // A 720-CSS-pixel viewport is the reflow width of a 1440px desktop at 200% zoom.
      await page.setViewportSize({ width: 720, height: 1000 });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const last = nav.getByRole('link').last();
      await last.focus();
      await last.press('Enter');
      const target = (await last.getAttribute('href'))!;
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      await expect(page.locator(target)).toBeFocused();
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
      const table = page.getByTestId('archive-table').first();
      if (await table.count()) {
        const disclosure = table.locator('xpath=ancestor::details[1]');
        if (await disclosure.count() && await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').press('Enter');
        const region = table.getByRole('region');
        await region.focus();
        await expect(region).toBeFocused();
        const before = await region.evaluate(node => node.scrollLeft);
        await region.press('ArrowRight');
        await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(before);
      }
    }
    expect(errors).toEqual([]);
  });

  test(`${locale}: circuit layouts are reached before chronology and preserve keyboard state`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/circuits/1`);
    const nav = page.getByTestId('profile-section-nav');
    await nav.locator('a[href="#circuit-layouts"]').press('Enter');
    await expect(page).toHaveURL(/#circuit-layouts$/);
    const select = page.getByTestId('circuit-layout-select');
    await chooseCircuitOption(page.getByTestId('circuit-year-select'), '1950');
    await expectCircuitValue(select, '1');
    await expect(page.getByTestId('circuit-layout-facts')).toContainText('5.123');
    const order = await page.evaluate(() => {
      const layouts = document.getElementById('circuit-layouts')!;
      const chronology = document.getElementById('circuit-history')!;
      return Boolean(layouts.compareDocumentPosition(chronology) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(order).toBe(true);
  });
}
