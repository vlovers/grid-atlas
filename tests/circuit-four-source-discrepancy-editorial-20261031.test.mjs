import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const repository=new URL('../',import.meta.url);
const editorial=new URL('docs/editorial/circuit-experience-v3/',repository);
const read=name=>JSON.parse(readFileSync(new URL(name,editorial),'utf8'));
const index=read('CANONICAL_TWENTY_READER_CHAPTER_INDEX_20261029.json');
const canonical=id=>{
  const pointer=index.chapters.find(c=>c.circuit_id===id);
  if(pointer){
    const document=JSON.parse(readFileSync(new URL(pointer.canonical_path,repository),'utf8'));
    return document.chapters[pointer.canonical_record_index];
  }
  return read('SEVEN_REMAINING_CIRCUIT_CHAPTERS_20261029.json').chapters.find(c=>c.circuit_id===id);
};

test('20 canonical pointers use current bilingual counts after editorial changes',()=>{
  assert.equal(index.chapters.length,20);
  for(const c of index.chapters){
    const x=canonical(c.circuit_id);
    assert.equal(x.circuit_id,c.circuit_id);
    assert.deepEqual(c.source_urls,x.source_urls);
    for(const loc of ['en','uk']){
      assert.equal(c.word_count_approx[loc],x.article[loc].trim().split(/\s+/).length);
      assert.equal(c.paragraphs[loc],x.article[loc].split('\n\n').length);
    }
    assert.equal(c.human_approval,false);
    assert.equal(c.publication_allowed,false);
  }
});

test('four disputed circuit chapters remain bilingual and blocked',()=>{
  for(const id of ['buenos-aires','madring','montjuic','aida']){
    const c=canonical(id);
    for(const loc of ['en','uk']){
      assert.equal(c.article[loc].split('\n\n').length,8);
      assert.ok(c.article[loc].length>1100,id+loc);
    }
    assert.equal(c.human_approval,false);
    assert.equal(c.publication_allowed,false);
  }
});

test('Argentina retains two distinct archival classifications, not an invented hybrid',()=>{
  const c=canonical('buenos-aires');
  assert.match(c.article.en,/71 laps/);
  assert.match(c.article.en,/72 laps/);
  assert.match(c.article.en,/7\.136/);
  assert.match(c.article.en,/6\.407/);
  assert.match(c.article.uk,/71 коло/);
  assert.match(c.article.uk,/72 кола/);
});

test('Madring distinguishes race result, VSC cause, and venue criticism',()=>{
  const c=canonical('madring');
  assert.match(c.article.en,/4\.351/);
  assert.match(c.article.en,/0\.738/);
  assert.match(c.article.en,/Virtual Safety Car/);
  assert.match(c.article.uk,/VSC/);
  assert.match(c.article.en,/braking zones/);
  assert.ok(c.source_urls.some(x=>x.includes('theguardian.com')));
});

test('Montjuic preserves early five-death reports and later four-victim correction',()=>{
  const c=canonical('montjuic');
  const s=read('EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json').circuits.find(x=>x.circuit_id==='montjuic').stories[0];
  assert.match(c.article.en,/four people/);
  assert.match(c.article.en,/Carmen Vigliatore/);
  assert.match(s.narrative.en,/five deaths/);
  assert.match(s.narrative.en,/four confirmed/);
  assert.ok(s.historical_sources.some(x=>x.includes('counting-the-cost')));
  assert.equal(s.independent_approval,false);
  assert.equal(s.publication,'blocked');
});

test('Aida does not invent a definitive tyre inventory',()=>{
  const c=canonical('aida');
  assert.match(c.article.en,/Autosport/);
  assert.match(c.article.en,/Grandprix.com/);
  assert.match(c.article.uk,/Autosport/);
  assert.match(c.article.en,/three new sets/);
  assert.match(c.article.en,/four/);
});
