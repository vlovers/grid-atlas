import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));
const narratives = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-narratives-v3.json', import.meta.url), 'utf8'));
const layouts = JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json', import.meta.url), 'utf8'));
const expected = [
  ['aintree', 'aintree-1', 1962, 8],
  ['kyalami', 'kyalami-1', 1985, 9],
  ['dijon', 'dijon-2', 1984, 12],
  ['zolder', 'zolder-2', 1984, 15],
];

test('44 distinct bilingual historic turn entries use the correct F1DB period layouts', () => {
  assert.equal(expected.reduce((sum, row) => sum + row[3], 0), 44);
  for (const [id, layoutId, year, count] of expected) {
    const guide = data.guides.find(g => g.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id, layoutId);
    assert.ok(layouts.some(l => l.layout_id === layoutId), layoutId);
    assert.equal(guide.numbering_year, year);
    assert.equal(guide.numbered_turns, count);
    assert.equal(guide.sections.length, count);
    assert.deepEqual(guide.sections.flatMap(s => s.numbers), Array.from({ length: count }, (_, i) => i + 1));
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.match(guide.numbering_basis, /(?:not|unverified|provisional)/i);
    assert.ok(!guide.diagram, id + ': no fabricated numbered diagram');
    const en = new Set(), uk = new Set();
    for (const turn of guide.sections) {
      assert.equal(turn.numbers.length, 1);
      assert.equal(turn.name, null, turn.id);
      assert.equal(turn.aliases.length, 1, turn.id);
      assert.equal(turn.confirmation_status, 'historical_numbering_unverified', turn.id);
      assert.ok(turn.explanation.en.trim().split(/\s+/).length >= 20, turn.id + ':en');
      assert.ok(turn.explanation.uk.trim().split(/\s+/).length >= 16, turn.id + ':uk');
      assert.match(turn.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/, turn.id);
      assert.ok(turn.sources.length >= 3, turn.id);
      for (const source of turn.sources) assert.match(data.sources[source], /^https:\/\//, turn.id + ':' + source);
      en.add(turn.explanation.en);
      uk.add(turn.explanation.uk);
    }
    assert.equal(en.size, count, id + ': EN descriptions must differ');
    assert.equal(uk.size, count, id + ': UK descriptions must differ');
  }
});

test('all four historical editions have two fact-linked race moments and remain pending review', () => {
  for (const [id] of expected) {
    const n = narratives.entries.find(entry => entry.circuit_id === id);
    assert.ok(n, id);
    assert.ok(n.biography.text.en.length >= 120, id);
    assert.ok(n.biography.text.uk.length >= 100, id);
    assert.match(n.biography.source, /^https:\/\//);
    assert.equal(n.moments.length, 2);
    for (const m of n.moments) {
      assert.equal(m.review_status, 'independent_review_pending');
      assert.match(m.source, /^https:\/\//);
      assert.ok(m.title.en && m.title.uk && m.text.en && m.text.uk);
      assert.ok(m.year >= 1950 && m.year <= 1985);
    }
  }
});

test('research-only historical editions cannot be approved by changing the manifest alone', async () => {
  const { hasPublicationReadyCornerGuide, isCircuitEditionApproved } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  for (const [id] of expected) {
    assert.equal(hasPublicationReadyCornerGuide(id), false, id);
    assert.equal(isCircuitEditionApproved(id), false, id);
  }
});
