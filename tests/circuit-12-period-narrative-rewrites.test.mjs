import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const root=new URL('../',import.meta.url);
const index=JSON.parse(readFileSync(new URL('docs/editorial/circuit-experience-v3/CANONICAL_TWENTY_READER_CHAPTER_INDEX_20261029.json',root),'utf8'));
const circuits=["sebring","anderstorp","monaco","dallas","east-london","clermont-ferrand","rouen","pescara","montjuic","zeltweg","jarama","jerez"];
test('twelve source-linked EN/UK canonical circuit rewrites remain unpublished and index-synchronized',()=>{
 assert.equal(new Set(circuits).size,12);
 for(const id of circuits){
  const pointer=index.chapters.find(x=>x.circuit_id===id);
  assert.ok(pointer,id);
  const manuscript=JSON.parse(readFileSync(new URL(pointer.canonical_path,root),'utf8'));
  const chapter=manuscript.chapters[pointer.canonical_record_index];
  assert.equal(chapter.circuit_id,id);
  assert.equal(chapter.human_approval,false);
  assert.equal(chapter.publication_allowed,false);
  assert.equal(pointer.human_approval,false);
  assert.equal(pointer.publication_allowed,false);
  assert.deepEqual(pointer.source_urls,chapter.source_urls);
  assert.ok(chapter.source_urls.some(url=>url.includes('motorsportmagazine.com')||url.includes('crash.net')),id);
  for(const loc of ['en','uk']){
   const paragraphs=chapter.article[loc].split('\n\n');
   assert.equal(paragraphs.length,8,id+' '+loc);
   assert.ok(paragraphs[1].length>180,id+' '+loc+' historical context');
   assert.ok(paragraphs[6].length>180,id+' '+loc+' narrative detail');
   assert.equal(pointer.word_count_approx[loc],chapter.article[loc].trim().split(/\s+/).length);
  }
 }
});
