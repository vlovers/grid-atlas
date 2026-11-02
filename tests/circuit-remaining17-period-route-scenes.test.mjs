import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
const expected = ['ain-diab','bremgarten','bugatti','caesars-palace','clermont-ferrand','dallas','detroit','jacarepagua','monsanto','mont-tremblant','nivelles','pedralbes','pescara','phoenix','porto','riverside','sebring'];

test('seventeen historical route studies preserve and expand bilingual research sections', () => {
  assert.equal(data.circuits.length, 17);
  assert.deepEqual(data.circuits.map(c => c.circuit_id), expected);
  // The original 34 sections were expanded to 88; do not freeze the count against future research.
  assert.ok(data.circuits.reduce((sum, c) => sum + c.sections.length, 0) >= 88);
  for (const circuit of data.circuits) {
    assert.ok(circuit.period.length >= 4);
    assert.equal(circuit.independent_numbering_verified, false);
    assert.ok(circuit.sections.length >= 2);
    assert.deepEqual(circuit.sections.map(s => s.reading_order), Array.from({ length: circuit.sections.length }, (_, i) => i + 1));
    for (const section of circuit.sections) {
      assert.ok(section.label.en.length >= 12);
      assert.ok(section.label.uk.length >= 12);
      assert.ok(section.description.en.trim().split(/\s+/).length >= 29, circuit.circuit_id + ':en');
      assert.ok(section.description.uk.trim().split(/\s+/).length >= 23, circuit.circuit_id + ':uk');
      assert.equal(section.turn_numbers, null, 'research order is not an apex number');
      assert.equal(section.review_status, 'pending');
      assert.ok(section.source_urls.length >= 1 && section.source_urls.every(url => url.startsWith('https://')));
    }
  }
});

test('unverified historical research remains explicitly outside the publication gate', () => {
  assert.equal(data.release_authorized, false);
  assert.equal(data.image_rights_approved, false);
  assert.match(data.coverage_note, /Independent mapping remains incomplete/);
});
