import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const circuits = ['madring', 'jerez'].map(id => data.circuits.find(c => c.circuit_id === id));

test('ten Madring/Jerez bilingual scenes retain separate source leads and blocked publication', () => {
  assert.equal(data.publication, 'blocked');
  assert.ok(circuits.every(Boolean));
  for (const circuit of circuits) {
    assert.deepEqual(circuit.stories.map(s => s.story_index), [1, 2, 3, 4, 5]);
    const locators = new Set();
    for (const s of circuit.stories) {
      assert.ok(s.narrative.en.length >= 400, s.title.en);
      assert.ok(s.narrative.uk.length >= 400, s.title.uk);
      assert.ok(s.historical_sources.length >= 2);
      assert.match(s.historical_source_locator, /Independent claim review pending/);
      assert.equal(s.publication, 'blocked');
      assert.equal(s.independent_approval, false);
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
      locators.add(s.historical_source_locator);
    }
    assert.equal(locators.size, 5);
  }
});

test('Madring winner margin is distinct from P2/P3 gap and layout measurements', () => {
  const s = circuits[0].stories;
  assert.match(s[1].narrative.en, /Virtual Safety Car/);
  assert.match(s[1].narrative.uk, /віртуального автомобіля безпеки/);
  assert.match(s[2].narrative.en, /4\\.351 seconds/);
  assert.match(s[2].narrative.en, /0\\.738 seconds/);
  assert.match(s[4].narrative.en, /550 metres/);
  assert.match(s[4].narrative.en, /24%/);
  assert.match(s[4].narrative.uk, /550 метрів/);
});

test('Jerez distinguishes on-track lead changes, late tyre stop and retirement', () => {
  const s = circuits[1].stories;
  assert.match(s[0].narrative.en, /lap 39/);
  assert.match(s[0].narrative.en, /0\\.014 seconds/);
  assert.match(s[1].narrative.uk, /39-му колі/);
  assert.match(s[2].narrative.en, /Prost slipped into second/);
  assert.match(s[4].narrative.en, /39 completed laps/);
});
