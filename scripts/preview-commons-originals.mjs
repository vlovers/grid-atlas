#!/usr/bin/env node
/**
 * LOCAL RESEARCH PREVIEW ONLY. No public/media writes and no approval.
 * node scripts/preview-commons-originals.mjs [--offline]
 * Downloads only pinned Wikimedia Commons originals into an ignored local directory.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, '.grid-atlas', 'media-review');
const pinned = JSON.parse(await readFile(join(root, 'docs/media/commons-original-evidence.json'), 'utf8'));
const observed = JSON.parse(await readFile(join(root, 'docs/media/verified-original-observations.json'), 'utf8'));
if (pinned.lane !== 'research_only' || pinned.publication_allowed !== false ||
  observed.lane !== 'research_only' || observed.publication_allowed !== false) throw Error('Research-only manifest required');
const known = new Map(observed.entries.map(item => [item.research_id, item]));
const offline = process.argv.includes('--offline');
const descriptions = {
  'research-schumacher-portrait-2007': ['Michael Schumacher — portrait, 2007', 'Michael Schumacher — портрет, 2007'],
  'research-alonso-2024': ['Fernando Alonso — Silverstone, 2024', 'Fernando Alonso — Сільверстоун, 2024'],
  'research-mclaren-mp44-2007': ['McLaren MP4/4 — Donington museum, 2007 (not race footage)', 'McLaren MP4/4 — музей у Донінгтоні, 2007 (не фото з гонки)'],
  'research-ferrari-f2004-2004': ['Ferrari F2004 — source photo, 2004; exact event not established', 'Ferrari F2004 — фото, 2004; точну подію не встановлено'],
  'research-silverstone-2019': ['Silverstone circuit — venue photograph, 2019', 'Траса Сільверстоун — фотографія, 2019'],
};
const safeName = id => {
  if (!/^[a-z0-9-]+$/.test(id)) throw Error('Invalid research ID');
  return id;
};
const hex = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');
const escaped = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const status = [];
await mkdir(output, { recursive: true });
for (const item of pinned.entries) {
  const id = safeName(item.research_id);
  const title = decodeURIComponent(new URL(item.file_page_url).pathname.split('/').at(-1)).replace(/^File:/, '');
  const target = join(output, id + '.jpg');
  const verify = bytes => {
    if (hex('sha1', bytes) !== item.sha1) throw Error('SHA-1 mismatch');
    if (bytes.length !== item.bytes) throw Error('Original size mismatch');
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw Error('Invalid JPEG magic');
    const observation = known.get(id);
    if (observation && hex('sha256', bytes) !== observation.sha256) throw Error('Observed SHA-256 mismatch');
    return hex('sha256', bytes);
  };
  try {
    let bytes;
    try { bytes = await readFile(target); verify(bytes); }
    catch (e) {
      if (offline) throw Error('No verified cached original (' + e.message + ')');
      // Exact pinned filename; do not guess image URLs, use web page link for attribution.
      const url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + encodeURIComponent(title);
      let response = await fetch(url, { headers: { 'User-Agent': 'GridAtlasMediaReview/1.0 (local noncommercial research)' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw Error('Commons download HTTP ' + response.status);
      if (!['upload.wikimedia.org', 'commons.wikimedia.org'].includes(new URL(response.url).hostname)) throw Error('Unexpected download origin');
      bytes = Buffer.from(await response.arrayBuffer());
      const hash = verify(bytes);
      const temp = target + '.part';
      await writeFile(temp, bytes, { flag: 'w' });
      await rename(temp, target);
      console.log('Verified', id, bytes.length, hash);
    }
    status.push({ ...item, id, success: true, sha256: verify(bytes), name: id + '.jpg' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('BLOCKED', id, message);
    status.push({ ...item, id, success: false, error: message });
  }
}
const cards = status.map(item => {
  const [en, uk] = descriptions[item.id] || [item.id, item.id];
  return '<article><div class="photo">' + (item.success ? '<img loading="lazy" src="' + escaped(item.name) + '" alt="' + escaped(en) + '">' : '<div class="blocked">ORIGINAL UNAVAILABLE<br>' + escaped(item.error) + '</div>') +
    '</div><div class="body"><small>RESEARCH ONLY · NOT PUBLISHED</small><h2>' + escaped(en) + '</h2><p lang="uk">' + escaped(uk) + '</p><p>Photographer / creator: ' + escaped(item.source_author) + '</p><p>Declared license: ' + escaped(item.source_license) +
    ' · SHA-1 ' + escaped(item.sha1) + '</p><a href="' + escaped(item.file_page_url) + '">Original file record ↗</a><p class="block">Rights and editorial review pending. Do not publish, redistribute or use as a cleared site asset.</p></div></article>';
}).join('\n');
const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Grid Atlas · Real media review</title><style>body{background:#101316;color:#f4f0e9;margin:0;font:16px/1.55 system-ui}header{padding:3rem clamp(1rem,5vw,5rem);border-bottom:1px solid #42464b}h1{font-size:clamp(2rem,5vw,4rem);margin:.4rem 0}header p{max-width:75ch;color:#c6c9c9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:1.5rem;padding:2rem clamp(1rem,5vw,5rem)}article{border:1px solid #383c40;background:#191d21;min-width:0}.photo{height:330px;background:#0c0e10;display:grid;place-items:center}.photo img{width:100%;height:100%;object-fit:contain}.blocked{padding:2rem;color:#ec8c81;text-align:center}.body{padding:1.4rem}.body small{color:#ffad8b;letter-spacing:.1em}h2{line-height:1.16}.body a{color:#a6cbed}.block{border-top:1px solid #444;padding-top:1rem;color:#ffad8b}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style><header><small>GRID ATLAS / EDITORIAL DESK</small><h1>Real archival photography</h1><p>Actual original images, locally fetched and hash verified against pinned Wikimedia Commons file evidence. Research preview only: no independent human rights clearance, no production publication. Images may be missing when Commons rate-limits requests.</p></header><main class="grid">' + cards + '</main></html>';
await writeFile(join(output, 'index.html'), html);
await writeFile(join(output, 'status.json'), JSON.stringify({ research_only: true, publication_allowed: false, entries: status.map(({ id, success, sha256, error }) => ({ id, success, sha256: sha256 || null, error: error || null })) }, null, 2));
console.log('Review preview:', join(output, 'index.html'));
console.log('Verified originals:', status.filter(x => x.success).length, '/', status.length);
if (status.some(x => !x.success)) process.exitCode = 1;
