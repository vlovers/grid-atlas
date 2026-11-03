import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateCornerGuides,
  candidateUnnumberedHistoricalRoutes,
  candidateUnnumberedNamedBendStudies,
  candidateUnnumberedPeriodBendStudies,
} from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const periodReport = 'https://www.motorsportmagazine.com/archive/article/january-1960/16/the-first-grand-prix-of-the-united-states/';
const periodMap = 'https://commons.wikimedia.org/wiki/File:Circuit_Sebring_1959.svg';
const expectedParents = [2, 3, 6, 8, 8, 9, 9, 10];

test('eight separate 1959 Sebring bends have original bilingual period-source narratives', () => {
  const sebringBends = candidateUnnumberedPeriodBendStudies.filter(bend => bend.circuit_id === 'sebring');
  assert.equal(sebringBends.length, 8);
  assert.deepEqual(sebringBends.map(bend => bend.reading_order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(sebringBends.map(bend => bend.parent_route_section_order), expectedParents);
  const en = new Set();
  const uk = new Set();
  for (const bend of sebringBends) {
    assert.equal(bend.circuit_id, 'sebring');
    assert.equal(bend.layout_id, 'sebring-1');
    assert.equal(bend.historical_layout_id, 'sebring-1');
    assert.equal(bend.period, '1959');
    assert.equal(bend.geometry_kind, 'single_bend');
    assert.ok(bend.label.en && bend.label.uk);
    assert.equal(bend.name, null);
    assert.equal(bend.name_origin, null);
    assert.equal(bend.official_turn_number, null);
    assert.equal(bend.numbering_year, null);
    assert.equal(bend.geometric_anchor_verified, false);
    assert.equal(bend.numbered_apex_verified, false);
    assert.equal(bend.publication_allowed, false);
    assert.equal(bend.review_status, 'independent_review_pending');
    assert.ok(bend.explanation.en.trim().split(/\s+/).length >= 30, bend.label.en);
    assert.ok(bend.explanation.uk.trim().split(/\s+/).length >= 30, bend.label.en);
    assert.match(bend.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.ok(bend.source_urls.includes(periodReport));
    assert.ok(bend.source_urls.includes(periodMap));
    assert.equal(bend.source_roles.find(source => source.url === periodReport)?.role,
      'contemporary_1960_route_sequence_individual_direction_changes');
    assert.equal(bend.source_roles.find(source => source.url === periodMap)?.role,
      'later_2010_historical_layout_illustration_not_numbered_1959_fia_chart');
    assert.equal(bend.media_rights.external_reference_only, true);
    assert.match(bend.media_rights.linked_historical_map_license, /CC BY-SA 3\.0.*Oliver Pohlmann/);
    assert.equal(bend.media_rights.third_party_map_reuse_approved, false);
    assert.equal(bend.media_rights.third_party_photo_reuse_approved, false);
    en.add(bend.explanation.en);
    uk.add(bend.explanation.uk);
  }
  assert.equal(en.size, 8);
  assert.equal(uk.size, 8);
});

test('historical bend studies do not masquerade as 1959 FIA-numbered corners', () => {
  const route = candidateUnnumberedHistoricalRoutes.find(route => route.circuit_id === 'sebring');
  assert.ok(route);
  assert.equal(route.sections.length, 10);
  assert.equal(route.period_bend_studies.length, 8);
  assert.equal(candidateUnnumberedNamedBendStudies.length, 13); // Charade (11) and Pescara (2) remain separate.
  assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === 'sebring'), false);
  assert.equal(hasPublicationReadyCornerGuide('sebring'), false);
  assert.ok(candidateUnnumberedPeriodBendStudies.every(bend => bend.official_turn_number === null));
});
