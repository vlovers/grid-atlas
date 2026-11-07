import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const narratives = load('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const corners = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const release = load('../apps/web/src/components/editorial/circuit-release.json');
const ids=['mugello','portimao','istanbul','nurburgring'];

test('four race-era guides have original bilingual biographies and eight individually sourced turning points',()=>{
  for(const id of ids){
    const entry=narratives.entries.find(x=>x.circuit_id===id);
    const guide=corners.guides.find(x=>x.circuit_id===id);
    assert.ok(entry&&guide,id);
    assert.equal(entry.moments.length,2,id);
    for(const locale of ['en','uk']){
      assert.ok(entry.biography.title[locale].trim().length>10,id+':'+locale);
      assert.ok(entry.biography.text[locale].trim().split(/\s+/).length>=40,id+':'+locale);
    }
    assert.match(entry.biography.source,/^https:\/\/www\.formula1\.com\//);
    assert.ok(!release.editions.some(x=>x.circuit_id===id),id+':no publication approval');
    for(const moment of entry.moments){
      assert.equal(moment.year,2020);
      assert.match(moment.source,/^https:\/\/www\.formula1\.com\/en\//);
      assert.equal(moment.review_status,'independent_review_pending');
      assert.ok(moment.text.en.trim().split(/\s+/).length>=40,moment.id+':en');
      assert.ok(moment.text.uk.trim().split(/\s+/).length>=35,moment.id+':uk');
      assert.match(moment.text.uk,/[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(moment.title.en.trim().length>=10);
      assert.ok(moment.title.uk.trim().length>=10);
    }
  }
  assert.equal(new Set(narratives.entries.map(x=>x.circuit_id)).size,narratives.entries.length);
  assert.equal(new Set(narratives.entries.flatMap(x=>x.moments.map(m=>m.id))).size,narratives.entries.reduce((a,e)=>a+e.moments.length,0));
});

test('2020-era stories keep historic layout distinctions and key race facts',()=>{
  assert.match(narratives.entries.find(x=>x.circuit_id==='nurburgring').biography.text.en,/Nordschleife/);
  assert.match(narratives.entries.find(x=>x.circuit_id==='portimao').moments[1].text.en,/92nd/);
  assert.match(narratives.entries.find(x=>x.circuit_id==='istanbul').moments[1].text.en,/seventh world championship/);
  assert.match(narratives.entries.find(x=>x.circuit_id==='mugello').moments[1].text.en,/Arrabbiata 2/);
});
