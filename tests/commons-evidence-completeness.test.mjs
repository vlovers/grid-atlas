import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCommonsEvidence } from '../scripts/audit-commons-evidence.mjs';

const candidate = id => ({
  id, status: 'candidate', review: null, content_sha256: null,
  alt: { uk: null, en: null }, caption: { uk: null, en: null },
  source_url: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  delivery: { local_path: null, remote_url: null },
  file_page_url: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  creator: 'Example creator', license: { identifier: 'CC-BY-SA-4.0' },
  image: { mime: 'image/jpeg' }
});
const staging = entries => ({ schema_version: 1, lane: 'research_only', publication_allowed: false, entries });
const evidence = entries => ({ schema_version: 1, lane: 'research_only', publication_allowed: false, entries });
const source = id => ({
  research_id: id, file_page_url: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  sha1: 'a'.repeat(40), bytes: 100, width: 10, height: 10,
  description_oldid: 123, source_author: 'Example creator', source_license: 'CC-BY-SA-4.0'
});

test('missing source evidence is a blocking error, not a successful audit', () => {
  const report = auditCommonsEvidence(staging([candidate('research-example')]), evidence([]));
  assert.equal(report.ok, false);
  assert.deepEqual(report.missing_source_evidence, ['research-example']);
  assert.match(report.errors.join(' '), /missing pinned Commons source evidence/);
  assert.equal(report.publication_allowed, false);
});

test('complete pinned evidence passes without implying publication approval', () => {
  const report = auditCommonsEvidence(staging([candidate('research-example')]), evidence([source('research-example')]));
  assert.equal(report.ok, true);
  assert.deepEqual(report.missing_source_evidence, []);
  assert.equal(report.publication_allowed, false);
});

test('an empty research manifest remains a valid empty audit', () => {
  const report = auditCommonsEvidence(staging([]), evidence([]));
  assert.equal(report.ok, true);
  assert.equal(report.source_evidenced, 0);
});

test('rejects staged publication fields even when source evidence is absent', () => {
  for (const mutate of [
    item => { item.content_sha256 = 'a'.repeat(64); },
    item => { item.alt.uk = 'Approved-looking alt'; },
    item => { item.caption.en = 'Published-looking caption'; },
    item => { item.delivery.remote_url = 'https://example.org/photo.jpg'; },
    item => { item.review = { reviewer: 'someone' }; }
  ]) {
    const item = candidate('research-example');
    mutate(item);
    const report = auditCommonsEvidence(staging([item]), evidence([]));
    assert.equal(report.ok, false);
    assert.match(report.errors.join('; '), /publication data/);
    assert.equal(report.publication_allowed, false);
  }
});

test('rejects duplicate staged pages, invalid IDs and noncanonical source URLs', () => {
  const a = candidate('research-a'), b = candidate('research-b');
  let report = auditCommonsEvidence(staging([a, b]), evidence([source('research-a'), source('research-b')]));
  assert.equal(report.ok, false);
  assert.match(report.errors.join('; '), /duplicate staging page/);

  b.file_page_url = 'https://commons.wikimedia.org/wiki/File:Other.jpg';
  b.source_url = b.file_page_url;
  const sourceB = source('research-b');
  sourceB.file_page_url = b.file_page_url;
  report = auditCommonsEvidence(staging([a, b]), evidence([source('research-a'), sourceB]));
  assert.equal(report.ok, true, report.errors.join('; '));

  b.id = '../unsafe';
  report = auditCommonsEvidence(staging([a, b]), evidence([source('research-a'), sourceB]));
  assert.equal(report.ok, false);
  assert.match(report.errors.join('; '), /Invalid or duplicate staging ID/);

  b.id = 'research-b';
  b.source_url = 'https://example.org/other.jpg';
  report = auditCommonsEvidence(staging([a, b]), evidence([source('research-a'), sourceB]));
  assert.equal(report.ok, false);
  assert.match(report.errors.join('; '), /source URL mismatch/);
});
