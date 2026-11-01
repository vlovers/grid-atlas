import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const data=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_VIVID_READER_STORIES_20261029.json',import.meta.url),'utf8'));
test('twenty bilingual readable circuit stories retain blocked publication',()=>{
 assert.equal(data.entries.length,20);
 assert.equal(data.human_approval,false);
 assert.equal(data.publication_allowed,false);
 for(const id of ['east-london','monaco','mosport','montjuic']){
  const list=data.entries.filter(x=>x.circuit_id===id);
  assert.deepEqual(list.map(x=>x.story_index),[1,2,3,4,5]);
 }
 for(const item of data.entries){
  assert.equal(item.human_approval,false);
  assert.equal(item.publication_allowed,false);
  assert.match(item.sources[0],/^https:\/\/www\.formula1\.com\/en\/results\//);
  for(const lang of ['en','uk'])assert.ok(item.narrative[lang].length>350,item.circuit_id+':'+item.story_index+':'+lang);
 }
});