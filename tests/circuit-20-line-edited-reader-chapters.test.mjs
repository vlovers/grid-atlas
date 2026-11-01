import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_LINE_EDITED_READER_CHAPTERS_20261029.json',import.meta.url),'utf8'));
test('20 bilingual line-edited circuit chapters remain unpublished review drafts',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(x=>x.circuit_id)).size,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const c of d.chapters){
  assert.equal(c.publication_allowed,false);
  assert.equal(c.human_approval,false);
  assert.equal(c.review_status,'needs_independent_fact_check');
  assert.ok(c.source_documents.length>0);
  assert.ok(c.source_urls.length>0);
  for(const loc of ['en','uk']){
   assert.ok(c.narrative[loc].length>650,c.circuit_id+':'+loc);
   assert.ok(!/[,:;]\s*(\n\n|$)/.test(c.narrative[loc]),c.circuit_id+':'+loc);
  }
 }
});