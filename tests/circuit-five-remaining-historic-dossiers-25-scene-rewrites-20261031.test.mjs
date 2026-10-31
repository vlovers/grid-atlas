import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = JSON.parse(readFileSync(
  new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url),
  'utf8',
));

const expected = new Map([
  ['pedralbes', ['clutch', 'oil', 'Musso']],
  ['reims', ['0.1 seconds', 'Hans Herrmann', 'streamlined']],
  ['spa-francorchamps', ['Stewart', 'limited-slip differential', 'Clark']],
  ['zeltweg', ['concrete', 'Gurney', 'suspension']],
  ['zolder', ['Tyrrell', 'Senna', 'Warwick']],
]);

test('five historical dossiers have 25 readable bilingual scenes and two independent narrative publishers', () => {
  let total = 0;
  for (const [id, anchors] of expected) {
    const circuit = source.circuits.find((entry) => entry.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((story) => story.story_index), [1, 2, 3, 4, 5], id);
    const en = new Set();
    const uk = new Set();
    for (const story of circuit.stories) {
      total++;
      assert.ok(story.narrative.en.length >= 260, id + '/en');
      assert.ok(story.narrative.uk.length >= 240, id + '/uk');
      assert.ok(story.narrative.en.split(/\s+/).length >= 55, id + '/en words');
      assert.ok(story.narrative.uk.split(/\s+/).length >= 45, id + '/uk words');
      en.add(story.narrative.en);
      uk.add(story.narrative.uk);
      assert.ok(story.source_urls.some((url) => url.includes('formula1.com/en/results/')), id + '/official classification');
      assert.ok(story.historical_sources.length >= 2, id + '/narrative reports');
      assert.ok(story.historical_sources.some((url) => url.includes('motorsportmagazine.com')), id + '/period reporting');
      assert.ok(story.historical_sources.some((url) => url.includes('grandprix.com/races/')), id + '/independent race history');
      assert.equal(new Set(story.historical_sources).size, story.historical_sources.length, id + '/unique sources');
      assert.ok(story.historical_sources.every((url) => !story.source_urls.includes(url)), id + '/source separation');
      assert.match(story.historical_source_locator, /classification.*claim-level source review pending/i, id + '/review boundary');
      assert.equal(story.historical_review_status, 'pending_independent_claim_review', id);
      assert.equal(story.independent_approval, false, id);
      assert.equal(story.publication, 'blocked', id);
    }
    assert.equal(en.size, 5, id + '/distinct English scenes');
    assert.equal(uk.size, 5, id + '/distinct Ukrainian scenes');
    for (const anchor of anchors) {
      assert.ok(circuit.stories.some((story) => story.narrative.en.includes(anchor)), id + '/' + anchor);
    }
  }
  assert.equal(total, 25);
  assert.equal(source.publication, 'blocked');
});

test('disputed historical details remain explicit and do not silently rewrite the official result', () => {
  const spa = source.circuits.find((circuit) => circuit.circuit_id === 'spa-francorchamps');
  assert.match(spa.stories[1].narrative.en, /accounts differ on the exact lap/);
  assert.match(spa.stories[1].narrative.uk, /розходяться щодо точного кола/);
  const zolder = source.circuits.find((circuit) => circuit.circuit_id === 'zolder');
  assert.match(zolder.stories[3].narrative.en, /Tyrrell's later exclusion/);
  assert.match(zolder.stories[3].narrative.uk, /виключення Tyrrell/);
  assert.match(zolder.stories[3].historical_source_locator, /retrospective Tyrrell exclusion/);
});
