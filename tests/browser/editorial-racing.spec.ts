import { chooseOption } from './select-option';
import { mediaCollectionCopy } from '../../apps/web/src/components/media/collection-copy';
import { test, expect } from '@playwright/test';
import { editorialCopy } from '../../apps/web/src/components/editorial/copy';

for (const locale of ['uk', 'en'] as const) {
  const t = editorialCopy[locale];
  for (const width of [1440, 1920, 1024, 390]) {
    test(`${locale}: editorial pages at ${width}px retain landmarks, sources and readable fallback`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      const remote: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') remote.push(r.url()); });
      for (const path of ['', '/drivers/1', '/constructors/1']) {
        await page.goto(`/${locale}${path}`);
        const hero = page.getByTestId('editorial-hero');
        await expect(hero).toBeVisible();
        await expect(page.locator('main h1')).toHaveCount(1);
        if (path) await expect(hero.locator('[data-editorial-media="archive-composition"]')).toContainText(t.plateNote);
        else await expect(hero.getByTestId('home-season-cover')).toBeVisible();
        await expect(hero.locator('img')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Atlas Serif');
        expect(await page.evaluate(() => document.fonts.check('16px "Atlas Sans"'))).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        expect(await page.locator('main').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
        await expect(page.locator('main a[href$="/sources"]').first()).toBeVisible();
      }
      expect(errors).toEqual([]);
      expect(remote).toEqual([]);
    });
  }

  test(`${locale}: constructor season selection works without JavaScript and uses only recorded years`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto(`http://127.0.0.1:3340/${locale}/constructors/1?season=1951`);
      const picker = page.getByLabel(t.seasonLabel, { exact: true });
      await expect(picker).toHaveValue('1950');
      await chooseOption(picker, '1950');
      await page.getByRole('button', { name: `${t.viewSeason} ↗`, exact: true }).press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${locale}/constructors/1\\?season=1950#constructor-season$`));
      await expect(picker).toHaveValue('1950');
      await expect(page.locator('#constructor-season a[aria-current="page"]')).toHaveText('1950');
      await expect(page.getByTestId('editorial-empty-media')).toContainText(mediaCollectionCopy[locale].empty);
    } finally { await context.close(); }
  });

  test(`${locale}: driver associations exclude self and link only observed season peers`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1?season=1950`);
    const peers = page.getByTestId('driver-perspectives');
    await expect(peers).toContainText(t.perspectivesNote);
    await expect(peers.locator(`a[href^="/${locale}/drivers/1?"]`)).toHaveCount(0);
    await expect(peers.locator('a')).toHaveCount(1);
    await expect(peers.locator('a')).toHaveAttribute('href', `/${locale}/drivers/2?season=1950`);
    for (const href of await peers.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))) {
      expect(href).toMatch(new RegExp(`^/${locale}/drivers/[1-9][0-9]*\\?season=1950$`));
    }
    await expect(page.getByTestId('championship-drivers-career')).toBeVisible();
    await expect(page.getByRole('heading', { name: locale === 'uk' ? 'Біографія очікує на публікацію' : 'Biography awaiting publication' })).toBeVisible();
  });
}
