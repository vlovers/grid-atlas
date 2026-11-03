import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateCornerGuides, candidateUnnumberedNamedBendStudies } from '../apps/web/src/components/editorial/circuit-candidates.ts';
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
  assert.match(entries[1].explanation.en, /exact location unresolved/);
  assert.match(entries[1].explanation.uk, /невизначеним/);
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
