import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_ORIGINAL_READER_OPENINGS_20261029.json',import.meta.url),'utf8'));
test('twenty original bilingual openings have provenance and are not silently published',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(c=>c.circuit_id)).size,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const c of d.chapters){
  assert.equal(c.revision_stage,'original_reader_opening_pending_longform_expansion');
  assert.equal(c.publication_allowed,false);
  assert.equal(c.human_approval,false);
  assert.ok(c.source_urls.length>0);
  assert.ok(c.source_documents.length>0);
  for(const locale of ['en','uk']){
   assert.ok(c.heading[locale].length>9);
   assert.ok(c.opening[locale].length>350,c.circuit_id+':'+locale);
  }
 }
});