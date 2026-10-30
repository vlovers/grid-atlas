import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const root=new URL('../docs/editorial/circuit-experience-v3/',import.meta.url);
const md=readFileSync(new URL('FINAL_40_CIRCUIT_STORY_DISPOSITIONS_20261029.md',root),'utf8');
const stories=JSON.parse(readFileSync(new URL('FINAL_EIGHT_BILINGUAL_READER_STORIES_20261029.json',root),'utf8'));
const ids=['aida','ain-diab','avus','bugatti','madring','spa-francorchamps','zeltweg','zolder'];
test('final forty draft slots all have one explicit keep, merge or conditional disposition',()=>{
 const entries=[...md.matchAll(/^- \*\*([a-z-]+):([1-5]) · (KEEP|MERGE|CONDITIONAL) — /gm)];
 assert.equal(entries.length,40);
 for(const id of ids)assert.deepEqual(entries.filter(x=>x[1]===id).map(x=>Number(x[2])),[1,2,3,4,5]);
 assert.match(md,/publication_allowed=false/);
 assert.match(md,/independent_approval=false/);
});
test('eight complete paired reader narratives stay unpublished and do not create a human approval',()=>{
 assert.equal(stories.publication_allowed,false);
 assert.equal(stories.independent_approval,false);
 assert.deepEqual(stories.entries.map(x=>x.circuit_id),ids);
 for(const entry of stories.entries){
  for(const loc of ['en','uk']) {
   assert.ok(entry.title[loc].length>12);
   assert.ok(entry.narrative[loc].length>400,entry.circuit_id+':'+loc);
  }
  assert.match(entry.verification,/human review pending/);
 }
});