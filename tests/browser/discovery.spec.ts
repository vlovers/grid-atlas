import { fork, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';

const previewScript = resolve(__dirname, '../../apps/web/src/components/discovery/preview/server.cjs');

const test = base.extend<object, { previewURL: string }>({
  previewURL: [async ({ browserName }, provide) => {
    // Each worker gets an ephemeral port; the component test needs no API or database.
    expect(browserName).toBe('chromium');
    let server: ChildProcess | undefined;
    try {
      const url = await new Promise<string>((resolve, reject) => {
        server = fork(previewScript, { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
        let stderr = '';
        server.stderr?.on('data', chunk => { stderr += chunk; });
        server.once('error', reject);
        server.once('exit', code => reject(new Error(`Preview exited (${code}): ${stderr}`)));
        server.once('message', (message: { url: string }) => resolve(message.url));
      });
      await provide(url);
    } finally {
      if (server && server.exitCode === null) {
        const closed = new Promise<void>(resolve => server!.once('exit', () => resolve()));
        server.kill('SIGTERM');
        await closed;
      }
    }
  }, { scope: 'worker' }],
});

test('quick facts distinguish zero from unavailable and explain counts with native keyboard disclosure', async ({ page, previewURL }) => {
  await page.goto(previewURL);
  const facts = page.getByRole('region', { name: 'Career quick facts' });
  await expect(facts.getByRole('definition').filter({ hasText: /^0$/ })).toBeVisible();
  await expect(facts.getByText('Unavailable', { exact: true })).toBeVisible();
  const disclosure = facts.locator('summary');
  await expect(facts.getByText('Fixture coverage note', { exact: true })).not.toBeVisible();
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(facts.getByText('Fixture coverage note', { exact: true })).toBeVisible();
  await expect(disclosure).toBeFocused();
  const outline = await disclosure.evaluate(node => getComputedStyle(node).outlineStyle);
  expect(outline).toBe('solid');
  await page.keyboard.press('Tab');
  await expect(facts.getByRole('link', { name: 'Fixture coverage note' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(facts.getByText('Fixture coverage note', { exact: true })).not.toBeVisible();
});

test('timeline preserves supplied periods and multiple constructors without inferring gaps or identity', async ({ page, previewURL }) => {
  await page.goto(previewURL);
  const timeline = page.getByRole('region', { name: 'Recorded career' });
  const entries = timeline.locator(':scope > ol > li');
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toContainText('2001');
  await expect(entries.nth(1)).toContainText('2003');
  await expect(timeline.getByText('2002', { exact: true })).toHaveCount(0);
  await expect(entries.nth(0).getByRole('link', { name: 'Fixture Constructor A' })).toHaveAttribute('href', '/preview/constructor-a');
  await expect(entries.nth(0).getByRole('link', { name: 'Fixture Constructor B' })).toHaveAttribute('href', '/preview/constructor-b');
  const detail = timeline.locator('summary');
  await detail.focus();
  await page.keyboard.press('Enter');
  await expect(timeline.getByText(/No merger, rename or continuous identity is implied/)).toBeVisible();
});

test('stable identities deduplicate repeated rows without merging names, seasons or distinct relations', async ({ page, previewURL }) => {
  await page.goto(`${previewURL}/?variant=identity`);
  const facts = page.getByRole('region', { name: 'Career quick facts' });
  await expect(facts.getByRole('term')).toHaveText(['Result entries', 'Distinct races with recorded results']);
  await expect(facts.getByRole('definition')).toHaveText(['3', '2']);
  const entries = page.getByRole('region', { name: 'Recorded career' }).locator(':scope > ol > li');
  await expect(entries).toHaveCount(2);
  for (const entry of await entries.all()) {
    const constructors = entry.getByRole('link', { name: 'Shared fixture name' });
    await expect(constructors).toHaveCount(2);
    await expect(constructors.nth(0)).toHaveAttribute('href', '/preview/constructor-a');
    await expect(constructors.nth(1)).toHaveAttribute('href', '/preview/constructor-b');
  }
  const journeys = page.getByRole('navigation', { name: 'Related archive journeys' }).getByRole('link');
  await expect(journeys).toHaveCount(2);
  await expect(journeys.nth(0)).toContainText('Recorded in the 2001 fixture season');
  await expect(journeys.nth(1)).toContainText('Recorded in the 2003 fixture season');
  for (const link of await journeys.all()) await expect(link).toHaveAttribute('href', '/preview/driver-a');
  await expect(page.getByText(/Duplicate (constructor|driver|observation) row/)).toHaveCount(0);
  await expect(page.locator('main a[href*="duplicate"]')).toHaveCount(0);
});

test('discovery cards and related journeys retain contextual destinations and work without scripts', async ({ page, previewURL }) => {
  await page.goto(previewURL);
  expect(await page.locator('script').count()).toBe(0);
  const cards = page.getByRole('region', { name: 'Contextual discovery' });
  await expect(cards.getByText('A supplied season for Fixture Driver A', { exact: true })).toBeVisible();
  await cards.getByRole('link', { name: 'Explore fixture season' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2001 fixture season');
  await page.goBack();
  const journeys = page.getByRole('navigation', { name: 'Related archive journeys' });
  const driver = journeys.getByRole('link', { name: /Fixture Driver A/ });
  await expect(driver).toContainText('Appears in the supplied season record');
  await driver.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture Driver A');
});

test('empty inputs show caller-owned messages without dead controls', async ({ page, previewURL }) => {
  await page.goto(`${previewURL}/?variant=empty`);
  for (const text of ['No supplied facts.', 'No supplied discovery records.', 'No supplied career entries.', 'No supplied related records.']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(page.locator('main a, main summary')).toHaveCount(0);
});

test('formatted locale values and labels pass through unchanged', async ({ page, previewURL }) => {
  await page.goto(`${previewURL}/?variant=fr`);
  const facts = page.getByRole('region', { name: 'Chiffres clés' });
  await expect(facts.getByText('Victoires', { exact: true })).toBeVisible();
  await expect(facts.getByText('Indisponible', { exact: true })).toBeVisible();
  await expect(facts.getByRole('definition').filter({ hasText: '1\u202f234,5' })).toBeVisible();
  await facts.locator('summary').click();
  await expect(facts.getByText('Données fictives pour tester le composant.', { exact: true })).toBeVisible();
});

test('long content fits narrow screens and increased text size; HTML stays escaped', async ({ page, previewURL }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${previewURL}/?variant=stress`);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.getByText('<script>window.fixtureInjected = true</script>', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => 'fixtureInjected' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  for (const link of await page.locator('main a').all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: testInfo.outputPath('discovery-long-320px.png'), fullPage: true });
});

test('reduced motion and forced colors retain keyboard interaction', async ({ page, previewURL }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto(previewURL);
  const action = page.getByRole('region', { name: 'Contextual discovery' }).getByRole('link').first();
  const duration = await action.evaluate(node => getComputedStyle(node).transitionDuration);
  expect(duration).toBe('0s');
  const disclosure = page.getByRole('region', { name: 'Career quick facts' }).locator('summary');
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Fixture coverage note' })).toBeVisible();
});

test('component text clears normal-text contrast requirements on its rendered backgrounds', async ({ page, previewURL }) => {
  await page.goto(previewURL);
  const results = await page.locator('.atlas-surface').evaluateAll(surfaces => {
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    return surfaces.flatMap(surface => [...surface.querySelectorAll('*')].filter(node =>
      [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim())
      && node.getBoundingClientRect().height > 0,
    ).map(node => {
      let backdrop: Element | null = node;
      while (backdrop && getComputedStyle(backdrop).backgroundColor === 'rgba(0, 0, 0, 0)') backdrop = backdrop.parentElement;
      const text = luminance(getComputedStyle(node).color);
      const background = luminance(getComputedStyle(backdrop!).backgroundColor);
      return { text: node.textContent, ratio: (Math.max(text, background) + .05) / (Math.min(text, background) + .05) };
    }));
  });
  expect(results.length).toBeGreaterThan(20);
  for (const result of results) expect(result.ratio, result.text ?? '').toBeGreaterThanOrEqual(4.5);
});

test('default preview has no viewport overflow and creates review evidence', async ({ page, previewURL }, testInfo) => {
  await page.goto(previewURL);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('discovery-default.png'), fullPage: true });
});
