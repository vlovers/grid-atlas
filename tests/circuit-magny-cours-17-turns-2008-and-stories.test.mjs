import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const cornerData = read('../apps/web/src/components/editorial/circuit-corners-v3.json');
const narrativeData = read('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const manifest = read('../apps/web/src/components/circuit-layout-manifest.json');
const guide = cornerData.guides.find(g => g.circuit_id === 'magny-cours');
const narrative = narrativeData.entries.find(g => g.circuit_id === 'magny-cours');

test('Magny-Cours 2003–2008 F1 layout has seventeen individually researched EN/UK turns', () => {
  assert.ok(guide, 'Magny-Cours candidate guide missing');
  assert.equal(guide.layout_id, 'magny-cours-3');
  assert.equal(guide.numbering_year, 2008);
  assert.equal(guide.numbered_turns, 17);
  assert.equal(guide.review_status, 'independent_review_pending');
  assert.ok(manifest.some(x => x.layout_id === guide.layout_id));
  assert.equal(guide.diagram, undefined, 'do not publish unverified SVG corner annotations');
  assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({length:17},(_,i)=>i+1));
  assert.equal(new Set(guide.sections.map(s=>s.id)).size, 17);
  for (const s of guide.sections) {
    assert.ok(s.explanation.en.trim().split(/\\s+/).length >= 28, s.id + ':en');
    assert.ok(s.explanation.uk.trim().split(/\\s+/).length >= 22, s.id + ':uk');
    assert.match(s.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.doesNotMatch(s.explanation.en, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.deepEqual(s.sources, ['magny-cours-map','magny-cours-names','magny-cours-history']);
    assert.equal(s.confirmation_status, 'source_checked_ai');
  }
  assert.equal(guide.sections[1].name, null, 'do not invent a proper name for T2');
  assert.equal(guide.sections[5].name, null, 'do not invent a proper name for T6');
  assert.equal(guide.sections[6].name, guide.sections[7].name);
  assert.equal(guide.sections[11].name, guide.sections[12].name);
  assert.equal(guide.sections[15].name, guide.sections[16].name);
  assert.equal(guide.sections[4].name, 'Adélaïde');
  assert.equal(guide.sections[13].name, 'Château d’Eau');
  for (const key of ['magny-cours-map','magny-cours-names','magny-cours-history']) {
    assert.match(cornerData.sources[key], /^https:\/\//);
  }
});

test('Magny-Cours 1991/2003 layout changes and 2004/2008 race facts remain dated and unpublished', () => {
  assert.ok(narrative);
  assert.equal(narrative.moments.length, 2);
  assert.deepEqual(narrative.moments.map(m=>m.year), [2004,2008]);
  assert.match(narrative.biography.text.en, /2003/);
  assert.match(narrative.biography.text.uk, /2003/);
  assert.match(narrative.biography.source, /^https:\/\//);
  for (const m of narrative.moments) {
    assert.equal(m.review_status, 'independent_review_pending');
    assert.match(m.source, /^https:\/\//);
    assert.ok(m.locator && m.criterion && m.source_check);
    assert.ok(m.title.en && m.title.uk && m.text.en && m.text.uk);
  }
});
