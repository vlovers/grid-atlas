import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = read('../apps/web/src/components/editorial/circuit-corners-v3.json');
const layouts = new Set(read('../apps/web/src/components/circuit-layout-manifest.json').map(x => x.layout_id));
const batch = new Map([
  ['buddh', { layout: 'buddh-1', year: 2013, turns: 16 }],
  ['yeongam', { layout: 'yeongam-1', year: 2013, turns: 18 }],
  ['sepang', { layout: 'sepang-1', year: 2017, turns: 15 }],
  ['sirius', { layout: 'sirius-1', year: 2021, turns: 18 }],
]);

test('four historical FIA maps yield 67 numbered, separately authored bilingual corner entries', () => {
  assert.equal([...batch.values()].reduce((n, v) => n + v.turns, 0), 67);
  assert.equal(new Set(data.guides.map(g => g.circuit_id)).size, data.guides.length);
  assert.ok(data.guides.length >= 31);
  assert.ok(data.guides.reduce((n, g) => n + g.numbered_turns, 0) >= 504);
  for (const [id, expected] of batch) {
    const guide = data.guides.find(g => g.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id, expected.layout);
    assert.ok(layouts.has(guide.layout_id), id + ': missing F1DB outline');
    assert.equal(guide.numbering_year, expected.year);
    assert.equal(guide.names_as_of, expected.year);
    assert.equal(guide.numbered_turns, expected.turns);
    assert.equal(guide.sections.length, expected.turns);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({length: expected.turns}, (_, i) => i+1));
    assert.match(data.sources[id+'-map'], /^https:\/\/www\.fia\.com\//);
    assert.match(data.sources[id+'-names'], /^https:\/\//);
    assert.match(data.sources[id+'-race'], /^https:\/\//);
    assert.ok(!guide.diagram, id + ': no unreviewed coordinate overlay');
    const en = new Set(), uk = new Set();
    for (const section of guide.sections) {
      assert.deepEqual(section.sources, [id+'-map', id+'-names', id+'-race']);
      assert.equal(section.name, null, section.id + ': unnamed is not a licence to invent a name');
      assert.deepEqual(section.aliases, []);
      assert.equal(section.confirmation_status, 'source_checked_ai');
      assert.ok(section.explanation.en.trim().split(/\s+/).length >= 15, section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 13, section.id+':uk');
      assert.match(section.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.doesNotMatch(section.explanation.en, /[А-Яа-яІіЇїЄєҐґ]/);
      en.add(section.explanation.en); uk.add(section.explanation.uk);
    }
    assert.equal(en.size, expected.turns, id + ': repeated English copy');
    assert.equal(uk.size, expected.turns, id + ': repeated Ukrainian copy');
  }
});

test('historical circuit IDs and periods are not replaced by similarly named modern venues', () => {
  assert.ok(data.guides.some(g => g.circuit_id === 'sirius' && g.layout_id === 'sirius-1'));
  assert.ok(data.guides.some(g => g.circuit_id === 'yeongam' && g.layout_id === 'yeongam-1'));
  assert.ok(data.guides.some(g => g.circuit_id === 'buddh' && g.layout_id === 'buddh-1'));
  assert.ok(data.guides.some(g => g.circuit_id === 'sepang' && g.layout_id === 'sepang-1'));
  for (const id of batch.keys()) {
    assert.ok(!data.guides.find(g => g.circuit_id === id).diagram);
  }
});
