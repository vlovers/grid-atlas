import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const doc=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_REWRITTEN_RACE_STORIES_20261029.json',import.meta.url),'utf8'));
test('20 coherent bilingual reader rewrites remain unapproved and source-linked',()=>{
 assert.equal(doc.kind,'bilingual_reader_copy_rewrite');
 assert.equal(doc.entries.length,20);
 assert.equal(doc.independent_approval,false);
 assert.equal(doc.publication_allowed,false);
 for(const id of ['dijon','jarama','jerez','sebring']){
   const rows=doc.entries.filter(x=>x.circuit_id===id);
   assert.deepEqual(rows.map(x=>x.story_index),[1,2,3,4,5]);
 }
 for(const row of doc.entries){
  assert.equal(row.independent_approval,false);
  assert.equal(row.publication_allowed,false);
  assert.equal(row.status,'proposed_rewrite_unapproved');
  assert.equal(row.source_urls.length,1);
  assert.match(row.source_urls[0],/^https:\/\/www\.formula1\.com\/en\/results\//);
  for(const locale of ['en','uk']){
   assert.ok(row.title[locale].length>8);
   assert.ok(row.narrative[locale].length>125,row.circuit_id+':'+row.story_index+':'+locale);
  }
 }
});