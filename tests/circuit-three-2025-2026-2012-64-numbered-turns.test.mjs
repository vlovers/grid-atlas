import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = read('../apps/web/src/components/editorial/circuit-corners-v3.json');
const layouts = new Set(read('../apps/web/src/components/circuit-layout-manifest.json').map(x => x.layout_id));
const expected = new Map([
  ['las-vegas', {layout:'las-vegas-1', year:2025, count:17}],
  ['madring', {layout:'madring-1', year:2026, count:22}],
  ['valencia', {layout:'valencia-1', year:2012, count:25}],
]);
const namedMadrid = new Map([[3,'Curva de Hortaleza'],[8,'El Búnker'],[12,'La Monumental'],[18,'Curva Norte'],[22,'El Parque']]);

test('three new era-bound guides add 64 individually authored EN/UK turns', () => {
  assert.equal([...expected.values()].reduce((n,x)=>n+x.count,0),64);
  assert.equal(new Set(data.guides.map(g=>g.circuit_id)).size,data.guides.length);
  assert.ok(data.guides.length>=34);
  assert.ok(data.guides.reduce((n,g)=>n+g.numbered_turns,0)>=568);
  for(const [id,meta] of expected){
    const guide=data.guides.find(g=>g.circuit_id===id);
    assert.ok(guide,id);
    assert.equal(guide.layout_id,meta.layout);
    assert.ok(layouts.has(guide.layout_id),id+':missing layout');
    assert.equal(guide.numbering_year,meta.year);
    assert.equal(guide.names_as_of,meta.year);
    assert.equal(guide.numbered_turns,meta.count);
    assert.equal(guide.sections.length,meta.count);
    assert.equal(guide.review_status,'independent_review_pending');
    assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:meta.count},(_,i)=>i+1));
    assert.ok(!guide.diagram,id+':unverified pixel coordinates');
    const en=new Set(),uk=new Set();
    for(const section of guide.sections){
      assert.deepEqual(section.numbers,[Number(section.id.split('-t').at(-1))]);
      assert.equal(section.confirmation_status,'source_checked_ai');
      assert.ok(section.explanation.en.trim().split(/\s+/).length>=15,section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length>=15,section.id+':uk');
      assert.match(section.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/,section.id);
      assert.doesNotMatch(section.explanation.en,/[А-Яа-яІіЇїЄєҐґ]/,section.id);
      assert.ok(section.sources.length>=3,section.id);
      for(const key of section.sources) assert.match(data.sources[key],/^https:\/\//,section.id+':'+key);
      en.add(section.explanation.en);uk.add(section.explanation.uk);
      if(id==='madring') assert.equal(section.name,namedMadrid.get(section.numbers[0])??null);
      else assert.equal(section.name,null,section.id+':do not invent names');
      assert.deepEqual(section.aliases,[]);
    }
    assert.equal(en.size,meta.count,id+':reused EN prose');
    assert.equal(uk.size,meta.count,id+':reused UK prose');
  }
});

test('historic layouts, named corners and media rights are kept separate',()=>{
  assert.equal(data.guides.find(g=>g.circuit_id==='las-vegas').layout_id,'las-vegas-1');
  assert.notEqual(data.guides.find(g=>g.circuit_id==='las-vegas').circuit_id,'caesars-palace');
  assert.equal(data.guides.find(g=>g.circuit_id==='valencia').numbering_year,2012);
  assert.equal(data.guides.find(g=>g.circuit_id==='madring').numbered_turns,22);
  assert.equal(data.guides.find(g=>g.circuit_id==='madring').sections[11].name,'La Monumental');
  assert.ok(data.sources['las-vegas-map'].startsWith('https://www.fia.com/'));
  assert.ok(data.sources['madring-map'].startsWith('https://www.fia.com/'));
  assert.ok(![...expected.keys()].some(id=>data.guides.find(g=>g.circuit_id===id).diagram));
});
