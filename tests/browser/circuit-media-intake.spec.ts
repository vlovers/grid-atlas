import { fork, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

let server: ChildProcess;
let origin: string;
const intake = JSON.parse(readFileSync('docs/media/circuit-intake-410/intake.json', 'utf8'));
test.beforeAll(async () => {
  server = fork('apps/web/src/components/media/circuit-visual-intake/preview/server.cjs', [], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  let errors = '';
  server.stderr?.on('data', bytes => { errors += bytes.toString(); });
  origin = await new Promise<string>((resolve, reject) => {
    server.once('message', message => resolve((message as { url: string }).url));
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Proposal server exited${code}: ${errors.slice(-2500)}`)));
  });
});
test.afterAll(() => { server?.kill('SIGTERM'); });

for (const locale of ['en', 'uk'] as const) {
  const uk = locale === 'uk';
  test(`${locale}: all20 source-bound reader contexts remain image-free and outside production`, async ({ page, request, baseURL }) => {
    test.setTimeout(90_000);
    const external: string[] = [];
    page.on('request', req => { if (/^https?:/.test(req.url()) && new URL(req.url()).origin !== origin) external.push(req.url()); });
    const response = await page.goto(`${origin}/${locale}`);
    expect(response?.headers()['cache-control']).toContain('no-store');
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByTestId('circuit-visual-proposal')).toHaveAttribute('data-circuit', 'monaco');
    await expect(page.locator('main img, main svg, main canvas, main video')).toHaveCount(0);
    await expect(page.getByLabel(uk ? 'Оберіть трасу' : 'Choose a circuit').locator('option')).toHaveCount(20);
    for (const entry of intake.entries) {
      const result = await request.get(`${origin}/${locale}?circuit=${entry.circuit_id}`);
      expect(result.status()).toBe(200);
      const html = await result.text();
      expect(html).toContain(`data-circuit="${entry.circuit_id}"`);
      expect(html).toContain(entry.layout_id);
      expect(html).toContain(String(entry.reference_year));
      const productHtml = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];
      expect(productHtml).toBeTruthy();
      expect(productHtml).not.toMatch(/<img\b|<svg\b|bend-review-|\/review\/[a-f0-9]+/);
    }
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
    expect((await request.post(`${origin}/${locale}`)).status()).toBe(404);
    expect((await request.get(`${origin}/${locale}`, { headers: { Host: 'outside.example' } })).status()).toBe(404);
    expect((await request.get(`${origin}/${locale}`, { headers: { 'sec-fetch-site': 'cross-site' } })).status()).toBe(404);
    if (baseURL) expect((await request.get(`${baseURL}/${locale}/circuit-media410`)).status()).toBe(404);
  });

  test(`${locale}: keyboard reader/gallery/source review retains honest historical and rights states`, async ({ page }, testInfo) => {
    await page.goto(`${origin}/${locale}`);
    await page.getByLabel(uk ? 'Оберіть трасу' : 'Choose a circuit').selectOption('bugatti');
    const submit = page.getByRole('button', { name: uk ? 'Переглянути' : 'View archive', exact: true });
    await submit.focus(); await page.keyboard.press('Enter');
    await expect(page.getByTestId('circuit-visual-proposal')).toHaveAttribute('data-circuit', 'bugatti');
    await expect(page.getByTestId('rights-safe-diagram-slot')).toContainText(uk ? '8 поворотів' : '8 turns');
    await page.getByTestId('media-collection').locator('summary').press('Enter');
    await expect(page.getByTestId('editorial-empty-media')).toBeVisible();
    await expect(page.locator('img')).toHaveCount(0);
    await page.getByTestId('circuit-visual-proposal').screenshot({ path: testInfo.outputPath(`reader-${locale}.png`) });
    await page.getByRole('link', { name: uk ? 'Матриця джерел і прав' : 'Sources & rights intake', exact: true }).click();
    await expect(page.getByTestId('circuit-intake-record')).toHaveCount(20);
    const bahrain = page.locator('#intake-bahrain');
    const photo = bahrain.locator('details').filter({ hasText: uk ? 'Фотокандидат' : 'Photo candidate' });
    await photo.locator('summary').press('Enter');
    await expect(photo).toContainText('United Autosports');
    await expect(photo).toContainText('JEP');
    await expect(photo).toContainText(uk ? 'оригінал не завантажено' : 'original not downloaded');
    const sources = await photo.locator('a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).href));
    expect(sources.every(url => url.startsWith('https://'))).toBe(true);
    await bahrain.screenshot({ path: testInfo.outputPath(`source-conflict-${locale}.png`) });
    await expect(page.getByRole('button', { name: /approve|publish|схвалити|опублікувати/i })).toHaveCount(0);
  });

  test(`${locale}: contrast,320px reflow,200percent text and reduced motion remain usable`, async ({ page }) => {
    await page.goto(`${origin}/${locale}?circuit=mont-tremblant`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('rights-safe-diagram-slot')).toContainText('2001');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const contrast = await page.evaluate(() => {
      const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = (parts: number[]) => parts.map(value => { const n = value / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((sum, n, index) => sum + n * [.2126, .7152, .0722][index], 0);
      return [...document.querySelectorAll<HTMLElement>('p,a,label,button,select,h1,h2,h3,dt,dd,summary')].filter(node => node.getClientRects().length && node.textContent?.trim()).flatMap(node => {
        const style = getComputedStyle(node); let parent: HTMLElement | null = node; let background = 'rgb(238,232,220)';
        while (parent) { const color = getComputedStyle(parent).backgroundColor; if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') { background = color; break; } parent = parent.parentElement; }
        const a = luminance(rgb(style.color)), b = luminance(rgb(background)); const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
        return ratio + .02 < (large ? 3 : 4.5) ? [{ text: node.textContent?.trim().slice(0, 80), ratio }] : [];
      });
    });
    expect(contrast).toEqual([]);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.getByTestId('media-collection').locator('summary').press('Enter');
    await expect(page.getByTestId('editorial-empty-media')).toBeVisible();
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  });
}
