import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dossier = JSON.parse(readFileSync(
  new URL('../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json', import.meta.url),
  'utf8',
));
const ids = ['anderstorp', 'buenos-aires'];
const scenes = ids.map(id => dossier.circuits.find(circuit => circuit.circuit_id === id));

test('ten 1978/1995 research scenes have substantive distinct EN/UK narratives and claim-level source locators', () => {
  assert.equal(dossier.publication, 'blocked');
  assert.ok(scenes.every(Boolean));
  let count = 0;
  for (const circuit of scenes) {
    assert.deepEqual(circuit.stories.map(scene => scene.story_index), [1, 2, 3, 4, 5]);
    const en = new Set();
    const uk = new Set();
    const locators = new Set();
    for (const scene of circuit.stories) {
      count++;
      assert.ok(scene.narrative.en.length >= 450, circuit.circuit_id + '/EN');
      assert.ok(scene.narrative.uk.length >= 450, circuit.circuit_id + '/UK');
      assert.ok(scene.historical_source_locator.length >= 100);
      assert.match(scene.historical_source_locator, /independent claim review pending/);
      assert.ok(scene.historical_sources.length >= 3);
      assert.equal(new Set(scene.historical_sources).size, scene.historical_sources.length);
      assert.ok(scene.historical_sources.some(url => url.includes('motorsportmagazine.com')));
      assert.ok(scene.historical_sources.some(url => url.includes('grandprix.com')));
      assert.ok(scene.source_urls.some(url => url.includes('formula1.com/en/results/')));
      assert.ok(scene.historical_sources.every(url => !scene.source_urls.includes(url)));
      assert.equal(scene.independent_approval, false);
      assert.equal(scene.publication, 'blocked');
      assert.equal(scene.historical_review_status, 'pending_independent_claim_review');
      en.add(scene.narrative.en);
      uk.add(scene.narrative.uk);
      locators.add(scene.historical_source_locator);
    }
    assert.equal(en.size, 5);
    assert.equal(uk.size, 5);
    assert.equal(locators.size, 5, 'scene-specific evidence must not be a shared boilerplate locator');
  }
  assert.equal(count, 10);
});

test('Anderstorp distinguishes the lead change, retirement, podium margin and retained fan-car result', () => {
  const [lauda, patrese, peterson, ferrari, andretti] = scenes[0].stories;
  assert.match(lauda.narrative.en, /on lap 38/);
  assert.match(lauda.narrative.en, /withdraw/);
  assert.match(lauda.narrative.uk, /відмовилася/);
  assert.match(patrese.narrative.en, /0\.086 seconds/);
  assert.match(peterson.narrative.uk, /заміна шини/i);
  assert.match(ferrari.narrative.en, /Michelin/);
  assert.match(andretti.narrative.en, /46 (?:officially completed )?laps/);
  assert.match(andretti.narrative.uk, /до поломки/);
});

test('Buenos Aires retains incompatible 71/72-lap archives and separates completed laps from retirement lap', () => {
  const [hill, alesi, schumacher, herbert, coulthard] = scenes[1].stories;
  assert.match(hill.narrative.en, /71 or 72 laps/);
  assert.match(hill.narrative.uk, /71 чи 72 кола/);
  assert.match(hill.historical_source_locator, /71 laps.*72 laps.*not established/);
  assert.match(alesi.narrative.en, /7\.136/);
  assert.match(alesi.narrative.en, /6\.407/);
  assert.match(schumacher.narrative.en, /32\.888/);
  assert.match(schumacher.narrative.en, /33\.376/);
  assert.match(herbert.narrative.en, /fourth/);
  assert.match(coulthard.narrative.en, /16 completed laps/);
  assert.match(coulthard.narrative.en, /next lap/);
});
