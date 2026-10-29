import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_AIDA_AVUS_BUGATTI_ZOLDER_STORIES_20261029.json',import.meta.url),'utf8'));
test('20 paired stories retain review gate and exact story identities',()=>{
 assert.equal(d.entries.length,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.independent_approval,false);
 for(const id of ['aida','avus','bugatti','zolder']){
  assert.deepEqual(d.entries.filter(x=>x.circuit_id===id).map(x=>x.story_index),[1,2,3,4,5]);
 }
 for(const e of d.entries){
  assert.equal(e.publication_allowed,false);
  assert.equal(e.independent_approval,false);
  assert.equal(e.editorial_review,'pending_independent_human');
  assert.match(e.source_urls[0],/^https:\/\/www\.formula1\.com\/en\/results\//);
  for(const lang of ['en','uk']){
   assert.ok(e.title[lang].length>9);
   assert.ok(e.narrative[lang].length>250,e.circuit_id+':'+e.story_index+':'+lang);
  }
 }
 const a=d.entries.filter(x=>x.circuit_id==='aida');
 assert.deepEqual(a.map(x=>x.year),[1994,1994,1994,1995,1995]);
 assert.match(a[3].source_urls[0],/\/1995\/races\//);
});