import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const corners = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');
const release = load('../apps/web/src/components/editorial/circuit-release.json');
const specs = new Map([
  ['brands-hatch', {layout:'brands-hatch-2', year:1986, turns:9}],
  ['donington', {layout:'donington-1', year:1993, turns:12}]
]);

test('21 historical Brands Hatch / Donington turns are individually authored, numbered and source-linked', () => {
  assert.ok(corners.guides.length >= 40);
  assert.ok(corners.guides.reduce((sum, g) => sum + g.numbered_turns, 0) >= 650);
  for (const [id, spec] of specs) {
    const guide = corners.guides.find(g => g.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id, spec.layout);
    assert.ok(manifest.some(x => x.layout_id === spec.layout));
    assert.equal(guide.numbering_year, spec.year);
    assert.equal(guide.numbered_turns, spec.turns);
    assert.equal(guide.sections.length, spec.turns);
    assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({length:spec.turns}, (_, i) => i+1));
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.match(guide.numbering_basis, /not an independently authenticated period FIA numbered map/);
    assert.ok(!guide.diagram);
    assert.ok(!release.editions.some(e => e.circuit_id === id));
    for (const key of ['map','names','era','race']) assert.match(corners.sources[id+'-'+key], /^https:\/\//);
    for (const s of guide.sections) {
      assert.equal(s.numbers.length, 1);
      assert.deepEqual(s.sources, ['map','names','era','race'].map(key => id+'-'+key));
      assert.equal(s.confirmation_status, 'historical_turn_mapping_ai_checked_independent_review_pending');
      assert.ok(s.explanation.en.trim().split(/\s+/).length >= 24, s.id+':en');
      assert.ok(s.explanation.uk.trim().split(/\s+/).length >= 19, s.id+':uk');
      assert.match(s.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.doesNotMatch(s.explanation.en, /[А-Яа-яІіЇїЄєҐґ]/);
    }
    assert.equal(new Set(guide.sections.map(s => s.explanation.en)).size, spec.turns);
    assert.equal(new Set(guide.sections.map(s => s.explanation.uk)).size, spec.turns);
  }
});

test('1986 Brands Hatch cannot inherit post-2003 Sheene Curve geometry', () => {
  const guide = corners.guides.find(g => g.circuit_id === 'brands-hatch');
  assert.equal(guide.sections[6].name, 'Dingle Dell');
  assert.match(guide.sections[6].explanation.en, /2003/);
  assert.match(guide.sections[6].explanation.uk, /2003/);
  assert.ok(guide.sections[6].aliases.some(a => /Sheene Curve/.test(a)));
});

test('Donington 1993 includes the GP extension, with distinct Esses bends', () => {
  const guide = corners.guides.find(g => g.circuit_id === 'donington');
  assert.equal(guide.sections[8].name, 'The Esses');
  assert.equal(guide.sections[9].name, 'The Esses');
  assert.equal(guide.sections[10].name, 'Melbourne Hairpin');
  assert.equal(guide.sections[11].name, 'Goddards');
  assert.match(guide.sections[11].explanation.en, /Roberts/);
});

test('inherited Monaco and Spa keep 38 individual, unique descriptions and anchors', () => {
  const monaco = load('../docs/editorial/circuit-experience-v3/monaco-turns-and-moments-v1.json');
  const spa = load('../docs/editorial/circuit-experience-v3/spa-turns-v1.json');
  const candidates = readFileSync(new URL('../apps/web/src/components/editorial/circuit-candidates.ts', import.meta.url), 'utf8');
  for (const raw of [monaco,spa]) {
    assert.equal(raw.turns.length, 19);
    assert.deepEqual(raw.turns.map(t=>t.number), Array.from({length:19},(_,i)=>i+1));
    for (const lang of ['en','uk']) assert.equal(new Set(raw.turns.map(t=>t.story[lang])).size,19);
  }
  assert.match(candidates, /sections: raw\.turns\.map\(turn =>/);
  assert.match(candidates, /numbers: \[turn\.number\]/);
  assert.doesNotMatch(candidates, /groups\.set\(/);
});

test('historical UI must not falsely label every map as an official 2025 FIA diagram', () => {
  const ui = readFileSync(new URL('../apps/web/src/components/editorial/circuit-corner-guide.tsx', import.meta.url), 'utf8');
  assert.match(ui, /hasFiaMap/);
  assert.match(ui, /Open the historical layout reference/);
  assert.match(ui, /Historic \$\{guide\.numbering_year\} layout/);
  assert.doesNotMatch(ui, /Numbering: official FIA 2025 map/);
});

test('Brands Hatch and Donington have four source-linked EN/UK historical race stories', () => {
  const data = load('../apps/web/src/components/editorial/circuit-narratives-v3.json');
  for (const id of specs.keys()) {
    const entry = data.entries.find(e => e.circuit_id === id);
    assert.ok(entry, id);
    assert.ok(entry.biography.text.en.trim().split(/\s+/).length >= 55);
    assert.ok(entry.biography.text.uk.trim().split(/\s+/).length >= 50);
    assert.match(entry.biography.source, /^https:\/\//);
    assert.equal(entry.moments.length, 2);
    for (const moment of entry.moments) {
      assert.ok(moment.text.en.trim().split(/\s+/).length >= 45);
      assert.ok(moment.text.uk.trim().split(/\s+/).length >= 40);
      assert.match(moment.source, /^https:\/\//);
      assert.equal(moment.review_status, 'independent_review_pending');
    }
  }
});
