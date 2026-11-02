import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));
const layouts = JSON.parse(readFileSync(new URL('../apps/web/src/components/circuit-layout-manifest.json', import.meta.url), 'utf8'));

test('Buenos Aires 1995 has 19 unique bilingual historical turn-study entries on the 1995-98 F1DB layout', () => {
  const guide = data.guides.find(x => x.circuit_id === 'buenos-aires');
  assert.ok(guide);
  assert.equal(guide.layout_id, 'buenos-aires-4');
  assert.ok(layouts.some(x => x.layout_id === 'buenos-aires-4'));
  assert.equal(guide.numbering_year, 1995);
  assert.equal(guide.numbered_turns, 19);
  assert.equal(guide.sections.length, 19);
  assert.deepEqual(guide.sections.flatMap(x => x.numbers), Array.from({ length: 19 }, (_, i) => i + 1));
  assert.match(guide.numbering_basis, /unverified/);
  assert.equal(guide.review_status, 'independent_review_pending');
  assert.equal(guide.diagram, undefined);
  const en = new Set(), uk = new Set();
  for (const turn of guide.sections) {
    assert.equal(turn.name, null, turn.id);
    assert.equal(turn.confirmation_status, 'historical_numbering_unverified', turn.id);
    assert.ok(turn.explanation.en.trim().split(' ').length >= 17, turn.id + ':en');
    assert.ok(turn.explanation.uk.trim().split(' ').length >= 15, turn.id + ':uk');
    assert.match(turn.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
    assert.equal(turn.sources.length, 3);
    for (const key of turn.sources) assert.ok(data.sources[key].startsWith('https://'), key);
    en.add(turn.explanation.en);
    uk.add(turn.explanation.uk);
  }
  assert.equal(en.size, 19);
  assert.equal(uk.size, 19);
  assert.match(guide.sections[12].explanation.en, /1995 Formula One return/);
  assert.match(guide.sections[18].explanation.en, /nineteen bends/);
});

test('Buenos Aires provisional numbering cannot be released via manifest-only approval', async () => {
  const { hasPublicationReadyCornerGuide, isCircuitEditionApproved } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  assert.equal(hasPublicationReadyCornerGuide('buenos-aires'), false);
  assert.equal(isCircuitEditionApproved('buenos-aires'), false);
});
