import { test, expect } from '@playwright/test';
import uk from '../../apps/web/messages/uk.json';
import en from '../../apps/web/messages/en.json';

test('Ukrainian is the default regardless of browser language or locale cookie', async ({ page, context }) => {
  await context.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/');
  await expect(page).toHaveURL('http://127.0.0.1:3340/uk');
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page).toHaveTitle(uk.UI.metadataTitle);
  await page.goto('/drivers?q=driver-a');
  await expect(page).toHaveURL('http://127.0.0.1:3340/uk/drivers?q=driver-a');
});

test('language switch preserves path, canonical ID and query parameters', async ({ page }) => {
  await page.goto('/uk/drivers?q=Synthetic&page=2');
  const english = page.getByRole('navigation', { name: 'Мова' }).getByRole('link', { name: 'English', exact: true });
  await expect(english).toHaveAttribute('href', '/en/drivers?q=Synthetic&page=2');
  await english.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('http://127.0.0.1:3340/en/drivers?q=Synthetic&page=2');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.UI.driversTitle);
  await expect(page.getByRole('link', { name: 'English', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.goto('/en/drivers/1');
  await page.getByRole('link', { name: 'Українська', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3340/uk/drivers/1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('driver-a');
});

test('unsupported locales and unknown dotted paths have Ukrainian fallbacks', async ({ page }) => {
  for (const path of ['/ru/drivers', '/fr/drivers', '/missing.txt']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: uk.UI.notFoundTitle })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page.locator('a[href^="/ru"]')).toHaveCount(0);
  }
});
