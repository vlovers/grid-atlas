import { fork, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';

const test = base.extend<object, { previewURL: string }>({
  previewURL: [async ({ browserName }, provide) => {
    expect(['chromium', 'webkit']).toContain(browserName);
    let server: ChildProcess | undefined;
    try {
      const url = await new Promise<string>((resolveURL, reject) => {
        server = fork(resolve(__dirname, '../../apps/web/src/components/media/preview/server.cjs'), {
          env: { ...process.env, PORT: '0', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
        });
        let stderr = '';
        server.stderr?.on('data', chunk => { stderr += chunk; });
        server.once('error', reject);
        server.once('exit', code => reject(new Error(`Media preview exited (${code}): ${stderr}`)));
        server.once('message', (message: { url: string }) => resolveURL(message.url));
      });
      await provide(url);
    } finally {
      if (server && server.exitCode === null) {
        const closed = new Promise<void>(resolve => server!.once('exit', () => resolve()));
        server.kill('SIGTERM'); await closed;
      }
    }
  }, { scope: 'worker' }],
});
test.setTimeout(90000); // Isolated Next.js preview compiles once per worker.

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: real-subject fallback is localized, responsive and makes no remote image request`, async ({ page, previewURL }, testInfo) => {
    const remote: string[] = [];
    page.on('request', req => { if (new URL(req.url()).hostname !== '127.0.0.1') remote.push(req.url()); });
    await page.goto(`${previewURL}/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main').getByRole('img')).toHaveCount(4);
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(page.getByRole('img', { name: new RegExp('Ayrton Senna') })).toBeVisible();
    await expect(page.getByText(locale === 'uk' ? 'Історичну конфігурацію не підтверджено' : 'Historical layout unconfirmed')).toBeVisible();
    expect(remote).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`media-${locale}-fallback.png`), fullPage: true });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test(`${locale}: synthetic approved image has alt text, accessible attribution and license links`, async ({ page, previewURL }) => {
    await page.goto(`${previewURL}/${locale}?test=verified`);
    const image = page.locator('main img');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute('alt', locale === 'uk' ? 'Перекреслений квадрат для тесту, а не справжня траса' : 'Crossed square test geometry, not a real circuit');
    await expect(image).toHaveJSProperty('naturalWidth', 500);
    const caption = page.locator('figcaption');
    await expect(caption).toContainText('Synthetic Fixture Creator');
    await expect(caption.getByRole('link', { name: 'Synthetic license fixture' })).toHaveAttribute('href', 'https://example.org/test-license');
    await expect(caption.getByRole('link', { name: locale === 'uk' ? 'Сторінка файлу' : 'File record' })).toHaveAttribute('href', 'https://example.org/test-file');
    const disclosure = caption.locator('summary');
    await disclosure.focus(); await page.keyboard.press('Enter');
    await expect(caption.getByText('None (synthetic fixture)', { exact: false })).toBeVisible();
    expect(await disclosure.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  });
}

test('missing file keeps its reserved aspect ratio and changes to an honest fallback after hydration', async ({ page, previewURL }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/media/missing.svg', async route => { await gate; await route.fulfill({ status: 404, body: '' }); });
  await page.goto(`${previewURL}/en?test=missing`, { waitUntil: 'domcontentloaded' });
  const frame = page.locator('figure > div').first();
  await frame.scrollIntoViewIfNeeded();
  const before = await frame.boundingBox();
  release();
  await expect(page.getByRole('img', { name: /Image temporarily unavailable/ })).toBeVisible();
  const after = await frame.boundingBox();
  expect(after?.height).toBe(before?.height);
  expect(after?.width).toBe(before?.width);
  await expect(page.locator('main img')).toHaveCount(0);
});

test('withdrawn media and mismatched historical layouts never request the image', async ({ page, previewURL }) => {
  for (const variant of ['withdrawn', 'wrong-race']) {
    const requests: string[] = [];
    const listener = (req: { url(): string }) => { if (req.url().includes('/media/fixture.svg')) requests.push(req.url()); };
    page.on('request', listener);
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    await page.goto(`${previewURL}/en?test=${variant}`);
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /Historical layout unconfirmed/ })).toBeVisible();
    expect(requests).toEqual([]);
    page.off('request', listener);
  }
});


