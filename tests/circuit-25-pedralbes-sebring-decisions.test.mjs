import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const md=readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_FIVE_PEDRALBES_SEBRING_DECISIONS_20261029.md',import.meta.url),'utf8');
const ids=['pedralbes','pescara','porto','rouen','sebring'];
test('25 individual editorial records are evidence-scoped and unpublished',()=>{
 const records=[...md.matchAll(/^### ([a-z-]+):([1-5]) — /gm)];
 assert.equal(records.length,25);
 for(const id of ids) assert.deepEqual(records.filter(x=>x[1]===id).map(x=>Number(x[2])),[1,2,3,4,5]);
 const sections=md.split(/^### [a-z-]+:[1-5] — .+$/m).slice(1);
 for(const item of sections){
  assert.match(item,/Editorial disposition:/);
  assert.match(item,/Existing evidence limits:/);
  assert.match(item,/Specific verification needed:/);
  assert.match(item,/Reader-facing guardrail:/);
  assert.match(item,/Independent approval:\*\* false; \*\*publication:\*\* blocked/);
 }
 assert.match(md,/independent_approval=false/);
 assert.match(md,/publication_allowed=false/);
 assert.doesNotMatch(md,/https:\/\/www\.formula1\.com\/en\/results\//);
});