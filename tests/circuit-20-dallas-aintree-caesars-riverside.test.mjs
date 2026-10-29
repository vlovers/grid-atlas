import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_DALLAS_AINTREE_CAESARS_RIVERSIDE_REWRITES_20261029.json', import.meta.url), 'utf8'));
test('twenty reader-first bilingual circuit stories remain research-only', () => {
  assert.equal(data.entries.length, 20);
  assert.equal(data.publication_allowed, false);
  assert.equal(data.independent_approval, false);
  for (const id of ['dallas', 'aintree', 'caesars-palace', 'riverside']) {
    const stories = data.entries.filter(x => x.circuit_id === id);
    assert.deepEqual(stories.map(x => x.story_index), [1, 2, 3, 4, 5]);
  }
  for (const entry of data.entries) {
    assert.equal(entry.publication_allowed, false);
    assert.equal(entry.independent_approval, false);
    assert.ok(entry.source_urls.length > 0);
    for (const locale of ['en', 'uk']) {
      assert.ok(entry.title[locale].length > 10);
      assert.ok(entry.narrative[locale].length > 320, entry.circuit_id + ':' + entry.story_index + ':' + locale);
    }
  }
});