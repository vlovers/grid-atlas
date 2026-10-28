import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const text = readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_2_FIVE_LONGFORM_STORIES_20261028.md', import.meta.url), 'utf8');
const expected = ['dijon (1979)', 'jarama (1981)', 'jerez (1997)', 'east-london (1962)', 'pedralbes (1951)'];
test('second longform batch contains five sourced bilingual chapters with review gates', () => {
  const chapters = text.split(/^## \d+\. /m).slice(1);
  assert.equal(chapters.length, 5);
  chapters.forEach((chapter, i) => {
    assert.ok(chapter.startsWith(expected[i]));
    assert.match(chapter, /^### EN — /m);
    assert.match(chapter, /^### UK — /m);
    assert.match(chapter, /https:\/\/www\.formula1\.com\//);
    assert.match(chapter, /independent historical review and bilingual line edit pending/);
    assert.ok(chapter.length > 900);
  });
});
