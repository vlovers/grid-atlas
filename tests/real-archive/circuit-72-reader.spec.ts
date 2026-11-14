import { test, expect } from '@playwright/test';
import targets from '../../apps/web/src/components/editorial/circuit-targets.json';

const api = 'http://127.0.0.1:3350/api';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: all 72 canonical readers retain exact event links and honest publication states`, async ({ page, request }, info) => {
    test.setTimeout(240_000);
    const catalogue = (await (await request.get(`${api}/circuits?limit=100`)).json()).data;
    expect(catalogue).toHaveLength(78);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const target of targets.targets) {
      const circuit = catalogue.find((row: { external_id: string }) => row.external_id === target.circuit_id);
      expect(circuit, target.circuit_id).toBeTruthy();
      const technical = (await (await request.get(`${api}/circuits/${circuit.id}/technical-history`)).json()).data;
      const first = technical.find((row: { external_race_id: string }) => row.external_race_id === target.first_race_id);
      expect(first, target.circuit_id).toBeTruthy();
      expect(first.release_sha256).toBe(targets.source.sha256);
      const response = await page.goto(`/${locale}/circuits/${circuit.id}?race=${first.race_id}`);
      expect(response?.status(), target.circuit_id).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(circuit.name);
      await expect(page.getByTestId('circuit-selected-event')).toHaveAttribute('data-race-id', first.race_id);
      await expect(page.getByTestId('circuit-selected-event')).toHaveAttribute('data-layout-id', first.external_layout_id);
      await expect(page.getByTestId('circuit-reading-journey')).toBeVisible();
      await expect(page.getByTestId('circuit-result-statistics')).toBeVisible();
      const wins = page.getByTestId('circuit-drivers-wins').locator('tbody tr').first().locator('td');
      const winsBox = await wins.boundingBox();
      const tableBox = await page.getByTestId('circuit-drivers-wins').boundingBox();
      expect(winsBox && tableBox && winsBox.x + winsBox.width <= tableBox.x + tableBox.width + 1,
        `${target.circuit_id}: win totals fit beside names`).toBe(true);
      expect(await page.getByTestId('circuit-drivers-wins').evaluate(table => table.scrollWidth <= table.parentElement!.clientWidth + 1)).toBe(true);
      await expect(page.getByTestId('circuit-record-cover')).toBeVisible();
      await expect(page.getByTestId('circuit-records-unavailable')).toBeAttached();
      await expect(page.getByTestId('circuit-corner-status')).toBeVisible();
      await expect(page.getByTestId('circuit-evidence-gaps')).toBeAttached();
      await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
      await expect(page.getByTestId('circuit-dossier').locator('img')).toHaveCount(0);
      await expect(page.locator('[data-turn-number], [data-candidate-position]')).toHaveCount(0);
      const identity = page.getByTestId('identity-facts');
      await identity.locator(':scope > details > summary').click();
      await expect(identity).toContainText(locale === 'uk' ? 'Широта за джерелом' : 'Source-reported latitude');
      if (locale === 'uk') {
        await expect(identity).not.toContainText('CLOCKWISE');
        await expect(page.getByTestId('circuit-result-statistics')).not.toContainText('Winning races');
        await expect(page.getByTestId('circuit-evidence-gaps')).not.toContainText('Facts requiring');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), target.circuit_id).toBeLessThanOrEqual(1);
      if ((target.circuit_id === 'monaco' && locale === 'en' && info.project.name === 'desktop-real') ||
          (target.circuit_id === 'mugello' && locale === 'uk' && info.project.name === 'mobile-real')) {
        await page.getByTestId('editorial-hero').screenshot({ path: info.outputPath(`${target.circuit_id}-${locale}-hero.png`) });
        await page.getByTestId('circuit-result-statistics').screenshot({ path: info.outputPath(`${target.circuit_id}-${locale}-statistics.png`) });
      }
      const layouts = (await (await request.get(`${api}/circuits/${circuit.id}/layouts`)).json()).data;
      for (const layout of layouts) {
        const event = technical.find((row: { layout_id: string; external_layout_id: string }) =>
          row.layout_id === layout.id && row.external_layout_id === layout.external_layout_id);
        expect(event, `${target.circuit_id}/${layout.external_layout_id}`).toBeTruthy();
        const layoutResponse = await page.goto(`/${locale}/circuits/${circuit.id}?race=${event.race_id}`);
        expect(layoutResponse?.status()).toBe(200);
        await expect(page.getByTestId('circuit-selected-event')).toHaveAttribute('data-layout-id', layout.external_layout_id);
        await expect(page.getByTestId('circuit-selected-event')).toHaveAttribute('data-race-id', event.race_id);
        await expect(page.getByTestId('circuit-selected-event')).toContainText(event.course_length_km);
        await expect(page.locator('[data-turn-number], [data-candidate-position]')).toHaveCount(0);
      }
    }
    // Exclusion from the mission must never delete another existing identity page.
    for (const target of targets.excluded) {
      const circuit = catalogue.find((row: { external_id: string }) => row.external_id === target.circuit_id);
      const response = await request.get(`/${locale}/circuits/${circuit.id}`);
      expect(response.status(), target.circuit_id).toBe(200);
    }
    expect(errors).toEqual([]);
  });
}
