import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const files = [
  'EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json',
  'EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json',
  'EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json',
  'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json',
];
const documents = files.map(file => JSON.parse(readFileSync(new URL(file, root), 'utf8')));
const circuits = documents.flatMap(document => document.circuits);

test('all 33 expanded circuit dossiers and 165 scenes have two distinct historical publishers', () => {
  assert.equal(circuits.length, 33);
  assert.equal(new Set(circuits.map(circuit => circuit.circuit_id)).size, 33);
  let scenes = 0;
  for (const document of documents) assert.equal(document.publication, 'blocked');
  for (const circuit of circuits) {
    assert.deepEqual(circuit.stories.map(scene => scene.story_index), [1, 2, 3, 4, 5], circuit.circuit_id);
    for (const scene of circuit.stories) {
      scenes++;
      const label = circuit.circuit_id + '/' + scene.story_index;
      assert.ok(scene.narrative.en.length > 200, label + '/EN');
      assert.ok(scene.narrative.uk.length > 200, label + '/UK');
      assert.ok(scene.source_urls.some(url => url.includes('formula1.com/en/results/')), label + '/classification');
      assert.ok(scene.historical_sources.length >= 2, label + '/historical sources');
      assert.equal(new Set(scene.historical_sources).size, scene.historical_sources.length, label + '/unique URLs');
      const publishers = new Set(scene.historical_sources.map(url => new URL(url).hostname.replace(/^www\./, '')));
      assert.ok(publishers.size >= 2, label + '/distinct publishers');
      assert.ok(scene.historical_sources.every(url => !scene.source_urls.includes(url)), label + '/source separation');
      assert.ok(scene.historical_source_locator.length >= 25, label + '/evidence locator');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review', label);
      assert.equal(scene.independent_approval, false, label);
      assert.equal(scene.publication, 'blocked', label);
    }
  }
  assert.equal(scenes, 165);
});
