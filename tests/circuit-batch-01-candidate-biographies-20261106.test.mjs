import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const narratives = read('apps/web/src/components/editorial/circuit-narratives-v3.json').entries;
const publicStories = read('apps/web/src/components/editorial/archive-summaries/circuit-extra-stories.json');
const gate = read('docs/editorial/circuit-experience-v3/BATCH_01_20_RELEASE_GATE_20261106.json');
test('first batch has twenty bilingual candidate biographies with source provenance', () => {
  const ids = publicStories.map(story => story.id);
  assert.equal(ids.length, 20);
  for (const story of publicStories) {
    const matches = narratives.filter(entry => entry.circuit_id === story.id);
    assert.equal(matches.length, 1, story.id);
    const bio = matches[0].biography;
    assert.ok(bio.title.en.length > 8 && bio.title.uk.length > 8, story.id);
    assert.ok(bio.text.en.length > 40 && bio.text.uk.length > 40, story.id);
    assert.match(bio.source, /^https:\/\//);
    assert.ok(Array.isArray(matches[0].moments));
  }
});
test('candidate biographies cannot independently authorize release', () => {
  assert.equal(gate.release_authorized, false);
  assert.equal(gate.ready_count, 0);
  assert.ok(gate.circuits.every(circuit => circuit.publication_status === 'blocked'));
});
