import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
type State = { published: string; private: string; outage: string; malformed: string; xss: string;
  revocable: Record<string, string>; articleRequests: number };
const origin = 'http://127.0.0.1:3345';
const evidencePath = 'docs/design/circuit-publication-396/screenshots';

for (const locale of ['en', 'uk']) test(`${locale}: real trusted article, sources, keyboard and mobile reflow`, async ({ page, request }, info) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/${locale}/circuits/${state.published}`);
  const article = page.getByTestId('circuit-reviewed-article');
  await expect(article).toContainText(locale === 'uk' ? 'Синтетична редакційна стаття' : 'Synthetic editorial article');
  await expect(article.getByRole('link', { name: 'Synthetic evidence' })).toHaveAttribute('href', /^https:\/\/example.org\//);
  await expect(article.getByRole('link').first()).toHaveAttribute('rel', 'noopener noreferrer');
  const tab = page.getByTestId('profile-section-nav').getByRole('link', { name: locale === 'uk' ? /Редакційна стаття/ : /Editorial article/ });
  await tab.focus(); await page.keyboard.press('Enter'); await expect(article).toBeFocused();
  // macOS Safari uses Option-Tab for links unless full keyboard access is enabled.
  const nextLink = info.project.name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(nextLink); await expect(article.getByRole('link').first()).toBeFocused();
  const directory = `${evidencePath}`; await mkdir(directory, { recursive: true });
  if ((info.project.name === 'desktop' && locale === 'en') || (info.project.name === 'mobile' && locale === 'uk')) {
    await article.screenshot({ path: `${directory}/${locale}-${info.project.name}-published.png` });
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expect.poll(() => article.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('UI off makes no editorial request; private and legacy AI drafts do not become public fallbacks', async ({ page, request }, info) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  await page.goto(`http://127.0.0.1:3347/en/circuits/${state.published}`);
  await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
  expect((await (await request.get(`${origin}/__fixture`)).json()).articleRequests).toBe(state.articleRequests);
  await page.goto(`/en/circuits/${state.private}`);
  await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
  await expect(page.getByTestId('circuit-moments')).toHaveCount(0);
  await expect(page.getByTestId('circuit-corner-guide')).toHaveCount(0);
  await expect(page.getByTestId('circuit-biography')).toContainText('pinned F1DB');
  await expect(page.getByTestId('circuit-article-status')).toContainText('not available yet');
  expect(await page.content()).not.toContain('PRIVATE CIRCUIT DRAFT NEVER RENDER');
  if (info.project.name === 'mobile') await page.screenshot({ path: `${evidencePath}/en-mobile-private-fallback.png` });
});

test('API flag off and malformed/outage responses retain records without prose leakage', async ({ page, request }) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  const control = (action: string) => request.post(`${origin}/__fixture/${action}`, { headers: { Authorization: `Bearer ${process.env.CIRCUIT_BROWSER_CONTROL_TOKEN}` } });
  expect((await control('read-off')).ok()).toBeTruthy();
  try {
    await page.goto(`/uk/circuits/${state.published}`);
    await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
  } finally { expect((await control('read-on')).ok()).toBeTruthy(); }
  for (const id of [state.outage, state.malformed]) {
    await page.goto(`/en/circuits/${id}`);
    await expect(page.getByTestId('circuit-dossier')).toBeVisible();
    await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
    await expect(page.getByTestId('circuit-article-status')).toContainText('temporarily unavailable');
    expect(await page.content()).not.toContain('PRIVATE INVALID RESPONSE');
  }
});

test('withdrawal invalidates API and next navigation; approved literal markup stays escaped', async ({ page, request }, info) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  await page.goto(`/en/circuits/${state.xss}`);
  await expect(page.getByTestId('circuit-reviewed-article')).toContainText('<script>window.__circuitXss=true</script>');
  expect(await page.evaluate(() => '__circuitXss' in window)).toBe(false);
  const circuit = state.revocable[info.project.name];
  await page.goto(`/en/circuits/${circuit}`); await expect(page.getByTestId('circuit-reviewed-article')).toBeVisible();
  const response = await request.get(`${origin}/api/circuits/${circuit}/article?locale=en`);
  expect(response.status()).toBe(200); expect(response.headers()['cache-control']).toContain('no-store');
  const withdrawn = await request.post(`${origin}/__fixture/withdraw-${info.project.name}`, { headers: { Authorization: `Bearer ${process.env.CIRCUIT_BROWSER_CONTROL_TOKEN}` } });
  expect(withdrawn.ok()).toBeTruthy();
  const unavailable = await request.get(`${origin}/api/circuits/${circuit}/article?locale=en`);
  expect(unavailable.status()).toBe(404); expect(unavailable.headers()['cache-control']).toContain('no-store');
  await page.reload(); await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
  await page.goto('/en/circuits');
  await page.locator(`a[href="/en/circuits/${circuit}"]`).first().click();
  await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
  await expect(page.getByTestId('profile-section-nav').getByRole('link', { name: /Editorial article/ })).toHaveCount(0);
  await expect(page.getByTestId('circuit-article-status')).toBeVisible();
  if (info.project.name === 'mobile') await page.getByTestId('circuit-article-status').screenshot({ path: `${evidencePath}/en-mobile-withdrawn.png` });
});
