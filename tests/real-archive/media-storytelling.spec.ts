import { test, expect } from '@playwright/test';
import { storyCopy } from '../../apps/web/src/components/stories/copy';

const api = 'http://127.0.0.1:3350';
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: visual stories open exact races, circuits and paired season perspectives without publishing media`, async ({ page, request, isMobile }, info) => {
    const t = storyCopy[locale];
    const errors: string[] = []; const remote: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') remote.push(r.url()); });
    const findDriver = async (key: string) => (await (await request.get(`${api}/api/drivers?q=${key}&limit=10`)).json()).data.find((row: { external_id: string }) => row.external_id === key);
    const senna = await findDriver('ayrton-senna'); const prost = await findDriver('alain-prost');
    const career = (await (await request.get(`${api}/api/drivers/${senna.id}/career?locale=${locale}`)).json()).data[0];
    const firstWin = career.milestones.first_win;
    const a = (await (await request.get(`${api}/api/drivers/${senna.id}/seasons`)).json()).data;
    const b = (await (await request.get(`${api}/api/drivers/${prost.id}/seasons`)).json()).data;
    const shared = a.map((row: { year: number }) => row.year).filter((year: number) => b.some((row: { year: number }) => row.year === year)).sort((x: number, y: number) => y - x)[0];
    await page.setViewportSize(isMobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}`);
    const home = page.getByTestId('atlas-home');
    await expect(home.locator('a').filter({ hasText: t.start })).toHaveAttribute('href', `/${locale}/races/${firstWin.race.id}`);
    const rail = home.getByRole('region', { name: `${locale === 'uk' ? 'Стрічка історій' : 'Story rail'}: ${t.moments}`, exact: true });
    await expect(rail.getByRole('link', { name: new RegExp(firstWin.race.name) })).toHaveAttribute('href', `/${locale}/races/${firstWin.race.id}`);
    await rail.focus(); await rail.press('ArrowRight');
    await expect.poll(() => rail.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    const pair = home.getByTestId('season-perspectives');
    await expect(pair).toContainText(t.narrativeNote);
    for (const driver of [senna, prost]) await expect(pair.locator(`a[href="/${locale}/explorer/drivers/${driver.id}?year=${shared}"]`)).toBeVisible();
    const circuits = home.getByRole('region', { name: `${locale === 'uk' ? 'Стрічка історій' : 'Story rail'}: ${t.circuitsTitle}`, exact: true });
    for (const key of ['monaco', 'spa-francorchamps', 'suzuka']) {
      const circuit = (await (await request.get(`${api}/api/circuits?q=${key}&limit=5`)).json()).data.find((row: { external_id: string }) => row.external_id === key);
      await expect(circuits.locator(`a[href="/${locale}/circuits/${circuit.id}"]`)).toContainText(circuit.name);
    }
    await page.screenshot({ path: info.outputPath(`media-home-${locale}.png`), fullPage: true, scale: 'css' });
    await rail.getByRole('link', { name: new RegExp(firstWin.race.name) }).press('Enter');
    await expect(page.getByTestId('story-header').getByRole('heading', { level: 1 })).toHaveText(firstWin.race.name);
    await page.goto(`/${locale}/drivers/${senna.id}`);
    const profile = page.getByTestId('driver-showcase');
    await expect(profile.getByTestId('driver-opening')).toContainText(firstWin.race.name);
    await expect(profile.getByTestId('career-signature')).not.toBeVisible();
    await expect(profile.locator('#driver-timeline > summary')).toBeVisible();
    await profile.locator('#driver-timeline > summary').press('Enter');
    await expect(profile.locator('#driver-timeline')).toHaveAttribute('open', '');
    await expect(profile.locator('#driver-timeline a[href*="/explorer/drivers/"]').first()).toBeVisible();
    await expect(profile.locator('img')).toHaveCount(0);
    expect((await request.get(`${api}/api/drivers/${senna.id}/article?locale=${locale}`)).status()).toBe(404);
    expect(errors).toEqual([]); expect(remote).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
