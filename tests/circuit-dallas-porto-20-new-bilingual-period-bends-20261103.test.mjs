import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateUnnumberedHistoricalRoutes,
  candidateUnnumberedPeriodBendStudies,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const specs = {
  dallas: {
    layout: 'dallas-1', period: '1984', originalCount: 1, newCount: 15,
    parents: [1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 11, 11, 12],
    contemporary: 'https://www.motorsportmagazine.com/archive/article/august-1984/22/dallas-grand-prix/',
    periodMap: 'https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html',
    result: 'https://www.formula1.com/en/results/1984/races/474/dallas/race-result',
  },
  porto: {
    layout: 'porto-1', period: '1958–1960', originalCount: 2, newCount: 5,
    parents: [1, 4, 5, 5, 7],
    contemporary: 'https://www.motorsportmagazine.com/archive/article/october-1958/31/vii-grande/',
    periodMap: 'https://www.motorsportmagazine.com/archive/article/september-1960/14/portuguese-grand-prix-5/',
    result: 'https://www.formula1.com/en/results/1960/races/185/portugal/race-result',
  },
};

test('twenty new Dallas 1984 and Porto 1958–60 individual bends have unique original EN/UK prose', () => {
  let added = 0;
  for (const [id, spec] of Object.entries(specs)) {
    const route = candidateUnnumberedHistoricalRoutes.find(item => item.circuit_id === id);
    assert.ok(route, id);
    assert.equal(route.layout_id, spec.layout);
    const all = candidateUnnumberedPeriodBendStudies.filter(item => item.circuit_id === id);
    assert.equal(all.length, spec.originalCount + spec.newCount, id);
    const fresh = all.slice(spec.originalCount);
    assert.deepEqual(fresh.map(b => b.parent_route_section_order), spec.parents, id);
    assert.deepEqual(all.map(b => b.reading_order), Array.from({ length: all.length }, (_, i) => i + 1));
    const en = new Set();
    const uk = new Set();
    for (const bend of fresh) {
      assert.equal(bend.historical_layout_id, spec.layout);
      assert.equal(bend.layout_id, spec.layout);
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
      assert.match(bend.evidence_limit, /not a period FIA-numbered apex crosswalk/);
      assert.ok(bend.label.en && bend.label.uk);
      assert.ok(bend.explanation.en.trim().split(/\\s+/).length >= 30, bend.label.en);
      assert.ok(bend.explanation.uk.trim().split(/\\s+/).length >= 28, bend.label.uk);
      assert.match(bend.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(bend.source_urls.includes(spec.contemporary));
      assert.ok(bend.source_urls.includes(spec.periodMap));
      assert.ok(bend.source_urls.includes(spec.result));
      assert.ok(bend.source_roles.some(x => x.url === spec.result && x.role === 'official_formula1_result_classification_not_corner_geometry'));
      assert.ok(bend.source_roles.some(x => x.url === spec.contemporary && x.role !== 'official_fia_apex_map'));
      assert.equal(bend.media_rights.external_reference_only, true);
      assert.equal(bend.media_rights.third_party_map_reuse_approved, false);
      assert.equal(bend.media_rights.third_party_photo_reuse_approved, false);
      en.add(bend.explanation.en);
      uk.add(bend.explanation.uk);
    }
    assert.equal(en.size, spec.newCount, id);
    assert.equal(uk.size, spec.newCount, id);
    assert.equal(candidateCornerGuides.some(g => g.circuit_id === id), false);
    assert.equal(hasPublicationReadyCornerGuide(id), false);
    added += fresh.length;
  }
  assert.equal(added, 20);
});

test('historic bend studies never silently upgrade 1984 Dallas or 1958 Porto to official numbered guides', () => {
  assert.equal(candidateUnnumberedPeriodBendStudies.length, 48);
  for (const bend of candidateUnnumberedPeriodBendStudies) {
    assert.equal(bend.official_turn_number, null);
    assert.equal(bend.numbered_apex_verified, false);
    assert.equal(bend.publication_allowed, false);
  }
});
