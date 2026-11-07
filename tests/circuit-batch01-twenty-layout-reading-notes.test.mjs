import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/BATCH_01_TWENTY_LAYOUT_READING_NOTES_20261102.json', import.meta.url), 'utf8'));
const expected = [
  'adelaide','aida','ain-diab','aintree','anderstorp','austin','avus','bahrain','baku',
  'brands-hatch','bremgarten','buddh','buenos-aires','bugatti','caesars-palace','catalunya',
  'clermont-ferrand','dallas','detroit','dijon'
];
const register = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json', import.meta.url), 'utf8'));
const circuits = new Set(register.circuits.map(c => c.circuit_id));

test('first 20 circuit notes are unique, historically scoped and bilingual', () => {
  assert.equal(data.schema_version, 1);
  assert.equal(data.entries.length, 20);
  assert.deepEqual([...data.entries.map(e => e.circuit_id)].sort(), [...expected].sort());
  for (const entry of data.entries) {
    assert.ok(circuits.has(entry.circuit_id), entry.circuit_id);
    assert.ok(entry.layout_scope.length >= 4, entry.circuit_id);
    assert.ok(entry.copy.en.trim().split(/\s+/).length >= 48, entry.circuit_id + ':en');
    assert.ok(entry.copy.uk.trim().split(/\s+/).length >= 42, entry.circuit_id + ':uk');
    assert.match(entry.copy.uk, /[ІіЇїЄєҐґА-Яа-я]/, entry.circuit_id);
    assert.doesNotMatch(entry.copy.en, /[ІіЇїЄєҐґА-Яа-я]/, entry.circuit_id);
    assert.match(entry.evidence_url, /^https:\/\//, entry.circuit_id);
    assert.ok(entry.evidence_urls.includes(entry.evidence_url), entry.circuit_id);
    assert.ok(entry.evidence_urls.every(url => /^https:\/\//.test(url)), entry.circuit_id);
    assert.ok(entry.landmarks.length > 0, entry.circuit_id);
    for (const landmark of entry.landmarks) {
      assert.ok(landmark.name.trim().length >= 5, entry.circuit_id);
      assert.ok(landmark.era.trim(), entry.circuit_id);
      assert.match(landmark.provenance_url, /^https:\/\//, entry.circuit_id);
      assert.equal(landmark.review_status, 'pending');
      if (landmark.turn_numbers !== null) {
        assert.ok(Array.isArray(landmark.turn_numbers) && landmark.turn_numbers.length > 0);
        assert.ok(landmark.turn_numbers.every(n => Number.isInteger(n) && n > 0));
      }
    }
  }
});

test('research notes cannot grant publication, turn numbering or media rights', () => {
  assert.equal(data.review_status, 'pending_independent_en_uk_claim_review');
  assert.equal(data.publication_authorized, false);
  assert.equal(data.image_rights_authorized, false);
  assert.equal(data.limitations.turn_by_turn_complete, false);
  for (const entry of data.entries) {
    assert.equal(entry.review_status, 'pending');
    assert.equal(entry.corner_numbering_status, 'not_independently_approved');
    assert.equal(entry.image_status, 'no_new_images');
  }
});
