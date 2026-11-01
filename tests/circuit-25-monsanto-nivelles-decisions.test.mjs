import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const md=readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_FIVE_MONSANTO_NIVELLES_DECISIONS_20261029.md',import.meta.url),'utf8');
const ids=['monsanto','mont-tremblant','montjuic','mosport','nivelles'];
test('25 explicit circuit decisions stay unpublished and require evidence',()=>{
 const matches=[...md.matchAll(/^### ([a-z-]+):([1-5]) — /gm)];
 assert.equal(matches.length,25);
 for(const id of ids) assert.deepEqual(matches.filter(m=>m[1]===id).map(m=>Number(m[2])),[1,2,3,4,5]);
 for(const section of md.split(/^### [a-z-]+:[1-5] — .+$/m).slice(1)){
  assert.match(section,/\*\*Disposition:\*\* `[A-Z_]+`/);
  assert.match(section,/Specific next verification:/);
  assert.match(section,/Editorial guardrail:/);
  assert.match(section,/EN\/UK equivalence:/);
  assert.match(section,/Historical approval:\*\* false; \*\*publication:\*\* blocked/);
 }
 assert.match(md,/independent_approval=false/);
 assert.match(md,/publication_allowed=false/);
});