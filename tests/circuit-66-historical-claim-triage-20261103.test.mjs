import assert from 'node:assert/strict';
import test from 'node:test';
import {
  historicalCornerClaimTriage,
  historicalCornerClaimTriageByCircuit,
} from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import {
  candidateCornerGuides,
  candidateHistoricalCornerReviewQueue,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const expected = [
  ['ain-diab', 1, 1, 0, 0],
  ['clermont-ferrand', 11, 11, 0, 11],
  ['dallas', 16, 1, 15, 0],
  ['detroit', 17, 17, 0, 0],
  ['pescara', 6, 6, 0, 2],
  ['porto', 7, 7, 0, 0],
  ['sebring', 8, 8, 0, 0],
];

test('all 66 historic claims have bilingual, fail-closed source triage', () => {
  assert.equal(historicalCornerClaimTriage.length, 66);
  assert.equal(candidateHistoricalCornerReviewQueue.length, 66);
  assert.equal(new Set(historicalCornerClaimTriage.map(claim => claim.review_id)).size, 66);
  assert.deepEqual(historicalCornerClaimTriageByCircuit.map(item => [
    item.circuit_id, item.total_claims, item.claim_passages_identified,
    item.claim_passages_missing, item.named_features,
  ]), expected);
  assert.equal(historicalCornerClaimTriageByCircuit.reduce((n,c) => n+c.claim_passages_identified,0),51);
  assert.equal(historicalCornerClaimTriageByCircuit.reduce((n,c) => n+c.claim_passages_missing,0),15);
  for(const claim of historicalCornerClaimTriage) {
    assert.ok(claim.label.en && claim.label.uk);
    assert.equal(claim.numbered_apex_verified,false);
    assert.equal(claim.publication_allowed,false);
    assert.equal(claim.media_rights_approved,false);
    assert.ok(claim.next_action.includes('period_numbered_map'));
    if(claim.pinpoint_status==='claim_specific_passage_missing') {
      assert.equal(claim.source_locator,null,claim.review_id);
      assert.ok(claim.source_locator_gap?.en?.length>30,claim.review_id);
      assert.ok(claim.source_locator_gap?.uk?.length>30,claim.review_id);
    } else assert.ok(claim.source_locator?.trim().length>=30,claim.review_id);
  }
  for(const c of historicalCornerClaimTriageByCircuit) {
    assert.equal(c.independently_verified_numbered_apexes,0);
    assert.equal(c.publication_allowed,false);
    assert.ok(!candidateCornerGuides.some(g=>g.circuit_id===c.circuit_id));
    assert.equal(hasPublicationReadyCornerGuide(c.circuit_id),false);
  }
});

test('Pescara has two located retrospective names but an unresolved S-complex geometry', () => {
  const names=historicalCornerClaimTriage.filter(c=>c.circuit_id==='pescara'&&c.research_kind==='named_feature');
  assert.equal(names.length,2);
  const death=names.find(c=>c.label.en==='Curva della Morte');
  const esse=names.find(c=>c.label.en==='Esse di Cappelle');
  assert.ok(death&&esse);
  assert.equal(death.pinpoint_status,'claim_passage_identified_unreviewed');
  assert.match(death.source_locator,/GPKingdom.*4 December 2024.*Spoltore/);
  assert.equal(esse.pinpoint_status,'claim_passage_identified_unreviewed');
  assert.equal(esse.source_locator_gap,null);
  assert.match(esse.source_locator,/40mila\.it.*4 September 2019.*La Esse di Cappelle/);
  assert.match(esse.source_locator,/entrance monument.*village centre/);
  assert.equal(hasPublicationReadyCornerGuide('pescara'),false);
});
