#!/usr/bin/env node
/**
 * Download source photographs to a PRIVATE staging directory, not public/.
 * Requires explicit human review of file page, license and caption before
 * moving any derivative to the editorial media registry.
 *
 * Usage: node scripts/editorial-media-intake.mjs --slug vettel-monza-2008
 *        node scripts/editorial-media-intake.mjs --all
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const candidates = {
  'vettel-monza-2008': 'File:Vettel Monza 2008.jpg',
  'brawn-2009': 'File:Jenson Button (Brawn BGP 001) on Sunday at 2009 Abu Dhabi Grand Prix.jpg',
};
const requested = process.argv.includes('--all')
  ? Object.keys(candidates)
  : [process.argv[process.argv.indexOf('--slug') + 1]].filter(Boolean);
if (!requested.length || requested.some(slug => !candidates[slug])) {
  console.error('Usage: node scripts/editorial-media-intake.mjs --all | --slug <candidate>');
  process.exitCode = 1;
} else {
  const dir = resolve('.grid-atlas/media-review');
  await mkdir(dir, { recursive: true });
  for (const slug of requested) {
    const api = new URL('https://commons.wikimedia.org/w/api.php');
    api.searchParams.set('action', 'query');
    api.searchParams.set('format', 'json');
    api.searchParams.set('prop', 'imageinfo');
    api.searchParams.set('iiprop', 'url|extmetadata|size|sha1');
    api.searchParams.set('titles', candidates[slug]);
    api.searchParams.set('iiurlwidth', '1600');
    try {
      const response = await fetch(api, { headers: { 'User-Agent': 'GridAtlasEditorialIntake/0.1 (manual review)' }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('Commons metadata HTTP ' + response.status);
      const data = await response.json();
      const page = Object.values(data.query?.pages ?? {})[0];
      const info = page?.imageinfo?.[0];
      if (!info?.url) throw new Error('Commons file not found: ' + candidates[slug]);
      const meta = info.extmetadata ?? {};
      const license = meta.LicenseShortName?.value ?? '';
      if (!/^(CC BY(?:-SA)? (?:2\.0|3\.0|4\.0))$/.test(license)) {
        throw new Error('License requires manual review: ' + license);
      }
      const imageUrl = info.thumburl ?? info.url;
      const sourceHost = new URL(info.url).hostname;
      if (sourceHost !== 'upload.wikimedia.org') throw new Error('Unexpected original image host: ' + sourceHost);
      const imageHost = new URL(imageUrl).hostname;
      if (imageHost !== 'upload.wikimedia.org') throw new Error('Unexpected image host: ' + imageHost);
      const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) });
      if (!imageResponse.ok) throw new Error('Image HTTP ' + imageResponse.status);
      const type = imageResponse.headers.get('content-type') ?? '';
      if (!/^image\/(jpeg|png|webp)$/.test(type)) throw new Error('Unexpected image MIME ' + type);
      const declaredLength = Number(imageResponse.headers.get('content-length') ?? 0);
      if (declaredLength > 15_000_000) throw new Error('Image exceeds 15MB');
      const bytes = Buffer.from(await imageResponse.arrayBuffer());
      if (bytes.length > 15_000_000 || bytes.length === 0) throw new Error('Invalid image size');
      const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!(type === 'image/jpeg' && jpeg || type === 'image/png' && png || type === 'image/webp' && webp)) throw new Error('Image bytes do not match declared MIME');
      const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
      const filename = slug + '.' + ext;
      await writeFile(resolve(dir, slug + '.json'), JSON.stringify({
        title: page.title, sourcePage: info.descriptionurl, originalUrl: info.url,
        license, licenseUrl: meta.LicenseUrl?.value ?? '',
        artistHtml: meta.Artist?.value ?? '', creditHtml: meta.Credit?.value ?? '',
        originalSha1: info.sha1, originalSize: info.size,
        stagedFile: filename, retrievedAt: new Date().toISOString(),
        status: 'UNREVIEWED — DO NOT PUBLISH',
      }, null, 2) + '\n', { flag: 'wx' });
      await writeFile(resolve(dir, filename), bytes, { flag: 'wx' });
      console.log('Staged ' + slug + ' (' + bytes.length + ' bytes); review ' + slug + '.json before publishing.');
    } catch (error) {
      console.error(slug + ': ' + error.message);
      process.exitCode = 1;
    }
  }
}
