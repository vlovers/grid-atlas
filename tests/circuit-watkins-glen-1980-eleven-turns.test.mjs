import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load = path => JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const corners = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const narrative = load('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');

test('Watkins Glen 1980 has 11 individual EN/UK corners with historical Scheckter Chicane', () => {
  const guide = corners.guides.find(g=>g.circuit_id==='watkins-glen');
  assert.ok(guide);
  assert.equal(guide.layout_id,'watkins-glen-3');
  assert.ok(manifest.some(x=>x.layout_id==='watkins-glen-3'));
  assert.equal(guide.numbering_year,1980);
  assert.equal(guide.numbered_turns,11);
  assert.equal(guide.sections.length,11);
  assert.deepEqual(guide.sections.flatMap(s=>s.numbers),Array.from({length:11},(_,i)=>i+1));
  assert.match(guide.numbering_basis,/period-aware|period Scheckter|period FIA/);
  assert.equal(guide.review_status,'independent_review_pending');
  assert.equal(guide.sections[2].name,'Scheckter Chicane');
  assert.equal(guide.sections[3].name,'Scheckter Chicane');
  assert.match(guide.sections[3].explanation.en,/1992 Inner Loop/);
  assert.ok(!guide.diagram);
  for (const s of guide.sections) {
    assert.equal(s.confirmation_status,'historical_turn_mapping_ai_checked_independent_review_pending');
    assert.deepEqual(s.sources,['watkins-glen-map','watkins-glen-names','watkins-glen-era','watkins-glen-race']);
    assert.ok(s.explanation.en.trim().split(/\s+/).length>=24,s.id+':en');
    assert.ok(s.explanation.uk.trim().split(/\s+/).length>=19,s.id+':uk');
    assert.match(s.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/);
  }
  assert.equal(new Set(guide.sections.map(s=>s.explanation.en)).size,11);
  assert.equal(new Set(guide.sections.map(s=>s.explanation.uk)).size,11);
});

test('Watkins Glen biography and two period race moments are sourced and bilingual', () => {
  const item=narrative.entries.find(x=>x.circuit_id==='watkins-glen');
  assert.ok(item);
  assert.ok(item.biography.text.en.trim().split(/\s+/).length>=60);
  assert.ok(item.biography.text.uk.trim().split(/\s+/).length>=55);
  assert.deepEqual(item.moments.map(m=>m.year),[1979,1980]);
  for (const m of item.moments) {
    assert.equal(m.review_status,'independent_review_pending');
    assert.match(m.source,/^https:\/\/www\.formula1\.com\//);
    assert.ok(m.text.en.trim().split(/\s+/).length>=50);
    assert.ok(m.text.uk.trim().split(/\s+/).length>=40);
  }
});
