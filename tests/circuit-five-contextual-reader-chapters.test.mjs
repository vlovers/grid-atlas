import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const file=readFileSync(new URL('../docs/editorial/circuit-experience-v3/FIVE_CONTEXTUAL_READER_CHAPTERS_20261028.md',import.meta.url),'utf8');
test('five bilingual context chapters are sourced and explicitly unapproved',()=>{
 const sections=file.split(/^## ([a-z][a-z0-9-]+)$/m).slice(1);
 const ids=[];
 for(let i=0;i<sections.length;i+=2){
  ids.push(sections[i]); const body=sections[i+1];
  assert.match(body,/### EN — /);assert.match(body,/### UK — /);
  assert.match(body,/https:\/\//);assert.match(body,/Publication:\*\* blocked/);
 }
 assert.deepEqual(ids,['ain-diab','avus','bugatti','pescara','madring']);
 assert.match(file,/not additional World Championship events/);
});
