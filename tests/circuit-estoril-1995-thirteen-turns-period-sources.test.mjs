import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const narrative = load('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const layouts = load('../apps/web/src/components/circuit-layout-manifest.json');
const release = load('../apps/web/src/components/editorial/circuit-release.json');

test('1995 Estoril has 13 individually authored bilingual turns, not the 1985 layout', () => {
  const guide = data.guides.find(g => g.circuit_id === 'estoril');
  assert.ok(guide);
  assert.equal(guide.layout_id, 'estoril-2');
  assert.ok(layouts.some(l => l.layout_id === 'estoril-2'));
  assert.equal(guide.numbering_year, 1995);
  assert.equal(guide.numbered_turns, 13);
  assert.equal(guide.sections.length, 13);
  assert.deepEqual(guide.sections.flatMap(s=>s.numbers), Array.from({length:13},(_,i)=>i+1));
  assert.equal(guide.review_status, 'independent_review_pending');
  assert.match(guide.numbering_basis, /period FIA map/);
  assert.ok(!guide.diagram);
  assert.ok(!release.editions.some(e=>e.circuit_id==='estoril'));
  assert.match(data.sources['estoril-names'], /AS21\.09\.95\.pdf$/);
  assert.match(data.sources['estoril-map'], /estoril/);
  assert.equal(guide.sections[5].name, 'Parabólica Interior');
  assert.equal(guide.sections[12].name, 'Parabólica');
  assert.equal(guide.sections[8].name, null);
  for (const s of guide.sections) {
    assert.deepEqual(s.sources,['estoril-map','estoril-names','estoril-era','estoril-race']);
    assert.equal(s.confirmation_status, 'historical_turn_mapping_ai_checked_independent_review_pending');
    assert.ok(s.explanation.en.trim().split(/\s+/).length>=26,s.id+':en');
    assert.ok(s.explanation.uk.trim().split(/\s+/).length>=20,s.id+':uk');
    assert.match(s.explanation.uk,/[А-Яа-яІіЇїЄєҐґ]/);
  }
  assert.equal(new Set(guide.sections.map(s=>s.explanation.en)).size,13);
  assert.equal(new Set(guide.sections.map(s=>s.explanation.uk)).size,13);
});

test('1994 and 1995 Estoril historical race moments remain unpublished and bilingual', () => {
  const item=narrative.entries.find(e=>e.circuit_id==='estoril');
  assert.ok(item);
  assert.equal(item.moments.length,2);
  assert.ok(item.biography.text.en.trim().split(/\s+/).length>=55);
  assert.ok(item.biography.text.uk.trim().split(/\s+/).length>=45);
  assert.deepEqual(item.moments.map(m=>m.year),[1994,1995]);
  for(const moment of item.moments){
    assert.match(moment.source,/^https:\/\/www\.formula1\.com\//);
    assert.equal(moment.review_status,'independent_review_pending');
    assert.ok(moment.text.en.trim().split(/\s+/).length>=50);
    assert.ok(moment.text.uk.trim().split(/\s+/).length>=40);
  }
});
