import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCommonsMediaReadiness, renderCommonsMediaReadiness } from '../scripts/build-commons-media-readiness.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const fixtures = () => ({
  staging: load('docs/media/cross-era-staging.json'),
  evidence: load('docs/media/commons-original-evidence.json'),
  observations: load('docs/media/verified-original-observations.json')
});
const build = args => buildCommonsMediaReadiness(args.staging, args.evidence, args.observations);

test('reports verified original hashes separately from publication approval', () => {
  const report = build(fixtures());
  assert.equal(report.source_evidenced, 5);
  assert.equal(report.binary_sha256_observed, 2);
  assert.equal(report.binary_sha256_pending, 3);
  assert.equal(report.rights_approved, 0);
  assert.equal(report.publication_ready, 0);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.candidates.filter(item => item.original_binary === 'pending_original').length, 3);
  assert.ok(report.candidates.every(item => item.rights_review === 'pending' && item.publication_allowed === false));
  const markdown = renderCommonsMediaReadiness(report);
  assert.match(markdown, /Original SHA-256 still pending \| 3/);
  assert.match(markdown, /research-silverstone-2019/);
});

test('refuses invalid source evidence and publication leakage', () => {
  const bad = fixtures();
  bad.staging.entries[0].content_sha256 = 'a'.repeat(64);
  assert.throws(() => build(bad), /Invalid Commons source evidence/);
  const duplicate = fixtures();
  duplicate.evidence.entries[1].file_page_url = duplicate.evidence.entries[0].file_page_url;
  assert.throws(() => build(duplicate), /Invalid Commons source evidence/);
});

test('refuses duplicate, forged, or unpinned original binary receipts', () => {
  for (const mutate of [
    args => { args.observations.entries[1].sha256 = args.observations.entries[0].sha256; },
    args => { args.observations.entries[0].sha256 = 'invalid'; },
    args => { args.observations.entries[0].research_id = 'research-not-pinned'; },
    args => { args.observations.entries[0].bytes += 1; }
  ]) {
    const args = fixtures();
    mutate(args);
    assert.throws(() => build(args), /Invalid, duplicate or unpinned/);
  }
});

test('refuses fabricated provenance and impossible observation dates', () => {
  const badRun = fixtures();
  badRun.observations.source_run_url = 'https://example.com/run';
  assert.throws(() => build(badRun), /Invalid original binary observation provenance/);
  const badDate = fixtures();
  badDate.observations.observed_on = '2026-02-30';
  assert.throws(() => build(badDate), /Invalid original binary observation provenance/);
});
