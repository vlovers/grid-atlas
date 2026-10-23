import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIncrementalCommonsResearchReport } from '../scripts/build-commons-incremental-report.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
function fixtures() {
  const evidence = load('docs/media/commons-original-evidence.json');
  const staging = load('docs/media/cross-era-staging.json');
  const observations = load('docs/media/verified-original-observations.json');
  const priorIds = new Set(observations.entries.map(item => item.research_id));
  const selected = evidence.entries.filter(item => !priorIds.has(item.research_id));
  const results = selected.map(item => ({
    research_id: item.research_id, status: 'ingested', sha1: item.sha1,
    sha256: 'a'.repeat(64), bytes: item.bytes, width: item.width, height: item.height,
    mime: staging.entries.find(entry => entry.id === item.research_id).image.mime,
    source_observation: {
      commons_file_page: item.file_page_url,
      api_original_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/test.jpg',
      api_timestamp: '2026-10-23T00:00:00Z'
    }
  }));
  const batch = {
    schema_version: 1, kind: 'commons_batch_research_ingestion_not_rights_approval',
    publication_allowed: false, total: results.length, ingested: results.length, blocked: 0, results
  };
  return { batch, evidence, staging, observations };
}
const build = args => buildIncrementalCommonsResearchReport(args.batch, args.evidence, args.staging, args.observations);

test('selected three originals reconcile with two pinned prior observations without rights approval', () => {
  const report = build(fixtures());
  assert.equal(report.total_pinned, 5);
  assert.equal(report.verified_this_run, 3);
  assert.equal(report.previously_observed_not_rechecked, 2);
  assert.equal(report.missing_sha256, 0);
  assert.equal(report.complete_hash_coverage_not_rights_approval, true);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.original_files_in_report, false);
  assert.ok(report.entries.every(item => item.rights_review === 'pending' && item.subject_review === 'pending' && item.publication_allowed === false));
  assert.ok(report.entries.filter(item => item.verification_status === 'previously_observed').every(item => item.source_run_url === fixtures().observations.source_run_url));
});

test('subset receipt explicitly reports remaining originals instead of claiming full coverage', () => {
  const args = fixtures();
  args.batch.results.pop();
  args.batch.total--; args.batch.ingested--;
  const report = build(args);
  assert.equal(report.verified_this_run, 2);
  assert.equal(report.previously_observed_not_rechecked, 2);
  assert.equal(report.missing_sha256, 1);
  assert.equal(report.complete_hash_coverage_not_rights_approval, false);
  assert.equal(report.entries.filter(item => item.verification_status === 'pending_original').length, 1);
});

test('rejects blocked, duplicate, unknown and source-tampered selected batches', () => {
  for (const mutate of [
    args => { args.batch.results[0].status = 'blocked'; },
    args => { args.batch.results[1].research_id = args.batch.results[0].research_id; },
    args => { args.batch.results[0].research_id = 'research-unpinned'; },
    args => { args.batch.results[0].sha1 = '0'.repeat(40); },
    args => { args.batch.results[0].sha256 = 'invalid'; },
    args => { args.batch.results[0].source_observation.commons_file_page = 'https://example.com'; },
    args => { args.batch.publication_allowed = true; }
  ]) {
    const args = fixtures(); mutate(args);
    assert.throws(() => build(args));
  }
});

test('rejects tampered earlier receipts and a changed hash for a previously verified candidate', () => {
  const args = fixtures();
  args.observations.entries[0].sha1 = '0'.repeat(40);
  assert.throws(() => build(args), /previous SHA-256 observation/);
  const changed = fixtures();
  const prior = changed.observations.entries[0];
  const source = changed.evidence.entries.find(item => item.research_id === prior.research_id);
  const candidate = changed.staging.entries.find(item => item.id === prior.research_id);
  changed.batch.results = [{
    research_id: prior.research_id, status: 'ingested', sha1: source.sha1,
    sha256: 'a'.repeat(64), bytes: source.bytes, width: source.width, height: source.height,
    mime: candidate.image.mime,
    source_observation: {
      commons_file_page: source.file_page_url,
      api_original_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/test.jpg',
      api_timestamp: null
    }
  }];
  changed.batch.total = 1; changed.batch.ingested = 1;
  assert.throws(() => build(changed), /contradicts prior verified original/);
});

test('rejects incomplete pinned inventories and any staged publication state', () => {
  const args = fixtures();
  args.evidence.entries.pop();
  assert.throws(() => build(args), /Staging and evidence coverage differ|unpinned|Invalid Commons staging or evidence/);
  const published = fixtures();
  published.staging.entries[0].delivery.local_path = '/media/forbidden.jpg';
  assert.throws(() => build(published), /publishable staged candidate|Invalid Commons staging or evidence/);
});

test('incremental receipt rejects staged publication hash and source URL drift', () => {
  const published = fixtures();
  published.staging.entries[0].content_sha256 = 'f'.repeat(64);
  assert.throws(() => build(published), /Invalid Commons staging or evidence/);

  const drift = fixtures();
  drift.staging.entries[0].source_url = 'https://commons.wikimedia.org/wiki/File:Unrelated.jpg';
  assert.throws(() => build(drift), /Invalid Commons staging or evidence/);
});

test('incremental receipt rejects duplicate Commons source pages even with matching source evidence', () => {
  const args = fixtures();
  args.staging.entries[1].file_page_url = args.staging.entries[0].file_page_url;
  args.staging.entries[1].source_url = args.staging.entries[0].file_page_url;
  args.evidence.entries[1].file_page_url = args.staging.entries[0].file_page_url;
  assert.throws(() => build(args), /Invalid Commons staging or evidence/);
});
