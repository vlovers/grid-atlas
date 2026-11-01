import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const ids = ['nivelles', 'pedralbes', 'rouen', 'zolder'];
const byId = new Map(data.circuits.map((c) => [c.circuit_id, c]));

test('20 period scenes retain bilingual depth, independent source leads and blocked publication', () => {
  let count = 0;
  for (const id of ids) {
    const circuit = byId.get(id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
    for (const s of circuit.stories) {
      count++;
      assert.ok(s.narrative.en.trim().split(/\s+/).length >= 65, id + '/en/' + s.story_index);
      assert.ok(s.narrative.uk.trim().split(/\s+/).length >= 55, id + '/uk/' + s.story_index);
      assert.doesNotMatch(s.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.equal(s.publication, 'blocked');
      assert.equal(s.independent_approval, false);
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
      assert.ok(new Set(s.historical_sources.map(u => new URL(u).hostname)).size >= 2);
    }
  }
  assert.equal(count, 20);
});

test('period chronology, contested lap and retrospective classification are kept distinct', () => {
  const scene = (id, n, lang) => byId.get(id).stories[n - 1].narrative[lang];
  assert.match(scene('nivelles', 5, 'en'), /lap 76 or 77/);
  assert.match(scene('nivelles', 5, 'uk'), /76-му, чи на 77-му/);
  assert.match(scene('pedralbes', 1, 'en'), /Four different makes/);
  assert.match(scene('pedralbes', 4, 'uk'), /Пако Годія/);
  assert.match(scene('rouen', 3, 'en'), /hand throttle/);
  assert.match(scene('rouen', 5, 'uk'), /після 33 кіл/);
  assert.match(scene('zolder', 1, 'en'), /Spa in 1985/);
  assert.match(scene('zolder', 4, 'en'), /sixth on the road/);
  assert.match(scene('zolder', 4, 'uk'), /не означає/);
});
