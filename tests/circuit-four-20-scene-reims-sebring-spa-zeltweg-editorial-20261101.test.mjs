import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const doc = JSON.parse(readFileSync(
  new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url),
  'utf8',
));
const ids = ['reims', 'sebring', 'spa-francorchamps', 'zeltweg'];
const byId = new Map(doc.circuits.map((c) => [c.circuit_id, c]));
const scene = (id, i, lang) => byId.get(id).stories[i - 1].narrative[lang];

test('20 bilingual period scenes preserve evidence boundaries and publication restrictions', () => {
  let count = 0;
  for (const id of ids) {
    const circuit = byId.get(id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map((s) => s.story_index), [1, 2, 3, 4, 5]);
    for (const s of circuit.stories) {
      count++;
      assert.ok(s.narrative.en.trim().split(/\s+/).length >= 65, id + '/EN/' + s.story_index);
      assert.ok(s.narrative.uk.trim().split(/\s+/).length >= 55, id + '/UK/' + s.story_index);
      assert.doesNotMatch(s.narrative.en, /[А-Яа-яІіЇїЄєҐґ]/);
      assert.ok(s.source_urls.some((url) => url.includes('formula1.com/en/results/')));
      assert.ok(new Set(s.historical_sources.map((url) => new URL(url).hostname.replace(/^www\./, ''))).size >= 2);
      assert.equal(s.independent_approval, false);
      assert.equal(s.publication, 'blocked');
      assert.equal(s.historical_review_status, 'pending_independent_claim_review');
    }
  }
  assert.equal(count, 20);
  assert.equal(doc.publication, 'blocked');
});

test('Sebring and Zeltweg period-source chronology is distinct from the classification', () => {
  assert.match(scene('sebring', 1, 'en'), /0\.6 seconds/);
  assert.match(scene('sebring', 1, 'uk'), /0,6 секунди/);
  assert.match(scene('sebring', 3, 'en'), /fifteenth on lap two/);
  assert.match(scene('sebring', 5, 'en'), /gearbox failed in the esses on lap five/);
  assert.match(scene('zeltweg', 2, 'en'), /pits around lap 46/);
  assert.match(scene('zeltweg', 2, 'uk'), /приблизно на 46-му колі/);
  assert.match(scene('zeltweg', 5, 'en'), /returned with tools/);
  assert.match(scene('zeltweg', 5, 'uk'), /повернувся з інструментами/);
  assert.doesNotMatch(scene('zeltweg', 5, 'en'), /Then the rear suspension of his Ferrari failed/);
});

test('Reims and Spa distinguish period narrative from official race order', () => {
  assert.match(scene('reims', 1, 'en'), /fuel-injection systems/);
  assert.match(scene('reims', 4, 'en'), /200 km\/h/);
  assert.match(scene('spa-francorchamps', 1, 'en'), /later campaign for safer racing/);
  assert.match(scene('spa-francorchamps', 2, 'en'), /disagree on the exact lap/);
  assert.doesNotMatch(scene('reims', 2, 'en'), /[А-Яа-яІіЇїЄєҐґ]/);
});
