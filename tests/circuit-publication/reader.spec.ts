import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { chooseCircuitOption } from '../browser/circuit-select-option';
type State = { published: string; private: string; outage: string; malformed: string; xss: string;
  revocable: Record<string, string>; sourceRevocable: Record<string, string>; media: Record<string, string>;
  diagrams: Record<string, { circuit: string; race: string; external_race: string; layout: string }>; articleRequests: number };
const origin = 'http://127.0.0.1:3345';
const evidencePath = 'docs/design/circuit-production-reader/screenshots';

test('exact canonical diagram renders, local reselection hides its snapshot, and withdrawal blocks a fresh request', async ({ page, request }, info) => {
  let documents = 0;
  page.on('request', request => { if (request.isNavigationRequest() && request.resourceType() === 'document') documents++; });
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  const record = state.diagrams[info.project.name];
  expect(record.external_race).not.toBe(record.race);
  await page.goto(`/en/circuits/${record.circuit}?race=${record.race}`);
  const diagram = page.getByTestId('circuit-track-visual').locator('img');
  await expect(diagram).toBeVisible();
  await expect(diagram).toHaveAttribute('alt', 'Synthetic diagram test geometry, not a real circuit');
  const select = page.getByTestId('circuit-layout-select');
  await chooseCircuitOption(select, ''); await chooseCircuitOption(select, record.layout);
  await expect(diagram).toHaveCount(0);
  const openEvent = page.getByRole('button', { name: 'Open this event record' });
  await openEvent.focus(); await page.keyboard.press('Enter');
  await expect(diagram).toBeVisible();
  expect(documents).toBeGreaterThanOrEqual(2);
  expect((await request.post(`${origin}/__fixture/withdraw-diagram-${info.project.name}`, { headers: { Authorization: `Bearer ${process.env.CIRCUIT_BROWSER_CONTROL_TOKEN}` } })).ok()).toBeTruthy();
  await chooseCircuitOption(select, ''); await chooseCircuitOption(select, record.layout);
  await expect(diagram).toHaveCount(0);
  await openEvent.focus(); await page.keyboard.press('Enter');
  await expect(diagram).toHaveCount(0);
  expect(await page.content()).not.toContain('SYNTHETIC DIAGRAM TEST');
});

test('removing real claim evidence invalidates the trusted projection and removes public prose', async ({ page, request }, info) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  const id = state.sourceRevocable[info.project.name];
  await page.goto(`/en/circuits/${id}`);
  await expect(page.getByTestId('circuit-reviewed-article')).toBeVisible();
  await expect(page.getByTestId('circuit-reviewed-article').getByRole('link', { name: 'Synthetic evidence' })).toBeVisible();
  expect((await request.post(`${origin}/__fixture/remove-evidence-${info.project.name}`, { headers: { Authorization: `Bearer ${process.env.CIRCUIT_BROWSER_CONTROL_TOKEN}` } })).ok()).toBeTruthy();
  expect((await request.get(`${origin}/api/circuits/${id}/article?locale=en`)).status()).toBe(404);
  await page.reload();
  await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
  await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
});

test('actual production route stops selecting and rendering withdrawn media without a rebuild', async ({ page, request }, info) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  const id = state.media[info.project.name];
  await page.goto(`/en/circuits/${id}`);
  const image = page.getByTestId('editorial-hero').locator('img');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('alt', 'Synthetic square, not historical photography');
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth === 80)).toBe(true);
  const result = await request.post(`${origin}/__fixture/withdraw-media-${info.project.name}`, { headers: { Authorization: `Bearer ${process.env.CIRCUIT_BROWSER_CONTROL_TOKEN}` } });
  expect(result.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByTestId('circuit-dossier').locator('img')).toHaveCount(0);
  expect(await page.content()).not.toContain('SYNTHETIC MEDIA TEST');
  await expect(page.getByTestId('circuit-record-cover')).toBeVisible();
});

for (const locale of ['en', 'uk']) test(`${locale}: real trusted article, sources, keyboard and mobile reflow`, async ({ page, request }, info) => {
  const state: State = await (await request.get(`${origin}/__fixture`)).json();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/${locale}/circuits/${state.published}`);
  const article = page.getByTestId('circuit-reviewed-article');
  await expect(page.getByTestId('circuit-moments')).toHaveCount(0);
  await expect(page.getByTestId('circuit-biography')).toHaveCount(0);
  await expect(article).toContainText(locale === 'uk' ? 'Синтетична редакційна стаття' : 'Synthetic editorial article');
  await expect(article.getByRole('link', { name: 'Synthetic evidence' }).first()).toHaveAttribute('href', /^https:\/\/example.org\//);
  await expect(article.getByRole('link', { name: 'Synthetic evidence' }).first()).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(article.getByRole('navigation', { name: locale === 'uk' ? 'Розділи статті' : 'Article chapters' }).getByRole('link')).toHaveCount(2);
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
  await expect(page.getByTestId('circuit-moments')).toBeVisible();
  await expect(page.getByTestId('circuit-corner-guide')).toHaveCount(0);
  await expect(page.getByTestId('circuit-record-introduction')).toContainText('No linked race records');
  await expect(page.getByTestId('circuit-reading-journey')).toContainText('Races will appear here');
  await expect(page.getByTestId('circuit-reviewed-article')).toHaveCount(0);
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
