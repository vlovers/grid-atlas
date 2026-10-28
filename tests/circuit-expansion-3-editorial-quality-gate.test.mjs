import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const path = new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url);
const data = JSON.parse(readFileSync(path, 'utf8'));
const expected = ['nivelles','pedralbes','pescara','porto','reims','riverside','rouen','sebring','spa-francorchamps','zeltweg','zolder'];
const normalize = (value) => value.normalize('NFKC').trim().replace(/\\s+/g, ' ').toLowerCase();

test('expansion-3 covers exactly eleven circuits and 55 bilingual stories', () => {
  assert.deepEqual(data.circuits.map((c) => c.circuit_id), expected);
  assert.equal(data.circuits.reduce((sum,c) => sum + c.stories.length, 0), 55);
  for (const circuit of data.circuits) {
    assert.equal(circuit.stories.length, 5, circuit.circuit_id);
    assert.deepEqual(circuit.stories.map((s) => s.story_index), [1,2,3,4,5]);
  }
});

test('titles are unique and narratives contain meaningful bilingual text', () => {
  for (const circuit of data.circuits) {
    for (const lang of ['en','uk']) {
      const titles = circuit.stories.map((s) => normalize(s.title[lang]));
      assert.equal(new Set(titles).size, 5, circuit.circuit_id + ':' + lang);
      for (const story of circuit.stories) {
        assert.ok(story.title[lang].trim().length >= 12, circuit.circuit_id);
        assert.ok(story.narrative[lang].trim().length >= 90, circuit.circuit_id);
      }
    }
    for (const story of circuit.stories) {
      assert.notEqual(normalize(story.title.en), normalize(story.title.uk));
      assert.notEqual(normalize(story.narrative.en), normalize(story.narrative.uk));
    }
  }
});

test('research drafts never bypass independent publication approval', () => {
  assert.equal(data.publication, 'blocked');
  for (const circuit of data.circuits) for (const story of circuit.stories) {
    assert.equal(story.publication, 'blocked');
    assert.equal(story.independent_approval, false);
    assert.equal(story.research_status, 'source_linked_editorial_draft');
    assert.ok(Array.isArray(story.source_urls) && story.source_urls.length > 0);
    for (const url of story.source_urls) {
      assert.match(url, /^https:\/\//);
      assert.doesNotThrow(() => new URL(url));
    }
  }
});

test('every story retains a year and independent evidence requirement', () => {
  for (const circuit of data.circuits) for (const story of circuit.stories) {
    assert.ok(Number.isInteger(story.year) && story.year >= 1950 && story.year <= 2026);
    assert.ok(story.narrative.en.trim().endsWith('.'));
    assert.ok(/[.!?]$/.test(story.narrative.uk.trim()));
  }
});
