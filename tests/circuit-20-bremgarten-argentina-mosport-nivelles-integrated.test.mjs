import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_BREMGARTEN_ARGENTINA_MOSPORT_NIVELLES_INTEGRATED_20261029.json',import.meta.url),'utf8'));
test('twenty sourced scenes integrated in four bilingual publication-gated chapters',()=>{
 assert.equal(d.chapters.length,4);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 assert.deepEqual(d.chapters.map(x=>x.circuit_id),['bremgarten','buenos-aires','mosport','nivelles']);
 for(const c of d.chapters){
  assert.deepEqual(c.integrated_scene_indices,[1,2,3,4,5]);
  assert.equal(c.publication_allowed,false);
  assert.equal(c.human_approval,false);
  assert.equal(c.verification_status,'partial_fact_verification');
  assert.ok(c.source_urls.length>0);
  for(const l of ['en','uk']){
   assert.ok(c.article[l].split('\n\n').length>=7);
   assert.ok(c.article[l].length>650);
  }
 }
});