import assert from 'node:assert/strict';
import test from 'node:test';
import { historicalCornerCountObservations as observations, historicalCornerCountReviewByCircuit as reviews } from '../apps/web/src/components/editorial/circuit-historical-counts.ts';
import { historicalCornerEvidenceWorklistByCircuit } from '../apps/web/src/components/editorial/circuit-historical-review.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('17 sourced count observations cover all seven venues; seven routes remain publication-gated', () => {
  assert.equal(observations.length, 17);
  assert.equal(new Set(observations.map(x=>x.circuit_id)).size, 7);
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
  assert.equal(reviews.filter(x=>x.count_disagreement_unresolved).length,5);
  assert.deepEqual(reviews.filter(x=>x.no_count_comparison_available).map(x=>x.circuit_id).sort(),[]);
});

test('Porto, Sebring and Pescara period counts are research-only and page conflicts are not independent witnesses', () => {
  const by = id => reviews.find(x => x.circuit_id === id);
  assert.deepEqual(by('pescara').competing_same_layout_counts, [24]);
  assert.deepEqual(by('porto').competing_same_layout_counts, [14, 19]);
  assert.deepEqual(by('sebring').competing_same_layout_counts, [12, 17]);
  assert.equal(by('pescara').historical_period, '1957');
  assert.equal(by('porto').historical_period, '1958–1960');
  assert.equal(by('sebring').historical_period, '1959');
  for (const id of ['porto', 'sebring']) {
    const route = by(id);
    assert.equal(route.distinct_source_pages, 1, id);
    assert.equal(route.same_page_count_conflicts.length, 1, id);
    assert.deepEqual(route.same_page_count_conflicts[0].reported_counts, route.competing_same_layout_counts);
    assert.equal(route.count_authenticated_against_period_numbered_map, false);
  }
  assert.equal(by('pescara').distinct_source_pages, 1);
  assert.deepEqual(by('pescara').same_page_count_conflicts, []);
  assert.equal(by('pescara').count_authenticated_against_period_numbered_map, false);
  assert.equal(reviews.filter(x => x.same_page_count_conflicts.length > 0).length, 5);
  assert.equal(by('dallas').distinct_source_pages, 2);
  assert.equal(by('ain-diab').distinct_source_pages, 2);
  assert.equal(by('clermont-ferrand').distinct_source_pages, 1);
  assert.equal(by('detroit').distinct_source_pages, 1);
  assert.deepEqual(by('detroit').same_page_count_conflicts, []);
  for (const route of reviews) {
    assert.equal(route.count_authenticated_against_period_numbered_map, false);
    assert.equal(route.publication_allowed, false);
    assert.equal(hasPublicationReadyCornerGuide(route.circuit_id), false);
  }
});
