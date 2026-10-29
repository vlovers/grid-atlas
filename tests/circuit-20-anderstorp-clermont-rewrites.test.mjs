import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const doc = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_REWRITTEN_ANDERSTORP_CLERMONT_20261029.json', import.meta.url), 'utf8'));
const ids = ['anderstorp', 'bremgarten', 'buenos-aires', 'clermont-ferrand'];

test('twenty bilingual reader drafts retain source locators and blocked release', () => {
  assert.equal(doc.kind, 'bilingual_reader_copy_rewrite');
  assert.equal(doc.entries.length, 20);
  assert.equal(doc.publication_allowed, false);
  assert.equal(doc.independent_approval, false);
  for (const id of ids) {
    const records = doc.entries.filter(item => item.circuit_id === id);
    assert.deepEqual(records.map(item => item.story_index), [1, 2, 3, 4, 5]);
  }
  for (const entry of doc.entries) {
    assert.equal(entry.publication_allowed, false);
    assert.equal(entry.independent_approval, false);
    assert.equal(entry.source_urls.length, 1);
    assert.match(entry.source_urls[0], /^https:\/\/www\.formula1\.com\/en\/results\//);
    for (const lang of ['en', 'uk']) {
      assert.ok(entry.title[lang].length > 8);
      assert.ok(entry.narrative[lang].length > 110, entry.circuit_id + ':' + entry.story_index + ':' + lang);
    }
  }
});
