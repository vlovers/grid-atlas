import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const ids = ['dijon', 'monsanto', 'mont-tremblant', 'mosport'];
const circuits = new Map(data.circuits.map((c) => [c.circuit_id, c]));

test('20 period scenes distinguish eyewitness race context from classification', () => {
  let total = 0;
  for (const id of ids) {
    const circuit = circuits.get(id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    assert.equal(new Set(circuit.stories.map((s) => s.historical_source_locator)).size, 5);
    for (const story of circuit.stories) {
      total++;
      assert.match(story.historical_source_locator, /Motor Sport/);
      assert.match(story.historical_source_locator, /classification/i);
      assert.match(story.historical_source_locator, /Independent claim review pending/);
      assert.ok(story.narrative.en.trim().split(/\s+/).length >= 65);
      assert.ok(story.narrative.uk.trim().split(/\s+/).length >= 55);
      assert.equal(story.independent_approval, false);
      assert.equal(story.publication, 'blocked');
    }
  }
  assert.equal(total, 20);
  assert.equal(data.publication, 'blocked');
});

test('repeated source explanation is not mistaken for independent historical approval', () => {
  const scene = (id, index, locale) => circuits.get(id).stories[index - 1].narrative[locale];
  assert.doesNotMatch(scene('dijon', 5, 'en'), /His spin ended the race after 23 laps; the timing sheet/);
  assert.doesNotMatch(scene('monsanto', 1, 'en'), /until even runner-up Masten Gregory was a lap behind/);
  assert.doesNotMatch(scene('monsanto', 2, 'en'), /Brabham's heavy crash while trying to lap Mario Cabral/);
  assert.doesNotMatch(scene('mosport', 4, 'en'), /Clark did manage to get the Lotus moving again after a long delay/);
  assert.match(scene('mont-tremblant', 5, 'uk'), /Еймон контролював гонку/);
});
