import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const manuscript = load('../docs/editorial/circuit-experience-v3/NUMBERED_CORNER_GUIDES_MIAMI_SPIELBERG_20261102.json');
const candidate = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');
const expected = new Map([['miami', ['miami-1', 19]], ['spielberg', ['spielberg-3', 10]]]);

test('Miami and Spielberg contribute 29 unique individual FIA-2025 numbered turns in both languages', () => {
  assert.equal(manuscript.guides.length, 2);
  assert.equal(manuscript.guides.reduce((sum, guide) => sum+guide.numbered_turns, 0), 29);
  assert.ok(candidate.guides.length >= 19);
  assert.ok(candidate.guides.reduce((sum, guide) => sum+guide.numbered_turns, 0) >= 311);
  for (const [id, [layout, count]] of expected) {
    const draft = manuscript.guides.find(g => g.circuit_id === id);
    const guide = candidate.guides.find(g => g.circuit_id === id);
    assert.ok(guide && draft, id);
    assert.equal(guide.layout_id, layout);
    assert.ok(manifest.some(item => item.layout_id === layout));
    assert.equal(guide.numbering_year, 2025);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.equal(guide.numbered_turns, count);
    assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({length:count}, (_,i)=>i+1));
    assert.deepEqual(guide.sections, draft.sections);
    assert.equal(candidate.sources[id+'-map'], draft.sources.map);
    assert.equal(candidate.sources[id+'-names'], draft.sources.names);
    assert.match(draft.sources.map, /^https:\/\/www\.fia\.com\/system\/files\/decision-document\/2025_/);
    assert.match(draft.sources.names, /^https:\/\/www\.formula1\.com\/en\//);
    assert.equal(new Set(guide.sections.map(s => s.explanation.en)).size, count);
    assert.equal(new Set(guide.sections.map(s => s.explanation.uk)).size, count);
    for (const s of guide.sections) {
      assert.equal(s.numbers.length, 1);
      assert.equal(s.confirmation_status, 'source_checked_ai');
      assert.deepEqual(s.sources, [id+'-map',id+'-names']);
      assert.ok(s.explanation.en.trim().split(/\s+/).length >= 25, s.id+':en');
      assert.ok(s.explanation.uk.trim().split(/\s+/).length >= 18, s.id+':uk');
      assert.match(s.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    }
  }
});

test('Rindt is a sourced proper name; unverified Miami names remain null', () => {
  const miami = candidate.guides.find(g => g.circuit_id === 'miami');
  assert.ok(miami.sections.every(s => s.name === null));
  assert.match(miami.sections[13].explanation.en, /uphill/);
  const spielberg = candidate.guides.find(g => g.circuit_id === 'spielberg');
  assert.equal(spielberg.sections[8].name, 'Rindt');
  assert.ok(spielberg.sections.filter(s => s.name !== null).length === 1);
  assert.match(spielberg.sections[1].explanation.en, /full throttle/);
});

test('new source manuscripts do not authorize publication or third-party image copying', () => {
  assert.equal(manuscript.publication_authorized, false);
  assert.equal(manuscript.review_status, 'independent_review_pending');
  assert.match(manuscript.media_policy, /External FIA map links only/);
  const release = load('../apps/web/src/components/editorial/circuit-release.json');
  for (const id of expected.keys()) assert.ok(!release.editions.some(e => e.circuit_id === id));
});
