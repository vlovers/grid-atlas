import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const stage = process.argv[2];
if (!['before', 'after'].includes(stage)) throw new Error('Use before or after');
const locale = process.argv[3] || 'en';
if (!['uk', 'en'].includes(locale)) throw new Error('Use uk or en');
const suffix = locale === 'en' ? '' : '-uk';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3373';
const api = process.env.PREVIEW_API || 'http://127.0.0.1:3372';
const records = (await (await fetch(`${api}/api/drivers?q=ayrton-senna`)).json()).data;
const senna = records.find(d => d.external_id === 'ayrton-senna');
if (!senna) throw new Error('The pinned archive must include Senna; never assume a numeric ID');
const directory = 'docs/design/grid-atlas-2/screenshots';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    for (const [name, path] of [['home', ''], ['drivers', '/drivers'], ['senna', `/drivers/${senna.id}`]]) {
      await page.goto(`${base}/${locale}${path}`);
      await page.locator('main section:not([role="status"]) h1').first().waitFor();
      await page.screenshot({ path: `${directory}/${stage}-${name}${suffix}-${device}.png`, fullPage: name === 'home', scale: 'css' });
      console.log(stage, name, device, await page.locator('main h1').innerText());
    }
    await page.close();
  }
} finally { await browser.close(); }
