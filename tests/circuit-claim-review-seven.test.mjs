import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { publicCircuitStories } from '../apps/web/src/components/editorial/circuit-public-moments.ts';
import { getCircuitContextEvidence } from '../apps/web/src/components/editorial/circuit-context-evidence.ts';

const queue = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-claim-review-seven-20261028.json', import.meta.url), 'utf8'));
const release = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-release.json', import.meta.url), 'utf8'));
const expectedIds = ['adelaide', 'aida', 'estoril', 'marina-bay', 'montjuic', 'rouen', 'zolder'];
const evidenceRoutes = new Set(['candidate-results', 'candidate-context', 'needs-new-evidence', 'editorial-judgment']);

test('seven sensitive public summaries have 24 exact bilingual claim excerpts awaiting review', () => {
  assert.equal(queue.schema_version, 1);
  assert.equal(queue.approval_state, 'not-approved');
  assert.equal(queue.reviewer_identity, null);
  assert.equal(queue.reviewed_at, null);
  assert.deepEqual(queue.stories.map(row => row.circuit_id).sort(), expectedIds);
  const ids = new Set();
  let claimCount = 0;
  for (const row of queue.stories) {
    const story = publicCircuitStories.find(item => item.id === row.circuit_id);
    assert.ok(story, row.circuit_id);
    assert.equal(row.year, story.year, row.circuit_id);
    assert.equal(row.primary_source, story.source, row.circuit_id);
    assert.equal(row.review_status, 'pending-independent-review', row.circuit_id);
    assert.ok(getCircuitContextEvidence(row.circuit_id), row.circuit_id);
    assert.ok(row.claims.length >= 3, row.circuit_id);
    for (const claim of row.claims) {
      const key = `${row.circuit_id}/${claim.claim_id}`;
      assert.match(claim.claim_id, /^[a-z0-9-]+$/);
      assert.ok(!ids.has(key), key);
      ids.add(key);
      assert.equal(claim.status, 'unverified', key);
      assert.ok(evidenceRoutes.has(claim.evidence_route), key);
      assert.ok(story.description.en.includes(claim.en_excerpt), `${key}: EN text drift`);
      assert.ok(story.description.uk.includes(claim.uk_excerpt), `${key}: UK text drift`);
      assert.ok(claim.en_excerpt.length >= 18 && claim.uk_excerpt.length >= 18, key);
      assert.ok(claim.review_question.length >= 45, key);
      claimCount += 1;
    }
  }
  assert.equal(claimCount, 24);
  assert.deepEqual(release.editions, [], 'research queue must not authorize longform publication');
});

test('review queue explicitly distinguishes source leads from proof and includes open evidence gaps', () => {
  const all = queue.stories.flatMap(row => row.claims.map(claim => ({ id: row.circuit_id, ...claim })));
  assert.ok(all.some(claim => claim.id === 'rouen' && claim.claim_id === 'revs' && claim.evidence_route === 'needs-new-evidence'));
  assert.ok(all.some(claim => claim.id === 'adelaide' && claim.claim_id === 'tyre' && /puncture/.test(claim.review_question)));
  assert.ok(all.some(claim => claim.id === 'aida' && claim.claim_id === 'start-retirement' && claim.evidence_route === 'needs-new-evidence'));
  assert.ok(all.some(claim => claim.id === 'montjuic' && claim.claim_id === 'stoppage' && claim.evidence_route === 'candidate-context'));
  assert.match(queue.scope, /NOT independent verification/);
  assert.ok(all.every(claim => !('approved_by' in claim) && !('verified_by' in claim)));
});
