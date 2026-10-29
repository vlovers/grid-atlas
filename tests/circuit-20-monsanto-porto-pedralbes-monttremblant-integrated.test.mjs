import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_MONSANTO_PORTO_PEDRALBES_MONT_TREMBLANT_INTEGRATED_20261029.json',import.meta.url),'utf8'));
test('twenty sourced bilingual scenes integrate into four unpublished circuits',()=>{
 assert.equal(d.chapters.length,4);
 assert.equal(d.human_approval,false);
 assert.equal(d.publication_allowed,false);
 assert.deepEqual(d.chapters.map(x=>x.circuit_id),['monsanto','porto','pedralbes','mont-tremblant']);
 for(const c of d.chapters){
  assert.deepEqual(c.integrated_scene_indices,[1,2,3,4,5]);
  assert.equal(c.human_approval,false);
  assert.equal(c.publication_allowed,false);
  assert.equal(c.verification_status,'partial_fact_verification');
  assert.ok(c.source_urls.length>=1);
  for(const l of ['en','uk']){
   assert.ok(c.article[l].split('\n\n').length>=7);
   assert.ok(c.article[l].length>650);
  }
 }
});