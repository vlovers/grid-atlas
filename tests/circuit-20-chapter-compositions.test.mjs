import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const x=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_CHAPTER_COMPOSITIONS_20261029.json',import.meta.url),'utf8'));
test('20 chapter compositions include 100 bilingual source-located scenes but cannot be published',()=>{
 assert.equal(x.chapters.length,20);
 assert.equal(x.publication_allowed,false);
 assert.equal(x.human_approval,false);
 assert.equal(new Set(x.chapters.map(v=>v.circuit_id)).size,20);
 for(const chapter of x.chapters){
  assert.equal(chapter.chapter_sections.length,5);
  assert.deepEqual(chapter.chapter_sections.map(x=>x.source_story_index),[1,2,3,4,5]);
  assert.equal(chapter.chapter_status,'structured_reading_draft_not_final_prose');
  assert.equal(chapter.publication_allowed,false);
  assert.equal(chapter.human_approval,false);
  assert.ok(chapter.source_documents.length>=1);
  assert.ok(chapter.source_urls.length>=1);
  for(const locale of ['en','uk']){
   assert.ok(chapter.title[locale].length>12);
   assert.ok(chapter.chapter_sections.every(s=>s.prose[locale].length>110));
  }
 }
});