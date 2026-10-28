import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contents=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_SHORT_CALENDAR_CIRCUITS_20261028.md', import.meta.url),'utf8');
test('four short-calendar circuits have full bilingual source-linked draft chapters',()=>{
 const ids=[...contents.matchAll(/^## ([a-z][a-z0-9-]+) \(\d{4}\)$/gm)].map(m=>m[1]);
 assert.deepEqual(ids,['aintree','mont-tremblant','porto','nivelles']);
 for(const chapter of contents.split(/^## [a-z][a-z0-9-]+ \(\d{4}\)$/m).slice(1)){
   assert.match(chapter,/### EN — /);
   assert.match(chapter,/### UK — /);
   assert.match(chapter,/https:\/\/www\.motorsportmagazine\.com\/database\/races\//);
   assert.match(chapter,/Publication allowed:\*\* false/);
 }
});