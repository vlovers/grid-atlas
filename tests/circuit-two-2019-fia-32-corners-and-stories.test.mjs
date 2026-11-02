import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const load = p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const data=load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const narratives=load('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const manifest=load('../apps/web/src/components/circuit-layout-manifest.json');
const release=load('../apps/web/src/components/editorial/circuit-release.json');
const specs=new Map([['hockenheimring',{layout:'hockenheimring-4',year:2019,count:17}],['paul-ricard',{layout:'paul-ricard-3',year:2019,count:15}]]);

test('two 2019 FIA layouts add 32 complete individually numbered EN/UK corners',()=>{
  assert.ok(data.guides.length>=27);
  assert.ok(data.guides.reduce((n,g)=>n+g.numbered_turns,0)>=437);
  for(const [id,spec] of specs){
    const guide=data.guides.find(g=>g.circuit_id===id);
    assert.ok(guide,id);
    assert.equal(guide.layout_id,spec.layout);
    assert.ok(manifest.some(x=>x.layout_id===spec.layout),id);
    assert.equal(guide.numbering_year,spec.year);
    assert.equal(guide.numbered_turns,spec.count);
    assert.equal(guide.sections.length,spec.count);
    assert.deepEqual(guide.sections.flatMap(x=>x.numbers),Array.from({length:spec.count},(_,i)=>i+1));
    assert.equal(guide.review_status,'independent_review_pending');
    assert.match(data.sources[id+'-map'],/^https:\/\/www\.fia\.com\//);
    assert.ok(!guide.diagram);
    assert.ok(!release.editions.some(x=>x.circuit_id===id));
    for(const section of guide.sections){
      assert.equal(section.confirmation_status,'source_checked_ai');
      assert.deepEqual(section.sources,[id+'-map',id+'-names',id+'-race']);
      assert.ok(section.explanation.en.trim().split(/\s+/).length>=19,section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length>=15,section.id+':uk');
      assert.match(section.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/);
    }
    assert.equal(new Set(guide.sections.map(x=>x.explanation.en)).size,spec.count);
    assert.equal(new Set(guide.sections.map(x=>x.explanation.uk)).size,spec.count);
  }
  const h=data.guides.find(x=>x.circuit_id==='hockenheimring');
  assert.equal(h.sections[5].name,'Spitzkehre');
  assert.equal(h.sections[12].name,'Sachskurve');
  const p=data.guides.find(x=>x.circuit_id==='paul-ricard');
  assert.equal(p.sections[9].name,'Signes');
  assert.equal(p.sections[10].name,'Beausset');
  assert.match(p.sections[13].explanation.en,/2019/);
});

test('two additional venues have four researched race moments, with no automatic approval',()=>{
  for(const id of specs.keys()){
    const entry=narratives.entries.find(x=>x.circuit_id===id);
    assert.ok(entry,id);
    assert.equal(entry.moments.length,2);
    assert.ok(entry.biography.text.en.trim().split(/\s+/).length>=40);
    assert.ok(entry.biography.text.uk.trim().split(/\s+/).length>=35);
    for(const moment of entry.moments){
      assert.equal(moment.year,2019);
      assert.equal(moment.review_status,'independent_review_pending');
      assert.match(moment.source,/^https:\/\/www\.formula1\.com\/en\//);
      assert.ok(moment.text.en.trim().split(/\s+/).length>=40,moment.id+':en');
      assert.ok(moment.text.uk.trim().split(/\s+/).length>=35,moment.id+':uk');
    }
  }
});
