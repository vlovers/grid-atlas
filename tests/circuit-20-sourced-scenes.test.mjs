import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_SOURCED_SCENES_20261029.json',import.meta.url),'utf8'));
test('twenty bilingual sourced historical scenes remain unpublished drafts',()=>{
 assert.equal(d.entries.length,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const id of ['sebring','anderstorp','monaco','dallas']){
  assert.deepEqual(d.entries.filter(x=>x.circuit_id===id).map(x=>x.scene_index),[1,2,3,4,5]);
 }
 for(const x of d.entries){
  assert.equal(x.publication_allowed,false);
  assert.equal(x.human_approval,false);
  assert.equal(x.verification,'cross_checked_f1_retrospective');
  assert.ok(x.source_urls.every(url=>url.startsWith('https://www.formula1.com/en/latest/article/')));
  for(const lang of ['en','uk']){
   assert.ok(x.title[lang].length>8);
   assert.ok(x.narrative[lang].length>30);
  }
 }
});