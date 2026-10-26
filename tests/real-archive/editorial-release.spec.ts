import { chooseOption } from '../browser/select-option';
import { test, expect } from '@playwright/test';
import { releasePilots } from '../../apps/web/src/components/stories/release-model';
for (const locale of ['uk', 'en'] as const) {
  const uk = locale === 'uk';
  test(`${locale}: all five journeys resolve genuine identities, race picks and provenance without publishing drafts`, async ({ page, request }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/stories`);
    await expect(page.locator('main article')).toHaveCount(5);
    await expect(page.locator('main a[href*="/stories/ayrton-senna"]').first()).toBeVisible();
    for (const pilot of releasePilots) {
      const drivers = (await (await request.get(`http://127.0.0.1:3350/api/drivers?q=${pilot.slug}&limit=10`)).json()).data;
      const driver = drivers.find((d: { external_id: string }) => d.external_id === pilot.slug);
      expect(driver).toBeTruthy();
      await page.goto(`/${locale}/stories/${pilot.slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(driver.name);
      await expect(page.getByTestId('story-editorial-empty')).toBeVisible();
      await expect(page.getByTestId('published-chapters')).toHaveCount(0);
      await expect(page.locator('#story-races article')).toHaveCount(4);
      const rows = await Promise.all(pilot.races.map(async p => ({ ...p, data: (await (await request.get(`http://127.0.0.1:3350/api/drivers/${driver.id}/seasons/${p.year}/results`)).json()).data })));
      for (const pick of rows) {
        const observed = pick.data.filter((r: { round: number }) => r.round === pick.round);
        expect(observed.length).toBeGreaterThan(0);
        await expect(page.locator(`#story-races a[href="/${locale}/races/${observed[0].race_id}"]`)).toBeVisible();
      }
      await page.locator('#story-context details > summary').press('Enter');
      await expect(page.locator('#story-context')).toContainText('v2026.17.0');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const jsonld = await page.locator('main script[type="application/ld+json"]').textContent();
      expect(JSON.parse(jsonld!)['@graph']).toBeTruthy();
      expect(jsonld).not.toContain('Article');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://127.0.0.1:3351/${locale}/stories/${pilot.slug}`);
    }
    expect(errors).toEqual([]);
  });
  test(`${locale}: season selection, race navigation, Atlas and back preserve a journey`, async ({ page }) => {
    await page.goto(`/${locale}/stories/ayrton-senna?year=1988`);
    const panel = page.getByTestId('story-selected-season');
    await expect(panel).toContainText('1988');
    await expect(panel).toContainText('McLaren');
    const atlas = panel.getByRole('link', { name: uk ? 'Відкрити зв’язок в Атласі ↗' : 'Open connection in Atlas ↗' });
    await atlas.press('Enter');
    await expect(page).toHaveURL(/\/atlas\?kind=driver&id=\d+&year=1988&selected=\d+/);
    await expect(page.getByTestId('history-atlas')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('story-selected-season')).toContainText('1988');
    await chooseOption(page.getByLabel(uk ? 'Будь-який зафіксований сезон' : 'Any observed season'), '1993');
    await page.locator('main form button').press('Enter');
    await expect(page).toHaveURL(/year=1993/);
    await expect(page.getByTestId('story-selected-season')).toContainText('1993');
    const raceLink = page.locator('#story-races article h3 a').first();
    await expect(raceLink).toBeVisible();
    await raceLink.press('Enter');
    await expect(page).toHaveURL(/\/races\/\d+/);
    await page.goBack();
    await expect(page.getByTestId('story-selected-season')).toContainText('1993');
    const other = uk ? 'en' : 'uk';
    await page.locator(`header a[hreflang=${other}]`).press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${other}/stories/ayrton-senna\\?year=1993`));
    await expect(page.getByTestId('story-selected-season')).toBeVisible();
    await expect(page.getByTestId('story-selected-season')).toContainText('1993');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  });
}
