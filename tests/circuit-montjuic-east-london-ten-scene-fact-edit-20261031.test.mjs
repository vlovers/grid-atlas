import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const montjuic = read('EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json').circuits.find(c => c.circuit_id === 'montjuic');
const east = read('EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json').circuits.find(c => c.circuit_id === 'east-london');

test('ten Montjuic and East London scenes preserve bilingual copy and review boundary', () => {
  for (const dossier of [montjuic, east]) {
    assert.ok(dossier);
    assert.deepEqual(dossier.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
    for (const scene of dossier.stories) {
      assert.ok(scene.narrative.en.trim().split(/\s+/).length >= 65);
      assert.ok(scene.narrative.uk.trim().split(/\s+/).length >= 55);
      assert.ok(scene.historical_sources.length >= 2);
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
    }
  }
});
test('Montjuic preserves conflicting fatality reports, stoppage and half-points', () => {
  assert.match(montjuic.stories[0].historical_source_locator, /five.*four/i);
  assert.ok(montjuic.stories[0].historical_sources.some(u => u.includes('theguardian.com')));
  assert.match(montjuic.stories[1].narrative.en, /lap 28/);
  assert.match(montjuic.stories[1].narrative.en, /lap 29/);
  assert.match(montjuic.stories[2].narrative.en, /half a point/);
  assert.match(montjuic.stories[4].narrative.en, /opening corner/i);
});
test('East London separates the Clark failure, title and local points', () => {
  assert.match(east.stories[0].narrative.en, /best five results/);
  assert.match(east.stories[1].narrative.en, /missing locking washer/);
  assert.match(east.stories[1].narrative.en, /two-inch bolt/);
  assert.equal((east.stories[1].narrative.en.match(/missing locking washer/g) || []).length, 1);
  assert.match(east.stories[3].narrative.en, /3\.5 seconds/);
  assert.match(east.stories[4].narrative.en, /78 of the winner's 82 laps/);
});
