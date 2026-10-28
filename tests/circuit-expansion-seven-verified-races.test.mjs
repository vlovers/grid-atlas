import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const body = readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_SEVEN_VERIFIED_RACE_STORIES_20261028.md', import.meta.url), 'utf8');
const expected = ['anderstorp','bremgarten','clermont-ferrand','montjuic','mosport','reims','zolder'];
test('seven sourced historical events have complete bilingual prose and protected review status', () => {
 const chapters = body.split(/^## \d+\. /m).slice(1);
 assert.equal(chapters.length, expected.length);
 chapters.forEach((chapter, i) => {
  assert.ok(chapter.startsWith(expected[i]+' ('));
  assert.match(chapter,/^### EN — /m);
  assert.match(chapter,/^### UK — /m);
  assert.match(chapter,/\*\*Official race-result source:\*\* https:\/\/www\.formula1\.com\/en\/results\//);
  assert.match(chapter,/No public publication or historic layout approval/);
  assert.ok(chapter.length >= 800);
 });
});
