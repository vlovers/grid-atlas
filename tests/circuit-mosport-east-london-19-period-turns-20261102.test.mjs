import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const corners=JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json',import.meta.url),'utf8'));
const narratives=JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-narratives-v3.json',import.meta.url),'utf8'));
const layouts=JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json',import.meta.url),'utf8'));
const expected=[['mosport','mosport-1',1977,10],['east-london','east-london-1',1965,9]];
test('Mosport and East London have 19 distinct bilingual candidate turns with period layout IDs',()=>{
  assert.equal(expected.reduce((n,row)=>n+row[3],0),19);
  for(const [id,layout,year,count] of expected){
    const g=corners.guides.find(g=>g.circuit_id===id);assert.ok(g,id);
    assert.equal(g.layout_id,layout);assert.ok(layouts.some(x=>x.layout_id===layout));
    assert.equal(g.numbering_year,year);assert.equal(g.numbered_turns,count);assert.equal(g.sections.length,count);
    assert.equal(g.review_status,'independent_review_pending');assert.match(g.numbering_basis,/not.*certif|not.*verified|provisional|cannot independently/i);
    assert.deepEqual(g.sections.flatMap(s=>s.numbers),Array.from({length:count},(_,i)=>i+1));
    assert.ok(!g.diagram);
    const en=new Set(),uk=new Set();
    for(const s of g.sections){assert.equal(s.name,null);assert.equal(s.confirmation_status,'historical_numbering_unverified');
      assert.equal(s.aliases.length,1);assert.ok(s.explanation.en.trim().split(/\s+/).length>=20);
      assert.ok(s.explanation.uk.trim().split(/\s+/).length>=16);assert.match(s.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(s.sources.length>=3);for(const key of s.sources)assert.match(corners.sources[key],/^https:\/\//);
      en.add(s.explanation.en);uk.add(s.explanation.uk);
    }assert.equal(en.size,count);assert.equal(uk.size,count);
  }
});
test('four source-linked race and venue moments remain research-only',()=>{
  for(const [id] of expected){const n=narratives.entries.find(x=>x.circuit_id===id);assert.ok(n,id);
    assert.ok(n.biography.text.en.length>120&&n.biography.text.uk.length>100);
    assert.equal(n.moments.length,2);
    for(const m of n.moments){assert.equal(m.review_status,'independent_review_pending');assert.match(m.source,/^https:\/\//);assert.ok(m.text.en&&m.text.uk)}
  }
});
test('unverified period corner numbers cannot pass publication',async()=>{
  const {hasPublicationReadyCornerGuide,isCircuitEditionApproved}=await import('../apps/web/src/components/editorial/circuit-release.ts');
  for(const [id] of expected){assert.equal(hasPublicationReadyCornerGuide(id),false);assert.equal(isCircuitEditionApproved(id),false)}
});
