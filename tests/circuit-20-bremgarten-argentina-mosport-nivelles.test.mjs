import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_BREMGARTEN_ARGENTINA_MOSPORT_NIVELLES_SCENES_20261029.json',import.meta.url),'utf8'));
test('twenty source-linked bilingual scenes stay behind editorial release gate',()=>{
 assert.equal(d.entries.length,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const id of ['bremgarten','buenos-aires','mosport','nivelles']) assert.deepEqual(d.entries.filter(x=>x.circuit_id===id).map(x=>x.scene_index),[1,2,3,4,5]);
 for(const s of d.entries){
  assert.equal(s.publication_allowed,false);
  assert.equal(s.human_approval,false);
  assert.equal(s.verification_status,'source_checked_claims_pending_independent_editorial_review');
  assert.ok(s.source_urls.length>0);
  assert.ok(s.source_urls.every(u=>u.startsWith('https://www.formula1.com/')));
  for(const loc of ['en','uk']){
   assert.ok(s.title[loc].length>8);
   assert.ok(s.narrative[loc].length>65,s.circuit_id+':'+s.scene_index+':'+loc);
  }
 }
});