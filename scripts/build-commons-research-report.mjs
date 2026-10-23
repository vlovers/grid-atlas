import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));

function safeOriginalUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'upload.wikimedia.org' &&
      !url.port && !url.username && !url.password && !url.search && !url.hash &&
      /^\/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\/[^/]+\.(?:jpe?g|png)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

/**
 * Create a metadata-only, research-only SHA-256 receipt from a fully verified batch.
 * A missing/blocked original is never represented as an inspected original.
 * This does not approve an image, its subject, or its license.
 */
export function buildCommonsResearchReport(batch, evidence, staging) {
  if (batch?.schema_version !== 1 || batch.kind !== 'commons_batch_research_ingestion_not_rights_approval' ||
      batch.publication_allowed !== false || !Array.isArray(batch.results) ||
      evidence?.schema_version !== 1 || evidence.lane !== 'research_only' || evidence.publication_allowed !== false ||
      !Array.isArray(evidence.entries) || staging?.schema_version !== 1 ||
      staging.lane !== 'research_only' || staging.publication_allowed !== false || !Array.isArray(staging.entries)) {
    throw Error('Invalid research-only input manifests');
  }
  const byId = new Map();
  for (const result of batch.results) {
    if (typeof result?.research_id !== 'string' || byId.has(result.research_id)) throw Error('Invalid or duplicate batch result');
    byId.set(result.research_id, result);
  }
  const sources = new Map();
  for (const source of evidence.entries) {
    if (typeof source?.research_id !== 'string' || sources.has(source.research_id)) throw Error('Invalid or duplicate Commons source evidence');
    sources.set(source.research_id, source);
  }
  const subjects = new Map();
  for (const item of staging.entries) {
    if (typeof item?.id !== 'string' || subjects.has(item.id)) throw Error('Invalid or duplicate staged candidate');
    subjects.set(item.id, item);
  }
  if (batch.total !== byId.size || batch.ingested !== byId.size || batch.blocked !== 0 ||
      byId.size !== sources.size || byId.size !== subjects.size || byId.size === 0) {
    throw Error('Incomplete Commons batch: every pinned candidate must be verified');
  }
  const entries = [];
  for (const [id, source] of sources) {
    const item = subjects.get(id), result = byId.get(id);
    if (!item || !result || result.status !== 'ingested' ||
        item.status !== 'candidate' || item.review !== null ||
        item.delivery?.local_path !== null || item.delivery?.remote_url !== null ||
        item.file_page_url !== source.file_page_url ||
        result.sha1 !== source.sha1 || result.bytes !== source.bytes ||
        result.mime !== item.image?.mime || result.width !== source.width ||
        result.height !== source.height ||
        source.source_author !== item.creator ||
        source.source_license !== item.license?.identifier ||
        !/^[a-f0-9]{40}$/.test(source.sha1 ?? '') ||
        !Number.isSafeInteger(source.bytes) || source.bytes < 16 ||
        source.width * source.height > 80_000_000 ||
        !/^[a-f0-9]{64}$/.test(result.sha256 ?? '') ||
        !/^[a-f0-9]{40}$/.test(result.sha1 ?? '') ||
        !Number.isSafeInteger(source.description_oldid) || source.description_oldid < 1 ||
        !Number.isSafeInteger(source.width) || source.width < 1 ||
        !Number.isSafeInteger(source.height) || source.height < 1 ||
        result.source_observation?.commons_file_page !== source.file_page_url ||
        !safeOriginalUrl(result.source_observation?.api_original_url) ||
        (result.source_observation.api_timestamp != null &&
          (typeof result.source_observation.api_timestamp !== 'string' ||
           !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.source_observation.api_timestamp) ||
           !Number.isFinite(Date.parse(result.source_observation.api_timestamp))))) {
      throw Error('Unverified or mismatched Commons receipt: ' + id);
    }
    entries.push({
      research_id: id, subject: item.subject, file_page_url: source.file_page_url,
      description_oldid: source.description_oldid,
      observed_original_sha1: result.sha1, locally_verified_sha256: result.sha256,
      bytes: result.bytes, width: source.width, height: source.height,
      observed_creator: source.source_author, observed_license: source.source_license,
      api_original_url: result.source_observation.api_original_url,
      api_timestamp: result.source_observation.api_timestamp ?? null,
      rights_review: 'pending', subject_review: 'pending', publication_allowed: false
    });
  }
  return {
    schema_version: 1, kind: 'commons_original_research_sha256_not_publication',
    publication_allowed: false, original_files_in_report: false,
    total: entries.length, entries
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'batch-report': { type: 'string' }, output: { type: 'string' } } });
    if (!values['batch-report'] || !values.output) throw Error('Usage: node scripts/build-commons-research-report.mjs --batch-report /path/batch.json --output /path/research.json');
    const report = buildCommonsResearchReport(
      JSON.parse(readFileSync(values['batch-report'], 'utf8')),
      load('docs/media/commons-original-evidence.json'),
      load('docs/media/cross-era-staging.json')
    );
    writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log('Research-only SHA-256 receipts verified: ' + report.total + '; publication_allowed=false');
  } catch (error) {
    console.error('Commons research report failed: ' + error.message);
    process.exitCode = 1;
  }
}
