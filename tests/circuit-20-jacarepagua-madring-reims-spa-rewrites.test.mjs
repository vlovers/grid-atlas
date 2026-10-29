import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const doc=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_JACAREPAGUA_MADRID_REIMS_SPA_REWRITES_20261029.json',import.meta.url),'utf8'));
test('twenty paired stories have stable identities, provenance and closed release',()=>{
 assert.equal(doc.entries.length,20);
 assert.equal(doc.independent_approval,false);
 assert.equal(doc.publication_allowed,false);
 for(const id of ['jacarepagua','madring','reims','spa-francorchamps']){
  assert.deepEqual(doc.entries.filter(x=>x.circuit_id===id).map(x=>x.story_index),[1,2,3,4,5]);
 }
 for(const e of doc.entries){
  assert.equal(e.independent_approval,false);
  assert.equal(e.publication_allowed,false);
  assert.ok(e.source_urls.length>0);
  assert.equal(e.status,'editorial_draft_unapproved');
  for(const loc of ['en','uk']){
   assert.ok(e.title[loc].length>8);
   assert.ok(e.narrative[loc].length>270,e.circuit_id+':'+e.story_index+':'+loc);
  }
 }
});