import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planMediaBatch } from '../scripts/plan-media-research-batch.mjs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const csv = read('docs/research/commons-photo-research-index.csv');
const identity = JSON.parse(read('docs/media/pilot-identities.json'));
const candidates = JSON.parse(read('docs/media/candidates.json'));
const publication = JSON.parse(read('apps/web/src/components/media/publication.json'));

test('plans the entire media batch without auto-publication', () => {
  const result = planMediaBatch(csv, identity, candidates, publication);
  assert.equal(result.total, 16);
  assert.equal(result.approved, 0);
  assert.equal(result.reviewQueue.length, 16);
  assert.ok(result.reviewQueue.every(x => x.readyForPublication === false));
  assert.equal(result.byPriority.P0 + result.byPriority.P1 + result.byPriority.P2, 16);
});
test('flags subjects missing from the narrow pilot identity allowlist', () => {
  const result = planMediaBatch(csv, identity, candidates, publication);
  assert.ok(result.identityNotInPilot.includes('schumacher-portrait-2007'));
  assert.ok(!result.identityNotInPilot.includes('ferrari-f2004-2004'));
});
test('flags duplicate source pages already registered as candidates', () => {
  const duplicate = structuredClone(candidates);
  duplicate.assets.push({ file_page_url: 'https://commons.wikimedia.org/wiki/File:Michael_Schumacher.jpg' });
  const result = planMediaBatch(csv, identity, duplicate, publication);
  assert.ok(result.duplicateFilePages.includes('schumacher-portrait-2007'));
});
test('does not accept invalid or falsely approved research rows', () => {
  assert.throws(() => planMediaBatch(csv.replace('"not_approved"','"approved"'), identity, candidates, publication), /rights approval/);
});
