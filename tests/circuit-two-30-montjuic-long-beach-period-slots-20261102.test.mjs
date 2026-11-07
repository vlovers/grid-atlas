import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));
const layouts = JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json', import.meta.url), 'utf8'));
const editions = [
  ['montjuic', 'montjuic-1', 1975, 12],
  ['long-beach', 'long-beach-3', 1983, 18],
];

test('30 individual bilingual historical study slots preserve period layouts without claiming FIA apex certification', () => {
  assert.equal(editions.reduce((n, row) => n + row[3], 0), 30);
  for (const [id, layout, year, count] of editions) {
    const guide = data.guides.find(g => g.circuit_id === id);
    assert.ok(guide, id);
    assert.equal(guide.layout_id, layout);
    assert.ok(layouts.some(x => x.layout_id === layout), layout);
    assert.equal(guide.numbering_year, year);
    assert.equal(guide.numbered_turns, count);
    assert.equal(guide.sections.length, count);
    assert.equal(guide.review_status, 'independent_review_pending');
    assert.match(guide.numbering_basis, /(?:not|missing|unverified)/i);
    assert.equal(guide.diagram, undefined, id + ' must not invent numbered diagram');
    assert.deepEqual(guide.sections.flatMap(x => x.numbers), Array.from({length: count}, (_, i) => i + 1));
    const en = new Set(), uk = new Set();
    for (const turn of guide.sections) {
      assert.equal(turn.name, null, turn.id);
      assert.equal(turn.numbers.length, 1, turn.id);
      assert.equal(turn.confirmation_status, 'historical_numbering_unverified', turn.id);
      assert.ok(turn.aliases.length === 1, turn.id);
      assert.ok(turn.explanation.en.trim().split(' ').length >= 17, turn.id + ':en');
      assert.ok(turn.explanation.uk.trim().split(' ').length >= 15, turn.id + ':uk');
      assert.match(turn.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/, turn.id);
      assert.equal(turn.sources.length, 3, turn.id);
      for (const key of turn.sources) assert.ok(data.sources[key].startsWith('https://'), key);
      en.add(turn.explanation.en);
      uk.add(turn.explanation.uk);
    }
    assert.equal(en.size, count, id + ': repeated English turn prose');
    assert.equal(uk.size, count, id + ': repeated Ukrainian turn prose');
  }
});

test('period reference distinctions are explicit: Montjuic streets are not corners and Long Beach 1983 differs from 1982', () => {
  const montjuic = data.guides.find(x => x.circuit_id === 'montjuic');
  const longBeach = data.guides.find(x => x.circuit_id === 'long-beach');
  assert.match(montjuic.sections[8].explanation.en, /straight, not an individually named corner/);
  assert.match(longBeach.numbering_basis, /1983 only/);
  assert.match(longBeach.sections[8].explanation.en, /straight on Seaside Way/);
  assert.ok(!montjuic.sections.some(x => x.confirmation_status === 'source_checked_ai'));
  assert.ok(!longBeach.sections.some(x => x.confirmation_status === 'source_checked_ai'));
});

test('both new historical guides remain fail-closed for publication', async () => {
  const { hasPublicationReadyCornerGuide, isCircuitEditionApproved } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  for (const [id] of editions) {
    assert.equal(hasPublicationReadyCornerGuide(id), false, id);
    assert.equal(isCircuitEditionApproved(id), false, id);
  }
});

test('historical SVG attribution is explicit and external map images are not imported', () => {
  for (const [, layout] of editions) {
    const asset = layouts.find(x => x.layout_id === layout);
    assert.equal(asset.license, 'CC-BY-4.0', layout);
    assert.equal(asset.author, 'Jules Roy', layout);
    assert.ok(asset.source_url.includes('github.com/f1db/f1db/'), layout);
  }
  for (const id of ['montjuic', 'long-beach', 'buenos-aires']) {
    const guide = data.guides.find(x => x.circuit_id === id);
    assert.ok(guide, id);
    assert.ok(guide.sections.every(x => x.name === null && x.confirmation_status === 'historical_numbering_unverified'), id);
    assert.ok(guide.sections.every(x => x.sources.every(key => data.sources[key].startsWith('https://'))), id);
  }
});
