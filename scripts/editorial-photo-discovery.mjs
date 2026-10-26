#!/usr/bin/env node
/**
 * Discover Commons photographs for all ten editorial stories without copying
 * images into public/. Discovery is NOT licensing approval or publication.
 *
 * Usage: node scripts/editorial-photo-discovery.mjs
 * Output: .grid-atlas/media-review/discovery.json (gitignored)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const stories = {
  'lauda-hunt-1976': 'Niki Lauda James Hunt 1976 Formula One',
  'senna-prost-1988-89': 'Ayrton Senna Alain Prost McLaren 1988',
  'villeneuve-arnoux-1979': 'Gilles Villeneuve Rene Arnoux Dijon 1979',
  'vettel-monza-2008': 'Sebastian Vettel Toro Rosso Monza 2008',
  'button-canada-2011': 'Jenson Button Canada 2011 Formula One',
  'perez-sakhir-2020': 'Sergio Perez Sakhir 2020 Racing Point',
  'kubica-bmw-2008': 'Robert Kubica BMW Sauber Canada 2008',
  'schumacher-ferrari-1996-2000': 'Michael Schumacher Ferrari 2000',
  'massa-2008': 'Felipe Massa Brazil 2008 Ferrari',
  'brawn-2009': 'Jenson Button Brawn GP 2009',
};
const out = resolve('.grid-atlas/media-review');
await mkdir(out, { recursive: true });
const results = {};
let failed = false;
for (const [slug, query] of Object.entries(stories)) {
  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.search = new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: 'filetype:bitmap ' + query,
      gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo',
      iiprop: 'url|extmetadata|size', format: 'json',
    }).toString();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GridAtlasEditorialDiscovery/0.1 (research only)' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('Commons HTTP ' + response.status);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.info || 'Commons API error');
    const pages = Object.values(payload.query?.pages ?? {});
    results[slug] = {
      query, status: 'UNREVIEWED — DO NOT PUBLISH',
      candidates: pages.filter(page => page.imageinfo?.[0]).map(page => {
        const info = page.imageinfo[0];
        const metadata = info.extmetadata ?? {};
        return {
          title: page.title, filePage: info.descriptionurl,
          mime: info.mime ?? null, width: info.width, height: info.height,
          license: metadata.LicenseShortName?.value ?? null,
          licenseUrl: metadata.LicenseUrl?.value ?? null,
          artistHtml: metadata.Artist?.value ?? null,
          creditHtml: metadata.Credit?.value ?? null,
          restrictionsHtml: metadata.Restrictions?.value ?? null,
          review: { license: false, creator: false, subject: false, source: false, crop: false },
        };
      }),
    };
    console.log(slug + ': ' + results[slug].candidates.length + ' candidate(s)');
  } catch (error) {
    failed = true;
    results[slug] = { query, status: 'DISCOVERY_FAILED', error: String(error.message), candidates: [] };
    console.error(slug + ': ' + error.message);
  }
}
await writeFile(resolve(out, 'discovery.json'), JSON.stringify({
  schemaVersion: 1, purpose: 'Research candidates only; no publication approval',
  generatedAt: new Date().toISOString(), stories: results,
}, null, 2) + '\n');
if (failed) process.exitCode = 1;
