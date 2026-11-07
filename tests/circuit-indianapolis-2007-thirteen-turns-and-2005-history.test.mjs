import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const d=read('../apps/web/src/components/editorial/circuit-corners-v3.json');
const n=read('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const m=read('../apps/web/src/components/circuit-layout-manifest.json');

test('Indy 2007 F1 road course has 13 numbered bilingual corners, not the four-turn oval',()=>{
  const g=d.guides.find(x=>x.circuit_id==='indianapolis');
  assert.ok(g);
  assert.equal(g.layout_id,'indianapolis-2');
  assert.ok(m.some(x=>x.layout_id==='indianapolis-1'));
  assert.ok(m.some(x=>x.layout_id==='indianapolis-2'));
  assert.equal(g.numbering_year,2007);
  assert.equal(g.numbered_turns,13);
  assert.deepEqual(g.sections.flatMap(x=>x.numbers),Array.from({length:13},(_,i)=>i+1));
  assert.equal(g.review_status,'independent_review_pending');
  assert.ok(!g.diagram);
  for(const section of g.sections){
    assert.equal(section.name,null);
    assert.ok(section.explanation.en.trim().split(/\s+/).length>=15,section.id+':en');
    assert.ok(section.explanation.uk.trim().split(/\s+/).length>=15,section.id+':uk');
    assert.equal(section.confirmation_status,'source_checked_ai');
    for(const key of section.sources)assert.match(d.sources[key],/^https:\/\//);
  }
});

test('Indy moments distinguish 2005 six starters from Hamilton 2007 final F1 race',()=>{
  const e=n.entries.find(x=>x.circuit_id==='indianapolis');
  assert.ok(e);
  assert.deepEqual(e.moments.map(x=>x.year),[2005,2007]);
  assert.match(e.moments[0].text.en,/six Bridgestone/);
  assert.match(e.moments[0].text.en,/Michael Schumacher/);
  assert.match(e.moments[1].text.en,/Lewis Hamilton/);
  assert.match(e.moments[1].text.en,/1\.518 seconds/);
  assert.equal(e.moments.every(x=>x.review_status==='independent_review_pending'),true);
  assert.equal(new Set(e.moments.map(x=>x.id)).size,2);
});
