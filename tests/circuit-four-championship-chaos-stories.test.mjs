import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const text=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_CHAMPIONSHIP_AND_CHAOS_STORIES_20261028.md',import.meta.url),'utf8');
test('four bilingual circuit chapters are sourced and unpublished',()=>{
 const ids=[...text.matchAll(/^## ([a-z][a-z0-9-]+) \(\d{4}\)$/gm)].map(x=>x[1]);
 assert.deepEqual(ids,['buddh','mugello','caesars-palace','clermont-ferrand']);
 for(const part of text.split(/^## [a-z][a-z0-9-]+ \(\d{4}\)$/m).slice(1)){
  assert.match(part,/### EN — /);assert.match(part,/### UK — /);
  assert.match(part,/https:\/\/www\.formula1\.com\//);
  assert.match(part,/Publication allowed:\*\* false/);
 }
});