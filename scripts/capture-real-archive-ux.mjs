import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw Error('Use before or after');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3481';
const api = process.env.PREVIEW_API || 'http://127.0.0.1:3480';
const output = new URL('../docs/design/real-archive-ux-v1/', import.meta.url);
await mkdir(new URL('screenshots/', output), { recursive: true });
const resolve = async (kind, external) => {
  const response = await fetch(`${api}/api/${kind}?q=${external}&limit=10`);
  if (!response.ok) throw Error(`${kind}: ${response.status}`);
  const row = (await response.json()).data.find(row => row.external_id === external);
  if (!row) throw Error(`Missing pinned identity: ${external}`);
  return `/${kind}/${row.id}`;
};
const subjects = [
  ['senna', await resolve('drivers', 'ayrton-senna'), '#driver-career'],
  ['mclaren', await resolve('constructors', 'mclaren'), '#constructor-season'],
  ['silverstone', await resolve('circuits', 'silverstone'), '[data-testid="circuit-experience"]'],
];
const browser = await chromium.launch();
const report = [];
try {
  for (const locale of ['en', 'uk']) for (const width of [1440, 834, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
    for (const [subject, route, section] of subjects) {
      const page = await context.newPage();
      const errors = []; const external = [];
      page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
      page.on('request', request => { if (new URL(request.url()).origin !== base) external.push(request.url()); });
      const response = await page.goto(`${base}/${locale}${route}?season=1988`);
      await page.locator('main h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      const file = `${phase}-${subject}-${locale}-${width}.jpg`;
      await page.screenshot({ path: new URL(`screenshots/${file}`, output).pathname, type: 'jpeg', quality: 86 });
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        height: document.documentElement.scrollHeight,
        headings: [...document.querySelectorAll('main :is(h1,h2,h3,h4,h5)')].map(node => ({ level: node.tagName, text: node.textContent })),
      }));
      if (width !== 834) {
        await page.locator(section).scrollIntoViewIfNeeded();
        await page.screenshot({ path: new URL(`screenshots/${phase}-${subject}-${locale}-${width}-detail.jpg`, output).pathname, type: 'jpeg', quality: 86 });
      }
      report.push({ phase, subject, locale, width, route, file, status: response.status(), errors, external, ...metrics });
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL(`${phase}.json`, output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ phase, pages: report.length, errors: report.flatMap(row => row.errors), maxOverflow: Math.max(...report.map(row => row.overflow)) }, null, 2));
if (report.some(row => row.status !== 200 || row.errors.length || row.external.length || row.overflow > 1)) process.exitCode = 1;
