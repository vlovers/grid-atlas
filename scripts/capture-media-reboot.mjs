import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3383';
const api = process.env.PREVIEW_API || 'http://127.0.0.1:3382';
const directory = process.env.CAPTURE_DIR || 'docs/design/media-reboot/screenshots';
const get = async path => (await (await fetch(`${api}${path}`)).json()).data;
const senna = (await get('/api/drivers?q=ayrton-senna&limit=10')).find(d => d.external_id === 'ayrton-senna');
const circuit = (await get('/api/circuits?q=monaco&limit=5')).find(c => c.external_id === 'monaco');
if (!senna || !circuit) throw new Error('Load the pinned archive first; IDs must be resolved, never assumed');
const career = (await get(`/api/drivers/${senna.id}/career`))[0];
const race = career.milestones.first_win?.race;
if (!race) throw new Error('Expected a recorded first-win race in the pinned pilot');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const locale of ['en', 'uk']) for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    for (const [name, path, ready] of [['home', '', 'atlas-home'], ['driver', `/drivers/${senna.id}`, 'driver-showcase'], ['circuit', `/circuits/${circuit.id}`, 'story-header'], ['race', `/races/${race.id}`, 'story-header']]) {
      await page.goto(`${base}/${locale}${path}`);
      await page.getByTestId(ready).waitFor();
      await page.screenshot({ path: `${directory}/${name}-${locale}-${device}.jpg`, fullPage: ['home', 'driver'].includes(name), type: 'jpeg', quality: 88, scale: 'css' });
      console.log(locale, device, name, await page.locator('main h1').innerText());
    }
    await page.close();
  }
} finally { await browser.close(); }
