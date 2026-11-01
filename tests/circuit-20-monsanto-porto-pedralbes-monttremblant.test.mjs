import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_MONSANTO_PORTO_PEDRALBES_MONT_TREMBLANT_20261029.json',import.meta.url),'utf8'));
test('20 paired official-classification scene drafts cannot auto-publish',()=>{
 assert.equal(d.entries.length,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const id of ['monsanto','porto','pedralbes','mont-tremblant']) assert.deepEqual(d.entries.filter(x=>x.circuit_id===id).map(x=>x.scene_index),[1,2,3,4,5]);
 for(const e of d.entries){
  assert.equal(e.publication_allowed,false);
  assert.equal(e.human_approval,false);
  assert.equal(e.verification_status,'race_classification_cross_checked_not_human_approved');
  assert.ok(e.source_urls.every(u=>u.startsWith('https://www.formula1.com/en/results/')));
  for(const lang of ['en','uk']){
   assert.ok(e.title[lang].length>8);
   assert.ok(e.narrative[lang].length>65,e.circuit_id+':'+e.scene_index+':'+lang);
  }
 }
});