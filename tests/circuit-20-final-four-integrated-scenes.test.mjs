import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_LAST_SCENE_ENRICHED_MANUSCRIPTS_20261029.json',import.meta.url),'utf8'));
test('twenty sourced scenes integrate directly into four bilingual unpublished manuscripts',()=>{
 assert.equal(d.entries.length,20);
 assert.equal(d.chapters.length,4);
 assert.deepEqual(d.chapters.map(c=>c.circuit_id),['montjuic','zeltweg','jarama','jerez']);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const c of d.chapters){
   assert.deepEqual(c.integrated_scene_indices,[1,2,3,4,5]);
   assert.equal(c.publication_allowed,false);
   assert.equal(c.human_approval,false);
   assert.ok(c.source_urls.length);
   for(const l of ['en','uk']){
     assert.equal(c.article[l].split('\n\n').length,7);
     assert.ok(c.article[l].length>650);
   }
 }
 for(const e of d.entries){
  assert.equal(e.human_approval,false);
  assert.equal(e.publication_allowed,false);
  for(const l of ['en','uk']) assert.ok(e.narrative[l].length>65);
 }
});