import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_AUTHORED_READER_BODIES_20261029.json',import.meta.url),'utf8'));
test('twenty original bilingual circuit bodies remain unapproved and sourced',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(x=>x.circuit_id)).size,20);
 assert.equal(d.human_approval,false);
 assert.equal(d.publication_allowed,false);
 for(const c of d.chapters){
  assert.equal(c.stage,'bilingual_reader_manuscript_pending_fact_review');
  assert.equal(c.human_approval,false);
  assert.equal(c.publication_allowed,false);
  assert.ok(c.source_urls.length>0);
  assert.ok(c.source_documents.length>0);
  for(const l of ['en','uk']){
   assert.ok(c.opening[l].length>350,c.circuit_id+':opening:'+l);
   assert.ok(c.body[l].length>350,c.circuit_id+':body:'+l);
   assert.ok(c.title[l].length>9);
  }
 }
});