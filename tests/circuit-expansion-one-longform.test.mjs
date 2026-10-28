import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const manuscript = readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_1_SIX_LONGFORM_STORIES_20261028.md', import.meta.url), 'utf8');
const expected = ['anderstorp (1976)', 'anderstorp (1978)', 'aintree (1957)', 'ain-diab (1958)', 'caesars-palace (1982)', 'dallas (1984)'];

test('six independent history chapters are bilingual and source linked', () => {
  const chapters = manuscript.split(/^## \d+\. /m).slice(1);
  assert.equal(chapters.length, 6);
  for (const [i, chapter] of chapters.entries()) {
    assert.ok(chapter.startsWith(expected[i]));
    assert.match(chapter, /^### EN — /m);
    assert.match(chapter, /^### UK — /m);
    assert.match(chapter, /https:\/\/www\.formula1\.com\//);
    assert.match(chapter, /independent fact-check and bilingual line edit pending/);
    assert.ok(chapter.length > 1200, 'each bilingual chapter must contain substantive prose');
  }
});
