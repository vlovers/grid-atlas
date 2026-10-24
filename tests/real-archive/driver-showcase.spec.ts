import { test, expect } from '@playwright/test';

const api = 'http://127.0.0.1:3350';
// Discover internal IDs from the actual API. No public UI depends on Senna being 72.
for (const locale of ['uk', 'en'] as const) {
  for (const subject of ['ayrton-senna', 'lewis-hamilton']) {
    test(`${locale}: ${subject} showcase preserves API facts, real destinations and publication boundaries`, async ({ page, request, isMobile }, testInfo) => {
      await page.setViewportSize(isMobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 });
      const catalogue = (await (await request.get(`${api}/api/drivers?q=${subject}`)).json()).data;
      const identity = catalogue.find((d: { external_id: string }) => d.external_id === subject);
      expect(identity).toBeTruthy();
      const career = (await (await request.get(`${api}/api/drivers/${identity.id}/career?locale=${locale}`)).json()).data[0];
      const seasons = (await (await request.get(`${api}/api/drivers/${identity.id}/seasons`)).json()).data;
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      const remote: string[] = [];
      page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') remote.push(r.url()); });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/drivers/${identity.id}`);
      const profile = page.getByTestId('driver-showcase');
      await expect(profile.getByRole('heading', { level: 1 })).toHaveText(identity.name);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const facts = profile.locator('header > dl').first();
      await expect(facts.getByRole('definition')).toHaveText([career.summary.races, career.summary.winning_races,
        career.summary.podium_result_entries, career.summary.seasons].map(v => new Intl.NumberFormat(locale).format(v)));
      await expect(profile.getByText(locale === 'uk' ? 'Чемпіонські віхи' : 'Championship milestones', { exact: true })).toBeVisible();
      const nav = profile.getByRole('navigation', { name: locale === 'uk' ? 'Навігація за зафіксованими сезонами' : 'Recorded season navigation' });
      await expect(nav.getByRole('link')).toHaveCount(seasons.length);
      await expect(profile.locator('details[open]')).toHaveCount(0);
      // The selected-season race ledger is intentionally visible; detailed archival
      // tables must remain closed until a reader expands their disclosures.
      const ledger = profile.getByRole('region', { name: locale === 'uk' ? 'Результати гонок обраного сезону' : 'Selected season race results' });
      await expect(ledger.getByRole('table')).toHaveCount(1);
      const latestYear = Math.max(...seasons.map((season: { year: number }) => season.year));
      const raceResults = (await (await request.get(`${api}/api/drivers/${identity.id}/seasons/${latestYear}/results`)).json()).data;
      await expect(ledger.locator('tbody tr')).toHaveCount(raceResults.length);
      await expect(profile.locator('img')).toHaveCount(0);
      await expect(profile.getByText(locale === 'uk' ? 'Біографія очікує на публікацію' : 'Biography awaiting publication', { exact: true })).toBeVisible();
      expect((await request.get(`${api}/api/drivers/${identity.id}/article?locale=${locale}`)).status()).toBe(404);
      expect(await profile.innerText()).not.toContain('By the opening of the 1988 Formula One season');
      expect(remote).toEqual([]);
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`${subject}-${locale}.png`), fullPage: true, scale: 'css' });
      if (subject === 'ayrton-senna') console.log(`Senna ${locale} ${isMobile ? 'mobile' : 'desktop'} closed archive height:`, await page.evaluate(() => document.documentElement.scrollHeight));

      const available = [...seasons].sort((a, b) => a.year - b.year);
      const target = available[0].year;
      await nav.getByRole('link', { name: String(target), exact: true }).click();
      await expect(nav.getByRole('link', { name: String(target), exact: true })).toHaveAttribute('aria-current', 'true');
      await expect(page).toHaveURL(new RegExp(`season=${target}#driver-career$`));
      await expect(profile.getByRole('region', { name: `${locale === 'uk' ? 'Сезон' : 'Season'} ${target}`, exact: true })).toBeVisible();
      const timelineFirst = career.participation[0];
      expect((await request.get(`${api}/api/constructors/${timelineFirst.related_id}`)).status()).toBe(200);
      await expect(profile.locator(`#driver-teams a[href="/${locale}/explorer/drivers/${identity.id}?year=${timelineFirst.year}&selected=${timelineFirst.related_id}"]`)).toBeVisible();
      const firstWin = career.milestones.first_win;
      if (firstWin) {
        const raceLink = profile.locator(`#driver-moments h3 a[href="/${locale}/races/${firstWin.race.id}?from=${encodeURIComponent(`/drivers/${identity.id}`)}"]`);
        await raceLink.click();
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstWin.race.name);
        await page.goBack();
        await expect(profile.getByRole('heading', { level: 1 })).toHaveText(identity.name);
      }
      const disclosure = profile.locator('#driver-seasons > summary');
      await disclosure.press('Enter');
      await expect(profile.locator('#driver-seasons')).toHaveAttribute('open', '');
      await expect(profile.getByRole('table', { name: new RegExp(identity.name) }).first()).toBeVisible();
      await disclosure.press('Enter');
      if (subject === 'ayrton-senna') {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
      const compare = profile.locator('header a[href*="/time-machine?"]');
      await expect(compare).toHaveAttribute('href', `/${locale}/time-machine?kind=driver&id=${identity.id}&from=${available[0].year}&to=${available.at(-1).year}`);
      await compare.click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale === 'uk' ? 'Машина часу' : 'Time Machine');
      await expect(page.getByRole('heading', { level: 2, name: identity.name, exact: true })).toBeVisible();
    });
  }
}
