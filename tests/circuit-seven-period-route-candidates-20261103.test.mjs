import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateUnnumberedHistoricalRoutes, candidateUnnumberedGeographicRoutes } from '../apps/web/src/components/editorial/circuit-candidates.ts';
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

test('68 historical sections distinguish 55 route descriptions from 13 non-geometric context passages', () => {
  const expectedGeographic = new Map([
    ['ain-diab', 2], ['clermont-ferrand', 6], ['dallas', 13],
    ['detroit', 10], ['pescara', 7], ['porto', 7], ['sebring', 10],
  ]);
  assert.equal(candidateUnnumberedGeographicRoutes.length, 7);
  let geographic = 0;
  let raceHistory = 0;
  let layoutContext = 0;
  for (const route of candidateUnnumberedHistoricalRoutes) {
    assert.ok(route.route_scope?.en && route.route_scope?.uk, route.circuit_id);
    assert.match(route.route_scope.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.equal(route.media_rights?.external_reference_only, true);
    assert.equal(route.media_rights?.third_party_map_reuse_approved, false);
    assert.equal(route.media_rights?.third_party_photo_reuse_approved, false);
    const geographical = candidateUnnumberedGeographicRoutes.find(entry => entry.circuit_id === route.circuit_id);
    assert.ok(geographical, route.circuit_id);
    assert.equal(geographical.sections.length, expectedGeographic.get(route.circuit_id));
    for (const section of route.sections) {
      assert.equal(section.official_turn_numbers, null);
      assert.equal(section.numbered_apex_verified, false);
      if (section.section_kind === 'route_geography') geographic++;
      else if (section.section_kind === 'race_history') raceHistory++;
      else if (section.section_kind === 'layout_context') layoutContext++;
      else assert.fail(`Unexpected historical section kind: ${section.section_kind}`);
    }
  }
  assert.equal(geographic, 55);
  assert.equal(raceHistory, 11);
  assert.equal(layoutContext, 2);
  assert.equal(geographic + raceHistory + layoutContext, 68);
});

test('1958 Morocco results link is canonical and never treated as a numbered turn map', () => {
  const route = candidateUnnumberedHistoricalRoutes.find(entry => entry.circuit_id === 'ain-diab');
  assert.ok(route);
  for (const section of route.sections) {
    for (const url of section.source_urls) assert.doesNotMatch(url, /morocco%20/i);
    for (const source of section.source_roles) assert.doesNotMatch(source.url, /morocco%20/i);
    assert.equal(section.geometric_anchor_verified, false);
  }
});
