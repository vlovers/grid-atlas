import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditCommonsEvidence } from '../scripts/audit-commons-evidence.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const fixtures = () => [load('docs/media/cross-era-staging.json'), load('docs/media/commons-original-evidence.json')];

test('all five cross-era candidates have distinct pinned Commons original observations', () => {
  const report = auditCommonsEvidence(...fixtures());
  assert.equal(report.ok, true, report.errors.join('; '));
  assert.equal(report.staged, 5);
  assert.equal(report.source_evidenced, 5);
  assert.deepEqual(report.missing_source_evidence, []);
  assert.equal(report.publication_allowed, false);
  assert.equal(report.pending_independent_review.length, 5);
});

test('source observations have the recorded original byte counts and SHA-1 checksums', () => {
  const [, evidence] = fixtures();
  const pinned = {
    'research-schumacher-portrait-2007': ['2e2f13a317874fe4aaee0b0190a4fd8432afa2ec', 215440, 861, 1158],
    'research-alonso-2024': ['c7ddbbd82e80328c91631e43fcc9f0bc316e7895', 4329507, 4302, 2689],
    'research-mclaren-mp44-2007': ['5f73fce72ec07ddaab187f07cbc90a7196a2c684', 1582072, 2848, 2136],
    'research-ferrari-f2004-2004': ['d6f0c2a0fd9a57d8bd3ad76d447507cc4df1736a', 1188730, 1536, 2048],
    'research-silverstone-2019': ['158ee3d1712131d8d8708972b76aecaac22b21cf', 917190, 4032, 3024]
  };
  assert.deepEqual(new Set(evidence.entries.map(x => x.research_id)), new Set(Object.keys(pinned)));
  for (const entry of evidence.entries) {
    assert.deepEqual([entry.sha1, entry.bytes, entry.width, entry.height], pinned[entry.research_id]);
    assert.ok(entry.description_oldid > 0);
  }
});

test('rejects orphan evidence and duplicate file pages', () => {
  const args = fixtures();
  args[1].entries[1].research_id = 'research-not-in-staging';
  assert.equal(auditCommonsEvidence(...args).ok, false);
  const args2 = fixtures();
  args2[1].entries[1].file_page_url = args2[1].entries[0].file_page_url;
  assert.equal(auditCommonsEvidence(...args2).ok, false);
});

test('rejects invalid SHA-1 and source license drift', () => {
  const args = fixtures();
  args[1].entries[0].sha1 = 'not-a-checksum';
  assert.equal(auditCommonsEvidence(...args).ok, false);
  const args2 = fixtures();
  args2[1].entries[0].source_license = 'CC0';
  assert.equal(auditCommonsEvidence(...args2).ok, false);
});

test('missing original evidence blocks the audit without promoting the candidate', () => {
  const args = fixtures();
  args[1].entries.pop();
  const report = auditCommonsEvidence(...args);
  assert.equal(report.ok, false);
  assert.match(report.errors.join('; '), /research-silverstone-2019: missing pinned Commons source evidence/);
  assert.deepEqual(report.missing_source_evidence, ['research-silverstone-2019']);
  assert.equal(report.publication_allowed, false);
});
