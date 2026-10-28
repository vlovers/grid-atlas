import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const text=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_HISTORIC_TURNING_POINTS_20261028.md',import.meta.url),'utf8');
test('four historic chapters retain bilingual copy, evidence and explicit publication block',()=>{
 const ids=[...text.matchAll(/^## ([a-z][a-z0-9-]+) \(\d{4}\)$/gm)].map(m=>m[1]);
 assert.deepEqual(ids,['mosport','pedralbes','jacarepagua','east-london']);
 for(const part of text.split(/^## [a-z][a-z0-9-]+ \(\d{4}\)$/m).slice(1)){
  assert.match(part,/### EN — /);assert.match(part,/### UK — /);
  assert.match(part,/https:\/\//);assert.match(part,/Publication allowed:\*\* false/);
 }
});