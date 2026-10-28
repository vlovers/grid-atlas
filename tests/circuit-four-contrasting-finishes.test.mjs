import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const text=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_CONTRASTING_FINISHES_20261028.md',import.meta.url),'utf8');
test('four contrasting circuit chapters preserve bilingual prose, source and unpublished status',()=>{
 const ids=[...text.matchAll(/^## ([a-z][a-z0-9-]+)$/gm)].map(m=>m[1]);
 assert.deepEqual(ids,['dallas','sebring','riverside','zeltweg']);
 for(const section of text.split(/^## [a-z][a-z0-9-]+$/m).slice(1)) {
  assert.match(section,/### EN — /);
  assert.match(section,/### UK — /);
  assert.match(section,/https:\/\/www\.formula1\.com\/en\/results\//);
  assert.match(section,/not approved for publication/);
 }
});
