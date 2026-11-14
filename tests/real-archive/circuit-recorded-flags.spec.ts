import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const archive = process.env.F1DB_ARCHIVE ?? '/tmp/grid-atlas-f1db/f1db-json-splitted.zip';
const checksums = process.env.F1DB_CHECKSUMS ?? '/tmp/grid-atlas-f1db/checksums_sha256.txt';
type Ranking = { name: string; count: number };
type Metric = { complete_races: number; race_records: number; drivers: Ranking[]; constructors: Ranking[] };
const source: { source_sha256: string; circuits: { circuit_id: string; poles: Metric; fastest_laps: Metric }[] } = JSON.parse(
  execFileSync('python3', ['scripts/audit-circuit-result-flags.py', '--archive', archive, '--checksums', checksums], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: all 72 circuit pole/fastest-lap tables match independent pinned source flags`, async ({ page, request }) => {
    test.setTimeout(180_000);
    const circuits = (await (await request.get('http://127.0.0.1:3350/api/circuits?limit=100')).json()).data;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const expected of source.circuits) {
      const circuit = circuits.find((row: { external_id: string }) => row.external_id === expected.circuit_id);
      expect((await page.goto(`/${locale}/circuits/${circuit.id}`))?.status()).toBe(200);
      for (const [key, metric] of [['poles', expected.poles], ['fastest-laps', expected.fastest_laps]] as const) {
        const section = page.getByTestId(`circuit-${key}-statistics`);
        await section.locator(':scope > summary').press('Enter');
        await expect(section).toContainText(`${metric.complete_races}/${metric.race_records}`);
        for (const kind of ['drivers', 'constructors'] as const) {
          const table = page.getByTestId(`circuit-${kind}-${key}`);
          const rows = await table.locator('tbody tr').all();
          expect(rows.length, `${expected.circuit_id}/${kind}/${key}`).toBe(metric[kind].length);
          const actual: Ranking[] = [];
          for (const row of rows) actual.push({ name: (await row.locator('th').innerText()).trim(), count: Number(await row.locator('td').innerText()) });
          const sort = (a: Ranking, b: Ranking) => a.name.localeCompare(b.name, 'en');
          expect(actual.sort(sort)).toEqual(metric[kind].map(({ name, count }) => ({ name, count })).sort(sort));
          expect(await table.evaluate(node => node.scrollWidth <= node.parentElement!.clientWidth + 1)).toBe(true);
        }
      }
      const provenance = page.getByTestId('circuit-classification-sources');
      await expect(provenance).toContainText(source.source_sha256);
      await expect(provenance).toContainText('f1db-races-race-results.json#raceId=');
      await expect(page.getByTestId('circuit-records-unavailable')).toContainText(locale === 'uk' ? 'не є рекордом траси' : 'not a circuit lap record');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });
}
