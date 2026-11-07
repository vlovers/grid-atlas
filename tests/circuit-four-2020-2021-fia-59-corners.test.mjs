import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');
const release = load('../apps/web/src/components/editorial/circuit-release.json');
const expected = new Map([
  ['mugello', {layout:'mugello-1', year:2020, turns:15}],
  ['portimao', {layout:'portimao-1', year:2020, turns:15}],
  ['istanbul', {layout:'istanbul-1', year:2021, turns:14}],
  ['nurburgring', {layout:'nurburgring-4', year:2020, turns:15}],
]);

test('four historical-era FIA-mapped F1 circuits add 59 individually authored bilingual numbered corners', () => {
  assert.ok(data.guides.length >= 25);
  assert.ok(data.guides.reduce((sum,g) => sum+g.numbered_turns, 0) >= 405);
  assert.equal(new Set(data.guides.map(g=>g.circuit_id)).size, data.guides.length);
  for (const [id, spec] of expected) {
    const guide = data.guides.find(g=>g.circuit_id===id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id,spec.layout);
    assert.ok(manifest.some(x=>x.layout_id===spec.layout),id+':missing F1DB layout');
    assert.ok(existsSync(new URL('../apps/web/public/circuit-layouts/'+spec.layout+'.svg',import.meta.url)),id+':missing SVG');
    assert.equal(guide.numbering_year,spec.year);
    assert.equal(guide.numbered_turns,spec.turns);
    assert.equal(guide.sections.length,spec.turns);
    assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:spec.turns},(_,i)=>i+1));
    assert.equal(guide.review_status,'independent_review_pending');
    assert.match(data.sources[id+'-map'],/^https:\/\/www\.fia\.com\//);
    assert.match(data.sources[id+'-names'],/^https:\/\//);
    assert.match(data.sources[id+'-race'],/^https:\/\//);
    assert.ok(!guide.diagram, id+':no unreviewed corner overlay');
    const en=new Set(),uk=new Set();
    for (const s of guide.sections) {
      assert.equal(s.numbers.length,1,s.id);
      assert.equal(s.confirmation_status,'source_checked_ai',s.id);
      assert.deepEqual(s.sources,[id+'-map',id+'-names',id+'-race'],s.id);
      assert.ok(s.explanation.en.trim().split(/\s+/).length>=18,s.id+':en');
      assert.ok(s.explanation.uk.trim().split(/\s+/).length>=14,s.id+':uk');
      assert.match(s.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/,s.id);
      assert.doesNotMatch(s.explanation.en,/[А-Яа-яІіЇїЄєҐґ]/,s.id);
      en.add(s.explanation.en);uk.add(s.explanation.uk);
    }
    assert.equal(en.size,spec.turns,id+':duplicate English');
    assert.equal(uk.size,spec.turns,id+':duplicate Ukrainian');
    assert.ok(!release.editions.some(e=>e.circuit_id===id),id+':not approved');
  }
});

test('names and historic variants are not silently projected to other circuits',()=>{
  const mugello=data.guides.find(g=>g.circuit_id==='mugello');
  assert.deepEqual(mugello.sections.map(s=>s.name),[
    'San Donato','Luco','Poggio Secco','Materassi','Borgo San Lorenzo',
    'Casanova','Savelli','Arrabbiata 1','Arrabbiata 2','Scarperia','Palagio',
    'Correntaio','Biondetti 1','Biondetti 2','Bucine']);
  const portimao=data.guides.find(g=>g.circuit_id==='portimao');
  assert.ok(portimao.sections.slice(0,14).every(s=>s.name===null));
  assert.equal(portimao.sections[14].name,'Galp');
  const istanbul=data.guides.find(g=>g.circuit_id==='istanbul');
  assert.match(istanbul.sections[7].explanation.en,/one numbered corner/);
  assert.match(istanbul.sections[10].explanation.en,/informally nicknamed/);
  const nurb=data.guides.find(g=>g.circuit_id==='nurburgring');
  assert.equal(nurb.sections[6].name,'Dunlop-Kehre');
  assert.equal(nurb.sections[14].name,'Coca-Cola-Kurve');
  assert.notEqual(nurb.layout_id,'nurburgring-1');
});