for (const locale of ['uk','en'] as const) {
  test(`${locale}: image collections preserve attribution, distinguish illustrations and revoke changed assets`, async ({page,previewURL})=>{
    for (const variant of ['gallery-verified','gallery-car','gallery-ai']) {
      await page.goto(`${previewURL}/${locale}?test=${variant}`);
      const collection=page.getByTestId('media-collection');
      await expect(collection.locator('img')).toHaveCount(1);
      await expect(collection).toContainText('Synthetic Fixture Creator');
      await expect(collection.getByRole('link',{name:'Synthetic license fixture'})).toHaveAttribute('href','https://example.org/test-license');
      await expect(collection.locator('figcaption')).toContainText(variant!=='gallery-verified'?(locale==='uk'?'Ілюстрація боліда':'Car illustration'):(locale==='uk'?'Портрет':'Portrait'));
      if(variant==='gallery-ai')await expect(collection.locator('figcaption')).toContainText(locale==='uk'?'Згенерована ШІ ілюстрація · не архівна фотографія':'AI-generated illustration · not archival photography');
    }
    for (const variant of ['gallery-withdrawn','gallery-stale']) {
      const requests:string[]=[];const listener=(r:{url():string})=>{if(r.url().includes('/media/fixture.svg'))requests.push(r.url());};
      page.on('request',listener);
      await page.goto(`${previewURL}/${locale}?test=${variant}`);
      await expect(page.getByTestId('media-collection').locator('img')).toHaveCount(0);
      await page.getByTestId('media-collection').locator('summary').press('Enter');
      await expect(page.getByTestId('editorial-empty-media')).toBeVisible();
      expect(requests).toEqual([]);page.off('request',listener);
    }
  });
}

for (const locale of ['uk', 'en'] as const) {
  test(`${locale}: complete contact sheet enlarges with keyboard, traps focus and restores the trigger`, async ({ page, previewURL }, info) => {
    const forbidden: string[] = [];
    page.on('request', request => { if (request.url().includes('/media/forbidden-')) forbidden.push(request.url()); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${previewURL}/${locale}?test=gallery-multiple`);
    const collection = page.getByTestId('media-collection');
    await expect(collection.locator('figure')).toHaveCount(8);
    await expect(collection.locator('img')).toHaveCount(8);
    const frame = collection.locator('figure > div').first();
    expect(await frame.evaluate(el => getComputedStyle(el).borderTopWidth)).toBe('1px');
    expect(await frame.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    const trigger = collection.getByRole('button', { name: /(?:View image|Переглянути зображення)/ }).nth(6);
    await trigger.focus(); await trigger.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('status')).toHaveCount(0); // one polite counter, no competing live regions
    await expect(dialog.locator('[aria-live="polite"]')).toContainText('7 / 8');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('[aria-live="polite"]')).toContainText('8 / 8');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('[aria-live="polite"]')).toContainText('1 / 8');
    await expect(dialog.locator('figcaption')).toContainText('Synthetic Fixture Creator');
    await expect(dialog.locator('img')).toHaveJSProperty('naturalWidth', 500);
    await dialog.locator('summary').press('Enter');
    await expect(dialog).toContainText('None (synthetic fixture)');
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: info.outputPath(`gallery-viewer-${locale}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(dialog.locator('img')).toHaveCount(0);
    expect(forbidden).toEqual([]);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await collection.getByRole('button', { name: /(?:View image|Переглянути зображення)/ }).first().click();
    expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  });

  test(`${locale}: twelve-candidate desk stays local, filterable and honest without original bytes`, async ({ page, request, previewURL }, info) => {
    const remote: string[] = [];
    page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') remote.push(r.url()); });
    await page.goto(`${previewURL}/${locale}/batch`);
    const desk = page.getByTestId('media-review-workbench');
    await expect(desk.locator('article')).toHaveCount(12);
    await expect(desk.locator('img')).toHaveCount(0);
    await expect(desk).toContainText(locale === 'uk' ? '0 схвалено' : '0 approved');
    await desk.getByRole('button', { name: locale === 'uk' ? 'Боліди й команди' : 'Cars & constructors', exact: true }).click();
    await expect(desk.locator('article')).toHaveCount(3);
    await desk.getByRole('button', { name: locale === 'uk' ? 'Усі' : 'All', exact: true }).click();
    await desk.getByRole('searchbox').fill('prost');
    await expect(desk.locator('article')).toHaveCount(1);
    await desk.locator('summary').press('Enter');
    await expect(desk).toContainText('tobacco');
    const source = desk.getByRole('link', { name: /(?:Source revision|Ревізія джерела)/ });
    await expect(source).toHaveAttribute('href', /oldid=832228570/);
    await desk.getByRole('searchbox').fill('');
    await page.screenshot({ path: info.outputPath(`research-desk-${locale}.png`), fullPage: true });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect((await request.get(`${previewURL}/research-originals/research-unknown.jpg`)).status()).toBe(404);
    expect(remote).toEqual([]);
  });
}

test('local picture desk rejects foreign Host and never serves unknown or cross-site private originals', async ({ request, previewURL }) => {
  expect((await request.get(`${previewURL}/en/batch`, { headers: { Host: 'foreign.invalid' } })).status()).toBe(403);
  expect((await request.get(`${previewURL}/research-originals/research-schumacher-portrait-2007.jpg`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status()).toBe(404);
  expect((await request.get(`${previewURL}/research-originals/research-unknown.jpg`)).headers()['cache-control']).toBe('private, no-store');
});
