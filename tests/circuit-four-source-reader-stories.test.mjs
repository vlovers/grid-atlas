import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const path=new URL('../docs/editorial/circuit-experience-v3/FOUR_SOURCE_VERIFIED_READER_STORIES_20261028.md',import.meta.url);
const contents=readFileSync(path,'utf8');
test('four published-source-linked circuit stories remain bilingual unapproved drafts',()=>{
 const expected=['dijon','jerez','anderstorp','portimao'];
 const chapters=[...contents.matchAll(/^## ([a-z][a-z0-9-]+) \(\d{4}\)$/gm)];
 assert.deepEqual(chapters.map(x=>x[1]),expected);
 for(let i=0;i<chapters.length;i++){
  const section=contents.slice(chapters[i].index,i+1<chapters.length?chapters[i+1].index:contents.length);
  assert.match(section,/### EN — /);
  assert.match(section,/### UK — /);
  assert.match(section,/https:\/\/(www\.formula1\.com|api\.fia\.com)\//);
  assert.match(section,/Publication allowed:\*\* false/);
 }
});
