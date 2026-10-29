import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root=new URL('../',import.meta.url);
const registry=JSON.parse(readFileSync(new URL('docs/editorial/circuit-experience-v3/CANONICAL_TWENTY_READER_CHAPTER_INDEX_20261029.json',root),'utf8'));
test('20 unique canonical circuit chapter pointers resolve to current bilingual drafts',()=>{
 assert.equal(registry.total_chapters,20);
 assert.equal(registry.chapters.length,20);
 assert.equal(new Set(registry.chapters.map(x=>x.circuit_id)).size,20);
 assert.equal(registry.publication_allowed,false);
 assert.equal(registry.human_approval,false);
 for(const c of registry.chapters){
  const source=JSON.parse(readFileSync(new URL(c.canonical_path,root),'utf8'));
  const record=source.chapters[c.canonical_record_index];
  assert.equal(record.circuit_id,c.circuit_id);
  assert.equal(record.publication_allowed,false);
  assert.equal(record.human_approval,false);
  assert.deepEqual(c.locales,['en','uk']);
  assert.ok(c.next_review.length>40);
  assert.equal(c.editorial_status,'draft_pending_independent_fact_and_literary_review');
  assert.deepEqual(c.source_urls,record.source_urls);
  for(const loc of ['en','uk']){
   assert.ok(record.article[loc].length>700);
   assert.equal(c.paragraphs[loc],record.article[loc].split('\n\n').length);
   assert.equal(c.word_count_approx[loc],record.article[loc].trim().split(/\s+/).length);
  }
 }
});