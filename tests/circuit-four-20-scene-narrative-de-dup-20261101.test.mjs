import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const filenames = [
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const circuits = filenames.flatMap((name) => JSON.parse(readFileSync(new URL(name, root), 'utf8')).circuits);
const ids = ['caesars-palace', 'nivelles', 'pescara', 'bremgarten'];

test('20 revised scenes retain bilingual depth, independent evidence and fail-closed review', () => {
  let total = 0;
  for (const id of ids) {
    const circuit = circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    for (const scene of circuit.stories) {
      total++;
      assert.ok(scene.narrative.en.trim().split(/\s+/).length >= 65, id + '/EN/' + scene.story_index);
      assert.ok(scene.narrative.uk.trim().split(/\s+/).length >= 55, id + '/UK/' + scene.story_index);
      assert.doesNotMatch(scene.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(scene.historical_sources.length >= 2);
      assert.match(scene.historical_source_locator, /classification/i);
      assert.match(scene.historical_source_locator, /(?:pending|review)/i);
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
    }
  }
  assert.equal(total, 20);
});

test('scene-specific duplication and English script leakage stay removed', () => {
  const get = (id, index, locale) => circuits.find((c) => c.circuit_id === id).stories[index - 1].narrative[locale];
  assert.doesNotMatch(get('nivelles', 1, 'en'), /changed his line through the downhill esses and passed Regazzoni on lap nine.*changed his line/s);
  assert.doesNotMatch(get('nivelles', 5, 'en'), /late in the race.*late in the race/s);
  assert.doesNotMatch(get('nivelles', 5, 'uk'), /Наприкінці гонки.*наприкінці гонки/s);
  assert.doesNotMatch(get('caesars-palace', 2, 'en'), /[А-Яа-яІіЇїЄєҐґ]/);
  assert.match(get('caesars-palace', 5, 'en'), /For Cheever this was also/);
  assert.match(get('pescara', 2, 'en'), /wheel change cost Fangio/);
});
