import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateUnnumberedHistoricalRoutes,
  candidateUnnumberedPeriodBendStudies,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const periodReports = {
  detroit: 'https://www.motorsportmagazine.com/archive/article/july-1982/43/the-grand-prix-of-detroit/',
  porto: 'https://www.motorsportmagazine.com/archive/article/september-1960/14/portuguese-grand-prix-5/',
};
const officialResults = {
  detroit: 'https://www.formula1.com/en/results/1982/races/443/detroit/race-result',
  porto: 'https://www.formula1.com/en/results/1960/races/185/portugal/race-result',
};
const expected = {
  detroit: { layout: 'detroit-1', period: '1982', count: 17, parents: [2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 9, 9, 10, 10] },
  porto: { layout: 'porto-1', period: '1958–1960', count: 7, parents: [1, 3, 1, 4, 5, 5, 7] },
};

test('Detroit 1982 and Porto 1960 preserve 19 distinct bilingual period-report bends', () => {
  for (const [id, spec] of Object.entries(expected)) {
    const route = candidateUnnumberedHistoricalRoutes.find(item => item.circuit_id === id);
    assert.ok(route, id);
    const bends = candidateUnnumberedPeriodBendStudies.filter(item => item.circuit_id === id);
    assert.equal(bends.length, spec.count, id);
    assert.deepEqual(bends.map(item => item.reading_order), Array.from({ length: spec.count }, (_, i) => i + 1));
    assert.deepEqual(bends.map(item => item.parent_route_section_order), spec.parents);
    assert.equal(route.period_bend_studies.length, spec.count);
    const english = new Set();
    const ukrainian = new Set();
    for (const bend of bends) {
      assert.equal(bend.layout_id, spec.layout);
      assert.equal(bend.historical_layout_id, spec.layout);
      assert.equal(bend.period, spec.period);
      assert.equal(bend.geometry_kind, 'single_bend');
      assert.equal(bend.name, null);
      assert.equal(bend.name_origin, null);
      assert.equal(bend.numbering_year, null);
      assert.equal(bend.official_turn_number, null);
      assert.equal(bend.geometric_anchor_verified, false);
      assert.equal(bend.numbered_apex_verified, false);
      assert.equal(bend.publication_allowed, false);
      assert.equal(bend.review_status, 'independent_review_pending');
      assert.ok(bend.label.en && bend.label.uk);
      assert.ok(bend.explanation.en.trim().split(/\s+/).length >= 30, bend.label.en);
      assert.ok(bend.explanation.uk.trim().split(/\s+/).length >= 30, bend.label.uk);
      assert.match(bend.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(bend.source_urls.includes(periodReports[id]));
      assert.ok(bend.source_urls.includes(officialResults[id]));
      assert.ok(bend.source_roles.some(role => role.url === officialResults[id] && role.role === 'official_formula1_result_classification_not_corner_geometry'));
      assert.ok(bend.source_roles.some(role => role.url === periodReports[id] && role.role.startsWith('contemporary_')));
      assert.equal(bend.media_rights.external_reference_only, true);
      assert.equal(bend.media_rights.third_party_map_reuse_approved, false);
      assert.equal(bend.media_rights.third_party_photo_reuse_approved, false);
      english.add(bend.explanation.en);
      ukrainian.add(bend.explanation.uk);
    }
    assert.equal(english.size, spec.count);
    assert.equal(ukrainian.size, spec.count);
    assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === id), false);
    assert.equal(hasPublicationReadyCornerGuide(id), false);
  }
});

test('all period-report bends remain unnumbered and unpublished', () => {
  assert.equal(candidateUnnumberedPeriodBendStudies.length, 53); // 8 Sebring + 17 Detroit + 7 Porto + 16 Dallas + 4 Pescara + 1 Ain-Diab.
  assert.ok(candidateUnnumberedPeriodBendStudies.every(bend =>
    bend.official_turn_number === null && bend.numbered_apex_verified === false && bend.publication_allowed === false
  ));
});

test('Dallas 1984 final bend is sourced to the period report without a fabricated FIA number', () => {
  const dallas = candidateUnnumberedHistoricalRoutes.find(route => route.circuit_id === 'dallas');
  assert.ok(dallas);
  assert.equal(dallas.period_bend_studies.length, 16);
  const [bend] = dallas.period_bend_studies;
  assert.equal(bend.historical_layout_id, 'dallas-1');
  assert.equal(bend.parent_route_section_order, 13);
  assert.equal(bend.geometry_kind, 'single_bend');
  assert.equal(bend.official_turn_number, null);
  assert.equal(bend.numbered_apex_verified, false);
  assert.equal(bend.publication_allowed, false);
  assert.ok(bend.explanation.en.includes('Nigel Mansell'));
  assert.ok(bend.explanation.uk.includes('Найджел Менселл'));
  assert.ok(bend.source_urls.includes('https://www.motorsportmagazine.com/archive/article/august-1984/22/dallas-grand-prix/'));
  assert.ok(bend.source_urls.includes('https://www.formula1.com/en/results/1984/races/474/dallas/race-result'));
  assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === 'dallas'), false);
  assert.equal(hasPublicationReadyCornerGuide('dallas'), false);
});
