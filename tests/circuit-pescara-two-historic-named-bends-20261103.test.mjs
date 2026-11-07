import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateUnnumberedNamedBendStudies, candidateUnnumberedPeriodBendStudies } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { hasPublicationReadyCornerGuide } from '../apps/web/src/components/editorial/circuit-release.ts';

const localHistory = 'https://www.40mila.it/2019/09/04/pescara-si-vince-correndo-coppa-acerbo-aneddoti-e-curiosita/';
const regionalHistory = 'https://gpkingdom.it/39104/il-leggendario-circuito-di-pescara/';

test('two historic Pescara bend names are bilingual research with source-specific location caveats', () => {
  const entries = candidateUnnumberedNamedBendStudies.filter(bend => bend.circuit_id === 'pescara');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map(bend => bend.name), ['Curva della Morte', 'Esse di Cappelle']);
  assert.deepEqual(entries.map(bend => bend.reading_order), [1, 2]);
  assert.ok(entries[0].source_urls.includes(regionalHistory));
  assert.ok(entries[1].source_urls.includes(localHistory));
  assert.equal(entries[0].source_role, 'regional_retrospective_historical_bend_name_period_1957_unverified');
  assert.equal(entries[1].source_role, 'local_historical_account_named_s_complex_exact_location_disputed');
  assert.match(entries[1].explanation.en, /could not decide whether the name referred to the double bend/);
  assert.match(entries[1].explanation.uk, /не (?:може|міг) визначити/);
  for (const bend of entries) {
    assert.equal(bend.layout_id, 'pescara-1');
    assert.equal(bend.historical_layout_id, 'pescara-1');
    assert.equal(bend.numbering_year, null);
    assert.equal(bend.official_turn_number, null);
    assert.equal(bend.geometric_anchor_verified, false);
    assert.equal(bend.numbered_apex_verified, false);
    assert.equal(bend.review_status, 'independent_review_pending');
    assert.equal(bend.publication_allowed, false);
    assert.ok(bend.name_origin?.en && bend.name_origin?.uk);
    assert.ok(bend.explanation.en.trim().split(/\s+/).length >= 30);
    assert.ok(bend.explanation.uk.trim().split(/\s+/).length >= 30);
    assert.match(bend.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
  }
});

test('regional names and the Cappelle S complex do not create a numbered 1957 guide', () => {
  assert.equal(candidateCornerGuides.some(guide => guide.circuit_id === 'pescara'), false);
  assert.equal(hasPublicationReadyCornerGuide('pescara'), false);
  assert.equal(candidateUnnumberedNamedBendStudies.length, 13);
});

test('historical named features are typed: five bends, four complexes, two sectors, two unresolved', () => {
  const types = new Map([
    ['single_bend', 5],
    ['multi_bend_complex', 4],
    ['route_sector', 2],
    ['named_feature_unresolved', 2],
  ]);
  assert.equal(candidateUnnumberedNamedBendStudies.length, 13);
  for (const [type, count] of types) {
    assert.equal(candidateUnnumberedNamedBendStudies.filter(entry => entry.feature_kind === type).length, count, type);
  }
  for (const entry of candidateUnnumberedNamedBendStudies) {
    assert.equal(entry.period_name_independently_verified, false);
    assert.equal(entry.geometric_anchor_verified, false);
    assert.equal(entry.numbered_apex_verified, false);
    assert.equal(entry.official_turn_number, null);
    assert.equal(entry.publication_allowed, false);
  }
  assert.equal(candidateUnnumberedPeriodBendStudies.filter(entry => entry.circuit_id === 'sebring').length, 8);
  assert.ok(candidateUnnumberedPeriodBendStudies.every(entry => entry.name === null && entry.official_turn_number === null));
});
