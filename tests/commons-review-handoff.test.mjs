import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCommonsReviewHandoff } from '../scripts/build-commons-review-handoff.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
function fixtures() {
  return {
    staging: read('docs/media/cross-era-staging.json'),
    evidence: read('docs/media/commons-original-evidence.json'),
    observations: read('docs/media/verified-original-observations.json'),
    identities: read('docs/media/pilot-identities.json'),
    candidates: read('docs/media/candidates.json'),
    publication: read('apps/web/src/components/media/publication.json')
  };
}
const build = args => buildCommonsReviewHandoff(args);

test('five independent review packets distinguish F1DB row hashes and original-image SHA-256', () => {
  const report = build(fixtures());
  assert.equal(report.kind, 'commons_independent_review_handoff_not_approval');
  assert.equal(report.total, 5);
  assert.equal(report.binary_sha256_observed, 2);
  assert.equal(report.binary_sha256_pending, 3);
  assert.equal(report.rights_approved, 0);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.original_files_in_report, false);
  assert.deepEqual(report.entries.map(e => e.research_id), fixtures().staging.entries.map(e => e.id));
  for (const entry of report.entries) {
    assert.match(entry.f1db_record.record_sha256, /^[a-f0-9]{64}$/);
    assert.equal(entry.f1db_record.release, 'v2026.17.0');
    assert.equal(entry.commons_source.original_sha1.length, 40);
    assert.equal(entry.rights_decision, 'pending');
    assert.equal(entry.subject_decision, 'pending');
    assert.equal(entry.reviewer, null);
    assert.equal(entry.publication_allowed, false);
    assert.equal(entry.locale_text.uk.alt, null);
    assert.equal(entry.locale_text.en.caption, null);
    assert.ok(entry.required_human_checks.length >= 7);
    if (entry.original_binary.sha256) {
      assert.match(entry.original_binary.sha256, /^[a-f0-9]{64}$/);
      assert.notEqual(entry.original_binary.sha256, entry.f1db_record.record_sha256);
      assert.equal(entry.original_binary.observation_run_url, fixtures().observations.source_run_url);
    } else {
      assert.equal(entry.original_binary.status, 'pending_original');
    }
  }
});

test('rejects a missing or ambiguous pinned F1DB subject', () => {
  const missing = fixtures();
  missing.identities.subjects = missing.identities.subjects.filter(s => s.id !== 'silverstone');
  assert.throws(() => build(missing), /Missing or contradictory candidate provenance/);
  const duplicate = fixtures();
  duplicate.identities.subjects.push({ ...duplicate.identities.subjects[0] });
  assert.throws(() => build(duplicate), /duplicate F1DB identity/);
});

test('rejects incomplete Commons source evidence and drifted observed creator/license', () => {
  const missing = fixtures();
  missing.evidence.entries.pop();
  assert.throws(() => build(missing), /Incomplete or invalid Commons research evidence/);
  const drift = fixtures();
  drift.evidence.entries[0].source_author = 'Unknown';
  assert.throws(() => build(drift), /Missing or contradictory candidate provenance|Incomplete or invalid/);
});

test('rejects tampered binary observations and unknown research receipts', () => {
  const sha = fixtures();
  sha.observations.entries[0].sha1 = '0'.repeat(40);
  assert.throws(() => build(sha), /unpinned original binary observation/);
  const unknown = fixtures();
  unknown.observations.entries[0].research_id = 'research-unknown';
  assert.throws(() => build(unknown), /unpinned original binary observation/);
  const duplicate = fixtures();
  duplicate.observations.entries.push({ ...duplicate.observations.entries[0] });
  assert.throws(() => build(duplicate), /duplicate or unpinned original/);
});

test('rejects fabricated approval, delivery paths and forged observation run', () => {
  const approved = fixtures();
  approved.staging.entries[0].review = { reviewer: 'fabricated' };
  assert.throws(() => build(approved), /Incomplete or invalid Commons research evidence/);
  const delivered = fixtures();
  delivered.staging.entries[0].delivery.local_path = '/media/unreviewed.jpg';
  assert.throws(() => build(delivered), /Incomplete or invalid Commons research evidence/);
  const forged = fixtures();
  forged.observations.source_run_url = 'https://example.com/fake';
  assert.throws(() => build(forged), /observation provenance/);
});

test('requires the exact pinned F1DB release and checksums', () => {
  const release = fixtures();
  release.identities.source.release = 'v2027.1.0';
  assert.throws(() => build(release), /Expected pinned F1DB/);
  const hash = fixtures();
  hash.identities.subjects[0].record_sha256 = 'not-a-hash';
  assert.throws(() => build(hash), /Invalid or duplicate F1DB identity/);
});
