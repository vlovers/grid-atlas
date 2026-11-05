import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const layouts = load('../apps/web/src/components/circuit-layout-manifest.json');
const targets = [
  {id:'catalunya', layout:'catalunya-6', count:14},
  {id:'montreal', layout:'montreal-6', count:14},
  {id:'imola', layout:'imola-3', count:19}
];

test('Barcelona, Montreal and Imola contribute 47 complete 2025 numbered EN/UK sections', () => {
  assert.equal(targets.reduce((sum, t) => sum + t.count, 0), 47);
  for (const {id,layout,count} of targets) {
    const guide = data.guides.find(g => g.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id, layout);
    assert.ok(layouts.some(l => l.layout_id === layout));
    assert.equal(guide.numbered_turns, count);
    assert.equal(guide.sections.length, count);
    assert.equal(guide.numbering_year, 2025);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({length:count}, (_,i)=>i+1));
    assert.match(data.sources[id+'-map'], /^https:\/\/www\.fia\.com\//);
    assert.match(data.sources[id+'-names'], /^https:\/\//);
    assert.equal(guide.diagram, undefined);
    for (const section of guide.sections) {
      assert.deepEqual(section.sources, [id+'-map',id+'-names']);
      assert.equal(section.confirmation_status, 'source_checked_ai');
      assert.ok(section.explanation.en.trim().split(/\s+/).length >= 22, section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 18, section.id+':uk');
    }
  }
});

test('historic layouts are not mislabelled as current and shared names remain shared', () => {
  const cat = data.guides.find(g=>g.circuit_id==='catalunya');
  const mon = data.guides.find(g=>g.circuit_id==='montreal');
  const imo = data.guides.find(g=>g.circuit_id==='imola');
  assert.match(cat.sections[12].explanation.en, /2023/);
  assert.match(cat.sections[13].explanation.uk, /2023/);
  assert.match(mon.sections[13].explanation.en, /1999/);
  assert.equal(mon.sections[13].name, null);
  assert.deepEqual(imo.sections.slice(1,4).map(s=>s.name), Array(3).fill('Variante Tamburello'));
  assert.deepEqual(imo.sections.slice(4,6).map(s=>s.name), Array(2).fill('Variante Villeneuve'));
  assert.deepEqual(imo.sections.slice(10,13).map(s=>s.name), Array(3).fill('Acque Minerali'));
  assert.deepEqual(imo.sections.slice(13,15).map(s=>s.name), Array(2).fill('Variante Alta / Gresini'));
  assert.deepEqual(imo.sections.slice(16,18).map(s=>s.name), Array(2).fill('Rivazza'));
  assert.match(imo.sections[1].explanation.en, /1995/);
  assert.match(imo.sections[13].explanation.en, /2022/);
});
