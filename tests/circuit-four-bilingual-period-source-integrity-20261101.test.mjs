import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const directory = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const load = file => JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
const first = load('EXPANSION_1_AINTREE_AVUS_CAESARS_RESEARCH_DRAFTS.json');
const second = load('EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json');
const circuits = [...first.circuits, ...second.circuits].filter(c =>
  ['aintree', 'avus', 'caesars-palace', 'bugatti'].includes(c.circuit_id),
);

test('20 reviewed race scenes retain complete EN/UK prose without mixed-language English', () => {
  assert.equal(circuits.length, 4);
  let count = 0;
  for (const circuit of circuits) {
    assert.equal(circuit.stories.length, 5);
    for (const scene of circuit.stories) {
      count++;
      assert.ok(scene.narrative.en.length >= 350, circuit.circuit_id + '/' + scene.story_index + '/en');
      assert.ok(scene.narrative.uk.length >= 350, circuit.circuit_id + '/' + scene.story_index + '/uk');
      assert.doesNotMatch(scene.narrative.en, /[\u0400-\u04ff]/u);
      assert.match(scene.narrative.uk, /[\u0400-\u04ff]/u);
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
    }
  }
  assert.equal(count, 20);
});

test('1957 Aintree keeps Brabham and Salvadori in separate Cooper entries', () => {
  const scene = first.circuits.find(c => c.circuit_id === 'aintree').stories[4];
  assert.match(scene.narrative.en, /separately entered works Cooper/);
  assert.match(scene.narrative.uk, /окремо заявленому заводському Cooper/);
  assert.doesNotMatch(scene.narrative.en, /team-mate Roy Salvadori/);
  assert.match(scene.narrative.en, /Salvadori.*did not retire/);
});

test('1982 Caesars Palace does not misattribute Cheever overtake narrative to period report', () => {
  const scene = first.circuits.find(c => c.circuit_id === 'caesars-palace').stories[4];
  assert.match(scene.narrative.en, /Motor Sport period report confirms Cheever's podium but does not independently narrate that pass/);
  assert.match(scene.historical_source_locator, /does not explicitly reconstruct a pass on Prost/);
  assert.match(scene.historical_source_locator, /Grandprix.com says Prost faded/);
});

test('AVUS aggregate and Bugatti Lotus breakdown remain distinct from results classification', () => {
  const avus = first.circuits.find(c => c.circuit_id === 'avus').stories;
  assert.match(avus[0].narrative.en, /two separate starts/);
  assert.match(avus[1].narrative.en, /1\.9-second margin combines both heats/);
  const bugatti = second.circuits.find(c => c.circuit_id === 'bugatti').stories;
  assert.match(bugatti[3].narrative.en, /Brabham inherited the lead/);
  assert.match(bugatti[4].narrative.uk, /Зіфферт повернув четверте місце/);
});
