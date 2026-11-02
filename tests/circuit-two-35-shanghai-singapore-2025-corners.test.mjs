import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const manuscript = load('../docs/editorial/circuit-experience-v3/NUMBERED_CORNER_GUIDES_SHANGHAI_SINGAPORE_20261102.json');
const model = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');
const expected = new Map([['shanghai', ['shanghai-1', 16]], ['marina-bay', ['marina-bay-4', 19]]]);

test('Shanghai and post-2023 Singapore add 35 complete bilingual FIA 2025 turn guides', () => {
  assert.equal(manuscript.guides.length, 2);
  assert.equal(manuscript.guides.reduce((n,g)=>n+g.numbered_turns,0), 35);
  assert.ok(model.guides.length >= 21);
  assert.ok(model.guides.reduce((n,g)=>n+g.numbered_turns,0) >= 346);
  for (const [id,[layout,count]] of expected) {
    const original = manuscript.guides.find(g=>g.circuit_id===id);
    const guide = model.guides.find(g=>g.circuit_id===id);
    assert.ok(original && guide,id);
    assert.equal(guide.layout_id,layout);
    assert.ok(manifest.some(x=>x.layout_id===layout),id+':layout');
    assert.equal(guide.numbering_year,2025);
    assert.equal(guide.numbered_turns,count);
    assert.equal(guide.review_status,'independent_review_pending');
    assert.deepEqual(guide.sections,original.sections);
    assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:count},(_,i)=>i+1));
    assert.equal(model.sources[id+'-map'],original.sources.map);
    assert.equal(model.sources[id+'-names'],original.sources.names);
    assert.match(original.sources.map,/^https:\/\/www\.fia\.com\/system\/files\/decision-document\/2025_/);
    assert.match(original.sources.names,/^https:\/\/www\.formula1\.com\/en\//);
    assert.equal(new Set(guide.sections.map(s=>s.explanation.en)).size,count);
    assert.equal(new Set(guide.sections.map(s=>s.explanation.uk)).size,count);
    for (const section of guide.sections) {
      assert.equal(section.name,null,'no unsupported proper name');
      assert.equal(section.numbers.length,1);
      assert.equal(section.confirmation_status,'source_checked_ai');
      assert.deepEqual(section.sources,[id+'-map',id+'-names']);
      assert.ok(section.explanation.en.trim().split(/\s+/).length>=25,section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length>=18,section.id+':uk');
      assert.match(section.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/);
    }
  }
});

test('Shanghai DRS and Singapore post-2023 geometry remain tied to 2025 numbering', () => {
  const shanghai=model.guides.find(g=>g.circuit_id==='shanghai');
  assert.match(shanghai.sections[12].explanation.en,/375 metres/);
  assert.match(shanghai.sections[15].explanation.en,/98 metres/);
  const marina=model.guides.find(g=>g.circuit_id==='marina-bay');
  assert.match(marina.sections[13].explanation.en,/2023/);
  assert.match(marina.sections[18].explanation.en,/19-turn/);
  assert.equal(marina.layout_id,'marina-bay-4');
});

test('sources and media research do not grant approval', () => {
  assert.equal(manuscript.publication_authorized,false);
  assert.match(manuscript.media_policy,/copyrighted maps referenced by link only/);
  const release=load('../apps/web/src/components/editorial/circuit-release.json');
  for (const id of expected.keys()) assert.ok(!release.editions.some(e=>e.circuit_id===id));
});
