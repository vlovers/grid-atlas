import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { auditCommonsEvidence } from './audit-commons-evidence.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const hex64 = /^[a-f0-9]{64}$/;
const validDay = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

/** Offline, read-only original-byte coverage; never an image approval. */
export function buildCommonsMediaReadiness(staging, evidence, observations) {
  const audit = auditCommonsEvidence(staging, evidence);
  if (!audit.ok) throw Error('Invalid Commons source evidence: ' + audit.errors.join('; '));
  if (observations?.schema_version !== 1 || observations.lane !== 'research_only' ||
      observations.publication_allowed !== false || !Array.isArray(observations.entries) ||
      !validDay(observations.observed_on) ||
      !/^https:\/\/github\.com\/vlovers\/grid-atlas\/actions\/runs\/\d+$/.test(observations.source_run_url ?? '')) {
    throw Error('Invalid original binary observation provenance');
  }
  const sources = new Map(evidence.entries.map(entry => [entry.research_id, entry]));
  const receipts = new Map(), hashes = new Set();
  for (const receipt of observations.entries) {
    const source = sources.get(receipt?.research_id);
    if (!source || receipts.has(receipt.research_id) || !hex64.test(receipt.sha256 ?? '') ||
        hashes.has(receipt.sha256) || receipt.sha1 !== source.sha1 ||
        receipt.bytes !== source.bytes) {
      throw Error('Invalid, duplicate or unpinned original SHA-256 observation');
    }
    receipts.set(receipt.research_id, receipt);
    hashes.add(receipt.sha256);
  }
  const candidates = staging.entries.map(item => ({
    research_id: item.id,
    subject: { type: item.subject.type, id: item.subject.id },
    file_page_url: item.file_page_url,
    original_binary: receipts.has(item.id) ? 'sha256_observed' : 'pending_original',
    original_sha256: receipts.get(item.id)?.sha256 ?? null,
    rights_review: 'pending',
    subject_review: 'pending',
    locale_copy: 'pending',
    publication_allowed: false
  }));
  return {
    schema_version: 1,
    kind: 'commons_media_readiness_not_publication',
    publication_allowed: false,
    source_evidenced: candidates.length,
    binary_sha256_observed: receipts.size,
    binary_sha256_pending: candidates.length - receipts.size,
    rights_approved: 0,
    publication_ready: 0,
    observation_run_url: observations.source_run_url,
    observed_on: observations.observed_on,
    candidates
  };
}

export function renderCommonsMediaReadiness(report) {
  const lines = [
    '# Commons photographic media readiness (research only)', '',
    'This report is not image publication, rights clearance or subject verification.', '',
    '| Metric | Count |', '| --- | ---: |',
    '| Pinned source candidates | ' + report.source_evidenced + ' |',
    '| Observed original SHA-256 | ' + report.binary_sha256_observed + ' |',
    '| Original SHA-256 still pending | ' + report.binary_sha256_pending + ' |',
    '| Rights approved | 0 |', '| Publication ready | 0 |', '',
    '| Research ID | Subject | Original binary | Rights | Publication |',
    '| --- | --- | --- | --- | --- |'
  ];
  for (const item of report.candidates) {
    lines.push('| ' + item.research_id + ' | ' + item.subject.type + ':' + item.subject.id +
      ' | ' + item.original_binary + ' | pending | blocked |');
  }
  lines.push('', 'Original observation: ' + report.observed_on + ' (' + report.observation_run_url + ')',
    '', 'Missing original hashes require actual original-byte verification. Human identity, rights, and UK/EN copy review remain separate prerequisites.', '');
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { format: { type: 'string' }, output: { type: 'string' } } });
    if (values.format && !['json', 'markdown'].includes(values.format)) throw Error('Expected --format json or markdown');
    const report = buildCommonsMediaReadiness(
      load('docs/media/cross-era-staging.json'),
      load('docs/media/commons-original-evidence.json'),
      load('docs/media/verified-original-observations.json')
    );
    const result = values.format === 'markdown' ? renderCommonsMediaReadiness(report) :
      JSON.stringify(report, null, 2) + '\n';
    if (values.output) writeFileSync(values.output, result, { flag: 'wx', mode: 0o600 });
    else process.stdout.write(result);
  } catch (error) {
    console.error('Commons readiness failed: ' + error.message);
    process.exitCode = 1;
  }
}
