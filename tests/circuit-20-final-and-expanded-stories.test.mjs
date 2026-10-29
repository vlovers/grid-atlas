import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_FINAL_AND_EXPANDED_READER_STORIES_20261029.json',import.meta.url),'utf8'));
test('final circuit 5 and expanded 15 are bilingual, source-linked and not published',()=>{
 assert.equal(d.entries.length,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.independent_approval,false);
 for(const id of ['ain-diab','dallas','jarama','monaco']){
  const rows=d.entries.filter(x=>x.circuit_id===id);
  assert.deepEqual(rows.map(x=>x.story_index),[1,2,3,4,5]);
  assert.ok(rows.every(x=>x.revision_kind===(id==='ain-diab'?'first_reader_rewrite':'expanded_reader_rewrite')));
 }
 for(const x of d.entries){
  assert.equal(x.publication_allowed,false);
  assert.equal(x.independent_approval,false);
  assert.equal(x.status,'editorial_unapproved');
  assert.ok(x.source_urls.length);
  for(const lang of ['en','uk']){
   assert.ok(x.title[lang].length>9);
   assert.ok(x.narrative[lang].length>330,x.circuit_id+':'+x.story_index+':'+lang);
  }
 }
});