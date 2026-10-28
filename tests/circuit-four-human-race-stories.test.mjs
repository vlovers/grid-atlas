import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const text=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_HUMAN_RACE_STORIES_20261028.md',import.meta.url),'utf8');
test('four human-focused circuit stories retain UK/EN, sources and blocked publication',()=>{
 const ids=[...text.matchAll(/^## ([a-z][a-z0-9-]+) \(\d{4}\)$/gm)].map(m=>m[1]);
 assert.deepEqual(ids,['detroit','valencia','yeongam','montjuic']);
 const sections=text.split(/^## [a-z][a-z0-9-]+ \(\d{4}\)$/m).slice(1);
 for(const section of sections){
  assert.match(section,/### EN — /);
  assert.match(section,/### UK — /);
  assert.match(section,/https:\/\//);
  assert.match(section,/Publication allowed:\*\* false/);
 }
});