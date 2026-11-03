import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateHistoricalCornerReviewQueue,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import {
  hasPublicationReadyCornerGuide,
  isCircuitEditionApproved,
} from '../apps/web/src/components/editorial/circuit-release.ts';
import { getCircuitContextEvidence } from '../apps/web/src/components/editorial/circuit-context-evidence.ts';

const remaining = ['ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring'];

test('all 66 historical features retain source-specific roles and explicit pinpoint gaps', () => {
  assert.equal(candidateHistoricalCornerReviewQueue.length, 66);
  const named = candidateHistoricalCornerReviewQueue.filter(item => item.research_kind === 'named_feature');
  const bends = candidateHistoricalCornerReviewQueue.filter(item => item.research_kind === 'period_bend');
  assert.equal(named.length, 13);
  assert.equal(bends.length, 53);
  assert.equal(bends.filter(item => item.source_locator !== null).length, 38);
  assert.equal(bends.filter(item => item.source_locator === null).length, 15);
  for (const item of candidateHistoricalCornerReviewQueue) {
    assert.ok(remaining.includes(item.circuit_id));
    assert.equal(item.source_roles.length > 0, true);
    assert.ok(item.source_roles.every(({ url, role }) => url.startsWith('https://') && role));
    assert.equal(item.numbered_apex_verified, false);
    assert.equal(item.publication_allowed, false);
  }
  assert.equal(named.filter(item => item.source_locator !== null).length, 12);
  assert.equal(named.filter(item => item.source_locator === null).length, 1);
  for (const [id, count] of [['detroit', 17], ['porto', 7], ['sebring', 8]]) {
    const located = bends.filter(item => item.circuit_id === id);
    assert.equal(located.length, count, id);
    assert.ok(located.every(item => item.source_locator?.startsWith('Motor Sport, ')), id);
    assert.ok(located.every(item => !/FIA (turn|number)/.test(item.source_locator)), id);
  }
  const pescara = named.filter(item => item.circuit_id === 'pescara');
  assert.equal(pescara.length, 2);
  for (const item of pescara) {
    assert.equal(item.source_roles.length, 2);
    assert.match(item.source_roles[0].role, /historical|retrospective/);
    assert.equal(item.source_roles[1].role, 'supplementary_route_context_not_independent_name_or_number_verification');
  }
});

test('an edited approval flag and two URLs cannot turn a candidate into an authenticated numbered map', () => {
  const guide = candidateCornerGuides.find(item => item.circuit_id === 'silverstone');
  assert.ok(guide);
  const originalReview = guide.review_status;
  const originalStatuses = guide.sections.map(section => section.confirmation_status);
  try {
    guide.review_status = 'independent_review_approved';
    for (const section of guide.sections) section.confirmation_status = 'independently_verified';
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false);
    assert.equal(isCircuitEditionApproved('silverstone'), false);
  } finally {
    guide.review_status = originalReview;
    guide.sections.forEach((section, index) => { section.confirmation_status = originalStatuses[index]; });
  }
  for (const id of remaining) assert.equal(hasPublicationReadyCornerGuide(id), false, id);
});

test('Adelaide 1986 context uses the accurate F1 championship account, not the 2026 article with a wrong winner', () => {
  const evidence = getCircuitContextEvidence('adelaide');
  assert.ok(evidence);
  assert.match(evidence.url, /biggest-title-comebacks-in-f1/);
  assert.match(evidence.scope.en, /Mansell/);
  assert.match(evidence.scope.uk, /Проста/);
});
