import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateHistoricalCornerReviewQueue,
  candidateUnnumberedHistoricalRoutes,
  candidateUnnumberedPeriodBendsInLapOrder,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const remaining = ['ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring'];
const routeParents = new Map([
  ['ain-diab', [1]],
  ['dallas', [1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 11, 11, 12, 13]],
  ['detroit', [2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 9, 9, 10, 10]],
  ['pescara', [1, 2, 4, 7]],
  ['porto', [1, 1, 3, 4, 5, 5, 7]],
  ['sebring', [2, 3, 6, 8, 8, 9, 9, 10]],
]);

test('53 historical bend studies have stable geographic lap order, distinct from research insertion order', () => {
  assert.equal(candidateUnnumberedPeriodBendsInLapOrder.length, 53);
  for (const [id, expectedParents] of routeParents) {
    const route = candidateUnnumberedHistoricalRoutes.find(item => item.circuit_id === id);
    assert.ok(route, id);
    const ordered = candidateUnnumberedPeriodBendsInLapOrder.filter(item => item.circuit_id === id);
    assert.deepEqual(ordered.map(item => item.parent_route_section_order), expectedParents, id);
    assert.deepEqual(ordered.map(item => item.lap_study_order), expectedParents.map((_, i) => i + 1), id);
    assert.deepEqual(
      [...ordered].map(item => item.source_research_order).sort((a, b) => a - b),
      expectedParents.map((_, i) => i + 1), id,
    );
    for (const bend of ordered) {
      assert.ok(route.sections.some(section => section.reading_order === bend.parent_route_section_order), id);
      assert.equal(bend.official_turn_number, null);
      assert.equal(bend.numbered_apex_verified, false);
      assert.equal(bend.publication_allowed, false);
      assert.match(bend.lap_study_label.en, /not an FIA turn number/);
      assert.match(bend.lap_study_label.uk, /не номер повороту FIA/);
      assert.ok(bend.explanation.en.length > 60 && bend.explanation.uk.length > 60);
    }
  }
  const dallas = candidateUnnumberedPeriodBendsInLapOrder.filter(item => item.circuit_id === 'dallas');
  assert.equal(dallas[0].source_research_order, 2);
  assert.equal(dallas.at(-1).source_research_order, 1);
  assert.match(dallas.at(-1).label.en, /Final corner/);
  const pescara = candidateUnnumberedPeriodBendsInLapOrder.filter(item => item.circuit_id === 'pescara');
  assert.equal(pescara[0].source_research_order, 4);
  const porto = candidateUnnumberedPeriodBendsInLapOrder.filter(item => item.circuit_id === 'porto');
  assert.deepEqual(porto.map(item => item.source_research_order), [1, 3, 2, 4, 5, 6, 7]);
});

test('66 named and period-bend claims enter a source-linked, unapproved review queue without duplicate identities', () => {
  assert.equal(candidateHistoricalCornerReviewQueue.length, 66);
  const named = candidateHistoricalCornerReviewQueue.filter(item => item.research_kind === 'named_feature');
  const period = candidateHistoricalCornerReviewQueue.filter(item => item.research_kind === 'period_bend');
  assert.equal(named.length, 13);
  assert.equal(period.length, 53);
  assert.equal(new Set(candidateHistoricalCornerReviewQueue.map(item => item.review_id)).size, 66);
  assert.equal(named.filter(item => item.circuit_id === 'clermont-ferrand').length, 11);
  assert.equal(named.filter(item => item.circuit_id === 'pescara').length, 2);
  for (const item of candidateHistoricalCornerReviewQueue) {
    assert.ok(remaining.includes(item.circuit_id));
    assert.ok(item.layout_id && item.feature_kind);
    assert.ok(item.label.en && item.label.uk);
    assert.ok(item.explanation.en.length > 50 && item.explanation.uk.length > 50);
    assert.match(item.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.ok(item.source_roles.length > 0);
    assert.ok(item.source_roles.every(source => /^https:\/\//.test(source.url) && source.role));
    assert.equal(item.official_turn_number, null);
    assert.equal(item.geometric_anchor_verified, false);
    assert.equal(item.numbered_apex_verified, false);
    assert.equal(item.independent_review_pending, true);
    assert.equal(item.media_rights_approved, false);
    assert.equal(item.publication_allowed, false);
  }
  for (const id of remaining) {
    assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === id), false);
    assert.equal(hasPublicationReadyCornerGuide(id), false);
  }
});
