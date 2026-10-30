import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const document = JSON.parse(
  readFileSync(
    new URL(
      '../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
      import.meta.url,
    ),
    'utf8',
  ),
);

const expected = new Map([
  ['ain-diab', ['53 laps', 'lap 39', 'engine failed']],
  ['anderstorp', ['lap 38', '0.086 seconds', '46 officially completed laps']],
  ['bremgarten', ['66 laps', '57.8 seconds', 'oil']],
  ['bugatti', ['80 laps', 'gear lever', 'final drive']],
  ['clermont-ferrand', ['38 laps', 'puncture', 'Helmut Marko']],
]);

test('five historic dossiers contain 25 distinct bilingual, sourced race scenes', () => {
  let scenes = 0;
  for (const [id, anchors] of expected) {
    const circuit = document.circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((scene) => scene.story_index), [1, 2, 3, 4, 5]);
    const english = new Set();
    const ukrainian = new Set();
    for (const scene of circuit.stories) {
      scenes++;
      assert.ok(scene.narrative.en.length >= 180, id + '/en');
      assert.ok(scene.narrative.uk.length >= 170, id + '/uk');
      english.add(scene.narrative.en);
      ukrainian.add(scene.narrative.uk);
      assert.ok(scene.source_urls.every((url) => url.includes('formula1.com/en/results/')), id + '/classification');
      assert.ok(scene.historical_sources.length >= 1, id + '/historical');
      assert.ok(scene.historical_sources.every((url) => !scene.source_urls.includes(url)), id + '/source separation');
      assert.match(scene.historical_source_locator, /classification.*review pending/i, id + '/review');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review', id);
      assert.equal(scene.independent_approval, false, id);
      assert.equal(scene.publication, 'blocked', id);
    }
    assert.equal(english.size, 5, id + '/distinct English scenes');
    assert.equal(ukrainian.size, 5, id + '/distinct Ukrainian scenes');
    for (const anchor of anchors) {
      assert.ok(circuit.stories.some((scene) => scene.narrative.en.includes(anchor)), id + '/' + anchor);
    }
  }
  assert.equal(scenes, 25);
  assert.equal(document.publication, 'blocked');
});
