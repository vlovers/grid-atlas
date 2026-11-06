import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateHistoricalCornerReviewQueue,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

test('Dallas 1984: 15 diagram-inferred bends stay distinct from one report-located final corner', () => {
  const dallas = candidateHistoricalCornerReviewQueue.filter(
    item => item.circuit_id === 'dallas' && item.research_kind === 'period_bend',
  );
  assert.equal(dallas.length, 16);
  assert.equal(new Set(dallas.map(item => item.review_id)).size, 16);
  const final = dallas.find(item => item.source_research_order === 1);
  assert.ok(final);
  assert.equal(final.evidence_kind, 'contemporary_report_specific_bend');
  assert.match(final.source_locator, /Motor Sport.*Race section.*Mansell/);
  assert.equal(final.source_locator_gap, null);
  const inferred = dallas.filter(item => item !== final);
  assert.equal(inferred.length, 15);
  for (const item of inferred) {
    assert.equal(item.evidence_kind, 'historical_layout_visual_reconstruction_not_apex_verified');
    assert.equal(item.source_locator, null, item.review_id);
    assert.match(item.source_locator_gap?.en ?? '', /RacingCircuits.*1984.*not individually identify or number/);
    assert.match(item.source_locator_gap?.uk ?? '', /FIA|нумерован/);
    assert.ok(item.source_roles.some(role => /historical_1984_venue_layout/.test(role.role)));
    assert.ok(item.source_roles.some(role => /classification_not_corner_geometry/.test(role.role)));
  }
  for (const item of dallas) {
    assert.equal(item.official_turn_number, null);
    assert.equal(item.numbered_apex_verified, false);
    assert.equal(item.geometric_anchor_verified, false);
    assert.equal(item.publication_allowed, false);
  }
  assert.ok(!candidateCornerGuides.some(guide => guide.circuit_id === 'dallas'));
  assert.equal(hasPublicationReadyCornerGuide('dallas'), false);
});

test('Charade: 11 named historical features have section locators; Rosier namesake is explicit', () => {
  const features = candidateHistoricalCornerReviewQueue.filter(
    item => item.circuit_id === 'clermont-ferrand' && item.research_kind === 'named_feature',
  );
  assert.equal(features.length, 11);
  assert.equal(new Set(features.map(item => item.review_id)).size, 11);
  for (const item of features) {
    assert.match(item.source_locator ?? '', /Circuit de Charade.*Charade dans le rétro/);
    assert.equal(item.official_turn_number, null);
    assert.equal(item.numbered_apex_verified, false);
    assert.equal(item.independent_review_pending, true);
    assert.equal(item.publication_allowed, false);
    assert.equal(item.media_rights_approved, false);
  }
  const rosier = features.find(item => item.label.en === 'Rosier');
  assert.ok(rosier);
  assert.match(rosier.source_locator, /#40.*Louis Rosier/);
  assert.match(rosier.name_origin?.en ?? '', /Louis Rosier/);
  assert.match(rosier.name_origin?.uk ?? '', /Луї Розьє/);
  assert.match(rosier.explanation.en, /operator independently explains/);
  assert.match(rosier.explanation.uk, /Розьє|архів|джерел/);
  assert.equal(hasPublicationReadyCornerGuide('clermont-ferrand'), false);
});
