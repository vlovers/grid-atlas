import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const payload=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_HUMAN_VOICE_MONTSANTO_PORTO_20261029.json',import.meta.url),'utf8'));
test('20 paired F1 circuit narratives preserve editorial gate and full indexed coverage',()=>{
 assert.equal(payload.entries.length,20);
 assert.equal(payload.publication_allowed,false);
 assert.equal(payload.independent_approval,false);
 for(const id of ['monsanto','mont-tremblant','nivelles','porto']){
  assert.deepEqual(payload.entries.filter(x=>x.circuit_id===id).map(x=>x.story_index),[1,2,3,4,5]);
 }
 for(const e of payload.entries){
  assert.equal(e.publication_allowed,false);
  assert.equal(e.independent_approval,false);
  assert.match(e.source_urls[0],/^https:\/\/www\.formula1\.com\/en\/results\//);
  for(const lang of ['en','uk']){
   assert.ok(e.title[lang].length>9);
   assert.ok(e.narrative[lang].length>260,e.circuit_id+':'+e.story_index+':'+lang);
  }
 }
});