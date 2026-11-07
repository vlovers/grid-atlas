import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { chooseCircuitOption } from '../browser/circuit-select-option';

const fixture = JSON.parse(readFileSync('tests/fixtures/circuit-production-cohort.json', 'utf8'));
const api = 'http://127.0.0.1:3350/api';
const editorial = 'apps/web/src/components/editorial/';
const expanded = JSON.parse(readFileSync(editorial + 'circuit-narratives-v3.json', 'utf8')).entries;
const publicStories = JSON.parse(readFileSync(editorial + 'archive-summaries/circuit-extra-stories.json', 'utf8'));
const evidence = 'docs/design/circuit-production-reader/screenshots';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: 20 genuine circuit pages join their exact period records, sources and rights-safe reader`, async ({ page, request }, info) => {
    test.setTimeout(180_000);
    const catalogue = (await (await request.get(`${api}/circuits?limit=100`)).json()).data;
    expect(catalogue).toHaveLength(78);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const checked: string[] = [];
    for (const record of fixture.circuits) {
      const circuit = catalogue.find((row: { external_id: string }) => row.external_id === record.circuit_id);
      expect(circuit, record.circuit_id).toBeTruthy();
      const technical = (await (await request.get(`${api}/circuits/${circuit.id}/technical-history`)).json()).data;
      const event = technical.find((row: { season_year: number; round: number }) => row.season_year === record.year && row.round === record.round);
      expect(event, record.circuit_id).toBeTruthy();
      expect(event.external_layout_id).toBe(record.layout_id);
      expect(event.external_race_id).toBe(record.external_race_id);
      expect(Number(event.course_length_km)).toBe(record.length_km);
      expect(event.turns).toBe(record.turns);
      expect(event.release_sha256).toBe(fixture.source.sha256);
      const race = (await (await request.get(`${api}/races/${event.race_id}`)).json()).data[0];
      expect(race.external_id).toBe(record.external_race_id);
      const response = await page.goto(`/${locale}/circuits/${circuit.id}?race=${event.race_id}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(circuit.name);
      const selected = page.getByTestId('circuit-selected-event');
      await expect(selected).toHaveAttribute('data-race-id', event.race_id);
      await expect(selected).toHaveAttribute('data-layout-id', record.layout_id);
      await expect(selected).toContainText(String(record.year));
      const story = publicStories.find((row: { id: string }) => row.id === record.circuit_id);
      const candidate = expanded.find((row: { circuit_id: string }) => row.circuit_id === record.circuit_id);
      await expect(page.getByTestId('circuit-biography')).toContainText(story.description[locale]);
      // New source-backed drafts remain private until real independent approval.
      if (candidate.biography.text[locale] !== story.description[locale]) await expect(page.locator('body')).not.toContainText(candidate.biography.text[locale]);
      for (const moment of candidate.moments) if (moment.text[locale] !== story.description[locale]) await expect(page.locator('body')).not.toContainText(moment.text[locale]);
      await expect(page.locator('[data-turn-number], [data-candidate-position]')).toHaveCount(0);
      await expect(page.getByTestId('circuit-reading-journey')).toBeVisible();
      await expect(page.getByTestId('circuit-corner-status')).toBeVisible();
      await expect(page.getByTestId('circuit-dossier').locator('img')).toHaveCount(0);
      await expect(page.getByTestId('circuit-corner-guide')).toHaveCount(0);
      await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
      expect(await page.content()).not.toMatch(/research-circuit410-|source_asserted_not_cleared|data-candidate-position|bend-review-|pending_independent_claim_review/);
      const source = page.getByTestId('circuit-event-data').locator('details').first();
      await source.locator('summary').press('Enter');
      await expect(source).toContainText(event.source_locator);
      await expect(source).toContainText(event.content_hash);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await expect(page.getByTestId('circuit-record-cover').locator('svg')).toHaveAttribute('role', 'img');
      if ((record.circuit_id === 'interlagos' && locale === 'en' && info.project.name === 'desktop-real') ||
          (record.circuit_id === 'montreal' && locale === 'uk' && info.project.name === 'mobile-real')) {
        mkdirSync(evidence, { recursive: true });
        await page.getByTestId('circuit-dossier').screenshot({ path: `${evidence}/${record.circuit_id}-${locale}-${info.project.name}.png` });
        await page.getByTestId('editorial-hero').screenshot({ path: `${evidence}/${record.circuit_id}-${locale}-${info.project.name}-viewport.png` });
      }
      if (record.circuit_id === 'bahrain') {
        // Two Grands Prix at the same venue/year used different layouts.
        const outer = technical.find((row: { season_year: number; round: number }) => row.season_year === 2020 && row.round === 16);
        expect(outer.external_layout_id).toBe('bahrain-3');
        await chooseCircuitOption(page.getByTestId('circuit-year-select'), '2020');
        await expect(page.getByTestId('circuit-year-layouts').getByRole('radio')).toHaveCount(2);
        await page.getByTestId('circuit-year-layouts').getByRole('radio', { name: 'bahrain-3', exact: true }).check();
        await expect(selected).toHaveAttribute('data-race-id', outer.race_id);
        await expect(selected).toHaveAttribute('data-layout-id', 'bahrain-3');
        await expect(selected).toContainText(outer.course_length_km);
        await expect(page.getByTestId('circuit-track-visual').locator('img')).toHaveCount(0);
      }
      if (record.circuit_id === 'indianapolis') {
        const road = technical.find((row: { season_year: number }) => row.season_year === 2000);
        expect(road.external_layout_id).not.toBe(record.layout_id);
        await chooseCircuitOption(page.getByTestId('circuit-year-select'), '2000');
        await expect(selected).toHaveAttribute('data-race-id', road.race_id);
        await expect(selected).toHaveAttribute('data-layout-id', road.external_layout_id);
        await expect(selected).toContainText(road.course_length_km);
        await expect(page.getByTestId('circuit-track-visual').locator('img')).toHaveCount(0);
      }
      checked.push(record.circuit_id);
    }
    expect(checked).toHaveLength(20); expect(new Set(checked).size).toBe(20); expect(errors).toEqual([]);
    await info.attach('twenty-circuit-production-checks', { body: JSON.stringify({ locale, project: info.project.name, checked, publication_allowed: false, human_approval: false }), contentType: 'application/json' });
  });

  test(`${locale}: native race links, keyboard sections, missing selection and mobile reflow work on production`, async ({ page, request }) => {
    const circuit = (await (await request.get(`${api}/circuits?q=interlagos`)).json()).data.find((row: { external_id: string }) => row.external_id === 'interlagos');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}/circuits/${circuit.id}`);
    const chapters = page.getByTestId('circuit-configuration-chapters');
    const first = chapters.getByRole('link').first();
    const href = await first.getAttribute('href'); expect(href).toContain('?race=');
    await first.focus(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`race=${new URL(href!, 'http://localhost').searchParams.get('race')}`));
    const tab = page.getByTestId('profile-section-nav').locator('a[href="#circuit-corners"]');
    await tab.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#circuit-corners')).toBeFocused();
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.goto(`/${locale}/circuits/${circuit.id}?race=2147483647`);
    await expect(page.getByTestId('circuit-unknown-race')).toBeVisible();
    await expect(page.getByTestId('circuit-selected-event')).toHaveCount(0);
    await expect(page.getByTestId('circuit-dossier').locator('img')).toHaveCount(0);
    const picker = page.getByTestId('circuit-year-select');
    await chooseCircuitOption(picker, '1973');
    await expect(page.getByTestId('circuit-selected-event')).toContainText('1973');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  });
}
