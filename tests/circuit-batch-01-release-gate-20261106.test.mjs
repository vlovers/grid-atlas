import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const manifest = read('docs/editorial/circuit-experience-v3/BATCH_01_20_RELEASE_GATE_20261106.json');
const publicStories = read('apps/web/src/components/editorial/archive-summaries/circuit-extra-stories.json');
test('batch 01 covers exactly the first 20 public circuit identities, in order', () => {
  assert.equal(manifest.circuits.length, 20);
  assert.deepEqual(manifest.circuits.map(row => row.circuit_id), publicStories.map(row => row.id));
  assert.equal(new Set(manifest.circuits.map(row => row.circuit_id)).size, 20);
});
test('existing bilingual stories are not mistaken for fully reviewed publication editions', () => {
  assert.equal(manifest.release_authorized, false);
  assert.equal(manifest.ready_count, 0);
  for (const [index, row] of manifest.circuits.entries()) {
    assert.equal(row.order, index + 1);
    assert.equal(row.public_short_story.en, true);
    assert.equal(row.public_short_story.uk, true);
    assert.equal(row.public_short_story.source_url, publicStories[index].source);
    for (const key of ['independent_fact_review', 'period_layout_and_turn_review', 'media_rights_review', 'editorial_approval']) {
      assert.equal(row[key], 'pending', row.circuit_id + ':' + key);
    }
    assert.equal(row.publication_status, 'blocked');
  }
});
