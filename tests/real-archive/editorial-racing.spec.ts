import { test, expect } from '@playwright/test';
import { editorialCopy } from '../../apps/web/src/components/editorial/copy';

for (const locale of ['en', 'uk'] as const) {
  test(`${locale}: McLaren dossier selects 1988 and its first recorded season without JavaScript`, async ({ browser, request }) => {
    const api = 'http://127.0.0.1:3350/api';
    const matches = (await (await request.get(`${api}/constructors?q=mclaren&limit=5`)).json()).data;
    const team = matches.find((row: { external_id: string }) => row.external_id === 'mclaren');
    expect(team).toBeTruthy();
    const seasons = (await (await request.get(`${api}/constructors/${team.id}/seasons`)).json()).data;
    expect(seasons.some((row: { year: number }) => row.year === 1988)).toBe(true);
    const firstYear = Math.min(...seasons.map((row: { year: number }) => row.year));
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    try {
      await page.goto(`http://127.0.0.1:3351/${locale}/constructors/${team.id}?season=1988`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(team.name);
      const picker = page.getByLabel(editorialCopy[locale].seasonLabel, { exact: true });
      await expect(picker).toHaveValue('1988');
      const roster = page.getByRole('region', { name: locale === 'uk' ? 'Пілоти команди в обраному сезоні' : 'Constructor drivers in selected season' });
      const actual = (await (await request.get(`${api}/constructors/${team.id}/seasons/1988/drivers`)).json()).data;
      await expect(roster.locator('h3 a')).toHaveText(actual.map((row: { driver_name: string }) => row.driver_name));
      await expect(page.getByTestId('championship-constructors-career')).toBeVisible();
      await picker.selectOption(String(firstYear));
      await page.getByRole('button', { name: `${editorialCopy[locale].viewSeason} ↗`, exact: true }).press('Enter');
      await expect(picker).toHaveValue(String(firstYear));
      await expect(page).toHaveURL(new RegExp(`season=${firstYear}#constructor-season$`));
      const firstRoster = (await (await request.get(`${api}/constructors/${team.id}/seasons/${firstYear}/drivers`)).json()).data;
      await expect(roster.locator('h3 a')).toHaveText(firstRoster.map((row: { driver_name: string }) => row.driver_name));
      await expect(page.locator('main img')).toHaveCount(0);
      await expect(page.getByTestId('editorial-empty-media')).toContainText(editorialCopy[locale].carsNote);
    } finally { await context.close(); }
  });
}
