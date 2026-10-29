import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const body=readFileSync(new URL('../docs/editorial/circuit-experience-v3/THREE_SINGLE_RACE_CIRCUITS_CORROBORATION_20261029.md',import.meta.url),'utf8');
test('three event-limited circuit studies retain two languages, independent context and closed publication',()=>{
 for (const id of ['Ain-Diab','AVUS','Bugatti']) {
  const block=body.split(/^## /m).find(x=>x.startsWith(id+' —'));
  assert.ok(block,id);
  assert.match(block,/### EN · /);
  assert.match(block,/### UK · /);
  assert.match(block,/https:\/\/www\.formula1\.com\//);
  assert.match(block,/Claim boundaries:/);
 }
 assert.match(body,/\*\*Publication allowed: false\.\*\*/);
 assert.match(body,/Do not alter \`circuit-release\.json\`/);
 assert.match(body,/motorsportmagazine\.com/);
});