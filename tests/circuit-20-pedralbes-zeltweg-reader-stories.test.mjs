import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const data=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_READER_STORIES_PEDRALBES_ZELTWEG_20261029.json',import.meta.url),'utf8'));
test('20 source-located bilingual circuit prose entries cannot be published without review',()=>{
 assert.equal(data.entries.length,20);
 assert.equal(data.independent_approval,false);
 assert.equal(data.publication_allowed,false);
 for(const id of ['pedralbes','pescara','rouen','zeltweg']){
  assert.deepEqual(data.entries.filter(e=>e.circuit_id===id).map(e=>e.story_index),[1,2,3,4,5]);
 }
 for(const e of data.entries){
  assert.equal(e.independent_approval,false);
  assert.equal(e.publication_allowed,false);
  assert.equal(e.source_urls.length,1);
  assert.match(e.source_urls[0],/^https:\/\/www\.formula1\.com\/en\/results\//);
  for(const lang of ['en','uk']){
   assert.ok(e.title[lang].length>8);
   assert.ok(e.narrative[lang].length>260,e.circuit_id+':'+e.story_index+':'+lang);
  }
 }
});