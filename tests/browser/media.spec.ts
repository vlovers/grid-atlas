import { fork, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';

const test = base.extend<object, { previewURL: string }>({
  previewURL: [async ({ browserName }, provide) => {
    expect(browserName).toBe('chromium');
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
