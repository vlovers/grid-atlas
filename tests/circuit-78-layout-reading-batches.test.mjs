import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const base = '../docs/editorial/circuit-experience-v3/';
const files = [
  'BATCH_01_TWENTY_LAYOUT_READING_NOTES_20261102.json',
  'BATCH_02_TWENTY_LAYOUT_READING_NOTES_20261102.json',
  'BATCH_03_TWENTY_LAYOUT_READING_NOTES_20261102.json',
  'BATCH_04_EIGHTEEN_LAYOUT_READING_NOTES_20261102.json',
];
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const packages = files.map(name => read(base + name));
const sourceRegistry = read(base + 'F1DB_78_RELEASE_WORKLIST.json');
const registered = new Set(sourceRegistry.circuits.map(c => c.circuit_id));
const all = packages.flatMap(pkg => pkg.entries);
const validSource = value => /^https:\/\//.test(value) && !/\s/.test(value);
const words = text => text.trim().split(/\s+/).length;

test('78 original bilingual circuit-layout reading notes cover exactly the F1DB circuits in four batches', () => {
  assert.deepEqual(packages.map(pkg => pkg.entries.length), [20, 20, 20, 18]);
  assert.equal(all.length, 78);
  assert.equal(registered.size, 78);
  assert.deepEqual(new Set(all.map(entry => entry.circuit_id)), registered);
  assert.equal(all.reduce((sum, entry) => sum + entry.landmarks.length, 0), 126);
  for (const entry of all) {
    assert.ok(entry.layout_scope?.trim(), entry.circuit_id);
    assert.ok(words(entry.copy.en) >= 45, entry.circuit_id + ':en');
    assert.ok(words(entry.copy.uk) >= 40, entry.circuit_id + ':uk');
    assert.doesNotMatch(entry.copy.en, /[А-Яа-яІіЇїЄєҐґ]/, entry.circuit_id + ':mixed EN');
    assert.match(entry.copy.uk, /[А-Яа-яІіЇїЄєҐґ]/, entry.circuit_id + ':UK script');
    assert.ok(entry.evidence_urls.length >= 1 && entry.evidence_urls.every(validSource), entry.circuit_id);
    assert.ok(entry.landmarks.length >= 1, entry.circuit_id);
    for (const landmark of entry.landmarks) {
      assert.ok(landmark.name?.trim(), entry.circuit_id);
      assert.ok(landmark.era?.trim(), entry.circuit_id);
      assert.ok(validSource(landmark.provenance_url), entry.circuit_id);
      assert.equal(landmark.review_status, 'pending', entry.circuit_id);
      if (landmark.turn_numbers !== null) {
        assert.ok(Array.isArray(landmark.turn_numbers) && landmark.turn_numbers.length > 0, entry.circuit_id);
        assert.ok(landmark.turn_numbers.every(n => Number.isInteger(n) && n > 0), entry.circuit_id);
      }
    }
  }
});

test('research notes never become approved history, licensed images or a complete corner-number map', () => {
  for (const pkg of packages) {
    assert.equal(pkg.schema_version, 1);
    assert.equal(pkg.review_status, 'pending_independent_en_uk_claim_review');
    assert.equal(pkg.publication_authorized, false);
    assert.equal(pkg.image_rights_authorized, false);
    assert.equal(pkg.limitations.turn_by_turn_complete, false);
    for (const entry of pkg.entries) {
      assert.equal(entry.review_status, 'pending');
      assert.equal(entry.corner_numbering_status, 'not_independently_approved');
      assert.equal(entry.image_status, 'no_new_images');
    }
  }
});
