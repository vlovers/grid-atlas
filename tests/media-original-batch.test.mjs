import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectOriginalBatch } from '../scripts/inspect-media-batch.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const inputs = () => ({
  staging: load('docs/media/cross-era-staging.json'),
  sourceEvidence: load('docs/media/commons-original-evidence.json'),
  candidates: load('docs/media/candidates.json'),
  publication: load('apps/web/src/components/media/publication.json'),
  pilot: load('docs/media/pilot-identities.json'),
  originalsDir: '/tmp',
  manifest: { schema_version: 1, lane: 'offline_originals', publication_allowed: false,
    entries: [{ research_id: 'research-schumacher-portrait-2007', file: 'not-present.jpg', expected_sha256: null }] }
});
test('missing original blocks publication rather than approving research', () => {
  const report = inspectOriginalBatch(inputs());
  assert.equal(report.inspected, 0);
  assert.equal(report.blocked, 1);
  assert.equal(report.publication_allowed, false);
});
test('missing Commons evidence blocks an otherwise valid research ID', () => {
  const args = inputs();
  args.manifest.entries[0].research_id = 'research-ferrari-f2004-2004';
  // Missing evidence is a supported research state even though the checked-in set now covers all five.
  args.sourceEvidence.entries = args.sourceEvidence.entries.filter(item => item.research_id !== 'research-ferrari-f2004-2004');
  const report = inspectOriginalBatch(args);
  assert.equal(report.blocked, 1);
  assert.match(report.results[0].reason, /No pinned Commons original evidence/);
});
test('rejects repeated original filenames', () => {
  const args = inputs();
  args.manifest.entries.push({research_id:'research-silverstone-2019',file:'not-present.jpg',expected_sha256:null});
  assert.throws(() => inspectOriginalBatch(args), /duplicate research ID or filename/);
});
test('rejects invalid manifest header', () => {
  const args = inputs();
  args.manifest.publication_allowed = true;
  assert.throws(() => inspectOriginalBatch(args), /Invalid offline-only/);
});
test('rejects mismatched staged approval state', () => {
  const args = inputs();
  args.staging.entries[0].status = 'verified';
  assert.throws(() => inspectOriginalBatch(args), /Staging integrity failed/);
});
