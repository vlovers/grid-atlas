import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const corners = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));
const narratives = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-narratives-v3.json', import.meta.url), 'utf8'));
const layouts = JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json', import.meta.url), 'utf8'));
const expected = [['avus','avus-1',1959,4],['zeltweg','zeltweg-1',1964,4],['reims','reims-2',1966,7],['rouen','rouen-2',1968,12]];

test('27 bilingual historic turn entries use period-specific layouts and never claim certified numbering', () => {
  assert.equal(expected.reduce((n,x) => n+x[3],0),27);
  for (const [id,layout,year,count] of expected) {
    const guide=corners.guides.find(g=>g.circuit_id===id);
    assert.ok(guide,id);
    assert.equal(guide.layout_id,layout);
    assert.ok(layouts.some(l=>l.layout_id===layout),layout);
    assert.equal(guide.numbering_year,year);
    assert.equal(guide.numbered_turns,count);
    assert.equal(guide.sections.length,count);
    assert.match(guide.numbering_basis,/provisional|not.*verified|unverified/i);
    assert.equal(guide.review_status,'independent_review_pending');
    assert.ok(!guide.diagram,id);
    assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:count},(_,i)=>i+1));
    const en=new Set(),uk=new Set();
    for(const s of guide.sections){
      assert.equal(s.name,null,s.id);
      assert.equal(s.aliases.length,1,s.id);
      assert.equal(s.confirmation_status,'historical_numbering_unverified',s.id);
      assert.ok(s.explanation.en.trim().split(/\s+/).length>=20,s.id+':en');
      assert.ok(s.explanation.uk.trim().split(/\s+/).length>=16,s.id+':uk');
      assert.match(s.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/,s.id);
      assert.equal(s.sources.length,3,s.id);
      for(const key of s.sources) assert.match(corners.sources[key],/^https:\/\//,s.id+':'+key);
      en.add(s.explanation.en);uk.add(s.explanation.uk);
    }
    assert.equal(en.size,count,id+': distinct EN descriptions');
    assert.equal(uk.size,count,id+': distinct UK descriptions');
  }
});

test('four bilingual biographies and eight separate historical episodes remain candidate-only',()=>{
  for(const [id] of expected){
    const entry=narratives.entries.find(n=>n.circuit_id===id);
    assert.ok(entry,id);
    assert.ok(entry.biography.text.en.length>120 && entry.biography.text.uk.length>100,id);
    assert.match(entry.biography.source,/^https:\/\//);
    assert.equal(entry.moments.length,2);
    for(const m of entry.moments){
      assert.equal(m.review_status,'independent_review_pending');
      assert.match(m.source,/^https:\/\//);
      assert.ok(m.title.en && m.title.uk && m.text.en && m.text.uk);
    }
  }
});

test('historically unverified corner numbering cannot pass the publication gate',async()=>{
  const {hasPublicationReadyCornerGuide,isCircuitEditionApproved}=await import('../apps/web/src/components/editorial/circuit-release.ts');
  for(const [id] of expected){
    assert.equal(hasPublicationReadyCornerGuide(id),false,id);
    assert.equal(isCircuitEditionApproved(id),false,id);
  }
});
