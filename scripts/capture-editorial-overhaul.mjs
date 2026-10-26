import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const phase = process.argv[2] ?? 'before';
const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:3461';
const api = process.env.OVERHAUL_API ?? 'http://127.0.0.1:3460';
const directory = process.env.EVIDENCE_DIR ?? '/private/tmp/grid-atlas-ux-evidence';
const data = async path => {
  const response = await fetch(api + path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return (await response.json()).data;
};
const resolve = async (kind, external) => {
  const record = (await data(`/api/${kind}?q=${external}&limit=20`)).find(row => row.external_id === external);
  if (!record) throw new Error(`Pinned archive identity missing: ${external}`);
  return record.id;
};
const driver = await resolve('drivers', 'ayrton-senna');
const constructor = await resolve('constructors', 'mclaren');
const monaco = await resolve('circuits', 'monaco');
const spa = await resolve('circuits', 'spa-francorchamps');
const routes = [
  ['home', ''], ['drivers', 'drivers'], ['constructors', 'constructors'], ['circuits', 'circuits?q=spa'],
  ['driver', `drivers/${driver}`], ['constructor', `constructors/${constructor}`],
  ['monaco', `circuits/${monaco}`], ['spa', `circuits/${spa}`],
  ['season-1988', 'seasons/1988'], ['season-2026', 'seasons/2026'],
  ['time-machine', `time-machine?kind=driver&id=${driver}&from=1987&to=1988`],
  ['atlas', `atlas?kind=driver&id=${driver}&year=1988`], ['explorer', `explorer/drivers/${driver}?year=1988`],
];
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const locale of ['uk', 'en']) for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    for (const [name, route] of routes.filter(([name]) => !process.env.CAPTURE_ROUTES || process.env.CAPTURE_ROUTES.split(',').includes(name))) {
      const errors = [];
      const listener = error => errors.push(error.message);
      page.on('pageerror', listener);
      const response = await page.goto(`${base}/${locale}/${route}`);
      await page.waitForLoadState('networkidle');
      for (const image of await page.locator('img[loading="lazy"]').all()) await image.scrollIntoViewIfNeeded();
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => { scrollTo(0, 0); return document.fonts.ready; });
      await page.screenshot({ path: `${directory}/${phase}-${name}-${locale}-${width}${process.env.VIEWPORT_ONLY ? '-viewport' : ''}.jpg`, type: 'jpeg', quality: 78, fullPage: !process.env.VIEWPORT_ONLY });
      results.push({ name, locale, width, status: response.status(), errors, ...await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        height: document.documentElement.scrollHeight,
        headings: [...document.querySelectorAll('main h2')].map(node => node.textContent),
        ukrainianFont: document.fonts.check('500 32px "Atlas Serif"', 'Ґґ Єє Іі Її Україна'),
      })) });
      page.off('pageerror', listener);
    }
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${directory}/${phase}.json`, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify({ pages: results.length, overflows: results.filter(row => row.overflow), errors: results.filter(row => row.errors.length), statuses: [...new Set(results.map(row => row.status))] }));
