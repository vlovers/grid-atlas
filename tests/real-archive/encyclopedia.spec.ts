import { expect, test } from '@playwright/test';

const api = 'http://127.0.0.1:3350/api';
for (const locale of ['uk', 'en'] as const) {
  for (const [kind, externalId] of [['drivers', 'alberto-ascari'], ['constructors', 'ferrari'], ['circuits', 'monza']] as const) {
    test(`${locale}: ${kind} identity, provenance and historical navigation`, async ({ page, request }, testInfo) => {
      const catalogue = (await (await request.get(`${api}/${kind}?q=${externalId}`)).json()).data;
      const entity = catalogue.find((row: { external_id: string }) => row.external_id === externalId);
      expect(entity).toBeTruthy();
      const identity = (await (await request.get(`${api}/${kind}/${entity.id}/identity`)).json()).data[0];
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/${kind}/${entity.id}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(entity.name);
      const facts = page.getByTestId('identity-facts');
      await expect(facts).toBeVisible();
      await expect(facts).toContainText(identity.fields.full_name);
      const disclosure = facts.locator('summary');
      await disclosure.press('Enter');
      await expect(facts).toContainText(identity.provenance.source_locator);
      await expect(facts).toContainText(identity.provenance.sha256);
      await disclosure.press('Enter');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://127.0.0.1:3351/${locale}/${kind}/${entity.id}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const screenshot = testInfo.outputPath(`${kind}-${locale}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, scale: 'css' });
      await testInfo.attach(`${kind}-${locale}`, { path: screenshot, contentType: 'image/png' });
      await facts.scrollIntoViewIfNeeded();
      const identityScreenshot = testInfo.outputPath(`identity-${kind}-${locale}.png`);
      await page.screenshot({ path: identityScreenshot, scale: 'css' });
      await testInfo.attach(`identity-${kind}-${locale}`, { path: identityScreenshot, contentType: 'image/png' });
      if (kind === 'constructors') {
        const roster = page.getByRole('region', { name: locale === 'uk' ? 'Пілоти команди в обраному сезоні' : 'Constructor drivers in selected season' });
        const race = roster.locator('a[href*="/races/"]').first();
        await expect(race).toBeVisible();
        await race.click();
        await expect(page.getByTestId('race-classification').or(page.getByRole('table').first())).toBeVisible();
      } else if (kind === 'circuits') {
        await expect(page.getByTestId('circuit-result-legends')).toBeVisible();
        const history = (await (await request.get(`${api}/circuits/${entity.id}/history`)).json()).data;
        await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(Math.min(25, history.length));
        if (history.length > 25) {
          const next = page.getByRole('navigation', { name: locale === 'uk' ? 'Сторінки історії траси' : 'Circuit history pages' }).getByRole('link').last();
          const navigation = page.waitForRequest(r => r.isNavigationRequest() && r.url().endsWith(`/${locale}/circuits/${entity.id}?page=2`));
          await next.click();
          expect((await navigation).method()).toBe('GET');
          await expect(page).toHaveURL(/page=2$/);
          await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(Math.min(25, history.length - 25));
          await expect(page.getByRole('table').locator('tbody tr').first().getByRole('link').nth(1)).toHaveAttribute('href', `/${locale}/races/${history[25].race_id}`);
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://127.0.0.1:3351/${locale}/circuits/${entity.id}?page=2`);
        }
        const winner = page.getByTestId('circuit-result-legends').getByRole('link').first();
        await winner.click();
        await expect(page.getByTestId('driver-showcase')).toBeVisible();
      } else {
        await expect(page.getByRole('columnheader', { name: locale === 'uk' ? 'Номер у гонці' : 'Race number' })).toBeVisible();
      }
    });
  }
  test(`${locale}: archive driver without race results retains source identity and honest empty career`, async ({ page, request }) => {
    const rows = (await (await request.get(`${api}/drivers?q=adderly-fong`)).json()).data;
    const entity = rows.find((row: { external_id: string }) => row.external_id === 'adderly-fong');
    const career = (await (await request.get(`${api}/drivers/${entity.id}/career`)).json()).data[0];
    expect(career.summary.races).toBe(0);
    expect(career.summary.recorded_points).toBeNull();
    await page.goto(`/${locale}/drivers/${entity.id}`);
    await expect(page.getByTestId('driver-showcase')).toBeVisible();
    await expect(page.getByTestId('identity-facts')).toContainText('1990-03-02');
    await expect(page.getByTestId('driver-opening')).toHaveCount(0);
    await expect(page.locator('a[href*="/races/"]')).toHaveCount(0);
  });
}
