import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const body=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_CONTEXTUAL_HISTORY_STORIES_20261028.md',import.meta.url),'utf8');
const ids=['aintree (1957)','ain-diab (1958)','dijon (1979)','dallas (1984)'];
test('four contextual stories include actual narrative evidence in both languages',()=>{
 const chapters=body.split(/^## \d+\. /m).slice(1);
 assert.equal(chapters.length,4);
 chapters.forEach((chapter,i)=>{
  assert.ok(chapter.startsWith(ids[i]));
  assert.match(chapter,/^### EN — /m);
  assert.match(chapter,/^### UK — /m);
  assert.match(chapter,/\*\*Evidence:\*\*/);
  assert.match(chapter,/independent approval, locale line edit and rights review pending/);
  assert.ok(chapter.length>1400);
 });
});
