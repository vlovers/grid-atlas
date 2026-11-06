import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateUnnumberedNamedBendStudies } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const expectedNames = [
  'Manson', 'Gravenoire', 'Belvédère', 'Jumeaux', 'Carrière',
  'Champeaux', 'Ferme', 'Petit Pont', 'Marlboro hairpin', 'Thèdes', 'Rosier',
];
const venue = 'https://www.charade.fr/galerie-photos/charade-dans-le-retro/';

test('eleven individually written Charade historic named bends retain official venue provenance and bilingual copy', () => {
  const charade = candidateUnnumberedNamedBendStudies.filter(bend => bend.circuit_id === 'clermont-ferrand');
  assert.equal(charade.length, expectedNames.length);
  assert.deepEqual(charade.map(bend => bend.name), expectedNames);
  const enStories = new Set();
  const ukStories = new Set();
  for (const [index, bend] of charade.entries()) {
    assert.equal(bend.reading_order, index + 1);
    assert.equal(bend.circuit_id, 'clermont-ferrand');
    assert.equal(bend.layout_id, 'clermont-ferrand-1');
    assert.equal(bend.historical_layout_id, 'clermont-ferrand-1');
    assert.equal(bend.numbering_year, null);
    assert.equal(bend.official_turn_number, null);
    assert.equal(bend.geometric_anchor_verified, false);
    assert.equal(bend.numbered_apex_verified, false);
    assert.equal(bend.publication_allowed, false);
    assert.equal(bend.review_status, 'independent_review_pending');
    assert.ok(bend.source_urls.includes(venue));
    assert.ok(bend.source_urls.every(url => /^https:\/\//.test(url)));
    assert.ok(bend.source_urls.some(url => url.startsWith('https://www.charade.fr/')));
    assert.equal(bend.source_role, 'official_venue_historical_named_bend_not_numbered_fia_map');
    assert.ok(bend.explanation.en.trim().split(/\s+/).length >= 30, bend.name);
    assert.ok(bend.explanation.uk.trim().split(/\s+/).length >= 25, bend.name);
    assert.match(bend.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    enStories.add(bend.explanation.en);
    ukStories.add(bend.explanation.uk);
    if (bend.name === 'Marlboro hairpin') assert.equal(bend.name_origin, null);
    else {
      assert.ok(bend.name_origin?.en && bend.name_origin?.uk, bend.name);
      assert.match(bend.name_origin.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    }
  }
  assert.equal(enStories.size, 11);
  assert.equal(ukStories.size, 11);
});

test('historic venue names do not imply a numbered FIA map or bypass publication gate', () => {
  assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === 'clermont-ferrand'), false);
  assert.equal(hasPublicationReadyCornerGuide('clermont-ferrand'), false);
  assert.equal(candidateUnnumberedNamedBendStudies.some(bend => bend.official_turn_number !== null), false);
});
