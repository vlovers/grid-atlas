import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = read('../apps/web/src/components/editorial/circuit-corners-v3.json');
const stories = read('../apps/web/src/components/editorial/circuit-narratives-v3.json');
const manifest = read('../apps/web/src/components/circuit-layout-manifest.json');
const guide = data.guides.find(g => g.circuit_id === 'jerez');
const narrative = stories.entries.find(g => g.circuit_id === 'jerez');

test('Jerez uses the 1994–1997 F1 configuration, not a modern 13-turn motorcycle map', () => {
  assert.ok(guide);
  assert.equal(guide.layout_id, 'jerez-2');
  assert.equal(guide.numbering_year, 1997);
  assert.equal(guide.names_as_of, 1997);
  assert.equal(guide.numbered_turns, 15);
  assert.equal(guide.review_status, 'independent_review_pending');
  assert.equal(guide.diagram, undefined);
  assert.ok(manifest.some(x => x.layout_id === 'jerez-2'));
  assert.deepEqual(guide.sections.flatMap(s=>s.numbers), Array.from({length:15},(_,i)=>i+1));
  assert.equal(new Set(guide.sections.map(s=>s.id)).size, 15);
  for (const s of guide.sections) {
    assert.ok(s.explanation.en.trim().split(/\s+/).length >= 27, s.id+':en');
    assert.ok(s.explanation.uk.trim().split(/\s+/).length >= 20, s.id+':uk');
    assert.match(s.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.doesNotMatch(s.explanation.en, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.deepEqual(s.sources, ['jerez-1997-layout','jerez-venue-history','jerez-historic-map']);
    assert.equal(s.confirmation_status, 'source_checked_ai');
  }
  assert.equal(guide.sections[5].name, 'Dry Sack');
  for (const i of [2,3,6,7,8,10,11,12,13,14]) assert.equal(guide.sections[i].name, null);
  for (const key of ['jerez-1997-layout','jerez-venue-history','jerez-historic-map']) assert.match(data.sources[key], /^https:\/\//);
});

test('Jerez race chronology and publication boundaries are preserved', () => {
  assert.ok(narrative);
  assert.deepEqual(narrative.moments.map(m=>m.year), [1997,1997]);
  assert.match(narrative.biography.text.en, /1994/);
  assert.match(narrative.biography.text.en, /1997/);
  assert.match(narrative.biography.text.uk, /1994/);
  assert.match(narrative.biography.text.uk, /1997/);
  assert.equal(narrative.moments[0].id, 'jerez-1997-title-collision');
  assert.equal(narrative.moments[1].id, 'jerez-1997-mclaren-finish');
  for (const m of narrative.moments) {
    assert.equal(m.review_status, 'independent_review_pending');
    assert.match(m.source, /^https:\/\//);
    assert.ok(m.locator && m.criterion && m.source_check);
  }
});
