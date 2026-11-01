import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const d=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_JOINED_READER_CHAPTERS_20261029.json',import.meta.url),'utf8'));
test('twenty bilingual composite chapters have provenance and remain unapproved',()=>{
 assert.equal(d.chapters.length,20);
 assert.equal(new Set(d.chapters.map(x=>x.circuit_id)).size,20);
 assert.equal(d.human_approval,false);
 assert.equal(d.publication_allowed,false);
 for(const x of d.chapters){
  assert.deepEqual(x.source_story_indices,[1,2,5]);
  assert.equal(x.human_approval,false);
  assert.equal(x.publication_allowed,false);
  assert.ok(x.source_documents.length>=1);
  assert.ok(x.source_urls.length>=1);
  for(const lang of ['en','uk']){
   assert.ok(x.title[lang].length>12);
   assert.ok(x.narrative[lang].length>850,x.circuit_id+':'+lang);
   assert.equal(x.narrative[lang].split('\n\n').length,5);
  }
 }
});