import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const root = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const files = [
  'EXPANSION_1_SIX_LONGFORM_STORIES_20261028.md',
  'EXPANSION_2_FIVE_LONGFORM_STORIES_20261028.md',
  'EXPANSION_TEN_BILINGUAL_CHAPTERS_20261028.md',
  'EXPANSION_FINAL_THIRTEEN_CHAPTERS_20261028.md',
];
const coverage = JSON.parse(readFileSync(new URL('F1DB_78_CONTENT_COVERAGE_20261027.json', root), 'utf8'));
const expected = coverage.circuits.filter(x => !x.five_story_research_batch).map(x => x.circuit_id).sort();
const texts = files.map(name => readFileSync(new URL(name, root), 'utf8'));
const chapters = texts.flatMap(body => body.split(/^## \d+\. /m).slice(1));

test('all 33 expansion-queue circuits have a substantive UK/EN first-pass chapter', () => {
  const actual = chapters.map(x => x.match(/^([a-z][a-z0-9-]+) \(/)?.[1]);
  assert.equal(chapters.length, 34, 'Anderstorp has two separate races');
  assert.deepEqual([...new Set(actual)].sort(), expected);
  for (const chapter of chapters) {
    assert.match(chapter, /^### EN — /m);
    assert.match(chapter, /^### UK — /m);
    assert.ok(chapter.length >= 600 || /source gap/.test(chapter), 'drafts must not be one-line placeholders');
    assert.match(chapter, /\*\*Gate:|\*\*Review gate:|\*\*Editorial decision:/);
  }
});

test('Monaco and Spa remain explicitly unapproved source gaps', () => {
  for (const id of ['monaco','spa-francorchamps']) {
    const ch = chapters.find(x => x.startsWith(id + ' ('));
    assert.ok(ch);
    assert.match(ch, /source gap/);
    assert.match(ch, /not suitable for publication/);
  }
});
