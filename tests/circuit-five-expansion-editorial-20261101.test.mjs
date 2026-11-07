import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json', import.meta.url), 'utf8'));
const byId = new Map(data.circuits.map(c => [c.circuit_id, c]));
test('five dossiers preserve 25 bilingual scenes and fail-closed review gates', () => {
  assert.deepEqual([...byId.keys()].sort(), ['east-london', 'jarama', 'jerez', 'madring', 'monaco']);
  assert.equal(data.publication, 'blocked');
  for (const [id, c] of byId) {
    assert.deepEqual(c.stories.map(s => s.story_index), [1,2,3,4,5], id);
    for (const s of c.stories) {
      assert.equal(s.publication, 'blocked');
      assert.equal(s.independent_approval, false);
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
      assert.ok(new Set(s.historical_sources.map(u => new URL(u).hostname.replace(/^www\./, ''))).size >= 2);
      for (const l of ['en','uk']) assert.ok(s.narrative[l].split(/\s+/).length >= 60, `${id} ${s.story_index} ${l}`);
    }
  }
});
test('historical source discrepancies remain explicit', () => {
  const s = (id,i) => byId.get(id).stories[i-1];
  assert.match(s('east-london',2).historical_source_locator,/61 completed laps/);
  assert.match(s('jarama',2).historical_source_locator,/0\.220s.*0\.211s/);
  assert.match(s('jerez',1).narrative.en,/pressure loss/);
  assert.match(s('monaco',3).narrative.en,/actual finishers/);
  assert.match(s('madring',5).historical_source_locator,/design cap/);
});
