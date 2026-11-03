import assert from 'node:assert/strict';
import test from 'node:test';
import { historicalCornerCountObservations as observations, historicalCornerCountReviewByCircuit as reviews } from '../apps/web/src/components/editorial/circuit-historical-counts.ts';
import { historicalCornerEvidenceWorklistByCircuit } from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('12 sourced count observations cover four venues; seven routes remain publication-gated', () => {
  assert.equal(observations.length, 12);
  assert.equal(new Set(observations.map(x=>x.circuit_id)).size, 4);
  assert.equal(reviews.length, 7);
  for (const x of observations) {
    assert.ok(Number.isInteger(x.turns) && x.turns > 0);
    assert.match(x.source_url, /^https:\/\//);
    assert.ok(x.locator.length > 25 && x.caveat.en.length > 25);
    assert.match(x.caveat.uk, /[А-Яа-яІіЇїЄєҐґ]/);
  }
  for (const r of reviews) {
    assert.equal(r.independently_authenticated_numbered_map, false);
    assert.equal(r.per_apex_crosswalk_verified, false);
    assert.equal(r.media_reuse_approved, false);
    assert.equal(r.publication_allowed, false);
    assert.equal(hasPublicationReadyCornerGuide(r.circuit_id), false);
    assert.ok(r.review_request.en.length > 90);
    assert.match(r.review_request.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.ok(r.same_layout_observations.every(x=>x.layout_id===r.layout_id && x.period===r.historical_period));
    assert.ok(r.excluded_other_era_observations.every(x=>x.layout_id!==r.layout_id || x.period!==r.historical_period));
    assert.deepEqual(historicalCornerEvidenceWorklistByCircuit.find(x=>x.circuit_id===r.circuit_id).corner_count_reconciliation, r);
  }
});
test('Dallas, Ain-Diab and Charade conflicts cannot leak modern or later geometry', () => {
  const by=id=>reviews.find(x=>x.circuit_id===id);
  assert.deepEqual(by('dallas').competing_same_layout_counts,[12,23,24]);
  assert.deepEqual(by('ain-diab').competing_same_layout_counts,[11,15,18]);
  assert.deepEqual(by('clermont-ferrand').competing_same_layout_counts,[48,51]);
  assert.deepEqual(by('clermont-ferrand').excluded_other_era_observations.map(x=>x.turns),[18]);
  assert.deepEqual(by('detroit').competing_same_layout_counts,[24]);
  assert.deepEqual(by('detroit').excluded_other_era_observations.map(x=>x.turns).sort((a,b)=>a-b),[17,22]);
  assert.equal(reviews.filter(x=>x.count_disagreement_unresolved).length,3);
  assert.deepEqual(reviews.filter(x=>x.no_count_comparison_available).map(x=>x.circuit_id).sort(),['pescara','porto','sebring']);
});
