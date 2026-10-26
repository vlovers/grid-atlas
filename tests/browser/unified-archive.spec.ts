import { test, expect } from '@playwright/test';

const routes = ['/drivers', '/constructors', '/circuits', '/seasons', '/drivers/1', '/constructors/1', '/circuits/1', '/seasons/1950', '/races/1'];
for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: all archive templates share the editorial cover and accessible navigation`, async ({ page }, info) => {
    const errors: string[] = [];
    const remote: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) remote.push(request.url()); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of routes) {
      expect((await page.goto(`/${locale}${route}`))?.status(), route).toBe(200);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.getByTestId('editorial-hero')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length), route).toBe(0);
      const internal = await page.locator('main a[href^="/"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
      expect(internal.every(href => href === `/${locale}` || href?.startsWith(`/${locale}/`)), route).toBe(true);
    }
    await info.attach(`${locale}-race-cover`, { body: await page.screenshot(), contentType: 'image/png' });
    expect(errors).toEqual([]);
    expect(remote).toEqual([]);
  });

  test(`${locale}: discovery links open canonical profiles and keep search independent`, async ({ page }) => {
    for (const kind of ['drivers', 'constructors', 'circuits']) {
      await page.goto(`/${locale}/${kind}`);
      const features = page.getByTestId('archive-features');
      await expect(features).toBeVisible();
      const link = features.locator('h3 a').first();
      await expect(link).toHaveAttribute('href', new RegExp(`^/${locale}/${kind}/[1-9][0-9]*$`));
      await link.press('Enter');
      await expect(page.getByTestId('editorial-hero')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${locale}/${kind}/[1-9][0-9]*$`));
    }
    await page.goto(`/${locale}/drivers?q=no-match`);
    await expect(page.getByTestId('archive-features')).toHaveCount(0);
    await expect(page.locator('form[role="search"] input')).toHaveValue('no-match');
  });

  test(`${locale}: decade navigation works by keyboard and every recorded year stays linked`, async ({ page }) => {
    await page.goto(`/${locale}/seasons`);
    const control = page.locator('button[aria-controls="imported-years"]').last();
    await control.press('Enter');
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#imported-years a').first()).toBeVisible();
    const year = page.locator('#decade-1950 a[href$="/seasons/1950"]').first();
    await year.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${locale}/seasons/1950$`));
    await expect(page.getByTestId('season-calendar')).toBeVisible();
  });

  test(`${locale}: small screens, enlarged text, forced colors and section links remain usable`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    for (const route of ['/constructors', '/circuits/1', '/seasons', '/seasons/1950', '/races/1']) {
      await page.goto(`/${locale}${route}`);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => {
        const pixels = document.documentElement.scrollWidth - innerWidth;
        const offenders = pixels <= 1 ? [] : [...document.querySelectorAll('body *')]
          .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8).map(element => ({
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className : '',
            text: (element.textContent ?? '').trim().slice(0, 50),
            right: Math.round(element.getBoundingClientRect().right),
          }));
        return { pixels, offenders };
      });
      expect(overflow.pixels, `${route} overflowing elements: ${JSON.stringify(overflow.offenders)}`).toBeLessThanOrEqual(1);
      const anchors = await page.locator('main a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!.slice(1)));
      for (const id of anchors) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    }
  });
}
