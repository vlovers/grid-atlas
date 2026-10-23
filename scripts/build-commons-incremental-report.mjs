import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildCommonsResearchReport } from './build-commons-research-report.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const hex40 = /^[a-f0-9]{40}$/;
const hex64 = /^[a-f0-9]{64}$/;

/**
 * Combine a strictly verified selected batch with pinned earlier observations.
 * This is research coverage, NOT a five-file same-run receipt or rights review.
 * Never reads, exports or publishes original image bytes.
 */
export function buildIncrementalCommonsResearchReport(batch, evidence, staging, observations) {
  if (evidence?.schema_version !== 1 || evidence.lane !== 'research_only' ||
      evidence.publication_allowed !== false || !Array.isArray(evidence.entries) ||
      staging?.schema_version !== 1 || staging.lane !== 'research_only' ||
      staging.publication_allowed !== false || !Array.isArray(staging.entries) ||
      observations?.schema_version !== 1 || observations.lane !== 'research_only' ||
      observations.publication_allowed !== false || !Array.isArray(observations.entries)) {
    throw Error('Invalid research-only manifests');
  }
  const sources = new Map(), candidates = new Map(), prior = new Map();
  for (const item of evidence.entries) {
    if (typeof item?.research_id !== 'string' || sources.has(item.research_id) ||
        !hex40.test(item.sha1 ?? '') || !Number.isSafeInteger(item.bytes) ||
        item.bytes < 16) throw Error('Duplicate or invalid pinned Commons evidence');
    sources.set(item.research_id, item);
  }
  for (const item of staging.entries) {
    if (typeof item?.id !== 'string' || candidates.has(item.id) ||
        !sources.has(item.id) || item.file_page_url !== sources.get(item.id).file_page_url ||
        item.status !== 'candidate' || item.review !== null ||
        item.delivery?.local_path !== null || item.delivery?.remote_url !== null) {
      throw Error('Duplicate, unpinned or publishable staged candidate');
    }
    candidates.set(item.id, item);
  }
  if (!sources.size || sources.size !== candidates.size) throw Error('Staging and evidence coverage differ');
  for (const item of observations.entries) {
    const source = sources.get(item?.research_id);
    if (!source || prior.has(item.research_id) || !hex64.test(item.sha256 ?? '') ||
        item.sha1 !== source.sha1 || item.bytes !== source.bytes) {
      throw Error('Invalid or unpinned previous SHA-256 observation');
    }
    prior.set(item.research_id, item);
  }
  if (!Array.isArray(batch?.results) || batch.results.length === 0 ||
      batch.results.some(item => !sources.has(item?.research_id))) {
    throw Error('Selected batch must contain pinned candidates');
  }
  const selectedIds = new Set(batch.results.map(item => item.research_id));
  if (selectedIds.size !== batch.results.length) throw Error('Duplicate selected candidate');
  const subsetEvidence = { ...evidence, entries: evidence.entries.filter(item => selectedIds.has(item.research_id)) };
  const subsetStaging = { ...staging, entries: staging.entries.filter(item => selectedIds.has(item.id)) };
  // Reuse the exact strict original receipt validation for each selected candidate.
  const verified = buildCommonsResearchReport(batch, subsetEvidence, subsetStaging);
  const fresh = new Map(verified.entries.map(item => [item.research_id, item]));
  for (const [id, item] of fresh) {
    if (prior.has(id) && prior.get(id).sha256 !== item.locally_verified_sha256) {
      throw Error('New SHA-256 contradicts prior verified original: ' + id);
    }
  }
  const entries = evidence.entries.map(source => {
    const current = fresh.get(source.research_id), previous = prior.get(source.research_id);
    if (current) return { ...current, verification_status: 'verified_in_selected_run' };
    if (previous) return {
      research_id: source.research_id, file_page_url: source.file_page_url,
      observed_original_sha1: source.sha1, locally_verified_sha256: previous.sha256,
      bytes: source.bytes, verification_status: 'previously_observed',
      source_run_url: observations.source_run_url ?? null,
      rights_review: 'pending', subject_review: 'pending', publication_allowed: false
    };
    return {
      research_id: source.research_id, file_page_url: source.file_page_url,
      verification_status: 'pending_original', locally_verified_sha256: null,
      rights_review: 'pending', subject_review: 'pending', publication_allowed: false
    };
  });
  return {
    schema_version: 1, kind: 'commons_incremental_research_sha256_not_publication',
    publication_allowed: false, original_files_in_report: false,
    rights_review: 'pending', subject_review: 'pending',
    total_pinned: entries.length, verified_this_run: fresh.size,
    previously_observed_not_rechecked: entries.filter(item => item.verification_status === 'previously_observed').length,
    missing_sha256: entries.filter(item => item.verification_status === 'pending_original').length,
    complete_hash_coverage_not_rights_approval: entries.every(item => item.locally_verified_sha256 !== null),
    entries
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'batch-report': { type: 'string' }, output: { type: 'string' } } });
    if (!values['batch-report'] || !values.output) throw Error('Usage: node scripts/build-commons-incremental-report.mjs --batch-report /path/batch.json --output /path/research.json');
    const report = buildIncrementalCommonsResearchReport(
      JSON.parse(readFileSync(values['batch-report'], 'utf8')),
      load('docs/media/commons-original-evidence.json'),
      load('docs/media/cross-era-staging.json'),
      load('docs/media/verified-original-observations.json')
    );
    writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log('Incremental research: ' + report.verified_this_run + ' checked now, ' +
      report.previously_observed_not_rechecked + ' prior, ' + report.missing_sha256 + ' pending; publication_allowed=false');
  } catch (error) {
    console.error('Incremental Commons research failed: ' + error.message);
    process.exitCode = 1;
  }
}
