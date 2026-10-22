import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3461';
const api = process.env.PREVIEW_API || 'http://127.0.0.1:3460';
const output = new URL('../docs/design/editorial-racing-pr1/screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = [];
let sectionScreenshots = 0;
try {
  const resolve = async (kind, slug) => {
    const r = await fetch(`${api}/api/${kind}?q=${slug}&limit=5`);
    if (!r.ok) throw new Error(`${kind}: ${r.status}`);
    const identity = (await r.json()).data.find(row => row.external_id === slug);
    if (!identity) throw new Error(`Missing archive identity: ${slug}`);
    return `/${kind}/${identity.id}`;
  };
  const routes = [['home', ''], ['senna', await resolve('drivers', 'ayrton-senna')], ['mclaren', await resolve('constructors', 'mclaren')]];
  for (const locale of ['en', 'uk']) for (const width of [1440, 1920, 1024, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
    for (const [subject, route] of routes) {
      const page = await context.newPage(); const errors = []; const external = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (new URL(r.url()).origin !== base) external.push(r.url()); });
      await page.addInitScript(() => {
        window.__atlasCLS = 0;
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__atlasCLS += entry.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      const response = await page.goto(`${base}/${locale}${route}`);
      await page.locator('h1').last().waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      const file = `${phase}-${subject}-${locale}-${width}.jpg`;
      await page.screenshot({ path: new URL(file, output).pathname, type: 'jpeg', quality: 84 });
      const metrics = await page.evaluate(() => ({ cls: window.__atlasCLS, overflow: document.documentElement.scrollWidth - innerWidth, height: document.documentElement.scrollHeight, fonts: document.fonts.status }));
      report.push({ phase, subject, locale, width, status: response.status(), file, errors, external, ...metrics });
      if (phase === 'after' && width === 1440) {
        const sections = subject === 'home' ? ['#home-drivers-title', '#home-constructors-title', '#atlas-seasons']
          : subject === 'senna' ? ['#driver-biography', '#driver-teams', '#driver-moments']
            : ['[data-testid="constructor-archive-portrait"]', '#constructor-season', '[data-testid="constructor-key-eras"]'];
        for (const [index, selector] of sections.entries()) {
          await page.locator(selector).scrollIntoViewIfNeeded();
          await page.screenshot({ path: new URL(`${phase}-${subject}-${locale}-section-${index + 1}.jpg`, output).pathname, type: 'jpeg', quality: 84 });
          sectionScreenshots += 1;
        }
      }
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL(`../docs/design/editorial-racing-pr1/${phase}-capture.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ phase, viewportScreenshots: report.length, sectionScreenshots, errors: report.flatMap(r => r.errors), externalRequests: report.flatMap(r => r.external), maxOverflow: Math.max(...report.map(r => r.overflow)), maxCLS: Math.max(...report.map(r => r.cls)) }, null, 2));
if (report.some(r => r.status !== 200 || r.errors.length || r.external.length || r.overflow > 1)) process.exitCode = 1;
