import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateUnnumberedHistoricalRoutes } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide, isCircuitEditionApproved } from '../apps/web/src/components/editorial/circuit-release.ts';

// These source-linked route readings must never be counted as 68 certified turns.
const expected = new Map([
  ['ain-diab', ['ain-diab-1', 13]],
  ['clermont-ferrand', ['clermont-ferrand-1', 8]],
  ['dallas', ['dallas-1', 13]],
  ['detroit', ['detroit-1', 10]],
  ['pescara', ['pescara-1', 7]],
  ['porto', ['porto-1', 7]],
  ['sebring', ['sebring-1', 10]],
]);

test('seven outstanding historical routes expose 68 bilingual source-linked sections without fabricated turn numbers', () => {
  assert.equal(candidateUnnumberedHistoricalRoutes.length, expected.size);
  assert.equal(candidateUnnumberedHistoricalRoutes.reduce((n, route) => n + route.sections.length, 0), 68);
  for (const route of candidateUnnumberedHistoricalRoutes) {
    const [layout, count] = expected.get(route.circuit_id) ?? [];
    assert.ok(layout, route.circuit_id);
    assert.equal(route.layout_id, layout);
    assert.equal(route.sections.length, count);
    assert.equal(route.numbered_apex_verified, false);
    assert.equal(route.review_status, 'independent_review_pending');
    assert.deepEqual(route.sections.map(s => s.reading_order), Array.from({length: count}, (_, i) => i + 1));
    for (const section of route.sections) {
      assert.equal(section.official_turn_numbers, null);
      assert.equal(section.geometric_anchor_verified, false);
      assert.equal(section.numbered_apex_verified, false);
      assert.ok(section.label.en && section.label.uk, route.circuit_id);
      assert.ok(section.explanation.en.trim().split(/\s+/).length >= 14, route.circuit_id);
      assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 12, route.circuit_id);
      assert.match(section.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(section.source_urls.length > 0);
      for (const url of section.source_urls) assert.match(url, /^https:\/\//);
      assert.ok(section.source_roles.length > 0);
      for (const role of section.source_roles) {
        assert.ok(section.source_urls.includes(role.url));
        assert.ok(role.role);
      }
    }
  }
});

test('unnumbered route studies do not inflate integrated turn-guide counts or bypass publication', () => {
  for (const id of expected.keys()) {
    assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === id), false, id);
    assert.equal(hasPublicationReadyCornerGuide(id), false, id);
    assert.equal(isCircuitEditionApproved(id), false, id);
  }
});
