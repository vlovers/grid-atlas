import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const entries = read('apps/web/src/components/editorial/circuit-narratives-v3.json').entries;
const stories = read('apps/web/src/components/editorial/archive-summaries/circuit-extra-stories.json');
const gate = read('docs/editorial/circuit-experience-v3/BATCH_01_20_RELEASE_GATE_20261106.json');
test('all 20 first-batch candidates have bilingual histories and sourced moments where safe', () => {
  assert.equal(stories.length, 20);
  for (const story of stories) {
    const matches = entries.filter(entry => entry.circuit_id === story.id);
    assert.equal(matches.length, 1, story.id);
    const entry = matches[0];
    assert.ok(entry.biography.text.en && entry.biography.text.uk);
    assert.ok(entry.biography.source.startsWith('https://'));
    assert.ok(entry.moments.length >= 2, story.id + ': first batch requires two separate source-backed moments');
    assert.equal(new Set(entry.moments.map(moment => moment.id)).size, entry.moments.length, story.id);
    for (const moment of entry.moments) {
      assert.ok(moment.title.en && moment.title.uk && moment.text.en && moment.text.uk, story.id);
      assert.ok(moment.source.startsWith('https://'), story.id);
      assert.equal(moment.review_status, 'independent_review_pending');
    }
  }
});
test('multi-year summary never creates a fake single-year milestone', () => {
  for (const story of stories.filter(story => !/^\d{4}$/.test(story.year))) {
    const entry = entries.find(entry => entry.circuit_id === story.id);
    assert.ok(!entry.moments.some(moment => moment.id === story.id + '-' + story.year + '-public-summary'));
  }
  assert.equal(gate.release_authorized, false);
});
