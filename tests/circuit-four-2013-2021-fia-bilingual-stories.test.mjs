import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-narratives-v3.json', import.meta.url), 'utf8'));
const ids = ['buddh', 'yeongam', 'sepang', 'sirius'];

test('four historical tracks have original EN/UK biographies and eight dated race stories', () => {
  assert.ok(data.entries.length >= 13);
  for (const id of ids) {
    const entry = data.entries.find(x => x.circuit_id === id);
    assert.ok(entry, id);
    assert.equal(entry.moments.length, 2);
    assert.match(entry.biography.source, /^https:\/\//);
    assert.ok(entry.biography.text.en.trim().split(/\s+/).length >= 40);
    assert.ok(entry.biography.text.uk.trim().split(/\s+/).length >= 35);
    assert.ok(entry.biography.title.en && entry.biography.title.uk);
    for (const m of entry.moments) {
      assert.ok(m.id.startsWith(id+'-'));
      assert.ok(m.year >= 1950 && m.year <= 2026);
      assert.ok(m.title.en && m.title.uk);
      assert.ok(m.text.en.trim().split(/\s+/).length >= 40, m.id+':en');
      assert.ok(m.text.uk.trim().split(/\s+/).length >= 30, m.id+':uk');
      assert.match(m.source, /^https:\/\//);
      assert.equal(m.review_status, 'independent_review_pending');
    }
  }
  assert.equal(ids.reduce((n, id) => n + data.entries.find(x => x.circuit_id === id).moments.length, 0), 8);
});
