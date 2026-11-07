import assert from 'node:assert/strict';
import test from 'node:test';
import {
  historicalCornerEvidenceWorklist,
  historicalCornerEvidenceWorklistByCircuit,
} from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import { candidateHistoricalCornerReviewQueue, candidateUnnumberedHistoricalRoutes } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('all 66 historical claims have actionable bilingual evidence/rights review with no accidental apex approval', () => {
  assert.equal(historicalCornerEvidenceWorklist.length, 66);
  assert.equal(new Set(historicalCornerEvidenceWorklist.map(x => x.review_id)).size, 66);
  assert.equal(historicalCornerEvidenceWorklistByCircuit.length, 7);
  assert.equal(historicalCornerEvidenceWorklist.filter(x => !x.source_passage_found).length, 15);
  assert.equal(historicalCornerEvidenceWorklist.filter(x => x.source_passage_found).length, 51);
  for (const claim of historicalCornerEvidenceWorklist) {
    const original = candidateHistoricalCornerReviewQueue.find(x => x.review_id === claim.review_id);
    const route = candidateUnnumberedHistoricalRoutes.find(x => x.circuit_id === claim.circuit_id);
    assert.ok(original && route, claim.review_id);
    assert.equal(claim.historical_period, route.period);
    assert.equal(claim.layout_id, route.layout_id);
    assert.equal(claim.geometry_scope, original.feature_kind);
    assert.ok(claim.source_roles.length > 0);
    assert.ok(claim.source_roles.every(source => source.url.startsWith('https://') && source.role));
    assert.equal(claim.media_policy, 'external_links_only_no_media_reuse');
    assert.equal(claim.numbered_map_crosswalk_verified, false);
    assert.equal(claim.geometric_anchor_verified, false);
    assert.equal(claim.independent_human_review_completed, false);
    assert.equal(claim.publication_allowed, false);
    assert.equal(claim.media_rights_approved, false);
    assert.ok(claim.review_request.en.length > 70);
    assert.ok(claim.review_request.uk.length > 70);
    assert.match(claim.review_request.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    if (!claim.source_passage_found) {
      assert.equal(claim.priority, 'P1_find_claim_passage');
      assert.equal(claim.source_locator, null);
    } else if (claim.geometry_scope !== 'single_bend') {
      assert.equal(claim.priority, 'P2_disambiguate_complex_or_sector');
    } else assert.equal(claim.priority, 'P3_crosswalk_single_bend');
  }
  for (const circuit of historicalCornerEvidenceWorklistByCircuit) {
    assert.equal(circuit.priority_1_missing_passage + circuit.priority_2_complex_geometry + circuit.priority_3_single_bend_crosswalk, circuit.total_claims);
    assert.equal(circuit.dated_numbered_map_crosswalks_verified, 0);
    assert.equal(circuit.media_rights_approved, false);
    assert.equal(hasPublicationReadyCornerGuide(circuit.circuit_id), false);
  }
});

test('Pescara: local Esse naming passage is located, geometry still disputed; Montesilvano remains unnumbered', () => {
  const esse = historicalCornerEvidenceWorklist.find(x => x.circuit_id === 'pescara' && x.label.en === 'Esse di Cappelle');
  assert.ok(esse);
  assert.equal(esse.source_passage_found, true);
  assert.equal(esse.priority, 'P2_disambiguate_complex_or_sector');
  assert.equal(esse.geometry_scope, 'multi_bend_complex');
  assert.match(esse.source_locator, /40mila\.it.*La Esse di Cappelle/);
  assert.match(esse.source_locator, /entrance monument.*village centre/);
  const mont = candidateHistoricalCornerReviewQueue.find(x => x.circuit_id === 'pescara' && x.label.en === 'Montesilvano turn south onto Via Adriatica');
  assert.ok(mont);
  assert.ok(mont.source_roles.some(x => x.role.includes('montesilvano_station_final_turn_context')));
  assert.match(mont.source_locator, /Il Chilometro Lanciato/);
  assert.equal(mont.numbered_apex_verified, false);
});
