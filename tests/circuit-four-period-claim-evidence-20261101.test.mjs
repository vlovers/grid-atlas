import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const paths = ['EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json', 'EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json'];
const circuits = paths.flatMap(name => JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/' + name, import.meta.url), 'utf8')).circuits);
const byId = new Map(circuits.map(c => [c.circuit_id, c]));
test('four historic circuits preserve 20 source-specific bilingual drafts and review gates', () => {
  let count = 0;
  for (const id of ['jacarepagua','montjuic','pescara','riverside']) {
    const stories = byId.get(id).stories;
    assert.equal(stories.length, 5);
    assert.equal(new Set(stories.map(s => s.historical_source_locator)).size, 5);
    for (const s of stories) {
      count++;
      assert.match(s.historical_source_locator, /Motor Sport/);
      assert.match(s.historical_source_locator, /Grandprix.com/);
      assert.match(s.historical_source_locator, /classification/i);
      assert.match(s.historical_source_locator, /Independent claim review pending/);
      assert.equal(s.publication, 'blocked');
      assert.equal(s.independent_approval, false);
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
      assert.ok(s.narrative.en.split(/\s+/).length >= 65);
      assert.ok(s.narrative.uk.split(/\s+/).length >= 55);
      assert.doesNotMatch(s.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
    }
  }
  assert.equal(count, 20);
});
test('historical uncertainty and casualty correction remain visible', () => {
  const s=(id,n)=>byId.get(id).stories[n-1];
  assert.match(s('montjuic',1).narrative.en,/four confirmed fatalities/);
  assert.match(s('montjuic',1).narrative.en,/Carmen Vigliatore/);
  assert.match(s('montjuic',5).narrative.en,/25 completed laps and 'NC'/);
  assert.match(s('pescara',4).narrative.en,/does not establish why/);
  assert.match(s('jacarepagua',2).narrative.en,/final 45 laps/);
  assert.match(s('riverside',5).narrative.en,/fifth before transmission trouble/);
});
