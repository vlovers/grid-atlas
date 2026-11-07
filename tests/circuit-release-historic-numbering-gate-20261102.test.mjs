import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide, isCircuitEditionApproved } from '../apps/web/src/components/editorial/circuit-release.ts';

test('new historical research cannot become public through a release manifest alone', () => {
  for (const id of ['aida', 'anderstorp', 'jarama', 'adelaide']) {
    const guide = candidateCornerGuides.find(g => g.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.equal(hasPublicationReadyCornerGuide(id), false, id);
    assert.equal(isCircuitEditionApproved(id), false, id);
  }
});

test('provisional numbering is not silently reclassified as an independently verified corner name', () => {
  for (const id of ['anderstorp', 'jarama', 'adelaide']) {
    const guide = candidateCornerGuides.find(g => g.circuit_id === id);
    assert.ok(guide.sections.every(section => section.confirmation_status === 'historical_numbering_unverified'));
    assert.ok(guide.sections.every(section => section.name === null));
    assert.ok(guide.sections.every(section => section.aliases.length > 0));
  }
});
