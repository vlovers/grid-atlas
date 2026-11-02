import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');
const expected = new Map([
  ['hungaroring', ['hungaroring-3', 14]],
  ['zandvoort', ['zandvoort-5', 14]],
  ['baku', ['baku-1', 20]],
  ['melbourne', ['melbourne-2', 14]],
  ['mexico-city', ['mexico-city-3', 17]],
]);

test('five new guides contribute 79 unique, bilingual, numbered corners mapped to F1DB layouts', () => {
  assert.equal(data.guides.length, 14);
  assert.equal(data.guides.reduce((n, guide) => n + guide.numbered_turns, 0), 223);
  const allIds = data.guides.map(guide => guide.circuit_id);
  assert.equal(new Set(allIds).size, allIds.length);
  for (const [id, [layout, count]] of expected) {
    const guide = data.guides.find(guide => guide.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id, layout);
    assert.ok(manifest.some(entry => entry.layout_id === layout), id + ': missing layout SVG');
    assert.equal(guide.numbering_year, 2025);
    assert.equal(guide.numbered_turns, count);
    assert.equal(guide.sections.length, count);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({length: count}, (_, i) => i+1));
    assert.match(data.sources[id+'-map'], /^https:\/\/www\.fia\.com\//);
    assert.match(data.sources[id+'-names'], /^https:\/\//);
    assert.ok(!guide.diagram, id + ': no unreviewed map overlay');
    const en = new Set(), uk = new Set();
    for (const section of guide.sections) {
      assert.deepEqual(section.sources, [id+'-map', id+'-names']);
      assert.equal(section.confirmation_status, 'source_checked_ai');
      assert.ok(section.explanation.en.trim().split(/\s+/).length >= 22, section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 18, section.id+':uk');
      assert.match(section.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.doesNotMatch(section.explanation.en, /[А-Яа-яІіЇїЄєҐґ]/);
      en.add(section.explanation.en); uk.add(section.explanation.uk);
    }
    assert.equal(en.size, count, id + ': repeated English descriptions');
    assert.equal(uk.size, count, id + ': repeated Ukrainian descriptions');
  }
});

test('2026 official Hungaroring naming is not retroactively applied to 2025', () => {
  const guide = data.guides.find(g => g.circuit_id === 'hungaroring');
  assert.equal(guide.names_as_of, 2026);
  assert.deepEqual(guide.sections.map(s => s.name), [
    'Piquet','Hamilton','Spring','Mansell','Mogyorod','Driving Center','Driving Center',
    'Buda','Pest','Danube','Alesi','Schumacher','Senna','Szisz'
  ]);
  assert.match(data.sources['hungaroring-names'], /40th-anniversary/);
});

test('Zandvoort distinguishes shared complex names and corners without established names', () => {
  const guide = data.guides.find(g => g.circuit_id === 'zandvoort');
  assert.equal(guide.sections[5].name, 'Scheivlak');
  assert.equal(guide.sections[6].name, 'Scheivlak');
  assert.equal(guide.sections[8].name, null);
  assert.equal(guide.sections[9].name, null);
  assert.equal(guide.sections[10].name, 'Hans Ernst Chicane');
  assert.equal(guide.sections[11].name, 'Hans Ernst Chicane');
  assert.equal(guide.sections[12].name, null);
  assert.equal(guide.sections[13].name, 'Arie Luyendykbocht');
  assert.match(guide.sections[0].explanation.en, /folklore/);
});

test('post-2022 Melbourne and post-2015 Mexico maps are not confused with historic layouts', () => {
  const melbourne = data.guides.find(g => g.circuit_id === 'melbourne');
  const mexico = data.guides.find(g => g.circuit_id === 'mexico-city');
  assert.match(melbourne.sections[7].explanation.en, /2022/);
  assert.match(melbourne.sections[8].explanation.uk, /2022/);
  assert.equal(mexico.sections[16].name, 'Curva Peraltada / Mansell');
  assert.match(mexico.sections[16].explanation.en, /historic Peraltada/);
});
