import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCommonsResearchReport } from '../scripts/build-commons-research-report.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const fixtures = () => {
  const evidence = load('docs/media/commons-original-evidence.json');
  const staging = load('docs/media/cross-era-staging.json');
  const results = evidence.entries.map(item => ({
    research_id: item.research_id, status: 'ingested',
    sha1: item.sha1, sha256: 'a'.repeat(64), bytes: item.bytes,
    source_observation: {
      commons_file_page: item.file_page_url,
      api_original_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/test.jpg',
      api_timestamp: '2026-10-23T00:00:00Z'
    }
  }));
  const batch = {
    schema_version: 1, kind: 'commons_batch_research_ingestion_not_rights_approval',
    publication_allowed: false, total: results.length, ingested: results.length,
    blocked: 0, results
  };
  return { batch, evidence, staging };
};

test('emits complete metadata-only research receipts without approving images', () => {
  const args = fixtures();
  const report = buildCommonsResearchReport(args.batch, args.evidence, args.staging);
  assert.equal(report.total, 5);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.original_files_in_report, false);
  assert.ok(report.entries.every(item =>
    item.locally_verified_sha256 === 'a'.repeat(64) &&
    item.publication_allowed === false && item.rights_review === 'pending' &&
    item.subject_review === 'pending' && !('local_original' in item)));
});

test('rejects missing or blocked originals instead of creating partial evidence', () => {
  const args = fixtures();
  args.batch.results.pop();
  assert.throws(() => buildCommonsResearchReport(args.batch, args.evidence, args.staging), /Incomplete Commons batch/);
  const args2 = fixtures();
  args2.batch.results[0].status = 'blocked';
  assert.throws(() => buildCommonsResearchReport(args2.batch, args2.evidence, args2.staging), /Unverified or mismatched Commons receipt/);
});

test('rejects checksum, source page and publication-boundary drift', () => {
  for (const mutate of [
    args => { args.batch.results[0].sha1 = '0'.repeat(40); },
    args => { args.batch.results[0].sha256 = 'not-a-hash'; },
    args => { args.batch.results[0].source_observation.commons_file_page = 'https://example.com/'; },
    args => { args.staging.entries[0].review = { reviewer: 'not allowed' }; },
    args => { args.batch.publication_allowed = true; }
  ]) {
    const args = fixtures(); mutate(args);
    assert.throws(() => buildCommonsResearchReport(args.batch, args.evidence, args.staging));
  }
});

test('rejects duplicate receipts and duplicate pinned evidence', () => {
  const args = fixtures();
  args.batch.results[1].research_id = args.batch.results[0].research_id;
  assert.throws(() => buildCommonsResearchReport(args.batch, args.evidence, args.staging), /duplicate batch result/);
  const args2 = fixtures();
  args2.evidence.entries[1].research_id = args2.evidence.entries[0].research_id;
  assert.throws(() => buildCommonsResearchReport(args2.batch, args2.evidence, args2.staging), /duplicate Commons source evidence/);
});
