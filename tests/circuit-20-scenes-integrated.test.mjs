import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/FOUR_INTEGRATED_TWENTY_SCENE_MANUSCRIPTS_20261029.json',import.meta.url),'utf8'));
test('20 sourced scenes are integrated into 4 bilingual circuit manuscripts',()=>{
 assert.equal(d.chapters.length,4);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 assert.deepEqual(d.chapters.map(x=>x.circuit_id),['sebring','anderstorp','monaco','dallas']);
 for(const c of d.chapters){
  assert.deepEqual(c.integrated_scene_indices,[1,2,3,4,5]);
  assert.equal(c.publication_allowed,false);
  assert.equal(c.human_approval,false);
  assert.equal(c.verification_status,'partial_fact_verification');
  assert.ok(c.source_urls.some(u=>u.includes('/latest/article/')));
  for(const locale of ['en','uk']){
   assert.equal(c.article[locale].split('\n\n').length,7);
   assert.ok(c.article[locale].length>700);
  }
 }
});