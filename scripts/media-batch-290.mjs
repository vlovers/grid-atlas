import { readFileSync, openSync, closeSync, fstatSync, constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { ingestCommonsOriginal } from './ingest-commons-original.mjs';
import { inspectOriginal, inspectImageBytes } from './inspect-media-original.mjs';
import { assertPrivateOriginalDirectory } from './private-original-directory.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const allowed = ['docs/media/candidates.json', 'docs/media/cross-era-staging.json', 'docs/media/batch-290-new-candidates.json'];

/** Resolve references to existing lanes. Never promotes research into publication. */
export function resolveBatch(batch, registries, identities) {
  if (batch?.schema_version !== 1 || batch.lane !== 'research_only' || batch.publication_allowed !== false || batch.entries?.length !== 12) throw Error('Expected twelve research-only references');
  const ids = new Set(), pages = new Set();
  return batch.entries.map(task => {
    if (!allowed.includes(task.registry)) throw Error('Unknown candidate registry');
    const registry = registries[task.registry];
    const matches = (registry.assets ?? registry.entries).filter(asset => asset.id === task.candidate_id);
    if (matches.length !== 1 || ids.has(task.candidate_id)) throw Error('Missing or duplicate candidate reference');
    ids.add(task.candidate_id);
    const candidate = matches[0], pin = task.source_observation;
    if (candidate.status !== 'candidate' || candidate.review !== null || candidate.delivery.local_path !== null || candidate.delivery.remote_url !== null) throw Error('Candidate crossed publication boundary');
    const normalize = value => decodeURIComponent(value).replaceAll('_', ' ');
    if (normalize(candidate.file_page_url) !== normalize(pin.file_page_url) || pages.has(normalize(pin.file_page_url))) throw Error('Duplicate or mismatched file page');
    pages.add(normalize(pin.file_page_url));
    if (!identities.subjects.some(subject => subject.type === candidate.subject.type && subject.id === candidate.subject.id)) throw Error('Unpinned F1DB subject');
    if (!/^[a-f0-9]{40}$/.test(pin.sha1) || !Number.isSafeInteger(pin.bytes) || pin.bytes < 1 || !Number.isSafeInteger(pin.description_oldid) || pin.description_oldid < 1 || !['image/jpeg', 'image/png'].includes(pin.mime) || !Number.isSafeInteger(pin.width) || pin.width < 1 || !Number.isSafeInteger(pin.height) || pin.height < 1) throw Error('Incomplete original pin');
    if (!task.blockers?.length || !task.derivative_chain || !task.proposed?.attribution || ['en', 'uk'].some(locale => !task.proposed.alt[locale] || !task.proposed.caption[locale])) throw Error('Incomplete review worklist');
    return { task, candidate };
  });
}

export function loadBatch() {
  const batch = read('docs/media/batch-290.json');
  const registries = Object.fromEntries(allowed.map(path => [path, read(path)]));
  return resolveBatch(batch, registries, read('docs/media/pilot-identities.json'));
}

export function originalInputs(resolved) {
  const rows = resolved.map(({ task, candidate }) => {
    const id = candidate.id.startsWith('research-') ? candidate.id : 'research-' + candidate.id;
    const pin = task.source_observation;
    return { entry: { ...candidate, id, file_page_url: pin.file_page_url, image: { mime: pin.mime, width: pin.width, height: pin.height }, creator: pin.creator, license: { identifier: pin.license } },
      evidence: { research_id: id, file_page_url: pin.file_page_url, description_oldid: pin.description_oldid, sha1: pin.sha1, bytes: pin.bytes, width: pin.width, height: pin.height, source_author: pin.creator, source_license: pin.license } };
  });
  const header = { schema_version: 1, lane: 'research_only', publication_allowed: false };
  return { staging: { ...header, entries: rows.map(row => row.entry) }, sourceEvidence: { ...header, entries: rows.map(row => row.evidence) } };
}

/** Local preview reads only named, source-matching originals from an owner-private directory. */
export function readPrivateOriginal(id, directory) {
  const resolved = loadBatch();
  const { staging, sourceEvidence } = originalInputs(resolved);
  const pin = sourceEvidence.entries.find(entry => entry.research_id === id);
  if (!pin || !/^research-[a-z0-9-]+$/.test(id)) throw Error('Unknown private original');
  const privateDir = assertPrivateOriginalDirectory(directory);
  const fd = openSync(join(privateDir, id + '.jpg'), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  let bytes;
  try {
    const file = fstatSync(fd);
    if (!file.isFile() || file.size !== pin.bytes || file.size > 40 * 1024 * 1024) throw Error('Private original size mismatch');
    bytes = readFileSync(fd);
  } finally { closeSync(fd); }
  const image = inspectImageBytes(bytes);
  const staged = staging.entries.find(entry => entry.id === id);
  if (bytes.length !== pin.bytes || createHash('sha1').update(bytes).digest('hex') !== pin.sha1 || image.width !== pin.width || image.height !== pin.height || image.mime !== staged.image.mime) throw Error('Private original differs from source pin');
  const observed = read('docs/media/verified-original-observations.json').entries.find(entry => entry.research_id === id);
  if (observed && createHash('sha256').update(bytes).digest('hex') !== observed.sha256) throw Error('Private original differs from observed SHA-256');
  return bytes;
}

export async function inspectBatch({ directory, download = false }) {
  const outputDir = assertPrivateOriginalDirectory(directory);
  const resolved = loadBatch(), inputs = originalInputs(resolved);
  const observations = read('docs/media/verified-original-observations.json');
  const results = [];
  let throttled = false;
  for (const [index, entry] of inputs.staging.entries.entries()) {
    const candidate_id = resolved[index].candidate.id;
    try {
      if (throttled) throw Error('Not attempted after Commons rate limit; no automatic retry');
      const inspection = download ? await ingestCommonsOriginal({ researchId: entry.id, outputDir, ...inputs, originalObservations: observations })
        : inspectOriginal({ researchId: entry.id, filePath: join(outputDir, entry.id + '.jpg'), ...inputs,
          expectedSha256: observations.entries.find(item => item.research_id === entry.id)?.sha256 });
      results.push({ candidate_id, status: 'bytes_verified_not_rights_approved', sha256: inspection.local_original.sha256, sha1: inspection.local_original.sha1,
        bytes: inspection.local_original.bytes, width: inspection.local_original.width, height: inspection.local_original.height });
    } catch (error) {
      if (/429/.test(error.message)) throttled = true;
      results.push({ candidate_id, status: 'blocked', reason: error.message });
    }
  }
  return { schema_version: 1, lane: 'research_only', publication_allowed: false, observed_on: new Date().toISOString().slice(0, 10), results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { originals: { type: 'string' }, download: { type: 'boolean', default: false } } });
    if (values.download && !values.originals) throw Error('--download requires an owner-private --originals directory');
    const report = values.originals ? await inspectBatch({ directory: values.originals, download: values.download })
      : { candidates: loadBatch().length, publication_allowed: false };
    console.log(JSON.stringify(report, null, 2));
    if (report.results?.some(row => row.status === 'blocked')) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
