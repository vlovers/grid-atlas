import { test, expect } from '@playwright/test';
import { storyCopy } from '../../apps/web/src/components/stories/copy';
import uk from '../../apps/web/messages/uk.json';
import en from '../../apps/web/messages/en.json';

for (const locale of ['uk', 'en'] as const) {
  const t = storyCopy[locale]; const ui = (locale === 'uk' ? uk : en).UI;
  test(`${locale}: art-led front page keeps no-result discovery honest and circuits actionable`, async ({ page }) => {
    const remote: string[] = [];
    page.on('request', request => { if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) remote.push(request.url()); });
    await page.goto(`/${locale}`);
    const home = page.getByTestId('atlas-home');
    await expect(home.locator('[data-art="velocity"]').first()).toBeVisible();
    await expect(home.getByText(t.noMoments, { exact: true })).toBeVisible();
    await expect(home.getByTestId('season-perspectives')).toContainText(t.narrativeEmpty);
    await expect(home.getByTestId('season-perspectives').locator('a[href*="/explorer/"]')).toHaveCount(0);
    await expect(home.getByTestId('career-signature')).not.toBeVisible();
    await expect(home.locator('img')).toHaveCount(0);
    const circuitRail = home.getByRole('region', { name: `${locale === 'uk' ? 'Стрічка історій' : 'Story rail'}: ${t.circuitsTitle}` });
    await expect(circuitRail.getByRole('link', { name: /100%_ Test Circuit/ })).toHaveAttribute('href', `/${locale}/circuits/1`);
    await circuitRail.getByRole('link', { name: /100%_ Test Circuit/ }).press('Enter');
    await expect(page.getByTestId('story-header').getByRole('heading', { level: 1 })).toHaveText('100%_ Test Circuit');
    expect(remote).toEqual([]);
  });

  test(`${locale}: motion pause is keyboard operable, persists between native routes and cancels active motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/${locale}`);
    const pause = page.getByRole('button', { name: locale === 'uk' ? 'Призупинити рух' : 'Pause motion', exact: true });
    await pause.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-story-motion', 'paused');
    await expect(page.getByRole('button', { name: locale === 'uk' ? 'Відновити рух' : 'Resume motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    await page.goto(`/${locale}/drivers/1`);
    await expect(page.locator('html')).toHaveAttribute('data-story-motion', 'paused');
    await page.getByRole('button', { name: locale === 'uk' ? 'Відновити рух' : 'Resume motion', exact: true }).press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-story-motion', 'running');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByRole('button', { name: locale === 'uk' ? 'Призупинити рух' : 'Pause motion', exact: true })).not.toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
  });

  test(`${locale}: driver cover opens a real race while graphics and archival tables remain behind disclosures`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${locale}/drivers/1`);
    const profile = page.getByTestId('driver-showcase');
    await expect(profile.locator('details[open]')).toHaveCount(0);
    await expect(profile.getByTestId('driver-opening')).toContainText('Synthetic shared-car race');
    await expect(profile.getByTestId('driver-opening').getByRole('heading', { level: 3 }).getByRole('link')).toHaveAttribute('href', `/${locale}/races/1`);
    await profile.locator('#driver-graphic > summary').press('Enter');
    await expect(profile.getByTestId('career-signature')).toBeVisible();
    await profile.locator('#driver-graphic > summary').press('Enter');
    await profile.getByTestId('driver-opening').getByRole('heading', { level: 3 }).getByRole('link').press('Enter');
    await expect(page.getByTestId('story-header').getByRole('heading', { level: 1 })).toHaveText('Synthetic shared-car race');
    await expect(page.getByRole('link', { name: 'driver-a ↗' })).toHaveAttribute('href', `/${locale}/drivers/1`);
    expect(errors).toEqual([]);
  });

  test(`${locale}: richer entity covers retain one heading, valid record links and enlarged-text reflow`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    for (const path of ['/seasons', '/seasons/1950', '/circuits/1', '/constructors/1', '/races/1']) {
      await page.goto(`/${locale}${path}`);
      await expect(page.getByTestId('story-header')).toBeVisible();
      await expect(page.locator('main h1')).toHaveCount(1);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await expect(page.getByRole('navigation', { name: ui.mainNavigation })).toBeVisible();
    }
  });
}
