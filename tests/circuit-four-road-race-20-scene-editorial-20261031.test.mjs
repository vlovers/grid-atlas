import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dossier = JSON.parse(
  readFileSync(
    new URL('../docs/editorial/circuit-experience-v3/EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS.json', import.meta.url),
    'utf8',
  ),
);

const expected = {
  pescara: {
    year: 1957,
    report: 'grandprix.com/races/pescara-gp-1957',
    en: ['25-kilometre', 'spilled oil', 'Jean Behra', 'bodywork coming loose', 'overheating'],
    uk: ['25-кілометровому', 'розлитому мастилі', 'Жана Бери', 'розхитувався кузов', 'перегрів'],
  },
  porto: {
    year: 1960,
    report: 'grandprix.com/races/portuguese-gp-1960',
    en: ['world championship', 'Cooper one-two', 'damaging his Lotus', 'Phil Hill', 'direction of the circuit'],
    uk: ['чемпіонський титул', 'дубль', 'пошкодив Lotus', 'Філ Гілл', 'проти напрямку руху'],
  },
  rouen: {
    year: 1962,
    report: 'grandprix.com/races/french-gp-1962',
    en: ['Porsche 804', 'reliability', 'throttle cable', 'chassis constructor', 'suspension trouble'],
    uk: ['Porsche 804', 'надійність', 'трос газу', 'конструктора шасі', 'підвіскою'],
  },
  sebring: {
    year: 1959,
    report: 'grandprix.com/races/united-states-gp-1959-2',
    en: ['42-lap', '0.6 seconds', 'contact', 'pushed the car', 'Rob Walker Cooper'],
    uk: ['42 кола', '0,6 секунди', 'контакту', 'штовхав машину', 'Роба Вокера'],
  },
};

test('20 road-race scenes preserve distinct bilingual chronology, two historical outlets and blocked review', () => {
  let count = 0;
  for (const [id, proof] of Object.entries(expected)) {
    const circuit = dossier.circuits.find(row => row.circuit_id === id);
    assert.ok(circuit, id);
    assert.deepEqual(circuit.stories.map(story => story.story_index), [1, 2, 3, 4, 5], id);
    assert.equal(new Set(circuit.stories.map(story => story.narrative.en)).size, 5, id);
    assert.equal(new Set(circuit.stories.map(story => story.narrative.uk)).size, 5, id);
    for (const [index, story] of circuit.stories.entries()) {
      count++;
      assert.equal(story.year, proof.year, id);
      assert.ok(story.narrative.en.length >= 200, id + ':en:' + index);
      assert.ok(story.narrative.uk.length >= 200, id + ':uk:' + index);
      assert.ok(story.narrative.en.includes(proof.en[index]), id + ':en anchor:' + index);
      assert.ok(story.narrative.uk.includes(proof.uk[index]), id + ':uk anchor:' + index);
      assert.ok(story.source_urls.every(url => new URL(url).hostname === 'www.formula1.com'), id + ':classification');
      assert.ok(story.historical_sources.some(url => url.includes(proof.report)), id + ':historical race report');
      assert.ok(story.historical_sources.some(url => new URL(url).hostname === 'www.motorsportmagazine.com'), id + ':period report');
      assert.equal(new Set(story.historical_sources.map(url => new URL(url).hostname)).size, 2, id + ':different publishers');
      assert.ok(story.historical_sources.every(url => !story.source_urls.includes(url)), id + ':source separation');
      assert.match(story.historical_source_locator, /classification only.*not independent claim approval/i);
      assert.equal(story.historical_review_status, 'pending_independent_claim_review', id);
      assert.equal(story.independent_approval, false, id);
      assert.equal(story.publication, 'blocked', id);
    }
  }
  assert.equal(count, 20);
  assert.equal(dossier.publication, 'blocked');
  const porto = dossier.circuits.find(row => row.circuit_id === 'porto');
  assert.match(porto.stories[0].historical_source_locator, /fuel.*oil.*do not resolve/i);
});
