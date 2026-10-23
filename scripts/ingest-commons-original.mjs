import { randomUUID } from 'node:crypto';
import { closeSync, constants, linkSync, lstatSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { inspectOriginal } from './inspect-media-original.mjs';

const MAX_BYTES = 40 * 1024 * 1024;
const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));

/** Research-only. File title must come from a pinned Commons file page, never caller-supplied URLs. */
export function commonsFileTitle(filePage) {
  const url = new URL(filePage);
  if (url.protocol !== 'https:' || url.hostname !== 'commons.wikimedia.org' || url.port || url.username || url.password || url.search || url.hash || !url.pathname.startsWith('/wiki/File:')) {
    throw Error('Not a canonical Wikimedia Commons file page');
  }
  const title = decodeURIComponent(url.pathname.slice('/wiki/'.length)).replaceAll('_', ' ');
  if (!/^File:[^/\\?#]+$/u.test(title) || title.length > 260 || Array.from(title).some(char => char.charCodeAt(0) < 32)) throw Error('Invalid Commons file title');
  return title;
}

function exactImageInfo(payload, title, evidence) {
  const pages = payload?.query?.pages;
  if (!Array.isArray(pages) || pages.length !== 1 || pages[0]?.missing || !Array.isArray(pages[0]?.imageinfo) || pages[0].imageinfo.length !== 1) throw Error('Commons API returned ambiguous or missing file');
  const page = pages[0];
  if (page.title.replaceAll('_', ' ') !== title) throw Error('Commons API returned a different file title');
  const info = page.imageinfo[0];
  if (info.size !== evidence.bytes || info.width !== evidence.width || info.height !== evidence.height) throw Error('Commons metadata differs from pinned original evidence');
  if (typeof info.sha1 !== 'string' || !/^[a-f0-9]{40}$/.test(info.sha1) || info.sha1 !== evidence.sha1) throw Error('Commons API original SHA-1 differs from pinned evidence');
  const url = new URL(info.url);
  if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org' || url.port || url.username || url.password || url.search || url.hash || !url.pathname.startsWith('/wikipedia/commons/') || !/\.(?:jpg|jpeg|png)$/i.test(url.pathname)) {
    throw Error('Commons API supplied an unsafe original URL');
  }
  return { originalUrl: url.href, sourceTimestamp: info.timestamp ?? null };
}

async function responseOrFail(response, label) {
  if (!response?.ok || response.status !== 200 || response.redirected || !response.body) throw Error(label + ' failed or redirected');
  return response;
}

/**
 * Explicit opt-in downloader. A pinned Commons file page is resolved via the official
 * API, checked against recorded source evidence, and the original is verified offline.
 * Never writes the publication registry or treats a file as rights-approved.
 */
export async function ingestCommonsOriginal({ researchId, outputDir, staging, sourceEvidence, fetchImpl = globalThis.fetch }) {
  if (!/^research-[a-z0-9-]+$/.test(researchId ?? '')) throw Error('Invalid research ID');
  if (staging?.lane !== 'research_only' || staging.publication_allowed !== false || sourceEvidence?.lane !== 'research_only' || sourceEvidence.publication_allowed !== false) throw Error('Research-only manifest required');
  const matches = staging.entries?.filter(item => item.id === researchId) ?? [];
  const sources = sourceEvidence.entries?.filter(item => item.research_id === researchId) ?? [];
  if (matches.length !== 1 || sources.length !== 1) throw Error('Candidate needs exactly one pinned Commons source evidence record');
  const [entry] = matches, [evidence] = sources;
  if (entry.file_page_url !== evidence.file_page_url || !/^[a-f0-9]{40}$/.test(evidence.sha1)) throw Error('Pinned source evidence mismatch');
  if (entry.status !== 'candidate' || entry.review !== null || entry.delivery?.local_path !== null || entry.delivery?.remote_url !== null) throw Error('Candidate is not isolated from publication');
  if (!['image/jpeg', 'image/png'].includes(entry.image?.mime)) throw Error('Unsupported staged original format');
  const title = commonsFileTitle(entry.file_page_url);
  if (typeof outputDir !== 'string' || !outputDir) throw Error('Explicit existing output directory required');
  const directory = resolve(outputDir);
  const dirStat = lstatSync(directory);
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) throw Error('Output directory must not be a symlink');
  const apiUrl = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [key, value] of Object.entries({ action: 'query', prop: 'imageinfo', iiprop: 'url|size|sha1|timestamp', titles: title, format: 'json', formatversion: '2' })) apiUrl.searchParams.set(key, value);
  const apiResponse = await responseOrFail(await fetchImpl(apiUrl.href, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { accept: 'application/json' } }), 'Commons API request');
  const metadata = await apiResponse.json();
  const { originalUrl, sourceTimestamp } = exactImageInfo(metadata, title, evidence);
  const download = await responseOrFail(await fetchImpl(originalUrl, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { accept: 'image/jpeg,image/png' } }), 'Commons original request');
  const declaredLength = download.headers?.get('content-length');
  if (declaredLength !== null && declaredLength !== undefined && (!/^\d+$/.test(declaredLength) || Number(declaredLength) !== evidence.bytes)) throw Error('Commons Content-Length differs from pinned evidence');
  const ext = entry.image.mime === 'image/jpeg' ? '.jpg' : '.png';
  const finalPath = join(directory, researchId + ext);
  const tempPath = join(directory, '.' + researchId + '-' + randomUUID() + '.partial');
  let fd;
  try {
    fd = openSync(tempPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
    let total = 0;
    for await (const chunk of download.body) {
      if (!(chunk instanceof Uint8Array)) throw Error('Invalid Commons original stream');
      total += chunk.byteLength;
      if (total > evidence.bytes || total > MAX_BYTES) throw Error('Original exceeds pinned byte count or maximum size');
      let offset = 0;
      while (offset < chunk.byteLength) offset += writeSync(fd, chunk, offset, chunk.byteLength - offset);
    }
    closeSync(fd); fd = undefined;
    if (total !== evidence.bytes) throw Error('Downloaded original has unexpected byte count');
    const inspection = inspectOriginal({ filePath: tempPath, researchId, staging, sourceEvidence });
    // Atomic no-clobber: a concurrent process cannot replace an existing original.
    linkSync(tempPath, finalPath);
    return { ...inspection, source_observation: { commons_file_page: entry.file_page_url, api_original_url: originalUrl, api_timestamp: sourceTimestamp }, local_original: { ...inspection.local_original, path: finalPath }, publication_allowed: false };
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(tempPath, { force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { id: { type: 'string' }, 'output-dir': { type: 'string' } } });
    if (!values.id || !values['output-dir']) throw Error('Usage: node scripts/ingest-commons-original.mjs --id research-id --output-dir /existing/private/directory');
    const report = await ingestCommonsOriginal({ researchId: values.id, outputDir: values['output-dir'], staging: load('docs/media/cross-era-staging.json'), sourceEvidence: load('docs/media/commons-original-evidence.json') });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) { console.error('Commons ingestion failed: ' + error.message); process.exitCode = 1; }
}
