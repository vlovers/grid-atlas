import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateUnnumberedHistoricalRoutes,
  candidateUnnumberedPeriodBendStudies,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide, isCircuitEditionApproved } from '../apps/web/src/components/editorial/circuit-release.ts';

const expected = {
  'pescara': {
    layout: 'pescara-1', year: '1957',
    parents: [2, 4, 7, 1],
    kinds: ['single_bend', 'multi_bend_complex', 'single_bend', 'multi_bend_complex'],
    primary: 'https://www.motorsportmagazine.com/archive/article/september-1957/16/xxv-gran-premio-pescara/',
    result: 'https://www.formula1.com/en/results/1957/races/156/pescara/race-result',
  },
  'ain-diab': {
    layout: 'ain-diab-1', year: '1958',
    parents: [1], kinds: ['single_bend'],
    primary: 'https://www.motorsportmagazine.com/archive/article/october-2026/25/ain-diab-the-road-circuit-that-hosted-mosss-last-gasp-1958-title-bid/',
    result: 'https://www.formula1.com/en/results/1958/races/168/morocco/race-result',
  },
};

test('five source-bound historical features preserve the distinction between three bends and two complexes', () => {
  let total = 0;
  let individual = 0;
  for (const [id, spec] of Object.entries(expected)) {
    const route = candidateUnnumberedHistoricalRoutes.find(item => item.circuit_id === id);
    assert.ok(route, id);
    assert.equal(route.layout_id, spec.layout);
    const entries = candidateUnnumberedPeriodBendStudies.filter(item => item.circuit_id === id);
    assert.equal(entries.length, spec.parents.length, id);
    assert.deepEqual(entries.map(item => item.reading_order), entries.map((_, i) => i + 1));
    assert.deepEqual(entries.map(item => item.parent_route_section_order), spec.parents);
    assert.deepEqual(entries.map(item => item.geometry_kind), spec.kinds);
    const en = new Set();
    const uk = new Set();
    for (const entry of entries) {
      assert.equal(entry.historical_layout_id, spec.layout);
      assert.equal(entry.layout_id, spec.layout);
      assert.equal(entry.period, spec.year);
      assert.equal(entry.name, null);
      assert.equal(entry.name_origin, null);
      assert.equal(entry.numbering_year, null);
      assert.equal(entry.official_turn_number, null);
      assert.equal(entry.geometric_anchor_verified, false);
      assert.equal(entry.numbered_apex_verified, false);
      assert.equal(entry.publication_allowed, false);
      assert.equal(entry.review_status, 'independent_review_pending');
      assert.match(entry.evidence_limit, /not a period FIA-numbered apex crosswalk/);
      assert.ok(entry.explanation.en.split(/\s+/).length >= 30);
      assert.ok(entry.explanation.uk.split(/\s+/).length >= 30);
      assert.match(entry.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(entry.source_urls.includes(spec.primary));
      assert.ok(entry.source_urls.includes(spec.result));
      assert.ok(entry.source_roles.some(role => role.url === spec.result && role.role === 'official_formula1_result_classification_not_corner_geometry'));
      assert.ok(entry.source_locator?.length > 45, entry.label.en);
      assert.equal(entry.source_roles.length, entry.source_urls.length);
      assert.ok(entry.source_roles.every(role => entry.source_urls.includes(role.url) && role.role));
      assert.equal(entry.media_rights.external_reference_only, true);
      assert.equal(entry.media_rights.third_party_map_reuse_approved, false);
      assert.equal(entry.media_rights.third_party_photo_reuse_approved, false);
      en.add(entry.explanation.en);
      uk.add(entry.explanation.uk);
      if (entry.geometry_kind === 'single_bend') individual++;
    }
    assert.equal(en.size, entries.length);
    assert.equal(uk.size, entries.length);
    assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === id), false);
    assert.equal(hasPublicationReadyCornerGuide(id), false);
    assert.equal(isCircuitEditionApproved(id), false);
    total += entries.length;
  }
  assert.equal(total, 5);
  assert.equal(individual, 3);
  assert.equal(candidateUnnumberedPeriodBendStudies.length, 53);
});

test('1957 Pescara pre-pit bends and Spoltore group are not misrepresented as individual FIA turns', () => {
  const pescara = candidateUnnumberedPeriodBendStudies.filter(item => item.circuit_id === 'pescara');
  assert.equal(pescara.filter(item => item.geometry_kind === 'multi_bend_complex').length, 2);
  assert.match(pescara[3].explanation.en, /does not state how many apexes/);
  assert.match(pescara[1].explanation.en, /does not enumerate them/);
  assert.match(pescara[0].explanation.en, /neither a 1957 FIA corner number/);
  assert.match(pescara[2].explanation.en, /Neither source certifies/);
});

test('1958 Ain-Diab opening bend does not infer handedness from the race report', () => {
  const [bend] = candidateUnnumberedPeriodBendStudies.filter(item => item.circuit_id === 'ain-diab');
  assert.ok(bend);
  assert.match(bend.explanation.en, /not its handedness/);
  assert.match(bend.explanation.uk, /не його напрямок/);
  assert.equal(bend.official_turn_number, null);
});
