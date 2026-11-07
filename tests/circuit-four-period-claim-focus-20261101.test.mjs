import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const ids = ['pedralbes', 'porto', 'rouen', 'zolder'];
test('20 edited EN/UK period scenes retain source boundaries and remain unapproved', () => {
  let total = 0;
  assert.equal(data.publication, 'blocked');
  for (const id of ids) {
    const c = data.circuits.find((x) => x.circuit_id === id);
    assert.ok(c, id);
    assert.deepEqual(c.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    const locators = new Set();
    for (const s of c.stories) {
      total++;
      assert.ok(s.narrative.en.trim().split(/\s+/).length >= 65, id + ' EN ' + s.story_index);
      assert.ok(s.narrative.uk.trim().split(/\s+/).length >= 55, id + ' UK ' + s.story_index);
      assert.doesNotMatch(s.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.match(s.historical_source_locator, /Claim focus: .+Independent claim approval pending/);
      assert.equal(new Set(s.historical_sources.map((url) => new URL(url).hostname)).size, 2);
      assert.ok(s.source_urls.some((url) => url.includes('formula1.com/en/results/')));
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
      assert.equal(s.independent_approval, false);
      assert.equal(s.publication, 'blocked');
      locators.add(s.historical_source_locator);
    }
    assert.equal(locators.size, 5);
  }
  assert.equal(total, 20);
});
test('period contradictions remain explicit in reader copy and evidence notes', () => {
  const porto = data.circuits.find((c) => c.circuit_id === 'porto').stories[0];
  assert.match(porto.narrative.en, /period report calls the leaking liquid fuel/);
  assert.match(porto.historical_source_locator, /Grandprix.com oil/);
  const zolder = data.circuits.find((c) => c.circuit_id === 'zolder').stories[3];
  assert.match(zolder.narrative.en, /Tyrrell's later exclusion/);
  assert.match(zolder.historical_source_locator, /retrospective Tyrrell exclusion/);
});
