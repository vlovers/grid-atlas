import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_COMPLETE_THREE_ACT_MANUSCRIPTS_20261029.json',import.meta.url),'utf8'));
test('20 three-act bilingual circuit drafts retain source provenance and closed publication gate',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(c=>c.circuit_id)).size,20);
 assert.equal(d.publication_allowed,false);
 assert.equal(d.human_approval,false);
 for(const c of d.chapters){
  assert.equal(c.publication_allowed,false);
  assert.equal(c.human_approval,false);
  assert.equal(c.review_status,'independent_historical_verification_pending');
  assert.ok(c.source_urls.length);
  assert.ok(c.source_documents.length);
  for(const lang of ['en','uk']){
   assert.equal(c.article[lang].split('\n\n').length,3);
   assert.ok(c.article[lang].length>900,c.circuit_id+':'+lang);
  }
 }
});