import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const data=read('../apps/web/src/components/editorial/circuit-corners-v3.json');
const narratives=read('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const layouts=new Set(read('../apps/web/src/components/circuit-layout-manifest.json').map(x=>x.layout_id));

test('Fuji 2008 guide covers 16 distinct bilingual turns on the correct historical outline',()=>{
  const g=data.guides.find(x=>x.circuit_id==='fuji');
  assert.ok(g);
  assert.equal(g.layout_id,'fuji-2');
  assert.ok(layouts.has(g.layout_id));
  assert.equal(g.numbering_year,2008);
  assert.equal(g.numbered_turns,16);
  assert.equal(g.sections.length,16);
  assert.deepEqual(g.sections.flatMap(x=>x.numbers),Array.from({length:16},(_,i)=>i+1));
  assert.equal(g.review_status,'independent_review_pending');
  assert.ok(!g.diagram);
  const seenEn=new Set(),seenUk=new Set();
  for(const s of g.sections){
    assert.equal(s.name,null);
    assert.deepEqual(s.aliases,[]);
    assert.equal(s.confirmation_status,'source_checked_ai');
    assert.ok(s.explanation.en.trim().split(/\s+/).length>=15,s.id+':en');
    assert.ok(s.explanation.uk.trim().split(/\s+/).length>=15,s.id+':uk');
    assert.ok(s.sources.length>=3);
    for(const key of s.sources) assert.match(data.sources[key],/^https:\/\//);
    seenEn.add(s.explanation.en);seenUk.add(s.explanation.uk);
  }
  assert.equal(seenEn.size,16);
  assert.equal(seenUk.size,16);
});

test('Fuji narrative separates 1976 title from 2008 layout and identifies race winners',()=>{
  const e=narratives.entries.find(x=>x.circuit_id==='fuji');
  assert.ok(e);
  assert.equal(e.moments.length,2);
  assert.deepEqual(e.moments.map(x=>x.year),[1976,2008]);
  assert.match(e.moments[0].text.en,/Mario Andretti/);
  assert.match(e.moments[0].text.en,/James Hunt/);
  assert.match(e.moments[1].text.en,/Fernando Alonso/);
  assert.match(e.moments[1].text.en,/16-turn/);
  assert.equal(e.moments.every(x=>x.review_status==='independent_review_pending'),true);
  assert.equal(new Set(e.moments.map(x=>x.id)).size,2);
  assert.match(e.biography.source,/^https:\/\//);
});
