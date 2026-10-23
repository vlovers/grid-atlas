import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCommonsEvidence } from '../scripts/audit-commons-evidence.mjs';

const candidate = id => ({
  id, status: 'candidate', review: null,
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
