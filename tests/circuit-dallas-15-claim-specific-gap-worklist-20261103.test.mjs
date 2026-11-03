import assert from 'node:assert/strict';
import test from 'node:test';
import {
  historicalCornerEvidenceWorklist,
  historicalCornerEvidenceWorklistByCircuit,
} from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import { candidateHistoricalCornerReviewQueue } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Dallas: all 15 unlocated diagram reconstructions retain distinct actionable EN/UK review requests', () => {
  const dallas = historicalCornerEvidenceWorklist.filter(item => item.circuit_id === 'dallas');
  const missing = dallas.filter(item => item.priority === 'P1_find_claim_passage');
  assert.equal(dallas.length, 16);
  assert.equal(missing.length, 15);
  assert.equal(new Set(missing.map(item => item.review_id)).size, 15);
  assert.equal(new Set(missing.map(item => item.review_request.en)).size, 15);
  assert.equal(new Set(missing.map(item => item.review_request.uk)).size, 15);
  for (const claim of missing) {
    const source = candidateHistoricalCornerReviewQueue.find(item => item.review_id === claim.review_id);
    assert.ok(source, claim.review_id);
    assert.equal(claim.source_passage_found, false);
    assert.equal(claim.source_passage_independently_authenticated, false);
    assert.equal(claim.source_locator, null);
    assert.deepEqual(claim.claim_specific_source_gap, source.source_locator_gap);
    assert.ok(claim.claim_specific_source_gap?.en.includes(source.label.en), claim.review_id);
    assert.ok(claim.claim_specific_source_gap?.uk.includes(source.label.uk), claim.review_id);
    assert.ok(claim.review_request.en.includes(claim.claim_specific_source_gap.en), claim.review_id);
    assert.ok(claim.review_request.uk.includes(claim.claim_specific_source_gap.uk), claim.review_id);
    assert.match(claim.review_request.en, /dated numbered map/);
    assert.match(claim.review_request.uk, /датовану нумеровану схему/);
    assert.equal(claim.historical_period, '1984');
    assert.equal(claim.layout_id, 'dallas-1');
    assert.equal(claim.numbered_apex_verified, false);
    assert.equal(claim.geometric_anchor_verified, false);
    assert.equal(claim.publication_allowed, false);
    assert.equal(claim.media_rights_approved, false);
    assert.equal(claim.media_policy, 'external_links_only_no_media_reuse');
  }
  const finalCorner = dallas.find(item => item.source_research_order === 1);
  assert.ok(finalCorner);
  assert.equal(finalCorner.source_passage_found, true);
  assert.equal(finalCorner.source_passage_independently_authenticated, false);
  assert.equal(finalCorner.claim_specific_source_gap, null);
  assert.equal(finalCorner.numbered_apex_verified, false);
  assert.equal(hasPublicationReadyCornerGuide('dallas'), false);
});

test('66-claim review queue exposes per-circuit P1 completeness without mistaking source locators for approval', () => {
  assert.equal(historicalCornerEvidenceWorklist.length, 66);
  assert.equal(historicalCornerEvidenceWorklist.filter(x => x.source_passage_found).length, 51);
  assert.equal(historicalCornerEvidenceWorklist.filter(x => !x.source_passage_found).length, 15);
  assert.ok(historicalCornerEvidenceWorklist.every(x =>
    x.source_passage_independently_authenticated === false &&
    x.publication_allowed === false &&
    x.numbered_apex_verified === false));
  const byCircuit = historicalCornerEvidenceWorklistByCircuit;
  assert.equal(byCircuit.length, 7);
  assert.equal(byCircuit.reduce((sum, x) => sum + x.priority_1_missing_passage, 0), 15);
  assert.equal(byCircuit.reduce((sum, x) => sum + x.priority_1_with_bilingual_specific_gaps, 0), 15);
  for (const item of byCircuit) {
    assert.equal(item.priority_1_missing_passage, item.priority_1_with_bilingual_specific_gaps);
    assert.equal(item.dated_numbered_map_crosswalks_verified, 0);
  }
});
