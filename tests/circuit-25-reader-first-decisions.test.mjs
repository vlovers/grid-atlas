import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const text=readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_FIVE_READER_FIRST_DECISIONS_20261029.md',import.meta.url),'utf8');
const ids=['east-london','jacarepagua','jarama','jerez','monaco'];
test('25 UK/EN editorial dispositions remain review-only and each names its own evidence work',()=>{
 const records=[...text.matchAll(/^### ([a-z-]+):([1-5]) — (.+)$/gm)];
 assert.equal(records.length,25);
 for(const id of ids)assert.deepEqual(records.filter(x=>x[1]===id).map(x=>Number(x[2])),[1,2,3,4,5]);
 const parts=text.split(/^### [a-z-]+:[1-5] — .+$/m).slice(1);
 for(const part of parts){
  assert.match(part,/\*\*Disposition:\*\* `(KEEP_CORE|MERGE_CORE|MERGE_RESULT|MERGE_CONTEXT|MERGE_INCIDENT|SUPPORTING_SCENE|CONDITIONAL_HUMAN_ANGLE|CONDITIONAL_TECHNICAL_ANGLE)`/);
  assert.match(part,/Required external corroboration:/);
  assert.match(part,/Editorial guardrail:/);
  assert.match(part,/Historical approval:\*\* false; \*\*publication:\*\* blocked/);
 }
 assert.match(text,/independent_approval=false/);
 assert.match(text,/publication_allowed=false/);
});