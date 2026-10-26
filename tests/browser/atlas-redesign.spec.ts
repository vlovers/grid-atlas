import { test, expect } from '@playwright/test';
import { editorialCopy } from '../../apps/web/src/components/editorial/copy';
import { atlasCopy } from '../../apps/web/src/components/atlas/copy';
import uk from '../../apps/web/messages/uk.json';
import en from '../../apps/web/messages/en.json';

for (const locale of ['uk', 'en'] as const) {
  const copy = atlasCopy[locale];
  const ui = (locale === 'uk' ? uk : en).UI;
  test(`${locale}: discovery uses available archive identities and years, then submits a bounded driver search`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const home = page.getByTestId('atlas-home');
    await expect(home.getByRole('heading', { level: 1 })).toHaveText(editorialCopy[locale].homeTitle);
    await expect(home.getByTestId('career-signature')).toHaveCount(0);
    await expect(home.getByTestId('home-season-cover')).toBeVisible();
    await expect(home.getByTestId('career-signature')).toHaveCount(0);
    const decades = home.getByRole('navigation', { name: copy.decade });
    await expect(decades.getByRole('button')).toHaveCount(1);
    await decades.getByRole('button').press('Enter');
    await expect(decades.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    const years = home.getByRole('navigation', { name: copy.seasonLabel });
    await expect(years.getByRole('link')).toHaveCount(2);
    await expect(years.getByRole('link').first()).toHaveAttribute('href', `/${locale}/seasons/1950`);
    await expect(home.locator('a[href*="/seasons/1952"]')).toHaveCount(0);
    await home.getByLabel(copy.search, { exact: true }).fill('driver-a');
    await home.getByRole('button', { name: copy.searchAction }).press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/drivers\\?q=driver-a$`));
    await expect(page.getByTestId('driver-catalogue').locator('.driver-grid > a')).toHaveCount(1);
  });

  test(`${locale}: driver index exposes page counts without inventing a total and supports empty/reset states`, async ({ page }) => {
    await page.goto(`/${locale}/drivers?q=Synthetic&page=2`);
    const catalogue = page.getByTestId('driver-catalogue');
    await expect(catalogue).toContainText(`5 ${copy.shown}`);
    await expect(catalogue).toContainText('101—105');
    await expect(catalogue).toContainText(copy.final);
    await expect(page.getByRole('navigation', { name: ui.mainNavigation }).getByRole('link', { name: ui.driversTitle, exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByLabel(ui.searchLabel).fill('No-such-driver');
    await page.getByRole('button', { name: ui.search, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/drivers\\?q=No-such-driver$`));
    await expect(catalogue.getByText(ui.noMatches, { exact: true })).toBeVisible();
    await page.getByRole('link', { name: ui.resetSearch }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/drivers$`));
    await expect(catalogue.locator('.driver-grid > a')).toHaveCount(100);
  });

  test(`${locale}: career map opens actual seasonal evidence with keyboard and the dossier works without media`, async ({ page }) => {
    await page.goto(`/${locale}/drivers/1`);
    const profile = page.getByTestId('driver-showcase');
    await expect(profile.getByTestId('career-signature')).toContainText(copy.signatureNote);
    const disclosure = profile.locator('#driver-timeline');
    const summary = disclosure.locator('summary');
    await expect(summary).toBeVisible();
    await summary.focus();
    await expect(summary).toBeFocused();
    await summary.press('Enter');
    await expect(disclosure).toHaveAttribute('open', '');
    const map = profile.getByRole('figure').filter({ hasText: copy.chapter });
    await expect(map).toBeVisible();
    await expect(map.getByRole('link', { name: 'alpha, 1950: 1 ' + copy.recordedRaces })).toHaveAttribute('href', `/${locale}/explorer/drivers/1?year=1950&selected=1`);
    await expect(profile.locator('img')).toHaveCount(0);
    await map.getByRole('link', { name: 'alpha, 1950: 1 ' + copy.recordedRaces }).press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/explorer/drivers/1\\?year=1950&selected=1$`));
  });

  test(`${locale}: museum layouts reflow at 200 percent text, honor reduced motion and retain a keyboard skip link`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['', '/drivers?q=driver-a', '/drivers/1', '/drivers/3']) {
      await page.goto(`/${locale}${path}`);
      await expect(page.getByRole('heading', { level: 1, name: /^(?!Loading|Завантаження)/ })).toBeVisible();
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const animations = await page.locator('main').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
      expect(animations).toBe(0);
    }
    await page.goto(`/${locale}`);
    await page.getByRole('link', { name: ui.skip, exact: true }).press('Enter');
    await expect(page.locator('#content')).toBeFocused();
  });

  test(`${locale}: homepage outages use the localized error boundary, not invented discovery data`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:3341/${locale}`);
    await expect(page.getByRole('heading', { name: ui.errorTitle })).toBeVisible();
    await expect(page.getByRole('button', { name: ui.retry })).toBeVisible();
    await expect(page.getByTestId('atlas-home')).toHaveCount(0);
  });
}
