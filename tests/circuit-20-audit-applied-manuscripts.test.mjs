import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_AUDIT_APPLIED_MANUSCRIPTS_20261029.json',import.meta.url),'utf8'));
test('audit-informed chapters do not claim unverified stories are ready',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(x=>x.circuit_id)).size,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 assert.deepEqual(d.chapters.filter(x=>x.revision_outcome==='independently_sourced_scene_rewrite').map(x=>x.circuit_id),['dijon','jarama','jerez']);
 for(const x of d.chapters){
  assert.equal(x.publication_allowed,false);
  assert.equal(x.human_approval,false);
  assert.ok(x.source_urls.length);
  for(const l of ['en','uk']){
   assert.equal(x.article[l].split('\n\n').length,3);
   assert.ok(x.article[l].length>650);
   assert.ok(x.revision_action[l].length>40);
  }
  if(x.revision_outcome==='retained_until_source_verification'){
    assert.equal(x.verification_status,'verification_required');
    assert.equal(x.additional_verified_source,null);
  }else{
    assert.equal(x.verification_status,'partial_fact_verification');
    assert.match(x.additional_verified_source,/^https:\/\/www\.formula1\.com\//);
  }
 }
});