import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const manuscript = readFileSync(new URL('FOUR_MORE_DISTINCT_RACES_20261028.md', root), 'utf8');
const ledger = JSON.parse(readFileSync(new URL('CIRCUIT_33_CANONICAL_STORY_INDEX.json', root), 'utf8'));
const expected = [['monaco', 2004], ['monaco', 2011], ['spa-francorchamps', 2004], ['spa-francorchamps', 2009]];

test('four new event stories are bilingual, unique and gated', () => {
  const chapters = manuscript.split(/^## \d+\. /m).slice(1);
  assert.equal(chapters.length, expected.length);
  for (const [i, [id, year]] of expected.entries()) {
    const chapter = chapters[i];
    assert.ok(chapter.startsWith(id + ' (' + year + ')'));
    assert.match(chapter, /^### EN — /m);
    assert.match(chapter, /^### UK — /m);
    assert.match(chapter, /\*\*Official source:\*\* https:\/\/www\.formula1\.com\/en\/results\//);
    assert.match(chapter, /not publicly approved/);
    assert.equal(ledger.entries.filter(x => x.circuit_id === id && x.event_year === year).length, 1);
  }
});
