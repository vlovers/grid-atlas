import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = '../docs/editorial/circuit-experience-v3/';
const load = (file) => JSON.parse(readFileSync(new URL(root + file, import.meta.url), 'utf8'));
const batches = [
  ['EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json', 'aida'],
  ['EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json', 'anderstorp'],
  ['EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json', 'jarama'],
  ['EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json', 'jerez'],
];

test('20 bilingual scenes separate race classifications from independent historical leads', () => {
  let total = 0;
  for (const [file, id] of batches) {
    const data = load(file);
    const circuit = data.circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.equal(data.publication, 'blocked');
    assert.deepEqual(circuit.stories.map((scene) => scene.story_index), [1, 2, 3, 4, 5]);
    for (const scene of circuit.stories) {
      total++;
      assert.ok(scene.narrative.en.length >= 400 && scene.narrative.uk.length >= 400, id);
      assert.match(scene.historical_source_locator, /(?:classification|F1 result).*independent claim review pending/i, id);
      const domains = new Set(scene.historical_sources.map((url) => new URL(url).hostname.replace(/^www\\./, '')));
      assert.ok(domains.size >= 2, id + '/independent historical domains');
      assert.ok(scene.source_urls.every((url) => url.includes('formula1.com/en/results/')));
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
    }
  }
  assert.equal(total, 20);
});

test('Jarama 1981 starts seventh on the grid, not on the seventh row', () => {
  const story = load('EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json')
    .circuits.find((entry) => entry.circuit_id === 'jarama').stories[0];
  assert.match(story.narrative.en, /Starting seventh on the grid/);
  assert.match(story.narrative.uk, /Стартувавши із сьомої позиції/);
  assert.doesNotMatch(story.narrative.en, /seventh row/i);
});

test('Aida 1995 preserves the unresolved three-versus-four tyre-set discrepancy', () => {
  const story = load('EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json')
    .circuits.find((entry) => entry.circuit_id === 'aida').stories[3];
  assert.match(story.historical_source_locator, /four unused fresh sets/);
  assert.match(story.historical_source_locator, /reports three/);
  assert.match(story.historical_source_locator, /Count unresolved/);
});
