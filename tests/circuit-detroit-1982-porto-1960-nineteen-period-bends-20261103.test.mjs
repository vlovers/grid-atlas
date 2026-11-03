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
const expected = {
  detroit: { layout: 'detroit-1', period: '1982', count: 17, parents: [2, 2, 3, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 9, 9, 10, 10] },
  porto: { layout: 'porto-1', period: '1958–1960', count: 2, parents: [1, 3] },
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
  assert.equal(candidateUnnumberedPeriodBendStudies.length, 27); // 8 Sebring + 17 Detroit + 2 Porto.
  assert.ok(candidateUnnumberedPeriodBendStudies.every(bend =>
    bend.official_turn_number === null && bend.numbered_apex_verified === false && bend.publication_allowed === false
  ));
});
