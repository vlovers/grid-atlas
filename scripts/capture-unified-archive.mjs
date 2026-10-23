import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { 'web-origin': { type: 'string' }, 'api-origin': { type: 'string' }, output: { type: 'string' } } });
function origin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('An explicit HTTP(S) origin without credentials or path is required.');
  return url.origin;
}
const web = origin(values['web-origin']);
const api = origin(values['api-origin']);
const output = resolve(values.output ?? '/tmp/grid-atlas-unified-captures');
await mkdir(output, { recursive: true });
async function rows(path) {
  const response = await fetch(api + path, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Capture API failed: ${path}`);
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error('Malformed capture API envelope');
  return payload.data;
}
async function identity(kind, externalId) {
  const record = (await rows(`/api/${kind}?q=${externalId}&limit=5`)).find(row => row.external_id === externalId);
  if (!record) throw new Error(`Capture subject absent: ${externalId}`);
  return record;
}
const [driver, constructor, circuit] = await Promise.all([identity('drivers', 'ayrton-senna'), identity('constructors', 'mclaren'), identity('circuits', 'monaco')]);
const race = (await rows(`/api/circuits/${circuit.id}/races?limit=100`)).find(row => row.season_year === 1988);
if (!race) throw new Error('The real 1988 Monaco race is absent.');
const routes = [
  ['drivers', '/drivers'], ['constructors', '/constructors'], ['circuits', '/circuits'], ['seasons', '/seasons'],
  ['driver', `/drivers/${driver.id}`], ['constructor', `/constructors/${constructor.id}`], ['circuit', `/circuits/${circuit.id}`],
  ['season', '/seasons/1988'], ['race', `/races/${race.id}`],
];
const report = [];
for (const [engine, type] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await type.launch();
  try {
    for (const [locale, width] of [['en', 1440], ['uk', 390]]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
      for (const [label, path] of routes) {
        const response = await page.goto(`${web}/${locale}${path}`);
        if (response.status() !== 200) throw new Error(`Capture route failed: ${path}`);
        await page.locator('main h1').waitFor();
        if (['drivers', 'constructors', 'circuits'].includes(label)) await page.getByTestId('archive-features').waitFor();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (overflow > 1) throw new Error(`Capture overflow: ${locale}${path}`);
        const name = `${label}-${locale}-${width}-${engine}.png`;
        await page.screenshot({ path: resolve(output, name) });
        if (label === 'drivers' && engine === 'chromium') await page.getByTestId('archive-features').screenshot({ path: resolve(output, `discovery-${locale}-${width}.png`) });
        report.push({ engine, locale, path, width, heading: await page.locator('main h1').innerText(), overflow, screenshot: name });
      }
      if (errors.length) throw new Error(errors.join('\n'));
      await page.close();
    }
  } finally { await browser.close(); }
}
await writeFile(resolve(output, 'report.json'), JSON.stringify({ captured_on: new Date().toISOString(), canonical_ids: { driver: driver.id, constructor: constructor.id, circuit: circuit.id, race: race.id }, checks: report }, null, 2) + '\n');
console.log(`${report.length} genuine archive captures passed; ${output}`);
