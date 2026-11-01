import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dir = '../docs/editorial/circuit-experience-v3/';
const load = name => JSON.parse(readFileSync(new URL(dir + name, import.meta.url), 'utf8'));
const first = load('EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json');
const second = load('EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json');
const ids = ['aintree', 'avus', 'caesars-palace', 'bugatti'];

test('20 period-report scenes retain bilingual text, independent evidence leads and publication locks', () => {
  let checked = 0;
  for (const id of ids) {
    const document = id === 'bugatti' ? second : first;
    const circuit = document.circuits.find(entry => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.equal(document.publication, 'blocked');
    assert.deepEqual(circuit.stories.map(scene => scene.story_index), [1, 2, 3, 4, 5]);
    for (const scene of circuit.stories) {
      checked++;
      for (const lang of ['en', 'uk']) assert.ok(scene.narrative[lang].length >= 350, id + '/' + scene.story_index + '/' + lang);
      assert.match(scene.historical_source_locator, /Period Motor Sport race report:.*Second historical publication:.*Official F1 race result supports classification only; independent claim review pending/);
      const domains = new Set(scene.historical_sources.map(url => new URL(url).hostname.replace(/^www\./, '')));
      assert.ok(domains.has('motorsportmagazine.com'));
      assert.ok(domains.has('grandprix.com'));
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
    }
  }
  assert.equal(checked, 20);
});

test('Aintree 1957 Salvadori is classified fifth despite split gearbox, not a retirement', () => {
  const scene = first.circuits.find(c => c.circuit_id === 'aintree').stories[4];
  assert.match(scene.narrative.en, /Salvadori.*did not retire/);
  assert.match(scene.narrative.en, /classified fifth/);
  assert.match(scene.narrative.uk, /класифікували п'ятим/);
  assert.doesNotMatch(scene.narrative.en, /Salvadori also later lost his gearbox/);
});

test('AVUS 1959 distinguishes two heats, heat-two challengers and official aggregate margin', () => {
  const scenes = first.circuits.find(c => c.circuit_id === 'avus').stories;
  assert.match(scenes[0].narrative.en, /McLaren briefly led/);
  assert.match(scenes[1].narrative.en, /1\.9-second margin combines both heats/);
  assert.match(scenes[2].narrative.uk, /Макларен спершу лідирував/);
});

test('Bugatti 1967 retains old layout and distinguishes Lotus failures from Brabham overtakes', () => {
  const scenes = second.circuits.find(c => c.circuit_id === 'bugatti').stories;
  assert.match(scenes[0].narrative.en, /not the full 24-hour layout/);
  assert.match(scenes[3].narrative.en, /Brabham inherited the lead/);
  assert.match(scenes[4].narrative.uk, /Зіфферт повернув четверте місце/);
});
